---
name: forge-reflect
description: Self-review current changes (a PR, branch diff, or uncommitted work). Use when the user wants a code review of their changes, a self-review before committing or pushing, or a final check before requesting peer review.
disable-model-invocation: true
---

# Reflect on Changes

Self-review current changes before committing, pushing, or requesting peer review.

## Input

No primary argument required; automatically detects what to review. Optional: `-- <additional context>` for review focus guidance.

## Process

### Step 1: Identify Changes

Detect the review scope by checking, in order:

**1. PR for current branch:**
```bash
gh pr view --json number,title,url 2>/dev/null
```
If a PR exists, note its number and URL for the report.

**2. Branch diff vs default branch:**
```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
CURRENT_BRANCH=$(git branch --show-current)
```
If on a branch different from default with commits ahead, use `origin/$DEFAULT_BRANCH...HEAD`.

**3. Uncommitted changes (staged + unstaged):**
```bash
git diff --name-only          # unstaged
git diff --name-only --cached # staged
```
If there are uncommitted changes, review those.

**Use the first scope that has changes.** If nothing to review, tell the user.

Collect the full diff and changed file list for the detected scope:

```bash
# PR or branch diff
git fetch origin
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git diff origin/$DEFAULT_BRANCH...HEAD
git diff --name-only origin/$DEFAULT_BRANCH...HEAD

# Uncommitted changes (staged + unstaged combined)
git diff HEAD
git diff --name-only HEAD
```

### Step 2: Review Changes (delegate)

Follow the [review-delegation](_shared/review-delegation.md) process: collect materials, prefer one inline review pass for tiny low-risk diffs, otherwise run one fresh-context review pass by default, add a second pass only when risk justifies it, and aggregate findings.

**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Run Quality Gates

Run the project's lint, format, type check, and test commands (and coverage where configured). Fix issues and commit fixes.

### Step 4: Triage Findings

Triage per *Triage* in the [review rubric](_shared/review-rubric.md): fix in-scope P0–P2 findings and small follow-up work without asking, and ask one AskUserQuestion only about the findings you would defer. Each one still deferred becomes an Issue.

### Step 5: Report

Report the findings (Step 2), quality gate results (Step 3), and triage outcomes (Step 4) in the format below.

## Output Format

```text
## Reflection Summary

**Scope:** <PR #N | branch <name> vs <default> | uncommitted changes>
**Review:** inline (tiny diff) | fresh-context, <n> passes | self (reviewer failed)

### Findings
#### <file>
- [P0/P1/P2] <finding>

### Finding Triage
- Fixed: <what was addressed>
- Deferred #<num>: <title>
- (or: None identified)

**Quality gates:** passed | failed: <gate>[, <gate>]: <one line each>   (e.g. `passed (coverage not configured)`)

(Use severity tags: P0, P1, P2. Omit P3; see the [review rubric](_shared/review-rubric.md).)
```

## Guidelines

- **Bias toward fixing in the same PR:** defer only what is truly larger or out of scope

## Related Skills

**After review:** Use `forge-address-pr-feedback` to address reviewer feedback.
**Single invocation:** Use `forge-ship` to implement and review in one step.

## Example Usage

```
/forge-reflect
/forge-reflect -- pay extra attention to migration safety and missing regression tests
```
