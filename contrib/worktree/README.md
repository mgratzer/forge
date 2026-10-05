# Worktrees

Two scripts that create a project-ready checkout for an agent session and remove it again. Both read a small JSON object on stdin, so they work as Claude Code hooks and as plain commands for agents without worktree support.

| Script | Input | Does |
|--------|-------|------|
| [`create.sh`](create.sh) | `{"cwd": "<repo>", "name": "<name>"}` | Detached worktree under `~/.forge/worktrees/<repo>/<name>` at a fresh origin default branch, then `scripts/bootstrap-worktree.sh` when the project has one. Prints the path |
| [`remove.sh`](remove.sh) | `{"worktree_path": "<path>"}` | `scripts/teardown-worktree.sh` when present, then removes the worktree |

`FORGE_WORKTREE_ROOT` overrides the location. The two project scripts are described in [unattended-config](../../skills/_shared/unattended-config.md).

## Claude Code

Install once in `~/.claude/settings.json`. `claude --worktree <name>` then creates through `create.sh` and cleans up through `remove.sh`. The create timeout has to cover a bootstrap.

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

A create hook replaces Claude's default, so `.worktreeinclude` is not processed. Copy local config in the project bootstrap instead. One Issue is then one command from the repository:

```bash
claude -w 760 --name '#760' '/forge-ship --guard 760'
```

## Other agents

```bash
wt=$(printf '{"cwd":"%s","name":"%s"}' "$PWD" 760 | /path/to/forge/contrib/worktree/create.sh)
codex -C "$wt" '...'               # or pi, opencode, ...
printf '{"worktree_path":"%s"}' "$wt" | /path/to/forge/contrib/worktree/remove.sh   # when done
```

The launcher in [`../launchers/`](../launchers/) does this whenever the agent template contains `{worktree}`.
