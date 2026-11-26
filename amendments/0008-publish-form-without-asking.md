# Amendment 0008: publish the form without asking

**Status:** applied to `SPEC.md` v0.3.8
**Target:** `SPEC.md` v0.3.7
**Date:** 2026-11-25
**Ruling:** item `ru-publish-no-ask`, ruling R40 (`notes/2026-10-17-rulings.md`). Pablo, relayed by the Pallet Usage
Subscription session and confirmed in chat the same day: "Yes, that's nonsense. Amend the SPEC." The answer is
archived as `decisions/responses/2026-11-25T12-00-relayed-chat.json` (`by: "relayed:chat"`).

A session had to wait for the lead's yes before the first publish of a form. A decision form is an implied part of
the process and private to its lead, so the wait only stalled sessions. The decision-form skill and `ADOPTING.md`
already dropped the gate (commit `3b1a1e9`); this amendment brings the spec in line.

## What changes

- **Outward action** (§2 glossary). Publishing a project's decision form is not an outward action; sharing it is.
- **Orchestrating agent** (§3 roles). Builds, publishes and updates the form without asking first.
- **`REQ-SKL-5`**. `decide` publishes and updates the form without asking the lead first.
- **`INV-9`**. Was: "A published form contains only what the lead approved to publish. Nothing is published on a
  default." Now: a form is published only to its own project's page, private to its lead; publishing or updating
  it needs no approval; sharing it with anyone else is an outward action (`INV-4`).
- **PLAN `T-013-01`** follows: the L2 test `unapproved item is not published` becomes `a form is published only to
  its own project's private page`, and `publish records who approved it` becomes `publish records who published it`.

## Not changed

- Reserved items still carry no default (`REQ-DEC-4`, `INV-4`).
- Outward actions (sharing the form, sending, releases, publishing anything else) still need the lead's explicit
  answer (`INV-4`).
- One form per project, with a publish lock (`REQ-DEC-22`, `INV-11`).

## Questions raised

None.
