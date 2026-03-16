---
name: forge-reflect-pr
description: Review the current PR branch for refactoring opportunities, missing tests, documentation updates, and cleanup before finalizing. Use when the user has finished implementing a feature and wants to self-review before requesting peer review.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
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

### Step 2: Review Each Changed File

For each file, check the default criteria, while prioritizing any areas called out in the optional additional context. Classify every finding using the [review rubric](references/review-rubric.md) — only flag P0, P1, and P2 items:

1. **Duplication** — repeated patterns that should be extracted
2. **Function size** — anything too long to follow at a glance
3. **Naming** — clear and consistent (only flag if actively misleading, not preference)
4. **Layer placement** — logic in the right abstraction layer
5. **Dead code** — unused imports, variables, or functions introduced
6. **Pattern consistency** — if a pattern was changed, are ALL files using it updated?
   ```bash
   grep -rn "<changed-pattern>" <search-root>/
   ```

### Step 3: Check Configuration

- New env vars documented in the appropriate sample env file or setup docs?
- Config placed where it's consumed?
- External service credentials handled properly (not hardcoded)?
- Manual deployment steps captured in PR description?

### Step 4: Assess Test Coverage

Check for corresponding test files. Run coverage on changed files if supported. Focus on: error handling branches, edge cases, new public functions.

### Step 5: Review Documentation

Check if changes require updates to: `docs/*.md`, `AGENTS.md`, code comments, README.

If you removed or renamed something, grep docs for stale references:
```bash
grep -rn "<removed-term>" docs/
```

### Step 6: Cleanup

- No temporary debug logging statements
- No commented-out code
- No TODO comments that should be addressed now
- No unused imports
- No hardcoded values that should be constants

### Step 7: Quality Gates

Run the project's lint, format, type check, and test commands. Fix issues.

### Step 8: Report

Summarize: refactoring done, tests added, documentation updated, items deferred.

For each deferred item, create a GitHub issue — do not leave deferred improvements untracked:

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

## Related Skills

**After review:** Use `forge-address-pr-feedback` to address reviewer feedback.

## Example Usage

```
/forge-reflect-pr
/forge-reflect-pr -- pay extra attention to migration safety and missing regression tests
```
