# Coding Guidelines

These guidelines apply to writing and modifying SKILL.md files.

## Skill Structure

Every skill follows the same section order:

1. YAML frontmatter (`---` delimited)
2. Title (`# <Action Verb> <Object>`)
3. Description paragraph (optional; omit if the title is self-explanatory)
4. `## Input`: document `$ARGUMENTS`, default behavior, and the shared trailing context syntax (`-- <additional context>`)
5. `## Process`: numbered `### Step N: <Action>` sections
6. `## Output Format` (optional): template for structured output
7. `## Guidelines`: brief behavioral rules as a list
8. `## Related Skills`: link to the next relevant skill in the workflow
9. `## Example Usage`: slash command examples

## Frontmatter Conventions

- `name`: kebab-case, prefixed with `forge-` (e.g., `forge-setup-project`)
- `description`: one or two sentences describing what the skill does and when to use it. This text is what compatible agents use for skill discovery, so it must be descriptive.
- `disable-model-invocation`: set to `true` for skills that should only be invoked by the user via slash command (workflow entry points). Omit or set to `false` for skills that agents may auto-activate.
- `allowed-tools`: tools pre-approved to run while the skill is active. It pre-approves; it does not restrict other tools. Forge skills write it comma-separated; the Agent Skills spec's form is space-separated, and the field is experimental there, so support varies by agent.
- `context: fork`: forks the entire skill into a sub-agent on runtimes that support it. Only for skills with no interactive steps; currently no forge skill sets it.

## Writing Process Steps

- Each step should be a single, focused action
- Include bash examples for any CLI operations (especially `gh` and `git` commands)
- Use `AskUserQuestion` for user decisions; never assume
- Steps should be numbered sequentially and named with action verbs: "Create", "Fetch", "Analyze", "Generate"

## Writing Delegate Steps

When a step benefits from fresh context (e.g., unbiased review), mark it with the **`(delegate)` step annotation**: it works on any runtime with sub-agent support and falls back to inline execution elsewhere.

**`context: fork` frontmatter** is Claude Code's mechanism for forking the *entire* skill into a sub-agent. It suits only skills with no interactive steps, so skills that triage with the user (reflect, ship) use `(delegate)` instead; the two can coexist in a skill that qualifies.

**Writing `(delegate)` steps:**

- Mark the step title: `### Step N: <Action> (delegate)`, or `#### <Action> (delegate)` when delegation is a conditional sub-step within a larger step
- Open with the delegation instruction and inline fallback
- Sub-agent instructions are either **fully self-contained in a blockquote** or **composed from a role reference plus task-specific instructions** (see [Using Roles in Delegate Steps](#using-roles-in-delegate-steps) below)
- List **Inputs provided to sub-agent**: data the parent must pass (diff output, file contents, project conventions)
- List **Expected output**: what the parent receives back
- Only delegate when it provides a genuine quality improvement: fresh context for unbiased review (e.g., reflect), parallel sub-agents for divergent exploration (e.g., the optional approach-exploration step in shape), or keeping a noisy run's output (an app's logs during an exercise) out of the parent session

### Using Roles in Delegate Steps

When a delegation step benefits from a separated persona, extract it into a **role file** (see [Role File Format](#role-file-format) below). A role used by one skill lives in that skill's `roles/` directory; a role shared across skills lives in `skills/_shared/roles/`. The skill then references the role and provides only task-specific instructions:

```markdown
#### Research (delegate)

Delegate to a [forge-scout](_shared/roles/forge-scout.md) sub-agent that receives only
the questions. If the runtime does not support sub-agents, read the role
file and answer each question following its rules.

**Inputs provided to sub-agent:**
- Role: [forge-scout](_shared/roles/forge-scout.md)
- The research questions

**Expected output:** One factual answer per question.
```

The role file defines the persona, behavior rules, and output format. The skill's blockquote provides only the task-specific checklist or instructions. Runtimes that support role-aware delegation compose both into the sub-agent's context; runtimes that don't can read the role file inline.

**Important:** role files are **not** the same thing as runtime agent definitions. Do not assume a role file's `name:` can be passed as `agent: "<name>"` to a sub-agent tool. If the runtime separates prompt content from agent selection, push the role file body via the delegated task or `systemPrompt`. If selecting an agent also selects a model/provider, prefer leaving the agent unspecified so the sub-agent inherits the parent session configuration unless the user has explicitly configured a matching agent. Runtime-specific agent files, presets, or harness config are optional tuning layers; Forge must still work correctly without them.

Role files live inside the skill directory when only one skill uses them. When multiple skills need the same role or reference, the file lives in `skills/_shared/` (or `skills/_shared/roles/` for roles); the shared layer avoids duplication drift while keeping dependencies explicit. Skills link shared files as `_shared/<file>.md` through their own `_shared` symlink, never `../_shared/`, which breaks once skills are installed individually.

## Role File Format

Role files define reusable sub-agent personas. Skill-specific roles live under the skill's `roles/` directory; cross-skill roles live in `_shared/roles/`.

**YAML Frontmatter:**

```yaml
---
name: <role-name>           # Kebab-case, prefixed with `forge-`
description: <what it does>  # One sentence
---
```

**Body structure:** Title and identity statement → Behavior rules → Output format → Constraints (if any). The body is composed with task-specific instructions from the skill at delegation time.

Role names are prefixed with `forge-` to avoid shadowing generic names (`scout`, `reviewer`) that bundled runtimes may use.

## Bash Examples in Skills

- Every `gh` command must be a valid GitHub CLI command (used in GitHub provider paths)
- Use placeholder syntax consistently: `<ISSUE_NUMBER>`, `<OWNER>`, `<REPO>`, `<BRANCH_NAME>`
- Include comments in multi-step bash blocks explaining each command
- Show both the command and the expected usage pattern
- When reading repository files in examples, prefer the `Read` tool over shelling out with `cat`

## Cross-Skill Consistency

Conventions shared across skills. When modifying any, update every skill that references them:

| Convention | Format | Referenced In |
|------------|--------|---------------|
| Conventional commits | `<type>(<scope>): <description>` (titles, branches, commits, PRs) | create-issue, shape, implement, address-pr-feedback |
| Canonical guidance file | `AGENTS.md` only; no `CLAUDE.md` (an `@AGENTS.md` import only for Claude-specific content) | setup-project, implement |
| Validate approach | Present plan and get user confirmation before implementing (skipped in unattended mode) | implement, ship |
| Writing for humans | Plain, short, no em dashes, nothing the reader already has (`_shared/writing.md`) | implement, ship, create-issue, address-pr-feedback, setup-project |
| Quality passes | Simplify, security, and project-declared extra passes after the review, one owner per dimension; an inline skill's closing report is input, never the end of the turn (`_shared/quality-passes.md`) | ship, guard |
| Review record | Optional, project-declared; forge supplies facts, the project's spec sets the format; the newest record matches the handed-off tree (`_shared/review-record.md`) | ship, guard |
| PR body | Drafted blind by a sub-agent against `_shared/pr-body.md`: why first, two paragraphs, no changes list; a repository PR template sets the structure | implement, ship |
| Phase execution | Pre-flight, per-phase implementation/testing loop, phase gates; consolidated in `_shared/phase-execution.md` | implement |
| Pattern audit | When changing a pattern, update ALL files using it; consolidated in `_shared/pattern-audit.md` | implement, reflect |
| Mandatory deferred tracking | Create Issues (in the project's Issue tracker) for every Deferred item | reflect, ship, address-pr-feedback, guard |
| Trailing context syntax | Append `-- <additional context>` as the final invocation segment | All skills |
| Review severity | P0-P3 (see _shared/review-rubric.md) | reflect, ship, guard |
| Sub-agent delegation | `(delegate)` step marker with role reference or self-contained instructions and inline fallback; `context: fork` frontmatter available when an entire skill benefits from fresh context | shape, implement, reflect, ship, guard, batch |
| Review delegation | Tiny low-risk diffs stay inline when the session didn't author them; otherwise use one fresh-context reviewer by default and add a second focused pass only for high-risk or broad diffs. Consolidated in `_shared/review-delegation.md`; inline fallback executes the same lean shape sequentially | reflect, ship |
| One question at a time | Ask convergent questions one at a time with recommended answers; do not batch (see shape/references/shaping-methodology.md) | shape |
| Challenge then converge | Push back on terminology conflicts with CONTEXT.md, code contradictions, and vague boundaries; invent concrete scenarios to stress-test fuzzy edges | shape |
| Vocabulary discipline | Use CONTEXT.md terms when framing questions; update CONTEXT.md inline when terms are resolved during shaping; add `_Avoid_` aliases for rejected synonyms | shape |
| Explore before asking | Check if codebase answers each question before asking the user; provide recommended answers | shape |
| Divergent sub-agents | `(delegate)` step with parallel sub-agents, each given radically different constraints for approach contrast; inline fallback generates sequentially (see "Writing Delegate Steps") | shape (Step 3, optional) |
| Vertical slices | Split issues as thin end-to-end paths across all layers; classify as AFK or HITL | create-issue |
| Reusable roles | Sub-agent personas under `roles/`: skill-specific roles co-locate with the skill; cross-skill roles live in `_shared/roles/` | implement (forge-scout), reflect + ship via review-delegation (forge-reviewer); both in `_shared/roles/` |
| Blind research delegation | `(delegate)` research step using forge-scout role: receives questions but not the Issue; inline fallback answers factually without suggesting implementations | implement |
| Structure outline | High-level vertical phases with verification steps; each phase is a testable end-to-end slice | implement |
| Durable decisions | Identify architectural decisions that survive implementation changes; keep as plan header | implement |
| Skill composition | Composite skills reuse component processes and shared `_shared/` modules; orchestrators stay lean | ship |
| Tool-layer integration | Use runtime capabilities (sub-agent tools, per-task model choice) when present, with an inline fallback; never depend on a runtime-specific agent name | implement (forge-scout), reflect + ship (via `_shared/review-delegation.md`), batch (forge-scout), guard (`/simplify`, `/security-review`) |
| Unattended mode | `--unattended` flag skips user interaction; plan approval auto-proceeds, triage fixes in-scope findings by default and defers only truly larger or out-of-scope items; Discussion threads are decided on evidence or left open for the human | ship, implement, address-pr-feedback, batch; guard is always unattended |
| Local mode | `--local` or `Publish: local` stops before the push at `ready-for-local-review`; `forge-ship --publish` rebases, reviews what isn't attested, and publishes; `--guard` always publishes | implement, ship |
| Status reporting | Report state transitions through `FORGE_STATUS_CMD` (see `_shared/status-reporting.md`); terminal state exactly once | implement, review-delegation, guard, ship |
| Project configuration | Resolve the Shipping settings: AGENTS.md's `## Shipping` section (legacy `## Unattended Shipping`) wins, then the user's `~/.config/forge/shipping.md`, then defaults (see `_shared/project-config.md`) | every skill that touches Issues (`Issue tracker`); implement, reflect, ship, guard, batch for the rest; the table in project-config names each setting's consumers |
| Issue tracker providers | Provider operations consolidated in `_shared/issue-operations.md`; skills reference it instead of inlining conditionals | create-issue, implement, reflect, ship, shape, address-pr-feedback, guard, batch |
| Workflow order | setup → [shape →] create → implement → reflect → address → guard; ship composes implement + reflect [+ guard]; batch groups Issues for launchers | All skills |

## Instruction Budget

Every instruction in a skill competes with the task for attention, skills share the context with AGENTS.md, system prompts, and tool definitions, and composite skills stack their components' instructions. Keep individual skills lean so they compose:

- **Target: under 35 distinct instructions per skill.** Count each directive, conditional, and behavioral rule. The number is a composability heuristic, not a model limit; a larger context window doesn't raise it.
- **Delegate when growing past the budget.** Use sub-agent delegation to offload self-contained concerns (research, review, approach generation) into fresh context windows.
- **Count composites per invocation.** A composite skill loads its component's instructions too, so keep the composite's own body thin so the combined load stays reasonable.
- **Prefer the minimum effective reviewer count.** For review, keep tiny low-risk diffs inline when the session didn't author them, otherwise start with one focused fresh-context reviewer and deepen only when risk clearly justifies another pass.
- **Match effort and model to task shape.** For factual scouting and routine review, try the same model at lower effort before switching to a cheaper model, and switch only when it holds up (Claude Code subagents can set `model` and `effort`). Save full effort for synthesis, planning, and hard implementation decisions. If the runtime cannot vary either per task, the skill still works by inheriting the parent session's settings.
- **Don't use prompts for control flow.** If a skill has multi-way branching (mode selection, input type routing), split into focused skills or use a lightweight routing step.

## Style Rules

- Use `**bold**` for emphasis on key terms and warnings
- Use `> blockquote` for example dialogue or user-facing messages
- Use tables for structured reference data
- Use fenced code blocks with language hints (`bash`, `markdown`, `json`)
- Keep lines under 120 characters where practical
- No em dashes: use a comma, a colon, parentheses, or a new sentence. The model mirrors the prompt's register in what it writes for people (see `_shared/writing.md`)
