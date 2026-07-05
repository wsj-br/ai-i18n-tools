<a id="ui-strings"></a>
# UI strings

Designed for any JS/TS project that uses i18next: React apps, Next.js (client and server components), Node.js services, CLI tools.

<a id="which-guide-to-read"></a>
## Which guide to read

| Your app | Read next |
| --- | --- |
| React / Next.js / Node + i18next | [Wire i18next](/guide/ui-strings/i18next-runtime) (Step 4) |
| Plain HTML (no `t()` in markup) | [Plain HTML apps](/guide/ui-strings/plain-html) |
| Astro marketing site (hybrid) | [Astro website](/guide/ui-strings/astro-website) |
| `t()` rules, interpolation, plurals | [t() calls & plurals](/guide/ui-strings/t-calls-and-plurals) |
| Language picker / RTL | [Language switcher & RTL](/guide/ui-strings/language-switcher) |
| Runtime API signatures | [Runtime helpers](/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## Step 1: Initialise

```bash
npx ai-i18n-tools init
```

This writes `ai-i18n-tools.config.json` with the `ui-markdown` template. Edit it to set:

- `sourceLocale` - your source language BCP-47 code (e.g. `"en-GB"`). **Must match** `SOURCE_LOCALE` exported from your runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - array of BCP-47 codes for your target languages (e.g. `["de", "fr", "pt-BR"]`). Run `generate-ui-languages` to create the `ui-languages.json` manifest from this list.
- `ui.sourceRoots` - directories or glob patterns to scan for `t("…")` calls (e.g. `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - where to write the master catalog (e.g. `"src/locales/strings.json"`).
- `ui.flatOutputDir` - where to write `de.json`, `pt-BR.json`, etc. (e.g. `"src/locales/"`).
- `ui.preferredModel` (optional) - model id to try **first** for `translate-ui` only; on failure the CLI continues with the active provider's `translationModels` in order, skipping duplicates.

<a id="step-2-extract-strings"></a>
## Step 2: Extract strings

```bash
npx ai-i18n-tools extract
```

Scans all JS/TS files under `ui.sourceRoots` for `t("literal")` and `i18n.t("literal")` calls. Writes (or merges into) `ui.stringsJson`.

The scanner is configurable: add custom function names via `ui.uiExtractor.funcNames` (or legacy `ui.reactExtractor.funcNames`). For Astro pages and components, add `.astro` to `ui.uiExtractor.extensions`. For plain HTML, see [Plain HTML apps](/guide/ui-strings/plain-html).

<a id="step-3-translate-ui-strings"></a>
## Step 3: Translate UI strings

```bash
npx ai-i18n-tools translate-ui
```

Reads `strings.json`, sends batches to the active LLM provider for each target locale, writes flat JSON files (`de.json`, `fr.json`, etc.) to `ui.flatOutputDir`. When `ui.preferredModel` is set, that model is attempted before the active provider's `translationModels` list (document translation and other commands use the provider's list only).

For each entry, `translate-ui` stores the **model id from the active provider** that successfully translated each locale in an optional `models` object (same locale keys as `translated`). Strings edited in the Translation Dashboard are marked with the sentinel value `user-edited` in `models` for that locale. The per-locale flat files under `ui.flatOutputDir` remain **source string → translation** only; they do not include `models` (so runtime bundles stay unchanged).

> **Note:** Dashboard edits to UI strings live in `strings.json`, not the SQLite documentation cache. Run plain `sync` or `translate-ui` (no special flag) to rewrite flat locale files from the catalog — `--force-update` is **not** forwarded to the UI step. Avoid `--force` on UI commands after manual edits: it re-translates every entry and can overwrite your `user-edited` rows.

Then wire i18next at runtime — [Wire i18next](/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## Exporting to XLIFF 2.0 (optional)

To hand UI strings off to a translation vendor, TMS, or CAT tool, export the catalog as **XLIFF 2.0** (one file per target locale). This command is **read-only**: it does not modify `strings.json` or call any API.

```bash
npx ai-i18n-tools export-ui-xliff
```

By default, files are written next to `ui.stringsJson`, named like `strings.de.xliff`, `strings.pt-BR.xliff` (basename of your catalog + locale + `.xliff`). Use `-o` / `--output-dir` to write elsewhere. Existing translations from `strings.json` appear in `<target>`; missing locales use `state="initial"` with no `<target>` so tools can fill them in. Use `--untranslated-only` to export only units that still need a translation for each locale (useful for vendor batches). `--dry-run` prints paths without writing files.
