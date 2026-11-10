---
name: forge-guard
description: "Drive an open pull request to review-ready without a human watching: run simplification and security passes, wait for CI and the peer reviewer, address feedback in bounded rounds, and stop at review-ready or needs-human. Never merges. Use when the user or an orchestrating agent asks for forge-guard on a PR, or when forge-ship runs with --guard."
---

# Guard a Pull Request

Take an open PR from "pushed" to "the human can look now" without asking anything along the way. The guard never merges, never closes the PR, and never rewrites its history.

## Input

PR number or URL (`$ARGUMENTS`; auto-detects from the current branch if omitted). Optional: `-- <additional context>`, e.g. `-- skip the security pass`. `--max-rounds <n>` overrides the project setting.

Nothing here asks the user: every judgment call is decided on evidence and written into a reply, an Issue, or the summary.

## Process

### Step 1: Locate the PR and Read the Configuration

```bash
gh pr view $PR_ARG --json number,headRefName,baseRefName   # PR, BRANCH, BASE
ME=$(gh api user --jq .login)
[ "$(git branch --show-current)" = "$BRANCH" ] || gh pr checkout "$PR"   # every git command below assumes the PR branch
```

Read the peer reviewer, the security-sensitive paths and the max rounds per [unattended-config](_shared/unattended-config.md). Report `reviewing` via [status-reporting](_shared/status-reporting.md). The signals below come from `pr-state.sh`, called as [pr-readiness](_shared/pr-readiness.md#reading-the-signals) says.

**Every push** in this run: run the project's quality gates, commit, then push. Merge, never rebase, never force-push. The first push of the run makes land's verdict stale: right after it, clear land's [outcome label](_shared/status-reporting.md#outcome-label) with `STATE` empty. A refused removal goes under **Open for the human**.

**A PR land already judged** (its body had a `## Risk` section when this run started): ending in `needs-human` makes the verdict stale too, so clear the label then as well. Once such a run pushes or ends in `needs-human`, also disable any auto-merge land armed (`gh pr merge "$PR" --disable-auto`), and say in the summary that the `## Risk` section no longer holds.

### Step 2: Run Quality Passes

| Pass | Runs when | How |
|------|-----------|-----|
| Simplification | always, except under `forge-ship --guard`, whose review step covered it: report `skipped (forge-ship)` | the runtime's simplification skill (Claude Code: `/simplify`) on the branch diff; otherwise [review-delegation](_shared/review-delegation.md) with the default checklist narrowed to items 3 and 5 of [review-dimensions](_shared/review-dimensions.md) |
| Security | the PR has a `security` label, or `gh pr diff "$PR" --name-only` matches a security-sensitive path | the runtime's security review skill (Claude Code: `/security-review`); otherwise review-delegation with the **Security & Correctness** deep pass |

Triage the findings of both per [Unattended Triage](_shared/review-rubric.md#unattended-triage), then push once for both, so CI and the peer reviewer see one revision.

### Step 3: Wait for Signals

Report `waiting`. Request the peer review first, so it overlaps the CI wait: a bot reviewer reviews a PR once and stays silent afterwards unless asked. Skip the request when nothing was pushed since the last one, when the latest push only merged the base, or when no peer reviewer is configured.

```bash
gh api -X POST "repos/{owner}/{repo}/pulls/$PR/requested_reviewers" -f "reviewers[]=<PEER_REVIEWER>"
```

Then wait per [How to Wait](_shared/pr-readiness.md#how-to-wait) for what is still due: `ci-wait`, unless it already returned `pass`, `fail` or `none` on this head with no rerun since, then `review-wait` while the review signal doesn't hold.

```bash
bash <skill dir>/_shared/scripts/pr-state.sh ci-wait "$PR" --after-push   # --after-push only right after a push
bash <skill dir>/_shared/scripts/pr-state.sh review-wait "$PR" --me "$ME"
```

Each wait's exit, and each event from a runtime that watches the PR, takes you to Step 4. When `review-wait` comes back empty but a review from before the push satisfies the [Review Signal](_shared/pr-readiness.md#review-signal), that review stands: say so in the summary.

### Step 4: Decide, then React

Read the PR afresh: `mergeable`, the latest `ci-wait` result on the head (with `failed-checks` after `fail`), the review signal, and `feedback`. Check the terminal states first, every time:

- **`review-ready`**, when all of these hold:
  - the branch is mergeable: `mergeable` shows neither `CONFLICTING` nor `BEHIND` (still `UNKNOWN` counts as mergeable)
  - `ci-wait` on the current head printed `pass` or `none`, or `fail` with only Pre-existing checks
  - the review signal is satisfied
  - no unaddressed feedback
  - nothing waits on a human decision
- **`needs-human`**, when progress stops: a wait ends at its cap without its signal, `review-wait` printed `failed` (name the reviewer and its message from `reviews`, so the person can re-request the review or decide), the round limit is reached, a check the branch caused fails twice with the same error, a flaky or external check stays red, a conflict can't be resolved, a reviewer repeats a point already answered, or only items waiting on a human decision remain.

Otherwise react to each of the cases below that applies, in this order, then go back to Step 3. With nothing to react to and no wait running, go back to Step 3 for the wait still due. One trip through them is one **round**, however many pushes it makes, and rounds count across turns. A trip that only reruns a flaky check, or has nothing to react to yet (checks still pending, a review still to wait for), is not a round. Report `addressing` with a detail that starts `round <n>/<max>`: this trip's number and the round limit. A trip that isn't a round repeats the last round's number, or `round 0/<max>` before the first.

**Branch not mergeable**: merge the base in.

```bash
git fetch origin "$BASE" && git merge --no-edit "origin/$BASE"
```

Do this for `BEHIND` once per run; after that, a branch that is only behind counts as mergeable, and the summary says so. Resolve a conflict only when both sides' intent is clear from the code and its history; otherwise `git merge --abort` and stop with `needs-human`, naming the files.

**CI failed**: sort each check `failed-checks` lists per [CI](_shared/pr-readiness.md#ci) before touching anything.

| Sort | React |
|------|-------|
| Pre-existing | Leave it, and name it in the summary |
| Flaky | Only while its `attempt` is 1 and nothing else in this trip pushes (a push starts a fresh run anyway): `gh run rerun <run> --failed && gh run watch <run> --exit-status`. Red on a later attempt: leave it for the human |
| Caused | Fix it |
| Not an Actions job | Fix it only when its description and link point at the diff; otherwise leave it for the human, with the reason |

**Unaddressed feedback**: what `feedback` returns apart from No ask items and our standing "Needs your decision" replies (`"decision": true`). Run the [forge-address-pr-feedback](../forge-address-pr-feedback/SKILL.md) process with `--unattended`. What it reports as needing a human decision doesn't hold up the waits, but it makes the outcome `needs-human`.

On a terminal state, report it via status-reporting, then summarize.

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
1. Branch <mergeable | updated from base | conflicts resolved>, CI <green | failed → fixed | flaky → rerun green | pre-existing: <check>>, review <present (<login>) | fell back to earlier review | none configured>, threads <n addressed, m deferred>

### Open for the human
- <thread or comment url>: <the decision, with both options>
- Pre-existing: <check>, fails on <base> too
- Deferred: #<issue> (<title>)
```

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
