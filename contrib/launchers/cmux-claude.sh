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
# <issue> is anything forge-ship accepts: a GitHub number or URL, a provider key or URL
# such as ENG-123 or https://linear.app/…/ENG-123/…, or a plan file path. Titles come from
# gh for GitHub Issues and from the first heading for plan files; other providers show the key.
#
# Options:
#   --repo <path>     repository root (default: the git toplevel of the current directory)
#   --no-guard        run forge-ship --unattended without --guard
#   --no-focus        leave the view where it is (default: focus the first workspace created)
#   --group <name>    sidebar group to file the workspaces under (default: "<repo-name> agents";
#                     created when missing, collapsible, keeps each workspace's pills visible)
#   --no-group        leave the workspaces ungrouped
#   --model <name>    Claude model for every session: an alias such as opus or sonnet, or a full
#                     model name (default: your Claude Code settings). Not valid with FORGE_AGENT.
#   --yes-skip-permissions
#                     run Claude with --dangerously-skip-permissions so sessions never stop at
#                     a permission prompt. Agents then act on Issue text unchecked — use only for
#                     Issues you trust, ideally in a sandbox. Not valid with FORGE_AGENT.
#   --dry-run         print every command instead of running it
#
# Environment:
#   FORGE_AGENT       agent command template. Placeholders: {issue} bare number, {label} quoted
#                     '#<issue>', {prompt} quoted prompt, {worktree} quoted path (created by the
#                     launcher when present). Default:
#                       claude -w {issue} --name {label} {prompt}
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
skip_permissions=false
model=""
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
    --model) model="$2"; shift ;;
    --yes-skip-permissions) skip_permissions=true ;;
    --) shift; trailing="$*"; break ;;
    -h|--help) sed -n '2,/^set /{/^set /!p;}' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "unknown option: $1" >&2; exit 1 ;;
    *)
      # Accept pasted lists too: "#782, #783 #784" → 782 783 784 (a bare # only survives inside quotes)
      for token in $(printf '%s' "$1" | tr ',' ' '); do
        token="${token#\#}"
        [ -z "$token" ] || issues+=("$token")
      done ;;
  esac
  shift
done

if [ ${#issues[@]} -eq 0 ]; then
  echo "no issues given" >&2
  echo "hint: an unquoted # starts a shell comment, so \`forge-launch #782, #783\` reaches the launcher empty —" >&2
  echo "      write \`forge-launch 782 783\` or quote the list: \`forge-launch '#782, #783'\`" >&2
  exit 1
fi
for tool in cmux gh jq claude; do command -v "$tool" > /dev/null || { echo "$tool not on PATH" >&2; exit 1; }; done

repo="${repo:-$(git rev-parse --show-toplevel)}"
repo_name="$(basename "$repo")"
status_cmd="$here/cmux-status.sh"

run() {
  if [ "$dry_run" = true ]; then
    printf '  $'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

# Single-quote a value for the shell that receives the workspace command.
sq() { printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"; }

agent_template="${FORGE_AGENT:-}"
if [ -n "$agent_template" ]; then
  [ "$skip_permissions" = false ] && [ -z "$model" ] || { echo "--model and --yes-skip-permissions apply only to the default Claude template; put the agent's own flags in FORGE_AGENT" >&2; exit 1; }
else
  agent_template="claude"
  [ "$skip_permissions" = false ] || agent_template="$agent_template --dangerously-skip-permissions"
  [ -z "$model" ] || agent_template="$agent_template --model $(sq "$model")"
  agent_template="$agent_template -w {issue} --name {label} {prompt}"
fi
launcher_makes_worktree=false
case "$agent_template" in *"{worktree}"*) launcher_makes_worktree=true ;; esac

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
  label=""
  # Derive what the workspace shows (label, title) and the worktree/session name (slug).
  case "$issue" in
    *[!0-9]*)
      case "$issue" in
        https://github.com/*/issues/*) slug="${issue##*/}"; label="#$slug" ;;
        http*) slug="$(printf '%s' "$issue" | grep -oE '[A-Za-z]+-[0-9]+' | head -n 1)"; slug="${slug:-${issue##*/}}" ;;
        *) [ -f "$issue" ] && slug="$(basename "${issue%.*}")" || slug="$issue" ;;
      esac
      slug="$(printf '%s' "$slug" | tr -c 'A-Za-z0-9._-' '-' | sed -E 's/-+$//')"
      if [ -f "$issue" ]; then
        title="$(sed -n 's/^# //p' "$issue" | head -n 1)"; title="${title:-$issue}"
      elif [ "$slug" != "$issue" ] && [ "${slug//[0-9]/}" = "" ]; then
        title="$(gh issue view "$slug" -R "$origin_url" --json title --jq .title)"
      else
        title="$slug"
      fi
      label="${label:-$slug}" ;;
    *)
      slug="$issue"; label="#$issue"
      title="$(gh issue view "$issue" -R "$origin_url" --json title --jq .title)" ;;
  esac
  echo "$label  $title"

  prompt="/forge-ship $guard $issue"
  [ -n "$trailing" ] && prompt="$prompt -- $trailing"
  cwd="$repo"
  if [ "$launcher_makes_worktree" = true ]; then
    if [ "$dry_run" = true ]; then
      echo "  \$ printf '{\"cwd\":\"%s\",\"name\":\"%s\"}' $(sq "$repo") $slug | $here/../worktree/create.sh"; cwd="<worktree>"
    else
      cwd="$(printf '{"cwd":"%s","name":"%s"}' "$repo" "$slug" | "$here/../worktree/create.sh")"
    fi
  fi
  agent="${agent_template//\{issue\}/$slug}"
  agent="${agent//\{label\}/$(sq "$label")}"
  agent="${agent//\{prompt\}/$(sq "$prompt")}"
  agent="${agent//\{worktree\}/$(sq "$cwd")}"

  run cmux new-workspace \
    --name "$label $(printf '%s' "$title" | cut -c1-48)" \
    --description "$title" \
    --cwd "$cwd" \
    --env "FORGE_STATUS_CMD=$status_cmd" \
    --env "FORGE_ISSUE=$slug" \
    --focus "$focus" \
    ${group_args[@]+"${group_args[@]}"} \
    --command "$agent"
  focus=false   # only the first workspace takes the view
done

echo "${#issues[@]} session(s) started. Worktrees live under ${FORGE_WORKTREE_ROOT:-$HOME/.forge/worktrees/$repo_name}."
[ "$launcher_makes_worktree" = true ] && echo "Remove one when done: printf '{\"worktree_path\":\"%s\"}' <path> | $here/../worktree/remove.sh" || echo "Claude offers to remove each worktree when its session exits."
exit 0
