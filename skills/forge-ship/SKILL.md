---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation — implements from an Issue, plan file, or free-text description, then runs a lean fresh-context review. With --guard it also waits for CI and peer review and addresses feedback until the PR is review-ready. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship a Change

Implement end to end — code it, review it, ship it. Implementation runs in the current session; review always delegates to fresh context and deepens only when risk justifies it.

## Input

Same as `forge-implement` (`$ARGUMENTS`): Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and auto-triages findings by severity.

**Guard mode:** `--guard` continues after the PR is open with the [forge-guard](../forge-guard/SKILL.md) process — quality passes, CI, peer review, feedback rounds — and ends at `review-ready` or `needs-human`. Implies `--unattended`.

## Process

Report each step transition via [status-reporting](../_shared/status-reporting.md): `implementing` at Step 1, `reviewing` at Step 2, then whatever the guard reports.

### Step 1: Implement

Execute the full [forge-implement](../forge-implement/SKILL.md) process with one modification: **do not produce implement's summary** — the review below informs the single final report.

### Step 2: Review (delegate)

Follow the [review-delegation](../_shared/review-delegation.md) process: collect the diff from the implementation, use one fresh-context review pass by default (this session authored the diff, so the inline tiny-diff path never applies), add a second pass only when risk justifies it, and aggregate findings.

**Inputs provided to sub-agent:** the branch diff, changed file list, and project conventions per review-delegation.
**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Triage Findings

**In attended mode (default):** present each finding to the user with a recommendation, biased hard toward **fix now** — defer only changes that materially expand PR scope or are truly out of scope.

**In unattended mode:** auto-triage by severity plus scope from the [review rubric](../_shared/review-rubric.md): fix P0–P2 in-scope findings now; defer P1–P2 items that are truly out of scope or materially larger; ignore P3.

Fixed findings are committed and pushed; deferred items become Issues — see [issue-operations](../_shared/issue-operations.md).

### Step 4: Guard (only with `--guard`)

Run the full [forge-guard](../forge-guard/SKILL.md) process on the PR from Step 1. Its terminal state is this skill's terminal state. Without `--guard`, report `pushed` here — the PR is open and self-reviewed, and the human takes it from there.

### Step 5: Summarize

Report implementation, review, and guard results together.

## Output Format

```text
## Ship Summary

**PR:** #<number> — <title>
**Branch:** <branch-name>
**Result:** pushed | review-ready | needs-human — <reason>

### Implementation
- <N> commits, <M> files changed
- Tests: <added/modified/none>
- Docs: <updated/none>

### Review Findings
- Fixed in PR: <list or "none">
- Deferred: #<issue> — <title> (or "none")

### Guard   (guard mode only — the Guard Summary from forge-guard)

### Quality Gates
- Lint: ✓/✗
- Format: ✓/✗
- Types: ✓/✗
- Tests: ✓/✗
- Coverage: ✓/✗/not configured
```

## Guidelines

- **Even tiny diffs delegate here** — this session authored the changes, so inline review would be self-review
- **Don't skip the review** — even if implementation felt clean
- **Bias toward fixing in the same PR** — unless a finding is truly larger or out of scope
- **Guard never merges** — `review-ready` means the human looks next, not that the work is done

## Related Skills

**Components:** Composes `forge-implement`, the fresh-context review flow shared with `forge-reflect` (`_shared/review-delegation.md`), and `forge-guard` when `--guard` is set.
**After peer review:** Use `forge-address-pr-feedback` to address reviewer comments (guard mode does this for you).
**Many Issues at once:** Use `forge-batch` to group Issues into Waves, then a launcher from `contrib/launchers/` to start one guarded ship per Issue.

## Example Usage

```
/forge-ship 42
/forge-ship 42 -- keep the diff minimal
/forge-ship docs/roadmap.md
/forge-ship --unattended 42
/forge-ship --guard 42
```
