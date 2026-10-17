# Packaging: plugin, loose skills, or a custom harness

2026-10-03. Answers `OQ-19`, using the research in `notes/2026-10-03-research.md` §3.

## Recommendation

**Package SDD Studio as one Claude Code plugin.** Develop it as a plugin from the start, install it from
this folder through a local marketplace, and don't build a custom harness now. Revisit a harness on the
Agent SDK only if the dispatch board (`DEF-2`) needs things a session cannot give: fan-out across many
agents, runs that continue after the session ends, or headless scheduling.

## The three options

| | Plugin | Loose skills | Custom harness (Agent SDK) |
|---|---|---|---|
| What it is | `.claude-plugin/plugin.json` plus `skills/`, `agents/`, `hooks/hooks.json`, `.mcp.json`, installed as one unit | `SKILL.md` folders copied or linked into `~/.claude/skills` or `.claude/skills` | Our own program running the agent loop, with its own UI and state |
| Skills | Yes, namespaced (`/sdd-studio:decide`) | Yes | Yes, it can load the same plugin from a local path |
| Hooks that refuse commands (`REQ-WF-15`) | Yes, shipped with the plugin | No, each project configures its own | Yes, as code |
| Subagent definitions (researcher, implementer) | Yes | No | Yes |
| Versioning and updates | `version` in the manifest, marketplace install | By hand | Our own release process |
| The decision form (artifact with a database) | Works: the session's Artifact and ArtifactData tools publish it and read answers back | Works the same | **Lost**, as far as we can tell: an SDK product runs on API keys, may not offer claude.ai login without approval, and has no artifact tools, so the form needs its own hosting and auth |
| Custom UI | None inside the session; the form and docs are web pages anyway | None | Full |
| Long-running orchestration | Within a session: subagents, worktrees, background tasks, workflows | Same | Unbounded |
| Cost to build | Low: a manifest around the skills we write anyway | Lowest | High: we rebuild permissions, worktrees, tools and the UI the session already has |

## Why a plugin

1. **The skills are the product either way.** A plugin is a manifest around them, so it costs almost
   nothing over loose skills, and it adds what loose skills cannot carry: hooks, subagent definitions,
   templates, and a version.
2. **House rules need hooks.** The identity override that reached 224 commits came from text in a brief.
   A `PreToolUse` hook that refuses `git commit -c user.email=…` or `--no-gpg-sign` is the mechanical
   guard (`REQ-WF-15`, `OQ-25`), and only a plugin (or per-project settings) can ship one.
3. **The form depends on the session's tools.** Publishing the form, and reading answers back without the
   lead copying them (`REQ-DI-15`), use the Artifact and ArtifactData tools of a Claude Code session signed
   in to claude.ai. As far as we can tell, a harness on the Agent SDK has neither, and may not offer claude.ai login without Anthropic's approval, so it would
   have to host the form and handle auth itself. That is a product of its own, and v1 doesn't need it.
4. **No custom UI is needed in the session.** The lead's surfaces (the form, the rendered docs) are web
   pages already. The research notes that a plugin cannot draw UI inside Claude Code; SDD Studio never
   needed to.
5. **Nothing is wasted if a harness comes later.** The Agent SDK loads a plugin from a local path, so the
   same skills, hooks and agents carry over.

## What would change the answer

- **A team product** (`OQ-1` answered "a product for other leads"): several answerers, auth and hosting
  outside claude.ai point to a hosted service for the form, still with the plugin for the agent side.
- **A dispatch board that outlives sessions** (`DEF-2`): a small service or harness that tracks agents,
  PRs and CI across days. Build it then, around the same plugin.

## Proposed layout

```
sdd-studio/
  .claude-plugin/plugin.json     name "sdd-studio", version, description
  skills/
    intake/ research/ spec/ decision-form/ plan/ dispatch/ amend/ propose-upstream/ report/
  agents/
    researcher.md                read-only, sourced reports
    implementer.md               one feature, own worktree, house rules
  hooks/hooks.json               guard: identity and signing overrides, protected pushes, /tmp
  house-rules/defaults.md        extended by the project's own file (OQ-26)
```

`skills/decision-form/` is the first skill and already follows this layout. The manifest is not created
yet: it waits for `OQ-19`.

## A working model: diagram-design (added 2026-10-17)

[cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT, about 57k stars on
2026-10-17) packages one agent skill the way SDD Studio could:

- **One repo, many hosts.** `skills/diagram-design/SKILL.md` with `references/`, `assets/` and `scripts/`, plus
  `.claude-plugin/`, `.codex-plugin/` and `.factory-plugin/` manifests and `commands/` for slash commands.
- **Two install paths.**
  - Claude Code: `/plugin marketplace add cathrynlavery/diagram-design`, then `/plugin install`. It brings the
    slash commands and updates; auto-update is opt-in, because Claude Code disables it for third-party
    marketplaces.
  - Any Agent Skills host (Cursor, Codex, Copilot, Gemini CLI and others): `npx skills add <repo>`, which
    installs the skill alone, without the commands, and updates with `npx skills update`.
- **Trust files.** `PRIVACY.md` (what the skill sends over the network), `SECURITY.md`, `THIRD_PARTY_LICENSES.md`,
  a maintainer policy, and a statement of which listings are official.
- **Versioning.** A plugin version in `plugin.json`, shown as a badge, and a `CHANGELOG.md`.

For SDD Studio this means: one public Swimming on Code repo with `skills/decision-form/` and the other skills,
a Claude Code plugin manifest for the commands and hooks, and an `npx skills add` path for teams on other
hosts. It supports the plugin recommendation for `OQ-19`, and the public-repo option for `OQ-20`.
