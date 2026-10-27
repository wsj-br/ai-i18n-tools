#!/usr/bin/env bash
# Capture a headless screenshot of the Translation Dashboard for docs.
#
# Writes docs/public/translation-dashboard.png (English UI only; single capture).
# Shared across all docs locales via /translation-dashboard.png (VitePress public/).
#
# Prerequisites: built CLI (`pnpm build`), curl, and one of Google Chrome, Brave,
# or Firefox. The first one found is used, in that order. Set CHROME_BIN to force
# a binary (a Chromium headless shell still works). The capture opens the
# Statistics tab and waits until those figures are on screen (at least SETTLE_MS,
# default 3s, and no longer than VIRTUAL_TIME_MS).
#
# By default this script starts `ai-i18n-tools dashboard -L en-GB --no-open`, waits
# for HTTP, captures, then stops the server. If the dashboard is already running,
# set BASE_URL (and optionally SKIP_DASHBOARD_START=1); ensure that instance uses
# English UI if you need a matching shot.
#
# Usage:
#   ./scripts/screenshot-translation-dashboard.sh
#   BASE_URL=http://127.0.0.1:8675 SKIP_DASHBOARD_START=1 ./scripts/screenshot-translation-dashboard.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CLI="${ROOT}/dist/cli/index.js"
OUT="${OUT:-${ROOT}/docs/public/translation-dashboard.png}"
PORT="${PORT:-8675}"
if [[ -z "${BASE_URL+x}" ]]; then
  BASE_URL="http://127.0.0.1:${PORT}/"
  AUTO_START_DASHBOARD=1
else
  AUTO_START_DASHBOARD=0
fi
VIRTUAL_TIME_MS="${VIRTUAL_TIME_MS:-8000}"
# Minimum time after the page opens before the shot, so Statistics can finish loading.
SETTLE_MS="${SETTLE_MS:-3000}"
WINDOW_SIZE="${WINDOW_SIZE:-1300,900}"

DASHBOARD_PID=""
BROWSER_PID=""
TEMP_DIRS=()

cleanup() {
  if [[ -n "${DASHBOARD_PID}" ]] && kill -0 "${DASHBOARD_PID}" 2>/dev/null; then
    kill "${DASHBOARD_PID}" 2>/dev/null || true
    wait "${DASHBOARD_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BROWSER_PID}" ]] && kill -0 "${BROWSER_PID}" 2>/dev/null; then
    kill "${BROWSER_PID}" 2>/dev/null || true
    wait "${BROWSER_PID}" 2>/dev/null || true
  fi
  if ((${#TEMP_DIRS[@]} > 0)); then
    local dir
    for dir in "${TEMP_DIRS[@]}"; do
      if [[ -d "${dir}" ]]; then
        pkill -f "${dir}" 2>/dev/null || true
      fi
    done
    rm -rf "${TEMP_DIRS[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

browser_install_hint() {
  echo "  Install Google Chrome, Brave, or Firefox, or set CHROME_BIN to the binary." >&2
  echo "  Debian/Ubuntu: sudo apt install firefox; Fedora: sudo dnf install firefox; macOS: brew install --cask firefox" >&2
}

# Print the browser path to use. CHROME_BIN forces a binary; otherwise the first
# installed of Google Chrome, Brave, Firefox, then Chromium.
resolve_browser() {
  if [[ -n "${CHROME_BIN:-}" ]]; then
    if [[ -x "${CHROME_BIN}" ]]; then
      printf '%s\n' "${CHROME_BIN}"
      return 0
    fi
    if command -v "${CHROME_BIN}" >/dev/null 2>&1; then
      command -v "${CHROME_BIN}"
      return 0
    fi
    echo "error: ${CHROME_BIN} not found" >&2
    browser_install_hint
    return 1
  fi

  local candidate
  for candidate in \
    google-chrome google-chrome-stable \
    brave-browser brave \
    firefox firefox-esr \
    chromium-headless-shell chromium chromium-browser; do
    if command -v "${candidate}" >/dev/null 2>&1; then
      command -v "${candidate}"
      return 0
    fi
  done

  echo "error: no supported browser found" >&2
  browser_install_hint
  return 1
}

# firefox | headless-shell | chromium
browser_kind() {
  local base
  base="$(basename "$1")"
  case "${base}" in
    firefox | firefox-esr | firefox-bin)
      printf '%s\n' firefox
      ;;
    *headless-shell*)
      printf '%s\n' headless-shell
      ;;
    *)
      printf '%s\n' chromium
      ;;
  esac
}

run_with_budget() {
  local seconds=$((VIRTUAL_TIME_MS / 1000 + 45))
  if command -v timeout >/dev/null 2>&1; then
    timeout -k 3s "${seconds}" "$@"
  else
    "$@"
  fi
}

capture_chromium() {
  local bin=$1
  local mode=$2
  local base width height profile="" port log status
  local -a args=()
  base="$(basename "${bin}")"
  IFS=',' read -r width height <<<"${WINDOW_SIZE}"
  if [[ ! "${width}" =~ ^[0-9]+$ || ! "${height}" =~ ^[0-9]+$ ]]; then
    echo "error: WINDOW_SIZE must be width,height (got ${WINDOW_SIZE})" >&2
    return 1
  fi
  port="$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close();});')"
  args+=(--disable-gpu --remote-debugging-port="${port}" --window-size="${WINDOW_SIZE}")
  if [[ "${mode}" == "chromium" ]]; then
    args+=(--headless --no-first-run)
    # A new Brave profile never finishes in headless mode. Chrome and Chromium
    # can use a throwaway profile, including while the normal browser is open.
    if [[ "${base}" != "brave" && "${base}" != "brave-browser" ]]; then
      profile="$(mktemp -d)"
      TEMP_DIRS+=("${profile}")
      args+=(--user-data-dir="${profile}")
    fi
  fi
  args+=(about:blank)
  log="$(mktemp)"
  TEMP_DIRS+=("${log}")
  "${bin}" "${args[@]}" >"${log}" 2>&1 &
  BROWSER_PID=$!

  set +e
  SHOT_PORT="${port}" \
    SHOT_URL="${BASE_URL}" \
    SHOT_OUT="${OUT}" \
    SHOT_WIDTH="${width}" \
    SHOT_HEIGHT="${height}" \
    SHOT_WAIT_MS="${VIRTUAL_TIME_MS}" \
    SHOT_SETTLE_MS="${SETTLE_MS}" \
    run_with_budget node --input-type=module <<'JS'
import fs from "node:fs";

const port = Number(process.env.SHOT_PORT);
const url = process.env.SHOT_URL ?? "";
const out = process.env.SHOT_OUT ?? "";
const width = Number(process.env.SHOT_WIDTH);
const height = Number(process.env.SHOT_HEIGHT);
const waitMs = Number(process.env.SHOT_WAIT_MS);
const settleMs = Number(process.env.SHOT_SETTLE_MS);

function assertPositive(name, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}
assertPositive("SHOT_PORT", port);
assertPositive("SHOT_WIDTH", width);
assertPositive("SHOT_HEIGHT", height);
assertPositive("SHOT_WAIT_MS", waitMs);
assertPositive("SHOT_SETTLE_MS", settleMs);
if (url.length === 0 || out.length === 0) {
  throw new Error("SHOT_URL and SHOT_OUT are required");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function debuggerUrl(devtoolsPort) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${devtoolsPort}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
        if (page) return page.webSocketDebuggerUrl;
      }
    } catch {
      // DevTools is not listening yet.
    }
    await sleep(100);
  }
  throw new Error(`Chrome DevTools did not listen on 127.0.0.1:${devtoolsPort}`);
}

const ws = new WebSocket(await debuggerUrl(port));
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", () => reject(new Error("Chrome DevTools websocket failed")), {
    once: true,
  });
});

let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (!msg.id || !pending.has(msg.id)) return;
  const waiter = pending.get(msg.id);
  pending.delete(msg.id);
  if (msg.error) waiter.reject(new Error(JSON.stringify(msg.error)));
  else waiter.resolve(msg.result ?? {});
});

function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const statsExpr = `(() => {
  const btn = document.querySelector('button[data-tab="stats"]');
  if (btn && !btn.classList.contains("active")) btn.click();
  const grid = document.querySelector("#stats-content .stats-grid");
  const status = document.querySelector("#stats-status")?.textContent ?? "";
  return { hasButton: !!btn, ready: !!grid, status };
})()`;

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url });

const started = Date.now();
const deadline = Math.max(waitMs, settleMs);
let last = { hasButton: false, ready: false, status: "" };
while (Date.now() - started < deadline) {
  const ev = await send("Runtime.evaluate", { expression: statsExpr, returnByValue: true });
  last = ev.result?.value ?? last;
  if (last.ready && Date.now() - started >= settleMs) break;
  await sleep(200);
}
if (!last.ready) {
  throw new Error(
    `Statistics tab did not finish loading (status: ${last.status || "unavailable"})`
  );
}

const shot = await send("Page.captureScreenshot", { format: "png" });
const bytes = Buffer.from(shot.data ?? "", "base64");
if (bytes.length < 8 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
  throw new Error("Chrome screenshot was not a PNG");
}
fs.writeFileSync(out, bytes);
ws.close();
JS
  status=$?
  set -e
  if [[ -n "${BROWSER_PID}" ]] && kill -0 "${BROWSER_PID}" 2>/dev/null; then
    kill "${BROWSER_PID}" 2>/dev/null || true
    wait "${BROWSER_PID}" 2>/dev/null || true
  fi
  BROWSER_PID=""
  if [[ "${status}" -ne 0 || ! -s "${OUT}" ]]; then
    echo "error: ${bin} failed to capture ${OUT}" >&2
    cat "${log}" >&2
    return 1
  fi
}

capture_firefox() {
  local bin=$1
  local width height profile port log status
  IFS=',' read -r width height <<<"${WINDOW_SIZE}"
  if [[ ! "${width}" =~ ^[0-9]+$ || ! "${height}" =~ ^[0-9]+$ ]]; then
    echo "error: WINDOW_SIZE must be width,height (got ${WINDOW_SIZE})" >&2
    return 1
  fi
  profile="$(mktemp -d)"
  TEMP_DIRS+=("${profile}")
  port="$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close();});')"
  printf 'user_pref("marionette.port", %s);\n' "${port}" >"${profile}/user.js"
  log="$(mktemp)"
  TEMP_DIRS+=("${log}")
  # --new-instance avoids handing the command to a Firefox that is already open.
  "${bin}" --headless --new-instance --marionette --profile "${profile}" >"${log}" 2>&1 &
  BROWSER_PID=$!

  set +e
  SHOT_PORT="${port}" \
    SHOT_URL="${BASE_URL}" \
    SHOT_OUT="${OUT}" \
    SHOT_WIDTH="${width}" \
    SHOT_HEIGHT="${height}" \
    SHOT_WAIT_MS="${VIRTUAL_TIME_MS}" \
    SHOT_SETTLE_MS="${SETTLE_MS}" \
    run_with_budget node --input-type=module <<'JS'
import fs from "node:fs";
import net from "node:net";

const port = Number(process.env.SHOT_PORT);
const url = process.env.SHOT_URL ?? "";
const out = process.env.SHOT_OUT ?? "";
const width = Number(process.env.SHOT_WIDTH);
const height = Number(process.env.SHOT_HEIGHT);
const waitMs = Number(process.env.SHOT_WAIT_MS);
const settleMs = Number(process.env.SHOT_SETTLE_MS);

function assertPositive(name, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}
assertPositive("SHOT_PORT", port);
assertPositive("SHOT_WIDTH", width);
assertPositive("SHOT_HEIGHT", height);
assertPositive("SHOT_WAIT_MS", waitMs);
assertPositive("SHOT_SETTLE_MS", settleMs);
if (url.length === 0 || out.length === 0) {
  throw new Error("SHOT_URL and SHOT_OUT are required");
}

function connect(marionettePort) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    const tryOnce = () => {
      const sock = net.connect({ port: marionettePort, host: "127.0.0.1" });
      const onError = () => {
        sock.destroy();
        if (Date.now() >= deadline) {
          reject(new Error(`Firefox Marionette did not listen on 127.0.0.1:${marionettePort}`));
          return;
        }
        setTimeout(tryOnce, 100);
      };
      sock.once("error", onError);
      sock.once("connect", () => {
        sock.removeListener("error", onError);
        resolve(sock);
      });
    };
    tryOnce();
  });
}

const sock = await connect(port);
let buf = Buffer.alloc(0);
const pending = new Map();
let nextId = 1;

function send(name, params = {}) {
  const id = nextId++;
  const payload = JSON.stringify([0, id, name, params]);
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    sock.write(`${payload.length}:${payload}`);
  });
}

sock.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  while (true) {
    const colon = buf.indexOf(0x3a);
    if (colon < 0) return;
    const len = Number(buf.subarray(0, colon).toString());
    if (!Number.isFinite(len) || buf.length < colon + 1 + len) return;
    const body = buf.subarray(colon + 1, colon + 1 + len).toString();
    buf = buf.subarray(colon + 1 + len);
    const msg = JSON.parse(body);
    if (msg[0] !== 1) continue;
    const waiter = pending.get(msg[1]);
    if (!waiter) continue;
    pending.delete(msg[1]);
    if (msg[2]) waiter.reject(new Error(JSON.stringify(msg[2])));
    else waiter.resolve(msg[3]);
  }
});

await send("WebDriver:NewSession", { capabilities: {} });
await send("WebDriver:SetTimeouts", { script: waitMs + 15000, pageLoad: 60000, implicit: 0 });
await send("WebDriver:SetWindowRect", { x: 0, y: 0, width, height });
await send("WebDriver:Navigate", { url });
const dims = await send("WebDriver:ExecuteScript", {
  script: "return { iw: window.innerWidth, ih: window.innerHeight };",
  args: [],
});
const box = dims?.value ?? dims;
const innerWidth = Number(box?.iw);
const innerHeight = Number(box?.ih);
if (!Number.isInteger(innerWidth) || !Number.isInteger(innerHeight)) {
  throw new Error(`unexpected window size from Firefox: ${JSON.stringify(dims)}`);
}
await send("WebDriver:SetWindowRect", {
  x: 0,
  y: 0,
  width: width + (width - innerWidth),
  height: height + (height - innerHeight),
});

const statsScript = `const btn = document.querySelector('button[data-tab="stats"]');
if (btn && !btn.classList.contains("active")) btn.click();
const grid = document.querySelector("#stats-content .stats-grid");
const statusEl = document.querySelector("#stats-status");
return {
  ready: !!grid,
  status: statusEl ? statusEl.textContent : ""
};`;
const started = Date.now();
const deadline = Math.max(waitMs, settleMs);
let last = { ready: false, status: "" };
while (Date.now() - started < deadline) {
  const state = await send("WebDriver:ExecuteScript", { script: statsScript, args: [] });
  last = state?.value ?? state ?? last;
  if (last.ready && Date.now() - started >= settleMs) break;
  await new Promise((resolve) => setTimeout(resolve, 200));
}
if (!last.ready) {
  throw new Error(`Statistics tab did not finish loading (status: ${last.status || "unavailable"})`);
}

await send("WebDriver:SetWindowRect", { x: 0, y: 0, width, height });
const fitted = await send("WebDriver:ExecuteScript", {
  script: "return { iw: window.innerWidth, ih: window.innerHeight };",
  args: [],
});
const fittedBox = fitted?.value ?? fitted;
const fittedWidth = Number(fittedBox?.iw);
const fittedHeight = Number(fittedBox?.ih);
if (Number.isInteger(fittedWidth) && Number.isInteger(fittedHeight)) {
  await send("WebDriver:SetWindowRect", {
    x: 0,
    y: 0,
    width: width + (width - fittedWidth),
    height: height + (height - fittedHeight),
  });
}

const shot = await send("WebDriver:TakeScreenshot", { full: false, scroll: false });
const raw = typeof shot === "string" ? shot : shot?.value;
if (typeof raw !== "string" || raw.length === 0) {
  throw new Error("Firefox screenshot was empty");
}
const bytes = Buffer.from(raw.replace(/^data:image\/png;base64,/, ""), "base64");
if (bytes.length < 8 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
  throw new Error("Firefox screenshot was not a PNG");
}
fs.writeFileSync(out, bytes);
sock.end();
JS
  status=$?
  set -e
  if [[ -n "${BROWSER_PID}" ]] && kill -0 "${BROWSER_PID}" 2>/dev/null; then
    kill "${BROWSER_PID}" 2>/dev/null || true
    wait "${BROWSER_PID}" 2>/dev/null || true
  fi
  BROWSER_PID=""
  if [[ "${status}" -ne 0 || ! -s "${OUT}" ]]; then
    echo "error: ${bin} failed to capture ${OUT}" >&2
    cat "${log}" >&2
    return 1
  fi
}

capture_screenshot() {
  local bin=$1
  local kind
  kind="$(browser_kind "${bin}")"
  case "${kind}" in
    firefox)
      capture_firefox "${bin}"
      ;;
    headless-shell)
      capture_chromium "${bin}" headless-shell
      ;;
    chromium)
      capture_chromium "${bin}" chromium
      ;;
    *)
      echo "error: unsupported browser kind ${kind}" >&2
      return 1
      ;;
  esac
}

command -v curl >/dev/null 2>&1 || {
  echo "error: curl is required — install it (Debian/Ubuntu: sudo apt install curl; Fedora: sudo dnf install curl; macOS: brew install curl)" >&2
  exit 1
}

BROWSER="$(resolve_browser)"

[[ -f "${CLI}" ]] || {
  echo "error: ${CLI} missing — run pnpm build from the repo root" >&2
  exit 1
}

wait_for_url() {
  local url=$1
  local attempts="${2:-60}"
  while ((attempts-- > 0)); do
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
    node "${CLI}" dashboard -L en-GB -p "${PORT}" --no-open
  ) &
  DASHBOARD_PID=$!
fi

wait_for_url "${BASE_URL}"

mkdir -p "$(dirname "${OUT}")"
echo "Capturing ${OUT} from ${BASE_URL} with ${BROWSER}"

capture_screenshot "${BROWSER}"

echo "Done: ${OUT}"
