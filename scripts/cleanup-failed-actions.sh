#!/usr/bin/env bash
set -euo pipefail

# Delete failed / cancelled / timed-out / startup_failure GitHub Actions runs
# for the current repository.
#
# Usage:
#   ./scripts/cleanup-failed-actions.sh
#   ./scripts/cleanup-failed-actions.sh --dry-run
#   ./scripts/cleanup-failed-actions.sh --yes
#   pnpm actions:cleanup
#   pnpm actions:cleanup:dry

DRY_RUN=false
YES=false
LIMIT=1000

# Conclusions treated as "failed or stopped".
CONCLUSIONS=(failure cancelled timed_out startup_failure)

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -y|--yes) YES=true ;;
    --limit=*) LIMIT="${arg#*=}" ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/cleanup-failed-actions.sh [--dry-run] [--yes] [--limit=N]

Deletes GitHub Actions workflow runs whose conclusion is failure, cancelled,
timed_out, or startup_failure, plus any runs still in cancelled status.

Options:
  --dry-run     List matching runs without deleting them.
  -y, --yes     Delete without an interactive confirmation prompt.
  --limit=N     Max runs to scan per query (default: 1000).
  -h, --help    Show this help.

Requires GitHub CLI (`gh`) authenticated for this repository (`gh auth login`).
EOF
      exit 0
      ;;
    --limit)
      echo "Error: use --limit=<N> (e.g. --limit=500)" >&2
      exit 1
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
require_cmd sort
require_cmd uniq

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Not inside a git repository."
gh auth status >/dev/null 2>&1 || fail "GitHub CLI is not authenticated. Run: gh auth login"

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
[[ -n "${REPO:-}" ]] || fail "Could not resolve GitHub repository (is the remote configured?)."

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

for conclusion in "${CONCLUSIONS[@]}"; do
  gh run list \
    --repo "$REPO" \
    --limit "$LIMIT" \
    --status completed \
    --json databaseId,conclusion,displayTitle,workflowName,createdAt \
    -q ".[] | select(.conclusion==\"${conclusion}\") | [.databaseId, .conclusion, .workflowName, .displayTitle, .createdAt] | @tsv" \
    >>"$tmp" || true
done

# Runs that never finished as completed (cancelled / stopped mid-flight).
gh run list \
  --repo "$REPO" \
  --limit "$LIMIT" \
  --status cancelled \
  --json databaseId,conclusion,displayTitle,workflowName,createdAt,status \
  -q '.[] | [.databaseId, (.conclusion // .status), .workflowName, .displayTitle, .createdAt] | @tsv' \
  >>"$tmp" || true

if [[ ! -s "$tmp" ]]; then
  echo "No failed or stopped Actions runs found in ${REPO}."
  exit 0
fi

# Unique by run id (column 1), stable order.
mapfile -t rows < <(sort -u -k1,1 "$tmp")
count="${#rows[@]}"

echo "Found ${count} failed/stopped Actions run(s) in ${REPO}:"
echo ""
printf '%s\n' "${rows[@]}" | while IFS=$'\t' read -r id conclusion workflow title created; do
  printf '  %-12s  %-14s  %-20s  %s  (%s)\n' "$id" "$conclusion" "$workflow" "$title" "$created"
done
echo ""

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run — nothing deleted. Run pnpm actions:cleanup to delete."
  exit 0
fi

if [[ "$YES" != "true" ]]; then
  if [[ ! -t 0 ]]; then
    fail "Refusing to delete without --yes when stdin is not a TTY."
  fi
  read -r -p "Delete these ${count} run(s)? [y/N] " answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *)
      echo "Aborted."
      exit 0
      ;;
  esac
fi

ok=0
fail_count=0
for row in "${rows[@]}"; do
  id="${row%%$'\t'*}"
  if gh run delete "$id" --repo "$REPO" >/dev/null; then
    echo "Deleted ${id}"
    ok=$((ok + 1))
  else
    echo "Failed to delete ${id}" >&2
    fail_count=$((fail_count + 1))
  fi
done

echo ""
echo "Deleted: ${ok}, Failed: ${fail_count}"
[[ "$fail_count" -eq 0 ]] || exit 1
