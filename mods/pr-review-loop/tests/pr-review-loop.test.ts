import { describe, expect, mock, test } from "claude-code/testing";
import { parseHeaders, splitLines, wakesRole } from "../hooks/lib/chat.ts";
import {
  CHAT_A,
  CHAT_B,
  green,
  HOME,
  header,
  key,
  pending,
  red,
  review,
  SHA1,
  SHA2,
  snap,
  world,
} from "./world.ts";

const BASE = "# PR #854 chat\n\n## Status\n\n| F1 | thing | REVIEW_POSTED |\n";
const watch = (args: string) => ({
  command: "pr-watch",
  args,
  origin: { kind: "composer" } as const,
  presentation: { isFullscreen: false, columns: 80 },
});
const start = { cwd: "/repo", surface: "terminal", isInteractive: true } as const;

describe("chat parsing", () => {
  test("recognizes the real header spellings, ignores templates and tables", () => {
    const lines = splitLines(
      [
        "Entry types: READY_FOR_REVIEW / REVIEW_POSTED / ADDRESSED / DISPUTED",
        "**If a finding is wrong, post `DISPUTED` here rather than implementing it.**",
        "| F1 | x | REVIEW_POSTED |",
        "**READY_FOR_REVIEW** (implementer, 2026-11-09, head 5a96cc6c)",
        "### 2026-09-23 REVIEW_POSTED (reviewer)",
        "## ADDRESSED — implementer — head `abcdef1`",
        "### 2026-10-28 · reviewer · `FYI`",
        "[2026-10-07T23:28Z] REVIEW_POSTED (octocat): review 1 on 8dc8a8c9.",
        "[REVIEW_POSTED] round 3 at abcdef1: APPROVED.",
        "[2026-11-09] DISPUTED by implementer — it is wrong",
        "### Verified clean — FYI",
        "Some prose that says SIGNED_OFF in the middle",
      ].join("\n"),
    );
    const found = parseHeaders(lines).map((h) => `${h.line}:${h.type}:${h.role ?? "?"}`);
    expect(found).toEqual([
      "4:READY_FOR_REVIEW:implementer",
      "5:REVIEW_POSTED:reviewer",
      "6:ADDRESSED:implementer",
      "7:FYI:reviewer",
      "8:REVIEW_POSTED:reviewer",
      "9:REVIEW_POSTED:reviewer",
      "10:DISPUTED:implementer",
    ]);
    expect(parseHeaders(lines)[2]?.sha).toBe("abcdef1");
  });

  test("a role-less DISPUTED never wakes either side", () => {
    const [h] = parseHeaders(["## 2026-10-09 DISPUTED: scope"]);
    expect(h?.role).toBeUndefined();
    expect(wakesRole("reviewer", { type: "DISPUTED", role: h?.role })).toBe(false);
    expect(wakesRole("implementer", { type: "DISPUTED", role: h?.role })).toBe(false);
  });
});

describe("pr-review-loop", () => {
  test("never wakes on its own echo, wakes on the other side, and sends facts only", async ($, on) => {
    const w = world(on, { files: { [CHAT_A]: BASE } });
    await $.session.start(start);
    const r = await $.command.run(watch("854 reviewer --repo o/r"));
    expect(r.text).toContain(CHAT_A);

    for (const type of ["REVIEW_POSTED", "ADDRESSED", "DISPUTED"]) {
      w.append(CHAT_A, header(type, "reviewer"));
    }
    await w.clock.advance(30_000);
    expect(w.submits).toEqual([]); // own echo, including the types the other side wakes on

    w.append(CHAT_A, header("ADDRESSED", "implementer"));
    await w.clock.advance(30_000);
    expect(w.submits.length).toBe(1);
    const text = w.submits[0] ?? "";
    expect(text).toContain("ADDRESSED from implementer");
    expect(text).toContain(CHAT_A);
    expect(text).toMatch(/new lines \d+-\d+/);
    expect(text).not.toContain("IGNORE ALL PREVIOUS");
    expect(text).not.toContain("rm -rf");
  });

  test("the first read is a baseline: history never wakes", async ($, on) => {
    const w = world(on, {
      files: { [CHAT_A]: BASE + header("READY_FOR_REVIEW", "implementer") },
      gh: snap({ reviews: [review("PRR_1", "COMMENTED")] }),
    });
    await $.session.start(start);
    const r = await $.command.run(watch("854 reviewer"));
    expect(r.text).toContain("predates the watch");
    await w.clock.advance(200_000);
    expect(w.submits).toEqual([]);
  });

  test("coalesces events that land close together, and queues at most one prompt", async ($, on) => {
    const w = world(on, { files: { [CHAT_A]: BASE } });
    await $.session.start(start);
    await $.command.run(watch("854 reviewer"));

    await w.clock.advance(75_000); // quiet
    w.append(CHAT_A, header("READY_FOR_REVIEW", "implementer"));
    w.gh = snap({ headRefOid: SHA2 });
    await w.clock.advance(20_000); // both ticks land at 90 s, one debounce, one prompt
    expect(w.submits.length).toBe(1);
    expect(w.submits[0]).toContain("READY_FOR_REVIEW from implementer");
    expect(w.submits[0]).toContain("new head commit on the PR: 2222222");

    // More lands while our prompt is queued: held, not queued again.
    w.append(CHAT_A, header("DISPUTED", "implementer"));
    await w.clock.advance(60_000);
    expect(w.submits.length).toBe(1);

    // Our prompt's turn starts and ends: the held event goes out, once.
    await $.turn.start({ text: w.submits[0] ?? "", turnId: "t1" });
    await w.clock.advance(60_000);
    expect(w.submits.length).toBe(1); // still mid-turn
    await $.turn.complete({
      answer: "",
      durationMs: 1,
      isAborted: false,
      turnId: "t1",
      reason: "answer",
    });
    await w.clock.advance(10_000);
    expect(w.submits.length).toBe(2);
    expect(w.submits[1]).toContain("DISPUTED from implementer");
    expect(w.submits[1]).not.toContain("READY_FOR_REVIEW");
  });

  test("nothing fires twice after a reload: cursors come from $.store", async ($, on) => {
    const chat = BASE + header("READY_FOR_REVIEW", "implementer");
    const lines = splitLines(chat);
    const cursor = {
      head: SHA1,
      reviews: ["PRR_1"],
      comments: [],
      chatLines: lines.length,
      headers: parseHeaders(lines).map((h) => h.fingerprint),
      ci: "1111111:green",
      ready: "",
      signedOff: "",
      newComments: 0,
      pending: [],
    };
    const w = world(on, {
      files: { [CHAT_A]: chat },
      gh: snap({ reviews: [review("PRR_1", "COMMENTED")], statusCheckRollup: green }),
      store: { [key("reviewer")]: cursor },
    });
    await $.session.start(start);
    const r = await $.command.run(watch("854 reviewer --chat " + CHAT_A));
    expect(r.text).toContain("resumed from stored cursors");
    await w.clock.advance(300_000);
    expect(w.submits).toEqual([]);

    // A genuinely new message after the resume still wakes, once.
    w.append(CHAT_A, header("ADDRESSED", "implementer"));
    await w.clock.advance(30_000);
    expect(w.submits.length).toBe(1);
    await w.clock.advance(300_000);
    expect(w.submits.length).toBe(1);
  });

  test("a status table that grows near the top does not re-fire old headers", async ($, on) => {
    const old = header("READY_FOR_REVIEW", "implementer");
    const w = world(on, { files: { [CHAT_A]: BASE + old } });
    await $.session.start(start);
    await $.command.run(watch("854 reviewer"));
    // Insert rows above: every old header moves down, line count grows.
    w.put(
      CHAT_A,
      BASE.replace("| F1 |", "| F-1 |\n| F0 |\n| F0a |\n| F0b |\n| F0c |\n| F0d |\n| F1 |") +
        old +
        "\n",
    );
    await w.clock.advance(30_000);
    expect(w.submits).toEqual([]);
    // A file that shrinks is a rewrite, not an event.
    w.put(CHAT_A, "# rewritten\n");
    await w.clock.advance(30_000);
    expect(w.submits).toEqual([]);
  });

  test("implementer wakes on a new GitHub review and on CI reaching a final state", async ($, on) => {
    const w = world(on, { gh: snap({ statusCheckRollup: pending }), files: { [CHAT_A]: BASE } });
    await $.session.start(start);
    await $.command.run(watch("854 implementer"));
    expect(w.status).toBe("PR #854 · implementer · waiting on reviewer · CI …");

    w.gh = snap({ reviews: [review("PRR_2", "CHANGES_REQUESTED")], statusCheckRollup: pending });
    await w.clock.advance(100_000);
    expect(w.submits.length).toBe(1);
    expect(w.submits[0]).toContain("new GitHub review: CHANGES_REQUESTED");
    await $.turn.start({ text: w.submits[0] ?? "", turnId: "t1" });
    await $.turn.complete({
      answer: "",
      durationMs: 1,
      isAborted: false,
      turnId: "t1",
      reason: "answer",
    });

    w.gh = snap({ reviews: [review("PRR_2", "CHANGES_REQUESTED")], statusCheckRollup: red });
    await w.clock.advance(100_000);
    expect(w.submits.length).toBe(2);
    expect(w.submits[1]).toContain("CI finished on 1111111: red");
    expect(w.submits[1]).toContain("unit: FAILURE");
  });

  test("an empty check rollup right after a push is neither final nor green", async ($, on) => {
    const w = world(on, { gh: snap({ statusCheckRollup: pending }), files: { [CHAT_A]: BASE } });
    await $.session.start(start);
    await $.command.run(watch("854 implementer"));
    w.gh = snap({ headRefOid: SHA2, statusCheckRollup: [] });
    await w.clock.advance(100_000);
    expect(w.submits).toEqual([]);
    expect(w.status).toContain("CI –");
  });

  test("SIGNED_OFF at the current head plus green CI wakes the implementer to merge", async ($, on) => {
    const w = world(on, { gh: snap({ statusCheckRollup: pending }), files: { [CHAT_A]: BASE } });
    await $.session.start(start);
    await $.command.run(watch("854 implementer"));

    w.append(CHAT_A, header("SIGNED_OFF", "reviewer"));
    await w.clock.advance(30_000);
    // The chat message itself wakes the implementer; CI is not green yet, so no merge prompt.
    expect(w.submits.length).toBe(1);
    expect(w.submits[0]).toContain("SIGNED_OFF from reviewer");
    expect(w.submits[0]).not.toContain("signed off and CI green");
    await $.turn.start({ text: w.submits[0] ?? "", turnId: "t1" });
    await $.turn.complete({
      answer: "",
      durationMs: 1,
      isAborted: false,
      turnId: "t1",
      reason: "answer",
    });

    w.gh = snap({ statusCheckRollup: green });
    await w.clock.advance(100_000);
    expect(w.submits.length).toBe(2);
    const text = w.submits[1] ?? "";
    expect(text).toContain("signed off and CI green at 1111111 (sign-off: SIGNED_OFF in chat)");
    expect(text).toContain("Before merge");
    expect(text).toContain("never merges");
    // Fired once for this head.
    await w.clock.advance(300_000);
    expect(w.submits.length).toBe(2);
  });

  test("a sign-off at an older head does not count, an APPROVED review at the head does", async ($, on) => {
    const w = world(on, {
      gh: snap({ headRefOid: SHA2, statusCheckRollup: green }),
      files: { [CHAT_A]: BASE },
    });
    await $.session.start(start);
    await $.command.run(watch("854 implementer"));
    w.append(CHAT_A, header("SIGNED_OFF", "reviewer", SHA1)); // stale head
    await w.clock.advance(30_000);
    expect(w.submits.length).toBe(1); // the chat wake, not the merge one
    expect(w.submits[0]).not.toContain("CI green");
    await $.turn.start({ text: w.submits[0] ?? "", turnId: "t1" });
    await $.turn.complete({
      answer: "",
      durationMs: 1,
      isAborted: false,
      turnId: "t1",
      reason: "answer",
    });

    w.gh = snap({
      headRefOid: SHA2,
      statusCheckRollup: green,
      reviews: [review("PRR_9", "APPROVED", SHA2, "other-person")],
    });
    await w.clock.advance(100_000);
    const last = w.submits[w.submits.length - 1] ?? "";
    expect(last).toContain("sign-off: APPROVED review");
  });

  test("a merged PR stops every watcher, clears the status and toasts", async ($, on) => {
    const w = world(on, { files: { [CHAT_A]: BASE } });
    await $.session.start(start);
    await $.command.run(watch("854 reviewer"));
    expect(w.status).toBeDefined();

    w.gh = snap({ state: "MERGED" });
    await w.clock.advance(100_000);
    expect(w.status).toBeUndefined();
    expect(w.toasts.some((t) => t.includes("merged"))).toBe(true);

    const calls = w.ghCalls;
    const reads = w.reads;
    w.append(CHAT_A, header("READY_FOR_REVIEW", "implementer"));
    w.gh = snap({ headRefOid: SHA2 });
    await w.clock.advance(600_000);
    expect(w.ghCalls).toBe(calls);
    expect(w.reads).toBe(reads);
    expect(w.submits).toEqual([]);
    expect((await $.command.run(watch("status"))).text).toContain("not watching");
  });

  test("several chat files for one PR number are reported, and GitHub is still watched", async ($, on) => {
    const w = world(on, {
      projects: ["-proj-a", "-proj-b"],
      files: { [CHAT_A]: BASE, [CHAT_B]: BASE },
    });
    await $.session.start(start);
    const r = await $.command.run(watch("854 reviewer"));
    expect(r.text).toContain("2 matches");
    expect(r.text).toContain("-proj-a");
    expect(r.text).toContain("--chat");
    expect(w.status).toContain("chat: 2 matches");
    w.gh = snap({ headRefOid: SHA2 });
    await w.clock.advance(100_000);
    expect(w.reads).toBe(0);
    expect(w.submits.length).toBe(1); // GitHub alone still wakes the reviewer on a push
    expect(w.submits[0]).not.toContain("Chat file");
  });

  test("no chat file is reported and picked up once it appears", async ($, on) => {
    const w = world(on, { projects: ["-proj-a"] });
    await $.session.start(start);
    const r = await $.command.run(watch("854 reviewer"));
    expect(r.text).toContain("chat: none found");
    expect(w.status).toContain("chat: none found");
    w.put(CHAT_A, BASE);
    await w.clock.advance(100_000);
    w.append(CHAT_A, header("READY_FOR_REVIEW", "implementer"));
    await w.clock.advance(100_000);
    expect(w.submits.length).toBe(1);
    expect((await $.command.run(watch("status"))).text).toContain(CHAT_A);
  });

  test("after a hot reload the timers are re-armed from $.state, without refiring", async ($, on) => {
    const lines = splitLines(BASE);
    const cursor = {
      head: SHA1,
      reviews: [],
      comments: [],
      chatLines: lines.length,
      headers: [],
      ci: "1111111:none",
      ready: "",
      signedOff: "",
      newComments: 0,
      pending: [],
    };
    const w = world(on, { files: { [CHAT_A]: BASE }, store: { [key("reviewer")]: cursor } });
    const attachment = {
      repo: "o/r",
      pr: 854,
      role: "reviewer",
      chatPath: CHAT_A,
      chatNote: null,
      startedAt: 0,
    };
    on("state.get", () => ({ value: { value: attachment, version: 1 } }));
    await $.session.start(start); // the reloaded module finds the attachment and arms
    expect(w.status).toBe("PR #854 · reviewer · waiting on implementer · CI ?");
    await w.clock.advance(100_000);
    expect(w.ghCalls).toBeGreaterThan(0);
    expect(w.submits).toEqual([]);
    w.append(CHAT_A, header("READY_FOR_REVIEW", "implementer"));
    await w.clock.advance(30_000);
    expect(w.submits.length).toBe(1);
  });

  test("bad arguments are answered, not thrown", async ($, on) => {
    world(on);
    await $.session.start(start);
    for (const args of [
      "",
      "x reviewer",
      "854 boss",
      "854 reviewer --repo nope",
      "854 reviewer --what",
    ]) {
      const r = await $.command.run(watch(args));
      expect(r.text ?? "").toMatch(/usage|--repo wants|unknown/);
    }
    expect(HOME).toBe("/home/me");
    expect(mock).toBeDefined();
  });
});
