# Intlayer → ai-i18n-tools migration example

A small Vite + React app that starts as an Intlayer-style project (`*.content.ts` + `useIntlayer`) so you can practice [`migrate-intlayer`](https://wsj-br.github.io/ai-i18n-tools/guide/migrating-from-intlayer).

`intlayer-pristine/` is a read-only reference. `src/` is the working copy the command rewrites. `pnpm reset` copies the pristine tree back over `src/` whenever you want to start over.

## Copy or clone

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
```

From a full [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) clone, run `pnpm install` and `pnpm run build` at the repository root first, then `cd examples/intlayer-migration`.

## What is in the demo

**Basic (auto-rewritten)**

- `Header.tsx` — `content.title.value` and `common.navigation.helpFor.value.replace('{pageName}', pageName)`
- `Dashboard.tsx` — nested `.value` reads

**Complex (manual review in the report)**

1. `DynamicLabel.tsx` — `content[statusKey].value`
2. `SpreadWidget.tsx` — `<StatusBadge {...content} />`
3. `MultiPlaceholderBanner.tsx` — chained `.replace().replace()`

The Intlayer runtime here is a local Vite alias (`src/shim/`) so the example stays small. Dictionary files still use `import { t, type Dictionary } from 'intlayer'` and components use `useIntlayer` from `react-intlayer`.

## Workflow

1. `pnpm reset` — restore `src/` from `intlayer-pristine/` and clear catalogs / the report / the cache.
2. `pnpm dev` — run the Intlayer app on [http://localhost:3091](http://localhost:3091) (locale switcher still uses Intlayer leaves).
3. `pnpm migrate:dry` — write `migrate-intlayer-report.md` without changing `src/`. Confirm basic files are listed as auto-rewrites and the three complex files as manual review.
4. `pnpm migrate:write` — seed `src/locales/strings.json` + `de.json` / `fr.json` / `es.json` / `pt-BR.json`, rewrite safe call sites, regenerate the report.
5. Hand `migrate-intlayer-report.md` to an AI coding agent (or edit by hand) with a prompt like “finish this migration”. `--write` already rewrote the basic call sites. Work the **Step-by-step TODO** at the end of the report in order. Each box points at the section with the exact text: a concrete `t()` or JSX call for each manual site, the `import { t } from '…';` line, which source strings need `extract` then `translate-ui`, the `*.content.ts` / `useIntlayer` / `IntlayerProvider` cleanup set, and the runtime bootstrap to paste over `src/i18n.ts`.
6. Follow **Runtime bootstrap** in the report. `loadLocale` only adds a flat bundle (and returns immediately for the source locale). The locale `<select>` handler must also call `i18n.changeLanguage(next)`, or the control moves and the strings stay on the previous language.
7. `pnpm i18n:sync` — `extract` writes `src/locales/ui-languages.json` (the bootstrap imports it, even when no new copy was added) and `translate-ui` fills new source strings (needs a provider API key). Do not edit `strings.json`, the flat locale files, or `ui-languages.json` by hand. Run this before `pnpm dev`.
8. `pnpm dev` — confirm the same UI with the locale switcher using seeded / translated flat bundles.
9. `pnpm reset` to try again from scratch.

A committed `migrate-intlayer-report.md.sample` shows the report shape from a real `--write` run (regenerate it after `pnpm reset && pnpm migrate:write` if you change the fixtures).

## Config

See `ai-i18n-tools.config.json`: `sourceLocale` is `en`, targets are `de`, `fr`, `es`, `pt-BR`, catalog at `src/locales/strings.json`.
