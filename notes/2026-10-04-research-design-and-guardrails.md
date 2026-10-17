# Design/discovery front end and guardrails for non-engineers (2026-10-04)

Context: the product owner wants non-engineers at Bloque (ops, product, business) to build products and operations on a
core platform whose `SPEC.md` is the norm, without engineering help. Engineers are a failsafe that steps in only when an
alarm fires. A contact suggested per-step agents, "problem descriptors", SPARC (development), a "product mapping"
method (design) and a tool that combines the two. Every claim links to a source. **[unverified]** marks
claims from secondary sources, from a fetch that could not confirm the detail, or my own inference.

---

## 1. SPARC (Specification, Pseudocode, Architecture, Refinement, Completion)

**What it is.** A phase method by Reuven Cohen (ruvnet) for AI coding agents, shipped in three forms:

| Form | What it is | License | Signals (fetched 2026-10-04) |
|---|---|---|---|
| `ruvnet/sparc` | Now an "evidence-gated engineering metaharness": a TypeScript state machine that gates each phase on evidence; CLI, Claude plugin and MCP server share one engine | Apache-2.0 | ~477 stars [repo](https://github.com/ruvnet/sparc) |
| `ruvnet/rUv-dev` (`create-sparc`) | Scaffolds Roo Code `.roomodes`: an Orchestrator plus ~15 modes (Specification Writer, Architect, Auto-Coder, Tester (TDD), Debugger, Security Reviewer, Docs Writer, System Integrator, Deployment Monitor, Optimizer, DevOps, Ask, ...) | MIT | ~429 stars [repo](https://github.com/ruvnet/rUv-dev) |
| Ruflo (formerly claude-flow) `ruflo-sparc` plugin | 5 phases with quality gates inside a large multi-agent platform ("100+ agents") | MIT | ~73.8k stars reported on the page **[unverified count]** [repo](https://github.com/ruvnet/claude-flow), [plugin](https://github.com/ruvnet/ruflo/blob/main/plugins/ruflo-sparc/README.md) |

**What each phase produces, and its gate** (Ruflo plugin version) [plugin README](https://github.com/ruvnet/ruflo/blob/main/plugins/ruflo-sparc/README.md):

| Phase | Output | Gate to advance | Agent |
|---|---|---|---|
| Specification | Requirements, acceptance criteria, constraints | ≥3 acceptance criteria, edge cases identified | `researcher` |
| Pseudocode | Algorithm design, complexity notes | Covers all criteria, error paths explicit | `planner` |
| Architecture | Modules, API contracts, ADRs | Constraints addressed, no circular deps | `system-architect` |
| Refinement | Tested code (TDD) | ≥80% coverage, all tests pass | `coder` + `tester` |
| Completion | Final code, docs, deployment checklist | All green, docs complete | `reviewer` |

- Commands: `sparc init | status | advance | phase | report`. `report` emits a **traceability matrix**; gate results are
  kept in memory namespaces (`sparc-state`, `sparc-phases`, `sparc-gates`). [plugin README](https://github.com/ruvnet/ruflo/blob/main/plugins/ruflo-sparc/README.md)
- The `ruvnet/sparc` harness ends Completion with a "rollback plan" and an "exact requirement-to-evidence trace", and
  records evidence without executing acceptance commands itself. [repo](https://github.com/ruvnet/sparc)
- **Agents per phase (Roo Code):** the Orchestrator splits the goal into subtasks and delegates each to a mode as a
  "Boomerang task" in an isolated context that returns a short summary. [rUv-dev](https://github.com/ruvnet/rUv-dev)
- **Open questions / human decisions:** only an "Ask" mode that helps a user phrase requests
  [rUv-dev](https://github.com/ruvnet/rUv-dev); the harness documents no open-question mechanism, only artifact
  submission and gates [sparc](https://github.com/ruvnet/sparc). Ruflo mentions "before-merge gates" but not how they
  work **[unverified]** [ruflo](https://github.com/ruvnet/claude-flow).
- **Maturity:** widely copied as a skill (many `sparc-methodology` forks on skill registries, e.g.
  [skills.sh](https://skills.sh/ruvnet/ruview/sparc-methodology)), but three diverging implementations with different
  phase lists (one variant replaces Pseudocode by a "Review" phase [tessl](https://tessl.io/registry/skills/github/ruvnet/RuView/sparc-methodology)).
  I found no independent evaluation or critique **[unverified absence]**.

**Mapped onto SDD Studio** (idea → research → spec → decide → plan → execute → measure → amend → propose upstream → report):

| SDD Studio step | SPARC | Note |
|---|---|---|
| idea, research | partly in Specification (`researcher`) | no intake or problem framing |
| spec | Specification | per feature, not a project-wide norm |
| decide | none | no decision objects, no inbox, no defaults |
| plan | Pseudocode + Architecture (ADRs) | Pseudocode is a step SDD Studio lacks |
| execute | Refinement (TDD) | comparable |
| measure | coverage gate only | no measurement ledger |
| amend, propose upstream | none (`sparc phase` only jumps back) | no amendment workflow |
| report | Completion + `sparc report` | traceability matrix is worth copying |

**Borrow:** machine-checked phase gates with explicit exit criteria (`advance` fails until met); one named agent role
per phase; a requirement-to-evidence matrix as the closing artifact; **Pseudocode as a plain-language "how it will
work" step**, which a non-engineer can read and approve before any code exists **[inference]**.
**SPARC lacks:** decisions as data (`INV-3`, `INV-7`), amendments to an accepted spec, and invariants as a standing
norm: its gates are per-feature thresholds (≥3 criteria, ≥80% coverage), not checks that a change preserves the
platform's REQ/INV.

---

## 2. "Product mapping" for design and discovery

I found no standard method called "product mapping"; Spanish and English searches return only generic discovery
workshops. The two named "mapping" methods are the most likely referents **[inference; ask the contact]**.

| Method | Artifacts | Who runs it | Feeds a SPEC as |
|---|---|---|---|
| **User Story Mapping** (Jeff Patton) | Backbone of user activities → steps → stories; horizontal **release slices** [jpattonassociates](https://jpattonassociates.com/story-mapping/) | PM, design, devs and stakeholders together | Activities → feature sections; slices → release scope; stories → REQ |
| **Impact Mapping** (Gojko Adzic) | Goal (why) → actors (who) → impacts (behaviour change, how) → deliverables (what) [impactmapping.org](https://www.impactmapping.org/about.html) | Explicitly business users with delivery experts | Goal → §1 purpose + success metric; actors → parties; deliverables → REQ, each traced to a goal |
| **Opportunity Solution Tree** (Teresa Torres) | Outcome → opportunities (needs, pains, desires, from the customer's view) → solutions → assumption tests; needs 3–4 interviews first [Product Talk](https://www.producttalk.org/opportunity-solution-trees/) | The product trio (PM, designer, engineer) | Outcome → measured goal; assumption tests → experiments (`§4.4`) |
| **Design Sprint** (GV) | 5 days: map, sketch, decide, prototype, test with customers [GV](https://www.gv.com/sprint/) | Cross-functional team with a decider | Validated prototype + decisions → spec draft |
| **Shape Up pitch** (Basecamp) | Problem, **appetite**, solution sketch, rabbit holes, **no-gos** [Shape Up ch. 6](https://basecamp.com/shapeup/1.5-chapter-06) | Senior "shapers"; leadership bets | Appetite → budget; no-gos → explicit out-of-scope; rabbit holes → risks |
| **Jobs-to-be-Done** (Ulwick ODI) | Job statement *verb + object + context*; outcome statements *direction + metric + object + context* [Strategyn canvas](https://strategyn.com/wp-content/uploads/2024/06/JTBD-Canvas.pdf), [OpenClassrooms](https://openclassrooms.com/en/courses/4544601-build-a-product-roadmap/4964511-uncovering-customer-needs) | Product or research; writable by anyone | Outcome statements are close to measurable REQ |
| **Lean UX problem statement** (Gothelf) | "[Product] was designed to achieve [goals]. We observed [gap], causing [effect]. How might we improve [it] measured by [criteria]?" [Gothelf](https://jeffgothelf.com/blog/business-problem-statement-opportunity-statement/), [O'Reilly ch. 5](https://www.oreilly.com/library/view/designing-for-product/9781491971451/ch05.html) | A business stakeholder | Framed as a problem, not a solution |
| **Working Backwards PR/FAQ** (Amazon) | One-page future press release + FAQ, before any build [workingbackwards.com](https://workingbackwards.com/concepts/working-backwards-pr-faq-process/) | Business owner | PR → §1; FAQ → open questions |

**Problem descriptors.** The useful common core is a structured problem statement a non-engineer can fill in, which an
agent then checks against the platform spec. A composite, each field from a method above **[inference]**:

| Field | From | Example (fintech ops) |
|---|---|---|
| Actor | Impact Mapping | Ops analyst reconciling payouts |
| Job | JTBD | Confirm every payout settled, same day |
| Current gap and its cost | Lean UX | 2 h/day manual matching; late client notices |
| Outcome metric | OST / ODI | Minimise time to detect an unsettled payout |
| Evidence | OST interviews | 3 tickets, 1 interview, a metric link |
| Appetite | Shape Up | 2 weeks |
| No-gos | Shape Up | Does not move money; no new providers |
| Platform touchpoints | (agent fills) | REQ/INV the solution would read, call or change |

The last row is where the norm enters: the agent maps the descriptor onto the core SPEC before anything is built.

---

## 3. Guardrails: spec as norm for citizen developers

| Pattern | Tool | What triggers the alarm | How it routes |
|---|---|---|---|
| Policy as code | **OPA/Rego**: decision decoupled from enforcement; CI via Conftest, Kubernetes via Gatekeeper; CNCF graduated [OPA docs](https://www.openpolicyagent.org/docs/latest/) | A `deny` on the change's JSON (diff, manifest, config) | Fail the check; owner of the policy reviews |
| Analysable policy | **Cedar** (AWS, Apache-2.0): schema validator, and `cedar-policy-symcc` proves properties with counterexamples [repo](https://github.com/cedar-policy/cedar) | A property such as "no policy lets role X move funds" stops holding | Counterexample attached to the review |
| Contract tests | **Pact** consumer-driven contracts [docs](https://docs.pact.io/); **can-i-deploy** exits 1 if any deployed counterpart is unverified [docs](https://docs.pact.io/pact_broker/can_i_deploy) | A new app breaks the platform API's verified contracts | Deploy blocked; provider team sees the matrix |
| Design by contract | Pre/postconditions and invariants (Meyer, Eiffel) [Wikipedia](https://en.wikipedia.org/wiki/Design_by_contract) | Runtime assertion fails | Error/page, not review |
| Spec → test | **Kiro** extracts properties from EARS requirements and runs property-based tests, keeping a requirement↔test link [Kiro docs](https://kiro.dev/docs/specs/correctness/), [blog](https://kiro.dev/blog/property-based-testing/) | A property derived from a REQ fails | Back to the spec owner |
| Golden paths | **Backstage scaffolder**: a form collects parameters, a template creates the repo or PR [Backstage](https://backstage.io/docs/features/software-templates/); Spotify's "opinionated and supported way" [Spotify](https://engineering.atspotify.com/2020/8/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem) | Leaving the path (no template) | Off-path work gets full review |
| Low-code governance | **Power Platform data policies**: admins sort connectors; violations block save at design time and **quarantine** running apps; enforcement within ~1 h, up to 24 h [Microsoft Learn](https://learn.microsoft.com/en-us/power-platform/admin/wp-data-loss-prevention) | Blocked connector or action, MCP server included | Automatic; admin decides exceptions |
| Low-code + git | **Retool Source Control**: a protected app is edited on branches and reaches production through a PR in GitHub/GitLab [Retool](https://docs.retool.com/source-control/guides/protect/apps-v2); a separate release-approval feature is described only in secondary sources **[unverified]** | Any change to a protected app | Normal PR review |
| AI app builders | **Lovable**: Basic Scan before every publish (RLS, schema, exposed data) returns pass/warning/critical; admins get Workspace Insights and scheduled deep scans [Lovable](https://lovable.dev/blog/enterprise-features-july-roundup), [Lovable security](https://lovable.dev/blog/how-lovable-protects-your-apps-automatically). Bolt and v0 not researched | Critical finding | Publisher fixes; admin dashboard |
| Review routing | **CODEOWNERS** + "require review from Code Owners" (any one owner suffices); rulesets as the newer form [GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) | A PR touches an owned path | Request goes to the owners of that path |

**Alarm triggers, generalised [inference]:** (1) the change edits or relaxes a REQ/INV of the core spec (a spec diff,
not code); (2) an executable check tagged with an INV fails (policy, property, contract, scan); (3) the change touches
a path or capability the core owns; (4) the agent's impact analysis is uncertain (unknown touchpoint). Routing works
best tiered: **green** merges on the citizen's own approval; **amber** needs the owner of the touched REQ (CODEOWNERS
keyed by requirement id, not just path); **red** blocks and pages the on-call engineer with the failing check, the
descriptor and the diff. Power Platform's design-time block plus runtime quarantine is the model for apps already
running when a policy changes.

---

## 4. Implications for SDD Studio

1. **New audience, new party.** §1.3 names one engineer lead. Add a "builder" (non-engineer) and an "engineer
   reviewer"; the inbox already fits builders' product rulings, and reserved items (`INV-4`) become the engineers'.
2. **(a) Discovery module, "intake".** Its unit is the **problem descriptor** (§2 table) on the same form tech as DI.
   Impact Mapping is the best fit for business authors (goal → actor → impact → deliverable, built for business users);
   Story Mapping's release slices then give scope. Confirm with the contact which "product mapping" he meant.
3. **Descriptor → spec is an agent step with a gate**: it fills "platform touchpoints" with REQ/INV ids, writes a
   feature spec that cites the descriptor, and refuses to advance while a touchpoint is unknown.
4. **Borrow SPARC's Pseudocode as a plain-language "how it works" page** the builder approves before build, and its
   requirement-to-evidence matrix as the closing report. Do not adopt its coverage-only gates as the norm.
5. **(b) Guardrails module: every core `INV`/`REQ` gets zero or more executable checks** (OPA/Cedar policy, Pact
   contract, property test, scan), each tagged with the id; LD renders "checked by" on each anchor, and an untested
   INV is itself flagged.
6. **Alarm = a failed INV-tagged check, a spec diff touching core REQ/INV, or an unknown touchpoint.** Route by
   requirement ownership (CODEOWNERS keyed by id), tiered green/amber/red; red pages engineers with check, descriptor
   and diff attached. Running apps get quarantined, not just blocked, when a norm changes.
7. **Builders never amend the core spec.** A change that needs one becomes a "propose upstream" item to the platform
   owners: the existing amendment and upstream-proposal flow, now internal.
8. **(c) Per-step agents with fixed briefs:** intake (descriptor), research, spec writer, impact checker (maps to
   REQ/INV, runs checks), planner, builder agents in worktrees, reviewer (adversarial, already lesson L1), reporter.
   Each phase has a machine-checkable exit like `sparc advance`, and the house rules ride in every brief.
9. **Golden paths first:** templates for the common Bloque operations (Backstage-style forms that open a PR) keep most
   builder work green; anything off-path is amber by default.
