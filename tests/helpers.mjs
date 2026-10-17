import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// Builds a throwaway directory tree from { "relative/path": "content" }.
export function makeTree(files) {
  const root = mkdtempSync(join(tmpdir(), "narthex-test-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

export const workspace = (name) => JSON.stringify({ name: `@narthex/${name}`, type: "module" });
