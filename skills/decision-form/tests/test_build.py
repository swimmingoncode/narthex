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
