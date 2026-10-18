#!/usr/bin/env bash
# Runs one task of the model experiment (experiments/2026-10-18-model-groups/) in its own worktree.
# Usage: scripts/exp-run.sh <task-id> <model> <effort> <brief-file>
#   e.g. scripts/exp-run.sh T-006-02 haiku xhigh briefs/T-006-02.md
# It never pushes, and the run may not push or call gh either. It appends a partial line to results.jsonl;
# first_run_green, findings, rework_min and merged_as_is are filled in after the blind review.
set -euo pipefail

if [ "$#" -ne 4 ]; then
  echo "usage: $0 <task-id> <model> <effort> <brief-file>" >&2
  exit 2
fi
task=$1 model=$2 effort=$3 brief=$4

case "$task" in T-[0-9][0-9][0-9]-[0-9][0-9]) ;; *) echo "bad task id: $task" >&2; exit 2 ;; esac
case "$model" in *[!a-zA-Z0-9._-]* | "") echo "bad model: $model" >&2; exit 2 ;; esac
case "$effort" in low | medium | high | xhigh | max) ;; *) echo "bad effort: $effort" >&2; exit 2 ;; esac
[ -f "$brief" ] || { echo "no such brief: $brief" >&2; exit 2; }
brief=$(cd "$(dirname "$brief")" && pwd)/$(basename "$brief")

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
exp_dir=$root/experiments/2026-10-18-model-groups
results=$exp_dir/results.jsonl
ab=$(cd "$root/.." && pwd)/narthex-ab
name=$task-$model
branch=exp/$name
wt=$ab/$name
out=$ab/$name.json

# The assignment decides which models may build the task.
arm=$(node -e '
  const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  console.log(d.tasks[process.argv[2]]?.arm ?? "unknown");
' "$exp_dir/assignments.json" "$task")
case "$arm" in
  unknown | done) echo "$task is $arm in assignments.json; nothing to run" >&2; exit 2 ;;
  haiku) case "$model" in *haiku*) ;; *) echo "$task is in the haiku arm; model must be haiku" >&2; exit 2 ;; esac ;;
  sonnet) case "$model" in *sonnet*) ;; *) echo "$task is in the sonnet arm; model must be sonnet" >&2; exit 2 ;; esac ;;
  compare) case "$model" in *haiku* | *sonnet*) ;; *) echo "$task is in compare; model must be haiku or sonnet" >&2; exit 2 ;; esac ;;
esac

[ ! -e "$wt" ] || { echo "worktree exists: $wt" >&2; exit 1; }
mkdir -p "$ab"
git -C "$root" fetch origin main --quiet
git -C "$root" worktree add --no-track -b "$branch" "$wt" origin/main

cp "$brief" "$wt/.brief.md"
cd "$wt"
npm ci --silent

# The prompt goes on stdin: --allowedTools and --disallowedTools take lists and would swallow a positional prompt.
start=$(date +%s)
status=0
claude -p --model "$model" --effort "$effort" --output-format json \
  --permission-mode acceptEdits \
  --allowedTools "Read,Edit,Write,Glob,Grep,Bash" \
  --disallowedTools "Bash(git push:*),Bash(gh:*)" \
  < .brief.md > "$out" 2> "$ab/$name.err" || status=$?
wall=$(( $(date +%s) - start ))

node -e '
  const fs = require("fs");
  const [out, task, arm, model, effort, branch, wall, status] = process.argv.slice(1);
  let r = {};
  try { r = JSON.parse(fs.readFileSync(out, "utf8")); } catch {}
  const row = {
    task, arm, model, effort, model_id: Object.keys(r.modelUsage ?? {})[0] ?? null, branch,
    date: new Date().toISOString().slice(0, 10),
    status: status === "0" && r.is_error !== true ? "partial" : "failed",
    cost_usd: r.total_cost_usd === undefined ? null : Number(r.total_cost_usd.toFixed(4)),
    turns: r.num_turns ?? null,
    output_tokens: r.usage?.output_tokens ?? null,
    wall_seconds: r.duration_ms === undefined ? Number(wall) : Math.round(r.duration_ms / 100) / 10,
    first_run_green: null, findings: null, rework_min: null, merged_as_is: null, winner: null, notes: "",
  };
  fs.appendFileSync(process.argv[9], JSON.stringify(row) + "\n");
' "$out" "$task" "$arm" "$model" "$effort" "$branch" "$wall" "$status" "$results"

echo "done: $branch in $wt; run JSON in $out; partial line appended to $results"
exit "$status"
