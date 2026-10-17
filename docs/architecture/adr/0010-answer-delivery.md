# ADR-0010: Answers reach the agent by layers: channel, watcher, short wait, acknowledge

- **Status:** accepted by default (form item `adr-0010`, 2026-10-17; Pablo may still object)
- **Date:** 2026-10-17
- **Decision item:** `adr-0010`
- **Concerns:** `REQ-IFC-6`, `REQ-IFC-5`, `REQ-DEC-24`, `REQ-DEC-39` to `REQ-DEC-42`, `NFR-9`, R21, R22; SAD §4.1

## Context

Forms usually sit unanswered for a long time (R22). The agent must not poll and must not wait idle
(`REQ-DEC-39`). Answers reach it by layers (R21): a plugin hook where the harness allows it, otherwise a link, a
short wait and a "pending" result. A monitor wakes the agent where the harness has one (`REQ-DEC-40`); otherwise
the person comes back and says they answered (`REQ-DEC-41`).

What the harnesses offer (`notes/2026-10-17-ui-feedback.md`): Claude Code channels can push external events into a
running session, but are a research preview. Plugin hooks fire only on their own lifecycle events. MCP Apps do
not message the model. Background commands in Claude Code notify the agent when they exit.

## Options considered

### A. Four layers, best first

1. **Channel.** Once channels leave preview, the plugin registers one; the server pushes "N answers on form X".
2. **Watcher.** The plugin's `narthex watch` command runs in the background. It holds one HTTP event stream open
   to the server and exits when an event arrives after its cursor. The harness wakes the agent on exit. A script
   does the waiting, as `NFR-9` asks.
3. **Short wait.** `form_wait` holds the call for a short time (about 20 seconds), then returns "pending". It
   suits a person who is answering right now.
4. **Acknowledge.** With no channel and no watcher, the agent tells the person, with the link, to come back and
   say they answered.

Every layer ends the same way: an incremental `form_read` from the agent's cursor (`REQ-DEC-24`).

### B. A long blocking tool call until the answer

Con: breaks on answers that take days; client timeouts are unknown.

### C. The agent re-reads on a timer

Con: polling, ruled out by R22.

## Decision (recommendation)

**A.** Ship layers 2 to 4 in M0. Add layer 1 when channels leave preview, behind a capability check per harness
(`REQ-IFC-5`). The watcher reconnects with its last cursor if the stream drops, and gives up after a long limit
with a message the agent passes on.

## Consequences

- The server keeps an ordered event feed per form (SAD §5.2). Cursors make every layer safe to repeat.
- The watcher holds a narrow read token for its form's events, refreshed through the agent's MCP session.
- Harnesses without background commands fall back to layers 3 and 4.

## Sources

- `notes/2026-10-17-ui-feedback.md`, with its sources on Claude Code channels, hooks, MCP Apps and elicitation
- Rulings R21 and R22: `notes/2026-10-17-rulings.md`
