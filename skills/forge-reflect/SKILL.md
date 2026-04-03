---
name: forge-reflect
description: Review current changes for correctness, security, code reuse, quality, and efficiency using parallel review agents. Works on a PR, branch diff, or uncommitted changes. Use when the user wants to self-review before committing, pushing, or requesting peer review.
context: fork
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

**Use the first scope that has changes.** Combine staged + unstaged when reviewing uncommitted work. If nothing to review, tell the user.

Collect the full diff and the list of changed files for the review step.

### Step 2: Review Changes (delegate)

**Delegate to four parallel sub-agents** using the [reviewer](roles/reviewer.md) role, each assigned one quality dimension. Fresh context eliminates self-review bias — the reviewers have no memory of implementation decisions. If the runtime does not support sub-agents, read the role file and execute each review inline sequentially.

Launch all four concurrently. Each sub-agent receives:
- Role: [reviewer](roles/reviewer.md)
- [Review rubric](references/review-rubric.md) for severity calibration
- `AGENTS.md` for project conventions
- Full diff output and changed file list
- Any additional context from the user's invocation
- One dimension checklist (below)

**Agent 1 — Correctness & Patterns:**

> 1. **Logic errors** — off-by-one, wrong operator, incorrect boolean logic, unhandled null/undefined on critical paths
> 2. **Pattern consistency** — if a pattern was changed, grep for ALL files using it:
>    ```bash
>    grep -rn "<changed-pattern>" <search-root>/
>    ```
>    Flag any files still using the old pattern.
> 3. **Layer placement** — logic in the right abstraction layer
> 4. **Configuration** — new env vars documented in sample env or setup docs? Config placed where consumed? No hardcoded credentials? Manual deployment steps captured?
> 5. **Leaky abstractions** — exposing internal details that should be encapsulated, or breaking existing abstraction boundaries

**Agent 2 — Security:**

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

**Agent 3 — Code Reuse & Quality:**

> 1. **Redundant implementations** — search the codebase for existing helpers, utilities, or shared modules that already solve the same problem before accepting new code
> 2. **Extraction opportunities** — repeated logic across the diff, or inline code that reimplements what a shared module already provides (string manipulation, path handling, type guards, environment checks)
> 3. **Structural bloat** — functions growing beyond a screenful, parameter lists growing instead of restructuring, state that duplicates what's already tracked elsewhere
> 4. **Dead weight** — unused imports, unreachable branches, or variables introduced but never read
> 5. **Misleading names** — only when a name will actively confuse the next reader, not style preferences
> 6. **Comment noise** — comments that narrate what the code does or reference the ticket; keep only non-obvious "why" (hidden constraints, workarounds, subtle invariants)

**Agent 4 — Efficiency, Tests & Docs:**

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
