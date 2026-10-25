<a id="installation"></a>
# Installation

This page installs the CLI and gets the bare `ai-i18n-tools` command working. Already installed? Go to [Quick start](/guide/quick-start).

The published package is ESM-only. Use `import` or `import()` in Node.js or your bundler; do not use `require('ai-i18n-tools')`. The package declares `engines.node` `>=22.16.0`; older Node.js versions are unsupported. The npm tarball includes English files under `docs/` only; locale-specific copies under `translated-docs/` are in the [GitHub repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### Standalone executables

GitHub Releases attach a Node.js single-executable build. Python projects run the CLI from that binary, including `extract`, `translate-ui`, and `suggest-models`, with no Node.js install.

| Platform | Asset |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

Each release also attaches `SHA256SUMS.txt` and `ai-i18n-tools-python-examples.zip` (the four Python examples). The npm tarball and the executable do not contain those examples. They stay in the repository as well.

1. Download the asset that matches the machine from the [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases) page.
2. Check the checksum against `SHA256SUMS.txt`.
3. On Linux and macOS, run `chmod +x` on the file and move it onto `PATH` (or call it by path).
4. On Windows, place `ai-i18n-tools-win-x64.exe` on `PATH`. Renaming it to `ai-i18n-tools.exe` keeps the same command name as the other platforms.

The binaries are not notarized or Authenticode-signed. macOS may ask you to approve an unsigned program. Windows SmartScreen may show a warning.

Set the API key for the active provider the same way as an npm install (see below). Then:

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Walkthrough: [Add i18n to a Python app](/guide/add-i18n-to-python). Command reference: [suggest-models](/reference/cli-commands/models#suggest-models).

<a id="set-the-api-key"></a>
### Set the API key

Translation commands (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) require provider configuration in `ai-i18n-tools.config.json` and an API key for the active provider. Run `ai-i18n-tools init -P <provider>` to scaffold that preset; edit `provider` / `providers` to add models — see [LLM providers and models](/guide/providers-and-models). The model list from `init` is a starting point. `ai-i18n-tools suggest-models` ranks the active provider's chat models, and `suggest-models --apply` replaces `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab. Ollama is the only built-in preset that needs no API key.

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

Install `ai-i18n-tools` as a dependency or devDependency in your project (see the top of this page). The package declares a `bin` entry that your package manager links to `node_modules/.bin/ai-i18n-tools`. That shim (`bin/ai-i18n-tools.mjs` inside the installed package) loads the compiled CLI.

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

<a id="cloned-monorepo"></a>
### Cloned monorepo

When developing the package or running workspace examples from a full clone of [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- Workspace examples (`examples/console-app`, `examples/nextjs-app`, and the other packages listed in [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — run `pnpm install` at the repository root, then `cd examples/<name>`. Use the example's `pnpm run i18n:*` scripts, or configure PATH (see [Using the CLI](#using-the-cli)) and run bare `ai-i18n-tools …`. Workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) link `ai-i18n-tools` to your local checkout.
- Repository root — pnpm does not link the root package's own `bin` into `node_modules/.bin`. This checkout's `.envrc` adds `bin/` to `PATH` so the committed `bin/ai-i18n-tools` wrapper (beside the published `bin/ai-i18n-tools.mjs` shim) provides the bare command after `direnv allow`. Without direnv, use `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …`, or root `pnpm i18n:*` scripts (or a shell alias / `pnpm add -g .`).
- Standalone fixtures (`multi-provider`, `test-markdown`) — from the fixture folder, use `node ../../bin/ai-i18n-tools.mjs …`.

Run `pnpm run build` at the repository root after changing CLI source. See the [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) for build steps and optional global-install workarounds.

On Linux, macOS, and WSL, registry installs set the executable bit on the CLI script automatically. On Windows, package managers generate `.cmd` and `.ps1` shims that invoke Node explicitly.

Next: [Quick start](/guide/quick-start).
