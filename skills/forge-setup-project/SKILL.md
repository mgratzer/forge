---
name: forge-setup-project
description: Set up or update a project's context infrastructure for agentic engineering — AGENTS.md as lean hot memory, docs/ as earned warm memory, with signal-to-noise scoring for existing guidance. Use when starting a new project, retrofitting an existing codebase, or auditing current guidance quality.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, AskUserQuestion
---

# Set Up or Update Project Context Infrastructure

Set up or update a project's context infrastructure for agentic engineering. Context is organized in three tiers:

| Tier | File(s) | Role |
|------|---------|------|
| **1 — Hot memory** | AGENTS.md | Always loaded. Lean, convention-dense. Only what agents need constantly. |
| **2 — Warm memory** | docs/*.md | Loaded on-demand by topic. Created only when content earns its token cost. |
| **3 — Cold memory** | Specs, schemas, runbooks | On-demand references for complex projects. Not created by this skill. |

**Central principle: context must earn its token cost.** Only include knowledge that agents cannot discover by exploring the codebase with Grep, Glob, and Read.

`CLAUDE.md` is a compatibility symlink to `AGENTS.md`, never a separate source of truth.

## Input

Optional project root path (defaults to cwd). Optional: `-- <additional context>` for execution guidance.

## Process

### Step 1: Determine Mode

Scan the project root for `AGENTS.md`, `CLAUDE.md`, `README.md`, and `docs/`.

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Setup** | Neither `AGENTS.md` nor `CLAUDE.md` exists | Generate tiered context from scratch |
| **Audit & Update** | `AGENTS.md` exists | Score existing guidance, identify improvements, apply changes |
| **Legacy Migration** | `CLAUDE.md` exists but `AGENTS.md` does not | Migrate `CLAUDE.md` to `AGENTS.md`, then update |

### Step 2: Explore the Codebase

Skip for greenfield projects (no code exists).

Explore thoroughly: structure, language/runtime, scripts, CI/CD, lint/format/test config, docs. Classify each finding as **discoverable** (agents can find it) or **requires documentation** (decisions, conventions, failure modes). Only the second category belongs in context files.

Assess **agent readiness**: feedback loops (tests, linter, build cycle speed), module structure (entry points, boundaries), app legibility (bootable locally?), known risks.

### Step 3: Audit Existing Guidance (Audit & Legacy Migration modes only)

Read all existing guidance files. Score each section:

| Criterion | Test |
|-----------|------|
| **Specificity** | Does this describe THIS project, or could it apply to any project? |
| **Undiscoverability** | Would an agent find this by exploring? If yes, it's wasted context. |
| **Currency** | Does this match the current codebase? Verify commands, paths, patterns. |
| **Signal density** | Ratio of actionable information to total words? |

Present an audit report. Group recommendations into quick wins, high-value additions, and structural changes. Get user confirmation via AskUserQuestion before applying.

### Step 4: Gather Project Information

Use AskUserQuestion to collect what cannot be determined from code.
Incorporate any optional additional context when deciding what to ask, audit, or prioritize.

**Always ask:**

1. **Core principles** — "What 3-5 rules should always guide development?" Offer examples from what you observed.
2. **Failure modes** — "What mistakes do agents or new developers repeat? What breaks?" Each entry must trace to an observed mistake.
3. **Domain invariants** — "What rules must never be violated? What causes silent bugs?"

**Ask only if ambiguous from code:**

4. Conventions with enforcement mechanisms
5. Confirm detected commands if multiple options exist
6. How to handle existing meta files (if found without `AGENTS.md`)

**Never ask** what's discoverable from code — language, framework, test runner, scripts, directory structure.

For Audit/Migration modes, ask about gaps found in Step 3.

### Step 5: Generate or Update AGENTS.md

Create or update `AGENTS.md`. Target **~150-200 lines**. Every line must pass the undiscoverability test.

See [agents-md-template.md](references/agents-md-template.md) for the template structure.

For **Legacy Migration**: migrate accepted content into `AGENTS.md`, fold duplicates, replace legacy file with symlink in Step 7.

### Step 6: Generate or Update Tier 2 — docs/

Only create docs with actual content. An empty doc wastes context.

**Always created:**

- `docs/architecture.md` — design decisions, data flow, module responsibilities. Not directory listings.
- `docs/pr-workflow.md` — branch naming, PR checklist, review process. Reference AGENTS.md for commit format.

**Created only when warranted** (offer via AskUserQuestion based on detection):

- `docs/development.md` — when setup has gotchas or multi-step requirements
- `docs/coding-guidelines.md` — when project has specific patterns worth codifying
- `docs/testing.md` — when test patterns are non-obvious
- Additional domain-specific docs as needed

All Tier 2 docs must pass the undiscoverability test. Use tables for structured data. Include actual file paths.

### Step 7: Compatibility Symlink and .gitignore

```bash
rm -f CLAUDE.md
ln -sf AGENTS.md CLAUDE.md
```

If the platform doesn't support symlinks, stop and tell the user.

Create or update `.gitignore` with entries matching the detected stack. Never overwrite an existing `.gitignore` — append only missing entries.

### Step 8: Human-Facing Files

Create if it doesn't exist (this is for humans, not agent context):

- **README.md** — project description, quick start, docs links. If one exists, ask: replace, merge, or keep?

### Step 9: Commit

Stage and commit all new/modified files:
- Setup mode: `docs: set up agentic context infrastructure`
- Audit/Migration: `docs: update context infrastructure`

Do not commit if: dry run requested, unrelated staged changes exist, or generated files have unresolved questions.

### Step 10: Summary

Report what was created/changed. See [output-format.md](references/output-format.md) for the structure. Include tier status with line counts, agent readiness assessment, and next steps.

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
