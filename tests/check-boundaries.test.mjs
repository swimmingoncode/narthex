import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { checkBoundaries } from "../scripts/check-boundaries.mjs";
import { makeTree, workspace } from "./helpers.mjs";

const base = {
  "packages/core/package.json": workspace("core"),
  "packages/verify/package.json": workspace("verify"),
  "apps/server/package.json": workspace("server"),
  "packages/core/src/index.ts": "export const x = 1;\n",
};

// verifies: ADR-0011
test("core imports nothing of ours", () => {
  const root = makeTree({
    ...base,
    "packages/core/src/bad.ts": 'import { v } from "@narthex/verify";\nexport const y = v;\n',
  });
  const findings = checkBoundaries(root);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "core-imports-nothing");
});

// verifies: ADR-0011
test("core reaching into contracts by a relative path is reported", () => {
  const root = makeTree({
    ...base,
    "contracts/a.json": "{}",
    "packages/core/src/bad.ts": 'import a from "../../../contracts/a.json";\nexport default a;\n',
  });
  assert.equal(checkBoundaries(root)[0]?.rule, "no-reaching-out");
});

// verifies: ADR-0011
test("nothing imports apps", () => {
  const root = makeTree({
    ...base,
    "packages/verify/src/bad.ts": 'import "@narthex/server";\n',
    "packages/cli/package.json": JSON.stringify({
      name: "@narthex/cli",
      dependencies: { "@narthex/web": "*" },
    }),
  });
  const rules = checkBoundaries(root).map((f) => f.rule);
  assert.deepEqual(rules, ["nothing-imports-apps", "nothing-imports-apps"]);
});

// verifies: ADR-0011
test("verify may import core and the server may import both", () => {
  const root = makeTree({
    ...base,
    "packages/verify/src/ok.ts": 'import { x } from "@narthex/core";\nexport const y = x;\n',
    "apps/server/src/ok.ts":
      'import { x } from "@narthex/core";\nimport "@narthex/verify";\nexport const z = x;\n',
  });
  assert.deepEqual(checkBoundaries(root), []);
});

// verifies: ADR-0011
test("the repository itself passes the boundary check", () => {
  const out = execFileSync("node", ["scripts/check-boundaries.mjs"], { encoding: "utf8" });
  assert.match(out, /boundaries ok/);
});
