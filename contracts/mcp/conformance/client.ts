import { type ChildProcess, spawn } from "node:child_process";
import { createInterface } from "node:readline";

// A minimal MCP client for the conformance suite: JSON-RPC over a stdio command or over Streamable HTTP.
// The target is NARTHEX_TARGET: a URL (http or https) or a shell command that speaks MCP on stdin and stdout.
// Over HTTP, NARTHEX_TOKEN, when set, goes in an Authorization: Bearer header on every request.

export type Rpc = Record<string, any>;

export interface Reply {
  result?: Rpc;
  error?: { code: number; message: string };
}

export interface Client {
  kind: "stdio" | "http";
  url?: string;
  request(method: string, params?: Rpc): Promise<Reply>;
  notify(method: string, params?: Rpc): Promise<void>;
  close(): Promise<void>;
}

export const PROTOCOL_VERSION = "2025-06-18";

export function connect(target: string): Client {
  return /^https?:\/\//.test(target) ? httpClient(target) : stdioClient(target);
}

export async function initialize(client: Client): Promise<Rpc> {
  const reply = await client.request("initialize", {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: "narthex-conformance", version: "0.1.0" },
  });
  if (!reply.result) throw new Error(`initialize failed: ${JSON.stringify(reply.error)}`);
  await client.notify("notifications/initialized");
  return reply.result;
}

function stdioClient(command: string): Client {
  const child: ChildProcess = spawn(command, { shell: true, stdio: ["pipe", "pipe", "inherit"] });
  const pending = new Map<number, (reply: Reply) => void>();
  let next = 1;
  const lines = createInterface({ input: child.stdout as NodeJS.ReadableStream });
  lines.on("line", (line) => {
    if (!line.trim()) return;
    const message = JSON.parse(line) as Rpc;
    if (message.id !== undefined) pending.get(message.id)?.(message as Reply);
  });
  const send = (message: Rpc) => child.stdin?.write(`${JSON.stringify(message)}\n`);
  return {
    kind: "stdio",
    request(method, params) {
      const id = next++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 10_000);
        pending.set(id, (reply) => {
          clearTimeout(timer);
          resolve(reply);
        });
        send({ jsonrpc: "2.0", id, method, params });
      });
    },
    async notify(method, params) {
      send({ jsonrpc: "2.0", method, params });
    },
    close() {
      return new Promise((resolve) => {
        child.once("exit", () => resolve());
        child.stdin?.end();
        setTimeout(() => child.kill(), 2_000).unref();
      });
    },
  };
}

function httpClient(url: string): Client {
  let session: string | undefined;
  let version: string | undefined;
  let next = 1;
  const post = async (body: Rpc): Promise<Response> => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    };
    if (session) headers["mcp-session-id"] = session;
    if (version) headers["mcp-protocol-version"] = version;
    if (process.env.NARTHEX_TOKEN) headers.authorization = `Bearer ${process.env.NARTHEX_TOKEN}`;
    return fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  };
  return {
    kind: "http",
    url,
    async request(method, params) {
      const id = next++;
      const response = await post({ jsonrpc: "2.0", id, method, params });
      session = response.headers.get("mcp-session-id") ?? session;
      const text = await response.text();
      if (!response.ok) throw new Error(`${method}: HTTP ${response.status} ${text.slice(0, 200)}`);
      const type = response.headers.get("content-type") ?? "";
      const messages: Rpc[] = type.includes("text/event-stream")
        ? text
            .split(/\n\n+/)
            .flatMap((block) => block.split("\n").filter((l) => l.startsWith("data:")))
            .map((l) => JSON.parse(l.slice(5)) as Rpc)
        : [JSON.parse(text) as Rpc];
      const reply = messages.find((m) => m.id === id);
      if (!reply) throw new Error(`${method}: no reply with id ${id}`);
      if (method === "initialize" && reply.result) version = reply.result.protocolVersion;
      return reply as Reply;
    },
    async notify(method, params) {
      const response = await post({ jsonrpc: "2.0", method, params });
      await response.text();
      if (response.status !== 202 && !response.ok)
        throw new Error(`${method}: HTTP ${response.status}`);
    },
    async close() {},
  };
}
