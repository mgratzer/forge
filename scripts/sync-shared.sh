#!/usr/bin/env bash
# Copies into every skill, as <skill>/_shared/, the files of skills/_shared/ (the
# source) that the skill refers to, directly or through another shared file, so each
# skill installs on its own (docs/architecture.md). Run after editing skills/_shared/
# or a skill's references to it.
#
#   scripts/sync-shared.sh           write the copies
#   scripts/sync-shared.sh --check   write nothing; print each stale copy, each
#                                    reference to a missing file, each unused file
set -euo pipefail
cd "$(dirname "$0")/.."

src=skills/_shared
root=$(cd "$src" && pwd -P)

# The shared files a path names, relative to $src: the file itself, or every file
# under it for a directory. Prints "!<path>" when nothing is there.
expand() {
	local p=$1 dir
	if [ -d "$p" ]; then
		find "$p" -type f | while read -r f; do expand "$f"; done
	elif [ -f "$p" ]; then
		dir=$(cd "$(dirname "$p")" && pwd -P)
		case "$dir/" in
		"$root/"*) echo "${dir#"$root"}/$(basename "$p")" | sed 's|^/||' ;;
		esac
	else
		echo "!$p"
	fi
}

# What a file refers to in the shared layer. Anywhere: a `_shared/<path>` token,
# which covers links from SKILL.md, ../_shared/ links from references/, and paths
# in prose or commands. In a shared file also: links relative to the file itself.
refs() {
	local f=$1 t
	{ grep -oE '_shared/[A-Za-z0-9_./-]+' "$f" || true; } | sed -e 's|^_shared/||' -e 's|[./]*$||' |
		while read -r t; do [ -n "$t" ] && expand "$src/$t"; done
	case "$f" in
	"$src"/*.md)
		{ grep -oE '\]\([^)<]+\)' "$f" || true; } | sed -e 's|^](||' -e 's|)$||' -e 's|#.*||' |
			while read -r t; do
				case "$t" in '' | *://* | mailto:*) continue ;; esac
				expand "$(dirname "$f")/$t"
			done
		;;
	esac
}

# Every shared file a skill needs: what its own files refer to, then what those
# refer to, until nothing new turns up.
closure() {
	local d=$1 seen="" queue
	queue=$(find "$d" -type f -not -path "${d}_shared/*" | while read -r f; do refs "$f"; done | sort -u)
	while [ -n "$queue" ]; do
		seen=$(printf '%s\n%s\n' "$seen" "$queue" | sed '/^$/d' | sort -u)
		queue=$(echo "$queue" | grep -v '^!' | grep '\.md$' | while read -r p; do refs "$src/$p"; done | sort -u |
			comm -23 - <(echo "$seen") || true)
	done
	echo "$seen"
}

# Writes a skill's copy to a directory and prints the references that name no file.
build() {
	local d=$1 dest=$2 p
	rm -rf "$dest"
	mkdir -p "$dest"
	closure "$d" | while read -r p; do
		case "$p" in
		'') ;;
		'!'*) echo "missing: ${d} refers to ${p#!}" ;;
		*)
			mkdir -p "$dest/$(dirname "$p")"
			cp -p "$src/$p" "$dest/$p"
			;;
		esac
	done
}

if [ "${1:-}" != --check ]; then
	status=0
	for d in skills/forge-*/; do
		missing=$(build "$d" "${d}_shared")
		[ -z "$missing" ] || { echo "$missing" >&2 && status=1; }
	done
	exit $status
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
for d in skills/forge-*/; do
	build "$d" "$tmp/$(basename "$d")"
	diff -rq "$tmp/$(basename "$d")" "${d}_shared" >/dev/null 2>&1 || echo "stale: ${d}_shared (run scripts/sync-shared.sh)"
done
# A shared file no skill reaches is installed nowhere
(cd "$src" && find . -type f | sed 's|^\./||') | while read -r p; do
	[ -n "$(find "$tmp" -path "*/$p" -print -quit)" ] || echo "unused: $src/$p"
done
