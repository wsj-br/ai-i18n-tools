# Intlayer in-place translation example

A small Vite + React app that keeps [Intlayer](https://intlayer.org/) at runtime (`*.content.ts` + `useIntlayer`) and uses ai-i18n-tools only to fill the missing translations. This is the counterpart to [intlayer-migration](../intlayer-migration/): it does not move the app off Intlayer, it feeds it.

The dictionaries ship with English (`en`, the source) and Brazilian Portuguese (`pt-BR`). Spanish (`es`) and Simplified Chinese (`zh-Hans`) are missing on purpose. [`translate-intlayer`](https://wsj-br.github.io/ai-i18n-tools/reference/cli-commands/ui-strings#translate-intlayer) fills them in place, leaving the existing text untouched.

`pristine/` is a read-only reference. `src/` is the working copy the command edits. `pnpm reset` copies the pristine tree back over `src/` and clears the catalog and cache whenever you want to start over.

## Copy or clone

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
```

From a full [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) clone, run `pnpm install` and `pnpm run build` at the repository root first, then `cd examples/intlayer-translate`.

## What is in the demo

Two dictionaries, each declared right next to the component that uses it, as [Intlayer recommends](https://intlayer.org/doc/concept/content):

- `src/components/Header.content.ts` (key `app`) — title, subtitle, and two [insertion](https://intlayer.org/doc/concept/content/insertion) strings declared with Intlayer's `insert()` node and `{{name}}` / `{{count}}` placeholders (`Welcome back, {{name}}`, `You have {{count}} new alerts`)
- `src/components/Dashboard.content.ts` (key `dashboard`) — nested `stats.*` and `actions.*` leaves

Every leaf has `en` and `pt-BR`. None has `es` or `zh-Hans` — that is what the command fills. Because the files sit beside the source code, `translate-intlayer src` finds them with no extra configuration.

This example uses the real Intlayer packages: `intlayer`, `react-intlayer`, and the `vite-intlayer` plugin. `intlayer.config.ts` declares the four locales (`routing.mode: "no-prefix"` keeps the locale out of the URL for this router-free SPA), the `intlayer()` Vite plugin builds the dictionaries and generates the typed `.intlayer/` directory, and `app.tsx` wraps the tree in `IntlayerProvider` and switches locale with `useLocale`. Components read content with `useIntlayer`, and insertion leaves are callable — `Header.tsx` renders `app.greeting({ name })` directly. When a locale leaf is missing, Intlayer falls back to the default locale (`en`), so you can see the gap in the browser before translating.

## Workflow

1. `pnpm reset` — restore `src/` (English + `pt-BR`; `es` and `zh-Hans` missing) and clear the catalog and cache.
2. `pnpm dev` — run the app on [http://localhost:3093](http://localhost:3093). Switch the locale to `es` or `zh-Hans` and the strings fall back to English, because those leaves are empty.
3. `pnpm translate:dry` — report how many leaf×locale pairs are missing (20: 10 leaves × `es` + `zh-Hans`) without calling an LLM or writing anything.
4. `pnpm translate` — translate the missing leaves and write them back into the `*.content.ts` files (needs a provider API key; see Config). Only the missing lines change; `pt-BR` is left as written and the `{{name}}` / `{{count}}` placeholders are preserved in every new translation.
5. `pnpm dev` — switch to `es` or `zh-Hans` again and see the filled translations.
6. Edit an English string in a dictionary, then run `pnpm translate` again. Only that leaf is re-translated, because its source text changed (stale detection). `pt-BR`, `es`, and `zh-Hans` for that leaf refresh; everything else is cached.
7. `pnpm reset` to start over as many times as you like.

The run writes an intermediate catalog under `.i18n/` (gitignored) that ai-i18n-tools uses as the translation cache. You do not edit it by hand.

## Config

See `ai-i18n-tools.config.json`: `sourceLocale` is `en`, targets are `pt-BR`, `es`, `zh-Hans`, the catalog lives under `.i18n/`, and the provider is `openrouter`. Set your API key (for example `OPENROUTER_API_KEY`) in the environment or a `.env` file before `pnpm translate`.
