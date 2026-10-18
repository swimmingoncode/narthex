# Experiment: model groups for the rest of milestone M0

- **Started:** 2026-10-18, on Pablo's ruling: "Mark some tasks that can be compared, others that can be executed
  by each assigned agent, such that we have control and test groups."
- **Follows:** `experiments/2026-10-17-haiku-coding/` (two rounds, adopt as adapted). Plan decision: `DEC-24`.
- **Question:** across M0, does Haiku at `xhigh` effort match Sonnet at `high` on mechanical tasks with a fixed
  interface, on quality and rework, at lower cost?

## Arms

| Arm | Who builds | Role |
|---|---|---|
| `compare` | Haiku xhigh and Sonnet high, each from the same brief | A blind review picks the winner, which merges |
| `haiku` | Haiku xhigh only | Test group |
| `sonnet` | Sonnet high only | Control group |
| `fixed` | Sonnet, or Opus for the token-kind spike and open design | Not in the experiment: contracts, design-adjacent work and security |

`assignments.json` also marks `done` for the 10 tasks merged before the experiment began (`T-001-01` to
`T-001-06`, `T-002-01` to `T-002-04`). Of the 86 tasks of M0: 10 `done`, 56 `fixed`, 20 eligible, which are 4
`compare`, 8 `haiku` and 8 `sonnet`.

## Eligibility

Only a mechanical task with a fixed interface is eligible: the contract or schema it reads is frozen or
specified, its tests and criteria are stated, and it makes no design choice. Anything that signs people in,
handles tokens or keys, defines a contract or a format other tasks reuse, writes skill prose, or acts outward
is `fixed`. Each task's `reason` in `assignments.json` says which way it fell. Eligibility was set before any
arm was dealt.

## Assignment

- Deterministic, from the `seed` in `assignments.json`, stratified by feature (the stratum is the feature).
- About 20% of the eligible tasks go to `compare` (largest remainder per feature, ties broken by the seed). In
  each feature the tasks are shuffled by the seed: the first ones take the compare quota, the rest alternate
  between `haiku` and `sonnet`, the alternation carrying over from one feature to the next. So each arm is
  balanced overall and within a feature the two groups differ by at most one.
- `node scripts/exp-assign.mjs` checks that the file holds exactly this deal; `--write` deals it again. A test
  runs the same check in `npm test`. Changing an arm after the deal needs a note here and a new `reason`.

## Running a task

1. Write the brief once per task, with the house rules in full. `compare` tasks use the identical brief for
   both models.
2. `scripts/exp-run.sh <task-id> <model> <effort> <brief-file>` makes the worktree `../narthex-ab/<task>-<model>`
   on branch `exp/<task>-<model>` from `origin/main`, runs the model headless and appends a partial line to
   `results.jsonl`. It refuses a model that does not match the task's arm. It never pushes. `haiku` runs at
   `xhigh` and `sonnet` at `high`.
3. Blind review (below), then fill in the rest of the line. The task merges through the normal rules of
   `HOUSE-RULES.md`: its own branch `f-NNN/t-NNN-NN-slug`, one PR, and the lead's click where the rules ask.
4. `node scripts/exp-summary.mjs` prints the table at any time.

## Measures per task

Each line of `results.jsonl` is one run, with:

- model and effort;
- cost in USD, turns, output tokens and wall time, from the run's JSON;
- checks green on the first run (yes/no): `npm run check` and `npm test` as the run left them;
- blind-review findings by severity (critical, high, medium, low);
- rework minutes, as the helper's or the reviewer's estimate of the time to bring it to a merge;
- whether it merged as is (yes/no);
- for `compare`, whether it won.

## Blind review

Every task gets the same review whatever its arm: a fresh reviewer, never the author, with the same review brief
and the same severity scale. The reviewer is not told the model. In `compare` the two branches are shown as A and
B, in an order drawn from the seed, and the reviewer names the better one and says why. The key from A and B to
the models is kept apart and opened only after the verdict is recorded.

## Analysis at M0 exit

Compare the `haiku` and `sonnet` groups on:

- cost per task;
- review findings per task;
- rework minutes per task;
- the first-run green rate.

Tally the winners of the four `compare` tasks. The earlier rounds are in `results.jsonl` as `prior` and stay out
of every group total.

The sample is small: 8 tasks per group, 4 compare tasks, one run each. Read the numbers as a first look that
decides the next step, not as a verdict.

**Stopping rule.** If the `haiku` tasks average more than twice the rework of the `sonnet` tasks, stop assigning
haiku to the rest of M0 (the remaining eligible tasks go to Sonnet) and record it here. `exp-summary.mjs` prints
the check.

## Outcome

Pending. Written at M0 exit as adopt, adapt or drop, with each number tied to a named run in `results.jsonl`.
