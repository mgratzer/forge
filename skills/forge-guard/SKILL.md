---
name: forge-guard
description: Drive an open pull request to review-ready without a human watching, through the quality passes, CI, peer review, and bounded feedback rounds, stopping at review-ready or needs-human. Never merges or marks the PR ready. Use when the user wants to walk away from a PR, or when forge-ship runs with --guard.
disable-model-invocation: true
---

# Guard a Pull Request

Take an open PR from "pushed" to "the human can look now" without asking anything along the way.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from the current branch if omitted). Optional: `-- <additional context>`, e.g. `-- skip the security pass`. `--max-rounds <n>` overrides the project setting. The skill is always unattended.

## Process

### Step 1: Locate the PR and Read the Configuration

```bash
PR_ARG="<PR number or URL, empty for the current branch's PR>"
gh pr view $PR_ARG --json number,headRefName,baseRefName   # PR, BRANCH, BASE
ME=$(gh api user --jq .login)
[ "$(git branch --show-current)" = "$BRANCH" ] || gh pr checkout "$PR"   # every git command below assumes the PR branch
```

Read the Shipping settings per [project-config](_shared/project-config.md). Report `reviewing` via [status-reporting](_shared/status-reporting.md).

### Step 2: Run Quality Passes

Skip this step when `forge-ship --guard` composed the guard. Otherwise run the [quality-passes](_shared/quality-passes.md) with unattended triage and push once, then go on to Step 3 in the same turn.

### Step 3: Wait for Signals

Report `waiting`. Request the peer reviewers first, so their reviews overlap the CI wait, per [peer-review-wait](_shared/peer-review-wait.md).

**CI:** block on the checks in one call with the runtime's longest timeout, re-run on timeout, 60 minutes in total; never behind a `sleep`. "No checks reported" within 3 minutes of a push means the run hasn't registered: re-run, spaced by the runtime's wait facility. After that, there is no CI, unless `.github/workflows/` exists and the PR is a draft: CI skips drafts, so stop with `needs-human`.

```bash
<skill dir>/_shared/scripts/forge-status.sh waiting "CI"; gh pr checks "$PR" --watch --interval 30   # no --fail-fast: Step 4 needs every failed check
```

**Peer review:** after the CI wait, run `<skill dir>/_shared/scripts/wait-reviews.sh` and act on its exit code per [peer-review-wait](_shared/peer-review-wait.md).

### Step 4: Decide, then React

Check the terminal conditions first, on every round:

- **`review-ready`:** CI green, review signal satisfied, no unaddressed feedback (forge-address-pr-feedback Step 1), nothing needing a human decision
- **`needs-human`:** a wait cap expires without its signal (on a draft PR, say so), the round limit is reached, a check the branch caused fails twice with the same error, a reviewer repeats an answered point, only threads needing a human decision remain, or everything else is ready but CI is red only from failures this branch didn't cause (name each check and why)

Otherwise react and go back to Step 3. Each reaction is one **round**: a fix for a caused CI failure, or a feedback pass. One that changes code runs the `(each push)` extra passes ([quality-passes](_shared/quality-passes.md)) before it pushes; for a feedback pass, between its commits and its push.

**CI failed:** report `addressing` and sort each failed check before touching anything:

```bash
gh pr checks "$PR" --json name,bucket,workflow,link --jq '.[] | select(.bucket == "fail")'
BASE_RUN=$(gh run list --branch "$BASE" --workflow "<WORKFLOW>" --status completed --limit 1 --json databaseId --jq '.[0].databaseId // empty')
[ -n "$BASE_RUN" ] && gh run view "$BASE_RUN" --json jobs --jq '.jobs[] | select(.name == "<CHECK>") | .conclusion'   # the same check on the base branch
RUN=<run id from the check's link>
gh run view "$RUN" --json attempt --jq .attempt
gh run view "$RUN" --log-failed | grep -nE 'error|✗|FAIL|Error:' | head -50   # widen only if this is not enough
```

With no completed base run (a stacked base, a pull-request-only workflow), the base comparison below can't be made, so sort on the log alone.

- **Pre-existing:** the same check fails on the base branch's latest completed run; leave it.
- **Flaky:** infrastructure trouble unrelated to the diff (a timeout, a registry or network error, a lost runner), and the check doesn't fail on base. Rerun with `gh run rerun "$RUN" --failed` only while `attempt` is 1.
- **Caused:** everything else. Fix it, run the quality gates, commit, push.
- **Not an Actions job:** a check with no `workflow` can't be compared or rerun. Fix it only when its description and link point at the diff; otherwise leave it for the human.

Failures the branch didn't cause never start a round.

**Unaddressed feedback:** report `addressing` and run the [forge-address-pr-feedback](../forge-address-pr-feedback/SKILL.md) process with `--unattended`, reusing `$PR` and `$ME`. Items it leaves for a human decision no longer block the wait, but they make the outcome `needs-human`.

**Follow-ups** (issues reviewers report outside this change, not already deferred) are filed as Issues per [issue-operations](_shared/issue-operations.md) and listed once.

Never merge, force-push, close the PR, or mark a draft ready. Report the terminal state via status-reporting, then summarize.

## Output Format

```text
## Guard Summary

**PR:** #<number> <title>
**Result:** review-ready | needs-human: <reason>
**Rounds:** <n> of <max>
**Reviewers:** <logins> (configured | found on recent PRs) | none (opted out | none found)
**Next:** <the human's next step for the result, per status-reporting>

### Passes
- simplify <n> applied | covered by <pass>; security <n> applied | not triggered | covered by <pass>; <extra pass> <n> applied | not available   (or: ran in forge-ship)

### Rounds
1. CI <green | failed → fixed | flaky → rerun green | pre-existing: <check>>, review <present | earlier>, threads <n addressed, m deferred>

### Open for the human
- <thread url>: <the decision, with both options>
- Deferred: #<issue> <title>
- No peer review: <why>

### Follow-ups
- #<issue> <title>
```

## Guidelines

- **Evidence over questions:** every judgment call is written into a thread reply or an Issue
- **Bounded everything:** rounds and waits have caps; a stuck guard ends in `needs-human`, not in a loop

## Related Skills

**Composed by:** `forge-ship --guard` runs this process after its own review.
**Uses:** `forge-address-pr-feedback --unattended` for each feedback round.

## Example Usage

```
/forge-guard
/forge-guard 123
/forge-guard 123 --max-rounds 2 -- treat performance comments as deferrable
```
