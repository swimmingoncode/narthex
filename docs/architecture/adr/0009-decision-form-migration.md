# ADR-0009: Move the decision form to Narthex's host through a store adapter

- **Status:** accepted by default (form item `adr-0009`, 2026-10-17; Pablo may still object)
- **Date:** 2026-10-17
- **Decision item:** `adr-0009`
- **Concerns:** `REQ-DOC-16`, `INV-18`, `REQ-IFC-8`, `REQ-DEC-17`, `REQ-DEC-19`, `REQ-DEC-22`, `NFR-4`, R23; SAD §2, §4.1

## Context

Today the `decision-form` builder writes one self-contained page. Published as a claude.ai artifact, it saves
answers through the artifact's database (`window.claude.use('db')`, a collection of `{choice, notes, at, by}`
documents with a live snapshot listener). Opened elsewhere, it saves in the browser and offers a JSON export.

R23 asks Narthex to generate and host its own pages, with claude.ai as one optional target (`REQ-DOC-16`,
`INV-18`). Both front ends must read and write the same items and answers while both exist (`REQ-IFC-8`).

## Options considered

### A. Keep the builder; add a store adapter seam to its page

The page talks to one small interface: `collection(name).doc(id).set(value)` and `onSnapshot(callback)`. Three
adapters implement it:

- `artifact`: today's `window.claude` database;
- `narthex`: HTTP to the API with the answer token, and a server-sent event stream for live updates;
- `local`: the browser's storage, with JSON export and import (`REQ-DEC-19`).

The builder picks the adapter with a `--target` option. Pro: one page, one builder, small change; stock Python
stays (`NFR-4`). Con: the page stays a single-file app, not part of the GUI's component tree.

### B. Rewrite the form as GUI pages

Pro: one codebase with the inbox. Con: two form implementations during the move; the builder's checks would
need porting; artifacts and static hosts lose their page.

### C. Stay on artifacts, mirror answers into Narthex

Con: fails R23 and `INV-18`.

## Decision (recommendation)

**A**, in four phases:

1. **Seam.** Extract the storage calls in the page into the adapter interface. No behaviour change. The builder's
   component tests cover it.
2. **Narthex target.** `form_publish` runs the builder with `--target narthex` at a commit, stores the snapshot
   and serves the page from the user-content domain. Answers go to PostgreSQL.
3. **Both stores.** While a project still publishes to an artifact too, read-back merges both sources by latest
   `at`, as the builder already merges several archive files. Each answer keeps its source.
4. **Narthex by default.** New projects publish to Narthex. The artifact target stays as an option for local and
   claude.ai-only users.

## Consequences

- The page gets an adapter contract, frozen in M0 (SAD §11.1, `event.schema.json`).
- The GUI's inbox lists forms across projects and opens each form page; it does not re-implement it.
- `REQ-DEC-22`'s publish lock moves from a builder convention to a database lock.

## Sources

- The current page: `skills/decision-form/assets/template.html` (storage code at the end of the file)
- Amendment 0001 and ruling R23: `amendments/0001-own-publishing.md`, `notes/2026-10-17-rulings.md`
