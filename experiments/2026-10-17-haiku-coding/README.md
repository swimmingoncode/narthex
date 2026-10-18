# Experiment: can Haiku on xhigh effort code bounded tasks as well as Sonnet?

- **Started:** 2026-10-17, at Pablo's request ("if we see results for ourselves, we can relay").
- **Question:** for a bounded, well-briefed coding task, does Haiku at `xhigh` effort match Sonnet at `high` on
  quality, at a lower cost?
- **Scope:** feature `F-002` (data-model contract, tasks T-002-01 to T-002-04), built twice from the same brief in
  separate worktrees and branches (`exp/f002-haiku`, `exp/f002-sonnet`). Headless Claude Code runs:
  `claude -p --model <m> --effort <e> --output-format json`. Nothing merges until the outcome is ruled.
- **Measures:** tests and checks passing; a blind review (findings by severity); rework needed; cost
  (`total_cost_usd`), tokens and wall time from the run's JSON; turns.
- **Decision log:** `decisions.json` in this folder (none expected).
- **Outcome (2026-10-17): adapt.** One run each, so treat it as a first data point, not a verdict.

| | Haiku, xhigh | Sonnet, high |
|---|---|---|
| Cost | **$1.00** | $1.81 |
| Wall time | 10.1 min | 9.0 min |
| Turns | 82 | 53 |
| Output tokens | 122k | 58k |
| Cache-read tokens | 11.7M | 5.8M |
| Tests and checks | all green | all green |
| Blind review, five criteria (1–5) | 4, 3, 3, 3.5, 3 (avg 3.3) | 5, 4.5, 5, 4, 4 (avg 4.5) |
| Rework before merge (reviewer's estimate) | ~40 min | ~5 min |

Reading:
- Haiku cost 45% less and finished the whole feature, green. But it invented required fields in a contract that
  freezes, left the event schema open, skipped one response shape, and wrote thinner tests. In a contract those
  are the expensive kind of defect.
- Haiku needed 55% more turns and twice the output tokens: it explored more to reach the same point.
- Counting rework, the saving shrinks. A Sonnet helper fixing Haiku's 40 minutes would cost about what was saved.

Proposed rule (not ruled):
- Haiku codes bounded, mechanical tasks whose interface is already fixed: fixtures, migrations of known shape,
  renames, test scaffolds for an existing contract.
- Sonnet keeps contract and design-adjacent coding.
- Run the comparison again on one mechanical task before relaying anything.

Branch A (Sonnet) is the one to merge, after its 5-minute fixes; contracts need Pablo's yes to merge.

## Round 2 (2026-10-18): a mechanical task with a fixed interface

Task: the rest of `T-001-06`, a script that lists unanswered act items, with its tests and notes. It reads the
contract merged in round 1. Same setup: same brief, separate worktrees, headless runs, blind review.

| | Haiku, xhigh | Sonnet, high |
|---|---|---|
| Cost | **$0.044** | $0.281 |
| Wall time | 2.1 min | 1.2 min |
| Turns | 25 | 10 |
| Output tokens | 23.6k | 5.1k |
| Blind review (behaviour, tests, style) | **4, 3, 5** | 3, 4, 4 |
| Rework before merge | ~2 min (wire its tests into `npm test`) | ~10 min (malformed input exits like "unanswered") |

Haiku won: it cost 6.3 times less, its behaviour was better (clear errors on bad input, real time comparison),
and it needed less rework. It merged as PR #2.

## Outcome (after two rounds): adopt, as adapted

- **Haiku at xhigh codes bounded, mechanical tasks whose interface is already fixed.** Round 2: 6x cheaper and
  better.
- **Sonnet keeps contract and design-adjacent coding.** Round 1: Haiku was 45% cheaper but its contract needed ~40
  minutes of rework, which ate the saving.
- Either way, a blind review before merge stays mandatory. Haiku's misses were wiring and scope (an unwired test,
  invented required fields), the kind a reviewer catches fast.
- Two rounds are still a small sample. Keep logging cost, turns and rework per helper, and revisit after M0.
