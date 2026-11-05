# Architecture

Forge's skills are Agent Skills prompts (`SKILL.md`) with no runtime or dependencies. The repository root is also a Claude Code plugin that adds the [lens](lens.md), an optional view over what the skills print.

## Layout

- `skills/forge-*/`: one skill each. `references/` holds what only that skill loads on demand.
- `skills/_shared/`: the source of modules and roles (`roles/`) several skills use. `scripts/sync-shared.sh` copies it into each skill as `<skill>/_shared/`; never edit a copy.
- `lens/`, `.claude-plugin/`: the plugin.
- `scripts/`: the checks and the sync.

## Workflow

```
forge-setup-project → [forge-shape →] forge-create-issue → forge-implement → forge-reflect → forge-address-pr-feedback → forge-guard → forge-land
                                                                        ╰──── forge-ship ────╯╰────────── forge-ship --guard ───────────╯
```

`forge-shape` is optional, for ideas too vague to file. `forge-ship` is a composite: it runs implement's process and the review flow it shares with reflect in one invocation. `forge-batch` sits beside the line: it groups prepared Issues into Waves, and a launcher or `forge-batch --start` runs the line once per Issue (see [unattended.md](unattended.md)).

## Context limits

Instruction-following and recall get worse as a session grows, noticeably past roughly 100k tokens whatever the advertised window. The figure is approximate and depends on the model, but several choices respond to it:

- `(delegate)` steps and role files move work into a fresh context.
- Review runs in fresh context, one reviewer by default, more only when risk justifies it.
- `references/` load on demand, and so do the warm and cold context tiers (`docs/`, specs). Only `AGENTS.md` is always loaded.
- Waiting happens in a blocked shell call, not in polling output.

How many instructions a skill may hold is a separate limit: see [Instruction Budget](coding-guidelines.md#instruction-budget).

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| GraphQL for PR threads | Required in `_shared/pr-readiness.md` | The REST API doesn't expose `isResolved` on review threads |
| Sub-agent delegation | `(delegate)` step pattern | Works across runtimes and in skills with interactive steps, which `context: fork` (whole-skill forking in Claude Code) can't do |
| Runtime capabilities | Use sub-agent tools and per-task model choice when present, with an inline fallback; never a runtime-specific agent name | Agent files and presets are optional local tuning. Where agent names select a model or provider, push role content and inherit the parent session's configuration |
| Blind research | The scout researches the codebase without seeing the Issue | Knowing the goal leaks opinions into research |
| Three-tier context | Hot (`AGENTS.md`), warm (`docs/`), cold (specs) | Each doc has to earn its token cost |
| Single guidance file | `AGENTS.md` only; no `CLAUDE.md` | Claude Code and other agents read `AGENTS.md` natively, so a symlink or copy adds a second name for one file. A `CLAUDE.md` exists only for Claude-specific content or for sessions that read only `CLAUDE.md` ([which ones](https://code.claude.com/docs/en/memory#when-agents-md-support-is-unavailable)), as `@AGENTS.md` plus that content |
| Push vs pull context | Push: embed in the delegation prompt. Pull: read on demand | Push what must not be skipped (review rubric, role definitions); pull optional philosophy and templates |
| Bundled shared layer | `skills/_shared/` is the source; `scripts/sync-shared.sh` copies it into each skill, and `scripts/check-skills.sh` fails on drift. See [link rules](coding-guidelines.md#roles) | Installers such as `npx skills add` copy only directories with a `SKILL.md`, and since skills CLI 1.7.5 drop any symlink that leaves the skill. `skills update` compares each skill folder's git tree, so a shared change reaches installs only when it changes that tree, which a symlink never does. Agents also resolve `..` lexically from the install path |
| Issue tracker abstraction | Provider operations in `_shared/issue-operations.md` | Skills say "create an Issue" without re-deriving the three-way conditional |
| Undiscoverability test | Only document what agents can't find by exploring | Docs hold decisions, conventions and failure modes |
| Agent readiness assessment | `forge-setup-project` evaluates feedback loops, module structure and risks | They affect agent output more than context files do, so surface gaps early |
| Exercise before the PR | `forge-implement` runs the app and uses the changed path once; the recipe comes from the runtime's run skill or `AGENTS.md`, never a guess | Tests cover only what someone thought to test. No recipe means an honest `not exercised` line, and land sends an unexercised runtime change to review |
| Only land merges, by opt-in | The guard never merges. `forge-land` merges only a PR it judged low risk, only with `Auto-merge: low-risk`, and only the judged commit (`--match-head-commit`) | A loop that fixes its own PR must not also approve it. Whether a verdict can stand in for the click is a property of the repository, so it is a project setting rather than a flag |
| Risk verdict in its own skill | `forge-land` judges in fresh context, tied to the head commit | The session that wrote the code is the worst judge of its risk, and a verdict on an older commit says nothing about the new one. Separate from the guard so it works on any PR |
| Lens in the plugin, not in the skills | The plugin bundles the skills and `lens/`, which only parses what the skills write. The plugin has no `version`, so installs track commits | The skills stay portable and never call the lens. One version keeps the parser matched to the formats it reads |
| One seam, launchers outside forge | `FORGE_STATUS_CMD`; forge ships no launcher and no worktree hooks | A launcher or checkout bootstrap fits one person's terminal and projects, and skills must work without one |
