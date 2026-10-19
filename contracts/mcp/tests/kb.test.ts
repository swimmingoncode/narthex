import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import {
  CONTRACT,
  invalidFixtureProblems,
  jsonFiles,
  loadTools,
  readJson,
  TOKEN_SCOPES,
  validatorFor,
  validCalls,
} from "./helpers.ts";

const validate = validatorFor("kb-piece.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "kb-piece");

interface Resource {
  name: string;
  uri_template: string;
  scope: string;
  variables: Record<string, { pattern: string }>;
}
interface Prompt {
  name: string;
  description: string;
  scope: string;
  arguments: { name: string; required: boolean }[];
}

const resources = (readJson(join(CONTRACT, "resources.json")) as { resources: Resource[] })
  .resources;
const prompts = (readJson(join(CONTRACT, "prompts.json")) as { prompts: Prompt[] }).prompts;

// verifies: REQ-KNB-2, REQ-KNB-3, INV-14
test("kb piece fixtures pass for all three classes", () => {
  const classes = new Set<unknown>();
  for (const file of jsonFiles(join(FIXTURES, "valid"))) {
    const piece = readJson(file) as { class: unknown };
    assert.equal(validate(piece), true, `${file}: ${JSON.stringify(validate.errors)}`);
    classes.add(piece.class);
  }
  assert.deepEqual([...classes].sort(), ["closed", "open_standard", "supplementary"]);
});

// verifies: REQ-KNB-3
test("kb piece without a class fails", () => {
  const piece = readJson(join(FIXTURES, "invalid", "without-class.json"));
  assert.equal(validate(piece), false);
  assert.ok(
    validate.errors?.some((e) => e.keyword === "required" && e.params.missingProperty === "class"),
  );
});

// verifies: REQ-KNB-4, INV-14
test("supplementary piece labelled normative fails", () => {
  const piece = readJson(join(FIXTURES, "invalid", "supplementary-labelled-normative.json"));
  assert.equal(validate(piece), false);
  assert.ok(validate.errors?.some((e) => e.instancePath === "/label"));
});

// verifies: REQ-KNB-3, REQ-KNB-4, INV-14
test("invalid kb piece fixtures fail with the expected error", () => {
  assert.deepEqual(invalidFixtureProblems(validate, FIXTURES), []);
});

// verifies: REQ-KNB-2, REQ-IFC-1
test("resources are knowledge pieces and profiles at a version", () => {
  assert.deepEqual(
    resources.map((r) => r.uri_template),
    ["narthex://kb/{id}@{version}", "narthex://profile/{name}@{version}"],
  );
  for (const r of resources) {
    assert.ok(TOKEN_SCOPES.includes(r.scope), r.name);
    const names = [...r.uri_template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    assert.deepEqual(names.sort(), Object.keys(r.variables).sort(), r.name);
    for (const v of Object.values(r.variables)) new RegExp(v.pattern);
  }
});

// verifies: REQ-KNB-2, REQ-IFC-2
test("a knowledge piece the tool returns has a resource address", () => {
  const kb = resources.find((r) => r.name === "kb-piece");
  assert.ok(kb);
  const fixtures = validCalls().filter((c) => c.tool === "knowledge_get");
  assert.ok(fixtures.length > 0);
  for (const call of fixtures) {
    const piece = (call.output as { piece: { id: string; version: string } }).piece;
    assert.equal(validate(piece), true);
    assert.match(piece.id, new RegExp(kb.variables.id?.pattern ?? ""));
    assert.match(piece.version, new RegExp(kb.variables.version?.pattern ?? ""));
  }
});

// verifies: REQ-KNB-2, INV-14
test("knowledge_get returns exactly a kb piece and marks it untrusted", () => {
  const tool = loadTools().find((t) => t.name === "knowledge_get");
  assert.ok(tool);
  const piece = (tool.output_schema.properties as Record<string, { $ref?: string }>).piece;
  assert.equal(piece?.$ref, "https://narthex.dev/contracts/mcp/kb-piece.schema.json");
  assert.deepEqual(tool.untrusted_fields, ["/piece"]);
});

// verifies: REQ-IFC-1
test("prompts are intake and spec, each with a project argument", () => {
  assert.deepEqual(
    prompts.map((p) => p.name),
    ["intake", "spec"],
  );
  for (const p of prompts) {
    assert.ok(p.description.trim().split(/\s+/).length <= 60, p.name);
    assert.ok(TOKEN_SCOPES.includes(p.scope), p.name);
    assert.ok(
      p.arguments.some((a) => a.name === "project" && a.required),
      p.name,
    );
  }
});
