---
name: decision-form
description: Put every open question of a project on a decision form the lead answers from a browser or phone, then read the answers back, archive them in the repo and keep a decision log. Use when a spec, plan, research report or agent raises questions for the project's owner; when the user says "put it on the form", "add a question", "what's pending for me", "read my answers"; or instead of asking several questions in chat.
---

# Decision form

A project's open questions live in `decisions/questions.json`. This skill builds them into one HTML page
(sections, topic sub-tabs counting only open items, applied defaults collapsed, an outbox of answered and superseded items), publishes
it as a private claude.ai artifact whose answers land in its database, and reads the answers back into the
repo. Format and style rules: `references/item-format.md`.

## Rules

- **Never decide in chat.** A question for the lead goes on the form. Chat gets at most five lines saying
  what changed on it.
- **Spell out every question.** One item per question; never "its 6 questions".
- **Concise items.** A title of at most 70 characters, one or two sentences, at most five bullets, options
  of at most ten words, the recommendation first. Run the builder; fix every warning.
- **Ask before publishing.** The first publish of a form, and any publish that adds a reserved item, needs
  the lead's explicit yes. Show what will be published (section counts and titles) and ask in one line.
- **No defaults on reserved items.** Outward actions, security trade-offs and product rulings the lead keeps
  are `reserved: true` and never carry a default.
- **Experiments stay out of the inbox.** Questions raised inside an experiment go to its own file
  (`experiments/<date>-<slug>/decisions.json`); only its consolidated outcome is promoted to the lead's form.
  See `references/item-format.md`.
- **Every item names who acts.** The owner acts: kind `act`, section `act` (only what needs them). The agent
  acts: kind `queue`, section `queue` ("Claude's queue"). Nobody acts: kind `update`, section `updates`. The
  builder warns on a mismatch. See `references/item-format.md`.
- **Answers are records.** Archive every read-back before acting on it. Never edit or delete an archived
  answer; a changed mind is a new answer.

## Steps

1. **Write the items.** Add or edit items in `decisions/questions.json` (create it from the example in
   `references/item-format.md`). Keep ids stable: a reworded question keeps its id, a different question
   gets a new one. Use the spec's id for spec questions (`OQ-12` → `oq-12`) and list it under `spec`. A
   question replaced by another keeps its item with `superseded_by: "<new id>"`; never delete it.
   A `read` item carries its full reading chain (`chain`: ordered steps, each with its prerequisites and why it
   matters, and the decisions it informs), never a single reference.
   A project's look goes in `form.brand` (fonts, colours, logo, favicon), never in edits to the built page.
2. **Build and check.**
   ```bash
   python3 <skill-dir>/scripts/build.py decisions/questions.json
   ```
   This writes `decisions/form/index.html` and `decisions/LOG.md`, and prints the counts and every style
   warning. Fix the warnings, then rebuild.
3. **Look once, yourself.** Open `decisions/form/index.html` in a browser pane or a real browser, at phone
   width. This is a check for you, not a way to hand the form over: file previews in chat don't run scripts,
   and answers given locally stay in that browser until exported. Don't send the built file to the lead; the
   lead answers on the published artifact.
4. **Ask, then publish.** After the lead's yes, publish `decisions/form/index.html` with the Artifact tool,
   declaring `capabilities: {db: {}, user: {}, downloads: true}`. Publish any documents the items open in
   place (`refs` with relative URLs, `form.specBase`) through `files`, at the same relative paths. Record
   the artifact URL in `form.url` in the questions file. Later publishes reuse that `url` and omit
   `capabilities`.
5. **Mark it published.**
   ```bash
   python3 <skill-dir>/scripts/build.py decisions/questions.json --mark-published
   ```
   Items added or changed after this show as new on the next build.
6. **Notify once** per publish that adds or changes items: a push notification under 200 characters naming
   the sections and counts ("Decide: 4 new, 1 blocking. Read: 2 new.").
7. **Read answers back, and update the form in the same pass.** Use the ArtifactData tool, action `list`, on
   the form's collection (default `responses`) at `form.url`. Then, in one pass:
   - Archive the listing unchanged as `decisions/responses/<YYYY-MM-DDTHH-MM>.json`.
   - For each new answer, set `applied` (what it produced: an amendment, a PLAN decision, a commit) or add
     follow-up items with `follows: "<item id>"`: agent work to the queue, owner actions to Act, new
     decisions to Decide.
   - Record rulings given in chat as items answered with `by: "relayed:chat"`.
   - Close what is final. Mark stale updates `superseded_by` their replacement.
   - Rebuild with `--strict` (0 warnings) and republish only when an item's text or structure changed, and batch
     those changes into one publish. A republish reloads every open view, so keep it rare.

   **Progress goes in the live documents, not in a republish.** The page subscribes to `form.live` (default
   `live`). With the ArtifactData tool at `form.url`, action `set`, write:
   - `live/queue` = `{"items": [{"id": "...", "title": "...", "status": "doing", "note": "..."}], "at": "<ISO time>"}`
     for the queue's progress. It shows as the "Live queue" card at the top of the queue tab.
   - `live/notice` = `{"text": "...", "at": "<ISO time>"}` for one line under the status bar ("Republishing at
     18:00", "Waiting on your review of oq-3"). Set `text` to `""` to clear it.

   Open views update in place and the reader stays where they were. Answers are the same: an answer that
   arrives never moves a reader, so reading them back needs no republish either.

   An answer with no visible follow-up means the form has fallen behind the chat. The builder warns on it,
   once per item. "Discuss first" answers go to the overview's "To discuss" list and stay in the inbox.
8. **Apply the rulings.** A ruling reaches the spec only through an amendment that cites the item ids; set
   each item's `applied` to what applied it, and rebuild. Tell the lead, in at most five lines, what you
   applied and what is still open, linking the form.

## When the store is unavailable

The page keeps answers in the viewer's browser and offers "Save my answers (.json)". If the lead hands you
that file, copy it unchanged into `decisions/responses/` and rebuild.

## Files

- `scripts/build.py` — checks items, builds the page and the log. Stock Python 3.
- `assets/template.html` — the page. A state change (an answer, a live document) updates it in place and never
  re-renders the view; when the platform offers the hot API, a republish restores the reader's tab, scroll,
  open sections, focus and unsent notes. Data is injected at `/*__DATA__*/`; the title at `/*__TITLE__*/`;
  `form.brand` at the `__FONTS__` and `__BRAND_*__` placeholders, which are removed when there is no brand.
- `references/item-format.md` — the questions file, field by field, and the style rules.
