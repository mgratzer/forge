---
name: forge-implement
description: Implement a feature or fix from an Issue, plan file, or free-text description, following project standards. Use when the user wants to start working on an Issue, implement a feature, fix a bug, or build from a plan or roadmap.
disable-model-invocation: true
---

# Implement

Implement a feature or fix following project standards.

## Input

Primary input: an Issue number/URL, a plan file path, or free-text description. Optional: `-- <additional context>` for execution guidance.

## Process

### Step 1: Understand the Work

Determine the input type and extract requirements. Detect the Issue tracker provider (see [CONTEXT.md](../../CONTEXT.md)).

- **Issue** — fetch using the project's Issue tracker (see [issue-operations](../_shared/issue-operations.md)). Parse title, requirements, acceptance criteria, labels, sub-issues, comments. Add labels if missing.
- **Plan file** — extract goals, requirements, constraints, acceptance criteria.
- **Free-text** — parse scope and constraints. Ask clarifying questions if underspecified.

Flag for user input if: vague criteria, `discovery` label, scope too large, or dependencies incomplete.

### Step 2: Plan Approach

Identify **durable architectural decisions** — data model, API contracts, module boundaries (see [deep-modules.md](../_shared/deep-modules.md)).

**For complex work**, delegate codebase research to a sub-agent for unbiased findings:

#### Research (delegate)

Write 3–7 factual questions about existing systems, patterns, and integration points. Delegate to a [forge-scout](roles/forge-scout.md) sub-agent that receives only the questions — not the issue. If no sub-agent support, read the role file and answer each question following its rules.

**Inputs:** Role: [forge-scout](roles/forge-scout.md), the research questions, codebase access.
**Expected output:** One factual answer per question, with file paths and code references.

From the research, create a plan:
- Durable decisions
- **Structure outline** — vertical phases, each spanning all affected layers with a verification step. See [vertical-phases.md](references/vertical-phases.md).
- Files to create or modify
- Scope boundaries (what will NOT change)

Present the plan via AskUserQuestion. Get user confirmation before coding. **In unattended mode**: skip AskUserQuestion and proceed.

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

**Pre-flight checks** — validate the foundation before feature code: codegen, config placement, external services, env vars, existing patterns. See [pre-flight.md](references/pre-flight.md).

**Pre-flight gate:**
- [ ] Foundation validated (codegen current, config verified, services reachable)
- [ ] Existing patterns identified and recorded in plan

**For each vertical phase in the structure outline:**

1. **Implement the phase** — code and tests together, end to end across all affected layers.
   - Test-first when behavior is specifiable — red/green/refactor for business logic, state transitions, parsers. See [tdd-discipline.md](references/tdd-discipline.md), [good-tests.md](references/good-tests.md), [when-tdd-is-wrong.md](references/when-tdd-is-wrong.md).
   - Follow existing patterns and import style — no barrel files unless the project uses them (see [barrel-imports.md](../_shared/barrel-imports.md))
   - Verify unfamiliar APIs before using them (see [verify-before-assume.md](references/verify-before-assume.md))

2. **Phase gate — verify before proceeding:**
   - [ ] Tests exist for new behavior in this phase
   - [ ] All tests pass (not just new ones)
   - [ ] No lint/type errors introduced
   - [ ] Commit the phase — one logical change per commit, conventional format, `Refs #<ISSUE_NUMBER>` when applicable

Use TodoWrite to track progress through phases.

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

### Step 7: Final Quality Gate

Run all project quality checks (discover from AGENTS.md, project docs, or repository scripts):

- [ ] Lint — no violations
- [ ] Format — no violations
- [ ] Type check — no errors
- [ ] All tests pass
- [ ] **Test coverage ≥ 90% for new/modified code** — run the project's coverage tool. If coverage tooling is not configured, flag this to the user and offer to set it up.

Fix issues and commit fixes.

### Step 8: Push and Create PR

```bash
git push -u origin <branch-name>
```

Create PR with conventional commit title format. Include: summary of what was built (closing the issue when one exists), list of changes, test plan checklist, and quality checklist.

If the implementation requires manual deployment steps (env vars, infra changes, container/runtime config, migrations), add a prominent `> [!WARNING]` block at the top of the PR body.

### Step 9: Summary

Report: branch name, PR link, commits made, files changed, tests added, docs updated, follow-up items.

## Guidelines

- **Explore before coding** — research the codebase before committing to an approach
- **Ask when unsure** — better to clarify than implement wrong
- **Don't scope creep** — implement what was asked, nothing more

## Sub-Issue Handling

When working from an Issue with sub-issues, treat each as a separate task. Close sub-issues as you complete them.

## Related Skills

**After implementing:** Use `forge-reflect` to self-review before requesting review.
**Single invocation:** Use `forge-ship` to implement and review in one step.

## Example Usage

```
/forge-implement 123
/forge-implement 123 -- keep the diff minimal and prefer existing UI patterns
/forge-implement docs/roadmap.md
/forge-implement add a dark mode toggle to the settings page
```
