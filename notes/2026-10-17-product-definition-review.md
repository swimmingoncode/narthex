# Product definition: thoughts, gaps, questions

2026-10-17. A response to Pablo's product definition of the same day (quoted in §1). Opinions are labelled as
such. Nothing here is ruled.

## 1. The definition, restated

- **Premise:** Prometheus gave mankind fire; SDD Studio gives mankind the ability to produce software at
  production scale.
- **What it is:** tools and a knowledge base that turn an agentic system into a **senior software architect**.
  That architect:
  - guides engineers and non-engineers through **requirements engineering**, with a clear process for
    iterative refinement (proposals, RFCs, amendments);
  - steers one agentic team, or several (an engineer coordinating other engineers who each have their own
    agentic team), through **software engineering**, using a standard or custom methodology;
  - keeps the methodology as skills and context prompts the team shares in common storage;
  - works with code, low-code or no-code, depending on the component.
- **Input:** a product specification. SDD Studio defines its format, but producing it is out of scope; that's
  a complementary product in the same chain (product mapping, an AI-assisted design sprint).
- **Industry first:** the industry or sector is the first thing asked, because the SRS varies by sector.
  SDD Studio supplies guidelines and supplementary normative material per industry, aligned to one standard
  data model. There's a default per user, with an override per project, for software factories and
  consultants.
- **Interface:** mainly MCP. It covers:
  - repository access, either through RBAC-enforced git with per-agent credentials or through expiring links;
  - the database of spec results;
  - formal ways to upload updates;
  - integrity checks, including CI with deterministic and AI-based assertions;
  - the methodology documentation each agent needs.
- **Open:** whether SDD Studio also offers an agent-to-agent natural-language layer.
- **Permission:** a one-time rewrite of SPEC.md is allowed now.

## 2. Is that the whole process?

Mostly. It matches the core of ISO/IEC/IEEE 12207 and SWEBOK: requirements, then design, then construction,
then verification. Six things are missing or hidden inside "software engineering". I'd name each one, because
a non-engineer won't know to ask for it.

1. **Architecture and design** between the SRS and construction: architecture decisions (ADRs), interfaces and
   contracts, data model, and the choice between code, low-code or no-code per component. The aledgent PLAN
   already does this; it deserves its own step and artefact (SAD).
2. **Security and threat modelling** as part of requirements, not an afterthought. Abuse cases, data
   classification and threat models feed requirements (STRIDE is the common method). Every sector profile
   needs it.
3. **Verification and validation as a step of its own.** Validation (did we build the right thing, against the
   product spec) is distinct from verification (did we build it right, against the SRS), and it is the one a
   non-engineer can judge. TDD, BDD and SPARC cover only verification.
4. **Release and operations:** deployment, observability, incident response, SLOs and runbooks. Production
   scale is the premise, and production is where most of the cost of software is.
5. **Evolution:** change requests after release, deprecation, migration. Amendments cover the spec side; the
   process also needs the code and data side (aledgent's migration plans).
6. **Compliance evidence** collected throughout, not at the end. This is where sector profiles bite.

Measurement (aledgent's runs and gates) and retrospectives (the lessons this repo keeps gathering) run across
all steps, not as steps.

Proposed chain, for the rewrite:

```
product spec (input)
  → requirements engineering → SRS
  → architecture & design → SAD (+ ADRs)
  → construction (TDD/BDD/SPARC, per milestone)
  → verification & validation → evidence
  → release & operations → runbooks, SLOs
  → evolution (amendments, migrations)
  ↺ decisions, measurement, compliance evidence and lessons, throughout
```

## 3. Thoughts on each part

### Industry and sector first
Agreed. In the data model:
- an organisation default with a project override;
- a project can carry several profiles per component, e.g. a ledger core (`oss-ledger`) and its consensus layer
  (`protocol`).

**Caution:** the normative material itself is copyrighted (ISO, IEC, RTCA, SAE). SDD Studio can ship:
- checklists;
- mappings to clause numbers;
- templates;
- its own explanatory guidance;
but not the standards' text. Some sectors may need partnerships, or the customer's own copy of the standard.
Worth a legal check before shipping any sector pack.

### The product spec as input
Define its minimum contract now, even if producing it is out of scope. Without one, the SRS step has nothing to
check against. A starting point:
- problem descriptors (users, needs, values, channels, costs, revenue: from the product-mapping method);
- goals and non-goals;
- the product map;
- success measures;
- constraints, including the sector;
- open questions.
The SRS step validates the input, and returns what's missing as items for whoever owns the product spec.

### Repository access
**My recommendation:** keep repos where users already have them (GitHub, GitLab), and have SDD Studio act as an
app on them, not as a git host. That keeps "the .md is the source of truth" literal and avoids taking custody of
customers' code.
- **Credentials:** GitHub App or GitLab app installation tokens are short-lived and scoped to repos and
  permissions. They are better than long-lived per-agent credentials. Agents authenticate to SDD Studio's MCP
  server with OAuth (the MCP authorization spec uses OAuth 2.1). The server then mints a scoped token per agent
  and per task.
- **Identity:** this is the lesson of aledgent's 224 unverified commits. Either agents commit as their human
  with a co-author trailer, or as an app identity whose commits the platform signs. A per-agent identity alone
  makes unverifiable history. RBAC should be keyed by role (lead, engineer, builder, reviewer) and by
  identifier ownership, CODEOWNERS-style, so routing to the owner of a requirement follows.
- **Expiring links:** right for read-only snapshots (the HTML editions, the decision form) shared with people
  outside the repo.
- **A hosted git option:** later, for customers with no git (non-engineer builders), or regulated customers
  wanting a managed, audited store.

### The MCP surface
Group it so a user's agent can discover it:
- **knowledge:** methodology skills, sector profiles, templates, explanations, versioned and fetched on demand
  (resources and prompts);
- **spec data:** query requirements, invariants, decisions and trace links (the `needs.json`-shaped model);
- **change:** propose an amendment, file a decision item, record a ruling, all as structured writes that end as
  commits or PRs in the user's repo;
- **verify:** deterministic checks (ids, references, trace gaps, profile gates) and AI-assisted reviews, also
  runnable in CI with the same rules;
- **decide:** the decision inbox. MCP elicitation lets a server ask the user structured questions through their
  own client. That could make the decision form client-agnostic, rather than tied to claude.ai artifacts as it
  is today.

### A natural-language agent layer on our side
**Not in v1, in my opinion.** The user's agent is already the natural-language layer. Structured tools plus the
knowledge base let it act as the architect. Our own agent would add:
- cost and latency, paid by us;
- custody of the customer's context;
- a second model to keep consistent with theirs.
A narrow "consult" tool later (ask the architect a design question; get an answer with cited guidance) is the
cheap way to test whether one is wanted.

### Multiple teams
What aledgent did with another of Bloque's engineers needs four things:
1. ownership of identifiers per team;
2. decision routing per role;
3. amendment conflict handling when two teams change the same requirement (merge or rebase, with a review);
4. one shared methodology store with per-team overrides.
That's the multi-team version of what already exists, and a good v1 boundary: one organisation, several teams,
one shared spec.

### Low-code and no-code
The component's spec stays the same whatever builds it. What changes:
- **the verify step:** contract tests against the component's interface, instead of code-level traces;
- **the builder:** amendment 0003's non-engineers.
Name the first target platforms when a pilot needs them.

## 4. Questions for Pablo

1. **First customers:** Bloque's teams, software factories and consultants, or individual engineers? It
   decides whether organisation and RBAC are v1 or later.
2. **Hosting:** user-owned repos with SDD Studio as an app (recommended), or SDD Studio hosting repos?
3. **The product-spec contract:** adopt the minimal input contract above, and route its gaps back as items?
4. **The chain:** add architecture and design, security, V&V, release and operations, and evolution, as in §2?
5. **Sector material:** accept that SDD Studio ships checklists, mappings and guidance, not standards' text, and
   check with a lawyer before the first regulated pack?
6. **The decision inbox:** move it toward MCP elicitation, keeping artifacts as one front end?
7. **The name:** "SDD Studio" was a working name. The Prometheus premise may want a name of its own.
8. **The rewrite:** fold amendments 0001–0005 and this definition into one SPEC.md, using each open item's
   recommended option as a marked assumption you can still overturn? The alternative is to wait for your rulings
   first.

## 5. Suggested next steps

1. Pablo answers §4. Questions 1, 2 and 8 are enough to start.
2. A one-time rewrite of SPEC.md and OVERVIEW.md around the restated definition and the chain in §2. Amendments
   0001–0005 are folded in, with the assumptions marked. The old spec is kept in git and an `amendments/`
   tombstone.
3. Then the profile work (`0005-*`), starting with `oss-ledger` and `product`, and the MCP surface sketched as a
   contract (tools, resources, prompts) before any code.
