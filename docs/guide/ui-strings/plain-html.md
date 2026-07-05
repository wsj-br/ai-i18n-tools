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
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## Worked example: localizing a plain HTML app (the bundled dashboard)

The package's own Translation Dashboard (`src/dashboard-app`) uses these same markers. Its `index.html` carries bare markers like:

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` writes each English source string into the catalog (`strings.json`), and `translate-ui` fills one flat bundle per locale, keyed by the English source text. For a typical static HTML app you would point `ui.flatOutputDir` at a web-served directory such as `public/locales/`:

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

At runtime, load the bundle for the active locale and walk the marked elements. The key comes from the marker value when present, otherwise from the element's own text / title / placeholder (normalized the same way the extractor normalizes whitespace):

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

The marker-walking half of this snippet is exactly `applyStaticI18n` in [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js). Because the English source text is the catalog key, untranslated strings fall back to English automatically.

How the bundled dashboard differs: because it has a Node server, it does not fetch a static `/locales/{locale}.json`. The client calls `GET /api/ui-i18n`, and the server resolves the active locale (`--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > host OS) and returns `{ locale, dir, bundle }`. The client then sets `document.documentElement` `lang`/`dir` from that response (rather than reading `lang` to choose the locale) before calling `applyStaticI18n`. The bundles themselves are not the tool's content under translation — they are the dashboard's own UI strings, shipped in `src/i18n/locales/{locale}.json` (copied to `dist/i18n/locales` at build) and read server-side by `loadUiBundle` in [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts). The dashboard's `t()` also supports ```{{name}}``` interpolation, unlike the minimal `t` above.
