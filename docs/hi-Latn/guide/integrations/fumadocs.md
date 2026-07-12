<a id="fumadocs-integration"></a>
# Fumadocs integration

Use `init -t ui-fumadocs` aur `docsOutput.style: "fumadocs"` for [Fumadocs](https://www.fumadocs.dev/) 4 documentation sites on Next.js App Router. The preset is an alias for `doc-system` with an empty `localeSubpath` and BCP-47 or short locale codes preserved (`localePathLowercase` defaults to `false`).

See also [Documents](/hi-Latn/guide/documents/) aur runnable [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) demo (dot parser, port 3080).

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Enable `features.translateDocs` jab aap page content, `meta.json` sidebar labels, aur Fumadocs UI overrides ek `sync` run mein translate karte hain.

<a id="page-layout"></a>
## Page layout

Fumadocs do i18n content layouts ko support karta hai via `docsOutput.fumadocsParser`. **Dot** parser default hai (Fumadocs built-in aur production sites jaise [SWR](https://github.com/vercel/swr-site)).

<a id="dot-parser-default"></a>
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

Copy-paste dir config ke liye [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) mein `ai-i18n-tools.config.dir.example.json` dekhein. Mental model [Nextra integration](/hi-Latn/guide/integrations/nextra#page-layout) se mel khata hai.

<a id="sidebar-metajson"></a>
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

<a id="link-conventions"></a>
## Link conventions

Fumadocs Next.js middleware (`/docs/getting-started`, `/pt/docs/getting-started`) ke madhyam se locale-prefixed routes serve karta hai. **In-page links ko locale-neutral rehna chahiye** (`/docs/getting-started`) taki active locale prefix apne aap apply ho jaye.

Built-in normalizer ko enable karein taaki `translate-docs` har translated file mein links ko automatically theek kar sake:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` default roop se enable hota hai jab `style` `"fumadocs"` hota hai.

| Angrezi source mein lekhak | Normalizer ke baad |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/hi-Latn/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | aparivartit (poora URL) |

**Authoring rules**

- Cross-page doc links: Angrezi MDX mein **locale-neutral site routes** (`/docs/…`) ka upyog karein, ya `content/docs/…` / relative `.mdx` paths ka upyog karein aur normalizer ko `sync` ke dauran unhein rewrite karne dein.
- Content tree ke bahar repo files: **full URLs** ka upyog karein.
- Locale-suffixed copies (`*.pt.mdx`) ya `content/{locale}/` trees mein links ko haath se edit **na** karein — `sync` / `translate-docs` ke saath regenerate karein.

[Documents — link rewriting](/hi-Latn/guide/documents/link-rewriting) aur [Configuration — `docsOutput`](/hi-Latn/reference/configuration#docsoutput) bhi dekhein.

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

- [Configuration — `docsOutput`](/hi-Latn/reference/configuration#docsoutput)
- [Output layouts](/hi-Latn/guide/documents/output-layouts)
- [Docusaurus integration](/hi-Latn/guide/integrations/docusaurus)
- [Nextra integration](/hi-Latn/guide/integrations/nextra) (dir parser mental model)
- [VitePress integration](/hi-Latn/guide/integrations/vitepress) (UI catalog bootstrap pattern)
