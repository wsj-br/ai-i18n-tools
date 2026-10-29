# Standalone JSON locale bundles

Use this pipeline for existing nested JSON translations, including i18next namespace files.
Use `ai-i18n-tools sync` as the default workflow; it runs enabled JSON translation after Documents.
JSON translation walks string leaves, preserves keys/structure, and does not create `strings.json`.
Existing key-based calls such as `t("nav.home")` stay key-based; runtime wiring remains yours.

## Configure source and output

For a new project, `ai-i18n-tools init -t ui-json-bundles -P <provider>` scaffolds this pipeline.
Do not rerun `init` over user configuration without approval; it rewrites the config file.
Select a provider/model and supply its credentials before sync.
The minimal JSON-only routing fragment below assumes that provider setup already exists:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "pt-BR"],
  "features": {
    "translateUIStrings": false,
    "translateDocs": false,
    "translateSVG": false,
    "translateJson": true
  },
  "json": [{
    "contentPaths": ["public/locales/en/*.json"],
    "outputPathTemplate": "public/locales/{locale}/{basename}"
  }]
}
```

This writes `public/locales/de/common.json` from `public/locales/en/common.json`.
Keep other pipeline flags enabled when the project also needs UI, Documents, or SVG translation.

- `contentPaths` accepts a string or array: `.json` files, directory trees, or globs.
- Paths resolve from the project root; include only source-locale files, not translated siblings.
- `outputPathTemplate` is required for each `json[]` block.
- Optional block `targetLocales` restricts that block; otherwise root targets apply.
- Optional `description` identifies the block in CLI output.
- Keep outputs distinct from sources and from each other; duplicate basenames can collide.

## Exact output placeholders

- `{locale}` preserves the configured locale code, such as `pt-BR`.
- `{LOCALE}` uppercases it (`PT-BR`); `{llocale}` lowercases it (`pt-br`).
- `{basename}` includes the filename extension, such as `common.json`.
- `{stem}` excludes the extension (`common`); `{extension}` includes its dot (`.json`).
- `{relativeToSourceRoot}` currently expands to the project-relative source path, not the path relative to a glob's directory.
- For `public/locales/en/common.json`, that last variable includes `public/locales/en/`.
- Do not assume Documents placeholders such as `{outputDir}` or `{relPath}` work here.
- Use `{basename}` for namespaces; split blocks or choose distinct templates if namespace filenames repeat.

## Select translatable values with `keyPolicy`

The policy selects values; it never translates JSON property names.
When omitted, the default is `denylist` with `id`, `slug`, `href`, `url`, `key`, and `code` skipped.
Merge an explicit policy into the relevant `json[]` block when the source shape needs it:

```json
{
  "keyPolicy": {
    "mode": "both",
    "translateKeys": ["nav.*", "messages.*"],
    "skipKeys": ["id", "slug", "href", "url", "key", "code"]
  }
}
```

- `allowlist`: translate only values matching `translateKeys`; an empty list selects nothing.
- `denylist`: translate all string leaves except matches in `skipKeys`.
- `both`: apply the allowlist first, then subtract denylist matches.
- Patterns support dot paths (`nav.home.label`) and minimatch globs.
- Bare names match the final path segment at any depth; array paths contain numeric indices.
- An explicit policy's omitted lists default to empty; include your identifier exclusions deliberately.
- Numbers, booleans, nulls, and skipped strings remain unchanged.
- Literal dots in property names conflict with the extractor's dot-path addressing; inspect such catalogs before using this pipeline.

## Interpolation, plurals, and pipeline boundaries

- Interpolation tokens such as `{{name}}` in values are preserved; verify them in generated bundles.
- `key_one`, `key_other`, and other plural suffixes are independent leaves, not a grouped plural family.
- No missing target-language CLDR categories are synthesized; test counts with the consumer runtime.
- Do not assume ICU messages are parsed or expanded into target plural forms by this pipeline.
- UI source-string extraction and `{ plurals: true }` catalog handling belong to `ui`, not `json[]`.
- Docusaurus `{ message, description }` catalogs belong to `docs[].docusaurusCatalogDir`.
- VitePress theme catalogs, Nextra dictionaries, and Fumadocs shell catalogs also belong to Documents.

## Refresh and verify

1. Edit source JSON and config, then run `ai-i18n-tools sync` when translation is authorized.
2. Use `ai-i18n-tools status` to inspect JSON coverage and stale/missing outputs.
3. Parse outputs, compare key structure, check placeholders, and test namespace loading and plural counts.
4. Fix source/config and rerun sync; treat generated target JSON as pipeline-owned output.

## Published guides

- [JSON bundles](https://wsj-br.github.io/ai-i18n-tools/guide/json)
- [JSON configuration](https://wsj-br.github.io/ai-i18n-tools/reference/configuration#json)
- [Combining pipelines](https://wsj-br.github.io/ai-i18n-tools/guide/combining-pipelines)
