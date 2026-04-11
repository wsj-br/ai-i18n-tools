# Next.js App Example

This example shows how to use `ai-i18n-tools` with a **TypeScript** [Next.js](https://nextjs.org/) app and **pnpm**. The UI matches the [console app example](../console-app/): the same string keys and a locale selector driven by `locales/ui-languages.json` (source locale `en-GB` first, then the translation targets).

Nested under this folder is a small **[Docusaurus](https://docusaurus.io/)** site ([`docs-site/`](./docs-site/)) with copies of the main project docs for local browsing.

## Requirements

- Node.js >= 18
- [pnpm](https://pnpm.io/)
- An [OpenRouter](https://openrouter.ai) API key (for generating translations)

## Installation

From the **repository root**, run:

```bash
pnpm install
```

The root `pnpm-workspace.yaml` includes the library and this example, so pnpm links `ai-i18n-tools` via `"ai-i18n-tools": "workspace:^"` in `package.json`. No separate build or link step is needed—after you change library sources, run `pnpm run build` at the repo root and the example will pick up the updated `dist/` automatically.

## Usage

### Next.js app (port 3030)

Development server:

```bash
pnpm dev
```

Production build and start:

```bash
pnpm build
pnpm start
```

Open [http://localhost:3030](http://localhost:3030). Use the **Locale** dropdown to switch language (locale id / English name / native label). The home page also shows a **demo SVG** at the bottom: the image URL follows `public/assets/translation_demo_svg.<locale>.svg` (flat layout from the `svg` block in `ai-i18n-tools.config.json`). After you run `translate-svg`, each locale file contains translated `<text>`, `<title>`, and `<desc>` content; until then, committed copies may look identical across locales.

### Documentation site (port 3040)

```bash
cd docs-site
pnpm install
pnpm start
```

Open [http://localhost:3040](http://localhost:3040) (English). In **development**, Docusaurus serves **one locale at a time**: paths such as `/es/getting-started` **404** unless you run `pnpm run start:es` (or `start:fr`, `start:de`, `start:pt-BR`). After `pnpm build && pnpm serve`, all locales are available. See [`docs-site/README.md`](./docs-site/README.md).

## Supported Languages

| Code     | Language             |
| -------- | -------------------- |
| `en-GB`  | English (UK) default |
| `es`     | Spanish              |
| `fr`     | French               |
| `de`     | German               |
| `pt-BR`  | Portuguese (Brazil)  |

## Workflow

### 1. Extract UI strings

Scans `src/` for `t()` calls and updates `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. Translate

Set `OPENROUTER_API_KEY`, then run the combined translate script:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate
```

`i18n:translate` runs three CLI commands in order:

1. **`ai-i18n-tools translate-ui`** — flat locale JSON under `public/locales/` from `locales/strings.json`.
2. **`ai-i18n-tools translate-svg`** — SVG assets from `images/` to `public/assets/` per the `svg` block in `ai-i18n-tools.config.json` (this example uses flat names: `translation_demo_svg.<locale>.svg`).
3. **`ai-i18n-tools translate-docs`** — Docusaurus markdown under `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (see **Workflow 2** in `docs/GETTING_STARTED.md` at the repository root).

You can run any step alone (e.g. `ai-i18n-tools translate-svg`) when you only change sources for that workflow.

If logs show many skips and few writes, the tool is reusing **existing outputs** and the **SQLite cache** in `.translation-cache/`. To force re-translation, pass `--force` or `--force-update` on the relevant command where supported, or run `pnpm run i18n:clean` and translate again.

You can also run `i18n:sync` to extract UI strings (when `features.extractUIStrings` is enabled in config) and run the **sync** pipeline in one step: translate UI, then **translate-svg** when a `svg` block exists in `ai-i18n-tools.config.json`, then translate docs. Skip parts with `--no-ui`, `--no-svg`, or `--no-docs`.

```bash
pnpm run i18n:sync
```

This example config includes `svg`, so **`i18n:sync` runs the same SVG step as `translate-svg`**. You can still call `ai-i18n-tools translate-svg` alone for that step only, or use `pnpm run i18n:translate` for the fixed UI → SVG → docs order **without** running **extract**.

### 3. Clear cache and re-translate

`i18n:clean` deletes only `.translation-cache/` (it does **not** remove committed `locales/`, `public/locales/`, `public/assets/*.svg`, or `docs-site/i18n/`). Use:

```bash
pnpm run i18n:clean && pnpm run i18n:extract && pnpm run i18n:translate
```

## Project Structure

```
nextjs-app/
├── ai-i18n-tools.config.json # `svg` block: images/ → public/assets/ (translate-svg)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── i18n.ts
├── images/
│   └── translation_demo_svg.svg   # Source SVG for translate-svg
├── locales/
│   ├── ui-languages.json
│   └── strings.json          # Generated string catalogue (extract)
├── public/locales/           # Flat per-locale JSON (committed; regenerate with translate-ui)
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   └── pt-BR.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # Source (English)
    └── i18n/                 # Translated docs (Docusaurus layout; committed in git)
```

English doc sources under `docs-site/docs/` can be synced from the repository root with `pnpm run sync-docs:nextjs-example`, which adds `{#slug}` heading anchors in the repo and mirrors `docusaurus write-heading-ids`; see the script header in `scripts/sync-docs-to-nextjs-example.mjs`.

Translated UI strings, demo SVGs, and Docusaurus pages are already committed under `public/locales/`, `public/assets/`, `locales/strings.json`, and `docs-site/i18n/`. After you change sources and run `i18n:translate`, restart the Next.js and Docusaurus dev servers as needed; Docusaurus locales are listed in `docs-site/docusaurus.config.js`.
