---
name: forge-address-pr-feedback
description: Analyze and address unresolved feedback on a GitHub pull request. Use when the user wants to work through the review comments on a PR.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, AskUserQuestion
---

# Address PR Feedback

Systematically address unresolved review feedback on a pull request.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from current branch if omitted). Optional: `-- <additional context>` for prioritization guidance.

**Unattended mode:** `--unattended` never asks; Steps 2–3 say what happens instead.

**Assess mode:** `--assess` runs Steps 1–2 only: it categorizes each item and recommends an action, changing and posting nothing.

**Wait mode:** `--wait` first requests and waits for the peer reviewers per [peer-review-wait](_shared/peer-review-wait.md) with `PR=$PR_NUMBER` from Step 1, then addresses what they left.

## Process

### Step 1: Fetch Unaddressed Feedback

**Use GraphQL:** the REST API does NOT expose `isResolved` on review threads. Threads whose last comment is ours await the reviewer, so they are filtered out. When composed by `forge-guard`, reuse its `$PR` and `$ME`.

```bash
PR_ARG="<PR number or URL, empty for the current branch's PR>"
OWNER=$(gh repo view --json owner --jq .owner.login)
REPO=$(gh repo view --json name --jq .name)
PR_NUMBER=$(gh pr view $PR_ARG --json number --jq .number)
ME=$(gh api user --jq .login)
FEEDBACK=$(mktemp)

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
            nodes { id body author { login __typename } url }
          }
        }
      }
      reviews(last: 50) { nodes { body state submittedAt url author { login __typename } } }
      comments(last: 50) { nodes { body createdAt lastEditedAt url author { login __typename } } }
    }
  }
}' > "$FEEDBACK"
jq ".data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false and .comments.nodes[-1].author.login != \"$ME\")" "$FEEDBACK"
```

**Top-level feedback counts too** when it has findings: review bodies and PR comments by others since our last PR comment, including bot summaries edited since. Skip overviews and repeats of inline threads:

```bash
jq --arg me "$ME" '.data.repository.pullRequest
  | ([.comments.nodes[] | select(.author.login == $me) | .createdAt] | max // "") as $since
  | [(.reviews.nodes[] | select(.author.login != $me and .body != "" and .submittedAt > $since)),
     (.comments.nodes[] | select(.author.login != $me and ((.lastEditedAt // .createdAt) > $since)))]' "$FEEDBACK"
```

**Who wrote it decides how we answer:** an author whose `__typename` is `Bot`, or whose `Peer reviewers` entry carries a `[bot]` suffix, is a bot reviewer; everyone else is a human colleague.

### Step 2: Process Each Item

Read the file and surrounding context, then categorize: **Actionable** (code change needed), **Question** (explain), **Discussion** (assess whether the change improves the code), **Already addressed** (changed, thread still open), **Won't fix** (the current approach is preferred), or **Deferred** (valid but out of scope; becomes a new Issue).

For a **Discussion** the user should decide, ask via AskUserQuestion. **In unattended mode:** decide when the code or project conventions settle it, citing that evidence; otherwise reply "Needs your decision: <option A> vs <option B> (<what each costs>)", leave the thread open, and list it under *needing a human decision*, never resolved or hidden in an Issue.

### Step 3: Address and Reply Individually

Address each item and reply before the next, so every reply can cite its commit.

**Bot reviewers, and everyone in unattended mode:** post the reply. **Human colleagues in attended mode:** commit the change but post and resolve nothing; draft a ready-to-paste reply with the thread URL for the summary, and ask via AskUserQuestion when a claim is unclear. Top-level items get one PR comment answering each in turn (drafted, for a human).

For each thread:

1. **Make the change** (if actionable), run the checks, and commit: `git commit -m "fix: address PR feedback (<brief description>)"`
2. **Reply, and resolve when the outcome is concrete** (Actionable, Already addressed, Deferred); the others stay open so the reviewer sees the reasoning. One mutation does both (drop `resolveReviewThread` to keep it open); pass the reply on stdin, since interpolating it breaks on quotes and newlines:

```bash
gh api graphql -f threadId="<THREAD_ID>" -F body=@- -f query='
mutation($threadId: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: $threadId, body: $body}) {
    comment { id }
  }
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { isResolved }
  }
}' <<'REPLY_EOF'
<response>
REPLY_EOF
```

Reply by category: **Actionable** "Fixed in `<sha>`. <what changed>"; **Question** "<answer with code references>"; **Discussion** "<decision and reasoning>"; **Already addressed** "Addressed in `<sha>`."; **Won't fix** "Keeping current approach because <reason>."; **Deferred** "Created #<num> to track this."

### Step 4: Create Issues for Deferred Items

Create an Issue per Deferred item (see [issue-operations](_shared/issue-operations.md)) with the reviewer's comment, the PR number, and a proposed solution.

### Step 5: Push and Summarize

When this run changed code, run the `(each push)` extra passes first ([quality-passes](_shared/quality-passes.md)), unless forge-guard composed this run: guard runs them itself. Then `git push`.

Report: threads addressed, commits, Deferred items, threads needing a human decision, and under **Replies to post** each drafted reply for a human colleague with its thread URL.

## Guidelines

- **Address, reply, then next:** don't batch
- **Be specific:** reference commits, line numbers, and code
- **Write replies for people:** follow [writing](_shared/writing.md)

## Related Skills

**If the feedback required substantial changes:** Use `forge-reflect` for one more self-review before re-requesting review.
**Composed by:** `forge-guard` runs this process in unattended mode for each feedback round.

## Example Usage

```
/forge-address-pr-feedback 123
/forge-address-pr-feedback 123 -- prioritize security comments
/forge-address-pr-feedback --unattended 123
/forge-address-pr-feedback --assess 123
/forge-address-pr-feedback --wait 123
/forge-address-pr-feedback
```
