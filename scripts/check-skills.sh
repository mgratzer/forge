#!/usr/bin/env bash
# Structural checks for the skills (docs/testing.md). Prints each problem and
# exits 1 when there is one; prints nothing and exits 0 when healthy.
set -uo pipefail
cd "$(dirname "$0")/.."

problems=$(
	# Every skill bundles the shared layer through its own symlink
	for d in skills/forge-*/; do
		[ "$(readlink "${d}_shared")" = "../_shared" ] || echo "missing: ${d}_shared"
	done

	# No sibling-relative links: agents resolve .. from the install path
	grep -rn "\.\./_shared" skills/

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
