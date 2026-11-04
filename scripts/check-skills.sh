#!/usr/bin/env bash
# Structural checks for the skills (docs/testing.md). Prints each problem and
# exits 1 when there is one; prints nothing and exits 0 when healthy.
set -uo pipefail
cd "$(dirname "$0")/.."

problems=$(
	# Every skill bundles an exact copy of the shared layer
	for d in skills/forge-*/; do
		diff -rq skills/_shared "${d}_shared" >/dev/null 2>&1 || echo "stale: ${d}_shared (run scripts/sync-shared.sh)"
	done

	# Installers drop a symlink that leaves the skill and still report success
	find skills -type l | sed 's/^/symlink: /'

	# No sibling-relative links: agents resolve .. from the install path. From a
	# skill's subdirectory (references/), ../_shared/ is the skill's own copy.
	grep -rn "\.\./_shared" skills/_shared/ skills/forge-*/*.md
	find skills/forge-* -mindepth 2 -name '*.md' -exec grep -Hn "\.\./\.\./_shared" {} +

	# A shared file is read from <skill>/_shared/, where ../forge-*/ doesn't exist
	grep -rn "\.\./forge-" skills/_shared/

	# Each format the lens parses still parses from the file that defines it (needs Node 22.6+)
	node --experimental-strip-types --no-warnings scripts/check-lens-contract.ts 2>&1

	# Frontmatter `name` matches the directory, or installers skip the skill
	for f in skills/forge-*/SKILL.md; do
		dir=$(basename "$(dirname "$f")")
		grep -q "^name: ${dir}\$" "$f" || echo "$f: name is not ${dir}"
	done

	# A description with ": " must be quoted; installers parse YAML strictly
	grep -nE '^description: [^"'"'"'].*: ' skills/*/SKILL.md skills/_shared/roles/*.md
)

[ -z "$problems" ] && exit 0
echo "$problems"
exit 1
