import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import {
  CONTRACT,
  type Endpoint,
  jsonFiles,
  loadEndpoints,
  nameOf,
  newAjv,
  readJson,
  TOKEN_PURPOSES,
  TOKEN_SCOPES,
  validatorFor,
} from "./helpers.ts";

const endpoints = loadEndpoints();
const FIXTURES = join(CONTRACT, "fixtures", "endpoints");
const byName = new Map(endpoints.map((e) => [e.name, e]));

const SECRET_NAMES = /token|secret|key|auth|session|password|sig/i;

// verifies: REQ-IFC-9, REQ-IFC-10
test("endpoints.json has the shape its schema describes", () => {
  const check = validatorFor("endpoints.schema.json");
  assert.equal(
    check(readJson(join(CONTRACT, "endpoints.json"))),
    true,
    JSON.stringify(check.errors),
  );
  assert.deepEqual(endpoints.map((e) => e.name).sort(), [
    "answer_submit",
    "event_stream",
    "link_exchange",
    "link_request",
    "snapshot_get",
  ]);
});

// verifies: REQ-IFC-9, REQ-IFC-10
test("every endpoint names its token purpose", () => {
  for (const e of endpoints) {
    assert.ok(e.token_purpose.length > 0, e.name);
    for (const p of e.token_purpose) assert.ok(TOKEN_PURPOSES.includes(p), `${e.name}: ${p}`);
    if (e.token_purpose.includes("mcp_access")) {
      assert.ok(e.scope && TOKEN_SCOPES.includes(e.scope), `${e.name} names no MCP scope`);
    } else {
      assert.equal(e.scope, undefined, `${e.name} has a scope but takes no MCP token`);
    }
  }
});

// verifies: REQ-IFC-9
test("no endpoint takes a token in the query string", () => {
  for (const e of endpoints) {
    assert.notEqual(e.token_in, "query", e.name);
    assert.ok(!e.path.includes("?"), `${e.name}: query in the path`);
    assert.ok(
      !/\{(?!form\})[^}]*\}/.test(e.path),
      `${e.name}: ${e.path} has a path variable but form`,
    );
    for (const q of e.query ?? [])
      assert.doesNotMatch(q.name, SECRET_NAMES, `${e.name}: ${q.name}`);
  }
});

// verifies: REQ-IFC-10, INV-17
test("only an answer link can submit an answer", () => {
  assert.deepEqual(byName.get("answer_submit")?.token_purpose, ["answer_link"]);
  const takers = endpoints
    .filter((e) => e.token_purpose.includes("answer_link"))
    .map((e) => e.name);
  assert.deepEqual(takers.sort(), ["answer_submit", "link_exchange"]);
});

// verifies: REQ-IFC-6, REQ-DEC-24
test("the event stream starts after a cursor and carries change-feed events", () => {
  const stream = byName.get("event_stream") as Endpoint;
  assert.deepEqual(stream.query, [
    { name: "since", required: true, description: "The last cursor the agent has seen." },
  ]);
  assert.equal(stream.response.content_type, "text/event-stream");
});

// verifies: REQ-IFC-9, REQ-IFC-10
test("endpoint fixtures pass and invalid ones fail with the expected error", () => {
  const ajv = newAjv();
  const seen = new Set<string>();
  for (const file of jsonFiles(join(FIXTURES, "valid"))) {
    const fx = readJson(file) as { endpoint: string; request?: unknown; response?: unknown };
    const e = byName.get(fx.endpoint);
    assert.ok(e, nameOf(file));
    seen.add(fx.endpoint);
    if (e.request_schema) {
      const v = ajv.compile(e.request_schema);
      assert.equal(v(fx.request), true, `${nameOf(file)} request: ${JSON.stringify(v.errors)}`);
    } else assert.equal(fx.request, undefined, nameOf(file));
    const v = ajv.compile(e.response.schema);
    assert.equal(v(fx.response), true, `${nameOf(file)} response: ${JSON.stringify(v.errors)}`);
  }
  assert.deepEqual([...seen].sort(), [...byName.keys()].sort());

  const expected = readJson(join(FIXTURES, "expected-errors.json")) as Record<
    string,
    { keyword: string; instancePath: string }
  >;
  const files = jsonFiles(join(FIXTURES, "invalid"));
  assert.equal(files.length, Object.keys(expected).length);
  for (const file of files) {
    const name = `invalid/${nameOf(file)}`;
    const want = expected[name];
    assert.ok(want, `${name} has no expected error`);
    const fx = readJson(file) as { endpoint: string; side: "request" | "response"; value: unknown };
    const e = byName.get(fx.endpoint);
    const schema = fx.side === "request" ? e?.request_schema : e?.response.schema;
    assert.ok(schema, name);
    const v = ajv.compile(schema);
    assert.equal(v(fx.value), false, `${name} should fail`);
    assert.ok(
      (v.errors ?? []).some(
        (x) => x.keyword === want.keyword && x.instancePath === want.instancePath,
      ),
      `${name}: wanted ${JSON.stringify(want)}, got ${JSON.stringify(v.errors)}`,
    );
  }
});
