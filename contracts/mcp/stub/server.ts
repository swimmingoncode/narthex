// A stub MCP server that answers from the contract's fixtures, so consumers can build before the server exists.
//   node contracts/mcp/stub/server.ts --stdio
//   node contracts/mcp/stub/server.ts --http [--port N]     (0 or no port: any free port, printed on start)
// It lists the 14 tools of tools.json, returns the output of the valid call fixture whose input matches (or the
// tool's first fixture), refuses input that breaks the tool's schema, and serves the resources and prompts.
import { createServer } from "node:http";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { isDeepStrictEqual } from "node:util";
import {
  type CallFixture,
  CONTRACT,
  loadTools,
  newAjv,
  readJson,
  validCalls,
} from "../tests/helpers.ts";

type Rpc = Record<string, any>;

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26"];
const tools = loadTools();
const fixtures = validCalls();
const ajv = newAjv();
const resources = (readJson(join(CONTRACT, "resources.json")) as { resources: Rpc[] }).resources;
const prompts = (readJson(join(CONTRACT, "prompts.json")) as { prompts: Rpc[] }).prompts;
const inputChecks = new Map(tools.map((t) => [t.name, ajv.compile(t.input_schema)]));

function fixtureFor(name: string, input: unknown): CallFixture | undefined {
  const own = fixtures.filter((f) => f.tool === name);
  return own.find((f) => isDeepStrictEqual(f.input, input)) ?? own[0];
}

function callTool(params: Rpc): Rpc {
  const tool = tools.find((t) => t.name === params.name);
  if (!tool) throw rpcError(-32602, `unknown tool ${params.name}`);
  const check = inputChecks.get(tool.name);
  if (check && !check(params.arguments ?? {})) {
    const text = `invalid input: ${ajv.errorsText(check.errors)}`;
    return { isError: true, content: [{ type: "text", text: text.slice(0, 300) }] };
  }
  const fixture = fixtureFor(tool.name, params.arguments);
  if (!fixture)
    return { isError: true, content: [{ type: "text", text: `no fixture for ${tool.name}` }] };
  return {
    content: [{ type: "text", text: `${tool.name}: stub answer from a fixture` }],
    structuredContent: fixture.output,
  };
}

function readResource(uri: string): Rpc {
  const match = /^narthex:\/\/kb\/([^@]+)@(.+)$/.exec(uri);
  if (match) {
    for (const f of fixtures.filter((x) => x.tool === "knowledge_get")) {
      const piece = (f.output as { piece: { id: string; version: string } }).piece;
      if (piece.id === match[1] && piece.version === match[2]) {
        return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(piece) }] };
      }
    }
  }
  throw rpcError(-32002, `resource not found: ${uri}`);
}

function rpcError(code: number, message: string) {
  return Object.assign(new Error(message), { code });
}

function handle(method: string, params: Rpc): Rpc {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: PROTOCOL_VERSIONS.includes(params.protocolVersion)
          ? params.protocolVersion
          : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: "narthex-stub", version: "0.1.0" },
      };
    case "ping":
      return {};
    case "tools/list":
      return {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.input_schema,
          outputSchema: t.output_schema,
        })),
      };
    case "tools/call":
      return callTool(params);
    case "resources/list":
      return { resources: [] };
    case "resources/templates/list":
      return {
        resourceTemplates: resources.map((r) => ({
          uriTemplate: r.uri_template,
          name: r.name,
          description: r.description,
          mimeType: r.mime_type,
        })),
      };
    case "resources/read":
      return readResource(String(params.uri));
    case "prompts/list":
      return {
        prompts: prompts.map((p) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
        })),
      };
    case "prompts/get": {
      const prompt = prompts.find((p) => p.name === params.name);
      if (!prompt) throw rpcError(-32602, `unknown prompt ${params.name}`);
      const text = `Run the ${prompt.step} step for ${params.arguments?.project ?? "the project"}.`;
      return {
        description: prompt.description,
        messages: [{ role: "user", content: { type: "text", text } }],
      };
    }
    default:
      throw rpcError(-32601, `method not found: ${method}`);
  }
}

// One JSON-RPC message in, one reply out (undefined for a notification).
function respond(message: Rpc): Rpc | undefined {
  if (message.id === undefined || message.id === null) return undefined;
  try {
    return { jsonrpc: "2.0", id: message.id, result: handle(message.method, message.params ?? {}) };
  } catch (error) {
    const e = error as { code?: number; message: string };
    return {
      jsonrpc: "2.0",
      id: message.id,
      error: { code: e.code ?? -32603, message: e.message },
    };
  }
}

function serveStdio() {
  const lines = createInterface({ input: process.stdin });
  lines.on("line", (line) => {
    if (!line.trim()) return;
    const reply = respond(JSON.parse(line) as Rpc);
    if (reply) process.stdout.write(`${JSON.stringify(reply)}\n`);
  });
}

// ADR-0002: validate the Origin header and bind to localhost.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function serveHttp(port: number) {
  const server = createServer((request, response) => {
    const origin = request.headers.origin;
    if (origin !== undefined && !LOCAL_ORIGIN.test(origin)) {
      response.writeHead(403).end("forbidden origin");
      return;
    }
    if (request.method !== "POST" || request.url !== "/mcp") {
      response.writeHead(405, { allow: "POST" }).end();
      return;
    }
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      let message: Rpc;
      try {
        message = JSON.parse(Buffer.concat(chunks).toString("utf8")) as Rpc;
      } catch {
        response.writeHead(400).end("not JSON");
        return;
      }
      const reply = respond(message);
      if (!reply) {
        response.writeHead(202).end();
        return;
      }
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (message.method === "initialize") headers["mcp-session-id"] = crypto.randomUUID();
      response.writeHead(200, headers).end(JSON.stringify(reply));
    });
  });
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const bound = typeof address === "object" && address ? address.port : port;
    process.stdout.write(`listening http://127.0.0.1:${bound}/mcp\n`);
  });
}

const args = process.argv.slice(2);
if (args.includes("--stdio")) serveStdio();
else if (args.includes("--http")) serveHttp(Number(args[args.indexOf("--port") + 1] ?? 0) || 0);
else {
  process.stderr.write("usage: server.ts --stdio | --http [--port N]\n");
  process.exit(2);
}
