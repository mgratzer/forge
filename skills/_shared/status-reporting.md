# Status Reporting

How skills report progress to whatever started them. One seam, no runtime coupling.

## The Seam

If the environment variable `FORGE_STATUS_CMD` is set, call it at every stage transition; when it is unset, print the same line to the terminal instead:

```bash
# <state> is one word from the table below; <detail> is one short human-readable line
[ -n "${FORGE_STATUS_CMD:-}" ] && "$FORGE_STATUS_CMD" <state> "<detail>" || echo "[forge] <state>: <detail>"
```

Prepend the call to the command that starts the stage (`"$FORGE_STATUS_CMD" waiting "CI"; gh pr checks …`) so a transition never costs its own tool call. A launcher provides the command; skills never do.

## States

| State | Meaning | Terminal |
|-------|---------|----------|
| `implementing` | Coding and testing the change | no |
| `reviewing` | Self-review and quality passes running | no |
| `waiting` | Blocked on an external signal (CI, peer review) | no |
| `addressing` | Reacting to CI failures or review feedback | no |
| `pushed` | PR open and self-reviewed; no guard ran | yes |
| `review-ready` | CI green, peer review present, every thread addressed — the human can look now | yes |
| `needs-human` | Stopped short: round limit, repeated failure, or a decision only a human can make | yes |
| `failed` | Could not complete the stage at all (no PR, tooling broken) | yes |

Report a terminal state exactly once, as the last thing before the final summary.
