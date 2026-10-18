// Prints a per-arm table from experiments/2026-10-18-model-groups/results.jsonl, the winners of the compare
// tasks, the stopping-rule check, and the runs behind every number.
// Usage: node scripts/exp-summary.mjs [results.jsonl]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ARM_ORDER = ["haiku", "sonnet", "compare", "fixed", "prior"];
export const STOP_FACTOR = 2;

export function parseResults(text) {
  const rows = [];
  text.split("\n").forEach((line, i) => {
    if (line.trim() === "") return;
    try {
      rows.push(JSON.parse(line));
    } catch {
      throw new Error(`results line ${i + 1} is not JSON`);
    }
  });
  return rows;
}

const family = (model) =>
  /haiku/i.test(model) ? "haiku" : /sonnet/i.test(model) ? "sonnet" : (model ?? "?");
const numbers = (rows, pick) =>
  rows.map(pick).filter((v) => typeof v === "number" && Number.isFinite(v));
const mean = (xs) => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length);
const findingsOf = (r) =>
  r.findings && typeof r.findings === "object"
    ? Object.values(r.findings).reduce((a, b) => a + (Number(b) || 0), 0)
    : null;
const rate = (rows, pick) => {
  const known = rows.map(pick).filter((v) => typeof v === "boolean");
  return { yes: known.filter(Boolean).length, of: known.length };
};

export function summarise(rows) {
  const complete = rows.filter((r) => r.status === "complete");
  const keys = [...new Set(complete.map((r) => `${r.arm}/${family(r.model)}`))].sort((a, b) => {
    const [aa, am] = a.split("/");
    const [ba, bm] = b.split("/");
    return (
      (ARM_ORDER.indexOf(aa) + 1 || 99) - (ARM_ORDER.indexOf(ba) + 1 || 99) || am.localeCompare(bm)
    );
  });
  const groups = keys.map((key) => {
    const [arm, model] = key.split("/");
    const rs = complete.filter((r) => r.arm === arm && family(r.model) === model);
    return {
      arm,
      model,
      tasks: rs.length,
      cost: mean(numbers(rs, (r) => r.cost_usd)),
      turns: mean(numbers(rs, (r) => r.turns)),
      outputTokens: mean(numbers(rs, (r) => r.output_tokens)),
      findings: mean(numbers(rs, findingsOf)),
      rework: mean(numbers(rs, (r) => r.rework_min)),
      reworkKnown: numbers(rs, (r) => r.rework_min).length,
      green: rate(rs, (r) => r.first_run_green),
      mergedAsIs: rate(rs, (r) => r.merged_as_is),
    };
  });

  const compare = complete.filter((r) => r.arm === "compare");
  const winners = { haiku: 0, sonnet: 0, other: 0 };
  const decided = new Set();
  for (const r of compare.filter((x) => x.winner === true)) {
    decided.add(r.task);
    const f = family(r.model);
    winners[f in winners ? f : "other"]++;
  }
  const compareTasks = new Set(compare.map((r) => r.task));

  const find = (arm) => groups.find((g) => g.arm === arm && g.model === arm);
  const h = find("haiku");
  const s = find("sonnet");
  let stop = {
    state: "no data",
    text: "No haiku-arm and sonnet-arm tasks with rework recorded yet.",
  };
  if (
    h?.rework !== null &&
    h?.rework !== undefined &&
    s?.rework !== null &&
    s?.rework !== undefined
  ) {
    const over = h.rework > STOP_FACTOR * s.rework;
    stop = {
      state: over ? "stop" : "continue",
      text: `Haiku rework ${h.rework.toFixed(1)} min against Sonnet ${s.rework.toFixed(1)} min per task (limit ${STOP_FACTOR}x): ${
        over ? "STOP assigning haiku and record it." : "keep assigning haiku."
      }`,
    };
  }

  return {
    groups,
    winners,
    compareDecided: decided.size,
    compareOpen: [...compareTasks].filter((t) => !decided.has(t)),
    pending: rows.filter((r) => r.status !== "complete"),
    stop,
    runs: rows,
  };
}

const num = (v, digits) => (v === null ? "-" : v.toFixed(digits));
const frac = (r) => (r.of === 0 ? "-" : `${r.yes}/${r.of}`);

export function format(summary) {
  const head = [
    "arm",
    "model",
    "tasks",
    "cost/task $",
    "turns",
    "out tokens",
    "findings",
    "rework min",
    "green 1st",
    "merged as is",
  ];
  const body = summary.groups.map((g) => [
    g.arm,
    g.model,
    String(g.tasks),
    num(g.cost, 3),
    num(g.turns, 1),
    g.outputTokens === null ? "-" : Math.round(g.outputTokens).toString(),
    num(g.findings, 1),
    g.rework === null ? "-" : `${g.rework.toFixed(1)} (n=${g.reworkKnown})`,
    frac(g.green),
    frac(g.mergedAsIs),
  ]);
  const table = [head, ...body];
  const widths = head.map((_, i) => Math.max(...table.map((row) => row[i].length)));
  const lines = table.map((row) =>
    row
      .map((c, i) => c.padEnd(widths[i]))
      .join("  ")
      .trimEnd(),
  );
  lines.splice(1, 0, widths.map((w) => "-".repeat(w)).join("  "));

  const w = summary.winners;
  lines.push("");
  lines.push(
    `Compare winners: haiku ${w.haiku}, sonnet ${w.sonnet}${w.other ? `, other ${w.other}` : ""} (${summary.compareDecided} decided` +
      `${summary.compareOpen.length ? `, open: ${summary.compareOpen.join(", ")}` : ""})`,
  );
  lines.push(`Stopping rule: ${summary.stop.text}`);
  if (summary.pending.length > 0) {
    lines.push(
      `Awaiting review or failed: ${summary.pending.map((r) => `${r.task}/${family(r.model)} (${r.status})`).join(", ")}`,
    );
  }
  lines.push("");
  lines.push("Runs behind the numbers:");
  for (const r of summary.runs) {
    lines.push(`  ${r.task}  ${r.arm}  ${r.model} ${r.effort}  ${r.status}  ${r.branch}`);
  }
  lines.push("");
  lines.push(
    "Small sample: read the means as a first look, not a verdict. 'prior' rows come from before the experiment.",
  );
  return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file =
    process.argv[2] ??
    fileURLToPath(new URL("../experiments/2026-10-18-model-groups/results.jsonl", import.meta.url));
  try {
    console.log(format(summarise(parseResults(readFileSync(file, "utf8")))));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
