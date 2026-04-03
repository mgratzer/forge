# Coding Guidelines

These guidelines apply to writing and modifying SKILL.md files.

## Skill Structure

Every skill follows the same section order:

1. YAML frontmatter (`---` delimited)
2. Title (`# <Action Verb> <Object>`)
3. Description paragraph (optional — omit if the title is self-explanatory)
4. `## Input` — document `$ARGUMENTS`, default behavior, and, for skills with structured primary input, the shared trailing context syntax (`-- <additional context>`)
5. `## Process` — numbered `### Step N: <Action>` sections
6. `## Output Format` (optional) — template for structured output
7. `## Guidelines` — brief behavioral rules as a list
8. `## Related Skills` — link to the next relevant skill in the workflow
9. `## Example Usage` — slash command examples

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

## Writing Delegate Steps

When a skill benefits from fresh context (e.g., unbiased review), use two complementary mechanisms:

1. **`context: fork` frontmatter** — Claude Code's native mechanism. Forks the entire skill into a sub-agent. Ignored by runtimes that don't support it.
2. **`(delegate)` step annotation** — cross-runtime fallback. Instructs any runtime with sub-agent support to delegate a specific step.

Both can coexist in the same skill — `context: fork` handles Claude Code, `(delegate)` hints to other runtimes.

**Writing `(delegate)` steps:**

- Mark the step title: `### Step N: <Action> (delegate)` — or `#### <Action> (delegate)` when delegation is a conditional sub-step within a larger step
- Open with the delegation instruction and inline fallback
- Sub-agent instructions are either **fully self-contained in a blockquote** or **composed from a role reference plus task-specific instructions** (see [Using Roles in Delegate Steps](#using-roles-in-delegate-steps) below)
- List **Inputs provided to sub-agent** — data the parent must pass (diff output, file contents, project conventions)
- List **Expected output** — what the parent receives back
- Only delegate when it provides a genuine quality improvement — fresh context for unbiased review (e.g., reflect-pr) or parallel sub-agents for divergent exploration (e.g., brainstorm)

### Using Roles in Delegate Steps

When a delegation step benefits from a separated persona, extract it into a **role file** under the skill’s `roles/` directory (see [Architecture — Role File Format](architecture.md#role-file-format)). The skill then references the role and provides only task-specific instructions:

```markdown
#### Research (delegate)

Delegate to a [scout](roles/scout.md) sub-agent that receives only
the questions. If the runtime does not support sub-agents, read the role
file and answer each question following its rules.

**Inputs provided to sub-agent:**
- Role: [scout](roles/scout.md)
- The research questions

**Expected output:** One factual answer per question.
```

The role file defines the persona, behavior rules, and output format. The skill’s blockquote provides only the task-specific checklist or instructions. Runtimes that support role-aware delegation compose both into the sub-agent’s context; runtimes that don’t can read the role file inline.

Role files live inside the skill directory to ensure portable installation. If multiple skills need the same role, duplicate the file — self-containment beats DRY for distributed prompt files.

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
| Trailing context syntax | Append `-- <additional context>` as the final invocation segment for skills with structured primary input | setup-project, brainstorm, implement-issue, reflect-pr, address-pr-feedback |
| Review severity | P0-P3 (see reflect-pr/references/review-rubric.md) | reflect-pr |
| Sub-agent delegation | `context: fork` frontmatter + `(delegate)` step marker with role reference or self-contained instructions and inline fallback | brainstorm, implement-issue, reflect-pr |
| Parallel review agents | `(delegate)` step with parallel sub-agents, each focused on a different review dimension (correctness, security, code quality, efficiency); inline fallback executes sequentially | reflect-pr |
| Stop after questions | Present questions, wait for user confirmation before proceeding | brainstorm |
| Explore before asking | Check if codebase answers each question before asking the user; provide recommended answers | brainstorm |
| Divergent sub-agents | `(delegate)` step with parallel sub-agents, each given radically different constraints for approach contrast; inline fallback generates sequentially (see "Writing Delegate Steps") | brainstorm |
| Vertical slices | Split issues as thin end-to-end paths across all layers; classify as AFK or HITL | create-issue |
| Reusable roles | Co-located sub-agent personas under each skill’s `roles/`; skills reference them instead of inlining persona blocks | implement-issue (scout), reflect-pr (reviewer) |
| Blind research delegation | `(delegate)` research step using scout role — receives questions but not the ticket; inline fallback answers factually without suggesting implementations | implement-issue |
| Structure outline | High-level vertical phases with verification steps; each phase is a testable end-to-end slice | implement-issue |
| Durable decisions | Identify architectural decisions that survive implementation changes; keep as plan header | implement-issue |
| Workflow order | setup → [brainstorm →] create → implement → reflect → address | All skills |

## Instruction Budget

Frontier LLMs follow ~150-200 instructions with good consistency. Beyond that, adherence degrades and steps get skipped unpredictably. Since skills share the context window with AGENTS.md, system prompts, and tool definitions, keep individual skills lean:

- **Target: under 35 distinct instructions per skill.** Count each directive, conditional, and behavioral rule.
- **Delegate when growing past the budget.** Use sub-agent delegation to offload self-contained concerns (research, review, approach generation) into fresh context windows.
- **Don't use prompts for control flow.** If a skill has multi-way branching (mode selection, input type routing), split into focused skills or use a lightweight routing step.

## Style Rules

- Use `**bold**` for emphasis on key terms and warnings
- Use `> blockquote` for example dialogue or user-facing messages
- Use tables for structured reference data
- Use fenced code blocks with language hints (`bash`, `markdown`, `json`)
- Keep lines under 120 characters where practical
- Use em dashes (`—`) not hyphens for parenthetical clauses in prose
