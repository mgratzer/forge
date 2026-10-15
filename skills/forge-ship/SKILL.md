---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation — implements from an Issue, plan file, or free-text description, then runs a lean fresh-context review and the quality passes. With --guard it also waits for CI and peer review and addresses feedback until the PR is review-ready. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship a Change

Implement end to end — code it, review it, ship it. Implementation runs in the current session; review always delegates to fresh context, and each quality dimension has one owner.

## Input

Same as `forge-implement` (`$ARGUMENTS`): Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and auto-triages findings by severity.

**Guard mode:** `--guard` continues after the PR is open with the [forge-guard](../forge-guard/SKILL.md) process — CI, peer review, feedback rounds; ship has already run the quality passes — and ends at `review-ready` or `needs-human`. Implies `--unattended`.

## Process

### Step 1: Implement

Execute the [forge-implement](../forge-implement/SKILL.md) process through the push in its Step 8, with two modifications: **don't create the PR yet** — *Open the PR* below opens it once the diff is final, so the body describes what the reviewer will read — and **don't produce implement's summary**; the review below informs the single final report.

### Step 2: Review (delegate)

Follow the [review-delegation](_shared/review-delegation.md) process: collect the diff from the implementation, use one fresh-context review pass by default (this session authored the diff, so the inline tiny-diff path never applies), add a second pass only when risk justifies it, and aggregate findings.

**Inputs provided to sub-agent:** the branch diff, changed file list, and project conventions per review-delegation.
**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Triage Findings

**In attended mode (default):** present each finding to the user with a recommendation, biased hard toward **fix now** — defer only changes that materially expand PR scope or are truly out of scope.

**In unattended mode:** auto-triage by severity plus scope from the [review rubric](_shared/review-rubric.md): fix P0–P2 in-scope findings now; defer P1–P2 items that are truly out of scope or materially larger; ignore P3.

Fixed findings are committed and pushed; deferred items become Issues — see [issue-operations](_shared/issue-operations.md).

### Step 4: Run Quality Passes

Run the [quality-passes](_shared/quality-passes.md) — simplify always, security when triggered, then the project's extra passes — triaging with Step 3's rule. Each dimension has one owner, so a declared pass that covers security replaces forge's own security pass instead of adding to it.

### Step 5: Exercise the Change

When the diff changes runtime behavior and the project declares an `Exercise:` recipe or the runtime has a run skill, start the app, drive the changed path once plus one failure case, and keep the observations as evidence — see [exercise](references/exercise.md). Otherwise report `not exercised` with the reason; never guess how to start the app.

### Step 6: Open the PR

When the project declares a review record, write it first per [review-record](_shared/review-record.md) — the last commit before the PR opens. Then create the PR as forge-implement's Step 8 does — body drafted blind against [pr-body](_shared/pr-body.md), draft unless the Shipping settings say otherwise — from the final diff, passing Step 3's deferred Issues as known follow-ups and Step 5's evidence.

### Step 7: Guard (only with `--guard`)

Run the [forge-guard](../forge-guard/SKILL.md) process on the PR opened above, skipping its quality passes — *Run Quality Passes* already ran them. Its terminal state is this skill's terminal state. Without `--guard`, report `pushed` via [status-reporting](_shared/status-reporting.md) — the PR is open and self-reviewed, and the human takes it from there.

### Step 8: Summarize

Report implementation, review, and guard results together.

## Output Format

```text
## Ship Summary

**PR:** #<number> <title>
**Branch:** <branch-name>
**Result:** pushed | review-ready | needs-human: <reason>
**Next:** <the human's next step for the result, per status-reporting>

### Implementation
- <N> commits, <M> files changed
- Tests: <added/modified/none>
- Exercised: <what, one line> | not exercised — <reason>
- Docs: <updated/none>

### Review Findings
- Fixed in PR: <list or "none">
- Deferred: #<issue> <title> (or "none")
- After create: <skill> ran | not available | not declared; labels left out: <labels>
- Record: <sha> covering <range> | not declared
- Passes: simplify <n> applied | covered by <pass>; security <n> applied | not triggered | covered by <pass>; <extra pass> <n> applied | not available

### Guard   (guard mode only: the Passes, Rounds, and Open sections from forge-guard; Result above is authoritative)

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
- **Write the summary for people:** follow [writing](_shared/writing.md)

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
