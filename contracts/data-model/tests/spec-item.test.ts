import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

const validate = validatorFor("spec-item.schema.json");
const validateTrace = validatorFor("trace.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "spec-item");

// The item types SPEC 6.3 names, in kebab-case, plus `deferred` and `assumption`. The schema's type is open (REQ-DAT-9),
// so this is the known set, not a limit: the schema and the README list it, and a valid fixture exists for each.
const KNOWN_TYPES = [
  "product-spec",
  "requirement",
  "invariant",
  "acceptance-criterion",
  "non-functional",
  "threat",
  "hazard",
  "component",
  "architecture-decision",
  "decision",
  "feature",
  "task",
  "check",
  "evidence-record",
  "runbook",
  "slo",
  "open-question",
  "amendment",
  "decision-item",
  "deferred",
  "assumption",
];

type Item = {
  id: string;
  type: string;
  statement: string;
  strength?: string | null;
  verification_method?: string;
  links?: Record<string, string[]>;
};

// CONFORMANCE STAND-IN. A profile is a data file that lists the mandatory attributes per item (REQ-DAT-18), but
// contracts/profile/ does not exist yet, so these are the requirements of the `product` profile as SPEC 6.3 states
// them for requirements and invariants. When the profile contract lands, read this from its `product` data file and
// delete this constant. `when` selects the items; `needs` names the attributes they must then carry.
interface ProfileRule {
  when: { type: string; strength?: string };
  needs: string[];
}
const PRODUCT_PROFILE_REQUIREMENTS: ProfileRule[] = [
  { when: { type: "requirement" }, needs: ["strength"] },
  { when: { type: "requirement", strength: "MUST" }, needs: ["verification_method"] },
  { when: { type: "invariant" }, needs: ["links.verified-by"] },
];

function attribute(item: Item, path: string): unknown {
  if (path === "links.verified-by") return item.links?.["verified-by"]?.length ? true : undefined;
  return (item as Record<string, unknown>)[path] ?? undefined;
}

// What the schema leaves to the profile: the attributes the item's type requires under that profile.
function profileProblems(item: Item, rules: readonly ProfileRule[]): string[] {
  const problems: string[] = [];
  for (const { when, needs } of rules) {
    if (item.type !== when.type) continue;
    if (when.strength !== undefined && item.strength !== when.strength) continue;
    for (const name of needs) {
      if (attribute(item, name) === undefined) problems.push(`${item.id}: no ${name}`);
    }
  }
  return problems;
}

function line(file: string, number: number): string {
  return readFileSync(join(ROOT, file), "utf8").split("\n")[number - 1] ?? "";
}

// verifies: REQ-DAT-17
test("requirement from this spec passes", () => {
  const item = readJson(join(FIXTURES, "valid", "requirement-req-dat-17.json")) as Item;
  assert.equal(validate(item), true, JSON.stringify(validate.errors));
  assert.equal(item.id, "REQ-DAT-17");
  assert.deepEqual(profileProblems(item, PRODUCT_PROFILE_REQUIREMENTS), []);
});

// verifies: REQ-DAT-6, REQ-DAT-17
test("spec item fixtures pass and quote this repository", () => {
  const files = jsonFiles(join(FIXTURES, "valid"));
  assert.ok(files.length >= 10);
  const types = new Set<string>();
  for (const file of files) {
    const item = readJson(file) as Item & { source: { file: string; line?: number } };
    assert.equal(validate(item), true, `${file}: ${JSON.stringify(validate.errors)}`);
    assert.deepEqual(profileProblems(item, PRODUCT_PROFILE_REQUIREMENTS), [], file);
    types.add(item.type);
    // An item taken from SPEC.md or PLAN.md sits on the line it names and says what that line says.
    const { file: doc, line: number } = item.source;
    if ((doc === "SPEC.md" || doc === "PLAN.md") && number !== undefined && item.id !== "REQ-X-1") {
      const text = line(doc, number);
      assert.ok(text.includes(`\`${item.id}\``), `${file}: ${doc}:${number} is not ${item.id}`);
      assert.ok(text.includes(item.statement), `${file}: statement differs from ${doc}:${number}`);
    }
  }
  assert.deepEqual(
    [...types].sort(),
    [...KNOWN_TYPES].sort(),
    "a valid fixture for every known type",
  );
});

// verifies: REQ-DAT-9
test("item types are open: a profile's type passes, a malformed one fails", () => {
  const base = readJson(join(FIXTURES, "valid", "minimal.json")) as Item;
  assert.equal(validate({ ...base, type: "risk-register" }), true, JSON.stringify(validate.errors));
  for (const type of ["Risk", "risk register", "1-risk", "", "-risk"]) {
    assert.equal(validate({ ...base, type }), false, type);
  }
  // The schema and the README name every known type.
  const description = (readJson(join(CONTRACT, "spec-item.schema.json")) as { description: string })
    .description;
  const readme = readFileSync(join(CONTRACT, "README.md"), "utf8");
  for (const type of KNOWN_TYPES) {
    assert.ok(description.includes(`\`${type}\``), `schema description lacks ${type}`);
    assert.ok(readme.includes(`\`${type}\``), `README lacks ${type}`);
  }
});

// verifies: REQ-DAT-17
test("requirement without a statement fails", () => {
  const item = readJson(join(FIXTURES, "invalid", "requirement-without-statement.json"));
  assert.equal(validate(item), false);
  assert.ok(
    validate.errors?.some(
      (e) => e.keyword === "required" && e.params.missingProperty === "statement",
    ),
  );
});

// verifies: REQ-DAT-17
test("MUST without a verification method fails under the product profile", () => {
  const files = jsonFiles(join(FIXTURES, "profile-gaps"));
  assert.ok(files.length >= 3);
  for (const file of files) {
    const item = readJson(file) as Item;
    assert.equal(
      validate(item),
      true,
      `${file} should pass the schema: ${JSON.stringify(validate.errors)}`,
    );
    assert.notDeepEqual(profileProblems(item, PRODUCT_PROFILE_REQUIREMENTS), [], file);
  }
  const must = readJson(
    join(FIXTURES, "profile-gaps", "must-without-verification-method.json"),
  ) as Item;
  assert.deepEqual(profileProblems(must, PRODUCT_PROFILE_REQUIREMENTS), [
    `${must.id}: no verification_method`,
  ]);
  // A SHOULD does not need one, and a profile without the rule does not ask for it.
  assert.deepEqual(
    profileProblems({ ...must, strength: "SHOULD" }, PRODUCT_PROFILE_REQUIREMENTS),
    [],
  );
  assert.deepEqual(profileProblems(must, PRODUCT_PROFILE_REQUIREMENTS.slice(0, 1)), []);
});

// verifies: REQ-DAT-17
test("assumption without what it assumes fails", () => {
  for (const name of [
    "assumption-without-what-it-assumes",
    "assumption-type-without-what-it-assumes",
    "assumption-flag-without-what-it-assumes",
  ]) {
    const item = readJson(join(FIXTURES, "invalid", `${name}.json`));
    assert.equal(validate(item), false, name);
    assert.ok(
      validate.errors?.some(
        (e) => e.keyword === "required" && e.params.missingProperty === "assumes",
      ),
      name,
    );
  }
  assert.equal(
    validate({
      ...(readJson(join(FIXTURES, "valid", "assumption-asm-26.json")) as object),
      assumes: "",
    }),
    false,
  );
});

// verifies: REQ-DAT-6, REQ-DAT-17
test("invalid spec item fixtures fail with the expected error", () => {
  assert.deepEqual(invalidFixtureProblems(validate, FIXTURES), []);
});

interface SchemaFile {
  $defs: { type: { pattern: string }; links: { properties: Record<string, unknown> } };
}

// verifies: REQ-DAT-20
test("trace items take their definitions from the spec item schema", () => {
  const spec = readJson(join(CONTRACT, "spec-item.schema.json")) as SchemaFile;
  const trace = readJson(join(CONTRACT, "trace.schema.json")) as {
    $defs: { need: { properties: Record<string, { $ref?: string }> } };
  };
  const props = trace.$defs.need.properties;
  assert.match(props.id?.$ref ?? "", /^spec-item\.schema\.json#\/\$defs\/id$/);
  assert.match(props.source?.$ref ?? "", /^spec-item\.schema\.json#\/\$defs\/source$/);
  // One typed array per link type of the spec item, and no other.
  const linkTypes = Object.keys(spec.$defs.links.properties).sort();
  const traceLinkTypes = Object.entries(props)
    .filter(([name, p]) => name !== "links" && p.$ref?.endsWith("#/$defs/ids"))
    .map(([name]) => name)
    .sort();
  assert.deepEqual(traceLinkTypes, linkTypes);
  // The item type is the same open pattern in both, so every known type is a type the trace export accepts.
  const tracePattern = (
    readJson(join(CONTRACT, "trace.schema.json")) as {
      $defs: { need: { properties: { type: { pattern: string } } } };
    }
  ).$defs.need.properties.type.pattern;
  assert.equal(spec.$defs.type.pattern, tracePattern);
  for (const type of KNOWN_TYPES) assert.match(type, new RegExp(tracePattern));
});

// verifies: REQ-DAT-20
test("trace source may name a commit", () => {
  const base = readJson(join(CONTRACT, "fixtures", "trace", "valid", "minimal.json")) as {
    versions: Record<string, { needs: Record<string, { source: object }> }>;
  };
  const need = base.versions["0.1.0"]?.needs["REQ-A-1"];
  assert.ok(need);
  need.source = { file: "SPEC.md", line: 1, commit: "57f7975" };
  assert.equal(validateTrace(base), true, JSON.stringify(validateTrace.errors));
  need.source = { file: "SPEC.md", commit: "main" };
  assert.equal(validateTrace(base), false);
});
