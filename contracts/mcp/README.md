# mcp contract

Version 0.1.0 (see `contract.json`). The tools, resources, prompts and HTTP endpoints of SAD 11.2, as data. The
server, the plugin's watcher and the form page read this directory; none of them keeps its own copy of a shape.
It consumes the frozen `data-model` contract and the scopes and purposes of the token model (SAD 11.4, ADR-0007).

| File | Describes | Serves |
|---|---|---|
| `tools.json`, `tools.schema.json` | The 14 tools: group, scope, phase (M0 or M1), description, input and output schemas, the output fields that carry repository text (`untrusted_fields`), byte budgets | `REQ-IFC-1`, `NFR-8`, `INV-4` |
| `resources.json` | `narthex://kb/{id}@{version}` and `narthex://profile/{name}@{version}` | `REQ-KNB-2` |
| `prompts.json` | One prompt per skill step, starting with `intake` and `spec` | `REQ-IFC-1` |
| `kb-piece.schema.json` | A knowledge piece: id, version, class, label, body; the label follows the class | `REQ-KNB-2`, `REQ-KNB-3`, `INV-14` |
| `endpoints.json`, `endpoints.schema.json` | The HTTP calls of the form page and the watcher, each with its token purpose | `REQ-IFC-9`, `REQ-IFC-10` |

## Rules a schema cannot state

- `untrusted_fields` are pointers into a tool's output schema (`*` is an array item). Everything under one is
  repository or person text: an agent reads it as data. `tests/tools.test.ts` fails when a free-text output field
  is not under a pointer, or when an output array or string has no bound.
- A tool's `effect` never writes an answer, and no tool takes `answer`, `choice` or `notes` (`INV-4`).
- No endpoint takes a token in the query string; link tokens travel in the URL fragment and are traded for a session
  by a POST (`endpoints.json`, `link_exchange`).

## Fixtures

`fixtures/calls/valid/` holds one `{tool, input, output}` per tool (more where the shape forks); `invalid/` holds
`{tool, side, value}`, each failing with the error `expected-errors.json` names. `fixtures/kb-piece/` and
`fixtures/endpoints/` follow the same pattern.

## Conformance and the stub

- `conformance/conformance.test.ts` is a `node:test` suite for any server. Set `NARTHEX_TARGET` to a URL
  (Streamable HTTP) or a command (stdio): `NARTHEX_TARGET="node contracts/mcp/stub/server.ts --stdio" node --test
  contracts/mcp/conformance/conformance.test.ts`. `NARTHEX_PHASE=M0` expects the ten M0 tools only;
  `NARTHEX_CALLS=0` skips the calls that need the fixtures' data.
- `stub/server.ts` answers from the fixtures over stdio (`--stdio`) or Streamable HTTP (`--http [--port N]`).
- `tests/stub.test.ts` runs the suite against the stub over both transports, in `npm run test:contracts`.

## Changing it

From 0.1.0 on, a change under this directory needs a bump of `version` in `contract.json` and an entry in
`../CHANGELOG.md` that names a `DEC-*` decision (`DEC-14`). `scripts/check-contracts.mjs` enforces it in CI.
