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

`CLAUDE.md` is a compatibility symlink to `AGENTS.md`, never a separate source of truth.

## Input

Optional project root path (`$ARGUMENTS`; defaults to cwd). Optional: `-- <additional context>` for execution guidance.

## Process

### Step 1: Assess What Exists

Scan the project root for `AGENTS.md`, `CLAUDE.md`, `README.md`, and `docs/`. The file state determines the work: nothing exists → generate from scratch; legacy `CLAUDE.md` without `AGENTS.md` → migrate it to `AGENTS.md`, then update; `AGENTS.md` exists → audit and update.

### Step 2: Explore the Codebase

Explore structure, tooling, CI/CD, and docs (skip for greenfield projects). Classify each finding as **discoverable** (agents can find it themselves) or **requires documentation** (decisions, conventions, failure modes) — only the second category belongs in context files.

Assess **agent readiness**: feedback loops (tests, linter, build cycle speed), module structure, app legibility, known risks.

### Step 3: Audit Existing Guidance

When guidance files already exist, score each section:

| Criterion | Test |
|-----------|------|
| **Specificity** | Does this describe THIS project, or could it apply to any project? |
| **Undiscoverability** | Would an agent find this by exploring? If yes, it's wasted context. |
| **Currency** | Does this match the current codebase? Verify commands, paths, patterns. |
| **Signal density** | Ratio of actionable information to total words? |

Present an audit report grouped by impact and get user confirmation via AskUserQuestion before applying changes.

### Step 4: Gather Project Information

Use AskUserQuestion for what code cannot reveal: core principles, repeated failure modes, and domain invariants — plus anything ambiguous from exploration and gaps surfaced by the Step 3 audit. Never ask what's discoverable from code. Incorporate any trailing context when deciding what to ask.

### Step 5: Generate or Update AGENTS.md

Create or update `AGENTS.md`. Target **~150-200 lines**; every line must pass the undiscoverability test. See [agents-md-template.md](references/agents-md-template.md) for the structure. When migrating, fold accepted legacy content in and replace the old file with a symlink in Step 7.

### Step 6: Generate or Update Tier 2 — docs/

Create `docs/architecture.md` (design decisions, data flow, module responsibilities) and `docs/pr-workflow.md` (branch naming, PR checklist, review process); offer further docs (development, coding-guidelines, testing, domain-specific) via AskUserQuestion only when exploration surfaced content that warrants them. Every doc must pass the undiscoverability test — an empty doc wastes context.

### Step 7: Create Compatibility Symlink and Update .gitignore

```bash
# Replace any legacy CLAUDE.md with a symlink to the canonical AGENTS.md
rm -f CLAUDE.md
ln -sf AGENTS.md CLAUDE.md
```

If the platform doesn't support symlinks, stop and tell the user. Append missing stack-appropriate entries to `.gitignore` — never overwrite an existing one.

### Step 8: Create Human-Facing Files

Create `README.md` if it doesn't exist (project description, quick start, docs links — for humans, not agent context). If one exists, ask via AskUserQuestion: replace, merge, or keep?

### Step 9: Commit

Stage and commit the new/modified files: `docs: set up agentic context infrastructure` (or `docs: update context infrastructure` when updating). Skip the commit if unrelated staged changes exist or generated files have unresolved questions.

### Step 10: Summarize

Report what was created/changed — see [output-format.md](references/output-format.md). Include tier status with line counts, agent readiness assessment, and next steps.

## Guidelines

- **Undiscoverability test** — "Would an agent find this by exploring?" If yes, don't write it.
- **Signal over volume** — tables beat paragraphs; omit empty sections.
- **Tier discipline** — AGENTS.md targets 150-200 lines. Past 200, move to Tier 2.
- **Edge cases** — monorepos: suggest per-package AGENTS.md. No tests/CI: mention as next steps.

## Related Skills

**Next step:** Use `forge-create-issue` to plan your first piece of work — or `forge-shape` if the idea is still rough and needs convergent questioning first.

## Example Usage

```
/forge-setup-project
/forge-setup-project /path/to/project
/forge-setup-project -- keep the setup lean and call out missing feedback loops
```
