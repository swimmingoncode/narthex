# How to test Narthex end to end (2026-10-17)

Pablo asked how Narthex as a whole is tested: happy paths, edge cases, verification and validation. He asked
whether that means synthetic sessions with AI agents that mimic users, or whether he and Bloque test it in real
conditions. The proposal here: both, at different layers. Synthetic sessions verify; real use validates. Nothing
here is ruled yet.

## 1. Four layers

| Layer | What is tested | How | Who runs it |
|---|---|---|---|
| L1. Components | builder, specsite, MCP tools, validators, profiles as data | unit tests, golden fixtures, property tests, contract tests of the MCP surface | CI, on every change |
| L2. Invariants | the spec's `INV-*`, e.g. no answer lost to an expired link, no outward action on a default, no unpromoted experiment item in the inbox | executable checks tagged with the invariant's id, run against recorded and synthetic sessions | CI, nightly |
| L3. Synthetic sessions | the whole method: a user's agent driving Narthex through intake, product spec, SRS, decisions, plan, build | persona agents play the user; a real agent harness plays the user's agent; scripted scenarios; deterministic and judged assertions | an eval suite, before each release |
| L4. Real use | whether people actually get production software out of it | dogfooding (Narthex specs itself), the Bloque pilot, later book readers | Pablo, Bloque, early users |

L3 and L4 are not alternatives. L3 catches regressions and edge cases cheaply and repeatably. L4 answers the
question L3 can't: did the right thing get built for real people (validation, in the chain's sense).

## 2. Synthetic sessions (L3)

**Personas**, one per experience level and sector:
- a casual vibe-coder with a vague idea;
- a civil engineer with domain depth and no software background;
- a professional engineer in a hurry;
- a fintech lead under PCI and SOC 2;
- a safety-critical team lead;
- an engineer coordinating two human teams.

Each persona is an agent with a hidden "true intent" and a style: terse, rambling, contradictory, absent for
days.

**Scenarios**, happy paths and edge cases:
- **Happy path:** from idea to an approved SRS and a first milestone plan.
- **Vague input:** an incomplete or contradictory product spec, which must be caught at the input contract.
- **Unattended form:** the persona disappears for "days". The agent must not poll, and must resume correctly.
- **Expired read link** while answering; the answer must still land (INV-17).
- **Spec gap** mid-build: the agent builds only the stricter reading, or stops.
- **Wrong sector** chosen at intake, then corrected.
- **Two teams** amending the same requirement.
- **Reserved items:** an outward action requested on a default must be refused.
- **Token budget:** the run must stay under a cost ceiling.

**Assertions:**
- *Deterministic:* artefacts exist; ids are valid and stable; trace links are complete; invariants hold; the form
  is updated after each read; the cost stays under budget.
- *Judged:* an LLM grader with a rubric scores question quality, concision, guidance fitted to the experience
  level, and whether the final SRS matches the persona's hidden intent. Calibrate the grader against a few
  human-graded runs, so it doesn't drift.

**Variance:** agents aren't deterministic. Run each scenario several times and track pass rates, not single
results. A regression is a drop in pass rate.

**Tooling:**
- Claude Code has plugin eval suites (`claude plugin eval`), a natural home for L3 once Narthex is a plugin.
- The Agent SDK can drive headless sessions.
- Recorded transcripts become fixtures for L2.

## 3. Real use (L4)

Pablo and Bloque are the validators, not the test suite. What to measure in the pilot:
- time from idea to an approved SRS;
- decisions per week, and the share of defaults later overturned;
- rework caused by spec gaps;
- token cost per milestone;
- how often forms sit unattended, and whether agents resumed correctly;
- each user's own rating of clarity.

Every pilot incident becomes a new L3 scenario, so it never regresses.

## 4. Questions for Pablo

1. Should the spec gain a "testing Narthex" section (L1 to L4) as an amendment?
2. Which personas and scenarios come first? The proposal: vibe-coder happy path, unattended form, spec gap.
3. What is the cost ceiling for one synthetic run, and how many runs per release?
4. Which pilot measures do you want reported, and how often?
