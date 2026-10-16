#!/usr/bin/env bash
# Wait until every listed reviewer has reviewed the PR after its latest commit.
# See ../peer-review-wait.md.
#
# Usage: wait-reviews.sh [--since <ISO time>] <pr> <reviewer>...
#   Reviewers as the review-request API spells them (bots with a [bot] suffix).
#   --since: count only reviews and error posts after this time as well (the re-request time).
#   Polls 30 times, 30 seconds apart (FORGE_WAIT_TRIES and FORGE_WAIT_INTERVAL override).
#
# A review from a [bot] reviewer whose body says it "encountered an error and was
# unable to review" is an error post, not a review.
#
# Output: one line per reviewer still missing, then "missing: <n>".
#   <login>          no review at all
#   <login> earlier  reviewed only before the cutoff (the latest commit, or --since)
#   <login> errored  posted an error after the cutoff
# Exit: 0 all reviewed, 1 timed out, 2 a reviewer errored (stops at the first error post),
#       64 usage error.

set -u

usage() {
  echo "usage: wait-reviews.sh [--since <ISO time>] <pr> <reviewer>..." >&2
  exit 64
}

since=""
if [ "${1:-}" = "--since" ]; then
  [ "$#" -ge 2 ] || usage
  since="$2"
  shift 2
  case "$since" in
    "" | *[!0-9TZ:.+-]*) echo "wait-reviews.sh: not an ISO time: $since" >&2; exit 64 ;;
  esac
fi
[ "$#" -ge 1 ] || usage
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
bots=""
for reviewer in "$@"; do
  login="${reviewer%"[bot]"}"
  case "$login" in
    "" | *[!A-Za-z0-9._-]*)
      echo "wait-reviews.sh: not a login: $reviewer" >&2
      exit 64
      ;;
  esac
  want="$want${want:+, }\"$login\""
  [ "$login" != "$reviewer" ] && bots="$bots${bots:+, }\"$login\""
done

filter='
def errored: (.author.login as $a | ['"$bots"'] | any(. == $a))
  and ((.body // "") | test("encountered an error and was unable to review"; "i"));
([.commits[-1].committedDate, "'"$since"'"] | max) as $cutoff
| [.reviews[] | select(.submittedAt >= $cutoff)] as $recent
| ($recent | map(select(errored | not) | .author.login)) as $done
| ($recent | map(select(errored) | .author.login)) as $failed
| ([.reviews[] | select(.submittedAt < $cutoff and (errored | not)) | .author.login]) as $before
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
    if printf '%s' "$out" | grep -q ' errored$'; then
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
