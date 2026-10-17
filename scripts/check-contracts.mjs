// A change under contracts/ needs a version bump and a contracts/CHANGELOG.md entry that names a DEC-* (DEC-14).
//
// Each contract is a directory contracts/<name>/ whose version is read from contracts/<name>/VERSION (a semver on
// one line) or, when there is no such file, from the top-level "version" of contracts/<name>/contract.json.
// The changelog holds one section per released version, headed `## <name> <version>`; the section must cite a DEC-*.
//
// Usage: node scripts/check-contracts.mjs [--base <ref>] [root]
//   <ref> defaults to $NARTHEX_BASE_REF, then origin/main. The check compares HEAD with the merge base.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const NO_BASE = /^0+$/;

function compare(a, b) {
  const x = a.match(SEMVER).slice(1).map(Number);
  const y = b.match(SEMVER).slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export function versionOf(readFile, name) {
  const plain = readFile(`contracts/${name}/VERSION`);
  if (plain !== null && plain !== undefined) return plain.trim();
  const json = readFile(`contracts/${name}/contract.json`);
  if (json !== null && json !== undefined) {
    try {
      const version = JSON.parse(json).version;
      return typeof version === "string" ? version : null;
    } catch {
      return null;
    }
  }
  return null;
}

function changelogSection(changelog, name, version) {
  if (!changelog) return null;
  const parts = changelog.split(/^## /m).slice(1);
  const heading = `${name} ${version}`;
  const part = parts.find((p) => p.split("\n")[0].trim() === heading);
  return part ?? null;
}

// changed: paths (relative to the repo root) that differ between base and head.
// readBase / readHead: path -> file text, or null when the file does not exist on that side.
export function checkContracts({ changed, readBase, readHead }) {
  const errors = [];
  const names = new Set();
  for (const path of changed) {
    const m = path.match(/^contracts\/([^/]+)\/.+/);
    if (m) names.add(m[1]);
  }
  const changelog = readHead("contracts/CHANGELOG.md");
  for (const name of [...names].sort()) {
    const head = versionOf(readHead, name);
    if (!head || !SEMVER.test(head)) {
      errors.push(
        `contracts/${name} has no valid version (a VERSION file, or "version" in contract.json)`,
      );
      continue;
    }
    const base = versionOf(readBase, name);
    if (base && SEMVER.test(base) && compare(head, base) <= 0) {
      errors.push(
        `contracts/${name} changed but its version is still ${head}; bump it above ${base}`,
      );
    }
    const section = changelogSection(changelog, name, head);
    if (!section) {
      errors.push(`contracts/CHANGELOG.md has no "## ${name} ${head}" entry`);
    } else if (!/\bDEC-\d+\b/.test(section)) {
      errors.push(`contracts/CHANGELOG.md entry "${name} ${head}" does not name a DEC-* decision`);
    }
  }
  return errors;
}

function git(root, ...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function main() {
  const args = process.argv.slice(2);
  const flag = args.indexOf("--base");
  let base = flag !== -1 ? args[flag + 1] : process.env.NARTHEX_BASE_REF;
  const positional = args.filter((a, i) => !a.startsWith("--") && i !== flag + 1);
  const root = resolve(positional[0] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  if (!base || NO_BASE.test(base)) base = "origin/main";
  let mergeBase;
  try {
    mergeBase = git(root, "merge-base", base, "HEAD").trim();
  } catch {
    console.log(`contracts: no base ref ${base} to compare with; skipped`);
    return 0;
  }
  const changed = git(root, "diff", "--name-only", mergeBase, "HEAD", "--", "contracts/")
    .split("\n")
    .filter(Boolean);
  const readBase = (path) => {
    try {
      return git(root, "show", `${mergeBase}:${path}`);
    } catch {
      return null;
    }
  };
  const readHead = (path) =>
    existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null;
  const errors = checkContracts({ changed, readBase, readHead });
  for (const error of errors) console.error(`contracts: ${error}`);
  if (errors.length > 0) {
    console.error(`${errors.length} contract error(s)`);
    return 1;
  }
  console.log(
    `contracts ok (${changed.length} changed file(s) under contracts/ since ${mergeBase.slice(0, 7)})`,
  );
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
