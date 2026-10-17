#!/usr/bin/env python3
"""PreToolUse guard for the Narthex plugin (stock Python, no packages).

Refuses, before the tool runs:
  * git commands that override the committer identity or commit signing (INV-8, REQ-SKL-19);
  * durable writes under /tmp and the other directories the operating system cleans (REQ-SKL-23).

It reads the hook event as JSON on stdin. To refuse, it prints the reason on stderr and exits 2. Anything it
cannot parse is allowed: the hook is a guard rail for the mechanical rules (REQ-SKL-27), not a sandbox.
"""

import json
import os
import re
import shlex
import sys

TEMP_ROOTS = ("/tmp", "/private/tmp", "/var/tmp", "/private/var/tmp")
# Claude Code's own per-session scratch space lives under the temp root and is meant for throwaway files.
SCRATCH = re.compile(r"^(?:/private)?/tmp/claude-\d+/.*/scratchpad(?:/|$)")

PROTECTED_CONFIG = re.compile(
    r"^(?:user\.(?:name|email|signingkey|useconfigonly)|author\.(?:name|email)|committer\.(?:name|email)"
    r"|commit\.gpgsign|tag\.gpgsign|tag\.forcesignannotated|gpg\..*)$",
    re.IGNORECASE,
)
IDENTITY_ENV = re.compile(r"^(?:GIT_(?:AUTHOR|COMMITTER)_\w+|GIT_CONFIG_(?:COUNT|PARAMETERS|GLOBAL|SYSTEM)|GIT_CONFIG_(?:KEY|VALUE)_\d+)=")
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
WRITES_COMMITS = {"commit", "commit-tree", "am", "cherry-pick", "rebase", "revert", "merge", "tag", "pull", "stash", "notes"}
OPERATORS = {";", "&&", "||", "|", "&", "|&", "(", ")", "{", "}"}
REDIRECTS = {">", ">>", ">|", "&>", "&>>"}


def is_temp_path(path):
    if not path or path.startswith("-"):
        return False
    expanded = os.path.expanduser(path)
    if not os.path.isabs(expanded):
        return False
    norm = os.path.normpath(expanded)
    if SCRATCH.match(norm + "/"):
        return False
    return any(norm == root or norm.startswith(root + "/") for root in TEMP_ROOTS)


def split_lines(command):
    """Turn unquoted newlines into ';' and drop heredoc bodies, so each line is one tokenizable unit."""
    out = []
    quote = None
    heredocs = []
    i = 0
    n = len(command)
    while i < n:
        ch = command[i]
        if quote:
            out.append(ch)
            if ch == "\\" and quote == '"' and i + 1 < n:
                out.append(command[i + 1])
                i += 1
            elif ch == quote:
                quote = None
        elif ch == "\\" and i + 1 < n:
            out.append(ch)
            out.append(command[i + 1])
            i += 1
        elif ch in "'\"":
            quote = ch
            out.append(ch)
        elif command.startswith("<<", i) and not command.startswith("<<<", i):
            m = re.match(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1", command[i:])
            if m:
                heredocs.append(m.group(2))
            out.append("<<")
            i += 1
        elif ch == "\n":
            out.append(" ; ")
            if heredocs:
                tag = heredocs.pop(0)
                lines = command[i + 1 :].split("\n")
                skip = 0
                for k, line in enumerate(lines):
                    skip = k + 1
                    if line.strip() == tag:
                        break
                i += sum(len(line) + 1 for line in lines[:skip])
                continue
        else:
            out.append(ch)
        i += 1
    return "".join(out)


def segments(command):
    """Split a shell command into lists of tokens, one per simple command, plus its redirections."""
    text = split_lines(command)
    try:
        lex = shlex.shlex(text, posix=True, punctuation_chars=True)
        lex.whitespace_split = True
        lex.commenters = ""
        tokens = list(lex)
    except ValueError:
        tokens = text.split()
    current = []
    for token in tokens:
        if token in OPERATORS:
            if current:
                yield current
            current = []
        else:
            current.append(token)
    if current:
        yield current


def check_git(words):
    """words: the tokens of one command whose command word is git."""
    i = 1
    while i < len(words):
        word = words[i]
        if word == "-c" and i + 1 < len(words):
            key = words[i + 1].split("=", 1)[0]
            if PROTECTED_CONFIG.match(key):
                return f"git -c {key} overrides committer identity or signing"
            i += 2
            continue
        if word.startswith("-c") and len(word) > 2 and "=" in word:
            key = word[2:].split("=", 1)[0]
            if PROTECTED_CONFIG.match(key):
                return f"git -c {key} overrides committer identity or signing"
        if word.startswith("--config-env"):
            value = words[i + 1] if word == "--config-env" and i + 1 < len(words) else word.partition("=")[2]
            if PROTECTED_CONFIG.match(value.split("=", 1)[0]):
                return "git --config-env overrides committer identity or signing"
        if not word.startswith("-"):
            break
        i += 1 if word not in ("-C", "--git-dir", "--work-tree", "--namespace") else 2
    rest = words[i:]
    sub = rest[0] if rest else ""
    for word in rest if sub in WRITES_COMMITS else []:
        if word == "--author" or word.startswith("--author="):
            return "git --author overrides the author identity"
        if word == "--no-gpg-sign" or word == "--no-gpgsign":
            return "git --no-gpg-sign disables commit signing"
        if word.startswith("--gpg-sign=") or (word.startswith("-S") and len(word) > 2 and not word.startswith("--")):
            return "git commit with a signing key id overrides the configured signing key"
    if sub == "config":
        args = [w for w in rest[1:] if not w.startswith("-")]
        flags = [w for w in rest[1:] if w.startswith("-")]
        reads = {"--get", "--get-all", "--get-regexp", "--list", "-l", "--show-origin", "--get-urlmatch"}
        if args and PROTECTED_CONFIG.match(args[0]) and not (reads & set(flags)):
            if len(args) > 1 or "--unset" in flags or "--unset-all" in flags or "--replace-all" in flags:
                return f"git config {args[0]} changes committer identity or signing"
    return None


def check_temp_writes(words, redirects):
    for target in redirects:
        if is_temp_path(target):
            return f"redirect writes to {target}"
    if not words:
        return None
    name = os.path.basename(words[0])
    args = words[1:]
    positional = [a for a in args if not a.startswith("-")]
    if name in ("tee", "touch", "mkdir", "mkfifo", "truncate"):
        for a in positional:
            if is_temp_path(a):
                return f"{name} writes to {a}"
    elif name in ("cp", "mv", "install", "ln", "rsync", "scp"):
        if positional and is_temp_path(positional[-1]):
            return f"{name} writes to {positional[-1]}"
    elif name in ("curl", "wget"):
        for k, a in enumerate(args):
            nxt = args[k + 1] if k + 1 < len(args) else ""
            if a in ("-o", "--output", "-O", "--output-document", "-P", "--directory-prefix") and is_temp_path(nxt):
                return f"{name} writes to {nxt}"
            if a.startswith("--output=") and is_temp_path(a.partition("=")[2]):
                return f"{name} writes to {a.partition('=')[2]}"
    elif name == "dd":
        for a in args:
            if a.startswith("of=") and is_temp_path(a[3:]):
                return f"dd writes to {a[3:]}"
    elif name == "unzip" or name == "tar":
        for k, a in enumerate(args):
            nxt = args[k + 1] if k + 1 < len(args) else ""
            if a in ("-d", "-C", "--directory") and is_temp_path(nxt):
                return f"{name} extracts into {nxt}"
    elif name == "git":
        git_args = [a for a in args if not a.startswith("-")]
        if git_args[:1] == ["clone"] and len(git_args) > 1 and is_temp_path(git_args[-1]):
            return f"git clone into {git_args[-1]}"
        if git_args[:2] == ["worktree", "add"] and len(git_args) > 2 and is_temp_path(git_args[2]):
            return f"git worktree add at {git_args[2]}"
        if git_args[:1] == ["init"] and len(git_args) > 1 and is_temp_path(git_args[-1]):
            return f"git init at {git_args[-1]}"
    elif name in ("sed", "perl"):
        if any(a == "-i" or a.startswith("-i") and not a.startswith("--") for a in args):
            for a in positional:
                if is_temp_path(a):
                    return f"{name} -i edits {a}"
    return None


def check_command(command, depth=0):
    for words in segments(command):
        redirects = []
        plain = []
        k = 0
        while k < len(words):
            if words[k] in REDIRECTS and k + 1 < len(words):
                redirects.append(words[k + 1])
                k += 2
                continue
            if re.match(r"^\d*>>?.+", words[k]) and not words[k].startswith(">&"):
                redirects.append(re.sub(r"^\d*>>?", "", words[k]))
                k += 1
                continue
            plain.append(words[k])
            k += 1
        # Leading VAR=value assignments belong to the command that follows.
        lead = 0
        while lead < len(plain) and ASSIGNMENT.match(plain[lead]):
            if IDENTITY_ENV.match(plain[lead]):
                return f"{plain[lead].split('=')[0]} overrides committer identity or signing"
            lead += 1
        words = plain[lead:]
        if words and os.path.basename(words[0]) in ("env", "export", "declare", "typeset", "set"):
            for w in words[1:]:
                if IDENTITY_ENV.match(w):
                    return f"{w.split('=')[0]} overrides committer identity or signing"
            if os.path.basename(words[0]) == "env":
                rest = [w for w in words[1:] if not w.startswith("-") and not ASSIGNMENT.match(w)]
                words = rest
        if words and os.path.basename(words[0]) == "git":
            reason = check_git(words)
            if reason:
                return reason
        if words and os.path.basename(words[0]) in ("bash", "sh", "zsh", "dash", "eval") and depth < 3:
            if os.path.basename(words[0]) == "eval":
                inner = " ".join(words[1:])
            elif "-c" in words[1:] and words.index("-c") + 1 < len(words):
                inner = words[words.index("-c") + 1]
            else:
                inner = ""
            if inner:
                reason = check_command(inner, depth + 1)
                if reason:
                    return reason
        reason = check_temp_writes(words, redirects)
        if reason:
            return reason
    return None


def decide(event):
    tool = event.get("tool_name", "")
    tool_input = event.get("tool_input") or {}
    if tool == "Bash":
        return check_command(tool_input.get("command", "") or "")
    if tool in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
        if is_temp_path(path):
            return f"{tool} would write {path}, a directory the operating system cleans"
    return None


def main():
    try:
        event = json.load(sys.stdin)
    except (ValueError, OSError):
        return 0
    reason = decide(event)
    if reason:
        sys.stderr.write(
            "Narthex guard refused this call: "
            + reason
            + ". House rules: never override the git identity or commit signing (REQ-SKL-19), "
            "and keep durable work out of /tmp (REQ-SKL-23).\n"
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
