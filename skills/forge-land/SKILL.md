---
name: forge-land
description: "Decide what a green pull request needs from a human: check it is mergeable, green, addressed and exercised, get a fresh-context risk verdict on the head commit, write it into the PR as a ## Risk section, and report merge-ready or review-ready. Merges a low-risk PR only when the project opts in with Auto-merge: low-risk. Use after forge-guard reaches review-ready, on any open PR, or when forge-ship runs with --guard."
disable-model-invocation: true
---

# Land a Pull Request

Decide whether a green PR needs a person, and when it does, tell them where to look.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from the current branch if omitted). Optional: `-- <additional context>`.

The skill is unattended by nature, like `forge-guard`: nothing here asks the user.

## Process

### Step 1: Check the Preconditions

```bash
gh pr view $PR_ARG --json number,author,baseRefName,headRefOid,closingIssuesReferences   # PR, BASE, SHA, linked Issues
ME=$(gh api user --jq .login)
git fetch origin "$BASE" "pull/$PR/head"   # the verdict reads the diff and files at $SHA, whatever is checked out
```

Read the security-sensitive paths and the auto-merge setting per [unattended-config](_shared/unattended-config.md). The PR qualifies only when all of these hold; otherwise report `needs-human` via [status-reporting](_shared/status-reporting.md), naming each one that failed:

- **Mergeable** — `gh pr view "$PR" --json mergeable` is `MERGEABLE` (`UNKNOWN`: ask up to 5 times, 10 seconds apart; still `UNKNOWN` fails)
- **CI green** — apart from checks that fail on the base branch too, sorted as [forge-guard](../forge-guard/SKILL.md) sorts *Pre-existing*. While checks are pending, report `waiting` and block on `gh pr checks "$PR" --watch --interval 30`, capped at 60 minutes. No checks reported 3 minutes after the last push means the repository has no CI, which passes
- **Threads addressed** — the unaddressed-thread query in [forge-address-pr-feedback](../forge-address-pr-feedback/SKILL.md) Step 1 returns nothing, and no unresolved thread ends in our "Needs your decision" reply
- **Exercised** — the body has a `## Exercised` section (see [exercise](_shared/exercise.md))

### Step 2: Judge the Risk (delegate)

Report `reviewing`. Delegate the verdict on `$SHA` to one fresh-context sub-agent: the session that wrote the code is the worst judge of its risk. If the runtime has no sub-agents, judge inline from the rubric alone, without reusing what this session knows about the change.

> Judge whether PR #<PR> at commit `<SHA>` needs a human review before merging. Read the diff with `git diff "origin/<BASE>...<SHA>"`, files at that commit with `git show "<SHA>:<path>"`, and the PR body with `gh pr view <PR> --json body`. Run every check in the rubric below first; any hit means needs-review. When none hits, apply the judgment test. Read the `REVIEW.md` files the rubric names. Return the filled `## Risk` section from the rubric and nothing else.

**Inputs provided to sub-agent:** the task above, [risk-rubric](_shared/risk-rubric.md) (pushed), the security-sensitive paths, the linked Issue numbers, and the PR author.
**Expected output:** The filled `## Risk` section, verdict and SHA first.

### Step 3: Write the Risk Section

The verdict holds only for `$SHA`. If `headRefOid` has moved by now, start over from Step 1 once; moved again, stop with `needs-human`.

Replace an existing `## Risk` section (up to the next `## ` heading) or append one, and pass the body as a file, never inline:

```bash
BODY=$(mktemp)
gh pr view "$PR" --json body --jq .body > "$BODY"   # edit the ## Risk section in this file
gh pr edit "$PR" --body-file "$BODY"
```

### Step 4: Act

- **Low risk** — report `merge-ready`. A person can merge without reading the diff.
- **Low risk, project set `Auto-merge: low-risk`** — merge the judged commit and nothing newer. The host merges at once when the PR is mergeable, or waits for its required checks:

  ```bash
  gh pr merge "$PR" --squash --auto --match-head-commit "$SHA"
  gh pr view "$PR" --json state,autoMergeRequest   # MERGED, or auto-merge enabled
  ```

  Merged or enabled: report `merged`. The host refused because the head moved: the verdict is stale, report `needs-human`. Any other refusal: report `merge-ready` with the host's reason.
- **Needs review** — request a review from the person the PR waits on: the assignee, else the author, of a linked Issue, when they have write access (the rubric's Trust command) and did not open the PR. The host's notification is the poke. With no such person, skip the request and say so in the summary. Report `review-ready`.

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<LOGIN>"
```

Never merge outside the opt-in above, never push, never close the PR. Report the terminal state exactly once, then summarize.

## Output Format

```text
## Land Summary

**PR:** #<number>: <title>
**Result:** merged | merge-ready | review-ready | needs-human (<reason>)
**Judged:** <short SHA>, low risk | needs review
**Checks:** <hits, or "none">
**Review requested from:** <login> | not requested: <why> | n/a
```

## Guidelines

- **The verdict is tied to a commit** — a new push makes it stale; re-run land instead of trusting an old `## Risk`
- **Doubt means review** — a verdict that can't name what the checks would miss is needs-review
- **Merging is the project's choice** — without `Auto-merge: low-risk`, low risk stops at `merge-ready`; no argument or trailing context turns merging on

## Related Skills

**Composed by:** `forge-ship --guard` runs this process after guard reaches `review-ready`.
**Before this:** Use `forge-guard` to make the PR green and addressed.

## Example Usage

```
/forge-land
/forge-land 123
/forge-land 123 -- the billing module is new, be strict there
```
