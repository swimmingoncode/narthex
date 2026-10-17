import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const ci = readFileSync(".github/workflows/ci.yml", "utf8");

// The job as it stood before T-001-02. It must stay byte for byte as it is.
const decisionForm = `  decision-form:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Builder tests
        run: python3 -m unittest discover -s skills/decision-form/tests
      - name: Check the decision form
        run: python3 skills/decision-form/scripts/build.py decisions/questions.json --check --strict
`;

function jobBlock(name) {
  const start = ci.indexOf(`  ${name}:\n`);
  assert.notEqual(start, -1, `job ${name} exists`);
  const rest = ci.slice(start + 1);
  const next = rest.search(/\n {2}[a-z-]+:\n/);
  return ci.slice(start, next === -1 ? undefined : start + 1 + next);
}

// verifies: NFR-4
test("ci runs every workspace's tests", () => {
  const root = JSON.parse(readFileSync("package.json", "utf8"));
  assert.match(root.scripts.test, /test:workspaces/);
  assert.match(root.scripts["test:workspaces"], /--workspaces/);
  for (const group of ["apps", "packages"]) {
    for (const dir of readdirSync(group)) {
      const manifest = JSON.parse(readFileSync(`${group}/${dir}/package.json`, "utf8"));
      assert.ok(manifest.scripts?.test, `${group}/${dir} has a test script`);
    }
  }
  assert.match(jobBlock("node"), /run: npm test\n/);
  assert.match(jobBlock("postgres"), /run: npm run test:workspaces\n/);
});

// verifies: NFR-4
test("ci has a PostgreSQL service job", () => {
  const block = jobBlock("postgres");
  assert.match(block, /services:\n\s+postgres:\n\s+image: postgres:\d+/);
  assert.match(block, /--health-cmd/);
});

// verifies: NFR-4
test("ci keeps the decision-form job as it was", () => {
  assert.equal(jobBlock("decision-form"), decisionForm);
});
