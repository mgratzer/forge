# Unattended Shipping

How a prepared Issue becomes a review-ready PR with nobody watching, and how ten of them run at once.

## The Pieces

```
forge-batch  →  launcher  →  forge-ship --guard  →  review-ready | needs-human
 (which Issues     (one session       (implement → review → guard)
  in parallel)      per Issue)
```

Everything but the launcher is a portable skill. Progress flows out through `FORGE_STATUS_CMD` ([status-reporting](../skills/_shared/status-reporting.md)); project settings flow in through the `## Unattended Shipping` section of `AGENTS.md` ([unattended-config](../skills/_shared/unattended-config.md)).

The guard's steps are the process in [forge-guard](../skills/forge-guard/SKILL.md). It never merges: the human's job starts at `review-ready`, and the guard's summary lists the threads left open on purpose.

## One Issue or Ten

One: `/forge-ship --guard 123` in any session, or `contrib/launchers/cmux-claude.sh 123`.

Ten: `/forge-batch <scope>` prints Waves; paste a Wave's launch line into the launcher. Re-run `forge-batch` after a Wave merges — later Waves are provisional.

## Project Setup

Add the `## Unattended Shipping` section to `AGENTS.md` — see [unattended-config](../skills/_shared/unattended-config.md) — and provide `scripts/bootstrap-worktree.sh` when a fresh checkout needs more than a clone to run the tests.
