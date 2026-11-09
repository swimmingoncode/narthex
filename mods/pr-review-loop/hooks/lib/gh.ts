// Pure reading of one `gh pr view --json ...` snapshot. No `$`, no I/O.

import { sameSha } from "./chat.ts";

export const GH_FIELDS =
  "headRefOid,state,reviews,comments,statusCheckRollup,mergeStateStatus,reviewDecision";

export type Verdict = "green" | "red" | "pending" | "none";

export type Check = { name: string; conclusion: string };

export type Review = { id: string; state: string; commit: string };

export type Summary = {
  head: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  reviews: Review[];
  commentIds: string[];
  checks: Check[];
  verdict: Verdict;
  /** An APPROVED review (latest per author) that names the current head. */
  isApprovedAtHead: boolean;
  mergeStateStatus: string;
  reviewDecision: string;
};

type Json = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);

/** One line, bounded: a check name is typed by whoever owns the workflow file. */
export function safeLabel(s: string, max = 60): string {
  const one = s
    .replace(/[^\w .+()/:#-]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

const GOOD = new Set(["SUCCESS", "NEUTRAL", "SKIPPED"]);

function readCheck(c: Json): { check: Check; isFinal: boolean; isGood: boolean } {
  if (c.__typename === "StatusContext" || ("context" in c && !("status" in c))) {
    const state = str(c.state).toUpperCase();
    return {
      check: { name: safeLabel(str(c.context) || "status"), conclusion: state || "PENDING" },
      isFinal: state === "SUCCESS" || state === "FAILURE" || state === "ERROR",
      isGood: state === "SUCCESS",
    };
  }
  const status = str(c.status).toUpperCase();
  const conclusion = str(c.conclusion).toUpperCase();
  const isFinal = status === "COMPLETED";
  const name = safeLabel(str(c.name) || str(c.workflowName) || "check");
  return {
    check: { name, conclusion: isFinal ? conclusion || "UNKNOWN" : status || "PENDING" },
    isFinal,
    isGood: isFinal && GOOD.has(conclusion),
  };
}

export function summarize(raw: unknown): Summary | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const j = raw as Json;
  const head = str(j.headRefOid).toLowerCase();
  const state = str(j.state).toUpperCase();
  if (head === "" || (state !== "OPEN" && state !== "MERGED" && state !== "CLOSED"))
    return undefined;

  const reviews: Review[] = arr(j.reviews)
    .map((r) => ({
      id: str(r.id),
      state: str(r.state).toUpperCase(),
      commit: str((r.commit as Json | undefined)?.oid).toLowerCase(),
      author: str((r.author as Json | undefined)?.login),
    }))
    .filter((r) => r.id !== "" && r.state !== "PENDING");

  // Latest decisive review per author decides whether an approval stands.
  const latest = new Map<string, Review>();
  for (const r of reviews as (Review & { author: string })[]) {
    if (r.state === "COMMENTED") continue;
    latest.set(r.author, r);
  }
  const isApprovedAtHead = [...latest.values()].some(
    (r) => r.state === "APPROVED" && sameSha(r.commit, head),
  );

  const rolled = arr(j.statusCheckRollup).map(readCheck);
  // No checks registered yet (right after a push) is not final and not green.
  let verdict: Verdict = "none";
  if (rolled.length > 0) {
    if (!rolled.every((c) => c.isFinal)) verdict = "pending";
    else verdict = rolled.every((c) => c.isGood) ? "green" : "red";
  }

  return {
    head,
    state,
    reviews: reviews.map(({ id, state: s, commit }) => ({ id, state: s, commit })),
    commentIds: arr(j.comments)
      .map((c) => str(c.id))
      .filter(Boolean),
    checks: rolled.map((c) => c.check),
    verdict,
    isApprovedAtHead,
    mergeStateStatus: str(j.mergeStateStatus),
    reviewDecision: str(j.reviewDecision),
  };
}

export const CI_SYMBOL: Record<Verdict, string> = { green: "✓", red: "✗", pending: "…", none: "–" };
