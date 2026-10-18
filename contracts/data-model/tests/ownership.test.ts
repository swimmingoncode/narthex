import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { CONTRACT, invalidFixtureProblems, jsonFiles, readJson, validatorFor } from "./helpers.ts";

const validate = validatorFor("ownership.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "ownership");

// verifies: REQ-TEM-2
test("valid ownership fixtures pass", () => {
  const files = jsonFiles(join(FIXTURES, "valid"));
  assert.ok(files.length >= 2);
  for (const file of files) {
    assert.equal(validate(readJson(file)), true, `${file}: ${JSON.stringify(validate.errors)}`);
  }
});

// verifies: REQ-TEM-2
test("ownership pattern without a team fails", () => {
  assert.equal(validate({ rules: [{ pattern: "REQ-VER-*" }] }), false);
  assert.ok(
    validate.errors?.some((e) => e.keyword === "required" && e.params.missingProperty === "team"),
  );
  assert.equal(validate({ rules: [{ pattern: "REQ-VER-*", team: "verification" }] }), true);
});

// verifies: REQ-TEM-2
test("invalid ownership fixtures fail with the expected error", () => {
  assert.deepEqual(invalidFixtureProblems(validate, FIXTURES), []);
});
