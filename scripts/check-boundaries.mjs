// Checks the dependency boundaries of ADR-0011 over the workspaces.
//   core depends on nothing of ours; verify depends on core only;
//   nothing depends on apps/*; nothing reaches into another workspace by path.
// Usage: node scripts/check-boundaries.mjs [root]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCOPE = "@narthex/";

// What each workspace may import from the others. Anything else of ours is a violation.
export const ALLOWED = {
  "@narthex/core": [],
  "@narthex/verify": ["@narthex/core"],
  "@narthex/cli": ["@narthex/core", "@narthex/verify"],
  "@narthex/form-adapter": ["@narthex/core"],
  "@narthex/server": ["@narthex/core", "@narthex/verify"],
  "@narthex/web": ["@narthex/core", "@narthex/form-adapter"],
};

const APPS = ["@narthex/server", "@narthex/web"];
const SOURCE = /\.(?:[cm]?[jt]s|[jt]sx|astro)$/;
const IMPORT_PATTERNS = [
  /\bimport\s+(?:[^'"()]*?\sfrom\s+)?["']([^"']+)["']/g,
  /\bexport\s+[^'"()]*?\sfrom\s+["']([^"']+)["']/g,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\(\s*["']([^"']+)["']\s*\)/g,
];

function listWorkspaces(root) {
  const found = [];
  for (const group of ["apps", "packages"]) {
    const base = join(root, group);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base)) {
      const dir = join(base, entry);
      const manifest = join(dir, "package.json");
      if (statSync(dir).isDirectory() && existsSync(manifest)) {
        const name = JSON.parse(readFileSync(manifest, "utf8")).name ?? `${SCOPE}${entry}`;
        found.push({ name, dir, manifest });
      }
    }
  }
  return found;
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SOURCE.test(entry.name)) yield full;
  }
}

function packageOf(specifier) {
  if (!specifier.startsWith(SCOPE)) return null;
  return specifier.split("/").slice(0, 2).join("/");
}

export function checkBoundaries(root) {
  const workspaces = listWorkspaces(root);
  const findings = [];
  const report = (file, rule, message) =>
    findings.push({ file: relative(root, file) || file, rule, message });

  const judge = (ws, target, where) => {
    if (target === ws.name) return;
    if (APPS.includes(target)) {
      report(where, "nothing-imports-apps", `${ws.name} imports ${target}; nothing imports apps/*`);
    } else if (!(ALLOWED[ws.name] ?? []).includes(target)) {
      const rule = ws.name === "@narthex/core" ? "core-imports-nothing" : "allowed-dependencies";
      report(where, rule, `${ws.name} imports ${target}, which ADR-0011 does not allow`);
    }
  };

  for (const ws of workspaces) {
    const manifest = JSON.parse(readFileSync(ws.manifest, "utf8"));
    for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
      for (const dep of Object.keys(manifest[field] ?? {})) {
        const target = packageOf(dep);
        if (target) judge(ws, target, ws.manifest);
      }
    }
    for (const file of walk(ws.dir)) {
      const text = readFileSync(file, "utf8");
      for (const pattern of IMPORT_PATTERNS) {
        for (const match of text.matchAll(pattern)) {
          const specifier = match[1];
          const target = packageOf(specifier);
          if (target) {
            judge(ws, target, file);
          } else if (specifier.startsWith(".")) {
            const resolved = resolve(dirname(file), specifier);
            if (resolved !== ws.dir && !resolved.startsWith(ws.dir + sep)) {
              report(
                file,
                "no-reaching-out",
                `${ws.name} reaches outside its own directory with "${specifier}"; import by package name`,
              );
            }
          }
        }
      }
    }
  }
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  const findings = checkBoundaries(root);
  for (const f of findings) console.error(`${f.file}: [${f.rule}] ${f.message}`);
  if (findings.length > 0) {
    console.error(`${findings.length} boundary violation(s)`);
    process.exit(1);
  }
  console.log("boundaries ok");
}
