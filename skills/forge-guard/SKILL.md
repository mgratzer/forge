---
name: forge-guard
description: "Drive an open pull request to review-ready without a human watching: run simplification and security passes, wait for CI and the peer reviewer, address feedback in bounded rounds, and stop at review-ready or needs-human. Never merges. Use when the user or an orchestrating agent asks for forge-guard on a PR, or when forge-ship runs with --guard."
---

# Guard a Pull Request

Take an open PR from "pushed" to "the human can look now" without asking anything along the way.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from the current branch if omitted). Optional: `-- <additional context>`, e.g. `-- skip the security pass`. `--max-rounds <n>` overrides the project setting.

The skill is unattended by nature: it decides on evidence, replies to feedback, and defers to Issues instead of asking.

## Process

### Step 1: Locate the PR and Read the Configuration

```bash
gh pr view $PR_ARG --json number,headRefName,baseRefName   # PR, BRANCH, BASE
ME=$(gh api user --jq .login)
[ "$(git branch --show-current)" = "$BRANCH" ] || gh pr checkout "$PR"   # every git command below assumes the PR branch
```

Read the project's `## Unattended Shipping` section per [unattended-config](_shared/unattended-config.md): peer reviewer, security-sensitive paths, max rounds. Report `reviewing` via [status-reporting](_shared/status-reporting.md).

A push makes land's verdict stale: right after this run's first push, in whichever step, remove land's label once, per [status-reporting](_shared/status-reporting.md#outcome-label) with `STATE` empty. A refused removal goes under **Open for the human**.

### Step 2: Run Quality Passes

**Simplification pass** — if the runtime provides a simplification skill (Claude Code: `/simplify`), invoke it on the branch diff. Otherwise follow [review-delegation](_shared/review-delegation.md) with the default checklist narrowed to items 3 and 5 of [review-dimensions](_shared/review-dimensions.md). Skip it under `forge-ship --guard`, whose Step 2 already covered it, and report `skipped (forge-ship)`.

**Security pass** — run when the PR carries a `security` label or `gh pr diff "$PR" --name-only` matches a security-sensitive path. If the runtime provides a security review skill (Claude Code: `/security-review`), invoke it; otherwise follow review-delegation with the **Security & Correctness** deep pass.

Triage findings from both passes with `forge-ship`'s unattended rule, then run the project quality gates once, commit, and push — one push, so CI and the peer reviewer see one revision.

### Step 3: Wait for Signals

Report `waiting`. Request the peer review first so it overlaps the CI wait — bot reviewers review a PR once and stay silent afterwards unless asked, and Step 2 just pushed past their first look. Skip the request when nothing was pushed since the last one, when the latest push only merged the base, when no peer reviewer is configured, or once the run has a substitute review:

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<PEER_REVIEWER>"
```

**How to wait** — each wait below is one shell call, never polling from the model. Run it in the background when the runtime can run a command that way and wake the session when it exits (Claude Code: `run_in_background`), and end the turn saying what it waits for; otherwise block on it with the runtime's longest timeout and re-run it when the call times out. Run one at a time, CI first, then the peer-review loop; a push starts them over and a terminal state ends them, so stop one still running. A wait exiting, or an event from a runtime that watches the PR (Claude Code desktop's Auto-fix), sends you to Step 4, which reads the PR afresh; with nothing to react to and a wait still running, end the turn again. Such a runtime doesn't replace the waits: it reports failures, conflicts and comments but never green, so a clean PR gets no event, and only the CI wait carries the run on to its terminal state.

**CI** — wait on the checks, 60 minutes at most in total, re-runs included. "No checks reported" within 3 minutes of a push means the run has not registered yet: run the wait again with `sleep 30;` in front, in the same call. After that, treat the repository as having no CI:

```bash
gh pr checks "$PR" --watch --interval 30 >/dev/null &   # no --fail-fast: Step 4 sorts every failed check, so it needs them all
W=$!; (sleep 3600 >/dev/null 2>&1; echo "CI wait cap reached"; kill "$W") & C=$!   # --watch never gives up on a check stuck in a queue
wait "$W"; kill "$C" 2>/dev/null
```

**Peer review** — a review by someone other than `$ME` after the latest push. A review by the peer reviewer whose body opens with its could-not-review message and delivers nothing else (Copilot: "Copilot encountered an error", "Copilot was unable to review" for rate limits, or "Copilot was unable to complete this review", which can sit inside a `> [!NOTE]`) is a **failed review** and counts as none. The same message above an overview (Copilot: the `<!-- ccr-overview` marker) is a **partial review**: the reviewer ran at a lesser tier and its findings are real, so it counts, and since the cause is a plan or policy limit a retry would not lift, it is not retried. Wait in one bounded shell loop; it prints `reviewed`, `failed`, or nothing for reviews since `$SINCE` (empty: the latest push):

```bash
PEER=${PEER_REVIEWER%"[bot]"}   # gh pr view names bots without the suffix
for _ in $(seq 1 30); do   # 15 minutes
  r=$(gh pr view "$PR" --json commits,reviews --jq "(if \"$SINCE\" == \"\" then .commits[-1].committedDate else \"$SINCE\" end) as \$since
        | [.reviews[] | select(.submittedAt >= \$since and .author.login != \"$ME\")
           | if .author.login == \"$PEER\" and ((.body // \"\") | test(\"^(>[^\n]*\n> )?Copilot (encountered an error|was unable to (review|complete this review))\") and (test(\"ccr-overview\") | not))
             then \"failed\" else \"reviewed\" end]
        | if any(. == \"reviewed\") then \"reviewed\" elif length > 0 then \"failed\" else \"\" end")
  [ -n "$r" ] && break
  sleep 30
done
echo "$r"
```

The review signal is satisfied when a post-push review exists, when no peer reviewer is configured (the guard then waits for none), when the run has a substitute review, or when the wait expires but the PR already carries a review by someone other than `$ME` from before the push; a failed review satisfies none of these. A push that only merged the base keeps the signal it had before. Note the fallback, or a partial review, in the summary.

**Failed review** — the loop printed `failed`. Back off 5 minutes in the loop's 30-second steps (`for _ in $(seq 1 10); do sleep 30; done`: rate limits outlast a quick retry), set `SINCE=$(date -u +%FT%TZ)`, request the peer reviewer once more, and run the loop again with that `$SINCE`, so the first failure no longer counts. Failed again or silent: run [review-delegation](_shared/review-delegation.md)'s default pass on the branch diff as the **substitute review**, and post its findings as one PR comment starting `Substitute review: <PEER_REVIEWER> failed (<the failed review's reason>)`, which land reads, and ending with the `<!-- forge -->` marker (see forge-address-pr-feedback Step 1). Step 4 handles its findings as it handles unaddressed feedback, and the substitute satisfies the signal for the rest of the run.

### Step 4: Decide, then React

Check the terminal conditions first, on every round:

- **`review-ready`** — branch mergeable, no check pending on the head (none registered yet within 3 minutes of a push counts as pending), CI green apart from pre-existing failures, review signal satisfied, no unaddressed feedback or substitute review findings, nothing needing a human decision
- **`needs-human`** — anything that stops progress: a wait cap expires without its signal, the round limit is reached, a check the branch caused fails twice with the same error, a flaky or external check stays red, a conflict can't be resolved, a reviewer repeats an answered point, or only items needing a human decision remain

When neither applies, react in this order (mergeability, CI, feedback) and go back to Step 3. One trip is one **round**, however many pushes it makes, and rounds count across turns; a trip that only reruns a flaky check or finds checks still pending is not. Start each `addressing` detail with `round <n>/<max>`: this trip's number and the round limit.

**Branch not mergeable** — `gh pr view "$PR" --json mergeable,mergeStateStatus` reports `CONFLICTING` or `BEHIND` (`UNKNOWN` means GitHub is still computing: ask up to 5 times, 10 seconds apart, then treat it as mergeable). React to `BEHIND` once per run; after that, a branch that is only behind counts as mergeable and the summary says so. Report `addressing`, merge the base in, run the quality gates, commit, push:

```bash
git fetch origin "$BASE" && git merge --no-edit "origin/$BASE"   # merge, never rebase: the guard never force-pushes
```

Resolve a conflict only when both sides' intent is clear from the code and its history; otherwise `git merge --abort` and stop with `needs-human`, naming the files.

**CI failed** — report `addressing`, then sort each failed check before touching anything:

```bash
gh pr checks "$PR" --json name,bucket,workflow,link --jq '.[] | select(.bucket == "fail")'
BASE_RUN=$(gh run list --branch "$BASE" --workflow "<WORKFLOW>" --status completed --limit 1 --json databaseId --jq '.[0].databaseId // empty')
[ -n "$BASE_RUN" ] && gh run view "$BASE_RUN" --json jobs --jq '.jobs[] | select(.name == "<CHECK>") | .conclusion'   # the same check on the base branch
RUN=<run id from the check's link>
gh run view "$RUN" --json attempt --jq .attempt
gh run view "$RUN" --log-failed | grep -nE 'error|✗|FAIL|Error:' | head -50   # widen only if this is not enough
```

- **Pre-existing** — the same check fails on the base branch's latest completed run with the same errors (compare `gh run view "$BASE_RUN" --log-failed`); an error the base run doesn't show makes it Caused. Leave it and name it in the summary. With no completed base run (a stacked base, a workflow that runs only on pull requests), this can't be shown: sort on the log alone.
- **Flaky** — the log shows infrastructure trouble unrelated to the diff (a timeout, a registry or network error, a lost runner), and the check doesn't fail on base. Rerun it with `gh run rerun "$RUN" --failed && gh run watch "$RUN" --exit-status` only while the run's `attempt` is 1 and nothing else in this trip pushes (a push starts a fresh run anyway); still red on a later attempt, leave it for the human.
- **Caused** — everything else: fix it, run the quality gates, commit, push.
- **Not an Actions job** — a failed check with no `workflow` (an external status or app) can't be compared or rerun: fix it only when its description and link point at the diff, otherwise leave it for the human with the reason.

**Unaddressed feedback** — what [forge-address-pr-feedback](../forge-address-pr-feedback/SKILL.md) Step 1 returns, apart from its No ask items and our standing "Needs your decision" replies — report `addressing` and run that process with `--unattended`, reusing `$PR` and `$ME`. Items it reports as needing a human decision no longer block the wait, but they turn the outcome into `needs-human`. Substitute review findings have no threads: triage them with `forge-ship`'s unattended rule, run the quality gates, commit, and push.

Never merge, never force-push, never close the PR. Report the terminal state via status-reporting, then summarize.

### Step 5: After a Terminal State

A runtime that watches the PR keeps sending events after the run's terminal state, whether this skill or `forge-land` reported it. Check each one against the PR's current head:

- **No-op** — the PR is merged or closed, the event is about an older head, it is only about a comment or review that forge-address-pr-feedback Step 1 doesn't return or sorts as No ask (a failed review, a bot's report), or the wake is a stopped wait exiting. Say so in one line and change nothing: no label, no `## Risk`, no new report.
- **Re-enter** — anything else on the current head (a CI failure, a conflict, unaddressed feedback) goes to Step 4 with the rounds so far. The re-entry's first push removes land's label again (Step 1). Under `forge-ship --guard`, or when `forge-land` reported the last terminal state, reaching `review-ready` continues with its process, since a push makes its verdict stale. Ending in `needs-human`, pushed or not, removes land's label too, disables any auto-merge land armed (`gh pr merge "$PR" --disable-auto`), and says the `## Risk` no longer holds. Report only the new terminal state, once, and summarize again.

## Output Format

```text
## Guard Summary

**PR:** #<number>: <title>
**Result:** review-ready | needs-human (<reason>)
**Rounds:** <n> of <max>

### Passes
- Simplify: applied <n> findings | skipped | skipped (forge-ship)
- Security: applied <n> findings | not triggered | skipped

### Rounds
1. Branch <mergeable | updated from base | conflicts resolved>, CI <green | failed → fixed | flaky → rerun green | pre-existing: <check>>, review <present (<login>) | partial (<login>: <the message>) | fell back to earlier review | substituted (<PEER_REVIEWER> failed: <reason>) | none configured>, threads <n addressed, m deferred>

### Open for the human
- <thread or comment url>: <the decision, with both options>
- Pre-existing: <check>, fails on <base> too
- Deferred: #<issue> (<title>)
```

## Guidelines

- **Evidence over questions** — nothing in this skill asks the user; every judgment call is written into a reply or an Issue
- **Bounded everything** — rounds, waits, and polling intervals all have caps; a stuck guard ends in `needs-human`, not in a loop

## Related Skills

**Composed by:** `forge-ship --guard` runs this process after its own review.
**Uses:** `forge-address-pr-feedback --unattended` for each feedback round.
**After review-ready:** Use `forge-land` to judge the PR's risk and write it into the PR.

## Example Usage

```
/forge-guard
/forge-guard 123
/forge-guard 123 --max-rounds 2 -- treat performance comments as deferrable
```
