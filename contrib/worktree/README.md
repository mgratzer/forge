# Worktrees

Two agent-agnostic scripts that turn "a worktree for Issue N" into a project-ready checkout and back. Both read a small JSON object on stdin, so the same scripts serve as Claude Code hooks and as plain commands for agents without worktree support.

| Script | Input | Does |
|--------|-------|------|
| [`create.sh`](create.sh) | `{"cwd": "<repo>", "name": "<name>"}` | Detached worktree under `~/.forge/worktrees/<repo>/<name>` at a fresh origin default branch, then `scripts/bootstrap-worktree.sh` when the project has one; prints the path |
| [`remove.sh`](remove.sh) | `{"worktree_path": "<path>"}` | `scripts/teardown-worktree.sh` when present, then removes the worktree |

The two project scripts are the conventions in [unattended-config](../../skills/_shared/unattended-config.md).

## Claude Code

Install once in `~/.claude/settings.json`; `claude --worktree <name>` then creates through `create.sh` and cleans up through `remove.sh` (the create timeout must cover a bootstrap):

```json
{
  "hooks": {
    "WorktreeCreate": [
      { "hooks": [ { "type": "command", "command": "/path/to/forge/contrib/worktree/create.sh", "timeout": 900 } ] }
    ],
    "WorktreeRemove": [
      { "hooks": [ { "type": "command", "command": "/path/to/forge/contrib/worktree/remove.sh", "timeout": 300 } ] }
    ]
  }
}
```

Because a create hook replaces Claude's default, `.worktreeinclude` is not processed — copy local config in the project bootstrap instead. One Issue is then one command from the repository:

```bash
claude --dangerously-skip-permissions -w 760 --name '#760' '/forge-ship --guard 760'
```

## Other agents

Call the scripts directly and start the agent inside the path they print:

```bash
wt=$(printf '{"cwd":"%s","name":"%s"}' "$PWD" 760 | /path/to/forge/contrib/worktree/create.sh)
codex -C "$wt" '...'               # or pi, opencode, ...
printf '{"worktree_path":"%s"}' "$wt" | /path/to/forge/contrib/worktree/remove.sh   # when done
```

The launcher in [`../launchers/`](../launchers/) does exactly this whenever the agent template contains `{worktree}`.
