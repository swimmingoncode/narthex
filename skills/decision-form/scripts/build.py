#!/usr/bin/env python3
"""Build a decision form (one self-contained HTML page) from a questions file, and the decision log.

    python3 build.py decisions/questions.json                  # check, build decisions/form/index.html and decisions/LOG.md
    python3 build.py decisions/questions.json --check          # check only
    python3 build.py decisions/questions.json --mark-published # after publishing: reset the "new" markers

Answers are read from every *.json in the responses directory (default: decisions/responses/). Each file is
either {"responses": [{id, choice, notes, at, by?}]} (the form's own export) or a list of documents as the
ArtifactData tool lists them ({id, data: {...}} or {id, choice, ...}). Every answer ever archived is kept:
the latest per item is its current answer, and the log lists them all (append-only).

Stock Python 3, no packages. The item format and the style rules are in ../references/item-format.md."""
import argparse, base64, datetime, glob, hashlib, html, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "..", "assets", "template.html")
ID_RE = re.compile(r"^[a-z0-9][a-z0-9.-]{0,63}$")
KINDS = {"decide", "act", "queue", "read", "update", "later"}
FLOW = ["read", "decide", "act", "queue", "updates", "later"]
# Who acts (Pablo, 2026-10-15): the owner -> act / section act; the agent -> queue / section queue; nobody -> update / section updates.
KIND_HOME = {"act": "act", "queue": "queue", "update": "updates"}
DISCUSS = re.compile(r"\bdiscuss\b", re.I)

# ---------- style rules (SPEC REQ-DI-2) ----------
LIMITS = {"title_chars": 70, "lead_sentences": 2, "bullets": 5, "bullet_words": 20, "option_words": 10, "context_words": 90}

def words(s): return len(re.findall(r"\S+", s or ""))
def sentences(s): return len([x for x in re.split(r"(?<=[.!?])\s+", (s or "").strip()) if x])

# ---------- brand (form.brand) ----------
TOKENS = {"bg": "bg", "card": "card", "ink": "ink", "muted": "muted", "line": "line", "chip": "chip",
          "accent": "accent", "accentInk": "accent-ink"}
HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})")
FONT_BAD = ("/*", "*/", "@", "url(", ";", "{", "}", "<", ">", "\\")
FONTS_PREFIX = "https://fonts.googleapis.com/"
ICON_TYPES = {".svg": "image/svg+xml", ".png": "image/png"}

def logo_paths(b):
    """`logo` is one SVG, or {"light": svg, "dark": svg} when the logo needs a dark-mode variant."""
    lg = b.get("logo")
    return {"light": lg} if isinstance(lg, str) else (lg if isinstance(lg, dict) else {})

def check_brand(b, base):
    errs = []
    if not isinstance(b, dict): return ["form.brand must be an object"]
    for k in sorted(set(b) - {"fontsUrl", "fonts", "light", "dark", "logo", "favicon"}): errs.append(f"form.brand: unknown key {k!r}")
    for k in ("fonts", "light", "dark"):
        if b.get(k) is not None and not isinstance(b[k], dict): errs.append(f"form.brand.{k} must be an object"); b = {**b, k: None}
    u = b.get("fontsUrl")
    if u is not None and not (isinstance(u, str) and u.startswith(FONTS_PREFIX) and not re.search(r'[\s"<>]', u)):
        errs.append(f"form.brand.fontsUrl must start with {FONTS_PREFIX}")
    for k, v in (b.get("fonts") or {}).items():
        if k not in ("body", "mono"): errs.append(f"form.brand.fonts: unknown key {k!r} (body, mono)")
        elif not (isinstance(v, str) and v.strip() and not any(t in v.lower() for t in FONT_BAD)): errs.append(f"form.brand.fonts.{k} must be a CSS font-family list")
    for mode in ("light", "dark"):
        for k, v in (b.get(mode) or {}).items():
            if k not in TOKENS: errs.append(f"form.brand.{mode}: unknown key {k!r} ({', '.join(TOKENS)})")
            elif not (isinstance(v, str) and HEX_RE.fullmatch(v)): errs.append(f"form.brand.{mode}.{k} must be a hex colour, not {v!r}")
    if b.get("logo") is not None and not (isinstance(b["logo"], str) or (isinstance(b["logo"], dict) and b["logo"].get("light") and set(b["logo"]) <= {"light", "dark"})):
        errs.append("form.brand.logo must be a path, or {light, dark} paths")
    for k, path in logo_paths(b).items():
        if not str(path).lower().endswith(".svg"): errs.append(f"form.brand.logo: {path!r} is not an .svg")
        elif not os.path.isfile(os.path.join(base, path)): errs.append(f"form.brand.logo: {path!r} not found next to the questions file")
    fv = b.get("favicon")
    if fv is not None:
        if not (isinstance(fv, str) and os.path.splitext(fv)[1].lower() in ICON_TYPES): errs.append("form.brand.favicon must be an .svg or .png path")
        elif not os.path.isfile(os.path.join(base, fv)): errs.append(f"form.brand.favicon: {fv!r} not found next to the questions file")
    return errs

SVG_UNSAFE = re.compile(r"<script|foreignObject|<iframe|<set|<animate|\bon\w+\s*=|javascript:|&#", re.I)

def clean_svg(src, name="svg"):
    """An SVG for inlining, returned unchanged; anything that could run script or hide markup is a build error."""
    m = SVG_UNSAFE.search(src)
    if m: sys.exit(f"error: {name}: unsafe SVG content {m.group(0)!r} (scripts, event handlers, foreignObject, iframes, animation, javascript: and character references are not allowed)")
    return src

def brand_blocks(b, base):
    """The four blocks the template's placeholders take. Empty strings when there is no brand."""
    out = {"fonts": None, "head": "", "tokens": "", "logo": ""}
    if not b: return out
    if b.get("fontsUrl"): out["fonts"] = f'<link rel="stylesheet" href="{html.escape(b["fontsUrl"])}">'
    fv = b.get("favicon")
    if fv:
        mime, data = ICON_TYPES[os.path.splitext(fv)[1].lower()], base64.b64encode(open(os.path.join(base, fv), "rb").read()).decode("ascii")
        out["head"] = f'\n<link rel="icon" type="{mime}" href="data:{mime};base64,{data}">'
    tok = lambda mode: "".join(f"--{TOKENS[k]}:{v};" for k, v in (b.get(mode) or {}).items())
    fonts = "".join(f"--f-{k}:{v.strip()};" for k, v in (b.get("fonts") or {}).items())
    light, dark = tok("light") + fonts, tok("dark")
    css = ["/* form.brand */"]
    if light: css.append(f":root{{{light}}}")
    if dark: css += [f'@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{{dark}}}}}', f':root[data-theme="dark"]{{{dark}}}']
    logos = logo_paths(b)
    if logos:
        css.append(".brand-logo{display:block;line-height:0;margin:0 0 12px}.brand-logo svg{display:block;height:28px;width:auto;max-width:100%}")
        if logos.get("dark"):
            swap = "{p} .brand-logo .bl-light{{display:none}}{p} .brand-logo .bl-dark{{display:block}}"
            auto = swap.format(p=':root:not([data-theme="light"])')
            css += [".brand-logo .bl-dark{display:none}", f"@media (prefers-color-scheme:dark){{{auto}}}",
                    swap.format(p=':root[data-theme="dark"]')]
        svgs = "".join(clean_svg(open(os.path.join(base, p), encoding="utf-8").read(), p)
                       .replace("<svg", f'<svg class="bl-{k}" focusable="false"', 1) for k, p in logos.items())
        out["logo"] = f'<span class="brand-logo" aria-hidden="true">{svgs}</span>\n  '
    if len(css) > 1: out["tokens"] = "\n".join(css) + "\n"
    return out

def apply_brand(page, blk):
    if blk["fonts"]:
        a, z = page.index("<!--__FONTS__-->"), page.index("<!--/__FONTS__-->") + len("<!--/__FONTS__-->")
        page = page[:a] + blk["fonts"] + page[z:]
    for ph, k in (("<!--__FONTS__-->", None), ("<!--/__FONTS__-->", None), ("<!--__BRAND_HEAD__-->", "head"),
                  ("/*__BRAND_TOKENS__*/", "tokens"), ("<!--__BRAND_LOGO__-->", "logo")):
        page = page.replace(ph, blk[k] if k else "", 1)
    return page

def doc_of(ref):
    """The document a ref points at: its URL without the anchor, or its label when it has no URL."""
    u = ref.get("url")
    return u.split("#")[0] if u else ref.get("label")

CHAIN_KEYS = {"label", "url", "why", "before", "for"}
CHAIN_WHY_WORDS = 25

def check_chain(i, kind, chain, ids):
    """Validate a read item's reading chain (REQ-DEC-43, REQ-DEC-44). Returns (errors, warnings)."""
    errs, warns = [], []
    if kind != "read": return [f"{i}: chain belongs on a read item (kind read)"], []
    if not isinstance(chain, list) or not chain: return [f"{i}: chain must be a non-empty list of steps"], []
    labels = []
    for n, st in enumerate(chain, 1):
        w = f"{i}: chain step {n}"
        if not isinstance(st, dict): errs.append(f"{w} must be an object"); continue
        for k in sorted(set(st) - CHAIN_KEYS): errs.append(f"{w}: unknown key {k!r} ({', '.join(sorted(CHAIN_KEYS))})")
        lab = st.get("label")
        if not (isinstance(lab, str) and lab.strip()): errs.append(f"{w} has no label"); lab = None
        elif lab in labels: errs.append(f"{w}: label {lab!r} used twice")
        if st.get("url") is not None and not isinstance(st["url"], str): errs.append(f"{w}: url must be a string or null")
        why = st.get("why")
        if not (isinstance(why, str) and why.strip()): warns.append(f"{w} has no reason (why)")
        elif words(why) > CHAIN_WHY_WORDS: warns.append(f"{w}: why over {CHAIN_WHY_WORDS} words ({words(why)})")
        for key in ("before", "for"):
            v = st.get(key)
            if v is not None and not (isinstance(v, list) and all(isinstance(x, str) for x in v)):
                errs.append(f"{w}: {key} must be a list of strings"); st = {**st, key: None}
        for b in st.get("before") or []:
            if b not in labels and not (b in ids and b != i): errs.append(f"{w}: before {b!r} is not an earlier step or another item")
        for f in st.get("for") or []:
            if f not in ids or f == i: errs.append(f"{w}: for {f!r} is not another item in this file")
        if n > 1 and "before" not in st: warns.append(f"{w} lacks its prerequisites (before; use [] when none)")
        if lab: labels.append(lab)
    if len(chain) < 2: warns.append(f"{i}: reading chain has one step only (a single reference is not a chain)")
    return errs, warns

def check(doc, base=".", current=None):
    """Returns (errors, warnings). Errors break the form; warnings break only --strict.
    current: the latest archived answer per item id, to spot answers the form has not followed up."""
    errs, warns = [], []
    all_ids = {x.get("id") for x in doc.get("items", [])}
    if "brand" in doc.get("form", {}): errs += check_brand(doc["form"]["brand"], base)
    secs = {s["id"]: s for s in doc.get("sections", [])}
    if not secs: errs.append("no sections")
    for sid, s in secs.items():
        if not ID_RE.match(sid): errs.append(f"section id {sid!r}: lower case letters, digits, '-' and '.' only")
    seen = set()
    for it in doc.get("items", []):
        i = it.get("id", "?")
        where = f"{i}:"
        if not ID_RE.match(i): errs.append(f"{where} id must be lower case letters, digits, '-' and '.', at most 64 characters")
        if i in seen: errs.append(f"{where} id used twice")
        seen.add(i)
        if it.get("kind", "decide") not in KINDS: errs.append(f"{where} kind must be one of {sorted(KINDS)}")
        s = secs.get(it.get("section"))
        if not s: errs.append(f"{where} unknown section {it.get('section')!r}"); continue
        k = it.get("kind", "decide")
        if k in KIND_HOME and s["id"] in FLOW and s["id"] != KIND_HOME[k]:
            warns.append(f"{where} kind {k} sits in section {s['id']!r}; it belongs in {KIND_HOME[k]!r} (owner acts: act, agent acts: queue, nobody acts: update)")
        g = it.get("group")
        if g and g not in {x["id"] for x in s.get("groups", [])}:  # any section can have groups; declare the missing one
            title = g.replace("-", " ").capitalize()
            s.setdefault("groups", []).append({"id": g, "title": title})
            warns.append(f"section {s['id']!r}: group {g!r} is not declared; added as {title!r}")
        if not it.get("title"): errs.append(f"{where} no title")
        opts = it.get("options", [])
        d = it.get("default")
        if d is not None and not (isinstance(d, int) and 0 <= d < len(opts)): errs.append(f"{where} default must be an option index")
        if d is not None and it.get("reserved"): errs.append(f"{where} a reserved item (outward action, security trade-off, product ruling) cannot have a default")
        rec = [k for k, o in enumerate(opts) if "(recommended)" in o]
        if rec and rec != [0]: errs.append(f"{where} the recommended option must be the first and only one marked")
        # concision
        if len(it.get("title", "")) > LIMITS["title_chars"]: warns.append(f"{where} title over {LIMITS['title_chars']} characters ({len(it['title'])})")
        if sentences(it.get("lead")) > LIMITS["lead_sentences"]: warns.append(f"{where} lead over {LIMITS['lead_sentences']} sentences")
        bl = it.get("bullets", [])
        if len(bl) > LIMITS["bullets"]: warns.append(f"{where} {len(bl)} bullets (at most {LIMITS['bullets']})")
        for b in bl:
            if words(b) > LIMITS["bullet_words"]: warns.append(f"{where} bullet over {LIMITS['bullet_words']} words: {b[:40]}…")
        for o in opts:
            if words(o.replace("(recommended)", "")) > LIMITS["option_words"]: warns.append(f"{where} option over {LIMITS['option_words']} words: {o[:40]}…")
        total = words(it.get("lead")) + sum(words(b) for b in bl) + words(it.get("rec"))
        if total > LIMITS["context_words"]: warns.append(f"{where} context is {total} words (aim under {LIMITS['context_words']})")
        for r in it.get("refs", []):
            if "label" not in r: errs.append(f"{where} a ref has no label")
        if "chain" in it: chain_errs, chain_warns = check_chain(i, k, it["chain"], all_ids); errs += chain_errs; warns += chain_warns
        sb = it.get("superseded_by")
        if sb is not None and (not isinstance(sb, str) or sb == i or sb not in {x.get("id") for x in doc.get("items", [])}):
            errs.append(f"{where} superseded_by {sb!r} is not another item in this file")
        fo = it.get("follows")
        if fo is not None and (not isinstance(fo, str) or fo == i or fo not in {x.get("id") for x in doc.get("items", [])}):
            errs.append(f"{where} follows {fo!r} is not another item in this file")
    # A read item that points at several documents, or at one a decision also cites, owes the reader a chain (REQ-DEC-43, REQ-DEC-44).
    decided_docs = {doc_of(r) for x in doc.get("items", []) if x.get("kind", "decide") == "decide" for r in x.get("refs", []) if r.get("label")}
    for it in doc.get("items", []):
        if it.get("kind") != "read" or it.get("chain") is not None or it.get("superseded_by"): continue
        docs = {doc_of(r) for r in it.get("refs", []) if r.get("label")}
        if len(docs) + len(it.get("spec", [])) > 1 or (docs & decided_docs):
            warns.append(f"{it.get('id', '?')}: read item has no reading chain (it refers to more than one document or informs a decision; add chain, REQ-DEC-43)")
    # A ruling the form has not followed up means it fell behind the chat: every answered decision shows what it produced.
    led = {x["follows"] for x in doc.get("items", []) if isinstance(x.get("follows"), str)}
    for it in doc.get("items", []):
        h = (current or {}).get(it.get("id"))
        if (it.get("kind", "decide") == "decide" and h and not DISCUSS.search(h["choice"]) and not it.get("superseded_by")
                and not it.get("applied") and it.get("id") not in led):
            warns.append(f"{it['id']}: answered with no visible follow-up (set applied, or add an item that follows it)")
    nxt = {x.get("id"): x["superseded_by"] for x in doc.get("items", []) if isinstance(x.get("superseded_by"), str)}
    done = set()
    for start in nxt:
        chain, cur = [], start
        while cur in nxt and cur not in done:
            if cur in chain:
                errs.append("superseded_by cycle: " + " \u2192 ".join(chain[chain.index(cur):] + [cur])); break
            chain.append(cur); cur = nxt[cur]
        done.update(chain)
    return errs, warns

# ---------- rendering ----------
def inline(s):
    """Escape, then `code` and **bold**. Nothing else: items are short on purpose."""
    s = html.escape(s or "", quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    return re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)

def ctx_html(it):
    h = ""
    if it.get("lead"): h += f"<p>{inline(it['lead'])}</p>"
    if it.get("bullets"): h += "<ul>" + "".join(f"<li>{inline(b)}</li>" for b in it["bullets"]) + "</ul>"
    if it.get("rec"): h += f'<p class="rec">Recommended: {inline(it["rec"])}</p>'
    return h

def refs_of(it, form):
    out = []
    for r in it.get("refs", []):
        u = r.get("url")
        out.append({"label": r["label"], "url": u, "peek": r.get("peek", is_peek(u))})
    base = form.get("specBase")  # e.g. "docs/SPEC.html": a rendered spec published next to the form
    for sid in it.get("spec", []):
        if base: out.append({"label": sid, "url": f"{base}#{sid.lower()}", "peek": True})
        else: out.append({"label": f"{form.get('specName', 'SPEC.md')} {sid}", "url": None})
    return out

def is_peek(u): return bool(u and "#" in u and not re.match(r"^[a-z]+:", u))

def chain_of(it, info):
    """A read item's chain for the page: steps with their links. info: item id -> {id, title, section, group, resolved}."""
    labels = {st.get("label") for st in it.get("chain") or []}
    out = []
    for st in it.get("chain") or []:
        u = st.get("url")
        out.append({"label": st["label"], "url": u, "peek": is_peek(u), "why": st.get("why", ""),
                    "before": [{"label": b} if b in labels else {"label": info[b]["title"], "item": info[b]} for b in st.get("before") or []],
                    "for": [info[f] for f in st.get("for") or []]})
    return out

def read_first_of(item_id, items, info):
    """The read items whose chains inform this item: shown on it as 'Read first'."""
    return [info[r["id"]] for r in items if r.get("kind") == "read" and not r.get("superseded_by")
            and any(item_id in (st.get("for") or []) for st in r.get("chain") or [])]

def page_item(it, form):
    return {"id": it["id"], "kind": it.get("kind", "decide"), "section": it["section"], "group": it.get("group"),
            "title": it["title"], "ctx": ctx_html(it), "refs": refs_of(it, form), "options": it.get("options", []),
            "default": it.get("default"), "defaulted": it.get("default") is not None, "blocks": bool(it.get("blocks")),
            "applied": it.get("applied")}

def fingerprint(it):
    keep = {k: it.get(k) for k in ("title", "lead", "bullets", "rec", "options", "default", "refs", "spec")}
    if it.get("chain"): keep["chain"] = it["chain"]  # only when present, so items without one keep their fingerprint
    return hashlib.sha256(json.dumps(keep, sort_keys=True).encode()).hexdigest()[:16]

# ---------- answers ----------
def load_answers(rdir):
    hist = []
    for fn in sorted(glob.glob(os.path.join(rdir, "*.json"))):
        d = json.load(open(fn))
        if isinstance(d, dict):  # the form's export, or a listing whose rows sit under some key
            rows = d.get("responses") or d.get("docs") or d.get("documents") or next(
                (v for v in d.values() if isinstance(v, list) and v and isinstance(v[0], dict)), [])
        else:
            rows = d
        n0 = len(hist)
        for r in rows:
            body = r.get("data", r) if isinstance(r.get("data"), dict) else r
            rid = r.get("id") or r.get("doc_id") or (r.get("path") or "").split("/")[-1] or None
            if rid and (body.get("choice") or body.get("notes")):
                hist.append({"id": rid, "choice": body.get("choice") or "", "notes": body.get("notes") or "",
                             "at": body.get("at") or "", "by": body.get("by") or "", "file": os.path.basename(fn)})
        if len(hist) == n0: print(f"warn: {os.path.basename(fn)} holds no answers; check its shape", file=sys.stderr)
    # the same answer archived twice is one entry
    uniq = {(h["id"], h["choice"], h["notes"], h["at"]): h for h in hist}
    return sorted(uniq.values(), key=lambda h: (h["at"], h["id"]))

def git_commit(path):
    try: return subprocess.run(["git", "-C", path, "rev-parse", "--short", "HEAD"], capture_output=True, text=True, timeout=5).stdout.strip()
    except Exception: return ""

def write_log(path, doc, hist, current, stamp, rdir, sup):
    items = {i["id"]: i for i in doc["items"]}
    lines = [f"# {doc['form'].get('title', 'Decisions')} — log", "",
             f"Generated {stamp} by the decision-form skill from `{os.path.relpath(rdir, os.path.dirname(os.path.abspath(path)))}/`. Do not edit by hand:",
             "every answer ever archived is listed, oldest first. A later answer to the same item supersedes the earlier one.", "",
             "| When | Item | Question | Answer | Notes | By | Status | Applied by |", "|---|---|---|---|---|---|---|---|"]
    cell = lambda s: (s or "").replace("|", "\\|").replace("\n", " ")
    for h in hist:
        it = items.get(h["id"], {})
        status = "current" if current.get(h["id"]) is h else "superseded"
        if status == "current" and DISCUSS.search(h["choice"]): status = "to discuss"
        if h["id"] in sup: status = f"superseded by {sup[h['id']]}"  # the item itself was replaced
        lines.append(f"| {h['at'][:16].replace('T', ' ')} | `{h['id']}` | {cell(it.get('title', '(item removed)'))} | {cell(h['choice'])} | {cell(h['notes'])} | {cell(h['by'] or '—')} | {status} | {cell(it.get('applied') or 'not applied yet')} |")
    open(path, "w").write("\n".join(lines) + "\n")

# ---------- main ----------
def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("questions")
    ap.add_argument("-o", "--out", help="output directory (default: <questions dir>/form)")
    ap.add_argument("--responses", help="archived answers (default: <questions dir>/responses)")
    ap.add_argument("--log", help="decision log (default: <questions dir>/LOG.md)")
    ap.add_argument("--check", action="store_true", help="check the items and stop")
    ap.add_argument("--strict", action="store_true", help="treat style warnings as errors")
    ap.add_argument("--mark-published", action="store_true", help="record what was just published, to mark later changes as new")
    a = ap.parse_args()

    qdir = os.path.dirname(os.path.abspath(a.questions))
    out = a.out or os.path.join(qdir, "form")
    rdir = a.responses or os.path.join(qdir, "responses")
    logp = a.log or os.path.join(qdir, "LOG.md")
    seen_f = os.path.join(out, ".published.json")

    doc = json.load(open(a.questions))
    form = doc.setdefault("form", {})
    form.setdefault("title", "Decisions")
    form.setdefault("slug", re.sub(r"[^a-z0-9]+", "-", form["title"].lower()).strip("-"))
    form.setdefault("collection", "responses")
    form.setdefault("storageKey", form["slug"] + "-answers-v1")

    hist = load_answers(rdir) if os.path.isdir(rdir) else []
    current = {}
    for h in hist: current[h["id"]] = h
    errs, warns = check(doc, qdir, current)
    for w in warns: print("warn:", w, file=sys.stderr)
    for e in errs: print("error:", e, file=sys.stderr)
    if errs or (a.strict and warns): sys.exit(1)
    if a.check: print(f"ok: {len(doc['items'])} items, {len(warns)} warnings"); return

    if a.mark_published:
        os.makedirs(out, exist_ok=True)
        json.dump({i["id"]: fingerprint(i) for i in doc["items"]}, open(seen_f, "w"), indent=1)
        print("marked", len(doc["items"]), "items as published"); return

    ids = {i["id"] for i in doc["items"]}
    stray = sorted(set(current) - ids)
    if stray: print("warn: answers for items not in the questions file:", ", ".join(stray), file=sys.stderr)

    # An item replaced by another (superseded_by) leaves the inbox for the outbox, whatever its answers.
    sup = {i["id"]: i["superseded_by"] for i in doc["items"] if i.get("superseded_by")}
    titles = {i["id"]: i["title"] for i in doc["items"]}
    def resolved(i):
        if i["id"] in sup: return True
        h = current.get(i["id"])
        return bool(h) and not i.get("keep_open") and not DISCUSS.search(h["choice"])
    stitle = {s["id"]: s["title"] for s in doc["sections"]}
    follow = {}  # item id -> the items created by its answer
    for i in doc["items"]:
        if i.get("follows"):
            follow.setdefault(i["follows"], []).append({"id": i["id"], "title": i["title"], "section": i["section"],
                "sectionTitle": stitle[i["section"]], "group": i.get("group"), "resolved": resolved(i)})
    info = {i["id"]: {"id": i["id"], "title": i["title"], "section": i["section"], "group": i.get("group"), "resolved": resolved(i)} for i in doc["items"]}
    def page(i):
        p = page_item(i, form)
        if i.get("chain"): p["chain"] = chain_of(i, info)
        rf = read_first_of(i["id"], doc["items"], info)
        if rf: p["readFirst"] = rf
        return p
    open_items = []
    for i in doc["items"]:
        if resolved(i): continue
        p = page(i); h = current.get(i["id"])
        if h: p["answer"] = {"choice": h["choice"], "notes": h["notes"], "at": h["at"]}  # e.g. "Discuss first", or kept open
        open_items.append(p)
    done = []
    for i in doc["items"]:
        if resolved(i):
            p = page(i); h = current.get(i["id"])
            if h: p["answer"] = {"choice": h["choice"], "notes": h["notes"], "at": h["at"], "by": h["by"]}
            if i["id"] in follow: p["led"] = follow[i["id"]]
            if i["id"] in sup: p["superseded"] = {"id": sup[i["id"]], "title": titles[sup[i["id"]]]}
            done.append(p)

    seen = json.load(open(seen_f)) if os.path.exists(seen_f) else None
    new = [] if seen is None else [i["id"] for i in doc["items"] if seen.get(i["id"]) != fingerprint(i) and not resolved(i)]

    commit = git_commit(qdir)
    now = datetime.datetime.now().astimezone()
    stamp = now.strftime("%a %Y-%m-%d %H:%M %Z") + (f" · commit {commit}" if commit else "")

    # A decision's flow (Pablo, 2026-10-13): context, then the ruling, then the action. Known sections take this order;
    # others keep their place after them. form.sectionOrder = "as-written" keeps the file's order.
    secs = doc["sections"]
    if form.get("sectionOrder") != "as-written":
        rank = {k: n for n, k in enumerate(FLOW)}
        secs = sorted(secs, key=lambda s: (rank.get(s["id"], len(FLOW)), doc["sections"].index(s)))
    sections = [{"id": s["id"], "title": s["title"], "blurb": s.get("blurb", ""), "groups": s.get("groups", [])} for s in secs]
    data = ("const FORM=" + json.dumps({k: v for k, v in form.items() if k != "brand"}) + ";const SECTIONS=" + json.dumps(sections) + ";const ITEMS=" + json.dumps(open_items)
            + ";const RESOLVED=" + json.dumps(done) + ";const NEW=" + json.dumps(new) + ";const STAMP=" + json.dumps(stamp) + ";")
    data = data.replace("</", "<\\/")  # never close the script tag from inside the data
    # The brand goes in before the data, so text in the items can never land in a placeholder.
    page = apply_brand(open(TEMPLATE).read(), brand_blocks(form.get("brand"), qdir))
    page = page.replace("/*__TITLE__*/", html.escape(form["title"])).replace("/*__DATA__*/", data)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "index.html"), "w").write(page)
    write_log(logp, doc, hist, current, stamp, rdir, sup)

    blockers = [i["id"] for i in open_items if i["blocks"]]
    print(f"form: {os.path.relpath(os.path.join(out, 'index.html'))} · {len(open_items)} waiting "
          f"({sum(1 for i in open_items if not i['defaulted'])} open, {sum(1 for i in open_items if i['defaulted'])} with a default) · "
          f"{len(done)} in the outbox · {len(new)} new · {len(warns)} warnings")
    if blockers: print("blocking:", ", ".join(blockers))
    print(f"log: {os.path.relpath(logp)} · {len(hist)} answers archived")

if __name__ == "__main__":
    main()
