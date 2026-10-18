# F-003 MCP contract notes

Readings and gaps found while building the contract. No item is raised from here; the lead decides.

- **Token contract not merged.** `contracts/tokens/` (F-005) is not in this branch. The six scopes and the six token
  purposes sit in `contracts/mcp/tests/helpers.ts` as `TOKEN_SCOPES` and `TOKEN_PURPOSES`, copied from SAD 11.4 and
  ADR-0007. When F-005 merges, the tests should read them from there. `endpoints.schema.json` also lists them.
- **Scope of the decide tools.** `form_read` and `form_wait` take `decide:read`. `form_publish`, `form_ack` and
  `link_get` take `decide:publish`: `link_get` can mint an answer link, and `form_ack` writes to the feed. SAD 11.2
  does not say; change it with a bump if the token contract reads otherwise.
- **Optional `step` and `level` on a piece.** PLAN T-003-02 lists them among the fields of `kb-piece`. They are
  optional here, because a method piece or a template belongs to no one level. `id`, `version`, `class`, `label`
  and `body` are required.
- **Class of non-sector pieces.** REQ-KNB-3 asks a class of sector material only; T-003-02 asks one of every piece.
  Methodology and template pieces are given `closed` with the label "our standard way" until the lead rules.
- **`snapshot_get` is a fifth endpoint.** T-003-03 names four calls (link exchange, answer submit, event stream,
  link request). The page also loads the published snapshot (SAD 5.2 sequence), so it is listed too.
- **No MCP SDK.** ADR-0002 picks the official SDK for the server; it is not installed. The conformance client and
  the stub speak JSON-RPC directly (stdio lines; HTTP POST with JSON replies), so the contract has no dependency
  of ours. The stub never streams with SSE; the client reads SSE replies, for a real server.
- **Untrusted fields.** The pointers list whole objects where the text is free (`/events/*`, `/piece`), since an
  event carries the person's choice and notes.
