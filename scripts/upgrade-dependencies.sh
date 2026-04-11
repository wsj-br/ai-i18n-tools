#!/bin/bash
# upgrade-dependencies.sh
#
# This script upgrades the dependencies in the project to the latest versions.
#
# Shells cannot export environment changes to a parent process; nvm must run in your
# interactive shell (see https://github.com/nvm-sh/nvm/issues/2124). Run:
#   source ./scripts/upgrade-dependencies.sh
# This file aborts if executed as ./scripts/upgrade-dependencies.sh unless CI=1 or
# TRANSREWRT_UPGRADE_ALLOW_EXEC=1 (for automation).
#

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
if [ -n "${BASH_VERSION:-}" ] && [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  if [ -z "${TRANSREWRT_UPGRADE_ALLOW_EXEC:-}" ] && [ -z "${CI:-}" ]; then
    echo "Abort: run this script with source so nvm applies to your current shell." >&2
    echo "  source ${SCRIPT_DIR}/upgrade-dependencies.sh" >&2
    echo "(Automation: set CI=1 or TRANSREWRT_UPGRADE_ALLOW_EXEC=1 to allow execution without source.)" >&2
    exit 1
  fi
fi

_transrewrt_upgrade_dependencies() {
  set -e

  # Color codes
  BLUE='\033[0;34m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  RESET='\033[0m'

  echo ""
  echo "--------------------------------"
  echo "🔄 Upgrading dependencies "
  echo "--------------------------------"

  _transrewrt_suppress_done_was_set=0
  _transrewrt_suppress_done_prev=
  if [ -n "${TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE+x}" ]; then
    _transrewrt_suppress_done_prev=$TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE
    _transrewrt_suppress_done_was_set=1
  fi
  TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE=1
  export TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE
  # shellcheck source=scripts/upgrade-tools.sh
  . "${SCRIPT_DIR}/upgrade-tools.sh"
  if [ "$_transrewrt_suppress_done_was_set" -eq 1 ]; then
    TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE=$_transrewrt_suppress_done_prev
    export TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE
  else
    unset TRANSREWRT_UPGRADE_TOOLS_SUPPRESS_DONE
  fi
  unset _transrewrt_suppress_done_prev _transrewrt_suppress_done_was_set

  # npm-check-updates: optionally pin eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks
  # until the latest published plugins declare peerDependencies.eslint that allows ESLint 10
  # (see scripts/eslint-react-peers-allow-eslint10.js).
  _eslint_ncu_reject='eslint,@eslint/js,eslint-plugin-react,eslint-plugin-react-hooks'
  echo -e "${BLUE}📦  Checking registry: do latest react ESLint plugins allow ESLint 10?${RESET}"
  set +e
  _eslint10_peer_out=$(node "${SCRIPT_DIR}/eslint-react-peers-allow-eslint10.js" 2>&1)
  _eslint10_peer_ok=$?
  set -e
  printf '%s\n' "$_eslint10_peer_out" | pr -o 4 -T
  echo -e "${BLUE}📦  Running npm-check-updates...${RESET}"
  if [ "$_eslint10_peer_ok" -eq 0 ]; then
    echo -e "${GREEN}Peer ranges include ESLint 10; upgrading the ESLint stack with everything else.${RESET}"
    ncu --upgrade 2>&1 | pr -o 4 -T
  elif [ "$_eslint10_peer_ok" -eq 1 ]; then
    echo -e "${YELLOW}Peer ranges still exclude ESLint 10; pinning ${_eslint_ncu_reject}${RESET}"
    ncu --upgrade -x "$_eslint_ncu_reject" 2>&1 | pr -o 4 -T
  else
    echo -e "${YELLOW}Could not verify peer ranges (offline or error). Pinning ${_eslint_ncu_reject}${RESET}"
    ncu --upgrade -x "$_eslint_ncu_reject" 2>&1 | pr -o 4 -T
  fi

  # Update pnpm lockfile and install updated dependencies
  echo -e "${BLUE}⬆️  Running pnpm install...${RESET}"
  pnpm install 2>&1 | pr -o 4 -T

  # check for vulnerabilities
  echo -e "${BLUE}🔍  Checking for vulnerabilities...${RESET}"
  pnpm audit 2>&1 | pr -o 4 -T

  # fix vulnerabilities
  echo -e "${BLUE}🔧  Fixing vulnerabilities...${RESET}"
  pnpm audit fix 2>&1 | pr -o 4 -T

  # check for vulnerabilities again
  echo -e "${BLUE}🔍  Checking for vulnerabilities again...${RESET}"
  pnpm audit 2>&1 | pr -o 4 -T
}

# When sourced from bash, run in the caller's shell so nvm PATH changes persist.
if [ -n "${BASH_VERSION:-}" ] && [ "${BASH_SOURCE[0]}" != "${0}" ]; then
  _transrewrt_upgrade_dependencies "$@"
  return 0
fi

_transrewrt_upgrade_dependencies "$@"
exit $?
