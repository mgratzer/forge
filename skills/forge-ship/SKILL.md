---
name: forge-ship
description: "End-to-end implementation and self-review in a single invocation: implements from an Issue, plan file, or free-text description, then runs a lean fresh-context review. Asks the user to approve the plan and triage findings unless --unattended or --guard. With --guard it also waits for CI and peer review, addresses feedback until the PR is review-ready, and ends with a risk verdict (merge-ready or review-ready, or merged when the project opts in). Use when the user or an orchestrating agent asks for forge-ship or to ship an Issue as a reviewed PR, not for a quick edit in the current session."
---

# Ship a Change

Implement a change, review it in fresh context, and push it. With `--guard`, carry the PR on to a terminal state.

## Input

Same as `forge-implement` (`$ARGUMENTS`): Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and triages findings without asking. A run no person can answer is unattended too, as in forge-implement.

**Guard mode:** `--guard` continues after the PR is open with forge-guard, then forge-land (Step 4). Implies `--unattended`.

## Process

### Step 1: Implement

Execute the full [forge-implement](../forge-implement/SKILL.md) process with one modification: **do not produce implement's summary**. Step 5 reports everything once.

### Step 2: Review (delegate)

**Simplification pass**: if the runtime provides a simplification skill (Claude Code: `/simplify`), invoke it on the branch diff and commit its edits before the review, so the review checks them. Otherwise skip it: the review's default checklist covers the same items.

**Fresh-context review**: run it however clean the change looks, following [review-delegation](_shared/review-delegation.md). This session wrote the diff, so even a tiny one goes to a fresh-context reviewer.

**Inputs provided to sub-agent:** what review-delegation's *Inputs Required* lists.
**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Triage Findings

**Attended (default):** present each finding to the user with a recommendation, biased hard toward **fix now**: defer only what materially expands the PR's scope or is truly out of scope.

**Unattended:** triage per [Unattended Triage](_shared/review-rubric.md#unattended-triage).

Commit the fixes and push once, together with any Step 2 simplification commit, even when nothing needed fixing. Deferred items become Issues, per [issue-operations](_shared/issue-operations.md).

### Step 4: Guard and Land (only with `--guard`)

Without `--guard`, report `pushed` via [status-reporting](_shared/status-reporting.md): the PR is open and self-reviewed, and the human takes it from there.

With `--guard`, run the full [forge-guard](../forge-guard/SKILL.md) process on the PR from Step 1. When it ends at `needs-human`, that is this skill's terminal state. When it reaches `review-ready`, don't report that state: run the full [forge-land](../forge-land/SKILL.md) process on the same PR, and its terminal state (`merged` only with the project's auto-merge opt-in, `merge-ready`, `review-ready` or `needs-human`) is this skill's.

### Step 5: Summarize

Report implementation, review, guard, and land results together.

## Output Format

```text
## Ship Summary

**PR:** #<number>: <title>
**Branch:** <branch-name>
**Result:** pushed | merged | merge-ready | review-ready | needs-human (<reason>)

### Implementation
- <N> commits, <M> files changed
- Tests: <added/modified/none>
- Docs: <updated/none>
- Exercised: <intended | wrong: <observed vs expected> | not exercised: <why>> (plus "not run: <parts>" when parts were skipped)
- Try it: <the `Try it` line from `## Exercised`> (omit when the section has none)

### Review Findings
- Simplify: applied <n> edits | nothing to simplify | covered by review (no simplification skill)
- Fixed in PR: <list or "none">
- Deferred: #<issue> (<title>), or "none"

### Guard   (guard mode only: the Passes, Rounds, and Open sections from forge-guard; Result above is authoritative)

### Land    (guard mode only, when guard reached review-ready: Judged, Checks, Review requested, and Label from forge-land)

### Quality Gates
- Lint: ✓/✗
- Format: ✓/✗
- Types: ✓/✗
- Tests: ✓/✗
- Coverage: ✓/✗/not configured
```

## Related Skills

**Components:** Composes `forge-implement`, the fresh-context review flow shared with `forge-reflect` (`_shared/review-delegation.md`), and `forge-guard` followed by `forge-land` when `--guard` is set.
**After peer review:** Use `forge-address-pr-feedback` to address reviewer comments (guard mode does this for you).
**Many Issues at once:** Use `forge-batch` to group Issues into Waves, then start one `forge-ship --guard` session per Issue, or let `forge-batch --start` start and continue them.

## Example Usage

```
/forge-ship 42
/forge-ship 42 -- keep the diff minimal
/forge-ship docs/roadmap.md
/forge-ship --unattended 42
/forge-ship --guard 42
```
