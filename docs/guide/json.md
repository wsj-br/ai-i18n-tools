<a id="json"></a>
# JSON

Designed for projects that keep UI copy in **nested JSON files per locale** (for example `src/i18n/en/translation.json`) instead of `t("…")` in source. The CLI walks string values in those files, translates them via the active LLM provider, and writes per-locale outputs using `json[].outputPathTemplate`. It uses the same SQLite cache as `translate-docs` and `translate-svg` (`cacheDir`).

This pipeline does **not** run `extract` — there is no `strings.json` catalog. Enable it with `features.translateJson` and one or more entries in top-level `json[]`.

<a id="step-1-initialise-for-nested-json"></a>
### Step 1: Initialise for nested JSON

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

That template sets `features.translateJson: true`, disables UI extraction and document translation, and scaffolds a single `json[]` block pointing at `src/i18n/en/translation.json` with output `src/i18n/{llocale}/translation.json`. Edit `sourceLocale`, `targetLocales`, `contentPaths`, and `outputPathTemplate` for your repo layout.

<a id="step-2-configure-json"></a>
### Step 2: Configure `json[]`

Each `json[]` block describes one pipeline:

- `contentPaths` — one or more `.json` files, directories, or globs (for example `"src/i18n/en/translation.json"` or `"src/i18n/en/overrides/*.json"`). Paths are resolved from the project root.
- `outputPathTemplate` — required. Where to write each target locale file. Placeholders: `{locale}`, `{LOCALE}`, `{llocale}` (lowercased locale, useful for Astro route folders), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (optional) — subset for this block only; otherwise root `targetLocales` applies.
- `keyPolicy` — which JSON keys hold translatable prose vs stable identifiers (see below).
- `description` (optional) — shown in CLI headers and `status` output.

Example (multiple source files, lowercase locale folders):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Behaviour |
|-------------|-----------|
| `allowlist` | Only keys matching `translateKeys` (dot paths; minimatch globs) are translated. |
| `denylist`  | Translate all string values except keys matching `skipKeys`. |
| `both`      | Apply `translateKeys` first, then remove matches from `skipKeys`. |

Paths use dot notation (`nav.home.label`). A bare name like `slug` matches the final key segment at any depth.

<a id="step-3-translate-json-bundles"></a>
### Step 3: Translate JSON bundles

```bash
npx ai-i18n-tools translate-json
```

Optional flags (same ideas as `translate-docs`): `-l` / `--locale` for a subset of targets, `-p` / `--path` to limit files, `--dry-run`, `--force` (clear file tracking and segment cache for matched files), `--force-update` (re-process when file hash matches; segment cache still applies), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

JSON-only projects can run:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

When UI or docs are also enabled, `sync` runs **translate-json after translate-docs** (unless `--no-json`). Skip JSON with `--no-json`.

Check coverage per file and locale:

```bash
npx ai-i18n-tools status
```

When `translateJson` is on, `status` prints a `json[]` section (✓ up to date, ● stale or missing).

<a id="json-vs-other-pipelines"></a>
### JSON vs other pipelines

| Situation | Use |
|-----------|-----|
| UI strings in `t("…")` / `i18n.t("…")` in JS/TS/Astro | [UI strings](/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations` catalog (`{ "key": { "message": "…", "description": "…" } }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs`, **not** `json[]` |
| VitePress theme/nav/sidebar JSON (nested catalog you author) | JSON — `json[]` + `translate-json`; page bodies stay in Documents — see [VitePress integration](/guide/vitepress-integration) |
| Standalone nested locale JSON (ZenBrowser-style `translation.json` trees) | JSON — `json[]` + `translate-json` |
| Illustrated `.svg` files with `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (optional; not one of the three main pipelines) |

Field reference: [`json`](#json) in [Configuration reference](/reference/configuration#json). Cache keys for cleanup use `json-block:{blockIndex}:{projectRelPath}` in `file_tracking`.
