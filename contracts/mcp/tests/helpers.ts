import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

export const CONTRACT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = resolve(CONTRACT, "..", "..");
export const DATA_MODEL = join(ROOT, "contracts", "data-model");

// The MCP scopes of SAD 11.4. contracts/tokens (F-005) is the source once it merges; until then this is the list.
export const TOKEN_SCOPES = [
  "knowledge:read",
  "spec:read",
  "change:write",
  "verify:run",
  "decide:read",
  "decide:publish",
];

// Ajv's CommonJS build is the class itself at runtime and a module with `default` for the types.
const AjvClass = Ajv2020.default;

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function jsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => join(dir, name));
}

// An Ajv that already knows the frozen data-model schemas, so tool schemas can $ref them by their $id.
export function newAjv() {
  const ajv = new AjvClass({ allErrors: true, strict: true, strictTuples: false });
  for (const file of jsonFiles(DATA_MODEL).filter((f) => f.endsWith(".schema.json"))) {
    ajv.addSchema(readJson(file) as object);
  }
  return ajv;
}

export function validatorFor(schemaFile: string) {
  return newAjv().compile(readJson(join(CONTRACT, schemaFile)) as object);
}

export interface Tool {
  name: string;
  group: string;
  scope: string;
  phase: "M0" | "M1";
  effect: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  untrusted_fields: string[];
  budget: { typical_bytes: number; max_bytes: number };
}

export function loadTools(): Tool[] {
  return (readJson(join(CONTRACT, "tools.json")) as { tools: Tool[] }).tools;
}

export interface CallFixture {
  tool: string;
  input: unknown;
  output: unknown;
}

export interface InvalidCall {
  tool: string;
  side: "input" | "output";
  value: unknown;
}

export const CALLS = join(CONTRACT, "fixtures", "calls");

export function validCalls(): CallFixture[] {
  return jsonFiles(join(CALLS, "valid")).map((f) => readJson(f) as CallFixture);
}

export function nameOf(file: string): string {
  return basename(file);
}
