# Plain HTML example (ai-i18n-tools)

This example shows how to localize a **plain HTML** app (no `t()` calls in the markup) using bare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` markers—the same pattern as the bundled [Translation Dashboard](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app), but with **static** locale JSON files instead of a Node API server.

The UI is a trimmed dashboard-style demo: filter controls, a results table, tabs, and a language picker. English source text is written once on each element; `extract` captures it into `locales/strings.json`, and `translate-ui` fills flat bundles under `public/locales/`.

For the full guide, see [Plain HTML apps](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/plain-html) in the documentation site.

## Requirements

- Node.js ≥ 22.16
- [pnpm](https://pnpm.io/) ≥ 10.33
- An [OpenRouter](https://openrouter.ai) API key (only when re-running translation)

## Installation

### Try this example on its own

```bash
npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html
cd plain-html
pnpm install
```

### From the full ai-i18n-tools repository

Use this when you cloned the **whole** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) repository. Run `pnpm install` and `pnpm run build` from the repository root; the workspace [`overrides`](../../pnpm-workspace.yaml) entry links `ai-i18n-tools` to your local checkout automatically.

## Run the demo

From this directory:

```bash
pnpm dev
```

Open [http://localhost:3090/](http://localhost:3090/) for English, or [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) for Portuguese (Brazil). Use the **Language** dropdown in the header to switch locales; the choice is stored in `localStorage` and reflected in the URL query string.

Committed locale files under `public/locales/` are included so you can explore translations without an API key.

---

## How it differs from the bundled dashboard

| | **This example** | **Bundled dashboard** (`src/dashboard-app/`) |
| --- | --- | --- |
| **Serving** | Static files (`pnpm dev`) | Node server (`ai-i18n-tools dashboard`) |
| **Locale bundles** | `fetch('/locales/{locale}.json')` | `GET /api/ui-i18n` |
| **Locale resolution** | `?locale=` + picker + browser default | `--ui-lang` / env / config / OS |
| **Runtime helper** | `applyStaticI18n()` in `public/app.js` | Same algorithm in `src/dashboard-app/app.js` |
| **Dynamic JS strings** | None (HTML markers only) | Additional `t()` calls in `app.js` |

The marker-walking logic in `public/app.js` matches the dashboard's `applyStaticI18n` and must stay aligned with `normalizeI18nText` in the tool's `src/extractors/html-i18n-marks.ts`.

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
  "targetLocales": ["es", "fr", "pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

With `flatOutputDir` set to `public/locales`, `ui-languages.json` is written there automatically (same folder as `es.json`, `pt-BR.json`, …) when you run `extract` or `generate-ui-languages` — no separate copy step.

**pt-BR** is the primary non-English demo locale (no German in this example).

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
        ├── es.json
        ├── fr.json
        └── pt-BR.json           # primary demo locale
```

---

## Commands (quick reference)

| Script | Command | Purpose |
| --- | --- | --- |
| Dev | `pnpm dev` | Serve static files on port 3090 |
| Mark HTML | `pnpm i18n:mark-html` | Insert bare markers (`--write`) |
| Extract | `pnpm i18n:extract` | HTML markers → `public/strings.json` |
| Translate | `pnpm i18n:translate-ui` | Catalog → `public/locales/*.json` |
| Manifest | `pnpm i18n:locales` | → `public/locales/ui-languages.json` |
| Sync | `pnpm i18n:sync` | extract + translate-ui |
| Clean cache | `pnpm i18n:clean` | Remove `.translation-cache/` only |

Set `OPENROUTER_API_KEY` before translate commands that call the API.

---

## Further reading

- [Plain HTML apps](https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/plain-html) — marking, extract, runtime snippet
- [Translation Dashboard source](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) — full server-backed reference UI
- [Examples catalog](https://wsj-br.github.io/ai-i18n-tools/examples) — other runnable projects
