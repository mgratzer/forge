# Status Reporting

How skills report progress to whatever started them.

## The Seam

If the environment variable `FORGE_STATUS_CMD` is set, call it at every stage transition; when it is unset, print the same line to the terminal instead:

```bash
# <state> is one word from the table below; <detail> is one short human-readable line
[ -n "${FORGE_STATUS_CMD:-}" ] && "$FORGE_STATUS_CMD" <state> "<detail>" || echo "[forge] <state>: <detail>"
```

Prepend the guarded line above to the command that starts the stage (`<guarded line for waiting "CI">; gh pr checks …`) so a transition costs no extra tool call. A launcher provides the command; skills never do.

## States

| State | Meaning | Terminal |
|-------|---------|----------|
| `implementing` | Coding and testing the change | no |
| `reviewing` | Self-review and quality passes running | no |
| `waiting` | Blocked on an external signal (CI, peer review) | no |
| `addressing` | Reacting to CI failures or review feedback | no |
| `ready-for-local-review` | Work committed on a local branch, nothing pushed; self-reviewed when forge-ship stopped there | yes |
| `pushed` | PR open (a draft by default) and self-reviewed; no guard ran | yes |
| `review-ready` | CI green, peer review present, every thread addressed. The human can look now | yes |
| `needs-human` | Stopped short: round limit, repeated failure, or a decision only a human can make | yes |
| `failed` | Could not complete the stage at all (no PR, tooling broken) | yes |

Report a terminal state exactly once, as the last thing before the final summary. The summary's **Next:** line names the human's step: `ready-for-local-review` → review the branch, then `/forge-ship --publish`; `pushed` / `review-ready` → review the PR, then `gh pr ready <number>` if it is still a draft; `needs-human` → the items left open for the human; `failed` → the reason.
