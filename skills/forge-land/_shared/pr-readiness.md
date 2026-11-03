# PR Readiness

What each signal that decides whether a PR is ready means and how to read it. `forge-guard` reacts until the signals hold, `forge-land` checks that they hold, and `forge-address-pr-feedback` works through what Open Feedback returns. What to do about a signal stays in the skill. `$PR`, `$BASE`, `$ME` and `$PEER_REVIEWER` come from the skill.

## How to Wait

Each wait is one shell call, never polling from the model. Run it in the background when the runtime can run a command that way and wake the session when it exits (Claude Code: `run_in_background`), and end the turn saying what it waits for; otherwise block on it with the runtime's longest timeout and re-run it when the call times out. Run one at a time, CI first, then the review loop; a push starts them over and a terminal state ends them, so stop one still running. A runtime that watches the PR (Claude Code desktop's Auto-fix) doesn't replace the waits: it reports failures, conflicts and comments but never green, so a clean PR gets no event, and only the CI wait carries the run on to its terminal state.

## Mergeable

Read `gh pr view "$PR" --json mergeable,mergeStateStatus`. `UNKNOWN` means GitHub is still computing: ask up to 5 times, 10 seconds apart.

- **Guard** — `CONFLICTING` or `BEHIND` is not mergeable; still `UNKNOWN` counts as mergeable.
- **Land** — `mergeable` alone decides: it must be `MERGEABLE`, and still `UNKNOWN` fails.

## CI

Wait on the checks, 60 minutes at most in total, re-runs included. "No checks reported" within 3 minutes of a push means the run has not registered yet: run the wait again with `sleep 30;` in front, in the same call. After that, treat the repository as having no CI:

```bash
gh pr checks "$PR" --watch --interval 30 >/dev/null &   # no --fail-fast: Step 4 sorts every failed check, so it needs them all
W=$!; (sleep 3600 >/dev/null 2>&1; echo "CI wait cap reached"; kill "$W") & C=$!   # --watch never gives up on a check stuck in a queue
wait "$W"; kill "$C" 2>/dev/null
```

Sort each failed check:

```bash
gh pr checks "$PR" --json name,bucket,workflow,link --jq '.[] | select(.bucket == "fail")'
BASE_RUN=$(gh run list --branch "$BASE" --workflow "<WORKFLOW>" --status completed --limit 1 --json databaseId --jq '.[0].databaseId // empty')
[ -n "$BASE_RUN" ] && gh run view "$BASE_RUN" --json jobs --jq '.jobs[] | select(.name == "<CHECK>") | .conclusion'   # the same check on the base branch
RUN=<run id from the check's link>
gh run view "$RUN" --json attempt --jq .attempt
gh run view "$RUN" --log-failed | grep -nE 'error|✗|FAIL|Error:' | head -50   # widen only if this is not enough
```

- **Pre-existing** — the same check fails on the base branch's latest completed run with the same errors (compare `gh run view "$BASE_RUN" --log-failed`); an error the base run doesn't show makes it Caused. With no completed base run (a stacked base, a workflow that runs only on pull requests), this can't be shown: sort on the log alone.
- **Flaky** — the log shows infrastructure trouble unrelated to the diff (a timeout, a registry or network error, a lost runner), and the check doesn't fail on base.
- **Caused** — everything else.
- **Not an Actions job** — a failed check with no `workflow` (an external status or app) can't be compared or rerun.

## Review Signal

A review by someone other than `$ME` after the latest push. A review by the peer reviewer whose body opens with its could-not-review message and delivers nothing else (Copilot: "Copilot encountered an error", "Copilot was unable to review" for rate limits, or "Copilot was unable to complete this review", which can sit inside a `> [!NOTE]`) is a **failed review** and counts as none. The same message above an overview (Copilot: the `<!-- ccr-overview` marker) is a **partial review**: the reviewer ran at a lesser tier and its findings are real, so it counts, and since the cause is a plan or policy limit a retry would not lift, it is not retried. Wait in one bounded shell loop; it prints `reviewed`, `failed`, or nothing for reviews since `$SINCE` (empty: the latest push):

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

The signal is satisfied when a post-push review exists, when no peer reviewer is configured (the guard then waits for none), when the run has a substitute review, or when the wait expires but the PR already carries a review by someone other than `$ME` from before the push; a failed review satisfies none of these. A push that only merged the base keeps the signal it had before.

A **substitute review** stands in after the peer reviewer failed: one PR comment from `$ME` starting `Substitute review: <PEER_REVIEWER> failed (<the failed review's reason>)`, which land reads, and ending with the `<!-- forge -->` marker.

## Open Feedback

Feedback is an unresolved review thread, a PR conversation comment, or a review body. **Use GraphQL** — the REST API does NOT expose `isResolved` status on review threads.

A comment is **ours** when `$ME` wrote it and it carries the marker `<!-- forge -->`, which ends everything forge posts as feedback. The login alone can't tell: on a repository where the person shares the agent's `gh` account, `$ME` without the marker is the person. A thread whose last comment is ours is awaiting the reviewer, a conversation comment or review body is answered once a comment of ours links its URL, and a hidden comment or dismissed review is out, so the query filters these out in every mode. Our "Needs your decision" replies stay in its output until the person answers, so that output alone says what is still open.

```bash
# Derive owner/repo from the checkout; PR_ARG is the number or URL from $ARGUMENTS, empty when omitted
PR_ARG=""
OWNER=$(gh repo view --json owner --jq .owner.login)
REPO=$(gh repo view --json name --jq .name)
PR_NUMBER=$(gh pr view $PR_ARG --json number --jq .number)   # empty PR_ARG → PR for the current branch
ME=$(gh api user --jq .login)

gh api graphql -F owner="$OWNER" -F repo="$REPO" -F pr="$PR_NUMBER" -f query='
query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          isOutdated
          path
          line
          id
          comments(last: 20) {
            nodes { id body author { login } url }
          }
        }
      }
      comments(last: 100) {
        nodes { body url isMinimized author { login __typename } }
      }
      reviews(last: 100) {
        nodes { body url state isMinimized author { login __typename } }
      }
    }
  }
}' --jq "def ours: .author.login == \"$ME\" and (.body | test(\"<!-- forge -->\\\\s*$\"));
  def open: (ours | not) or (.body | contains(\"Needs your decision:\"));
  .data.repository.pullRequest
  | [.comments.nodes[] | select(ours) | .body] as \$replies
  | (.reviewThreads.nodes[] | select(.isResolved == false and (.comments.nodes[-1] | open))),
    ((.comments.nodes + .reviews.nodes)[] | .url as \$url
      | select(.body != \"\" and (.isMinimized | not) and .state != \"DISMISSED\" and open and all(\$replies[]; contains(\$url) | not)))"
```

**No ask** — a conversation comment or review body that asks for nothing (a bot's overview or coverage report, a failed review, thanks) needs no reply and doesn't count as unaddressed. The query still returns it, so whoever reads the output sorts it out.
