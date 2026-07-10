#!/usr/bin/env bash
set -euo pipefail

# Build the library, run cleanup on the repo root, then cleanup every example
# under examples/ except examples/multi-provider.
#
# Usage:
#   ./scripts/update-all.sh
#   pnpm update-all

function seconds2mmss()
{
  local seconds=$1
  local minutes=$((seconds / 60))
  local seconds=$((seconds % 60))
  printf "%02d:%02d" $minutes $seconds
}

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$REPO_ROOT"

echo "================================================"
echo "Building the package"
pnpm build || exit 1

echo "================================================"
echo "Cleaning up the repository root ($(seconds2mmss $SECONDS))"
node bin/ai-i18n-tools.mjs cleanup || exit 1

for d in examples/*/; do
  ( 
    if [ "$d" == "examples/multi-provider/" ]; then
      exit 0
    fi
    echo "================================================"
    echo "Cleaning up $d ($(seconds2mmss $SECONDS))"
    cd "$d"
    node ../../bin/ai-i18n-tools.mjs cleanup
  ) || exit 1
done

echo "================================================"
echo "Removing temporary files ($(seconds2mmss $SECONDS))"
node bin/ai-i18n-tools.mjs clean-temp --force || exit 1


echo "================================================"
echo "Update all completed ($(seconds2mmss $SECONDS))"
echo "================================================"