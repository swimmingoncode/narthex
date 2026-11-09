# Lessons from a clean-room requirements stage (2026-11-05)

Feedback from a pilot project's requirements agent, sent at Pablo's request. That project ran STEP-1 as a clean
room against an earlier in-house system that does the same job. The aim was to keep the new design free of the old
one's shape; copyright was not the concern. STEP-1 ended with the spec accepted. This note keeps the method lessons
only, in general terms. It follows [the clean-room split note](2026-10-24-clean-room-split.md), written before any
pilot had tried it.

## What worked

1. **Two repositories and a gate.** A spec repository and a quarantine repository side by side. Every file promoted
   from quarantine passed a deny-list check, and the spec's gate ran the same check. A fresh agent distilled
   findings on the quarantine side; the requirements agent read only distillates that had passed the gate.
2. **Raw first, then redacted.** Every owner answer was archived raw on the quarantine side, then redacted through a
   recorded map, then gated. The owner's own words leaked old detail and supplier names more often than any other
   source.
3. **Helpers for dirty reads.** Chat threads, the old test suite and old slides were read by helpers that returned
   only gated summaries, or just a file count and a commit.
4. **A desk trace of the old end-to-end tests against the accepted spec.** It surfaced real gaps and led to an
   amendment.
5. **An independent review before acceptance.** A fresh reviewer, given the diff and the rulings but not the author's
   summary, found two contradictions the gate couldn't see.
6. **Listing what goes further than a ruling.** Showing every row that goes beyond what the owner ruled, so the owner
   can strike any of them, let large amendments be accepted in one step.

## What to change in the method

1. **The requirements agent must not carry the old system in its own context.** Its global instructions and memory
   described the old system, and only discipline kept that out. A deny-list catches identifiers, not the shape of a
   flow. Require an agent with no memory or instructions about the old system: a fresh session with only the brief.
2. **Old tests pull toward old patches.** The trace presented the old system's workarounds as if they were needs, and
   five follow-ups went on the form. The owner retired all of them with one ruling about the product's model.
   Classify each trace gap as a needed capability or an old workaround, and check it against the owner's stated
   model, before raising it.
3. **Cap follow-ups.** A "Discuss first" answer should lead to a conversation, not to three more questions. Fold the
   consequences that follow from a ruling into the amendment, listed as going further than the ruling.
4. **Don't spec a supplier type as its own case** when it is one instance of a general one. A worked example belongs
   in a note or slides, not in the acceptance criteria.
5. **Examples readable outside the room must be neutral but concrete:** real public systems, suppliers named by role,
   figures marked as illustrative. Placeholder letters read as careless.
6. **Say which artefacts are public and which are process records.** The spec, the product file and the suggestions
   can be public. Clean-room statements, the map of distilled cases, the quarantine's name, deny-list contents and the
   owner's raw rulings stay private, as the audit record of the process.
7. **Separate folders from the first day:** product repository, spec room and quarantine apart, so that the product
   folder holds no clue. The pilot had to move its spec room out at the end before a clean design agent could start.
8. **Crossing from STEP-1 to STEP-2 needs a context prompt** for the next agent: its sources, what is settled and what
   is open, and an instruction to stay out of other local folders, without naming the old system. A template would
   help.

## On the decision form

- `superseded_by` cleaned the form well (fourteen read items down to three) without deleting any record.
- Merging read items into chained ones cleared all `REQ-DEC-43` warnings.
- A chat ruling recorded with `by: "relayed:chat"` kept the log complete, but it needs a time convention: the time it
  was archived is not the time it was said.

## For Narthex

These extend the candidate information-barrier amendment in the clean-room split note. The ones that change
requirements:
- a clean requirements agent (no memory or instructions about the predecessor);
- a fresh independent review before any amendment to an accepted spec;
- a "goes further than the ruling" list on every amendment;
- a cap on follow-ups after "Discuss first";
- public artefacts versus process records;
- a STEP-1 to STEP-2 handover template;
- a `said_at` time on relayed rulings.

They become form items together, once Pablo has seen this note.
