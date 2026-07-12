#!/usr/bin/env bash
set -euo pipefail

# Triggers the "Deploy Docs" GitHub Actions workflow (workflow_dispatch).
#
# Usage:
#   ./scripts/publish-docs.sh
#   ./scripts/publish-docs.sh --ref main
#   ./scripts/publish-docs.sh --watch

REF=""
WATCH=false
WORKFLOW="docs.yml"

for arg in "$@"; do
  case "$arg" in
    --ref=*) REF="${arg#*=}" ;;
    --watch) WATCH=true ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/publish-docs.sh [--ref=<branch>] [--watch]

Triggers the Deploy Docs workflow (.github/workflows/docs.yml) on GitHub.

Options:
  --ref=<branch>  Branch or tag to build and deploy (default: current branch).
  --watch         Wait for the workflow run to finish (gh run watch <run-id>).

GitHub builds the remote ref — push your branch before running if needed.
EOF
      exit 0
      ;;
    --ref)
      echo "Error: use --ref=<branch> (e.g. --ref=main)" >&2
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

latest_run_id() {
  sleep 2
  gh run list --workflow="$WORKFLOW" --limit 1 --json databaseId -q '.[0].databaseId'
}

require_cmd gh
require_cmd git

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Not inside a git repository."
gh auth status >/dev/null 2>&1 || fail "GitHub CLI is not authenticated. Run: gh auth login"

if [[ -z "$REF" ]]; then
  REF="$(git branch --show-current)"
  [[ -n "${REF:-}" ]] || fail "Detached HEAD; pass --ref=<branch>"
fi

echo "Triggering Deploy Docs workflow on ref: ${REF}"
gh workflow run "$WORKFLOW" --ref "$REF"

RUN_ID="$(latest_run_id)"
[[ -n "$RUN_ID" && "$RUN_ID" != "null" ]] || fail "Could not find the workflow run."

if [[ "$WATCH" == "true" ]]; then
  gh run watch "$RUN_ID"
  exit 0
fi

echo ""
echo "Workflow triggered. Track progress:"
echo "  gh run watch ${RUN_ID}"
echo "  ./scripts/publish-docs.sh --ref=${REF} --watch"
echo "  https://github.com/wsj-br/ai-i18n-tools/actions/workflows/docs.yml"
