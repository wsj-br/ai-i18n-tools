<a id="translating-intlayer-in-place"></a>
# Translating Intlayer in place

[Intlayer](https://intlayer.org/) is a good solution for applications that keep translations in typed content dictionaries, or that use a translation management system and human translation. `translate-intlayer` is for that audience. It fills the missing and stale locale leaves inside your `*.content.ts` dictionaries, in place. The dictionaries stay the source of truth, Intlayer stays at runtime, and ai-i18n-tools acts as the translation engine (provider selection, glossary, translation context, and model fallback).

<a id="keep-intlayer-or-move-to-source-string-calls"></a>
## Keep Intlayer, or move to source-string calls?

| Your audience | Command | Guide |
| --- | --- | --- |
| Typed content dictionaries, a translation management system, or human translation. Intlayer stays at runtime. | `translate-intlayer` | this page |
| Source-string calls, `t('…')`, with the source-language text kept with the code that uses it. The source language can be any language. | `migrate-intlayer` | [Migrating from Intlayer to source-string calls](/guide/migrating-from-intlayer) |

`translate-intlayer` is an ongoing task you re-run whenever you add source strings or edit existing ones. `migrate-intlayer` is a one-time move for the other audience. Each rewritten call carries the source-language string with the code that uses it, which simplifies maintenance and reduces the complexity of that code. That language is `sourceLocale`, and it can be any language.

<a id="what-translate-intlayer-does"></a>
## What `translate-intlayer` does

1. Parses `*.content.ts` default exports and collects every `t({ locale: '…' })` leaf. Locale values can be plain strings or Intlayer `insert('…')` insertion nodes.
2. Seeds the UI block's `ui.stringsJson` with the source text, then runs the same engine as [`translate-ui`](/reference/cli-commands/ui-strings#translate-ui) for the missing and stale locales.
3. Writes the new per-locale strings back into each `t({ … })` object. Edits are precise: only the missing or stale locale lines change, so your formatting, key order, and comments are preserved. Existing translations are left as written. When a leaf uses `insert('…')`, new locale values are wrapped in `insert(…)` too, so the leaf stays callable at runtime.
4. Preserves placeholders. Intlayer's insertion syntax <code v-pre>{{token}}</code> is passed through unchanged. Single-brace `{token}` placeholders are also supported: they become <code v-pre>{{token}}</code> for translation and return to `{token}` on write.
5. Dry run with `--dry-run`: it reports the missing/stale counts without calling an LLM or writing anything.

<a id="missing-vs-stale"></a>
## Missing vs. stale

A leaf + locale is translated when either:

- The locale is absent from the leaf (missing), or
- The source-locale text changed since the last run for that locale (stale). The source language is `sourceLocale` and can be any language.

Staleness is tracked per leaf in `cacheDir`, so editing one English string re-translates only that leaf on the next run; everything else stays cached. A translation that was already out of date on the very first run is accepted as current — only later edits mark it stale.

<a id="translate-your-project"></a>
## Translate your project

1. Install `ai-i18n-tools` (see [Installation](/guide/installation)). If your project has no `ai-i18n-tools.config.json` yet, scaffold one:

   ```bash
   ai-i18n-tools init -P gemini
   ```

   Set `sourceLocale` and `targetLocales` to the locales your dictionaries use, and point `ui.sourceRoots`, `ui.stringsJson`, and `ui.flatOutputDir` at your source and a catalog path — the same keys `translate-ui` uses, see [UI strings — Step 1: Initialise](/guide/ui-strings/#step-1-initialise). The catalog can live in a scratch directory (for example `.i18n/`); it is used as the translation cache and you never hand-edit it.
2. Dry run first to see what would be filled:

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. Apply it (needs a provider API key):

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. Re-run whenever you add a new string or edit an English one. Only the new or changed leaves are translated. Scope a run with `-l de,fr` or `--ui-block` when needed.

<a id="run-the-example"></a>
## Run the example

The [intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) example is a small Vite + React app whose dictionaries ship with English and Brazilian Portuguese; Spanish and Simplified Chinese are missing on purpose. `pristine/` is a read-only reference; `src/` is the working copy. `pnpm reset` returns `src/` to that starting state (and clears the catalog and cache) so you can repeat the exercise.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev` runs the app on `http://localhost:3093`. Switch the locale to `es` or `zh-Hans` before translating and the strings fall back to English; after `pnpm translate` the filled translations appear. Edit an English string and re-run `pnpm translate` to see only that leaf refresh.

Full walkthrough: [examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md).

<a id="command"></a>
## Command

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

Requires `features.translateUIStrings` and the UI block's `ui.stringsJson` (same as `translate-ui`). `--dry-run` does not call an LLM.

| Option | Meaning |
| --- | --- |
| `[paths...]` | Files/dirs/globs to scan (default: `ui.sourceRoots`) |
| `-l`, `--locale <codes>` | Comma-separated target locales to fill (default: the block's `targetLocales`) |
| `--ui-block <selector>` | UI block: zero-based index, description, or `stringsJson` path (default: block 0) |
| `--dry-run` | Report missing/stale counts only; no LLM call, no writes |
| `-j`, `--concurrency <n>` | Max parallel target locales (default: config `concurrency` or 4) |

**See also:** [CLI — UI strings](/reference/cli-commands/ui-strings#translate-intlayer), [Migrating from Intlayer to source-string calls](/guide/migrating-from-intlayer)
