# Architecture

Forge is a prompt-only repository — no application code, no runtime, no dependencies. It contains Claude Code skill files (SKILL.md) that teach Claude Code how to execute a structured GitHub development workflow.

## Project Structure

```
forge/
├── skills/
│   ├── forge-setup-project/SKILL.md       # Step 0: Project meta-structure setup
│   ├── forge-create-issue/SKILL.md        # Step 1: Plan and create GitHub issues
│   ├── forge-implement-issue/SKILL.md     # Step 2: Implement from an issue
│   ├── forge-reflect-pr/SKILL.md          # Step 3: Self-review before peer review
│   ├── forge-address-pr-feedback/SKILL.md # Step 4: Address PR review comments
│   └── forge-update-changelog/SKILL.md    # Step 5: Update changelog
├── docs/                                   # Project documentation
├── CLAUDE.md                               # Agent quick reference
├── AGENTS.md → CLAUDE.md                   # Symlink for agent discovery
├── README.md                               # Project overview
└── CHANGELOG.md                            # User-facing changes
```

## Skill Pipeline

The skills form a linear workflow. Each skill references the next in its "Related Skills" section:

```
forge-setup-project → forge-create-issue → forge-implement-issue → forge-reflect-pr → forge-address-pr-feedback → forge-update-changelog
```

- **forge-setup-project** creates the meta-structure that all other skills rely on (CLAUDE.md, docs/, etc.)
- **forge-create-issue** uses AskUserQuestion to collaboratively scope work, then creates GitHub issues with `gh`
- **forge-implement-issue** reads an issue, creates a branch, implements the changes, and opens a PR
- **forge-reflect-pr** self-reviews the PR diff for missed opportunities
- **forge-address-pr-feedback** fetches unresolved review threads via GraphQL and addresses each one
- **forge-update-changelog** transforms commit messages into user-friendly changelog entries

## Skill File Format

Every SKILL.md has two parts:

**1. YAML Frontmatter**

```yaml
---
name: forge-<name>              # Kebab-case, prefixed with "forge-"
description: <what it does>     # Used by Claude Code for skill discovery
disable-model-invocation: true  # Optional: prevents auto-invocation
allowed-tools: Read, Bash, ...  # Optional: restricts available tools
---
```

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Skill identifier, used as the slash command name |
| `description` | Yes | Triggers skill selection — Claude Code matches user intent to this |
| `disable-model-invocation` | No | When `true`, skill can only be invoked by the user via slash command |
| `allowed-tools` | No | Restricts which tools the skill can use. Omit to allow all tools |

**2. Structured Prompt Body**

Skills follow a consistent section order:
1. Title (`# <Action>`)
2. Description paragraph
3. Input section (`$ARGUMENTS`)
4. Process section (numbered Steps with bash examples)
5. Guidelines / Important Guidelines
6. Examples
7. Related Skills (with pipeline reference)
8. Example Usage (slash command invocations)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Prompt files, not code | SKILL.md | Skills are prompt templates — no runtime needed |
| Conventional commits | Enforced in every skill | Consistent naming across issues, branches, commits, PRs |
| GraphQL for PR threads | Required in address-pr-feedback | REST API doesn't expose `isResolved` on review threads |
| Git workflow | Worktree (default) or branch — configurable via project's CLAUDE.md | Used in create-issue, implement-issue to isolate work per issue |
| AskUserQuestion | Used for interactive skills | Structured user input with options, not free-form |
| Pipeline linking | Each skill's "Related Skills" section | Skills reference the next step so users discover the workflow |
