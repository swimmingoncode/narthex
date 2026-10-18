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
- **Outcome:** pending. Adopt, adapt or drop, with the numbers.
