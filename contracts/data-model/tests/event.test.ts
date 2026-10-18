import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import fc from "fast-check";
import {
  CONTRACT,
  type FeedEvent,
  firstCursorViolation,
  jsonFiles,
  readJson,
  validatorFor,
} from "./helpers.ts";

const validate = validatorFor("event.schema.json");
const FIXTURES = join(CONTRACT, "fixtures", "event");

type Expected = Record<string, { keyword: string; instancePath: string }>;

// verifies: REQ-DEC-24, INV-3
test("event fixtures pass", () => {
  const files = jsonFiles(join(FIXTURES, "valid"));
  assert.ok(files.length >= 5);
  const types = new Set<unknown>();
  for (const file of files) {
    const event = readJson(file) as { type: unknown };
    assert.equal(validate(event), true, `${file}: ${JSON.stringify(validate.errors)}`);
    types.add(event.type);
  }
  assert.deepEqual([...types].sort(), ["ack", "answer", "edit", "link_request", "publish"]);
});

// verifies: REQ-DEC-24, INV-3
test("event without a cursor fails", () => {
  const expected = readJson(join(FIXTURES, "expected-errors.json")) as Expected;
  const files = jsonFiles(join(FIXTURES, "invalid"));
  assert.equal(files.length, Object.keys(expected).length);
  for (const file of files) {
    const name = `invalid/${file.split("/").pop()}`;
    const want = expected[name];
    assert.ok(want, `${name} has no expected error`);
    assert.equal(validate(readJson(file)), false, `${name} should fail`);
    const found = (validate.errors ?? []).some(
      (e) => e.keyword === want.keyword && e.instancePath === want.instancePath,
    );
    assert.ok(
      found,
      `${name}: wanted ${JSON.stringify(want)}, got ${JSON.stringify(validate.errors)}`,
    );
  }
  assert.equal(validate(readJson(join(FIXTURES, "invalid", "without-cursor.json"))), false);
  assert.ok(
    validate.errors?.some((e) => e.keyword === "required" && e.params.missingProperty === "cursor"),
  );
});

// verifies: REQ-DEC-24, INV-3
test("event sequences obey the cursor order of their form", () => {
  for (const file of jsonFiles(join(FIXTURES, "sequences", "valid"))) {
    assert.equal(firstCursorViolation(readJson(file) as FeedEvent[]), null, file);
  }
  for (const file of jsonFiles(join(FIXTURES, "sequences", "invalid"))) {
    assert.notEqual(firstCursorViolation(readJson(file) as FeedEvent[]), null, file);
  }
});

// A reference feed: what a store must do to satisfy the contract. It appends events and gives each the next
// cursor of its form. The test then checks that anything this feed can produce passes the schema.
type Body = Record<string, unknown> & { form: string; type: string };

function appendAll(bodies: readonly Body[]) {
  const next = new Map<string, number>();
  return bodies.map((body) => {
    const cursor = (next.get(body.form) ?? 0) + 1 + (body.type === "ack" ? 1 : 0);
    next.set(body.form, cursor);
    return { ...body, cursor, at: "2026-10-17T20:00:00Z" };
  });
}

const forms = fc.constantFrom("f-a", "f-b", "f-c");
const item = fc.stringMatching(/^[a-z0-9][a-z0-9.-]{0,20}$/);
const commit = fc.stringMatching(/^[0-9a-f]{7,40}$/);
const word = fc.stringMatching(/^[a-z]{1,12}$/);
const bodyArb: fc.Arbitrary<Body> = fc.oneof(
  fc.record({ form: forms, type: fc.constant("answer"), item, choice: word }),
  fc.record({ form: forms, type: fc.constant("answer"), item, notes: word, by: word }),
  fc.record({
    form: forms,
    type: fc.constant("edit"),
    item,
    changed: fc.uniqueArray(word, { minLength: 1, maxLength: 4 }),
  }),
  fc.record({ form: forms, type: fc.constant("link_request"), recipient: word }),
  fc.record({ form: forms, type: fc.constant("publish"), commit }),
  fc.record({
    form: forms,
    type: fc.constant("ack"),
    commit,
    through: fc.integer({ min: 1, max: 1000 }),
  }),
);

// verifies: REQ-DEC-24, INV-3
test("any generated event sequence has strictly increasing cursors", () => {
  fc.assert(
    fc.property(fc.array(bodyArb, { maxLength: 40 }), (bodies) => {
      const events = appendAll(bodies);
      for (const event of events)
        assert.equal(validate(event), true, JSON.stringify(validate.errors));
      assert.equal(firstCursorViolation(events), null);
    }),
  );
});

// verifies: REQ-DEC-24, INV-3
test("a generated sequence with a repeated cursor is reported", () => {
  fc.assert(
    fc.property(fc.array(bodyArb, { minLength: 1, maxLength: 20 }), fc.nat(), (bodies, pick) => {
      const events = appendAll(bodies);
      const at = pick % events.length;
      const source = events[at] as FeedEvent;
      const copy = { ...source };
      const broken = [...events.slice(0, at + 1), copy, ...events.slice(at + 1)];
      assert.notEqual(firstCursorViolation(broken), null);
    }),
  );
});
