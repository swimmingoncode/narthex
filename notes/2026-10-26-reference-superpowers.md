# Reference: Superpowers (2026-10-26)

Superpowers: a skills-based development workflow for coding agents. <https://github.com/obra/superpowers>. MIT licence. Read at commit 2ce8aa1 (2026-10-21), version 7.0.1. Survey only; it proposes no change to Narthex.

## What it is

Fifteen skills plus a bootstrap. The order of work:

1. `brainstorming`: one question at a time, short playbacks, two or three approaches, a design doc. A hard gate blocks building until the user approves the doc.
2. `using-git-worktrees`, then `writing-plans`: bite-sized tasks with exact files, signatures and tests.
3. `subagent-driven-development` (fresh implementer and reviewer per task) or `executing-plans` (inline, one review at the end).
4. `test-driven-development`, code review, `verification-before-completion`, `finishing-a-development-branch`.

Triggering: a `SessionStart` hook (`hooks/hooks.json`; startup, clear, compact) runs `hooks/session-start`, which injects the `using-superpowers` skill. That skill orders the agent to look for a skill before any reply and lists excuses to refuse.

Packaging: one `skills/` tree for every harness. Each harness adds a plugin manifest, a tool-mapping file, and the same hook script emitting a different JSON shape. Skills name actions, never tools.

## Comparison

| Superpowers | Narthex today | Note |
|---|---|---|
| Brainstorming with a hard design gate | `intake` (`REQ-SKL-1`), `STEP-1` gate, `REQ-CHN-2`; questions go on the form | Gate is prose only. The design doc has an Approaches part and a fresh-agent "builder check". |
| Plans of tiny tasks; Global Constraints copied verbatim from the spec | `plan` (`REQ-SKL-6`): tasks trace to ids, cycle check, waves | They copy values, not ids. Plan header has a Review Focus list of inputs no test covers. |
| Subagent per task, spec-and-quality review, model named per dispatch | `dispatch`, `review` (`REQ-SKL-7`, `-8`); ADOPTING §8 rules 3, 4, 6, 7 | Same rules reached independently: name the model, pass files not pasted text, implementers spawn nothing. |
| Per-plan ledger as recovery map after compaction | `STATE.md` (`REQ-SKL-16`, §8 rule 9) | They call a lost place the costliest failure seen. Ledger holds `Ruling:` lines. |
| Bounded waits on subagents | Never poll; a script waits (`REQ-SKL-28`) | Narthex is stricter. |
| TDD iron law; code written first is deleted | TDD is one method per milestone (`REQ-CHN-11`); `DEC-15` | Universal for them, per-plan for Narthex. |
| Verification before completion: fresh command output before any success claim | Gates (`REQ-CHN-3`), scripted exit check (`REQ-SKL-14`), evidence table (`REQ-VER-13`) | Same idea at two scales. They also say to check the VCS diff, not the agent's report. |
| Systematic debugging: root cause first; after three failed fixes, question the design | No debugging skill; incidents become scenarios (`REQ-VER-20`) | Close to the advisor trigger "same error fails twice" (§8 rule 10). |
| Worktrees (ask consent); finishing a branch (menu: merge, PR, keep) | One worktree per agent (`REQ-SKL-29`); HOUSE-RULES merge rule; `INV-4` | They ask the user; Narthex mandates. Discard only on explicit request, confirmed first. |
| Requesting and receiving review; no performative agreement | Findings become fixups or items (`REQ-SKL-8`, `-31`) | No Narthex counterpart for the receiving side. |
| `writing-skills`: TDD for skills with baseline and pressure scenarios | `REQ-VER-16` to `-18` test Narthex with persona agents; no skill-authoring rule | Key step: watch an agent fail without the skill first. |
| Evals: real sessions, LLM actor and verifier plus deterministic checks (`docs/testing.md`) | L3 synthetic sessions, five runs, $3 ceiling | Similar. The docs read give no pass rate or cost ceiling; the eval repo was not cloned. |
| Session-start injection | Only a `PreToolUse` guard (`hooks/guard.py`); ADOPTING §8 rule 9 mentions a compact-time `SessionStart` for `STATE.md` | Theirs makes triggering reliable; Narthex's enforces rules. |
| `diagnosing-superpowers`: read a transcript, cite path and line per finding | None | After-the-fact explanation of a bad session. |
| Multi-harness plugins | `REQ-SKL-32`: Claude Code plugin plus Agent Skills, untested elsewhere | Theirs is a worked example. |

## Where they differ in kind

Each claim was checked against the files.

- **One developer, one session.** Narthex serves a lead directing several agents or teams (§7.9).
- **Prose spec.** Specs and plans are Markdown files in `docs/superpowers/`. No skill uses ids or trace links; spec coverage is a self-review.
- **Questions in chat.** Brainstorming asks in chat. Narthex keeps answers as data with a log (`INV-3`), and chat replies stay short (`REQ-SKL-21`).
- **The agent rules.** During a run, their skills have the agent decide conflicts and record a ruling, stopping only for destructive, security-sensitive or outward actions. Narthex's worker raises an item (`REQ-SKL-24`).
- **No sectors or levels.** "Sector" appears in no skill. Tone adapts to the user; Narthex levels never change a check (`INV-12`).
- **Enforcement by wording.** Strong text and excuse tables; no refusing hook (`REQ-SKL-27`).
- **Ends at merge.** Narthex continues to release and evolution (`STEP-5`, `STEP-6`).

## Worth citing later

- `skills/writing-plans/SKILL.md`: Review Focus, and the proportion check (a plan far longer than its spec is a transcript).
- `skills/subagent-driven-development/references/preflight.md`: a conflict scan whose output is a table, one row per task pair.
- `skills/subagent-driven-development/SKILL.md`: the ledger and the `Ruling:` line format.
- `skills/writing-skills/SKILL.md`: pick wording by failure type; a prohibition can backfire where a recipe works.
- `skills/test-driven-development/SKILL.md`: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST".
- `docs/porting-to-a-new-harness.md`: the invariants a harness must meet; session-start injection is the hard requirement.
