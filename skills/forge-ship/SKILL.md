---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation. Implements from an Issue, plan file, or free-text description, then delegates review to fresh-context reviewer sub-agents. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship

Implement end to end — code it, review it, ship it. Implementation runs in the current session; review is delegated to fresh-context reviewer sub-agents for unbiased findings.

## Input

Same as `forge-implement`: Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and auto-triages findings by severity. Strip the flag before passing to forge-implement.

## Process

### Step 1: Implement

Read [forge-implement](../forge-implement/SKILL.md) and execute its Steps 1 through 8 (Understand → Plan → Branch → Implement → Pattern Audit → Docs → Quality Gates → Push & Create PR).

**In unattended mode:** skip plan approval in forge-implement Step 2 — proceed with the plan without calling AskUserQuestion.

Do not produce the implementation summary yet — the review will inform the final report.

### Step 2: Review (delegate)

Follow the [review-delegation](../_shared/review-delegation.md) process: collect the diff from the implementation, compose four dimension-specific review tasks, delegate to parallel sub-agents (or execute inline as fallback), and aggregate findings. Fresh context eliminates self-review bias — reviewers have no memory of implementation decisions.

### Step 3: Triage Findings

Use the aggregated findings from the review delegation.

**In attended mode (default):** present each finding to the user with a recommendation:

- **Fix now** — small, low-effort changes that fit in this PR → apply fix, commit
- **Defer** — larger changes that expand PR scope → create an Issue in the project's Issue tracker

**In unattended mode:** auto-triage using severity from the [review rubric](../_shared/review-rubric.md):

- **P0–P1** → fix now, commit
- **P2–P3** → defer, create an Issue in the project's Issue tracker

For both modes, deferred items become Issues — see [issue-operations](../_shared/issue-operations.md) for provider-specific mechanics.

### Step 4: Summary

Report implementation and review results together.

## Output Format

```text
## Ship Summary

**PR:** #<number> — <title>
**Branch:** <branch-name>

### Implementation
- <N> commits, <M> files changed
- Tests: <added/modified/none>
- Docs: <updated/none>

### Review Findings
- Fixed in PR: <list or "none">
- Deferred: #<issue> — <title> (or "none")

### Quality Gates
- Lint: ✓/✗
- Types: ✓/✗
- Tests: ✓/✗
```

## Guidelines

- **Review runs in fresh context** — sub-agents have no implementation memory
- **Don't skip the review** — even if implementation felt clean
- **Triage with the user** — unless `--unattended` (P0–P1 fix, P2–P3 defer)
- **Graceful degradation** — works inline if no sub-agent support

## Related Skills

**Components:** Composes `forge-implement` and `forge-reflect`.
**After peer review:** Use `forge-address-pr-feedback` to address reviewer comments.

## Example Usage

```
/forge-ship 42
/forge-ship 42 -- keep the diff minimal
/forge-ship docs/roadmap.md
/forge-ship --unattended 42
```
