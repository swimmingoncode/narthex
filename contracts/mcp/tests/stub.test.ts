import assert from "node:assert/strict";
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { CONTRACT } from "./helpers.ts";

const SUITE = join(CONTRACT, "conformance", "conformance.test.ts");
const STUB = join(CONTRACT, "stub", "server.ts");

// A child `node --test` inside a test run must not see the parent's runner context, or it skips its files.
function envFor(target: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, NARTHEX_TARGET: target };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

function conformance(target: string) {
  const run = spawnSync(process.execPath, ["--test", SUITE], {
    encoding: "utf8",
    env: envFor(target),
  });
  return { code: run.status, out: `${run.stdout}${run.stderr}` };
}

// A suite that skips everything would pass; count the passes too.
function passes(out: string): number {
  return Number(/^(?:#|ℹ) pass (\d+)/m.exec(out)?.[1] ?? 0);
}

// verifies: REQ-IFC-1, ADR-0002
test("the stub passes conformance over stdio", () => {
  const run = conformance(`${process.execPath} ${STUB} --stdio`);
  assert.equal(run.code, 0, run.out.slice(-3000));
  assert.ok(passes(run.out) >= 9, run.out.slice(-1000));
});

// verifies: REQ-IFC-1, ADR-0002
test("the stub passes conformance over streamable http", async () => {
  const stub: ChildProcess = spawn(process.execPath, [STUB, "--http"], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  try {
    const url = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("stub did not start")), 10_000);
      stub.stdout?.on("data", (chunk: Buffer) => {
        const match = /listening (http:\/\/\S+)/.exec(String(chunk));
        if (match?.[1]) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
    });
    const run = await new Promise<{ code: number | null; out: string }>((resolve) => {
      const child = spawn(process.execPath, ["--test", SUITE], {
        env: envFor(url),
      });
      let out = "";
      child.stdout.on("data", (c) => {
        out += c;
      });
      child.stderr.on("data", (c) => {
        out += c;
      });
      child.on("exit", (code) => resolve({ code, out }));
    });
    assert.equal(run.code, 0, run.out.slice(-3000));
    assert.ok(passes(run.out) >= 10, run.out.slice(-1000));
  } finally {
    stub.kill();
  }
});

// verifies: REQ-IFC-1
test("the conformance suite fails a server that lists a tool the contract lacks", () => {
  const run = conformance(
    `${process.execPath} -e "process.stdin.on('data',d=>{for(const l of String(d).split('\\n')){if(!l)continue;const m=JSON.parse(l);if(m.id===undefined)continue;const r=m.method==='initialize'?{protocolVersion:'2025-06-18',capabilities:{tools:{},resources:{},prompts:{}},serverInfo:{name:'x',version:'0'}}:m.method==='tools/list'?{tools:[{name:'answer_item',description:'x',inputSchema:{type:'object'}}]}:{};console.log(JSON.stringify({jsonrpc:'2.0',id:m.id,result:r}))}})"`,
  );
  assert.notEqual(run.code, 0);
});
