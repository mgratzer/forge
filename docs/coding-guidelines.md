# Coding Guidelines

These apply to writing and modifying `SKILL.md` files.

## Skill Structure

Every skill follows the same section order:

1. YAML frontmatter
2. Title (`# <Action Verb> <Object>`)
3. Description paragraph (optional)
4. `## Input`: `$ARGUMENTS`, default behavior, and the trailing `-- <additional context>`
5. `## Process`: numbered `### Step N: <Action>` sections
6. `## Output Format` (optional)
7. `## Guidelines` (optional): constraints that fit no single step; omit it rather than restate the steps
8. `## Related Skills`: the next step in the workflow
9. `## Example Usage`: slash command examples

## Frontmatter

- `name`: kebab-case, prefixed with `forge-`, matching the directory.
- `description`: what the skill does and when to use it. Agents discover skills by this text. Quote it when it contains `: `, since installers parse YAML strictly.
- `disable-model-invocation`: `true` only for interviews whose whole purpose is questioning the user (`forge-setup-project`, `forge-shape`). Every other skill omits it so an orchestrating agent can run it through the Skill tool; its `description` then names explicit forge intent, so a plain "fix this bug" does not start it, and says when the skill stops to ask the user.
- `allowed-tools`: tools pre-approved while the skill is active. It doesn't restrict other tools. Forge skills write it comma-separated; the Agent Skills spec's form is space-separated and the field is experimental there, so support varies by agent.

## Process Steps

- One focused action per step, named with a verb.
- Use `AskUserQuestion` for user decisions.
- Show `gh` and `git` operations as commands. Every `gh` command must exist; check `--help` for flags rather than trusting memory.
- Use placeholders consistently: `<ISSUE_NUMBER>`, `<OWNER>`, `<REPO>`, `<BRANCH_NAME>`.

## Delegate Steps

Mark a step that benefits from fresh context with `(delegate)`: `### Step N: <Action> (delegate)`, or `#### <Action> (delegate)` for a conditional sub-step. Delegate only for a real gain: unbiased review, or parallel sub-agents for divergent exploration.

- Open with the delegation instruction and an inline fallback.
- Give instructions that stand alone: a blockquote, or a role reference plus the task.
- List **Inputs provided to sub-agent** and **Expected output**.
- Where the runtime can vary models per task, prefer a cheap fast model for factual scouting and a cheaper review-capable one for routine review, and save the strongest for synthesis, planning and hard implementation decisions. Otherwise inherit the parent's.

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

## Roles

A role file defines a sub-agent persona: identity, behavior rules, output format, constraints. Extract one when the persona has calibration rules worth separating, or when the skill nears its instruction budget; a persona of a sentence or two stays inline. A role one skill uses lives in that skill's `roles/`; a shared one in `skills/_shared/roles/`.

```yaml
---
name: <role-name>            # kebab-case, prefixed with forge- so it doesn't shadow a runtime's own "scout" or "reviewer"
description: <what it does>  # one sentence
---
```

A role file is not a runtime agent definition, so don't pass its `name:` as an agent selector. Push the role body through the delegated task or `systemPrompt`. If selecting an agent also selects a model or provider, leave the agent unspecified so the sub-agent inherits the parent session's configuration.

**Link rules.** `skills/_shared/` is the source, copied into each skill. `SKILL.md` links `_shared/<file>.md`, never `../_shared/`. A file in `references/` links `../_shared/<file>.md`. Files in `_shared/` link only inside the shared layer, relative to themselves. Edit `skills/_shared/` only, then run `scripts/sync-shared.sh`.

## Shared Conventions

Most conventions live in one `skills/_shared/` module that skills link rather than restate. To see who uses one:

```bash
git grep -l <module> -- skills ':!skills/forge-*/_shared/*'
```

These have no module, so each skill states them itself. When changing one, update them all:

- Conventional commits: `<type>(<scope>): <description>`, for Issue titles, branches, commits and PRs.
- Guidance file: `AGENTS.md` only.
- Trailing context: `-- <additional context>` as the final segment, in every skill.
- Workflow order, in each skill's Related Skills section.
- `--unattended`: skips the plan approval and triages findings on its own, per the review rubric's [Unattended Triage](../skills/_shared/review-rubric.md#unattended-triage). Feedback threads that need discussion are decided on evidence or left open for a person. Guard and land are always unattended.
- Deferred items: every one becomes an Issue in the project's tracker.

## Instruction Budget

Frontier models follow roughly 150 to 200 instructions consistently, and a skill shares that with `AGENTS.md`, system prompts and tool definitions.

- Aim for under 35 distinct instructions per skill, counting each directive, conditional and behavioral rule. This is a judgment call: no check counts them.
- Past that, delegate self-contained concerns (research, review, approach generation) to fresh context.
- Count composites per invocation: a composite also loads its components' instructions, so keep its own body thin.
- Don't use prompts for control flow. Split multi-way branching into focused skills or one light routing step.

## Style

- Use tables for structured reference data, and fenced code blocks with language hints.
- Docs and templates for text forge writes for people (commit messages, PR bodies and replies, Issues, summaries) use no em dashes: a comma, a colon, parentheses, or a new sentence. Skill prose itself may use them.
