# Contracts changelog

The four contracts of M0 (`data-model`, `mcp`, `profile`, `tokens`) live in `contracts/<name>/` (`DEC-14`). Each has a
version, in `contracts/<name>/VERSION` or in the `version` field of `contracts/<name>/contract.json`.

A change under `contracts/<name>/` needs a version bump and an entry here, checked by
`scripts/check-contracts.mjs`. An entry is a section headed `## <name> <version>` that names the `DEC-*` decision
which allows the change. Newest entries go first.

Example:

```
## data-model 0.2.0

- Adds the `closed_by` field to the item schema. Decision: DEC-99.
```
