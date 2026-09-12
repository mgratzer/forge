# Launchers

A launcher starts one unattended `forge-ship --guard` per Issue, each in an isolated checkout, in whatever terminal and agent you use. See [Unattended Shipping](../../docs/unattended.md) for how it fits with the skills, and [`../worktree/`](../worktree/) for the checkout itself.

| Launcher | Terminal | Agent |
|----------|----------|-------|
| [`cmux-claude.sh`](cmux-claude.sh) | [cmux](https://cmux.com) | Claude Code by default; any agent through `FORGE_AGENT` |

## cmux

```bash
# from inside the target repository
contrib/launchers/cmux-claude.sh 123 124 125
contrib/launchers/cmux-claude.sh --dry-run 123          # print, don't run
contrib/launchers/cmux-claude.sh 123 -- keep the diff minimal
```

Per Issue it opens a cmux workspace named `#<issue> <title>` under a collapsible sidebar group `<repo> agents` (created on first use; `--group <name>` or `--no-group` to change that), so each session keeps its own pills and progress while the batch stays one block. The first workspace takes focus; `--no-focus` leaves the view alone.

With Claude Code the workspace runs `claude -w <issue> --name '#<issue>' '/forge-ship --guard <issue>'` and the [worktree hooks](../worktree/) create and clean up the checkout. For another agent set `FORGE_AGENT` with a `{worktree}` placeholder and the launcher creates the checkout through `create.sh` first:

```bash
FORGE_AGENT='codex -C {worktree} {prompt}' contrib/launchers/cmux-claude.sh 123
```

Placeholders: `{issue}` bare number, `{label}` quoted `#<issue>`, `{prompt}` quoted prompt, `{worktree}` quoted path. [`cmux-status.sh`](cmux-status.sh) turns each state into a sidebar pill and progress bar, and posts a notification on terminal states.

## Writing One for Another Terminal

A launcher needs to do three things:

1. Get an isolated checkout per Issue — with Claude Code, `-w <issue>` plus the worktree hooks; otherwise pipe `{"cwd", "name"}` into `contrib/worktree/create.sh` and use the path it prints
2. Start the agent with the prompt `/forge-ship --guard <issue>` and `FORGE_STATUS_CMD` pointing at a script that accepts `<state> "<detail>"`
3. Make the session findable — a tab name, a window title, a tmux session name

Keep it small — the reference launcher is about a hundred lines; anything smarter belongs in a skill.
