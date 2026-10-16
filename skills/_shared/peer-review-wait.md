# Peer Review Wait

How to request the peer reviewers and wait for them without polling from the model. Used by `forge-guard` (Step 3) and `forge-address-pr-feedback` (`--wait`).

## Reviewers

Read `Peer reviewers` from [project-config](project-config.md); `none` satisfies the review signal without waiting. When the setting is absent, look at who reviewed the last few merged PRs, because a bot may review every PR without being declared:

```bash
gh api graphql -F owner='{owner}' -F name='{repo}' -f query='
  query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
    pullRequests(states: MERGED, first: 5, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes { reviews(first: 50) { nodes { author { __typename login } } } } } } }' \
  --jq '[.data.repository.pullRequests.nodes[].reviews.nodes[].author
         | select(.__typename == "Bot") | .login + "[bot]"] | unique | .[]'
```

These **discovered** reviewers (`found on recent PRs` in the summary) are requested and waited for, but never block: a bot that posts only on findings, or an uninstalled app, may never review. When nothing prints, the signal is satisfied.

## Request

Request each reviewer after a push; bot reviewers review once and stay silent unless asked. Spell a bot with its `[bot]` suffix, or the API answers 422. A reviewer the API can't request (an app that reviews every push) is only waited for.

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<REVIEWER>"   # once per reviewer
```

## Wait

Run the bundled script by its full path under `<skill dir>` ([status-reporting](status-reporting.md#the-seam)), in one call with the runtime's longest timeout (in the background when that is under 15 minutes). It polls in the shell, 30 times 30 seconds apart:

```bash
<skill dir>/_shared/scripts/wait-reviews.sh "$PR" <REVIEWER> <REVIEWER>
```

It prints one line per reviewer still missing, then `missing: <n>`. A line ends in `earlier` when that reviewer reviewed only before the latest commit, and in `errored` when a `[bot]` reviewer posted "encountered an error and was unable to review" after it. An error post is never a review.

| Exit | Meaning | Next |
|------|---------|------|
| 0 | every reviewer reviewed after the latest commit | signal satisfied |
| 1 | timed out | an `earlier` reviewer still counts; name the rest as missing. A missing configured reviewer ends at `needs-human`; a discovered one is a summary note |
| 2 | a reviewer errored (the script stops at the first error post) | note the time (`date -u +%Y-%m-%dT%H:%M:%SZ`), re-request each `errored` reviewer once, and wait again for them with `--since <that time>`. A second exit 2 ends at `needs-human`, or a summary note for a discovered reviewer |
