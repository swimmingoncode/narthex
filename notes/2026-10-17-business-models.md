# Open-source-first business models for Narthex (2026-10-17)

Input to SPEC `OQ-3` (pricing and business model), ruled "decide after the Bloque pilot". It only prepares the
choice. Prices come from vendors' own pages on 2026-10-17 and change. **Unverified** marks unconfirmed items.

## What Narthex has to sell

Code and documents are MIT (`LICENSE`). Assets: the **method** and **skills**, an **MCP server**, a **web GUI**,
a **knowledge base** of sector profiles and a **planned book**. Narthex has no agent of its own (R9) and v1
does not host user code (`REQ-IDN-2`). Customers in order (R12): Bloque's teams, individual engineers, factories.

## The models

### M1. Open core

- **How:** the core is open; a paid edition adds features. GitLab prices by likely buyer and publishes
  [stewardship commitments](https://handbook.gitlab.com/handbook/company/stewardship/) and
  [tiering rules](https://handbook.gitlab.com/handbook/product/tiering-guidance-for-features/).
- **Examples:** [GitLab](https://about.gitlab.com/install/ce-or-ee/) (CE and EE);
  [Sidekiq](https://sidekiq.org/) (open core plus paid Pro and Enterprise; **unverified** terms);
  [Plausible](https://plausible.io/self-hosted-web-analytics) (free AGPL edition without SSO, funnels or the sites API).
- **Free / paid for Narthex:** free method, skills, MCP server and single-user GUI. Paid: multi-team features
  such as SSO, org-wide audit export, role policies, cross-project traceability.
- **Risks:** the free/paid line causes friction; GitLab moved 18 paid features down in 2020
  ([report](https://devclass.com/2020/03/31/gitlab-asks-customers-to-help-it-open-source-a-raft-of-features)).
- **Fit:** weak for Bloque (an internal pilot pays nothing); good for software factories that need governance.

### M2. Hosted service of the open-source software

- **How:** run it for people; charge for convenience, uptime, scale, compliance.
- **Examples:** [Supabase](https://supabase.com/pricing) (Apache-2.0 repo, free tier, Pro from $25 a month, Team
  from $599, usage overages); [Plausible Cloud](https://plausible.io/self-hosted-web-analytics) (subscription
  funds development); [Sentry](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/)
  (source-available under FSL, free to self-run).
- **Free / paid for Narthex:** self-host free. Paid: hosted GUI and MCP endpoint, decision inbox and audit
  store, backups, SSO. This hosts decisions and documents, not user code (hosted git stays `DEF-3`).
- **Risks:** operations and security duty for a small team; re-hosting (see Risks); compliance cost.
- **Fit:** best for newcomers at Bloque who cannot self-host, and for individuals who want zero setup.

### M3. Support and subscriptions

- **How:** the software is free; the subscription buys a supported, certified, long-lived build and people.
- **Examples:** [Red Hat's subscription model](https://redhat.com/en/about/subscription-model-faq) (support,
  lifecycle, certified ecosystem); [Nabu Casa](https://www.nabucasa.com/) (subscription and hardware, most
  profit goes to the Home Assistant foundation, per its own page).
- **Free / paid for Narthex:** free everything. Paid: onboarding, a private channel, review of a team's spec
  against the method, versioned sector-profile releases with a support window.
- **Risks:** scales with people, not copies; slow; needs a legal entity and an SLA.
- **Fit:** good for software factories and consultants; fair for Bloque.

### M4. Dual licensing and source-available variants

- **How:** one licence for open use, another for those who cannot accept it: [Qt](https://www.qt.io/qt-licensing)
  sells a commercial licence beside LGPL and GPL. Source-available variants restrict competing hosts, then
  convert: Sentry's FSL becomes Apache-2.0 or MIT after two years;
  [HashiCorp moved to BSL on 2023-08-10](https://www.hashicorp.com/en/blog/hashicorp-adopts-business-source-license).
- **Free / paid for Narthex:** AGPL for the server and GUI, with a paid exception for closed platforms.
- **Risks:** one copyright holder is needed (contributor agreement); changes hurt trust (see Risks); MIT
  already published (v0.3.0) cannot be withdrawn from old versions.
- **Fit:** low now. Narthex is a method more than a library; few buyers need an exception.

### M5. Marketplace and paid content packs

- **How:** sell content beside a free core. [Tailwind Plus](https://tailwindcss.com/plus) is a paid UI kit
  beside the free MIT framework. In January 2026 its maker said revenue fell about 80 percent and docs
  traffic about 40 percent, tied to AI tools ([DevClass](https://www.devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/),
  company-reported). Few other clean examples were found.
- **Free / paid for Narthex:** core profiles free; premium sector profiles (regulated finance, health, public
  sector) with expert-reviewed checks, as packs or a subscription.
- **Risks:** content is copied or regenerated by agents; expert review and currency are the defensible parts.
- **Fit:** good for factories in regulated sectors; poor for newcomers.

### M6. Training, certification and books

- **How:** teach the method; sell the credential and the book.
- **Examples:** [Shape Up](https://basecamp.com/shapeup) (read free online, print edition for sale; written by
  Ryan Singer, Basecamp built to follow it, so the book promotes the product);
  [Rails Tutorial](https://www.railstutorial.org/) (free sample chapters, paid ebook, videos and a $39 a month
  course); [Linux Foundation certifications](https://training.linuxfoundation.org/certification/) (exam and
  course bundles about $299 to $645, tied to open projects such as Kubernetes).
- **Free / paid for Narthex:** method site and book chapters free; print book, workshops, cohort courses and an
  exam for "Narthex-practising architect" paid.
- **Risks:** a credential needs trust and volume first; book income is slow and one-off.
- **Fit:** strong for factories (R6: they read the book last); useful for individuals; internal for Bloque.

### M7. Sponsorship and donations

- **How:** [GitHub Sponsors](https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors)
  takes no fee on personal accounts, up to 6 percent on organisations;
  [Open Collective](https://opencollective.com/about) gives a fiscal host and public ledger.
- **Example:** [Babel](https://opencollective.com/babel), about $1.66M raised to date and an estimated
  $254k a year, led by company sponsors.
- **Free / paid for Narthex:** all free; sponsors get a name and a roadmap voice.
- **Risks:** small, unreliable sums for a young project. **Fit:** a floor under other models, not a business.

### M8. Usage-based hosted MCP

- **How:** a hosted MCP endpoint priced by calls or seats. [Context7](https://context7.com/plans) (MIT
  [repo](https://github.com/upstash/context7)): free 1,000 calls a month, Pro $10 a seat with $5 per 1,000
  extra calls, Enterprise with SSO and self-hosting. A [vendor guide](https://peliqan.io/blog/mcp-server-pricing/)
  gives $0.001 to $0.10 per call (marketing source, **unverified**).
- **Free / paid for Narthex:** local MCP server free; hosted endpoint with a free tier, then seats plus overage.
- **Risks:** few, cheap calls mean low revenue per user. **Fit:** a metering layer of M2, not a model.

## Risks that cut across models

- **Cloud re-hosting.** Elastic moved to SSPL and ELv2 on 2021-02-02; AWS answered with
  [OpenSearch](https://www.techradar.com/news/aws-forks-elasticsearch-into-an-open-source-project-once-again),
  and Elastic [added AGPL back in 2024](https://www.elastic.co/blog/elasticsearch-is-open-source-again). For
  Narthex this risk is low today: the value is method and expert content, not an engine.
- **Licence changes.** Redis moved to SSPL in March 2024 and added AGPL in
  [May 2025](https://redis.io/blog/agplv3/), saying the move hurt its community; HashiCorp's change led to the [OpenTofu fork](https://opentofu.org/manifesto/) under the Linux Foundation. Lesson: fix the licence
  boundary before the first customer and publish it, as GitLab's stewardship page does.
- **Agents absorb the content.** Tailwind's case: assistants answer from the open material, so the docs no
  longer send buyers. Paid value must sit in what agents cannot copy: review, currency, accountability, hosting.

## Candidate combinations, ranked for Narthex

1. **MIT core + hosted team tier + book and training (M2 + M6, with M7 as a floor).** Free method, skills, local
   MCP server and GUI. Paid: a hosted workspace (decision inbox, audit, SSO) per seat. The book and a workshop
   feed it. Why first: it fits all three groups in order, keeps the licence promise and hosts no code. Cost:
   running a service.
2. **Services-led: support subscription + training and certification + book (M3 + M6).** No hosting, no feature
   gating. Why second: least infrastructure and licence risk, aimed at factories and consultants. Cost: income
   grows with staff time and trust, and starts slowly.
3. **Open core with paid sector-profile packs + usage-based hosted MCP (M1 + M5 + M8).** Why third: the clearest
   paid-feature line, but the packs can be copied by an agent (Tailwind) and usage revenue is thin. Revisit when
   regulated customers ask for vetted profiles.

## Questions the owner must answer

1. Is the goal a living for a small team, a funded company, or a sustained project?
2. Which parts stay MIT for good (method, skills, MCP server, GUI, knowledge base), in a published stewardship page?
3. Who owns the copyright, and are outside contributions taken under an agreement (needed for M4)?
4. Will Narthex run a hosted service at all, given security, privacy and SLA costs (M2, M8)?
5. What does Bloque contribute as first customer: sponsorship, a support contract or feedback? Any exclusivity?
6. Is the knowledge base the moat (paid packs, expert review) or the method (book, training)? Who reviews profiles?
7. Is the book sold, a funnel (free online, as Shape Up) or both? Who publishes it?
8. Which sectors come first, and do they need data residency or audit exports?
9. What entity sells, and does the [name decision](2026-10-17-name-search.md) come first?
