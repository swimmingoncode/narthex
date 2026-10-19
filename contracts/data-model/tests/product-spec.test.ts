import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { CONTRACT, invalidFixtureProblems, jsonFiles, readJson, validatorFor } from "./helpers.ts";

const validate = validatorFor("product-spec.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "product-spec");

// The six elements of SPEC 4.3, in the order of its table.
const ELEMENTS = [
  "problem-descriptors",
  "goals-and-non-goals",
  "product-map",
  "success-measures",
  "constraints",
  "open-questions",
] as const;
const LEVELS = ["newcomer", "maker", "practitioner", "professional"] as const;

type Gap = { element: string; reason: "missing" | "unknown" | "unclear" };
type Element = { status: "answered" | "unknown"; source?: unknown };
type ProductSpec = { elements: Record<string, Element>; gaps: Gap[]; level?: string };

// What the schema cannot say, and the intake check reads (REQ-CHN-5): each element is answered or listed as a gap,
// and each gap agrees with its element. `missing`: the element is absent. `unknown`: it is answered "unknown".
// `unclear`: it is answered. An answered element with no gap is complete.
function gapProblems(spec: ProductSpec): string[] {
  const problems: string[] = [];
  for (const name of ELEMENTS) {
    const element = spec.elements[name];
    const reasons = spec.gaps.filter((g) => g.element === name).map((g) => g.reason);
    if (!element && !reasons.includes("missing"))
      problems.push(`${name}: neither answered nor a gap`);
    if (element && reasons.includes("missing"))
      problems.push(`${name}: answered but a gap says missing`);
    if (element?.status === "unknown" && !reasons.includes("unknown"))
      problems.push(`${name}: unknown without a gap`);
    if (element?.status !== "unknown" && reasons.includes("unknown"))
      problems.push(`${name}: gap says unknown but the element is not`);
    if (element?.status === "unknown" && reasons.includes("unclear"))
      problems.push(`${name}: an unknown element cannot be unclear`);
  }
  return problems;
}

// verifies: REQ-CHN-1, REQ-ITK-6
test("complete product spec passes", () => {
  const spec = readJson(join(FIXTURES, "valid", "complete.json")) as ProductSpec;
  assert.equal(validate(spec), true, JSON.stringify(validate.errors));
  assert.deepEqual(Object.keys(spec.elements).sort(), [...ELEMENTS].sort());
  assert.deepEqual(spec.gaps, []);
  assert.deepEqual(gapProblems(spec), []);
});

// verifies: REQ-CHN-1, REQ-ITK-6
test("product spec fixtures pass and agree with their gaps", () => {
  const files = jsonFiles(join(FIXTURES, "valid"));
  assert.ok(files.length >= 3);
  for (const file of files) {
    const spec = readJson(file);
    assert.equal(validate(spec), true, `${file}: ${JSON.stringify(validate.errors)}`);
    assert.deepEqual(gapProblems(spec as ProductSpec), [], file);
  }
});

// verifies: REQ-CHN-1, REQ-CHN-5
test("missing success measures is a schema-valid gap", () => {
  const spec = readJson(join(FIXTURES, "valid", "with-gaps.json")) as ProductSpec;
  assert.equal(validate(spec), true, JSON.stringify(validate.errors));
  assert.equal("success-measures" in spec.elements, false);
  assert.deepEqual(
    spec.gaps.filter((g) => g.element === "success-measures").map((g) => g.reason),
    ["missing"],
  );
  assert.deepEqual(gapProblems(spec), []);
  // The three reasons of a gap are all in the example: missing, unknown and unclear.
  assert.deepEqual([...new Set(spec.gaps.map((g) => g.reason))].sort(), [
    "missing",
    "unclear",
    "unknown",
  ]);
});

// verifies: REQ-CHN-1, REQ-ITK-6
test("element without a source fails", () => {
  for (const name of ["element-without-source", "unknown-element-without-source"]) {
    const spec = readJson(join(FIXTURES, "invalid", `${name}.json`));
    assert.equal(validate(spec), false, name);
    assert.ok(
      validate.errors?.some(
        (e) => e.keyword === "required" && e.params.missingProperty === "source",
      ),
      name,
    );
  }
});

// verifies: REQ-CHN-1, REQ-ITK-6
test("invalid product spec fixtures fail with the expected error", () => {
  assert.deepEqual(invalidFixtureProblems(validate, FIXTURES), []);
});

// verifies: REQ-CHN-5
test("product spec fixtures whose gaps contradict their elements are reported", () => {
  const files = jsonFiles(join(FIXTURES, "inconsistent"));
  assert.ok(files.length >= 5);
  for (const file of files) {
    const spec = readJson(file);
    assert.equal(
      validate(spec),
      true,
      `${file} should pass the schema: ${JSON.stringify(validate.errors)}`,
    );
    assert.notDeepEqual(gapProblems(spec as ProductSpec), [], file);
  }
});

// verifies: REQ-ITK-6
test("the level changes nothing the schema requires", () => {
  const complete = readJson(join(FIXTURES, "valid", "complete.json")) as ProductSpec;
  const withoutSource = readJson(
    join(FIXTURES, "invalid", "element-without-source.json"),
  ) as ProductSpec;
  for (const level of LEVELS) {
    assert.equal(validate({ ...complete, level }), true, level);
    assert.equal(validate({ ...withoutSource, level }), false, level);
  }
  const { level: _level, ...noLevel } = complete;
  assert.equal(validate(noLevel), true);
});

// verifies: REQ-CHN-1
test("the elements of the schema are the six of the product specification contract", () => {
  const schema = readJson(join(CONTRACT, "product-spec.schema.json")) as {
    properties: { elements: { properties: Record<string, unknown> } };
    $defs: { "element-name": { enum: string[] } };
  };
  assert.deepEqual(Object.keys(schema.properties.elements.properties), [...ELEMENTS]);
  assert.deepEqual(schema.$defs["element-name"].enum, [...ELEMENTS]);
});
