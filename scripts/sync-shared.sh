#!/usr/bin/env bash
# Copies skills/_shared/, the source, into every skill as <skill>/_shared/, so each
# skill installs on its own (docs/architecture.md). Run after editing skills/_shared/.
set -euo pipefail
cd "$(dirname "$0")/.."

for d in skills/forge-*/; do
	rm -rf "${d}_shared"
	cp -R skills/_shared "${d}_shared"
done
