# House rules

These are the defaults every Narthex agent works under (`REQ-SKL-17`). Every brief carries them in full, not by
reference (`REQ-SKL-18`). A project extends or overrides them in its own house-rules file and says which rules it
changes. This repository uses them as they are.

## Identity and signing

- Commit with plain `git commit`, using the identity and signing key the repository or global git config already
  has (`REQ-SKL-19`, `INV-8`).
- Never pass `-c user.name=...`, `-c user.email=...`, `--author=...`, or set `GIT_AUTHOR_*` or
  `GIT_COMMITTER_*`.
- Never pass `--no-gpg-sign`, `-c commit.gpgsign=false` or `-c tag.gpgsign=false`, and never change `gpg.*` or
  `user.signingkey`.
- Never take an identity from session context and put it in a commit.
- If signing fails, stop and report. Do not fall back to an unsigned commit.
- This repository does not use DCO sign-off. Add `git commit -s` only in repositories that require it.
- The `hooks/guard.py` hook of the plugin refuses these commands, in addition to this text (`REQ-SKL-27`).

## Commits, branches and pull requests

- One task, one commit. The message is `T-NNN-NN: what it does`, and ends with the `Co-Authored-By` trailer the
  brief names.
- One pull request per task, on the branch `f-NNN/t-NNN-NN-slug`. The title starts with the task id. The body
  lists the ids the task serves and its tests.
- Do not push, open pull requests or issues, or comment on a repository you do not own, unless the brief says so
  (`INV-4`). Pushing to this repository is the lead's job unless the brief says otherwise.
- Never edit `SPEC.md` or `PLAN.md` unless the task says so (`REQ-SKL-26`). On a gap in either, raise an item and
  record your reading in the feature's notes (`REQ-SKL-24`); do not ask in chat.
- No claude.ai links, home-directory paths or private names in tracked files.

## Worktrees and build directories

- One agent per feature, in its own git worktree and its own build directory (`REQ-SKL-7`, `REQ-SKL-29`).
- Never run verification twice in one worktree, and never share a build directory between two agents.

## No durable work in `/tmp`

- Briefs, clones, scripts and anything else that must outlive the session live in the repository or in a project
  directory, never in `/tmp` or another directory the operating system cleans (`REQ-SKL-23`).
- Throwaway files that a test creates and deletes in the same run are fine; use the platform temp API for those.

## Merge rule

- An agent merges its own pull request only when its task says it may, every check passes, the branch is rebased
  on the current base and checked again, and a fresh reviewer agent (not the author) finds nothing (`REQ-SKL-25`,
  `DEC-17`). Squash merge, so GitHub signs the merge commit.
- These always wait for the lead's click on the pull request, after a separate security review (`INV-4`):
  - sign-in: `apps/server/src/auth/`;
  - links and tokens;
  - keys and secrets;
  - the four contracts in `contracts/`, including each version bump.
- A default or an agent's own reading never authorises an outward action (`REQ-SKL-20`).

## Test naming

- Test names are plain sentences that say what happens: `commit with no-gpg-sign is refused`. No ids in the name
  (`REQ-SKL-30`).
- Each test names the ids it verifies in a comment directly above it, or on the line after a Python `def`:
  `// verifies: REQ-SKL-19, INV-8` in JavaScript and TypeScript, `# verifies: REQ-SKL-19, INV-8` in Python.
- `scripts/check-test-tags.mjs` reads these comments and reports a test with none, or an id that no document
  defines. CI runs it in report mode until the existing tests are tagged.
- Write the test first, see it fail for the right reason, then make it pass (`DEC-15`).

## Waiting on CI

- Never end a turn to wait on CI and never poll it from the agent (`REQ-SKL-28`).
- Wait with one blocking shell command, for example `gh run watch <run-id> --exit-status`, or a background
  command that notifies on exit.

## Token budget

- Filter before reading: `tail -30`, `grep`, `head`, `jq` or a line range. Never put a raw CI log or a large file
  in context.
- Read a file by line range when you know where to look.
- One job per helper, short. Start a fresh helper for the next job.

## Checklists

- A checklist that ends a milestone or a task has every box ticked before the work counts as done.
  `scripts/check-checklist.mjs <file>` fails while a `- [ ]` box is unticked.
