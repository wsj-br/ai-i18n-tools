<a id="html-pages"></a>
# HTML pages

`translate-docs` can emit one HTML file per locale. Put `.html` or `.htm` files on a `docs[]` `contentPaths` entry and run `translate-docs` or `sync`. The English file stays the source. Locale copies are written under `outputDir`.

Use this when each language is its own page (a static site, a set of hand-written HTML docs). Use [Plain HTML apps](/guide/ui-strings/plain-html) when one HTML file stays in place and the browser swaps strings from flat JSON.

Scaffold with:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

The runnable demo is [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) (port 3092).

<a id="what-is-translated"></a>
## What is translated

Translated: visible text, `alt`, `title`, `aria-label`, `placeholder`, the `<title>`, `meta name="description"`, and `og:title` / `og:description`.

Left unchanged: `script`, `style`, `textarea`, `pre`, and `code` elements, plus `src`, `href`, and other URLs. A paragraph that contains `<code>` or `<em>` keeps those tags and translates the surrounding words.

`html lang` and `dir` are set on the locale file. The English source keeps its own `lang` until you change it.

Generated locale files are skipped on the next run when they sit under `outputDir` (a `pt-BR/` directory, or a flat `name.pt-BR.html`). A warning is printed when the same `.html` file is also a UI catalog source (`ui.sourceRoots`).

<a id="links-and-images"></a>
## Links and images

Links to other HTML pages in the same `docs[]` block are rewritten to that page's locale output. Other relative URLs are prefixed so they still resolve from the locale file.

`docsOutput.localizedAssets` optionally renames images and icons when a locale-specific file exists. CSS `url()` is not rewritten.

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| Placeholder | Meaning |
| --- | --- |
| `{stem}` | Filename without the extension |
| `{ext}` | Extension, including the dot |
| `{basename}` | Filename with the extension |
| `{locale}` | Locale code as configured (`pt-BR`) |
| `{llocale}` | Lowercase locale |
| `{LOCALE}` | Uppercase locale |

`img/trulli.jpg` with the pattern above becomes `img/trulli-pt-BR.jpg`. With `onlyIfExists: true` (the default), the original URL is kept when that file is missing. Absolute URLs, `data:` URLs, and `#` fragments are skipped. Root-relative URLs (`/img/trulli.jpg`) are tested under `assetRoot`, or under the HTML file's directory when `assetRoot` is omitted.

`srcset`, `poster`, `<source src>`, icon `<link>` URLs, and `og:image` / `twitter:image` use the same rules.

For HTML, `docsOutput.docsRoot` is removed from the project-relative path before the locale folder is added. With `docsRoot: "site"` and `style: "nested"`, `site/index.html` is written to `site/pt-BR/index.html`.

<a id="language-list-and-hreflang"></a>
## Language list and hreflang

Two comment pairs are filled in on every locale copy and on the English source (so the alternates stay reciprocal):

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

Markers inside `script`, `style`, `pre`, and `code` are ignored. A verbose run warns when a page has no pair. The same comments are the defaults when `docsOutput.html` is omitted.

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

`format: "links"` writes `<a>` elements. Inside a `<ul>`, `<ol>`, or `<nav>` each link is wrapped in `<li>`. `format: "select"` writes `<option>` rows. Put the markers inside your own `<select data-lang-select>` and load `lang-select.js` (shipped as `ai-i18n-tools/html-runtime/lang-select.js`, and copied in the example). One block uses one format.

`label` is `local` (endonym), `english`, or `both` (`English / endonym` when they differ). Locales that are not in the configured set are omitted.

`hreflang.siteUrl` prefixes alternate links. When it is unset, the links are relative and a warning is logged. `xDefault` defaults to `sourceLocale`. `stripIndexHtml` turns `index.html` into a directory URL.

There is no sitemap file, no automatic `<head>` injection, and no `canonical` or `og:locale` rewrite. The browser language does not redirect the visitor.

<a id="second-run"></a>
## Second run

Sentence translations stay in the cache. The file-tracking hash also includes the locale list and `docsOutput.html` / `localizedAssets`. Adding a locale rewrites the language list and hreflang block even when every sentence is already cached. A matching hash and an up-to-date output file skips the page.
