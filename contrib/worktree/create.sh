#!/usr/bin/env bash
# Create a project-ready worktree for an agent session: outside the repository, detached at
# a fresh origin default branch, with the project's scripts/bootstrap-worktree.sh (when
# present) already run. Agent-agnostic — Claude Code calls it as its WorktreeCreate hook,
# launchers call it directly for agents without worktree support. Everything but the final
# path goes to stderr; the last stdout line is the worktree path.
#
# Input (stdin JSON): { "cwd": "<repo the session started in>", "name": "<worktree name>" }
# Environment: FORGE_WORKTREE_ROOT (default ~/.forge/worktrees/<repo-name>)
#              FORGE_BOOTSTRAP (default scripts/bootstrap-worktree.sh when executable)
set -euo pipefail

input="$(cat)"
name="$(printf '%s' "$input" | jq -r .name)"
cwd="$(printf '%s' "$input" | jq -r .cwd)"
repo="$(git -C "$cwd" rev-parse --show-toplevel)"
repo_name="$(basename "$repo")"
worktree="${FORGE_WORKTREE_ROOT:-$HOME/.forge/worktrees/$repo_name}/$name"

if [ -d "$worktree" ]; then
  echo "forge: re-entering $worktree" >&2
else
  git -C "$repo" fetch origin --quiet >&2
  base="$(git -C "$repo" symbolic-ref refs/remotes/origin/HEAD 2> /dev/null | sed 's@^refs/remotes/origin/@@')"
  mkdir -p "$(dirname "$worktree")"
  git -C "$repo" worktree add --detach "$worktree" "origin/${base:-main}" >&2

  bootstrap="${FORGE_BOOTSTRAP:-}"
  [ -n "$bootstrap" ] || [ ! -x "$worktree/scripts/bootstrap-worktree.sh" ] || bootstrap="scripts/bootstrap-worktree.sh"
  if [ -n "$bootstrap" ]; then
    echo "forge: bootstrapping with $bootstrap" >&2
    (cd "$worktree" && eval "$bootstrap") >&2
  else
    echo "forge: no bootstrap script — the worktree starts bare" >&2
  fi
fi

echo "$worktree"
