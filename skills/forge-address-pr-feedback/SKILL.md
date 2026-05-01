---
name: forge-address-pr-feedback
description: Analyze and address unresolved feedback on a GitHub pull request. Use when the user has received PR review comments and wants to systematically address each piece of feedback, or when the user mentions PR feedback, review comments, or addressing reviewer concerns.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Address PR Feedback

Systematically address unresolved review feedback on a pull request.

## Input

PR number or URL (auto-detects from current branch if omitted). Optional: `-- <additional context>` for prioritization guidance.

## Process

### Step 1: Fetch Unresolved Threads

**Use GraphQL** — the REST API does NOT expose `isResolved` status on review threads.

```bash
gh api graphql -f query='
query {
  repository(owner: "<OWNER>", name: "<REPO>") {
    pullRequest(number: <PR_NUMBER>) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          isOutdated
          path
          line
          id
          comments(first: 10) {
            nodes {
              id
              body
              author { login }
              url
            }
          }
        }
      }
    }
  }
}'
```

Filter for unresolved threads: `select(.isResolved == false)`.

### Step 2: Process Each Thread

For each unresolved thread, read the file and surrounding context, then categorize:
- **Actionable** — code change needed
- **Question** — respond with explanation
- **Discussion** — assess if change improves code
- **Already addressed** — thread not resolved but change was made
- **Won't fix** — current approach is preferred
- **Follow-up** — valid but out of scope — create linked issue

### Step 3: Address and Reply Individually

**Address each thread immediately, then reply before moving to the next.** Do not batch.

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
- **Follow-up**: "Created #<num> to track this."

### Step 4: Create Follow-up Issues

For valid out-of-scope improvements, create an Issue in the project's Issue tracker:

**GitHub:**
```bash
gh issue create \
  --title "<description>" \
  --body "Identified during PR review of #<PR_NUMBER>.

> <reviewer's comment>

Proposed solution: <what should be done>"
```

**Markdown:** create a new issue file per the [plan-folder-spec](../_shared/plan-folder-spec.md) with the PR context in the body, and commit it.

**Other provider:** use the tool declared in AGENTS.md.

### Step 5: Push and Summarize

```bash
git push
```

Report: feedback items addressed, commits created, follow-up issues created, items needing human decision.

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
