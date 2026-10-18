# Adopting SDD Studio in a project

For a project session that wants to run the method and use the decision form today. Normative detail is in
`SPEC.md`; this page is the practical version. Status as of 2026-10-04: `SPEC.md` v0.2.0. Amendment 0002 is
proposed, not ruled; where it would change something below, this page says so.

## 1. One project, one repo, one form

- Everything lives in the project's own git repo. Commit with plain `git commit`; never override identity or
  signing.
- Each project has **its own** decision form: its own questions file, its own build, its own artifact. Never put
  items in another project's form or publish to another project's artifact (proposed as `REQ-DI-25`/`INV-11`;
  aledgent's inbox got another project's items and two conflicting publishes).
- Name everything by the project: form title "<Project> Decisions", artifact files under the project's repo.

## 2. Repo layout

```
SPEC.md            what: normative only (requirements, invariants, errors, open questions)
OVERVIEW.md        informative digest of a named SPEC version
PLAN.md            how: every technical decision (DEC-*), features, milestones
amendments/NNNN-slug.md   changes to SPEC and PLAN, one file per review pass, items A1, A2…
features/F-NNN-slug/{plan,tasks,NOTES}.md
research/ or notes/       sourced reports
proposals/         changes for third-party repos (never opened without the lead's yes)
experiments/<date>-<slug>/  experiment logs and outcome pages
decisions/
  questions.json   the form's items (the source)
  responses/       archived answers, one file per read-back, never edited
  LOG.md           generated: every answer ever given
  form/index.html  generated: the page you publish
CLAUDE.md          the project's working rules (house rules included in full)
```

## 3. The chain

`SPEC.md` → `amendments/` → `PLAN.md` → feature plans → tasks → PRs. Changes flow down, never up.

- Identifiers are stable forever and never reused: `REQ-*`, `INV-*`, `ERR-*`, `NFR-*`, `OQ-*`, `DEF-*`,
  `DEC-*`, `F-NNN`, `T-NNN-NN`. Reference by identifier, never by section number.
- A ruling reaches SPEC or PLAN only through an amendment that cites the form item ids. Nothing unruled is
  applied, not even provisionally.
- Each closed `OQ-*` names the amendment and the item that closed it.

## 4. The decision form

Tool: `skills/decision-form/` in this repo (read `SKILL.md` and
`references/item-format.md`). Stock Python 3, no packages.

1. Write items in `decisions/questions.json`. One question per item; ids lower case (`oq-12`, `br-dex`); title
   ≤ 70 characters; one or two sentences; ≤ 5 bullets; recommended option first; a `default` only on
   reversible items, never on `reserved` ones (outward actions, security trade-offs, product rulings).
   Be specific: name the exact question, what happens today, and each option's consequence.
2. Build: `python3 skills/decision-form/scripts/build.py decisions/questions.json`.
   Fix every warning.
3. **Ask the lead before the first publish.** Then publish `decisions/form/index.html` with the Artifact tool,
   `capabilities: {db: {}, user: {}, downloads: true}`, and any documents the items open in place via `files`
   (relative paths, so they open inside the form). Record the URL in `form.url`.
4. `build.py … --mark-published`, then one push notification per publish that adds or changes items: under 200
   characters, naming sections and counts.
5. Read answers back with ArtifactData `list` on collection `responses`. Save the result unchanged as
   `decisions/responses/<YYYY-MM-DDTHH-MM>.json`, then rebuild. Answered items move to the Outbox.
6. Apply rulings through amendments; set each item's `applied`; rebuild.

Rulings given outside the form (chat, a meeting, another session) are still items: archive an answer with
`by: "relayed:<source>"` and notes saying who ruled, where and when.

## 5. Experiments

An experiment keeps its questions in `experiments/<date>-<slug>/decisions.json` (same format), never in the
lead's form. Its amendment is `Status: experimental`, its DEC `proposed`; only flagged code and measurement
notes merge. It ends with a one-page outcome (adopt, adapt or drop, with numbers); only an adopted outcome is
promoted, consolidated into one amendment, one DEC and at most about three questions.

## 6. Pages and reporting

- Chat replies to the lead: five lines at most. Anything longer is a page or a form item.
- Spell out every pending question; never "its N questions".
- Documents the lead should read go on the form's **Read** section (kind `read`), published next to the form so
  they open on a phone. Don't open or send documents to the lead unprompted.
- Explainer and research pages: a basis block (repo, commit, versions), every claim tagged Code, Measured, Plan,
  Inference or Not in code, citations as `path:line` at a commit or run ids, and a contents rail.
- Measure before claiming; tie every figure to a run and its machine; re-run rather than re-quote.

## 7. House rules for every agent brief

- Plain `git commit`; never `-c user.*`, `--author`, `GIT_*` identity variables or `--no-gpg-sign`. If signing
  fails, stop and ask.
- One worktree and one build directory per agent; never verify twice in one worktree.
- Never edit SPEC or PLAN unless the task says so.
- Merge only when the task says so, with CI green, after rebasing on the current base.
- Never end a turn waiting on CI (proposed, amendment 0002 A2).
- No pushes, PRs or issues on upstream or protected repos without the lead's explicit yes.
- No durable work in `/tmp`.
- On a spec gap: proposed in item `0002-d1`; until ruled, follow the project's `CLAUDE.md`.

## 8. Token budget

Ruled by Pablo on 2026-10-05, after the weekly limit ran out in three days: 86% of one session's usage came
from its 199 helper agents, mostly long-running helpers re-reading a growing context and agents polling CI.

1. **Let a script do the waiting.** Wait on CI with one blocking shell command (`gh run watch <id>
   --exit-status`, or `until …; do sleep 60; done`), or a background command that notifies on exit. Never
   re-check every few minutes from an agent, and never end a turn just to poll.
2. **Filter before reading.** Never put raw CI logs, Terraform plans or large files in context:
   `gh run view <id> --log-failed | tail -200`;
   `terraform show -json plan | jq '.resource_changes[] | {address, actions: .change.actions}'`;
   `grep`, `head`, `jq` or a line range for anything else.
3. **One job per helper, short.** For example: "find why job X failed, report in under 200 words". Start a
   fresh helper for the next job; don't resume one with an hours-long history.
4. **Model per role** (Pablo, 2026-10-15, with the Haiku tier added the same day; replaces the 2026-10-07 version). Weekly usage hit 41% on day two:
   a long Opus main session did routine work in many short turns, and helpers inherited Opus because no model
   was set.
   - **Every spawn names its model.** An unset model inherits the parent's, usually Opus.
   - **Helpers default to Sonnet:** bounded coding, reviews, docs and fixes with a precise brief. Sonnet's
     failures came from gaps in the brief, not from the model.
   - **Opus only for design, code whose design is still open, and incidents.**
   - **Haiku** for mechanical helpers with a tight rule: watch PRs and merge each only when every check
     passes by name and its review says clean, otherwise report and stop; re-run a failed check once; append to a
     state log. Waiting costs nothing in a shell loop; tokens go to reading results and deciding, so hand those
     reads to Haiku when the decision is a rule.
   - **Sonnet** also for the main session's queue judgement: is a finding real or the owner's call, flaky or a
     regression, writing briefs, what goes to the owner.
   - **The main session runs routine queue work on Sonnet** (merges, CI, forms, briefs) and switches to Opus for
     spec, design or incident work. Only the user can switch it, from the app's model picker; a session can't
     change its own model, so it says when a switch would help.
5. **At most two helpers at once** (Pablo, 2026-10-15). **One CI watcher** across all open PRs, not one per PR.
   Fewer, larger turns; no large tool output.
6. **Briefs point, they don't paste, and carry every rule a helper can't infer.** Name the files to read instead of
   copying them; ask for short reports; state each repo rule explicitly: DCO sign-off (`git commit -s`) where the
   repo requires it, identity and signing rules everywhere (scratch repos included), app or token permissions the
   task needs.
7. **The orchestrator never writes code** (Pablo, 2026-10-07). Each coding task goes to a fresh
   helper (model per rule 4) with an exact brief; it returns a short report and is not reused for the next task.
8. **The orchestrator reads reports, not diffs or logs.** Checking the code is a reviewer helper's job.
9. **The orchestrator keeps a state file** (Pablo, 2026-10-07): `STATE.md` at the project root with the open
   threads, pending rulings, running agents and their branches, and the next steps. It is updated as things
   change, and always before a compaction, so that the compacted session picks up from the file instead of a
   lossy summary. The session is not replaced; it hands the file to itself. A `SessionStart` hook with the
   `compact` matcher can print `STATE.md` back into context after each compaction.

10. **Opus on call as the advisor** (Pablo, 2026-10-17). Run the main session on Sonnet and turn on Claude
    Code's advisor with `/advisor opus` (or `--advisor opus`, or `advisorModel` in settings). It's experimental
    and works only on the Anthropic API. The advisor sees the whole conversation; Claude consults it on its own.
    Ask for a consultation explicitly at three moments:
    - before a plan or architecture locks: are invariants, auth or contracts missing?
    - when the same test or error fails twice: root cause, or a rabbit hole?
    - before calling work done or committing: did the diff break a rule or regress something?
    Subagents default to Sonnet (`CLAUDE_CODE_SUBAGENT_MODEL=sonnet` as the fallback); every spawn still names
    its model, and Haiku does mechanical lookups. Changing settings files needs the user's yes.
