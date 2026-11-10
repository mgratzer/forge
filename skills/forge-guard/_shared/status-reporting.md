# Status Reporting

How skills report progress to whatever started them.

## The Seam

If the environment variable `FORGE_STATUS_CMD` is set, call it at every stage transition; when it is unset, print the same line to the terminal instead:

```bash
# <state> is one word from the table below; <detail> is one short human-readable line
[ -n "${FORGE_STATUS_CMD:-}" ] && "$FORGE_STATUS_CMD" <state> "<detail>" || echo "[forge] <state>: <detail>"
```

Prepend the call to the command that starts the stage (`"$FORGE_STATUS_CMD" waiting "CI"; bash …/pr-state.sh ci-wait …`) so a transition costs no extra tool call. A launcher provides the command; skills never do.

## States

| State | Meaning | Terminal |
|-------|---------|----------|
| `implementing` | Coding and testing the change | no |
| `reviewing` | Self-review and quality passes running | no |
| `waiting` | Blocked on an external signal (CI, peer review) | no |
| `addressing` | Reacting to CI failures or review feedback | no |
| `pushed` | PR open and self-reviewed; no guard ran | yes |
| `review-ready` | The human can look now: forge-guard's review-ready conditions hold. From `forge-land`, also a needs-review verdict, and the PR's `## Risk` section says where to look | yes |
| `merge-ready` | From `forge-land`: its preconditions hold and the verdict on the head commit is low risk. A person can merge without reading the diff | yes |
| `merged` | From `forge-land` with `Auto-merge: low-risk`: what `merge-ready` says, and the host merged the judged commit or will once its required checks pass | yes |
| `needs-human` | Stopped short: round limit, repeated failure, or a decision only a human can make | yes |
| `failed` | Could not complete the stage at all (no PR, tooling broken) | yes |

Report each terminal state exactly once, as the last thing before its summary. The run ends there. An event that wakes the session later (a runtime that watches the PR, a stopped wait exiting) changes nothing: no label, no `## Risk` edit, no status report, no push. Say in one line what arrived and, when it is about the PR's current head and is something to act on (a CI failure, a conflict, new feedback), that `/forge-guard` (or `/forge-ship --guard` for the same Issue, whichever fits) needs to run again.

## Outcome Label

The summary and the status line end with the session, and a person gets no notification about their own account's activity, so `forge-land` leaves `merge-ready` and `review-ready` on the PR as a `forge:<state>` label. Forge never adds labels to a repository: a project opts in by creating both once. The label stands for land's verdict on the current head: land sets or clears it on every end, and forge-guard clears it when it makes that verdict stale. `STATE` is the state to label, or empty to only remove:

```bash
gh pr view "$PR" --json labels --jq ".labels[].name | select(startswith(\"forge:\") and . != \"forge:$STATE\")" |
  while read -r OLD; do gh pr edit "$PR" --remove-label "$OLD"; done
[ -z "$STATE" ] || gh pr edit "$PR" --add-label "forge:$STATE"
```

`not found` from `--add-label` means the project didn't opt in: report `none`. Any other refused label call doesn't change the state: name it in the summary.
