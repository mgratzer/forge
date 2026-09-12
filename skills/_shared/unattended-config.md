# Unattended Configuration

Project-level settings the unattended skills (`forge-guard`, `forge-batch`, `forge-ship --guard`) read from `AGENTS.md`. All optional — defaults apply when the section or a line is absent.

## Declaration

Projects declare the section verbatim:

```markdown
## Unattended Shipping

- Peer reviewer: copilot-pull-request-reviewer[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**, src/middleware/**
- Serialized resources: db/migrations/**, bun.lock, messages/**
- Max guard rounds: 3
```

The section is already in context when the runtime auto-loads `AGENTS.md`; otherwise `grep -A6 "^## Unattended Shipping" AGENTS.md`.

## Settings

| Setting | Used by | Default | Meaning |
|---------|---------|---------|---------|
| Peer reviewer | guard | none | Login the guard re-requests after each push, as the review-request API spells it (bots carry a `[bot]` suffix, e.g. `copilot-pull-request-reviewer[bot]`) |
| Security-sensitive paths | guard | the risky signals in [review-delegation](review-delegation.md), *Choose Review Shape* item 3 | Globs that trigger the security pass when the diff touches them |
| Serialized resources | batch | migration directories, lockfiles, generated files | Files two Issues must never change in the same Wave, even when the exact paths differ |
| Max guard rounds | guard | 3 | Feedback rounds before the guard stops with `needs-human` |

## Conventions Launchers Rely On

- `scripts/bootstrap-worktree.sh`, when present and executable, prepares a fresh checkout to run the tests (dependencies, generated code, a database). `contrib/worktree/create.sh` runs it once per worktree; `FORGE_BOOTSTRAP` overrides the command.
- `scripts/teardown-worktree.sh`, when present and executable, releases what the bootstrap allocated (a database container, a port). `contrib/worktree/remove.sh` runs it before the worktree goes.
- `FORGE_LAUNCHER` names the launcher in `forge-batch`'s launch lines. Which terminal starts a session is per-developer state, so it lives in the environment, not in `AGENTS.md`.
