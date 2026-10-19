import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const CONTRACT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = resolve(CONTRACT, "..", "..");
export const BUILDER = join(ROOT, "skills", "decision-form", "scripts", "build.py");

// Ajv's CommonJS build is the class itself at runtime and a module with `default` for the types.
const AjvClass = Ajv2020.default;

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

// The other schemas of the contract are loaded too: `trace` takes definitions from `spec-item` by `$ref`.
export function validatorFor(schemaFile: string) {
  const ajv = new AjvClass({ allErrors: true, strict: true, strictTuples: false });
  for (const name of readdirSync(CONTRACT)) {
    if (name.endsWith(".schema.json") && name !== schemaFile) {
      ajv.addSchema(readJson(join(CONTRACT, name)) as object);
    }
  }
  return ajv.compile(readJson(join(CONTRACT, schemaFile)) as object);
}

export function jsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => join(dir, name));
}

// The builder is the other implementation of the contract: it reports errors, never throws for bad data.
export function runBuilder(questionsFile: string, ...flags: string[]) {
  const run = spawnSync("python3", [BUILDER, questionsFile, "--check", ...flags], {
    encoding: "utf8",
  });
  return { code: run.status, out: run.stdout, err: run.stderr };
}

export interface FeedEvent {
  form: string;
  cursor: number;
}

// The order rule of a change feed (INV-3, REQ-DEC-24): within one form, each cursor is larger than the one before.
// Returns the index of the first event that breaks it, or null.
export function firstCursorViolation(events: readonly FeedEvent[]): number | null {
  const last = new Map<string, number>();
  for (const [index, event] of events.entries()) {
    const before = last.get(event.form);
    if (before !== undefined && event.cursor <= before) return index;
    last.set(event.form, event.cursor);
  }
  return null;
}

type ExpectedErrors = Record<string, { keyword: string; instancePath: string }>;
type Validate = ReturnType<typeof validatorFor>;

// Every file of <fixtures>/invalid fails, with the error that <fixtures>/expected-errors.json names for it.
export function invalidFixtureProblems(validate: Validate, fixtures: string): string[] {
  const expected = readJson(join(fixtures, "expected-errors.json")) as ExpectedErrors;
  const files = jsonFiles(join(fixtures, "invalid"));
  const problems: string[] = [];
  if (files.length !== Object.keys(expected).length) {
    problems.push(
      `${files.length} invalid fixtures but ${Object.keys(expected).length} expected errors`,
    );
  }
  for (const file of files) {
    const name = `invalid/${basename(file)}`;
    const want = expected[name];
    if (!want) {
      problems.push(`${name} has no expected error`);
      continue;
    }
    if (validate(readJson(file))) {
      problems.push(`${name} should fail`);
      continue;
    }
    const found = (validate.errors ?? []).some(
      (e) => e.keyword === want.keyword && e.instancePath === want.instancePath,
    );
    if (!found) {
      problems.push(
        `${name}: wanted ${JSON.stringify(want)}, got ${JSON.stringify(validate.errors)}`,
      );
    }
  }
  return problems;
}
