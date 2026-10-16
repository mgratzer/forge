# Status Reporting

How skills report progress to whatever started them.

## The Seam

At every stage transition, run the bundled script by its full path inside the skill's directory. It calls `FORGE_STATUS_CMD` when the environment sets it, and otherwise prints `[forge] <state>: <detail>`:

```bash
# <state> is one word from the table below; <detail> is one short human-readable line
<skill dir>/_shared/scripts/forge-status.sh <state> "<detail>"
```

Write the path out in full; never call `"$FORGE_STATUS_CMD"` or the script through a variable, because runtimes refuse a command whose name is computed at runtime. It may lead the command that starts the stage (`<skill dir>/_shared/scripts/forge-status.sh waiting "CI"; gh pr checks …`), so a transition costs no extra tool call, and it always exits 0. If the install lost the executable bit, run it with `bash <path>`. A launcher provides `FORGE_STATUS_CMD`; skills never do.

## States

| State | Meaning | Terminal |
|-------|---------|----------|
| `implementing` | Coding and testing the change | no |
| `reviewing` | Self-review and quality passes running | no |
| `waiting` | Blocked on an external signal (CI, peer review) | no |
| `addressing` | Reacting to CI failures or review feedback | no |
| `ready-for-local-review` | Work committed on a local branch, nothing pushed; self-reviewed when forge-ship stopped there | yes |
| `pushed` | PR open (a draft by default) and self-reviewed; no guard ran | yes |
| `review-ready` | CI green, peer review present, all feedback addressed. The human can look now | yes |
| `needs-human` | Stopped short: round limit, repeated failure, or a decision only a human can make | yes |
| `failed` | Could not complete the stage at all (no PR, tooling broken) | yes |

Report a terminal state exactly once, as the last thing before the final summary. The summary's **Next:** line names the human's step: `ready-for-local-review` → review the branch, then `/forge-ship --publish`; `pushed` / `review-ready` → review the PR, then `gh pr ready <number>` if it is still a draft; `needs-human` → the items left open for the human; `failed` → the reason.
