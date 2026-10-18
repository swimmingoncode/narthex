import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./check-act-items.mjs", import.meta.url));

const act = (id, extra = {}) => ({
  id,
  section: "act",
  kind: "act",
  title: `Title of ${id}`,
  ...extra,
});

// Runs the script on a questions file and a responses directory made under a fresh temporary directory.
function run({ items, responses = {}, json = false }) {
  const dir = mkdtempSync(join(tmpdir(), "check-act-items-"));
  try {
    const questions = join(dir, "questions.json");
    const responsesDir = join(dir, "responses");
    mkdirSync(responsesDir);
    writeFileSync(
      questions,
      JSON.stringify({ form: { title: "Test" }, sections: [{ id: "act", title: "Act" }], items }),
    );
    for (const [name, doc] of Object.entries(responses)) {
      writeFileSync(join(responsesDir, name), JSON.stringify(doc));
    }
    const args = [script, "--questions", questions, "--responses", responsesDir];
    return spawnSync(process.execPath, json ? [...args, "--json"] : args, { encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// verifies: INV-4, REQ-SKL-20
test("unanswered act item is reported", () => {
  const result = run({ items: [act("act-one")] });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "act-one  Title of act-one\n");
});

// verifies: INV-4, REQ-SKL-20
test("answered act item passes", () => {
  const result = run({
    items: [act("act-one")],
    responses: {
      "2026-10-17.json": {
        responses: [{ id: "act-one", choice: "Done", at: "2026-10-17T10:00Z" }],
      },
    },
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
});

// verifies: INV-4, REQ-SKL-20
test("discuss-first answer still counts as unanswered", () => {
  const result = run({
    items: [act("act-one")],
    responses: {
      "a.json": { responses: [{ id: "act-one", choice: "Approve", at: "2026-10-17T10:00Z" }] },
      "b.json": {
        responses: [{ id: "act-one", choice: "Discuss first", at: "2026-10-17T11:00Z" }],
      },
    },
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "act-one  Title of act-one\n");
});

// verifies: INV-4, REQ-SKL-20
test("superseded act item is skipped", () => {
  const result = run({ items: [act("act-old", { superseded_by: "act-new" }), act("act-new")] });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "act-new  Title of act-new\n");
});

// verifies: INV-4, REQ-SKL-20
test("both archive shapes are read", () => {
  const result = run({
    items: [act("act-export"), act("act-listed"), act("act-open")],
    responses: {
      "export.json": { responses: [{ id: "act-export", choice: "Done", at: "2026-10-17T10:00Z" }] },
      "listed.json": [{ id: "act-listed", data: { notes: "sent", at: "2026-10-17T10:00Z" } }],
    },
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "act-open  Title of act-open\n");
});

// verifies: INV-4, REQ-SKL-20
test("json output names each unanswered act item and nothing else", () => {
  const result = run({
    items: [
      act("act-one", { title: "First" }),
      act("act-two", { title: "Second" }),
      {
        id: "decide-one",
        section: "decide",
        title: "A decision, not an act item",
      },
    ],
    responses: {
      "x.json": { responses: [{ id: "act-one", choice: "Done", at: "2026-10-17T10:00Z" }] },
    },
    json: true,
  });
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stdout), { unanswered: [{ id: "act-two", title: "Second" }] });
});
