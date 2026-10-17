---
name: Narthex (codename)
summary: Tools and a knowledge base that turn a user's agentic system into a senior software architect. It guides people from a product specification through requirements, architecture, construction, verification, release and evolution, with decisions as data, living documents, and checks that run in CI.
spec_version: 0.3.1
status: draft
date: 2026-10-17
rewrite_of: SDD Studio SPEC v0.2.0
amendments: none
---

# Narthex: system specification

## 0. How to read this document

This document specifies Narthex: what it does, what it guarantees, and to whom. It is normative. It does not
say how Narthex is built. `OVERVIEW.md` is an informative digest, `REFERENCES.md` lists the external sources,
and `notes/` holds the research.

Narthex is a codename (R1). The final name is open (`OQ-1`).

This version rewrites SDD Studio's SPEC v0.2.0 once, as Pablo allowed on 2026-10-17 (R18). It reflects rulings R1 to R22 of that day. It folds in
amendments 0001 to 0005, the research in `notes/`, and Pablo's product definition of the same day. Appendix A
maps every old identifier to its new one. Amendments to this version start again at 0001 (R19). The old ones
are kept in `history/amendments-v0/`.

### Sections

| Section | Question it answers |
|---|---|
| §1 Purpose and scope | What problem Narthex solves, for whom, and where its boundary is |
| §2 Glossary | What each term used normatively means |
| §3 Parties | Who interacts with Narthex, with which powers, at which experience level |
| §4 The chain | The steps from a product specification to evolution, and the gate of each |
| §5 Intake and profiling | How users and projects are profiled, and how guidance follows the profile |
| §6 Data model | The project layout, identifiers, item types, trace links, decisions, profiles, exports |
| §7 Capabilities | What each part of Narthex does, one subsection each |
| §8 Invariants | What is true at all times |
| §9 Non-functional requirements | Concision, phone use, dependencies, language, token budget |
| §10 Deferred scope and non-goals | What is out, and why |
| §11 Open questions | What is undecided, and what each question blocks |
| §12 Traceability | Which requirements serve which step of the chain |
| §13 Assumptions | Recommended options folded in without a ruling, so Pablo can overturn them |
| Appendix A | Where each identifier of v0.2.0 and of amendments 0001 to 0005 went |

### Citations

| Mark | Meaning |
|---|---|
| `(R12)` | Ruling R12 of 2026-10-17, in `notes/2026-10-17-rulings.md`. Binding |
| `(product definition review)` | Pablo's product definition of 2026-10-17, as restated in `notes/2026-10-17-product-definition-review.md` §1. Binding |
| item `oq-3` | An answer archived in `decisions/responses/`. Binding when it is a ruling |
| `(Pablo, 2026-10-07)` | A standing ruling recorded in `ADOPTING.md` §8 or in `skills/decision-form/references/item-format.md` |
| `(ASM-4)` | The requirement rests on assumption ASM-4 (§13): a recommended option nobody has ruled yet. One answer can overturn it |
| `(provisional, OQ-8)` | The text states the recommended option of open question `OQ-8`. It stands only until `OQ-8` is ruled |

### Normative language

MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are used as in RFC 2119, and only in numbered requirements,
invariants and tables marked normative. Prose explains; it does not bind.

### Identifiers

| Prefix | Meaning |
|---|---|
| `STEP-*` | A step of the chain (§4.1) |
| `XC-*` | An activity that runs across the chain (§4.2) |
| `REQ-CHN-*` | The chain and its gates (§4) |
| `REQ-ITK-*` | Intake and profiling (§5) |
| `REQ-DAT-*` | Data model (§6) |
| `REQ-KNB-*` | Knowledge base and sector profiles (§7.1) |
| `REQ-DEC-*` | Decisions (§7.2) |
| `REQ-DOC-*` | Living documentation (§7.3) |
| `REQ-SKL-*` | Workflow skills, briefs and house rules (§7.4) |
| `REQ-EXP-*` | Experiments (§7.5) |
| `REQ-VER-*` | Verification and guardrails (§7.6) |
| `REQ-IDN-*` | Integrations and identity (§7.7) |
| `REQ-IFC-*` | Interfaces (§7.8) |
| `REQ-TEM-*` | Multiple teams and access control (§7.9) |
| `INV-*` | Invariant that MUST hold at all times |
| `NFR-*` | Non-functional requirement |
| `DEF-*` | Deferred scope |
| `OQ-*` | Open question. Its form item is `v3-oq-N` (`OQ-4` is item `v3-oq-4`) |
| `ASM-*` | Assumption (§13) |

These identifiers name Narthex's own requirements. The identifiers a project keeps in its own documents are
part of the data model (§6.3).

Every family starts at 1 in this version. An identifier is stable: it is never renumbered, and a withdrawn one
is never reused. A gap in a sequence means a withdrawal recorded in an amendment. An identifier without a
version means v0.3.0. An identifier of the old specification is cited with its version, as `v0.2.0 OQ-4`,
because `INV-*`, `NFR-*`, `DEF-*` and `OQ-*` kept their prefixes and restarted.

---

## 1. Purpose and scope

### 1.1 The premise

In the myth, Prometheus carried fire from the gods to mankind inside a narthex, the hollow stalk of the giant
fennel. Here the fire is the ability to produce software at production scale. Narthex is the vessel that
carries it: the method, the knowledge and the checks of a senior software architect, placed inside the agents
people already use.

The codename has a second meaning (`notes/2026-10-17-codenames.md`). In a church, the narthex is the entrance
hall where catechumens stood: converted, not yet baptised. Narthex's users are people turned toward software
engineering who have not yet graduated, and engineers who want the discipline applied the same way every time.

### 1.2 The problem

Agents write code fast for anyone who asks. Production software needs more than code: requirements,
architecture, security, verification, operations, and a record of every decision. Three projects run with
agents in 2026-09 and 2026-10 (aledgent, Kippu and usage subscriptions; private use-case reports) showed where
work breaks without a method:

- **Decisions get lost in chat.** Long replies pile up faster than the owner reads them. Rulings given in chat
  are not data.
- **Answers don't flow back.** Without a structured store, each answer is copied by hand into the spec, the
  plan and the briefs.
- **Documents drift from decisions.** Nothing links a requirement to the decisions that shaped it.
- **House rules leak.** One wrong line in a brief (a committer identity override) propagated to 224 commits
  before anyone noticed.
- **Steps get skipped.** Nobody asks for architecture, a threat model, validation or a runbook unless they know
  the chain. A non-engineer doesn't know to ask (`notes/2026-10-17-product-definition-review.md` §2).

### 1.3 What Narthex is

Narthex is a set of tools and a knowledge base. Together they turn a user's agentic system into a senior
software architect (product definition review). An agentic system is one AI agent, or several, working for the user through a harness
such as Claude Code. The architect:

1. guides engineers and non-engineers through requirements engineering, with a clear process for iterative
   refinement: proposals, RFCs and amendments;
2. steers one agentic team, or several, through software engineering, with a standard or a custom methodology;
3. keeps that methodology as skills and context prompts that the teams share in common storage (R10);
4. works with code, low-code or no-code, chosen per component (R11).

Narthex has nine capabilities, specified in §7:

| § | Capability | In one line |
|---|---|---|
| 7.1 | Knowledge base and sector profiles | The method, templates and sector material the architect draws on |
| 7.2 | Decisions | Every question for a person is an item, answered in a UI and read back as data |
| 7.3 | Living documentation | Documents rendered from the repo, with anchors, backlinks and checks |
| 7.4 | Workflow skills | One skill per step, carrying the house rules into every brief |
| 7.5 | Experiments | Bounded trials whose questions stay out of the owner's inbox |
| 7.6 | Verification and guardrails | Deterministic and AI-assisted checks, locally and in CI |
| 7.7 | Integrations and identity | User-owned repos on GitHub, GitLab or Codeberg; short-lived credentials; verifiable commits |
| 7.8 | Interfaces | An MCP server and a web GUI |
| 7.9 | Multiple teams | Ownership, routing and access control across teams |

The architect runs inside the user's own agent. Narthex supplies knowledge, structure and checks through an
MCP server and a web GUI (R3, R8). Narthex has no natural-language agent of its own in v1 (R9). The user's
agent is the natural-language layer.

### 1.4 The product specification is an input

The product specification is the most important input (R5). It says what product the user wants and why.
Narthex defines its minimum contract (R14, §4.3). Producing it is out of scope: that is a complementary product
in the same chain, such as product mapping or an AI-assisted design sprint (PD, R5). Narthex still supplies the
knowledge the user's agent needs to steer a user toward a proper product specification, and the depth of that
guidance follows the user's experience (R5, §5.3).

### 1.5 Who it is for

First customers, in this order (R12):

1. **Bloque's teams.** Not all of their members are software engineers.
2. **Individual engineers of any discipline:** a civil engineer, a self-taught coder, a software engineer.
3. **Software factories and consultants, last.** They bring the most variability and need Narthex least. They
   can read the book (R6).

Bloque's teams come first, so organisations, teams and role-based access are in v1 (§7.9).

### 1.6 In scope

- Guiding a project through the chain (§4), from an accepted product specification to evolution after release.
- Profiling users and projects, and adapting guidance to them (§5).
- The knowledge base and sector profiles (§7.1).
- Decisions as data, answered in a UI (§7.2).
- Living documents rendered from the repo (§7.3).
- Workflow skills, house rules and experiments for the user's agents (§7.4, §7.5).
- Checks, locally and in CI (§7.6).
- Integration with the user's git host, identity and access (§7.7, §7.9).
- An MCP server and a web GUI (§7.8).

### 1.7 Out of scope

- Producing the product specification (R5, `DEF-1`).
- A natural-language agent of Narthex's own (R9, `DEF-2`).
- Writing the product's code. The user's agents do that; Narthex briefs, checks and records.
- General project management: sprints, estimates, time tracking. Linear or GitHub keep that.
- Certifying a product, or qualifying a tool, for a regulated use (ASM-29).
- A general-purpose wiki.

### 1.8 Standing conditions

- Every project lives in a git repository the user owns, and git is the record of every document (R7).
- The user's agents run in a harness that can reach an MCP server. Claude Code is the first harness supported;
  others follow through the Agent Skills format (ASM-40).
- Narthex's code and documents are released under the MIT licence, with copyright "Pablo Dorado" until the
  company is incorporated (item `oq-3`, 2026-10-12).
- The decision form exists today as a claude.ai artifact built by the `decision-form` skill. Narthex's web GUI
  takes over that role (R3). Until it exists, the artifact is the UI.

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **Agent** | An AI session working for a user under a brief |
| **Agentic system** | One agent or several, working for a user through a harness |
| **Agentic team** | The agents one person directs on a project |
| **Harness** | The program an agent runs in, such as Claude Code or Claude Desktop |
| **MCP** | The Model Context Protocol, through which an agent calls a server's tools and reads its resources and prompts |
| **Architect** | The role Narthex gives the user's agent: a senior software architect guiding the chain |
| **Organisation** | The account that holds teams, the shared methodology store and the default sector profile |
| **Team** | A group of people and their agents that owns a set of identifiers |
| **Project** | One product or core, in one repository, with one decision form |
| **Component** | A part of a system with its own interface and contract, built by code, low-code or no-code |
| **Low-code, no-code** | Building a component by configuring a platform, with little or no code written by hand |
| **Product specification** | The input that says what product is wanted and why (§4.3). Also "product spec" |
| **SRS** | Software requirements specification: the project's `SPEC.md`, with requirements, invariants, acceptance criteria and a threat model |
| **SAD** | Software architecture document: components, interfaces, data model, deployment, allocation of requirements |
| **ADR** | Architecture decision record: one architecture decision with its context, options and consequences |
| **Threat model** | Abuse cases, data classification and threats, each mitigated by a requirement or accepted by a decision |
| **TDD, BDD, SPARC** | Construction methods: test-driven development; behaviour-driven development; SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) |
| **Verification** | Showing the system was built right: against the SRS |
| **Validation** | Showing it is the right system: against the product specification |
| **Check** | A rule run against the repo: deterministic (a script decides) or AI-assisted (a model reviews) |
| **Evidence** | The recorded result of a check or review, tied to a commit and the identifiers it covers |
| **Gate** | The set of checks and decisions that must pass before a step's outputs are accepted |
| **Trace link** | A typed link between two identifiers, such as a requirement and the check that verifies it |
| **Sector profile** | A data file that sets the sections, notation, trace rules, evidence and gates for a domain (§6.6). Also "profile" |
| **Experience level** | How much engineering experience a user has: newcomer, practitioner or professional (§3.3) |
| **Guidance level** | How much the architect explains and asks, set by the experience level (§5.3) |
| **Knowledge base** | The methodology, templates, explanations, question sets and sector material Narthex serves (§7.1) |
| **Supplementary material** | Checklists, mappings and guidance that help apply a standard. Never normative (R4) |
| **Our standard way** | Narthex's own method for a topic where no standard is available to ship (R4) |
| **Golden path** | A template for a common change that keeps a builder's work inside the checks |
| **Lead** | The person who owns the rulings of a project. Also "the owner" |
| **Item** | One entry on the decision form: a question, an action, agent work, something to read, an update, or a parked topic |
| **Decision** | An item of kind `decide` |
| **Answer** | A chosen option and/or free-text notes on an item, with who gave it and when |
| **Default** | The option an item is treated as having while unanswered, shown as "Default applied" |
| **Reserved item** | An item for an outward action, a security trade-off or a product ruling the lead keeps. It can have no default |
| **Inbox** | The items still waiting for a person |
| **Outbox** | The answered and superseded items, each shown with its original question |
| **Queue** | The agent's own work, in order, shown on the form so people can see and reorder it |
| **Ruling** | An answer that changes the spec, the plan or the way of working |
| **Relayed ruling** | A ruling given outside the form (in chat, a meeting, another session), recorded as an answered item with its source |
| **Amendment** | A numbered document that applies rulings to a spec |
| **Anchor** | A stable URL fragment that identifies one identifier or heading in a rendered document |
| **Backlink** | A link from a document anchor back to the items, amendments and checks that reference it |
| **Edition** | A rendered copy of a document (single HTML file, PDF) generated from one commit |
| **Brief** | The instructions an agent starts from: house rules, the task, and its context |
| **House rules** | The standing rules every agent obeys: identity, pushes, scope, reporting |
| **Experiment** | Bounded work that tries one shape of a solution (§7.5). Its questions and draft changes stay in its own log until it ends |
| **Outcome** | The one-page result of an experiment: adopt, adapt or drop, with measured numbers |
| **Promotion** | Moving an adopted or adapted outcome into the project's record |
| **Outward action** | Anything visible outside the owner's private space: a push, a PR or issue on another party's repo, a message, a publication, a release, a payment |
| **Monitor** | A background watcher in the harness that wakes the agent when something changes (R22) |
| **Channel** | Any path that brings a person's answer to the agent without the agent asking: a plugin hook or a monitor (§7.2.6) |
| **Alarm** | A signal that a change trips a check or touches an identifier someone else owns (§7.6) |

---

## 3. Parties

### 3.1 People and agents

| Party | Who | Can | Cannot |
|---|---|---|---|
| Lead | The owner of a project's rulings, or of a core spec others build on | Answer and re-answer items; approve outward actions; rule on the spec; confirm profiles; publish | The lead is bound by the house rules and has no further limit |
| Engineer | A team member who owns identifiers and directs an agentic team | What the lead can, within the identifiers the team owns (R10) | Rule on identifiers another team owns |
| Builder | A non-engineer (operations, product, business) who builds a product or an operation through agents, by code, low-code or no-code (R11, R12) | Rule on their own product, within the specs it builds on | Amend a spec they don't own; they raise a proposal to its owner instead (`REQ-TEM-7`) |
| Engineer reviewer | An engineer who owns a set of identifiers | Review a change that trips one of them (`REQ-VER-7`) | They are asked for nothing else |
| Product-spec owner | Whoever owns the product specification: often the lead or a builder | Answer gap items (`REQ-CHN-5`); record validation (`REQ-CHN-13`) | Rule on the SRS, unless they are also its lead |
| Orchestrating agent | The user's main agent on a project | Write items; build and publish the form after approval; read answers; apply rulings through amendments; dispatch agents | Answer items; take an outward action without an explicit answer |
| Worker agent | An agent on one task under a brief | Raise items; open PRs on the project repo | Edit `SPEC.md` or `PLAN.md`, or merge, unless the task says so; push to a protected or upstream repo |
| Viewer | Anyone given a read link | Read a shared form or document | Answer |

### 3.2 Teams and organisations

An organisation holds one or more teams, the shared methodology store and a default sector profile. A team
owns a set of identifiers in one or more projects. In v1, one organisation has several teams working on one
shared spec (ASM-1). Several organisations sharing one spec is deferred (`DEF-11`).

### 3.3 Experience levels

Intake places each person at one of three levels (R2, ASM-51). The level sets the guidance (§5.3). It never
changes a gate (`INV-12`).

| Level | Who | Example |
|---|---|---|
| `newcomer` | No engineering training; little or no git. R2's "casual vibe-coder" | An operations analyst building an internal tool |
| `practitioner` | An engineer of another discipline, or a self-taught coder | A civil engineer automating a calculation (R12) |
| `professional` | A software engineer | A backend engineer at Bloque |

---

## 4. The chain

The chain is the path from a product specification to a system in production and its evolution (R15). It
follows the core of ISO/IEC/IEEE 12207 and SWEBOK, and names the steps a non-engineer would not know to ask
for (`notes/2026-10-17-product-definition-review.md` §2).

```
product specification (input, §4.3)
  → STEP-1 requirements engineering  → SRS (with threat model)
  → STEP-2 architecture and design   → SAD + ADRs
  → STEP-3 construction              → code or low/no-code components, per milestone
  → STEP-4 verification & validation → evidence
  → STEP-5 release and operations    → runbooks, SLOs
  → STEP-6 evolution                 → amendments, migrations  ↺ back to STEP-1 or STEP-2
  across every step: XC-1 decisions · XC-2 measurement · XC-3 compliance evidence · XC-4 lessons
```

### 4.1 Steps

#### `STEP-1` Requirements engineering

- **Purpose:** turn the product specification into an SRS the team can build and verify against.
- **Inputs:** the product specification; the project's sector profiles and the user's experience level (§5);
  the knowledge base.
- **Activities:** check the input contract; elicit and refine requirements with the product-spec owner; model
  threats; write acceptance criteria; raise each open question as an item.
- **Outputs:** the SRS: requirements, invariants, acceptance criteria, non-functional requirements, the threat
  model, assumptions and open questions. Gap items for the product-spec owner.
- **Gate:** every element of the input contract is present, or its gap is an item; the SRS passes its profile's
  checks; every requirement traces to its source; every threat is mitigated or accepted; the lead accepts the SRS
  on the form.

#### `STEP-2` Architecture and design

- **Purpose:** decide how the system meets the SRS, before construction.
- **Inputs:** the SRS and its threat model.
- **Outputs:** the SAD and the ADRs: components, interfaces and contracts, the data model, a deployment view,
  the security architecture, and the build mode of each component.
- **Gate:** every requirement is allocated to a component; every architecture decision is an ADR linked to its
  decision item; the threat model is revisited against the design; the contracts of the first milestone are
  frozen.

#### `STEP-3` Construction

- **Purpose:** build the system, one milestone at a time.
- **Inputs:** the SRS, the SAD and the ADRs.
- **Activities:** plan features, tasks and milestones; dispatch one agent per feature; build by the milestone's
  method (TDD, BDD, SPARC, or the project's own); review each change.
- **Outputs:** `PLAN.md`; code, or configured low-code and no-code components; tests and checks tagged with the
  identifiers they verify; pull requests.
- **Gate, per change:** CI passes; review findings are resolved; the change traces to the identifiers it
  implements.

#### `STEP-4` Verification and validation

- **Purpose:** show that the system was built right (verification, against the SRS) and that it is the right
  system (validation, against the product specification).
- **Inputs:** the release candidate at a named commit; the checks; the product specification.
- **Outputs:** evidence: a requirement-to-evidence table, and a validation record.
- **Gate:** every requirement and invariant has at least one verifier with a passing result at the candidate
  commit; the product-spec owner records validation on the form. A non-engineer can judge validation.

#### `STEP-5` Release and operations

- **Purpose:** put the system in production and keep it there.
- **Inputs:** the verified and validated candidate; the SAD's deployment view.
- **Outputs:** a release record; runbooks; SLOs; the signals that measure them; incident-response contacts.
- **Gate:** each production component has its runbook, SLOs, signals and contact; the lead answers the release
  item explicitly, because a release is an outward action.

#### `STEP-6` Evolution

- **Purpose:** change the system safely after release.
- **Inputs:** change requests, incidents, lessons and measurements.
- **Outputs:** amendments to the SRS; new or superseded ADRs; migration plans for code and data; deprecation
  notices.
- **Gate:** an impact analysis lists every identifier the change touches; a change to stored data has a
  migration plan with a rollback; the amendment is ruled before it is applied.

### 4.2 Across every step

| ID | Activity | What it does |
|---|---|---|
| `XC-1` | Decisions | Every question that needs a person becomes an item (§7.2) |
| `XC-2` | Measurement | Every number cites the run that produced it; a gate that relies on a number cites its run |
| `XC-3` | Compliance evidence | Each gate stores the evidence its profile asks for, at the step that produces it (R15) |
| `XC-4` | Lessons | Each milestone ends with a retrospective; lessons that change the method go to the methodology store |

### 4.3 The product specification contract

Normative. A product specification accepted by `STEP-1` has these elements (R14). Each element MAY be answered
"unknown" by the product-spec owner; the SRS then records it as an assumption.

| Element | Content |
|---|---|
| Problem descriptors | Target users; their needs and values; distribution channels; cost structure; revenue structure |
| Goals and non-goals | What the product must achieve, and what it will not do |
| Product map | Which needs existing products already meet, and how well. "None" when nothing exists yet |
| Success measures | How the owner will know the product works |
| Constraints | Including the sector, deadlines, budget, and the platforms it must run on |
| Open questions | What the owner knows is undecided |

### 4.4 Requirements

| ID | Requirement |
|---|---|
| `REQ-CHN-1` | Narthex MUST guide each project through `STEP-1` to `STEP-6` (R15). Steps MAY repeat per milestone, and one part of a system MAY be at a later step than another. |
| `REQ-CHN-2` | A step MUST NOT start for a part of the system whose previous gate has not passed, unless the lead records the exception as an answered decision. |
| `REQ-CHN-3` | Each gate MUST combine deterministic checks where a rule can decide, AI-assisted reviews where judgement helps, and a decision item where a person must judge (§7.6). |
| `REQ-CHN-4` | The lead MAY tailor the chain for a project: merge, skip or reorder steps. Each tailoring MUST be an answered decision with its rationale (ASM-28). |
| `REQ-CHN-5` | `STEP-1` MUST check the product specification against §4.3 (R14). Each missing or unclear element MUST become an item routed to the product-spec owner. |
| `REQ-CHN-6` | Every requirement in the SRS MUST trace to an element of the product specification, or be marked as derived from another requirement, a threat, a hazard or a profile obligation. |
| `REQ-CHN-7` | `STEP-1` MUST produce a threat model: abuse cases, data classification, and threats by STRIDE category unless the profile names another method (ASM-3). Each threat MUST be mitigated by a requirement or accepted by a reserved item. `STEP-2` MUST revisit it against the design. |
| `REQ-CHN-8` | `STEP-2` MUST produce a SAD with: components; interfaces and contracts; the data model; a deployment view; the security architecture; and the allocation of every requirement to components. |
| `REQ-CHN-9` | Each architecture decision MUST be an ADR with its context, options, decision and consequences, linked to the decision item that ruled it. |
| `REQ-CHN-10` | The SAD MUST name each component's build mode: code, low-code or no-code (R11). A component's spec and contract MUST be the same whatever builds it. |
| `REQ-CHN-11` | The plan MUST name the construction method of each milestone: TDD, BDD, SPARC, or a method the project defines. |
| `REQ-CHN-12` | The plan SHOULD freeze the contracts between components in the first milestone, and SHOULD give a layer with several implementations a shared conformance suite (ASM-16). |
| `REQ-CHN-13` | `STEP-4` MUST record verification and validation separately. Verification MUST show, for each requirement and invariant, at least one verifier and its result at a named commit. Validation MUST be the product-spec owner's answer on the form, judged against the product specification (ASM-56). |
| `REQ-CHN-14` | Before a component's first release, `STEP-5` MUST provide its runbook, its SLOs, the signals that measure them, and an incident-response contact. The release itself is an outward action (`INV-4`). |
| `REQ-CHN-15` | `STEP-6` MUST run an impact analysis on the trace graph for every change after release, listing every identifier it touches. A change to stored data MUST carry a migration plan with a rollback. |
| `REQ-CHN-16` | Each profile MUST name the evidence its gates require. The step that produces a piece of evidence MUST store it, with its trace links, when its gate passes (R15). |
| `REQ-CHN-17` | A number cited in a gate, a report or a document MUST name the run that produced it (`XC-2`). |
| `REQ-CHN-18` | Each milestone MUST end with a retrospective. A lesson that changes the method MUST become a proposal to the methodology store (`XC-4`, `REQ-TEM-6`). |

---

## 5. Intake and profiling

### 5.1 Sign-up

| ID | Requirement |
|---|---|
| `REQ-ITK-1` | Sign-up MUST profile the user: their experience level (§3.3), their sector, their role, and which git host account they have, if any (R13, R2). |
| `REQ-ITK-2` | A user with a GitHub, GitLab or Codeberg account MUST be able to register by signing in with it (R13). Other hosts MAY follow. |
| `REQ-ITK-3` | A newcomer with no git host account MUST be able to sign in with Google, Outlook or email, or to run on delegated infrastructure such as Claude cloud sessions. Narthex MUST then guide them to set up a GitHub account (R13; hosting alternatives are `OQ-2`). |

### 5.2 Experience profile

| ID | Requirement |
|---|---|
| `REQ-ITK-4` | Intake MUST assess the user's experience, alongside the sector, and record one of the levels in §3.3 (R2, ASM-51). |
| `REQ-ITK-5` | The user MUST be able to see and change their level. The agent MAY propose a change when the user's answers show another level. |
| `REQ-ITK-6` | The level MUST change only the guidance: the depth of questions, the explanations, and the defaults offered. It MUST NOT change any gate or check (`INV-12`). |

### 5.3 Guidance for the product specification

Normative. The guidance level follows the experience level (R5). The default entry of each row is ASM-51.

| Level | Guidance | Default entry |
|---|---|---|
| `newcomer` | The user's agent asks a guided set of questions from the knowledge base, one contract element at a time, and explains why each matters | The guided questions |
| `practitioner` | A shorter questionnaire, an AI-reprocessed prompt (the user's own description restated against the contract), or a standard form | The shorter questionnaire |
| `professional` | The same three choices as a practitioner | The standard form |

| ID | Requirement |
|---|---|
| `REQ-ITK-7` | The knowledge base MUST supply question sets for each element of §4.3, for each experience level (R5). |
| `REQ-ITK-8` | Whatever the guidance, the result MUST be checked against §4.3 (`REQ-CHN-5`). |

### 5.4 Sector profile

| ID | Requirement |
|---|---|
| `REQ-ITK-9` | A project's intake MUST ask for the sector before any other project question (product definition review). |
| `REQ-ITK-10` | A user and an organisation MUST each have a default sector profile; a project MAY override it (product definition review). |
| `REQ-ITK-11` | A project MAY carry several profiles, one per component, such as a ledger core under `oss-ledger` and its consensus layer under `protocol` (ASM-2). |
| `REQ-ITK-12` | Intake SHOULD propose a profile from: the domain; the deployment context; who is harmed on failure; which regulators or customers want evidence; and whether the code is open or closed source. The lead MUST confirm the profile as an answered decision with its rationale (ASM-28). |
| `REQ-ITK-13` | Where a profile's level (DAL, ASIL, SIL or IEC 62304 class) comes from hazard analysis, intake MUST NOT ask for it. Intake MUST record "level pending hazard analysis", and the level-dependent gates stay closed until the analysis sets it (ASM-28). |
| `REQ-ITK-14` | The lead MAY tailor a profile. Each obligation dropped MUST be an answered decision (ASM-28). |

---

## 6. Data model

### 6.1 Project layout

| ID | Requirement |
|---|---|
| `REQ-DAT-1` | A project using Narthex MUST keep its documents in its own repo under this layout: `PRODUCT.md` (the product specification), `SPEC.md` (the SRS), `ARCHITECTURE.md` (the SAD), `adr/NNNN-slug.md`, `PLAN.md`, `amendments/NNNN-slug.md`, `features/F-NNN-slug/`, `notes/` or `research/`, `decisions/`, `experiments/<date>-<slug>/`, `ops/` (runbooks and SLOs), and `STATE.md` (ASM-52, ASM-48). Missing documents are allowed. Renamed ones are configured, never guessed. |
| `REQ-DAT-2` | `decisions/` MUST hold the item source (`questions.json`), the archived answers (`responses/*.json`), the generated log (`LOG.md`) and the built form. The item source and the answers are the record; the form and the log are generated from them. |
| `REQ-DAT-3` | Every generated file MUST state the commit and time it was generated from. |
| `REQ-DAT-4` | The repo's Markdown MUST be the source of truth. Everything rendered, exported or copied MUST be generated from it at a named commit, never edited by hand (item `ru-specsite`). |

### 6.2 Identifiers and references

| ID | Requirement |
|---|---|
| `REQ-DAT-5` | Every item in §6.3 MUST carry an identifier that is unique in the repo, stable, and never reused after withdrawal. |
| `REQ-DAT-6` | A decision item's id MUST be usable as a URL fragment and as a database key: lower case letters, digits, `-` and `.`, at most 64 characters. |
| `REQ-DAT-7` | A reference from one document to another MUST name its target by identifier, never by section number or heading text alone. |
| `REQ-DAT-8` | Amendment numbers, task ids, plan-decision ids and migration numbers MUST be reserved before use, in one registry per repo, so two sessions cannot take the same one (ASM-10). |

### 6.3 Item types

Normative. A profile MAY rename a prefix or add a type (`REQ-DAT-9`). Prefixes and attributes are ASM-53.

| Type | Prefix | Lives in | Required attributes |
|---|---|---|---|
| Product-spec element | `PS-` | `PRODUCT.md` | Contract element (§4.3) |
| Requirement | `REQ-` | `SPEC.md` | Statement with an RFC 2119 keyword; source link; verification method |
| Invariant | `INV-` | `SPEC.md` | Statement; at least one check |
| Acceptance criterion | `AC-` | `SPEC.md` | Scenario; the requirement it accepts |
| Non-functional requirement | `NFR-` | `SPEC.md` | Measure and bound |
| Threat | `THR-` | `SPEC.md` | Category; mitigation or accepting decision |
| Hazard | `HAZ-` | `SPEC.md` or a hazard log | Severity; mitigating requirements. Only in profiles with hazard analysis |
| Component | `CMP-` | `ARCHITECTURE.md` | Build mode; interfaces; owning team |
| Architecture decision | `ADR-` | `adr/` | Status; the decision item that ruled it |
| Plan decision | `DEC-` | `PLAN.md` | Status |
| Feature, task | `F-`, `T-` | `PLAN.md`, `features/` | The identifiers served |
| Check | `CHK-` | Code and CI configuration | The identifiers checked; kind: deterministic, AI-assisted, or person |
| Evidence record | `EV-` | Generated from CI and the form | Check, result, commit, run |
| Runbook, SLO | `RB-`, `SLO-` | `ops/` | Component |
| Open question | `OQ-` | `SPEC.md` | Its decision item |
| Amendment | `NNNN` | `amendments/` | Status; the items it applies |
| Decision item | Its own id | `decisions/questions.json` | §7.2 |

| ID | Requirement |
|---|---|
| `REQ-DAT-9` | A profile MAY add types, prefixes and attributes. It MUST NOT remove the universal parts of `REQ-DAT-10` (ASM-27). |
| `REQ-DAT-10` | Every profile MUST keep: stable identifiers; invariants; amendments; decisions as data; and the trace chain from requirement to implementation to verification, and to hazard where the profile has hazards (ASM-27). |

### 6.4 Trace links

Normative. Link types are ASM-53.

| Link | From | To |
|---|---|---|
| `derives-from` | Requirement, invariant, acceptance criterion | Product-spec element, requirement, threat, hazard, profile obligation |
| `mitigates` | Requirement | Threat, hazard |
| `allocated-to` | Requirement | Component |
| `decided-by` | Any item | Decision item, ADR |
| `implemented-by` | Requirement, invariant | Commit, pull request, file |
| `verified-by` | Requirement, invariant, acceptance criterion | Check |
| `evidenced-by` | Check | Evidence record |
| `amended-by` | Any item | Amendment |

| ID | Requirement |
|---|---|
| `REQ-DAT-11` | Narthex MUST derive the trace graph from the repo: identifiers in documents, tags on checks and tests, and commit and pull-request references. Nobody maintains it by hand (ASM-44). |
| `REQ-DAT-12` | The graph MUST answer three queries for any identifier: what it depends on, what depends on it, and what a change to it touches (ASM-44). |
| `REQ-DAT-13` | At the `STEP-4` gate, the chain from requirement to implementation to verification, and to hazard where the profile has hazards, MUST be complete for every requirement. The checks MUST report each gap. |

### 6.5 Decisions as data

| ID | Requirement |
|---|---|
| `REQ-DAT-14` | Agents MUST write decision items as JSON in `decisions/questions.json` (ASM-32). |
| `REQ-DAT-15` | The repo's archive MUST be the record of every answer. The UI's store is only an inbox (ASM-31). |
| `REQ-DAT-16` | The answer log and the amendments MUST be the record of Narthex rulings, with no separate record file per ruling (ASM-33). A project's ADRs (`REQ-CHN-9`) record its architecture decisions, and link to the items that ruled them. |

### 6.6 Profiles as data

| ID | Requirement |
|---|---|
| `REQ-DAT-17` | A spec MUST declare its `profile`, and its `level` where one applies, in its front matter (ASM-27). |
| `REQ-DAT-18` | A profile MUST be a data file that lists: the required sections; the allowed identifier families; the mandatory attributes per item; notation checks (RFC 2119 use, EARS patterns); trace rules; which artefact is normative; the exports; the gates; the evidence each gate requires; and the edition of each standard it cites (ASM-27). |
| `REQ-DAT-19` | A profile MAY declare an executable reference or a formal model normative over the prose spec (provisional, `OQ-5`). Where it does, the prose spec MUST say so and link to the normative artefact. |

### 6.7 Interchange

| ID | Requirement |
|---|---|
| `REQ-DAT-20` | Narthex MUST export a project's items and trace links as a `needs.json`-compatible file: id, type, title, status, links and source location (ASM-26). A ReqIF export is deferred (`DEF-8`). |

---

## 7. Capabilities

### 7.1 Knowledge base and sector profiles

| ID | Requirement |
|---|---|
| `REQ-KNB-1` | The knowledge base MUST hold: the methodology as skills and context prompts; a template for each artefact of the chain; an explanation of each step for each experience level; the question sets of `REQ-ITK-7`; the sector profiles; and golden paths for common changes (ASM-23). |
| `REQ-KNB-2` | Every piece MUST be versioned and served on demand through the MCP knowledge group (R8, `REQ-IFC-1`). |
| `REQ-KNB-3` | Every piece of sector material MUST carry one class from the table below (R4, R16). |
| `REQ-KNB-4` | Supplementary material MUST NOT be presented, rendered or exported as normative (`INV-14`). |
| `REQ-KNB-5` | Material in "our standard way" MUST say, wherever it appears, that it is Narthex's own method and that no available standard backs it (R4). |
| `REQ-KNB-6` | Every profile MUST pin the edition of each standard it cites (ASM-27). |
| `REQ-KNB-7` | The text of an open standard MAY ship (R4). No sector pack with material derived from a copyrighted standard MAY ship before a legal check of that material. Who checks, and when, is `OQ-12` (ASM-55). |
| `REQ-KNB-8` | Every external source the knowledge base or this spec relies on MUST be listed in `REFERENCES.md` (R6). |

Normative: classes of sector material (R4, R16).

| Class | When | What Narthex ships | Label shown |
|---|---|---|---|
| Open standard | The standard's text is openly licensed | The text, plus Narthex's guidance | "normative: *standard, edition*" |
| Supplementary | Only an open implementation or non-normative documentation exists | Checklists, mappings to clause numbers, templates and guidance | "supplementary, not normative" |
| Closed | The standard is closed and nothing derived from it can ship yet | A placeholder, or Narthex's own method | "early preview: available soon", or "our standard way" |

Informative: candidate profiles, from `notes/2026-10-17-research-spec-formats.md`. Which ship first is `OQ-4`.

| Profile | For | Adds |
|---|---|---|
| `product` | SaaS and APIs | RFC 2119 prose; acceptance criteria as scenarios; linked OpenAPI; scope as a pitch |
| `oss-ledger` | Open-source ledgers, Bloque's case | `product`, plus conservation and atomicity invariants with property or simulation tests; project guarantees split from operator obligations; an ISO 20022 mapping where relevant |
| `reg-fintech` | Regulated financial services | `oss-ledger`, plus a PCI DSS and SOC 2 evidence map; a third-party register; validation independence for models |
| `protocol` | Consensus and BFT systems | A fault model; safety and liveness properties as items; a normative executable reference or formal model; conformance vectors; draft, last-call and final review phases |
| `safety` | Avionics, automotive, rail, medical and similar | One profile with a level parameter (DAL A to E, ASIL A to D, SIL 0 to 4, IEC 62304 A to C): EARS notation; a hazard log traced to requirements; per-level objectives; assessor sign-off records |

### 7.2 Decisions

Every question that needs a person is an item on the project's decision form. The form is answered in the UI
and read back by the agent as data. This capability is the one that exists today, as the `decision-form`
skill.

#### 7.2.1 Items

| ID | Requirement |
|---|---|
| `REQ-DEC-1` | An item MUST have: `id`, `kind` (`decide`, `act`, `queue`, `read`, `update` or `later`), `section`, `title`, and either `options` or a free-text answer. It MAY have: `group`, `lead`, `bullets`, `rec`, `default`, `reserved`, `blocks`, `refs`, `spec`, `origin`, `keep_open`, `applied`, `superseded_by`, `follows` and `due`. |
| `REQ-DEC-2` | `title` MUST be the question, at most 70 characters; `lead` MUST be one or two sentences; `bullets` MUST be at most five, of at most 20 words each; each option MUST be at most 10 words. The whole context SHOULD stay under 90 words. |
| `REQ-DEC-3` | A `decide` item with a recommendation MUST list the recommended option first and mark it "(recommended)". |
| `REQ-DEC-4` | `default` names the option that stands while the item is unanswered. An item marked `reserved` (an outward action, a security trade-off, or a product ruling the lead keeps) MUST NOT have a default (`INV-4`). |
| `REQ-DEC-5` | An agent MAY act on the default of a reversible item before the answer comes. It MUST NOT act on any other unanswered item (ASM-34). |
| `REQ-DEC-6` | `blocks` marks an item whose answer blocks named work. The form MUST show it, and the overview MUST list every blocking item. |
| `REQ-DEC-7` | `refs` link to the documents behind an item. A ref to a repo document MUST use an anchor (`REQ-DOC-3`) when one exists. `spec` lists the identifiers the item concerns. |
| `REQ-DEC-8` | `origin` MUST record who raised the item: the agent, task or meeting, with a date. |
| `REQ-DEC-9` | The kind MUST say who acts (Pablo, 2026-10-15): `act` is for the owner only, including supplying a value, a credential or access (ASM-12); `queue` is the agent's work; `update` is something that happened. Items of kind `queue` and `update` MUST NOT count as open anywhere. |
| `REQ-DEC-10` | `superseded_by` MUST name an existing item; the superseded item leaves the inbox and keeps its answers in the log. `follows` MUST name the existing item whose answer created this one. Each answered `decide` item MUST show what it produced: `applied`, or at least one item that `follows` it. The builder MUST warn when it shows neither. |
| `REQ-DEC-11` | `due` MAY name a release or milestone. The overview MUST list, per release, the items that must close before it, and the builder MAY refuse to mark a release ready while any remain (ASM-20). |

#### 7.2.2 The inbox

| ID | Requirement |
|---|---|
| `REQ-DEC-12` | The form's sections MUST follow the order of a decision: Read, Decide, Act, the agent's queue (titled "Claude's queue" when the agent is Claude), Updates, Later (item `ru-section-order`; Pablo, 2026-10-15). |
| `REQ-DEC-13` | Within a section, items MUST be grouped into sub-tabs by topic. Each tab and sub-tab MUST count only the items still open; items with an applied default are not counted. |
| `REQ-DEC-14` | Within a group, open items MUST come first, then answered ones. Items whose default is applied MUST sit collapsed below them, behind one control that says how many there are. The queue keeps the file's order, because its order is the plan. |
| `REQ-DEC-15` | An item MUST be marked new until the viewer has seen it. Each item MUST keep its edit history, and the outbox MUST show when an item's wording changed after it was answered (ASM-17). |
| `REQ-DEC-16` | Every answer MUST be a choice among the options, free-text notes, or both. Notes alone are a valid answer. |
| `REQ-DEC-17` | The UI MUST save each answer as it is made, without a submit step, and show where it was saved. |
| `REQ-DEC-18` | The UI MUST work on a phone, in light and dark themes, and with the keyboard only. |
| `REQ-DEC-19` | When the shared store is unavailable, the UI MUST keep answers in the browser, let the person export them as a JSON file, and import such a file later. |
| `REQ-DEC-20` | An agent that needs a person's decision MUST file an item and give the person a link to it in the UI (R3). It MUST NOT carry the question in chat unless the UI is unreachable; then it MUST record the answer as a relayed ruling (`REQ-DEC-31`). |
| `REQ-DEC-21` | Agents MUST batch questions into passes: at most one pass per milestone, unless an item blocks work (ASM-12). |
| `REQ-DEC-22` | A form, its item source and its published page MUST belong to one project. Publishing MUST take a lock, and a publish whose base is stale MUST be refused (ASM-11, `INV-11`). |

#### 7.2.3 Read-back, outbox and queue upkeep

| ID | Requirement |
|---|---|
| `REQ-DEC-23` | The agent MUST read answers from the store directly, without a person copying them. |
| `REQ-DEC-24` | Each read of the form through the MCP MUST return only the items, answers and edits changed since that agent's previous read. It MUST end by telling the agent to update the form at the end of its current iteration (R8). |
| `REQ-DEC-25` | On each read-back, the agent MUST archive the answers into `decisions/responses/` before acting on them. |
| `REQ-DEC-26` | An answered item MUST move to the outbox, which shows the original question, the options with the chosen one marked, the notes, the date, and what applied it. `keep_open` keeps an answered item in the inbox, for example after "Changes needed". |
| `REQ-DEC-27` | A person MAY re-answer an item from the outbox. The new answer supersedes the old one; both stay in the log (`INV-3`), and the agent MUST say which work the change affects. |
| `REQ-DEC-28` | An answer of "Discuss first" MUST keep the item in the inbox and put it on a generated agenda page for the next meeting (ASM-36). |
| `REQ-DEC-29` | An item MAY be answered "Defer" with a reason and a target release or milestone. It then leaves the inbox, shows in a Deferred list, and returns when its target comes up (ASM-19). |
| `REQ-DEC-30` | Skills MUST keep the form's queue current, because agents forget to (R8). At the start and the end of each iteration, the skill MUST check the queue against the agent's work: archive new answers, record follow-ups, mark finished work as updates, and reorder. Where the harness has built-in task tools, the skill MUST tell the main agent to keep its task list and the form's queue in step (R8). |
| `REQ-DEC-31` | A ruling given outside the form MUST be recorded the same day as an answered item with `by: "relayed:<source>"`, and notes that say who ruled, where and when, quoting the ruling. It binds only once written into the document it changes (ASM-13). |
| `REQ-DEC-32` | The decide skill MUST be able to seed a form from an existing project: its open identifiers become items, and its already-ruled ones become relayed answers (ASM-21). |

#### 7.2.4 The log

| ID | Requirement |
|---|---|
| `REQ-DEC-33` | `decisions/LOG.md` MUST list every answer with the item id, title, choice, notes, who answered, when, and what applied it: an amendment, a plan decision, a commit, or "not applied yet". |
| `REQ-DEC-34` | A ruling MUST reach a spec only through an amendment that cites the item ids it applies (`REQ-SKL-26`). This rewrite is the one exception, allowed by R18; it cites each ruling in place. |
| `REQ-DEC-35` | A closed open question in a spec MUST name the amendment that closed it and the item that ruled it. |

#### 7.2.5 Notifications and packaging

| ID | Requirement |
|---|---|
| `REQ-DEC-36` | After a publish that adds or changes items, the agent MUST notify the people concerned once, naming the sections and item counts, in under 200 characters. The first channel is Claude push notifications (ASM-35). |
| `REQ-DEC-37` | Notifications SHOULD be batched: at most one per publish, and no publish only to notify. |
| `REQ-DEC-38` | The decisions capability MUST be usable on its own, without the other capabilities (ASM-30). |

#### 7.2.6 Unattended forms

An unattended form is the norm (R22). The lead moves between projects and other work, so a form can sit
unanswered for a long time. A channel, here, is any path that brings an answer to the agent without the agent
asking: a plugin hook (`REQ-IFC-6`) or a monitor.

| ID | Requirement |
|---|---|
| `REQ-DEC-39` | The agent MUST NOT poll the form, and MUST NOT wait idle on it (R22). |
| `REQ-DEC-40` | After publishing items that need an answer, the agent MUST open a monitor on the form where the harness has one: a background watcher the harness wakes the agent from (R22). |
| `REQ-DEC-41` | When no channel is open, the agent MUST tell the person, with the link, to come back and acknowledge once they have answered (R22). |
| `REQ-DEC-42` | While answers are pending, the agent MUST carry on with the rest of its queue. When it is woken or told the person answered, its next read MUST return only the changes (R8, `REQ-DEC-24`). |

### 7.3 Living documentation

| ID | Requirement |
|---|---|
| `REQ-DOC-1` | The renderer MUST turn the repo's documents (`REQ-DAT-1`) into HTML pages, one per document, from a named commit. |
| `REQ-DOC-2` | Every rendered page MUST show a basis block: the repo, the commit, the document's version and status, and when it was rendered (`INV-5`). |
| `REQ-DOC-3` | Every identifier MUST get an anchor equal to the identifier in lower case (`REQ-DEC-4` is `#req-dec-4`), wherever it is defined: heading, table row or list item. Headings MAY also get slug anchors; links MUST prefer identifier anchors (ASM-38). |
| `REQ-DOC-4` | An anchor once published MUST resolve in every later rendering. A withdrawn identifier renders as a tombstone that names the amendment which withdrew it. |
| `REQ-DOC-5` | Each anchor that items, amendments or checks reference MUST show its backlinks: the items with their status (open, default applied, answered with the choice), the amendments, and the checks (`INV-6`). |
| `REQ-DOC-6` | A decision item's ref to an anchor MUST open the target in place, as a modal that shows that part of the document with a link to the full page (ASM-37). A person MUST NOT have to leave the form to read it. |
| `REQ-DOC-7` | Identifiers mentioned in text MUST render as links to their anchors. |
| `REQ-DOC-8` | The renderer MUST produce a PDF of any document from the same source and commit. HTML comes first; PDF follows (ASM-25). |
| `REQ-DOC-9` | Research reports and explainer pages MUST tag each claim with its evidence: Code (read at a commit), Measured (a named run), Plan, Inference, or Not in code; and cite sources as `path:line` at a commit, URLs, or run ids (ASM-39). |
| `REQ-DOC-10` | The renderer MUST show, for a spec version, the amendments that produced it, the items each applied, and a diff against the previous version (ASM-44). |
| `REQ-DOC-11` | Every edition (a single-file HTML copy, a PDF, a copy kept in another repo) MUST be generated from one commit, state it, and be flagged stale once its source moves on (item `ru-specsite`, ASM-14). |
| `REQ-DOC-12` | Each requirement and invariant anchor MUST show "checked by" with its checks. The renderer MUST flag an invariant with no check (ASM-23). |
| `REQ-DOC-13` | specsite (`swimmingoncode/specsite`) implements this capability: a Starlight plugin for each project's site, and `specsite html` for single-file editions published as private artifacts next to the decision form (ASM-25). |
| `REQ-DOC-14` | A tool that more than one project needs MUST be a public repository, and an existing tool that does the job MUST be used instead of a new one (item `ru-specsite`). Creating the repository is an outward action (`INV-4`). |
| `REQ-DOC-15` | Where a profile defines them, the renderer MUST produce the profile's views, such as an evidence matrix or a hazard table (ASM-27). |
| `REQ-DOC-16` | Every page Narthex publishes (the decision form, the HTML editions of SPEC and OVERVIEW, explainers) MUST be generated by Narthex's own tooling from the repo at a named commit, and MUST be publishable to Narthex's own host and to any static host. claude.ai artifacts are one optional target (R23, amendment 0001). |

### 7.4 Workflow skills, briefs and house rules

#### 7.4.1 Skills

Normative. Each skill reads and writes files in the layout of `REQ-DAT-1`, and ends with a report under
`REQ-SKL-21`.

| ID | Skill | Requirement |
|---|---|---|
| `REQ-SKL-1` | `intake` | MUST profile the user and the project (§5), and turn an idea into `notes/<date>-<slug>.md`: the idea as stated, the questions it raises, and what would change if it went ahead. It MUST NOT start research or code unasked. |
| `REQ-SKL-2` | `research` | MUST dispatch read-only agents that write sourced reports (`REQ-DOC-9`) under `research/` or `notes/`, add their external sources to `REFERENCES.md`, and list the questions the research raises as items. |
| `REQ-SKL-3` | `spec` | MUST run `STEP-1`: check the product specification (`REQ-CHN-5`), write or update `SPEC.md` under the project's profile, and `OVERVIEW.md`, informative, stating which spec version it digests. Every open question MUST become an item. |
| `REQ-SKL-4` | `design` | MUST run `STEP-2`: write `ARCHITECTURE.md` and the ADRs (`REQ-CHN-8` to `REQ-CHN-10`) (ASM-54). |
| `REQ-SKL-5` | `decide` | MUST maintain `decisions/questions.json`, build the form, ask the lead before the first publish of a form, read answers back (`REQ-DEC-23`), archive them, update the log, and keep the queue current (`REQ-DEC-30`). |
| `REQ-SKL-6` | `plan` | MUST write `PLAN.md` with plan decisions, features, tasks and milestones, each tracing to the identifiers it serves, and the construction method of each milestone (`REQ-CHN-11`). It MUST check the task table (every task traces to an identifier, no cycles, milestone order) and generate the dependency waves (ASM-16). |
| `REQ-SKL-7` | `dispatch` | MUST start one agent per feature, each in its own git worktree as a subagent (ASM-42), with a brief built from the house rules and the feature plan. It MUST track each agent's branch, PR and CI, collect the items each agent raises, hand a PR to a script that waits for CI and resumes the agent when CI finishes (ASM-9), and back off when agents hit usage limits (ASM-18). |
| `REQ-SKL-8` | `review` | MUST run read-only adversarial reviewers on each PR against the spec, before merge. Findings that need a fix go back as fixups; findings that need a ruling become items. After any change applied post-review, the reviewers MUST be told what changed (ASM-8). |
| `REQ-SKL-9` | `experiment` | MUST run an experiment with a bounded scope (§7.5): start it with its question and scope, route its questions to its own log, keep its spec and plan changes as drafts, write the outcome, and promote or close it. |
| `REQ-SKL-10` | `amend` | MUST write numbered amendments (status, target version, rationale, the rulings applied with item ids, the questions they raise) and apply them to the spec with a version bump: below v1.0.0, the patch version only, listed in the amendment (provisional, `OQ-7`). |
| `REQ-SKL-11` | `propose-upstream` | MUST draft a proposal for a spec or repo the project doesn't own (a third party's, or another team's) with measurements, run ids and the PR text. It MUST NOT open it on a third party's repo without an explicit answer (`REQ-SKL-20`). |
| `REQ-SKL-12` | `release` | MUST run `STEP-5`: check `REQ-CHN-14`, draft the release record, and file the release as a reserved `act` item (ASM-54). |
| `REQ-SKL-13` | `report` | MUST produce a status that names what was done, what is pending with each question spelled out (`REQ-SKL-22`), and what blocks. It MUST end a milestone with one checklist of what needs a person, and with a requirement-to-evidence table (ASM-12, ASM-24). Long content goes in a page. |

#### 7.4.2 Every skill

| ID | Requirement |
|---|---|
| `REQ-SKL-14` | Each step's skill MUST give its agent a fixed brief with the house rules in full, and MUST end with an exit check a script can decide (ASM-24). |
| `REQ-SKL-15` | A change that touches no identifier MAY take a fast path that skips `spec` and `plan` (ASM-47). |
| `REQ-SKL-16` | The orchestrating agent MUST keep `STATE.md` at the project root: open threads, pending rulings, running agents and their branches, and next steps. It MUST update the file as things change and always before a compaction, so the compacted session resumes from the file (Pablo, 2026-10-07). |

#### 7.4.3 Briefs and house rules

| ID | Requirement |
|---|---|
| `REQ-SKL-17` | A project MUST have one house-rules file. Narthex ships defaults; the project file extends or overrides them and says which (ASM-46). |
| `REQ-SKL-18` | Every brief MUST include the house rules in full, not by reference. |
| `REQ-SKL-19` | No component and no brief MAY override the git committer identity or commit signing: no `-c user.name`, `-c user.email`, `--author`, `GIT_AUTHOR_*`, `GIT_COMMITTER_*`, `--no-gpg-sign` or signing configuration changes. If signing fails, the agent MUST stop and ask (`INV-8`). |
| `REQ-SKL-20` | An outward action MUST NOT happen without an explicit answer from the lead for that action. A default never authorises one (`INV-4`). |
| `REQ-SKL-21` | Chat replies to a person MUST stay at five lines or fewer. Longer content goes into a file or a published page, and the reply points to it. |
| `REQ-SKL-22` | A status of pending decisions MUST list each question itself, or link the exact place where it is written. A count alone is not a status. |
| `REQ-SKL-23` | Durable work (briefs, clones, scripts) MUST NOT live in a directory the operating system cleans, such as `/tmp`. |
| `REQ-SKL-24` | A worker agent that meets a decision the spec or plan does not cover MUST raise an item and record its reading in the feature's notes. It MAY build meanwhile only when its reading is the plan's own or strictly more restrictive; otherwise it MUST stop the task. It MUST NOT change `SPEC.md` or `PLAN.md` before the ruling, and MUST NOT ask in chat (provisional, `OQ-8`). |
| `REQ-SKL-25` | A worker agent MUST merge only when its task says it may, with CI green, after rebasing on the current base and checking again (ASM-43, ASM-15). |
| `REQ-SKL-26` | Only the `amend` skill, or a task that says so, MAY edit `SPEC.md` or `PLAN.md`. |
| `REQ-SKL-27` | Rules that can be checked mechanically (identity overrides, pushes to protected repos, durable work in `/tmp`) MUST be enforced by hooks that refuse the command, in addition to the text in the brief (ASM-45). |
| `REQ-SKL-28` | An agent MUST NOT end a turn waiting on CI, or poll CI from the agent. A script does the waiting (ASM-9; Pablo, 2026-10-05). |
| `REQ-SKL-29` | Each agent MUST have its own worktree and its own build directory. No two agents run verification in one worktree (ASM-15). |
| `REQ-SKL-30` | Test naming MUST be a per-project setting in the house rules. The default is plain test names, with the identifiers each test verifies in a comment on the test, which the trace checks read (provisional, `OQ-9`). |
| `REQ-SKL-31` | The agent that finds a spec gap MUST draft its item; the session that owns the spec applies the ruling through an amendment; the reviewers are told (ASM-22). |

#### 7.4.4 Packaging

| ID | Requirement |
|---|---|
| `REQ-SKL-32` | The skills MUST be installable without copying files by hand, and MUST work in any project once installed: as one Claude Code plugin with its commands and hooks, and through the Agent Skills format for other harnesses (ASM-40). |
| `REQ-SKL-33` | Each skill MUST be usable alone: `decide` without `plan`, `research` without `spec`. |
| `REQ-SKL-34` | No skill MAY contain project-specific content. Project facts live in the project repo. |
| `REQ-SKL-35` | Narthex's own repository MUST stay local until a second project runs it. Creating a remote is an outward action that needs the lead's explicit answer (ASM-41). |

### 7.5 Experiments

An experiment tries one shape of a solution without loading the lead with every question it raises. Only its
definitive shape reaches the decision form.

| ID | Requirement |
|---|---|
| `REQ-EXP-1` | An experiment MUST be a recorded object with: an id, a start date, the question it answers, its scope (what it may change), its own decision log, its draft changes, an outcome, and a promotion record. |
| `REQ-EXP-2` | Questions and defaults raised inside an experiment MUST go to the experiment's own log, `experiments/<date>-<slug>/decisions.json`, committed to the repo (ASM-48), in the same format as `decisions/questions.json`, and never to the lead's inbox. The exception is a reserved item, which still needs the lead's explicit answer (`INV-4`). |
| `REQ-EXP-3` | An experiment's spec and plan changes MUST stay drafts: its amendment has `Status: experimental` and its plan decision is `proposed`. Only code behind a flag and measurement notes MAY merge to the main branch before promotion. |
| `REQ-EXP-4` | An experiment MUST end with a one-page outcome: adopt, adapt or drop, with the numbers behind it, each tied to a named run (`REQ-CHN-17`). |
| `REQ-EXP-5` | Only an adopted or adapted outcome is promoted. Promotion MUST consolidate the experiment's record into one amendment, one plan decision, and the questions that still need the lead, at most three. Duplicated and superseded items are dropped, never promoted. |
| `REQ-EXP-6` | A dropped experiment MUST keep its log and outcome as a record, and promotes nothing. |
| `REQ-EXP-7` | Adopting or adapting an outcome MUST be one item on the lead's form, with the outcome page as its ref. The agent MAY drop an experiment on its own, and MUST then report it (ASM-49). |

### 7.6 Verification and guardrails

| ID | Requirement |
|---|---|
| `REQ-VER-1` | Narthex MUST provide deterministic checks that report: every reference whose target does not exist; every identifier defined twice, including task ids and migration numbers (ASM-10); every trace gap; every violation of the project's profile; and every gate that has not passed. In strict mode the renderer and the form builder MUST refuse to publish while any remain. |
| `REQ-VER-2` | Narthex MUST provide AI-assisted reviews: adversarial reviews of a change against the spec, and reviews of a document against its profile. Their results MUST be labelled AI-assisted. A finding that needs a ruling MUST become an item. |
| `REQ-VER-3` | The same checks with the same rules MUST run locally, through the MCP verify group, and in CI (R8, PD). |
| `REQ-VER-4` | Each executable check (a conformance, contract or property test, a simulation, a policy) MUST be tagged with the identifiers it verifies (ASM-23). |
| `REQ-VER-5` | At the `STEP-4` gate, every invariant MUST have at least one check. A profile MAY make an invariant without a check an error at every commit. |
| `REQ-VER-6` | An alarm MUST fire on: a failed tagged check; a change that touches a requirement or invariant another team owns; or a change whose touchpoints the checks cannot identify (ASM-23). |
| `REQ-VER-7` | Alarms MUST be routed in three tiers: green merges on the builder's own approval; amber goes to the identifier's owner for review; red blocks the change and pages an engineer reviewer with the check, the product specification and the diff attached (provisional, `OQ-10`). |
| `REQ-VER-8` | Routing MUST follow identifier ownership (`REQ-TEM-2`). |
| `REQ-VER-9` | When the norm a running product depends on changes, the product MUST be held until it passes the changed checks, as well as blocked at build time (ASM-23). |
| `REQ-VER-10` | A low-code or no-code component MUST be verified by contract tests against its interface, in place of code-level traces (R11). |
| `REQ-VER-11` | Where a profile requires independent review, Narthex MUST record the reviewer's identity per item and check that the reviewer differs from the author. Agents count as independent reviewers under `product` and `oss-ledger`; a person is required under regulated profiles (provisional, `OQ-6`). |
| `REQ-VER-12` | AI-assisted checks MUST run in the user's agent, or in the user's CI with the user's model access. Narthex runs no model of its own in v1 (ASM-7, R9). |
| `REQ-VER-13` | The `report` skill and the `STEP-4` gate MUST generate the requirement-to-evidence table from the trace graph (ASM-24). |

### 7.7 Integrations and identity

| ID | Requirement |
|---|---|
| `REQ-IDN-1` | Narthex MUST integrate with GitHub, GitLab and Codeberg as an app installed on repositories the user owns (R7). |
| `REQ-IDN-2` | In v1, Narthex MUST NOT host a user's code. Repositories stay where their owners keep them (R7; a hosted option is `OQ-2` and `DEF-3`). |
| `REQ-IDN-3` | Agents MUST authenticate to Narthex's MCP server with OAuth 2.1, as the MCP authorization specification describes (ASM-4). |
| `REQ-IDN-4` | For each agent and each task, the server MUST mint a short-lived token scoped to the repositories and permissions the task needs, from the git host's app installation. No agent holds a long-lived git-host or repository credential (ASM-4). The long-lived answer token of `REQ-IFC-10` (R20) is not such a credential: it lets a person submit answers to one form and nothing else. |
| `REQ-IDN-5` | Every write through the MCP change group MUST end as a commit or a pull request in the user's repository (R8, `INV-16`). |
| `REQ-IDN-6` | Every commit MUST be verifiable on its platform. Either the agent commits as its human, with the signing that human set up and a co-author trailer naming the agent, or it commits as the Narthex app identity, whose commits the platform signs. A per-agent identity alone MUST NOT be used (ASM-5). |
| `REQ-IDN-7` | Read-only snapshots (rendered editions, the decision form) MAY be shared with people outside the repository through expiring links (ASM-6). |

### 7.8 Interfaces

| ID | Requirement |
|---|---|
| `REQ-IFC-1` | Narthex MUST offer an MCP server whose tools, resources and prompts are grouped as in the table below, so a user's agent can discover them (R8). |
| `REQ-IFC-2` | Knowledge MUST be fetched one piece at a time, on demand, so responses stay small (`NFR-8`). |
| `REQ-IFC-3` | Narthex MUST offer a web GUI for the decision form, the rendered documents and editions, intake and profiles, and each project's status at its current step (R3). |
| `REQ-IFC-4` | Where a person must read or decide, the MCP MUST hand the agent a link into the GUI, and the agent MUST pass the link to the person in place of restating the content in chat (R3). |
| `REQ-IFC-5` | Optional harness add-ons, such as a Claude Desktop plugin, MAY open or embed the GUI (R3). R3's question, whether a harness plugin can report a UI action to the agent, is answered in `notes/2026-10-17-ui-feedback.md`: it is documented only for Claude Code channels (research preview). Support in other harnesses is verified per harness before the hook layer of R21 relies on it. |
| `REQ-IFC-6` | Answers MUST reach the agent by layers (R21). First, where the harness allows it, a Narthex plugin whose hooks bring the person's answer to the agent, through Claude Code channels once they leave preview or whatever the harness offers. Otherwise, the standard link: the MCP tool returns the link, waits a short time, and returns a "pending" result when no answer has come; the agent does not poll. It reads again, through an incremental read (`REQ-DEC-24`), only when a monitor wakes it or the person says they answered (`REQ-DEC-40` to `REQ-DEC-42`, R22). |
| `REQ-IFC-7` | The MCP server MUST expose structured tools only. It MUST NOT run a conversational agent of its own (R9). |
| `REQ-IFC-8` | Until the web GUI exists, the decision form MAY be published as a claude.ai artifact. Both front ends MUST read and write the same items and answers. |
| `REQ-IFC-9` | Every link the MCP hands out MUST be authenticated, with a token split by purpose (R20). Reading the form's state MUST use a short-lived token. |
| `REQ-IFC-10` | Answering MUST use a long-lived, narrowly scoped token: valid for one form, allowed to submit answers only, and revocable. It MUST stay valid for as long as an answer can take, including hours (R20, `INV-17`). |
| `REQ-IFC-11` | Refreshing the form's state MUST need a browser session or a login. Without one, the page MAY use the answer token to ask the agent, through the form's store, for a fresh link (R20). |
| `REQ-IFC-12` | When the harness has a browser of its own, the MCP MUST suggest that the agent open the link there (R20). |

Normative: the MCP groups (R8).

| Group | Offers | As |
|---|---|---|
| knowledge | Methodology skills, sector profiles, templates, explanations, question sets; versioned | Resources and prompts |
| spec data | Queries over requirements, invariants, decisions, trace links and profiles (`REQ-DAT-12`) | Tools and resources |
| change | Propose an amendment; file an item; record a ruling; update the queue. Each write ends as a commit or PR | Tools |
| verify | The deterministic checks and AI-assisted reviews of §7.6, with the rules CI uses | Tools |
| decide | Incremental reads of the form (`REQ-DEC-24`); publish items; authenticated links into the GUI (`REQ-IFC-9` to `REQ-IFC-11`); the layered return of answers (`REQ-IFC-6`) | Tools |

### 7.9 Multiple teams and access control

Ruled by R10 as proposed in `notes/2026-10-17-product-definition-review.md` §3.

| ID | Requirement |
|---|---|
| `REQ-TEM-1` | In v1, one organisation MUST be able to hold several teams working on one shared spec (ASM-1). |
| `REQ-TEM-2` | Each identifier MUST have one owning team, recorded in an ownership file in the repository, in the style of CODEOWNERS (R10). |
| `REQ-TEM-3` | An item about an identifier MUST be routed to the inbox of the role that owns it. A reserved product ruling MUST go to the lead (R10). |
| `REQ-TEM-4` | Access MUST be granted by role (lead, engineer, builder, engineer reviewer, viewer) and by identifier ownership. People other than the lead MAY answer items within their ownership (R10). |
| `REQ-TEM-5` | When two teams amend the same requirement, the later amendment MUST be rebased on the earlier one and reviewed by both owners before it applies (R10). |
| `REQ-TEM-6` | The organisation MUST have one shared methodology store. A team MAY override a part of it, and each override MUST say what it overrides (R10). |
| `REQ-TEM-7` | A team or builder that needs a change to a spec it does not own MUST raise a proposal to the owner through `propose-upstream`, and MUST NOT amend that spec itself (R10, R11). |

---

## 8. Invariants

| ID | Invariant |
|---|---|
| `INV-1` | An item id names one question forever. A reworded item keeps its id only while the question stays the same; a different question gets a new id. |
| `INV-2` | An answer that reached any store appears in the repo's archive after the next read-back, and is never dropped by a rebuild. |
| `INV-3` | The log is append-only. A changed answer is a new entry that supersedes the old one, and both remain. |
| `INV-4` | No outward action, security trade-off or reserved product ruling proceeds on a default or on an agent's reading. Each needs the lead's explicit answer. |
| `INV-5` | A rendered page shows content from exactly one commit, and names it. |
| `INV-6` | Backlinks are symmetric: if an item, amendment or check references an anchor, the rendered anchor lists it. |
| `INV-7` | Every ruling applied to a spec cites the item ids that ruled it. A ruling given outside the form is recorded as a relayed item before it applies; no spec change cites "chat" alone. |
| `INV-8` | No component and no brief overrides the git committer identity or commit signing (`REQ-SKL-19`). |
| `INV-9` | A published form contains only what the lead approved to publish. Nothing is published on a default. |
| `INV-10` | The lead's inbox holds no item raised inside an experiment that has not been promoted, except reserved items. |
| `INV-11` | No item from another project appears in a project's form (ASM-11). |
| `INV-12` | A user's experience level changes the guidance they get, and never a gate or a check. |
| `INV-13` | Every rendered, exported or copied document is generated from the repo's Markdown at one named commit (item `ru-specsite`). |
| `INV-14` | Supplementary material is never presented as normative (R4). |
| `INV-15` | Narthex claims no certification of a product and no qualification of a tool (ASM-29). |
| `INV-16` | Every write Narthex makes to a user's repository is a commit or pull request with a verifiable identity (ASM-5). |
| `INV-17` | No answer is lost to an expired link. A person can submit an answer until its answer token is revoked, however long the answer takes (R20). |
| `INV-18` | No published page exists only as a claude.ai artifact: each has a source in the repo and a generator in Narthex that can publish it elsewhere (R23, amendment 0001). |

---

## 9. Non-functional requirements

| ID | Requirement |
|---|---|
| `NFR-1` | **Concision.** The form builder MUST check `REQ-DEC-2` on every item and report each violation. In strict mode it MUST refuse to build. |
| `NFR-2` | **Phone first.** The web GUI and the form MUST be usable at 375 px wide, with no horizontal page scroll and touch targets of at least 40 px. |
| `NFR-3` | **No install to answer.** Answering a form MUST need only its answer link (R20), with no account. An account or a browser session is needed only to refresh the form's state or to use the full UI (`REQ-IFC-11`). |
| `NFR-4` | **Few dependencies.** The form builder MUST run on a stock Python 3 with no packages. The renderer MAY depend on Node (for Starlight) and pandoc. |
| `NFR-5` | **Durability.** An answer saved in the UI MUST survive closing the browser, and reach the repo on the next read-back (`INV-2`). |
| `NFR-6` | **Size.** A form of 200 items MUST load in under two seconds on a phone on 4G. |
| `NFR-7` | **Language.** Every document, item, log entry and knowledge-base piece MUST be written in English, whatever language the chat uses. |
| `NFR-8` | **Small responses.** MCP responses SHOULD carry only what changed (`REQ-DEC-24`) or the one piece asked for (`REQ-IFC-2`). |
| `NFR-9` | **Waiting and reading** (Pablo, 2026-10-05). Skills SHOULD let a script do any waiting, with one blocking command or a background command that notifies on exit, and SHOULD filter before reading: never raw CI logs, plans or large files in context. |
| `NFR-10` | **Model per role** (Pablo, 2026-10-15). Every agent a skill starts SHOULD name its model. The strongest model SHOULD go to design, code whose design is still open, contracts, security and incidents; a mid-tier model to bounded coding, reviews, documents and fixes with a precise brief; the lightest model to mechanical work decided by a rule. |
| `NFR-11` | **Helpers** (Pablo, 2026-10-07 and 2026-10-15). Skills SHOULD give each helper one short job and a fresh context; run at most two helpers at once and one CI watcher; write briefs that point to files instead of pasting them; keep the orchestrator from writing code; and have it read reports, not diffs or logs. |

---

## 10. Deferred scope and non-goals

| ID | Deferred | Why |
|---|---|---|
| `DEF-1` | Producing the product specification: product mapping, an AI-assisted design sprint | A complementary product (R5, PD) |
| `DEF-2` | A natural-language agent of Narthex's own. A narrow "consult" tool (ask the architect a design question, get an answer with cited guidance) is the cheap first test | R9 |
| `DEF-3` | Hosted git, for newcomers with no git host and for regulated customers who want a managed, audited store | Repositories stay user-owned in v1 (R7, `OQ-2`) |
| `DEF-4` | Agent dispatch board: running agents with their briefs, PRs and CI, stall detection and resume, across sessions | Waits for a need a session cannot meet (ASM-44) |
| `DEF-5` | Measurement ledger: every benchmark run with its id, conditions and figures, so documents cite runs and stale numbers get flagged | `REQ-CHN-17` covers citing runs for now |
| `DEF-6` | Meeting notes into rulings: a transcript becomes answered items and new open ones | Not needed by the first customers yet |
| `DEF-7` | A risk register fed by agents' findings | The threat model and hazard log cover the spec side |
| `DEF-8` | ReqIF export | After the `needs.json` export (`REQ-DAT-20`) |
| `DEF-9` | Syncing issues and project boards from the plan's tasks | Linear or GitHub keep tracking |
| `DEF-10` | Evidence bundles for audits (PCI DSS, SOC 2) | Never asked; waits for a regulated customer |
| `DEF-11` | Several organisations sharing one spec | The v1 boundary is one organisation (ASM-1) |
| `DEF-12` | On-brand diagrams in specsite, through an agent skill such as diagram-design | Not on specsite's roadmap yet |
| `DEF-13` | Named low-code and no-code target platforms | Named when a pilot needs them (R11) |

Non-goals: replacing Linear or GitHub as the tracker; a general wiki; certifying products or qualifying tools
(`INV-15`); running a model of Narthex's own in v1 (`REQ-VER-12`).

---

## 11. Open questions

Each question is an item on the decision form (`decisions/questions.json`) with the id `v3-oq-N`. The
recommendation is the item's first option.

| ID | Question | Recommendation | Blocks |
|---|---|---|---|
| `OQ-1` | What is Narthex's final name? | Choose after a trademark and domain search, with the book's title in mind (`notes/2026-10-17-codenames.md`) | Package, repository and domain names; the book's title |
| `OQ-2` | Where do newcomers' repositories live: a GitHub account they are guided to create (R13), or a hosted git option? | A guided GitHub account in v1; hosted git later (`DEF-3`) | `REQ-ITK-3`, `REQ-IDN-2`, `DEF-3` |
| `OQ-3` | What are the pricing and the business model? | Decide after the Bloque pilot shows what teams use | Hosting, sign-up plans, limits per organisation |
| `OQ-4` | Which sector profiles ship first? | `product` and `oss-ledger` | §7.1, the first sector pack |
| `OQ-5` | May a profile make an executable reference or a formal model normative over `SPEC.md`? | Yes, where the profile says so | `REQ-DAT-19`, the `protocol` profile |
| `OQ-6` | Does an agent count as an independent reviewer where a profile requires independence? | Agents for `product` and `oss-ledger`; a person for regulated profiles | `REQ-VER-11` |
| `OQ-7` | Does every amendment bump the spec version? | Below v1.0.0, a patch bump listed in the amendment; from v1.0.0, a bump per amendment | `REQ-SKL-10` |
| `OQ-8` | What does an agent do when it finds a spec gap? | Build meanwhile only on the plan's own or a stricter reading; otherwise stop | `REQ-SKL-24` |
| `OQ-9` | How are tests named? | A per-project setting; by default plain names, identifiers in a comment | `REQ-SKL-30`, `REQ-VER-4` |
| `OQ-10` | When does a builder's change need an engineer? | Three tiers: green, amber, red | `REQ-VER-7` |
| `OQ-11` | Which builder and which product pilot Narthex at Bloque? | An operations flow on Bloque's core, named by Pablo | The first milestone's plan |
| `OQ-12` | Who checks the legal side of sector material, and when? | A lawyer, before the first pack with material derived from a copyrighted standard ships | `REQ-KNB-7`, every sector pack |

---

## 12. Traceability

| Step or activity | Requirements |
|---|---|
| Sign-up and intake | `REQ-ITK-1` to `REQ-ITK-14`, `REQ-SKL-1`, `REQ-IDN-1`, `INV-12` |
| Product specification (input) | §4.3, `REQ-CHN-5`, `REQ-ITK-7`, `REQ-ITK-8` |
| Requirements engineering (`STEP-1`) | `REQ-CHN-1` to `REQ-CHN-7`, `REQ-SKL-2`, `REQ-SKL-3`, `REQ-DAT-5` to `REQ-DAT-10`, `REQ-DAT-17` to `REQ-DAT-19`, `REQ-KNB-1` to `REQ-KNB-8` |
| Architecture and design (`STEP-2`) | `REQ-CHN-8` to `REQ-CHN-10`, `REQ-CHN-12`, `REQ-SKL-4` |
| Construction (`STEP-3`) | `REQ-CHN-11`, `REQ-SKL-6` to `REQ-SKL-8`, `REQ-SKL-14` to `REQ-SKL-31`, `REQ-IDN-3` to `REQ-IDN-6`, `REQ-VER-4`, `REQ-VER-6` to `REQ-VER-10`, `INV-8`, `INV-16` |
| Verification and validation (`STEP-4`) | `REQ-CHN-13`, `REQ-DAT-11` to `REQ-DAT-13`, `REQ-VER-1` to `REQ-VER-5`, `REQ-VER-11` to `REQ-VER-13` |
| Release and operations (`STEP-5`) | `REQ-CHN-14`, `REQ-SKL-12`, `REQ-SKL-20`, `INV-4` |
| Evolution (`STEP-6`) | `REQ-CHN-15`, `REQ-SKL-10`, `REQ-SKL-11`, `REQ-TEM-5`, `REQ-TEM-7`, `REQ-DEC-34`, `REQ-DEC-35`, `REQ-DOC-10`, `INV-7` |
| Decisions (`XC-1`) | `REQ-DEC-1` to `REQ-DEC-42`, `REQ-DAT-14` to `REQ-DAT-16`, `REQ-SKL-5`, `REQ-IFC-3` to `REQ-IFC-6`, `REQ-IFC-9` to `REQ-IFC-12`, `INV-17`, `REQ-TEM-3`, `REQ-TEM-4`, `INV-1` to `INV-4`, `INV-9`, `INV-11` |
| Measurement (`XC-2`) | `REQ-CHN-17`, `REQ-DOC-9`, `REQ-EXP-4`, `DEF-5` |
| Compliance evidence (`XC-3`) | `REQ-CHN-16`, `REQ-DAT-20`, `REQ-DOC-12`, `REQ-DOC-15`, `REQ-VER-13`, `INV-14`, `INV-15` |
| Lessons (`XC-4`) | `REQ-CHN-18`, `REQ-TEM-6` |
| Experiments | `REQ-EXP-1` to `REQ-EXP-7`, `REQ-SKL-9`, `INV-10` |
| Living documents | `REQ-DOC-1` to `REQ-DOC-15`, `REQ-DAT-1` to `REQ-DAT-4`, `INV-5`, `INV-6`, `INV-13` |
| Interfaces | `REQ-IFC-1` to `REQ-IFC-12`, `REQ-KNB-2`, `NFR-8` |
| Reporting | `REQ-SKL-13`, `REQ-SKL-16`, `REQ-SKL-21`, `REQ-SKL-22`, `REQ-DEC-36`, `REQ-DEC-37` |

---

## 13. Assumptions

Each assumption is a recommended option that nobody has ruled. It is written into the requirements above as if
ruled, so the spec reads whole. Pablo confirms or overturns them on five form items, `v3-asm-trust`, `v3-asm-method`, `v3-asm-form`, `v3-asm-docs` and `v3-asm-packaging`. An assumption
he overturns is changed by an amendment. Rulings R1 to R22 are not assumptions.

| ID | Assumption | Tag | Used by |
|---|---|---|---|
| `ASM-1` | v1 holds one organisation with several teams on one shared spec | Assumption (recommendation of the product-definition review §3, multiple teams) | §3.2, `REQ-TEM-1`, `DEF-11` |
| `ASM-2` | A project may carry several profiles, one per component | Assumption (recommendation of the review §3, industry first) | `REQ-ITK-11` |
| `ASM-3` | The threat model uses STRIDE unless the profile names another method | Assumption (recommendation of the review §2, item 2) | `REQ-CHN-7` |
| `ASM-4` | Agents reach the MCP server with OAuth 2.1, and get a short-lived token per agent and task from the git host's app | Assumption (recommendation of the review §3, repository access) | `REQ-IDN-3`, `REQ-IDN-4` |
| `ASM-5` | Commits are made as the human with a co-author trailer, or as the platform-signed app; never as a per-agent identity alone | Assumption (recommendation of the review §3, repository access) | `REQ-IDN-6`, `INV-16` |
| `ASM-6` | Read-only snapshots are shared through expiring links | Assumption (recommendation of the review §3, repository access) | `REQ-IDN-7` |
| `ASM-7` | AI-assisted checks run with the user's model access; Narthex runs no model in v1 | Assumption (recommendation of the review §3, natural-language layer, applied to checks) | `REQ-VER-12` |
| `ASM-8` | A review step and `review` skill before merge | Assumption (recommended option of `0002-adopt`, A1) | `REQ-SKL-8`, `STEP-3` gate |
| `ASM-9` | No turn ends waiting on CI; a script waits and resumes the agent | Assumption (recommended option of `0002-adopt`, A2) | `REQ-SKL-7`, `REQ-SKL-28` |
| `ASM-10` | Numbers are reserved in one registry per repo; duplicates are rejected | Assumption (recommended option of `0002-adopt`, A3) | `REQ-DAT-8`, `REQ-VER-1` |
| `ASM-11` | One form per project, with a publish lock | Assumption (recommended option of `0002-adopt`, A4) | `REQ-DEC-22`, `INV-11` |
| `ASM-12` | Questions come in passes, at most one per milestone; values the owner supplies are `act` items (A5's `provide` kind folded into `act`) | Assumption (recommended option of `0002-adopt`, A5) | `REQ-DEC-9`, `REQ-DEC-21`, `REQ-SKL-13` |
| `ASM-13` | Rulings given outside the form are recorded as relayed answers with their source | Assumption (recommended option of `0002-adopt`, A6) | `REQ-DEC-31`, `INV-7` |
| `ASM-14` | Editions are flagged stale when their source moves on | Assumption (recommended option of `0002-adopt`, A7) | `REQ-DOC-11` |
| `ASM-15` | Each agent has its own worktree and build directory; PRs are rebased and checked again before merge | Assumption (recommended option of `0002-adopt`, A8) | `REQ-SKL-25`, `REQ-SKL-29` |
| `ASM-16` | The plan's task table is checked and its waves generated; contracts freeze first; shared conformance suites | Assumption (recommended option of `0002-adopt`, A9) | `REQ-CHN-12`, `REQ-SKL-6` |
| `ASM-17` | "New" means unseen by the viewer; items keep an edit history | Assumption (recommended option of `0002-adopt`, A10) | `REQ-DEC-15` |
| `ASM-18` | `dispatch` backs off on usage limits | Assumption (recommended option of `0002-adopt`, A11) | `REQ-SKL-7` |
| `ASM-19` | Items may be deferred with a reason and a target | Assumption (recommended option of `0002-adopt`, A16) | `REQ-DEC-29` |
| `ASM-20` | Items may carry `due`, a release scope | Assumption (recommended option of `0002-adopt`, A17) | `REQ-DEC-11` |
| `ASM-21` | `decide` can seed a form from an existing project | Assumption (recommended option of `0002-adopt`, A18) | `REQ-DEC-32` |
| `ASM-22` | The finder drafts the item; the spec owner applies the ruling | Assumption (recommended option of `0002-d4`) | `REQ-SKL-31` |
| `ASM-23` | Checks are tagged with identifiers; anchors show "checked by"; alarms fire on failed checks, foreign identifiers and unknown touchpoints; running products are held; golden paths | Assumption (recommendation of amendment 0003 A3) | `REQ-KNB-1`, `REQ-DOC-12`, `REQ-VER-4`, `REQ-VER-6`, `REQ-VER-9` |
| `ASM-24` | Each step has a fixed brief and a script-decided exit; reports end with a requirement-to-evidence table | Assumption (recommendation of amendment 0003 A4) | `REQ-SKL-13`, `REQ-SKL-14`, `REQ-VER-13` |
| `ASM-25` | specsite is the living-docs implementation: Starlight sites and `specsite html` editions; HTML first, PDF after | Assumption (recommended option of `0004-specsite`) | `REQ-DOC-8`, `REQ-DOC-13` |
| `ASM-26` | A `needs.json`-compatible export | Assumption (recommended option of `0004-needs`) | `REQ-DAT-20` |
| `ASM-27` | Every profile keeps the universal parts; a profile is a data file; editions are pinned; profile views | Assumption (recommendation of amendment 0005 A1 and A2) | `REQ-DAT-9`, `REQ-DAT-10`, `REQ-DAT-17`, `REQ-DAT-18`, `REQ-KNB-6`, `REQ-DOC-15` |
| `ASM-28` | Intake proposes a profile and the lead confirms it; a hazard-derived level is never asked; tailoring is recorded as decisions | Assumption (recommendation of amendment 0005 A4) | `REQ-CHN-4`, `REQ-ITK-12` to `REQ-ITK-14` |
| `ASM-29` | Narthex produces the structure of evidence and claims no certification or tool qualification | Assumption (recommendation of amendment 0005 A5) | §1.7, `INV-15` |
| `ASM-30` | The decisions capability is usable alone | Assumption (recommended option of `oq-2`) | `REQ-DEC-38` |
| `ASM-31` | The repo is the record of every answer; the store is an inbox | Assumption (recommended option of `oq-6`) | `REQ-DAT-15` |
| `ASM-32` | Items are written in JSON | Assumption (recommended option of `oq-7`) | `REQ-DAT-14` |
| `ASM-33` | The log plus amendments record rulings, with no record file per ruling | Assumption (recommended option of `oq-8`) | `REQ-DAT-16` |
| `ASM-34` | Agents may act on defaults of reversible items before the answer | Assumption (recommended option of `oq-9`) | `REQ-DEC-5` |
| `ASM-35` | Notifications go by Claude push notifications first | Assumption (recommended option of `oq-10`) | `REQ-DEC-36` |
| `ASM-36` | "Discuss first" answers build an agenda page | Assumption (recommended option of `oq-12`) | `REQ-DEC-28` |
| `ASM-37` | A ref opens its target in a modal | Assumption (recommended option of `oq-15`) | `REQ-DOC-6` |
| `ASM-38` | Anchors come from identifiers; headings get slugs too | Assumption (recommended option of `oq-16`) | `REQ-DOC-3` |
| `ASM-39` | Evidence tags are required in research and explainers | Assumption (recommended option of `oq-18`) | `REQ-DOC-9` |
| `ASM-40` | The skills ship as one Claude Code plugin, plus an Agent Skills install path | Assumption (recommended option of `oq-19`) | §1.8, `REQ-SKL-32` |
| `ASM-41` | Narthex's repository stays local until a second project runs it | Assumption (recommended option of `oq-20`) | `REQ-SKL-35` |
| `ASM-42` | Dispatched agents run as subagents in worktrees | Assumption (recommended option of `oq-22`) | `REQ-SKL-7` |
| `ASM-43` | An agent merges only when its task says so, with CI green | Assumption (recommended option of `oq-23`) | `REQ-SKL-25` |
| `ASM-44` | The traceability graph and the amendment diff are in v1; the dispatch board waits | Assumption (recommended option of `oq-24`) | `REQ-DAT-11`, `REQ-DAT-12`, `REQ-DOC-10`, `DEF-4` |
| `ASM-45` | Guard hooks enforce the mechanical house rules from v1 | Assumption (recommended option of `oq-25`) | `REQ-SKL-27` |
| `ASM-46` | House-rule defaults ship with Narthex, extended by a project file | Assumption (recommended option of `oq-26`) | `REQ-SKL-17` |
| `ASM-47` | A fast path for changes that touch no identifier | Assumption (recommended option of `oq-27`) | `REQ-SKL-15` |
| `ASM-48` | Experiment logs are committed under `experiments/` | Assumption (recommended option of `oq-28`) | `REQ-DAT-1`, `REQ-EXP-2` |
| `ASM-49` | An agent may drop an experiment and report it | Assumption (recommended option of `oq-29`) | `REQ-EXP-7` |
| `ASM-50` | specsite keeps type pairing A and accent `#6A3FD9`, as built. Its further questions go to specsite's own form, one form per project | Assumption (recommended option of `ss-brand-type`) | None in this spec |
| `ASM-51` | Three experience levels, and the default guidance entry for each | Assumption (new in v0.3.0, elaborating R2 and R5) | §3.3, §5.3, `REQ-ITK-4` |
| `ASM-52` | A project's default file names: `PRODUCT.md`, `ARCHITECTURE.md`, `adr/`, `ops/` | Assumption (new in v0.3.0) | `REQ-DAT-1` |
| `ASM-53` | The item-type prefixes of §6.3 and the trace-link types of §6.4 | Assumption (new in v0.3.0) | §6.3, §6.4 |
| `ASM-54` | Two new skills, `design` and `release`, for `STEP-2` and `STEP-5` | Assumption (new in v0.3.0, from R15) | `REQ-SKL-4`, `REQ-SKL-12` |
| `ASM-55` | A legal check applies only to sector material derived from a copyrighted standard; the text of an open standard ships without one | Assumption (new in the review of v0.3.0, reading R4) | `REQ-KNB-7`, `OQ-12` |
| `ASM-56` | Validation is the product-spec owner's answer on the form, judged against the product specification | Assumption (new in the review of v0.3.0) | `REQ-CHN-13` |

---

## Appendix A. From v0.2.0

How every identifier of SDD Studio v0.2.0 and of amendments 0001 to 0005 maps to this version: `history/v0-id-map.md`.
