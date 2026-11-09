// Pure chat-file parsing: no `$`, no I/O. Lenient about the formats the real
// review-chat files use, strict about what counts as a message header so that
// templates, status tables and prose that mention a type never wake anyone.

export const TYPES = [
  "READY_FOR_REVIEW",
  "REVIEW_POSTED",
  "ADDRESSED",
  "DISPUTED",
  "BLOCKED",
  "FYI",
  "SIGNED_OFF",
] as const;
export type MessageType = (typeof TYPES)[number];
export type Role = "reviewer" | "implementer";

export type Header = {
  /** 1-based line number in the file. */
  line: number;
  type: MessageType;
  /** Role found in the header, else inferred from the type, else undefined. */
  role: Role | undefined;
  /** True when the role was read from the header rather than inferred. */
  isRoleExplicit: boolean;
  /** Head sha the header names (`head <sha>` or `at <sha>`), lower case. */
  sha: string | undefined;
  /** Stable identity: normalized text plus its ordinal among equal headers. */
  fingerprint: string;
};

const TYPE_RE = TYPES.join("|");
const TYPE_ONLY = new RegExp(`^(${TYPE_RE})$`);
const DATE = /^\d{4}-\d{2}-\d{2}(?:t[\d:.]+z?)?$/i;
const TIME = /^\d{1,2}:\d{2}(?::\d{2})?z?$/i;
const ROLE_WORD = /^(reviewer|implementer|agent|round|head|\d+)$/i;

// Types that only one side ever posts: usable when a header names no role.
const IMPLIED_ROLE: Partial<Record<MessageType, Role>> = {
  READY_FOR_REVIEW: "implementer",
  ADDRESSED: "implementer",
  REVIEW_POSTED: "reviewer",
  SIGNED_OFF: "reviewer",
};

function clean(s: string): string {
  return s.replace(/[`*]/g, "");
}

/** The type a header line opens with, or undefined when the line is not a header. */
function headerType(line: string): MessageType | undefined {
  // `**TYPE** ...` / `**`TYPE`** ...` (optionally behind a list bullet).
  const bold = line.match(new RegExp(`^(?:[-*]\\s+)?\\*\\*\`?(${TYPE_RE})\`?\\*\\*`));
  if (bold) return bold[1] as MessageType;

  // `[TYPE] ...` and `[<date>] TYPE ...`.
  const bracket = line.match(/^\[([^\]]*)\]\s*(.*)$/);
  if (bracket) {
    const inner = clean(bracket[1] ?? "").trim();
    if (TYPE_ONLY.test(inner)) return inner as MessageType;
    if (DATE.test(inner)) {
      const next = clean(bracket[2] ?? "").match(new RegExp(`^(${TYPE_RE})\\b`));
      if (next) return next[1] as MessageType;
    }
    return undefined;
  }

  // `## ...` to `#### ...`: only date, role and round words may precede the type.
  const heading = line.match(/^#{2,4}\s+(.*)$/);
  if (heading) {
    const tokens = clean(heading[1] ?? "")
      .split(/[\s—–·:,()/-]+/)
      .filter(Boolean);
    for (const token of tokens) {
      if (TYPE_ONLY.test(token)) return token as MessageType;
      if (DATE.test(token) || TIME.test(token) || ROLE_WORD.test(token)) continue;
      return undefined;
    }
  }
  return undefined;
}

/** First `reviewer` or `implementer` in the header line, by position. */
function headerRole(text: string): Role | undefined {
  const m = text.match(/\b(reviewer|implementer)\b/i);
  return m ? (m[1]?.toLowerCase() as Role) : undefined;
}

function headerSha(text: string): string | undefined {
  const m = text.match(/\b(?:head|at)\s+([0-9a-f]{7,40})\b/i);
  return m?.[1]?.toLowerCase();
}

/** Every header in the file, in order. Parse the whole file: ordinals need it. */
export function parseHeaders(lines: readonly string[]): Header[] {
  const out: Header[] = [];
  const seen = new Map<string, number>();
  lines.forEach((raw, i) => {
    const line = raw.replace(/^ {0,3}/, "").trimEnd();
    if (line === "" || line.startsWith("|")) return;
    const type = headerType(line);
    if (type === undefined) return;
    const text = clean(line);
    const role = headerRole(text);
    const normalized = text.replace(/\s+/g, " ").trim().slice(0, 200);
    const ordinal = (seen.get(normalized) ?? 0) + 1;
    seen.set(normalized, ordinal);
    out.push({
      line: i + 1,
      type,
      role: role ?? IMPLIED_ROLE[type],
      isRoleExplicit: role !== undefined,
      sha: headerSha(text),
      fingerprint: `${normalized}#${ordinal}`,
    });
  });
  return out;
}

export function splitLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

const REVIEWER_WAKES: readonly MessageType[] = ["READY_FOR_REVIEW", "ADDRESSED", "DISPUTED"];
const IMPLEMENTER_WAKES: readonly MessageType[] = [
  "REVIEW_POSTED",
  "DISPUTED",
  "BLOCKED",
  "SIGNED_OFF",
];

/** Whether `header`, posted by the other side, should wake a session in `me`. */
export function wakesRole(me: Role, header: Pick<Header, "type" | "role">): boolean {
  if (header.role === undefined || header.role === me) return false;
  const types = me === "reviewer" ? REVIEWER_WAKES : IMPLEMENTER_WAKES;
  return types.includes(header.type);
}

export function otherRole(me: Role): Role {
  return me === "reviewer" ? "implementer" : "reviewer";
}

/** True when two shas name the same commit (either may be an abbreviation). */
export function sameSha(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length < 7 || b.length < 7) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.startsWith(y) || y.startsWith(x);
}
