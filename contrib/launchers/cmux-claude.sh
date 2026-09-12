#!/usr/bin/env bash
# Forge launcher for cmux + Claude Code.
#
# Starts one guarded, unattended `forge-ship` per Issue, each in its own git worktree
# and its own named cmux workspace. Skills report progress through FORGE_STATUS_CMD,
# which this launcher points at cmux-status.sh next to it.
#
# Usage:
#   cmux-claude.sh [options] <issue>... [-- <trailing context for forge-ship>]
#
# Options:
#   --repo <path>     repository root (default: the git toplevel of the current directory)
#   --base <branch>   branch to fork worktrees from (default: origin's default branch)
#   --no-guard        run forge-ship --unattended without --guard
#   --focus           focus the last workspace created
#   --dry-run         print every command instead of running it
#
# Environment:
#   FORGE_WORKTREE_ROOT  where worktrees go (default: ~/.forge/worktrees/<repo-name>)
#   FORGE_BOOTSTRAP      command run inside each new worktree; default: scripts/bootstrap-worktree.sh
#                        when the repo has one, otherwise nothing
#   FORGE_AGENT          agent command; "{issue}" and "{prompt}" are substituted
#                        (default: claude --dangerously-skip-permissions --name '#{issue}' '{prompt}')
set -euo pipefail

here="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"   # survives a symlink on PATH
repo=""
base=""
guard="--guard"
focus=false
dry_run=false
issues=()
trailing=""

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) repo="$2"; shift ;;
    --base) base="$2"; shift ;;
    --no-guard) guard="--unattended" ;;
    --focus) focus=true ;;
    --dry-run) dry_run=true ;;
    --) shift; trailing="$*"; break ;;
    -h|--help) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "unknown option: $1" >&2; exit 1 ;;
    *) issues+=("$1") ;;
  esac
  shift
done

[ ${#issues[@]} -gt 0 ] || { echo "no issues given" >&2; exit 1; }
command -v cmux > /dev/null || { echo "cmux not on PATH" >&2; exit 1; }
command -v gh > /dev/null || { echo "gh not on PATH" >&2; exit 1; }

repo="${repo:-$(git rev-parse --show-toplevel)}"
repo_name="$(basename "$repo")"
worktree_root="${FORGE_WORKTREE_ROOT:-$HOME/.forge/worktrees/$repo_name}"
status_cmd="$here/cmux-status.sh"
agent_template="${FORGE_AGENT:-claude --dangerously-skip-permissions --name '#{issue}' '{prompt}'}"

run() {
  if [ "$dry_run" = true ]; then
    printf '  $'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

run git -C "$repo" fetch origin --quiet
if [ -z "$base" ]; then
  base="$(git -C "$repo" symbolic-ref refs/remotes/origin/HEAD 2> /dev/null | sed 's@^refs/remotes/origin/@@')"
  base="${base:-main}"
fi

bootstrap="${FORGE_BOOTSTRAP:-}"
if [ -z "$bootstrap" ] && [ -x "$repo/scripts/bootstrap-worktree.sh" ]; then
  bootstrap="scripts/bootstrap-worktree.sh"
fi

for issue in "${issues[@]}"; do
  case "$issue" in
    *[!0-9]*) echo "not an issue number: $issue" >&2; exit 1 ;;
  esac

  title="$(gh issue view "$issue" -R "$(git -C "$repo" remote get-url origin)" --json title --jq .title)"
  # feat(scope): description → type "feat", slug "description"
  type="$(printf '%s' "$title" | sed -nE 's/^([a-z]+)(\([^)]*\))?!?:.*/\1/p')"
  type="${type:-feat}"
  slug="$(printf '%s' "$title" | sed -E 's/^[a-z]+(\([^)]*\))?!?:[[:space:]]*//' \
    | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' | cut -c1-40 | sed -E 's/-+$//')"
  branch="$type/$issue-$slug"
  worktree="$worktree_root/$issue"

  echo "#$issue  $title"
  echo "  branch    $branch"
  echo "  worktree  $worktree"

  if [ -d "$worktree" ]; then
    echo "  worktree exists — reusing"
  else
    run mkdir -p "$worktree_root"
    if git -C "$repo" show-ref --verify --quiet "refs/heads/$branch"; then
      run git -C "$repo" worktree add "$worktree" "$branch"
    else
      run git -C "$repo" worktree add -b "$branch" "$worktree" "origin/$base"
    fi
    if [ -n "$bootstrap" ]; then
      echo "  bootstrap $bootstrap"
      if [ "$dry_run" = true ]; then
        echo "  $ (cd $worktree && $bootstrap)"
      else
        (cd "$worktree" && eval "$bootstrap")
      fi
    fi
  fi

  prompt="/forge-ship $guard $issue"
  [ -n "$trailing" ] && prompt="$prompt -- $trailing"
  agent="${agent_template//\{issue\}/$issue}"
  agent="${agent//\{prompt\}/$prompt}"

  run cmux new-workspace \
    --name "#$issue $(printf '%s' "$title" | cut -c1-48)" \
    --description "$title" \
    --cwd "$worktree" \
    --env "FORGE_STATUS_CMD=$status_cmd" \
    --env "FORGE_ISSUE=$issue" \
    --focus "$focus" \
    --command "$agent"
  echo
done

echo "${#issues[@]} session(s) started. Worktrees live under $worktree_root."
echo "Clean up a finished one with: git -C $repo worktree remove $worktree_root/<issue>"
