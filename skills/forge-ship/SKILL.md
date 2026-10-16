---
name: forge-ship
description: Implement and self-review in one invocation, from an Issue, plan file, or free-text description, with a lean fresh-context review and the quality passes. With --guard it also drives the PR through CI and peer review to review-ready. Use when the user wants to implement and review without handing off between skills.
disable-model-invocation: true
---

# Ship a Change

Implement end to end: code it, review it, ship it. Implementation runs in the current session; review always delegates to fresh context, and each quality dimension has one owner.

## Input

Same as `forge-implement` (`$ARGUMENTS`): Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and triages without asking.

**Local mode:** `--local`, or `Publish: local` in the Shipping settings ([project-config](_shared/project-config.md)), stops before anything leaves the machine. `--publish` later publishes the current branch. `--guard` always publishes.

**Guard mode:** `--guard` continues with the [forge-guard](../forge-guard/SKILL.md) process once the PR is open and ends at `review-ready` or `needs-human`. Implies `--unattended`.

## Process

### Step 1: Implement

Execute the [forge-implement](../forge-implement/SKILL.md) process through its Step 7, plus the first half of **Link PR** from Step 8, without implement's local-mode stop, status report, or summary. Step 6 pushes and opens the PR once the diff is final, so the body describes what the reviewer reads.

When the diff grew past implement's split size and the plan didn't settle it, offer stacked branches per [publish](references/publish.md#splitting); in unattended mode, keep going and name the size as a known limitation.

### Step 2: Review (delegate)

Follow [review-delegation](_shared/review-delegation.md) with one fresh-context reviewer by default; this session authored the diff, so the inline tiny-diff path never applies. Add a second pass only when risk justifies it.

**Inputs provided to sub-agent:** the branch diff commands, changed file list, project conventions, and the task with what it is not building, per review-delegation.
**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Triage Findings

Triage per *Triage* in the [review rubric](_shared/review-rubric.md): fix in-scope P0–P2 now, defer only what is truly out of scope or materially larger, and in attended mode ask one question only about the deferrals.

### Step 4: Run Quality Passes

Run the [quality-passes](_shared/quality-passes.md), triaging with Step 3's rule. After the last pass and its triage, go on to Step 5 in the same turn.

### Step 5: Exercise the Change (delegate)

When the diff changes runtime behavior and a recipe exists, delegate one run to a sub-agent following [exercise](references/exercise.md), so app output stays out of this session; inline when the runtime has no sub-agents. In attended mode, ask the human for the blocked actions the recipe names first; the sub-agent never asks. Act on the outcome as the reference says.

**Inputs provided to sub-agent:** the exercise reference, the recipe, the branch diff commands, the mode, and which human actions were done.
**Expected output:** the outcome, evidence lines, what wasn't covered and why, and the try-it commands.

### Step 6: Publish, or Stop for Local Review

In local mode, write the hand-off note, report `ready-for-local-review` via [status-reporting](_shared/status-reporting.md), summarize, and stop. Otherwise rebase, push, and open the PR; `--publish` starts here. Both follow [publish](references/publish.md).

### Step 7: Guard (only with `--guard`)

Run the [forge-guard](../forge-guard/SKILL.md) process on the PR, skipping its quality passes; Step 4 ran them. Its terminal state is this skill's. Without `--guard`, report `pushed`, or `needs-human` when an unattended run left a decision open.

### Step 8: Summarize

Report implementation, review, and guard results together. List **follow-ups**: issues reported outside this change that are neither a Finding nor already deferred (Issues in unattended mode). Each item appears once.

## Output Format

```text
## Ship Summary

**PR:** #<number> <title> | none (local)
**Branch:** <branch-name>
**Result:** ready-for-local-review | pushed | review-ready | needs-human: <reason>
**Next:** <the human's next step for the result, per status-reporting>

### Implementation
- <N> commits, <M> files changed; tests <added/modified/none>; docs <updated/none>
- Exercised: <what, one line>; not covered: <what and why> | not exercised: <reason>

### Try It Yourself   (when Step 5 ran)
<the commands from the exercise, ready to paste>

### Review Findings
- Review: fresh-context, <n> passes | self (reviewer failed)
- Fixed: <list or "none">; Deferred: #<issue> <title> | none
- Follow-ups: <list> | none
- Passes: simplify <n> applied | covered by <pass>; security <n> applied | not triggered | covered by <pass>; <extra pass> <n> applied | not available
- After create: <skill> ran | not available | not declared; labels left out: <labels>

### Guard   (guard mode only: forge-guard's Passes, Rounds, and Open sections)

**Quality gates:** passed | failed: <gate>: <one line each>
```

## Guidelines

- **Even tiny diffs delegate here:** this session authored the changes, so inline review would be self-review
- **Don't skip the review:** even if implementation felt clean
- **Write the summary for people:** follow [writing](_shared/writing.md)

## Related Skills

**Components:** `forge-implement`, the review flow shared with `forge-reflect`, and `forge-guard` with `--guard`.
**After peer review:** `forge-address-pr-feedback` (guard mode does this for you).
**Many Issues at once:** `forge-batch`, then a launcher from `contrib/launchers/`.

## Example Usage

```
/forge-ship 42
/forge-ship 42 -- keep the diff minimal
/forge-ship docs/roadmap.md
/forge-ship --unattended 42
/forge-ship --guard 42
/forge-ship --local 42
/forge-ship --publish
```
