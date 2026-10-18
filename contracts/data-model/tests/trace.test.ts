import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { CONTRACT, invalidFixtureProblems, jsonFiles, readJson, validatorFor } from "./helpers.ts";

const validate = validatorFor("trace.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "trace");

const LINK_TYPES = [
  "derives-from",
  "mitigates",
  "allocated-to",
  "decided-by",
  "implemented-by",
  "verified-by",
  "evidenced-by",
  "amended-by",
] as const;

type Need = { id: string; links: string[] } & Partial<
  Record<(typeof LINK_TYPES)[number], string[]>
>;
type Trace = {
  current_version: string;
  versions: Record<string, { needs_amount: number; needs: Record<string, Need> }>;
};

// What the schema cannot say: a need sits under its own id, the count is right, `links` holds every typed target
// and the current version exists.
function consistencyProblems(trace: Trace): string[] {
  const problems: string[] = [];
  if (!(trace.current_version in trace.versions)) problems.push("current_version is not a version");
  for (const [version, { needs_amount, needs }] of Object.entries(trace.versions)) {
    if (needs_amount !== Object.keys(needs).length)
      problems.push(`${version}: needs_amount is wrong`);
    for (const [key, need] of Object.entries(needs)) {
      if (key !== need.id) problems.push(`${version}: ${key} holds the need ${need.id}`);
      for (const type of LINK_TYPES) {
        for (const target of need[type] ?? []) {
          if (!need.links.includes(target))
            problems.push(`${need.id}: ${type} ${target} is not in links`);
        }
      }
    }
  }
  return problems;
}

// verifies: REQ-DAT-20
test("trace fixtures pass", () => {
  const files = jsonFiles(join(FIXTURES, "valid"));
  assert.ok(files.length >= 3);
  for (const file of files) {
    const trace = readJson(file);
    assert.equal(validate(trace), true, `${file}: ${JSON.stringify(validate.errors)}`);
    assert.deepEqual(consistencyProblems(trace as Trace), [], file);
  }
});

// verifies: REQ-DAT-20
test("link of an unknown type fails", () => {
  const trace = readJson(join(FIXTURES, "invalid", "link-of-unknown-type.json"));
  assert.equal(validate(trace), false);
  assert.ok(
    validate.errors?.some(
      (e) => e.keyword === "additionalProperties" && e.params.additionalProperty === "relates-to",
    ),
  );
});

// verifies: REQ-DAT-20
test("invalid trace fixtures fail with the expected error", () => {
  assert.deepEqual(invalidFixtureProblems(validate, FIXTURES), []);
});

// verifies: REQ-DAT-20
test("trace fixtures that contradict themselves are reported", () => {
  const files = jsonFiles(join(FIXTURES, "inconsistent"));
  assert.ok(files.length >= 4);
  for (const file of files) {
    const trace = readJson(file);
    assert.equal(
      validate(trace),
      true,
      `${file} should pass the schema: ${JSON.stringify(validate.errors)}`,
    );
    assert.notDeepEqual(consistencyProblems(trace as Trace), [], file);
  }
});
