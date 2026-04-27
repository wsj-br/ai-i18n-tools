#!/usr/bin/env bash
set -euo pipefail

# Creates a GitHub release from local CLI using:
# - tag/title: v<package.json version>
# - notes file: dev/RELEASE_NOTES_<version>.md
#
# Usage:
#   ./scripts/release.sh
#   ./scripts/release.sh --dry-run
#   ./scripts/release.sh --verify-clean=false

VERIFY_CLEAN=true
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --verify-clean=false) VERIFY_CLEAN=false ;;
    --verify-clean=true) VERIFY_CLEAN=true ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/release.sh [--dry-run] [--verify-clean=true|false]

Options:
  --dry-run            Validate checks and print the release command without executing it.
  --verify-clean=true  Require clean git working tree (default).
  --verify-clean=false Skip clean-tree check.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

fail() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd gh
require_cmd git
require_cmd node

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Not inside a git repository."
gh auth status >/dev/null 2>&1 || fail "GitHub CLI is not authenticated. Run: gh auth login"

[[ -f package.json ]] || fail "package.json not found in current directory."
VERSION="$(node -p "require('./package.json').version" 2>/dev/null || true)"
[[ -n "${VERSION:-}" ]] || fail "Could not read package.json version."

TAG="v${VERSION}"
NOTES_FILE="dev/RELEASE_NOTES_${VERSION}.md"

[[ -f "$NOTES_FILE" ]] || fail "Release notes file not found: $NOTES_FILE"

if [[ "$VERIFY_CLEAN" == "true" ]] && [[ -n "$(git status --porcelain)" ]]; then
  fail "Working tree is not clean. Commit/stash changes or run with --verify-clean=false"
fi

git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1 || fail "Local tag ${TAG} does not exist."
git remote get-url origin >/dev/null 2>&1 || fail "Remote 'origin' not configured."

if ! git ls-remote --exit-code --tags origin "refs/tags/${TAG}" >/dev/null 2>&1; then
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] Would push missing tag to origin: ${TAG}"
  else
    echo "Tag ${TAG} not found on origin. Pushing tag..."
    git push origin "refs/tags/${TAG}"
  fi
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  fail "Release ${TAG} already exists on GitHub."
fi

CMD=(gh release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE")

echo "Release inputs:"
echo "  Tag:        ${TAG}"
echo "  Title:      ${TAG}"
echo "  Notes file: ${NOTES_FILE}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[dry-run] Checks passed. Would run:"
  printf '  %q' "${CMD[@]}"
  echo
  exit 0
fi

"${CMD[@]}"
echo "Release created successfully: ${TAG}"
