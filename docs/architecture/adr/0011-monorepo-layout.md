# ADR-0011: One monorepo with npm workspaces; specsite stays its own repo

- **Status:** accepted by default (form item `adr-0011`, 2026-10-17; Pablo may still object)
- **Date:** 2026-10-17
- **Decision item:** `adr-0011`
- **Concerns:** `REQ-DOC-14`, `REQ-SKL-32` to `REQ-SKL-34`, `REQ-KNB-12`, `REQ-CHN-12`; SAD §2, §11

## Context

Narthex has a server, a GUI, a CLI, a verify engine, a core model, a knowledge base, skills and the plugin
packaging. They release together and share schemas. specsite is a public tool other projects use, so it stays a
separate repository (`REQ-DOC-14`). Paid sector packs must stay out of the MIT repo (`REQ-KNB-12`).

## Options considered

### A. One repo, npm workspaces, TypeScript project references

- Pro: one clone, one CI, atomic changes across schema and code; npm is already specsite's tool.
- Con: CI must build only what changed to stay fast.

### B. One repo with pnpm or a build orchestrator (Turborepo, Nx)

- Pro: faster installs or cached builds.
- Con: one more tool for contributors; not needed at this size.

### C. Many repos

- Con: version skew between schema and code; harder for a small team.

## Decision (recommendation)

**A.** The layout:

```
apps/
  server/        MCP, API, auth, git-host connectors, publisher, jobs (one process)
  web/           Astro GUI
packages/
  core/          data model, ids, trace graph; no I/O
  verify/        checks and gates; depends on core only
  cli/           `narthex` command: verify, mcp --stdio, watch, publish
  form-adapter/  the store adapters for the form page (browser code)
contracts/       frozen contracts: JSON Schemas, listings, fixtures and conformance suites (data)
kb/              knowledge base, open core (MIT)
skills/          workflow skills, including decision-form (Python)
.claude-plugin/  plugin packaging
deploy/          Dockerfile, compose file, example environment
docs/            architecture and other documents
```

Boundaries:

- `core` depends on nothing of ours. `verify` depends on `core`. `server` and `cli` depend on both.
- Nothing depends on `apps/*`.
- `kb/` is data. Code reads it through `core`'s loader and schemas.
- `contracts/` is data too, at the repo root. The Python form builder and the server both read it, so it does not
  live inside `packages/core`, which stays free of anything of ours.
- Paid packs live in a separate private repository and reach users only through the server (ADR-0013).

## Consequences

- One version number for server, CLI and plugin.
- The four contracts of M0 live in `contracts/` at the repo root, with fixtures and a conformance suite beside each.
  Both the Python builder and the server consume them.
- Contract versions: 0.1.0 when the four are frozen, then 1.0.0, tagged at the M0 exit commit. A change after the
  freeze needs a version bump and a changelog entry.
- The M0 slice builds 10 of the 14 MCP tools. The other 4 follow in M1.
- The existing `skills/` and `.claude-plugin/` directories keep their places.
