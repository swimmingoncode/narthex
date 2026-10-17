import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { checkContracts } from "../scripts/check-contracts.mjs";

const side = (files) => (path) => files[path] ?? null;
const changelog = (body) => `# Changelog\n\n${body}`;

// verifies: REQ-DAT-8, REQ-VER-1, DEC-14
test("contract change without a version bump fails", () => {
  const errors = checkContracts({
    changed: ["contracts/mcp/tools.json"],
    readBase: side({ "contracts/mcp/VERSION": "0.1.0\n" }),
    readHead: side({
      "contracts/mcp/VERSION": "0.1.0\n",
      "contracts/CHANGELOG.md": changelog("## mcp 0.1.0\n\n- first. DEC-14\n"),
    }),
  });
  assert.match(errors[0], /still 0\.1\.0; bump it above 0\.1\.0/);
});

// verifies: DEC-14
test("contract change with a bump but no changelog entry fails", () => {
  const errors = checkContracts({
    changed: ["contracts/mcp/tools.json", "contracts/mcp/VERSION"],
    readBase: side({ "contracts/mcp/VERSION": "0.1.0\n" }),
    readHead: side({ "contracts/mcp/VERSION": "0.2.0\n", "contracts/CHANGELOG.md": changelog("") }),
  });
  assert.deepEqual(errors, ['contracts/CHANGELOG.md has no "## mcp 0.2.0" entry']);
});

// verifies: DEC-14
test("changelog entry that names no decision fails", () => {
  const errors = checkContracts({
    changed: ["contracts/mcp/tools.json", "contracts/mcp/VERSION"],
    readBase: side({ "contracts/mcp/VERSION": "0.1.0\n" }),
    readHead: side({
      "contracts/mcp/VERSION": "0.2.0\n",
      "contracts/CHANGELOG.md": changelog(
        "## mcp 0.2.0\n\n- adds a tool\n\n## mcp 0.1.0\n\n- DEC-14\n",
      ),
    }),
  });
  assert.match(errors[0], /does not name a DEC-\* decision/);
});

// verifies: DEC-14
test("contract change with a bump and a changelog entry naming a decision passes", () => {
  const errors = checkContracts({
    changed: ["contracts/mcp/tools.json", "contracts/mcp/VERSION"],
    readBase: side({ "contracts/mcp/VERSION": "0.1.0\n" }),
    readHead: side({
      "contracts/mcp/VERSION": "0.2.0\n",
      "contracts/CHANGELOG.md": changelog("## mcp 0.2.0\n\n- adds a tool. Decision: DEC-31.\n"),
    }),
  });
  assert.deepEqual(errors, []);
});

// verifies: DEC-14
test("version in contract.json is read when there is no VERSION file", () => {
  const head = side({
    "contracts/tokens/contract.json": JSON.stringify({ version: "0.1.0" }),
    "contracts/CHANGELOG.md": changelog("## tokens 0.1.0\n\n- first. DEC-14\n"),
  });
  const base = side({});
  assert.deepEqual(
    checkContracts({ changed: ["contracts/tokens/contract.json"], readBase: base, readHead: head }),
    [],
  );
  const stale = side({ "contracts/tokens/contract.json": JSON.stringify({ version: "0.1.0" }) });
  const errors = checkContracts({
    changed: ["contracts/tokens/a.json"],
    readBase: stale,
    readHead: head,
  });
  assert.match(errors[0], /still 0\.1\.0/);
});

// verifies: DEC-14
test("a change outside contracts and a changelog-only change need nothing", () => {
  const errors = checkContracts({
    changed: ["contracts/CHANGELOG.md"],
    readBase: side({}),
    readHead: side({}),
  });
  assert.deepEqual(errors, []);
});

// verifies: DEC-14
test("the command passes on this repository when contracts are unchanged", () => {
  const result = spawnSync("node", ["scripts/check-contracts.mjs", "--base", "HEAD"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
});
