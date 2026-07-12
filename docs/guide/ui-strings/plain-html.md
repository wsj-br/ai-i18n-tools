<a id="plain-html-apps"></a>
# Plain HTML apps

<a id="marking-html-for-translation"></a>
## Marking HTML for translation

For plain HTML apps (no `t("…")` calls in the markup), mark translatable elements with attributes and let `extract` capture the English text from the element itself — no duplicated string literals.

Prefer the bare form (the attribute has no value; the source text is read from the element):

- `data-i18n` — key is the element's `textContent`; at runtime you set `el.textContent = t(key)`.
- `data-i18n-title` — key is the element's `title`; at runtime you set the translated `title`.
- `data-i18n-placeholder` — key is the element's `placeholder`.

Use the valued form `data-i18n="Some key"` only when the bare form cannot work: mixed-content elements (text interleaved with child tags), or when the key must differ from the visible text. Opt an element (and its subtree) out with `data-i18n-ignore`.

Constraint: bare `data-i18n` is for leaf text elements only (a single text node, no child elements), because setting `textContent` replaces any children. For a paragraph like `Run <code>build</code> now.`, wrap each text run in its own marker instead:

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

Add the markers by hand, or let the `mark-html` command insert the bare markers for you. It is a dry run by default — it reports how many markers it would add per file and lists any mixed-content elements that need a manual `<span data-i18n>` — and only writes with `--write`:

```bash
# Preview (no changes written)
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
```

`mark-html` is idempotent, honours `data-i18n-ignore`, never marks code-like elements (`code`, `pre`, `kbd`, `samp`, `var`) or empty / numeric-only text, and never emits a valued marker. After marking, wrap any reported mixed-content fragments by hand, then add `.html` to `ui.uiExtractor.extensions` so `extract` captures the strings:

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app"></a>
## Worked example: localizing a plain HTML app

The [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) workspace example is a runnable static app that uses these markers end to end. Clone it with `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html`, run `pnpm install` and `pnpm dev`, then open [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) for Portuguese (Brazil).

Its `public/index.html` carries bare markers like:

```html
<button type="button" id="btn-apply" data-i18n>Apply</button>
<input
  type="text"
  id="filter-filename"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-title
  data-i18n-placeholder
/>
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers, then</span> <code>extract</code>
  <span data-i18n>and</span> <code>translate-ui</code><span data-i18n>.</span>
</p>
```

`ai-i18n-tools.config.json` points extraction at `public/` and writes flat bundles next to the static files:

```jsonc
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

`extract` writes each English source string into the catalog (`public/strings.json`), and `translate-ui` fills one flat bundle per locale, keyed by the English source text:

```bash
pnpm i18n:extract        # public/index.html markers → public/strings.json
pnpm i18n:translate-ui   # strings.json → public/locales/{locale}.json
```

```jsonc
// public/locales/pt-BR.json
{
  "Apply": "Aplicar",
  "Filename (partial)": "Nome do arquivo (parcial)",
  "Filter by filepath": "Filtrar por caminho do arquivo",
  "Run": "Execute",
  "to add bare markers, then": "para adicionar marcadores simples, depois",
  "and": "e",
  ".": "."
}
```

At runtime, `public/app.js` loads `/locales/ui-languages.json` for locale metadata, resolves the active locale (`?locale=` → `localStorage` → browser → `en`), fetches `/locales/{locale}.json` (skipped for English), then walks the marked elements. The key comes from the marker value when present, otherwise from the element's own text / title / placeholder (normalized the same way the extractor normalizes whitespace):

```javascript
function normalizeI18nText(s) {
  return s.trim().replace(/\s+/g, " ");
}

function t(key) {
  const raw = I18N.bundle[key];
  return typeof raw === "string" && raw.length > 0 ? raw : key;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key =
      el.getAttribute("data-i18n-placeholder") ||
      normalizeI18nText(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
}
```

`normalizeI18nText` must stay identical to `normalizeI18nText` in [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts). Because the English source text is the catalog key, untranslated strings fall back to English automatically.

The bundled [Translation Dashboard](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) uses the same `applyStaticI18n` algorithm for its HTML markers, but serves locale bundles from `GET /api/ui-i18n` instead of static `/locales/{locale}.json` files. See the example's [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) for the full workflow, project layout, and comparison table.
