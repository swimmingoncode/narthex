# Amendment 0003: builders, discovery and guardrails

**Status:** proposed, not ruled. Nothing here is applied to `SPEC.md`.
**Target:** `SPEC.md` v0.2.0 (0002 proposed alongside)
**Date:** 2026-10-04
**Source:** `notes/2026-10-04-intake-contributors.md` (Pablo's idea and a product designer's recipe),
`notes/2026-10-04-research-design-and-guardrails.md` (SPARC, mapping methods, guardrail tools).
**Rulings needed:** `0003-direction`, `0003-pilot`, `0003-design`, `0003-alarm`. `0003-reference-tool` was answered
in chat on 2026-10-04: the reference tool combined product mapping with SPARC.
**In one line:** SDD Studio also lets non-engineers build products on the core without engineering help.
The core's spec is the norm and runs as checks, and engineers review only when a check fails.

## A1: new parties

§3 gains two parties:
- **Builder:** a non-engineer (operations, product, business) who builds a product or an operation on the
  core through agents. A builder rules on their own product, within the core's spec.
- **Engineer reviewer:** owns a set of the core's identifiers. Paged when a builder's change trips one of
  them; never otherwise in the loop.

The lead stays the owner of the core's spec. `OQ-11` (several answerers) is answered by this structure if
`0003-direction` is adopted.

## A2: module (d), discovery and design: product mapping

New §: **product mapping**, our own method (`notes/2026-10-04-product-mapping.md`). It is not
User Story Mapping or Impact Mapping, and Pablo describes the reference tool as product mapping plus SPARC. A guided flow,
one agent per step, each step with a check that must pass before the next:

1. **Functional archaeology** of what exists: each capability of the core and of existing products, described by
   what it is for and the value it gives, never by how it is built. Written once per platform, kept current.
2. **Product map**: which customer needs the existing products meet, and how well.
3. **Value matrix**: customer needs × components, showing which component creates which value for whom.
4. **Problem descriptor** (the builder's input): target users, their needs and values, distribution channels,
   cost structure and revenue structure, the goal and the appetite, and what is out (no-gos).
5. **Reuse review**: an agent matches the descriptor against the map and the matrix, and lists what can be
   reused, what is missing, and which core `REQ-*`/`INV-*` the product would touch. It refuses to proceed
   while any touchpoint is unknown.
6. **"How it works" page**: a plain-language walkthrough the builder approves before anything is built
   (from SPARC's pseudocode phase).
7. **Product spec**: written in the same format as the core's, citing the core's identifiers, never redefining
   them. Then the usual flow: decide, plan, build, review.

A product that needs the core to change raises a proposal to the core's owners (`propose-upstream`, now also
internal). A builder never amends the core's spec.

## A3: module (e), guardrails

- Each core `REQ-*` and `INV-*` has zero or more **executable checks** (conformance tests, contract tests,
  property tests, policies), each tagged with its identifier. The living docs show "checked by" on each anchor and
  flag an invariant with no check.
- An **alarm** fires on a failed tagged check, a change that touches a core requirement or invariant, or a
  touchpoint the reuse review could not identify.
- **Routing by ownership**, in tiers (`0003-alarm`): green merges on the builder's own approval; amber goes to the
  identifier's owner for review; red blocks and pages an engineer reviewer with the check, the descriptor and
  the diff attached. A running product whose norm changes is held, not only blocked at build time.
- **Golden paths**: templates for common operations on the core keep most builder work green.

## A4: per-step agents

Each step of (d), and of the existing workflow, has a fixed agent brief with the house rules in full and a
machine-checked exit (from SPARC's gates). The `report` step ends with a requirement-to-evidence table.

## Questions raised

- Does this become SDD Studio's v1 (`0003-direction`, which also settles `OQ-1`)?
- Which builder and which product pilot it (`0003-pilot`)?
- Is the product designer's recipe module (d)'s flow (`0003-design`)?
- Are the alarm tiers right (`0003-alarm`)?
- What is the reference tool? Answered by Pablo in chat: product mapping plus SPARC (`0003-reference-tool`).
