// Every test names the requirement ids it verifies in a comment (REQ-SKL-30, OQ-9):
//   // verifies: REQ-SKL-19, INV-8      (JavaScript, TypeScript)
//   # verifies: REQ-SKL-19, INV-8       (Python)
// The comment sits on the lines directly above the test, on its line, or on the line after a Python `def`.
// Reports tests with no comment and comments with an id no source document defines.
// Usage: node scripts/check-test-tags.mjs [--report] [root]    (--report always exits 0)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ID =
  "(?:REQ-[A-Z]{3}-\\d+|INV-\\d+|NFR-\\d+|ASM-\\d+|OQ-\\d+|DEC-\\d+|STEP-\\d+|XC-\\d+|DEF-\\d+|ADR-\\d{4}|T-\\d{3}-\\d{2}|F-\\d{3})";
const ID_ANYWHERE = new RegExp(`\\b${ID}\\b`, "g");
const ID_EXACT = new RegExp(`^${ID}$`);
const SKIP_DIRS = new Set(["node_modules", ".git", "private", "dist", "history"]);
const JS_TEST_FILE = /\.test\.(?:mjs|cjs|js|mts|cts|ts)$/;
const PY_TEST_FILE = /(?:^test_.*|.*_test)\.py$/;
const JS_TEST_CALL = /^\s*(?:test|it)(?:\.(?:skip|only|todo))?\(\s*(["'`])(.*?)\1/;
const PY_TEST_DEF = /^\s*(?:async\s+)?def\s+(test\w*)\s*\(/;
const VERIFIES = /(?:\/\/|#)\s*verifies:\s*(.*)$/;

// Ids that some document of the project defines or cites. Typos appear in none of them.
export function collectKnownIds(root) {
  const known = new Set();
  const read = (file) => {
    if (!existsSync(file)) return;
    for (const m of readFileSync(file, "utf8").matchAll(ID_ANYWHERE)) known.add(m[0]);
  };
  read(join(root, "SPEC.md"));
  read(join(root, "PLAN.md"));
  const walkDocs = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walkDocs(full);
      else if (entry.name.endsWith(".md")) {
        read(full);
        const adr = entry.name.match(/^(\d{4})-/);
        if (adr && dir.endsWith("adr")) known.add(`ADR-${adr[1]}`);
      }
    }
  };
  walkDocs(join(root, "docs", "architecture"));
  return known;
}

function* testFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* testFiles(full);
    else if (JS_TEST_FILE.test(entry.name) || PY_TEST_FILE.test(entry.name)) yield full;
  }
}

const isComment = (line) => /^\s*(?:\/\/|#|\/\*|\*)/.test(line);

function tagsFor(lines, index, python) {
  const found = [];
  const take = (line) => {
    const m = line.match(VERIFIES);
    if (m) found.push(m[1]);
  };
  take(lines[index]);
  for (let i = index - 1; i >= 0; i--) {
    const line = lines[i];
    if (isComment(line) || (python && /^\s*@/.test(line))) take(line);
    else break;
  }
  if (python && /:\s*$/.test(lines[index])) {
    for (let i = index + 1; i <= index + 2 && i < lines.length; i++) {
      if (/^\s*#/.test(lines[i])) take(lines[i]);
    }
  }
  return found;
}

export function checkTestTags(root, known = collectKnownIds(root)) {
  const findings = [];
  for (const file of testFiles(root)) {
    const python = file.endsWith(".py");
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      const m = python ? line.match(PY_TEST_DEF) : line.match(JS_TEST_CALL);
      if (!m) return;
      const name = python ? m[1] : m[2];
      const where = { file: relative(root, file), line: index + 1, name };
      const tags = tagsFor(lines, index, python);
      if (tags.length === 0) {
        findings.push({ ...where, problem: "no verifies comment" });
        return;
      }
      for (const raw of tags) {
        for (const token of raw.split(/[\s,;]+/).filter(Boolean)) {
          const id = token.replace(/^`|`$|\.$/g, "");
          if (!ID_EXACT.test(id) || !known.has(id)) {
            findings.push({ ...where, problem: `unknown id ${id}` });
          }
        }
      }
    });
  }
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const report = args.includes("--report");
  const rest = args.filter((a) => a !== "--report");
  const root = resolve(rest[0] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  if (!statSync(root).isDirectory()) throw new Error(`${root} is not a directory`);
  const findings = checkTestTags(root);
  for (const f of findings) console.log(`${f.file}:${f.line}: ${f.name}: ${f.problem}`);
  console.log(`${findings.length} finding(s)${report ? " (report mode)" : ""}`);
  if (findings.length > 0 && !report) process.exit(1);
}
