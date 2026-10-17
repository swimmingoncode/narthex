// Fails while a checklist file still has an unticked box (`- [ ]`). Fenced code is ignored.
// Usage: node scripts/check-checklist.mjs [--report] <file>...    (--report always exits 0)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const UNTICKED = /^\s*(?:[-*+]|\d+[.)])\s+\[ \]\s*(.*)$/;

export function uncheckedItems(text) {
  const items = [];
  let fenced = false;
  text.split("\n").forEach((line, index) => {
    if (/^\s*(?:```|~~~)/.test(line)) {
      fenced = !fenced;
      return;
    }
    const m = !fenced && line.match(UNTICKED);
    if (m) items.push({ line: index + 1, text: m[1] ?? "" });
  });
  return items;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const report = args.includes("--report");
  const files = args.filter((a) => a !== "--report");
  if (files.length === 0) {
    console.error("usage: check-checklist.mjs <file>...");
    process.exit(2);
  }
  let open = 0;
  for (const file of files) {
    for (const item of uncheckedItems(readFileSync(file, "utf8"))) {
      console.log(`${file}:${item.line}: unticked: ${item.text}`);
      open += 1;
    }
  }
  console.log(`${open} unticked box(es)${report ? " (report mode)" : ""}`);
  if (open > 0 && !report) process.exit(1);
}
