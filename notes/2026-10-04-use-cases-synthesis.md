# What three projects teach SDD Studio

2026-10-04. Sources: the aledgent, Kippu and usage-subscription reports (private use-case reports), written by each
project's own session at Pablo's request. Proposed changes are in `amendments/0002-lessons-from-use-cases.md`
(not applied). The questions that need Pablo are on the form.

## The three projects

| | Kippu | aledgent | Usage subscriptions |
|---|---|---|---|
| Dates | 2026-09-12 → 09-15 | 2026-09-16 → ongoing | 2026-09-30 → ongoing |
| Spec | 102 REQ, 17 INV, 25 OQ | 204 requirements, 25 INV | 93 REQ, 21 INV, 87 AC |
| Amendments | 4 | 14+ | 10 (2 proposed) |
| Plan decisions | 24 (`AD-*`) | 23 (`DEC-*`) | 37 (`DEC-*`) |
| PRs merged | ~260 in 8 repos | 97+ | 13 stacked, open |
| Agents | 24, up to 10 at once | many, per feature | ~16 subagents, 3 sessions |
| How decisions reached Pablo | Chat lists and `AskUserQuestion`, 4 rounds, ~70 items | Form (artifact + db), ~86 items at peak | Chat, then a form, now on SDD Studio's builder (37 items) |
| Rendered docs | None; generated sections and issues | Explainer pages, case study | PDFs (stale), crate copies |

## What all three confirm

1. **Rulings as data.** All three record rulings outside chat. Kippu: "a ruling that stayed only in the
   log was treated as not made". Already `INV-7`, `REQ-DI-21`.
2. **Most questions take a default.** Kippu: ~25 of ~70 needed Pablo. aledgent: 11 of 40. Usage
   subscriptions: 16 of 37. Confirms `REQ-DI-4` and the collapsed defaults of amendment 0001.
3. **Stable identifiers pay off.** Precise PRs, reviews and test comments in every project (`REQ-CO-4`).
4. **One worktree per agent, one feature per agent, house rules in the brief** (`REQ-WF-6`, `REQ-WF-11`).
5. **The identity override and verbosity** are corrections Pablo made more than once. Already rules.

## What is missing from the spec

| # | Lesson | Evidence | Where it goes |
|---|---|---|---|
| L1 | **A review step.** Read-only adversarial reviewers before merge found real defects; reviewers must hear about every change applied after their review | usage-sub §7, §9 (9 defects + blocker B-1); Kippu §7 (agents found each other's bugs) | New step and skill `review` |
| L2 | **Never end a turn waiting on CI.** Agents stall at the 600 s watchdog and CI polls spam notifications | Kippu §10 (corrected 3 times), aledgent §5 | House rule, plus a durable "wait for CI, then resume" in `dispatch` |
| L3 | **Numbers collide.** Amendment numbers (usage-sub), task ids and migration numbers (Kippu) | usage-sub §5, Kippu §7 | Reserve numbers; the checker rejects duplicates |
| L4 | **One form per project.** Another session edited aledgent's builder and published to its artifact: conflicting publishes, foreign items in the inbox | aledgent §3 item 6 | Form bound to one project; publish lock |
| L5 | **Fewer, larger passes.** "Too many passes"; one end-of-milestone checklist grouped decide / provide / discuss | Kippu §3, §10 | A `provide` item kind; batching rule for `report` and `decide` |
| L6 | **Rulings given outside the form** need a recorded path with the source and evidence; one quote was misattributed | aledgent §4, usage-sub §4, Kippu §4 | Generalise the `relayed` record into a requirement |
| L7 | **Derived copies drift.** PDFs stale, crate copies of SPEC/PLAN re-copied by hand | usage-sub §6, §9 | LD regenerates editions from one commit and flags stale ones |
| L8 | **Parallel agents collide on disk.** Shared target dirs gave false failures; worktrees pruned; two PRs green alone broke main together | usage-sub §7, Kippu §7, aledgent §5 | Dispatch isolation rules; merge queue or rebase-and-recheck |
| L9 | **Generated plan artefacts keep docs honest.** Task trace check, dependency waves, issue bodies from `tasks.md` | Kippu §8 | `plan` skill tooling; tracker sync as deferred scope |
| L10 | **Freeze contracts first.** Contracts in M0 and a conformance suite let ten agents work without blocking | Kippu §9 | `plan` skill guidance |
| L11 | **"New" since your last read**, not the last publish; edit history per item | aledgent §3 | Form |
| L12 | **The coordinator is a bottleneck.** Every ruling and plan edit through one session | Kippu §9 | Who drafts and who applies (question D4) |
| L13 | **Model and rate limits.** Ten agents hit usage limits at once, twice; a model split helped | Kippu §7 | `dispatch` backoff and model choice |
| L14 | **Spec bundles outside git** lose history | usage-sub §6 | `REQ-CO-1` already requires a repo; say why |

## Where the projects disagree

These need Pablo; each is a form item.

- **D1: a spec gap during implementation.** Kippu stopped the task and never applied anything unruled,
  "not even provisionally" (corrected twice). aledgent and usage subscriptions built the conservative
  reading meanwhile and raised an item. `REQ-WF-12` currently says the latter. A reconciliation: build
  meanwhile only when the reading is the plan's own or strictly more restrictive, never touch SPEC or PLAN,
  otherwise stop.
- **D2: test names.** Kippu and aledgent name tests after the `AC-*`/`INV-*` they verify. On usage
  subscriptions Pablo rejected that three times: plain names, identifiers in comments, no test names in docs.
- **D3: spec version per amendment.** `REQ-WF-7` bumps the version on every amendment. Kippu kept v0.2.0
  through four amendments on purpose.
- **D4: who drafts and applies rulings.** Kippu: the coordinator alone, which became the bottleneck.
  Usage subscriptions: still open. A middle path: the agent that found the gap drafts the amendment item; the
  session that owns the spec applies it after the ruling; reviewers are told.
