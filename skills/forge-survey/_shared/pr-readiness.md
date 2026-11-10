# PR Readiness

What each signal that decides whether a PR is ready means. `forge-guard` reacts until the signals hold, `forge-land` checks that they hold, and `forge-address-pr-feedback` works through what Open Feedback returns. What to do about a signal stays in the skill. `$PR`, `$ME` and `$PEER_REVIEWER` come from the skill.

## Reading the Signals

[`scripts/pr-state.sh`](scripts/pr-state.sh) reads each signal below with one subcommand. Its `_shared/` is the one beside the running skill's `SKILL.md`, but the shell runs in the project, so call it by absolute path, and through `bash`, since an install can drop the executable bit:

```bash
bash <skill dir>/_shared/scripts/pr-state.sh <subcommand> "$PR" --me "$ME"
```

Exit status 2 means `gh` failed, with its message on stderr: the tooling is broken, not the PR. The script's header lists every output field.

## How to Wait

`ci-wait` and `review-wait` are the waits: one shell call each, never polling from the model. Run a wait in the background when the runtime can run a command that way and wake the session when it exits (Claude Code: `run_in_background`), and end the turn saying what it waits for. Otherwise block on it with the runtime's longest timeout, and re-run a call that timed out with the `--until` it printed on stderr, so its cap counts in total.

Run one at a time, CI first, then the review. A push starts them over, and a terminal state ends them: stop one still running. Woken with nothing to react to while a wait still runs, end the turn again.

A runtime may also watch the PR and wake the session with events, such as a CI failure, a conflict or a comment. An event doesn't replace a wait: a watcher need not report green, so a clean PR can get no event, and only the CI wait carries it on to its terminal state. On Claude Code, also read [runtimes/claude-code](runtimes/claude-code.md).

## Mergeable

`mergeable` prints `<mergeable> <mergeStateStatus>`, such as `MERGEABLE BEHIND` or `CONFLICTING DIRTY`. A first word still `UNKNOWN` means GitHub didn't finish computing within the script's retries; each skill says how it counts that.

## CI

`ci-wait` returns once no check is pending and prints one word:

| Output | Means |
|--------|-------|
| `pass` | every check passed |
| `fail` | a check failed: sort each one `failed-checks` lists |
| `pending` | the 60-minute cap, re-runs included, came first |
| `none` | no check registered within 3 minutes of the push: the repository has no CI |

`failed-checks` prints one JSON object per failed check, with its Actions `run` and `attempt`, and `base`: the same check's conclusion on the base branch's latest completed run of its workflow (`base_run`). Read a log with `gh run view <run> --log-failed | grep -nE 'error|✗|FAIL|Error:' | head -50`, widening only if this is not enough, and the base run's the same way. Then sort:

- **Pre-existing**: `base` is a failure with the same errors in the base run's log; an error the base run doesn't show makes it Caused. With `base_run` null (a stacked base, a workflow that runs only on pull requests), this can't be shown: sort on the log alone.
- **Flaky**: the log shows infrastructure trouble unrelated to the diff (a timeout, a registry or network error, a lost runner), and the check doesn't fail on base.
- **Caused**: everything else.
- **Not an Actions job**: a failed check with an empty `workflow` (an external status or app) can't be compared or rerun.

## Review Signal

A review by someone other than `$ME` after the latest push. A review that delivers nothing but the reviewer's could-not-review message (an error, a rate limit) is a **failed review** and counts as none. The same message above real findings counts as a review. The script knows these messages for the reviewers in its `REVIEWERS` table; any other review counts.

`review-wait` waits up to 15 minutes for reviews since `--since` (left out: the head commit's time, standing for the latest push) and prints `reviewed`, `failed` (only failed ones came), or nothing. `reviews` lists every review by someone other than `$ME`, oldest first, each with its `kind` and, when `failed`, its `message`.

The signal is satisfied when:

- a post-push review came (`reviewed`)
- no peer reviewer is configured, so there is none to wait for
- the wait came back empty, but `reviews` lists one from before the push that is not `failed`

A failed review satisfies none of these. A push that only merged the base keeps the signal it had before.

## Open Feedback

Feedback is an unresolved review thread, a PR conversation comment, or a review body. `feedback` prints each open item as one JSON object (`kind` is `thread`, `comment` or `review`).

A comment is **ours** when `$ME` wrote it and it carries the marker `<!-- forge -->`, which ends everything forge posts as feedback. The login alone can't tell: on a repository where the person shares the agent's `gh` account, `$ME` without the marker is the person. `feedback` leaves out what waits on the reviewer or is answered (a thread whose last comment is ours, a conversation comment or review body that a comment of ours links by URL) and hidden or dismissed items. Our "Needs your decision" replies stay in, marked `"decision": true`, until the person answers, so the output alone says what is still open.

**No ask**: a conversation comment or review body that asks for nothing (a bot's overview or coverage report, a failed review, thanks) needs no reply and doesn't count as unaddressed. `feedback` still returns it, so whoever reads the output sorts it out.
