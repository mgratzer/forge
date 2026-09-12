#!/usr/bin/env bash
# Forge launcher for cmux + Claude Code.
#
# One cmux workspace per Issue, filed under a sidebar group, each running the agent on
# `/forge-ship --guard <issue>`. With Claude Code, `-w <issue>` plus the hooks in ../worktree
# create and clean up the worktree; for an agent template containing {worktree}, the
# launcher creates it through ../worktree/create.sh itself. Skills report progress through
# FORGE_STATUS_CMD → cmux-status.sh.
#
# Usage:
#   cmux-claude.sh [options] <issue>... [-- <trailing context for forge-ship>]
#
# Options:
#   --repo <path>     repository root (default: the git toplevel of the current directory)
#   --no-guard        run forge-ship --unattended without --guard
#   --no-focus        leave the view where it is (default: focus the first workspace created)
#   --group <name>    sidebar group to file the workspaces under (default: "<repo-name> agents";
#                     created when missing, collapsible, keeps each workspace's pills visible)
#   --no-group        leave the workspaces ungrouped
#   --dry-run         print every command instead of running it
#
# Environment:
#   FORGE_AGENT       agent command template. Placeholders: {issue} bare number, {label} quoted
#                     '#<issue>', {prompt} quoted prompt, {worktree} quoted path (created by the
#                     launcher when present). Default:
#                       claude --dangerously-skip-permissions -w {issue} --name {label} {prompt}
#                     Example for another agent:
#                       FORGE_AGENT='codex -C {worktree} {prompt}'
set -euo pipefail
export CMUX_QUIET=1   # silence the legacy-verb notice

here="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"   # survives a symlink on PATH
repo=""
guard="--guard"
focus=true
group=""
no_group=false
dry_run=false
issues=()
trailing=""

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) repo="$2"; shift ;;
    --no-guard) guard="--unattended" ;;
    --no-focus) focus=false ;;
    --group) group="$2"; shift ;;
    --no-group) no_group=true ;;
    --dry-run) dry_run=true ;;
    --) shift; trailing="$*"; break ;;
    -h|--help) sed -n '2,/^set /{/^set /!p;}' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "unknown option: $1" >&2; exit 1 ;;
    *) issues+=("$1") ;;
  esac
  shift
done

[ ${#issues[@]} -gt 0 ] || { echo "no issues given" >&2; exit 1; }
for tool in cmux gh jq claude; do command -v "$tool" > /dev/null || { echo "$tool not on PATH" >&2; exit 1; }; done

repo="${repo:-$(git rev-parse --show-toplevel)}"
repo_name="$(basename "$repo")"
status_cmd="$here/cmux-status.sh"
agent_template="${FORGE_AGENT:-}"
[ -n "$agent_template" ] || agent_template='claude --dangerously-skip-permissions -w {issue} --name {label} {prompt}'
launcher_makes_worktree=false
case "$agent_template" in *"{worktree}"*) launcher_makes_worktree=true ;; esac

run() {
  if [ "$dry_run" = true ]; then
    printf '  $'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

# Single-quote a value for the shell that receives the workspace command.
sq() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }

# Find or create the sidebar group; the anchor workspace is its header, like a manual Cmd+Shift+G group.
group_args=()
if [ "$no_group" = false ]; then
  group="${group:-$repo_name agents}"
  group_ref="$(cmux workspace-group list --json | jq -r --arg n "$group" '.groups[] | select(.name == $n) | .ref' | head -n 1)"
  if [ -z "$group_ref" ]; then
    if [ "$dry_run" = true ]; then
      echo "  \$ cmux workspace-group create --name $(sq "$group") --cwd $(sq "$repo")"; group_ref="workspace_group:?"
    else
      group_ref="$(cmux workspace-group create --name "$group" --cwd "$repo" --json | jq -r '.group.ref // .ref')"
    fi
  fi
  group_args=(--group "$group_ref" --group-placement end)
fi

if [ "$launcher_makes_worktree" = false ] && ! grep -q '"WorktreeCreate"' "$HOME/.claude/settings.json" 2> /dev/null; then
  echo "warning: no WorktreeCreate hook in ~/.claude/settings.json — worktrees will land in .claude/worktrees and start bare (see contrib/worktree)" >&2
fi

origin_url="$(git -C "$repo" remote get-url origin)"
for issue in "${issues[@]}"; do
  case "$issue" in
    *[!0-9]*) echo "not an issue number: $issue" >&2; exit 1 ;;
  esac
  title="$(gh issue view "$issue" -R "$origin_url" --json title --jq .title)"
  echo "#$issue  $title"

  prompt="/forge-ship $guard $issue"
  [ -n "$trailing" ] && prompt="$prompt -- $trailing"
  cwd="$repo"
  if [ "$launcher_makes_worktree" = true ]; then
    if [ "$dry_run" = true ]; then
      echo "  \$ printf '{\"cwd\":\"%s\",\"name\":\"%s\"}' $(sq "$repo") $issue | $here/../worktree/create.sh"; cwd="<worktree>"
    else
      cwd="$(printf '{"cwd":"%s","name":"%s"}' "$repo" "$issue" | "$here/../worktree/create.sh")"
    fi
  fi
  agent="${agent_template//\{issue\}/$issue}"
  agent="${agent//\{label\}/$(sq "#$issue")}"
  agent="${agent//\{prompt\}/$(sq "$prompt")}"
  agent="${agent//\{worktree\}/$(sq "$cwd")}"

  run cmux new-workspace \
    --name "#$issue $(printf '%s' "$title" | cut -c1-48)" \
    --description "$title" \
    --cwd "$cwd" \
    --env "FORGE_STATUS_CMD=$status_cmd" \
    --env "FORGE_ISSUE=$issue" \
    --focus "$focus" \
    ${group_args[@]+"${group_args[@]}"} \
    --command "$agent"
  focus=false   # only the first workspace takes the view
done

echo "${#issues[@]} session(s) started. Worktrees live under ${FORGE_WORKTREE_ROOT:-$HOME/.forge/worktrees/$repo_name}."
[ "$launcher_makes_worktree" = true ] && echo "Remove one when done: printf '{\"worktree_path\":\"%s\"}' <path> | $here/../worktree/remove.sh" || echo "Claude offers to remove each worktree when its session exits."
exit 0
