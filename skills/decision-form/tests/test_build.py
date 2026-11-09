"""Component tests for build.py, the decision-form builder. Stock Python 3, no packages.

Each test writes a small questions file into a temporary directory, runs build.py as a subprocess (it is a CLI)
and looks at the exit code, the messages and the generated page and log.

    python3 -m unittest discover -s skills/decision-form/tests
"""
import copy, json, os, re, shutil, subprocess, sys, tempfile, unittest

BUILD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts", "build.py")
FLOW = ["read", "decide", "act", "queue", "updates", "later"]


def base_doc():
    """A valid questions file: every flow section, one decide item."""
    return {
        "form": {"title": "Test form"},
        "sections": [{"id": s, "title": s.capitalize()} for s in FLOW],
        "items": [
            {"id": "q1", "section": "decide", "title": "Pick one", "options": ["A (recommended)", "B"]},
        ],
    }


def item(id, section="decide", **kw):
    return {"id": id, "section": section, "title": f"Item {id}", **kw}


SAFE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


class Result:
    def __init__(self, proc, dir):
        self.code, self.out, self.err, self.dir = proc.returncode, proc.stdout, proc.stderr, dir

    def page_data(self, name):
        """The JSON value of `const NAME=...;` in the generated page."""
        html = read(os.path.join(self.dir, "form", "index.html"))
        marker = f"const {name}="
        start = html.index(marker) + len(marker)
        value, _ = json.JSONDecoder().raw_decode(html[start:].replace("<\\/", "</"))
        return value

    def log(self):
        return read(os.path.join(self.dir, "LOG.md"))


class BuildCase(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = tmp.name

    def write(self, rel, text):
        path = os.path.join(self.dir, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        return path

    def run_build(self, doc, *args, answers=None):
        """Write doc as questions.json (and answers as responses/<name>.json) and run build.py on it."""
        qpath = self.write("questions.json", json.dumps(doc))
        for name, rows in (answers or {}).items():
            self.write(f"responses/{name}.json", json.dumps({"responses": rows}))
        proc = subprocess.run([sys.executable, BUILD, qpath, *args], capture_output=True, text=True, timeout=60)
        return Result(proc, self.dir)

    def assertFails(self, res, *needles):
        self.assertEqual(res.code, 1, res.err)
        for n in needles:
            self.assertIn(n, res.err)

    def assertBuilds(self, res):
        self.assertEqual(res.code, 0, res.err)


class TestBasics(BuildCase):
    def test_valid_file_builds_form_and_log(self):
        res = self.run_build(base_doc())
        self.assertBuilds(res)
        self.assertEqual([i["id"] for i in res.page_data("ITEMS")], ["q1"])
        self.assertTrue(os.path.isfile(os.path.join(self.dir, "LOG.md")))

    def test_check_stops_before_building(self):
        res = self.run_build(base_doc(), "--check")
        self.assertBuilds(res)
        self.assertIn("ok: 1 items", res.out)
        self.assertFalse(os.path.exists(os.path.join(self.dir, "form")))


class TestItemRules(BuildCase):
    def test_id_grammar_error(self):
        for bad in ("Bad_ID", "-lead", "has space", "x" * 65):
            with self.subTest(id=bad):
                doc = base_doc()
                doc["items"].append(item(bad))
                self.assertFails(self.run_build(doc, "--check"), "id must be lower case letters")

    def test_valid_ids_accepted(self):
        doc = base_doc()
        doc["items"] += [item("a.b-c9"), item("9lives")]
        self.assertBuilds(self.run_build(doc, "--check"))

    def test_reserved_item_with_default_is_an_error(self):
        doc = base_doc()
        doc["items"].append(item("r1", reserved=True, default=0, options=["Yes", "No"]))
        self.assertFails(self.run_build(doc, "--check"), "r1: a reserved item", "cannot have a default")

    def test_reserved_item_without_default_is_fine(self):
        doc = base_doc()
        doc["items"].append(item("r1", reserved=True, options=["Yes", "No"]))
        self.assertBuilds(self.run_build(doc, "--check"))

    def test_recommended_option_must_be_first(self):
        doc = base_doc()
        doc["items"].append(item("r1", options=["A", "B (recommended)"]))
        self.assertFails(self.run_build(doc, "--check"), "r1: the recommended option must be the first")

    def test_two_recommended_options_is_an_error(self):
        doc = base_doc()
        doc["items"].append(item("r1", options=["A (recommended)", "B (recommended)"]))
        self.assertFails(self.run_build(doc, "--check"), "r1: the recommended option must be the first")

    def test_duplicate_id_and_unknown_section(self):
        doc = base_doc()
        doc["items"] += [item("q1"), item("z", section="nowhere")]
        self.assertFails(self.run_build(doc, "--check"), "q1: id used twice", "z: unknown section")


class TestStyleWarnings(BuildCase):
    def test_long_title_warns_and_strict_fails(self):
        doc = base_doc()
        doc["items"].append(item("long", title="T" * 71))
        res = self.run_build(doc, "--check")
        self.assertBuilds(res)
        self.assertIn("long: title over 70 characters (71)", res.err)
        self.assertFails(self.run_build(doc, "--check", "--strict"), "long: title over 70 characters")

    def test_title_at_the_limit_is_fine(self):
        doc = base_doc()
        doc["items"].append(item("ok", title="T" * 70))
        res = self.run_build(doc, "--check", "--strict")
        self.assertBuilds(res)
        self.assertEqual(res.err, "")

    def test_too_many_bullets_warns(self):
        doc = base_doc()
        doc["items"].append(item("many", bullets=[f"point {n}" for n in range(6)]))
        res = self.run_build(doc, "--check")
        self.assertBuilds(res)
        self.assertIn("many: 6 bullets (at most 5)", res.err)
        self.assertFails(self.run_build(doc, "--check", "--strict"), "many: 6 bullets")

    def test_five_bullets_is_fine(self):
        doc = base_doc()
        doc["items"].append(item("five", bullets=[f"point {n}" for n in range(5)]))
        res = self.run_build(doc, "--check", "--strict")
        self.assertBuilds(res)


class TestSections(BuildCase):
    def section_ids(self, res):
        return [s["id"] for s in res.page_data("SECTIONS")]

    def test_flow_order_wins_over_file_order(self):
        doc = base_doc()
        doc["sections"] = [{"id": s, "title": s} for s in reversed(FLOW)]
        res = self.run_build(doc)
        self.assertBuilds(res)
        self.assertEqual(self.section_ids(res), FLOW)

    def test_unknown_sections_follow_the_known_ones_in_file_order(self):
        doc = base_doc()
        doc["sections"] = [{"id": "zeta", "title": "Z"}, {"id": "later", "title": "L"},
                           {"id": "alpha", "title": "A"}, {"id": "read", "title": "R"}]
        doc["items"] = [item("q1", section="zeta")]
        res = self.run_build(doc)
        self.assertBuilds(res)
        self.assertEqual(self.section_ids(res), ["read", "later", "zeta", "alpha"])

    def test_as_written_keeps_file_order(self):
        doc = base_doc()
        doc["form"]["sectionOrder"] = "as-written"
        doc["sections"] = [{"id": s, "title": s} for s in reversed(FLOW)]
        res = self.run_build(doc)
        self.assertBuilds(res)
        self.assertEqual(self.section_ids(res), list(reversed(FLOW)))

    def test_undeclared_group_is_added_with_a_warning(self):
        doc = base_doc()
        doc["items"][0]["group"] = "my-new-group"
        res = self.run_build(doc)
        self.assertBuilds(res)
        self.assertIn("group 'my-new-group' is not declared; added as 'My new group'", res.err)
        decide = next(s for s in res.page_data("SECTIONS") if s["id"] == "decide")
        self.assertEqual(decide["groups"], [{"id": "my-new-group", "title": "My new group"}])

    def test_declared_group_has_no_warning(self):
        doc = base_doc()
        doc["sections"][1]["groups"] = [{"id": "g", "title": "G"}]
        doc["items"][0]["group"] = "g"
        res = self.run_build(doc, "--check", "--strict")
        self.assertBuilds(res)

    def test_kind_in_the_wrong_section_warns(self):
        doc = base_doc()
        doc["items"].append(item("a1", kind="act"))
        res = self.run_build(doc, "--check")
        self.assertBuilds(res)
        self.assertIn("a1: kind act sits in section 'decide'; it belongs in 'act'", res.err)


class TestSupersededBy(BuildCase):
    def test_superseded_item_moves_to_the_outbox(self):
        doc = base_doc()
        doc["items"] += [item("old", superseded_by="new", options=["A", "B"]), item("new", options=["A", "B"])]
        res = self.run_build(doc)
        self.assertBuilds(res)
        self.assertEqual([i["id"] for i in res.page_data("ITEMS")], ["q1", "new"])
        resolved = {i["id"]: i for i in res.page_data("RESOLVED")}
        self.assertEqual(list(resolved), ["old"])
        self.assertEqual(resolved["old"]["superseded"], {"id": "new", "title": "Item new"})

    def test_superseded_item_shows_in_the_log_even_with_an_answer(self):
        doc = base_doc()
        doc["items"] += [item("old", superseded_by="new", options=["A", "B"]), item("new", options=["A", "B"])]
        answers = {"a": [{"id": "old", "choice": "A", "notes": "", "at": "2026-01-01T10:00:00Z"}]}
        res = self.run_build(doc, answers=answers)
        self.assertBuilds(res)
        self.assertIn("superseded by new", res.log())

    def test_unknown_id_is_an_error(self):
        doc = base_doc()
        doc["items"][0]["superseded_by"] = "ghost"
        self.assertFails(self.run_build(doc, "--check"), "q1: superseded_by 'ghost' is not another item")

    def test_self_reference_is_an_error(self):
        doc = base_doc()
        doc["items"][0]["superseded_by"] = "q1"
        self.assertFails(self.run_build(doc, "--check"), "superseded_by 'q1' is not another item")

    def test_cycle_is_an_error(self):
        doc = base_doc()
        doc["items"] += [item("a", superseded_by="b"), item("b", superseded_by="c"), item("c", superseded_by="a")]
        res = self.run_build(doc, "--check")
        self.assertFails(res, "superseded_by cycle:")
        self.assertIn("a → b → c → a", res.err)


class TestFollows(BuildCase):
    ANSWER = {"a": [{"id": "q1", "choice": "A (recommended)", "notes": "", "at": "2026-01-01T10:00:00Z"}]}

    def test_unknown_id_is_an_error(self):
        doc = base_doc()
        doc["items"].append(item("f", section="act", kind="act", follows="ghost"))
        self.assertFails(self.run_build(doc, "--check"), "f: follows 'ghost' is not another item")

    def test_answered_decision_without_follow_up_warns(self):
        res = self.run_build(base_doc(), "--check", answers=self.ANSWER)
        self.assertBuilds(res)
        self.assertIn("q1: answered with no visible follow-up", res.err)
        self.assertFails(self.run_build(base_doc(), "--check", "--strict", answers=self.ANSWER), "no visible follow-up")

    def test_applied_silences_the_warning(self):
        doc = base_doc()
        doc["items"][0]["applied"] = "commit abc123"
        res = self.run_build(doc, "--check", "--strict", answers=self.ANSWER)
        self.assertBuilds(res)

    def test_a_follower_silences_the_warning(self):
        doc = base_doc()
        doc["items"].append(item("next", section="act", kind="act", follows="q1"))
        res = self.run_build(doc, "--check", "--strict", answers=self.ANSWER)
        self.assertBuilds(res)

    def test_follower_is_listed_on_the_resolved_item(self):
        doc = base_doc()
        doc["items"].append(item("next", section="act", kind="act", follows="q1"))
        res = self.run_build(doc, answers=self.ANSWER)
        self.assertBuilds(res)
        resolved = {i["id"]: i for i in res.page_data("RESOLVED")}
        self.assertEqual([x["id"] for x in resolved["q1"]["led"]], ["next"])

    def test_discuss_first_needs_no_follow_up(self):
        answers = {"a": [{"id": "q1", "choice": "Discuss first", "notes": "", "at": "2026-01-01T10:00:00Z"}]}
        res = self.run_build(base_doc(), "--check", "--strict", answers=answers)
        self.assertBuilds(res)


class TestAnswersArchive(BuildCase):
    def doc(self):
        doc = base_doc()
        doc["items"][0]["applied"] = "done"
        doc["items"].append(item("q2", options=["X", "Y"], applied="done"))
        return doc

    def test_latest_answer_wins_and_log_lists_the_superseded_one(self):
        answers = {
            "2026-01-01-first": [{"id": "q1", "choice": "A (recommended)", "notes": "first", "at": "2026-01-01T10:00:00Z"}],
            "2026-01-02-second": [{"id": "q1", "choice": "B", "notes": "second", "at": "2026-01-02T10:00:00Z"}],
        }
        res = self.run_build(self.doc(), answers=answers)
        self.assertBuilds(res)
        resolved = {i["id"]: i for i in res.page_data("RESOLVED")}
        self.assertEqual(resolved["q1"]["answer"]["choice"], "B")
        rows = {("current" if "| current |" in l else "superseded"): l for l in res.log().splitlines() if "`q1`" in l}
        self.assertIn("A (recommended)", rows["superseded"])
        self.assertIn("first", rows["superseded"])
        self.assertIn("| B |", rows["current"])
        self.assertEqual(len([l for l in res.log().splitlines() if "`q1`" in l]), 2)

    def test_latest_is_by_timestamp_not_by_file_name(self):
        answers = {
            "zzz-old": [{"id": "q1", "choice": "A (recommended)", "notes": "", "at": "2026-01-01T10:00:00Z"}],
            "aaa-new": [{"id": "q1", "choice": "B", "notes": "", "at": "2026-02-01T10:00:00Z"}],
        }
        res = self.run_build(self.doc(), answers=answers)
        self.assertBuilds(res)
        resolved = {i["id"]: i for i in res.page_data("RESOLVED")}
        self.assertEqual(resolved["q1"]["answer"]["choice"], "B")

    def test_the_same_answer_archived_twice_is_one_entry(self):
        row = {"id": "q1", "choice": "B", "notes": "", "at": "2026-01-01T10:00:00Z"}
        res = self.run_build(self.doc(), answers={"one": [row], "two": [row]})
        self.assertBuilds(res)
        self.assertEqual(len([l for l in res.log().splitlines() if "`q1`" in l]), 1)

    def test_discuss_first_stays_open(self):
        answers = {"a": [{"id": "q1", "choice": "Discuss first", "notes": "talk", "at": "2026-01-01T10:00:00Z"}]}
        res = self.run_build(self.doc(), answers=answers)
        self.assertBuilds(res)
        open_items = {i["id"]: i for i in res.page_data("ITEMS")}
        self.assertIn("q1", open_items)
        self.assertEqual(open_items["q1"]["answer"]["choice"], "Discuss first")
        self.assertNotIn("q1", {i["id"] for i in res.page_data("RESOLVED")})
        self.assertIn("to discuss", res.log())

    def test_a_later_real_answer_closes_a_discuss_first(self):
        answers = {
            "a": [{"id": "q1", "choice": "Discuss first", "notes": "", "at": "2026-01-01T10:00:00Z"}],
            "b": [{"id": "q1", "choice": "B", "notes": "", "at": "2026-01-02T10:00:00Z"}],
        }
        res = self.run_build(self.doc(), answers=answers)
        self.assertBuilds(res)
        self.assertNotIn("q1", {i["id"] for i in res.page_data("ITEMS")})

    def test_answers_for_removed_items_warn(self):
        answers = {"a": [{"id": "gone", "choice": "A", "notes": "", "at": "2026-01-01T10:00:00Z"}]}
        res = self.run_build(self.doc(), answers=answers)
        self.assertBuilds(res)
        self.assertIn("answers for items not in the questions file: gone", res.err)


class TestBrand(BuildCase):
    def doc_with(self, brand):
        doc = base_doc()
        doc["form"]["brand"] = brand
        return doc

    def test_valid_brand_builds_into_the_page(self):
        self.write("logo.svg", SAFE_SVG)
        brand = {"fontsUrl": "https://fonts.googleapis.com/css2?family=Inter",
                 "fonts": {"body": "Inter, system-ui, sans-serif", "mono": "'JetBrains Mono', monospace"},
                 "light": {"accent": "#0a7", "bg": "#ffffff"}, "dark": {"accent": "#2bd", "bg": "#000000cc"},
                 "logo": "logo.svg"}
        res = self.run_build(self.doc_with(brand))
        self.assertBuilds(res)
        page = read(os.path.join(self.dir, "form", "index.html"))
        self.assertIn("--accent:#0a7;", page)
        self.assertIn("--f-body:Inter, system-ui, sans-serif;", page)
        self.assertIn('class="bl-light"', page)

    def test_bad_hex_is_an_error(self):
        for bad in ("red", "#12", "#gggggg", "0a7", "#0a7; color:red"):
            with self.subTest(colour=bad):
                res = self.run_build(self.doc_with({"light": {"accent": bad}}), "--check")
                self.assertFails(res, "form.brand.light.accent must be a hex colour")

    def test_unknown_token_is_an_error(self):
        res = self.run_build(self.doc_with({"dark": {"sparkle": "#fff"}}), "--check")
        self.assertFails(res, "form.brand.dark: unknown key 'sparkle'")

    def test_bad_font_stack_is_an_error(self):
        for bad in ("Inter; } body { display:none", "url(http://x/y.woff)", "Inter /* c */", "<b>x</b>", "a\\b", "@import x", ""):
            with self.subTest(font=bad):
                res = self.run_build(self.doc_with({"fonts": {"body": bad}}), "--check")
                self.assertFails(res, "form.brand.fonts.body must be a CSS font-family list")

    def test_unknown_font_slot_and_bad_fonts_url(self):
        res = self.run_build(self.doc_with({"fonts": {"title": "Inter"}, "fontsUrl": "https://evil.example/x.css"}), "--check")
        self.assertFails(res, "form.brand.fonts: unknown key 'title'", "form.brand.fontsUrl must start with")

    def test_unknown_brand_key_is_an_error(self):
        res = self.run_build(self.doc_with({"banner": "x"}), "--check")
        self.assertFails(res, "form.brand: unknown key 'banner'")

    def test_missing_logo_and_wrong_extension(self):
        res = self.run_build(self.doc_with({"logo": "nope.svg"}), "--check")
        self.assertFails(res, "'nope.svg' not found")
        res = self.run_build(self.doc_with({"logo": "logo.png"}), "--check")
        self.assertFails(res, "'logo.png' is not an .svg")

    def test_unsafe_svg_is_rejected_at_build_time(self):
        unsafe = {
            "script": '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            "handler": '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
            "foreignObject": '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject></foreignObject></svg>',
            "javascript url": '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"/></svg>',
            "character reference": '<svg xmlns="http://www.w3.org/2000/svg"><a href="&#106;avascript:x"/></svg>',
        }
        for name, svg in unsafe.items():
            with self.subTest(case=name):
                self.write("logo.svg", svg)
                res = self.run_build(self.doc_with({"logo": "logo.svg"}))
                self.assertFails(res, "unsafe SVG content")
                self.assertFalse(os.path.exists(os.path.join(self.dir, "form", "index.html")))


class TestReadingChain(BuildCase):
    def read_item(self, chain, **kw):
        return item("r1", section="read", kind="read", chain=chain, **kw)

    def step(self, label, **kw):
        return {"label": label, "why": "Because it helps.", "before": [], **kw}

    def test_one_step_chain_warns(self):
        doc = base_doc()
        doc["items"].append(self.read_item([self.step("Only")]))
        res = self.run_build(doc, "--check")
        self.assertBuilds(res)
        self.assertIn("r1: reading chain has one step only", res.err)
        self.assertFails(self.run_build(doc, "--check", "--strict"), "reading chain has one step only")

    def test_two_step_chain_is_clean(self):
        doc = base_doc()
        doc["items"].append(self.read_item([self.step("First"), self.step("Second", before=["First"], **{"for": ["q1"]})]))
        res = self.run_build(doc, "--check", "--strict")
        self.assertBuilds(res)

    def test_for_id_must_exist(self):
        doc = base_doc()
        doc["items"].append(self.read_item([self.step("First"), self.step("Second", before=["First"], **{"for": ["ghost"]})]))
        self.assertFails(self.run_build(doc, "--check"), "r1: chain step 2: for 'ghost' is not another item")

    def test_for_cannot_point_at_the_item_itself(self):
        doc = base_doc()
        doc["items"].append(self.read_item([self.step("First", **{"for": ["r1"]}), self.step("Second", before=["First"])]))
        self.assertFails(self.run_build(doc, "--check"), "for 'r1' is not another item")

    def test_before_must_name_an_earlier_step_or_item(self):
        doc = base_doc()
        doc["items"].append(self.read_item([self.step("First"), self.step("Second", before=["Third"])]))
        self.assertFails(self.run_build(doc, "--check"), "before 'Third' is not an earlier step or another item")

    def test_chain_on_a_non_read_item_is_an_error(self):
        doc = base_doc()
        doc["items"][0]["chain"] = [self.step("A"), self.step("B", before=["A"])]
        self.assertFails(self.run_build(doc, "--check"), "q1: chain belongs on a read item")

    def test_the_read_first_list_reaches_the_decision(self):
        doc = base_doc()
        doc["items"].append(self.read_item([self.step("First"), self.step("Second", before=["First"], **{"for": ["q1"]})]))
        res = self.run_build(doc)
        self.assertBuilds(res)
        q1 = next(i for i in res.page_data("ITEMS") if i["id"] == "q1")
        self.assertEqual([r["id"] for r in q1["readFirst"]], ["r1"])

    def test_read_item_with_two_documents_and_no_chain_warns(self):
        doc = base_doc()
        doc["items"].append(item("r2", section="read", kind="read",
                                 refs=[{"label": "A", "url": "a.md"}, {"label": "B", "url": "b.md"}]))
        res = self.run_build(doc, "--check")
        self.assertBuilds(res)
        self.assertIn("r2: read item has no reading chain", res.err)


if __name__ == "__main__":
    unittest.main()


def main_script(html):
    """The page's main <script> body (the last one: the data and the code)."""
    blocks = re.findall(r"<script>(.*?)</script>", html, re.S)
    assert blocks, "no <script> in the page"
    return blocks[-1]


class TestPage(BuildCase):
    """The built page keeps its promises: it parses, never re-renders on a snapshot, survives a republish, shows live content."""

    def page(self, doc=None):
        res = self.run_build(doc or base_doc())
        self.assertBuilds(res)
        return res, read(os.path.join(self.dir, "form", "index.html"))

    def test_main_script_is_valid_javascript(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node is not installed")
        _, html = self.page()
        js = os.path.join(self.dir, "main.js")
        with open(js, "w", encoding="utf-8") as f:
            f.write(main_script(html))
        proc = subprocess.run([node, "--check", js], capture_output=True, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_page_registers_hot_state_and_boots_through_ready(self):
        _, html = self.page()
        js = main_script(html)
        self.assertIn("window.claude?.hot?.snapshot?.(hotState)", js)
        self.assertIn("window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {})", js)
        self.assertNotIn("setInterval", js)  # no polling

    def test_page_subscribes_to_the_live_collection(self):
        _, html = self.page()
        js = main_script(html)
        self.assertIn("db.collection(FORM.live || 'live').onSnapshot", js)
        self.assertIn("live-queue", js)
        self.assertIn("live-notice", html)
        self.assertIn("Live queue", js)

    def test_snapshot_handler_never_re_renders(self):
        _, html = self.page()
        js = main_script(html)
        handler = js[js.index("col.onSnapshot("):js.index("// The live documents")]
        self.assertNotIn("go(", handler)
        self.assertIn("updateCard", handler)

    def test_live_collection_defaults_and_overrides(self):
        res, _ = self.page()
        self.assertEqual(res.page_data("FORM")["live"], "live")
        doc = base_doc()
        doc["form"]["live"] = "progress"
        res, _ = self.page(doc)
        self.assertEqual(res.page_data("FORM")["live"], "progress")

    def test_live_collection_must_differ_from_the_answers(self):
        doc = base_doc()
        doc["form"]["live"] = doc["form"]["collection"] = "same"
        self.assertFails(self.run_build(doc, "--check"), "form.live must differ")
        doc = base_doc()
        doc["form"]["live"] = "bad name!"
        self.assertFails(self.run_build(doc, "--check"), "form.live must be a collection name")

    def queue_js(self, expr):
        """Run `expr` against the page's real queue code (esc, liveWhen, qState, queueGroups, queueHtml) in node; returns the JSON result."""
        node = shutil.which("node")
        if not node:
            self.skipTest("node is not installed")
        _, html = self.page()
        js = main_script(html)
        esc = js[js.index("function esc("):].split("\n", 1)[0]
        code = js[js.index("function liveWhen"):js.index("function renderQueue")]
        path = os.path.join(self.dir, "queue.js")
        with open(path, "w", encoding="utf-8") as f:
            f.write(esc + "\n" + code + "\nconsole.log(JSON.stringify(" + expr + "))")
        proc = subprocess.run([node, path], capture_output=True, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_queue_states_normalise_free_text_status(self):
        cases = {"Doing": "running", "in progress": "running", "NOW": "running", "queued": "next", "todo": "next", "planned": "next",
                 "pending": "next", "": "next", "whatever": "next", "blocked": "blocked", "failed": "blocked",
                 "cancelled": "blocked", "stopped": "blocked", "done": "done", "Shipped": "done", "needs you": "needs",
                 "ready for review": "review", "waiting on legal": "waiting", "on hold": "held", "held": "held"}
        got = self.queue_js("Object.fromEntries(%s.map(s => [s, qState(s)]))" % json.dumps(list(cases)))
        for status, state in cases.items():
            self.assertEqual(got[status], state, status)
        self.assertEqual(self.queue_js("[qState(undefined), qState(null)]"), ["next", "next"])

    def test_queue_sections_in_fixed_order_with_labels_and_counts(self):
        items = [{"title": "a", "status": "done"}, {"title": "b", "status": "blocked"}, {"title": "c", "status": "doing"},
                 {"title": "d", "status": "doing"}, {"title": "e"}, {"title": "f", "status": "needs you"}, {"title": "g", "status": "held"}]
        h = self.queue_js("queueHtml({items: %s})" % json.dumps(items))
        heads = re.findall(r"<h4>(.*?)</h4>", h)
        self.assertEqual(heads, ["Needs you (1)", "Running now (2)", "Next (1)", "Blocked (1)", "Held on purpose (1)", "Done recently (1)"])
        self.assertIn("<h2>Live queue</h2>", h)
        self.assertIn("This card updates by itself.", h)
        self.assertNotIn("<h3>", h)  # no group: no heading, and a single bare card
        self.assertEqual(h.count('class="lqg bare"'), 1)

    def test_queue_groups_in_order_of_first_appearance_ungrouped_without_heading(self):
        items = [{"title": "a", "group": "M-3"}, {"title": "b"}, {"title": "c", "group": "M-1", "status": "doing"}, {"title": "d", "group": "M-3", "status": "doing"}]
        h = self.queue_js("queueHtml({items: %s})" % json.dumps(items))
        self.assertEqual(re.findall(r"<h3>(.*?)<span>", h), ["M-3", "M-1"])
        self.assertEqual(h.count("<section"), 3)
        self.assertNotIn("bare", h)
        self.assertIn("<span>1 running · 1 next</span>", h)
        self.assertLess(h.index("M-3"), h.index(">b</b>"))
        self.assertLess(h.index(">b</b>"), h.index("M-1"))

    def test_queue_hides_done_items_older_than_48_hours(self):
        items = [{"title": "old", "status": "done", "at": "2026-10-20T10:00:00Z"}, {"title": "fresh", "status": "done", "at": "2026-10-26T10:00:00Z"},
                 {"title": "undated", "status": "shipped"}, {"title": "oldrun", "status": "doing", "at": "2026-10-01T00:00:00Z"}]
        h = self.queue_js("queueHtml({items: %s, at: '2026-10-27T10:00:00Z'})" % json.dumps(items))
        self.assertNotIn(">old</b>", h)
        for kept in ("fresh", "undated", "oldrun"):
            self.assertIn(">%s</b>" % kept, h)
        self.assertEqual(self.queue_js("queueHtml({items: %s, at: '2026-10-27T10:00:00Z'})" % json.dumps(items[:1])), "")
        self.assertEqual(self.queue_js("queueHtml({items: []})"), "")

    def test_queue_escapes_all_text(self):
        items = [{"title": "<img src=x>", "status": "doing", "note": "<u>n</u>", "group": "<i>g</i>"}]
        h = self.queue_js("queueHtml({items: %s})" % json.dumps(items))
        for raw in ("<img", "<i>", "<u>"):
            self.assertNotIn(raw, h)
        self.assertIn("&lt;img src=x&gt;", h)

    def test_queue_card_updates_in_place_and_leaves_with_the_tab(self):
        _, html = self.page()
        js = main_script(html)
        fn = js[js.index("function renderQueue"):]
        fn = fn[:fn.index("\n}\n")]
        self.assertIn("box.innerHTML = h; return", fn)  # in place, no re-render of the view
        self.assertNotIn("go(", fn)
        self.assertIn("cur === 'queue'", fn)
        self.assertIn("box.remove()", fn)
        self.assertIn("border-left:3px solid var(--c)", html)


class TestRelativeUrls(BuildCase):
    """Every relative URL opens in place; the build lists the files to publish beside the form and warns about missing ones."""

    def refs_doc(self, urls, **ref_kw):
        doc = base_doc()
        doc["items"][0]["refs"] = [{"label": f"r{n}", "url": u, **ref_kw.get(u, {})} for n, u in enumerate(urls)]
        return doc

    def peeks(self, doc):
        res = self.run_build(doc)
        self.assertBuilds(res)
        return res, {r["url"]: r["peek"] for r in res.page_data("ITEMS")[0]["refs"]}

    def test_every_relative_url_peeks_with_or_without_an_anchor(self):
        urls = ["docs/a.html#x", "docs/a.html", "../up.html", "https://example.com/a#b", "HTTP://EXAMPLE.COM/a", "mailto:a@b.c",
                "//cdn.example.com/a.html", "/root/a.html", "#x", "ftp:x"]
        _, got = self.peeks(self.refs_doc(urls))
        self.assertEqual([u for u in urls if got[u]], ["docs/a.html#x", "docs/a.html", "../up.html"])

    def test_explicit_peek_on_a_ref_wins_either_way(self):
        _, got = self.peeks(self.refs_doc(["docs/a.html", "https://example.com/a"], **{"docs/a.html": {"peek": False}, "https://example.com/a": {"peek": True}}))
        self.assertEqual(got, {"docs/a.html": False, "https://example.com/a": True})

    def chain_doc(self, **step_kw):
        doc = base_doc()
        doc["items"] = [item("rd", "read", kind="read", chain=[
            {"label": "One", "url": "docs/one.html", "why": "first", "before": [], **step_kw.get("one", {})},
            {"label": "Two", "url": "https://example.com/two", "why": "second", "before": ["One"], **step_kw.get("two", {})},
            {"label": "Three", "url": "docs/three.html#s", "why": "third", "before": ["One"], **step_kw.get("three", {})}])]
        return doc

    def test_chain_steps_peek_like_refs_and_honour_an_explicit_peek(self):
        res = self.run_build(self.chain_doc())
        self.assertBuilds(res)
        self.assertEqual([s["peek"] for s in res.page_data("ITEMS")[0]["chain"]], [True, False, True])
        res = self.run_build(self.chain_doc(one={"peek": False}, two={"peek": True}))
        self.assertBuilds(res)
        self.assertEqual([s["peek"] for s in res.page_data("ITEMS")[0]["chain"]], [False, True, True])
        self.assertFails(self.run_build(self.chain_doc(one={"peek": "yes"}), "--check"), "chain step 1: peek must be true or false")

    def test_root_relative_urls_warn(self):
        doc = self.refs_doc(["/docs/a.html", "//cdn.example.com/a.html", "docs/b.html"])
        doc["items"] += [item("rd", "read", kind="read", chain=[
            {"label": "One", "url": "/docs/one.html", "why": "first", "before": []},
            {"label": "Two", "url": "docs/two.html", "why": "second", "before": ["One"]}])]
        doc["form"]["specBase"] = "/docs/SPEC.html"
        res = self.run_build(doc, "--check")
        self.assertBuilds(res)
        for needle in ("q1: ref url '/docs/a.html' starts with '/'", "rd: chain step 1: url '/docs/one.html' starts with '/'", "form.specBase '/docs/SPEC.html' starts with '/'"):
            self.assertIn(needle, res.err)
        self.assertEqual(res.err.count("starts with '/'"), 3)  # not the protocol-relative one, nor the relative ones
        self.assertFails(self.run_build(doc, "--check", "--strict"), "starts with '/'")

    def test_the_build_lists_the_files_to_publish_beside_the_form(self):
        doc = self.refs_doc(["docs/b.html#x", "docs/a.html", "docs/a.html#y", "https://example.com/z", "#top", "docs/skip.html"], **{"docs/skip.html": {"peek": False}})
        doc["items"] += [item("rd", "read", kind="read", chain=[
            {"label": "One", "url": "docs/c.html#s", "why": "first", "before": []},
            {"label": "Two", "url": "docs/a.html", "why": "second", "before": ["One"]}]), item("q2", spec=["OQ-1"])]
        doc["form"]["specBase"] = "docs/SPEC.html"
        res = self.run_build(doc)
        self.assertBuilds(res)
        self.assertIn("publish beside the form: docs/SPEC.html, docs/a.html, docs/b.html, docs/c.html\n", res.out)
        del doc["items"][-1]["spec"]  # no item cites the spec: specBase is not needed
        res = self.run_build(doc)
        self.assertNotIn("SPEC.html", res.out)
        self.assertNotIn("publish beside", self.run_build(base_doc()).out)

    def test_a_file_that_is_not_beside_the_form_is_a_warning(self):
        doc = self.refs_doc(["docs/a.html#x", "docs/gone%20too.html", "../up.html"])
        res = self.run_build(doc)
        self.assertBuilds(res)
        self.assertIn("warn: docs/a.html: not found next to the built index.html", res.err)
        self.assertIn("warn: docs/gone%20too.html: not found", res.err)
        self.assertIn("warn: ../up.html: lies above the form", res.err)
        self.assertFails(self.run_build(doc, "--strict"), "docs/a.html: not found")
        self.write("form/docs/a.html", "<h1 id=x>x</h1>")
        self.write("form/docs/gone too.html", "<p>ok</p>")
        res = self.run_build(self.refs_doc(["docs/a.html#x", "docs/gone%20too.html"]), "--strict")
        self.assertBuilds(res)
        self.assertNotIn("warn:", res.err)

    def test_check_alone_does_not_look_for_the_files(self):
        res = self.run_build(self.refs_doc(["docs/a.html"]), "--check", "--strict")
        self.assertBuilds(res)
        self.assertIn("0 warnings", res.out)


class TestPeek(BuildCase):
    """The in-place viewer: no link leaves the form, documents keep their styles, their scripts never run."""

    def page(self):
        res = self.run_build(self.refs_doc())
        self.assertBuilds(res)
        return res, read(os.path.join(self.dir, "form", "index.html"))

    def refs_doc(self):
        doc = base_doc()
        doc["items"][0]["refs"] = [{"label": "Spec", "url": "docs/SPEC.html"}, {"label": "Web", "url": "https://example.com/a"}]
        return doc

    def peek_js(self, expr):
        """Run `expr` against the page's pure peek helpers (isRel, resolveRel, safeDecode, unpin, settleMedia, scopeCss) in node."""
        node = shutil.which("node")
        if not node:
            self.skipTest("node is not installed")
        _, html = self.page()
        js = main_script(html)
        code = js[js.index("// --- peek: helpers"):js.index("// --- peek: dialog")]
        path = os.path.join(self.dir, "peek.js")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code + "\nconsole.log(JSON.stringify(" + expr + "))")
        proc = subprocess.run([node, path], capture_output=True, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_table_cells_do_not_collapse_to_one_letter_per_line(self):
        _, html = self.page()
        self.assertIn(":where(.peek-doc th,.peek-doc td){overflow-wrap:break-word;word-break:normal;min-width:9ch}", html)

    def test_a_document_that_needs_its_scripts_says_so(self):
        _, html = self.page()
        self.assertIn("scripted = !!doc.querySelector('script')", html)
        self.assertIn("needs its own scripts to show", html)

    def test_no_link_to_the_full_page_and_no_plain_link_for_a_relative_url(self):
        res, html = self.page()
        self.assertNotIn("Open the full page", html)
        self.assertNotIn("Open the full page instead", html)
        self.assertNotIn(".dlg-head a", html)
        self.assertIn('<span id="peek-title"></span>', html)
        refs = res.page_data("ITEMS")[0]["refs"]
        self.assertEqual([(r["label"], r["peek"]) for r in refs], [("Spec", True), ("Web", False)])
        js = main_script(html)
        link = js[js.index("function refLink"):js.index("function refsHtml")]
        self.assertLess(link.index("x.peek"), link.index("<a href"))  # the plain link is only for what does not peek
        self.assertIn("Could not load ' + safeDecode(path) + '. Its file may not be published with this form.", js)
        self.assertNotIn("Open the full page instead", js)

    def test_dialog_has_a_whole_document_button_shown_only_for_a_section(self):
        _, html = self.page()
        self.assertIn('<button type="button" id="peek-whole" hidden>Whole document</button>', html)
        js = main_script(html)
        self.assertIn("document.getElementById('peek-whole').hidden = !hit", js)
        self.assertIn("The section \"' + id + '\" was not found in this document. Showing the whole document.", js)

    def test_document_is_shown_in_a_shadow_root_without_scripts_or_handlers(self):
        _, html = self.page()
        js = main_script(html)
        self.assertIn("attachShadow({ mode: 'open' })", js)
        self.assertIn("querySelectorAll('script,style,link,iframe,object,embed').forEach(n => n.remove())", js)
        self.assertIn("/^on/i.test(a.name)", js)
        self.assertIn("javascript:", js)
        self.assertIn("addEventListener('submit', e => e.preventDefault())", js)
        self.assertIn("setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener')", js)
        self.assertNotIn("innerHTML = doc", js)
        self.assertNotIn("eval(", js)

    def test_is_rel_matches_the_builders_is_peek(self):
        urls = ["docs/a.html", "docs/a.html#x", "../up.html", "a.html", "https://x.org/a", "HTTP://X.ORG", "mailto:a@b.c", "//x.org/a", "/x", "#x", "", "  docs/a.html ", "ftp:x"]
        got = self.peek_js("%s.map(isRel)" % json.dumps(urls))
        want = [True, True, True, True, False, False, False, False, False, False, False, True, False]
        self.assertEqual(got, want)
        import importlib.util
        spec = importlib.util.spec_from_file_location("decision_form_build", BUILD)
        build = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(build)
        for u, w in zip(urls, want):
            if u == u.strip():  # the page trims what a document's href carries; the builder takes the authored URL as it is
                self.assertEqual(build.is_peek(u), w, u)

    def test_relative_links_resolve_against_the_current_document(self):
        cases = [("b.html", "docs/a.html"), ("../b.html#y", "docs/a.html"), ("./c/d.html?q=1#z", "docs/a.html"), ("../../x.html", "docs/a.html"),
                 ("docs/b.html#s", "a.html"), ("sub/b.html", "docs/deep/a.html"), ("../b.html", "docs/deep/a.html"), ("%C3%A9.html#%C3%A9", "a.html")]
        got = self.peek_js("%s.map(([h, f]) => resolveRel(h, f))" % json.dumps(cases))
        self.assertEqual(got, ["docs/b.html", "b.html#y", "docs/c/d.html?q=1#z", "x.html", "docs/b.html#s", "docs/deep/sub/b.html", "docs/b.html", "%C3%A9.html#%C3%A9"])

    def test_anchors_decode_safely(self):
        got = self.peek_js("['caf%C3%A9', 'a%20b', '100%', '%E0%A4%A', 'plain', ''].map(safeDecode)")
        self.assertEqual(got, ["caf\u00e9", "a b", "100%", "%E0%A4%A", "plain", ""])

    def test_scope_css_maps_root_html_and_body_to_the_shadow_root(self):
        cases = {
            ":root{--a:1}": ":host{--a:1}",
            ':root[data-theme="dark"]{--a:2}': ':host([data-theme="dark"]){--a:2}',
            '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--a:2}}': '@media (prefers-color-scheme:dark){:host(:not([data-theme="light"])){--a:2}}',
            ':root:not([data-theme="light"]) .logo{x:1}': ':host(:not([data-theme="light"])) .logo{x:1}',
            "html{scroll-padding-top:12px}": ":host{scroll-padding-top:12px}",
            "body{margin:0;font:17px var(--f-body)}": ".peek-doc{margin:0;font:17px var(--f-body)}",
            "html,body{margin:0}": ":host,.peek-doc{margin:0}",
            "body > main h2, body.dark a{x:1}": ".peek-doc > main h2, .peek-doc.dark a{x:1}",
            "html body{x:1}": ":host .peek-doc{x:1}",
            "ROOT{x:1}": "ROOT{x:1}",
            ":ROOT{x:1}": ":host{x:1}",
        }
        got = self.peek_js("%s.map(c => scopeCss(c))" % json.dumps(list(cases)))
        for (src, want), have in zip(cases.items(), got):
            self.assertEqual(have, want, src)

    def test_scope_css_leaves_other_text_alone(self):
        same = ['a[href$=".html"],a[title="a html b"]{x:1}', ".body,.html,#body,htmlx,bodyguard{x:1}", "@keyframes k{from{o:0}to{o:1}}",
                "@font-face{font-family:x;src:url(data:a;b)}", ".x{font:var(--f-body);background-position:fixed}", "*{box-sizing:border-box}"]
        self.assertEqual(self.peek_js("%s.map(c => scopeCss(c))" % json.dumps(same)), same)
        self.assertEqual(self.peek_js("scopeCss('/* html{} */ @import url(x.css); body{a:b}')").strip(), ".peek-doc{a:b}")

    def test_scope_css_takes_fixed_and_sticky_elements_back_into_the_flow(self):
        got = self.peek_js("scopeCss('.rail{position:sticky;top:0}.bar{position: fixed !important}.o{position:absolute}.p{position:-webkit-sticky}')")
        self.assertEqual(got, ".rail{position:static!important;top:0}.bar{position:static!important}.o{position:absolute}.p{position:static!important}")
        self.assertEqual(self.peek_js("unpin('position:fixed;inset:0')"), "position:static!important;inset:0")

    def test_scope_css_settles_width_queries_for_a_dialog_of_at_most_720px(self):
        got = self.peek_js("scopeCss('@media (max-width:900px){.page{display:block}}@media (min-width: 900px){.page{display:grid}}@media (max-width:600px){.a{x:1}}@media (min-width:640px){.b{x:1}}')")
        self.assertEqual(got, "@media (min-width:0px){.page{display:block}}@media (max-width:0px){.page{display:grid}}@media (max-width:600px){.a{x:1}}@media (min-width:640px){.b{x:1}}")



class TestOtherOption(BuildCase):
    """Every closed set of options ends with "Other (in notes)" (Pablo, 2026-11-08); "Discuss first" is not a way out."""

    def options(self, opts):
        doc = base_doc()
        doc["items"][0]["options"] = opts
        res = self.run_build(doc)
        self.assertBuilds(res)
        return res.page_data("ITEMS")[0]["options"]

    def test_appended_after_discuss_first(self):
        self.assertEqual(self.options(["A (recommended)", "B", "Discuss first"]),
                         ["A (recommended)", "B", "Discuss first", "Other (in notes)"])

    def test_not_doubled_when_an_option_already_says_other(self):
        self.assertEqual(self.options(["A (recommended)", "Something other"]), ["A (recommended)", "Something other"])

    def test_free_text_items_get_none(self):
        self.assertEqual(self.options([]), [])


class TestSaveAndOrder(BuildCase):
    """Save behaviour (retry, one write at a time, local-newer sent, cache is not the account's word) and R37 card order."""

    def page(self):
        res = self.run_build(base_doc())
        self.assertBuilds(res)
        return main_script(read(os.path.join(self.dir, "form", "index.html")))

    def helpers(self, expr):
        """Run `expr` against the page's pure save/order helpers (nextAt, newerLocal, stackOrder, settlePlan) in node."""
        node = shutil.which("node")
        if not node:
            self.skipTest("node is not installed")
        js = self.page()
        code = js[js.index("// --- save: helpers"):js.index("// --- save: end")]
        path = os.path.join(self.dir, "save.js")
        with open(path, "w", encoding="utf-8") as f:
            f.write(code + "\nconsole.log(JSON.stringify(" + expr + "))")
        proc = subprocess.run([node, path], capture_output=True, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_a_failed_send_is_retried_when_the_connection_returns(self):
        js = self.page()
        self.assertIn("failed.add(id)", js)
        self.assertIn("window.addEventListener('online', retryFailed)", js)
        snap = js[js.index("col.onSnapshot("):js.index("// The live documents")]
        self.assertIn("if (!cached) retryFailed()", snap)

    def test_one_write_at_a_time_and_the_latest_value_wins(self):
        js = self.page()
        send = js[js.index("async function send(id)"):js.index("const retryFailed")]
        self.assertIn("if (writing[id]){ again[id] = true; return }", send)
        self.assertIn("while (again[id])", send)
        self.assertNotIn("writing[id] = (writing[id] || 0) + 1", js)
        self.assertEqual(js.count("col.doc(id).set("), 1)  # the only write of an answer goes through send()

    def test_a_local_answer_newer_than_the_accounts_is_sent_on_load(self):
        self.assertEqual(self.helpers("[newerLocal(undefined, {at:'2026-01-01'}), newerLocal({at:'2026-01-01'}, {at:'2026-01-02'}), newerLocal({at:'2026-01-02'}, {at:'2026-01-01'}), newerLocal({at:'x'}, {at:'x'}), newerLocal({at:'x'}, undefined), newerLocal({at:''}, {at:'2026'})]"),
                         [True, True, False, False, False, True])

    def test_a_write_without_a_stamp_gets_one_and_stamps_only_grow(self):
        self.assertIn("if (r && !r.at){ r.at = new Date().toISOString(); lsSave() }", self.page())
        self.assertEqual(self.helpers("[nextAt(undefined, '2026-01-01T00:00:00.000Z'), nextAt('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'), nextAt('2026-01-02T00:00:00.000Z', '2026-01-01T00:00:00.000Z'), nextAt('2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z')]"),
                         ["2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.001Z", "2026-01-02T00:00:00.001Z", "2026-01-03T00:00:00.000Z"])

    def test_a_first_snapshot_from_cache_is_not_the_accounts_word(self):
        js = self.page()
        snap = js[js.index("col.onSnapshot("):js.index("// The live documents")]
        self.assertIn("snap.metadata && snap.metadata.fromCache", snap)
        self.assertIn("if (first && !cached)", snap)
        self.assertIn("if (mine && (r.at || '') < (mine.at || '')) continue;", snap)  # an older copy never overwrites a newer local one
        self.assertIn("if (timers[k] || writing[k]) continue;", snap)  # own echo ignored

    def test_answered_cards_above_an_open_one_go_to_the_bottom_and_the_readers_card_stays(self):
        # a answered, b answered (the reader's, just answered), c open, d open: a goes below, b keeps its place before c
        plan = self.helpers("settlePlan([{id:'a',answered:true},{id:'b',answered:true},{id:'c',answered:false},{id:'d',answered:false}], 'b')")
        self.assertEqual(plan, ["b", "c", "d", "a"])
        # the reader answers the first open card while an older answered one sits above a later open one
        plan = self.helpers("settlePlan([{id:'a',answered:true},{id:'b',answered:false},{id:'c',answered:true},{id:'d',answered:false}], 'b')")
        self.assertEqual(plan, ["b", "d", "a", "c"])
        # nothing is moved when the answered ones are already below the open ones, or the only one above is the reader's
        self.assertIsNone(self.helpers("settlePlan([{id:'a',answered:false},{id:'b',answered:true}], 'x')"))
        self.assertIsNone(self.helpers("settlePlan([{id:'a',answered:true},{id:'b',answered:false}], 'a')"))

    def test_settle_answered_keeps_the_readers_screen_position(self):
        js = self.page()
        fn = js[js.index("function settleAnswered"):js.index("function setSt")]
        self.assertIn("settlePlan(", fn)
        self.assertIn("keep.getBoundingClientRect().top", fn)
        self.assertIn("window.scrollBy(0, d)", fn)

    def test_newer_open_items_stack_below_older_ones_and_answered_go_after(self):
        got = self.helpers("stackOrder([{id:'old1'},{id:'ans'},{id:'old2'},{id:'new'},{id:'dflt',defaulted:true}], i => i.id === 'ans').map(i => i.id)")
        self.assertEqual(got, ["old1", "old2", "new", "ans", "dflt"])
        js = self.page()
        self.assertIn("if (pg !== 'queue') its = stackOrder(its, i => answered(i.id))", js)  # the queue keeps the file's order
