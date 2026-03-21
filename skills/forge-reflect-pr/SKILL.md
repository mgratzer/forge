---
name: forge-reflect-pr
description: Review the current PR branch for refactoring opportunities, missing tests, documentation updates, and cleanup before finalizing. Use when the user has finished implementing a feature and wants to self-review before requesting peer review.
---

# Reflect on PR

Self-review the current PR branch before requesting peer review.

## Input

No primary argument required. Operates on the current branch.

Optional last parameter: `-- <additional context>`

Interpret `$ARGUMENTS` as optional execution guidance for the review focus.
If no argument is provided, use the default review checklist.

## Process

### Step 1: Identify Changes

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git diff --name-only $DEFAULT_BRANCH...HEAD
```

Collect the full diff and the list of changed files for the review step.

### Step 2: Review Changes (delegate)

**Delegate this step to a sub-agent with fresh context** if the runtime supports it. The fresh context eliminates self-review bias — the reviewer has no memory of implementation decisions. If the runtime does not support sub-agents, execute the instructions inline.

**Sub-agent instructions:**

> You are reviewing a PR diff for real problems. Read `AGENTS.md` to understand project conventions. Classify every finding using the review rubric — only flag P0, P1, and P2 items.
>
> For each changed file, check:
>
> 1. **Duplication** — repeated patterns that should be extracted
> 2. **Function size** — anything too long to follow at a glance
> 3. **Naming** — clear and consistent (only flag if actively misleading, not preference)
> 4. **Layer placement** — logic in the right abstraction layer
> 5. **Dead code** — unused imports, variables, or functions introduced
> 6. **Pattern consistency** — if a pattern was changed, grep for ALL files using it:
>    ```bash
>    grep -rn "<changed-pattern>" <search-root>/
>    ```
> 7. **Configuration** — new env vars documented in sample env or setup docs? Config placed where consumed? No hardcoded credentials? Manual deployment steps captured?
> 8. **Test coverage** — corresponding test files exist? Error handling branches covered? Edge cases for new public functions?
> 9. **Documentation** — changes require updates to `docs/*.md`, `AGENTS.md`, code comments, or README? Grep docs for stale references to anything removed or renamed:
>    ```bash
>    grep -rn "<removed-term>" docs/
>    ```
> 10. **Cleanup** — no temporary debug logging, commented-out code, untracked TODOs, unused imports, or hardcoded values that should be constants
>
> Return findings grouped by file, with severity tags (P0/P1/P2).

**Inputs provided to sub-agent:**
- Output of `git diff $DEFAULT_BRANCH...HEAD`
- List of changed files
- Contents of [review-rubric.md](references/review-rubric.md)
- Contents of `AGENTS.md` (project conventions)
- Any additional context from the user's invocation

**Expected output:** Structured findings list with severity tags, grouped by file.

### Step 3: Quality Gates

Run the project's lint, format, type check, and test commands. Fix issues and commit fixes.

### Step 4: Report

Synthesize the review findings (from Step 2) with quality gate results (from Step 3) into the summary format below.

### Step 5: Track Deferred Items

For each deferred improvement, create a GitHub issue — do not leave deferred items untracked:

```bash
gh issue create --title "<title>" --body "<context and proposed solution>"
```

## Output Format

```text
## PR Reflection Summary

### Refactoring
- [P1] <what was done>

### Tests
- [P2] <what was added>

### Documentation
- [P2] <what was updated>

### Cleanup
- [P1] <what was fixed>

### Deferred Items
- Created #<num>: <title> (or: None identified)

(Use severity tags: P0, P1, P2. Omit P3 — see [review rubric](references/review-rubric.md).)
```

## Guidelines

- **Pattern consistency is the highest-value check** — a missed pattern update causes bugs across the codebase
- **Skip noise** — see [review rubric](references/review-rubric.md) for severity calibration and what not to flag
- **Create issues for deferred items** — never leave improvements as untracked notes
- **Run quality gates before reporting** — catch issues before the reviewer does
- **Prefer fresh context** — a reviewer without implementation memory catches issues the author overlooks

## Related Skills

**After review:** Use `forge-address-pr-feedback` to address reviewer feedback.

## Example Usage

```
/forge-reflect-pr
/forge-reflect-pr -- pay extra attention to migration safety and missing regression tests
```
