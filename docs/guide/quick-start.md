<a id="quick-start"></a>
# Quick start

This page takes a project that speaks one language to its first translated files. It is for a JS/TS app, a Python app, a website or documentation site, or a repository README and other Markdown files. It assumes:

- Node.js `>=22.16.0`, or the [standalone executable](/guide/installation#standalone-executables) for a Python project.
- An API key for an LLM provider, or a local Ollama install.
- The project is in version control, so you can review what the tool writes.

Two things differ between projects: how the tool finds your text, and how your app loads the result. [Pick your path](#pick-your-path) below sends you to the right guide for that.

<a id="runnable-examples"></a>
## Runnable examples

Prefer to look at a finished project first? Copy one without cloning the repository:

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

Replace `console-app` with any other Node.js example. Python examples have no `package.json`; copy them the same way or download `ai-i18n-tools-python-examples.zip` from the GitHub Release. The full list, with what each one shows, is on the [Examples](/examples) page.

<a id="install"></a>
## Install

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` and `yarn add --dev ai-i18n-tools` work too. Python projects install the standalone executable and need no Node.js. Linux and macOS: `curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`. Windows PowerShell: `irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`. Other install options: [Installation](/guide/installation).

<a id="provider-and-api-key"></a>
## Provider and API key

Every command that calls an LLM (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, and `sync`) needs both of these:

1. At least one provider in `ai-i18n-tools.config.json`: a `providers.<name>` block with `translationModels`, and a top-level `provider` key when more than one provider is configured. `init -P <provider>` scaffolds that preset. To add providers, see [LLM providers](/guide/providers-and-models). To choose the model list, see [AI Models](/guide/ai-models).
2. The matching API key in your environment or a project-root `.env` file. Each built-in preset reads a named variable from the [preset table](/guide/providers-and-models#built-in-providers), for example `OPENROUTER_API_KEY` with `-P openrouter` or `OPENAI_API_KEY` with `-P openai`. Ollama uses a local endpoint and needs no key.

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`, `status`, and other commands that do not call the LLM need neither. More on environment files and PATH: [Installation](/guide/installation#using-the-cli).

<a id="pick-your-path"></a>
## Pick your path

Find what you have, run the commands in its block, then continue in the linked guide.

<a id="core-cli-commands"></a>

<a id="a-jsts-app"></a>
### A JS/TS app

Your buttons and messages are still plain text in the source, so the tool has nothing to find yet. They must be wrapped in `t()` first, and the app needs a small i18next setup file.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

Then follow [Add i18n to a JS/TS app](/guide/add-i18n-to-js). It covers the wrapping step, with an agent prompt, before `extract` and `translate-ui`.

<a id="a-python-app"></a>
### A Python app

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

Then follow [Add i18n to a Python app](/guide/add-i18n-to-python).

A Django app, Flask with Flask-Babel catalogs, or an app that already calls `gettext` keeps those calls. Scaffold with `ui-python-django`, `ui-python-flask`, or `ui-python-gettext` instead, then follow [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext).

<a id="a-website-or-documentation-site"></a>
### A website or documentation site

Pick the template for your framework:

| Your site | Template |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| Plain Astro website | `ui-astro-website` |
| Plain HTML pages | `ui-plain-html` or `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

Your framework must have its own i18n routing enabled first. Then follow [Add i18n to a website or docs site](/guide/add-i18n-to-website).

<a id="a-readme-or-markdown-docs"></a>
### A README or Markdown docs

Most repositories want this together with the app: the default `ui-markdown` template already includes a flat README block. For any other template, add `--with-readme`. A repository with only Markdown uses `docs-markdown`.

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

Then follow [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). Paste the language-list marker into `README.md` before `sync`. The app path, when you have one, is still [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python).

<a id="something-else"></a>
### Something else

- Nested i18next JSON that stays as is: `ai-i18n-tools init -t ui-json-bundles -P openrouter`, then [JSON](/guide/json).
- SVG diagrams with text labels: [SVG translation](/guide/svg-translation/).
- Moving off Intlayer: [Migrating from Intlayer](/guide/migrating-from-intlayer).
- Keeping Intlayer and only filling its translations: [Translating Intlayer in place](/guide/translating-intlayer).

The full template list, with every `init` option, is in the [CLI setup reference](/reference/cli-commands/setup).

<a id="run-and-check"></a>
## Run and check

When your project is ready:

```bash
ai-i18n-tools doctor
ai-i18n-tools sync
ai-i18n-tools status
```

`doctor` checks that the config, paths, providers, and environment are ready. It also verifies model ids with the provider unless you pass `--local`. `sync` runs every step your config enables, in order. `status` shows what is translated per locale. A first run on a project the tool cannot see text in finishes without error and writes nothing useful, so if `status` shows no strings, go back to the guide for your path.

`suggest-models` ranks the active provider's chat models from published benchmarks. `suggest-models --apply` replaces `translationModels` and leaves `uiModels` and `localeModels` alone. The same ranking is on the dashboard **Models** tab. How the ranking works, and why the list holds more than one model: [AI Models](/guide/ai-models). Command reference: [suggest-models](/reference/cli-commands/models#suggest-models).

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `sync` whenever source text changes. A SQLite cache means only new or changed text goes to the model, so reruns are cheap. Running `sync` in CI keeps translations from drifting. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review and edit cached translations.

<a id="recommended-packagejson-scripts"></a>
### Recommended package.json scripts

With the package installed locally, scripts resolve `ai-i18n-tools` from `node_modules/.bin` without extra shell setup. For an interactive shell, configure PATH first: see [Using the CLI](/guide/installation#using-the-cli).

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

Prefer `sync` over chaining the individual translate scripts. Use the single-step scripts only when you need one step in isolation.

To have the CLI output and dashboard in another language, pass `-L <code>` or set `AI_I18N_LANG`: see [Tool UI language](/guide/tool-ui-language).

<a id="combined-sync"></a>

Translating more than one kind of content, such as app strings and a docs site together? See [Combining pipelines](/guide/combining-pipelines).

Next: the guide for your path under [Pick your path](#pick-your-path).
