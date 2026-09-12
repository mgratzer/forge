# Launchers

A launcher starts one unattended `forge-ship --guard` per Issue, each in an isolated checkout, in whatever terminal and agent you use. See [Unattended Shipping](../../docs/unattended.md) for how it fits with the skills.

| Launcher | Terminal | Agent |
|----------|----------|-------|
| [`cmux-claude.sh`](cmux-claude.sh) | [cmux](https://cmux.com) | Claude Code |

## cmux + Claude Code

```bash
# from inside the target repository
contrib/launchers/cmux-claude.sh 123 124 125
contrib/launchers/cmux-claude.sh --dry-run 123          # print, don't run
contrib/launchers/cmux-claude.sh 123 -- keep the diff minimal
```

Per Issue it creates a detached worktree under `~/.forge/worktrees/<repo>/<issue>` (forge-implement names the branch), opens a cmux workspace named `#<issue> <title>`, and sends one command that runs `scripts/bootstrap-worktree.sh` when the repo has one and then the agent — so ten bootstraps overlap and the launcher returns at once. [`cmux-status.sh`](cmux-status.sh) turns each state into a sidebar pill and progress bar, and posts a notification on `review-ready`, `needs-human`, and `failed`.

Environment overrides: `FORGE_WORKTREE_ROOT`, `FORGE_BOOTSTRAP`, `FORGE_AGENT` — documented at the top of the script.

## Writing One for Another Terminal

A launcher needs to do four things:

1. Create an isolated checkout per Issue — detached at the default branch is enough, `forge-implement` creates the branch
2. Run the project's bootstrap so tests can run in that checkout (see the conventions in [unattended-config](../../skills/_shared/unattended-config.md))
3. Start the agent with the prompt `/forge-ship --guard <issue>` and `FORGE_STATUS_CMD` pointing at a script that accepts `<state> "<detail>"`
4. Make the session findable — a tab name, a window title, a tmux session name

Keep it small — the reference launcher is about a hundred lines; anything smarter belongs in a skill.
