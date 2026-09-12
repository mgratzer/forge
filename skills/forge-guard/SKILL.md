---
name: forge-guard
description: Drive an open pull request to review-ready without a human watching — run simplification and security passes, wait for CI and the peer reviewer, address feedback in bounded rounds, and stop at review-ready or needs-human. Never merges. Use when the user wants to walk away from a PR and come back only when it is green, or when forge-ship runs with --guard.
disable-model-invocation: true
---

# Guard a Pull Request

Take an open PR from "pushed" to "the human can look now" without asking anything along the way.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from the current branch if omitted). Optional: `-- <additional context>` for focus guidance.

Flags: `--max-rounds <n>` overrides the project setting; `--no-security` and `--no-simplify` skip a pass.

The skill is unattended by nature: it decides on evidence, replies on threads, and defers to Issues instead of asking.

## Process

### Step 1: Locate the PR and Read the Configuration

```bash
PR=$(gh pr view $PR_ARG --json number --jq .number)
BRANCH=$(gh pr view "$PR" --json headRefName --jq .headRefName)
ME=$(gh api user --jq .login)
```

Read the project's `## Unattended Shipping` section per [unattended-config](../_shared/unattended-config.md): peer reviewer, security-sensitive paths, max rounds. Report `reviewing` via [status-reporting](../_shared/status-reporting.md).

### Step 2: Run Quality Passes

**Simplification pass** — if the runtime provides a simplification skill (Claude Code: `/simplify`), invoke it on the branch diff. Otherwise delegate one [forge-reviewer](../_shared/roles/forge-reviewer.md) pass using items 3 and 5 of the default checklist in [review-dimensions](../_shared/review-dimensions.md) and apply its P0–P2 findings.

**Security pass** — run only when the PR carries a `security` label or the changed files match a security-sensitive path:

```bash
git diff --name-only origin/$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)...HEAD
```

If the runtime provides a security review skill (Claude Code: `/security-review`), invoke it. Otherwise delegate one forge-reviewer pass with the **Security & Correctness** deep pass from review-dimensions. Fix P0–P1 findings; defer P2 to Issues per [issue-operations](../_shared/issue-operations.md).

After each pass that changed code: run the project quality gates, commit with a conventional message, push.

### Step 3: Wait for Signals

Report `waiting`. Two signals gate the PR:

**CI** — block until checks finish; a repository with no checks counts as green:

```bash
gh pr checks "$PR" --watch --interval 30 --fail-fast   # exit 0 = green, non-zero = failed or pending
```

Bash calls have a timeout in most runtimes — re-run while the exit code reports pending, and prefer the runtime's own scheduling or wait facility for long waits when it has one. Never poll faster than every 30 seconds.

**Peer review** — a review submitted after the latest push by someone other than `$ME`:

```bash
LAST_PUSH=$(TZ=UTC git log -1 --format=%cd --date=format-local:%Y-%m-%dT%H:%M:%SZ)
gh pr view "$PR" --json reviews \
  --jq "[.reviews[] | select(.submittedAt >= \"$LAST_PUSH\" and .author.login != \"$ME\")] | length"
```

On the first round wait up to 15 minutes for the peer review. On later rounds re-request it once and wait up to 10 minutes — many bot reviewers review a PR only once unless asked again:

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<PEER_REVIEWER>"
```

When no peer reviewer is configured, or the wait expires with the review already present from an earlier round, the review signal is satisfied.

### Step 4: React

**CI failed** — report `addressing`, read the failed logs, fix, run the quality gates, commit, push, and go back to Step 3:

```bash
RUN=$(gh run list --branch "$BRANCH" --status failure --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$RUN" --log-failed
```

**Unaddressed threads** — an unresolved thread whose last comment is not by `$ME`. When any exist, report `addressing` and run the [forge-address-pr-feedback](../forge-address-pr-feedback/SKILL.md) process with `--unattended` on this PR, then go back to Step 3.

Each trip through Step 4 is one **round**.

### Step 5: Decide

Stop at the first terminal state that applies:

- **`review-ready`** — CI green, review signal satisfied, and no unaddressed threads
- **`needs-human`** — the round limit is reached, the same check fails twice with the same error, a reviewer repeats a point already answered, or a thread needs a decision that is genuinely the user's (see the Discussion rule in address-pr-feedback)

Never merge, never force-push, never close the PR. Report the terminal state via status-reporting, then summarize.

## Output Format

```text
## Guard Summary

**PR:** #<number> — <title>
**Result:** review-ready | needs-human — <reason>
**Rounds:** <n> of <max>

### Passes
- Simplify: applied <n> findings | skipped
- Security: applied <n> findings | not triggered | skipped

### Rounds
1. CI <green/failed → fixed>, review <present/timed out>, threads <n addressed, m deferred>

### Open for the human
- <thread url> — <why it needs a decision>
- Deferred: #<issue> — <title>
```

## Guidelines

- **Evidence over questions** — nothing in this skill asks the user; every judgment call is written into a thread reply or an Issue
- **Bounded everything** — rounds, waits, and polling intervals all have limits; a stuck guard ends in `needs-human`, not in a loop
- **Merging is the human's call** — `review-ready` is the last state, on purpose

## Related Skills

**Composed by:** `forge-ship --guard` runs this process after its own review.
**Uses:** `forge-address-pr-feedback --unattended` for each feedback round.

## Example Usage

```
/forge-guard
/forge-guard 123
/forge-guard 123 --max-rounds 2 -- treat performance comments as deferrable
```
