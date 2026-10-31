# Open Work

How a skill checks work that hasn't landed yet: prerequisites that are still open, and open PRs that already do, or collide with, the same change. `forge-implement` runs it before planning; `forge-batch` runs the open-PR half for a whole scope. One `gh` call each, no polling. On another tracker, check the same facts with its equivalent calls.

## Prerequisites

An Issue's prerequisites are the listing's dependency references (native links and body text: `depends on #N`, `blocked by #N`, or `after #N`; the `deps` filter in *List Issues by Scope* of [issue-operations](issue-operations.md)). Fetch them all in one query, one alias per number:

```bash
gh api graphql -F owner='{owner}' -F repo='{repo}' -f query='query($owner:String!,$repo:String!){repository(owner:$owner,name:$repo){
  n142: issueOrPullRequest(number:142){...s}  n150: issueOrPullRequest(number:150){...s}}}
fragment s on IssueOrPullRequest{... on PullRequest{number state} ... on Issue{number state stateReason closedByPullRequestsReferences(first:10,includeClosedPrs:true){nodes{number state}}}}' \
  --jq '.data.repository[]'
```

A prerequisite is **met** when it is a PR in state `MERGED`, or an Issue closed as `COMPLETED` with no open PR among its closing references (a sub-issue closed by hand counts). Open, closed as not planned or duplicate, or closed while a closing PR is still open is **unmet**. In the [plan folder](plan-folder-spec.md), `status: closed` is met.

## Open PRs

Fetch open PRs once:

```bash
gh pr list --state open --limit 100 --json number,title,headRefName,closingIssuesReferences,files
```

An open PR **is for** Issue N when N is in its `closingIssuesReferences`, or its branch names N after a type (`feat/N-…`, or a prefixed `…/feat-N-…`). Skip a PR on the current branch: that is this run's own.

## Conflict

Two change sets **conflict** when they share a file, or both match the same serialized-resource glob from [unattended-config](unattended-config.md), even when the exact paths differ. For an open PR, its change set is its `files`; for planned work, the files the Plan or touch set names.
