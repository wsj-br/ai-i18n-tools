<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: Package Overview

Yah dastavez `ai-i18n-tools` ke aantarik architecture ka varnan karta hai, ki har component kaise ek saath fit hota hai, aur kaise teen composable workflows (UI strings, documents, nested JSON) aur optional SVG translation lagu kiye jaate hain.

Vyavaharik upyog nirdeshon ke liye, [GETTING_STARTED.md](GETTING_STARTED.hi-Latn.md) dekhen. Anuvadit dastavezon mein screenshots aur illustrated SVGs ke liye, [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.hi-Latn.md) dekhen.

<small>**Anya bhashaon mein padhen:** </small>
<small id="lang-list">[English (UK)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [Hindi (Roman)](./PACKAGE_OVERVIEW.hi-Latn.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [简体中文](./PACKAGE_OVERVIEW.zh-Hans.md) · [繁體中文](./PACKAGE_OVERVIEW.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Vishay-soochi**

- [Architecture overview](#architecture-overview)
- [Source tree](#source-tree)
- [Workflow 1 - UI Translation internals](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [Flat locale files](#flat-locale-files)
  - [UI Translation prompts](#ui-translation-prompts)
- [Workflow 2 - Document Translation internals](#workflow-2---document-translation-internals)
- [Workflow 3 - Nested JSON internals](#workflow-3---nested-json-internals)
  - [Extractors](#extractors)
  - [Astro hybrid sites (UI + page HTML)](#astro-hybrid-sites-ui--page-html)
  - [Heading anchor insertion (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [Placeholder protection](#placeholder-protection)
  - [Cache (`TranslationCache`)](#cache-translationcache)
  - [Output path resolution](#output-path-resolution)
  - [Flat link rewriting](#flat-link-rewriting)
- [Shared infrastructure](#shared-infrastructure)
  - [`LlmClient`](#openrouterclient)
  - [Config loading](#config-loading)
  - [Logger](#logger)
- [Runtime helpers API](#runtime-helpers-api)
  - [RTL helpers](#rtl-helpers)
  - [i18next setup factories](#i18next-setup-factories)
  - [Display helpers](#display-helpers)
  - [String helpers](#string-helpers)
- [Programmatic API](#programmatic-api)
- [Extension points](#extension-points)
  - [Custom function names (UI extraction)](#custom-function-names-ui-extraction)
  - [Custom extractors](#custom-extractors)
  - [Custom output paths](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## Architecture overview

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, mark-html, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser
```

Jo kuch bhi consumers ko programmatically chahiye ho sakta hai, use `src/index.ts` se re-export kiya jaata hai.

---

<a id="source-tree"></a>
## Source tree

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── locale-utils.ts             BCP-47 normalisation and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## Workflow 1 - UI Translation internals

```text
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
LlmClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

JS/TS files mein `t("literal")` aur `i18n.t("literal")` calls dhoondhne ke liye `i18next-scanner` ke `Parser.parseFuncFromString` ka upyog karta hai. `.astro` sources ke liye (jab `ui.uiExtractor.extensions` mein soochi-baddh ho), `ui-string-babel.ts` frontmatter aur template `{expression}` blocks ko `@babel/parser` ke saath parse karta hai aur wahi `funcNames` rules lagu karta hai. Function names aur file extensions `ui.uiExtractor` ke madhyam se configurable hain (`ui.reactExtractor` ek samarthit alias hai). `extract` **non-scanner inputs ko bhi usi catalog mein merge karta hai:** project `package.json` `description` jab `includePackageDescription` enabled ho (default), aur har `englishName` `ui-languages.json` se jab `includeUiLanguageEnglishNames` `true` ho aur `uiLanguagesPath` set ho (source mein pehle se mili strings ko prathamikta milti hai). Segment hashes trimmed source string ke **MD5 ke pehle 8 hex chars** hote hain — ye `strings.json` mein keys ban jaate hain.

`.html` / `.htm` sources ke liye (jab `ui.uiExtractor.extensions` mein list kiya gaya ho), `extract` file ko `html-i18n-marks.ts` ke through route karta hai, jo `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` marker attributes ko scan karta hai (`ui.uiExtractor.htmlI18nAttributes` ke through configurable). Ek nanga marker apne source text ko element ke khud ke `textContent` / `title` / `placeholder` se leta hai; ek valued marker (`data-i18n="Key"`) value ka upyog karta hai. Yahi module `mark-html` command ko power karta hai, jo nange markers ko automatically insert karta hai. HTML files kabhi bhi Babel / i18next-scanner passes tak nahi pahunchti hain.

Plain Astro SSG sites i18next ko skip kar sakte hain: build time par flat `{locale}.json` load karen aur source-text key dwara `t('English')` resolve karen (dekhen `examples/astro-website/src/i18n/t.ts` aur [GETTING_STARTED — Astro website](GETTING_STARTED.hi-Latn.md#astro-website)).

Plain HTML apps marker attributes ke saath wahi catalog model follow karte hain `t()` calls ke bajaye — [GETTING_STARTED — Marking HTML for translation](GETTING_STARTED.hi-Latn.md#marking-html-for-translation) dekhein.

<a id="stringsjson"></a>
### `strings.json`

Master catalog ka roop hai:

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (vaikalpik) — prati sthaan ke anusaar, kis model ne us anuvaad ko us sthaan ke liye antim safal `translate-ui` run ke baad utpann kiya (ya yadi text Translation Dashboard se save kiya gaya tha to `user-edited`). `locations` (vaikalpik) — jahaan `extract` ko string mili (scanner + package description line; manifest-only `englishName` strings `locations` ko chhod sakte hain).

`extract` nayi keys jodta hai aur scan mein abhi bhi maujood keys ke liye maujooda `translated` / `models` data ko surakshit rakhta hai (scanner literals, vaikalpik description, vaikalpik manifest `englishName`). `translate-ui` ghumshuda `translated` entries ko bharta hai, un sthano ke liye `models` ko update karta hai jinhe yeh anuvaad karta hai, aur flat locale files likhta hai.

`ui-languages.json` **manifest** — `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, reference `englishName`, `"ltr"` ya `"rtl"`) ka JSON array. `generate-ui-languages` ka upyog `sourceLocale` + `targetLocales` aur bundled master `data/ui-languages-complete.json` se ek project file banane ke liye karein.

<a id="flat-locale-files"></a>
### Flat locale files

Har target locale ko ek flat JSON file (`de.json`) milti hai jo source string → translation (koi `models` field nahi) ko map karti hai:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next inhein resource bundles ke roop mein load karta hai aur source string (key-as-default model) dwara anuvaad khojta hai.

<a id="ui-translation-prompts"></a>
### UI Translation prompts

`buildUIPromptMessages` system + user messages banata hai jo:

- Source aur target languages ko pehchante hain (`localeDisplayNames` ya `ui-languages.json` se display name dwara).
- Strings ka ek JSON array bhejte hain aur badle mein translations ka ek JSON array anurodh karte hain.
- Uplabdh hone par glossary hints shamil karte hain.

`LlmClient.translateUIBatch` har model ko kram mein prayas karta hai, parse ya network errors par wapas aata hai. CLI active provider ke `translationModels` se us list ko banata hai; `translate-ui` ke liye, vaikalpik `ui.preferredModel` ko set hone par aage joda jata hai (baaki ke khilaaf deduplicate kiya gaya).

---

<a id="workflow-2---document-translation-internals"></a>
## Workflow 2 - Document Translation internals

```text
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

<a id="extractors"></a>
### Extractors

Sabhi extractors `BaseExtractor` ka vistar karte hain aur `extract(content, filepath): Segment[]` ko lagu karte hain.

- `MarkdownExtractor` - markdown ko typed segments mein vibhajit karta hai: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML frontmatter ko **non-translatable** ke roop mein vargikrit kiya gaya hai (`slug`, `id`, aur anya routing keys sthir rehte hain). Top-level `export ...` blocks (jaise React component definitions) ko maujooda `import ...` handling ke saath non-translatable `other` segments ke roop mein vargikrit kiya gaya hai. Capital JSX tag se shuru hone wale multi-line blocks (jaise ek `<Tabs>` block) ko translatable paragraphs ke roop mein vargikrit kiya gaya hai. Non-translatable segments (code blocks, raw HTML) ko jyon ka tyon rakha jata hai.
- `AstroTemplateExtractor` - `.astro` marketing pages ke liye parse-and-replace (`translate-docs` via `translateAstroFile` in `doc-translate.ts`). User-facing HTML text nodes aur translatable attributes (`alt`, `title`, `aria-label`, `placeholder`) ko extract karta hai, saath hi template `{expression}` blocks ke andar string literals ko jab user-facing ho. Frontmatter TypeScript, `<script>`, `<style>`, protected attribute/key values, aur `t('…')` ke andar literals ko chhod deta hai. Reassembly relative imports ko adjust karta hai jab output paths gehre hote hain (jaise `src/pages/de/index.astro`). Dekhein [GETTING_STARTED — Astro website pages](GETTING_STARTED.hi-Latn.md#astro-website-parse-and-replace).
- `JsonExtractor` - Docusaurus JSON label files (Docusaurus UI catalogs, not MDX body) se string values extract karta hai.
- `SvgExtractor` - SVG se `<text>`, `<title>`, aur `<desc>` content extract karta hai (`translate-svg` dwara `config.svg` ke antargat files ke liye upyog kiya jata hai, `translate-docs` dwara nahi).
- `html-i18n-marks.ts` - ek focused HTML tag scanner jise `extract` `.html` / `.htm` sources ke liye aur `mark-html` command dwara istemal kiya jata hai. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` `data-i18n*` marker attributes ko read karte hain (nanga marker → element `textContent` / `title` / `placeholder`; valued marker → value), aur `markHtmlContent` nange markers ko leaf text / title / placeholder elements mein insert karta hai (idempotent, `data-i18n-ignore` ko maan'ya karta hai, code-like aur mixed-content elements ko skip karta hai). Shared `normalizeI18nText` helper build-time keys ko browser runtime ke saman rakhta hai.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro hybrid sites (UI + page HTML)

Sadharan Astro apps aksar ek hi config mein **dono** workflows ko saksham karte hain (reference: `examples/astro-website/`):

| Layer | Mechanism | Output |
|-------|-----------|--------|
| Template HTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` ke antargat prati-locale `.astro` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | Flat `public/locales/{locale}.json` (key ke roop mein English source) |

`sync` command saksham steps ko kram mein chalata hai: **extract** phir **translate-ui** (jab `features.translateUIStrings`) → vaikalpik **translate-svg** → **translate-docs** → vaikalpik **translate-json** (jab tak `--no-ui`, `--no-svg`, `--no-docs`, ya `--no-json` ke saath skip na kiya gaya ho). Init template `ui-astro-website` keval Workflow 1 ko scaffold karta hai; page HTML ke liye `docs[]` aur `features.translateDocs` jodein.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Heading anchor insertion (`write-heading-ids` CLI)

`write-heading-ids` command documentation markdown ke liye ek **local, non-LLM** preprocessor hai. Implementation: `src/cli/write-heading-ids.ts` file discovery ko orchestrate karta hai; `src/markdown/write-heading-ids-core.ts` lines ko parse karta hai aur anchors insert karta hai.

Isko **kam se kam ek `docs[]` block** ke saath ek valid config ki zaroorat hoti hai. Har block ke liye yeh `contentPaths` ke tahat `.md` / `.mdx` files ikattha karta hai, project ke `.translate-ignore` rules (doc translation jaisa hi idea) apply karta hai, aur optional roop se `--path` / `--file` ke saath ek subtree tak seemit karta hai. Har file ko `applyHeadingAnchorsToMarkdown` ke saath transform kiya jaata hai: fenced code blocks ke bahar har **flat ATX heading** (`# …` se `###### …` tak) ke liye, ek empty HTML line `<a id="slug"></a>` upar ki line par insert ki jaati hai jab woh missing ya outdated ho. Slug algorithms common ecosystems se match karte hain — `github` (default), `bitbucket`, `gitlab`, `pymdown` (optional Unicode normalisation / percent-encoding flags), `azure-devops` — taaki anchor IDs existing tooling (doctoc, PyMdown, etc.) ke saath consistent rahen. `--dry-run` bina likhe hone wale edits ki report karta hai.

Yeh command `translate-docs` ya `sync` ke andar **nahi** chalta hai; ise explicitly chalayen jab aap translation ya publishing se pehle source files mein stable fragment IDs chahte hain.

<a id="placeholder-protection"></a>
### Placeholder protection

Translation se pehle, sensitive syntax ko opaque tokens se badal diya jaata hai taaki LLM corruption ko roka ja sake, is order mein apply kiya jaata hai (restore ulta hota hai):

1. **HTML tags aur comments** (`<strong>`, `<!-- ... -->`, etc.) - ek gyat allowlist se lowercase HTML tags ko `{{HTM_N}}` tokens se badal diya jaata hai. Capitalised JSX tags (`<Highlight>`, `<Tabs>`, `</Tab>`) ko MDX layer (step 4) dwara alag se handle kiya jaata hai.
2. **Admonition markers** (`:::note`, `:::`) - sirf opening line par directive prefix ko `{{ADM_OPEN_N}}` se badal diya jaata hai; koi bhi same-line title model ke translate karne ke liye chhod diya jaata hai. Exact original text ke saath restore kiya jaata hai.
3. **Doc anchors** (HTML `<a id="…">`, Docusaurus heading `{#…}`) - verbatim preserve kiye jaate hain.
4. **MDX-only constructs** (`src/processors/mdx-placeholders.ts`):
   - **MDX comments** (`{/* … */}`, jisme Docusaurus heading-id form `{/* #my-id */}` shamil hai) ko `{{MDX_N}}` se badal diya jaata hai.
   - **Capitalised JSX tags** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - `{{MDX_N}}` ke roop mein preserve kiye jaate hain jisme translatable string attributes (`label`, `tooltip`, `aria-label`) ko tag ke andar `{{JXA_N}}` mein rewrite kiya jaata hai jab tak ki attribute name `docs[].protectAttributes` mein na dikhe; `<Tabs values={[ { label: 'Translation ke baad, ek map se restore kiye jaate hain.' } ]}>` object literals (`docs[].protectKeys` ke madhyam se skippable) aur `<TabItem value="Translation ke baad, ek map se restore kiye jaate hain.">` (jab koi `label` attribute maujood na ho, lowercase slug-like values ko skip karte hue) ke andar `label:` ko bhi extract kiya jaata hai. Segment mein `||JXA_N: …||` lines ke roop mein append kiya jaata hai, `restoreMdx` dwara wapas merge kiya jaata hai.
   - **MDX brace expressions** (`{frontMatter.title}`, `style={{…}}`) - depth-aware matching, `{{MDX_N}}` se badal diya jaata hai.
5. **Markdown URLs** (`](url)`, `src="../../docs/…"`) - translation ke baad ek map se restore kiye jaate hain.
6. **Inline code spans** (`` `code` ``) aur **bold-wrapped inline code** (`**`code`**`) - preserve kiye jaate hain.
7. **Markdown emphasis** (optional, CJK/RTL locales ke liye auto-enabled) - emphasis delimiters masked.

Astro templates aur MDX JSX ke liye shared attribute/key protection `src/processors/expression-attribute-protection.ts` mein implement kiya gaya hai aur `docs[].protectAttributes` aur `docs[].protectKeys` dwara har block ke liye chalaya jaata hai ([GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.hi-Latn.md#protectattributes-protectkeys) dekhen).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

SQLite database (`node:sqlite` ke madhyam se) `(source_hash, locale)` dwara keyed rows ko `translated_text`, `model`, `filepath`, `last_hit_at`, aur related fields ke saath store karta hai. Hash SHA-256 normalized content (whitespace collapsed) ke pehle 16 hex chars ka hota hai.

Har ek run par, segments ko hash × locale dwara dekha jata hai. Kewal cache misses LLM par jate hain. Translation ke baad, `last_hit_at` ko current translate scope mein segment rows ke liye reset kiya jata hai jo hit nahi hue the. Doc translation ke dauran safal cache hits us segment ke liye stale `translation_failures` rows ko saaf karte hain. `cleanup` pahle `sync --force-update` chalata hai, phir stale segment rows (null `last_hit_at` / empty filepath) ko hatata hai, `file_tracking` keys ko hata deta hai jab resolved source path disk par gayab hota hai (`doc-block:…`, `json-block:…`, `svg-files:…`, aadi), un translation rows ko hatata hai jinka metadata filepath ek gayab file ki or ishara karta hai, orphaned `translation_failures` rows ko hatata hai, aur orphaned `markdown_source_issues` rows ko hatata hai jinka resolved source path disk par gayab hai; yeh `cache.db` ka backup nahi leta jab tak ki `--backup <path>` pass na kiya jaye, jo pahle us path par ek backup likhta hai.

`translate-docs` command **file tracking** ka bhi upyog karta hai, taki maujooda outputs ke saath bina badle sources poore kaam ko chhod saken. `--force-update` segment cache ka upyog karte hue file processing ko phir se chalata hai; `--force` file tracking ko saaf karta hai aur API translation ke liye segment cache reads ko bypass karta hai. Jab har configured model markdown segment par AST validation mein fail ho jata hai, to `translate-docs` segment ko dheere-dheere split kar sakta hai aur chhote hisson ko phir se try kar sakta hai (`docs[].segmentSplitting.qualityRetrySplit`, default on). Poori flag table ke liye [Getting Started](GETTING_STARTED.hi-Latn.md#cache-behaviour-and-translate-docs-flags) dekhen.

**Batch prompt format:** `translate-docs --prompt-format` XML (`<seg>` / `<t>`) ya JSON array/object shapes ko keval `LlmClient.translateDocumentBatch` ke liye chunta hai; extraction, placeholders, aur validation mein koi badlav nahi hota. [Batch prompt format](GETTING_STARTED.hi-Latn.md#batch-prompt-format) dekhen.

<a id="output-path-resolution"></a>
### Output path resolution

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` source-relative path ko output path par map karta hai:

- `nested` style (default): markdown ke liye `{outputDir}/{locale}/{relPath}`.
- `doc-system` style: `docsRoot` ke tahat, outputs `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` ka upyog karte hain; `docsRoot` ke bahar ke paths nested layout par wapas aa jate hain. Aliases: `docusaurus` (default `localeSubpath` = Docusaurus plugin path), `astro-starlight` (default empty `localeSubpath`).
- `flat` style: `{outputDir}/{stem}.{locale}{extension}`. Jab `flatPreserveRelativeDir` `true` hota hai, to source subdirectories `outputDir` ke tahat rakhi jati hain.
- **Custom** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` ka upyog karne wala koi bhi markdown layout.
- **Custom** `jsonPathTemplate`: JSON label files ke liye alag custom layout, wahi placeholders ka upyog karte hue.
- `linkRewriteDocsRoot` flat-link rewriter ko sahi prefixes compute karne mein madad karta hai jab translated output default project root ke alawa kahin aur rooted hota hai.

<a id="flat-link-rewriting"></a>
### Flat link rewriting

Jab `docsOutput.style === "flat"` hota hai, to translated markdown files locale suffixes ke saath source ke bagal mein rakhe jate hain. Pages ke beech ke relative links ko rewrite kiya jata hai taki `[Guide](../../docs/guide.md)` `readme.de.md` mein `guide.de.md` ko point kare. `rewriteRelativeLinks` dwara niyantrit (custom `pathTemplate` ke bina flat style ke liye auto-enabled). Wahi pass `postProcessing.regexAdjustments` chalne se pehle non-markdown asset URLs mein per-file depth prefix jodta hai — [Locale assets guide](LOCALE-ASSETS-GUIDE.hi-Latn.md#the-flat-link-rewriter-and-two-step-flow) dekhen.

---

<a id="workflow-3---nested-json-internals"></a>
## Workflow 3 - Nested JSON internals

```text
json[].contentPaths  →  resolve files (file | directory | glob)
      │
      ▼  NestedJsonExtractor
string leaves selected by keyPolicy (dot paths + minimatch)
      │
      ▼  PlaceholderHandler + batch + TranslationCache (shared SQLite)
cache hit → skip, miss → LlmClient.translateDocumentBatch
      │
      ▼  NestedJsonExtractor.reassemble
output file  ─────────── expandJsonBlockOutputPath(outputPathTemplate)
```

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) arbitrary nested JSON ko walk karta hai aur har translatable string leaf ke liye ek segment emit karta hai. `keyPolicy.mode` (`allowlist`, `denylist`, ya `both`) dot notation par minimatch ke saath paths ko filter karta hai (`slug` jaise nange naam final key segment se match karte hain).
- Cache file tracking `file_tracking` mein `json-block:{blockIndex}:{projectRelPath}` ka upyog karta hai (docs aur SVG ke saman `cacheDir`).
- Docusaurus `write-translations` catalogs (`{ message, description }` shape) ke liye **nahi** — ve Workflow 2 (`docs[].docusaurusCatalogDir` + `JsonExtractor` `translate-docs` ke andar) ka upyog karte hain.
- `t()` UI strings ke liye **nahi** — Workflow 1 (`strings.json` + flat bundles).
- CLI: `translate-json`; `src/cli/translate-json-run.ts` mein orchestration. Init template: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Shared infrastructure

<a id="openrouterclient"></a>
### `LlmClient`

Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) par bana provider-agnostic chat client. Yah `provider` / `providers` se active provider ko resolve karta hai, us provider ke `baseUrl` + API key ke liye ek OpenAI-compatible client (`createOpenAICompatible`) banata hai, aur sabhi calls ko `generateText` ke madhyam se route karta hai. `OpenRouterClient` ko ek deprecated alias ke roop mein rakha gaya hai. Mukhya vyavahar:

- **Model fallback**: resolve kiye gaye list mein har model ko kram mein try karta hai; request ya parse failures par fallback karta hai. UI translation maujood hone par pehle `ui.preferredModel` ko resolve karta hai, phir provider ke `translationModels` ko.
- **Request timeout**: active provider ka `requestTimeoutMs` (default 30 seconds) `AbortSignal.timeout` ke madhyam se har request ko abort karta hai. Wahi value `GET /models` par lagu hoti hai jab CLI `check-models` (koi bhi provider) ke liye provider ki model list load karta hai aur optional pre-flight filter jo unknown model ids ko drop karta hai (keval OpenRouter).
- **OpenRouter extras** (keval jab `openrouter` active ho): `provider` request field ke madhyam se throughput routing, `HTTP-Referer` / `X-Title` headers, aur `usage.cost` se padhi gayi exact USD cost. Token usage har provider ke liye report kiya jata hai; exact cost keval tab jab provider ise wapas karta hai.
- **Debug traffic log**: yadi `debugTrafficFilePath` set hai, to request aur response JSON ko ek file mein jodta hai.

<a id="config-loading"></a>
### Config loading

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. `ai-i18n-tools.config.json` (JSON) padhen aur parse karen.
2. `mergeWithDefaults` - `defaultI18nConfigPartial` ke saath deep-merge karen, aur kisi bhi `docs[].sourceFiles` entries ko `contentPaths` mein merge karen.
3. `expandTargetLocalesFileReferenceInRawInput` - yadi `targetLocales` ek file path hai, to manifest load karen aur locale codes mein expand karen; `uiLanguagesPath` set karen.
4. `expandDocumentationTargetLocalesInRawInput` - har `docs[].targetLocales` entry ke liye yahi karen.
5. `parseI18nConfig` - Zod validation + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE`, aadi apply karen.
7. `augmentConfigWithUiLanguagesFile` - manifest display names attach karen.

`init` `initConfigTemplates` se starter configs likhta hai: `ui-markdown` (UI + optional app markdown), `ui-docusaurus`, `ui-starlight`, `ui-astro-website` (plain Astro UI; `.astro` page translation ke liye `docs[]` joden), `ui-json-bundles` (keval Workflow 3 `json[]`). Dekhen [GETTING_STARTED — Initialise](GETTING_STARTED.hi-Latn.md#step-1-initialise).

<a id="logger"></a>
### Logger

`Logger` ANSI colour output ke saath `debug`, `info`, `warn`, `error` levels ko support karta hai. Verbose mode (`-v`) `debug` ko enable karta hai. Jab `logFilePath` set hota hai, to log lines us file mein bhi likhi jaati hain.

---

<a id="runtime-helpers-api"></a>
## Runtime helpers API

Ye `'ai-i18n-tools/runtime'` se export kiye jaate hain aur kisi bhi JavaScript environment (browser, Node.js, Deno, Edge) mein kaam karte hain. Ve `i18next` ya `react-i18next` se import **nahi** karte hain.

<a id="rtl-helpers"></a>
### RTL helpers

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next setup factories

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

`setupKeyAsDefaultT` ko usual app entry point ke roop mein use karen (key-trim + plural `wrapT` + optional `translate-ui` `{sourceLocale}.json`). Application wiring ke liye keval `wrapI18nWithKeyTrim` ko call karna **deprecated** hai.

`localeLoaders` ko `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` ke saath build karen taaki `generate-ui-languages` ke baad keys `targetLocales` ke saath aligned rahen. Dekhen `docs/GETTING_STARTED.md` (runtime wiring), `examples/nextjs-app/`, `examples/console-app/`, aur `examples/astro-website/` (i18next ke bina custom `makeT`).

<a id="display-helpers"></a>
### Display helpers

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### String helpers

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## Programmatic API

Sabhi public types aur classes package root se export kiye jaate hain. Udaharan: CLI ke bina Node.js se translate-UI step chalana:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Mukhya exports:

| Export | Vivaran |
|---|---|
| `loadI18nConfigFromFile` | JSON file se config load, merge, validate karen. |
| `parseI18nConfig` | Ek raw config object ko validate karen. |
| `TranslationCache` | SQLite cache - `cacheDir` path ke saath instantiate karen. |
| `UIStringExtractor` | JS/TS source se `t("…")` strings extract karen. |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML mein `data-i18n*` markers ko scan / insert karein (`extract` ko `.html` aur `mark-html` command ke liye power karta hai). |
| `MarkdownExtractor` | Markdown se anuvadit hone yogya khand nikalein. |
| `JsonExtractor` | Docusaurus JSON label files (UI catalogs, MDX body nahi) se nikalein. |
| `SvgExtractor` | SVG files se nikalein. |
| `LlmClient` | Sakriya LLM pradata ko anuvad anurodh bhejien (`OpenRouterClient` ek aprachalit upnaam hai). |
| `PlaceholderHandler` | Anuvad ke aas-paas markdown syntax (HTML tags, admonitions, anchors, MDX comments/JSX/braces, URLs, inline code, emphasis) ko surakshit/bahal karein. |
| `protectMdx` / `restoreMdx` | MDX comments, JSX tags, brace expressions, aur JSX string attributes ko surakshit/bahal karein (`PlaceholderHandler` dwara call kiya gaya; seedhe upyog ke liye bhi export kiya gaya). |
| `splitTranslatableIntoBatches` | Khandon ko LLM-aakar ke batches mein samoohit karein. |
| `validateTranslation` | Anuvad ke baad sanrachnatmak jaanch. |
| `resolveDocumentationOutputPath` | Anuvadit dastavez ke liye output file path hal karein. |
| `Glossary` / `GlossaryMatcher` | Anuvad shabdavaliyon ko load aur lagu karein. |
| `runTranslateUI` | Programmatic translate-UI entry point. |

---

<a id="extension-points"></a>
## Extension points

<a id="custom-function-names-ui-extraction"></a>
### Custom function names (UI extraction)

Config ke madhyam se gair-manak anuvad function names jodein:

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
    }
  }
}
```

(`ui.reactExtractor` `ui.uiExtractor` ke liye ek poori tarah samarthit upnaam hai.)

`.html` / `.htm` ko `extensions` mein add karein taaki `extract` ke dauran HTML marker attributes ko scan kiya ja sake. `ui.uiExtractor.htmlI18nAttributes` optional hai aur default `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]` hai; `data-i18n` element `textContent` se map hota hai aur `data-i18n-<attr>` us attribute ke value se map hota hai (jaise `data-i18n-aria-label`).

<a id="custom-extractors"></a>
### Custom extractors

Package se `ContentExtractor` lagu karein:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

Ise programmatic roop se `doc-translate.ts` utilities import karke doc-translate pipeline mein pass karein.

<a id="custom-output-paths"></a>
### Custom output paths

Kisi bhi file layout ke liye `docsOutput.pathTemplate` ka upyog karein:

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
