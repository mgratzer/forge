# Project Configuration

Settings forge skills read from a `## Shipping` section. All optional; defaults apply when a setting is declared nowhere.

## Declaration

Projects declare the section verbatim:

```markdown
## Shipping

- Pull requests: draft
- Assignee: @me
- Labels: risk:low
- After create: /risk-eval
- Peer reviewer: copilot-pull-request-reviewer[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**, src/middleware/**
- Serialized resources: db/migrations/**, bun.lock, messages/**
- Max guard rounds: 3
```

`## Unattended Shipping` is the legacy heading and is read the same way. The section is already in context when the runtime auto-loads `AGENTS.md`; otherwise `grep -A16 -E "^## (Unattended )?Shipping" AGENTS.md`.

## Where Settings Come From

Two places, per setting:

1. **The project's `AGENTS.md`.** Team contracts such as security paths or the review record belong to the repository, so a setting declared here always wins.
2. **The user's file**, `~/.config/forge/shipping.md` (`$FORGE_CONFIG` overrides the path). It fills in what the project doesn't declare: personal workflow such as `Publish: local` or an assignee, kept out of a shared AGENTS.md. Its `## Shipping` section applies everywhere; a `## Shipping: <remote glob>` section applies only where the `origin` remote URL matches the glob, and wins over the general one.

```markdown
## Shipping

- Assignee: @me

## Shipping: github.com/acme/*

- Extra passes: /team-review (covers: security)
```

## Settings

| Setting | Used by | Default | Meaning |
|---------|---------|---------|---------|
| Pull requests | implement, ship | draft | `draft` or `ready` — the state a new PR opens in. Forge never marks a draft ready; that is the human's signal |
| Assignee | implement, ship | none | Passed to `gh pr create --assignee`; `@me` assigns the author |
| Labels | implement, ship | none | Comma-separated labels for `gh pr create --label` |
| After create | implement, ship | none | A runtime skill run once the PR exists, e.g. one that posts a risk assessment and sets a label; skipped and named in the summary when the runtime doesn't provide it |
| Peer reviewer | guard | none | Login the guard re-requests after each push, as the review-request API spells it (bots carry a `[bot]` suffix, e.g. `copilot-pull-request-reviewer[bot]`) |
| Security-sensitive paths | guard | the risky signals in [review-delegation](review-delegation.md), *Choose Review Shape* item 3 | Globs that trigger the security pass when the diff touches them |
| Serialized resources | batch | migration directories, lockfiles, generated files | Files two Issues must never change in the same Wave, even when the exact paths differ |
| Max guard rounds | guard | 3 | Feedback rounds before the guard stops with `needs-human` |

## Conventions Launchers Rely On

- `scripts/bootstrap-worktree.sh`, when present and executable, prepares a fresh checkout to run the tests (dependencies, generated code, a database). `contrib/worktree/create.sh` runs it once per worktree; `FORGE_BOOTSTRAP` overrides the command.
- `scripts/teardown-worktree.sh`, when present and executable, releases what the bootstrap allocated (a database container, a port). `contrib/worktree/remove.sh` runs it before the worktree goes.
- `FORGE_LAUNCHER` names the launcher in `forge-batch`'s launch lines. Which terminal starts a session is per developer, so it lives in the environment rather than in `AGENTS.md`.
