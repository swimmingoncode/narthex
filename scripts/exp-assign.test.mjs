import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ARMS, deal, redeal } from "./exp-assign.mjs";

const file = fileURLToPath(
  new URL("../experiments/2026-10-18-model-groups/assignments.json", import.meta.url),
);
const doc = JSON.parse(readFileSync(file, "utf8"));

const eligible = Array.from({ length: 20 }, (_, i) => ({
  id: `T-${String(6 + (i % 5)).padStart(3, "0")}-${String(i + 1).padStart(2, "0")}`,
  feature: `F-${String(6 + (i % 5)).padStart(3, "0")}`,
}));

test("the same seed deals the same arms", () => {
  assert.deepEqual(deal(eligible, "seed-a"), deal(eligible, "seed-a"));
});

test("another seed deals other arms", () => {
  assert.notDeepEqual(deal(eligible, "seed-a"), deal(eligible, "seed-b"));
});

test("a fifth of the tasks go to compare and the rest split evenly", () => {
  const counts = { compare: 0, haiku: 0, sonnet: 0 };
  for (const arm of Object.values(deal(eligible, "seed-a"))) counts[arm]++;
  assert.deepEqual(counts, { compare: 4, haiku: 8, sonnet: 8 });
});

test("within a feature the haiku and sonnet counts differ by at most one", () => {
  const arms = deal(eligible, "seed-a");
  for (const feature of new Set(eligible.map((t) => t.feature))) {
    const own = eligible.filter((t) => t.feature === feature).map((t) => arms[t.id]);
    const h = own.filter((a) => a === "haiku").length;
    const s = own.filter((a) => a === "sonnet").length;
    assert.ok(Math.abs(h - s) <= 1, `${feature}: haiku ${h}, sonnet ${s}`);
  }
});

test("the committed assignments are the seeded deal", () => {
  const arms = redeal(doc);
  for (const [id, arm] of Object.entries(arms)) assert.equal(doc.tasks[id].arm, arm, id);
});

test("every task has a feature, an arm and a one-line reason", () => {
  const known = new Set([...ARMS, "fixed", "done"]);
  for (const [id, t] of Object.entries(doc.tasks)) {
    assert.equal(t.feature, `F-${id.slice(2, 5)}`, id);
    assert.ok(known.has(t.arm), `${id}: ${t.arm}`);
    assert.ok(t.reason.length > 0 && !t.reason.includes("\n"), id);
  }
});

test("every task of the plan is assigned", () => {
  const plan = readFileSync(fileURLToPath(new URL("../PLAN.md", import.meta.url)), "utf8");
  const ids = [...plan.matchAll(/^\| `(T-\d{3}-\d{2})` \|/gm)].map((m) => m[1]);
  assert.deepEqual(Object.keys(doc.tasks).sort(), ids.sort());
});
