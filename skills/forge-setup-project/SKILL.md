---
name: forge-setup-project
description: Set up or update a project's context infrastructure for agentic engineering — CLAUDE.md as lean hot memory, docs/ as earned warm memory, with signal-to-noise scoring for existing guidance. Use when starting a new project, retrofitting an existing codebase, or auditing current guidance quality.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, AskUserQuestion
---

# Set Up or Update Project Context Infrastructure

Set up or update a project's context infrastructure for agentic engineering. Context is organized in three tiers:

| Tier | File(s) | Role |
|------|---------|------|
| **1 — Hot memory** | CLAUDE.md | Always loaded. Lean, convention-dense. Only what agents need constantly. |
| **2 — Warm memory** | docs/*.md | Loaded when agent navigates to a topic. Created only when content earns its token cost. |
| **3 — Cold memory** | Specs, schemas, runbooks | On-demand references for complex projects. Not created by this skill — recommended in summary. |

**Central principle: context must earn its token cost.** Generic overviews hurt agent performance. Only include knowledge that agents cannot discover by exploring the codebase with Grep, Glob, and Read.

## Input

Optional: A path to the project root: $ARGUMENTS

If no argument is provided, use the current working directory.

## Process

### Step 1: Determine Mode

Scan the project root to classify what exists:

```bash
# Check for existing guidance files
ls -la CLAUDE.md AGENTS.md README.md CHANGELOG.md .claude/settings.local.json 2>/dev/null

# Check for docs directory
ls docs/ 2>/dev/null

# Check for any code at all
ls -la
```

**Classify into one of two modes:**

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Setup** | No CLAUDE.md exists | Generate tiered context from scratch |
| **Audit & Update** | CLAUDE.md exists | Score existing guidance, identify improvements, apply changes |

**If some meta files exist but no CLAUDE.md:** treat as Setup. Note which files exist — you will ask the user how to handle them after exploration (Step 4).

### Step 2: Explore the Codebase

**Skip this step for greenfield projects (no code exists).**

For existing projects, perform a thorough exploration:

```bash
# Directory structure (top 3 levels)
find . -maxdepth 3 -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './vendor/*' -not -path './.next/*' -not -path './dist/*' -not -path './build/*' | head -100

# Detect language/runtime
ls package.json go.mod Cargo.toml pyproject.toml setup.py Gemfile build.gradle pom.xml mix.exs deno.json bunfig.toml composer.json 2>/dev/null

# Package manager and scripts
cat package.json 2>/dev/null | head -80
cat Makefile 2>/dev/null | head -80
cat Taskfile.yml 2>/dev/null | head -80

# Entry points
ls -la src/ app/ cmd/ lib/ main.* index.* 2>/dev/null

# CI/CD configuration
ls .github/workflows/*.yml .gitlab-ci.yml Jenkinsfile .circleci/config.yml 2>/dev/null

# Lint/format configuration
ls .eslintrc* biome.json .prettierrc* .golangci.yml rustfmt.toml .rubocop.yml pyproject.toml 2>/dev/null

# Test configuration
ls jest.config* vitest.config* pytest.ini .mocharc* 2>/dev/null

# Docker
ls Dockerfile docker-compose*.yml 2>/dev/null

# Existing documentation
ls docs/*.md *.md 2>/dev/null
```

**As you explore, mentally classify each finding:**
- **Discoverable** — an agent can find this by exploring (directory structure, package.json scripts, file patterns)
- **Requires documentation** — an agent cannot infer this from code (design decisions, conventions, failure modes, invariants)

Only the second category belongs in context files.

#### Agent Readiness

After exploration, assess three dimensions:

**Feedback loops** — can an agent validate its own work?

| Check | Finding |
|-------|---------|
| Tests exist and pass | <yes/no — run the test command if detected> |
| Linter runs cleanly | <yes/no> |
| Build succeeds | <yes/no> |
| Feedback cycle time | <fast (<30s) / slow (>2min) / broken> |
| Verification tools | <project-specific scripts agents can call to check their work — e.g., screenshot comparison, seed data reset, schema validation> |

**Module structure** — can an agent navigate by exploration?

| Check | Finding |
|-------|---------|
| Clear entry points | <are src/, app/, cmd/, lib/ obvious?> |
| Module boundaries | <do directories correspond to logical modules, or is it a flat web of imports?> |
| Interface clarity | <are public APIs explicit (index files, exports), or does everything import everything?> |

**Application legibility** — can an agent inspect the running app?

| Check | Finding |
|-------|---------|
| App bootable locally | <can an agent start the app to verify changes?> |
| UI inspectable | <are screenshots, DOM snapshots, or browser automation available?> |
| Logs/metrics queryable | <can an agent access logs or metrics programmatically?> |

**Known risks** — what will trip an agent up?

<list specific risks discovered during exploration — e.g., "dual architecture (legacy Redux + modern CentralHub)", "3 databases with cross-DB join prohibition", "implicit Person vs User mapping">

Record these findings — they feed into Step 4 questions and the summary.

### Step 3: Audit Existing Guidance (Audit & Update Mode Only)

**Skip this step for Setup mode.**

Read all existing guidance files: CLAUDE.md, docs/*.md, and any other project documentation.

**Score each section** against four criteria:

| Criterion | Test |
|-----------|------|
| **Specificity** | Does this describe THIS project, or could it apply to any project? |
| **Undiscoverability** | Would an agent exploring with Grep/Glob/Read find this? If yes, it's wasted context. |
| **Currency** | Does this match the current state of the codebase? Verify commands, file paths, patterns. |
| **Signal density** | What's the ratio of actionable information to total words? |

**Present an audit report** using this format:

```markdown
## Context Audit Report

### Tier 1 — CLAUDE.md (<line count> lines)

| Section | Signal | Issue | Recommended Action |
|---------|--------|-------|--------------------|
| Commands | High | All commands verified | Keep |
| Description | Low | Generic — discoverable from README | Trim to one line |
| Architecture | Low | Directory listing — agent can `ls` | Move decisions to docs/architecture.md, cut the rest |
| Conventions | Medium | Some entries are generic | Keep project-specific entries, cut generic ones |
| Failure Modes | — | Missing | Add — high-value section |

### Tier 2 — docs/

| Document | Signal | Issue | Recommended Action |
|----------|--------|-------|--------------------|
| architecture.md | Medium | Contains directory tree (discoverable) | Keep decisions, remove tree |
| coding-guidelines.md | Low | Entirely generic advice | Delete or rewrite with project-specific patterns |

### Missing High-Value Content

- No failure modes documented
- No domain invariants
- Conventions lack project-specific patterns
```

Use AskUserQuestion to present the report and confirm which recommendations to apply. Group recommendations into:
1. **Quick wins** — cut generic content, fix stale references
2. **High-value additions** — failure modes, domain invariants, specific conventions
3. **Structural changes** — reorganize tiers, delete low-value docs

### Step 4: Gather Project Information

Use AskUserQuestion to collect what cannot be determined from code.

**Always ask:**

1. **Core principles** — "What 3-5 rules should always guide development in this project?" Offer examples based on what you've seen in the codebase.
2. **Failure modes** — "What mistakes do agents (or new developers) repeatedly make in this codebase? What breaks, and what's the fix?" Focus on agent-specific patterns — each entry should trace to an observed mistake, not a hypothetical. This becomes the highest-signal section of CLAUDE.md.
3. **Domain invariants** — "What rules must never be violated? What causes silent bugs when broken?" Examples: "All prices stored in cents", "Every API route checks auth", "Config values never committed."

**Ask only if ambiguous from code:**

4. **Conventions with enforcement** — "What rules does your team follow? For each, how is it enforced?" Look for linter configs, CI checks, custom scripts, and connect rules to their enforcement mechanism.
5. Confirm detected commands if multiple options exist (e.g., `npm` vs `bun`)
6. **Existing meta files** — If Step 1 found meta files without CLAUDE.md, ask which to keep, replace, or merge now that you have exploration context.
7. **Project story** — Suggest a short metaphor connecting the project name to its purpose (2-3 sentences for the README header). Propose a suggestion and let the user refine.

**For Audit & Update mode — ask about gaps found in Step 3:**

- "What has an agent gotten wrong since the last audit? Each answer becomes a Failure Modes entry or a Conventions rule."
- "Your CLAUDE.md has no failure modes. What mistakes do agents repeat?"
- "The conventions section is generic. What specific patterns should agents follow?"
- "Architecture doc lists directories but not design decisions. What were the key architectural choices?"

**Never ask what's discoverable from code:**
- Language, framework, test runner, linter — detect automatically
- Available scripts — read package.json/Makefile
- Directory structure — explore it

### Step 5: Generate or Update Tier 1 — CLAUDE.md

Create or update `CLAUDE.md` following this template. **Target ~150-200 lines maximum.** Every line must pass the undiscoverability test — if an agent can find it by exploring, it doesn't belong here.

````markdown
# <Project Name>

<one-line description — derive from exploration, confirm with user for greenfield projects>

## Commands

```bash
<all verified commands — install, dev, build, test, lint, format, typecheck>
```

## Documentation

| Document | Purpose |
|----------|---------|
<only rows for docs that actually exist — this is the progressive disclosure index>

## Context Discovery

| Working on... | Read first |
|---------------|------------|
<map project domains/features to the docs an agent should read before making changes>

## Core Principles

<3-5 numbered rules from Step 4 — these guide agent decision-making>

## Conventions

<project-specific naming, imports, preferred libraries, patterns>
<for each rule, note how it's enforced — e.g., "Import boundaries (enforced by [tool/script]): [rule]">

## Commits

Format: `<type>(<scope>): <description>`

Types: feat, fix, docs, refactor, test, chore, perf

<2-3 examples using actual project scopes>

## Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
<project-specific breakage patterns from Step 4>

## Domain Invariants

<numbered list of must-always-hold rules from Step 4>
````

**Section rules:**
- **Commands**: Must be verified against package.json scripts, Makefile targets, or equivalent. Use `<!-- TODO: verify -->` if uncertain.
- **Documentation table**: Only list docs that exist. This table is the agent's entry point to Tier 2.
- **Context Discovery**: Maps project domains to relevant docs — "working on auth → read docs/specs/auth.md first." This is a decision tree for context, not a doc index. Omit if the project only has 1-2 docs. For projects with many docs or distinct domains, this is the highest-leverage navigation aid.
- **Core principles**: Must come from user input, never invented.
- **Conventions**: Enforce invariants, not implementations — specify *what* must hold, not *how* to achieve it. Organize rules by constraint level:
  - **MUST / MUST NOT** — invariants that cause bugs or security issues when violated (e.g., "parse data at boundaries" not "use Zod")
  - **PREFER / AVOID** — team preferences where multiple valid approaches exist
  For each rule, note how it's enforced. Agent-invocable verification (scripts, linters, type checkers) is the strongest form — it lets agents check their own work. Custom lint rules with remediation instructions in the error message are especially powerful: the lint failure itself becomes in-context guidance. E.g., "Module boundaries (enforced by [linter/script]): [specific rule]" is far more useful than stating the rule alone.
- **Failure Modes**: Each entry should trace to an observed agent mistake — not a hypothetical. Omit this section entirely if the user has none to share yet. Do not create an empty table. Add entries reactively as agents fail, building the harness over time.
- **Domain Invariants**: Same — omit if none provided. Do not invent invariants.

**For Audit & Update mode:** Apply the approved changes from Step 3. This may involve cutting generic content, adding missing high-value sections, updating stale commands, and restructuring to match this template.

### Step 6: Generate or Update Tier 2 — docs/

```bash
mkdir -p docs
```

**Only create docs with actual content.** An empty doc with TODO markers wastes context. Better to have no doc than a generic one.

**Always created:**

#### docs/architecture.md

```markdown
# Architecture

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
<key architectural decisions — framework choice, data layer, auth approach, etc.>

## Data Flow

<how data moves through the system — request lifecycle, processing pipeline>

## Module Responsibilities

| Module/Package | Owns | Depends On |
|----------------|------|------------|
<what each key module does and its dependencies>
```

Focus: **decisions and rationale**, data flow, module boundaries. NOT directory listings — agents can `ls`. Use `<!-- TODO -->` for decisions that need research.

#### docs/pr-workflow.md

```markdown
# PR Workflow

## Commit Conventions

See ## Commits in CLAUDE.md for format and examples.

## Branch Naming

Format: `<type>/<issue-number>-<short-kebab-description>`

### Examples

<2-3 examples relevant to the project>

## PR Checklist

- [ ] Code follows project conventions <if coding-guidelines.md was created, add: (see [Coding Guidelines](coding-guidelines.md))>
- [ ] Tests added/updated <if testing.md was created, add: (see [Testing](testing.md))>
- [ ] Documentation updated if applicable
- [ ] CHANGELOG.md updated for user-facing changes
- [ ] All checks pass

## Review Process

<project-specific review norms, or standard forge workflow>
```

**Created only when warranted — use AskUserQuestion to offer these based on detection:**

#### docs/development.md — when setup has gotchas, multiple steps, or environment requirements

```markdown
# Development

## Prerequisites

<specific versions, tools, external services>

## Setup

<step-by-step from clone to running — highlight gotchas>

## Environment

<required env vars, configuration files, secrets management>
```

Skip this doc if setup is trivial (clone → install → run).

#### docs/coding-guidelines.md — when project has specific patterns worth codifying

```markdown
# Coding Guidelines

## Patterns

<project-specific patterns with actual file path examples>

## Anti-Patterns

| Don't | Do Instead | Why |
|-------|-----------|-----|
<specific to this project, not generic advice>
```

Skip this doc if there are no project-specific patterns beyond what linters enforce.

#### docs/testing.md — when test patterns are non-obvious

```markdown
# Testing

## Commands

<exact test commands — unit, integration, e2e>

## Conventions

<test file location, naming, setup/teardown patterns — with file path examples>

## Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
<testing-specific gotchas for this project>
```

Skip this doc if tests are straightforward and self-explanatory.

**Additional project-specific docs — offer based on detection:**

| Detected Signal | Suggested Doc |
|-----------------|---------------|
| REST/GraphQL routes, OpenAPI spec | `docs/api-reference.md` |
| Dockerfile, docker-compose | `docs/deployment.md` |
| CI workflow files | `docs/ci.md` |
| Database migrations, ORM config | `docs/database.md` |
| Multiple packages/workspaces | `docs/monorepo.md` |

**Content rules for all Tier 2 docs:**
- Every section must pass the undiscoverability test
- Use tables for structured reference data (symptom→cause→fix, decision→choice→rationale)
- Include actual file paths when referencing code patterns
- No generic advice ("Follow best practices", "Keep code clean", "Write clean tests")
- No discoverable information (directory trees, command lists already in CLAUDE.md)

### Step 7: Create AGENTS.md, .claude/settings.local.json, and .gitignore

```bash
# Create AGENTS.md as a symlink to CLAUDE.md
ln -sf CLAUDE.md AGENTS.md

# Create .claude directory
mkdir -p .claude
```

If `.claude/settings.local.json` already exists, merge the attribution keys into it. If it doesn't exist, create it:

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
```

The empty attribution fields suppress Claude Code's default Co-Authored-By lines. This file is user-local and not committed.

**Create `.gitignore` if it doesn't exist.** If it already exists, ensure `.claude/` is listed.

```bash
if [ ! -f .gitignore ]; then
  echo ".claude/" > .gitignore
else
  grep -qxF '.claude/' .gitignore || echo '.claude/' >> .gitignore
fi
```

Add other standard entries based on the detected tech stack:
- **Node/Bun**: `node_modules/`, `dist/`, `.env`, `.env.local`
- **Go**: binary name, `vendor/` (if not committed)
- **Python**: `__pycache__/`, `.venv/`, `*.pyc`
- **Rust**: `target/`
- **General**: `.DS_Store`, `*.log`, `coverage/`

**IMPORTANT**: If `.gitignore` already exists, do NOT overwrite it. Only append missing entries.

### Step 8: Human-Facing Files (Optional)

These are for human readers (GitHub visitors, release tracking), not agent context infrastructure. Create them if they don't exist, but they don't affect agent performance.

**README.md** — if no README exists, create one:

```markdown
<p align="center">
  <strong><one-line project description></strong><br>
  <short tagline>
</p>

<p align="center">
  <a href="docs/architecture.md">Architecture</a> &middot;
  <additional links only for docs that were actually created>
</p>

---

<project story from Step 4>

---

## Quick Start

<minimal steps to get running — clone, install, start>

## Development

<essential dev commands — install, dev, test, lint>

<if docs/development.md was created, add: See [Development Guide](docs/development.md) for full setup instructions.>

## Documentation

| Document | Purpose |
|----------|---------|
<only list docs that were created>

## Contributing

1. Create an issue: `/forge-create-issue`
2. Implement: `/forge-implement-issue <number>`
3. Self-review: `/forge-reflect-pr`
4. Address feedback: `/forge-address-pr-feedback`
5. Update changelog: `/forge-update-changelog`
```

**Header rules:**
- If the project has a logo, add a centered `<img>` above the tagline
- The story paragraph goes between two `---` dividers
- Keep the story to 2-3 sentences

**If README.md already exists**, use AskUserQuestion:
> A README.md already exists. Replace it, merge missing sections, or keep it unchanged?

**CHANGELOG.md** — if none exists, create with header only:

```markdown
# Changelog

All notable user-facing changes to this project will be documented in this file.

Changes are grouped by release date and category. Only user-facing changes are included — internal refactors, test updates, and CI changes are omitted.
```

If the project has existing git history, ask whether to backfill from recent commits.

### Step 9: Commit

Stage all new and modified meta files and commit:

```bash
# Stage context infrastructure files
git add CLAUDE.md AGENTS.md .gitignore docs/

# Stage human-facing files if created/modified
git add README.md CHANGELOG.md 2>/dev/null

# Commit with conventional format — use the appropriate message
# For Setup mode:
git commit -m "docs: set up agentic context infrastructure"
# For Audit & Update mode:
git commit -m "docs: update context infrastructure with tiered guidance"
```

**Do NOT commit if:**
- The user asked for a dry run
- There are unrelated staged changes (unstage them first)
- Any generated file has unresolved questions (ask user first)

### Step 10: Summary

**For Setup mode:**

```text
## Setup Complete

### Context Infrastructure

**Tier 1 — Hot Memory (always loaded):**
- CLAUDE.md — <line count> lines

**Tier 2 — Warm Memory (on-demand):**
- docs/architecture.md — Design decisions and data flow
<list only docs that were created, with brief note>

**Tier 3 — Cold Memory (recommended for later):**
<suggest specs/references for complex projects — API docs, DB schemas, deployment runbooks>
<omit this section if project is simple>

### Agent Readiness

| Dimension | Status | Action |
|-----------|--------|--------|
| Feedback loops | <e.g., "Tests pass, lint works, build <30s"> | <or "No tests — add test coverage as first priority"> |
| Module structure | <e.g., "Clear boundaries in src/"> | <or "Flat import web — consider module extraction"> |
| App legibility | <e.g., "Bootable, logs queryable"> | <or "No local boot — add dev server script"> |
| Known risks | <list from Step 2> | <documented in CLAUDE.md Failure Modes / Domain Invariants> |

### Supporting Files
- AGENTS.md → CLAUDE.md (symlink)
- .claude/settings.local.json — Attribution settings (not committed)
- .gitignore

### Also Created
- README.md — project overview for GitHub visitors
- CHANGELOG.md — release tracking for humans
<omit entries that were not created or already existed>

### Next Steps
1. Review each file and fill any <!-- TODO --> markers
2. Add failure modes to CLAUDE.md as you encounter agent mistakes
3. Update domain invariants when new rules emerge
4. Re-run /forge-setup-project periodically — context rots as code evolves
5. Use /forge-create-issue to plan your first piece of work
```

**For Audit & Update mode:**

```text
## Audit Complete

### Changes Applied
- CLAUDE.md: <specific changes — e.g., "removed generic description, added failure modes table, trimmed from 250 to 180 lines">
- docs/architecture.md: <specific changes>
<list each changed file>

### Agent Readiness

| Dimension | Status | Action |
|-----------|--------|--------|
| Feedback loops | <e.g., "Tests pass, lint works, build <30s"> | <or "No tests — add test coverage as first priority"> |
| Module structure | <e.g., "Clear boundaries in src/"> | <or "Flat import web — consider module extraction"> |
| App legibility | <e.g., "Bootable, logs queryable"> | <or "No local boot — add dev server script"> |
| Known risks | <list from Step 2> | <documented in CLAUDE.md Failure Modes / Domain Invariants> |

### Recommendations Deferred
<items the user chose not to apply, or gaps that need future input>

### Next Steps
1. Review changes and verify accuracy
2. Revisit deferred recommendations when ready
3. Re-run /forge-setup-project periodically — docs rot as code evolves. Treat context maintenance like garbage collection: small, regular sweeps beat large cleanups
```

## Important Guidelines

### The Undiscoverability Test

Before writing ANY content, ask: "Would an agent exploring this codebase with Grep, Glob, and Read find this information?" If yes → don't write it.

**Write:** design decisions, conventions not enforced by tools, failure modes, domain invariants, gotchas, preferred approaches when multiple exist. Also capture knowledge that currently lives only in Slack threads, Google Docs, or people's heads — anything an agent can't access in-context effectively doesn't exist.

**Don't write:** directory structure, available commands (unless verified — these are borderline), generic descriptions, framework overviews, boilerplate.

### Signal Over Volume

Context that **hurts** agent performance:
- Generic overviews ("This project uses React for the frontend")
- Discoverable information (directory trees, package listings)
- Verbose explanations where a table would do
- Empty sections with only `<!-- TODO -->` markers
- Too much guidance — when everything is "important," nothing is. Agents pattern-match locally instead of navigating intentionally. A 500-line CLAUDE.md is non-guidance.

Context that **helps** agent performance:
- Symptom → cause → fix tables
- Decision → choice → rationale tables
- Constraint hierarchies (musts, must-nots, preferences)
- Code patterns with actual file paths
- Domain invariants that prevent silent bugs

### Tier Discipline

- **Tier 1 (CLAUDE.md)**: Target ~150-200 lines. If it's growing past 200, move detail to Tier 2.
- **Tier 2 (docs/)**: Only create a doc if it has actual content. Delete or skip docs that would be mostly generic or empty.
- **Tier 3**: Referenced in summary for complex projects. Not created by this skill.
- **No duplication across tiers.** Commands live in CLAUDE.md. Design decisions live in docs/architecture.md. Don't repeat. Canonical example: commit format is defined in CLAUDE.md's `## Commits` section — docs/pr-workflow.md references it instead of repeating it.

### Context Budget

CLAUDE.md is not the only context an agent loads. Auto-memory files, MCP tool definitions, skill files, and conversation history all consume the context window. Research shows agent performance degrades past ~40% context utilization.

Keep this in mind:
- CLAUDE.md target: 150-200 lines (~3-4K tokens)
- If the project uses many MCP servers or large skill files, lean toward the lower end
- When auditing, count total loaded context — not just CLAUDE.md

### What NOT to Do

- Don't generate docs for a tech stack you didn't detect
- Don't invent project principles — ask the user
- Don't include attribution lines (Co-Authored-By, etc.) in any commits
- Don't include time estimates anywhere
- Don't add commands to CLAUDE.md that don't exist in the project
- Don't create AGENTS.md as a regular file — it must be a symlink
- Don't create empty docs — better to have no doc than a generic one
- Don't generate content that contradicts existing project configuration

### Handling Edge Cases

- **Monorepo**: Create root-level meta files that reference sub-packages. Suggest per-package CLAUDE.md files as a follow-up.
- **No tests yet**: Skip `docs/testing.md` entirely. Mention test setup as a recommended next step in the summary.
- **No CI yet**: Skip `docs/ci.md`. Mention it as a follow-up.
- **Multiple languages**: Document all detected languages in CLAUDE.md commands section, grouped by language.

## Related Skills

**Next step:** Use `forge-create-issue` to plan your first piece of work.
**Full workflow:** `forge-setup-project` → `forge-create-issue` → `forge-implement-issue` → `forge-reflect-pr` → `forge-address-pr-feedback` → `forge-update-changelog`

## Example Usage

```
/forge-setup-project
/forge-setup-project /path/to/project
```
