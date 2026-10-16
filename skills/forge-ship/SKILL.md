---
name: forge-ship
description: End-to-end implementation and self-review in a single invocation; implements from an Issue, plan file, or free-text description, then runs a lean fresh-context review and the quality passes. With --guard it also waits for CI and peer review and addresses feedback until the PR is review-ready. Use when the user wants to implement and review without manual handoff between skills.
disable-model-invocation: true
---

# Ship a Change

Implement end to end: code it, review it, ship it. Implementation runs in the current session; review always delegates to fresh context, and each quality dimension has one owner.

## Input

Same as `forge-implement` (`$ARGUMENTS`): Issue number/URL, plan file path, or free-text. Optional: `-- <additional context>`.

**Unattended mode:** `--unattended` skips plan approval and auto-triages findings by severity.

**Local mode:** `--local`, or `Publish: local` in the Shipping settings (see [project-config](_shared/project-config.md)), stops before anything leaves the machine: no push, no PR. `--publish` later publishes the current branch. `--guard` always publishes.

**Guard mode:** `--guard` continues after the PR is open with the [forge-guard](../forge-guard/SKILL.md) process (CI, peer review, feedback rounds; ship has already run the quality passes) and ends at `review-ready` or `needs-human`. Implies `--unattended`.

## Process

### Step 1: Implement

Execute the [forge-implement](../forge-implement/SKILL.md) process through its Step 7, plus the first half of **Link PR** from Step 8. Don't push and don't create the PR: *Publish* below does both once the diff is final, so every pass runs before anything is pushed and the body describes what the reviewer will read. Skip implement's local-mode stop and its status report, and don't produce implement's summary; the review below informs the single final report.

When the diff grew past the `Split threshold` Shipping setting (default 600 changed lines) and the approved plan didn't already settle its size, propose splitting it into stacked local branches before the review; on a stacked branch, measure against its parent. An accepted split ends the run at `ready-for-local-review` with the branch layout in the summary; the human publishes each branch in stack order with `--publish`. In unattended mode, keep going and name the size as a known limitation for the PR body.

### Step 2: Review (delegate)

Follow the [review-delegation](_shared/review-delegation.md) process: collect the diff from the implementation, use one fresh-context review pass by default (this session authored the diff, so the inline tiny-diff path never applies), add a second pass only when risk justifies it, and aggregate findings.

**Inputs provided to sub-agent:** the branch diff, changed file list, project conventions, and the task with what it is not building from the plan, per review-delegation.
**Expected output:** Deduplicated findings grouped by file with severity tags (P0/P1/P2).

### Step 3: Triage Findings

**In attended mode (default):** present each finding to the user with a recommendation, biased hard toward **fix now**: defer only changes that materially expand PR scope or are truly out of scope.

**In unattended mode:** auto-triage by severity plus scope from the [review rubric](_shared/review-rubric.md): fix P0–P2 in-scope findings now; defer P1–P2 items that are truly out of scope or materially larger; ignore P3.

Fixed findings are committed; deferred items become Issues (see [issue-operations](_shared/issue-operations.md)).

### Step 4: Run Quality Passes

Run the [quality-passes](_shared/quality-passes.md) (simplify always, security when triggered, then the project's extra passes), triaging with Step 3's rule. Each dimension has one owner, so a declared pass that covers security replaces forge's own security pass instead of adding to it. When a pass's skill returns its report, go on to Step 5 in the same turn; the report is triage input, not the end of the ship.

### Step 5: Exercise the Change (delegate)

When the diff changes runtime behavior and the Shipping settings declare an `Exercise:` recipe or the runtime has a run skill, delegate the run to a sub-agent following [exercise](references/exercise.md), so app output and logs stay out of this session. In attended mode, ask the human for the blocked actions the recipe names before delegating; the sub-agent never asks. Act on its outcome as the reference says. If the runtime has no sub-agents, follow the same reference inline. With no recipe, report `not exercised` with the reason; never guess how to start the app.

**Inputs provided to sub-agent:** the exercise reference, the recipe, the branch diff commands, the mode, and which human actions were done.
**Expected output:** the outcome (`intended`, `wrong (<observed vs expected>)`, or `can't start (<why>)`), evidence lines, what wasn't covered and why, and the try-it commands.

### Step 6: Stop for Local Review (local mode only)

Write the hand-off note, so a later publish drafts the same body and record this run would have. It lives in the shared git directory, survives a removed worktree, and is never committed:

```bash
NOTE="$(git rev-parse --path-format=absolute --git-common-dir)/forge/ship-$(git branch --show-current | tr / -).md"
mkdir -p "$(dirname "$NOTE")"
```

It holds: the why's source and the closing references; the base branch the work was cut from; Step 3's findings fixed, deferred (with Issues), and left open, and the decisions left for the human; who reviewed and which passes ran; Step 5's outcome, evidence, not-covered line, and try-it commands; and the known limitations, including unattended assumptions.

Report `ready-for-local-review` via [status-reporting](_shared/status-reporting.md), summarize, and stop. The human reviews the branch, then runs `/forge-ship --publish`.

### Step 7: Publish

`--publish` starts here, on the current branch, with the hand-off note. Without a note (the work came from `forge-implement --local` or by hand), nothing attests the branch yet: run **Link PR**'s first half and Steps 2 to 5 first, then continue. A non-local run continues here directly.

1. **Rebase** onto the fetched default branch, recomputed with forge-implement Step 3's `git symbolic-ref` line: `git fetch origin && git rebase origin/<DEFAULT_BRANCH>`. When the note names a base branch other than the default and that base's PR has merged, `git rebase --onto origin/<DEFAULT_BRANCH> <BASE>`; while it is still open, rebase onto `origin/<BASE>` instead. Resolve conflicts, asking in attended mode when a resolution changes behavior.
2. **Re-check after the rebase.** When it brought in upstream commits, re-run the quality gates. When it needed conflict resolutions, review the resolution with one fresh-context reviewer per [review-delegation](_shared/review-delegation.md), so the record never attests an unreviewed tree. Name the rebase in the summary.
3. **Write the review record** when the project declares one, per [review-record](_shared/review-record.md), from the note's verdict inputs: the last commit before the push.
4. **Push and open the PR** as forge-implement's Step 8 does: body drafted blind against [pr-body](_shared/pr-body.md) with the note's deferred Issues, limitations, evidence, and try-it commands, the PR settings, `--base <BASE>` while a stacked base is unmerged, and the second half of **Link PR**. When the branch is already on `origin` (an earlier publish, a push by hand), a rebased branch needs `git push --force-with-lease`: ask first in attended mode; in unattended mode, skip the rebase rather than force-push. When a PR already exists for the branch, push to it and skip creating one. Delete the note.

### Step 8: Guard (only with `--guard`)

Run the [forge-guard](../forge-guard/SKILL.md) process on the PR opened above, skipping its quality passes; *Run Quality Passes* already ran them. Its terminal state is this skill's terminal state. Without `--guard`, report `pushed` via [status-reporting](_shared/status-reporting.md): the PR is open and self-reviewed, and the human takes it from there.

### Step 9: Summarize

Report implementation, review, and guard results together.

## Output Format

```text
## Ship Summary

**PR:** #<number> <title> | none (local)
**Branch:** <branch-name>
**Result:** ready-for-local-review | pushed | review-ready | needs-human: <reason>
**Next:** <the human's next step for the result, per status-reporting>

### Implementation
- <N> commits, <M> files changed
- Tests: <added/modified/none>
- Exercised: <what, one line>; not covered: <what and why> | not exercised: <reason>
- Docs: <updated/none>

### Try It Yourself   (when Step 5 ran)
<the commands from the exercise, ready to paste>

### Review Findings
- Fixed in PR: <list or "none">
- Deferred: #<issue> <title> (or "none")
- After create: <skill> ran | not available | not declared; labels left out: <labels>
- Record: <sha> covering <range> | not declared | at publish (local)
- Passes: simplify <n> applied | covered by <pass>; security <n> applied | not triggered | covered by <pass>; <extra pass> <n> applied | not available

### Guard   (guard mode only: the Passes, Rounds, and Open sections from forge-guard; Result above is authoritative)

**Quality gates:** passed | failed: <gate>[, <gate>]: <one line each>   (e.g. `passed (coverage not configured)`)
```

## Guidelines

- **Even tiny diffs delegate here:** this session authored the changes, so inline review would be self-review
- **Don't skip the review:** even if implementation felt clean
- **Bias toward fixing in the same PR:** unless a finding is truly larger or out of scope
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
/forge-ship --local 42
/forge-ship --publish
```
