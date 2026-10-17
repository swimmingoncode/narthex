# Research: spec formats per industry and product type (2026-10-17)

Scope: Part A (Cloudflare/VoidZero "Void"), Part B (spec formats by domain), synthesis (spec profiles).
Method: web search and fetch on 2026-10-17. Most sources are secondary (vendor, consultancy, wiki); primary standards are paywalled and were not read. Marker **[U]** = unverified or from general knowledge, not backed by a retrieved source. Standard clause numbers should be checked against the standard text before being cited in a spec.

## Part A. Cloudflare and VoidZero: Void

- The New Stack article ([link](https://thenewstack.io/cloudflare-voidzero-void-vibe-coding/)) came back truncated on fetch; only the headline was readable: Cloudflare open-sources Void so IT gets a handle on apps employees vibe-code. The details below come from secondary coverage.
- Background: VoidZero (makers of Vite, Vitest, Rolldown, Oxc, Vite+) joined Cloudflare on 2026-06-04, with those tools staying MIT and open source ([Cloudflare](https://blog.cloudflare.com/voidzero-joins-cloudflare/), [SiliconANGLE](https://siliconangle.com/2026/06/04/cloudflare-acquires-voidzero-maker-vite-javascript-toolchain/)).
- Announcement, about 2026-10-15 (one source gives that date; exact day not confirmed): Void is three MIT-licensed parts, an SDK for full-stack Vite apps, a CLI that deploys and provisions Cloudflare resources, and a self-hostable Platform, an admin dashboard for access control and deployment oversight ([aiidelist](https://aiidelist.com/blog/cloudflare-void-open-source-vite-deployment), [Forgenex](https://www.forgenex.com/en/blog/cloudflare-libera-void-controla-las-apps-vibe-coding-de-tus-empleados)).
- Origin: it started as a commercial deployment service for Vite apps; Evan You said it was open-sourced because it was no longer needed commercially ([secondary report quoting him on X](https://www.forgenex.com/en/blog/cloudflare-libera-void-controla-las-apps-vibe-coding-de-tus-empleados)). The quote was not checked on X.
- Audience: IT teams and SMEs facing shadow IT from non-technical staff deploying AI-built internal tools ([Forgenex](https://www.forgenex.com/en/blog/cloudflare-libera-void-controla-las-apps-vibe-coding-de-tus-empleados)).
- Guardrails: admins decide who deploys and who accesses each app; the shared environment adds resource limits and isolation ([aiidelist](https://aiidelist.com/blog/cloudflare-void-open-source-vite-deployment)). One report says there is no mandatory security review before deploy, owners can make apps public, and self-hosting needs a paid Workers for Platforms plan, R2 and a PostgreSQL database ([secondary summary](https://aiidelist.com/blog/cloudflare-void-open-source-vite-deployment)). Not confirmed against Cloudflare's own post, which the search did not surface.
- Relation to specs: none found. The guardrails are runtime and organisational (access, limits, hosting), not spec-level; Forgenex says explicitly that specs and agents are not discussed.
- What it means for SDD Studio: (1) it validates the demand for oversight of AI-built software, but at the deployment layer, upstream of nothing; SDD Studio's layer (intent, decisions, traceability) is untouched and complementary. (2) A spec can name Void-like platforms as deployment targets and encode the "who may deploy, what data, how audited" policy the Forgenex article recommends ([source](https://www.forgenex.com/en/blog/cloudflare-libera-void-controla-las-apps-vibe-coding-de-tus-empleados)) as profile rules. (3) The gap Void leaves (no mandatory review) is where a spec-conformance gate could sit. No design change is needed.

## Part B. Spec formats by domain

### B1. Open-source fintech, payments, ledgers

| Aspect | Findings |
|---|---|
| Governing standards | PCI DSS v4.0.1 (Req. 6 secure systems and software; 6.2 bespoke code, 6.5 change management) ([summary](https://www.ampcuscyber.com/blogs/pci-dss-requirement-6/)); SOC 2 Trust Services Criteria, CC8.1 change management ([summary](https://answers.securityscientist.net/q/26216/what-does-soc-2-cc8-actually-require-for-change-management)); ISO 20022 for messages ([ISO 20022](https://iso20022.org/about-iso-20022)); SR 11-7 model risk if models drive decisions ([Fed](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm)); EBA outsourcing guidelines, in force 2019-09-30 ([Addleshaw Goddard](https://www.addleshawgoddard.com/en/insights/insights-briefings/2019/financial-regulation/eba-guidelines-on-outsourcing-arrangements/)); DORA register of ICT third parties ([Sidley](https://datamatters.sidley.com/2025/04/15/financial-entities-in-the-eu-time-to-register-your-ict-third-party-service-providers-under-dora/)) |
| Required artifacts | No single mandated spec. Expected: documented secure SDLC, change records (approval, test, security impact, rollback), component inventory, risk assessments, vendor register ([PCI](https://www.ampcuscyber.com/blogs/pci-dss-requirement-6/), [SOC 2 CC8](https://answers.securityscientist.net/q/26216/what-does-soc-2-cc8-actually-require-for-change-management)). ISO 20022 gives a three-layer model: business model, message definition, physical XML schema ([ISO catalogue](https://www.iso20022.org/understanding-iso-20022-business-process-catalogue)) |
| Notation | Natural language plus data schemas; ISO 20022 uses UML-modelled messages converted deterministically to XML Schema ([ISO catalogue](https://www.iso20022.org/understanding-iso-20022-business-process-catalogue)). Ledger invariants (double entry, conservation) are normally prose or property tests **[U]** |
| Verification, traceability | Assessors weigh evidence of year-round operation over written policy ([PCI note](https://www.ampcuscyber.com/blogs/pci-dss-requirement-6/)); SOC 2 evidence is complete populations over the period, e.g. PR approvals, test results, deploy records ([CertPro](https://certpro.com/soc-2-audit-checklist-and-readiness-steps/)). No requirement-to-test traceability mandated as such **[U]** |
| Independence, change control | PCI: review by someone other than the author ([summary](https://www.ampcuscyber.com/blogs/pci-dss-requirement-6/)); SR 11-7: three lines of defence, validation sized to materiality ([secondary](https://cimcon.com/what-is-sr-11-7-guidance-on-model-risk-management)) |
| Certification evidence | PCI assessment (ROC/SAQ), SOC 2 Type I (point in time) or Type II (at least six months) report ([CertPro](https://certpro.com/soc-2-audit-checklist-and-readiness-steps/)) |
| Tooling | CI/CD and ticketing exports as evidence ([CertPro](https://certpro.com/soc-2-audit-checklist-and-readiness-steps/)); OpenAPI plus linters; for correctness-first ledgers, deterministic simulation (TigerBeetle's VOPR, [docs](https://docs.tigerbeetle.com/about/vopr)) and Jepsen-style external audit ([Jepsen on TigerBeetle](https://jepsen.io/analyses/tigerbeetle-0.16.11)) |

- Open-source adds a governance layer: Mojaloop publishes specifications, standards and Apache 2.0 code for interoperable payments ([repo](https://github.com/mojaloop/project)). Its current foundation and API-spec process were not confirmed.
- Open-source does not remove obligations: the operator deploying it carries PCI/SOC 2/outsourcing duties; the project carries a secure SDLC story. The spec should separate "project guarantees" from "operator obligations" **[U, design inference]**.
- The bar is evidence over time, not document completeness; the ledger's invariants are the real spec and deserve the strongest notation available.
- Sources on SR 11-7 and EBA are mostly commentary; SR 11-7 applicability to a ledger (not a model) is conditional **[U]**.

### B2. Aeronautics and avionics, including distributed and BFT systems

| Aspect | Findings |
|---|---|
| Governing standards | DO-178C with supplements DO-331 (model-based), DO-332 (OO), DO-333 (formal methods) ([DO-178C](https://en.wikipedia.org/wiki/DO-178C), [Ansys](https://www.ansys.com/simulation-topics/what-is-do-178c)); DO-254 for hardware; ARP4754A/ARP4754B and ARP4761/ARP4761A (the "A" revisions of ARP4761 and "B" of ARP4754 appeared in Dec 2023, [Jama](https://www.jamasoftware.com/blog/arp4761)); DO-297 for IMA ([Wikipedia](https://en.wikipedia.org/wiki/Integrated_modular_avionics)); DAL A to E from failure-condition severity ([ARP4761](https://en.wikipedia.org/wiki/ARP4761)) |
| Required artifacts | System: FHA (aircraft then system level), PSSA, SSA, common-cause analysis, requirements validation ([ARP4761](https://en.wikipedia.org/wiki/ARP4761), [Jama](https://www.jamasoftware.com/blog/arp4761)). Software: plans, high- and low-level requirements, architecture, source, verification cases and results; the supplements add model and formal-analysis artifacts ([Ansys](https://www.ansys.com/simulation-topics/what-is-do-178c)). Exact document list per DO-178C Section 11 **[U]** |
| Notation | Natural-language "shall" requirements at system level; DO-331 allows models as requirements or design, and a model cannot be both specification and design model ([Ansys](https://www.ansys.com/simulation-topics/what-is-do-178c)); DO-333 allows formal proof to replace some testing ([same](https://www.ansys.com/simulation-topics/what-is-do-178c)) |
| Verification, traceability | Bidirectional: aircraft to system requirements to architecture to SW/HW to verification evidence; hazards map to requirements to evidence ([practitioner guide via search](https://www.jamasoftware.com/blog/arp4761)). Objectives shrink as DAL falls ([Rapita](https://rapitasystems.com/files/MC-WP-011%20DO-178C%20Verification_5.pdf)); DAL A needs MC/DC, DAL B decision coverage ([Wikipedia](https://en.wikipedia.org/wiki/DO-178C)) |
| Independence, change control | Verifier must not be the author for independence objectives; counts disagree between sources (A: 30 or 33, B: 18 or 21) ([search result summary](https://en.wikipedia.org/wiki/DO-178C)); take counts from DO-178C Table A |
| Certification evidence | Software Accomplishment Summary, configuration index and the traceable life-cycle data submitted to the authority **[U]**; tool qualification under DO-330 (SCADE KCG as TQL-1, [Ansys](https://innovationspace.ansys.com/knowledge/forums/topic/efficient-development-of-safe-avionics-software-with-do-178c-objectives-using-scade-suite/)) |
| Tooling | SCADE with qualified code generator ([Ansys](https://innovationspace.ansys.com/knowledge/forums/topic/efficient-development-of-safe-avionics-software-with-do-178c-objectives-using-scade-suite/)); CompCert (Coq-verified compiler), qualified for ATR 42/72 MFC_NG at the start of 2026 per a vendor ([AbsInt via Aerospace Innovations](https://aerospace-innovations.com/successful-qualification-of-compcert-for-the-multi-function-computer-new-generation-mfc_ng-of-atr-42-72-aircraft/)); TLA+ at AWS as non-certified precedent ([CACM 2015](https://cacm.acm.org/magazines/2015/4/184701-how-amazon-web-services-uses-formal-methods/fulltext)) |

- BFT specifics: the search found nothing on how DO-178C or DO-297 treat Byzantine fault models. IMA relies on strict temporal and spatial partitioning ([Wikipedia](https://en.wikipedia.org/wiki/Integrated_modular_avionics)); TTEthernet (SAE AS6802) is cited as a fault-tolerant backbone, by a vendor ([TTTech via Military & Aerospace](https://www.militaryaerospace.com/computers/article/16726805/development-system-for-rapidly-prototyping-complex-arinc-653-based-avionics-introduced-by-tttech)). Literature on SPIDER, SAFEbus and Byzantine agreement is the likely source of the fault-model argument **[U]**.
- The spec for such a system therefore needs a fault model section (how many faulty nodes, what arbitrary means), safety properties and liveness assumptions as first-class items, plus the hazard link.
- The formal-methods precedent is split: certified avionics uses DO-333 plus qualified tools; distributed-systems design uses TLA+/P as design-time checking and test oracle ([AWS 2025](https://cacm.acm.org/practice/systems-correctness-practices-at-amazon-web-services)).
- Revision churn is real (ARP4754B, ARP4761A, IEC-style editions); the profile must pin the standard edition per project.

### B3. Automotive

| Aspect | Findings |
|---|---|
| Governing standards | ISO 26262 (ASIL A to D from severity, exposure, controllability) ([Sodius Willert](https://www.sodiuswillert.com/en/blog/traceability-standards-regulations-in-the-automotive-industry)); Automotive SPICE (process assessment) ([LDRA mapping](https://ldra.com/wp-content/uploads/ldra/ISO_26262–and_ASPICE_v1.1.pdf)); ISO 21448 SOTIF, second edition in draft with comments closed 2026-09-11 ([ISO](https://www.iso.org/standard/93071.html?browse=tc)); UNECE R155 (CSMS) and R156 (SUMS) ([SPK&A](https://www.spkaa.com/blog/unece-r155-vs-r156-explained-what-automotive-engineering-leaders-need-to-know), [UL](https://www.ul.com/sis/insights/software-update-management-systems-according-unece-r156)) |
| Required artifacts | HARA, safety goals, functional safety concept, technical safety requirements allocated to HW/SW ([Ketryx](https://www.ketryx.com/blog/navigating-iso-26262-and-iec-61508-3-functional-safety-standards)); SOTIF covers hazards without failure, from performance limits ([standard listing](https://www.standards.govt.nz/shop/iso-214482022/)); CSMS and SUMS certificates are process certificates ([SPK&A](https://www.spkaa.com/blog/unece-r155-vs-r156-explained-what-automotive-engineering-leaders-need-to-know)) |
| Notation | Natural language, often with ASIL attribute; model-based design common **[U]** |
| Verification, traceability | Bidirectional hazard to goal to requirement to implementation to test ([Sodius Willert](https://www.sodiuswillert.com/en/blog/traceability-standards-regulations-in-the-automotive-industry)); ASPICE makes bidirectional traceability a base practice ([same](https://www.sodiuswillert.com/en/blog/traceability-standards-regulations-in-the-automotive-industry)); SWE.1/SWE.2 mapping is general knowledge **[U]** |
| Independence, change control | ASIL-dependent independence of confirmation measures **[U]**; Part 8 tool classification and qualification ([search summary](https://www.ketryx.com/blog/navigating-iso-26262-and-iec-61508-3-functional-safety-standards)); R156 recertification after yearly updates per one source ([UL](https://www.ul.com/sis/insights/software-update-management-systems-according-unece-r156)) |
| Certification evidence | Safety case and assessment per ISO 26262; ASPICE capability level reports; R155/R156 type approval via certified management systems (certificate often three years) ([SPK&A](https://www.spkaa.com/blog/unece-r155-vs-r156-explained-what-automotive-engineering-leaders-need-to-know)) |
| Tooling | DOORS, Polarion and similar, with traceability breaking at tool boundaries ([Sodius Willert](https://www.sodiuswillert.com/en/blog/traceability-standards-regulations-in-the-automotive-industry)); ReqIF originated in automotive ([Wikipedia](https://en.wikipedia.org/wiki/Requirements_Interchange_Format)) |

- Automotive is the home of exchange formats: suppliers and OEMs trade requirements via ReqIF, so an export path is a market need here.
- Three regimes stack: functional safety (faults), SOTIF (no fault, insufficient intent) and cybersecurity/update (R155/R156). A profile needs to carry all three attribute families.
- Orphan code (code with no requirement) is a named assessor concern, from the IEC 61508 discussion; check ISO 26262 wording ([Ketryx](https://www.ketryx.com/blog/navigating-iso-26262-and-iec-61508-3-functional-safety-standards)).

### B4. Medical devices

| Aspect | Findings |
|---|---|
| Governing standards | IEC 62304 (classes A, B, C), ISO 14971 (risk), ISO 13485 and FDA 21 CFR 820, now the QMSR in force 2026-02-02, incorporating ISO 13485:2016 by reference ([IntuitionLabs](https://intuitionlabs.ai/articles/fda-qmsr-iso-13485-changes-2026), [Covington](https://www.cov.com/news-and-insights/insights/2024/02/fda-finalizes-rule-incorporating-iso-13485-into-new-quality-management-system-regulation-qmsr)). A vendor claims IEC 62304 Ed. 2 (two process-rigor levels) was targeted for Aug 2026 **[U]** ([source](https://meddeviceguide.com/blog/soup-software-unknown-provenance-iec-62304-guide)) |
| Required artifacts | Classes set documentation depth: A minimal, B detailed requirements and risk analysis, C full lifecycle incl. architecture and unit testing ([JAMB docs](https://jamb.readthedocs.io/en/latest/iec-62304/safety-classifications.html), [Citrusbits](https://citrusbits.com/what-is-iec-62304/)). Risk management file; design and development file (clause 7.3 of ISO 13485, **[U]**, replaces the DHF concept in QMSR) |
| Notation | Format not dictated; evidence may live in documents, repositories, tickets or validated tools if traceability and control are shown ([Greenlight Guru](https://www.greenlight.guru/blog/iec-62304-software-dhf)) |
| Verification, traceability | User need to requirement to design to code to verification, plus risk control links ([Matrix Requirements](https://matrixreq.com/blog/iec-62304)); ISO 14971 needs each hazard traced to analysis, controls, verification and residual risk (cl. 4.5, [Greenlight Guru](https://greenlight.guru/blog/risk-management-documentation-iso-14971)); SOUP analysed as part of risk ([MedDeviceGuide](https://meddeviceguide.com/blog/soup-software-unknown-provenance-iec-62304-guide)); coverage targets cited by vendors are not in the standard ([search summary](https://matrixreq.com/blog/iec-62304)) |
| Independence, change control | Change impact analysis required ([Matrix Requirements](https://matrixreq.com/blog/iec-62304)); post-market monitoring of SOUP anomalies ([MedDeviceGuide](https://meddeviceguide.com/blog/soup-software-unknown-provenance-iec-62304-guide)) |
| Certification evidence | The file itself, inspected (FDA) or audited (notified body); ISO 13485 certification not mandatory under QMSR, compliance is ([IntuitionLabs](https://intuitionlabs.ai/articles/fda-qmsr-iso-13485-changes-2026)) |
| Tooling | Requirements/risk tools such as Matrix, Greenlight; docs-as-code like JAMB ([JAMB](https://jamb.readthedocs.io/en/latest/iec-62304/safety-classifications.html)) |

- Class is derived from risk analysis, not chosen: the spec profile's level must be an output of a hazard step ([JAMB](https://jamb.readthedocs.io/en/latest/iec-62304/safety-classifications.html)).
- Medical is the clearest example of "format-neutral, traceability-strict": the regulator accepts a repo if the chain is demonstrable.
- Terminology moved with QMSR (DMR became MDF per one consultancy, **[U]**); keep terms in a profile glossary, not hard-coded.
- External risk controls can lower the software class ([search summary](https://matrixreq.com/blog/iec-62304)): spec must record where a control lives.

### B5. Rail, space, nuclear (combined)

| Aspect | Rail (EN 50128 / EN 50716) | Space (ECSS-E-ST-40C) | Nuclear (IEC 60880) |
|---|---|---|---|
| Standard status | EN 50716 replaces EN 50128 and EN 50657; levels from Basic Integrity to SIL 4 ([EVS](https://www.evs.ee/en/evs-en-50716-2023), [MathWorks](https://au.mathworks.com/solutions/railway-systems/en-50716.html)) | Rev.1 dated 2025-04-30 ([ECSS](https://ecss.nl/standard/ecss-e-st-40c-rev-1-software-30-april-2025)) | 2006 edition for category A functions; a new IEC/IEEE edition was listed as publishing Sept 2026, status unconfirmed ([IEC](https://webstore.iec.ch/publication/3795), [Genorma](https://genorma.com/en/standards/iec-ieee-60880-ed1)) |
| Spec artifacts | Software requirements, design, verification, validation plus assessment report | Requirements baseline through V&V, tailored per project ([ECSS](https://ecss.nl/standard/ecss-e-st-40c-rev-1-software-30-april-2025)) | Requirements spec, design, implementation, verification, validation, documentation ([IEC](https://webstore.iec.ch/publication/3795)) |
| Independence | Independent expert assessors at SIL 4 (openETCS example) ([report](https://itea4.org/index.php/project/workpackage/document/download/2607/D4.5.%20openETCS%20-%20Assessment%20Report.pdf)); tool classification and qualification ([EVS/vendor](https://www.evs.ee/en/evs-en-50716-2023)) | Via product assurance and reviews **[U]** | Not covered by retrieved sources **[U]** |
| Notes | Formal methods recommended at high SIL **[U]**; openETCS applied formal modelling | Tailoring matrix by criticality is the core mechanism **[U]** | Category A is the highest safety class (IEC 61226) ([IEC](https://webstore.iec.ch/publication/3795)) |

- Lesson: all three are tailorable by integrity level and demand independent assessment at the top; the openETCS case is an open-source safety-critical precedent with published assessment ([report](https://itea4.org/index.php/project/workpackage/document/download/2607/D4.5.%20openETCS%20-%20Assessment%20Report.pdf)).
- Space's explicit tailoring step is a good model for profile selection: start from a full set and delete with recorded rationale.

### B6. Blockchain and consensus protocols

| Aspect | Findings |
|---|---|
| Governing process | Ethereum: EIPs; the execution-layer spec (EELS) is an executable Python reference implementation plus tests ([execution-specs](https://github.com/ethereum/execution-specs)); a Last Call EIP needs a complete EELS implementation and tests; Final EIPs are immutable ([EELS docs](https://steel.ethereum.foundation/docs/execution-specs/specs/adding_a_new_eip/)). Consensus-specs are also Python, with tests generated from them (only via a fork page, verify at ethereum/consensus-specs) **[U]**. Polkadot: RFC repo, template-based, three formal reviews, on-chain Fellowship vote; a merged RFC is support, not an implementation commitment ([forum](https://forum.polkadot.network/t/polkadot-protocol-proposals-rfc-process/1421)) |
| JAM | The Gray Paper (Gavin Wood, Token2049 April 2024) specifies JAM, with the PolkaVM replacing WebAssembly ([Decrypt](https://decrypt.co/227221/the-week-in-polkadot-gavin-wood-unveils-major-upgrade-jam-at-token2049)). A secondary source claims a near-final v0.8 in 2025 **[U]**; notation and current version not verified (graypaper.com not reached) |
| Formal models | Tendermint: Markdown spec, often paired with TLA+, and Ivy proofs of safety and accountability (if two correct nodes disagree, evidence shows at least f+1 misbehaved) ([spec](https://docs.tendermint.com/master/spec/), [Ivy](https://docs.tendermint.com/master/spec/ivy-proofs/), [Galois](https://www.galois.com/articles/formally-verifying-the-tendermint-blockchain-protocol)). Raft: Ongaro's TLA+ spec (thesis appendix) lacked invariants as published; community versions add election safety ([thread](https://discuss.tlapl.us/msg05989.html), [repo](https://github.com/codeharris/raft.tla)). Paxos: TLA+ and TLAPS proofs, extended to Multi-Paxos ([paper](https://arxiv.org/abs/1606.01387v4), [Examples](https://github.com/tlaplus/Examples)) |
| Verification | Conformance by shared test vectors (EEST fixtures run against many clients) ([execution-specs](https://github.com/ethereum/execution-specs)); model checking and proof for protocol-level safety; implementation traced through tests, not a certifier |
| Independence | Multiple independent client implementations act as the cross-check ([execution-specs](https://github.com/ethereum/execution-specs) lists besu, erigon, geth, nethermind, reth) |
| Tooling | Python spec + pytest/fixtures; TLA+/TLC/Apalache, TLAPS, Ivy |

- This domain is the closest to the owner's BFT case: the spec is the protocol, safety and liveness properties are first-class, and a formal model is expected, not exceptional.
- "Spec as executable code" is a distinct format: the reference implementation is normative, prose is commentary. SDD Studio's SPEC.md-normative stance would need a rule for which artifact wins.
- Governance is in the spec lifecycle (draft, review, last call, final/immutable); this maps to amendments and freeze.
- Fault model and threat assumptions (f of n, synchrony) must be named in every consensus spec **[U, general knowledge]**.

### B7. Web/SaaS products and APIs

| Aspect | Findings |
|---|---|
| Standards, processes | OpenAPI 3.x for REST, AsyncAPI for events (primary pages not fetched **[U]**); linting with Spectral supports OpenAPI 3.1, 3.0, 2.0, Arazzo and AsyncAPI 2.x, but AsyncAPI 3.0 support unconfirmed ([Stoplight](https://blog.stoplight.io/api-linting-with-spectral-keeps-getting-better)); Gherkin Given/When/Then as executable specs and living docs ([Bornfight](https://www.bornfight.com/blog/behavior-driven-development-automation-testing-with-cucumber/)); Shape Up pitch: problem, appetite, solution, rabbit holes, no-gos ([Basecamp](https://basecamp.com/shapeup/1.5-chapter-06)) |
| Artifacts | API description (machine-readable contract), PRD or pitch, scenarios per feature |
| Notation | Schema (YAML/JSON), semi-formal scenarios, natural language |
| Verification, traceability | Contract linting in CI, scenario runs; living documentation only covers behaviour that has scenarios ([search summary](https://www.bornfight.com/blog/behavior-driven-development-automation-testing-with-cucumber/)); traceability usually informal (issue to PR) **[U]** |
| Independence, change control | Normally PR review; governance beyond a linter (design-time feedback, portfolio tracking, runtime validation) is needed ([API Evangelist roundup via search](https://blog.stoplight.io/api-linting-with-spectral-keeps-getting-better)) |
| Tooling | Spectral, Redocly CLI, Cucumber |

- A pitch is deliberately light: direction and boundaries, with the team owning the detail ([37signals](https://37signals.com/podcast/writing-a-pitch/)). Appetite and no-gos are a strong fit for a lead who scopes agent work.
- Gherkin plus OpenAPI give executable acceptance; they leave invariants and decisions implicit. SDD Studio adds exactly those.
- This is the default profile for most users; the others add on top of it.

### B8. Cross-domain requirement standards

| Item | What it contributes |
|---|---|
| ISO/IEC/IEEE 29148:2018 | Current requirements-engineering standard; defines good-requirement attributes, processes, and information items (StRS, SyRS, SRS, BRS, OpsCon); superseded IEEE 830 ([listing](https://connect.snv.ch/en/ieee-29148-2018-2), [830 record](https://connect.snv.ch/en/ieee-830-1998)). One summary counts 9 per-requirement and 5 per-set characteristics ([Modern Requirements](https://www.modernrequirements.com/?p=32595)); names not retrieved **[U]** |
| EARS | Five patterns: ubiquitous, event-driven, state-driven, unwanted behaviour, optional feature; from Rolls-Royce (RE'09) ([Wikipedia](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax)); keywords WHEN/WHILE/IF-THEN/WHERE are general knowledge **[U]** |
| IEEE 830 | Superseded SRS outline, still the common template ([record](https://connect.snv.ch/en/ieee-830-1998)) |
| Volere | Requirements template and process (Robertson); not researched in this pass **[U]** |
| sphinx-needs | Typed need objects (req, spec, impl, test by default), typed links via `needs_extra_links`, filtering, JSON export (`needs.json`) and import ([tutorial](https://sphinx-needs.readthedocs.io/en/stable/tutorial.html)) |
| StrictDoc | Requirement fields (UID, STATUS, TITLE, STATEMENT, RATIONALE, COMMENT), ReqIF import and export (one profile only) ([export code](https://strictdoc.readthedocs.io/en/latest/_source_files/strictdoc/backend/reqif/reqif_export.py.html)); has a DO-178 requirements example ([docs](https://strictdoc.readthedocs.io/en/latest/DO178_requirements.html)); no sphinx-needs bridge found |
| ReqIF | OMG XML format for lossless requirement exchange, v1.2 formal 2016-07; origin in German automotive (HIS, 2004) ([OMG](https://www.omg.org/spec/ReqIF), [Wikipedia](https://en.wikipedia.org/wiki/Requirements_Interchange_Format)) |

- SDD Studio's id families (REQ/INV/ERR/NFR/OQ/DEF/US/AC) already resemble typed needs; sphinx-needs and ReqIF are natural export targets.
- RFC 2119 keywords and EARS are compatible: EARS fixes sentence shape, 2119 fixes force.

## Synthesis: a spec-profile model for SDD Studio

### Universal (every profile)

- Stable, never-reused ids with typed families; numbered amendments; decisions as data with links both ways; invariants as first-class items.
- A traceability graph (requirement, decision, task, PR, test, measurement) with change-impact query. Every surveyed regime that regulates ([medical](https://matrixreq.com/blog/iec-62304), [automotive](https://www.sodiuswillert.com/en/blog/traceability-standards-regulations-in-the-automotive-industry), [avionics](https://www.jamasoftware.com/blog/arp4761)) asks for the same chain; only depth and strictness differ.
- A profile declaration at the top of the spec: profile name, version, standards edition pins, tailoring record.

### Varies by profile

| Dimension | Light end (SaaS) | Heavy end (safety-critical) |
|---|---|---|
| Notation | RFC 2119 prose, Gherkin | EARS, models, formal (TLA+, SCADE, Coq) |
| Mandatory sections | Problem, appetite, no-gos, AC | Fault model, hazard log, safety goals, allocation, assumptions |
| Hazard analysis | None | FHA/PSSA/SSA, HARA, ISO 14971 file |
| Formal model | None | Required for named invariants |
| Verification evidence | CI results | Coverage, reviews, proof, qualified tools, per-level objectives |
| Review independence | Peer PR | Different person or team, recorded per item |
| Change control | PR approval | Impact analysis, re-validation, formal change board |
| Export | HTML, OpenAPI | ReqIF, needs.json, evidence bundle |

### Candidate profiles

1. **P-PRODUCT** (SaaS/API): 2119 prose, AC as Gherkin, OpenAPI link, pitch-style scope. Evidence: CI. Based on [Shape Up](https://basecamp.com/shapeup/1.5-chapter-06) and [Gherkin](https://www.bornfight.com/blog/behavior-driven-development-automation-testing-with-cucumber/).
2. **P-OSS-LEDGER** (open-source fintech, owner's case): P-PRODUCT plus conservation/atomicity invariants (INV) with property or simulation tests ([VOPR example](https://docs.tigerbeetle.com/about/vopr)), ISO 20022 mapping table where relevant, and a "project guarantees vs operator obligations" split.
3. **P-REG-FINTECH**: P-OSS-LEDGER plus PCI/SOC 2 evidence map ([CC8](https://answers.securityscientist.net/q/26216/what-does-soc-2-cc8-actually-require-for-change-management)), third-party register ([DORA](https://datamatters.sidley.com/2025/04/15/financial-entities-in-the-eu-time-to-register-your-ict-third-party-service-providers-under-dora/)), validation independence for models ([SR 11-7](https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm)).
4. **P-PROTOCOL** (consensus, BFT): fault model, safety and liveness property items, executable-reference or formal-model artifact declared normative, conformance vectors, review phases mirroring draft/last call/final ([EELS](https://steel.ethereum.foundation/docs/execution-specs/specs/adding_a_new_eip/), [Polkadot RFC](https://forum.polkadot.network/t/polkadot-protocol-proposals-rfc-process/1421), [Tendermint](https://docs.tendermint.com/master/spec/)).
5. **P-SAFETY** (parameterised by level: DAL A-E, ASIL A-D, SIL 0-4, IEC 62304 A-C): EARS, hazard log with trace to requirements, per-level objective table (coverage, independence, tool qualification), assessor sign-off record. One profile with a level parameter, not twelve profiles **[U, design choice]**.
6. **P-MEDICAL** may be a P-SAFETY variant with risk file and DHF/MDF mapping; keep separate only if vocabulary diverges.

### Selection at intake

- Intake asks: domain, deployment context, who is harmed on failure, regulators/customers requiring evidence, open or closed source. The answers propose a profile; the lead confirms in the decision form as a normal decision (DEC) with rationale.
- The level (DAL/ASIL/class) is never asked directly where it derives from risk analysis ([IEC 62304 classification via ISO 14971](https://jamb.readthedocs.io/en/latest/iec-62304/safety-classifications.html)): intake records "level pending hazard analysis" and blocks profile-dependent gates until the hazard step is done.
- Tailoring is allowed with recorded rationale, as ECSS does by design **[U]**; every deleted obligation becomes a decision.

### Enforcement by builder and linter

- Profile = data file listing: required sections, allowed id families, per-item mandatory attributes (e.g. `level`, `verification_method`), notation checks (EARS pattern regex, 2119 keyword use), trace rules (every REQ has a verifier, every code unit a requirement), and gates.
- Linter rules produce errors for universal rules and profile-severity findings for the rest. Examples: orphan requirement, orphan code (assessor concern, [source](https://www.ketryx.com/blog/navigating-iso-26262-and-iec-61508-3-functional-safety-standards)), invariant without a check, level without hazard link.
- Builder renders profile-specific views (evidence matrix, hazard table) and exports (ReqIF via an exporter like [StrictDoc's](https://strictdoc.readthedocs.io/en/latest/_source_files/strictdoc/backend/reqif/reqif_export.py.html), `needs.json`-shaped JSON).
- Independence cannot be linted from text; record reviewer identity per item and lint that reviewer differs from author where the profile demands it **[U, design inference]**.

## Implications for SDD Studio

1. Add a `profile` field to the spec header and a profile-as-data mechanism; ship P-PRODUCT and P-OSS-LEDGER first, since the owner's case is the second.
2. Keep ids, amendments, decisions, invariants and the trace graph universal; every domain surveyed demands the same chain at different strictness.
3. Make invariants machine-linkable to checks (property tests, simulations, models); this is the common thread of ledgers and consensus.
4. Treat "which artifact is normative" as a profile property (prose, executable reference, formal model).
5. Do not claim certification fitness. SDD Studio can produce evidence structure, not assessor-accepted qualification; tools used in safety projects need their own qualification ([DO-330 example](https://innovationspace.ansys.com/knowledge/forums/topic/efficient-development-of-safe-avionics-software-with-do-178c-objectives-using-scade-suite/)).
6. Plan exporters in order: HTML/PDF (exists), needs.json-like JSON, ReqIF.
7. Pin standard editions in the profile; revisions are moving (ARP4754B, ISO 21448 2nd edition, QMSR, IEC 62304 Ed. 2 rumour).
8. Part A: no design change; position as the spec layer upstream of platforms like Void.

## Open questions for the owner

1. Is the first profile truly open-source fintech only, or should P-PROTOCOL (BFT) ship alongside it?
2. Should a profile be allowed to mark the executable reference or formal model as normative over SPEC.md?
3. Is evidence-bundle export (for PCI/SOC 2 style audits) in scope, or only the spec side?
4. Who may act as independent reviewer when the team is one lead plus agents, and does an agent count?
5. Are you willing to treat primary standards (paywalled) as out of reach, and rely on citations to secondary guides plus pinned editions?
