#!/usr/bin/env bash
# FORGE_STATUS_CMD implementation for cmux: a sidebar pill per state, a progress bar,
# and a notification on terminal states. Called by skills as: cmux-status.sh <state> "<detail>"
# See skills/_shared/status-reporting.md for the state table.
set -u

state="${1:-unknown}"
detail="${2:-}"
label="${FORGE_ISSUE:+#$FORGE_ISSUE }"

case "$state" in
  implementing) icon=hammer;    color="#ff9500"; progress=0.2 ;;
  reviewing)    icon=eye;       color="#af52de"; progress=0.5 ;;
  waiting)      icon=clock;     color="#8e8e93"; progress=0.7 ;;
  addressing)   icon=wrench;    color="#ff9500"; progress=0.8 ;;
  pushed)       icon=checkmark; color="#34c759"; progress=1.0 ;;
  review-ready) icon=checkmark; color="#34c759"; progress=1.0 ;;
  needs-human)  icon=hand;      color="#ff3b30"; progress=1.0 ;;
  failed)       icon=xmark;     color="#ff3b30"; progress=1.0 ;;
  *)            icon=circle;    color="#8e8e93"; progress=0.0 ;;
esac

echo "[forge] $state: $detail"
command -v cmux > /dev/null || exit 0

cmux set-status forge "$state" --icon "$icon" --color "$color" --priority 90 > /dev/null 2>&1 || true
cmux set-progress "$progress" --label "$state" > /dev/null 2>&1 || true
case "$state" in
  pushed|review-ready|needs-human|failed)
    cmux notify --title "${label}${state}" --body "${detail:-$state}" > /dev/null 2>&1 || true ;;
esac
