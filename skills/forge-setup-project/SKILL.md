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
| **2 — Warm memory** | docs/*.md | Loaded when the agent navigates to a topic. Created only when content earns its token cost. |
| **3 — Cold memory** | Specs, schemas, runbooks | On-demand references for complex projects. Not created by this skill — recommended in the summary. |

`CLAUDE.md` is a compatibility filename only. In AGENTS.md-first projects it should be a symlink to `AGENTS.md`, not a separate source of truth.

**Central principle: context must earn its token cost.** Generic overviews hurt agent performance. Only include knowledge that agents cannot discover by exploring the codebase with Grep, Glob, and Read.

## Input

Optional: A path to the project root: $ARGUMENTS

If no argument is provided, use the current working directory.

## Process

### Step 1: Determine Mode

Scan the project root to classify what exists:

```bash
# Check for existing guidance files
ls -la AGENTS.md CLAUDE.md README.md CHANGELOG.md 2>/dev/null

# Check for docs directory
ls docs/ 2>/dev/null

# Check for any code at all
ls -la
```

Classify into one of three modes:

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Setup** | Neither `AGENTS.md` nor `CLAUDE.md` exists | Generate tiered context from scratch |
| **Audit & Update** | `AGENTS.md` exists | Score existing guidance, identify improvements, apply changes |
| **Legacy Migration & Update** | `CLAUDE.md` exists but `AGENTS.md` does not | Treat `CLAUDE.md` as legacy Tier 1 input, migrate it to `AGENTS.md`, then update the layout |

If other meta files exist but neither guidance file exists, treat as Setup. Note which files exist — you will ask the user how to handle them after exploration (Step 4).

### Step 2: Explore the Codebase

Skip this step for greenfield projects (no code exists).

For existing projects, perform a thorough exploration:

```bash
# Directory structure (top 3 levels)
find . -maxdepth 3 -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './vendor/*' -not -path './.next/*' -not -path './dist/*' -not -path './build/*' | head -100

# Detect language/runtime
ls package.json go.mod Cargo.toml pyproject.toml setup.py Gemfile build.gradle pom.xml mix.exs deno.json bunfig.toml composer.json 2>/dev/null

# Package manager and scripts
# Use the Read tool on package.json, Makefile, and Taskfile.yml if they exist
ls package.json Makefile Taskfile.yml 2>/dev/null

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

As you explore, mentally classify each finding:
- **Discoverable** — an agent can find this by exploring (directory structure, package.json scripts, file patterns)
- **Requires documentation** — an agent cannot infer this from code (design decisions, conventions, failure modes, invariants)

Only the second category belongs in context files.

#### Agent Readiness

After exploration, assess these dimensions:

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

### Step 3: Audit Existing Guidance (Audit & Update and Legacy Migration Modes)

Skip this step for Setup mode.

Read all existing guidance files:
- In **Audit & Update** mode: `AGENTS.md`, `docs/*.md`, and any other project documentation
- In **Legacy Migration & Update** mode: `CLAUDE.md` as the current Tier 1 file, `docs/*.md`, and any other project documentation

Score each section against four criteria:

| Criterion | Test |
|-----------|------|
| **Specificity** | Does this describe THIS project, or could it apply to any project? |
| **Undiscoverability** | Would an agent exploring with Grep/Glob/Read find this? If yes, it's wasted context. |
| **Currency** | Does this match the current state of the codebase? Verify commands, file paths, patterns. |
| **Signal density** | What's the ratio of actionable information to total words? |

Present an audit report using this format:

```markdown
## Context Audit Report

### Tier 1 — <AGENTS.md or legacy CLAUDE.md> (<line count> lines)

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
3. **Structural changes** — reorganize tiers, migrate from `CLAUDE.md` to `AGENTS.md`, delete low-value docs

### Step 4: Gather Project Information

Use AskUserQuestion to collect what cannot be determined from code.

Always ask:

1. **Core principles** — "What 3-5 rules should always guide development in this project?" Offer examples based on what you've seen in the codebase.
2. **Failure modes** — "What mistakes do agents (or new developers) repeatedly make in this codebase? What breaks, and what's the fix?" Focus on agent-specific patterns — each entry should trace to an observed mistake, not a hypothetical. This becomes the highest-signal section of `AGENTS.md`.
3. **Domain invariants** — "What rules must never be violated? What causes silent bugs when broken?" Examples: "All prices stored in cents", "Every API route checks auth", "Config values never committed."

Ask only if ambiguous from code:

4. **Conventions with enforcement** — "What rules does your team follow? For each, how is it enforced?" Look for linter configs, CI checks, custom scripts, and connect rules to their enforcement mechanism.
5. Confirm detected commands if multiple options exist (e.g. `npm` vs `bun`)
6. **Existing meta files** — If Step 1 found meta files without `AGENTS.md`, ask which to keep, replace, or merge now that you have exploration context.
7. **Project story** — Suggest a short metaphor connecting the project name to its purpose (2-3 sentences for the README header). Propose a suggestion and let the user refine.

For Audit & Update and Legacy Migration modes — ask about gaps found in Step 3:

- "What has an agent gotten wrong since the last audit? Each answer becomes a Failure Modes entry or a Conventions rule."
- "Your AGENTS.md has no failure modes. What mistakes do agents repeat?"
- "The conventions section is generic. What specific patterns should agents follow?"
- "Architecture doc lists directories but not design decisions. What were the key architectural choices?"

Never ask what's discoverable from code:
- Language, framework, test runner, linter — detect automatically
- Available scripts — read package.json/Makefile
- Directory structure — explore it

### Step 5: Generate or Update Tier 1 — AGENTS.md

Create or update `AGENTS.md` following this template. Target ~150-200 lines maximum. Every line must pass the undiscoverability test — if an agent can find it by exploring, it doesn't belong here.

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

Section rules:
- **Commands**: Must be verified against package.json scripts, Makefile targets, or equivalent. Use `<!-- TODO: verify -->` if uncertain.
- **Documentation table**: Only list docs that exist. This table is the agent's entry point to Tier 2.
- **Context Discovery**: Maps project domains to relevant docs. Omit if the project only has 1-2 docs.
- **Core Principles**: Must come from user input, never invented.
- **Conventions**: Enforce invariants, not implementations. Organize rules by constraint level:
  - **MUST / MUST NOT** — invariants that cause bugs or security issues when violated
  - **PREFER / AVOID** — team preferences where multiple valid approaches exist
  For each rule, note how it's enforced. Agent-invocable verification (scripts, linters, type checkers) is strongest.
- **Failure Modes**: Each entry should trace to an observed agent mistake — not a hypothetical. Omit this section entirely if the user has none to share yet.
- **Domain Invariants**: Same — omit if none provided. Do not invent invariants.

For **Legacy Migration & Update** mode:
- migrate the accepted Tier 1 content into `AGENTS.md`
- preserve valuable content from the legacy `CLAUDE.md`
- remove or fold duplicate sections during the rewrite
- replace the legacy file with a compatibility symlink in Step 7

### Step 6: Generate or Update Tier 2 — docs/

```bash
mkdir -p docs
```

Only create docs with actual content. An empty doc with TODO markers wastes context. Better to have no doc than a generic one.

Always created:

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

Focus: decisions and rationale, data flow, module boundaries. Not directory listings — agents can `ls`.

#### docs/pr-workflow.md

```markdown
# PR Workflow

## Commit Conventions

See ## Commits in AGENTS.md for format and examples.

## Branch Naming

Format: `<type>/<issue-number>-<short-kebab-description>`

## PR Checklist

- [ ] Code follows project conventions
- [ ] Tests added/updated
- [ ] Documentation updated if applicable
- [ ] CHANGELOG.md updated for user-facing changes
- [ ] All checks pass

## Review Process

<project-specific review norms, or standard forge workflow>
```

Created only when warranted — use AskUserQuestion to offer these based on detection:
- `docs/development.md` — when setup has gotchas, multiple steps, or environment requirements
- `docs/coding-guidelines.md` — when project has specific patterns worth codifying
- `docs/testing.md` — when test patterns are non-obvious
- Additional project-specific docs such as `docs/api-reference.md`, `docs/deployment.md`, `docs/ci.md`, `docs/database.md`, `docs/monorepo.md`

Content rules for all Tier 2 docs:
- Every section must pass the undiscoverability test
- Use tables for structured reference data
- Include actual file paths when referencing code patterns
- No generic advice
- No discoverable information already covered elsewhere

### Step 7: Create CLAUDE.md Compatibility Symlink and Update .gitignore

Create or repair the compatibility symlink:

```bash
# If CLAUDE.md is an old regular file, remove it after migrating content into AGENTS.md
rm -f CLAUDE.md
ln -sf AGENTS.md CLAUDE.md
```

If the platform does not support symlinks, stop and tell the user. Do not silently create a second canonical file.

Create `.gitignore` if it doesn't exist. If it already exists, append only missing entries that match the detected tech stack.

Suggested entries based on the stack:
- **Node/Bun**: `node_modules/`, `dist/`, `.env`, `.env.local`
- **Go**: binary name, `vendor/` (if not committed)
- **Python**: `__pycache__/`, `.venv/`, `*.pyc`
- **Rust**: `target/`
- **General**: `.DS_Store`, `*.log`, `coverage/`

Important: If `.gitignore` already exists, do not overwrite it.

### Step 8: Human-Facing Files (Optional)

These are for human readers (GitHub visitors, release tracking), not agent context infrastructure. Create them if they don't exist, but they don't affect agent performance.

**README.md** — if no README exists, create one with:
- centered project description
- links to created docs
- a short project story
- quick start and development sections
- documentation table
- contributing workflow

If `README.md` already exists, use AskUserQuestion:
> A README.md already exists. Replace it, merge missing sections, or keep it unchanged?

**CHANGELOG.md** — if none exists, create with a header only:

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
git add AGENTS.md CLAUDE.md .gitignore
if find docs -type f -name '*.md' -print -quit | grep -q .; then
  git add docs/
fi

# Stage human-facing files if created/modified
git add README.md CHANGELOG.md 2>/dev/null

# Commit with conventional format — use the appropriate message
# For Setup mode:
git commit -m "docs: set up agentic context infrastructure"
# For Audit & Update or Legacy Migration & Update mode:
git commit -m "docs: update context infrastructure with AGENTS.md-first guidance"
```

Do not commit if:
- the user asked for a dry run
- there are unrelated staged changes (unstage them first)
- any generated file has unresolved questions (ask user first)

### Step 10: Summary

For **Setup** mode:

```text
## Setup Complete

### Context Infrastructure

**Tier 1 — Hot Memory (always loaded):**
- AGENTS.md — <line count> lines

**Tier 2 — Warm Memory (on-demand):**
- docs/architecture.md — Design decisions and data flow
<list only docs that were created, with brief note>

**Tier 3 — Cold Memory (recommended for later):**
<suggest specs/references for complex projects — API docs, DB schemas, deployment runbooks>

### Agent Readiness

| Dimension | Status | Action |
|-----------|--------|--------|
| Feedback loops | <e.g., "Tests pass, lint works, build <30s"> | <or "No tests — add test coverage as first priority"> |
| Module structure | <e.g., "Clear boundaries in src/"> | <or "Flat import web — consider module extraction"> |
| App legibility | <e.g., "Bootable, logs queryable"> | <or "No local boot — add dev server script"> |
| Known risks | <list from Step 2> | <documented in AGENTS.md Failure Modes / Domain Invariants> |

### Supporting Files
- CLAUDE.md → AGENTS.md (compatibility symlink)
- .gitignore

### Also Created
- README.md — project overview for GitHub visitors
- CHANGELOG.md — release tracking for humans

### Next Steps
1. Review each file and fill any <!-- TODO --> markers
2. Add failure modes to AGENTS.md as you encounter agent mistakes
3. Update domain invariants when new rules emerge
4. Re-run /forge-setup-project periodically — context rots as code evolves
5. Use /forge-create-issue to plan your first piece of work
```

For **Audit & Update** and **Legacy Migration & Update** modes:

```text
## Audit Complete

### Changes Applied
- AGENTS.md: <specific changes>
- CLAUDE.md: replaced with compatibility symlink to AGENTS.md
- docs/architecture.md: <specific changes>
<list each changed file>

### Agent Readiness

| Dimension | Status | Action |
|-----------|--------|--------|
| Feedback loops | <status> | <action> |
| Module structure | <status> | <action> |
| App legibility | <status> | <action> |
| Known risks | <list from Step 2> | <documented in AGENTS.md Failure Modes / Domain Invariants> |

### Recommendations Deferred
<items the user chose not to apply, or gaps that need future input>

### Next Steps
1. Review changes and verify accuracy
2. Revisit deferred recommendations when ready
3. Re-run /forge-setup-project periodically — docs rot as code evolves
```

## Important Guidelines

### The Undiscoverability Test

Before writing any content, ask: "Would an agent exploring this codebase with Grep, Glob, and Read find this information?" If yes, don't write it.

Write: design decisions, conventions not enforced by tools, failure modes, domain invariants, gotchas, preferred approaches when multiple exist. Also capture knowledge that currently lives only in chat threads, docs outside the repo, or people's heads.

Don't write: directory structure, generic descriptions, framework overviews, boilerplate.

### Signal Over Volume

Context that hurts agent performance:
- Generic overviews
- Discoverable information
- Verbose explanations where a table would do
- Empty sections with only `<!-- TODO -->` markers
- Too much guidance — when everything is important, nothing is

Context that helps agent performance:
- Symptom → cause → fix tables
- Decision → choice → rationale tables
- Constraint hierarchies (musts, must-nots, preferences)
- Code patterns with actual file paths
- Domain invariants that prevent silent bugs

### Tier Discipline

- **Tier 1 (`AGENTS.md`)**: Target ~150-200 lines. If it's growing past 200, move detail to Tier 2.
- **Tier 2 (`docs/`)**: Only create a doc if it has actual content.
- **Tier 3**: Referenced in summary for complex projects. Not created by this skill.
- **No duplication across tiers.** Commands live in `AGENTS.md`. Design decisions live in `docs/architecture.md`. `CLAUDE.md` is compatibility only.

### Context Budget

`AGENTS.md` is not the only context an agent loads. Auto-memory files, MCP tool definitions, skill files, and conversation history all consume the context window.

Keep this in mind:
- `AGENTS.md` target: 150-200 lines (~3-4K tokens)
- If the project uses many MCP servers or large skill files, lean toward the lower end
- When auditing, count total loaded context — not just `AGENTS.md`

### What NOT to Do

- Don't generate docs for a tech stack you didn't detect
- Don't invent project principles — ask the user
- Don't include attribution lines (Co-Authored-By, etc.) in any commits
- Don't include time estimates anywhere
- Don't add commands to `AGENTS.md` that don't exist in the project
- Don't create `CLAUDE.md` as a second regular file when using AGENTS.md-first setup — it should be a compatibility symlink to `AGENTS.md`
- Don't create empty docs
- Don't generate content that contradicts existing project configuration
- Don't create vendor-local configuration as part of this skill

### Handling Edge Cases

- **Monorepo**: Create root-level meta files that reference sub-packages. Suggest per-package `AGENTS.md` files as a follow-up.
- **No tests yet**: Skip `docs/testing.md`. Mention test setup as a recommended next step.
- **No CI yet**: Skip `docs/ci.md`. Mention it as a follow-up.
- **Multiple languages**: Document all detected languages in `AGENTS.md` commands section, grouped by language.
- **Legacy repositories**: Migrate `CLAUDE.md` content into `AGENTS.md` before replacing it with a symlink.

## Related Skills

**Next step:** Use `forge-create-issue` to plan your first piece of work.
**Full workflow:** `forge-setup-project` → `forge-create-issue` → `forge-implement-issue` → `forge-reflect-pr` → `forge-address-pr-feedback` → `forge-update-changelog`

## Example Usage

```
/forge-setup-project
/forge-setup-project /path/to/project
```
