# Project Configuration

Settings forge skills read from `## Shipping` sections, together called the **Shipping settings**. All optional; defaults apply when a setting is declared nowhere.

## Declaration

Projects declare the section in `AGENTS.md`:

```markdown
## Shipping

- Issue tracker: skill /team-tracker
- Publish: push
- Pull requests: draft
- Assignee: @me
- Labels: agent
- After create: /risk-eval
- Peer reviewers: copilot-pull-request-reviewer[bot], review-app[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**, src/middleware/**
- Extra passes: /threat-model, /team-review (covers: security)
- Review record: docs/review-process.md#sign-off
- Exercise: `bin/dev`, then curl the changed endpoint with the tokens in test/fixtures/tokens.json
- Serialized resources: db/migrations/**, bun.lock, messages/**
- Max guard rounds: 3
```

`## Unattended Shipping` is the legacy heading and is read the same way.

## Reading the Settings

Resolve the Shipping settings once at the start of a run. For each setting, the first source that declares it wins:

1. **The project's `AGENTS.md`.** Team contracts such as security paths or the review record belong to the repository. The section is in context when the runtime auto-loads `AGENTS.md`; otherwise read it up to the next heading: `awk '/^## (Unattended )?Shipping$/{f=1;next} /^## /{f=0} f' AGENTS.md`.
2. **The user's file**, for personal workflow kept out of a shared AGENTS.md, such as an assignee. Always read it, even when AGENTS.md is in context; a missing file means no user settings: `cat "${FORGE_CONFIG:-$HOME/.config/forge/shipping.md}" 2>/dev/null`. Its `## Shipping` section applies everywhere. A `## Shipping: <glob>` section applies where the glob matches the repository as `host/owner/repo`: the `origin` URL with the scheme, `user@`, and `.git` removed and `:` read as `/`, so `git@github.com:acme/api.git` is `github.com/acme/api`. A matching glob section wins over the general one; when several match, the longest glob wins.
3. **The defaults** in the table below.

```markdown
## Shipping

- Assignee: @me

## Shipping: github.com/acme/*

- Pull requests: ready
```

## Settings

| Setting | Used by | Default | Meaning |
|---------|---------|---------|---------|
| Issue tracker | every skill that touches Issues | `plan/` folder if present, else GitHub | `skill /<name>` or `mcp <server>` hands every Issue operation to that skill or MCP server — see [issue-operations](issue-operations.md#delegated-providers) |
| Publish | implement, ship | push | `push` publishes at the end of a run; `local` stops before the push for a local review, and `forge-ship --publish` publishes later. `--guard` always pushes |
| Pull requests | implement, ship | draft | `draft` or `ready` — the state a new PR opens in. Forge never marks a draft ready; that is the human's signal |
| Assignee | implement, ship | none | Passed to `gh pr create --assignee`; `@me` assigns the author |
| Labels | implement, ship | none | Comma-separated labels for `gh pr create --label`. A label the repository doesn't have (`gh label list`) is left out and named in the summary, because `gh pr create` fails on it |
| After create | implement, ship | none | A runtime skill run once the PR exists, e.g. one that posts a risk assessment and sets a label; skipped and named in the summary when the runtime doesn't provide it |
| Peer reviewers | guard, address-pr-feedback | none | Logins to request and wait for after each push, as the review-request API spells them (bots carry a `[bot]` suffix, e.g. `copilot-pull-request-reviewer[bot]`); comma-separated. Feedback from the `[bot]` entries is answered automatically; a person listed here still gets drafted replies. `Peer reviewer` (singular) is read the same way |
| Security-sensitive paths | ship, guard | the risky signals in [review-delegation](review-delegation.md), *Choose Review Shape* item 3 | Globs that trigger the security pass when the diff touches them |
| Extra passes | ship, guard | none | Runtime skills run after forge's quality passes, in order; `(covers: simplify)` or `(covers: security)` hands that dimension to the pass — see [quality-passes](quality-passes.md) |
| Review record | ship, guard | none | Where the project's review-record format is specified; forge writes a record at hand-off in that format — see [review-record](review-record.md) |
| Exercise | ship | the runtime's run skill (Claude Code: `/run`), else none | How to start the app and reach the changed path: a command, or a pointer to an AGENTS.md section or doc with Start, Exercise, Needs a human, and Stop. Ship drives the change once and puts the result in the PR body |
| Serialized resources | batch | migration directories, lockfiles, generated files | Files two Issues must never change in the same Wave, even when the exact paths differ |
| Max guard rounds | guard | 3 | Feedback rounds before the guard stops with `needs-human` |

## Conventions Launchers Rely On

- `scripts/bootstrap-worktree.sh`, when present and executable, prepares a fresh checkout to run the tests (dependencies, generated code, a database). `contrib/worktree/create.sh` runs it once per worktree; `FORGE_BOOTSTRAP` overrides the command.
- `scripts/teardown-worktree.sh`, when present and executable, releases what the bootstrap allocated (a database container, a port). `contrib/worktree/remove.sh` runs it before the worktree goes.
- `FORGE_LAUNCHER` names the launcher in `forge-batch`'s launch lines. Which terminal starts a session is per developer, so it lives in the environment rather than in `AGENTS.md`.
