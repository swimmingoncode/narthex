import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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

export function validatorFor(schemaFile: string) {
  const ajv = new AjvClass({ allErrors: true, strict: true, strictTuples: false });
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
