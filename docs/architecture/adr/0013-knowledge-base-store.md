# ADR-0013: The knowledge base as versioned files in the repo; paid packs in a separate store

- **Status:** proposed
- **Date:** 2026-10-17
- **Decision item:** `adr-0013`
- **Concerns:** `REQ-KNB-1` to `REQ-KNB-12`, `REQ-ITK-7`, `REQ-DAT-18`, `REQ-IFC-2`, `NFR-7`, R25, R29; SAD §2, §5.1

## Context

The knowledge base holds the method, templates, explanations per experience level, question sets, sector profiles
and golden paths (`REQ-KNB-1`). Every piece is versioned and served one at a time through the MCP
(`REQ-KNB-2`, `REQ-IFC-2`). The open core is MIT (`REQ-KNB-12`). Experts' sector packs are paid and not public
(R29). Every piece carries its class (open standard, supplementary, closed) and label (`REQ-KNB-3`).

## Options considered

### A. Files in the repo, versioned with releases; packs in a private store

- `kb/` holds Markdown with front matter (id, version, class, level, step) and profile data files.
- Each piece is addressed as `id@version`; the version is the release that last changed it, plus a content hash.
- The CLI bundles `kb/` for local use; the server serves the same files.
- Paid packs live in a separate private repository, published to a private store. The server serves a pack's
  pieces only to entitled organisations, through the same MCP tools.
- Pro: reviewable in PRs, like the spec; no database for content. Con: pack delivery needs entitlement checks.

### B. Content in the database, edited in an admin UI

- Con: not reviewable in git; the open core would not be plainly MIT files.

### C. A headless CMS

- Con: a closed or extra service; no gain for content written by agents and reviewed in PRs.

## Decision (recommendation)

**A.** The open core lives in `kb/` in the MIT repo. Paid packs never enter it. Labels and classes are checked by
`verify` against the profile schema, so supplementary material cannot be marked normative (`INV-14`).

## Consequences

- A knowledge change is a PR, reviewed like code.
- Agents cache pieces by `id@version`; an unchanged piece is never sent twice.
- The legal check of `REQ-KNB-7` gates any pack with material from a copyrighted standard.
