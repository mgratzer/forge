# Unattended Shipping

How a prepared Issue becomes a review-ready PR with nobody watching, and how ten of them run at once.

## The Pieces

```
forge-batch  →  launcher  →  forge-ship --guard  →  review-ready | needs-human
 (which Issues     (one session       (implement → review → guard)
  in parallel)      per Issue)
```

| Piece | Kind | Runtime-specific |
|-------|------|------------------|
| `forge-batch` | skill | no |
| `forge-ship --guard` / `forge-guard` | skill | no |
| `forge-address-pr-feedback --unattended` | skill mode | no |
| `contrib/launchers/*` | script | yes — one per terminal/agent |

The skills never learn which terminal or agent runs them. Progress flows out through `FORGE_STATUS_CMD` ([status-reporting](../skills/_shared/status-reporting.md)); project settings flow in through the `## Unattended Shipping` section of `AGENTS.md` ([unattended-config](../skills/_shared/unattended-config.md)).

## The Guard Loop

`forge-guard` runs after the PR is open:

1. Simplification pass, then a security pass when the diff touches security-sensitive paths or the PR is labeled `security`
2. Wait for CI and for the configured peer reviewer
3. React — fix a failed check, or address every unaddressed thread with `forge-address-pr-feedback --unattended`
4. Repeat up to *max guard rounds*, re-requesting the peer review each round
5. Stop at `review-ready` or `needs-human`

It never merges. The human's job starts at `review-ready`, and the guard's summary lists the threads left open on purpose.

## One Issue or Ten

One: `/forge-ship --guard 123` in any session, or `contrib/launchers/cmux-claude.sh 123`.

Ten: `/forge-batch <scope>` prints Waves; paste a Wave's launch line into the launcher. Re-run `forge-batch` after a Wave merges — later Waves are provisional.

## Project Setup

Add to `AGENTS.md`:

```markdown
## Unattended Shipping

- Peer reviewer: copilot-pull-request-reviewer[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**
- Serialized resources: db/migrations/**, bun.lock
- Max guard rounds: 3
- Launcher: contrib/launchers/cmux-claude.sh
```

Provide `scripts/bootstrap-worktree.sh` when a fresh checkout needs more than a clone to run the tests (dependencies, generated code, a database). The launcher runs it once per worktree.
