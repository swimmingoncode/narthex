# Amendment 0001: bounded experiments, and a quieter inbox

**Status:** applied to `SPEC.md` v0.2.0
**Target:** `SPEC.md` v0.1.0; this amendment takes it to **v0.2.0**
**Date:** 2026-10-04
**Ruling:** item `ru-experiments`. Pablo ruled it on aledgent on 2026-10-04, and the aledgent session
relayed it to this session the same day. It is recorded in `decisions/responses/` with that provenance,
because it was not answered on this project's form.
**In one line:** an experiment keeps its questions and draft spec changes to itself. Only its definitive
shape (one amendment, one plan decision, and the few questions that still need the lead) reaches the
decision form.

## Why

On aledgent, each experiment (sharding, a custom runtime, the stress suite) added its own plan decisions,
amendments and defaulted questions straight to the lead's inbox. The inbox grew to about 86 items, about 56
of them technical, and many had already been superseded by the next experiment.

## R1: experiments are first-class

New §4.4 with `REQ-CO-13` to `REQ-CO-19`:

- an experiment is a recorded object: id, start, question, scope, its own decision log, draft changes,
  outcome and promotion record;
- its questions and defaults go to `experiments/<date>-<slug>/decisions.json`, never the lead's inbox,
  except reserved items, which still need the lead (`INV-4`);
- its amendment is `Status: experimental` and its plan decision `proposed`; only flagged code and
  measurement notes merge before promotion;
- it ends with a one-page outcome (adopt, adapt or drop) with numbers tied to named runs;
- only an adopted or adapted outcome is promoted, consolidated into one amendment, one plan decision and
  at most about three questions; superseded items are never promoted;
- a dropped experiment keeps its record and promotes nothing.

New skill `REQ-WF-19` (`experiment`), new invariant `INV-10` (no unpromoted experiment item in the
inbox), new glossary terms (experiment, outcome, promotion), `experiments/` added to the layout
(`REQ-CO-1`).

## R2: a quieter inbox

- `REQ-DI-8`: tabs and sub-tabs count only open items; applied defaults are not counted.
- `REQ-DI-9`: applied defaults sit collapsed below open and answered items, behind one control that says
  how many there are.

The decision-form skill implements both from this amendment on.

## Questions raised

Both are on the form.

- `OQ-28`: are experiment logs committed, or kept in a gitignored scratch area as on aledgent? The
  conservative reading written here: committed, so that a dropped experiment keeps its record
  (`REQ-CO-18`).
- `OQ-29`: who calls the outcome? Written here: one item on the lead's form (`REQ-CO-19`).
