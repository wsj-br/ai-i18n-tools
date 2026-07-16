<a id="installation"></a>
# Installation

The published package is **ESM-only**. Use `import`/`import()` in Node.js or your bundler; do not use `require('ai-i18n-tools')`. The package declares `engines.node` `>=22.16.0`; older Node.js versions are unsupported. The npm tarball includes English files under `docs/` only; locale-specific copies under `translated-docs/` are in the [GitHub repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools includes its own string extractor. If you previously used `i18next-scanner`, `babel-plugin-i18next-extract`, or similar, you can remove those dev dependencies after migrating.


<a id="using-the-cli"></a>
### Using the CLI

Install `ai-i18n-tools` as a dependency or devDependency in your project (see [Installation](#installation) above). The package declares a `bin` entry that your package manager links to `node_modules/.bin/ai-i18n-tools`. That shim (`bin/ai-i18n-tools.mjs` inside the installed package) loads the compiled CLI.

To type the bare `ai-i18n-tools` command in an interactive shell, configure one of the options below. Without setup, the shell cannot find the binary even after a local install.

**direnv** — add to a `.envrc` in the project root (bash/zsh; see [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

After `direnv allow`, the bare command is available whenever you `cd` into the project.

**Manual PATH** — from the project root in an interactive shell:

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**Global install** — install the CLI once and invoke it from any directory:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

A global install uses the globally pinned version. For per-project version pinning, prefer direnv or manual PATH so `node_modules/.bin` resolves to the project's dependency.

**`package.json` scripts** — when npm or pnpm runs a script, it prepends `node_modules/.bin` to `PATH`, so the bare command name works inside scripts without shell PATH changes. Prefer `sync` over hand-chaining translate steps — order and feature flags are easy to get wrong when run manually:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Then run e.g. `pnpm run i18n:sync`. See [Recommended `package.json` scripts](/guide/quick-start#recommended-packagejson-scripts) for the full recommended set.

**Alternatives** — if you prefer not to adjust `PATH`: `npx ai-i18n-tools …` (npm) or `pnpm exec ai-i18n-tools …` (pnpm). For a zero-install one-off with no `package.json` entry: `npx ai-i18n-tools <cmd>` or `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Cloned ai-i18n-tools monorepo

When developing the package or running workspace **examples** from a full clone of [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- **Workspace examples** (`examples/console-app`, `examples/nextjs-app`, and the other packages listed in [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)) — run `pnpm install` at the repository root, then `cd examples/<name>`. Use the example's `pnpm run i18n:*` scripts, or configure PATH (see [Using the CLI](#using-the-cli)) and run bare `ai-i18n-tools …`. Workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) link `ai-i18n-tools` to your local checkout.
- **Repository root** — pnpm does not link the root package's own `bin` into `node_modules/.bin`. Use `node bin/ai-i18n-tools.mjs …` or root `pnpm i18n:*` scripts instead (or a shell alias / `pnpm add -g .` — see [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Standalone fixtures** (`multi-provider`, `test-markdown`) — from the fixture folder, use `node ../../bin/ai-i18n-tools.mjs …`.

Run `pnpm run build` at the repository root after changing CLI source. See the [Development Guide](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) for build steps and optional global-install workarounds.

On Linux, macOS, and WSL, registry installs set the executable bit on the CLI script automatically. On Windows, package managers generate `.cmd` and `.ps1` shims that invoke Node explicitly.

Translation commands (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) require **provider configuration** in `ai-i18n-tools.config.json` and **an API key** for the active provider. Run `ai-i18n-tools init [-P <provider>]` to scaffold a default provider block (`openrouter` when omitted); edit `provider` / `providers` to switch presets or models — see [LLM providers and models](/guide/providers-and-models). Ollama is the only built-in preset that needs no API key.

Set the API key that matches your active provider (see the [preset table](/guide/providers-and-models#built-in-providers)):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Or create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Tool UI language

The CLI localizes its own help text, log summaries, and Translation Dashboard independently of the locales you translate. By default it follows your OS locale. Override with `-L pt-BR`, `export AI_I18N_LANG=es`, or `"uiLanguage"` in config. See [Tool UI language](/guide/tool-ui-language).
