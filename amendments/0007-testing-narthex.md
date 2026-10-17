# Amendment 0007: testing Narthex

**Status:** applied to `SPEC.md` v0.3.7
**Target:** `SPEC.md` v0.3.6
**Date:** 2026-10-17
**Ruling:** item `plan-test-budget` (PLAN v0.2.0, `DEC-16`): up to $3 a synthetic run, five runs per scenario per
release. The source is `notes/2026-10-17-testing-narthex.md`, whose first question (should the spec gain a
"testing Narthex" section) the lead answered by asking for this amendment.

Narthex teaches a method with verification and validation. This amendment makes Narthex apply it to itself, in a
new subsection, §7.6.1, under Verification and guardrails. The requirements continue the `REQ-VER` family
(`REQ-VER-14` to `REQ-VER-20`).

## What changes

- **Four layers** (`REQ-VER-14`). L1 components, L2 invariants and L3 synthetic sessions verify. L4 real use
  validates. L3 and L4 are not alternatives: L3 catches regressions and edge cases cheaply and repeatably; L4 shows
  whether the right thing was built for real people.
- **L1 and L2** (`REQ-VER-15`). L1 runs on every change. L2 gives every invariant a check tagged with its id, run
  on changes to its package and nightly, against recorded and synthetic sessions.
- **L3** (`REQ-VER-16`). Persona agents with a hidden true intent and a style play the user, one per experience
  level and sector. The scenarios are listed in the requirement, from the happy path to the cost ceiling.
- **Assertions** (`REQ-VER-17`). Deterministic ones decide; an LLM grader with a rubric may add judged ones,
  labelled AI-assisted and calibrated against human-graded runs.
- **Pass rates and budget** (`REQ-VER-18`). Each scenario runs five times per release and is judged by its pass
  rate; a run costs at most $3 (at most $45 a release for three scenarios); a run that reaches the ceiling fails.
- **L4 pilot measures** (`REQ-VER-19`). Time to an approved SRS; decisions per week and defaults overturned;
  rework from spec gaps; token cost per milestone; unattended forms and correct resumes; user-rated clarity.
- **Incidents become scenarios** (`REQ-VER-20`). A real-use incident becomes an L3 scenario, and an L2 check when it
  breaks an invariant.

§12 maps `REQ-VER-14` to `REQ-VER-20` to `STEP-4`. The front matter moves to v0.3.7 and lists amendments 0001
to 0007.

## Assumption added

- `ASM-60`: the pilot measures are reported once per milestone, in the milestone report. The note asks how often;
  this is the recommended answer and nobody has ruled it.

## Not changed

- Which scenarios come first (happy path, unattended form, spec gap) stays with item `plan-test-scenarios` in the
  plan. The spec lists the scenarios and does not rank them.
- The $3 is an estimate. The first L3 harness (PLAN `F-025`) measures the real cost, and the lead can rule a new
  ceiling by an amendment.
- The tooling of the note (Claude Code plugin evals, the Agent SDK) is informative and stays out of the spec.

## Questions raised

None as new items. The reporting rhythm rests on `ASM-60` until the lead confirms or overturns it.
