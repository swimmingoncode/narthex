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

## data-model 0.2.0

- Adds `spec-item.schema.json`: one item of a spec as data (SPEC 6.3): id, type, statement, strength, status, source
  (file, line, commit), owner, `level`, `verification_method`, the assumption flag with `assumes`, profile attributes
  under `attributes`, and links of the SPEC 6.4 types. Which attributes a type MUST carry stays with the profile.
- `trace.schema.json` takes `id`, link targets and `source` from `spec-item.schema.json`. Everything valid in 0.1.0 is
  still valid; `source` of a need may now also carry a `commit`. Decision: DEC-14.

## mcp 0.1.0

- First release: the 14 tools of SAD 11.2 (`tools.json`, `tools.schema.json`), the resources and prompts
  (`resources.json`, `prompts.json`), the knowledge piece schema (`kb-piece.schema.json`) and the HTTP endpoints of
  the form page and the watcher (`endpoints.json`), with fixtures, a conformance suite for any server (`conformance/`) and a stub that answers from the fixtures
  (`stub/`). Decision: DEC-14.
- Adds the `snapshot_get` endpoint, beyond the four calls listed for `T-003-03`: the answer link loads the published
  snapshot of its form (SAD §4.1). Decision: DEC-14.

## data-model 0.1.0

- First release: the six schemas of SAD 11.1 (`questions`, `response`, `event`, `project`, `ownership`, `trace`),
  with fixtures and conformance suites in TypeScript and Python. Decision: DEC-14.
