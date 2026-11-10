#!/usr/bin/env bash
# pr-state.sh: reads the signals that decide whether a pull request is ready
# (pr-readiness.md). Mechanics only: it reports facts, and the skill decides
# what they mean for the PR. Needs bash 3.2+ and gh, nothing else (no jq).
#
# Usage: bash pr-state.sh <subcommand> [<PR>] [options]
#   <PR>            number or URL; left out, the current branch's PR
#   --me <login>    the agent's login (default: gh api user)
#
# Subcommands, and what each prints on stdout:
#
#   mergeable [<PR>]
#     "<mergeable> <mergeStateStatus>", e.g. "MERGEABLE CLEAN", "CONFLICTING DIRTY",
#     "MERGEABLE BEHIND". While either is UNKNOWN it asks again, 5 tries 10
#     seconds apart, then prints what it saw last.
#
#   ci-wait [<PR>] [--after-push] [--until <epoch>]
#     Waits until no check is pending, polling every 30 seconds, then prints
#     one word: pass | fail | pending (the cap came first) | none (no CI).
#     fail: a check is in gh's fail bucket. The cap is 60 minutes, or --until.
#     "No checks reported" means not registered yet until 3 minutes after the
#     head commit's time, or, with --after-push, after the wait first started;
#     after that it prints none.
#
#   failed-checks [<PR>]
#     One JSON object per check in the fail bucket, keys in this order:
#     {"name","workflow","link","run","attempt","base_run","base"}
#     workflow "" and run null: not an Actions job. attempt: the run's attempt.
#     base_run: the base branch's latest completed run of the same workflow.
#     base: that run's conclusion for the job of the same name, "missing" when
#     the run has no such job; base_run and base are null without such a run.
#
#   review-wait [<PR>] [--me <login>] [--since <ISO time>] [--until <epoch>]
#     Waits up to 15 minutes for reviews submitted since --since (default: the
#     head commit's time) by someone other than --me, then prints reviewed
#     (any of them reviewed), failed (all of them failed), or nothing when none
#     came.
#
#   reviews [<PR>] [--me <login>]
#     Every review by someone other than --me, oldest first, one JSON object
#     each: {"at","kind","login","message","state"}
#     kind: reviewed | failed. message: a failed review's could-not-review
#     message; null otherwise.
#
#   feedback [<PR>] [--me <login>]
#     Open feedback, one JSON object each:
#     {"comments":[{"author","body","url"}],"decision","id","kind":"thread","line","outdated","path"}
#     {"author","body","bot","decision","kind":"comment"|"review","state","url"}
#     decision: the item (or a thread's last comment) is our "Needs your
#     decision:" reply. Left out: resolved threads, threads whose last comment
#     is ours, comments and review bodies a comment of ours links by URL,
#     empty bodies, hidden comments, dismissed reviews.
#
# Ours: written by --me and ending with the <!-- forge --> marker.
# The waits print their deadline on stderr when they start: re-run a call that
# timed out with that --until, so the cap counts in total.
# Exit status: 0 with a result, 1 on a usage error, 2 when gh fails (its
# message is on stderr).
set -u

# Bot reviewers whose could-not-review message the script recognizes, one JSON
# object each: the login as gh prints it (no [bot] suffix); "failed", a regex
# for the start of a review body that holds that message (\A and \z only, so
# gh's RE2 and the tests' Oniguruma read it alike); "findings", a marker that,
# also present, means the review delivered findings anyway, so it reads as
# reviewed. A reviewer not listed always reads as reviewed. Add one when it
# starts failing reviews.
REVIEWERS='[
  {
    "login": "copilot-pull-request-reviewer",
    "failed": "\\A(>[^\\n]*\\n> )?Copilot (encountered an error|was unable to (review|complete this review))",
    "findings": "<!-- ccr-overview"
  }
]'

CI_CAP=3600       # 60 minutes, re-runs included
CI_GRACE=180      # a push's checks register within 3 minutes
REVIEW_CAP=900    # 15 minutes
POLL=30
GH_TRIES=3        # consecutive gh failures a wait tolerates

usage() {
	sed -n '2,/^set -u/p' "$0" | sed '$d' >&2
	exit 1
}

# A string as a JSON literal
jstr() {
	local s=$1
	s=${s//\\/\\\\}
	s=${s//\"/\\\"}
	printf '"%s"' "$s"
}

# The definitions every filter shares
defs() {
	printf 'def me: %s; def since: %s; def reviewers: %s;\n' "$(jstr "$ME")" "$(jstr "$SINCE")" "$REVIEWERS"
	cat <<'JQ'
def login: (.author // {}).login;
def ours: login == me and ((.body // "") | test("<!-- forge -->\\s*\\z"));
def decision: ours and (.body | contains("Needs your decision:"));
def kind:
  login as $l | (.body // "") as $b
  | (reviewers | map(select(.login == $l)) | first) as $r
  | if $r != null and ($b | test($r.failed)) and ($r.findings == null or ($b | contains($r.findings) | not))
    then "failed" else "reviewed" end;
def message:
  (.body // "") | split("\n") | map(sub("\\A>\\s?"; ""))
  | map(select(test("\\S") and (startswith("[!") | not))) | first;
JQ
}

F_CI='[.[].bucket] | if any(. == "pending") then "pending" elif any(. == "fail") then "fail" else "pass" end'

F_REVIEW_WAIT='(if since == "" then .commits[-1].committedDate else since end) as $since
| [.reviews[] | select((.submittedAt // "") >= $since and login != me) | kind]
| if any(. == "reviewed") then "reviewed" elif length > 0 then "failed" else empty end'

F_REVIEWS='[.reviews[] | select(login != me) | kind as $k
    | {at: .submittedAt, login: login, kind: $k, state: .state,
       message: (if $k == "reviewed" then null else message end)}]
| sort_by(.at) | .[]'

F_FEEDBACK='.data.repository.pullRequest
| [.comments.nodes[] | select(ours) | .body] as $replies
| (.reviewThreads.nodes[]
    | select(.isResolved == false and (.comments.nodes[-1] | (ours | not) or decision))
    | {kind: "thread", id, path, line, outdated: .isOutdated,
       decision: (.comments.nodes[-1] | decision),
       comments: [.comments.nodes[] | {author: login, body, url}]}),
  ((.comments.nodes[] | {kind: "comment"} + .), (.reviews.nodes[] | {kind: "review"} + .)
    | .url as $url
    | select(.body != "" and (.isMinimized | not) and .state != "DISMISSED"
        and ((ours | not) or decision) and all($replies[]; contains($url) | not))
    | {kind, url, author: login, bot: ((.author // {}).__typename == "Bot"),
       state, decision: decision, body})'

Q_FEEDBACK='query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          isOutdated
          path
          line
          id
          comments(last: 20) {
            nodes { id body author { login } url }
          }
        }
      }
      comments(last: 100) {
        nodes { body url isMinimized author { login __typename } }
      }
      reviews(last: 100) {
        nodes { body url state isMinimized author { login __typename } }
      }
    }
  }
}'

# Resolves <PR> to its number, URL, host and repository
resolve() {
	local line rest
	line=$(gh pr view ${PR:+"$PR"} --json number,url --jq '"\(.number) \(.url)"') || exit 2
	NUM=${line%% *}
	URL=${line#* }
	rest=${URL#*://}
	HOST=${rest%%/*}
	rest=${rest#*/}
	OWNER=${rest%%/*}
	rest=${rest#*/}
	REPO=${rest%%/*}
}

need_me() {
	[ -n "$ME" ] || ME=$(gh api user --hostname "$HOST" --jq .login) || exit 2
}

# One poll inside a wait: retries a failing gh call, then gives up with exit 2.
# Leaves stdout in POLL_OUT; "no checks reported" is an answer, not a failure.
poll() {
	local tries=0
	while :; do
		POLL_OUT=$(gh "$@" 2>"$ERR") && return 0
		[ -n "$POLL_OUT" ] && return 0
		grep -q 'no checks reported' "$ERR" && return 0
		tries=$((tries + 1))
		[ "$tries" -lt "$GH_TRIES" ] || { cat "$ERR" >&2; exit 2; }
		sleep "$POLL"
	done
}

cmd_mergeable() {
	local r i=1
	while :; do
		r=$(gh pr view "$URL" --json mergeable,mergeStateStatus --jq '"\(.mergeable) \(.mergeStateStatus)"') || exit 2
		case $r in *UNKNOWN*) ;; *) break ;; esac
		[ "$i" -lt 5 ] || break
		i=$((i + 1))
		sleep 10
	done
	echo "$r"
}

cmd_ci_wait() {
	local start until grace head now
	start=$(date +%s)
	until=${UNTIL:-$((start + CI_CAP))}
	grace=0
	[ -z "$AFTER_PUSH" ] || grace=$((until - CI_CAP + CI_GRACE))
	head=""
	echo "pr-state: ci-wait until $until (re-run a timed-out call with --until $until)" >&2
	while :; do
		poll pr checks "$URL" --json bucket --jq "$F_CI"
		now=$(date +%s)
		case $POLL_OUT in
		pass | fail)
			echo "$POLL_OUT"
			return
			;;
		pending)
			[ "$now" -lt "$until" ] || { echo pending; return; }
			;;
		*)
			if [ -z "$head" ]; then
				head=$(gh pr view "$URL" --json commits --jq '.commits[-1].committedDate | fromdateiso8601 | floor') || exit 2
				[ $((head + CI_GRACE)) -le "$grace" ] || grace=$((head + CI_GRACE))
			fi
			[ "$now" -lt "$grace" ] || { echo none; return; }
			;;
		esac
		sleep "$POLL"
	done
}

cmd_failed_checks() {
	local base list name workflow link run attempt base_run conclusion us
	us=$'\037'
	base=$(gh pr view "$URL" --json baseRefName --jq .baseRefName) || exit 2
	list=$(gh pr checks "$URL" --json name,bucket,workflow,link \
		--jq ".[] | select(.bucket == \"fail\") | [.name, (.workflow // \"\"), (.link // \"\")] | join(\"\\u001f\")" 2>"$ERR")
	if [ -z "$list" ]; then
		grep -q 'no checks reported' "$ERR" && return 0
		[ -s "$ERR" ] && { cat "$ERR" >&2; exit 2; }
		return 0
	fi
	while IFS=$us read -r name workflow link; do
		[ -n "$name" ] || continue
		run=null attempt=null base_run=null conclusion=null
		case $link in */actions/runs/*)
			run=${link#*/actions/runs/}
			run=${run%%/*}
			case $run in "" | *[!0-9]*) run=null ;; esac
			;;
		esac
		if [ -n "$workflow" ] && [ "$run" != null ]; then
			attempt=$(gh run view "$run" -R "$HOST/$OWNER/$REPO" --json attempt --jq .attempt) || attempt=null
			base_run=$(gh run list -R "$HOST/$OWNER/$REPO" --branch "$base" --workflow "$workflow" \
				--status completed --limit 1 --json databaseId --jq '.[0].databaseId // empty') || base_run=""
			if [ -n "$base_run" ]; then
				conclusion=$(gh run view "$base_run" -R "$HOST/$OWNER/$REPO" --json jobs \
					--jq "[.jobs[] | select(.name == $(jstr "$name")) | .conclusion] | first // \"missing\"") || conclusion=""
				if [ -n "$conclusion" ]; then conclusion=$(jstr "$conclusion"); else conclusion=null; fi
			else
				base_run=null
			fi
		fi
		printf '{"name":%s,"workflow":%s,"link":%s,"run":%s,"attempt":%s,"base_run":%s,"base":%s}\n' \
			"$(jstr "$name")" "$(jstr "$workflow")" "$(jstr "$link")" "$run" "${attempt:-null}" "$base_run" "$conclusion"
	done <<EOF
$list
EOF
}

cmd_review_wait() {
	local until filter
	need_me
	until=${UNTIL:-$(($(date +%s) + REVIEW_CAP))}
	filter="$(defs)$F_REVIEW_WAIT"
	echo "pr-state: review-wait until $until (re-run a timed-out call with --until $until)" >&2
	while :; do
		poll pr view "$URL" --json commits,reviews --jq "$filter"
		[ -z "$POLL_OUT" ] || { echo "$POLL_OUT"; return; }
		[ "$(date +%s)" -lt "$until" ] || return 0
		sleep "$POLL"
	done
}

cmd_reviews() {
	need_me
	gh pr view "$URL" --json reviews --jq "$(defs)$F_REVIEWS" || exit 2
}

cmd_feedback() {
	need_me
	gh api graphql --hostname "$HOST" -f owner="$OWNER" -f repo="$REPO" -F pr="$NUM" \
		-f query="$Q_FEEDBACK" --jq "$(defs)$F_FEEDBACK" || exit 2
}

CMD=${1:-}
[ $# -eq 0 ] || shift
PR="" ME="" SINCE="" UNTIL="" AFTER_PUSH=""
if [ $# -gt 0 ] && [ "${1#--}" = "$1" ]; then
	PR=$1
	shift
fi
while [ $# -gt 0 ]; do
	case $1 in
	--me | --since | --until)
		[ $# -ge 2 ] || usage
		case $1 in
		--me) ME=$2 ;;
		--since) SINCE=$2 ;;
		--until) UNTIL=$2 ;;
		esac
		shift 2
		;;
	--after-push)
		AFTER_PUSH=1
		shift
		;;
	*) usage ;;
	esac
done
case $UNTIL in *[!0-9]*) usage ;; esac

ERR=$(mktemp "${TMPDIR:-/tmp}/pr-state.XXXXXX") || exit 2
trap 'rm -f "$ERR"' EXIT

case $CMD in
mergeable | ci-wait | failed-checks | review-wait | reviews | feedback) resolve ;;
*) usage ;;
esac

case $CMD in
mergeable) cmd_mergeable ;;
ci-wait) cmd_ci_wait ;;
failed-checks) cmd_failed_checks ;;
review-wait) cmd_review_wait ;;
reviews) cmd_reviews ;;
feedback) cmd_feedback ;;
esac
