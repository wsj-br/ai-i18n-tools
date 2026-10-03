<a id="html-pages"></a>
# HTML pages

Use the Documents pipeline when a static site needs one translated `.html` or `.htm` file per locale. `translate-docs` translates the source page, rewrites its relative links, and writes locale copies under `outputDir`. No browser i18n runtime or `data-i18n*` markers are required.

Use [Plain HTML apps](/guide/ui-strings/plain-html) instead when one HTML file stays in place and a browser script swaps strings from flat JSON on-the-fly. Do not put the same file in both pipelines; the CLI warns when an HTML file is both a `docs[]` source and a `ui.sourceRoots` catalog source.

The runnable [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) site serves English at port 3092 and writes Portuguese to `site/pt-BR/`.

<a id="quick-start"></a>
## Quick start

Scaffold a working configuration:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

Or add this HTML portion to an `ai-i18n-tools.config.json` that already has an LLM [provider](/guide/providers-and-models):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot` should be the source tree inside `contentPaths`. It is stripped before the locale directory is inserted. With the config above:

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

Optionally add the [language-list and hreflang markers](#language-list-and-hreflang) to each source page, then run:

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

The command also refreshes the marker interiors in the source-language files. Treat locale files under `outputDir` as generated output; edit the source pages and run the command again.

<a id="what-is-translated"></a>
## What is translated

The HTML extractor translates:

- visible text that contains letters, including `<title>` and text around inline markup
- `alt`, `title`, `aria-label`, and `placeholder` attribute values
- `value` on `<input type="submit">` and `<input type="button">`
- `content` on `meta name="description"`, `meta property="og:title"`, and `meta property="og:description"`

Inline elements such as `<a>`, `<em>`, `<strong>`, `<span>`, `<img>`, and `<br>` are preserved while the surrounding sentence is translated. Code-like inline elements such as `<code>` and `<kbd>` are kept intact:

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

Entire `script`, `style`, `textarea`, `pre`, and `code` subtrees are copied unchanged. Other attributes—including `class`, `id`, `src`, `href`, and URL-bearing metadata—are not sent to the model.

On each locale copy, the pipeline sets `<html lang="…">` and the locale's `dir` (`ltr` or `rtl`). The source page keeps its authored `lang` and `dir`. Use UTF-8 HTML; the CLI warns when a `<meta charset>` declares another encoding.

<a id="output-layout"></a>
## Output layout

For the usual static-site layout, set:

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"` writes `{outputDir}/{locale}/{path relative to docsRoot}`. `style: "flat"` writes locale-suffixed files such as `site/about.pt-BR.html`. See [Output layouts](/guide/documents/output-layouts) for all styles and custom path templates.

Generated locale directories and flat locale filenames under `outputDir` are excluded from future source discovery. This prevents `site/pt-BR/index.html` or `site/index.pt-BR.html` from being translated again.

<a id="links-and-images"></a>
## Links and images

Relative links ending in `.html` or `.htm` are rewritten when their target is another source page in the same `docs[]` block. Query strings and fragments are preserved. For example, `href="about.html#history"` in `site/index.html` becomes `href="./about.html#history"` in `site/pt-BR/index.html`.

Other relative `href`, `src`, `srcset`, and `poster` URLs are depth-prefixed so shared files still resolve from the locale page. Absolute URLs, protocol-relative URLs, `data:` URLs, and fragment-only links are unchanged. Root-relative URLs remain root-relative.

`docsOutput.localizedAssets` can select a locale-specific image or icon filename:

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

`img/trulli.jpg` becomes `img/trulli-pt-BR.jpg`. With `onlyIfExists: true` (the default), that URL is used only when the localized file exists; otherwise the original shared asset is kept. Set `onlyIfExists: false` only when another build or CDN step guarantees those files.

`include` matches URL paths such as `img/**`. Use `assetRoot` to set the filesystem directory against which localized candidates—especially root-relative URLs such as `/img/trulli.jpg`—are checked.

The same localization rules apply to `srcset`, `poster`, `<source src>`, icon `<link href>`, and `og:image` / `twitter:image`. The pipeline rewrites references but does not create, translate, or copy asset files. CSS `url()` values are not rewritten.

<a id="language-list-and-hreflang"></a>
## Language list and hreflang

Put a language-list pair where visible navigation belongs, and an hreflang pair inside `<head>`:

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

On every run, the pipeline replaces only the content between each pair. It updates every locale copy and the source page, keeping alternate links reciprocal. Markers inside `script`, `style`, `pre`, and `code` are ignored. With `--verbose`, the CLI warns when a configured pair is missing.

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

The default comments work even when `docsOutput.html` is omitted. Set `languageList.start` / `end` or `hreflang.start` / `end` only when the source uses different marker text.

### Visible language navigation

- `format: "links"` writes `<a>` elements. Inside a `<ul>`, `<ol>`, or `<nav>`, each link is wrapped in `<li>`; elsewhere, `separator` joins the links.
- `format: "select"` writes `<option>` rows. Put the markers inside your own `<select data-lang-select>`, copy `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js` into the site, and load that classic script. It navigates to the selected option's generated URL.
- `label` is `local` (endonym), `english`, or `both` (`English / endonym` when they differ). Labels come from `ui-languages.json` when available, then from the package's bundled locale list.

One marker block uses one format. The generated links include `lang`, `hreflang`, and `aria-current`; the generated option for the current page has `selected`.

### Search-engine alternates

`hreflang.siteUrl` prefixes alternate URLs. Set it to the site's public origin before deployment. When it is omitted, the pipeline writes relative alternate links and logs a warning.

`xDefault` defaults to `sourceLocale`; it is emitted only when that locale is configured for the page. `stripIndexHtml: true` turns an `index.html` alternate into a directory URL.

The marker block is required: the pipeline does not inject tags into `<head>` automatically. It also does not generate a sitemap, canonical URL, or `og:locale`, and it does not redirect by browser language.

Only the configured source and target locales are eligible for language blocks. When `ui-languages.json` exists, its rows and order determine which eligible locales appear, so keep the manifest aligned with the config. If you translate with `--locale` to generate only a subset, do not publish until every linked locale output exists.

<a id="second-run"></a>
## Second run

Sentence translations stay in the cache. The file-tracking hash also includes the locale list, output style, `docsOutput.html`, and `localizedAssets`. Adding a locale or changing those options rewrites the generated blocks and links even when every sentence is already cached. A matching hash and an up-to-date output file skips that locale page.

<a id="troubleshooting"></a>
## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Output is `site/pt-BR/site/index.html` | Set `docsOutput.docsRoot` to `"site"` so that source prefix is stripped. |
| Link still points to the English page | Use a relative `.html` / `.htm` link, and include the target page in the same `docs[]` block. |
| Image path is broken from a locale page | Keep it relative so depth rewriting can apply; remember that CSS `url()` is not rewritten. |
| Localized image is not selected | Check `localizedAssets.include`, the filename `pattern`, and whether the candidate exists when `onlyIfExists` is true. |
| Language list is empty or unchanged | Keep both marker comments in the correct order and outside `script`, `style`, `pre`, and `code`. |
| Dropdown does not navigate | Add `data-lang-select` to the `<select>` and load `html-runtime/lang-select.js`. |
| Hreflang URLs use the wrong host | Set `hreflang.siteUrl` to the final public origin. |
| A translated page is translated again | Keep generated locale files under the configured `outputDir`; do not add them as separate sources. |
