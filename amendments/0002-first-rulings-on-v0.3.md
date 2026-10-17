# Amendment 0002: first rulings on v0.3

**Status:** applied to `SPEC.md` v0.3.2
**Target:** `SPEC.md` v0.3.1
**Date:** 2026-10-17
**Ruling:** the form answers of 2026-10-17, archived in `decisions/responses/2026-10-17T18-35.json`. Item ids
below are the ids on that form.

This amendment bumps the spec from 0.3.1 to 0.3.2. Below v1.0.0 every amendment bumps the patch version and
lists the bump here (`OQ-7`, ruled below).

## Rulings applied

Nine open questions are closed. Their rows in `SPEC.md` §11 now read "Closed by amendment 0002" and keep their
ids (`REQ-DEC-35`).

### OQ-2 (item `v3-oq-2`): guided GitHub account now, hosted git later

Ruled as recommended. Repositories stay with their owners in v1. Sign-up guides a newcomer to create a GitHub
account. Hosted git stays deferred as `DEF-3`.

Change: `REQ-ITK-3`, `REQ-IDN-2` and `DEF-3` name the ruling. No requirement changes in substance.

### OQ-4 (item `v3-oq-4`): all five profiles ship first

Ruled against the recommendation. The recommendation was `product` and `oss-ledger` first. Pablo chose all five
candidates: `product`, `oss-ledger`, `reg-fintech`, `protocol` and `safety`.

Change: new `REQ-KNB-9` says the first sector release carries all five profiles. The informative line before
the profile table in §7.1 left the order to `OQ-4`, and the `OQ-4` row recommended `product` and `oss-ledger`
first. Both now state the ruling.

One consequence. `reg-fintech`, `protocol` and `safety` lean on copyrighted standards. `REQ-KNB-7` still holds:
material derived from such a standard waits for the lawyer's check (`OQ-12`, below). The rest of each profile
ships.

### OQ-5 (item `v3-oq-5`): an executable reference or formal model may be normative

Ruled as recommended, where the profile says so.

Change: `REQ-DAT-19` loses its "provisional" mark. The `protocol` profile may use it.

### OQ-6 (item `v3-oq-6`): agents are independent reviewers for `product` and `oss-ledger`

Ruled as recommended. Regulated profiles need a person.

Change: `REQ-VER-11` loses its "provisional" mark.

### OQ-7 (item `v3-oq-7`): version bump per amendment

Ruled as recommended. Below v1.0.0, an amendment bumps the patch version and lists the bump. From v1.0.0, the
bump follows semantic versioning for the change.

Change: `REQ-SKL-10` states both halves. This amendment applies the first half: 0.3.1 to 0.3.2.

### OQ-8 (item `v3-oq-8`): what an agent does on a spec gap

Ruled as recommended. An agent may build meanwhile only on the plan's own reading or a stricter one. It never
changes `SPEC.md` or `PLAN.md` before the ruling. Otherwise it stops and raises an item.

Change: `REQ-SKL-24` loses its "provisional" mark.

Pablo added a note to this item: "reads are only partially useful as they only provide a reference of what to
read, but they (nor the form) provide full chaining on what to read, only partial. We need full for Narthex."

Change, from the note:
- New `REQ-DEC-43`: every `read` item gives the full reading chain for the decision it supports. That is an
  ordered path of what to read. Each step names the steps it needs first and says why it matters to the
  decision. A single reference is not a chain.
- New `REQ-DEC-44`: the builder warns about a `read` item with one step, or with steps that lack an order,
  prerequisites or a reason. The limits of `REQ-DEC-2` apply to `lead` and `bullets`, not to the chain.
- New `REQ-KNB-10`: the knowledge base's reading guidance, for each step and experience level and for each
  golden path, gives the full chain too.
- New `ASM-57` in §13 records this as a reading of Pablo's note. It is an interpretation, so Pablo can correct
  it. `REQ-DEC-43`, `REQ-DEC-44` and `REQ-KNB-10` cite it.

### OQ-9 (item `v3-oq-9`): test naming

Ruled as recommended. Naming is a per-project setting. The default is plain test names, with the identifiers a
test verifies in a comment.

Change: `REQ-SKL-30` loses its "provisional" mark.

### OQ-10 (item `v3-oq-10`): three alarm tiers

Ruled as recommended: green, amber and red.

Change: `REQ-VER-7` loses its "provisional" mark.

### OQ-12 (item `v3-oq-12`): a lawyer checks sector material

Ruled as recommended. A lawyer checks, before the first pack with material derived from a copyrighted standard
ships.

Change: `REQ-KNB-7` names the lawyer and the timing. `ASM-55` stays: the text of an open standard ships without
the check.

## Confirmed assumptions

Item `v3-asm-trust` confirmed the nine trust-and-access assumptions: `ASM-1`, `ASM-4`, `ASM-5`, `ASM-6`,
`ASM-22`, `ASM-29`, `ASM-34`, `ASM-43` and `ASM-45`. SPEC §13 marks each "confirmed 2026-10-17". They stay in
the table. The other four assumption items (`v3-asm-method`, `v3-asm-form`, `v3-asm-docs` and
`v3-asm-packaging`) are not answered yet.

## Still open

- `OQ-1` (item `v3-oq-1`): the next step is ruled. Run a trademark and domain search first. The name is not
  chosen.
- `OQ-3` (item `v3-oq-3`): decide after the Bloque pilot. Pablo notes that Narthex is open-source first and
  asks what the business model revolves around. That question is not answered here. It is queued as work.
- `OQ-11` (item `v3-oq-11`): Pablo chose "an operations flow on the core (details in notes)". The notes behind
  that option were empty. Pablo must name the builder and the flow.

## Read items

Pablo read the SPEC and the references. He answered `r-spec` "Read, comments in notes" with a note that he will
give feedback in chat. He answered `v3-r-references` "Read, no comments". No spec change follows from either.

## Questions this amendment raises

Each is its own item on the form (`decisions/questions.json`):

| Item | Kind | Follows | What |
|---|---|---|---|
| `q-name-search` | queue | `v3-oq-1` | Run a trademark and domain search for Narthex |
| `q-business-models` | queue | `v3-oq-3` | Draft open-source business-model options for Narthex |
| `a-pilot` | act | `v3-oq-11` | Name the pilot builder and operations flow |
| `q-reading-chains` | queue | `v3-oq-8` | Add full reading chains to the form's Read items |

## Spec changes at a glance

| Where | Change |
|---|---|
| Front matter | `spec_version` 0.3.2; `amendments` lists 0001 and 0002 |
| §0 citations | The "provisional" mark no longer applies to any requirement; new mark for closed questions |
| §7.1 | Profile line states that all five ship first; new `REQ-KNB-9` and `REQ-KNB-10`; `REQ-KNB-7` names the lawyer |
| §7.2 | New subsection 7.2.7 with `REQ-DEC-43` and `REQ-DEC-44` |
| `REQ-ITK-3`, `REQ-IDN-2`, `DEF-3`, `REQ-DAT-19`, `REQ-SKL-10`, `REQ-SKL-24`, `REQ-SKL-30`, `REQ-VER-7`, `REQ-VER-11` | Provisional marks replaced by the ruling |
| §11 | Nine rows closed, three open with their next step; ids kept |
| §12 | Traceability ranges extended to `REQ-KNB-10` and `REQ-DEC-44` |
| §13 | Nine assumptions marked confirmed; new `ASM-57` |
