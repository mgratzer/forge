# Prepare for Unattended Shipping

The unattended skills (`forge-guard`, `forge-land`, `forge-batch`, `forge-ship --guard`) run on defaults when `AGENTS.md` has no `## Unattended Shipping` section, and `forge-implement` reports `not exercised: no way to run the app` when the project has no run recipe. Both are quiet failures: nothing says the defaults were used. This step closes both gaps without inventing a value.

## Run Recipe

Look for a recipe the way `_shared/exercise.md` finds one: a skill the project ships for running the app, or run commands in `AGENTS.md` or the docs it points to. A complete recipe has four parts:

| Part | Discover from |
|------|---------------|
| Start | `dev`/`start`/`serve` scripts, `Makefile`, `Procfile`, `docker-compose.yml`, the README's quick start |
| Drive | the port or URL in config, a CLI entry point, a health or readiness endpoint |
| Test credentials | seed and fixture files, `.env.example`; never a real secret |
| Stop | how the start command ends (foreground process, `docker compose down`) |

Write the parts you found under Commands in `AGENTS.md`. Ask for the rest in Step 4's round of questions, and leave a `<!-- TODO: <part> -->` for what the user doesn't know. Never guess how to start the app. A project with nothing to run (a library without an entry point, docs only) needs no recipe; say so in the summary.

## The Section

Offer it only when the project ships through PRs: skip it when there is no remote with PRs, or the history shows direct pushes to the default branch, and ask when unsure. The format and defaults are in `_shared/unattended-config.md`.

| Setting | Discover from | When not discoverable |
|---------|---------------|-----------------------|
| Peer reviewer | bot logins (`[bot]` suffix) in the reviews of the last ~10 merged PRs: `gh api repos/{owner}/{repo}/pulls/<n>/reviews --jq '.[].user.login'` | ask; a human reviewer is the user's call, never inferred from history |
| Security-sensitive paths | directories and files for auth, sessions, permissions, webhooks, middleware, payments, secrets, and CI workflows | leave the line out; the generic risk signals apply |
| Serialized resources | migration directories, lockfiles, generated files (`linguist-generated` in `.gitattributes`, codegen output, message catalogs) | leave the line out |
| Max guard rounds | nothing to discover | leave the line out unless the user names a number other than the default 3 |

Write globs that match tracked files today (`git ls-files '<glob>'`). Show the user the drafted section with the discovered values filled in, so they confirm rather than type. A value the user wants but can't give yet is a `<!-- TODO -->`, never a placeholder that looks real.

**Existing section:** audit it, don't overwrite it. Propose additions discovery found and flag globs that match no tracked file; keep every value the user wrote. A section under the old `## Shipping` heading is ignored by the unattended skills; offer to rename it to `## Unattended Shipping`.

**No CI** (no workflow or pipeline config): guard and land treat a PR without checks as passing. Say so in the summary's Agent Readiness table.

## Auto-merge

Never write an `Auto-merge` line, and leave an existing one as the user set it. In the summary's next steps, say it is a later opt-in: add `Auto-merge: low-risk` after agreeing with several of `forge-land`'s `merge-ready` verdicts on real PRs.
