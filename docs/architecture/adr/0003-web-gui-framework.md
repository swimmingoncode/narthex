# ADR-0003: Astro for the web GUI, with small interactive islands

- **Status:** accepted by default (form item `adr-0003`, 2026-10-17; Pablo may still object)
- **Date:** 2026-10-17
- **Decision item:** `adr-0003`
- **Concerns:** `REQ-IFC-3`, `REQ-DEC-12` to `REQ-DEC-19`, `REQ-DOC-6`, `REQ-DOC-13`, `NFR-2`, `NFR-3`, `NFR-6`; SAD §2

## Context

The GUI shows four things (`REQ-IFC-3`): the decision inbox, the rendered documents, intake and profiles, and each
project's status. Most of it is reading. The interactive parts are the form and a few settings screens. It must
work on a phone (`NFR-2`) and load a 200-item form in under two seconds on 4G (`NFR-6`). The documents are already
rendered by specsite, an Astro and Starlight plugin.

## Options considered

### A. Astro with server rendering (Node adapter) and small islands

- Pro: the same framework as specsite; documents and app pages share one design and one build.
- Pro: ships no JavaScript by default; islands only where a page needs it. Good for phones.
- Pro: the Node adapter supports on-demand rendering, in standalone or middleware mode (Astro docs), so the GUI
  can mount inside the server process.
- Con: less suited to a large single-page app. The GUI is not one.

### B. Next.js (React)

- Pro: very popular; many examples.
- Con: heavier client bundles by default; a second framework next to specsite; more moving parts to self-host.

### C. SvelteKit

- Pro: small bundles, pleasant to write.
- Con: a second framework; no reuse of specsite.

### D. No framework: server-rendered HTML templates

- Pro: smallest possible.
- Con: we would rebuild layout, routing and docs integration that Astro gives.

## Decision (recommendation)

**A.** Build the GUI with Astro, server-rendered through the Node adapter in middleware mode, mounted in the
server process. Use islands only for interactive parts. The decision form itself stays the page the Python
builder produces (ADR-0009); the GUI serves it and adds the inbox across projects around it.

## Consequences

- One design system for docs and app pages.
- The form page and the GUI share the store adapter API, not a component library.
- Accessibility and phone checks (375 px, 40 px targets) run in CI on both.

## Sources

- Astro Node adapter: https://docs.astro.build/en/guides/integrations-guide/node/
- specsite README: https://github.com/swimmingoncode/specsite
