# Future: Arbitrary Nested JSON Translation

Deferred from the Astro Template Translator plan. Decision pending on whether to implement.

## Motivation — zenbrowser-www pattern

Some Astro sites (e.g. `references/zenbrowser-www`) store all UI strings in a per-locale JSON file
(`src/i18n/{locale}/translation.json`) rather than as static text nodes in `.astro` templates.
Components load strings at build time via a `getUI(locale)` helper; every piece of text in the
template is a `{expression}`. The `AstroTemplateExtractor` finds nothing to translate in these
sites because there are no HTML text nodes.

What this class of site needs: translate `src/i18n/en/translation.json` into
`src/i18n/{locale}/translation.json` for each target locale.

## Why the existing `JsonExtractor` is not enough

The current `JsonExtractor` only handles Docusaurus-style JSON:

```json
{ "key": { "message": "...", "description": "..." } }
```

Zen browser's `translation.json` is an arbitrary nested structure with five patterns the extractor
cannot handle.

### Gap 1 — Plain string leaf values (critical)

```json
{ "title": "Zen Mods", "description": "Browse our diverse collection..." }
```

`JsonExtractor.extract()` walks looking for objects with a `message` property. Plain `string`
values at any depth are silently skipped → the entire zen browser JSON would produce zero segments.

### Gap 2 — Arrays of strings (critical)

```json
{ "description": ["Beautifully designed...", "We care about your experience..."] }
```

`JsonExtractor.extract()` skips arrays entirely. Each element would need to be its own translatable
segment, then reassembled back as an array.

### Gap 3 — Mixed-type objects (medium)

```json
{ "text": "calmer ", "highlight": true }
```

`highlight` is a boolean flag — it must not be translated. The extractor needs to translate only
`string`-valued fields and copy non-string fields unchanged.

### Gap 4 — Curly-brace template tokens (medium)

```json
{ "pagination": "{input} of {totalPages} ({totalItems} items)" }
```

Zen browser uses `{variable}` tokens as its own string interpolation. These must be protected as
opaque placeholders during AI translation (like `{{HTM_N}}`). No current placeholder handler covers
`{word}` patterns in plain-text strings.

### Gap 5 — Inline HTML in string values (low — infrastructure exists but unwired)

```json
{ "description": "...<br />You can <a href=\"/donate\" class=\"zen-link\">donate</a>!" }
```

The existing `PlaceholderHandler.protectHtmlTags()` already handles this, but it is not currently
wired into the JSON translation path.

### Gap 6 — Routing arbitrary JSON via `contentPaths` (low)

Currently `.json` files only flow through the `jsonSource` Docusaurus-catalog mode. Supporting
arbitrary JSON in `contentPaths` needs a small dispatch addition in `doc-translate.ts`. The output
path logic (`style: "astro-starlight"` with `docsRoot: "src/i18n/en"`,
`outputDir: "src/i18n"`) already produces the correct `src/i18n/de/translation.json` path —
no new output-path logic required.

### Gap 7 — Untranslatable values (informational)

Some string-valued fields are not user-facing text: `link` URLs
(`"link": "https://cheff.dev/"`), sponsor names (brand names — glossary can protect them),
`alt` text for logos. A config option to exclude specific JSON key paths
(e.g. `"excludeKeys": ["*.link", "sponsors.*.url"]`) would prevent spurious translations.

## Proposed solution sketch

A new `I18nJsonExtractor` (or an `"arbitrary"` mode flag on the existing `JsonExtractor`) that:

- Extracts all string leaf values recursively
- Handles string elements inside arrays (each element becomes a segment; index tracked via key
  like `routes.index.description[1]`)
- Copies non-string values (booleans, numbers, URLs detected by heuristic) unchanged
- Protects `{variable}` tokens via a new `CurlyVarPlaceholder` handler before calling the
  AI and restores them afterward
- Applies `protectHtmlTags()` to values containing `<` characters

Config would look like:

```json
{
  "documentations": [{
    "description": "Zen Browser i18n JSON",
    "contentPaths": ["src/i18n/en/translation.json"],
    "outputDir": "src/i18n",
    "markdownOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/i18n/en"
    },
    "jsonMode": "arbitrary",
    "excludeKeys": ["**.link", "**.url", "**.name"],
    "addFrontmatter": false
  }]
}
```

## Relationship to the AstroTemplateExtractor plan

The two features are completely independent. They share only the translation cache, glossary, and
batching infrastructure. Implementing arbitrary JSON translation does not require any changes to
`AstroTemplateExtractor`, and vice versa.
