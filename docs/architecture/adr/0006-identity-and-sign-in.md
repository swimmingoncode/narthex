# ADR-0006: Sign-in and agent authorization with an embedded open-source library

- **Status:** proposed; Pablo asked for the options of a separate sign-in server (form item `adr-0006`, 2026-10-17)
- **Date:** 2026-10-17
- **Decision item:** `adr-0006` (reserved: a security trade-off)
- **Concerns:** `REQ-ITK-2`, `REQ-ITK-3`, `REQ-IDN-3`, `REQ-TEM-4`, `REQ-IDN-8`; SAD §6.1

## Context

Narthex needs two kinds of sign-in:

1. **People** sign in to the GUI with GitHub, GitLab or Codeberg, or with Google, Outlook or email (`REQ-ITK-2`,
   `REQ-ITK-3`).
2. **Agents** sign in to the MCP server with OAuth 2.1 (`REQ-IDN-3`). So Narthex must be an OAuth authorization
   server. The latest MCP revision asks for protected resource metadata (RFC 9728), PKCE, resource indicators
   (RFC 8707), and prefers Client ID Metadata Documents over dynamic client registration.

Self-hosters must be able to run all of it with no paid service (`REQ-IDN-8`).

## Options considered

### A. An embedded open-source library in our server (for example Better Auth, MIT)

- Pro: runs inside our process and database; self-hosters get it for free.
- Pro: Better Auth documents an MCP plugin that makes the app an OAuth 2.1 authorization server and protected
  resource, with Client ID Metadata Documents, and dynamic registration off unless enabled.
- Pro: a generic OAuth plugin adds any OAuth 2.0 or OpenID Connect provider, which covers Codeberg.
- Con: we operate the security-critical code ourselves: updates, key rotation, abuse limits.
- Con: the library is young; its long-term security record is *unverified*. Its built-in provider list beyond
  GitHub, Google and Microsoft was not checked (*unverified* for GitLab).

### B. A hosted identity service (for example Auth0, Clerk, WorkOS)

- Pro: the least security work for us; mature.
- Con: per-user cost; our users' identities live with a third party; self-hosters cannot use the same path;
  MCP authorization support varies by vendor (*unverified*).

### C. A self-run identity server (for example Keycloak, Zitadel, Ory, Authentik)

- Pro: mature, open source, standards-complete.
- Con: a second service to run and upgrade, heavy for a small team and for self-hosters.

### D. Write our own

- Con: the riskiest option. Rejected.

## Decision (recommendation)

**A**, an embedded library, pinned, with Better Auth as the first candidate after a short spike that checks: the
MCP plugin against a real Claude Code client; GitLab and Codeberg sign-in; email links; and its security
advisories history. If the spike fails, fall back to C with Zitadel or Keycloak, still open source.

## Consequences

- We own a security-critical dependency. Updates are tracked like a security patch stream.
- Sessions, sign-in methods and OAuth clients live in our PostgreSQL (ADR-0005).
- A security review of the auth module is a gate before the first outside user.

## Why the lead must rule

This decides who holds people's sign-in data and how agents are trusted. A wrong call is hard to undo once users
exist. It is a security trade-off, so it is reserved (`REQ-DEC-4`).

## Sources

- MCP authorization (latest): https://modelcontextprotocol.io/specification/latest/basic/authorization
- Better Auth MCP plugin: https://www.better-auth.com/docs/plugins/mcp
- Better Auth generic OAuth plugin: https://www.better-auth.com/docs/plugins/generic-oauth
- Better Auth repository (MIT licence): https://github.com/better-auth/better-auth
