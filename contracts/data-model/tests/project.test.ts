import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import {
  CONTRACT,
  invalidFixtureProblems,
  jsonFiles,
  ROOT,
  readJson,
  validatorFor,
} from "./helpers.ts";

const validate = validatorFor("project.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "project");

// verifies: REQ-DAT-1
test("this repo's project file passes", () => {
  const project = readJson(join(ROOT, ".narthex", "project.json")) as {
    documents: Record<string, string>;
  };
  assert.equal(validate(project), true, JSON.stringify(validate.errors));
  assert.equal(project.documents.architecture, "docs/architecture/SAD.md");
  assert.equal(project.documents.adr, "docs/architecture/adr/");
});

// verifies: REQ-DAT-1
test("valid project fixtures pass", () => {
  const files = jsonFiles(join(FIXTURES, "valid"));
  assert.ok(files.length >= 2);
  for (const file of files) {
    assert.equal(validate(readJson(file)), true, `${file}: ${JSON.stringify(validate.errors)}`);
  }
});

// verifies: REQ-DAT-1
test("invalid project fixtures fail with the expected error", () => {
  assert.deepEqual(invalidFixtureProblems(validate, FIXTURES), []);
});
