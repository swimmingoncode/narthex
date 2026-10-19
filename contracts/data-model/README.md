# data-model contract

Version 0.2.0 (see `contract.json`). Seven JSON Schemas, draft 2020-12, for the files Narthex reads and writes
(SAD 11.1). The Python form builder, `packages/core`, the server and the verify checks all read this directory;
none of them keeps its own copy of a shape.

| Schema | Describes | Serves |
|---|---|---|
| `questions.schema.json` | `decisions/questions.json`: `form`, `sections`, `items` with the `chain` of a read item | `REQ-DEC-1`, `REQ-DEC-43`, `REQ-DAT-6` |
| `response.schema.json` | One file of `decisions/responses/`: `{choice, notes, at, by}` per item id, in the form's export shape or as the store lists rows | `REQ-DAT-6`, `INV-3` |
| `event.schema.json` | One event of a form's change feed: answer, edit, link request, publish, ack, with its cursor | `REQ-DEC-24`, `INV-3` |
| `project.schema.json` | `.narthex/project.json`: renamed documents, id families, house-rules path, ownership-file path | `REQ-DAT-1` |
| `ownership.schema.json` | The ownership file: identifier patterns to one owning team each | `REQ-TEM-2` |
| `trace.schema.json` | Items and trace links as a `needs.json`-compatible export. Its `id`, link targets and `source` are the definitions of `spec-item.schema.json` | `REQ-DAT-20` |
| `spec-item.schema.json` | One item of a spec: id, type, statement, strength, status, source, owner, the attributes its type needs, the assumption flag with what it assumes, and links of the `SPEC.md` 6.4 types | `REQ-DAT-6`, `REQ-DAT-17` |

## What a schema checks, and what it leaves out

A schema checks the shape of one document. Some rules sit across items or across a sequence, and a schema cannot
state them. The conformance suite or the builder checks those:

- `questions`: unique ids; that `section`, `follows`, `superseded_by`, `before` and `for` name something that exists;
  `default` inside the option list; the style limits (title length, words per bullet), which are warnings.
- `event`: cursors of one form increase strictly. `tests/helpers.ts` holds the checker, `firstCursorViolation`.
- `spec-item`: which attributes a type MUST carry, such as a `verification_method` on a MUST, is the profile's to say
  (`REQ-DAT-18`), so a MUST without one is schema-valid. `tests/spec-item.test.ts` checks it against the `product`
  profile's requirements, held in a marked stand-in there until `contracts/profile/` exists. The `fixtures/spec-item/profile-gaps/`
  files pass the schema and fail that check. The schema does say that a statement is present and that an item of type
  `assumption`, or one with the assumption flag, names what it assumes.
- `trace`: each need sits under its own id, `needs_amount` counts the needs, `links` holds every typed target.

## Fixtures

`fixtures/<schema>/valid/` files must pass. `fixtures/<schema>/invalid/` files must fail, each with the error that
`expected-errors.json` names: the schema keyword and the instance path, and for `questions` also the text of the
builder's error. The `spec-item` valid fixtures quote rows of this repository's `SPEC.md` and `PLAN.md`, one for each item type; the
suite checks that each sits on the line it names. Two real files of this repository are fixtures too: `decisions/questions.json` and
`decisions/responses/*.json`, plus `.narthex/project.json`.

## Conformance

- TypeScript, in `tests/`, with Ajv (draft 2020-12) and fast-check: `npm run test:contracts`. Compile with
  `strict: true` and `strictTuples: false`; the options list of an item is a tuple on purpose, so that only its first
  option may carry `(recommended)`.
- Python, in `skills/decision-form/tests/test_contract_fixtures.py`: the builder accepts every valid questions
  fixture, rejects every invalid one with the expected message, and reads every valid response fixture.

An implementation passes the contract when it agrees with these suites on every fixture.

## Changing it

From 0.1.0 on, a change under this directory needs a bump of `version` in `contract.json` and an entry in
`../CHANGELOG.md` that names a `DEC-*` decision (`DEC-14`). `scripts/check-contracts.mjs` enforces it in CI.
