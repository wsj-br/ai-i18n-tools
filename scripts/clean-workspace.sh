#!/usr/bin/env bash
set -euo pipefail

# Removes pnpm install and build artifacts across the monorepo workspace, plus
# temporary files matched by `ai-i18n-tools clean-temp` (*.log, *.tmp,
# cache.db.backup*.sqlite; see src/cli/clean-temp.ts).
# Does not touch committed lockfiles, live translation caches (cache.db), .env,
# or pipeline outputs such as translated-docs/.
#
# Usage:
#   ./scripts/clean-workspace.sh
#   ./scripts/clean-workspace.sh --dry-run

REPO_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/clean-workspace.sh [--dry-run]

Removes install and build artifacts produced by pnpm install / pnpm build:
  - node_modules/ (entire workspace)
  - dist/, build/, coverage/, .nyc_output/
  - Next.js: .next/, out/
  - Docusaurus: .docusaurus/
  - Astro: .astro/
  - src/build-info.generated.ts (from scripts/write-build-info.mjs)
  - TypeScript incremental caches (*.tsbuildinfo)
  - Temporary files (same as `ai-i18n-tools clean-temp`): *.log, *.tmp,
    cache.db.backup*.sqlite

Options:
  --dry-run  List paths that would be removed; do not delete anything.

After cleaning, run `pnpm install` to restore dependencies and rebuild the library (`prepare` runs when dist/ is missing).
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Run ./scripts/clean-workspace.sh --help" >&2
      exit 1
      ;;
  esac
done

# Directory basenames created by install or build tooling.
ARTIFACT_DIR_NAMES=(
  node_modules
  dist
  build
  coverage
  .nyc_output
  .next
  out
  .docusaurus
  .astro
)

# Single files at fixed paths (repo-relative).
ARTIFACT_FILES=(
  src/build-info.generated.ts
)

remove_path() {
  local target="$1"
  if [ ! -e "$target" ]; then
    return 0
  fi
  if [ "$DRY_RUN" = true ]; then
    echo "would remove: ${target#"$REPO_ROOT"/}"
    return 0
  fi
  rm -rf "$target"
  echo "removed: ${target#"$REPO_ROOT"/}"
}

echo "Cleaning workspace: $REPO_ROOT"
if [ "$DRY_RUN" = true ]; then
  echo "(dry run — nothing will be deleted)"
fi

for name in "${ARTIFACT_DIR_NAMES[@]}"; do
  while IFS= read -r -d '' dir; do
    remove_path "$dir"
  done < <(
    find "$REPO_ROOT" \
      -name "$name" \
      -type d \
      -not -path '*/node_modules/*' \
      -print0 2>/dev/null || true
  )
done

for rel in "${ARTIFACT_FILES[@]}"; do
  remove_path "$REPO_ROOT/$rel"
done

# Patterns aligned with matchesCleanTempBasename in src/cli/clean-temp.ts, plus *.tsbuildinfo.
while IFS= read -r -d '' file; do
  remove_path "$file"
done < <(
  find "$REPO_ROOT" \
    \( \
      -name '*.tsbuildinfo' \
      -o -name '*.log' \
      -o -name '*.tmp' \
      -o -name 'cache.db.backup*.sqlite' \
    \) \
    -type f \
    -not -path '*/node_modules/*' \
    -print0 2>/dev/null || true
)

if [ "$DRY_RUN" = true ]; then
  echo "Dry run complete."
else
  echo "Workspace clean complete. Run: pnpm install"
fi
