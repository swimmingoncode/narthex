# Amendment 0005: spec profiles

**Status:** proposed, not ruled. Nothing here is applied to `SPEC.md`.
**Target:** `SPEC.md` v0.2.0 (0002 to 0004 proposed alongside)
**Date:** 2026-10-17
**Source:** `notes/2026-10-17-intake-spec-profiles.md` (Pablo: the spec format depends on the industry or product
type) and `notes/2026-10-17-research-spec-formats.md`.
**Rulings needed:** `0005-next`, `0005-first`, `0005-normative`, `0005-independence`.

## A1: universal parts

Every profile keeps the parts every surveyed domain asks for, at different strictness:
- stable identifiers;
- invariants;
- amendments;
- decisions as data;
- the trace chain from requirement to implementation to verification, and to hazard where there is one.

New `REQ-CO-24` states them as the core of every profile.

## A2: a profile is data

`REQ-CO-25`: a spec declares `profile` (and, where one applies, `level`) in its front matter. A profile is a
data file in SDD Studio listing:
- the required sections;
- the allowed id families;
- the mandatory attributes per item (e.g. `level`, `verification_method`);
- notation checks (RFC 2119 use, EARS patterns);
- trace rules (every requirement has a verifier; every invariant has a check);
- which artefact is normative (prose, an executable reference, or a formal model);
- the exports (`needs.json`-shaped JSON, ReqIF);
- the gates.

The linter (specsite) and the spec skill enforce it. The profile pins the edition of each standard it cites.

## A3: candidate profiles

1. **product:** SaaS and APIs. Prose with RFC 2119, acceptance criteria as scenarios, OpenAPI linked, scope as
   a pitch.
2. **oss-ledger:** Bloque's case. `product` plus:
   - conservation and atomicity invariants, each with property or simulation tests;
   - a split between project guarantees and operator obligations;
   - an ISO 20022 mapping where relevant.
3. **reg-fintech:** `oss-ledger` plus:
   - a PCI DSS and SOC 2 evidence map;
   - a third-party register;
   - validation independence for models.
4. **protocol:** consensus and BFT systems:
   - a fault model;
   - safety and liveness properties as items;
   - a normative executable reference or formal model;
   - conformance vectors;
   - draft, last-call and final review phases.
5. **safety:** one profile with a level parameter (DAL A–E, ASIL A–D, SIL 0–4, IEC 62304 A–C). It has:
   - EARS notation;
   - a hazard log traced to requirements;
   - per-level objectives (coverage, independence, tool qualification);
   - assessor sign-off records.
   The level comes out of hazard analysis, never chosen at intake. Medical is a variant of it, unless its
   vocabulary diverges.

## A4: chosen at intake

The intake asks:
- the domain;
- the deployment context;
- who is harmed on failure;
- which regulators or customers want evidence;
- open or closed source.

The answers propose a profile, and the lead confirms it on the form as a decision with its rationale. Tailoring
is allowed, and each obligation dropped becomes a decision.

## A5: limits

SDD Studio produces the structure of evidence, not certification. Tools used on safety projects need their own
qualification (DO-330, ISO 26262 Part 8), which SDD Studio does not claim.

## Questions raised

- `0005-next`: is the profile work next, ahead of the other proposed amendments?
- `0005-first`: which profiles ship first?
- `0005-normative`: may a profile make an executable reference or a formal model normative over SPEC.md?
- `0005-independence`: does an agent count as an independent reviewer where a profile requires independence?
- Not asked yet:
  - whether evidence bundles for audits (PCI, SOC 2) are in scope;
  - whether citing secondary guides with pinned editions is acceptable while the primary standards stay
    paywalled.
