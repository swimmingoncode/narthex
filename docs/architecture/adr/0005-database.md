# ADR-0005: PostgreSQL as the one database

- **Status:** accepted by default (form item `adr-0005`, 2026-10-17; Pablo may still object)
- **Date:** 2026-10-17
- **Decision item:** `adr-0005`
- **Concerns:** `REQ-DAT-15`, `REQ-DEC-17`, `REQ-DEC-22`, `REQ-DEC-24`, `INV-2`, `INV-3`, `NFR-5`; SAD §5

## Context

The database is an inbox and an index (`REQ-DAT-15`). It holds accounts, teams, projects, form snapshots, answers
until archived, an append-only event feed for cursors, token hashes, the audit log and a job queue (SAD §5.2).
It needs transactions for the publish lock (`REQ-DEC-22`) and ordered events for incremental reads (`REQ-DEC-24`).
Local mode needs no database at all (SAD §7.1).

## Options considered

### A. PostgreSQL

- Pro: boring, open source, documented; every host offers it managed.
- Pro: transactions, row locks, JSON columns, and a job queue on the same database, so no second service.
- Con: self-hosters run one more container.

### B. SQLite

- Pro: a single file; trivial for self-host.
- Con: one writer at a time; harder to run more than one server instance; a second dialect if hosted uses Postgres.

### C. A document store shaped like the artifact database (for example MongoDB or Firestore)

- Pro: matches the form page's `collection.doc.set` shape.
- Con: weaker transactions for the lock and the ordered feed; Firestore is a closed service.

### D. Both PostgreSQL and SQLite behind an abstraction

- Con: two dialects to test for little gain, since local mode needs neither.

## Decision (recommendation)

**A.** PostgreSQL only, on a current supported major version, for the hosted and self-hosted modes. Use a typed
query builder with plain SQL migrations kept in the repo. Run the job queue on PostgreSQL. Keep the form page's
document shape (`{choice, notes, at, by}`) as row columns so the store adapter maps one to one (ADR-0009).

## Consequences

- One dialect, one backup procedure, one set of migrations.
- Migrations are forward only, each with a tested rollback script.
- The audit log may need partitioning later; not in M0.

## Sources

- PostgreSQL documentation: https://www.postgresql.org/docs/ (general reference; no specific claim relied on)
