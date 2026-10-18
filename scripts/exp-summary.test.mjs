import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { format, parseResults, summarise } from "./exp-summary.mjs";

const script = fileURLToPath(new URL("./exp-summary.mjs", import.meta.url));

const run = (over) => ({
  task: "T-006-01",
  arm: "haiku",
  model: "haiku",
  effort: "xhigh",
  branch: "exp/T-006-01-haiku",
  status: "complete",
  cost_usd: 0.1,
  turns: 10,
  output_tokens: 1000,
  wall_seconds: 60,
  first_run_green: true,
  findings: { critical: 0, high: 0, medium: 1, low: 1 },
  rework_min: 10,
  merged_as_is: false,
  winner: null,
  ...over,
});

const group = (summary, arm, model) =>
  summary.groups.find((g) => g.arm === arm && g.model === model);

test("means are taken per arm and model", () => {
  const s = summarise([
    run({ cost_usd: 0.1 }),
    run({ task: "T-006-02", cost_usd: 0.3 }),
    run({ task: "T-006-04", arm: "sonnet", model: "sonnet", cost_usd: 0.5 }),
  ]);
  assert.equal(group(s, "haiku", "haiku").tasks, 2);
  assert.ok(Math.abs(group(s, "haiku", "haiku").cost - 0.2) < 1e-9);
  assert.equal(group(s, "sonnet", "sonnet").cost, 0.5);
});

test("findings per task add up the severities", () => {
  const s = summarise([
    run({ findings: { critical: 0, high: 1, medium: 2, low: 1 } }),
    run({ task: "T-006-02", findings: { critical: 0, high: 0, medium: 0, low: 0 } }),
  ]);
  assert.equal(group(s, "haiku", "haiku").findings, 2);
});

test("a measure that is not recorded is left out of the mean", () => {
  const s = summarise([
    run({ rework_min: 20, first_run_green: null }),
    run({ task: "T-006-02", rework_min: null, first_run_green: null }),
  ]);
  const g = group(s, "haiku", "haiku");
  assert.equal(g.rework, 20);
  assert.equal(g.reworkKnown, 1);
  assert.deepEqual(g.green, { yes: 0, of: 0 });
});

test("a run that is still partial is not counted", () => {
  const s = summarise([run(), run({ task: "T-006-02", status: "partial", cost_usd: 9 })]);
  assert.equal(group(s, "haiku", "haiku").tasks, 1);
  assert.equal(s.pending.length, 1);
});

test("compare winners are tallied by model", () => {
  const s = summarise([
    run({ task: "T-006-02", arm: "compare", winner: true }),
    run({ task: "T-006-02", arm: "compare", model: "sonnet", effort: "high", winner: false }),
    run({ task: "T-007-02", arm: "compare", winner: false }),
    run({ task: "T-007-02", arm: "compare", model: "sonnet", effort: "high", winner: true }),
    run({ task: "T-017-03", arm: "compare", winner: null }),
    run({ task: "T-017-03", arm: "compare", model: "sonnet", effort: "high", winner: null }),
  ]);
  assert.equal(s.winners.haiku, 1);
  assert.equal(s.winners.sonnet, 1);
  assert.equal(s.compareDecided, 2);
  assert.deepEqual(s.compareOpen, ["T-017-03"]);
});

test("prior rounds stay out of the winner tally and the stopping rule", () => {
  const s = summarise([
    run({ arm: "prior", winner: true, rework_min: 100 }),
    run({ arm: "prior", model: "sonnet", effort: "high", rework_min: 1 }),
  ]);
  assert.equal(s.winners.haiku, 0);
  assert.equal(s.stop.state, "no data");
});

test("haiku rework above twice the sonnet rework says stop", () => {
  const s = summarise([
    run({ rework_min: 25 }),
    run({ task: "T-006-04", arm: "sonnet", model: "sonnet", effort: "high", rework_min: 10 }),
  ]);
  assert.equal(s.stop.state, "stop");
});

test("haiku rework at twice the sonnet rework or less says continue", () => {
  const s = summarise([
    run({ rework_min: 20 }),
    run({ task: "T-006-04", arm: "sonnet", model: "sonnet", effort: "high", rework_min: 10 }),
  ]);
  assert.equal(s.stop.state, "continue");
});

// verifies: REQ-EXP-4
test("every number in the table is tied to a named run", () => {
  const out = format(
    summarise([
      run(),
      run({
        task: "T-006-04",
        arm: "sonnet",
        model: "sonnet",
        effort: "high",
        branch: "exp/T-006-04-sonnet",
      }),
    ]),
  );
  assert.match(out, /T-006-01\s+haiku\s+haiku xhigh\s+complete\s+exp\/T-006-01-haiku/);
  assert.match(out, /T-006-04\s+sonnet\s+sonnet high\s+complete\s+exp\/T-006-04-sonnet/);
});

test("a line that is not JSON is named by its number", () => {
  assert.throws(() => parseResults(`${JSON.stringify(run())}\n{oops\n`), /line 2/);
});

test("the command prints the table for a results file", () => {
  const dir = mkdtempSync(join(tmpdir(), "exp-summary-"));
  try {
    const file = join(dir, "results.jsonl");
    writeFileSync(
      file,
      `${JSON.stringify(run())}\n\n${JSON.stringify(run({ task: "T-006-02" }))}\n`,
    );
    const r = spawnSync(process.execPath, [script, file], { encoding: "utf8" });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /haiku\s+haiku\s+2/);
    assert.match(r.stdout, /Stopping rule/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
