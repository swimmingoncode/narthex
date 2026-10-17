# ADR-0006: Sign-in and agent authorization with an embedded open-source library

- **Status:** accepted (Pablo, 2026-10-17, form item `adr-0006`: "If not, built-in it is"; the comparison below found no separate server that fits better).
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
advisories history. If the spike fails, fall back to C with Keycloak (see the comparison below), still open source.

## Consequences

- We own a security-critical dependency. Updates are tracked like a security patch stream.
- Sessions, sign-in methods and OAuth clients live in our PostgreSQL (ADR-0005).
- A security review of the auth module is a gate before the first outside user.
- Practices: docs/architecture/auth-practices.md

## Why the lead must rule

This decides who holds people's sign-in data and how agents are trusted. A wrong call is hard to undo once users
exist. It is a security trade-off, so it is reserved (`REQ-DEC-4`).

## Sources

- MCP authorization (latest): https://modelcontextprotocol.io/specification/latest/basic/authorization
- Better Auth MCP plugin: https://www.better-auth.com/docs/plugins/mcp
- Better Auth generic OAuth plugin: https://www.better-auth.com/docs/plugins/generic-oauth
- Better Auth repository (MIT licence): https://github.com/better-auth/better-auth

## Separate sign-in servers compared (2026-10-17)

Pablo chose "a separate sign-in server" on `adr-0006` and asked which options exist and whether any fits better than
the built-in library. Option C above named four servers. This section scores nine, Better Auth as the baseline,
against what Narthex needs:

- An OAuth 2.1 authorization server for the MCP server. The current MCP authorization specification (revision
  2026-07-28, read 2026-10-17) says authorization servers MUST implement OAuth 2.1; SHOULD support Client ID
  Metadata Documents (CIMD); MAY support dynamic client registration (DCR), which it now marks deprecated; and must
  offer RFC 8414 or OpenID Connect discovery. MCP clients MUST send the RFC 8707 `resource` parameter and the MCP
  server MUST check that a token's audience is itself. PKCE and RFC 9728 metadata on the MCP server complete the set.
- Sign-in with GitHub, GitLab, Codeberg (Forgejo, so generic OIDC or OAuth2), Google, Microsoft and email (R13).
- Short-lived scoped tokens, roles, and organisation or team tenancy.
- One small server beside PostgreSQL (ADR-0004), a licence that fits an MIT project that others self-host, active
  maintenance, a decent security record, and little effort for a tiny team.

Facts below come from official documentation, the GitHub API (licence, releases, published security advisories,
read 2026-10-17) and, where marked, a third-party tracker. "Unverified" means not confirmed against an official
source in this pass.

| Candidate | Licence | MCP-ready OAuth 2.1 (DCR, CIMD, RFC 8707) | Social sign-in incl. Codeberg / generic OIDC | Email | Memory and footprint | Tenancy and roles | Maintenance and record |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Better Auth** (library, baseline) | MIT | Yes. MCP plugin is an authorization server and resource server with PKCE, RFC 8414/9728 discovery, `resource` bound to `aud`, CIMD through `@better-auth/cimd`. DCR off unless enabled | GitHub, GitLab, Google, Microsoft Entra built in. Codeberg through the generic OAuth plugin with a discovery URL (Forgejo's OIDC endpoint: unverified) | Magic link plugin, email and password | Runs inside our process and our PostgreSQL; no extra service | Organization plugin: teams, owner/admin/member, custom roles and permissions | Release v1.7.10 on 2026-10-15. 37 published advisories (3 critical, 22 high), 25 since May 2026. See verdict |
| **Keycloak** | Apache-2.0 | DCR yes (anonymous registration restricted by default). CIMD and RFC 8707 both marked *experimental*, behind feature flags. MCP revisions from 2025-06-18 on marked experimental | GitHub, GitLab, Google, Microsoft and generic OIDC/OAuth (built-in list not re-checked) | Password yes. No native magic link; a third-party extension adds it | Java. Own sizing guide: about 1 GB per instance at idle, plus PostgreSQL | Organizations GA since 26.0, organization groups since 26.6. Strongest roles model of the nine | v26.8.1 on 2026-10-13. 83 advisories, 17 in 2026: a large, well-run disclosure process |
| **Zitadel** | AGPL-3.0 core since v3 (APIs and SDKs Apache-2.0) | Docs: DCR at `/oauth/v2/register`, off by default. A tracker (2026-07-24) says DCR is not implemented: conflicting, unverified. `resource` is accepted but ignored (does not set `aud`). CIMD not mentioned | GitHub, GitLab, Google, Microsoft, generic OIDC/OAuth (not re-checked) | Passwordless and email codes (not re-checked) | Go. About 512 MB and under one core; PostgreSQL only | Native multi-tenant organizations, roles | v4.19.5 on 2026-10-15. 78 advisories, 42 in 2026 |
| **Ory** (Hydra + Kratos) | Apache-2.0 | Hydra: DCR yes, off by default; RFC 8707 no (tracker, 2026-07-24). CIMD not covered. Hydra has no login screen: we build login and consent pages | Kratos: social sign-in and generic OIDC (not re-checked) | Kratos: email code and link flows (not re-checked) | Go, light. Two services plus our own login UI, plus PostgreSQL | No native organizations (unverified) | Open-source v26.2.0 on 2026-03-20; Ory staff say fixes on a timeline belong to the paid licence (forum, undated); features reach paying tiers first |
| **Authentik** | Core under an MIT-style licence; `authentik/enterprise/` proprietary, needs a subscription | DCR not shipped, in review (tracker, 2026-07-24). CIMD and RFC 8707: no data | GitHub, Google, Microsoft and generic OAuth/OIDC sources (GitLab, Codeberg: not re-checked) | Email stages (not re-checked) | Docs minimum: 2 cores, 2 GB, plus PostgreSQL | Tenants and brands, not organizations (unverified) | 2026.8.4 on 2026-10-14. 47 advisories, 24 in 2026 |
| **Logto** | MPL-2.0 | Unclear. Its MCP Auth kit protects the MCP server against an existing provider; whether Logto serves third-party MCP clients with DCR is not stated. A vendor post says CIMD is in beta on its cloud | Many connectors and generic OIDC/OAuth (exact list not checked) | Passwordless email codes (not re-checked) | Node.js and PostgreSQL, Docker; figures not checked | Organizations with roles (details not checked) | v1.45.0 on 2026-10-13. 13 advisories, all in 2026 |
| **Casdoor** | Apache-2.0 | Docs list RFC 8414, OIDC discovery, PKCE, RFC 8707 and DCR at `/api/oauth/register`, with an organization switch. CIMD not mentioned | Many providers and custom OAuth (GitHub, GitLab, Codeberg not re-checked) | Email verification codes (not re-checked) | Go; figures not checked | Organizations | v4.20.0 on 2026-10-11. No GitHub advisories published, so its security record is *unverified*, not clean |
| **SuperTokens** (self-hosted core) | Apache-2.0 core; `ee/` proprietary | The OAuth2 provider behind its MCP support is a paid feature; the MCP plugin is beta and Node-only | Yes (not re-checked) | Yes (not re-checked) | Java core plus PostgreSQL | Multi-tenancy exists, partly paid (unverified) | v12.3.1 on 2026-10-16 |
| **Authelia** | Apache-2.0 | OpenID provider only. No DCR (planned); clients are configured by hand | None: it does not act as a relying party and does not plan to | No | Go, very light | Not a user directory for third parties | v4.39.28 on 2026-09-17 |

### Verdicts

- **Better Auth.** Meets every requirement in one process with no new service, including the two things the others
  struggle with: CIMD and `resource`-bound tokens. The honest weakness is its record. Its own advisories show 15
  published in May 2026 and 5 in September, among them a critical one on 2026-09-30 (an OAuth state could be used as
  a magic link to sign in as another user) and, in May, medium to high flaws in the OIDC, MCP and OAuth-provider
  code (refresh tokens accepted without the client secret, an authorization code reusable in parallel requests,
  `javascript:` redirect URIs). That is exactly the code we would run for agents. Fast disclosure is a good sign;
  the volume says to pin, watch and review.
- **Keycloak.** The only separate server that is mature, Apache-2.0 and standards-complete, and the best runner-up.
  Against it: its own documentation marks CIMD and RFC 8707 experimental, the two MCP features that matter most;
  it needs about 1 GB at idle on a server we want to keep at €10 to €40 a month; it has no native email link;
  and it is a second system to upgrade and back up (ADR-0004). It also had 17 advisories in 2026, so a separate
  server does not remove the patching duty, only moves it.
- **Zitadel.** Light and multi-tenant, but AGPL-3.0 core (workable as an unmodified separate service, yet a
  licence conversation for an MIT project that self-hosters redistribute), `resource` is ignored, and DCR claims
  conflict. No.
- **Ory.** Free and standard, but Hydra alone is not a sign-in system: we would run Kratos, Hydra and build the
  login and consent pages. That is the most work of the nine, with no RFC 8707 and an open-source line that lags the
  paid one. No.
- **Authentik.** Built for company single sign-on and home labs; no DCR yet, 2 GB minimum, enterprise code under a
  proprietary licence. No.
- **Logto.** Good product for app sign-in, but the MCP side is aimed at protecting a server with some other
  provider, not at serving agents itself; unproven for our case. Worth a re-check, not a fit today.
- **Casdoor.** On paper the closest server to the MCP checklist (DCR, RFC 8707, PKCE), Apache-2.0 and light. But
  CIMD is absent from its docs, its security record is unknown, and the sources are thinner than Keycloak's.
  Not enough to trade a library we already understand for a server.
- **SuperTokens.** The OAuth2 provider needed for MCP is a paid feature. No.
- **Authelia.** No social sign-in, no DCR. It protects a home server; it is not a user sign-in service. No.

### Recommendation

**None of the separate servers fits better. Keep the built-in library, Better Auth, as the decision says.** Reasons:

1. It is the only candidate that offers the full MCP set (PKCE, RFC 9728, CIMD, RFC 8707-bound tokens, DCR off by
   default) as documented, stable-looking features. Keycloak flags the same features experimental.
2. It adds no service: the sign-in data stays in our PostgreSQL, the memory stays small, and self-hosters run one
   container less (`REQ-IDN-8`, ADR-0004).
3. The servers that are strong elsewhere pay for it: Keycloak in memory and operations, Zitadel in licence,
   Ory in effort.
4. The risk that remains is real: a young library with many recent advisories, in the code that signs agents in.

Conditions that make the choice safer, to add to the spike and the consequences above:

- Pin exact versions, watch its advisories, and treat every advisory as a patch window of days (target for critical
  ones: 48 hours, a team commitment to confirm).
- Build Narthex's MCP server as a *pure resource server*: it only reads RFC 9728 metadata, checks the issuer, the
  signature and the audience, and knows no Better Auth type. The authorization server then becomes a replaceable
  part, and moving to Keycloak later is configuration plus a user-data migration, not a rewrite.
- Keep DCR off, use CIMD and pre-registered clients, and keep the 2026-09-30 and May 2026 advisory classes
  (state confusion, token reuse, redirect URIs) as explicit test cases in the spike and the security review.
- Spike gate: if the MCP plugin fails against a real Claude Code client, or a second critical flaw lands in the
  authorization path before launch, switch to **Keycloak** (runner-up), with the `resource-indicators` and `cimd`
  features enabled and an audience mapper as a fallback, and a third-party magic-link extension or password plus
  email verification for email sign-in.

### Sources for this section

- MCP authorization (revision 2026-07-28): https://modelcontextprotocol.io/specification/latest/basic/authorization
- Better Auth MCP plugin: https://www.better-auth.com/docs/plugins/mcp
- Better Auth organization plugin: https://www.better-auth.com/docs/plugins/organization
- Better Auth magic link plugin: https://www.better-auth.com/docs/plugins/magic-link
- Better Auth security advisories: https://github.com/better-auth/better-auth/security/advisories
- Keycloak MCP compliance table: https://www.keycloak.org/securing-apps/mcp-authz-server
- Keycloak memory sizing: https://www.keycloak.org/high-availability/concepts-memory-and-cpu-sizing
- Zitadel dynamic client registration: https://zitadel.com/docs/guides/integrate/dynamic-client-registration
- Zitadel licensing FAQ: https://zitadel.com/license-faq
- Zitadel production sizing: https://zitadel.com/docs/self-hosting/manage/production
- Third-party MCP identity-provider tracker (verified 2026-07-24 by its author): https://zuplo.com/learn/mcp/compatibility/identity-providers
- authentik system requirements: https://docs.goauthentik.io/docs/install-config/install/docker-compose
- authentik enterprise licence: https://github.com/goauthentik/authentik/blob/main/authentik/enterprise/LICENSE
- Casdoor MCP auth: https://casdoor.ai/docs/mcp-auth/overview/
- Casdoor dynamic client registration: https://casdoor.org/docs/application/dynamic-client-registration
- SuperTokens AI authentication: https://supertokens.com/docs/authentication/ai-authentication
- Authelia OpenID Connect provider: https://www.authelia.com/configuration/identity-providers/openid-connect/provider/
- Ory changelog: https://changelog.ory.com
- Logto MCP Auth: https://blog.logto.io/mcp-auth
- Release, licence and advisory counts: the GitHub API for each project's repository, read 2026-10-17
