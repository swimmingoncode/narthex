# ADR-0008: GitHub App first; GitLab and Codeberg behind one adapter, later

- **Status:** accepted by default (form item `adr-0008`, 2026-10-17; Pablo may still object)
- **Date:** 2026-10-17
- **Decision item:** `adr-0008`
- **Concerns:** `REQ-IDN-1`, `REQ-IDN-2`, `REQ-IDN-4` to `REQ-IDN-6`, `INV-8`, `INV-16`, R7; SAD §2, §6, §13

## Context

Narthex integrates with GitHub, GitLab and Codeberg as an app on repositories the user owns (`REQ-IDN-1`). Each
agent gets a short-lived token per task, scoped to what the task needs; no agent holds a long-lived git
credential (`REQ-IDN-4`). Every commit must be verifiable (`REQ-IDN-6`).

The three hosts differ:

| Host | What the docs say | Fit with `REQ-IDN-4` |
|---|---|---|
| GitHub | An app installation token expires after 1 hour and can be limited to named repositories and permissions | Direct |
| GitLab | OAuth access tokens expire after two hours by default, with refresh tokens; no installation-token equivalent was found | Narthex holds the refresh token and mints short tokens for agents; scopes are per user, not per repository |
| Codeberg (Forgejo) | Forgejo acts as an OAuth2 provider; its docs say OAuth2 scopes are not yet implemented, so a token can do anything its user can | Short-lived for agents, but not narrow yet (*unverified* for Codeberg's own instance) |

On GitHub, a commit an app makes through the API shows as verified when the request is authenticated as the app
and carries no custom author or committer (GitHub docs). Agents working in a local clone commit as their human,
with the human's own signing (`REQ-IDN-6`, `INV-8`).

## Options considered

### A. GitHub App in M0; GitLab next; Codeberg after a check

- Pro: the one host that fits the spec directly ships first; the M0 persona has GitHub (`REQ-ITK-3`).
- Pro: one adapter interface (install, mint, read at commit, commit or PR, webhook) with capability flags, so
  GitLab and Codeberg slot in.
- Con: GitLab and Codeberg users wait.

### B. All three in M0

- Pro: R7 complete at once.
- Con: three auth models in the first milestone; the Codeberg scope gap would ship unresolved.

### C. A generic git-over-HTTPS integration with user tokens

- Con: long-lived user credentials, against `REQ-IDN-4`.

## Decision (recommendation)

**A.** Build the adapter interface in M0 with the GitHub App as its only implementation. Add GitLab in a later
milestone with server-held, encrypted refresh tokens. Add Codeberg after checking Forgejo's current scope support
or its scoped access tokens, and record the outcome as an amendment if `REQ-IDN-4` cannot be met in full there.

App permissions on GitHub, at least: contents (read and write), pull requests (read and write), metadata (read),
checks (read). No administration permissions. Branch protection stays the user's.

## Consequences

- The app's private key is a server secret (SAD §6.4).
- Self-hosters register their own GitHub App, using GitHub's manifest flow (to be documented).
- R7's three hosts arrive in steps. The form says so in plain words.

## Sources

- GitHub installation tokens: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
- GitHub signature verification for bots: https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
- GitLab OAuth provider: https://docs.gitlab.com/integration/oauth_provider/
- Forgejo OAuth2 provider: https://forgejo.org/docs/latest/user/oauth2-provider/
