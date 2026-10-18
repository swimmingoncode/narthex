import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT, TOKEN_PURPOSES, TOKEN_SCOPES } from "./helpers.ts";

// TOKEN_SCOPES and TOKEN_PURPOSES in helpers.ts are a copy of the token model. They move to contracts/tokens when
// F-005 lands, and this test then compares against that contract instead of the prose.
const read = (...path: string[]) => readFileSync(join(ROOT, ...path), "utf8");

// verifies: REQ-IFC-9, INV-17
test("the MCP scopes in helpers match SAD 11.4", () => {
  const sad = read("docs", "architecture", "SAD.md");
  const section = /### 11\.4 Token model\n([\s\S]*?)\n(?:###|---)/.exec(sad)?.[1];
  assert.ok(section, "SAD has no section 11.4");
  const scopes = [...section.matchAll(/`([a-z]+:[a-z]+)`/g)].map((m) => m[1]);
  assert.deepEqual([...TOKEN_SCOPES].sort(), scopes.sort());
});

// verifies: REQ-IFC-10, INV-17
test("the token purposes in helpers match the ADR-0007 table and the watch key of DEC-7", () => {
  const adr = read("docs", "architecture", "adr", "0007-token-model.md");
  const table = /\| Token \| Allows \| Lifetime \|\n\|[-| ]+\|\n((?:\|.*\n)+)/.exec(adr)?.[1];
  assert.ok(table, "ADR-0007 has no token table");
  const purposes = table
    .trim()
    .split("\n")
    .map((row) => {
      const name = (row.split("|")[1] ?? "").trim().toLowerCase();
      return name.replace(/ token$/, "").replace(/ /g, "_");
    });
  assert.equal(purposes.length, 6);
  const dec7 = read("PLAN.md")
    .split("\n")
    .find((line) => line.startsWith("| `DEC-7` |"));
  assert.ok(dec7?.includes("One more purpose, `watch`"), "DEC-7 does not rule the watch purpose");
  assert.deepEqual([...TOKEN_PURPOSES].sort(), [...purposes, "watch"].sort());
});
