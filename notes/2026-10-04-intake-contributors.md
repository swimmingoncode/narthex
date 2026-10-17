# Intake: anyone can build on the core, with the spec as the norm

2026-10-04. Pablo, after a conversation with a product designer.
Research: `notes/2026-10-04-research-design-and-guardrails.md`.

## The idea, as stated

> A system that not just resolves the ideal flow for agents to develop, but also responds to the spec as
> norm, and above that we can enable engineers and non-engineers alike to contribute on our core and the
> products on top of it.

The context, from Pablo's side of the conversation:

- Bloque is rebuilding its core. The method in this repo holds up for that work.
- The goal is to leave the base services in place and let the team, above all its non-technical members,
  build the whole operations layer on top of the core without engineering assistance.
- Engineers become a failsafe: if an alarm fires (something would break a requirement or an invariant of
  the core), they step in as reviewers.
- The missing part is design. Pablo did the core's functional archaeology and design himself; now the
  team has to be able to do it.
- The core rebuild's result, as Pablo states it: from about 1.5 tps with a 50% failure rate to about
  1,600 tps with under 2% failures (still to improve).

The method discussed, in short (paraphrased; it became Narthex's own **product mapping**, see
`notes/2026-10-04-product-mapping.md`):

1. **Functional archaeology.** An agent describes every function, method and component of what already exists,
   from a purely functional, non-technical point of view: what it is for, and what value it contributes.
2. **Product map.** It shows which customer needs the existing product really meets well.
3. **Needs × components matrix.** How each component contributes to value for each specific customer. Left as
   documentation.
4. **Ideation, with any method,** as long as it yields a problem descriptor: target users or customers, their
   needs, their values, the distribution channels, the cost structure and the revenue structure.
5. **Reuse review.** Another agent reviews the map of what exists against the ideation, so that what is already
   built gets reused rather than lost.

Two further points: one agent per step, and a good product map plus something at least partly tested before
spending tokens at scale. SPARC was named for development and a product-mapping method for design.

## What changes for SDD Studio

Today's spec serves one lead directing agents (§1.3). The idea adds two parties and two modules:

| | Today (v0.2.0) | With this idea |
|---|---|---|
| Who builds | The lead, through agents | The lead, engineers, and non-engineers (ops, product, business) |
| Who rules | The lead | The lead for the core; product owners for their own products, within the core's spec |
| Front of the method | Idea → research → spec | Problem descriptors → product map → spec of the product, checked against the core's spec |
| What the spec is | A document agents follow | Also a norm that runs: core requirements and invariants become checks |
| Engineers' role | Directed by the lead | Failsafe reviewers, paged when a check fails |

Two candidate modules:

- **(d) Discovery and design.** A guided flow, run by agents, following the product-mapping method: functional
  archaeology of what exists (each capability described by the value it gives), a product map of needs met,
  a needs × components value matrix, then ideation written as problem descriptors (users, needs, values,
  channels, costs, revenue), and a review agent that matches the new idea against what exists before any
  spec is written. The output is a product spec that builds on the core's identifiers rather than
  redefining them. The core's functional archaeology already exists in Pablo's head and the core's spec;
  writing it down is the first deliverable.
- **(e) Guardrails.** The core's `REQ-*` and `INV-*` as executable checks (conformance suite,
  policies, contract tests). A product change that fails one cannot proceed; it raises an alarm to the
  engineers who own that identifier, and becomes an item on their form.

## Questions this raises

These will become form items once the research is in, consolidated per the experiment rule.

1. Is this SDD Studio's main direction (v1 for Bloque's whole team), or a second product on top of it?
   It decides `OQ-1`.
2. Who is the first non-engineer user, and what is the first product they build on the core?
3. How much of the core's spec can be executable checks today (conformance suites exist on Kippu and
   aledgent)?
4. Who answers a product's decision form: its product owner, with the lead only for core-touching items?
   This revisits `OQ-11` (several answerers).
5. Which design method: a product-mapping method, story mapping, impact mapping, or our own "problem
   descriptor" format?
6. Do we ask the contact about the reference tool before designing module (d)?
