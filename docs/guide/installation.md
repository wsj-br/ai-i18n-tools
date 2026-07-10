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

**`package.json` scripts (recommended)** — when npm or pnpm runs a script, it prepends `node_modules/.bin` to `PATH`, so commands like `pnpm run i18n:sync` invoke `ai-i18n-tools` without an `npx` or `pnpm exec` prefix:

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**Interactive shell** — from your project root, after a local install:

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**Bare** `ai-i18n-tools` **in the terminal** — to type the command name directly in an interactive shell, prepend the local bin directory to `PATH`:

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

With [**direnv**](https://direnv.net/), add `PATH_add node_modules/.bin` to a `.envrc` in the project root so the bare command is available after `cd` into the project. Without adjusting `PATH`, keep using `npx ai-i18n-tools …` or `pnpm exec ai-i18n-tools …`.

**Zero-install one-off** — `npx ai-i18n-tools <cmd>` or `pnpm dlx ai-i18n-tools <cmd>` (downloads the package for that invocation; no entry in `package.json`).

On Linux, macOS, and WSL, registry installs set the executable bit on the CLI script automatically. On Windows, package managers generate `.cmd` and `.ps1` shims that invoke Node explicitly.

Set your provider API key (OpenRouter shown; use the env var that matches your active provider — see the [preset table](/guide/providers-and-models#built-in-providers)):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Or create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Tool UI language

The CLI localizes its own help text, log summaries, and Translation Dashboard independently of the locales you translate. By default it follows your OS locale. Override with `-L pt-BR`, `export AI_I18N_LANG=es`, or `"uiLanguage"` in config. See [Tool UI language](/guide/tool-ui-language).
