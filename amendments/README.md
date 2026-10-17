# Amendments

This folder holds the amendments to `SPEC.md` v0.3.0, the Narthex specification. Their numbering starts again
at 0001 (ruling R19 of 2026-10-17, in `notes/2026-10-17-rulings.md`).

| File | Status |
|---|---|
| `0001-own-publishing.md` | Applied in SPEC v0.3.1 |
| `0002-first-rulings-on-v0.3.md` | Applied in SPEC v0.3.2 |

## History

The amendments to SDD Studio's SPEC v0.1.0 and v0.2.0 are kept in `history/amendments-v0/`, unchanged:

| File | Status when moved |
|---|---|
| `0001-experiments.md` | Applied in SPEC v0.2.0 |
| `0002-lessons-from-use-cases.md` | Proposed, not ruled |
| `0003-builders-discovery-guardrails.md` | Proposed, not ruled |
| `0004-specsite.md` | Proposed, not ruled |
| `0005-spec-profiles.md` | Proposed, not ruled |

SPEC v0.3.0 folds all five in (ruling R18). Its Appendix A maps each of their items to a new identifier, to a
ruling, to an assumption, or to "dropped" with the reason. Cite an old amendment by its path, for example
`history/amendments-v0/0002-lessons-from-use-cases.md`, so it never collides with a new amendment of the same
number.

## Writing a new amendment

The `amend` skill writes each one (SPEC `REQ-SKL-10`):
- the file is `amendments/NNNN-slug.md`, with a number reserved before use (`REQ-DAT-8`);
- it states its status, its target version, the date, and the rationale;
- it lists the rulings it applies, each with the decision item that ruled it;
- it lists the questions it raises, each as its own item on the decision form.
