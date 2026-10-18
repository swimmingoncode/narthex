// Lists the `act` items of decisions/questions.json that have no current answer in decisions/responses/.
//
// An answer counts when it has a choice or notes. The latest one (by `at`) is the current answer, as in
// skills/decision-form/scripts/build.py. A current answer whose choice says "discuss" does not count: the item
// stays open. Items with `superseded_by` are skipped. Both archive shapes of response.schema.json are read: the
// form's export ({ "responses": [...] }) and the listed rows ([{ "id", "data": {...} }]).
//
// Usage: node scripts/check-act-items.mjs [--questions <file>] [--responses <dir>] [--json]
//   Exit 0: every act item has a current answer. Exit 1: some do not. Exit 2: an input cannot be read.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const DISCUSS = /\bdiscuss\b/i;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const { values } = parseArgs({
  options: {
    questions: { type: "string", default: join(root, "decisions", "questions.json") },
    responses: { type: "string", default: join(root, "decisions", "responses") },
    json: { type: "boolean", default: false },
  },
});

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} cannot be read: ${error.message}`);
  }
}

// The two archive shapes of response.schema.json: the form's export, or the listed rows of the store.
function archivedRows(doc, name) {
  if (Array.isArray(doc)) return doc.map((row) => ({ id: row.id, body: row.data }));
  if (Array.isArray(doc?.responses)) return doc.responses.map((row) => ({ id: row.id, body: row }));
  throw new Error(`${name} is neither an export nor a list of rows`);
}

function latestAnswers(dir, names) {
  const latest = new Map();
  for (const name of names) {
    for (const { id, body } of archivedRows(readJson(join(dir, name)), name)) {
      if (!body || !(body.choice || body.notes)) continue;
      const at = Date.parse(body.at);
      const seen = latest.get(id);
      if (!seen || at >= seen.at) latest.set(id, { choice: body.choice ?? "", at });
    }
  }
  return latest;
}

try {
  const questions = readJson(resolve(values.questions));
  const dir = resolve(values.responses);
  const names = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
  const answers = latestAnswers(dir, names);

  const unanswered = (questions.items ?? [])
    .filter((item) => item.kind === "act" && !item.superseded_by)
    .filter((item) => {
      const current = answers.get(item.id);
      return !current || DISCUSS.test(current.choice);
    })
    .map(({ id, title }) => ({ id, title }));

  if (values.json) console.log(JSON.stringify({ unanswered }, null, 2));
  else for (const item of unanswered) console.log(`${item.id}  ${item.title}`);
  process.exit(unanswered.length > 0 ? 1 : 0);
} catch (error) {
  console.error(`check-act-items: ${error.message}`);
  process.exit(2);
}
