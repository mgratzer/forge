#!/usr/bin/env bash
# Wait until every listed reviewer has reviewed the PR after its latest commit.
# See ../peer-review-wait.md.
#
# Usage: wait-reviews.sh <pr> <reviewer>...
#   Reviewers as the review-request API spells them (bots with a [bot] suffix).
#   Polls 30 times, 30 seconds apart (FORGE_WAIT_TRIES and FORGE_WAIT_INTERVAL override).
#
# A review whose body says the reviewer errored ("encountered an error",
# "unable to review this pull request") does not count.
#
# Output: one line per reviewer still missing, then "missing: <n>".
#   <login>          no review at all
#   <login> earlier  reviewed only before the latest commit
#   <login> errored  its latest review after the commit is an error post
# Exit: 0 all reviewed, 1 timed out, 2 everyone still missing errored (re-request them),
#       64 usage error.

set -u

if [ "$#" -lt 1 ]; then
  echo "usage: wait-reviews.sh <pr> <reviewer>..." >&2
  exit 64
fi
pr="$1"
shift
if [ "$#" -eq 0 ]; then
  echo "missing: 0"
  exit 0
fi

tries="${FORGE_WAIT_TRIES:-30}"
interval="${FORGE_WAIT_INTERVAL:-30}"

# Review authors appear without the [bot] suffix, so compare bare logins.
want=""
for reviewer in "$@"; do
  login="${reviewer%"[bot]"}"
  case "$login" in
    "" | *[!A-Za-z0-9._-]*)
      echo "wait-reviews.sh: not a login: $reviewer" >&2
      exit 64
      ;;
  esac
  want="$want${want:+, }\"$login\""
done

filter='
def errored: (.body // "") | test("encountered an error|unable to review this (pull request|PR)"; "i");
.commits[-1].committedDate as $push
| [.reviews[] | select(.submittedAt >= $push)] as $recent
| ($recent | map(select(errored | not) | .author.login)) as $done
| ($recent | map(select(errored) | .author.login)) as $failed
| ([.reviews[] | select(.submittedAt < $push and (errored | not)) | .author.login]) as $before
| ['"$want"'][] as $r
| select($done | any(. == $r) | not)
| if ($failed | any(. == $r)) then "\($r) errored"
  elif ($before | any(. == $r)) then "\($r) earlier"
  else $r end'

# Until the first successful call, everyone counts as missing.
out=$(printf '%s\n' "$@" | sed 's/\[bot\]$//')
i=0
while [ "$i" -lt "$tries" ]; do
  i=$((i + 1))
  if latest=$(gh pr view "$pr" --json commits,reviews --jq "$filter"); then
    out="$latest"
    missing=$(printf '%s' "$out" | grep -c .)
    if [ "$missing" -eq 0 ]; then
      echo "missing: 0"
      exit 0
    fi
    errored=$(printf '%s' "$out" | grep -c ' errored$')
    if [ "$errored" -eq "$missing" ]; then
      printf '%s\n' "$out"
      echo "missing: $missing"
      exit 2
    fi
  else
    echo "wait-reviews.sh: gh pr view failed, retrying" >&2
  fi
  [ "$i" -lt "$tries" ] && sleep "$interval"
done

printf '%s\n' "$out"
echo "missing: $(printf '%s' "$out" | grep -c .)"
exit 1
