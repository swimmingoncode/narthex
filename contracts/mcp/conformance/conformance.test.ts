// The conformance suite of the MCP contract. Point it at any server with NARTHEX_TARGET: a URL for
// Streamable HTTP, or a command for stdio. NARTHEX_PHASE=M0 expects the ten M0 tools instead of all fourteen.
// NARTHEX_CALLS=0 skips the calls that need seeded data (a server with its own state cannot answer the fixtures).
import assert from "node:assert/strict";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import {
  CALLS,
  type CallFixture,
  type InvalidCall,
  jsonFiles,
  loadTools,
  newAjv,
  readJson,
  validCalls,
} from "../tests/helpers.ts";
import { type Client, connect, initialize, type Rpc } from "./client.ts";

const target = process.env.NARTHEX_TARGET;
const phase = process.env.NARTHEX_PHASE === "M0" ? "M0" : "M1";
const withCalls = process.env.NARTHEX_CALLS !== "0";

const contract = loadTools().filter((t) => phase === "M1" || t.phase === "M0");
const ajv = newAjv();
const resources = (
  readJson(join(import.meta.dirname, "..", "resources.json")) as {
    resources: { uri_template: string; name: string }[];
  }
).resources;

describe("MCP server conformance", { concurrency: false }, () => {
  let client: Client;
  let init: Rpc;
  let listed: Rpc[];

  before(async () => {
    assert.ok(target, "set NARTHEX_TARGET to a URL or a stdio command");
    client = connect(target);
    init = await initialize(client);
    const reply = await client.request("tools/list");
    listed = reply.result?.tools ?? [];
  });
  after(async () => {
    await client?.close();
  });

  // verifies: REQ-IFC-1, ADR-0002
  test("server advertises tools, resources and prompts", () => {
    for (const capability of ["tools", "resources", "prompts"]) {
      assert.ok(init.capabilities?.[capability], `no ${capability} capability`);
    }
  });

  // verifies: REQ-IFC-1, REQ-IFC-7
  test("server lists exactly the tools of the contract", () => {
    const names = listed.map((t) => t.name).sort();
    assert.deepEqual(names, contract.map((t) => t.name).sort());
  });

  // verifies: REQ-IFC-1, NFR-8
  test("every listed tool carries the contract's description and schemas", () => {
    for (const want of contract) {
      const got = listed.find((t) => t.name === want.name);
      assert.ok(got, want.name);
      assert.equal(got.description, want.description, `${want.name} description`);
      assert.deepEqual(got.inputSchema, want.input_schema, `${want.name} inputSchema`);
      assert.deepEqual(got.outputSchema, want.output_schema, `${want.name} outputSchema`);
    }
  });

  // verifies: REQ-IFC-1, NFR-8
  test("valid calls return structured content that fits the schema and the budget", async (t) => {
    if (!withCalls) return t.skip("NARTHEX_CALLS=0");
    const byName = new Map(contract.map((tool) => [tool.name, tool]));
    for (const fixture of validCalls() as CallFixture[]) {
      const tool = byName.get(fixture.tool);
      if (!tool) continue;
      const reply = await client.request("tools/call", {
        name: fixture.tool,
        arguments: fixture.input,
      });
      assert.ok(reply.result, `${fixture.tool}: ${JSON.stringify(reply.error)}`);
      assert.notEqual(reply.result.isError, true, `${fixture.tool} returned an error`);
      const content = reply.result.structuredContent;
      const validate = ajv.compile(tool.output_schema);
      assert.equal(validate(content), true, `${fixture.tool}: ${JSON.stringify(validate.errors)}`);
      const bytes = Buffer.byteLength(JSON.stringify(content));
      assert.ok(bytes <= tool.budget.max_bytes, `${fixture.tool} returned ${bytes} bytes`);
      const summary = reply.result.content?.find((c: Rpc) => c.type === "text")?.text;
      assert.ok(
        typeof summary === "string" && summary.length > 0 && summary.length <= 300,
        `${fixture.tool} summary`,
      );
    }
  });

  // verifies: REQ-IFC-1, REQ-IFC-9
  test("calls with invalid input are refused", async () => {
    const byName = new Map(contract.map((tool) => [tool.name, tool]));
    for (const file of jsonFiles(join(CALLS, "invalid"))) {
      const fixture = readJson(file) as InvalidCall;
      if (fixture.side !== "input" || !byName.has(fixture.tool)) continue;
      const reply = await client.request("tools/call", {
        name: fixture.tool,
        arguments: fixture.value,
      });
      const refused = reply.error !== undefined || reply.result?.isError === true;
      assert.ok(refused, `${file} was accepted`);
    }
  });

  // verifies: REQ-IFC-1
  test("a call to an unknown tool is an error", async () => {
    const reply = await client.request("tools/call", { name: "answer_item", arguments: {} });
    assert.ok(reply.error !== undefined || reply.result?.isError === true);
  });

  // verifies: REQ-KNB-2, REQ-IFC-1
  test("resource templates are the knowledge piece and the profile", async () => {
    const reply = await client.request("resources/templates/list");
    const got = (reply.result?.resourceTemplates ?? []).map((r: Rpc) => r.uriTemplate).sort();
    assert.deepEqual(got, resources.map((r) => r.uri_template).sort());
  });

  // verifies: REQ-KNB-2, REQ-IFC-2
  test("a knowledge piece reads as a resource and matches its tool", async (t) => {
    if (!withCalls) return t.skip("NARTHEX_CALLS=0");
    const fixture = validCalls().find((c) => c.tool === "knowledge_get");
    assert.ok(fixture);
    const piece = (fixture.output as { piece: { id: string; version: string } }).piece;
    const uri = `narthex://kb/${piece.id}@${piece.version}`;
    const reply = await client.request("resources/read", { uri });
    assert.ok(reply.result, JSON.stringify(reply.error));
    const body = JSON.parse(reply.result.contents[0].text);
    const validate = ajv.getSchema("https://narthex.dev/contracts/mcp/kb-piece.schema.json");
    assert.ok(validate);
    assert.equal(validate(body), true, JSON.stringify(validate.errors));
  });

  // verifies: REQ-IFC-1
  test("prompts include intake and spec", async () => {
    const reply = await client.request("prompts/list");
    const names = (reply.result?.prompts ?? []).map((p: Rpc) => p.name);
    assert.ok(names.includes("intake") && names.includes("spec"), JSON.stringify(names));
  });

  // verifies: REQ-IFC-1, ADR-0002
  test("http server refuses a foreign origin", async (t) => {
    if (client.kind !== "http" || !client.url) return t.skip("stdio target");
    const response = await fetch(client.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        origin: "https://evil.example",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    assert.equal(response.status, 403);
  });
});
