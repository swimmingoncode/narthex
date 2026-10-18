import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import {
  CALLS,
  type InvalidCall,
  incrementalReadProblems,
  jsonFiles,
  loadTools,
  nameOf,
  newAjv,
  readJson,
  TOKEN_SCOPES,
  type Tool,
  validatorFor,
  validCalls,
} from "./helpers.ts";

const tools = loadTools();
const M1 = ["amendment_propose", "queue_update", "spec_trace", "task_token"];

type Node = Record<string, unknown>;

// Follows a pointer such as /pieces/*/title through properties and array items. Returns the node, or undefined.
function resolvePointer(schema: Node, pointer: string): Node | undefined {
  let node: Node | undefined = schema;
  for (const part of pointer.split("/").slice(1)) {
    if (!node) return undefined;
    if (part === "*") node = node.items as Node | undefined;
    else node = (node.properties as Record<string, Node> | undefined)?.[part];
  }
  return node;
}

// Calls visit(node, path) for each node of an output schema, with * for array items. Stops at a node
// that visit returns false for. A $ref is a leaf: it points into another contract.
function walk(node: Node, path: string, visit: (node: Node, path: string) => boolean): void {
  if (!visit(node, path)) return;
  for (const [key, child] of Object.entries((node.properties ?? {}) as Record<string, Node>)) {
    walk(child, `${path}/${key}`, visit);
  }
  if (node.items) walk(node.items as Node, `${path}/*`, visit);
}

function covered(tool: Tool, path: string): boolean {
  return tool.untrusted_fields.some((p) => path === p || path.startsWith(`${p}/`));
}

// verifies: REQ-IFC-1, NFR-8
test("contract lists exactly fourteen tools", () => {
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    "amendment_propose",
    "form_ack",
    "form_publish",
    "form_read",
    "form_wait",
    "items_file",
    "knowledge_get",
    "knowledge_search",
    "link_get",
    "queue_update",
    "spec_get",
    "spec_trace",
    "task_token",
    "verify_run",
  ]);
  const check = validatorFor("tools.schema.json");
  assert.equal(check(readJson(join(import.meta.dirname, "..", "tools.json"))), true);
});

// verifies: REQ-IFC-1
test("ten tools are in phase M0 and four in phase M1", () => {
  assert.equal(tools.filter((t) => t.phase === "M0").length, 10);
  assert.deepEqual(
    tools
      .filter((t) => t.phase === "M1")
      .map((t) => t.name)
      .sort(),
    M1,
  );
});

// verifies: NFR-8
test("every description is sixty words or less", () => {
  for (const t of tools) {
    const words = t.description.trim().split(/\s+/).length;
    assert.ok(words <= 60, `${t.name} has ${words} words`);
  }
});

// verifies: REQ-IFC-9
test("every scope exists in the token contract", () => {
  for (const t of tools) assert.ok(TOKEN_SCOPES.includes(t.scope), `${t.name}: ${t.scope}`);
});

// verifies: INV-4
test("no tool writes an answer", () => {
  const forbidden = ["answer", "answers", "choice", "notes", "response", "responses"];
  for (const t of tools) {
    assert.notEqual(t.effect, "write_answer", t.name);
    const props = Object.keys((t.input_schema.properties ?? {}) as object);
    for (const name of props) assert.ok(!forbidden.includes(name), `${t.name} takes ${name}`);
  }
});

// verifies: NFR-8
test("every tool keeps to the byte budgets and bounds its output", () => {
  for (const t of tools) {
    assert.ok(t.budget.typical_bytes <= 2048 && t.budget.max_bytes <= 16384, t.name);
    assert.ok(t.budget.typical_bytes < t.budget.max_bytes, t.name);
    walk(t.output_schema, "", (node, path) => {
      if (node.type === "array") assert.ok(node.maxItems, `${t.name}${path} has no maxItems`);
      if (node.type === "string") {
        const bounded =
          node.maxLength !== undefined ||
          node.enum !== undefined ||
          node.const !== undefined ||
          /\{\d+,\d+\}/.test(String(node.pattern ?? ""));
        assert.ok(bounded, `${t.name}${path} has no length bound`);
      }
      return true;
    });
  }
});

// verifies: INV-14, NFR-8
test("repository text in outputs sits in fields marked untrusted", () => {
  for (const t of tools) {
    for (const pointer of t.untrusted_fields) {
      assert.ok(
        resolvePointer(t.output_schema, pointer),
        `${t.name}: ${pointer} is not in the output`,
      );
    }
    walk(t.output_schema, "", (node, path) => {
      if (path === "" || covered(t, path)) return false;
      if (node.$ref)
        assert.fail(`${t.name}${path} refers to another contract and is not marked untrusted`);
      if (node.type === "string") {
        const fixed =
          node.enum !== undefined || node.const !== undefined || node.pattern !== undefined;
        assert.ok(fixed, `${t.name}${path} is free text and is not marked untrusted`);
      }
      return true;
    });
  }
  const byName = new Map(tools.map((t) => [t.name, t]));
  for (const name of ["knowledge_get", "spec_get", "form_read", "form_wait", "verify_run"]) {
    assert.ok(byName.get(name)?.untrusted_fields.length, `${name} marks nothing`);
  }
});

// verifies: REQ-IFC-1
test("input and output schemas compile and the call fixtures agree with them", () => {
  const ajv = newAjv();
  const byName = new Map(tools.map((t) => [t.name, t]));
  const seen = new Set<string>();
  for (const call of validCalls()) {
    const tool = byName.get(call.tool);
    assert.ok(tool, `fixture for unknown tool ${call.tool}`);
    seen.add(call.tool);
    const input = ajv.compile(tool.input_schema);
    assert.equal(input(call.input), true, `${call.tool} input: ${JSON.stringify(input.errors)}`);
    const output = ajv.compile(tool.output_schema);
    assert.equal(
      output(call.output),
      true,
      `${call.tool} output: ${JSON.stringify(output.errors)}`,
    );
  }
  assert.deepEqual([...seen].sort(), tools.map((t) => t.name).sort());
});

// verifies: REQ-IFC-6, REQ-DEC-24, R8
test("form reads return only events after since, and a pending wait has none", () => {
  const reads = validCalls().filter((c) => c.tool === "form_read" || c.tool === "form_wait");
  assert.ok(reads.some((c) => c.tool === "form_read"));
  assert.ok(reads.some((c) => (c.output as { status?: string }).status === "pending"));
  for (const call of reads) {
    const since = (call.input as { since: number }).since;
    const problems = incrementalReadProblems(
      since,
      call.output as Parameters<typeof incrementalReadProblems>[1],
    );
    assert.deepEqual(problems, [], `${call.tool} since ${since}`);
  }
  const bad = incrementalReadProblems(5, {
    status: "pending",
    cursor: 5,
    events: [{ cursor: 5 }, { cursor: 7 }],
  });
  assert.equal(bad.length, 3);
});

// verifies: REQ-IFC-1, REQ-IFC-9, REQ-DEC-24
test("invalid call fixtures fail with the expected error", () => {
  const ajv = newAjv();
  const byName = new Map(tools.map((t) => [t.name, t]));
  const expected = readJson(join(CALLS, "expected-errors.json")) as Record<
    string,
    { keyword: string; instancePath: string }
  >;
  const files = jsonFiles(join(CALLS, "invalid"));
  assert.equal(files.length, Object.keys(expected).length);
  for (const file of files) {
    const name = `invalid/${nameOf(file)}`;
    const want = expected[name];
    assert.ok(want, `${name} has no expected error`);
    const call = readJson(file) as InvalidCall;
    const tool = byName.get(call.tool);
    assert.ok(tool, name);
    const validate = ajv.compile(call.side === "input" ? tool.input_schema : tool.output_schema);
    assert.equal(validate(call.value), false, `${name} should fail`);
    const found = (validate.errors ?? []).some(
      (e) => e.keyword === want.keyword && e.instancePath === want.instancePath,
    );
    assert.ok(
      found,
      `${name}: wanted ${JSON.stringify(want)}, got ${JSON.stringify(validate.errors)}`,
    );
  }
});
