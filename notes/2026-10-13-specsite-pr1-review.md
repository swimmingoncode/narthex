# specsite PR #1 (feat/v0.1) review, 2026-10-13
Read-only review at d728003 against SPEC.md REQ-LD-2/3/7/8 and amendment 0004. CI was green; I did not rerun tests.

## Verdict: merge after fixes

Anchoring (REQ-LD-3), mention linking (REQ-LD-7), duplicate and unknown-ID reports with file:line (REQ-LD-8) and
cross-document rewriting all work and are tested. Two things must change before merge: the Apache leftover in
`package.json`, and the basis block, which does not meet REQ-LD-2.

## Findings, by severity

### High
   This is the one Apache leftover (the `license` field and the LICENSE text are MIT, copyright "Pablo Dorado").
   Fix: replace both entries with `LICENSE`.
2. `src/loader.ts:69-84`, `src/html/snapshot.ts:157-167`: the basis block is partial (REQ-LD-2). Missing: repo name,
   the document's version and status on the site pages, and the render time. The snapshot's "Date" is the front-matter
   date, not the render time. The commit shown is the last commit that touched the file, not the commit the site was
   built from (REQ-LD-1: "from a named commit"). Fix: render one block with repo, `HEAD` short hash (linked), version,
   status and an ISO render timestamp; keep the file's last commit as a secondary line.

### Medium
   heading, or as a table row, in another passes silently, and REQ-LD-8 says "duplicate identifiers". The list/table-versus-bold
   leniency is documented and tested, so keep it only for `list`. Fix: make `sameKind` true for bold/table/heading/title among
   themselves and lenient only for `list`; or report cross-kind as `warn` only.
4. `src/core/engine.ts:202,239`: a link to a missing heading fragment (`SPEC.md#nope`) silently falls back to the document's
   first page, and a link to a missing file becomes a repo blob URL with no check. REQ-LD-8 asks for "broken references", and
   this reports only unknown IDs in inline code. Fix: add a `broken-anchor` problem when `doc.anchors` lacks the fragment, and
   count it as strict.
5. `src/html/snapshot.ts:61` (and the Astro default in the loader): raw HTML in Markdown passes through unsanitised
   (`allowDangerousHtml` + `rehypeRaw`), so a `<script>` in a spec ends up in the published page. This is the right default for
   an owner's own repo, but not for PR-contributed docs hosted as an artifact. `src/core/links.ts:37` also leaves
   `javascript:` hrefs alone. Fix: add `--sanitize` / `sanitize: true` (rehype-sanitize with an allowlist for `specsite-*`
   classes, `id` and `data-*`), and document the trust assumption in SECURITY.md.
6. `src/html/template.ts:47,74-76` and `:42`: `accent` and `brand` are interpolated raw into `<style>` and the body. The hex check
   lives only in the CLI (`src/cli.ts:76`), so API callers of `renderSnapshot` can break out with `</style>`. Fix: validate
   `accent` inside `renderSnapshot` (same regex), and note that `brand` SVG is trusted input.
7. `src/core/ids.ts:130-135`: the heading rule takes the first `code` anywhere in the heading, so `## Replaces \`REQ-2\``
   defines REQ-2. Fix: require the ID to be the first meaningful child, as the `leading` text rule does.

### Low
   text (REQ-LD-8 wants `file:line`). Fix: fall back to the page's first line (`file:range start`).
9. `src/core/engine.ts:200`: `[...index.values()].find` runs for every fragment link (O(n) each). Fix: keep an anchor-keyed Map.
10. `src/core/ids.ts:147-152`: task-list handling assumes the checkbox is `kids[0]` and the ID `kids[1]`. Fix: find the
    first non-input child.

### Checked and clean
- Pipeline works on hast nodes (`ids.ts:229-272`, `engine.ts:167-172`); the only string-built HTML is `template.ts` (title, kicker,
  meta values and the toc are escaped; `toc()` in `snapshot.ts:80` escapes `&`, `<`, `"`) and the two items in 5 and 6.
- Anchors are the lower-cased ID, and headings keep GitHub slugs (`engine.ts:97-129`); link rewriting is covered by `links.test.ts`.

## Test gaps
- Priority: nothing proves bold beats table/heading/list for one ID across documents (`engine.ts:178`). Add a test with the
  same ID as a table row in SPEC and in bold in PLAN, expecting the bold one wins and no problem is reported.
- Duplicates: only bold-versus-bold and list-versus-bold are tested. Add table-versus-table, heading-versus-heading and
  title-versus-heading, plus a bold-versus-heading case once finding 3 is decided.
- Not covered: bold-wrapped table cell (`ids.ts:122`), task-list item (`ids.ts:147`), ID mid-heading (finding 7), and a missing fragment (finding 4).
- Covered and fine: cross-document links (`ids.test.ts:69`, `snapshot.test.ts:6`), link rewriting between listed docs (`links.test.ts:26`).
