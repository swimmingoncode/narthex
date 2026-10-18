"""Contract fixtures for the builder: the data-model fixtures in contracts/data-model/ must mean the same thing to
build.py as they do to the JSON Schemas (the TypeScript suite checks the schemas side).

    python3 -m unittest discover -s skills/decision-form/tests
"""
import glob, json, os, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BUILD = os.path.join(ROOT, "skills", "decision-form", "scripts", "build.py")
QUESTIONS = os.path.join(ROOT, "contracts", "data-model", "fixtures", "questions")
RESPONSE = os.path.join(ROOT, "contracts", "data-model", "fixtures", "response")
REPO_QUESTIONS = os.path.join(ROOT, "decisions", "questions.json")


def build(*args):
    return subprocess.run([sys.executable, BUILD, *args], capture_output=True, text=True)


class ContractFixtures(unittest.TestCase):
    def test_builder_accepts_every_valid_questions_fixture(self):
        # verifies: REQ-DEC-1, REQ-DEC-43, REQ-DAT-6
        files = sorted(glob.glob(os.path.join(QUESTIONS, "valid", "*.json"))) + [REPO_QUESTIONS]
        self.assertGreaterEqual(len(files), 3)
        for f in files:
            with self.subTest(fixture=os.path.relpath(f, ROOT)):
                r = build(f, "--check", "--strict")
                self.assertEqual(r.returncode, 0, r.stderr)

    def test_builder_rejects_every_invalid_questions_fixture(self):
        # verifies: REQ-DEC-1, REQ-DEC-43, REQ-DAT-6
        with open(os.path.join(QUESTIONS, "expected-errors.json")) as fh:
            expected = json.load(fh)
        files = sorted(glob.glob(os.path.join(QUESTIONS, "invalid", "*.json")))
        self.assertEqual(len(files), len(expected))
        for f in files:
            name = "invalid/" + os.path.basename(f)
            with self.subTest(fixture=name):
                r = build(f, "--check")
                self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
                self.assertIn("error:", r.stderr)
                self.assertIn(expected[name]["builder"], r.stderr)

    def test_builder_reads_every_valid_response_fixture(self):
        # verifies: REQ-DAT-6, INV-3
        files = sorted(glob.glob(os.path.join(RESPONSE, "valid", "*.json")))
        self.assertGreaterEqual(len(files), 3)
        for f in files:
            with self.subTest(fixture=os.path.relpath(f, ROOT)):
                with tempfile.TemporaryDirectory() as tmp:
                    rdir = os.path.join(tmp, "responses")
                    os.mkdir(rdir)
                    with open(f) as src, open(os.path.join(rdir, "answers.json"), "w") as dst:
                        dst.write(src.read())
                    qfile = os.path.join(QUESTIONS, "valid", "minimal.json")
                    r = build(qfile, "-o", os.path.join(tmp, "form"), "--responses", rdir,
                              "--log", os.path.join(tmp, "LOG.md"))
                    self.assertEqual(r.returncode, 0, r.stderr)
                    self.assertNotIn("holds no answers", r.stderr)
                    self.assertRegex(r.stdout, r"log: .* · [1-9]\d* answers archived")


if __name__ == "__main__":
    unittest.main()
