# ADR-0002: The official MCP TypeScript SDK, Streamable HTTP hosted, stdio local

- **Status:** proposed
- **Date:** 2026-10-17
- **Decision item:** `adr-0002`
- **Concerns:** `REQ-IFC-1`, `REQ-IFC-2`, `REQ-IFC-6`, `REQ-IFC-7`, `REQ-IDN-3`, `NFR-8`; SAD §2, §9.2, §11.2

## Context

The MCP server is Narthex's main interface (R8). It runs in three modes (SAD §7.1): local with no service, self-hosted
and hosted. Agents authenticate with OAuth 2.1 when they reach a remote server (`REQ-IDN-3`). Responses must stay
small (`NFR-8`).

The MCP specification defines two standard transports: stdio and Streamable HTTP. Streamable HTTP replaced the
older HTTP with SSE transport, and may stream server messages over SSE. Its authorization section applies to HTTP
transports only; stdio servers take credentials from the environment.

## Options considered

### A. Official TypeScript SDK; Streamable HTTP hosted, stdio local

- Pro: the reference implementation, with both transports and auth helpers (SDK README).
- Pro: the same tool code serves both transports.
- Con: the SDK moved to a v2 package layout (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`), with
  v1.x on a branch. We pin a version and follow its changelog.

### B. A third-party framework on top of the SDK

- Pro: less boilerplate.
- Con: one more dependency between us and spec changes; less documented.

### C. Our own protocol code

- Con: the protocol and its auth rules change between revisions; tracking them is work with no product value.

### D. Streamable HTTP only, also for local use

- Pro: one transport.
- Con: local use would need a running server and a sign-in; stdio needs neither (`REQ-IDN-8`).

## Decision (recommendation)

**A.** Use the official MCP TypeScript SDK, pinned. Serve Streamable HTTP at one endpoint for the hosted and
self-hosted modes, and stdio from `narthex mcp --stdio` for local use. Target the latest specification revision
for authorization (2026-07-28 on the day of writing), which prefers Client ID Metadata Documents and deprecates
dynamic client registration.

Further rules:

- Validate the `Origin` header and bind local HTTP servers to localhost, as the transport section requires.
- Keep server state out of the MCP session: cursors and snapshots live in the database, so any instance can
  serve any request and a dropped session loses nothing.
- Keep the tool list short (14 in M0) with descriptions under about 60 words, since tool definitions occupy the
  agent's context (SAD §9.2).
- Never return long text where a GUI link would do (`REQ-IFC-4`).

## Consequences

- A contract test suite runs the same tool calls over both transports.
- The reverse proxy must allow long HTTP responses for SSE streams.
- Spec revisions are tracked; a new revision is an ADR update, not a rewrite.

## Sources

- MCP transports (2025-06-18): https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
- MCP authorization (latest): https://modelcontextprotocol.io/specification/latest/basic/authorization
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
