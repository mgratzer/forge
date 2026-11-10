---
name: forge-land
description: "Decide what a green pull request needs from a human: check it is mergeable, green, addressed and exercised, get a fresh-context risk verdict on the head commit, write it into the PR as a ## Risk section, and report merge-ready or review-ready. Merges a low-risk PR only when the project opts in with Auto-merge: low-risk. Use when the user or an orchestrating agent asks for forge-land on an open PR (typically after forge-guard reaches review-ready), or when forge-ship runs with --guard."
---

# Land a Pull Request

Decide whether a green PR needs a person, and when it does, tell them where to look. Land never pushes, never closes the PR, and merges only through the project's opt-in in Step 4. Nothing here asks the user.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from the current branch if omitted). Optional: `-- <additional context>`. No argument or context turns merging on.

## Process

### Step 1: Check the Preconditions

```bash
gh pr view $PR_ARG --json number,author,baseRefName,headRefOid,closingIssuesReferences   # PR, BASE, SHA, linked Issues
ME=$(gh api user --jq .login)
git fetch origin "$BASE" "pull/$PR/head"   # the verdict reads the diff and files at $SHA, whatever is checked out
```

Read the peer reviewer, the security-sensitive paths and the auto-merge setting per [unattended-config](_shared/unattended-config.md). Read the signals with `pr-state.sh`, called as [pr-readiness](_shared/pr-readiness.md#reading-the-signals) says. The PR qualifies only when every row holds; otherwise end with `needs-human` (Step 5), naming each row that failed.

| Precondition | Holds when |
|--------------|------------|
| Mergeable | `mergeable` prints `MERGEABLE` first; still `UNKNOWN` fails |
| CI green | `ci-wait` printed `pass` or `none` (no CI), or `fail` with only [Pre-existing](_shared/pr-readiness.md#ci) checks. While it runs, report `waiting` via [status-reporting](_shared/status-reporting.md) and wait per [How to Wait](_shared/pr-readiness.md#how-to-wait); an event meanwhile only re-checks this table. No verdict on pending checks: `pending` at the cap fails |
| Feedback addressed | `feedback` returns nothing but [No ask](_shared/pr-readiness.md#open-feedback) items, so a standing "Needs your decision" reply fails this |
| Exercised | the body has a `## Exercised` section (see [exercise](_shared/exercise.md)) |
| Reviewed | `reviews` has an entry that is not `failed`. With no peer reviewer configured, this holds without one |

The `## Risk` section's **Peer review** line is the login of the latest such review, or `none configured` without a peer reviewer.

### Step 2: Judge the Risk (delegate)

Report `reviewing`. Delegate the verdict on `$SHA` to one fresh-context sub-agent: the session that wrote the code is the worst judge of its risk. If the runtime has no sub-agents, judge inline from the rubric alone, without reusing what this session knows about the change.

> Judge whether PR #<PR> at commit `<SHA>` needs a human review before merging. Read the diff with `git diff "origin/<BASE>...<SHA>"`, files at that commit with `git show "<SHA>:<path>"` (from a shell variable, `"${SHA}:<path>"`: zsh reads `$SHA:A` or `$SHA:s` as a modifier), and the PR body with `gh pr view <PR> --json body`. Run every check in the rubric below first; any hit means needs-review. When none hits, apply the judgment test. Return the filled `## Risk` section from the rubric and nothing else.

**Inputs provided to sub-agent:** the task above, [risk-rubric](_shared/risk-rubric.md) (pushed), the security-sensitive paths, the linked Issue numbers, the PR author, and the **Peer review** line from Step 1.
**Expected output:** The filled `## Risk` section, verdict and SHA first.

### Step 3: Write the Risk Section

The verdict holds only for `$SHA`. If `headRefOid` has moved by now, start over from Step 1 once; moved again, end with `needs-human`.

Replace the existing `## Risk` section (up to the next `## ` heading) or append one, and pass the body as a file, never inline:

```bash
BODY=$(mktemp)
gh pr view "$PR" --json body --jq .body > "$BODY"   # edit the ## Risk section in this file
gh pr edit "$PR" --body-file "$BODY"
```

### Step 4: Act

| Verdict | Act | State |
|---------|-----|-------|
| Needs review | Request a review (below) | `review-ready` |
| Low risk | Nothing more: a person can merge without reading the diff | `merge-ready` |
| Low risk, and the project set `Auto-merge: low-risk` | Merge the judged commit and nothing newer (below) | `merged`, or as below |

**Merge.** The host merges at once when the PR is mergeable, or waits for its required checks:

```bash
gh pr merge "$PR" --squash --auto --match-head-commit "$SHA"
gh pr view "$PR" --json state,autoMergeRequest   # MERGED, or auto-merge enabled
```

Merged or enabled: `merged`. Refused because the head moved: the verdict is stale, `needs-human`. Any other refusal: `merge-ready`, with the host's reason.

**Review request.** Ask the person the PR waits on: the assignee, else the author, of a linked Issue, when they have write access (the rubric's Trust command) and did not open the PR. The host's notification is the poke. With no such person, skip the request and say so in the summary.

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<LOGIN>"
```

### Step 5: Label and Report

Every end of this skill comes here, from Steps 1 and 3 too:

1. Label the outcome per [Outcome Label](_shared/status-reporting.md#outcome-label): `STATE` is `merge-ready` or `review-ready`, and empty for `merged` and `needs-human`.
2. Report the state via status-reporting, then summarize.

## Output Format

```text
## Land Summary

**PR:** #<number>: <title>
**Result:** merged | merge-ready | review-ready | needs-human (<reason>)
**Judged:** <short SHA>, low risk | needs review
**Checks:** <hits, or "none">
**Review requested from:** <login> | not requested: <why> | n/a
**Label:** <label> | none | refused: <why>
```

## Related Skills

**Composed by:** `forge-ship --guard` runs this process after guard reaches `review-ready`.
**Before this:** Use `forge-guard` to make the PR green and addressed.

## Example Usage

```
/forge-land
/forge-land 123
/forge-land 123 -- the billing module is new, be strict there
```
