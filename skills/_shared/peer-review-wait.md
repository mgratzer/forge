# Peer Review Wait

How to request the peer reviewers and wait for them without polling from the model. Used by `forge-guard` (Step 3) and `forge-address-pr-feedback` (`--wait`).

## Reviewers

Read `Peer reviewers` from [project-config](project-config.md). `Peer reviewers: none` opts out: the review signal is satisfied without waiting. When the setting is absent, look at who reviewed the last few merged PRs, because a bot may review every PR without being declared:

```bash
gh api graphql -F owner='{owner}' -F name='{repo}' -f query='
  query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
    pullRequests(states: MERGED, first: 5, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes { reviews(first: 50) { nodes { author { __typename login } } } } } } }' \
  --jq '[.data.repository.pullRequests.nodes[].reviews.nodes[].author
         | select(.__typename == "Bot") | .login + "[bot]"] | unique | .[]'
```

The bots it prints are this run's **discovered** reviewers; name them in the summary (`reviewers: found on recent PRs`). They are requested and waited for like configured ones, but they never block: a bot that posts only when it has findings, or an app no longer installed, may never review. When it prints nothing, the signal is satisfied without waiting.

## Request

Request each reviewer after a push, because bot reviewers review once and stay silent unless asked. Spell a bot with its `[bot]` suffix; the API answers 422 without it:

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<REVIEWER>"   # once per reviewer
```

A reviewer the API can't request (an app that reviews on every push) is only waited for.

## Wait

Run the bundled script by its full path under `<skill dir>` (see [status-reporting](status-reporting.md#the-seam)), in one call with the runtime's longest timeout (in the background when that is shorter than 15 minutes). It polls in the shell (30 times, 30 seconds apart), so nothing re-enters the context while it waits:

```bash
<skill dir>/_shared/scripts/wait-reviews.sh "$PR" <REVIEWER> <REVIEWER>
```

It prints one line per reviewer still missing, then `missing: <n>`. A missing line ends in `earlier` when that reviewer reviewed only before the latest commit, and in `errored` when a `[bot]` reviewer posted "encountered an error and was unable to review" after it. An error post never counts as a review.

| Exit | Meaning | Next |
|------|---------|------|
| 0 | every reviewer reviewed after the latest commit | signal satisfied |
| 1 | timed out | an `earlier` reviewer still counts; name everyone else as missing in the summary. A configured reviewer still missing ends the signal at `needs-human`; a discovered one is only a summary note |
| 2 | a reviewer errored; the script stops at the first error post | note the time (`date -u +%Y-%m-%dT%H:%M:%SZ`), re-request each `errored` reviewer once, and run the wait again for the reviewers it listed with `--since <that time>`, so the old error post no longer counts. A second exit 2 ends the signal at `needs-human` naming the reviewer, or a summary note for a discovered one |
