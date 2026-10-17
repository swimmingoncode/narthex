# ADR-0007: Opaque, purpose-bound tokens; answer links valid until revoked

- **Status:** proposed
- **Date:** 2026-10-17
- **Decision item:** `adr-0007` (reserved: a security trade-off)
- **Concerns:** `REQ-IFC-9` to `REQ-IFC-11`, `REQ-IDN-4`, `REQ-IDN-7`, `INV-17`, `NFR-3`, R20; SAD §6.2, §11.4

## Context

R20 splits links by purpose. Reading a form's state uses a short-lived token. Answering uses a long-lived token,
for one form, allowed only to submit answers, and revocable, because answers can take hours or days (`INV-17`,
R22). Answering needs no account (`NFR-3`). Agents also need short-lived git-host tokens per task (`REQ-IDN-4`).

## Options considered

### Token format

- **A. Opaque random tokens, hashed at rest.** Pro: revoked at once by one row update; nothing to decode if
  leaked from a log. Con: one database lookup per request (cheap).
- **B. Signed self-contained tokens (JWT).** Pro: no lookup. Con: revocation needs a deny list, which brings the
  lookup back; long-lived JWTs are hard to recall.

### Answer link lifetime

- **1. Until revoked or the form is closed.** Pro: the plain reading of R20 and `INV-17`; no answer is ever lost.
  Con: a leaked link works until someone revokes it.
- **2. A hard cap, for example 90 days, then a fresh link.** Pro: limits a forgotten leak. Con: can break `INV-17`
  for a form that waits longer; needs a reissue path.
- **3. Short, with silent renewal.** Con: needs a session, which `NFR-3` rules out.

## Decision (recommendation)

**Format A** for every Narthex token, and **lifetime 1** for answer links. The table:

| Token | Allows | Lifetime |
|---|---|---|
| MCP access token | Scopes `knowledge:read`, `spec:read`, `change:write`, `verify:run`, `decide:read`, `decide:publish`; audience-bound | About 1 hour; refresh rotates |
| Read link | Read one form's current state | About 15 minutes |
| Answer link | Load the published snapshot of one form; submit answers to the items routed to its holder | Until revoked, or the form is closed |
| Refresh request | Ask the agent for a fresh read link, through the store | Same as the answer link it rides on |
| Git task token | The repositories and permissions of one task | 1 hour, set by GitHub |
| Session | The GUI, by role | 30 days, sliding |

Rules:

- Tokens are 256-bit random values. The database keeps a keyed hash, the purpose, the subject, the scope and the
  expiry.
- Link tokens go in the URL fragment, so servers and proxies never log them. The page trades them for a short
  session over a POST.
- Each answer is audited with the token id. The lead sees every answer in the outbox and can revoke and reissue a
  link in one step.
- Answer links for reserved items are issued to the lead only.

## Consequences

- A leaked answer link can submit answers to that one form until revoked. It cannot read later state, other
  forms, documents or the repo. The audit log and the outbox make misuse visible.
- Freezing this table in M0 keeps old links working after later releases.

## Why the lead must rule

How long an answer link stays valid trades the risk of a leaked link against the risk of a lost answer. That is a
security trade-off, so it is reserved (`REQ-DEC-4`).

## Sources

- Ruling R20: `notes/2026-10-17-rulings.md`
- MCP authorization, tokens never in query strings: https://modelcontextprotocol.io/specification/latest/basic/authorization
- GitHub installation token lifetime: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
