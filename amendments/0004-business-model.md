# Amendment 0004: the business model

**Status:** applied to `SPEC.md` v0.3.4
**Target:** `SPEC.md` v0.3.3
**Date:** 2026-10-17
**Rulings:** R24 to R32 in `notes/2026-10-17-rulings.md`, from the form answers of 2026-10-17 archived in
`decisions/responses/2026-10-17T19-35.json`. R31 and R33 are applied below as well.

This amendment bumps the spec from 0.3.3 to 0.3.4.

## Rulings applied

### OQ-3 (item `r-business-models`): the business model closes, pricing stays open

The business model is ruled:

- **Goal (R24):** a funded company is "not now; might be in the mid term".
- **MIT for everything open (R25):** the method, the skills, the MCP server, the GUI and the knowledge base.
- **Copyright (R26):** Pablo Dorado until Swimming on Code is incorporated, then Swimming on Code.
- **A hosted service (R27):** Narthex runs one. Self-hosting stays possible under MIT.
- **Bloque (R28):** sponsorship and feedback. The details are private.
- **The moat (R29):** both the method and the packs. The method is public. Experts' sector packs are not public,
  and are available for a fee.
- **The book (R30):** free online as a funnel, and sold in print. Swimming on Code is first of all a
  self-publishing firm.
- **Seller (R32):** Swimming on Code sells, informally at first, then incorporated, under its own brand once it
  is established.

Pricing levels stay open until after the Bloque pilot. `OQ-3` is reworded to ask only for the prices and plans of
the hosted service, of the experts' packs and of the print book. It stays open.

Change: `SPEC.md` §11 `OQ-3`; §1.8 names the MIT scope; new `REQ-IDN-8`.

### R27: a hosted service

New `REQ-IDN-8`: Narthex runs as a hosted service, and self-hosting stays possible. `REQ-IDN-2` now says that
the hosted service does not hold a user's code either.

### R31: every sector is listed

- New `REQ-ITK-15`: intake lists every industry and sector for profiling.
- New `REQ-KNB-11`: a sector with no specialised track gets the standard flow, with a clear disclaimer.

### R25 and R29: the open core and the packs

New `REQ-KNB-12`: the open core of the knowledge base is MIT. Experts' sector packs are separate content under
their own terms. This reading is the new assumption `ASM-58`.

### R33 (item `d-name-next`): the name

`OQ-1` stays open. Pablo asked to brainstorm alternatives now. The brainstorm is in
`notes/2026-10-17-name-alternatives.md`. The `OQ-1` row says so.

## New assumption

`ASM-58`: R25 (the knowledge base stays MIT) and R29 (experts' packs are paid, not public) are read together.
The open core of the knowledge base is MIT: the method, the profiles, the standard flows and the guidance
Narthex writes. Experts' sector packs are separate content under their own terms, outside the MIT repository.
Pablo can correct this reading.

## Questions raised

None as new items. `OQ-3` (prices) and `OQ-1` (the name) stay open on the form.
