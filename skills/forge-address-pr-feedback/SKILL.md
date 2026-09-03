---
name: forge-address-pr-feedback
description: Analyze and address unresolved feedback on a GitHub pull request. Use when the user has received PR review comments and wants to systematically address each piece of feedback, or when the user mentions PR feedback, review comments, or addressing reviewer concerns.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, AskUserQuestion
---

# Address PR Feedback

Systematically address unresolved review feedback on a pull request.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from current branch if omitted). Optional: `-- <additional context>` for prioritization guidance.

## Process

### Step 1: Fetch Unresolved Threads

**Use GraphQL** — the REST API does NOT expose `isResolved` status on review threads.

```bash
# Derive owner/repo from the checkout and the PR from the branch (or the number/URL given in $ARGUMENTS)
OWNER=$(gh repo view --json owner --jq .owner.login)
REPO=$(gh repo view --json name --jq .name)
PR_NUMBER=$(gh pr view <PR_NUMBER_OR_URL_IF_GIVEN> --json number --jq .number)

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
          comments(first: 10) {
            nodes { id body author { login } url }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```

### Step 2: Process Each Thread

For each unresolved thread, read the file and surrounding context, then categorize:
- **Actionable** — code change needed
- **Question** — respond with explanation
- **Discussion** — assess if change improves code
- **Already addressed** — thread not resolved but change was made
- **Won't fix** — current approach is preferred
- **Deferred** — valid but out of scope — becomes a Deferred item (new Issue)

For **Discussion** threads where the decision is genuinely the user's to make, ask via AskUserQuestion instead of assuming.

### Step 3: Address and Reply Individually

Address each thread and reply before moving to the next, so every reply can cite the commit that resolved it.

For each thread:

1. **Make the change** (if actionable)
2. **Run lint/format/checks**
3. **Commit**: `git commit -m "fix: address PR feedback — <brief description>"`
4. **Reply to the thread**:

```bash
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "<THREAD_ID>"
    body: "<response>"
  }) {
    comment { id }
  }
}'
```

Reply format by category:
- **Actionable**: "Fixed in `<sha>`. <what changed>"
- **Question**: "<answer with code references>"
- **Discussion**: "<decision and reasoning>"
- **Already addressed**: "Addressed in `<sha>`."
- **Won't fix**: "Keeping current approach because <reason>."
- **Deferred**: "Created #<num> to track this."

### Step 4: Create Issues for Deferred Items

For each Deferred item, create an Issue in the project's Issue tracker (see [issue-operations](../_shared/issue-operations.md)). Include the PR context: reviewer's comment, PR number, and proposed solution.

### Step 5: Push and Summarize

```bash
git push
```

Report: threads addressed, commits created, Deferred items created, items needing human decision.

## Guidelines

- **GraphQL for discovery** — REST API doesn't show resolution status
- **Address, reply, then next** — don't batch
- **Be specific** — reference commits, line numbers, and code
- **Test changes** — run checks before committing

## Related Skills

**If the feedback required substantial changes:** Use `forge-reflect` for one more self-review before re-requesting review.

## Example Usage

```
/forge-address-pr-feedback 123
/forge-address-pr-feedback 123 -- prioritize security comments
/forge-address-pr-feedback
```
