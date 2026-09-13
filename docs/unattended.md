# Unattended Shipping

How a prepared Issue becomes a review-ready PR while you do something else, and how ten of them run at once.

```
forge-batch  →  launcher  →  forge-ship --guard  →  review-ready | needs-human
 (which Issues     (one session       (implement → review → guard)
  in parallel)      per Issue)
```

The skills are portable; only the launcher knows your terminal. Skills report progress through `FORGE_STATUS_CMD` ([status-reporting](../skills/_shared/status-reporting.md)) and read project settings from the `## Unattended Shipping` section of `AGENTS.md` ([unattended-config](../skills/_shared/unattended-config.md)).

The guard's steps are in [forge-guard](../skills/forge-guard/SKILL.md). It stops at `review-ready` and leaves merging to you; its summary lists the threads it left open.

## One Issue or ten

One Issue: `/forge-ship --guard 123` in any session, `claude -w 123 '/forge-ship --guard 123'` for a fresh checkout (needs the [worktree hooks](../contrib/worktree/)), or `contrib/launchers/cmux-claude.sh 123` for a named tab.

Ten: `/forge-batch <scope>` prints Waves. Paste a Wave's launch line into the launcher. Re-run `forge-batch` after a Wave merges, since later Waves shift as code lands.

## Project setup

Add the `## Unattended Shipping` section to `AGENTS.md` (see [unattended-config](../skills/_shared/unattended-config.md)). Provide `scripts/bootstrap-worktree.sh` and `scripts/teardown-worktree.sh` when a fresh checkout needs more than a clone to run the tests. Install the [worktree hooks](../contrib/worktree/) once per user.
