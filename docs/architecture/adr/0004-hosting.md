# ADR-0004: Host the service on one rented server in the EU, as containers

- **Status:** proposed
- **Date:** 2026-10-17
- **Decision item:** `adr-0004` (no default: cost and hosting style are the lead's call)
- **Concerns:** `REQ-IDN-8`, R27; SAD §7, §9

## Context

Swimming on Code runs Narthex as a hosted service (R27). Self-hosting must stay possible (`REQ-IDN-8`). The team is
small, the company is not funded (R24), and prices are open until after the Bloque pilot (`OQ-3`). The service is
one process plus PostgreSQL and page storage (SAD §7.2). It holds no user code.

## Options considered

### A. One rented virtual server (for example Hetzner Cloud) running the same containers as self-host

- Pro: cheapest at small scale. A rough figure is €10 to €40 a month with backups (*unverified estimate*).
- Pro: the hosted service is literally the self-host package, so self-hosting is always tested.
- Pro: EU data centres are available (Germany, Finland), which keeps EU data rules simple; US sites exist too.
- Con: we run the operating system, updates, backups and TLS. A small deploy tool and managed backups reduce this.
- Con: one server is one point of failure until a second is added.

### B. A platform as a service (for example Fly.io, Render, Railway) with managed PostgreSQL

- Pro: less operations work; deploys from the repo; managed database backups.
- Con: higher monthly cost as usage grows; each platform has its own config (mild lock-in).

### C. Serverless at the edge (for example Cloudflare Workers with their database)

- Pro: near zero cost when idle; global.
- Con: a different runtime from self-host, so two code paths; long HTTP streams and Python subprocesses do not fit.

### D. A large cloud (AWS, Google Cloud, Azure) with managed containers and database

- Pro: every managed service; familiar to many teams.
- Con: the most expensive and most complex for a small team; easy to overspend.

## Decision (recommendation)

**A**, one rented server in the EU running the container image of SAD §7.2, with managed snapshots and daily
database backups copied off the server. Move to B or add a second server when uptime needs or load justify it;
the containers move unchanged.

Opening the hosting account and paying for it is an outward action. It needs its own `act` item when M0 is ready
to deploy (`INV-4`).

## Consequences

- We write and test a runbook for updates, backups and restores before the first user (`REQ-CHN-14`).
- Self-hosters get the same compose file we run.
- Cost stays visible: one bill, one server.

## Sources

- Hetzner Cloud (locations; prices not read): https://www.hetzner.com/cloud
- Business-model note, ranked option 1: `notes/2026-10-17-business-models.md`
