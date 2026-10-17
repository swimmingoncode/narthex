# Amendment 0002: lessons from three projects

**Status:** proposed, not ruled. Nothing here is applied to `SPEC.md`.
**Target:** `SPEC.md` v0.2.0 (amendment 0001 applied)
**Date:** 2026-10-04
**Source:** `notes/2026-10-04-use-cases-synthesis.md`, from the Kippu, aledgent and usage-subscriptions
reports (private use-case reports).
**Rulings needed:** item `0002-adopt` adopts A1 to A11 and A16 to A18 as written; items `0002-d1` to `0002-d4` settle
the four points where the projects disagree (A12 to A15). Each A-item names its lesson (L1 to L14).

## Additions, adopted together by `0002-adopt`

**A1: a review step (L1).** New step between execute and merge, and skill `review`: read-only
adversarial reviewers check each PR against the spec and report findings per PR. Findings that need a
fix go back as fixups; findings that need a ruling become amendment items. After any change applied
post-review, the reviewers are told what changed. New `REQ-WF-20`, `REQ-WF-21`.

**A2: no turn ends waiting on CI (L2).** House rule `REQ-CO-20`: an agent never blocks on, or ends its turn
polling, CI. `dispatch` provides a durable wait: the agent hands off its PR, and is resumed when CI
finishes. New `REQ-WF-22`.

**A3: numbers are reserved (L3).** `REQ-CO-21`: amendment numbers, task ids, plan-decision ids and
migration numbers are reserved before use, in one registry per repo, so two sessions cannot take the same
one. `REQ-CO-7`'s checker also rejects duplicate task ids and migration numbers.

**A4: one form per project (L4).** `REQ-DI-25`: a form, its builder input and its artifact belong to one
project. Publishing takes a lock, and a publish whose base is stale is refused. `INV-11`: no item from
another project appears in a project's form.

**A5: fewer, larger passes (L5).** New item kind `provide` (the lead supplies a value, a credential or
access), so the end-of-milestone checklist reads decide / provide / discuss. `REQ-WF-23`: questions are
batched into passes, at most one per milestone unless something blocks; `report` ends a milestone with that
checklist.

**A6: rulings given outside the form (L6).** `REQ-DI-26`: a ruling given in chat, a meeting, a PR comment
or another session is recorded the same day as an answered item with `by: "relayed:<source>"`, notes naming
who ruled, where and when, and the evidence (message, transcript, screenshot) where there is one. It
binds only once it is written into the document it changes.

**A7: derived editions (L7).** `REQ-LD-12`: every derived copy of a document (PDF, a crate's copy of SPEC or
PLAN, a project-specific edition) is generated from one commit, states it, and is flagged stale when its
source moves on. No copy is maintained by hand.

**A8: isolation of parallel agents (L8).** `REQ-WF-24`: each agent has its own worktree and its own build
directory; no two agents run verification in one worktree; before merge, a PR is rebased on the current
base and re-checked, so two PRs green on their own bases cannot break the main branch together.

**A9: generated plan artefacts (L9, L10).** `REQ-WF-25`: the plan's task table is checked (every task
traces to an identifier, no cycles, milestone order) and its dependency waves are generated, never written
by hand. The `plan` skill SHOULD freeze the contracts between components in the first milestone and
SHOULD give a layer with several implementations a shared conformance suite. Syncing issues and project
boards from `tasks.md` is deferred as `DEF-7`.

**A10: the form tracks reads (L11).** `REQ-DI-10` changes: an item is new until the lead has seen it,
not only until the next publish. `REQ-DI-27`: each item keeps its edit history, and the outbox shows when
an item's wording changed after it was answered.

**A11: rate limits (L13).** `REQ-WF-26`: `dispatch` backs off when agents hit usage limits, and chooses
the model per task: the strongest for contracts, security and work likely to surface a spec gap.

## Disagreements, one item each

**A12, item `0002-d1`: a spec gap found during implementation.** Kippu stopped the task and never
applied anything unruled. aledgent and usage subscriptions built the conservative reading meanwhile.
Proposed text for `REQ-WF-12`: build meanwhile only when the reading is the plan's own or strictly more
restrictive; never change SPEC or PLAN before the ruling; otherwise stop the task and raise the item.

**A13, item `0002-d2`: test names.** Proposed `REQ-WF-27`: a per-project setting in the house rules, with
the default being plain test names and identifiers in a comment on each test; the traceability check
reads the comments.

**A14, item `0002-d3`: spec version per amendment.** Proposed: below v1.0.0 an amendment bumps the patch
version only, and the version bump is listed in the amendment; from v1.0.0 on, as `REQ-WF-7` says.

**A15, item `0002-d4`: who drafts and who applies.** Proposed `REQ-WF-28`: the agent that found a gap
drafts the amendment item; the session that owns the spec applies it after the ruling; reviewers are
told (A1).

## Added after Kippu's questions (2026-10-04), adopted with `0002-adopt`

**A16: deferred, with a reason.** An item may be answered "Defer" with a reason and a target (a
release or a milestone). It leaves the inbox, shows in a Deferred list, and returns when its target comes
up. New `REQ-DI-28`.

**A17: release scope.** An item may carry `due` (for example `v1.0.0` or `M2`). The overview lists, per
release, the items that must close before it; the builder can refuse to mark a release ready while any
remain. This makes "an OQ that blocks V0 closes before the V0 freeze" checkable. New `REQ-DI-29`.

**A18: importing an existing project.** The `decide` skill can seed `decisions/questions.json` from a
project's open identifiers (`OQ-*` in SPEC, open plan decisions, "Open items" in feature plans), and its
already-ruled ones as relayed answers, so a project that started without the form keeps its history.
New `REQ-WF-29`.
