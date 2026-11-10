---
name: forge-implement
description: Implement an Issue, plan file, or free-text description on a feature branch, following project standards, and stop at an open PR. Asks the user to approve the plan unless --unattended. Use when the user or an orchestrating agent asks for forge-implement or to take an Issue to a PR, not for a quick edit or fix in the current session; use forge-ship to also run review.
---

# Implement a Change

## Input

Primary input (`$ARGUMENTS`): an Issue number/URL, a plan file path, or free-text description. Optional: `-- <additional context>` for execution guidance.

**Unattended mode:** `--unattended` skips plan approval and proceeds without confirmation prompts. When no person can answer (the prompt says another session or a scheduler started the run, or AskUserQuestion is unavailable or goes unanswered), run unattended even without the flag and say so in your first message.

## Process

### Step 1: Understand the Work

Report `implementing` via [status-reporting](_shared/status-reporting.md). Determine the input type and extract requirements.

- **Issue** — detect the provider and fetch it per [issue-operations](_shared/issue-operations.md). Parse title, requirements, acceptance criteria, labels, sub-issues, comments. Add labels if missing. When the Issue has sub-issues, treat each as a separate task and close them as you complete them.
- **Plan file** — extract goals, requirements, constraints, acceptance criteria.
- **Free-text** — parse scope and constraints.

Ask for clarification when requirements are too vague or dependencies too incomplete to plan confidently; in unattended mode, proceed on explicitly stated assumptions instead.

For an Issue, check open work before planning, following [open-work](_shared/open-work.md). When a prerequisite is unmet or an open PR is already for this Issue, name each one and its state, and ask via AskUserQuestion whether to proceed. **In unattended mode**: stop and report `needs-human` with them. Keep the other open PRs' files for the plan.

### Step 2: Plan Approach

Identify **durable architectural decisions** (data model, API contracts, module boundaries) and write the **design block** from [deep-modules](_shared/deep-modules.md): the change's interface, what it hides, and where the same decision already lives.

**For complex work**, delegate codebase research to a sub-agent for unbiased answers:

#### Research (delegate)

Write 3–7 factual questions about existing systems, patterns, and integration points. Each asks how something works today; if a reader could guess the goal from it, rewrite it. One always asks which places already do what this change is nearest to. Pass the Issue's pointers to what already exists (file paths, packages, library docs) verbatim, never links to the Issue, a PR, or a spec of the change. Delegate to a [forge-scout](_shared/roles/forge-scout.md) sub-agent (a cheap fast model, where the runtime lets you choose) that receives only the questions and pointers. If no sub-agent support, read the role file and answer each question following its rules.

**Inputs provided to sub-agent:** Role: [forge-scout](_shared/roles/forge-scout.md), the research questions, the pointers, codebase access.
**Expected output:** One factual answer per question, with file paths and code references.

From the research, create a plan:
- Durable decisions and the design block
- **Structure outline** — vertical phases, each spanning all affected layers they need and ending with a verification step. Phase 1 proves the happy path end to end; later phases add one axis of complexity at a time. When a text view shows a phase's target shape better than words, include it (see [visuals](_shared/visuals.md)).
- Files to create or modify
- Open PRs these files **conflict** with (see [open-work](_shared/open-work.md)), each with what it shares; the PR's **Notes** repeat them
- Scope boundaries (what will NOT change)

Present the plan via AskUserQuestion and get confirmation before coding. **In unattended mode**: skip this and proceed. A design the user rejects on the open PR goes through [design-rounds](_shared/design-rounds.md#a-design-rejected-on-an-open-pr).

### Step 3: Create Feature Branch

```bash
git fetch origin
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git rev-list --count origin/$DEFAULT_BRANCH..HEAD   # 0 on a non-default branch → a worktree tool prepared it; stay on it
```

Otherwise branch off the fetched default branch without switching to it — this also works inside a worktree, where the default branch is checked out elsewhere:

```bash
git checkout --no-track -b <TYPE>/<ISSUE_NUMBER>-<BRIEF_DESCRIPTION> origin/$DEFAULT_BRANCH
```

When working from a plan file or free-text (no Issue number), use a descriptive slug: `<TYPE>/<BRIEF_DESCRIPTION>`.

### Step 4: Implement

Read AGENTS.md first. Execute the work in vertical phases following [phase-execution](_shared/phase-execution.md): pre-flight first, then each phase through its gate.

Note each deviation from the Step 2 Plan and why as it happens; the PR states each one.

### Step 5: Audit Pattern Consistency

If you changed a pattern (error handling, component structure, API convention), update every other place that uses the old one. Search for the pattern's shape, not its literal text (a rename's grep misses aliased imports), at the scope the pattern lives in; re-grep after updating; and name each match you left on purpose in the PR body.

### Step 6: Update Documentation

Update `docs/*.md` and `AGENTS.md` if behavior or conventions changed.

### Step 7: Run Final Quality Gate

Run every part of the project's quality gate (the gate parts pre-flight listed): lint, format, type check and tests, with no violations. Reach **≥ 90% test coverage for new/modified code** through the interface production uses, measured with the project's coverage tool; when none is configured, flag this to the user and offer to set it up. A test seam the number forced goes in the PR's Notes (see [phase-execution](_shared/phase-execution.md#2-test)).

Fix issues and commit fixes.

### Step 8: Exercise the Change

Run the app and use the changed path once, plus one failure case, following [exercise](_shared/exercise.md). Fix what it finds, with a test, before opening the PR.

### Step 9: Push and Create PR

```bash
git push -u origin <BRANCH_NAME>
```

Create the PR with a conventional commit title and the body from [pr-body](_shared/pr-body.md). The why comes from the linked Issue's problem statement, or the commit history when none is linked; in unattended mode, the assumptions you proceeded on go under Notes. Close the Issue when one exists.

Pass the body on stdin via a quoted heredoc — an inline `--body "..."` mangles multi-line text, backticks, and quotes:

```bash
gh pr create --title "<TYPE>(<SCOPE>): <DESCRIPTION>" --body-file - <<'PR_EOF'
<PR body>
PR_EOF
```

### Step 10: Summarize

Report: branch name, PR link, commits made, files changed, tests added, docs updated, exercise outcome, the `Try it` line from `## Exercised`, deferred items.

## Related Skills

**After implementing:** Use `forge-reflect` to self-review before requesting review.

## Example Usage

```
/forge-implement 123
/forge-implement 123 -- keep the diff minimal and prefer existing UI patterns
/forge-implement --unattended 123
/forge-implement docs/roadmap.md
/forge-implement add a dark mode toggle to the settings page
```
