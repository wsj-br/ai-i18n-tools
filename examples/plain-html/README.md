# Plain HTML example (ai-i18n-tools)

This example shows how to localize a **plain HTML** app (no `t()` calls in the markup) using bare `data-i18n` markers and the drop-in [`public/i18n.js`](public/i18n.js) runtime (a copy of `ai-i18n-tools/html-runtime/i18n.js`). Locale JSON is static. The page stays one HTML file; the script swaps strings, `alt` text, and `chart.png` → `chart_pt-BR.png` without a reload.

The UI is a trimmed dashboard-style demo: filter controls, a results table, tabs, and a language picker. English source text is written once on each element; `extract` captures it into `locales/strings.json`, and `translate-ui` fills flat bundles under `public/locales/`.

For the full guide, see [Plain HTML apps](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/plain-html) in the documentation site.

## Requirements

- Node.js ≥ 22.16
- [pnpm](https://pnpm.io/) ≥ 10.33
- An [OpenRouter](https://openrouter.ai) API key (required for `pnpm i18n:sync` / `translate-ui`)

## Installation

### Try this example on its own

```bash
npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html
cd plain-html
pnpm install
export OPENROUTER_API_KEY=your_key_here
pnpm i18n:sync
```

### From the full ai-i18n-tools repository

Use this when you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository. Run `pnpm install` and `pnpm run build` from the repository root; the workspace [`overrides`](../../pnpm-workspace.yaml) entry links `ai-i18n-tools` to your local checkout automatically.

## Run the demo

From this directory, generate the extraction catalog and locale bundles, then serve the site:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm i18n:sync
pnpm dev
```

`i18n:sync` runs `extract` (→ `public/strings.json`) and `translate-ui` (→ `public/locales/*.json`). Run it before `pnpm dev` whenever those files are missing—for example after a fresh clone or `pnpm i18n:clean`.

Open [http://localhost:3090/](http://localhost:3090/) for English, or [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) for Portuguese (Brazil). Use the **Language** dropdown in the header to switch locales; the choice is stored in `localStorage` and reflected in the URL query string.

---

## How it differs from the bundled dashboard

| | **This example** | **Bundled dashboard** (`src/dashboard-app/`) |
| --- | --- | --- |
| **Serving** | Static files (`pnpm dev`) | Node server (`ai-i18n-tools dashboard`) |
| **Locale bundles** | `fetch` of `./locales/{locale}.json` relative to `i18n.js` | `GET /api/ui-i18n` |
| **Locale resolution** | `?locale=` + picker + browser default, switched in place | `--ui-lang` / env / config / OS |
| **Runtime helper** | `public/i18n.js` (`window.i18n`) | `applyStaticI18n()` in `src/dashboard-app/app.js` |
| **Dynamic JS strings** | None (HTML markers only) | Additional `t()` calls in `app.js` |

`normalizeI18nText` in `public/i18n.js` matches the dashboard and `src/extractors/html-i18n-marks.ts`. `public/app.js` only wires the tabs and the filter demo.

---

## Marking HTML for translation

Translatable elements use **bare** markers (no duplicated string literals):

```html
<button type="button" data-i18n>Apply</button>
<input placeholder="Filename (partial)" title="Filter by filepath" data-i18n-title data-i18n-placeholder />
```

For mixed content (text interleaved with child tags), wrap each text run in its own marker:

```html
<p><span data-i18n>Run</span> <code>mark-html</code> <span data-i18n>to add bare markers, then</span> <code>extract</code><span data-i18n>.</span></p>
```

Opt out with `data-i18n-ignore` (for example the GitHub brand link).

### Auto-marking with `mark-html`

When starting from unmarked HTML, preview then apply:

```bash
pnpm i18n:mark-html   # dry run by default without --write; script uses --write
# Or preview only:
pnpm exec ai-i18n-tools mark-html public/index.html
```

The committed `public/index.html` is already marked; re-running `mark-html` should report no changes.

---

## ai-i18n-tools configuration

`ai-i18n-tools.config.json` enables UI extraction from HTML only:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

With `flatOutputDir` set to `public/locales`, `ui-languages.json` is written there automatically (same folder as `pt-BR.json`, …) when you run `extract` or `generate-ui-languages` — no separate copy step.

**pt-BR** is the only target locale in this example (English source + Portuguese Brazil).

---

## Workflow

### 1. Extract UI strings

Scans `public/index.html` for `data-i18n*` markers and updates `public/strings.json`:

```bash
pnpm i18n:extract
```

### 2. Translate

Generates flat JSON in `public/locales/`:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm i18n:translate-ui
```

Or run both steps with:

```bash
pnpm i18n:sync
```

After changing `targetLocales`, regenerate the manifest (written next to the flat bundles):

```bash
pnpm i18n:locales
```

### 3. Runtime

On load, `public/app.js`:

1. Fetches `/locales/ui-languages.json` for locale metadata (`label`, `direction`)
2. Resolves the active locale (`?locale=` → `localStorage` → browser → `en`)
3. Fetches `/locales/{locale}.json` (skipped for English — source text is the fallback)
4. Sets `<html lang>` / `dir` and walks all `[data-i18n]`, `[data-i18n-title]`, `[data-i18n-placeholder]` nodes

---

## Project structure

```text
plain-html/
├── ai-i18n-tools.config.json
├── package.json
├── scripts/dev-server.mjs       # static server on port 3090
└── public/
    ├── index.html               # English source with data-i18n markers
    ├── app.js                   # applyStaticI18n + locale switcher + tabs
    ├── styles.css               # dashboard-inspired dark theme (trimmed)
    ├── strings.json             # extract catalog (committed; CLI + optional inspect via dev server)
    └── locales/
        ├── ui-languages.json    # generate-ui-languages (default: flatOutputDir)
        └── pt-BR.json           # Portuguese (Brazil) bundle
```

---

## Commands (quick reference)

| Script | Command | Purpose |
| --- | --- | --- |
| Dev | `pnpm i18n:sync` then `pnpm dev` | Generate locale JSON, then serve on port 3090 |
| Mark HTML | `pnpm i18n:mark-html` | Insert bare markers (`--write`) |
| Extract | `pnpm i18n:extract` | HTML markers → `public/strings.json` |
| Translate | `pnpm i18n:translate-ui` | Catalog → `public/locales/*.json` |
| Manifest | `pnpm i18n:locales` | → `public/locales/ui-languages.json` |
| Sync | `pnpm i18n:sync` | extract + translate-ui |
| Clean cache | `pnpm i18n:clean` | Remove `.translation-cache/` and `public/strings.json` |

Set `OPENROUTER_API_KEY` before translate commands that call the API.

---

## Further reading

- [Plain HTML apps](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/plain-html) — marking, extract, runtime snippet
- [Translation Dashboard source](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) — full server-backed reference UI
- [Examples catalog](https://wsj-br.github.io/ai-i18n-tools/examples) — other runnable projects
