---
name: forge-guard
description: Drive an open pull request to review-ready without a human watching. Run the quality passes, wait for CI and the peer reviewers, address feedback in bounded rounds, and stop at review-ready or needs-human. Never merges or marks the PR ready. Use when the user wants to walk away from a PR and come back only when it is green, or when forge-ship runs with --guard.
disable-model-invocation: true
---

# Guard a Pull Request

Take an open PR from "pushed" to "the human can look now" without asking anything along the way.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from the current branch if omitted). Optional: `-- <additional context>`, e.g. `-- skip the security pass`. `--max-rounds <n>` overrides the project setting.

The skill is unattended by nature: it decides on evidence, replies on threads, and defers to Issues instead of asking.

## Process

### Step 1: Locate the PR and Read the Configuration

```bash
PR_ARG="<PR number or URL, empty for the current branch's PR>"
gh pr view $PR_ARG --json number,headRefName,baseRefName   # PR, BRANCH, BASE
ME=$(gh api user --jq .login)
[ "$(git branch --show-current)" = "$BRANCH" ] || gh pr checkout "$PR"   # every git command below assumes the PR branch
```

Read the Shipping settings per [project-config](_shared/project-config.md): peer reviewers, security-sensitive paths, extra passes, review record, max rounds. Report `reviewing` via [status-reporting](_shared/status-reporting.md).

### Step 2: Run Quality Passes

Skip this step when `forge-ship --guard` composed the guard; ship already ran the passes. Otherwise run the [quality-passes](_shared/quality-passes.md) (simplify always, security when triggered, then the project's extra passes) with unattended triage, write the review record when the project declares one, and push once. An inline pass's closing report is not the end of the run: push what it committed and go on to Step 3 in the same turn.

### Step 3: Wait for Signals

Report `waiting` (the CI command below leads with it). Resolve the reviewer list and request each reviewer first, so their reviews overlap the CI wait, per [peer-review-wait](_shared/peer-review-wait.md).

**CI**: block on the checks in one call with the runtime's longest timeout; re-run when the call times out, and cap the total wait at 60 minutes. Never put a `sleep` in front of it; runtimes refuse that. "No checks reported" within 3 minutes of a push means the run has not registered yet: re-run the same command, spaced by the runtime's wait facility when it has one. After that, treat the repository as having no CI, unless `.github/workflows/` exists and the PR is a draft, which means CI skips drafts: stop with `needs-human`:

```bash
<skill dir>/_shared/scripts/forge-status.sh waiting "CI"; gh pr checks "$PR" --watch --interval 30   # no --fail-fast: Step 4 needs every failed check
```

**Peer review**: after the CI wait, run `_shared/scripts/wait-reviews.sh` per [peer-review-wait](_shared/peer-review-wait.md) and act on its exit code. An error post from a bot is not a review: re-request it once, and a second error is a `needs-human` reason naming the reviewer. Note any reviewer still missing in the summary.

### Step 4: Decide, then React

Check the terminal conditions first, on every round:

- **`review-ready`:** CI green, review signal satisfied, no unaddressed feedback (threads or top-level items, per forge-address-pr-feedback Step 1), nothing needing a human decision
- **`needs-human`:** anything that stops progress: a wait cap expires without its signal (on a draft PR, say so; some repositories skip CI or bot reviews on drafts, and `Pull requests: ready` opts out), the round limit is reached, a check the branch caused fails twice with the same error, a reviewer repeats an answered point, a bot reviewer errored twice, only threads needing a human decision remain, or everything else is ready but CI is red only from failures this branch didn't cause (the reason names each check and why)

When neither applies, react and go back to Step 3. Each reaction is one **round**. When the project declares a review record, a reaction that changes code pushes only after it: commit, review the commits since the latest record, write a new record per [review-record](_shared/review-record.md), then push once.

**CI failed**: report `addressing`, then sort each failed check before touching anything:

```bash
gh pr checks "$PR" --json name,bucket,workflow,link --jq '.[] | select(.bucket == "fail")'
BASE_RUN=$(gh run list --branch "$BASE" --workflow "<WORKFLOW>" --status completed --limit 1 --json databaseId --jq '.[0].databaseId // empty')
[ -n "$BASE_RUN" ] && gh run view "$BASE_RUN" --json jobs --jq '.jobs[] | select(.name == "<CHECK>") | .conclusion'   # the same check on the base branch
RUN=<run id from the check's link>
gh run view "$RUN" --json attempt --jq .attempt
gh run view "$RUN" --log-failed | grep -nE 'error|✗|FAIL|Error:' | head -50   # widen only if this is not enough
```

- **Pre-existing:** the same check fails on the base branch's latest completed run. Leave it; it is not this PR's to fix. With no completed base run (a stacked base, a workflow that runs only on pull requests), this can't be shown, so sort on the log alone.
- **Flaky:** the log shows infrastructure trouble unrelated to the diff (a timeout, a registry or network error, a lost runner), and the check doesn't fail on base. Rerun it with `gh run rerun "$RUN" --failed` only while the run's `attempt` is 1; a later attempt that is still red is left for the human.
- **Caused:** everything else. Fix it, run the quality gates, commit, push (after the record, when one is declared). Only this kind is a round.
- **Not an Actions job:** a failed check with no `workflow` (an external status or app) can't be compared or rerun: read its description and link, fix it only when it points at the diff, otherwise leave it for the human with the reason.

Failures the branch didn't cause never start a round; keep waiting for the review signal and addressing threads.

**Unaddressed feedback**: unresolved threads whose last comment is not `$ME`'s, and top-level items per forge-address-pr-feedback Step 1. Report `addressing` and run the [forge-address-pr-feedback](../forge-address-pr-feedback/SKILL.md) process with `--unattended`, reusing `$PR` and `$ME`, without its own push when a review record is declared, so the guard pushes once after the record; it skips already-answered feedback itself. Items it reports as needing a human decision no longer block the wait, but they turn the outcome into `needs-human`.

An open decision for a human (a policy question, a choice a reviewer left to the team) makes the outcome `needs-human`, never `review-ready`. Issues reviewers report outside this change (pre-existing bugs, adjacent debt) become follow-up Issues per [issue-operations](_shared/issue-operations.md) and are listed in the summary.

Never merge, never force-push, never close the PR, never mark a draft ready. Report the terminal state via status-reporting, then summarize.

## Output Format

```text
## Guard Summary

**PR:** #<number> <title>
**Result:** review-ready | needs-human: <reason>
**Rounds:** <n> of <max>
**Reviewers:** <logins> (configured | found on recent PRs) | none configured or found
**Next:** <the human's next step for the result, per status-reporting>

### Passes
- Simplify: applied <n> findings | covered by <extra pass> | skipped | ran in forge-ship
- Security: applied <n> findings | not triggered | covered by <extra pass> | ran in forge-ship
- Extra: <pass> applied <n> | not available   (one line per declared pass)

### Rounds
1. CI <green | failed → fixed | flaky → rerun green | pre-existing: <check>>, review <present/fell back to earlier review>, threads <n addressed, m deferred>

### Review record
- <sha> covering <range>, written in round <n> | not declared | none needed (no code change)

### Open for the human
- <thread url>: <the decision, with both options>
- Deferred: #<issue> <title>
- No peer review: <why>   (when no reviewer was configured or found, or none reviewed)

### Follow-ups
- #<issue> <title>: <what the reviewer reported outside this change>
```

## Guidelines

- **Evidence over questions:** nothing in this skill asks the user; every judgment call is written into a thread reply or an Issue
- **Bounded everything:** rounds, waits, and polling intervals all have caps; a stuck guard ends in `needs-human`, not in a loop

## Related Skills

**Composed by:** `forge-ship --guard` runs this process after its own review.
**Uses:** `forge-address-pr-feedback --unattended` for each feedback round.

## Example Usage

```
/forge-guard
/forge-guard 123
/forge-guard 123 --max-rounds 2 -- treat performance comments as deferrable
```
