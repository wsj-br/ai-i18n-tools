# Example A — React + i18next + flat markdown

This sample lives under `examples/react-ui-simple/`. It demonstrates:

- **UI strings**: a minimal **React** app (`src/App.jsx`) using **`useTranslation()`** from **react-i18next** and **literal keys** in **`t("…")`**, the same pattern as Transrewrt (`dev/i18n.md` in the Transrewrt repository).
- **Runtime**: **i18next** loads flat JSON bundles from `src/locales/bundles/<locale>.json` (written by `translate-ui`). **pt-BR** is the source language: keys are the Portuguese strings; missing entries fall back to the key (like Transrewrt’s key-as-default for English).
- **Locales**: `sourceLocale` is **pt-BR**; `src/locales/ui-languages.json` lists pt-BR, en-GB, es, and fr.
- **Documentation**: Portuguese Markdown under `docs/` with a relative link between two files, translated with **`markdownOutput.style`: `"flat"`** (outputs under `translated-docs/`; cache under `.translation-cache/` — gitignored at the repo root).

The folder name `react-ui-simple` matches the npm script in the parent package.

## Prerequisites

- Node.js 18+
- From the **repository root** (`ai-i18n-tools/`): `npm install` and `npm run build` so `dist/cli/index.js` exists.
- In **this directory**: `npm install` (React, i18next, Vite).

## Smoke test (no API key)

From the repository root:

```bash
npm run example:react-ui
```

This runs `extract` and `translate --dry-run` in this directory.

## Run the React app

```bash
cd examples/react-ui-simple
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Use the language dropdown or open with a query param, e.g. `?locale=en-GB`.

Placeholder `{}` bundles are committed under `src/locales/bundles/` so the dev server builds before the first `translate-ui`. After translation, reload to see localized strings.

## Full translation (OpenRouter)

Set `OPENROUTER_API_KEY`, then from **this directory**:

```bash
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
npx ai-i18n-tools translate
```

## Config file

Configuration is [`ai-i18n-tools.config.json`](./ai-i18n-tools.config.json). Per-locale flat UI files are written to **`src/locales/bundles/`** so Vite can glob-load bundles without picking up `strings.json` or `ui-languages.json`.

## Files

| Path | Role |
|------|------|
| `src/i18n.js` | i18next + `initReactI18next`, trimmed `t`, `loadLocale()` (compare Transrewrt `src/renderer/i18n.js`). |
| `src/App.jsx` | `useTranslation()` + `t()` with literals for extraction. |
| `src/main.jsx` | Vite + React entry. |
