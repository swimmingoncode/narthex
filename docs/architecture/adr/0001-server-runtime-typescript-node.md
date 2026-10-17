# ADR-0001: TypeScript on Node.js for the server side

- **Status:** accepted by default (form item `adr-0001`, 2026-10-17; Pablo may still object)
- **Date:** 2026-10-17
- **Decision item:** `adr-0001`
- **Concerns:** `REQ-IDN-8`, `REQ-IFC-1`, `REQ-DOC-13`, `NFR-4`; SAD §2, §7

## Context

Narthex needs a server (MCP, API, auth, git-host connectors, jobs), a web GUI, a CLI and a verify engine that runs
in CI. Two components exist: the form builder in stock Python (`NFR-4`), and specsite in TypeScript on Astro and
Starlight. The team is small. The code is MIT and should be easy for outside contributors to read and run.

## Decision drivers

- One language for the server, the GUI and the CLI, so one person can work across them.
- A first-class MCP SDK.
- Reuse of specsite without a process boundary.
- Easy self-hosting and an easy `npx` path for local use.

## Options considered

### A. TypeScript on Node.js (LTS)

- Pro: the same stack as specsite and Astro; the renderer is a library call, not a subprocess.
- Pro: the official MCP TypeScript SDK supports stdio and Streamable HTTP (SDK README).
- Pro: `npx` gives a no-install path for the CLI and the local MCP server.
- Pro: one type system shared by server, GUI and schemas.
- Con: the Python builder stays a second language (see the decision).
- Con: Node's dependency trees are large; supply-chain care is needed (lockfile, pinned versions, audit in CI).

### B. Python (for example FastAPI)

- Pro: matches the builder; an official MCP Python SDK exists.
- Con: specsite and the GUI stay in TypeScript, so two stacks either way, with the renderer behind a subprocess.

### C. Go

- Pro: one static binary; low memory.
- Con: no reuse of specsite or the GUI code; a third language.

### D. Bun or Deno

- Pro: faster start, built-in TypeScript.
- Con: less boring; Astro and the MCP SDK are documented first for Node. Compatibility would need checking (*unverified*).

## Decision (recommendation)

**A.** Use TypeScript on the current Node.js LTS line for the server, the GUI, the CLI and the verify engine. Pin
the major version in `.nvmrc` and `engines`; specsite already needs Node 22.12 or later. The release page lists
Node 24 as LTS on 2026-10-17; check the schedule when M0 starts.

Keep the form builder in stock Python. The server calls it as a subprocess, so there is one builder and no drift.
A TypeScript port happens only if the builder becomes a bottleneck, and only behind the shared conformance
fixtures of SAD §11.

## Consequences

- The container image carries Node.js and Python 3.
- The builder's input and output are frozen as schemas (SAD §11.1) so both languages agree.
- Contributors need Node.js; Python is needed only to build forms.

## Sources

- Node.js releases: https://nodejs.org/en/about/previous-releases
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- specsite README (Node 22.12 or later): https://github.com/swimmingoncode/specsite
