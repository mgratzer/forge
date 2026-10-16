# Project Configuration

Settings forge skills read from `## Shipping` sections, together called the **Shipping settings**. All are optional.

Forge defines a setting only when it acts on it mechanically: which tracker to call, which reviewers to wait for, draft or ready, which passes to run. Every other project convention (a compatibility policy, how test services are shared, a sign-off rule) is prose in `AGENTS.md`, followed like any other convention.

```markdown
## Shipping

- Issue tracker: skill /team-tracker
- Publish: push
- Pull requests: draft
- Assignee: @me
- Labels: agent
- After create: /risk-eval
- Peer reviewers: copilot-pull-request-reviewer[bot], review-app[bot]
- Security-sensitive paths: src/auth/**, src/webhooks/**
- Extra passes: /threat-model, /team-review (covers: security), /sign-off (each push)
- Exercise: `bin/dev`, then curl the changed endpoint with the tokens in test/fixtures/tokens.json
- Serialized resources: db/migrations/**, bun.lock, shared test database
- Max guard rounds: 3
```

## Reading the Settings

Resolve the settings once at the start of a run. For each setting, the first source that declares it wins:

1. **The project's `AGENTS.md`**, for team contracts. When the runtime hasn't loaded it, read the section: `awk '/^## (Unattended )?Shipping$/{f=1;next} /^## /{f=0} f' AGENTS.md` (`## Unattended Shipping` is the legacy heading).
2. **The user's file**, for personal workflow such as an assignee. Always read it; a missing file means no user settings: `cat "${FORGE_CONFIG:-$HOME/.config/forge/shipping.md}" 2>/dev/null`. Its `## Shipping` section applies everywhere; a `## Shipping: <glob>` section applies where the glob matches the `origin` remote as `host/owner/repo` (`git@github.com:acme/api.git` is `github.com/acme/api`) and wins over the general one; the longest matching glob wins.
3. **The defaults** below.

## Settings

| Setting | Default | Meaning |
|---------|---------|---------|
| Issue tracker | `plan/` folder if present, else GitHub | `skill /<name>` or `mcp <server>` hands every Issue operation to that skill or server ([issue-operations](issue-operations.md#delegated-providers)) |
| Publish | push | `local` stops before the push for a local review; `forge-ship --publish` publishes later |
| Pull requests | draft | `draft` or `ready`: the state a new PR opens in. Marking a draft ready is the human's signal, never forge's |
| Assignee | none | Passed to `gh pr create --assignee`; `@me` assigns the author |
| Labels | none | Comma-separated, for `gh pr create --label`; one the repository lacks (`gh label list`) is left out and named in the summary, since `gh pr create` fails on it |
| After create | none | A runtime skill run once the PR exists; skipped and named in the summary when the runtime lacks it |
| Peer reviewers | bots that reviewed recent merged PRs, never blocking ([peer-review-wait](peer-review-wait.md)) | Logins to request and wait for after each push, as the review-request API spells them (bots with a `[bot]` suffix); `none` opts out. `Peer reviewer` is read the same way |
| Security-sensitive paths | the risky signals in [review-delegation](review-delegation.md) | Globs that trigger the security pass |
| Extra passes | none | Runtime skills run after forge's quality passes, in order, with the `(covers: <dimension>)` and `(each push)` markers of [quality-passes](quality-passes.md) |
| Exercise | the runtime's skill for running the project, else none | How to start the app and reach the changed path: a command, or a pointer to a section with Start, Exercise, Needs a human, and Stop. `forge-ship` drives the change once |
| Serialized resources | migration directories, lockfiles, generated files | What two Issues must never change in the same Wave. A test service every checkout shares goes here too: every Issue touches it, so each Wave holds one Issue |
| Max guard rounds | 3 | Rounds before the guard stops with `needs-human` |

## Conventions Launchers Rely On

- `scripts/bootstrap-worktree.sh`, when present and executable, prepares a fresh checkout to run the tests; `contrib/worktree/create.sh` runs it (`FORGE_BOOTSTRAP` overrides). `scripts/teardown-worktree.sh` releases what it allocated; `contrib/worktree/remove.sh` runs it.
- `FORGE_LAUNCHER` names the launcher in `forge-batch`'s launch lines; it is per developer, so it lives in the environment.
