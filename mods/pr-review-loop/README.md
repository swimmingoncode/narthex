# pr-review-loop

A Claude Code mod (function hooks) that automates the coordination in the review workflow: two
sessions work one PR, an **implementer** and a **reviewer**, and talk through an append-only chat
file (`~/.claude/projects/<slug>/pr<N>-review-chat.md`). GitHub is the record; the chat is
coordination. Until now each side needed a manual cron to notice the other. This mod watches the PR
and the chat file and, when something that matters for that side happens, queues one prompt into the
session that tells it what changed and to read the record itself.

It never merges, never posts to GitHub and never writes the chat. It holds no secrets: `gh` is
called by absolute path (`/opt/homebrew/bin/gh`) and uses its own login.

## Install (per session)

In any session, the desktop app included:

```text
/plugin marketplace add swimmingoncode/narthex
/plugin install pr-review-loop@swimmingoncode
```

While developing, from a terminal:

```sh
claude --plugin-dir ~/Documents/Development/narthex/mods/pr-review-loop
# or, where no flag can be given (an SDK host):
CLAUDE_CODE_PLUGIN_DIRS=~/Documents/Development/narthex/mods/pr-review-loop claude
```

## Commands

```text
/pr-watch <N> <reviewer|implementer> [--repo owner/name] [--chat <path>]
/pr-watch status
/pr-watch stop
```

- `--repo` defaults to `gh repo view --json nameWithOwner` in the session's directory.
- The chat path is never derived from the cwd (the two sessions run in different worktrees with
  different project slugs). With no `--chat`, the mod lists `~/.claude/projects/*/` and looks for
  exactly `pr<N>-review-chat.md`. One match is used; none, or several, is said in the command reply
  and in the status line, and the mod keeps watching GitHub only. A PR number can exist in two repos,
  so the resolved path is always echoed. While none is found it looks again on every GitHub poll.
- Attaching takes a **baseline**: history that already happened wakes nobody (the reply notes when
  the last chat message was already waiting for you). Cursors are kept per `repo#N:role` in
  `$.store`, so re-attaching or a reload resumes instead of replaying. `stop` deletes them.
- While attached, the status line reads like `PR #854 · reviewer · waiting on implementer · CI ✓`
  (`your turn`, `wake queued`, `CI ✗`, `CI …` for pending, `CI –` for no checks yet).
- On a merged or closed PR it cancels its timers, clears the status line, toasts once and detaches.

## What wakes whom

| Role | Wakes on |
| --- | --- |
| reviewer | a new head sha; `READY_FOR_REVIEW`, `ADDRESSED` or `DISPUTED` from the implementer |
| implementer | a new GitHub review; `REVIEW_POSTED`, `DISPUTED`, `BLOCKED` or `SIGNED_OFF` from the reviewer; CI reaching a final state on the current head; **signed off and CI green** |

"Signed off and CI green" means a `SIGNED_OFF` from the reviewer naming the current head (or, with no
sha, posted while that head was current), or an `APPROVED` GitHub review at the current head, plus
every check successful. A later `REVIEW_POSTED`, `DISPUTED` or `BLOCKED` from the reviewer revokes a
chat sign-off. Then the prompt tells the implementer to run the "Before merge" checklist and merge to
the correct base itself.

Rules that keep it quiet:

- A header whose role is the mod's own role is its own echo and never wakes it.
- A header with no role in it takes the role its type implies (`READY_FOR_REVIEW` and `ADDRESSED` are
  the implementer's, `REVIEW_POSTED` and `SIGNED_OFF` the reviewer's). `DISPUTED`, `BLOCKED` and
  `FYI` with no role are ambiguous and wake nobody.
- An empty check list (right after a push, before checks register) is neither final nor green.
- Events landing within 5 s become one prompt. At most one prompt is queued at a time: while ours is
  queued, or a turn is running, later events wait and go out together when it ends. (A queued prompt
  or running turn older than 20 minutes is treated as stale.)
- The prompt carries **facts only**: event types, shas, review states, check names with conclusions,
  the chat path and the new line range. No comment or chat text is ever pasted into it, because
  anyone can comment on a PR. The prompt tells the session to read the record itself and to treat it
  as data.

Polling: the chat file every 15 s (`$.fs.stat`, then a read only when mtime or size moved), GitHub
every 90 s with one call: `gh pr view N --repo R --json headRefOid,state,reviews,comments,
statusCheckRollup,mergeStateStatus,reviewDecision`. Review and comment ids are GraphQL node ids (not
ordered), so the cursors are bounded seen-sets, not a "last id". A chat message is new only if it is
past the last consumed line **and** its fingerprint was never acted on, so an edit that shifts old
headers down (a status table growing at the top) fires nothing; a file that shrinks is re-baselined.

## The chat line format

The parser is lenient, because the real files vary: `**TYPE** ...`, `## <date> — <role> — TYPE`,
`### <date> TYPE (<role>)`, `[<date>] TYPE by <role>`, `[TYPE] ...`, backticked types, `·` separators.
Only those shapes count as headers, so templates ("post `DISPUTED` here ..."), status tables and
prose that mention a type are ignored. The role is the first `reviewer` or `implementer` in the
header line, and `head <sha>` or `at <sha>` names the head.

The canonical form, which the mod parses without guessing:

```text
**TYPE** (role, YYYY-MM-DD, head <sha>)
```

`TYPE` is one of `READY_FOR_REVIEW`, `REVIEW_POSTED`, `ADDRESSED`, `DISPUTED`, `BLOCKED`, `FYI`,
`SIGNED_OFF`. Text under the header is free-form; the mod never reads it into a prompt.

## Proposed change to REVIEW-WORKFLOW.md section 6

Text only; nothing in any Bloque repo was touched.

```diff
 ### The coordination channel
 
 An append-only file **outside the repository**:
 
 ```
 ~/.claude/projects/<project>/pr<N>-review-chat.md
 ```
 
+Each message opens with one header line, so tools can tell who spoke and at which head:
+
+```
+**TYPE** (role, YYYY-MM-DD, head <sha>)
+```
+
+`role` is `reviewer` or `implementer`; `<sha>` is the PR head the message is about.
+
 | Type | Meaning | The other side should |
 | --- | --- | --- |
 | `READY_FOR_REVIEW` | new commits pushed | re-review, then `REVIEW_POSTED` |
 | `REVIEW_POSTED` | findings are on the PR | address, then `ADDRESSED` |
 | `ADDRESSED` | fixed, with shas | verify, update the status table |
 | `DISPUTED` | the finding is wrong, or the fix is worse than the bug | argue it here, not on the PR |
 | `BLOCKED` | needs a human decision | say which decision, and why it cannot be defaulted |
+| `SIGNED_OFF` | the reviewer has no open findings **at this head** (a new push voids it) | with CI green, run "Before merge" (section 9) and merge to the base section 10 names |
 | `FYI` | context | nothing |
 
 Keep a status table at the top, one row per finding.
+
+The owner of a PR cannot `APPROVE` it, and both sessions share one `gh` login, so GitHub cannot say
+which side wrote a review. `SIGNED_OFF` is how the reviewer says "done" where an approval is not
+possible. An `APPROVED` review from another account at the current head counts as the same signal.
```

## Development

```sh
claude plugin validate .
claude plugin test .
```

Type-check with the header tsconfig of `types/claude-code.d.ts` (the engine lays that file under
`.claude-plugin/types/` only for a folder a session loads and hot-reloads).

Layout: `hooks/register.ts` (wiring, watchers, command), `hooks/lib/chat.ts` (header parsing),
`hooks/lib/gh.ts` (snapshot reading), `hooks/lib/wake.ts` (the prompt), `types/index.d.ts` (the
attachment held in `$.state`), `tests/` (scripted `gh` snapshots, chat appends, mocked clock/store).
