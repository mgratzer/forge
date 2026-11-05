# PR Workflow

## Commits

Format: `<type>(<scope>): <description>`

| Type | When to Use |
|------|-------------|
| `feat` | New skill or major new capability |
| `fix` | Incorrect behavior in a skill or the lens |
| `docs` | Documentation (docs/, README, AGENTS.md) |
| `refactor` | Restructure without changing behavior |
| `test` | Lens tests, the contract check, manual test scenarios |
| `chore` | Repository maintenance, tooling |
| `perf` | Efficiency, clarity or token usage, without changing behavior |

Scope is the skill name without `forge-`, or a general area:

```
feat(setup-project): add monorepo detection
fix(address-pr-feedback): correct GraphQL query for nested threads
test(lens): check the text formats against the skills that define them
chore: update workflow references across all skills
```

## Branches

Format: `<type>/<issue-number>-<short-kebab-description>`, or `<type>/<short-kebab-description>` with no Issue.

## PR Description

Use the body `forge-implement` writes, described in [pr-body](../skills/_shared/pr-body.md). For skill changes, `## Exercised` reports the runs in a sandbox: see [Testing](testing.md#exercise-a-skill-change).

## Review

[CI](testing.md) covers structure, the lens and the plugin. A review checks what it can't:

- Do the `gh` and `git` commands exist and do what the skill says?
- Does a changed convention match in every skill that states it?
- Would an agent follow the instructions unambiguously, including in unattended mode?
- Were `AGENTS.md` and `README.md` updated if commands, skills or the docs table changed?
