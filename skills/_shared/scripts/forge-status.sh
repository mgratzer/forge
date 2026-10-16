#!/usr/bin/env bash
# Report a forge state transition. See ../status-reporting.md for the states.
# Usage: forge-status.sh <state> "<detail>"
# Calls $FORGE_STATUS_CMD when it is set; prints "[forge] <state>: <detail>" when it is
# unset or fails. Always exits 0, so a status call never stops a run.

state="${1:-}"
detail="${2:-}"
if [ -z "$state" ]; then
  echo 'usage: forge-status.sh <state> "<detail>"' >&2
  exit 0
fi

if [ -n "${FORGE_STATUS_CMD:-}" ] && "$FORGE_STATUS_CMD" "$state" "$detail"; then
  exit 0
fi
echo "[forge] $state: $detail"
exit 0
