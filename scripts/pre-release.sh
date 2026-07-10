#!/usr/bin/env bash
set -euo pipefail

# Full release gate: i18n:self, format, lint, clean, build, test, docs build,
# and production builds for every workspace example with a site build.
#
# Usage:
#   ./scripts/pre-release.sh
#   pnpm pre-release

function seconds2mmss()
{
  local seconds=$1
  local minutes=$((seconds / 60))
  local seconds=$((seconds % 60))
  printf "%02d:%02d" $minutes $seconds
}

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$REPO_ROOT"

# Build the package and check if all UI strings are translated
echo "================================================"
echo "Building the package and checking if all UI strings are translated ($(seconds2mmss $SECONDS))"
pnpm run build || exit 1
pnpm i18n:self || exit 1

# Format, lint, clean, build, test
echo "================================================"
echo "Formatting, linting, cleaning, building, and testing ($(seconds2mmss $SECONDS))"
pnpm run format || exit 1
pnpm run lint || exit 1
pnpm run clean || exit 1
pnpm run build || exit 1
pnpm test || exit 1

# Translate docs landing (docs/index.md) and theme JSON
echo "================================================"
echo "Translating docs landing (docs/index.md) ($(seconds2mmss $SECONDS))"
pnpm i18n:sync || exit 1

# Update heading ids and translate the docs
echo "================================================"
echo "Updating heading ids and translating the docs ($(seconds2mmss $SECONDS))"
pnpm i18n:update-headings || exit 1
pnpm i18n:translate:sync || exit 1

# Build the docs
echo "================================================"
echo "Building the docs ($SECONDS s)"
pnpm run docs:build || exit 1


# Build the examples to check if they are working

EXAMPLE_BUILDS=(
  examples/astro-docs:build
  examples/astro-website:build
  examples/console-app:start
  examples/fumadocs-docs:build
  examples/multi-provider:build
  examples/docusaurus-docs:build
  examples/nextjs-app:build
  examples/nextjs-app/docs-site:build
  examples/nextra-docs:build
  examples/vitepress-docs:docs:build
)

for spec in "${EXAMPLE_BUILDS[@]}"; do
  dir="${spec%%:*}"
  script="${spec#*:}"
  echo "================================================"
  echo "Building $dir ($script) ($(seconds2mmss $SECONDS))"
  pnpm --dir "$dir" run "$script" || exit 1
done

echo "================================================"
echo "Pre-release completed ($(seconds2mmss $SECONDS))"
echo "================================================"