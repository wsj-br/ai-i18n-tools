#!/usr/bin/env bash
# Capture headless screenshots of the Next.js example home page for
# `sourceLocale` plus each `targetLocales` entry in `ai-i18n-tools.config.json`
# (source first; duplicates removed).
#
# Prerequisites: `jq`, `chromium-headless-shell`; the production server must be up
# (default `pnpm build && pnpm start` → http://localhost:3030).
#
# Usage:
#   ./scripts/screenshot-locales.sh
#   BASE_URL=http://127.0.0.1:3030 ./scripts/screenshot-locales.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG="${ROOT}/ai-i18n-tools.config.json"
SHOT_ROOT="${ROOT}/images/screenshots"
BASE_URL="${BASE_URL:-http://localhost:3030}"
# Allow async locale JSON + fonts to settle before capture.
VIRTUAL_TIME_MS="${VIRTUAL_TIME_MS:-8000}"

declare -r CHROME_BIN="${CHROME_BIN:-chromium-headless-shell}"

command -v jq >/dev/null 2>&1 || {
  echo "error: jq is required" >&2
  exit 1
}
command -v "${CHROME_BIN}" >/dev/null 2>&1 || {
  echo "error: ${CHROME_BIN} not found (set CHROME_BIN if needed)" >&2
  exit 1
}

while IFS= read -r locale || [[ -n "${locale}" ]]; do
  [[ -z "${locale}" ]] && continue

  out_dir="${SHOT_ROOT}/${locale}"
  mkdir -p "${out_dir}"
  shot="${out_dir}/screenshot.png"
  url="${BASE_URL}/?locale=${locale}"

  echo "${locale}: ${shot}"

  "${CHROME_BIN}" \
    --disable-gpu \
    --screenshot="${shot}" \
    --window-size=1300,900 \
    --virtual-time-budget="${VIRTUAL_TIME_MS}" \
    "${url}"
done < <(
  jq -r '.sourceLocale as $s | [$s] + [.targetLocales[] | select(. != $s)] | .[]' "${CONFIG}"
)

echo "Done. Images under ${SHOT_ROOT}/<locale>/screenshot.png"
