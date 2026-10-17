# Can a UI tell the agent the user acted? (2026-10-17)

The question comes from ruling R3: the MCP hands the user links into a web UI. Can a Claude plugin, MCP Apps or
elicitation tell the agent that the user did something, such as clicking submit? Researched by a helper against
the Claude docs. "Verified" means stated in the docs; "inference" is ours.

## Findings

| Mechanism | What it does | Status |
|---|---|---|
| MCP Apps | The app calls the server's tools and gets their results. Nothing documented sends a message to the model or updates its context | Verified. Inference: a click reaches the agent only through server state the agent later reads |
| MCP elicitation | Claude Code shows form and URL dialogs from the server; an `Elicitation` hook can answer them | Verified for Claude Code. Claude Desktop and claude.ai support not stated |
| Plugin hooks | Add context only on their own lifecycle events | Verified. No external events |
| Channels | Push external events into a running Claude Code session (`--channels`) | Verified. Research preview, needs claude.ai or Console auth; custom channels need a development flag until allowlisted |
| Artifacts | A comment sent with "Send to Claude" or `@claude` reaches the publishing Claude Code session at once (v2.1.228+) | Verified. Artifacts have no backend of their own beyond the platform's capabilities |
| Routines `/fire` | Starts a new session; doesn't continue one | Verified |
| Managed Agents webhooks | Notify your server of session state: the reverse direction | Verified |
| Cross-session messages | Only between Claude sessions | Verified |

## Recommendation

Revised the same day by Pablo's rulings R20–R22 (notes/2026-10-17-rulings.md), below.

**The agent owns the wait.**
1. An MCP tool creates a request and returns the web link.
2. The same tool call then blocks until the backend records the submission, or a timeout passes.
3. The tool returns the answer as its result.

This needs no push and relies only on documented tool results. Two things to check:
- whether the target clients tolerate long tool calls;
- a fallback for when they don't: a `get_answer(request_id)` call that the agent repeats, with a long interval.

For the decision inbox, this fits the incremental reads of ruling R8: the user answers in the UI, and the agent's
next read returns only what changed. Channels can push in Claude Code once they leave preview. Elicitation can
replace the link for short questions in clients that support it.

## Sources

- https://claude.com/docs/connectors/building/mcp-apps/quickstart.md
- https://code.claude.com/docs/en/mcp.md
- https://code.claude.com/docs/en/hooks.md
- https://code.claude.com/docs/en/channels.md
- https://code.claude.com/docs/en/artifacts.md
- https://code.claude.com/docs/en/routines.md
- https://code.claude.com/docs/en/cross-session-messaging.md
- https://platform.claude.com/docs/en/managed-agents/webhooks.md

## Revised by Pablo (R20–R22)

The blocking wait above assumes the user answers soon. Pablo's norm is the opposite: a form can sit
unattended while he works on other projects. So:
1. **Links are authenticated, split by purpose** (R20):
   - reading state: a short-lived token;
   - answering: a long-lived, narrowly scoped token (one form, submit only, revocable), so an answer that takes
     hours still lands;
   - refreshing: a browser session or a login, or the long-lived token asks the agent for a fresh link.
   The MCP suggests the agent open links in the harness's browser when there is one.
2. **Delivery is layered** (R21):
   - best: a plugin whose hooks bring the answer back to the agent, through channels in Claude Code once they
     leave preview, or whatever the harness offers;
   - otherwise: the link, a short wait, then a "pending" result.
3. **No polling** (R22):
   - The agent opens a monitor (a background watcher the harness wakes it from) where one exists.
   - If no channel is open, it tells the user to come back and acknowledge it after answering.
   - Meanwhile it carries on with its queue.
   - The next read returns only the changes (R8).
