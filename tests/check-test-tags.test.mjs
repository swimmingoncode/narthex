import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";
import { checkTestTags } from "../scripts/check-test-tags.mjs";
import { makeTree } from "./helpers.mjs";

const spec = "| `REQ-SKL-30` | x |\n| `INV-8` | y |\n";

// verifies: REQ-SKL-30
test("test without a verifies comment is reported", () => {
  const root = makeTree({
    "SPEC.md": spec,
    "a/x.test.mjs": 'import test from "node:test";\ntest("does a thing", () => {});\n',
  });
  const findings = checkTestTags(root);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].problem, "no verifies comment");
  assert.equal(findings[0].name, "does a thing");
});

// verifies: REQ-SKL-30
test("verifies comment with an unknown id is reported", () => {
  const root = makeTree({
    "SPEC.md": spec,
    "a/x.test.ts": '// verifies: REQ-SKL-30, REQ-SKL-999\ntest("does a thing", () => {});\n',
  });
  const findings = checkTestTags(root);
  assert.deepEqual(
    findings.map((f) => f.problem),
    ["unknown id REQ-SKL-999"],
  );
});

// verifies: REQ-SKL-30
test("verifies comment with known ids passes", () => {
  const root = makeTree({
    "SPEC.md": spec,
    "a/x.test.mjs": '// verifies: REQ-SKL-30, INV-8\ntest("does a thing", () => {});\n',
  });
  assert.deepEqual(checkTestTags(root), []);
});

// verifies: REQ-SKL-30
test("python tests read a hash comment above or inside the def", () => {
  const root = makeTree({
    "SPEC.md": spec,
    "t/test_a.py":
      "class T:\n    # verifies: INV-8\n    def test_above(self):\n        pass\n\n" +
      "    def test_inside(self):\n        # verifies: REQ-SKL-30\n        pass\n\n" +
      "    def test_bare(self):\n        pass\n",
  });
  const findings = checkTestTags(root);
  assert.deepEqual(
    findings.map((f) => f.name),
    ["test_bare"],
  );
});

// verifies: REQ-SKL-30
test("report mode exits zero and strict mode exits non-zero", () => {
  const root = makeTree({ "SPEC.md": spec, "a/x.test.mjs": 'test("bare", () => {});\n' });
  const run = (...args) =>
    spawnSync("node", ["scripts/check-test-tags.mjs", ...args, root], { encoding: "utf8" });
  assert.equal(run("--report").status, 0);
  assert.equal(run().status, 1);
});

// verifies: REQ-SKL-30
test("the repository's own tests are all tagged", () => {
  const out = execFileSync("node", ["scripts/check-test-tags.mjs", "--report", "."], {
    encoding: "utf8",
  });
  assert.doesNotMatch(out, /^tests\//m);
});
