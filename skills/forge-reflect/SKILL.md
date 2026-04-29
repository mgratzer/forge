---
name: forge-reflect
description: Review current changes for correctness, security, code reuse, quality, and efficiency using parallel review agents. Works on a PR, branch diff, or uncommitted changes. Use when the user wants to self-review before committing, pushing, or requesting peer review.
context: fork
disable-model-invocation: true
---

# Reflect

Self-review current changes before committing, pushing, or requesting peer review.

## Input

No primary argument required. Automatically detects what to review.

Optional last parameter: `-- <additional context>`

Interpret `$ARGUMENTS` as optional execution guidance for the review focus.
If no argument is provided, use the default review checklist.

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

**Before delegating, read and collect the review context** — sub-agents receive this content embedded in their initial prompt, not as file references to pull:

1. Read [forge-reviewer](roles/forge-reviewer.md) role definition
2. Read [review dimensions](references/review-dimensions.md) — the four reviewer checklists
3. Read [review rubric](references/review-rubric.md) — severity calibration
4. Read `AGENTS.md` — project conventions

**Delegate to four parallel sub-agents**, each assigned one quality dimension. Fresh context eliminates self-review bias — the reviewers have no memory of implementation decisions. If the runtime does not support sub-agents, execute the four review dimensions inline sequentially.

Launch all four concurrently. Each sub-agent's initial prompt contains (pushed, not referenced):
- The forge-reviewer role definition
- One dimension checklist (the full text, not a file path)
- The review rubric (the full text, not a file path)
- `AGENTS.md` content
- Full diff output and changed file list
- Any additional context from the user's invocation

**Expected output:** Structured findings per agent, grouped by file with severity tags (P0/P1/P2).

### Step 3: Quality Gates

Run the project's lint, format, type check, and test commands. Fix issues and commit fixes.

### Step 4: Report

Aggregate findings from all four review agents (Step 2) with quality gate results (Step 3) into the summary format below. Deduplicate any findings flagged by multiple agents — keep the highest severity.

### Step 5: Triage Deferred Items

Present each deferred improvement to the user and ask whether to **fix now** or **defer as a follow-up issue**.

For each item, recommend one of:
- **Fix now** — small, low-effort changes that fit naturally in the current work (e.g., a missing test case, a stale doc reference, a duplicated line)
- **Defer** — larger changes that would expand scope or require separate review (e.g., a cross-cutting refactor, a new feature suggestion)

State your recommendation and let the user decide. Then:
- **Fix now items:** apply the fix and commit it
- **Deferred items:** create a GitHub issue to track:
  ```bash
  gh issue create --title "<title>" --body "<context and proposed solution>"
  ```

## Output Format

```text
## Reflection Summary

**Scope:** <PR #N | branch <name> vs <default> | uncommitted changes>

### Correctness & Patterns
- [P0/P1] <finding>

### Security
- [P0/P1] <finding>

### Code Reuse & Quality
- [P1/P2] <finding>

### Efficiency
- [P1/P2] <finding>

### Tests & Documentation
- [P2] <finding>

### Deferred Items
- Fixed: <what was addressed>
- Created #<num>: <title>
- (or: None identified)

(Use severity tags: P0, P1, P2. Omit P3 — see [review rubric](references/review-rubric.md).)
```

## Guidelines

- **Pattern consistency is the highest-value check** — a missed pattern update causes bugs across the codebase
- **Skip noise** — see [review rubric](references/review-rubric.md) for severity calibration and what not to flag
- **Triage deferred items with the user** — ask whether each item should be fixed now or deferred as a follow-up issue; only create issues for confirmed deferrals
- **Run quality gates before reporting** — catch issues before the reviewer does
- **Prefer fresh context** — a reviewer without implementation memory catches issues the author overlooks
- **Aggregate and deduplicate** — findings from the four agents may overlap; merge duplicates and keep the highest severity

## Related Skills

**After review:** Use `forge-address-pr-feedback` to address reviewer feedback.
**Single invocation:** Use `forge-ship` to implement and review in one step.

## Example Usage

```
/forge-reflect
/forge-reflect -- pay extra attention to migration safety and missing regression tests
```
