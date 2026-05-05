---
name: forge-reflect
description: Review current changes with a lean review flow. Works on a PR, branch diff, or uncommitted changes. Tiny low-risk diffs stay inline; larger or riskier changes use fresh-context review. Use when the user wants to self-review before committing, pushing, or requesting peer review.
context: fork
disable-model-invocation: true
---

# Reflect

Self-review current changes before committing, pushing, or requesting peer review.

## Input

No primary argument required — automatically detects what to review. Optional: `-- <additional context>` for review focus guidance.

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
If on a branch different from default with commits ahead, use `$DEFAULT_BRANCH...HEAD`.

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

Follow the [review-delegation](../_shared/review-delegation.md) process: collect materials, prefer one inline review pass for tiny low-risk diffs, otherwise run one fresh-context review pass by default, add a second pass only when risk justifies it, and aggregate findings.

**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Quality Gates

Run the project's lint, format, type check, and test commands. Fix issues and commit fixes.

### Step 4: Report

Aggregate findings from all review passes (Step 2) with quality gate results (Step 3) into the summary format below. Deduplicate any findings flagged by multiple passes — keep the highest severity.

### Step 5: Triage Deferred Items

Present each deferred improvement to the user and ask whether to **fix now** or **defer as a follow-up issue**.

Bias hard toward **fix now**. Recommend deferral only when the finding is truly out of scope, materially expands the PR, or needs separate design/review.

For each item, recommend one of:
- **Fix now** — default for in-scope findings and small follow-up work (e.g., missing tests, stale docs, duplicated lines, modest refactors that fit the current change)
- **Defer** — only for larger or truly out-of-scope changes (e.g., a cross-cutting refactor, a new feature, a separate migration strategy)

State your recommendation and let the user decide. Then:
- **Fix now items:** apply the fix and commit it
- **Deferred items:** create an Issue in the project's Issue tracker (see [issue-operations](../_shared/issue-operations.md)) with context and proposed solution

## Output Format

```text
## Reflection Summary

**Scope:** <PR #N | branch <name> vs <default> | uncommitted changes>

### Findings
#### <file>
- [P0/P1/P2] <finding>

### Deferred Items
- Fixed: <what was addressed>
- Created #<num>: <title>
- (or: None identified)

### Quality Gates
- Lint: ✓/✗
- Format: ✓/✗
- Types: ✓/✗
- Tests: ✓/✗

(Use severity tags: P0, P1, P2. Omit P3 — see [review rubric](../_shared/review-rubric.md).)
```

## Guidelines

- **Pattern consistency is the highest-value check**
- **Tiny low-risk diffs stay inline** — avoid fresh-context overhead when the change is obviously small
- **Keep review lean** — one reviewer by default, second only when risk justifies it
- **Skip noise** — see [review rubric](../_shared/review-rubric.md)
- **Bias toward fixing in the same PR** — only create Issues for confirmed deferrals that are truly larger or out of scope
- **Aggregate and deduplicate** — merge overlapping findings, keep highest severity

## Related Skills

**After review:** Use `forge-address-pr-feedback` to address reviewer feedback.
**Single invocation:** Use `forge-ship` to implement and review in one step.

## Example Usage

```
/forge-reflect
/forge-reflect -- pay extra attention to migration safety and missing regression tests
```
