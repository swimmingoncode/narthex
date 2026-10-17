# Intake: spec formats differ by industry and product type

2026-10-17. Pablo, in chat with SDD Studio. Research in progress: `notes/2026-10-17-research-spec-formats.md`.

## The idea, as stated

> The first assessment we should do is figuring out the specs format per industry or product type. Not the
> same speccing an open source for fintech (our case) that a sensitive aeronautics BFT system.

Context: an article on Cloudflare and VoidZero's "Void" vibe-coding product
(https://thenewstack.io/cloudflare-voidzero-void-vibe-coding/), about which Pablo says "there's definitely some
place for products like this one". The research summarises it.

## What it means for SDD Studio

Today SDD Studio has one spec format, the one grown on aledgent: a normative SPEC.md with RFC 2119 keywords,
stable identifiers, invariants, numbered amendments, a PLAN with decisions, and decisions as data. It fits an
open-source fintech product. A safety-critical system needs more, for example:

- hazard analysis;
- assurance levels;
- formal models;
- independent verification;
- certification evidence;
- interchange formats.

A SaaS product may need less.

So the spec format becomes a **profile**, chosen at intake:

- **Universal parts:** identifiers, invariants, amendments, decisions as data, traceability.
- **Parts set by the profile:**
  - the notation;
  - the mandatory sections;
  - the verification evidence;
  - the independence of review;
  - change control;
  - the export formats.
- **Who enforces it:** the spec skill and the linter (specsite, the form builder).

This also connects to:
- amendment 0003 (builders working within a core spec);
- amendment 0004 (specsite, and its `needs.json` export, which regulated profiles may require).

## Questions it raises (to the form once the research is in)

1. Is the profile assessment the next piece of work, ahead of the other open amendments?
2. Which profiles come first: open-source fintech (Bloque's), then which?
3. Is a profile chosen once at intake, or can a project mix profiles per component (a ledger core and a
   consensus protocol in one repo)?
4. How far does SDD Studio go for safety-critical work: templates and traceability only, or the evidence a
   certification body accepts?
