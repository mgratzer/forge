---
name: forge-implement
description: Implement a feature or fix from an Issue, plan file, or free-text description, following project standards. Use when the user wants to start working on an Issue, implement a feature, or fix a bug — stops after opening the PR (use forge-ship to also run review).
disable-model-invocation: true
---

# Implement a Change

Implement a feature or fix following project standards.

## Input

Primary input (`$ARGUMENTS`): an Issue number/URL, a plan file path, or free-text description. Optional: `-- <additional context>` for execution guidance.

**Unattended mode:** `--unattended` skips plan approval and proceeds without confirmation prompts.

## Process

### Step 1: Understand the Work

Determine the input type and extract requirements. Detect the Issue tracker provider (see [issue-operations](../_shared/issue-operations.md)).

- **Issue** — fetch using the project's Issue tracker (see [issue-operations](../_shared/issue-operations.md)). Parse title, requirements, acceptance criteria, labels, sub-issues, comments. Add labels if missing. When the Issue has sub-issues, treat each as a separate task and close them as you complete them.
- **Plan file** — extract goals, requirements, constraints, acceptance criteria.
- **Free-text** — parse scope and constraints.

Ask for clarification when requirements are too vague or dependencies too incomplete to plan confidently; in unattended mode, proceed on explicitly stated assumptions instead.

### Step 2: Plan Approach

Identify **durable architectural decisions** — data model, API contracts, and module boundaries that absorb change instead of exposing internals (see [deep-modules](../_shared/deep-modules.md)).

**For complex work**, delegate codebase research to a sub-agent for unbiased answers:

#### Research (delegate)

Write 3–7 factual questions about existing systems, patterns, and integration points. Delegate to a [forge-scout](../_shared/roles/forge-scout.md) sub-agent that receives only the questions — not the Issue. If no sub-agent support, read the role file and answer each question following its rules.

**Inputs provided to sub-agent:** Role: [forge-scout](../_shared/roles/forge-scout.md), the research questions, codebase access.
**Expected output:** One factual answer per question, with file paths and code references.

Prefer a cheap fast model for scout work when the runtime supports per-task model choice.

From the research, create a plan:
- Durable decisions
- **Structure outline** — vertical phases, each spanning all affected layers they need and ending with a verification step. Phase 1 proves the happy path end to end; later phases add one axis of complexity at a time.
- Files to create or modify
- Scope boundaries (what will NOT change)

Present the plan via AskUserQuestion. Get user confirmation before coding. **In unattended mode**: skip AskUserQuestion and proceed.

### Step 3: Create Feature Branch

```bash
# Sync the default branch, then branch off it
git fetch origin
git checkout $(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git pull
git checkout -b <TYPE>/<ISSUE_NUMBER>-<BRIEF_DESCRIPTION>
```

When working from a plan file or free-text (no Issue number), use a descriptive slug: `<TYPE>/<BRIEF_DESCRIPTION>`.

### Step 4: Implement

Read AGENTS.md first. Follow project conventions strictly.

Execute the work in vertical phases following [phase-execution](../_shared/phase-execution.md): pre-flight validation before the first phase, code and tests together within each phase, and a phase gate — tests pass, no new lint/type failures, one committed logical change — before the next.

### Step 5: Audit Pattern Consistency

If you changed a pattern (error handling, component structure, API convention), grep for every other file using the old pattern and update them too — audit the pattern *shape*, not just a literal string. See [pattern-audit](../_shared/pattern-audit.md).

### Step 6: Update Documentation

Update `docs/*.md` and `AGENTS.md` if behavior or conventions changed.

### Step 7: Run Final Quality Gate

Run all project quality checks (discover from AGENTS.md, project docs, or repository scripts):

- [ ] Lint — no violations
- [ ] Format — no violations
- [ ] Type check — no errors
- [ ] All tests pass
- [ ] **Test coverage ≥ 90% for new/modified code** — run the project's coverage tool. If coverage tooling is not configured, flag this to the user and offer to set it up.

Fix issues and commit fixes.

### Step 8: Push and Create PR

```bash
git push -u origin <BRANCH_NAME>
```

Create the PR with a conventional commit title. Lead the body with **why** (from the linked Issue's problem statement, or the commit history when none is linked), then the approach, changes list, test plan, and quality checklist; close the Issue when one exists. Add a `> [!WARNING]` block at the top for any manual deployment steps.

Pass the body on stdin via a quoted heredoc — an inline `--body "..."` mangles multi-line text, backticks, and quotes:

```bash
gh pr create --title "<TYPE>(<SCOPE>): <DESCRIPTION>" --body-file - <<'PR_EOF'
<PR body>
PR_EOF
```

### Step 9: Summarize

Report: branch name, PR link, commits made, files changed, tests added, docs updated, deferred items.

## Guidelines

- **Explore before coding** — research the codebase before committing to an approach
- **Ask when unsure** — better to clarify than implement wrong; unattended runs state their assumptions and proceed
- **Don't scope creep** — implement what was asked, nothing more

## Related Skills

**After implementing:** Use `forge-reflect` to self-review before requesting review.
**Single invocation:** Use `forge-ship` to implement and review in one step.

## Example Usage

```
/forge-implement 123
/forge-implement 123 -- keep the diff minimal and prefer existing UI patterns
/forge-implement --unattended 123
/forge-implement docs/roadmap.md
/forge-implement add a dark mode toggle to the settings page
```
