# PR Workflow

## Commit Conventions

Format: `<type>(<scope>): <description>`

| Type | When to Use |
|------|-------------|
| `feat` | New skill or major new capability in an existing skill |
| `fix` | Fix incorrect behavior in a skill |
| `docs` | Documentation changes (docs/, README, AGENTS.md) |
| `refactor` | Restructure a skill without changing its behavior |
| `test` | Add or update validation guidance, test instructions, or manual test workflows |
| `chore` | Repository maintenance, tooling changes |
| `perf` | Improve skill efficiency, clarity, or token usage without changing behavior |

Scope is the skill name without the `forge-` prefix, or a general area:

```
feat(setup-project): add monorepo detection
fix(address-pr-feedback): correct GraphQL query for nested threads
docs(architecture): add skill file format reference
refactor(create-issue): simplify label selection logic
chore: update workflow references across all skills
```

## Branch Naming

Format: `<type>/<issue-number>-<short-kebab-description>`

```
feat/12-add-setup-project-skill
fix/34-graphql-thread-resolution
docs/56-update-architecture-docs
```

## Pre-Commit Checks

See [testing.md — Structural Review](testing.md#1-structural-review) for the canonical checklist.

## PR Checklist

- [ ] Skill follows the standard section order
- [ ] YAML frontmatter is complete and accurate
- [ ] Bash examples are valid and runnable
- [ ] Cross-skill conventions are consistent, including the shared `-- <additional context>` syntax where applicable
- [ ] Workflow references updated in relevant skills (if workflow order changed)
- [ ] AGENTS.md updated (if guidance or commands changed)
- [ ] README.md updated (if features or docs table changed)

## PR Description

```markdown
## Summary

<1-2 sentences: what changed and why>

Closes #<issue-number>

## Changes

- <skill or file>: <what changed>

## Test Plan

- [ ] Invoked skill via `/forge-<name>` on a test project
- [ ] Verified generated output is correct
- [ ] Checked cross-skill consistency
```

## Review Process

Skills are prompt templates — review focuses on:

1. **Correctness**: Do the bash examples work? Are `gh` commands valid?
2. **Consistency**: Do shared conventions match across all skills?
3. **Completeness**: Does the skill handle edge cases mentioned in its Guidelines section?
4. **Clarity**: Would a future-compatible agent follow the instructions unambiguously?
