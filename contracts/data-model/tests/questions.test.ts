import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import fc from "fast-check";
import { CONTRACT, jsonFiles, ROOT, readJson, runBuilder, validatorFor } from "./helpers.ts";

const validate = validatorFor("questions.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "questions");
const REPO_QUESTIONS = join(ROOT, "decisions", "questions.json");

type Expected = Record<
  string,
  { schema: { keyword: string; instancePath: string }; builder: string }
>;

// verifies: REQ-DEC-1, REQ-DEC-43, REQ-DAT-6
test("valid questions fixtures pass the schema", () => {
  const files = [...jsonFiles(join(FIXTURES, "valid")), REPO_QUESTIONS];
  assert.ok(files.length >= 3);
  for (const file of files) {
    assert.equal(validate(readJson(file)), true, `${file}: ${JSON.stringify(validate.errors)}`);
  }
});

// verifies: REQ-DEC-1, REQ-DEC-43, REQ-DAT-6
test("invalid questions fixtures fail with the expected error", () => {
  const expected = readJson(join(FIXTURES, "expected-errors.json")) as Expected;
  const files = jsonFiles(join(FIXTURES, "invalid"));
  assert.equal(files.length, Object.keys(expected).length);
  for (const file of files) {
    const name = `invalid/${file.split("/").pop()}`;
    const want = expected[name];
    assert.ok(want, `${name} has no expected error`);
    assert.equal(validate(readJson(file)), false, `${name} should fail`);
    const found = (validate.errors ?? []).some(
      (e) => e.keyword === want.schema.keyword && e.instancePath === want.schema.instancePath,
    );
    assert.ok(
      found,
      `${name}: wanted ${JSON.stringify(want.schema)}, got ${JSON.stringify(validate.errors)}`,
    );
  }
});

const SECTIONS = ["read", "decide", "act", "queue", "updates"];
const text = (max: number) =>
  fc.string({ minLength: 1, maxLength: max }).filter((s) => !s.includes("(recommended)"));

const itemArb = fc
  .record(
    {
      id: fc.stringMatching(/^[a-z0-9][a-z0-9.-]{0,20}$/),
      kind: fc.constantFrom("decide", "act", "queue", "read", "update", "later"),
      section: fc.constantFrom(...SECTIONS),
      title: text(70),
      lead: text(120),
      bullets: fc.array(text(60), { maxLength: 5 }),
      rec: text(80),
      options: fc.array(text(40), { minLength: 1, maxLength: 4 }),
      recommend: fc.boolean(),
      default: fc.nat(10),
      reserved: fc.boolean(),
      blocks: fc.boolean(),
      refs: fc.array(
        fc.record(
          { label: text(30), url: fc.oneof(fc.constant(null), text(30)) },
          { noNullPrototype: true },
        ),
        { maxLength: 3 },
      ),
      spec: fc.array(text(12), { maxLength: 3 }),
      origin: text(40),
      chainLabels: fc.uniqueArray(text(20), { minLength: 1, maxLength: 3 }),
    },
    { requiredKeys: ["id", "section", "title"], noNullPrototype: true },
  )
  .map(({ recommend, chainLabels, ...item }) => {
    const out: Record<string, unknown> = item;
    const options = item.options;
    if (options && recommend) out.options = [`${options[0]} (recommended)`, ...options.slice(1)];
    if (item.default !== undefined) {
      if (!options || item.reserved) delete out.default;
      else out.default = item.default % options.length;
    }
    if (item.kind === "read" && chainLabels) {
      out.chain = chainLabels.map((label, n) => ({
        label,
        why: "It matters.",
        before: n === 0 ? [] : [chainLabels[n - 1]],
      }));
    }
    return out;
  });

const docArb = fc
  .uniqueArray(itemArb, { selector: (i) => i.id as string, maxLength: 8 })
  .map((items) => ({
    form: { title: "Generated form" },
    sections: SECTIONS.map((id) => ({ id, title: id })),
    items,
  }));

// verifies: REQ-DEC-1, REQ-DEC-43, REQ-DAT-6
test("generated valid items pass the schema and survive a round trip", () => {
  const dir = mkdtempSync(join(tmpdir(), "narthex-questions-"));
  try {
    fc.assert(
      fc.property(docArb, (doc) => {
        assert.equal(validate(doc), true, JSON.stringify(validate.errors));
        const again = JSON.parse(JSON.stringify(doc));
        assert.deepEqual(again, doc);
        assert.equal(validate(again), true);
        const file = join(dir, "questions.json");
        writeFileSync(file, JSON.stringify(doc));
        const built = runBuilder(file);
        assert.equal(built.code, 0, built.err);
      }),
      { numRuns: 80 },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
