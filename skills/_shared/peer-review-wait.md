# Peer Review Wait

How to request the configured peer reviewers and wait for them without polling from the model. Used by `forge-guard` (Step 3) and `forge-address-pr-feedback` (`--wait`).

## Request

Read `Peer reviewers` from [project-config](project-config.md), spelled as the review-request API wants them (bots carry a `[bot]` suffix). Request each one after a push, because bot reviewers review once and stay silent unless asked:

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<REVIEWER>"   # once per reviewer
```

A reviewer the API can't request (an app that reviews on every push) is only waited for.

## Wait

Wait in one bounded shell loop until every listed reviewer has reviewed after the latest push. Put the list in the filter as a literal; review authors appear without the `[bot]` suffix:

```bash
for _ in $(seq 1 30); do   # 15 minutes
  missing=$(gh pr view "$PR" --json commits,reviews --jq '
    .commits[-1].committedDate as $push
    | [.reviews[] | select(.submittedAt >= $push) | .author.login] as $done
    | ["<REVIEWER>", "<REVIEWER>"] | map(sub("\\[bot\\]$"; "")) | map(select(. as $r | $done | index($r) | not)) | length')
  [ "$missing" -eq 0 ] && break
  sleep 30
done
```

The signal is satisfied when every listed reviewer reviewed after the push, or when none is configured. When the wait expires, it still counts for each reviewer who reviewed before the push; name everyone still missing in the summary.
