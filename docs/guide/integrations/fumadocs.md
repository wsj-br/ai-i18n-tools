<a id="fumadocs-integration"></a>
# Fumadocs integration

Use `init -t ui-fumadocs` and `docsOutput.style: "fumadocs"` for [Fumadocs](https://www.fumadocs.dev/) 4 documentation sites on Next.js App Router. The preset is an alias for `doc-system` with an empty `localeSubpath` and BCP-47 or short locale codes preserved (`localePathLowercase` defaults to `false`).

See also [Documents](/guide/documents/) and the runnable [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) demo (dot parser, port 3080).

<a id="quick-start"></a>
## Quick start

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

Enable `features.translateDocs` when you translate page content, `meta.json` sidebar labels, and Fumadocs UI overrides in one `sync` run.

<a id="page-layout"></a>
## Page layout

Fumadocs supports two i18n content layouts via `docsOutput.fumadocsParser`. The **dot** parser is the default (Fumadocs built-in and production sites such as [SWR](https://github.com/vercel/swr-site)).

<a id="dot-parser-default"></a>
### Dot parser (default)

English MDX lives at the collection root. Translated copies use a locale suffix in the same directory:

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

Align `targetLocales` with `defineI18n().languages` in `lib/i18n.ts` exactly (the example uses short codes `pt` and `zh`).

<a id="enable-i18n-in-an-existing-site"></a>
### Enable i18n in an existing site

An English-only Fumadocs app needs a locale route and `defineI18n` before `translate-docs` can write sibling files. The [agent prompt](#agent-prompt) walks through an existing site. Checklist:

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and `parser: "dot"` or `"dir"`.
- `app/[lang]/` routes and `createI18nMiddleware` from `proxy.ts` (the example's file).
- `i18n.translations()` in `lib/layout.shared.ts`, passed to `i18nProvider`.
- English MDX at the collection root (dot) or under `content/docs/en/` (dir).
- `targetLocales` equal to `languages` minus the default language, then `sync`.

<a id="dir-parser-nextra-style"></a>
### Dir parser (Nextra-style)

For teams used to locale folders (`content/docs/en/` → `content/docs/pt-BR/`), set `fumadocsParser` to `"dir"`:

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

See `ai-i18n-tools.config.dir.example.json` in [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) for a copy-paste dir config. Mental model matches [Nextra integration](/guide/integrations/nextra#page-layout).

<a id="sidebar-metajson"></a>
## Sidebar (`meta.json`)

Fumadocs uses JSON `meta.json` files for sidebar structure and titles. When `docsOutput.style` is `"fumadocs"`, **`translate-docs`** collects `meta.json` under `docsRoot` (or `docs[].fumadocsMetaGlob`), translates string values for keys listed in `docs[].fumadocsMetaTranslatableKeys` (default: `title`, `description`), and writes locale outputs:

| Parser | English source | Output |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**Do not** translate `pages` slug arrays, `root`, `icon`, `defaultOpen`, or other structural keys — only human-readable labels.

<a id="ui-catalog"></a>
## UI catalog

Fumadocs layout chrome (search placeholder, locale display names, and other `defineTranslations` / `i18n.translations()` overrides in `lib/layout.shared.ts`) is not extracted from markdown. Configure **`docsOutput.fumadocsUiCatalog`** so **`translate-docs`** bootstraps the English catalog from `sourcePath` and translates per-locale JSON:

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

- **`catalogPath`** — English flat JSON. The bootstrap reads only the `en` object of `.add({ … })` in `sourcePath`. String literals in that object become catalog keys (`displayName`, `Search(search trigger)`). `.add()` only accepts keys the Fumadocs UI presets registered, so a nav title such as `site.title` cannot live there. The example keeps `site.title` in the JSON and reads `catalog["site.title"]` for `nav.title`. Keys already in the file but absent from the `en` object stay: the merge is `{ ...existing, ...extracted }`. Re-run `sync` when the English literals change.
- **`outputPathTemplate`** (optional) — per-locale outputs; default: `ui.{locale}.json` beside `catalogPath`.

A translated key does nothing until the app reads it. `i18n.translations().get(lang)` returns only keys registered with `.extend()` (the Fumadocs UI presets). Spread the locale catalog into `.add()` so those keys apply, and put native `displayName` **after** the spread so a translation of the English name does not replace it:

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` is not a Fumadocs UI key. The example reads it from the catalog for `nav.title`. A search label that exists only in `ui.pt-BR.json` stays on the built-in preset until that spread (or another read) uses it.

See [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts).

Standard locales may be covered by `@fumadocs/language/*` presets without LLM cost; the catalog translates **project overrides** in the English block only.

<a id="agent-prompt"></a>
## Agent prompt

Copy this when an English-only Fumadocs site should gain locales. It wires routing and the UI catalog. It does not translate strings.

<details class="agent-prompt">
<summary>UI catalog prompt</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

**Do not** use `json[]` for Fumadocs UI strings — that pipeline is for unrelated app locale bundles.

<a id="link-conventions"></a>
## Link conventions

Fumadocs serves locale-prefixed routes via Next.js middleware (`/docs/getting-started`, `/pt/docs/getting-started`). **In-page links should stay locale-neutral** (`/docs/getting-started`) so the active locale prefix is applied automatically.

Enable the built-in normalizer so `translate-docs` fixes links in every translated file automatically:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks` defaults to enabled when `style` is `"fumadocs"`.

| Author in English source | After normalizer |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](../guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | unchanged (full URL) |

**Authoring rules**

- Cross-page doc links: use **locale-neutral site routes** (`/docs/…`) in English MDX, or `content/docs/…` / relative `.mdx` paths and let the normalizer rewrite them during `sync`.
- Repo files outside the content tree: use **full URLs**.
- Do **not** hand-edit links in locale-suffixed copies (`*.pt.mdx`) or `content/{locale}/` trees — regenerate with `sync` / `translate-docs`.

See also [Documents — link rewriting](/guide/documents/link-rewriting) and [Configuration — `docsOutput`](/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## Locale codes

Keep `targetLocales` in `ai-i18n-tools.config.json` aligned with `defineI18n().languages` in your Fumadocs app **exactly**. The dot example uses short codes (`pt`, `zh`); dir configs may use BCP-47 folders (`pt-BR`, `zh-Hans`). There is no forced normalization — mismatched codes produce wrong output paths or missing pages.

<a id="multiple-collections"></a>
## Multiple collections

Fumadocs projects may define several `defineDocs` blocks in `source.config.ts` (docs, blog, examples). Add one `docs[]` block per collection you translate, each with its own `contentPaths`, `outputDir`, and `docsRoot`.

<a id="example-project"></a>
## Example project

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — English MDX at `content/docs/`, committed `pt` and `zh` dot-suffix pages, `meta.json`, and `lib/i18n/ui.{locale}.json`. Run `pnpm run dev` on port **3080**.

<a id="cross-references"></a>
## Cross-references

- [Configuration — `docsOutput`](/reference/configuration#docsoutput)
- [Output layouts](/guide/documents/output-layouts)
- [Docusaurus integration](/guide/integrations/docusaurus)
- [Nextra integration](/guide/integrations/nextra) (dir parser mental model)
- [VitePress integration](/guide/integrations/vitepress) (UI catalog bootstrap pattern)
