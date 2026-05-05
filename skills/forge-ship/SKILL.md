---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation. Implements from an Issue, plan file, or free-text description, then runs a lean fresh-context review. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship

Implement end to end — code it, review it, ship it. Implementation runs in the current session; tiny low-risk diffs review inline, otherwise review uses one fresh-context reviewer by default and deepens only when risk justifies it.

## Input

Same as `forge-implement`: Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and auto-triages findings by severity. Strip the flag before passing to forge-implement.

## Process

### Step 1: Implement

Read [forge-implement](../forge-implement/SKILL.md) and execute its Steps 1 through 8 (Understand → Plan → Branch → Implement → Pattern Audit → Docs → Quality Gates → Push & Create PR).

**In unattended mode:** skip plan approval in forge-implement Step 2 — proceed with the plan without calling AskUserQuestion.

Do not produce the implementation summary yet — the review will inform the final report.

### Step 2: Review (delegate)

Follow the [review-delegation](../_shared/review-delegation.md) process: collect the diff from the implementation, prefer one inline review pass for tiny low-risk diffs, otherwise use one fresh-context review pass by default, add a second pass only when risk justifies it, and aggregate findings. Fresh context eliminates self-review bias when delegated review is used — reviewers have no memory of implementation decisions.

### Step 3: Triage Findings

Use the aggregated findings from the review delegation.

**In attended mode (default):** present each finding to the user with a recommendation.

Bias hard toward **fix now**:
- **Fix now** — default for in-scope findings and small-to-moderate changes that still fit this PR → apply fix, commit
- **Defer** — only for larger changes that materially expand PR scope or are truly out of scope → create an Issue in the project's Issue tracker

**In unattended mode:** auto-triage using severity plus scope from the [review rubric](../_shared/review-rubric.md):

- **P0–P2, if in scope and reasonably sized** → fix now, commit
- **P1–P2, if truly out of scope or materially larger than the current PR** → defer, create an Issue in the project's Issue tracker
- **P3** → ignore

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

- **Tiny low-risk diffs stay inline** — do not pay sub-agent overhead when the change is obviously small
- **Delegated review runs in fresh context** — reviewers have no implementation memory
- **Keep review lean** — one reviewer by default, second only when risk justifies it
- **Don't skip the review** — even if implementation felt clean
- **Bias toward fixing in the same PR** — unless a finding is truly larger or out of scope
- **Triage with the user** — unless `--unattended` (default to fixing in-scope findings)
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
