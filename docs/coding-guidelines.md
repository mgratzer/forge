# Coding Guidelines

These guidelines apply to writing and modifying SKILL.md files.

## Skill Structure

Every skill follows the same section order. Do not deviate from this structure:

1. YAML frontmatter (`---` delimited)
2. Title (`# <Action Verb> <Object>`)
3. Description paragraph
4. `## Input` — document `$ARGUMENTS` and default behavior
5. `## Process` — numbered `### Step N: <Action>` sections
6. `## Guidelines` or `## Important Guidelines`
7. `## Examples` (optional)
8. `## Related Skills` — pipeline links
9. `## Example Usage` — slash command examples

## Frontmatter Conventions

- `name`: kebab-case, prefixed with `forge-` (e.g., `forge-setup-project`)
- `description`: one sentence describing what the skill does and when to use it. This text is what Claude Code uses for skill discovery, so it must be descriptive.
- `disable-model-invocation`: set to `true` for skills that require heavy user interaction
- `allowed-tools`: comma-separated list of tools the skill may use. Omit to allow all tools.

## Writing Process Steps

- Each step should be a single, focused action
- Include bash examples for any CLI operations (especially `gh` and `git` commands)
- Use `AskUserQuestion` for user decisions — never assume
- Steps should be numbered sequentially and named with action verbs: "Create", "Fetch", "Analyze", "Generate"

## Bash Examples in Skills

- Every `gh` command must be a valid GitHub CLI command
- Use placeholder syntax consistently: `<ISSUE_NUMBER>`, `<OWNER>`, `<REPO>`, `<BRANCH_NAME>`
- Include comments in multi-step bash blocks explaining each command
- Show both the command and the expected usage pattern

## Cross-Skill Consistency

Several conventions are shared across all skills and must be identical everywhere:

| Convention | Format | Referenced In |
|------------|--------|---------------|
| Commit messages | `<type>(<scope>): <description>` | create-issue, implement-issue, reflect-pr, address-pr-feedback |
| Branch names | `<type>/<issue-number>-<description>` | create-issue, implement-issue |
| Git workflow | Worktree (default) or branch — check project's CLAUDE.md for `git_workflow` | create-issue, implement-issue |
| Issue titles | `<type>(<scope>): <description>` | create-issue |
| PR titles | `<type>(<scope>): <description>` | implement-issue |
| Commit types | feat, fix, docs, refactor, test, chore, perf | All skills |
| No attribution | Never add Co-Authored-By lines | implement-issue, address-pr-feedback |
| No time estimates | Never include time estimates | create-issue |
| Validate approach | Present plan and get user confirmation before implementing | implement-issue |
| Pre-flight validation | Verify external deps, config placement, generated types before feature code | implement-issue |
| Continuous quality checks | Run tests after each commit, not just at the end | implement-issue |
| Pattern audit | When changing a pattern, update ALL files using it | implement-issue, reflect-pr |
| Mandatory deferred tracking | Create GitHub issues for all deferred items found in reflection | reflect-pr |
| Pipeline order | setup → create → implement → reflect → address → changelog | All skills |

When modifying any of these conventions, update **every skill** that references them.

## Style Rules

- Use `**bold**` for emphasis on key terms and warnings
- Use `> blockquote` for example dialogue or user-facing messages
- Use tables for structured reference data
- Use fenced code blocks with language hints (`bash`, `markdown`, `json`)
- Keep lines under 120 characters where practical
- Use em dashes (`—`) not hyphens for parenthetical clauses in prose
