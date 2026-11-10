<a id="installation"></a>
# Installation

This page installs the CLI and gets the bare `ai-i18n-tools` command working. Already installed? Go to [Quick start](/guide/quick-start).

The published package is ESM-only. Use `import` or `import()` in Node.js or your bundler; do not use `require('ai-i18n-tools')`. The package declares `engines.node` `>=22.16.0`; older Node.js versions are unsupported. The npm tarball includes the consumer context at `docs/ai-i18n-tools-context.md` and the complete `skills/` tree, not the full documentation site; locale-specific copies under `translated-docs/` are in the [GitHub repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### Standalone executables

GitHub Releases attach a Node.js single-executable build. Use that binary when the project does not run on Node.js. Python and .NET projects run the same CLI from it, including `extract`, `translate-ui`, and `suggest-models`, with no Node.js install.

Linux and macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

The installer detects the system, downloads a gzip archive of the matching executable, checks `SHA256SUMS.txt`, unpacks it, installs the command as `ai-i18n-tools` (`ai-i18n-tools.exe` on Windows), and adds the install directory to `PATH`. Linux and macOS unpack with `gzip`. Windows PowerShell unpacks with the .NET gzip reader, which is already part of Windows. The default directory is `~/.local/bin`. Open a new terminal if the command is not found yet. Set `AI_I18N_VERSION` (for example `v1.11.0`) to pin a release, or `AI_I18N_INSTALL_DIR` to choose another directory. A release published before the gzip archives still has the raw executable, and the installer accepts that file.

The binaries are not notarised or Authenticode-signed. macOS may ask you to approve an unsigned program. Windows SmartScreen may show a warning. The macOS installer clears the quarantine flag after the checksum matches.

Each release also attaches `SHA256SUMS.txt`, `ai-i18n-tools-python-examples.zip` (the four Python examples), and `ai-i18n-tools-dotnet-examples.zip` (`dotnet-console`, `dotnet-resx`, and the `assets/dotnet` helpers those projects compile). Releases published before the .NET archive do not include it. From the release that adds the skill archive, the same page includes `ai-i18n-tools-skill.zip`, every coding-agent skill directory. Releases published before that skill zip do not include it, and the first skill zip contains only `ai-i18n-tools/`. `install.sh` and `install.ps1` stay in the repository root, and the commands above download them from there. The npm tarball and the executable do not contain the example archives or the skill zip. The examples stay in the repository. The skill directories are inside the npm tarball. See [Coding-agent skill](/guide/coding-agent-skill#download-the-skill-directory).

<details>
<summary>Manual instructions to install <code>ai-i18n-tools</code> executable</summary>

| Platform | Asset |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64.gz` |
| Linux arm64 | `ai-i18n-tools-linux-arm64.gz` |
| macOS arm64 | `ai-i18n-tools-macos-arm64.gz` |
| macOS x64 | `ai-i18n-tools-macos-x64.gz` |
| Windows x64 | `ai-i18n-tools-win-x64.exe.gz` |

1. Download the asset that matches the machine, and `SHA256SUMS.txt`, from the [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases) page.
2. Check the checksum of the gzip archive. On Linux, `grep ' ai-i18n-tools-linux-x64.gz$' SHA256SUMS.txt | sha256sum -c -` (use the asset name you downloaded). On macOS, the same line with `shasum -a 256 -c -`. On Windows, `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe.gz).Hash` and compare it with the hash in `SHA256SUMS.txt`.
3. Unpack the archive and put the command on `PATH`.

Linux and macOS, using the Linux x64 asset as the example (substitute the asset you downloaded):

```bash
mkdir -p "$HOME/.local/bin"
gzip -dc ai-i18n-tools-linux-x64.gz > "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

If `$HOME/.local/bin` is not already on `PATH`, add this to the shell profile (`.bashrc`, `.bash_profile`, `.profile`, or `.zshrc`) and open a new terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell). `GZipStream` is part of Windows PowerShell; there is no separate gzip install:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Add-Type -AssemblyName System.IO.Compression
$gz = [System.IO.File]::OpenRead("$PWD\ai-i18n-tools-win-x64.exe.gz")
$outPath = "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
try {
  $gzipStream = New-Object System.IO.Compression.GZipStream($gz, [System.IO.Compression.CompressionMode]::Decompress)
  try {
    $out = [System.IO.File]::Create($outPath)
    try { $gzipStream.CopyTo($out) } finally { $out.Dispose() }
  } finally { $gzipStream.Dispose() }
} finally { $gz.Dispose() }
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

Open a new terminal and run `ai-i18n-tools --version`. The command name is `ai-i18n-tools` on every platform.

</details>

Set the API key for the active provider the same way as an npm install (see below). Then pick the `init` template for the project and translate. A Python project uses `-t ui-python`. A .NET project uses `-t ui-dotnet`. An app that already loads strings with `ResourceManager` or `IStringLocalizer` uses `-t ui-dotnet-resx`. Run one `init` line:

```bash
# Python
ai-i18n-tools init -t ui-python -P cheaperinference
# .NET
# ai-i18n-tools init -t ui-dotnet -P cheaperinference
# .NET ResourceManager or IStringLocalizer
# ai-i18n-tools init -t ui-dotnet-resx -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools sync
```

Use `init` only for a new configuration: it overwrites the selected config file. For existing projects, edit the config instead. `sync` handles all configured/enabled translation pipelines, including UI extraction.

Walkthroughs: [Add i18n to a Python app](/guide/add-i18n-to-python), [Add i18n to a .NET app](/guide/add-i18n-to-dotnet), and [Add i18n to a .NET ResourceManager app](/guide/add-i18n-to-dotnet-resourcemanager). Command reference: [suggest-models](/reference/cli-commands/models#suggest-models).

<a id="set-the-api-key"></a>
### Set the API key

Translation commands (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) require provider configuration in `ai-i18n-tools.config.json` and an API key for the active provider. Run `ai-i18n-tools init -P <provider>` to scaffold that preset. Provider presets and API keys: [LLM providers](/guide/providers-and-models). The model list from `init` is a starting point. Replace it from [AI Models](/guide/ai-models) with `suggest-models` or the dashboard **Models** tab. Ollama is the only built-in preset that needs no API key.

Set the key that matches the provider you pass to `init` (see the [preset table](/guide/providers-and-models#built-in-providers)):

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

Or create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="using-the-cli"></a>
### Using the CLI

Install `ai-i18n-tools` as a dependency or devDependency in your project (see the top of this page). If app code imports `ai-i18n-tools/runtime`, keep it available in the production runtime/build environment; a global CLI or standalone binary cannot satisfy that import. The package declares a `bin` entry that your package manager links to `node_modules/.bin/ai-i18n-tools`. That shim (`bin/ai-i18n-tools.mjs` inside the installed package) loads the compiled CLI.

To type the bare `ai-i18n-tools` command in an interactive shell, configure one of the options below. Without setup, the shell cannot find the binary even after a local install.

direnv — add to a `.envrc` in the project root (bash/zsh; see [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

After `direnv allow`, the bare command is available whenever you `cd` into the project.

Manual PATH — run these from the project root (the directory that contains `node_modules/.bin`). Subdirectories keep working afterward as long as you leave that `PATH` entry in place; re-running the export from a nested folder fails because `$PWD` no longer points at the project root.

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

Global install — install the CLI once and invoke it from any directory:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

With pnpm, run `pnpm setup` once per machine (and open a new shell) if global commands are missing — pnpm requires its global bin directory on `PATH`. A global install uses the globally pinned version. For per-project version pinning, prefer direnv or manual PATH so `node_modules/.bin` resolves to the project's dependency.

Upgrade an existing install with `ai-i18n-tools upgrade`. The command prints the new version and waits for `y`. `--yes` skips the prompt. A project dependency is updated in `package.json` and installed with npm, pnpm, yarn, or bun. A global Node.js install uses that package manager's global install. A standalone executable is replaced with the GitHub Release build for the current operating system and architecture after the SHA256 checksum matches. See [upgrade](/reference/cli-commands/setup#upgrade).

package.json scripts — when npm or pnpm runs a script, it prepends `node_modules/.bin` to `PATH`, so the bare command name works inside scripts without shell PATH changes:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Then run e.g. `pnpm run i18n:sync`. See [Recommended package.json scripts](/guide/quick-start#recommended-packagejson-scripts) for the full recommended set.

Alternatives — if you prefer not to adjust `PATH`: `npx ai-i18n-tools …` (npm) or `pnpm exec ai-i18n-tools …` (pnpm). For a zero-install one-off with no `package.json` entry: `npx ai-i18n-tools <cmd>` or `pnpm dlx ai-i18n-tools <cmd>`.

<a id="coding-agent-skill"></a>
### Coding-agent skill

Installing the npm package or the standalone executable does not register the skill with an agent. The install methods, native catalogs, and agents that have no skill folder are on [Coding-agent skill](/guide/coding-agent-skill).

Obtain every skill directory, each one a folder that contains `SKILL.md`, without cloning this repository:

1. Node.js 22.20 or later: `npx skills add wsj-br/ai-i18n-tools --all -y` installs those directories into the agent's skills folder.
2. Package already installed: copy `node_modules/ai-i18n-tools/skills/.` into that folder.
3. No Node.js: extract `package/skills/` from the npm tarball for the version in `ai-i18n-tools --version`. From the release that adds it, `ai-i18n-tools-skill.zip` on that GitHub Release contains the same directories. Releases published before the zip do not include it. The first zip contains only `ai-i18n-tools/`.

Commands and the agent folders are on [Coding-agent skill](/guide/coding-agent-skill#download-the-skill-directory).

<a id="cloned-monorepo"></a>
### Cloned monorepo

When developing the package or running workspace examples from a full clone of [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- Workspace examples (`examples/console-app`, `examples/nextjs-app`, and the other packages listed in [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — run `pnpm install` at the repository root, then `cd examples/<name>`. Use the example's `pnpm run i18n:*` scripts, or configure PATH (see [Using the CLI](#using-the-cli)) and run bare `ai-i18n-tools …`. Workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) link `ai-i18n-tools` to your local checkout.
- Repository root — pnpm does not link the root package's own `bin` into `node_modules/.bin`. This checkout's `.envrc` adds `bin/` to `PATH` so the committed `bin/ai-i18n-tools` wrapper (beside the published `bin/ai-i18n-tools.mjs` shim) provides the bare command after `direnv allow`. Without direnv, use `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …`, or root `pnpm i18n:*` scripts (or a shell alias / `pnpm add -g .`).
- Standalone fixtures (`multi-provider`, `test-markdown`) — from the fixture folder, use `node ../../bin/ai-i18n-tools.mjs …`.

Run `pnpm run build` at the repository root after changing CLI source. See the [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) for build steps and optional global-install workarounds.

On Linux, macOS, and WSL, registry installs set the executable bit on the CLI script automatically. On Windows, package managers generate `.cmd` and `.ps1` shims that invoke Node explicitly.

Next: [Quick start](/guide/quick-start).
