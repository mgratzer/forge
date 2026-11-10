#!/usr/bin/env bash
# Runs skills/_shared/scripts/pr-state.sh against the cases in
# scripts/fixtures/pr-state/, with stand-ins for gh, sleep and date: no network,
# no waiting. Prints each failing case, and nothing when all pass.
#
# A case is a directory holding:
#   cmd                   the arguments to pr-state.sh, split on whitespace
#   out                   the expected stdout (absent: empty)
#   status                the expected exit status (absent: 0)
#   calls                 optional "<key> <count>" lines: how often gh answered <key>
#   clock                 optional start time in epoch seconds (default 1793890000)
#   <key>[.<n>].json      gh's answer to the call named <key>, for its nth call or any;
#   <key>[.<n>].err       or its error message (gh then exits 1)
# <key> is gh's first two arguments and its --json fields: pr.view.number,url.
# A key missing from the case is read from _default/. The gh stand-in applies
# --jq with jq -rcS, since gh's own jq prints sorted keys.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

command -v jq >/dev/null || {
	echo "pr-state tests: jq not found (the gh stand-in needs it)"
	exit 1
}

script=skills/_shared/scripts/pr-state.sh
fixtures=$PWD/scripts/fixtures/pr-state
tmp=$(mktemp -d "${TMPDIR:-/tmp}/pr-state-test.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/bin"

cat >"$tmp/bin/gh" <<'STUB'
#!/usr/bin/env bash
key="$1.$2" prev="" filter="" fields=""
for a in "$@"; do
	case $prev in --jq) filter=$a ;; --json) fields=$a ;; esac
	prev=$a
done
[ -z "$fields" ] || key="$key.$fields"
n=$(($(cat "$STATE/$key.count" 2>/dev/null || echo 0) + 1))
echo "$n" >"$STATE/$key.count"
for f in "$CASE/$key.$n" "$CASE/$key" "$FIXTURES/_default/$key"; do
	[ -f "$f.err" ] && { cat "$f.err" >&2; exit 1; }
	[ -f "$f.json" ] || continue
	if [ -n "$filter" ]; then jq -rcS "$filter" "$f.json"; else cat "$f.json"; fi
	exit
done
echo "gh stand-in: no answer for $key" >&2
exit 1
STUB

cat >"$tmp/bin/sleep" <<'STUB'
#!/usr/bin/env bash
echo $(($(cat "$STATE/clock") + $1)) >"$STATE/clock"
STUB

cat >"$tmp/bin/date" <<'STUB'
#!/usr/bin/env bash
if [ "$*" = "+%s" ]; then cat "$STATE/clock"; else exec /bin/date "$@"; fi
STUB

chmod +x "$tmp/bin/gh" "$tmp/bin/sleep" "$tmp/bin/date"

run_cases() {
	for dir in "$fixtures"/*/; do
		name=$(basename "$dir")
		[ "$name" = _default ] && continue
		state="$tmp/$name"
		mkdir "$state"
		cat "$dir/clock" 2>/dev/null >"$state/clock" || echo 1793890000 >"$state/clock"

		# shellcheck disable=SC2046 # cmd is split on whitespace on purpose
		got=$(CASE="${dir%/}" FIXTURES="$fixtures" STATE="$state" PATH="$tmp/bin:$PATH" \
			bash "$script" $(cat "$dir/cmd") 2>"$state/stderr")
		status=$?

		want=$(cat "$dir/out" 2>/dev/null)
		[ "$got" = "$want" ] || {
			echo "pr-state test $name: stdout differs"
			diff <(echo "$want") <(echo "$got") | sed 's/^/  /'
			sed 's/^/  stderr: /' "$state/stderr"
		}
		want_status=$(cat "$dir/status" 2>/dev/null || echo 0)
		[ "$status" = "$want_status" ] || echo "pr-state test $name: exit status $status, expected $want_status"

		[ -f "$dir/calls" ] && while read -r key count; do
			calls=$(cat "$state/$key.count" 2>/dev/null || echo 0)
			[ "$calls" = "$count" ] || echo "pr-state test $name: gh answered $key $calls times, expected $count"
		done <"$dir/calls"
	done
}

problems=$(run_cases)
[ -z "$problems" ] && exit 0
echo "$problems"
exit 1
