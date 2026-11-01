# Status Reporting

How skills report progress to whatever started them.

## The Seam

If the environment variable `FORGE_STATUS_CMD` is set, call it at every stage transition; when it is unset, print the same line to the terminal instead:

```bash
# <state> is one word from the table below; <detail> is one short human-readable line
[ -n "${FORGE_STATUS_CMD:-}" ] && "$FORGE_STATUS_CMD" <state> "<detail>" || echo "[forge] <state>: <detail>"
```

Prepend the call to the command that starts the stage (`"$FORGE_STATUS_CMD" waiting "CI"; gh pr checks …`) so a transition costs no extra tool call. A launcher provides the command; skills never do.

## States

| State | Meaning | Terminal |
|-------|---------|----------|
| `implementing` | Coding and testing the change | no |
| `reviewing` | Self-review and quality passes running | no |
| `waiting` | Blocked on an external signal (CI, peer review) | no |
| `addressing` | Reacting to CI failures or review feedback | no |
| `pushed` | PR open and self-reviewed; no guard ran | yes |
| `review-ready` | Branch mergeable, CI green apart from failures the base shares, peer review present (or substituted, or none configured), every thread addressed. The human can look now; after `forge-land`, the PR's `## Risk` section says where and the PR carries the `forge:review-ready` label | yes |
| `merge-ready` | From `forge-land`: branch mergeable, CI green apart from failures the base shares, every thread addressed, the change exercised, and a low-risk verdict on the head commit. A person can merge without reading the diff; the PR carries the `forge:merge-ready` label | yes |
| `merged` | From `forge-land` with `Auto-merge: low-risk`: everything `merge-ready` says, and the host merged the judged commit or will merge it once its required checks pass | yes |
| `needs-human` | Stopped short: round limit, repeated failure, or a decision only a human can make | yes |
| `failed` | Could not complete the stage at all (no PR, tooling broken) | yes |

Report a terminal state exactly once, as the last thing before the final summary.
