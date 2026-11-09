# A clean-room split between requirements and construction (2026-10-24)

Pablo, during the safety pilot. Notes on how Narthex should handle the split, written before the pilot's own
feedback arrives.

## The situation

The requirements agent was given the product owner's working documents. They are copyrighted by third parties: a
client's technical specification and licensed national standards. Nothing in them may be copied, and the licences are
personal. So the work is split as a clean room:

- the **source side** (the requirements agent and the owner) reads the documents and writes the SRS;
- the **clean side** (a new agent) gets only Narthex and the SRS, and builds from them.

Narthex has never run this way. Its method assumes one continuous context from intake to release.

## Where the method assumes one context

- **Traces to sources.** Every requirement traces to its source (STEP-1 gate). On the clean side that link must be
  opaque: an identifier, an edition and a clause the clean agent can cite but never open.
- **Questions back to the owner.** During construction the agent asks the owner. Here, a question from the clean side
  must be answered by the source side in requirement language, never with source text.
- **Reference cases.** Expected results come from worked examples in the documents. The numbers can cross; the
  method, tables and scripts that produced them may not.
- **Hazard log.** Written by the source side, partly from the documents. It crosses only after a review that it is in
  the project's own words.
- **Verification.** The clean side builds tests from the SRS. Checking against the sources (reference cases, clause
  coverage) stays with whoever holds the licence, and comes back as an approval on the form.

## What the split needs

1. **One crossing point.** The SRS, the hazard log and the reference cases' inputs and expected outputs are the only
   artefacts that cross. Each is reviewed for source text before it crosses.
2. **A crossing log.** Every artefact or answer that crosses is recorded: what, when, reviewed by whom. That log is
   the clean room's evidence, if anyone ever asks.
3. **Clean briefs.** The clean agent's briefs and context are listed and kept. It never reads the source side's
   notes, the channel, or any session that has read the documents.
4. **A question route.** Questions from the clean side go on the form, to the source side, and the answers are logged
   as crossings.
5. **Split roles in the data model.** `ownership` already names who rules what. A clean room adds which side an agent
   or document belongs to, and which artefacts may cross.

## A caution about this session

The Narthex session that advised the requirements agent has read its summaries of the documents, in its own words.
That session is therefore on the source side. It must not brief the clean agent, and nothing from the pilot's
channel goes into this repository.

## For Narthex

Candidate amendment: an information-barrier mode, with the crossing point, crossing log, clean briefs and question
route above, and the earlier gap on citing closed standards in a project SRS (identifier, edition, clause; own-words
requirements; a sources register; licensee verification). Both wait for the pilot's feedback before they become form
items. The first pilot's feedback is in [its lessons note](2026-11-05-clean-room-speccer-lessons.md).
