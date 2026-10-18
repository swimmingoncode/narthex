// Deterministic arm assignment for the M0 model experiment (experiments/2026-10-18-model-groups/).
// Every task whose arm is compare, haiku or sonnet in assignments.json is eligible. This script deals those arms
// again from the seed in the file: stratified by feature, about 20% to compare, the rest split evenly.
// Usage: node scripts/exp-assign.mjs [--write] [assignments.json]
//   without --write it checks that the file already holds the dealt arms (exit 1 if not).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ARMS = ["compare", "haiku", "sonnet"];
export const COMPARE_SHARE = 0.2;

// FNV-1a hash of the seed text, then mulberry32: small, fixed, and the same on every machine.
export function prng(seed) {
  let h = 0x811c9dc5;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.codePointAt(0), 0x01000193) >>> 0;
  let a = h;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// eligible: [{ id, feature }]. Returns { id: arm }.
export function deal(eligible, seed) {
  const rand = prng(seed);
  const strata = new Map();
  for (const t of [...eligible].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!strata.has(t.feature)) strata.set(t.feature, []);
    strata.get(t.feature).push(t.id);
  }
  const features = [...strata.keys()].sort();
  const total = eligible.length;
  const compareTotal = Math.round(total * COMPARE_SHARE);

  // Compare quota per feature: largest remainder, ties broken by the seeded order.
  const quota = new Map(features.map((f) => [f, Math.floor(strata.get(f).length * COMPARE_SHARE)]));
  let left = compareTotal - [...quota.values()].reduce((a, b) => a + b, 0);
  const ranked = shuffle(features, rand).sort(
    (a, b) =>
      ((strata.get(b).length * COMPARE_SHARE) % 1) - ((strata.get(a).length * COMPARE_SHARE) % 1),
  );
  for (const f of ranked) {
    if (left <= 0) break;
    if (quota.get(f) < strata.get(f).length) {
      quota.set(f, quota.get(f) + 1);
      left--;
    }
  }

  // Inside a feature the order is shuffled; the first tasks go to compare and the rest alternate between
  // haiku and sonnet, the alternation carrying over from one feature to the next so the two stay level.
  const arms = {};
  let next = rand() < 0.5 ? "haiku" : "sonnet";
  for (const f of features) {
    const order = shuffle(strata.get(f), rand);
    order.forEach((id, i) => {
      if (i < quota.get(f)) {
        arms[id] = "compare";
      } else {
        arms[id] = next;
        next = next === "haiku" ? "sonnet" : "haiku";
      }
    });
  }
  return arms;
}

export function redeal(doc) {
  const eligible = Object.entries(doc.tasks)
    .filter(([, t]) => ARMS.includes(t.arm))
    .map(([id, t]) => ({ id, feature: t.feature }));
  return deal(eligible, doc.seed);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const file =
    args.find((a) => !a.startsWith("--")) ??
    fileURLToPath(
      new URL("../experiments/2026-10-18-model-groups/assignments.json", import.meta.url),
    );
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const arms = redeal(doc);
  const wrong = Object.entries(arms).filter(([id, arm]) => doc.tasks[id].arm !== arm);
  if (write) {
    for (const [id, arm] of Object.entries(arms)) doc.tasks[id].arm = arm;
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
    console.log(`dealt ${Object.keys(arms).length} tasks from seed ${doc.seed}`);
  } else if (wrong.length > 0) {
    console.error(`arms differ from the seeded deal for: ${wrong.map(([id]) => id).join(", ")}`);
    process.exit(1);
  } else {
    console.log(`arms match the deal from seed ${doc.seed} (${Object.keys(arms).length} tasks)`);
  }
}
