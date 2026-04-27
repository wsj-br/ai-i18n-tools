#!/usr/bin/env bash
set -euo pipefail

# Creates a GitHub release from local CLI using:
# - tag/title: v<package.json version>
# - notes file: dev/RELEASE_NOTES_<version>.md
#
# If the tag (or a GitHub release for it) already exists, it is removed and
# the tag is recreated at the current HEAD, then pushed — so you can fix a
# mistaken tag or re-run the release after new commits.
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
  --dry-run            Validate and print planned steps; no deletes, tag, push, or release.
  --verify-clean=true  Require clean git working tree (default).
  --verify-clean=false Skip clean-tree check.

If tag v<version> or a GitHub release for it already exists, they are removed
and the tag is recreated at HEAD, then pushed to origin.
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

git remote get-url origin >/dev/null 2>&1 || fail "Remote 'origin' not configured."

HEAD_COMMIT="$(git rev-parse HEAD)"

remote_tag_exists() {
  [[ -n "$(git ls-remote origin "refs/tags/${TAG}")" ]]
}

local_tag_exists() {
  git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1
}

release_exists() {
  gh release view "$TAG" >/dev/null 2>&1
}

recreate_tag_at_head() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] HEAD commit: ${HEAD_COMMIT}"
    if release_exists; then
      echo "[dry-run] Would delete GitHub release: ${TAG}"
    fi
    if remote_tag_exists; then
      echo "[dry-run] Would delete remote tag: origin ${TAG}"
    fi
    if local_tag_exists; then
      echo "[dry-run] Would delete local tag: ${TAG}"
    fi
    echo "[dry-run] Would create annotated tag ${TAG} at HEAD and push to origin."
    return 0
  fi

  if release_exists; then
    echo "Deleting existing GitHub release ${TAG} (and its tag on the remote)..."
    gh release delete "$TAG" --yes --cleanup-tag
  elif remote_tag_exists; then
    echo "Deleting remote tag ${TAG}..."
    git push origin ":refs/tags/${TAG}"
  fi

  if local_tag_exists; then
    echo "Deleting local tag ${TAG}..."
    git tag -d "$TAG"
  fi

  echo "Creating annotated tag ${TAG} at HEAD (${HEAD_COMMIT})..."
  git tag -a "$TAG" -m "Release ${TAG}" HEAD

  echo "Pushing tag ${TAG} to origin..."
  git push origin "refs/tags/${TAG}"
}

recreate_tag_at_head

CMD=(gh release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE")

echo "Release inputs:"
echo "  Tag:        ${TAG}"
echo "  Title:      ${TAG}"
echo "  Notes file: ${NOTES_FILE}"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[dry-run] Would run:"
  printf '  %q' "${CMD[@]}"
  echo
  exit 0
fi

"${CMD[@]}"
echo "Release created successfully: ${TAG}"
