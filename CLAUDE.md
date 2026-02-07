# Forge

Forge is a collection of Claude Code skills that define a structured, GitHub-centric development workflow.

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

## Commits

Format: `<type>(<scope>): <description>`

Types: feat, fix, docs, refactor, test, chore, perf

```
feat(skills): add forge-setup-project skill
fix(create-issue): handle missing labels gracefully
docs(pr-workflow): clarify branch naming convention
```
