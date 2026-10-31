---
name: forge-setup-project
description: Set up or update a project's context infrastructure for agentic engineering — AGENTS.md as lean hot memory, docs/ as earned warm memory, with signal-to-noise scoring for existing guidance. Use when starting a new project, retrofitting an existing codebase, or auditing current guidance quality.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, AskUserQuestion
---

# Set Up or Update Project Context Infrastructure

Context is organized in three tiers:

| Tier | File(s) | Role |
|------|---------|------|
| **1 — Hot memory** | AGENTS.md | Always loaded. Lean, convention-dense. Only what agents need constantly. |
| **2 — Warm memory** | docs/*.md | Loaded on-demand by topic. Created only when content earns its token cost. |
| **3 — Cold memory** | Specs, schemas, runbooks | On-demand references for complex projects. Not created by this skill. |

**Central principle: context must earn its token cost.** Only include knowledge that agents cannot discover by exploring the codebase with Grep, Glob, and Read.

`AGENTS.md` is the only guidance file. Don't create a `CLAUDE.md`: Claude Code reads `AGENTS.md` natively when no `CLAUDE.md` or `CLAUDE.local.md` is present, so a symlink or copy only adds a second name. A `CLAUDE.md` is justified only for Claude-specific content the user wants kept — then it is `@AGENTS.md` followed by that content, never a copy.

## Input

Optional project root path (`$ARGUMENTS`; defaults to cwd). Optional: `-- <additional context>` for execution guidance.

## Process

### Step 1: Assess What Exists

Scan the project root for `AGENTS.md`, `CLAUDE.md`, `README.md`, and `docs/`. The file state determines the work: nothing exists → generate from scratch; legacy `CLAUDE.md` without `AGENTS.md` → migrate it to `AGENTS.md`, then update; `AGENTS.md` exists → audit and update. A `CLAUDE.md` that is a symlink to or copy of `AGENTS.md` is removed in Step 7.

### Step 2: Explore the Codebase

Explore structure, tooling, CI/CD, and docs (skip for greenfield projects). Classify each finding as **discoverable** (agents can find it themselves) or **requires documentation** (decisions, conventions, failure modes) — only the second category belongs in context files.

Assess **agent readiness**: feedback loops (tests, linter, build cycle speed), module structure, app legibility, known risks. A check that prints pages on success fills the agent's context with noise: under feedback loops, name the tool's quiet flag when it has one, or leave a `<!-- TODO -->` for a wrapper that prints one line on success and everything on failure.

Also discover what unattended shipping needs: a run recipe for the app and the `## Unattended Shipping` settings, per [unattended-shipping](references/unattended-shipping.md).

### Step 3: Audit Existing Guidance

When guidance files already exist, score each section:

| Criterion | Test |
|-----------|------|
| **Specificity** | Does this describe THIS project, or could it apply to any project? |
| **Undiscoverability** | Would an agent find this by exploring? If yes, it's wasted context. |
| **Currency** | Does this match the current codebase? Verify commands, paths, patterns. |
| **Signal density** | Ratio of actionable information to total words? |
| **Scope** | Does every task need this, or only some? Guidance for one area (migrations, a service's logs) goes in a conditional block, or in a doc it points to. |

Present an audit report grouped by impact and get user confirmation via AskUserQuestion before applying changes.

### Step 4: Gather Project Information

Use AskUserQuestion for what code cannot reveal: core principles, repeated failure modes, and domain invariants — plus anything ambiguous from exploration, gaps surfaced by the Step 3 audit, and the run recipe parts and unattended settings discovery left open. Never ask what's discoverable from code. Incorporate any trailing context when deciding what to ask.

### Step 5: Generate or Update AGENTS.md

Create or update `AGENTS.md`. Keep it **under ~200 lines** — length comes from content that passes the undiscoverability test, so a small project's file is short. See [agents-md-template.md](references/agents-md-template.md) for the structure. When migrating, fold accepted legacy content in and remove the old file in Step 7.

Write the run recipe under Commands and the `## Unattended Shipping` section the user accepted, per [unattended-shipping](references/unattended-shipping.md). Never write an `Auto-merge` line: it is the user's opt-in, after they have agreed with land's verdicts.

### Step 6: Generate or Update Tier 2 — docs/

Create `docs/architecture.md` (design decisions, data flow, module responsibilities) and `docs/pr-workflow.md` (branch naming, PR checklist, review process); offer further docs (development, coding-guidelines, testing, domain-specific) via AskUserQuestion only when exploration surfaced content that warrants them. Every doc must pass the undiscoverability test — an empty doc wastes context.

### Step 7: Remove Redundant CLAUDE.md and Update .gitignore

Delete a `CLAUDE.md` that is a symlink to `AGENTS.md`, a copy of it, or legacy content now migrated into it (`git rm` when tracked). If it still holds content that isn't in `AGENTS.md`, ask the user via AskUserQuestion before deleting it. If it holds Claude-specific content the user wants to keep, reduce it to `@AGENTS.md` plus that content instead. If a `CLAUDE.local.md` exists, tell the user: Claude Code skips `AGENTS.md` while one is present. When you remove a `CLAUDE.md`, mention that some Claude Code versions and setups read only `CLAUDE.md` ([which ones](https://code.claude.com/docs/en/memory#when-agents-md-support-is-unavailable)); for those, the fix is a `CLAUDE.md` containing `@AGENTS.md`. Append missing stack-appropriate entries to `.gitignore` — never overwrite an existing one.

### Step 8: Create Human-Facing Files

Create `README.md` if it doesn't exist (project description, quick start, docs links — for humans, not agent context). If one exists, ask via AskUserQuestion: replace, merge, or keep?

### Step 9: Commit

Stage and commit the new/modified files: `docs: set up agentic context infrastructure` (or `docs: update context infrastructure` when updating). Skip the commit if unrelated staged changes exist or generated files have unresolved questions.

### Step 10: Summarize

Report what was created/changed — see [output-format.md](references/output-format.md). Include tier status with line counts, agent readiness assessment, and next steps.

## Guidelines

- **Undiscoverability test** — "Would an agent find this by exploring?" If yes, don't write it.
- **Signal over volume** — tables beat paragraphs; omit empty sections.
- **Tier discipline** — AGENTS.md stays under ~200 lines. Past 200, move to Tier 2.
- **Edge cases** — monorepos: suggest per-package AGENTS.md. No tests/CI: mention as next steps.

## Related Skills

**Next step:** Use `forge-create-issue` to plan your first piece of work — or `forge-shape` if the idea is still rough and needs convergent questioning first.

## Example Usage

```
/forge-setup-project
/forge-setup-project /path/to/project
/forge-setup-project -- keep the setup lean and call out missing feedback loops
```
