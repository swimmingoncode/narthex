import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const expected = [
  "apps/server",
  "apps/web",
  "packages/core",
  "packages/verify",
  "packages/cli",
  "packages/form-adapter",
];

// verifies: ADR-0011
test("workspace has the layout of ADR-0011", () => {
  const root = JSON.parse(readFileSync("package.json", "utf8"));
  assert.deepEqual(root.workspaces, ["apps/*", "packages/*"]);
  for (const dir of expected) {
    assert.ok(existsSync(`${dir}/package.json`), `${dir} has a package.json`);
    assert.ok(existsSync(`${dir}/tsconfig.json`), `${dir} has a tsconfig.json`);
  }
});

// verifies: ADR-0011, DEC-1
test("workspace typechecks", () => {
  execFileSync("npm", ["run", "typecheck"], { encoding: "utf8", stdio: "pipe" });
});
