#!/bin/sh
# Install the ai-i18n-tools standalone executable on Linux and macOS.
#
#   curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
#
# The body is a function so `curl | sh` finishes reading this file before any
# command runs. A command that reads stdin would otherwise consume the rest
# of the script.
#
# Environment:
#   AI_I18N_VERSION      Release tag to install, such as v1.11.0.
#                        Default: the latest GitHub release.
#   AI_I18N_INSTALL_DIR  Directory for the ai-i18n-tools command.
#                        Default: $HOME/.local/bin
#   AI_I18N_BASE_URL     Download directory URL, without a file name.
#                        Default: the GitHub release download URL.

set -eu

tmpdir=""
stage=""

die() {
  printf 'ai-i18n-tools: %s\n' "$1" >&2
  exit 1
}

cleanup() {
  if [ -n "${stage:-}" ] && [ -f "${stage}" ]; then
    rm -f "${stage}"
  fi
  if [ -n "${tmpdir:-}" ]; then
    rm -rf "${tmpdir}"
  fi
}

fetch() {
  fetch_url=$1
  fetch_out=$2
  if command -v curl >/dev/null 2>&1; then
    # `|| return` keeps `set -e` from exiting inside this function, so the
    # caller can report the URL.
    curl -fsSL "$fetch_url" -o "$fetch_out" || return 1
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$fetch_out" "$fetch_url" || return 1
  else
    die "curl or wget is required"
  fi
}

# append_path_line FILE LINE
# Sets changed=1 when the line is added. A matching line is left in place.
append_path_line() {
  rc_file=$1
  rc_line=$2
  if [ -f "$rc_file" ] && grep -F -q "$rc_line" "$rc_file"; then
    return 0
  fi
  mkdir -p "$(dirname "$rc_file")"
  if [ -f "$rc_file" ] && [ -s "$rc_file" ]; then
    printf '\n' >>"$rc_file"
  fi
  printf '%s\n%s\n' "# Added by the ai-i18n-tools installer" "$rc_line" >>"$rc_file"
  updated_rcs="${updated_rcs}
${rc_file}"
  changed=1
}

main() {
  trap cleanup EXIT

  if [ -z "${HOME:-}" ]; then
    die "HOME is not set"
  fi

  kernel=$(uname -s)
  case "$kernel" in
    Linux) os=linux ;;
    Darwin) os=macos ;;
    MINGW* | MSYS* | CYGWIN*)
      die "this installer supports Linux and macOS. On Windows, run: irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex"
      ;;
    *)
      die "unsupported operating system: ${kernel}"
      ;;
  esac

  machine=$(uname -m)
  if [ "$os" = "macos" ] && command -v sysctl >/dev/null 2>&1; then
    # Apple Silicon reports x86_64 under Rosetta. Prefer the native arm64 build.
    hw_arm=$(sysctl -n hw.optional.arm64 2>/dev/null || true)
    if [ "$hw_arm" = "1" ]; then
      machine=arm64
    fi
  fi
  case "$machine" in
    x86_64 | amd64) arch=x64 ;;
    aarch64 | arm64) arch=arm64 ;;
    *)
      die "unsupported architecture: ${machine}"
      ;;
  esac

  asset="ai-i18n-tools-${os}-${arch}"

  if [ -n "${AI_I18N_BASE_URL:-}" ]; then
    base_url=${AI_I18N_BASE_URL%/}
  elif [ -n "${AI_I18N_VERSION:-}" ]; then
    base_url="https://github.com/wsj-br/ai-i18n-tools/releases/download/${AI_I18N_VERSION}"
  else
    base_url="https://github.com/wsj-br/ai-i18n-tools/releases/latest/download"
  fi

  default_dir="${HOME}/.local/bin"
  install_dir=${AI_I18N_INSTALL_DIR:-$default_dir}
  install_dir=${install_dir%/}
  if [ -z "$install_dir" ]; then
    die "AI_I18N_INSTALL_DIR is empty"
  fi
  case "$install_dir" in
    *[!A-Za-z0-9/_.~-]*)
      die "AI_I18N_INSTALL_DIR contains characters that cannot be written into a shell profile: ${install_dir}"
      ;;
  esac

  if [ "$install_dir" = "$default_dir" ]; then
    path_line='export PATH="$HOME/.local/bin:$PATH"'
    fish_line='set -gx PATH "$HOME/.local/bin" $PATH'
  else
    path_line="export PATH=\"${install_dir}:\$PATH\""
    fish_line="set -gx PATH \"${install_dir}\" \$PATH"
  fi

  tmpdir=$(mktemp -d)
  printf 'ai-i18n-tools: downloading %s from %s\n' "$asset" "$base_url"
  fetch "${base_url}/${asset}" "${tmpdir}/${asset}" || die "download failed: ${base_url}/${asset}"
  fetch "${base_url}/SHA256SUMS.txt" "${tmpdir}/SHA256SUMS.txt" || die "download failed: ${base_url}/SHA256SUMS.txt"

  if [ ! -s "${tmpdir}/${asset}" ]; then
    die "download was empty: ${asset}"
  fi

  expected=$(awk -v name="$asset" '
    {
      gsub(/\r/, "")
      if ($2 == name) {
        print $1
        exit
      }
    }
  ' "${tmpdir}/SHA256SUMS.txt")
  if [ -z "$expected" ] || [ "${#expected}" -ne 64 ]; then
    die "SHA256SUMS.txt has no checksum for ${asset}"
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum "${tmpdir}/${asset}" | awk '{ print $1 }')
  elif command -v shasum >/dev/null 2>&1; then
    actual=$(shasum -a 256 "${tmpdir}/${asset}" | awk '{ print $1 }')
  else
    die "sha256sum or shasum is required to verify the download"
  fi
  expected=$(printf '%s' "$expected" | tr 'ABCDEF' 'abcdef')
  actual=$(printf '%s' "$actual" | tr 'ABCDEF' 'abcdef')
  if [ "$expected" != "$actual" ]; then
    die "checksum mismatch for ${asset}"
  fi
  printf 'ai-i18n-tools: checksum verified\n'

  mkdir -p "$install_dir" || die "could not create ${install_dir}"
  dest="${install_dir}/ai-i18n-tools"
  stage="${install_dir}/.ai-i18n-tools.$$.tmp"
  if ! cp "${tmpdir}/${asset}" "$stage"; then
    die "could not copy the executable to ${stage}"
  fi
  chmod 755 "$stage" || die "could not mark ${stage} executable"
  if ! mv -f "$stage" "$dest"; then
    die "could not install ${dest}"
  fi
  stage=""

  if [ "$os" = "macos" ] && command -v xattr >/dev/null 2>&1; then
    xattr -d com.apple.quarantine "$dest" 2>/dev/null || true
  fi

  if ! "$dest" --version </dev/null >"${tmpdir}/version.txt" 2>&1; then
    printf 'ai-i18n-tools: the installed executable failed to run\n' >&2
    cat "${tmpdir}/version.txt" >&2
    exit 1
  fi
  version=$(head -n 1 "${tmpdir}/version.txt" | tr -d '\r')
  if [ -z "$version" ]; then
    die "the installed executable printed no version"
  fi
  printf 'ai-i18n-tools: installed %s (%s)\n' "$dest" "$version"

  changed=0
  updated_rcs=""
  found_rc=0
  for rc in .bashrc .bash_profile .profile .zshrc; do
    if [ -f "${HOME}/${rc}" ]; then
      append_path_line "${HOME}/${rc}" "$path_line"
      found_rc=1
    fi
  done
  if [ -f "${HOME}/.config/fish/config.fish" ]; then
    append_path_line "${HOME}/.config/fish/config.fish" "$fish_line"
    found_rc=1
  fi
  if [ "$found_rc" -eq 0 ]; then
    append_path_line "${HOME}/.profile" "$path_line"
  fi

  if [ "$changed" -eq 1 ]; then
    printf 'ai-i18n-tools: updated shell startup files:\n'
    printf '%s\n' "$updated_rcs" | sed '/^$/d'
  else
    printf 'ai-i18n-tools: shell startup files already add the install directory to PATH\n'
  fi

  case ":${PATH:-}:" in
    *":${install_dir}:"*)
      printf 'ai-i18n-tools: command is available in this shell\n'
      ;;
    *)
      printf 'ai-i18n-tools: open a new terminal so PATH includes %s\n' "$install_dir"
      printf 'ai-i18n-tools: or run: %s\n' "$path_line"
      ;;
  esac
}

main "$@"
