import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import test from "node:test";
import { uncheckedItems } from "../scripts/check-checklist.mjs";
import { makeTree } from "./helpers.mjs";

const run = (file) =>
  spawnSync("node", ["scripts/check-checklist.mjs", file], { encoding: "utf8" });

// verifies: REQ-SKL-17
test("checklist with an unticked box fails", () => {
  const root = makeTree({ "list.md": "- [x] done\n- [ ] still open\n" });
  const result = run(join(root, "list.md"));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /list\.md:2: unticked: still open/);
});

// verifies: REQ-SKL-17
test("checklist with every box ticked passes", () => {
  const root = makeTree({ "list.md": "- [x] a\n- [X] b\n* plain item\n" });
  assert.equal(run(join(root, "list.md")).status, 0);
});

// verifies: REQ-SKL-17
test("unticked boxes inside a code fence are ignored", () => {
  const text = "- [x] a\n```\n- [ ] example\n```\n1. [ ] numbered\n";
  assert.deepEqual(uncheckedItems(text), [{ line: 5, text: "numbered" }]);
});

// verifies: REQ-SKL-17
test("report mode lists unticked boxes and exits zero", () => {
  const root = makeTree({ "list.md": "- [ ] open\n" });
  const result = spawnSync(
    "node",
    ["scripts/check-checklist.mjs", "--report", join(root, "list.md")],
    {
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /1 unticked/);
});
