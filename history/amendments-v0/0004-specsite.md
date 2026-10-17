# Amendment 0004: specsite is the living-docs module

**Status:** proposed, not ruled. Nothing here is applied to `SPEC.md`.
**Target:** `SPEC.md` v0.2.0 (0002 and 0003 proposed alongside)
**Date:** 2026-10-12
**Source:** `notes/2026-10-12-specsite.md`, relayed by the aledgent session at Pablo's request.
**Rulings recorded:** item `ru-specsite`, Pablo's two principles as relayed: the `.md` is the source of
truth, and a tool other projects need is a public repo, reusing an existing one if there is one.
**Rulings needed:** `0004-specsite`, `0004-needs`.

## A1: module LD is specsite

§6 names `swimmingoncode/specsite` as the implementation of module LD:
- a Starlight plugin for each project's docs site;
- `specsite html` for single-file editions published as private artifacts.

SDD Studio's spec keeps the requirements (`REQ-LD-*`); specsite's roadmap takes them in this order:
1. backlinks from `decisions/` and `amendments/` (`REQ-LD-5`);
2. the build-failing reference check (`REQ-LD-8`);
3. tombstones (`REQ-LD-4`);
4. editions published next to the decision form (`REQ-LD-6`);
5. PDF (`REQ-LD-9`).

If adopted, `OQ-13`, `OQ-14` and `OQ-17` close:
- `OQ-13`: Starlight plus a pandoc-based HTML CLI;
- `OQ-14`: each project's site, plus private artifact editions;
- `OQ-17`: HTML in v1, PDF after.

`OQ-3` is answered by Pablo's ruling of 2026-10-12, relayed: every Swimming on Code project, SDD Studio and
specsite included, is MIT unless a stronger licence requires otherwise; copyright "Pablo Dorado" until the
company is incorporated.

## A2: source of truth, and public tools

`REQ-CO-22`: rendered documents, editions and copies are always generated from the repo's Markdown at a named
commit, never edited or copied by hand (this extends `REQ-LD-12`, proposed in 0002 A7).
`REQ-CO-23`: a tool that more than one project needs is a public repository, and an existing tool that does
the job is used instead of a new one. The decision form's builder is the next candidate.

## A3: a standard export

`REQ-LD-13`: the renderer can export the requirements as a `needs.json`-compatible file (id, type, title, status,
links, source location), so traceability tools such as sphinx-needs or DOORS can import them without a
rewrite of our Markdown (`0004-needs`).

## Questions raised

- Does the decision-form builder also become a public repository, by `REQ-CO-23`? Not asked yet: it waits
  on `OQ-19`, the packaging question.
