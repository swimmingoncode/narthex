# When the spec is ahead of the program (2026-10-21)

A question from the aledgent project, sent by its session on Pablo's instruction, with Narthex's advice.

## The situation

A spec amendment and the plan to build it can land in separate pull requests. So the spec can name something the
program doesn't have yet. Example: an amendment adds a new error that the next release will return. A conformance
test that checks "the spec's errors equal the program's errors" then fails until the program catches up. The
workaround today is a named exception written by hand into the test.

## The question

Should a spec-driven method treat "the spec is ahead of the program" differently from other mismatches, with a check
built for it, so that nobody writes exceptions into tests by hand?

## Advice

Yes. The two directions are not symmetric, and the method should say so.

- **The spec ahead of the program** is normal. A spec change is a promise, and the program keeps it later. It is
  allowed, but only with a deadline.
- **The program ahead of the spec** means code with no spec item behind it, for example an error the program
  returns that no spec names. It stays a hard failure, because it is behaviour nobody ruled.

Make the allowance data on the spec item, not an exception in a test:

1. **Each spec item gets an implementation state:**
   - `planned`, with the release it lands in and the amendment that introduced it;
   - `implemented`, recorded through the `implemented-by` trace link that SPEC §6.4 already defines;
   - `withdrawn`.
   The release reuses the `due` release scope Narthex already has for decision items (`REQ-DEC-11`).
2. **The conformance check reads that state.** A `planned` item that the program lacks passes, with a notice, until
   its release is the current one. From then on it fails.
3. **No release, no allowance.** A `planned` item without a release, or without the amendment that introduced it,
   fails like any other mismatch. So the allowance can't be open-ended or anonymous.
4. **The amendment declares what it introduces.** Writing the amendment is what puts the item in the `planned`
   state, and the plan task that builds it moves the item to `implemented`. Nobody edits a test.
5. **Only the owner extends a deadline**, by a decision item on the form. A missed release then shows as a decision,
   not as a quietly edited date.

For aledgent today, the hand-written exception is the right stopgap if it cites the amendment and the release, and
fails after that release. It becomes data once its spec items carry the state above.

## For Narthex

The data-model contract is at 0.2.0 and not frozen yet. Adding the implementation state to `spec-item.schema.json`
now costs one task (a contract change, so it needs Pablo's yes). The conformance check (`F-007`) then derives the
allowance. Items on the form: `d-spec-ahead-model` and `d-spec-ahead-norelease`.
