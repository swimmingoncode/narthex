# From SDD Studio v0.2.0 to Narthex v0.3.0: identifier map

Moved out of SPEC.md on 2026-10-17 so that old identifiers don't clash with new ones in rendered editions.
Old identifiers below refer to SDD Studio SPEC v0.2.0 and amendments 0001 to 0005 (history/amendments-v0/).

## Map

Informative. Old amendments are in `history/amendments-v0/`. "Ruled by R#" cites `notes/2026-10-17-rulings.md`.

### A.1 Requirements of v0.2.0

| v0.2.0 | v0.3.0 |
|---|---|
| `REQ-CO-1` to `REQ-CO-3` | `REQ-DAT-1` to `REQ-DAT-3` |
| `REQ-CO-4` to `REQ-CO-6` | `REQ-DAT-5` to `REQ-DAT-7` |
| `REQ-CO-7` | `REQ-VER-1` |
| `REQ-CO-8` to `REQ-CO-12` | `REQ-SKL-19` to `REQ-SKL-23` |
| `REQ-CO-13` to `REQ-CO-18` | `REQ-EXP-1` to `REQ-EXP-6` |
| `REQ-CO-19` | `REQ-EXP-7`, changed by ASM-49 |
| `REQ-DI-1` to `REQ-DI-4` | `REQ-DEC-1` to `REQ-DEC-4` |
| `REQ-DI-5` to `REQ-DI-7` | `REQ-DEC-6` to `REQ-DEC-8` |
| `REQ-DI-8`, `REQ-DI-9` | `REQ-DEC-13`, `REQ-DEC-14` |
| `REQ-DI-10` | `REQ-DEC-15`, changed by ASM-17 |
| `REQ-DI-11` to `REQ-DI-14` | `REQ-DEC-16` to `REQ-DEC-19` |
| `REQ-DI-15` | `REQ-DEC-23` |
| `REQ-DI-16` to `REQ-DI-19` | `REQ-DEC-25` to `REQ-DEC-28` |
| `REQ-DI-20` to `REQ-DI-22` | `REQ-DEC-33` to `REQ-DEC-35` |
| `REQ-DI-23`, `REQ-DI-24` | `REQ-DEC-36`, `REQ-DEC-37` |
| `REQ-LD-1` to `REQ-LD-7` | `REQ-DOC-1` to `REQ-DOC-7` |
| `REQ-LD-8` | `REQ-VER-1` |
| `REQ-LD-9` | `REQ-DOC-8` |
| `REQ-LD-10` | `REQ-DOC-9`, `REQ-CHN-17` |
| `REQ-LD-11` | `REQ-DOC-10` |
| `REQ-WF-1` to `REQ-WF-3` | `REQ-SKL-1` to `REQ-SKL-3` |
| `REQ-WF-4` | `REQ-SKL-5` |
| `REQ-WF-5`, `REQ-WF-6` | `REQ-SKL-6`, `REQ-SKL-7` |
| `REQ-WF-7`, `REQ-WF-8` | `REQ-SKL-10`, `REQ-SKL-11` |
| `REQ-WF-9` | `REQ-SKL-13` |
| `REQ-WF-10`, `REQ-WF-11` | `REQ-SKL-17`, `REQ-SKL-18` |
| `REQ-WF-12` | `REQ-SKL-24`, provisional on `OQ-8` |
| `REQ-WF-13` | `REQ-SKL-25` |
| `REQ-WF-14`, `REQ-WF-15` | `REQ-SKL-26`, `REQ-SKL-27` |
| `REQ-WF-16` to `REQ-WF-18` | `REQ-SKL-32` to `REQ-SKL-34` |
| `REQ-WF-19` | `REQ-SKL-9` |
| `INV-1` to `INV-10` | `INV-1` to `INV-10`, same meaning |
| `NFR-1` to `NFR-7` | `NFR-1` to `NFR-7`; `NFR-3` now needs only the answer link, no account (R20) |
| `DEF-1` traceability graph | `REQ-DAT-11`, `REQ-DAT-12` (ASM-44) |
| `DEF-2` dispatch board | `DEF-4` |
| `DEF-3` measurement ledger | `DEF-5` |
| `DEF-4` meeting notes into rulings | `DEF-6` |
| `DEF-5` risk register | `DEF-7` |
| `DEF-6` several answerers | Ruled by R10: `REQ-TEM-3`, `REQ-TEM-4` |

### A.2 Open questions of v0.2.0

| v0.2.0 | Where it went |
|---|---|
| `OQ-1` Who is v1 for | Ruled by R12 (§1.5) |
| `OQ-2` Inbox as a product of its own | ASM-30 |
| `OQ-3` Licence | Ruled by item `oq-3`: MIT (§1.8) |
| `OQ-4` Keep the name "SDD Studio" | Ruled by R1: codename Narthex; the final name is `OQ-1` |
| `OQ-5` Where the form lives | Ruled by R3: the web GUI, linked from the MCP (`REQ-IFC-3`, `REQ-IFC-8`) |
| `OQ-6` to `OQ-10` | ASM-31 to ASM-35 |
| `OQ-11` Other answerers | Ruled by R10 (`REQ-TEM-4`) |
| `OQ-12` Agenda from "Discuss first" | ASM-36 |
| `OQ-13` Renderer | ASM-25: specsite |
| `OQ-14` Where docs are published | ASM-25: each project's site, plus private editions |
| `OQ-15`, `OQ-16` | ASM-37, ASM-38 |
| `OQ-17` PDF in v1 | ASM-25: HTML first, PDF after |
| `OQ-18` | ASM-39 |
| `OQ-19`, `OQ-20` | ASM-40, ASM-41 |
| `OQ-21` Pilot project | `OQ-11` |
| `OQ-22`, `OQ-23` | ASM-42, ASM-43 |
| `OQ-24` Candidate additions | ASM-44 |
| `OQ-25` to `OQ-29` | ASM-45 to ASM-49 |

### A.3 Amendments 0001 to 0005

| Item | Where it went |
|---|---|
| 0001 R1, experiments | `REQ-EXP-1` to `REQ-EXP-7`, `REQ-SKL-9`, `INV-10` (applied in v0.2.0, ruled by item `ru-experiments`) |
| 0001 R2, a quieter inbox | `REQ-DEC-13`, `REQ-DEC-14` |
| 0002 A1 to A11 | ASM-8 to ASM-18 |
| 0002 A12, spec gap (`0002-d1`) | `OQ-8`; provisional text in `REQ-SKL-24` |
| 0002 A13, test names (`0002-d2`) | `OQ-9`; provisional text in `REQ-SKL-30` |
| 0002 A14, version per amendment (`0002-d3`) | `OQ-7`; provisional text in `REQ-SKL-10` |
| 0002 A15, who drafts and applies (`0002-d4`) | ASM-22 |
| 0002 A16 to A18 | ASM-19 to ASM-21 |
| 0003 A1, builder and engineer reviewer | §3.1; ruled by R10 and R11, and by item `0003-direction` |
| 0003 A2, product mapping as module (d) | Dropped from Narthex: producing the product specification is a separate product (R5, R14). Its question sets survive as `REQ-ITK-7` |
| 0003 A3, guardrails | ASM-23; alarm tiers are `OQ-10` |
| 0003 A4, per-step agents | ASM-24 |
| 0003 `0003-pilot` | `OQ-11` |
| 0003 `0003-design` | Ruled by R5 and R14 (see A2 above) |
| 0003 `0003-reference-tool` | Answered 2026-10-04: the reference tool combined product mapping with SPARC; nothing to specify |
| 0004 A1, specsite is module LD | ASM-25, `REQ-DOC-13` |
| 0004 A2, `REQ-CO-22` | `REQ-DAT-4`, `INV-13`; ruled by item `ru-specsite` |
| 0004 A2, `REQ-CO-23` | `REQ-DOC-14`; ruled by item `ru-specsite` |
| 0004 A3, `needs.json` export | ASM-26, `REQ-DAT-20` |
| 0005 A1, A2 | ASM-27 |
| 0005 A3, candidate profiles | §7.1 table; which first is `OQ-4` |
| 0005 A4, chosen at intake | ASM-28 |
| 0005 A5, limits | ASM-29, `INV-15` |
| 0005 `0005-next` | Ruled by R18: the profile work is folded into this rewrite with the other amendments |
| 0005 `0005-normative` | `OQ-5` |
| 0005 `0005-independence` | `OQ-6` |
| 0005, evidence bundles (not asked) | `DEF-10` |
| 0005, secondary guides while primaries are paywalled (not asked) | Ruled by R4: such material ships as supplementary (`REQ-KNB-3`) |
