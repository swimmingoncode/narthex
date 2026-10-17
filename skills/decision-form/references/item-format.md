# The questions file

One JSON file, conventionally `decisions/questions.json` in the project repo. Agents write it; nobody
edits the built form by hand.

```json
{
  "form": {
    "title": "Acme Decisions",
    "collection": "responses",
    "specBase": "docs/SPEC.html",
    "specName": "SPEC.md"
  },
  "sections": [
    {"id": "read", "title": "Read", "blurb": "Documents to read before deciding."},
    {"id": "decide", "title": "Decide", "blurb": "Questions only you can answer.",
     "groups": [{"id": "api", "title": "API"}, {"id": "ops", "title": "Operations"}]},
    {"id": "act", "title": "Act", "blurb": "Only what needs you: review and merge, run, send, or discuss with someone."},
    {"id": "queue", "title": "Claude's queue",
     "blurb": "What I'm doing or will do next, in order. No action needed; comment to reorder or stop one."}
  ],
  "items": [
    {"id": "oq-3", "kind": "decide", "section": "decide", "group": "api",
     "title": "Should retries reuse the client's idempotency key?",
     "lead": "A retried request today gets a new key, so a timeout can create two orders.",
     "bullets": ["Reusing the key makes retries safe.", "Clients must then keep keys for 24 h."],
     "rec": "reuse the key; it is the only option that cannot double-charge.",
     "options": ["Reuse the key (recommended)", "New key per retry", "Discuss first"],
     "blocks": true,
     "spec": ["OQ-3", "REQ-API-7"],
     "refs": [{"label": "Retry design note", "url": "docs/retries.html#idempotency"}],
     "origin": "research agent, 2026-10-03"}
  ]
}
```

## Fields

| Field | Required | Meaning |
|---|---|---|
| `form.title` | yes | The form's name, shown as its title. Two to four words: "Acme Decisions" |
| `form.collection` | no | Database collection the answers go to (default `responses`) |
| `form.specBase` | no | A rendered spec published next to the form. Each `spec` id becomes a ref that opens there, at its anchor |
| `form.specName` | no | How to name the spec when it is not published (default `SPEC.md`) |
| `form.brand` | no | The page's brand; every key optional, missing ones keep the template's look. See [Brand](#brand) |
| `sections[]` | yes | First-level tabs. The known ones always show in a decision's order: `read`, `decide`, `act`, `queue`, `updates`, `later` (context, ruling, action, agent work; Pablo, 2026-10-13 and 2026-10-15). Others follow, as written. `form.sectionOrder: "as-written"` turns this off |
| `sections[].groups[]` | no | Sub-tabs by topic, in any section. Keep each under ~8 open items. A `group` an item names but its section does not declare is added (title from the id) with a warning |
| `id` | yes | Stable forever. Lower case letters, digits, `-`, `.`; at most 64 characters. For a spec open question use its id: `OQ-12` is `oq-12` |
| `kind` | no | `decide` (default), `act`, `queue`, `read`, `update`, `later`. See [Who acts](#who-acts) |
| `section`, `group` | yes, no | Where the item shows |
| `title` | yes | The question itself, at most 70 characters |
| `lead` | no | One or two sentences of context |
| `bullets` | no | At most five, each at most 20 words |
| `rec` | no | One line: the recommendation and why |
| `options` | no | Each at most 10 words. Recommended first, marked "(recommended)". Without options the answer is free text |
| `default` | no | Index of the option that stands while unanswered. Such items sit collapsed below the open ones and are not counted on the tabs |
| `reserved` | no | `true` for outward actions, security trade-offs and product rulings the lead keeps. Such an item cannot have a default |
| `blocks` | no | `true` when its answer blocks other work. Listed on the overview |
| `refs` | no | `[{label, url}]`. A relative URL with an anchor opens in place (peek) when that page is published next to the form; `url: null` shows a label only |
| `spec` | no | Identifiers the item concerns. Rendered as refs (`specBase`) or labels |
| `keep_open` | no | `true` keeps an answered item in the inbox (for example "Changes needed") |
| `applied` | no | What applied the answer: "amendment 0003", "PLAN DEC-4", a commit. Shown in the outbox under the title ("Applied in") and in the log |
| `superseded_by` | no | Id of the item that replaces this one (must exist). The item leaves the inbox and shows in the outbox as "Superseded by *title* (*id*)", whatever its answers; the log keeps them with status "superseded by *id*". Keep the item in the file |
| `follows` | no | Id of the item whose answer created this one (must exist; an error otherwise). The answered item then lists it in the outbox under "Applied in" as "Led to: *title* (*section*)", linking to it |
| `origin` | no | Who raised it and when |

## Who acts

Every item names who acts, and the kind and the section say it (Pablo, 2026-10-15):

| Who acts | Kind | Section | Default title and blurb |
|---|---|---|---|
| The owner | `act` | `act` | "Act": "Only what needs you: review and merge, run, send, or discuss with someone." |
| The agent | `queue` | `queue` | "Claude's queue": "What I'm doing or will do next, in order. No action needed; comment to reorder or stop one." |
| Nobody (it happened) | `update` | `updates` | |

Act is only for the owner. Work the agent does goes in the queue, never in Act. Items of kind `queue` and
`update` never count as open: not on the tabs or sub-tabs, not as blockers, not in the overview's Open
column. The queue keeps the file's order (no open-first sort), so the order is the plan. Suggested options for
a queue item: "OK", "Do this first", "Stop it". The builder warns when an item of kind `act`, `queue` or
`update` sits in a known section that does not match (for example kind `queue` in section `act`).

## Brand

`form.brand` replaces any post-processing of the built page:

```json
"brand": {
  "fontsUrl": "https://fonts.googleapis.com/css2?family=Geist:wght@400;600&family=Geist+Mono&display=swap",
  "fonts": {"body": "\"Geist\",-apple-system,sans-serif", "mono": "\"Geist Mono\",ui-monospace,monospace"},
  "light": {"bg": "#fbfaff", "card": "#ffffff", "ink": "#0d0c17", "muted": "#6d6982", "line": "#e3e0ee",
            "chip": "#efedf6", "accent": "#1f7bff", "accentInk": "#ffffff"},
  "dark": {"bg": "#0d0c17", "ink": "#f1effa", "accent": "#5aa2ff"},
  "logo": "brand/lockup.svg",
  "favicon": "brand/favicon-32.svg"
}
```

Colours are hex only; `fontsUrl` must start with `https://fonts.googleapis.com/` and replaces the template's
fonts. `logo` is an SVG (or `{"light": …, "dark": …}` when it needs a dark-mode variant), inlined at 28 px
above the title with scripts and event handlers removed. `favicon` is an SVG or PNG, embedded as a `data:`
URI. Paths are relative to the questions file. Anything invalid is a build error.

## Style rules

The builder checks these and warns; `--strict` refuses to build.

- A title is the question, in plain words. At most 70 characters.
- One or two sentences of lead, then at most five bullets of at most 20 words each.
- The whole context stays under about 90 words. If it needs more, write a page and link it.
- Options are at most 10 words. Put the reasoning in the bullets, not the options.
- Spell out each question. Never "and its 6 questions": each is its own item.
- "Discuss first" is a fine option. Answers that pick it go to the overview's "To discuss" list and stay in
  the inbox.
- Write in English, whatever language the chat is in.

## Experiments

An experiment keeps its own questions file, `experiments/<date>-<slug>/decisions.json`, in this same format,
and never adds to the lead's `decisions/questions.json` (SPEC `REQ-CO-14`). Build it with
`-o experiments/<date>-<slug>/form` to read it locally; don't publish it to the lead. Only reserved items
(outward actions, security trade-offs) go to the lead's file during an experiment.

On promotion, consolidate: one item for the outcome (adopt, adapt or drop, with the outcome page as a ref)
and the few questions that still need the lead, at most about three. Drop duplicated and superseded items;
the experiment's file stays as its record.

## Rulings given elsewhere

A ruling the lead gave outside the form (in a meeting, in another session) is still recorded: add an item
for it, archive the answer in `decisions/responses/` with `by` naming the source (for example
`relayed:aledgent-session`) and the notes saying where and when it was given, and set `applied`. The outbox
tags such an answer "Ruled in chat" (`relayed:chat`) or "Relayed from *source*".

## Follow-ups

An answer changes the form (SKILL step 7). Each answered `decide` item shows what it produced: either
`applied` (an amendment, a PLAN decision, a commit) or at least one item whose `follows` names it (agent work
in the queue, owner actions in Act, new decisions in Decide). The builder warns, once per item, when an
answered decision (current answer, not "Discuss first", not superseded) has neither: "*id*: answered with no
visible follow-up (set applied, or add an item that follows it)". That warning means the form has fallen
behind the chat.

## The outbox

Answered items (not kept open, not "Discuss first") and superseded items. Each shows its date, where a
relayed ruling came from, what applied it ("Applied in") and the follow-ups that name it in `follows`
("Led to: *title* (*section*)", linking to each), the original question, the options with the chosen one
marked, and the notes.

## Answers

The page writes one document per item to the collection, keyed by item id:
`{choice, notes, at, by?}`. `by` is the viewer's opaque id when the page knows it.

Archive every read-back as a new file in `decisions/responses/` (for example
`2026-10-03T18-40.json`). The builder merges every file, keeps every distinct answer for the log, and takes
the latest per item as current. Never edit or delete an archived file.
