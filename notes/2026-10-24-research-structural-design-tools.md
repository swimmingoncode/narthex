# Research: structural design software and the `safety` profile (2026-10-24)

Case, kept generic: software used by civil engineers in France and the EU to design structures that carry energy and
transport infrastructure. It operates nothing, but a wrong result can end in an unsafe structure. Context: B2 (avionics,
tool qualification under DO-330) and B5 (rail, EN 50716) of `2026-10-17-research-spec-formats.md`, and its synthesis
(P-SAFETY, "do not claim certification fitness").

Marks: **[U]** unverified or secondary source only; **[I]** my interpretation. Standards are paywalled: I read slides and
vendor pages, not the standards, so every clause number is **[U]**.

## 1. Domain norms the tool implements

- The Eurocodes are EN 1990 (basis of design) to EN 1999 (aluminium); EN 1990 sets the basis and EN 1991 to 1999 give
  actions and material rules ([JRC](https://eurocodes.jrc.ec.europa.eu/second-generation-eurocodes)). Part-by-part list **[U]**:
  the JRC page links to a per-part status page I could not open.
- Status of the second generation, as of 2026-10-24:
  - All formal votes under Mandate M/515 finished in November 2025 ([JRC](https://eurocodes.jrc.ec.europa.eu/news/second-generation-eurocodes-milestones-achieved)).
  - Texts due to national standards bodies by 30 March 2026 (DAV); national publication by 30 September 2027 (DoP); conflicting
    first-generation national standards withdrawn by 30 March 2028 (DoW) ([JRC](https://eurocodes.jrc.ec.europa.eu/second-generation-eurocodes)).
  - So in 2026 both generations coexist. A French publication calendar and the French national annexes for generation 2: not
    found. A 2022 trade article gave national annexes voted by September 2027 ([FFB](https://www.ffbatiment.fr/revues-guides/bam/67-juin-2022/eurocodes-une-nouvelle-generation-en-preparation)); **[U]**, may have moved.
- French national annexes: France implements the Eurocodes through a national annex per part, for example NF EN 1990/NA
  ([AFNOR](https://www.boutique.afnor.org/en-gb/standard/nf-p061002/eurocodes-basis-of-structural-design-part-2-national-annex-to-en-19902002/fa125576/23193)).
  They fix the Nationally Determined Parameters (partial factors, climatic loads and so on). A tool must therefore hold
  parameters per country and per edition.
- Legal status: the Commission Recommendation 2003/887/EC is not binding; it asks Member States to adopt the Eurocodes as
  a design tool and reference them in national rules ([JRC](https://eurocodes.jrc.ec.europa.eu/policies-standards-policies-and-legislation-construction-sector/recommendation-related-en-eurocodes)).
  French rules making them mandatory (public works, seismic): not found **[U]**.
- What they say about software:
  - First-generation EN 1990 assumes the design is made by qualified and experienced personnel and that execution is
    supervised ([SCIA training deck on EN 1990](https://downloads.scia.net/support/sciaengineer/manuals/15/eurocode/[eng]eurocode%20training%20-%20en1990%202011.1.pdf)). I found no "use of software" clause in it.
  - EN 1990 Annex B ties reliability classes RC1 to RC3 to design supervision levels: DSL1 self-check, DSL2 checking by
    different persons, DSL3 checking by a different organisation ([search summary of Annex B](https://eurocodes.jrc.ec.europa.eu/sites/default/files/2022-06/Moscow08_9_Gulvanessian.pdf)); **[U]**, secondary copy.
  - Second generation adds provisions for numerical methods. Draft prEN 1990 text, per the SC7 chair's 2024 slides: numerical
    models "should capture all significant" mechanical behaviour; "non-linear numerical models should be validated";
    a sensitivity study for non-linear limit-state functions; an informative Annex X "Numerical Methods" whose stated
    assumption is that "numerical software is properly validated and verified", with validation (per application domain,
    against reference solutions) and verification (per project: sensitivity checks, judgement of results) distinguished
    ([CEN/TC250/SC7 seminar slides](https://www.nen.nl/media/PDF/3-SC7_Paris_-_EN_1997_and_EN1990_-_Van_Seters.pdf)).
    Draft text, so wording and clause numbers **[U]**; check the published EN 1990:2023 and Annex X.
  - A University of Luxembourg abstract says the Eurocodes offer mostly classical design models and that the application of
    the associated software "is not regulated by norms" ([ORBilu](https://orbilu.uni.lu/handle/10993/50783)); not fetched in full **[U]**.

## 2. Is design software regulated or certified? Who is responsible?

- Software itself: I found no EU or French regime that certifies or approves structural design software before sale
  (nothing in the searches below; absence of evidence **[U]**). A design program is not a construction product in the
  sense of the Eurocodes' presumption-of-conformity route **[I]**; the Recommendation page ties that presumption to the
  works, not to tools ([JRC](https://eurocodes.jrc.ec.europa.eu/policies-standards-policies-and-legislation-construction-sector/recommendation-related-en-eurocodes)).
- Responsibility sits with people, not the tool:
  - The lead engineer answers for software results; QA by verification and validation is the means (UK source: [IStructE journal 2016](https://istructe.org/journal/volumes/volume-94-(2016)/issue-3/verification-validation-qa-computer-aided-design); page returned 403, taken from a search summary **[U]**).
  - A vendor (not a regulator) states that its validation document supports the designer's review and that "the reasoned
    judgement on the reliability of the code remains the designer's responsibility" ([GeoStru](https://support.geostru.eu/en/ufaqs/how-is-the-reliability-of-geostru-calculation-codes-documented/)). Expect this disclaimer pattern from every vendor.
  - France: the contrôleur technique (approved technical controller) checks solidity and safety of works within the
    cases the law lists, and carries the Civil Code art. 1792 to 1792-2 presumption of liability within the limits of the
    mission ([Légifrance L111-23](https://www.legifrance.gouv.fr/codes/id/LEGIARTI000019017620/2008-06-19), a 2008 version; current text **[U]**). Mandatory cases: [R111-38](https://www.legifrance.gouv.fr/codes/id/LEGIARTI000006896018/2002-02-23), a 2002 version **[U]**.
  - Décennale insurance and designers' (concepteurs') liability under art. 1792: general rule, nothing on software authors
    found. How a software defect flows to the engineer's insurer or back to the vendor: **[U]**, ask a lawyer.
- New exposure for the vendor: the Product Liability Directive (EU) 2024/2853 covers software as a product; transposition
  by 9 December 2026, new rules for products placed on the market after that date ([CMS](https://cms.law/en/int/publication/the-new-eu-product-liability-directive-eu-2024-2853), [IBA](https://www.ibanet.org/European-Product-Liability-Directive-liability-for-software)). Whether
  economic loss from a structural defect counts as recoverable damage under it: **[U]**. Contract limits of liability
  may not protect against it **[U]**.
- National guidance on validating structural software: not found.
  - Cerema (the successor of SETRA's bridge-engineering work) publishes and sells its own bridge software (ST1, MUR, CDS,
    CONVOA) ([Cerema](https://www.cerema.fr/en/centre-ressources/boutique/engineering-structure-software), [GMO/AFGC slides, Jan 2026](https://www.afgc.asso.fr/app/uploads/2026/01/GMO_AFGC_2026_A-webinaire-du-8-janvier-2026.pdf)); I saw no validation guide or test set. Its terms for standard-bridge
    calculation limit service to valid, compatible inputs ([Cerema terms](https://logiciels-oa.cerema.fr/Ponts_Types/Conditions_Ventes_Prestations_calculs_ponts_types_EN.pdf)). Ask the GMO team directly.
  - AFNOR: no software-validation standard for structures found.
  - ISO 19650 (information management with BIM) covers exchange, recording and versioning of information and prescribes no
    software ([ISO 19650-1 summary](https://store.standards.org.au/product/as-iso-19650-1-2019), [glossary](https://www.nomic.ai/glossary/iso-19650-information-management)); it matters for output formats, not for validation.

## 3. Tool qualification by analogy

Neither standard covers civil structures. IEC 61508 targets safety-related E/E/PE systems and EN 50716 railway software;
both qualify tools that build *executable code*. Everything here is an analogy **[I]**.

| Class | IEC 61508-3 ed. 2, cl. 7.4.4 | EN 50716:2023, 6.7 |
|---|---|---|
| T1 | No output that can contribute to the executable (text editor, configuration control) | Same idea; editors, configuration control ([Prover](https://www.prover.com/guide/cenelec-en-50716/) does not define T1; [QA Systems](https://www.qa-systems.com/blog/from-en-50128-to-en-50716-railway-software-compliance/)) **[U]** |
| T2 | Supports test or verification; can miss defects but cannot create errors in the executable (coverage, static analysis) | Verification tools; selection justified for T2 at SIL 1 to 4 (cl. 6.7.4.2, quoted by a vendor, **[U]**); tool diversity allowed |
| T3 | Output can contribute to the executable (compiler, code generator) | Compilers, code generators; selection justified; independent T2 tool may check a T3 tool's output ("tool diversity") |

Sources: [UL slides at 61508.org](https://61508.org/wp-content/uploads/2024/11/09B-IEC-61508-Why-tool-qualification_V2_cut.pdf) (IEC 61508-3 ed. 2), [Springer chapter](https://link.springer.com/chapter/10.1007/978-3-031-80504-2_11), [QA Systems](https://www.qa-systems.com/blog/from-en-50128-to-en-50716-railway-software-compliance/), [Prover](https://www.prover.com/guide/cenelec-en-50716/).

What each class requires, IEC 61508-3 as summarised by the UL slides (clause numbers **[U]**):
- Selection of the off-line tools justified for T1, T2, T3; for T3, evidence that the tool conforms to its specification or
  documentation (7.4.4.1 to 7.4.4.6).
- Tool validation with records of pass and fail, and measures to control failures attributable to the tool (7.4.4.7 to 7.4.4.10).
- T2 and T3 items that enter the configuration baseline: record tool information; each new tool version qualified
  (7.4.4.15 to 7.4.4.19).
- Evidence for T3 can come from tool validation or from "increased confidence from use"; a TUV-linked source says the T3
  evidence may serve T2 too ([61508.org](https://61508.org/wp-content/uploads/2024/11/09B-IEC-61508-Why-tool-qualification_V2_cut.pdf), [Siemens blog](https://blogs.sw.siemens.com/verificationhorizons/2020/12/17/leveraging-iso-26262-tool-certification-in-iec-61508/)).
- Certificates: rail vendors cite independent T2 certification ([QA Systems](https://www.qa-systems.com/solutions/en-50716/), vendor claim); the standard asks for evidence, not a certificate **[U]**.
- ISO 26262 uses a different scheme (TCL); do not carry its table over ([Siemens blog](https://blogs.sw.siemens.com/verificationhorizons/2020/12/17/leveraging-iso-26262-tool-certification-in-iec-61508/)).

Which class fits **[I]**:
- A design program that *produces* member sizes, reinforcement or verification results that go straight into drawings
  maps to **T3**: its errors enter the safety-relevant item undetected. The "executable" is the built structure.
- A program used only to *check* a design made elsewhere (independent recalculation, code check) maps to **T2**: it can
  miss a defect but not create one.
- Pre/post-processing and viewers map to **T1** unless they transform data that feeds the calculation (then T3).
- Default for Narthex: classify per tool function, not per product, and record it as a decision. Tool diversity (a T3-like
  design tool plus an independent T2-like check by another tool or hand method) is the engineer's existing practice.

## 4. Verification and validation practice for engineering calculation software

- ASME V&V 10 (computational solid mechanics, 2019, reaffirmed): verification = the mathematical model is solved correctly
  (code and numerical error); validation = the right model is solved (physics). Full text paywalled ([ASME](https://www.asme.org/codes-standards/find-codes-standards/standard-for-verification-and-validation-in-computational-solid-mechanics), [BSI summary](https://knowledge.bsigroup.com/products/standard-for-verification-and-validation-in-computational-solid-mechanics-1)). The split into code verification and calculation verification: **[U]**.
- ASME V&V 40: risk-informed credibility from model influence and decision consequence, 13 credibility factors, built for
  medical-device models ([ASME blog](https://www.asme.org/topics-resources/content/bioengineering-blog-an-emerging-regulatory-framework-for-medical-device-simulation), [NIBIB copy of the standard's overview](https://www.imagwiki.nibib.nih.gov/sites/default/files/asme_vv_40_model_simulation_standard.pdf)). The idea transfers: required rigour follows the consequence of an error. A Narthex `safety` level could play that role.
- NAFEMS: the Standard NAFEMS Benchmarks (linear elastic tests such as LE1, elliptic membrane, with reference values) are
  the usual reference-solution set for finite-element codes ([Altair doc citing LE1](https://2021.help.altair.com/2021.2/hwsolvers/os/topics/solvers/os/nafems_test_problem_le1_r.htm)); NAFEMS also publishes
  quality-management guidelines for FEA ([R0033](https://nafems.org/publications/resource_center/r0033)) and reviewed ASME V&V 10 ([R0040/review](https://www.nafems.org/publications/resource_center/r0040/)). Whether LE1 applies to
  beam, plate or shell design codes: **[U]**.
- Eurocode worked examples: published collections give hand-checkable results (for example [Worked Examples to Eurocode 2](https://www.scribd.com/doc/36539707/Worked-Examples-to-Eurocode-2)); French sets: ask the expert.
- Independent recalculation: practitioners compare with hand calculations or textbook examples; some argue that checking
  one black box against another is not validation (forum views, weak sources: [Eng-Tips](https://www.eng-tips.com/threads/extent-of-software-validation.447733/post-8412273)) **[U]**.
- Regression suites: a fixed set of reference cases, with tolerances and the expected values and their source, run on
  every release; a vendor example is an FEA verification report built on NAFEMS targets with a stated mesh-convergence
  rule ([ESRD](https://www.esrd.com/stresscheck-results-standard-nafems-benchmarks-linear-elastic-tests-available/)).
- Vendor validation documents (scope, theory, benchmark tests) attachable to a calculation report already exist ([GeoStru](https://support.geostru.eu/en/ufaqs/how-is-the-reliability-of-geostru-calculation-codes-documented/)): the evidence shape users will ask for.

## 5. Adjacent regimes

- EN 50126 (railway RAMS): lifecycle process; 2017 edition, amendment A1:2024 valid 2024-12-02 ([EVS](https://www.evs.ee/en/evs-en-50126-1-2017-a1-2024-consolidated)). It governs rail systems, not
  bridge design tools; a structure that supports rail infrastructure is not clearly in scope **[U]**. Relevance: the
  hazard-analysis and risk-acceptance method (TR 50126-2 status unclear), if a rail client asks for it.
- IEC 61508 hazard analysis applied to a tool **[I]**: list the tool's functions, the hazardous failure of each (wrong
  load combination, wrong national parameter, silent unit error, wrong section property), the detection that exists
  (engineer check, controller, second tool), and a residual risk. This is the missing "tool hazard log".
- NIS2 (Directive 2022/2555): energy and transport are Annex I sectors; medium entities are "important", large ones
  "essential" ([NCSC Ireland guide](https://www.ncsc.gov.ie/pdfs/NCSC_NIS2_Guide.pdf), [secondary summary](https://cm-alliance.com/cybersecurity-blog/are-you-in-scope-of-nis2-the-complete-entity-classification-checklist)); thresholds **[U]**.
  The vendor of a design tool is likely not in scope itself; its clients may be, and will push supply-chain security
  questions down to it **[I]**. France has not finished transposing: bill passed the Senate in March 2025, floor debate
  postponed ([Banque des Territoires](https://www.banquedesterritoires.fr/cybersecurite-la-csnp-presse-le-parlement-dexaminer-sans-delai-le-projet-de-loi-de-resilience), [InCyber](https://incyber.org/en/article/france-despite-the-absence-of-a-government-the-nis2-bill-moves-forward/)); one source reports a Commission referral on 8 July 2026, single source **[U]**.
- GDPR: applies if the tool holds personal data (accounts, named engineers in project metadata); low risk for the calculation
  core **[I]**. Cyber Resilience Act: not researched **[U]**.

## 6. Implications for Narthex's `safety` profile

1. A safety project is a *tool-in-the-loop* case: the product is not the safety function, its output is. The profile needs
   a `consequence` block (what an undetected error can cause, who relies on it), distinct from the hazards of operating a
   system. Level stays "pending hazard analysis" at intake, as the synthesis says.
2. Items implementing a norm carry `standard`, `standard_edition`, `standard_clause`, `na_country` and `na_edition`
   (for example EN 1992-1-1, clause, NF national annex), and a generation tag (1 or 2). Editions are pinned in the profile
   header; coexistence of generations to 2028 makes this mandatory, not optional.
3. Every calculation requirement has `verification_method` with values at least `benchmark`, `worked_example`,
   `hand_calc`, `independent_tool`, `test`, `review`, and a `reference_solution` link (source, value, tolerance).
4. Evidence record types: `benchmark_result` (case id, expected, got, tolerance, tool version), `tool_classification`
   (function, class T1 to T3 as interpretation, rationale as a DEC), `independent_review` (reviewer differs from author).
5. A hazard log for the tool itself: failure modes per function with detection and residual risk, linked to requirements
   (item family HAZ, as already proposed for P-SAFETY).
6. Gates: release blocked if a regression suite has an unexplained failure, a norm parameter changed without a clause
   citation, or a `safety`-level item has no verifier. Each new tool version re-runs the suite (mirrors the 7.4.4 rule
   that every new version is qualified **[U]**).
7. Scope boundary section: what the tool does *not* check (execution, soil, loads supplied by the user), because the Eurocode
   assumptions (qualified personnel, supervision) put those on the engineer. Plus a "user duties" list the vendor
   must state: independent check at DSL2/DSL3 stays the engineer's.
8. Interface items for formats (IFC, native exchange files, reports) with a round-trip test, since errors often enter at
   exchange; link to ISO 19650-style information requirements.
9. Claim discipline: Narthex output is structure, not qualification. The spec must not say "certified" or "validated
   against Eurocodes" without a linked evidence record; the linter flags such words.
10. Intake asks the product owner: Eurocode parts and generation; structure types and materials; countries' national annexes;
    who checks results (same engineer, another, bureau de contrôle) at which reliability class; what the tool does versus
    what the engineer does by hand; which output formats feed which downstream tools; client demands for tool-qualification
    evidence; vendor liability terms; existing reference cases.

## 7. Questions to ask the domain expert

1. For a structure like yours, which Eurocode parts do you really use, and are you already working with the second
   generation, or only the first?
2. When a calculation program gives you a result, what do you do before you trust it?
3. Does your firm test or "validate" a program before using it on a project? What does it keep as proof?
4. Does the bureau de contrôle ever ask for a program's validation document, or for a hand check of key results?
5. Which reference cases do you know and trust (published worked examples, benchmark sets, your own old projects)?
6. If a program had a bug that changed a beam size, who would find it, and when?
7. Which results would you never accept from a program without a second method, and why?
8. Which national parameters (French annex values) cause the most mistakes when software is set up?
9. What files go from this software to the next tool or to drawings, and which transfers have gone wrong before?
10. What would you want a vendor to show you before you rely on a new version for a project that carries traffic or power lines?
Open: read the published EN 1990:2023 and Annex X; check IEC 61508-3 7.4.4 and EN 50716 6.7 wording; ask a lawyer about art. 1792 and PLD scope; French mandatory status and generation-2 calendar.
