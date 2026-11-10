# Forge

Forge is a collection of agent skills that define a structured development workflow with pluggable issue tracking, following the [Agent Skills](https://agentskills.io) standard. The skills are Markdown prompts, plus one bash script they share for reading PR state, with no build system. The repository root is also a Claude Code plugin that adds the lens (`lens/`), an optional TypeScript view over the text the skills print; see [Lens](docs/lens.md). The skills never depend on the lens, and launchers and worktree setup stay the user's.

This is the only project guidance file; there is no `CLAUDE.md` (Claude Code reads `AGENTS.md` natively).

## Commands

```bash
scripts/check-skills.sh                            # skill structure, the lens contract (Node 22.6+), the PR-state script's tests (jq); prints nothing when healthy
npx @biomejs/biome@2.6.2 check --write .           # lint and format the lens (the version in biome.json)
claude plugin validate . && claude plugin test .   # plugin manifests and lens tests
```

CI runs all three on every pull request; see [Testing](docs/testing.md).

Shared modules are edited only in `skills/_shared/`. `scripts/sync-shared.sh` copies them into each skill, and `scripts/check-skills.sh` fails when a copy drifts.

Skill prompts are forge's runtime, so a change under `skills/` is exercised, not reported as `no runtime change`: run the changed skill (or forge-land's judge, for a rubric change) from a snapshot of the branch in a sandbox repository, with a snapshot of the branch's base as the control. The commands are in [Testing: Exercise a Skill Change](docs/testing.md#exercise-a-skill-change).

## Documentation

| Document | Purpose |
|----------|---------|
| [Context](CONTEXT.md) | Shared vocabulary used across forge skills |
| [Architecture](docs/architecture.md) | Workflow, context limits, design decisions |
| [Development](docs/development.md) | Adding and modifying skills |
| [Coding Guidelines](docs/coding-guidelines.md) | Skill and role file format, authoring conventions |
| [Testing](docs/testing.md) | Automated checks, exercising a skill change, per-skill scenarios |
| [PR Workflow](docs/pr-workflow.md) | Commits, branch naming, review |
| [Unattended Shipping](docs/unattended.md) | Guard loop, Waves, launchers, project setup |
| [Lens](docs/lens.md) | The lens's views and the text formats it reads |

Update docs when you change skill conventions or add new skills.

## Principles

- **Explore first, ask second.** Skills analyze the codebase before asking the user questions.
- **Never invent content.** Use `<!-- TODO -->` markers rather than generic boilerplate.
- **Standards first.** Prefer `AGENTS.md` and Agent Skills conventions; keep vendor-specific compatibility light.
- **Plan before code.** For complex work, research the codebase objectively and align on architecture first, with research delegated to sub-agents.
- **Mind the [instruction budget](docs/coding-guidelines.md#instruction-budget).** Keep skills under ~35 instructions.

## Commits

Format: `<type>(<scope>): <description>`. Types: feat, fix, docs, refactor, test, chore, perf. See [PR Workflow](docs/pr-workflow.md).
