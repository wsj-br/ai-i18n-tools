<a id="fumadocs-integration"></a>
# Fumadocs integration

Use `init -t ui-fumadocs` aur `docsOutput.style: "fumadocs"` for [Fumadocs](https://www.fumadocs.dev/) 4 documentation sites on Next.js App Router. The preset is an alias for `doc-system` with an empty `localeSubpath` and BCP-47 or short locale codes preserved (`localePathLowercase` defaults to `false`).

See also [Documents](/guide/documents/) aur runnable [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) demo (dot parser, port 3080).

<a id="quick-start"></a>
## Turant shuru karein

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Enable `features.translateDocs` jab aap page content, `meta.json` sidebar labels, aur Fumadocs UI overrides ek `sync` run mein translate karte hain.

<a id="page-layout"></a>
## Page layout

Fumadocs do i18n content layouts ko support karta hai via `docsOutput.fumadocsParser`. **Dot** parser default hai (Fumadocs built-in aur production sites jaise [SWR](https://github.com/vercel/swr-site)).

### Dot parser (default)

English MDX collection root par rehta hai. Anuvadit copies ek locale suffix ka upyog karte hain same directory mein:

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

Align `targetLocales` ko `defineI18n().languages` ke saath `lib/i18n.ts` mein exactly (example mein short codes `pt` aur `zh` ka upyog kiya gaya hai).

<a id="dir-parser-nextra-style"></a>
### Dir parser (Nextra-style)

Teams ke liye jo locale folders (`content/docs/en/` → `content/docs/pt-BR/`) ka upyog karte hain, `fumadocsParser` ko `"dir"` par set karein:

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

See `ai-i18n-tools.config.dir.example.json` in [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) ek copy-paste dir config ke liye. Mental model [Nextra integration](/guide/nextra-integration#page-layout) ke saath match karta hai.

<a id="meta-json-sidebar"></a>
## Sidebar (`meta.json`)

Fumadocs JSON `meta.json` files ka upyog karta hai sidebar structure aur titles ke liye. Jab `docsOutput.style` `"fumadocs"` hota hai, **`translate-docs`** `meta.json` ko `docsRoot` (ya `docs[].fumadocsMetaGlob`) ke neeche collect karta hai, string values ko keys listed in `docs[].fumadocsMetaTranslatableKeys` (default: `title`, `description`) ke liye translate karta hai, aur locale outputs likhta hai:

| Parser | English source | Output |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**Do not** translate `pages` slug arrays, `root`, `icon`, `defaultOpen`, ya anya structural keys — sirf human-readable labels.

<a id="ui-catalog"></a>
## UI catalog

Fumadocs layout chrome (search placeholder, locale display names, aur anya `defineTranslations` / `i18n.translations()` overrides in `lib/layout.shared.ts`) markdown se extract nahi hota. Configure **`docsOutput.fumadocsUiCatalog`** taaki **`translate-docs`** English catalog ko `sourcePath` se bootstrap kare aur per-locale JSON ko translate kare:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — generated English flat JSON (bootstrap output). Re-run `sync` jab English overrides in `layout.shared.ts` badalte hain.
- **`outputPathTemplate`** (optional) — per-locale outputs; default: `ui.{locale}.json` beside `catalogPath`.

Load per-locale JSON in `layout.shared.ts` via `loadUiCatalog(locale)` aur merge with `i18nProvider(translations, lang)` in aapke root layout mein. See [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Standard locales ko `@fumadocs/language/*` presets bina LLM cost ke cover kiya ja sakta hai; catalog sirf English block mein **project overrides** ka anuvad karta hai.

Fumadocs UI strings ke liye `json[]` ka upyog **na karein** — vah pipeline asambandhit app locale bundles ke liye hai.

<a id="framework-shell-translation"></a>
## Framework shell anuvaad

| Framework | Shell / theme strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` catalog | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme/nav/sidebar catalog | Documents — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` sidebar labels | Documents — auto jab `style: "nextra"` + `translate-docs` |
| Nextra | Theme dictionary `.ts` | Documents — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` sidebar labels | Documents — auto jab `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI overrides catalog | Documents — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Built-in UI strings | Documents — `translate-docs` (sirf pages) |

<a id="link-conventions"></a>
## Link conventions

Jab `rewriteFumadocsLinks` enable hota hai (`fumadocs` preset ke liye default), `content/docs/…` ya relative `.mdx` paths ke markdown links ko locale-neutral routes `/docs/…` mein rewrite kiya jata hai (`.mdx` hatayein, `index` ko collapse karein). External URLs, `mailto:`, aur `#anchors` mein koi badlav nahi hota hai.

English source mein `/docs/...` ka upyog karein jab aap locales mein stable routes chahte hain. Dekhein [Documents — link rewriting](/guide/documents/link-rewriting).

<a id="locale-codes"></a>
## Locale codes

Apne Fumadocs app mein `ai-i18n-tools.config.json` mein `targetLocales` ko `defineI18n().languages` ke saath **bilkul** align rakhein. Dot example mein short codes (`pt`, `zh`) ka upyog hota hai; dir configs mein BCP-47 folders (`pt-BR`, `zh-Hans`) ka upyog ho sakta hai. Koi zabardasti normalization nahi hai — mismatched codes galat output paths ya missing pages produce karte hain.

<a id="multiple-collections"></a>
## Multiple collections

Fumadocs projects `source.config.ts` mein kai `defineDocs` blocks define kar sakte hain (docs, blog, examples). Har collection ke liye ek `docs[]` block jodein jise aap translate karte hain, har ek apne `contentPaths`, `outputDir`, aur `docsRoot` ke saath.

<a id="example-project"></a>
## Example project

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — English MDX `content/docs/` par, committed `pt` aur `zh` dot-suffix pages, `meta.json`, aur `lib/i18n/ui.{locale}.json`. Port **3080** par `pnpm run dev` chalayein.

<a id="cross-references"></a>
## Cross-references

- [Configuration — `docsOutput`](/reference/configuration#docsoutput)
- [Output layouts](/guide/documents/output-layouts)
- [Nextra integration](/guide/nextra-integration) (dir parser mental model)
- [VitePress integration](/guide/vitepress-integration) (UI catalog bootstrap pattern)
