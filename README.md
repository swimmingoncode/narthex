# Narthex (codename)

Tools and a knowledge base that turn a user's agentic system into a senior software architect, guiding
requirements engineering and software engineering for one or many agentic teams. Born from the aledgent
project at Bloque (2026-10). See `notes/2026-10-03-origin.md`.

Public history starts at SPEC v0.3.0 (2026-10-17). Earlier working history is private.

The project was called SDD Studio until 2026-10-17, when Pablo dropped that working name (ruling R1) and chose
the codename Narthex (`notes/2026-10-17-codenames.md`). The sections below keep their original wording as
history.

## Status (2026-10-17)

- `SPEC.md` v0.3.0: the one-time rewrite (ruling R18), folding in amendments 0001 to 0005 and rulings R1 to
  R22. `OVERVIEW.md` digests it; `REFERENCES.md` lists every external source.
- `amendments/`: numbering restarts for v0.3.0 (R19). The old amendments are in `history/amendments-v0/`.
- `decisions/questions.json`: the form "Narthex Decisions", with the open questions of SPEC §11 and one item to
  confirm the assumptions of §13.

## Product ideas (seed, 2026-10-03)

1. **Decision inbox / outbox.**
   - Structured questions, with defaults, sections and sub-tabs.
   - Answers read back by the agent, plus an audit trail of what was decided, when and why.
   - The prototype was aledgent's form generator (`build.py`, `artifact_template.html`, `rewrites.json`), in a local checkout.
2. **Living documentation.**
   - Spec, overview, plan and amendments rendered to HTML or PDF from the repo.
   - Stable anchors on every requirement and decision.
   - Two-way backlinks with the decision system: a decision opens the spec section in a modal or iframe at its anchor, and a spec section lists the decisions that shaped it.
3. **Workflow skills (a plugin):**
   - intake → research → spec → decide → plan → dispatch agents → amend → propose upstream → report.
   - House rules are carried into every agent brief.

## Candidate additions

- **Traceability graph:** requirement ↔ decision ↔ task ↔ PR ↔ test ↔ measurement, with "what breaks if I change this".
- **Amendment workflow:** a diff of SPEC versions, with the decisions and PRs that caused each change.
- **Agent dispatch board:** running agents, their briefs, PRs and CI, with stall detection and resume.
- **Measurement ledger:** every benchmark run with its id, conditions and figures, so docs cite runs and stale numbers get flagged.
- **Upstream proposal kit:** proposals for third-party repos with measurements, drafted PR text and status tracking.
- **Notification digest:** push only what needs the lead, batched.
- **Meeting notes into rulings:** a transcript becomes decisions plus open questions on the form.
- **Risk register:** fed by agents' findings, with owners and status.

## Packaging note (2026-10-03)

Claude Code **mods** have been generally available since 2026-10-01 (v2.1.287): TypeScript extensions shipped inside plugins that can add UI, rewrite prompts or replace features, in the CLI and the desktop Code tab.

Candidate packaging: one plugin holding the workflow skills, plus a mod that shows the decision inbox and outbox and the docs inside the Code tab.

Verify against https://code.claude.com/docs/en/plugins/ before relying on it.

## Status (2026-10-03)

- `SPEC.md` v0.1.0 and `OVERVIEW.md`: the three modules, invariants, and 27 open questions.
- `skills/decision-form/`: the first skill, a generalised decision form. The open questions are in
  `decisions/questions.json`, built to `decisions/form/index.html` (not published yet).
- `case-studies/aledgent/index.html`: the method as practised on aledgent, published as a private page.
- `STATE.md`: the session state file, read first after a compaction.
- `ADOPTING.md`: how a project adopts the method and gets its own decision form.
- `notes/2026-10-03-research.md` (landscape) and `notes/2026-10-03-packaging.md` (plugin vs. skills vs. harness).

## Lesson: experiment scoping (2026-10-04)

Experiments must have their own decision log and draft spec changes. Only an adopted outcome is promoted, consolidated, into the owner's inbox. Without this, aledgent's inbox reached about 56 technical items, many already superseded. A first-class "experiment" object (start, scope, log, outcome, promotion) belongs in the product: specified in amendment 0001 (SPEC v0.2.0, §4.4).
