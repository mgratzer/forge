---
name: forge-implement
description: Implement a feature or fix from an Issue, plan file, or free-text description, following project standards. Use when the user wants to start working on an Issue, implement a feature, fix a bug, or build from a plan or roadmap.
disable-model-invocation: true
---

# Implement

Implement a feature or fix following project standards.

## Input

Primary input: an Issue (from the project's Issue tracker), a plan file, or a free-text description.

Optional last parameter: `-- <additional context>`

Interpret `$ARGUMENTS` as one of:
- `<issue-number>` — Issue in the project's Issue tracker
- `<issue-url>` — Issue URL (GitHub, Linear, etc.)
- `<file-path>` — path to a plan, roadmap, or spec file
- `<free-text>` — inline description of what to build
- Any of the above followed by `-- <additional context>`

Use any additional context as execution guidance while still following the requirements from the primary input.

## Process

### Step 1: Understand the Work

Determine the input type and extract requirements. Detect the project's Issue tracker provider (see [CONTEXT.md](../../CONTEXT.md)).

**Issue** (number or URL) — fetch from the project's Issue tracker:

- **GitHub**: `gh issue view <ISSUE_NUMBER> --json number,title,body,labels,assignees,milestone,state,comments`
- **Markdown**: Read `plan/issues/<ISSUE_NUMBER>-*.md` — parse YAML frontmatter and body
- **Other provider**: use the tool declared in AGENTS.md

Parse: title, requirements, acceptance criteria, labels, sub-issues, comments, and linked work. If labels are missing and the provider supports editing, add appropriate ones.

**Plan file** (path to a roadmap, spec, or plan):
Read the file. Extract: goals, requirements, constraints, and acceptance criteria.

**Free-text description:**
Parse the description for scope, requirements, and constraints. If underspecified, ask clarifying questions before proceeding.

Flag for user input if: vague acceptance criteria, `discovery` label, unanswered questions, scope too large, or dependencies incomplete.

### Step 2: Plan Approach

Identify **durable architectural decisions** — choices that apply across the entire issue:
- Data model or schema shape
- API contracts or route structures
- Key abstractions or module boundaries — see [deep-modules.md](references/deep-modules.md) for how to evaluate module shape, the testability argument, and why interface design matters more than implementation when working with AI

**For complex work** (multiple components, cross-cutting changes, or unclear integration points), delegate codebase research to a sub-agent for unbiased findings:

Write 3–7 targeted questions about how the relevant systems work today, what patterns exist, and where the integration points are. **Questions must request facts, not opinions.**

#### Research (delegate)

Delegate to a [forge-scout](roles/forge-scout.md) sub-agent that receives only the questions — not the issue title or body. If the runtime does not support sub-agents, read the role file and answer each question following its rules.

**Inputs provided to sub-agent:**
- Role: [forge-scout](roles/forge-scout.md)
- The research questions (not the issue)
- Access to the full codebase via Read, Grep, Glob, Bash

**Expected output:** One factual answer per question, with file paths and code references.

From the research (or your own codebase exploration for straightforward issues), create a plan:
- Durable decisions
- **Structure outline** — order work as vertical phases, each spanning all affected layers with a verification step. See [vertical-phases.md](references/vertical-phases.md) for what makes a phase verifiable, common failure modes (layered phases in disguise, phases without verification), and worked examples.
- Files to create or modify
- Scope boundaries (what will NOT change)

Fold any optional additional context from `$ARGUMENTS` into the plan. If the issue includes Implementation Constraints (from `forge-create-issue`), follow those guardrails.

Present the plan via AskUserQuestion. Get user confirmation before coding. **When called with unattended mode** (e.g., from `forge-ship --unattended`): skip AskUserQuestion and proceed with the plan.

### Step 3: Create Feature Branch

```bash
git fetch origin
git checkout $(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git pull
git checkout -b <type>/<issue-number>-<brief-description>
```

When working from a plan file or free-text (no issue number), use a descriptive slug: `<type>/<brief-description>`.

### Step 4: Implement

Read AGENTS.md first. Follow project conventions strictly.

**Pre-flight checks** — before writing feature code, validate the foundation: codegen current, config readers grep'd, external services reachable, env vars/secrets present, existing patterns identified. See [pre-flight.md](references/pre-flight.md) for the rationale, what each check costs vs catches, and when a check can be skipped.

**Follow the structure outline from Step 2.** Each phase is a vertical slice — implement it end to end and verify before starting the next phase. Use TodoWrite to track progress through phases.

**As you code:**
- Follow project lint/format/type conventions
- Check for duplication — extract shared logic
- Keep functions focused — split if growing too large
- Look for existing patterns before writing new code — in particular, follow the project's existing import style and do not introduce barrel files (index re-exports) unless the project already uses them. See [barrel-imports.md](references/barrel-imports.md) for why agents default to barrel files, the real costs, and the few cases where they earn their place
- Verify unfamiliar APIs before using them — grep the codebase, read type definitions, or check `--help`. See [verify-before-assume.md](references/verify-before-assume.md) for why agents hallucinate APIs, the verification discipline, and when verification isn't needed
- Run tests after each commit, not just at the end
- When writing tests, verify assertions match actual output immediately

**Test-first when behavior is specifiable.** For testable behavior — business logic, state transitions, parsers, anything with a verifiable claim — follow the red/green/refactor cycle. See [tdd-discipline.md](references/tdd-discipline.md) for the cycle and *why test-first matters more for AI* (write-after rationalization), [good-tests.md](references/good-tests.md) for what to test (deep-module boundaries, no per-function mocking), and [when-tdd-is-wrong.md](references/when-tdd-is-wrong.md) for the cases where TDD is the wrong tool (UI/visual, exploratory prototypes, spikes).

**Commit granularly** after each logical unit of work:

```bash
git add <files>
git commit -m "<type>(<scope>): <description>

<body>

Refs #<ISSUE_NUMBER>"  # omit Refs line when there is no issue
```

### Step 5: Pattern Consistency Audit

If you changed a pattern (error handling, component structure, API convention), grep for every other file using the old pattern and update them too:

```bash
grep -rn "<pattern>" <search-root>/
```

See [pattern-audit.md](references/pattern-audit.md) for what counts as "the pattern", how to scope the search, distinguishing missed updates from intentional drift, and worked examples.

### Step 6: Update Documentation

If behavior changed, update:
- `docs/*.md` — architecture, API, development guides
- `AGENTS.md` — if conventions or patterns changed
- Code comments — only where logic isn't self-evident

### Step 7: Quality Gates

Run all project quality checks (discover from AGENTS.md, project docs, or repository scripts): lint, format, type check, tests. Run coverage for substantial changes when the project supports it. Fix issues and commit fixes.

### Step 8: Push and Create PR

```bash
git push -u origin <branch-name>
```

Create PR with conventional commit title format. Include: summary of what was built (closing the issue when one exists), list of changes, test plan checklist, and quality checklist.

If the implementation requires manual deployment steps (env vars, infra changes, container/runtime config, migrations), add a prominent `> [!WARNING]` block at the top of the PR body.

### Step 9: Summary

Report: branch name, PR link, commits made, files changed, tests added, docs updated, follow-up items.

## Guidelines

- **Read AGENTS.md first** — understand project-specific requirements
- **Explore before coding** — research the codebase objectively before committing to an approach
- **Vertical phases** — implement each phase end to end and verify before moving on
- **Small commits** — one logical change each
- **Test as you go** — don't defer testing to the end
- **Ask when unsure** — better to clarify than implement wrong
- **Don't scope creep** — implement what was asked, nothing more

## Sub-Issue Handling

When working from an Issue with sub-issues, treat each as a separate task. Close sub-issues as you complete them. For GitHub, parent progress updates automatically; for markdown, update both the issue file status and the INDEX.md row.

## Related Skills

**After implementing:** Use `forge-reflect` to self-review before requesting review.
**Single invocation:** Use `forge-ship` to implement and review in one step.

## Example Usage

```
/forge-implement 123
/forge-implement 123 -- keep the diff minimal and prefer existing UI patterns
/forge-implement https://github.com/owner/repo/issues/123
/forge-implement docs/roadmap.md
/forge-implement docs/roadmap.md -- focus on phase 1 only
/forge-implement add a dark mode toggle to the settings page
```
