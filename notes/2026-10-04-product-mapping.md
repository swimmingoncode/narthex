# Product mapping, as described to us

2026-10-04. Does the "product mapping" a product designer described (see `notes/2026-10-04-intake-contributors.md`)
match User Story Mapping or Impact Mapping? Pablo, the same day: the reference tool is "essentially the product
mapping + SPARC", and "we're basically inventing methodologies adapted to our flows".

The comparisons with published methods below are from general knowledge of them, not re-checked against sources
for this note.

## The steps, and what each one resembles

| # | Step | What it does | Closest published method |
|---|---|---|---|
| 1 | Functional archaeology | Describes every existing function and component by what it is for and the value it adds, not how it is built | **Function analysis** from Value Engineering (Miles; FAST diagrams: each part as a verb + noun function, weighed by value). Also business capability mapping |
| 2 | Map the existing product | Which customer needs the existing product really meets, and how well | **Jobs-to-be-done outcome scoring** (importance against satisfaction), or a Kano analysis |
| 3 | Needs × components | How each component contributes value to each customer | **Quality Function Deployment's "house of quality"** (needs × characteristics matrix), or the fit side of the Value Proposition Canvas |
| 4 | Ideation, any method | Target customers, needs, values, distribution channels, cost structure, revenue structure | **Business Model Canvas**: these are its customer segments, value propositions, channels, cost structure and revenue streams |
| 5 | Review agent | Checks the new idea against the map, so what is built is reused, not lost | No standard method. Closest: a reuse or gap analysis in enterprise architecture |

## Against the two candidates

- **User Story Mapping (Patton):** a backbone of user activities, broken into stories and sliced into releases. It
  plans a new product's backlog from the user's journey. It has no archaeology of what exists, no value or cost
  view, and no business model. **It matches none of the steps closely**; at most it could follow step 5, to slice
  the build.
- **Impact Mapping (Adzic):** goal → actors → impacts → deliverables. It covers the "why and for whom" of step 4,
  and helps choose what to build. It has no archaeology, no needs × components matrix, and no costs or revenue.
  **A partial match for step 4 only.**

## Conclusion

This product mapping is neither. It composes four older ideas into one flow, in a specific order:

1. value-engineering-style function analysis of what exists;
2. a needs-met map;
3. a needs × components value matrix;
4. a business-model-canvas description of the new idea;
5. a reuse review that ties the new idea back to what exists.

The ordering is the point: understand and value what exists before ideating, so that ideas are built from
existing parts. That is what makes it fit a team building on a rebuilt core. Story mapping and impact mapping
both start from a blank page.

So "the reference tool = product mapping + SPARC" reads, in SDD Studio's terms, as:

- module (d), discovery and design: product mapping, producing a product spec;
- the existing workflow, gated per step as SPARC does: spec → plan → build → review;
- what SDD Studio adds around both: decisions as data, amendments, and the core's spec running as the norm
  (module e).

We are naming our own method, as Pablo says. Proposed name for module (d)'s flow: **product mapping**, defined
by the five steps above, with the problem descriptor as step 4's written output.
