#!/usr/bin/env bash
# Capture a headless screenshot of the Translation Dashboard for docs.
#
# Writes docs/public/translation-dashboard.png (English UI only; single capture).
#
# Prerequisites: built CLI (`pnpm build`), `chromium-headless-shell`.
# By default this script starts `ai-i18n-tools dashboard --no-open`, waits for
# HTTP, captures, then stops the server. If the dashboard is already running,
# set BASE_URL (and optionally SKIP_DASHBOARD_START=1).
#
# Usage:
#   ./scripts/screenshot-translation-dashboard.sh
#   BASE_URL=http://127.0.0.1:8675 SKIP_DASHBOARD_START=1 ./scripts/screenshot-translation-dashboard.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CLI="${ROOT}/dist/cli/index.js"
OUT="${ROOT}/docs/public/translation-dashboard.png"
PORT="${PORT:-8675}"
if [[ -z "${BASE_URL+x}" ]]; then
  BASE_URL="http://127.0.0.1:${PORT}/"
  AUTO_START_DASHBOARD=1
else
  AUTO_START_DASHBOARD=0
fi
VIRTUAL_TIME_MS="${VIRTUAL_TIME_MS:-8000}"
WINDOW_SIZE="${WINDOW_SIZE:-1300,900}"

declare -r CHROME_BIN="${CHROME_BIN:-chromium-headless-shell}"

DASHBOARD_PID=""

cleanup() {
  if [[ -n "${DASHBOARD_PID}" ]] && kill -0 "${DASHBOARD_PID}" 2>/dev/null; then
    kill "${DASHBOARD_PID}" 2>/dev/null || true
    wait "${DASHBOARD_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

command -v curl >/dev/null 2>&1 || {
  echo "error: curl is required" >&2
  exit 1
}
command -v "${CHROME_BIN}" >/dev/null 2>&1 || {
  echo "error: ${CHROME_BIN} not found (set CHROME_BIN if needed)" >&2
  exit 1
}

[[ -f "${CLI}" ]] || {
  echo "error: ${CLI} missing — run pnpm build from the repo root" >&2
  exit 1
}

wait_for_url() {
  local url=$1
  local attempts="${2:-60}"
  while (( attempts-- > 0 )); do
    if curl -sf -o /dev/null "${url}" 2>/dev/null; then
      return 0
    fi
    sleep 0.5
  done
  echo "error: dashboard not reachable at ${url}" >&2
  return 1
}

if [[ "${SKIP_DASHBOARD_START:-}" != "1" && "${AUTO_START_DASHBOARD}" == "1" ]]; then
  echo "Starting dashboard on port ${PORT}…"
  (
    cd "${ROOT}"
    node "${CLI}" dashboard -p "${PORT}" --no-open
  ) &
  DASHBOARD_PID=$!
fi

wait_for_url "${BASE_URL}"

mkdir -p "$(dirname "${OUT}")"
echo "Capturing ${OUT} from ${BASE_URL}"

"${CHROME_BIN}" \
  --disable-gpu \
  --screenshot="${OUT}" \
  --window-size="${WINDOW_SIZE}" \
  --virtual-time-budget="${VIRTUAL_TIME_MS}" \
  "${BASE_URL}"

echo "Done: ${OUT}"
