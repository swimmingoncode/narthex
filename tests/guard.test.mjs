import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

function guard(toolName, toolInput) {
  const event = { hook_event_name: "PreToolUse", tool_name: toolName, tool_input: toolInput };
  return spawnSync("python3", ["hooks/guard.py"], {
    input: JSON.stringify(event),
    encoding: "utf8",
  });
}
const bash = (command) => guard("Bash", { command });
const refused = (r) => {
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /Narthex guard refused/);
};
const allowed = (r) => assert.equal(r.status, 0, r.stderr);

// verifies: INV-8, REQ-SKL-19, REQ-SKL-27
test("commit with an author override is refused", () => {
  refused(bash('git commit --author="Someone <s@example.com>" -m "x"'));
  refused(bash('git commit --author "Someone <s@example.com>" -m "x"'));
  refused(bash('git -c user.name=Someone -c user.email=s@example.com commit -m "x"'));
  refused(bash('GIT_AUTHOR_NAME=Someone git commit -m "x"'));
  refused(bash('export GIT_COMMITTER_EMAIL=s@example.com && git commit -m "x"'));
  refused(bash('env GIT_AUTHOR_EMAIL=s@example.com git commit -m "x"'));
  refused(bash("bash -c 'git commit --author=\"A <a@b.c>\" -m x'"));
  refused(bash("git config user.email someone@example.com"));
  refused(bash("git config --global user.signingkey ABCDEF"));
});

// verifies: INV-8, REQ-SKL-19, REQ-SKL-27
test("commit with no-gpg-sign is refused", () => {
  refused(bash('git commit --no-gpg-sign -m "x"'));
  refused(bash('git -c commit.gpgsign=false commit -m "x"'));
  refused(bash("git -c tag.gpgsign=false tag v1"));
  refused(bash("git config commit.gpgsign false"));
  refused(bash('git commit -S0123ABCD -m "x"'));
  refused(bash('git commit --gpg-sign=0123ABCD -m "x"'));
});

// verifies: INV-8, REQ-SKL-19
test("plain commit is allowed", () => {
  allowed(bash('git commit -m "T-001-04: guard hook"'));
  allowed(bash("git commit -S -m x"));
  allowed(bash("git add -A && git commit -m x"));
  allowed(bash("git config user.email"));
  allowed(bash("git config --get commit.gpgsign"));
  allowed(bash("git log --author=someone --oneline"));
});

// verifies: INV-8, REQ-SKL-19
test("words in a message or a heredoc do not trigger the guard", () => {
  allowed(
    bash('git commit -m "House rules: never pass --author or --no-gpg-sign or GIT_AUTHOR_NAME"'),
  );
  allowed(
    bash(
      "git commit -m \"$(cat <<'EOF'\nT-1: text\n\nNever use -c user.name=x; don't use --no-gpg-sign.\nEOF\n)\"",
    ),
  );
  allowed(bash("cat <<'EOF' > notes.md\ndon't --author=x\nEOF"));
});

// verifies: REQ-SKL-23, REQ-SKL-27
test("write under tmp is refused", () => {
  refused(guard("Write", { file_path: "/tmp/brief.md", content: "x" }));
  refused(guard("Write", { file_path: "/private/tmp/brief.md", content: "x" }));
  refused(guard("Edit", { file_path: "/tmp/a/../b.txt", old_string: "a", new_string: "b" }));
  refused(guard("NotebookEdit", { notebook_path: "/var/tmp/n.ipynb" }));
  refused(bash("echo hi > /tmp/out.txt"));
  refused(bash("cat <<'EOF' >> /tmp/out.txt\nhi\nEOF"));
  refused(bash("printf x | tee /tmp/out.txt"));
  refused(bash("git clone https://example.com/r.git /tmp/r"));
  refused(bash("mkdir -p /tmp/work && cd /tmp/work"));
  refused(bash("cp build.sh /tmp/build.sh"));
  refused(bash("curl -o /tmp/f.zip https://example.com/f.zip"));
});

// verifies: REQ-SKL-23
test("reads from tmp and writes elsewhere are allowed", () => {
  allowed(guard("Write", { file_path: "/Users/someone/project/brief.md", content: "x" }));
  allowed(guard("Read", { file_path: "/tmp/anything" }));
  allowed(bash("ls /tmp && cat /tmp/out.txt"));
  allowed(bash("cp /tmp/out.txt ./out.txt"));
  allowed(bash("echo hi > ./out.txt"));
  allowed(bash("echo hi > /dev/null"));
  allowed(bash("make 2>&1 | tail -5"));
});

// verifies: REQ-SKL-23
test("the session scratchpad under tmp is allowed", () => {
  allowed(
    guard("Write", {
      file_path: "/private/tmp/claude-501/-proj/abc/scratchpad/n.txt",
      content: "x",
    }),
  );
  allowed(bash("echo hi > /private/tmp/claude-501/-proj/abc/scratchpad/n.txt"));
});

// verifies: REQ-SKL-27
test("input the guard cannot parse is allowed", () => {
  const r = spawnSync("python3", ["hooks/guard.py"], { input: "not json", encoding: "utf8" });
  assert.equal(r.status, 0);
});

// verifies: REQ-SKL-27
test("the plugin registers the guard hook", () => {
  const hooks = JSON.parse(readFileSync("hooks/hooks.json", "utf8"));
  const entry = hooks.hooks.PreToolUse[0];
  assert.match(entry.matcher, /Bash/);
  assert.match(entry.matcher, /Write/);
  assert.match(entry.hooks[0].command, /\$\{CLAUDE_PLUGIN_ROOT\}.*hooks\/guard\.py/);
});
