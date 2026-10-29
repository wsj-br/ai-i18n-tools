<a id="ui-strings"></a>
# UI strings

Reference for `extract` and `translate-ui`, the pipeline that turns `t()` calls into per-locale catalogs. Adding i18n to an app for the first time? Start at [Add i18n to a JS/TS app](/guide/add-i18n-to-js) or [Add i18n to a Python app](/guide/add-i18n-to-python). They cover the wrapping step, then send you back here for Steps 2 to 4.

This pipeline serves JS/TS projects (React, Next.js client and server components, Node.js services, plain HTML, Astro websites, and CLI tools) and Python applications. JS/TS looks up strings with i18next after the source calls `t()`. Python calls `t()` or gettext through a generated `i18n.py` (Django keeps Django's gettext).

<a id="which-guide-to-read"></a>
## Which guide to read

| Your app | Read next |
| --- | --- |
| JS/TS with hardcoded source strings, no `t()` yet | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) |
| React / Next.js / Node, `t()` already in the source | [Wire i18next](/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [Python applications](/guide/ui-strings/python). Init: `ui-python`, `ui-python-gettext`, `ui-python-flask`, or `ui-python-django`. Helper: `i18n.py`. To add locales to an existing app, see [Add i18n to a Python app](/guide/add-i18n-to-python), or [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) when the app uses gettext. |
| Plain HTML (no `t()` in markup) | [Plain HTML apps](/guide/ui-strings/plain-html) |
| Astro marketing site (hybrid) | [Astro website](/guide/ui-strings/astro-website) |
| `t()` rules, interpolation, plurals | [t() calls & plurals](/guide/ui-strings/t-calls-and-plurals) |
| Language picker / RTL | [Language switcher & RTL](/guide/ui-strings/language-switcher) |
| Runtime API signatures | [Runtime helpers](/guide/runtime-helpers) |
| Intlayer `.content.ts` dictionaries, moving off Intlayer | [Migrating from Intlayer](/guide/migrating-from-intlayer) |
| Intlayer `.content.ts` dictionaries, keeping Intlayer | [Translating Intlayer in place](/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## Step 1: Initialise

```bash
ai-i18n-tools init -P openrouter
```

This writes `ai-i18n-tools.config.json` with the `ui-markdown` template (including the `provider` / `providers` block for that preset). That template also turns on document translation for `README.md`, written as flat files under `translated-docs/`. README-only repositories use `init -t docs-markdown` instead. See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme). Before running `translate-ui` or `sync`, set the API key for that provider in the environment or `.env` — Ollama excepted; see [Provider and API key](/guide/quick-start#provider-and-api-key). Four keys matter for UI strings:

- `sourceLocale`: the BCP-47 code of the language your source text is written in. Any language is valid; `"en-GB"` is only an example. It must match `SOURCE_LOCALE` exported from your runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`). The string inside `t()` is that source language, and flat locale files use it as the key.
- `targetLocales`: BCP-47 codes for your target languages (for example `["de", "fr", "pt-BR"]`). Run `generate-ui-languages` to create the `ui-languages.json` manifest from this list.
- `ui.sourceRoots`: directories or glob patterns to scan for `t("…")` calls (for example `["src/"]`).
- `ui.stringsJson` and `ui.flatOutputDir`: where the master catalog and the per-locale files (`de.json`, `pt-BR.json`) are written.

Every other key, including `providers.<active>.uiModels`, is in [Configuration](/reference/configuration).

<a id="step-2-extract-strings"></a>
## Step 2: Extract strings

`extract` does nothing useful until those `t()` / `i18n.t()` calls exist. Wrap hardcoded copy first: [Add i18n to a JS/TS app](/guide/add-i18n-to-js).

```bash
ai-i18n-tools extract
```

Scans files under `ui.sourceRoots` for `t("literal")` and `i18n.t("literal")` calls. Writes (or merges into) `ui.stringsJson`.

The scanner is configurable: add custom function names via `ui.uiExtractor.funcNames` (or legacy `ui.reactExtractor.funcNames`). For Astro pages and components, add `.astro` to `ui.uiExtractor.extensions`. For plain HTML, see [Plain HTML apps](/guide/ui-strings/plain-html).

<a id="what-extract-scans"></a>
### What extract scans

- Default extensions are `.js`, `.jsx`, `.ts`, and `.tsx` only. `.mjs`, `.cjs`, `.mts`, and `.cts` are included only when you add them to `ui.uiExtractor.extensions`.
- A non-literal key such as `t(variable)` or a template literal is skipped with no warning.
- `package.json` `description` is included by default (`ui.uiExtractor.includePackageDescription`).
- Vue and Svelte single-file components are not supported. Adding `.vue` or `.svelte` to `extensions` does not extract template text. There is no SFC parser.

<a id="step-3-translate-ui-strings"></a>
## Step 3: Translate UI strings

```bash
ai-i18n-tools translate-ui
```

Reads `strings.json`, sends batches to the models on the active LLM provider for each target locale, writes flat JSON files (`de.json`, `fr.json`, etc.) to `ui.flatOutputDir`. Model selection uses the UI chain: `localeModels(locale)` → `uiModels` → `translationModels` (see [AI Models](/guide/ai-models#model-fallback-chain)). Within a locale, up to `uiBatchConcurrency` batches run at once (default **2**; see [Configuration — uiBatchConcurrency](/reference/configuration#uibatchconcurrency-optional)). `-j` still only parallelizes target locales.

<a id="translations-database-stringsjson"></a>
### Translations database (`strings.json`)

For each entry, `translate-ui` stores the **model id from the active provider** that successfully translated each locale in an optional `models` object (same locale keys as `translated`). Strings edited in the Translation Dashboard are marked with the sentinel value `user-edited` in `models` for that locale. The per-locale flat files under `ui.flatOutputDir` remain **source string → translation** only; they do not include `models` (so runtime bundles stay unchanged).

> **Note:** Dashboard edits to UI strings live in `strings.json`, not the SQLite documentation cache. Run plain `sync` or `translate-ui` (no special flag) to rewrite flat locale files from the catalog — `--force-update` is **not** forwarded to the UI step. Avoid `--force` on UI commands after manual edits: it re-translates every entry and can overwrite your `user-edited` rows. Catalog rows whose stored translation fails the locale writing-system check (for example romanized Hindi for `hi`) are treated as missing and retranslated without `--force`.

<a id="step-4-use-the-output-in-your-app"></a>
## Step 4: Use the output in your app

`translate-ui` only writes files. The app has to load them.

- JS/TS: wire i18next with the runtime helpers, load the locale file the user picks, and add a language switcher. See [Wire i18next](/guide/ui-strings/i18next-runtime) and [Language switcher and RTL](/guide/ui-strings/language-switcher).
- Python: use the generated `i18n.py` or your gettext catalogs. See [Python applications](/guide/ui-strings/python).
- Plain HTML: load the runtime script next to the page. See [Plain HTML apps](/guide/ui-strings/plain-html).
- Astro: see [Astro website](/guide/ui-strings/astro-website).

<a id="optional"></a>
## Optional

<a id="per-locale-model-overrides"></a>
### Per-locale model overrides

Some models translate certain languages better than others. For example, qwen and z-ai models tend to do well with Asian languages. Add `providers.<active>.localeModels` entries to give a prioritized model list for each BCP-47 locale. Those lists are tried before `uiModels` and `translationModels` for that locale. Locale tags match case-insensitively (`zh-cn` and `ZH-CN` are equivalent). With no matching entry, the tool uses the default `uiModels` and `translationModels` order. The same `localeModels` mechanism applies to document, JSON, and SVG translation.

<a id="exporting-to-xliff-20"></a>
### Exporting to XLIFF 2.0

To hand UI strings off to a translation vendor, TMS, or CAT tool, export the catalog as **XLIFF 2.0** (one file per target locale). This command is **read-only**: it does not modify `strings.json` or call any API.

```bash
ai-i18n-tools export-ui-xliff
```

By default, files are written next to `ui.stringsJson`, named like `strings.de.xliff`, `strings.pt-BR.xliff` (basename of your catalog + locale + `.xliff`). Use `-o` / `--output-dir` to write elsewhere. Existing translations from `strings.json` appear in `<target>`; missing locales use `state="initial"` with no `<target>` so tools can fill them in. Use `--untranslated-only` to export only units that still need a translation for each locale (useful for vendor batches). `--dry-run` prints paths without writing files.
