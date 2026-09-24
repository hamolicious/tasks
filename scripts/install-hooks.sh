#!/usr/bin/env bash
#
# Point this clone's git hooks at the tracked `.githooks/` directory.
#
# `core.hooksPath` is per-clone local config, not something git can carry in a repository,
# so every clone runs this once. What it buys: `.gitlab-ci.yml` is regenerated from the
# plugin manifests on every commit instead of being hand-maintained.

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

git config core.hooksPath .githooks
chmod +x .githooks/* 2> /dev/null || true

echo "core.hooksPath -> .githooks"
echo "hooks installed:"
for hook in .githooks/*; do
  [ -f "$hook" ] && echo "  $(basename "$hook")"
done
