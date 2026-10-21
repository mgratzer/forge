# Forge

Forge is a collection of agent skills that define a structured development workflow with pluggable issue tracking. Skills follow the [Agent Skills](https://agentskills.io) open standard.

`AGENTS.md` is the only project guidance file in this repository; there is no `CLAUDE.md` (Claude Code reads `AGENTS.md` natively).

## Commands

The skills are Markdown: skill prompts (`SKILL.md`, shared modules, roles, references) and docs, with no build system. The repository root is also a Claude Code plugin that bundles them with the lens (`lens/`), an optional TypeScript view over the text the skills print; see [Lens](docs/lens.md). The skills never depend on the lens, and launchers and worktree setup stay the user's.

```bash
scripts/check-skills.sh                            # skill structure; prints nothing when healthy
npx @biomejs/biome@2.6.2 check --write .           # lint and format the lens (the version in biome.json)
claude plugin validate . && claude plugin test .   # plugin manifests and lens tests
```

CI (`.github/workflows/checks.yml`) runs all three on every pull request; see [Testing](docs/testing.md).

## Documentation

| Document | Purpose |
|----------|---------|
| [Context](CONTEXT.md) | Shared vocabulary used across forge skills |
| [Architecture](docs/architecture.md) | Skill workflow, operating constraints, design decisions |
| [Development](docs/development.md) | How to create and modify skills |
| [Coding Guidelines](docs/coding-guidelines.md) | Skill and role file format, authoring conventions, style rules |
| [Testing](docs/testing.md) | How to validate skills manually |
| [PR Workflow](docs/pr-workflow.md) | Commits, PRs, branch naming, review process |
| [Unattended Shipping](docs/unattended.md) | Guard loop, Waves, launchers, project setup |
| [Lens](docs/lens.md) | Claude Code plugin install, the lens's views, the text formats it reads |

**Update docs when you change skill conventions or add new skills.**

## Core Principles

1. **Skills are prompts, not code** — every SKILL.md is a reusable prompt template with YAML frontmatter and step-by-step instructions
2. **Explore-first, ask-second** — skills should always analyze the codebase before asking the user questions
3. **Never invent content** — use `<!-- TODO -->` markers rather than generating generic boilerplate
4. **Conventional commits everywhere** — every skill enforces the same commit, branch, issue, and PR naming format
5. **Standards first, compatibility second** — prefer `AGENTS.md` and Agent Skills conventions; keep vendor-specific compatibility lightweight
6. **One invocation convention** — every skill supports optional trailing execution context via `-- <additional context>` when additional guidance is useful
7. **Plan before code** — for complex work, research the codebase objectively and align on architecture before writing implementation; delegate research to sub-agents for unbiased answers
8. **Mind the instruction budget** — keep skills under ~35 instructions; delegate to sub-agents when complexity grows

## Commits

Format: `<type>(<scope>): <description>`

Types: feat, fix, docs, refactor, test, chore, perf

```
feat(skills): add forge-setup-project skill
fix(create-issue): handle missing labels gracefully
docs(pr-workflow): clarify branch naming convention
```