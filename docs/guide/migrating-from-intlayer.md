<a id="migrating-from-intlayer"></a>
# Migrating from Intlayer

Moving from [Intlayer](https://intlayer.org/)? This command brings your existing translation dictionaries and the simplest translation usage in your app into ai-i18n-tools. It makes safe updates automatically, then creates a clear report for anything that still needs your attention. This lets you move over gradually without needing to understand every difference upfront.

Already using i18next JSON translation files? You do not need this migration command; use the [JSON pipeline](/guide/json#i18next-namespace-files) instead.

<a id="what-migrate-intlayer-does"></a>
## What `migrate-intlayer` does

1. Parses `*.content.ts` default exports (`key` + `content` + `t({ locale: '…' })` leaves).
2. Seeds `ui.stringsJson` and per-locale files under `ui.flatOutputDir` from the source-locale text and any translations already in the dictionary. Imported rows have no `models` field (they were not machine-translated by this run).
3. Rewrites **safe** call sites:
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. Leaves everything else (dynamic keys, JSX spreads, chained `.replace().replace()`, destructuring) untouched. The report lists each of those sites with the exact expression, a concrete `t()` or JSX replacement, and the `import { t } from '…';` line to add.
5. Dry run by default. Pass `--write` to apply catalog seeding and safe rewrites. The report is always written. It also lists dictionary files and leftover `useIntlayer` / `IntlayerProvider` usage to delete after the manual rewrites, catalog keys that still need `extract` then `translate-ui`, and a runtime bootstrap to paste over the app's i18n module.

<a id="migrate-your-project"></a>
## Migrate your project

1. Install `ai-i18n-tools` (see [Installation](/guide/installation)). If your project has no `ai-i18n-tools.config.json` yet, scaffold one:

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

   Edit `sourceLocale` and `targetLocales` to match the locales already in your Intlayer dictionaries, and set `ui.sourceRoots`, `ui.stringsJson`, `ui.flatOutputDir` to point at your app's source and desired catalog paths — same keys `translate-ui` uses, see [UI strings — Step 1: Initialise](/guide/ui-strings/#step-1-initialise).
2. Dry run first: `ai-i18n-tools migrate-intlayer` (no `--write`). Read `migrate-intlayer-report.md` to see what it finds and which call sites need manual review before any file changes.
3. `ai-i18n-tools migrate-intlayer --write` to seed `ui.stringsJson` / `ui.flatOutputDir` and rewrite the safe call sites.
4. Give the regenerated report `migrate-intlayer-report.md` to an AI coding agent (recommended), or work through it yourself by following the steps:


   - The report ends with a **Step-by-step TODO**: finish each manual-review site with the concrete `t('…')`/JSX shown there, add the `import { t } from '…';` line, then delete the leftover `*.content.ts` files and `useIntlayer` / `IntlayerProvider` usage the report lists.
   - Paste the report's runtime bootstrap over your app's i18n module. In the locale control, call `loadLocale(next)` and then `i18n.changeLanguage(next)` — `loadLocale` only registers the flat bundle and does not switch the active language.
   - Run `ai-i18n-tools extract` then `ai-i18n-tools translate-ui` (or `sync`) for any source strings the report marks as new. `extract` also writes `ui-languages.json`, which the bootstrap imports, so run it before starting the app even when no new string was added. Do not hand-edit `strings.json`, the flat locale files, or `ui-languages.json` — those commands own them.
   - Once the report's cleanup list is complete and the app runs on ai-i18n-tools, remove the `intlayer` / `react-intlayer` dependencies and the dictionary files.

<a id="run-the-example"></a>
## Run the example

The steps above apply to any Intlayer project. The [intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) example walks through them on a small Vite + React app with basic (auto-rewritable) and complex (manual-review) cases, so you can see the report and the runtime bootstrap before trying it on your own code. `intlayer-pristine/` is never modified; `src/` is the working copy.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

Hand `migrate-intlayer-report.md` to an AI coding agent (or edit the flagged files yourself). The report includes the runtime module to paste over `src/i18n.ts`. In the locale control, call `loadLocale(next)` and then `i18n.changeLanguage(next)`. `loadLocale` only registers the flat bundle.

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` runs `extract` first, which writes `ui-languages.json`. The bootstrap imports that file, so start the app only after extract. Do not edit `strings.json`, the flat locale files, or `ui-languages.json` by hand.

`pnpm reset` copies `intlayer-pristine/` back over `src/` and clears generated catalogs so you can start over.

Full walkthrough: [examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md).

<a id="command"></a>
## Command

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

Requires `ui.stringsJson` and `ui.flatOutputDir` in config (same as `translate-ui`). Does not call an LLM.

| Option | Meaning |
| --- | --- |
| `[paths...]` | Files/dirs/globs to scan (default: `ui.sourceRoots`) |
| `--write` | Seed the catalog and rewrite safe call sites (default: dry run) |
| `--report <path>` | Report path (default: `migrate-intlayer-report.md`) |
| `--content-glob <glob>` | Dictionary filename glob (default: `**/*.content.ts`) |
| `--t-import <specifier>` | Import specifier for generated `t()` (default: relative `./i18n` if `src/i18n.ts` exists, otherwise `i18next`) |

After `--write`, finish the manual-review sites from the report, delete the unused `*.content.ts` files and `IntlayerProvider` wrapper it lists, paste in the runtime bootstrap, and call `i18n.changeLanguage` from the locale control. Run `extract` then `translate-ui` (or `sync`) for source strings the report marks as new. `extract` also writes `ui-languages.json`, which the bootstrap imports. Do not edit `strings.json`, the flat locale files, or `ui-languages.json` by hand.

**See also:** [CLI — UI strings](/reference/cli-commands/ui-strings#migrate-intlayer), [Wire i18next](/guide/ui-strings/i18next-runtime)
