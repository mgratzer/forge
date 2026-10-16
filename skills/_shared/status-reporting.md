# Status Reporting

How skills report progress to whatever started them.

## The Seam

At every stage transition, run the bundled script by its full path under `<skill dir>`: the directory of the SKILL.md you loaded, which runtimes state as the skill's base directory (every skill reaches `_shared/scripts/` through its `_shared` symlink). It calls `FORGE_STATUS_CMD` when the environment sets it, and otherwise prints `[forge] <state>: <detail>`:

```bash
<skill dir>/_shared/scripts/forge-status.sh <state> "<one short line>"
```

Write the path out in full, never through a variable or `"$FORGE_STATUS_CMD"`: runtimes refuse a command whose name is computed at runtime. It always exits 0, so it may lead the command that starts the stage (`…/forge-status.sh waiting "CI"; gh pr checks …`). A script that isn't executable is an install problem for the summary.

## States

| State | Meaning | Terminal |
|-------|---------|----------|
| `implementing` | Coding and testing the change | no |
| `reviewing` | Self-review and quality passes running | no |
| `waiting` | Blocked on an external signal (CI, peer review) | no |
| `addressing` | Reacting to CI failures or review feedback | no |
| `ready-for-local-review` | Work committed on a local branch, nothing pushed | yes |
| `pushed` | PR open (a draft by default) and self-reviewed; no guard ran | yes |
| `review-ready` | CI green, peer review present, all feedback addressed | yes |
| `needs-human` | Stopped short: round limit, repeated failure, or a decision only a human can make | yes |
| `failed` | Could not complete the stage at all (no PR, tooling broken) | yes |

Report a terminal state exactly once, as the last thing before the summary. The summary's **Next:** line names the human's step: `ready-for-local-review` → review the branch, then `/forge-ship --publish`; `pushed` / `review-ready` → review the PR, then `gh pr ready <number>` if it is still a draft; `needs-human` → the items left open; `failed` → the reason.
