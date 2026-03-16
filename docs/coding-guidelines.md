# Coding Guidelines

These guidelines apply to writing and modifying SKILL.md files.

## Skill Structure

Every skill follows the same section order:

1. YAML frontmatter (`---` delimited)
2. Title (`# <Action Verb> <Object>`)
3. Description paragraph (optional — omit if the title is self-explanatory)
4. `## Input` — document `$ARGUMENTS`, default behavior, and, for skills with structured primary input, the shared trailing context syntax (`-- <additional context>`)
5. `## Process` — numbered `### Step N: <Action>` sections
6. `## Guidelines` — brief behavioral rules as a list
7. `## Output Format` (optional) — template for structured output
7. `## Related Skills` — link to the next relevant skill in the workflow
8. `## Example Usage` — slash command examples

## Frontmatter Conventions

- `name`: kebab-case, prefixed with `forge-` (e.g., `forge-setup-project`)
- `description`: one sentence describing what the skill does and when to use it. This text is what compatible agents use for skill discovery, so it must be descriptive.
- `disable-model-invocation`: set to `true` for skills that should only be invoked by the user via slash command (workflow entry points). Omit or set to `false` for skills that agents may auto-activate.
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
- When reading repository files in examples, prefer the `Read` tool over shelling out with `cat`

## Cross-Skill Consistency

Conventions shared across skills. When modifying any, update every skill that references them:

| Convention | Format | Referenced In |
|------------|--------|---------------|
| Conventional commits | `<type>(<scope>): <description>` — titles, branches, commits, PRs | create-issue, implement-issue, address-pr-feedback |
| Canonical guidance file | `AGENTS.md` canonical; `CLAUDE.md` compatibility symlink | setup-project, implement-issue, reflect-pr |
| Validate approach | Present plan and get user confirmation before implementing | implement-issue |
| Pre-flight validation | Verify external deps, config placement, generated types before feature code | implement-issue |
| Test as you go | Run tests after each commit, not just at the end | implement-issue |
| Pattern audit | When changing a pattern, update ALL files using it | implement-issue, reflect-pr |
| Mandatory deferred tracking | Create GitHub issues for all deferred items found in reflection | reflect-pr |
| Trailing context syntax | Append `-- <additional context>` as the final invocation segment for skills with structured primary input | setup-project, implement-issue, reflect-pr, address-pr-feedback |
| Pipeline order | setup → create → implement → reflect → address | All skills |

## Style Rules

- Use `**bold**` for emphasis on key terms and warnings
- Use `> blockquote` for example dialogue or user-facing messages
- Use tables for structured reference data
- Use fenced code blocks with language hints (`bash`, `markdown`, `json`)
- Keep lines under 120 characters where practical
- Use em dashes (`—`) not hyphens for parenthetical clauses in prose
