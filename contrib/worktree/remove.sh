#!/usr/bin/env bash
# Counterpart of create.sh. Runs the project's scripts/teardown-worktree.sh (when present) so
# per-worktree resources such as a test database go away with the checkout, then removes the
# worktree if the agent has not. Claude Code calls it as its WorktreeRemove hook.
#
# Input (stdin JSON): { "cwd": "<repo>", "worktree_path": "<path returned by the create hook>" }
set -uo pipefail

input="$(cat)"
worktree="$(printf '%s' "$input" | jq -r .worktree_path)"
[ -d "$worktree" ] || exit 0

if [ -x "$worktree/scripts/teardown-worktree.sh" ]; then
  (cd "$worktree" && scripts/teardown-worktree.sh) >&2 || echo "forge: teardown failed, continuing" >&2
fi

repo="$(git -C "$worktree" rev-parse --path-format=absolute --git-common-dir 2> /dev/null | sed 's@/\.git$@@')"
[ -n "$repo" ] && git -C "$repo" worktree remove --force "$worktree" >&2 2>/dev/null || true
[ -d "$worktree" ] && rm -rf "$worktree"
exit 0
