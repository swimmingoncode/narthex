# Auth practices Narthex adopts

- **Status:** proposed, for the security review of the auth module (ADR-0006). **Date:** 2026-10-17
- **Concerns:** ADR-0006, ADR-0007, SAD §6, `REQ-IDN-3` to `REQ-IDN-8`, `REQ-ITK-2`, `REQ-ITK-3`, `REQ-IFC-9` to
  `REQ-IFC-11`, `REQ-TEM-4`, `INV-4`, `INV-16`, `INV-17`, `NFR-3`

We do not improvise. Each practice is taken from how Keycloak, Zitadel, Ory (Kratos, Hydra), Authentik or Logto do it,
or from a standard they follow. Official documents were read on 2026-10-17. *(unverified)* means not confirmed against
an official source in this pass. A *proposed* value is a number we picked. A number that ADR-0007 does not fix is a
security trade-off, so the lead rules on it before it ships (`INV-4`). The target is OWASP ASVS v5.0.0 level 2 for
chapters V6 (authentication), V7 (sessions) and V10 (OAuth and OIDC), and NIST SP 800-63B-4 for passwords, factors and
timeouts (sections 4 and 5).

## 1. Standards baseline

- **AP-1. OAuth 2.1 and RFC 9700 for every agent flow.** Authorization code with PKCE `S256` for all clients, exact
  string match on redirect URIs, no implicit or password grant, no access token in a query string, no open redirector.
  From: RFC 9700 §2.1, §2.1.1, §2.4, §4.3.2; ASVS 10.4.1, 10.4.4, 10.4.6. MCP cites draft 13, the latest is 16.
  Serves: `REQ-IDN-3`.
- **AP-2. Resource indicators and audience checks.** Clients send `resource` (RFC 8707). The token's `aud` is the MCP
  server's canonical URI. The MCP server rejects any other audience and never forwards a client's token downstream.
  From: MCP authorization and security best practices; RFC 9700 §2.3; ASVS 10.3.1. Keycloak marks RFC 8707 experimental
  and Zitadel ignores it, so we test it. Serves: `REQ-IDN-3`, `REQ-IDN-4`.
- **AP-3. Metadata, challenges and issuer.** The MCP server serves RFC 9728 metadata. A 401 carries `resource_metadata`
  and `scope`; a 403 carries `insufficient_scope`. The authorization server adds `iss` to responses (RFC 9207), since
  PKCE does not stop mix-up. Scopes start read-only and grow by step-up. From: MCP authorization (scope selection,
  response validation, mix-up). Serves: `REQ-IDN-3`, `REQ-IFC-9`.
- **AP-4. OIDC Core for upstream providers.** For Google and Microsoft we check the ID token signature, `iss`, `aud`,
  `exp` and `nonce`, and identify the person by `sub` within the issuer. From: OIDC Core §3.1.3.7 *(rule list not
  re-read)*; ASVS 10.5.1 to 10.5.4. Serves: `REQ-ITK-2`, `REQ-ITK-3`.
- **AP-5. Short access tokens.** MCP access tokens last about one hour (ADR-0007). From: Keycloak "Compromised access
  and refresh tokens"; Hydra default of one hour. ID tokens, if we issue any, have `aud` equal to the client id, last no
  longer, and are never accepted as an API credential (ASVS 10.5.4). Serves: `REQ-IDN-3`, `REQ-IFC-9`.
- **AP-6. Refresh tokens rotate, and reuse kills the family.** Each use issues a new token and marks the old one used. A
  second use of a used token revokes every token of that grant and raises an alert. Disabling a person or a connection
  voids its tokens at once; Zitadel once missed this (CVE-2023-22492). From: RFC 9700 §2.2.2; ASVS 10.4.5, 7.4.2; Logto
  (reuse revokes the grant id); Keycloak "Revoke Refresh Token"; Hydra rotation. Serves: `REQ-IDN-3`, `REQ-IDN-4`.
- **AP-7. The reuse grace window is at most 10 seconds (proposed).** Hydra allows a grace period, Better Auth's `mcp()`
  defaults to 30 seconds. The retry gets the same response. From: Better Auth MCP docs; Hydra graceful token refresh.
  Serves: `REQ-IDN-3`.
- **AP-8. Refresh tokens expire absolutely.** Proposed: 30 days absolute, 7 days idle, then the person re-authorizes.
  From: ASVS 10.4.8; Hydra default of 30 days; Zitadel sets idle and absolute expiry. Serves: `REQ-IDN-3`.
- **AP-9. Map onto ADR-0007.** Every Narthex token is opaque, 256-bit, stored as a keyed hash with purpose, subject,
  scope and expiry. Answer links last until revoked or the form closes, for one form, submit only. Tokens carry a
  visible prefix so secret scanners can find them *(GitHub practice, unverified)*. Lists show last use. The link page
  posts the fragment token for a short session. From: ASVS 7.2.3, 10.4.9. Serves: `REQ-IFC-9`, `REQ-IFC-10`, `INV-17`,
  `NFR-3`.

## 3. Client registration for agents

- **AP-10. Order: pre-registered, then CIMD; DCR stays off.** Known clients such as Claude Code are pre-registered.
  Others use Client ID Metadata Documents. The MCP revision marks DCR deprecated. If a client forces DCR, we enable it
  with consent and a rate limit. From: MCP authorization (client registration); ASVS 10.4.7; Better Auth (DCR off unless
  enabled). Serves: `REQ-IDN-3`.
- **AP-11. The CIMD fetcher resists SSRF.** HTTPS only, no redirects, block private, loopback and link-local ranges
  after DNS resolution, size and time limits, a cache, a rate limit per host, and an egress proxy on the hosted service.
  From: MCP security best practices (SSRF against authorization servers); CIMD draft 00. Serves: `REQ-IDN-3`,
  `REQ-IDN-8`.
- **AP-12. Narthex owns a consent screen, per person and per client.** It names the client and its host, the redirect
  host, the scopes in plain words and the lifetime, has CSRF protection and `frame-ancestors 'none'`, and stores the
  decision per person and client id. Localhost-only redirects get a warning. From: MCP security best practices (confused
  deputy, localhost impersonation); ASVS 10.7.1 to 10.7.3. Serves: `REQ-IDN-3`, `INV-4`.
- **AP-13. Scopes are the ADR-0007 list and no more.** `knowledge:read`, `spec:read`, `change:write`, `verify:run`,
  `decide:read`, `decide:publish`. No wildcard. No scope answers items (SAD §6.3). From: MCP scope minimization; ASVS
  10.4.11. Serves: `REQ-IDN-3`, `INV-4`.
- **AP-14. One grant per person and client, one token per task.** The grant is (person, client id), revocable from a
  "connected agents" page. The git task token of `REQ-IDN-4` is separate and per task, so audit shows person, client and
  task. An agent never commits under an identity of its own (`REQ-IDN-6`). From: ASVS 10.4.9, 10.7.3; Keycloak and Hydra
  consent revocation. Serves: `REQ-IDN-4`, `REQ-IDN-6`, `INV-16`.

## 4. Account security

- **AP-15. Throttle, do not lock out; answer every failure alike.** Per-account and per-IP limits with growing waits and
  a ceiling. Keycloak warns that lockout lets an attacker disable any account they can name; its temporary lockout
  defaults are 30 failures and 15 minutes at most. NIST allows 100 consecutive failures. Proposed: 10 failures, then 1
  minute growing to 15, and an email to the owner. Sign-in, sign-up and recovery answer the same whether the account
  exists or not (Keycloak "Invalid username or password"; Better Auth uniform 200). Limits sit in a shared store, and
  the client IP comes only from a header our proxy sets (`ipAddressHeaders`, `trustedProxies`); Better Auth's default
  store and numbers are *unverified*. From: Keycloak brute force docs; SP 800-63B-4 §3.2.2; ASVS 6.1.1, 6.3.1, 6.3.8;
  Better Auth security reference. Serves: `REQ-ITK-3`.
- **AP-16. Verify email before it means anything.** No email sign-in and no linking by email until verified. A change of
  email needs a fresh session and a notice to the old address. From: ASVS 7.5.1, 6.3.7; Keycloak update email
  (re-authentication after 300 seconds). Serves: `REQ-ITK-3`.
- **AP-17. Magic links are single use and bound to the request.** 256-bit, hashed, 10 minutes at most, accepted only for
  the purpose that made them, opened in the browser that asked, and consumed by a click that POSTs so mail scanners
  cannot burn them. The Better Auth critical advisory of 2026-09-30 (OAuth state worked as a magic link) is a test case.
  NIST §3.1.3.2 and ASVS 6.3.6 (level 3) forbid email as an authenticator, so this is a recorded deviation for
  newcomers, and we steer people to a passkey or a git host login. From: SP 800-63B-4 §3.1.3; ASVS 6.5.1, 6.5.5, 6.6.2.
  Serves: `REQ-ITK-3`.
- **AP-18. No passwords in v1 unless the lead asks.** Social sign-in, magic links and later passkeys avoid password
  storage. If they come: argon2id with at least 19 MiB, 2 iterations, 1 lane; 15 characters minimum when alone, 64 or
  more allowed; a breached and context blocklist; no composition rules; no forced rotation. Better Auth defaults to
  scrypt, so argon2id needs custom `hash` and `verify`. From: OWASP Password Storage Cheat Sheet; SP 800-63B-4 §3.1.1.2;
  ASVS 6.2.1 to 6.2.12. Serves: `REQ-ITK-3`.
- **AP-19. Passkeys first, then a second factor for the lead.** WebAuthn passkeys are phishing resistant, and synced
  ones are allowed up to AAL2. The lead, who rules on reserved items, gets a passkey or second factor before M1 ends.
  Until then the git host's two-factor sign-in is the factor. From: SP 800-63B-4 §2.2.3, §2.3.3; W3C WebAuthn level 3
  *(unverified)*; Zitadel and Kratos support both *(unverified)*. Serves: `INV-4`, `REQ-TEM-4`.
- **AP-20. Identity is (provider, subject), never the email.** The key is the GitHub numeric id, the GitLab and Codeberg
  user id, or the OIDC `iss` plus `sub`. For Microsoft we ignore the mutable `email` claim and use `oid` and `tid` (the
  nOAuth class, *unverified*). From: ASVS 10.5.2; Logto accepts only verified identifiers. Serves: `REQ-ITK-2`,
  `REQ-ITK-3`.
- **AP-21. Link accounts only from a signed-in session.** Set `disableImplicitLinking`, leave `trustedProviders` empty,
  and link a second provider only after re-authenticating with the first. A same-email sign-in with no link gets "sign
  in with your first method". Keycloak calls auto-linking by email "a potential security hole". Better Auth warns that
  `trustedProviders` risks takeover. Logto's auto-link is optional and needs a verified email. Kratos asks for proof of
  the old credential *(forum, unverified)*. The threat is pre-hijacking, where an attacker registers the victim's email
  first *(USENIX 2022, unverified)*. Unlinking keeps one method and needs a fresh session. Serves: `REQ-ITK-2`,
  `REQ-ITK-3`, `INV-4`.

## 5. Sessions

- **AP-22. Cookie flags and rotation.** `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`
  (Better Auth defaults to host-only, secure, HttpOnly, Lax; we confirm the prefix works). Sign-in, step-up, role change
  and account link issue a fresh session id and end the old one. A credential change ends all other sessions. Better
  Auth's `cookieCache` keeps a revoked session alive on other devices until it expires, so it stays off, or at one
  minute with `disableCookieCache` on AP-24 routes. From: MCP security best practices; ASVS 7.2.4, 7.4.3; Better Auth
  session docs. Serves: `REQ-TEM-4`, `NFR-3`, `INV-4`.
- **AP-23. Idle and absolute timeouts.** ADR-0007 sets 30 days sliding. NIST says 30 days or less overall at AAL1. We
  add an absolute cap (proposed 90 days) and a 14 day idle timeout, and document the deviation as ASVS 7.1.1 asks.
  Serves: `REQ-IFC-11`.
- **AP-24. A fresh session for sensitive actions.** Within 15 minutes (proposed): answering a reserved item, revoking or
  reissuing an answer link, linking or unlinking a provider, changing email. From: ASVS 7.5.1; Better Auth `freshAge`
  (default one day, we lower it); Keycloak 300 seconds; Kratos privileged sessions *(unverified)*. Serves: `INV-4`,
  `INV-17`.
- **AP-25. Logout everywhere and a device list.** Each session shows created, last use, browser and coarse location. The
  person ends one or all after a fresh sign-in. An admin can end a person's sessions. Disabling an account ends all.
  From: ASVS 7.4.1 to 7.4.5, 7.5.2; Better Auth `listSessions`, `revokeSessions`. Serves: `REQ-IFC-11`.

## 6. Keys and secrets

- **AP-26. Signing keys rotate in three steps.** Publish the new key in JWKS with a `kid`, sign with it after caches
  expire, and drop the old key after the longest token it signed has expired. Rotate on a schedule (proposed 90 days)
  and at once on suspicion. One algorithm family (ES256 or EdDSA), reject `none`, pin `alg` per key. From: Keycloak
  realm keys and its "not-before" push; RFC 8725 *(unverified)*; ASVS V9 *(not re-read)*. Serves: `REQ-IDN-3`,
  `REQ-IDN-8`.
- **AP-27. Versioned secrets, one per purpose, encrypted provider tokens.** Use `BETTER_AUTH_SECRETS` with key versions
  so data re-encrypts on next write. The token pepper lives in the secret store with a key id on each hash. Provider
  refresh tokens (GitLab, Codeberg) are encrypted with a key from the secret store (SAD §6.4), and we check whether
  Better Auth does this itself *(unverified)*. From: Better Auth secret rotation docs; OWASP Password Storage Cheat
  Sheet (pepper). Serves: `REQ-IDN-8`.
- **AP-28. Audit log of auth events.** Append only, separate from logs, kept for the project's life (SAD §8). It records
  sign-in and failure, token issue, refresh and reuse alert, consent given and revoked, link and unlink, role change,
  session end, key rotation, admin action, each with a token id and never the token. From: Keycloak login and admin
  events; ASVS V16 *(not re-read)*. Serves: `INV-17`, `INV-4`.

## 7. Tenancy and admin

- **AP-29. A person is global; access is by organisation and project.** Every check takes organisation and project from
  the verified token or session, never the request body. Keycloak separates users by realm, Zitadel by organisation, and
  Better Auth's organization plugin gives owner, admin, member and custom roles. Roles are read from the database per
  request and narrowed by token scope, so a change bites at once; deny by default (ASVS 10.3.2). Row-level security in
  PostgreSQL is a defence in depth *(our proposal)*. Serves: `REQ-TEM-4`, SAD §6.6.
- **AP-30. Operators are a separate pool and surface.** Swimming on Code staff use an admin surface on its own host, off
  the public internet where possible, with a passkey and no access to project content by default. Keycloak says to use
  the master realm only to manage realms. A customer's lead is never an operator. Serves: `REQ-IDN-8`, `INV-4`.
- **AP-31. No impersonation in v1.** Authentik enables it by default and asks for a reason only if configured. Keycloak
  lets any holder of the `impersonation` role do it. If we add it: operators only, 15 minutes, a mandatory reason, a
  notice to the person, read-only, never able to answer items or mint answer links, with actor and subject in the audit
  log (RFC 8693 `act`, *unverified*). Admins may start a reset but never set a password (ASVS 6.4.6). Serves: `INV-4`.

## 8. Operations

- **AP-32. Pin and watch.** Exact versions and a lockfile for `better-auth` and each `@better-auth/*` package, upgraded
  together. Subscribe to its advisories; 48 hours for a critical (ADR-0006). A separate server would not remove this
  duty (ADR-0006 counts). Serves: `REQ-IDN-8`.
- **AP-33. A regression suite grows from each advisory.** Tests for wrong audience, reused refresh token, reused or
  parallel authorization code, `javascript:` redirect, state confusion, cross-purpose token, a revoked session on a
  cached cookie, and CIMD to a private address. It runs in CI on every upgrade. Serves: `REQ-IDN-3`.
- **AP-34. Security headers.** CSP with `script-src 'self'` and nonces, `frame-ancestors 'none'`, HSTS,
  `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` on token and sign-in responses,
  and no wildcard CORS on auth routes. From: MCP security best practices (CSP, clickjacking); RFC 6749 §5.1
  *(unverified)*; OWASP Secure Headers Project *(unverified)*. Serves: `REQ-IFC-9`, `NFR-3`.
- **AP-35. Auth incident response, with switches.** Detect (reuse alert, advisory). Contain (push a not-before time that
  voids older tokens, end sessions, disable a client or provider, rotate keys). Assess from the audit log. Notify (GDPR
  allows 72 hours to a regulator, *unverified*). Review. Config flags turn off CIMD, one provider or refresh grants with
  no deploy. We drill it once before the first outside user. From: Keycloak "Compromised access and refresh tokens".
  Serves: `REQ-CHN-14`, `INV-17`.

## Gaps to close in the spike

- ADR-0007 wants opaque tokens, but ADR-0006 has the MCP server check a signature. Check which the plugin issues, and
  check the refresh reuse default (AP-7), rate-limit store (AP-15), token encryption (AP-27), `__Host-` cookies, argon2id
  and `disableImplicitLinking`.

## M0 must-have

1. Code flow with PKCE `S256`, exact redirect match, no implicit or password grant (AP-1).
2. `resource` and audience checks, RFC 9728 metadata, scope challenges, no token passthrough (AP-2, AP-3).
3. Opaque hashed tokens per ADR-0007, with prefixes, never in query strings or logs (AP-9).
4. Refresh rotation, family revocation on reuse, absolute expiry, grace of 10 seconds or less (AP-6 to AP-8).
5. Pre-registered clients and CIMD only, DCR off, SSRF-safe fetcher (AP-10, AP-11).
6. Per-person, per-client consent page and a "connected agents" list with revoke (AP-12, AP-14).
7. Identity keyed on (provider, subject); implicit linking off; no email linking (AP-20, AP-21).
8. Throttling with a shared store, trusted IP header, uniform errors (AP-15).
9. `__Host-` cookie flags, fresh id on privilege change, cookie cache off for sensitive routes (AP-22).
10. Idle and absolute timeouts, logout everywhere, device list (AP-23, AP-25).
11. Fresh-session step-up for reserved answers, link reissue and linking (AP-24).
12. Versioned secrets, pepper in the secret store, a tested signing-key rotation (AP-26, AP-27).
13. Append-only audit log of auth events (AP-28).
14. Pinned versions, advisory watch, and the regression suite in CI (AP-32, AP-33).
15. Security headers and an auth incident runbook with kill switches, drilled once (AP-34, AP-35).

## Later

- Passkeys and a second factor for the lead (AP-19); Google, Outlook and email sign-in in M1 (SAD §6.6, AP-16, AP-17).
- Passwords, only if asked (AP-18); new-sign-in notifications (ASVS 6.3.5, 6.3.7).
- DPoP or mTLS tokens and PAR (ASVS 10.3.5, 10.4.13, 10.4.14, level 3); organisation single sign-on and SCIM.
- Operator surface split, row-level security, impersonation (AP-29 to AP-31); adaptive challenges as in Authentik.

## Sources

- https://www.rfc-editor.org/rfc/rfc9700.html and https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
- https://modelcontextprotocol.io/specification/latest/basic/authorization and its `security_best_practices` page
- https://pages.nist.gov/800-63-4/sp800-63b.html and https://github.com/OWASP/ASVS/tree/v5.0.0/5.0/en
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://www.keycloak.org/docs/latest/server_admin/ and https://zitadel.com/docs/guides/manage/console/default-settings
- https://www.ory.com/docs/hydra/guides/graceful-token-refresh and https://www.ory.com/docs/kratos/concepts/security
- https://docs.goauthentik.io/customize/policies/types/reputation/, https://www.better-auth.com/docs/reference/security
  and https://docs.logto.io/end-user-flows/sign-up-and-sign-in/social-sign-in
