import type { EngineInterface, PluginState, Register, Timer } from "claude-code";
import {
  type MessageType,
  otherRole,
  parseHeaders,
  type Role,
  sameSha,
  splitLines,
  wakesRole,
} from "./lib/chat.ts";
import { CI_SYMBOL, GH_FIELDS, type Summary, summarize } from "./lib/gh.ts";
import { compose, MARKER, type Wake } from "./lib/wake.ts";

type Attached = NonNullable<PluginState["pr-review-loop"]["attachment"]>;

const GH = "/opt/homebrew/bin/gh";
const CHAT_POLL_MS = 15_000;
const GH_POLL_MS = 90_000;
const DEBOUNCE_MS = 5_000;
const STALE_MS = 20 * 60_000;
const SEEN_MAX = 500;
const ATTACHMENT = { plugin: "pr-review-loop", key: "attachment" } as const;

/** What survives a reload, in `$.store`, per `repo#pr:role`. */
type Cursor = {
  /** Head sha seen; "" until the first GitHub read baselines it. */
  head: string;
  reviews: string[];
  comments: string[];
  /** Chat lines consumed; -1 until the first read baselines it. */
  chatLines: number;
  /** Fingerprints of headers already acted on (bounded). */
  headers: string[];
  /** `<sha7>:<verdict>` of the last CI reading. */
  ci: string;
  /** Head sha at which "signed off and green" already fired. */
  ready: string;
  /** Head sha a reviewer SIGNED_OFF at, "" when none stands. */
  signedOff: string;
  newComments: number;
  pending: Wake[];
};

const fresh = (): Cursor => ({
  head: "",
  reviews: [],
  comments: [],
  chatLines: -1,
  headers: [],
  ci: "",
  ready: "",
  signedOff: "",
  newComments: 0,
  pending: [],
});

type Lead = { type: MessageType; role: Role | undefined };

/** Volatile: lost on a reload, rebuilt by the next tick. */
const rt = {
  isArmed: false,
  att: null as Attached | null,
  cur: null as Cursor | null,
  timers: [] as Timer[],
  flushTimer: null as Timer | null,
  isChatBusy: false,
  isGhBusy: false,
  lastSig: "",
  summary: undefined as Summary | undefined,
  lead: null as Lead | null,
  ghFails: 0,
  busySince: 0,
  queuedAt: 0,
};

type $ = EngineInterface;

const keyOf = (a: Attached) => `cursor:${a.repo}#${a.pr}:${a.role}`;
const pushBounded = (list: string[], items: string[]) => {
  list.push(...items);
  if (list.length > SEEN_MAX) list.splice(0, list.length - SEEN_MAX);
};

async function persist($: $) {
  if (rt.att && rt.cur) await $.store.set(keyOf(rt.att), rt.cur);
}

function disarm() {
  for (const t of rt.timers) t.cancel();
  rt.timers = [];
  rt.flushTimer?.cancel();
  rt.flushTimer = null;
  rt.isArmed = false;
}

function resetRuntime() {
  disarm();
  rt.att = null;
  rt.cur = null;
  rt.lastSig = "";
  rt.summary = undefined;
  rt.lead = null;
  rt.ghFails = 0;
  rt.busySince = 0;
  rt.queuedAt = 0;
}

// ---- status line -----------------------------------------------------------

function renderStatus($: $) {
  const a = rt.att;
  if (!a) return $.ui.status(undefined);
  const parts = [`PR #${a.pr}`, a.role];
  const last = rt.lead;
  if (rt.cur && rt.cur.pending.length > 0) parts.push("wake queued");
  else if (last && wakesRole(a.role, last)) parts.push("your turn");
  else parts.push(`waiting on ${otherRole(a.role)}`);
  parts.push(`CI ${rt.summary ? CI_SYMBOL[rt.summary.verdict] : "?"}`);
  if (a.chatNote) parts.push(a.chatNote);
  if (rt.ghFails >= 2) parts.push("gh failing");
  $.ui.status(parts.join(" · "));
}

// ---- waking ----------------------------------------------------------------

function emit($: $, wake: Wake) {
  rt.cur?.pending.push(wake);
  scheduleFlush($);
}

function scheduleFlush($: $) {
  if (rt.flushTimer) return;
  rt.flushTimer = $.clock.after(DEBOUNCE_MS, () => {
    rt.flushTimer = null;
    void flush($);
  });
}

async function flush($: $) {
  const a = rt.att;
  const cur = rt.cur;
  if (!a || !cur || cur.pending.length === 0) return;
  const now = await $.clock.now();
  // One queued prompt at a time: wait for ours to start, and for a running turn
  // to end. `turn.start` and `turn.complete` bring us back here.
  if (rt.queuedAt !== 0 && now - rt.queuedAt < STALE_MS) return;
  if (rt.busySince !== 0 && now - rt.busySince < STALE_MS) return;

  const wakes = cur.pending;
  const text = compose({
    repo: a.repo,
    pr: a.pr,
    role: a.role,
    chatPath: a.chatPath,
    chatLines: Math.max(cur.chatLines, 0),
    newComments: cur.newComments,
    wakes,
  });
  const comments = cur.newComments;
  cur.pending = [];
  cur.newComments = 0;
  await persist($);
  rt.queuedAt = now;
  renderStatus($);
  try {
    await $.prompt.submit({ text });
  } catch {
    rt.queuedAt = 0;
    cur.pending = [...wakes, ...cur.pending];
    cur.newComments += comments;
    await persist($);
    scheduleFlush($);
  }
}

// ---- chat watcher ----------------------------------------------------------

async function chatTick($: $) {
  const a = rt.att;
  const cur = rt.cur;
  if (!a || !cur || !a.chatPath || rt.isChatBusy) return;
  rt.isChatBusy = true;
  try {
    let sig: string;
    try {
      const st = await $.fs.stat(a.chatPath);
      sig = `${st.mtimeMs}:${st.size}`;
    } catch {
      // No file yet: whatever it first holds is new.
      if (cur.chatLines < 0) cur.chatLines = 0;
      return;
    }
    if (sig === rt.lastSig && cur.chatLines >= 0) return;
    const raw = await $.fs.read(a.chatPath);
    const lines = splitLines(typeof raw === "string" ? raw : "");
    const headers = parseHeaders(lines);
    const last = headers[headers.length - 1];
    rt.lead = last ? { type: last.type, role: last.role } : null;

    if (cur.chatLines < 0 || lines.length < cur.chatLines) {
      // First read, or the file shrank: a rewrite is no event. Take a baseline.
      cur.chatLines = lines.length;
      cur.headers = headers.map((h) => h.fingerprint).slice(-SEEN_MAX);
      const signed = [...headers]
        .reverse()
        .find((h) => h.role === "reviewer" && ["SIGNED_OFF", "REVIEW_POSTED"].includes(h.type));
      cur.signedOff = signed?.type === "SIGNED_OFF" ? (signed.sha ?? cur.head) : "";
      rt.lastSig = sig;
      await persist($);
      return;
    }

    const seen = new Set(cur.headers);
    // New = past the old end AND never acted on: an edit that shifts old headers
    // down (a status table grows) must not re-fire them.
    const news = headers.filter((h) => h.line > cur.chatLines && !seen.has(h.fingerprint));
    for (const h of news) {
      if (h.role === "reviewer") {
        if (h.type === "SIGNED_OFF") cur.signedOff = h.sha ?? cur.head;
        else if (["REVIEW_POSTED", "DISPUTED", "BLOCKED"].includes(h.type)) cur.signedOff = "";
      }
      if (wakesRole(a.role, h) && h.role) {
        emit($, { k: "chat", type: h.type, role: h.role, line: h.line, sha: h.sha });
      }
    }
    pushBounded(
      cur.headers,
      news.map((h) => h.fingerprint),
    );
    cur.chatLines = lines.length;
    rt.lastSig = sig;
    await evaluateReady($, true);
    await persist($);
  } catch {
    // Unreadable this round; the next tick tries again.
  } finally {
    rt.isChatBusy = false;
    renderStatus($);
  }
}

// ---- GitHub watcher --------------------------------------------------------

async function evaluateReady($: $, canEmit: boolean) {
  const a = rt.att;
  const cur = rt.cur;
  const s = rt.summary;
  if (!a || !cur || !s || a.role !== "implementer" || s.state !== "OPEN") return;
  if (s.verdict !== "green" || cur.ready === s.head) return;
  const isChatSigned = cur.signedOff !== "" && sameSha(cur.signedOff, s.head);
  if (!isChatSigned && !s.isApprovedAtHead) return;
  cur.ready = s.head;
  if (canEmit)
    emit($, {
      k: "ready",
      sha: s.head,
      via: isChatSigned ? "SIGNED_OFF in chat" : "APPROVED review",
    });
}

async function ghTick($: $) {
  const a = rt.att;
  const cur = rt.cur;
  if (!a || !cur || rt.isGhBusy) return;
  rt.isGhBusy = true;
  try {
    const run = await $.process.run(
      [GH, "pr", "view", String(a.pr), "--repo", a.repo, "--json", GH_FIELDS],
      { timeoutMs: 60_000 },
    );
    const s = run.exitCode === 0 ? summarize(JSON.parse(run.stdout)) : undefined;
    if (!s) {
      rt.ghFails++;
      return;
    }
    rt.ghFails = 0;
    rt.summary = s;

    if (s.state !== "OPEN") {
      await finish($, s.state);
      return;
    }

    if (a.chatPath === null && a.chatNote?.startsWith("chat: none")) await rediscover($);

    const ciKey = `${s.head.slice(0, 7)}:${s.verdict}`;
    if (cur.head === "") {
      // First read: take a baseline, wake on nothing that already happened.
      cur.head = s.head;
      pushBounded(
        cur.reviews,
        s.reviews.map((r) => r.id),
      );
      pushBounded(cur.comments, s.commentIds);
      cur.ci = ciKey;
      await evaluateReady($, false);
    } else {
      if (s.head !== cur.head) {
        cur.head = s.head;
        if (a.role === "reviewer") emit($, { k: "head", sha: s.head });
      }
      const seenReviews = new Set(cur.reviews);
      const newReviews = s.reviews.filter((r) => !seenReviews.has(r.id));
      pushBounded(
        cur.reviews,
        newReviews.map((r) => r.id),
      );
      if (a.role === "implementer")
        for (const r of newReviews) emit($, { k: "review", state: r.state, commit: r.commit });

      const seenComments = new Set(cur.comments);
      const newComments = s.commentIds.filter((id) => !seenComments.has(id));
      pushBounded(cur.comments, newComments);
      cur.newComments += newComments.length;

      if (ciKey !== cur.ci) {
        cur.ci = ciKey;
        if (a.role === "implementer" && (s.verdict === "green" || s.verdict === "red"))
          emit($, { k: "ci", sha: s.head, verdict: s.verdict, checks: s.checks });
      }
      await evaluateReady($, true);
    }
    await persist($);
  } catch {
    rt.ghFails++;
  } finally {
    rt.isGhBusy = false;
    renderStatus($);
  }
}

async function finish($: $, state: string) {
  const a = rt.att;
  if (!a) return;
  await $.store.delete(keyOf(a));
  await $.state.set(ATTACHMENT, null);
  resetRuntime();
  $.ui.status(undefined);
  $.ui.toast(`pr-review-loop: PR #${a.pr} is ${state.toLowerCase()}; stopped watching.`);
}

// ---- chat file discovery ---------------------------------------------------

async function home($: $): Promise<string> {
  return (await $.env.get("HOME")) ?? "";
}

type Found = { path: string | null; note: string | null; matches: string[] };

async function discover($: $, pr: number): Promise<Found> {
  const root = `${await home($)}/.claude/projects`;
  let dirs: string[] = [];
  try {
    dirs = (await $.fs.list(root)).filter((e) => e.kind === "dir").map((e) => e.name);
  } catch {
    dirs = [];
  }
  const matches: string[] = [];
  for (const d of dirs) {
    const p = `${root}/${d}/pr${pr}-review-chat.md`;
    try {
      if (await $.fs.exists(p)) matches.push(p);
    } catch {
      // unreadable project folder
    }
  }
  if (matches.length === 1) return { path: matches[0] ?? null, note: null, matches };
  if (matches.length === 0) return { path: null, note: "chat: none found (GitHub only)", matches };
  return {
    path: null,
    note: `chat: ${matches.length} matches, pass --chat (GitHub only)`,
    matches,
  };
}

async function rediscover($: $) {
  const a = rt.att;
  if (!a) return;
  const found = await discover($, a.pr);
  if (found.path === null) return;
  a.chatPath = found.path;
  a.chatNote = null;
  if (rt.cur) rt.cur.chatLines = -1;
  rt.lastSig = "";
  await $.state.set(ATTACHMENT, a);
}

// ---- arming and attaching --------------------------------------------------

function arm($: $) {
  if (rt.isArmed) return;
  rt.isArmed = true;
  rt.timers.push($.clock.every(CHAT_POLL_MS, () => void chatTick($)));
  rt.timers.push($.clock.every(GH_POLL_MS, () => void ghTick($)));
}

/** After a hot reload the timers are gone and `$.state` is not: put them back. */
async function resume($: $) {
  if (rt.isArmed) return;
  try {
    const { value } = await $.state.get(ATTACHMENT);
    if (!value) return;
    rt.att = value;
    rt.cur = ((await $.store.get(keyOf(value))) as Cursor | undefined) ?? fresh();
    arm($);
    renderStatus($);
    if (rt.cur.pending.length > 0) scheduleFlush($);
  } catch {
    // nothing to resume
  }
}

type Parsed =
  | { cmd: "stop" }
  | { cmd: "status" }
  | { cmd: "attach"; pr: number; role: Role; repo?: string; chat?: string }
  | { cmd: "error"; message: string };

const USAGE =
  "usage: /pr-watch <N> <reviewer|implementer> [--repo owner/name] [--chat <path>] | stop | status";

function parseArgs(args: string): Parsed {
  const tokens = [...args.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
    (m) => m[1] ?? m[2] ?? m[3] ?? "",
  );
  const first = tokens[0];
  if (first === "stop") return { cmd: "stop" };
  if (first === "status") return { cmd: "status" };
  const pr = Number(first);
  const role = tokens[1];
  if (!Number.isInteger(pr) || pr <= 0 || (role !== "reviewer" && role !== "implementer"))
    return { cmd: "error", message: USAGE };
  let repo: string | undefined;
  let chat: string | undefined;
  for (let i = 2; i < tokens.length; i++) {
    const t = tokens[i] ?? "";
    const eq = t.indexOf("=");
    const flag = eq > 0 ? t.slice(0, eq) : t;
    const value = eq > 0 ? t.slice(eq + 1) : tokens[++i];
    if (flag === "--repo" && value) repo = value;
    else if (flag === "--chat" && value) chat = value;
    else return { cmd: "error", message: `unknown or incomplete argument "${t}". ${USAGE}` };
  }
  if (repo !== undefined && !/^[\w.-]+\/[\w.-]+$/.test(repo))
    return { cmd: "error", message: `--repo wants owner/name, got "${repo}"` };
  return { cmd: "attach", pr, role, repo, chat };
}

async function describe($: $): Promise<string> {
  const a = rt.att;
  if (!a) return "pr-review-loop: not watching any PR. " + USAGE;
  const c = rt.cur;
  const s = rt.summary;
  return [
    `Watching PR #${a.pr} (${a.repo}) as ${a.role}.`,
    `Chat file: ${a.chatPath ?? a.chatNote ?? "none"}${a.chatPath ? ` (${Math.max(c?.chatLines ?? 0, 0)} lines read)` : ""}`,
    s
      ? `GitHub: head ${s.head.slice(0, 7)}, ${s.state}, CI ${s.verdict} (${s.checks.length} checks), ${s.reviews.length} reviews, decision ${s.reviewDecision || "none"}, merge state ${s.mergeStateStatus || "unknown"}.`
      : "GitHub: no reading yet.",
    rt.lead ? `Last chat message: ${rt.lead.type} from ${rt.lead.role ?? "unknown role"}.` : "",
    `Pending wake events: ${c?.pending.length ?? 0}. gh failures in a row: ${rt.ghFails}.`,
    `Chat checked every ${CHAT_POLL_MS / 1000} s, GitHub every ${GH_POLL_MS / 1000} s.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function attach($: $, p: Extract<Parsed, { cmd: "attach" }>, cwd: string): Promise<string> {
  let repo = p.repo;
  if (!repo) {
    try {
      const r = await $.process.run([GH, "repo", "view", "--json", "nameWithOwner"], { cwd });
      const name = r.exitCode === 0 ? JSON.parse(r.stdout)?.nameWithOwner : undefined;
      if (typeof name === "string") repo = name;
    } catch {
      // fall through to the error below
    }
    if (!repo)
      return "pr-review-loop: could not tell the repo from this directory (`gh repo view` failed). Pass --repo owner/name.";
  }

  let chatPath: string | null = null;
  let chatNote: string | null = null;
  if (p.chat) {
    chatPath = p.chat.startsWith("~/") ? `${await home($)}${p.chat.slice(1)}` : p.chat;
  } else {
    const found = await discover($, p.pr);
    chatPath = found.path;
    chatNote = found.note;
    if (found.matches.length > 1)
      chatNote += `: ${found.matches.map((m) => m.split("/").slice(-2, -1)[0]).join(", ")}`;
  }

  if (rt.att) resetRuntime();
  const att: Attached = {
    repo,
    pr: p.pr,
    role: p.role,
    chatPath,
    chatNote,
    startedAt: await $.clock.now(),
  };
  await $.state.set(ATTACHMENT, att);
  rt.att = att;
  const stored = (await $.store.get(keyOf(att))) as Cursor | undefined;
  rt.cur = stored ?? fresh();
  arm($);
  await ghTick($);
  await chatTick($);
  renderStatus($);
  if (rt.cur.pending.length > 0) scheduleFlush($);

  const lines = [
    `Watching PR #${p.pr} (${repo}) as ${p.role}${stored ? " (resumed from stored cursors)" : " (baseline taken: nothing that already happened wakes you)"}.`,
    chatPath
      ? `Chat file: ${chatPath}`
      : `${chatNote ?? "chat: none"}. Watching GitHub only; use --chat <path> to add the chat.`,
  ];
  if (rt.lead && wakesRole(p.role, rt.lead))
    lines.push(
      `Note: the last chat message is ${rt.lead.type} from ${rt.lead.role}; it predates the watch, so read it yourself.`,
    );
  if (rt.ghFails > 0) lines.push("GitHub could not be read yet; will retry on the next poll.");
  return lines.join("\n");
}

async function stop($: $): Promise<string> {
  const a = rt.att;
  if (!a) return "pr-review-loop: not watching any PR.";
  await $.store.delete(keyOf(a));
  await $.state.set(ATTACHMENT, null);
  resetRuntime();
  $.ui.status(undefined);
  return `Stopped watching PR #${a.pr} (${a.repo}).`;
}

// ---- registration ----------------------------------------------------------

export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    await $.command.register({
      name: "pr-watch",
      description: "Watch a PR and its review chat, and wake this session on what matters",
      argumentHint: "<N> <reviewer|implementer> [--repo owner/name] [--chat path] | stop | status",
    });
    await resume($);
    return next(e);
  });

  on("command.run", { command: "pr-watch" }, async ($, e) => {
    const p = parseArgs(e.args);
    if (p.cmd === "error") return { text: p.message };
    if (p.cmd === "stop") return { text: await stop($) };
    if (p.cmd === "status") {
      await resume($);
      return { text: await describe($) };
    }
    return { text: await attach($, p, await $.session.cwd()) };
  });

  on("turn.start", async ($, e, next) => {
    if (!e.agentId) {
      rt.busySince = await $.clock.now();
      if (e.text.includes(MARKER)) rt.queuedAt = 0;
    }
    await resume($);
    return next(e);
  });

  on("turn.complete", async ($, e, next) => {
    if (!e.agentId) {
      rt.busySince = 0;
      if (rt.cur && rt.cur.pending.length > 0) scheduleFlush($);
    }
    await resume($);
    return next(e);
  });
};
