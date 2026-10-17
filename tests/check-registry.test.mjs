import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";
import { checkRegistry } from "../scripts/check-registry.mjs";
import { makeTree } from "./helpers.mjs";

const registry = (over = {}) =>
  JSON.stringify({
    version: 1,
    plan: { features: ["F-001", "F-002"], tasks: ["T-001-01", "T-002-01"] },
    amendments: [1],
    migrations: [],
    ...over,
  });

const plan =
  "#### `F-001` One\n\n| `T-001-01` | work |\n\n#### `F-002` Two\n\n| `T-002-01` | work |\n| `T-NNN-NN` | glossary row |\n";

const tree = (over, extra = {}) =>
  makeTree({
    ".narthex/registry.json": registry(over),
    "PLAN.md": plan,
    "amendments/0001-first.md": "# first\n",
    ...extra,
  });

// verifies: REQ-DAT-8, REQ-VER-1
test("a consistent registry passes", () => {
  assert.deepEqual(checkRegistry(tree()), []);
});

// verifies: REQ-DAT-8, REQ-VER-1
test("duplicate task id is an error", () => {
  const root = tree({
    plan: { features: ["F-001", "F-002"], tasks: ["T-001-01", "T-002-01", "T-001-01"] },
  });
  assert.ok(checkRegistry(root).includes("duplicate task id T-001-01"));
});

// verifies: REQ-DAT-8, REQ-VER-1
test("task id defined twice in the plan is an error", () => {
  const root = tree({}, { "PLAN.md": `${plan}| \`T-001-01\` | again |\n` });
  assert.ok(checkRegistry(root).includes("PLAN.md defines task T-001-01 more than once"));
});

// verifies: REQ-DAT-8, REQ-VER-1
test("task missing from the registry is an error", () => {
  const root = tree({ plan: { features: ["F-001", "F-002"], tasks: ["T-001-01"] } });
  assert.ok(checkRegistry(root).includes("task T-002-01 is in PLAN.md but not in the registry"));
});

// verifies: REQ-DAT-8, REQ-VER-1
test("migration number reserved twice is an error", () => {
  const root = tree({
    migrations: [
      { number: 1, name: "initial", task: "T-001-01" },
      { number: 1, name: "second", task: "T-002-01" },
    ],
  });
  assert.ok(checkRegistry(root).includes("migration number 1 reserved twice"));
});

// verifies: REQ-DAT-8, REQ-VER-1
test("amendment number reserved twice or missing from disk is an error", () => {
  const twice = checkRegistry(tree({ amendments: [1, 1] }));
  assert.ok(twice.includes("amendment number 1 reserved twice"));
  const missing = checkRegistry(tree({ amendments: [1, 2] }));
  assert.ok(missing.includes("amendment 2 is in the registry but not in amendments/"));
  const extra = checkRegistry(tree({}, { "amendments/0002-second.md": "# second\n" }));
  assert.ok(extra.includes("amendment 2 is in amendments/ but not in the registry"));
});

// verifies: REQ-DAT-8
test("the command exits non-zero on a broken registry and zero on this repository", () => {
  const root = tree({ migrations: [{ number: 3 }, { number: 3 }] });
  assert.equal(spawnSync("node", ["scripts/check-registry.mjs", root]).status, 1);
  const out = execFileSync("node", ["scripts/check-registry.mjs"], { encoding: "utf8" });
  assert.match(out, /registry ok/);
});
