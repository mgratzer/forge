---
name: forge-reflect-pr
description: Review the current PR branch for correctness, security, code reuse, quality, and efficiency using parallel review agents before finalizing. Use when the user has finished implementing a feature and wants to self-review before requesting peer review.
context: fork
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

**Delegate this step to four parallel sub-agents with fresh context** if the runtime supports it. Fresh context eliminates self-review bias — the reviewers have no memory of implementation decisions. If the runtime does not support sub-agents, execute each agent's instructions inline sequentially.

Launch all four agents concurrently. Each receives the full diff so it has complete context.

**Agent 1: Correctness & Patterns**

> You are reviewing a PR diff for correctness and pattern consistency. Read `AGENTS.md` to understand project conventions. Classify every finding using the review rubric — only flag P0, P1, and P2 items.
>
> For each changed file, check:
>
> 1. **Logic errors** — off-by-one, wrong operator, incorrect boolean logic, unhandled null/undefined on critical paths
> 2. **Pattern consistency** — if a pattern was changed, grep for ALL files using it:
>    ```bash
>    grep -rn "<changed-pattern>" <search-root>/
>    ```
>    Flag any files still using the old pattern.
> 3. **Layer placement** — logic in the right abstraction layer
> 4. **Configuration** — new env vars documented in sample env or setup docs? Config placed where consumed? No hardcoded credentials? Manual deployment steps captured?
> 5. **Leaky abstractions** — exposing internal details that should be encapsulated, or breaking existing abstraction boundaries
>
> Return findings grouped by file, with severity tags (P0/P1/P2).

**Agent 2: Security**

> You are reviewing a PR diff for security vulnerabilities. Read `AGENTS.md` to understand project conventions. Classify every finding using the review rubric — only flag P0, P1, and P2 items.
>
> For each changed file, check:
>
> 1. **Injection** — SQL, command, XSS, template injection — anywhere user-controlled input reaches a query, shell command, or rendered output without sanitization
> 2. **Authentication & authorization** — new endpoints or operations missing auth checks; privilege escalation paths; role checks that can be bypassed
> 3. **Secrets & credentials** — API keys, tokens, passwords hardcoded or logged; secrets committed to version control; credentials in error messages or stack traces
> 4. **Input validation** — missing or insufficient validation on external input; path traversal via user-controlled file paths; unbounded input sizes that enable DoS
> 5. **SSRF & external requests** — user-controlled URLs passed to HTTP clients, DNS rebinding risks, internal service endpoints reachable via crafted input
> 6. **Race conditions** — time-of-check to time-of-use (TOCTOU) gaps that create security windows; concurrent access without proper locking on security-sensitive state
> 7. **Cryptography** — weak algorithms, hardcoded IVs/salts, custom crypto instead of established libraries, insecure random number generation for security-sensitive values
> 8. **Information leakage** — verbose error messages exposing internals, stack traces returned to clients, debug endpoints left enabled, sensitive data in logs
> 9. **Insecure deserialization** — deserializing untrusted data without validation; formats that allow code execution (pickle, YAML load, eval)
> 10. **Dependency risk** — new dependencies with known CVEs; pinned versions with known vulnerabilities; unnecessary new attack surface from added packages
>
> Return findings grouped by file, with severity tags (P0/P1/P2).

**Agent 3: Code Reuse & Quality**

> You are reviewing a PR diff for unnecessary complexity and missed reuse. Read `AGENTS.md` to understand project conventions. Classify every finding using the review rubric — only flag P0, P1, and P2 items.
>
> For each changed file, check:
>
> 1. **Redundant implementations** — search the codebase for existing helpers, utilities, or shared modules that already solve the same problem before accepting new code
> 2. **Extraction opportunities** — repeated logic across the diff, or inline code that reimplements what a shared module already provides (string manipulation, path handling, type guards, environment checks)
> 3. **Structural bloat** — functions growing beyond a screenful, parameter lists growing instead of restructuring, state that duplicates what’s already tracked elsewhere
> 4. **Dead weight** — unused imports, unreachable branches, or variables introduced but never read
> 5. **Misleading names** — only when a name will actively confuse the next reader, not style preferences
> 6. **Comment noise** — comments that narrate what the code does or reference the ticket; keep only non-obvious “why” (hidden constraints, workarounds, subtle invariants)
>
> Return findings grouped by file, with severity tags (P0/P1/P2).

**Agent 4: Efficiency, Tests & Docs**

> You are reviewing a PR diff for runtime cost and coverage gaps. Read `AGENTS.md` to understand project conventions. Classify every finding using the review rubric — only flag P0, P1, and P2 items.
>
> **Efficiency:**
> 1. **Wasted cycles** — redundant computations, duplicate I/O or network calls, N+1 query patterns
> 2. **Sequential bottlenecks** — independent operations that could run concurrently but are chained
> 3. **Hot-path impact** — new synchronous work on startup, request, or render critical paths
> 4. **Phantom updates** — state mutations that fire without checking whether anything actually changed, triggering unnecessary downstream work
> 5. **Premature existence checks** — verifying a resource exists before operating on it; prefer operating and handling the error (skip if already flagged as a security race condition by another reviewer)
> 6. **Resource leaks** — unbounded collections, missing cleanup handlers, dangling event listeners
> 7. **Over-fetching** — reading entire resources when a slice would suffice; loading all records to filter for one
>
> **Tests & Documentation:**
> 8. **Test coverage** — corresponding test files exist? Error handling branches covered? Edge cases for new public functions?
> 9. **Documentation** — changes require updates to `docs/*.md`, `AGENTS.md`, code comments, or README? Grep docs for stale references to anything removed or renamed:
>    ```bash
>    grep -rn "<removed-term>" docs/
>    ```
> 10. **Cleanup** — no temporary debug logging, commented-out code, untracked TODOs, unused imports, or hardcoded values that should be constants
>
> Return findings grouped by file, with severity tags (P0/P1/P2).

**Inputs provided to each sub-agent:**
- Output of `git diff $DEFAULT_BRANCH...HEAD`
- List of changed files
- Contents of [review-rubric.md](references/review-rubric.md)
- Contents of `AGENTS.md` (project conventions)
- Any additional context from the user's invocation

**Expected output:** Structured findings list with severity tags, grouped by file, from each agent.

If a finding is a false positive or not worth addressing, note it and move on.

### Step 3: Quality Gates

Run the project's lint, format, type check, and test commands. Fix issues and commit fixes.

### Step 4: Report

Aggregate findings from all four review agents (Step 2) with quality gate results (Step 3) into the summary format below. Deduplicate any findings flagged by multiple agents — keep the highest severity.

### Step 5: Triage Deferred Items

Present each deferred improvement to the user and ask whether to **fix now** or **defer as a follow-up issue**.

For each item, recommend one of:
- **Fix now** — small, low-effort changes that fit naturally in this PR (e.g., a missing test case, a stale doc reference, a duplicated line)
- **Defer** — larger changes that would expand the PR scope or require separate review (e.g., a cross-cutting refactor, a new feature suggestion)

State your recommendation and let the user decide. Then:
- **Fix now items:** apply the fix and commit it
- **Deferred items:** create a GitHub issue to track:
  ```bash
  gh issue create --title "<title>" --body "<context and proposed solution>"
  ```

## Output Format

```text
## PR Reflection Summary

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
- Fixed in PR: <what was addressed>
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

## Example Usage

```
/forge-reflect-pr
/forge-reflect-pr -- pay extra attention to migration safety and missing regression tests
```
