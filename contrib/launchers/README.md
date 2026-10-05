# Launchers

A launcher starts one unattended `forge-ship --guard` per Issue in your terminal of choice. [Unattended Shipping](../../docs/unattended.md) explains how it fits with the skills; [`../worktree/`](../worktree/) provides the checkout.

| Launcher | Terminal | Agent |
|----------|----------|-------|
| [`cmux-claude.sh`](cmux-claude.sh) | [cmux](https://cmux.com) | Claude Code by default; any agent through `FORGE_AGENT` |

## cmux

```bash
# from inside the target repository
contrib/launchers/cmux-claude.sh 123 124 125
contrib/launchers/cmux-claude.sh '#123, #124'            # pasted lists work when quoted
contrib/launchers/cmux-claude.sh --dry-run 123          # print, don't run
contrib/launchers/cmux-claude.sh 123 -- keep the diff minimal
contrib/launchers/cmux-claude.sh --model sonnet 123     # pick the Claude model
```

An Issue is anything `forge-ship` accepts: a GitHub number or URL, a provider key or URL such as `ENG-123`, or a plan file path.

Each Issue gets a cmux workspace named `#<issue> <title>` inside a collapsible sidebar group `<repo> agents`, so every session keeps its own status pill and progress bar. The group is created on first use; `--group <name>` picks another, `--no-group` skips it. The first workspace takes focus unless you pass `--no-focus`.

With Claude Code the workspace runs `claude -w <issue> --name '#<issue>' '/forge-ship --guard <issue>'`, and the [worktree hooks](../worktree/) create and clean up the checkout. For another agent, set `FORGE_AGENT` with a `{worktree}` placeholder and the launcher creates the checkout through `create.sh` first:

```bash
FORGE_AGENT='codex -C {worktree} {prompt}' contrib/launchers/cmux-claude.sh 123
```

Placeholders: `{issue}` bare number, `{label}` quoted `#<issue>`, `{prompt}` quoted prompt, `{worktree}` quoted path. [`cmux-status.sh`](cmux-status.sh) maps each state to a sidebar pill and progress bar and notifies on terminal states.

### Permissions

By default each Claude session starts in the `permissions.defaultMode` from your Claude Code settings — a fresh process, so it does not inherit the mode of the session you launched from. Set `"defaultMode": "auto"` in `~/.claude/settings.json` to let sessions approve routine actions themselves; user-level settings apply in every worktree, while the repository's gitignored `.claude/settings.local.json` does not travel into them. Whatever the mode still asks about waits in the session's workspace until you approve. To skip every prompt, opt in explicitly:

```bash
contrib/launchers/cmux-claude.sh --yes-skip-permissions 123 124
```

This adds `--dangerously-skip-permissions`. The agent then runs commands and edits files without asking, steered by the Issue text — someone who can write an Issue can direct it. Use it only for Issues you trust, ideally inside a sandbox or container. With `FORGE_AGENT`, the template runs as written; put the agent's own permission and model flags there — `--model` and `--yes-skip-permissions` apply only to the default Claude command.

## Writing one for another terminal

1. Get an isolated checkout per Issue. With Claude Code, use `-w <issue>` and the worktree hooks. Otherwise pipe `{"cwd", "name"}` into `contrib/worktree/create.sh` and use the path it prints.
2. Start the agent with the prompt `/forge-ship --guard <issue>` and `FORGE_STATUS_CMD` pointing at a script that accepts `<state> "<detail>"`.
3. Make the session findable: a tab name, a window title, a tmux session name.

The cmux launcher is about a hundred lines. Anything smarter belongs in a skill.
