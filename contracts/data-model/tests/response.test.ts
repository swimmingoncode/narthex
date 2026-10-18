import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { CONTRACT, jsonFiles, ROOT, readJson, validatorFor } from "./helpers.ts";

const validate = validatorFor("response.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "response");

// verifies: REQ-DAT-6, INV-3
test("valid response fixtures pass the schema", () => {
  const files = [
    ...jsonFiles(join(FIXTURES, "valid")),
    ...jsonFiles(join(ROOT, "decisions", "responses")),
  ];
  assert.ok(files.length >= 4);
  for (const file of files) {
    assert.equal(validate(readJson(file)), true, `${file}: ${JSON.stringify(validate.errors)}`);
  }
});

// verifies: REQ-DAT-6, INV-3
test("invalid response fixtures fail the schema", () => {
  const files = jsonFiles(join(FIXTURES, "invalid"));
  assert.ok(files.length >= 5);
  for (const file of files) {
    assert.equal(validate(readJson(file)), false, `${file} should fail`);
  }
});
