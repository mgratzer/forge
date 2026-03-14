# Forge

Forge is a collection of agent skills that define a structured, GitHub-centric development workflow. Skills follow the [Agent Skills](https://agentskills.io) open standard.

`AGENTS.md` is the canonical project guidance file in this repository. `CLAUDE.md` is kept only as a compatibility symlink for tools that still look for that filename.

## Commands

There is no application code, build system, or test framework. The repository contains only SKILL.md prompt files.

```bash
git status                          # check working tree state
git diff                            # review changes before committing
gh issue list                       # list open issues
gh pr list                          # list open pull requests
```

## Documentation

| Document | Purpose |
|----------|---------|
| [Architecture](docs/architecture.md) | Skill pipeline, file format, design decisions |
| [Development](docs/development.md) | How to create and modify skills |
| [Coding Guidelines](docs/coding-guidelines.md) | Skill authoring conventions and style rules |
| [Testing](docs/testing.md) | How to validate skills manually |
| [PR Workflow](docs/pr-workflow.md) | Commits, PRs, branch naming, review process |

**Update docs when you change skill conventions or add new skills.**

## Core Principles

1. **Skills are prompts, not code** — every SKILL.md is a reusable prompt template with YAML frontmatter and step-by-step instructions
2. **Explore-first, ask-second** — skills should always analyze the codebase before asking the user questions
3. **Never invent content** — use `<!-- TODO -->` markers rather than generating generic boilerplate
4. **Conventional commits everywhere** — every skill enforces the same commit, branch, issue, and PR naming format
5. **Standards first, compatibility second** — prefer `AGENTS.md` and Agent Skills conventions; keep vendor-specific compatibility lightweight
6. **One invocation convention** — every skill should support optional trailing execution context via `-- <additional context>` when additional guidance is useful

## Commits

Format: `<type>(<scope>): <description>`

Types: feat, fix, docs, refactor, test, chore, perf

```
feat(skills): add forge-setup-project skill
fix(create-issue): handle missing labels gracefully
docs(pr-workflow): clarify branch naming convention
```