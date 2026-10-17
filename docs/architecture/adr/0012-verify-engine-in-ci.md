# ADR-0012: One verify engine, run as a CLI locally, through the MCP and in CI

- **Status:** proposed
- **Date:** 2026-10-17
- **Decision item:** `adr-0012`
- **Concerns:** `REQ-VER-1` to `REQ-VER-9`, `REQ-VER-12`, `REQ-VER-13`, `REQ-CHN-3`, `REQ-DAT-13`, `NFR-1`; SAD §4.3

## Context

The same checks with the same rules must run locally, through the MCP verify group and in CI (`REQ-VER-3`).
Alarms are tiered green, amber and red (`REQ-VER-7`) and routed by identifier ownership (`REQ-VER-8`).
AI-assisted reviews run with the user's own model access (`REQ-VER-12`).

## Options considered

### A. One TypeScript package, three entry points

`packages/verify` holds the checks. The CLI (`npx narthex verify`), the MCP tool `verify_run` and a thin CI action
all call it with the repo's profile and configuration. Output is JSON plus SARIF for code-scanning views, and an
exit code.

- Pro: one rule set by construction.
- Pro: works with no service; posting results to Narthex is optional.
- Con: CI needs Node.js. Most CI images have it.

### B. Checks as server-side jobs triggered by webhooks

- Con: CI depends on Narthex being up; self-hosted and local users lose checks.

### C. Separate check implementations per surface

- Con: drift, against `REQ-VER-3`.

## Decision (recommendation)

**A.** In CI, the action runs the CLI. When the project uses the hosted or a self-hosted service, the action posts
the result to the API, authenticated with the CI platform's OIDC token where one exists (GitHub Actions), so no
long-lived secret is stored. The server routes amber and red alarms to owners as items. Red fails the job, so the
host's required-status rule blocks the merge.

AI-assisted reviews are a separate, optional CI step that runs the user's own agent with their model key. Their
findings are labelled AI-assisted (`REQ-VER-2`).

## Consequences

- The form builder's own checks (`NFR-1`) stay in Python; `verify` calls the builder in check mode rather than
  re-implementing them.
- Each check carries the identifiers it verifies, so evidence records come from the same run (`REQ-VER-4`).
