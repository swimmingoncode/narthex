// Checks .narthex/registry.json: the one place that hands out ids and numbers that must never collide.
//
//   {
//     "version": 1,
//     "plan": { "features": ["F-001", ...], "tasks": ["T-001-01", ...] },
//     "amendments": [1, 2, ...],
//     "migrations": [{ "number": 1, "name": "initial-schema", "task": "T-009-02" }]
//   }
//
// `plan` mirrors the ids PLAN.md defines (feature headings and task rows); `amendments` mirrors the numbered files
// in amendments/; `migrations` are the numbers reserved for apps/server/migrations/NNNN-*.sql, each once.
// Usage: node scripts/check-registry.mjs [--sync] [root]
//   --sync rewrites `plan` and `amendments` from PLAN.md and amendments/, and keeps `migrations` as they are.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FEATURE = /^F-\d{3}$/;
const TASK = /^T-(\d{3})-\d{2}$/;

const duplicates = (list) => list.filter((item, i) => list.indexOf(item) !== i);

function planIds(root) {
  const file = join(root, "PLAN.md");
  if (!existsSync(file)) return null;
  const features = [];
  const tasks = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const feature = line.match(/^#{2,4}\s+`(F-\d{3})`/);
    if (feature) features.push(feature[1]);
    const task = line.match(/^\|\s*`(T-\d{3}-\d{2})`\s*\|/);
    if (task) tasks.push(task[1]);
  }
  return { features, tasks };
}

function amendmentNumbers(root) {
  const dir = join(root, "amendments");
  if (!existsSync(dir)) return null;
  return readdirSync(dir)
    .map((name) => name.match(/^(\d{4})-.+\.md$/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

export function checkRegistry(root, registry = null) {
  const errors = [];
  const file = join(root, ".narthex", "registry.json");
  if (!registry) {
    if (!existsSync(file)) return [`.narthex/registry.json is missing`];
    try {
      registry = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      return [`.narthex/registry.json is not valid JSON: ${error.message}`];
    }
  }
  const features = registry.plan?.features ?? [];
  const tasks = registry.plan?.tasks ?? [];
  const amendments = registry.amendments ?? [];
  const migrations = registry.migrations ?? [];

  for (const id of new Set(duplicates(features))) errors.push(`duplicate feature id ${id}`);
  for (const id of new Set(duplicates(tasks))) errors.push(`duplicate task id ${id}`);
  for (const id of features) if (!FEATURE.test(id)) errors.push(`malformed feature id ${id}`);
  for (const id of tasks) {
    const m = id.match(TASK);
    if (!m) errors.push(`malformed task id ${id}`);
    else if (!features.includes(`F-${m[1]}`))
      errors.push(`task ${id} belongs to unknown feature F-${m[1]}`);
  }

  for (const n of new Set(duplicates(amendments)))
    errors.push(`amendment number ${n} reserved twice`);

  const numbers = migrations.map((m) => m.number);
  for (const n of new Set(duplicates(numbers))) errors.push(`migration number ${n} reserved twice`);
  for (const m of migrations) {
    if (!Number.isInteger(m.number) || m.number < 1)
      errors.push(`migration number ${m.number} is not a positive integer`);
    if (m.task && !tasks.includes(m.task))
      errors.push(`migration ${m.number} names unknown task ${m.task}`);
  }
  const names = migrations.map((m) => m.name).filter(Boolean);
  for (const name of new Set(duplicates(names))) errors.push(`migration name ${name} used twice`);

  const plan = planIds(root);
  if (plan) {
    for (const id of new Set(duplicates(plan.tasks)))
      errors.push(`PLAN.md defines task ${id} more than once`);
    for (const id of new Set(duplicates(plan.features)))
      errors.push(`PLAN.md defines feature ${id} more than once`);
    for (const id of plan.tasks)
      if (!tasks.includes(id)) errors.push(`task ${id} is in PLAN.md but not in the registry`);
    for (const id of tasks)
      if (!plan.tasks.includes(id)) errors.push(`task ${id} is in the registry but not in PLAN.md`);
    for (const id of plan.features)
      if (!features.includes(id))
        errors.push(`feature ${id} is in PLAN.md but not in the registry`);
    for (const id of features)
      if (!plan.features.includes(id))
        errors.push(`feature ${id} is in the registry but not in PLAN.md`);
  }
  const onDisk = amendmentNumbers(root);
  if (onDisk) {
    for (const n of onDisk)
      if (!amendments.includes(n))
        errors.push(`amendment ${n} is in amendments/ but not in the registry`);
    for (const n of amendments)
      if (!onDisk.includes(n))
        errors.push(`amendment ${n} is in the registry but not in amendments/`);
  }
  return errors;
}

export function syncRegistry(root) {
  const file = join(root, ".narthex", "registry.json");
  const current = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const plan = planIds(root) ?? current.plan ?? { features: [], tasks: [] };
  const next = {
    version: 1,
    plan: { features: [...new Set(plan.features)], tasks: [...new Set(plan.tasks)] },
    amendments: [...new Set(amendmentNumbers(root) ?? current.amendments ?? [])],
    migrations: current.migrations ?? [],
  };
  writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const root = resolve(
    args.find((a) => !a.startsWith("--")) ?? join(dirname(fileURLToPath(import.meta.url)), ".."),
  );
  if (args.includes("--sync")) {
    syncRegistry(root);
    console.log("registry synced from PLAN.md and amendments/");
  }
  const errors = checkRegistry(root);
  for (const error of errors) console.error(`registry: ${error}`);
  if (errors.length > 0) {
    console.error(`${errors.length} registry error(s)`);
    process.exit(1);
  }
  console.log("registry ok");
}
