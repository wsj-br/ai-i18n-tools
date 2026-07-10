<a id="architecture"></a>
# Architecture

<a id="architecture-overview"></a>
## Architecture overview

Codebase chaar paratyon mein vyavasthit hai. Is bhaag ka upyog mansik model ke liye karein; jab aapko file-star ke vivaran ki aavashyakta ho, to [source tree](#source-tree) kholein.

<a id="how-a-sync-run-fits-together"></a>
### Ek `sync` chalan kaise milkar kaam karta hai

`sync` (aur vyanjak translate aadesh) saksham visheshataon ko kram mein chalata hai:

| Charan | Aadesh | Yeh kya karta hai |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | UI strot ko scan karein → `strings.json` ko update karein → flat locale JSON (`de.json`, …) ko bharein |
| 2 | `translate-svg` *(vaikalpik)* | `config.svg` ke neeche SVG text ko anuvaadit karein |
| 3 | `translate-docs` | Markdown, MDX, `.astro` pages ka anuvaad karein; Docusaurus catalog JSON; Nextra `_meta` / dictionary `.ts`; VitePress theme catalog |
| 4 | `translate-json` *(vaikalpik)* | `json[]` ke neeche nested JSON pattiyon ko anuvaadit karein |

Har pipeline ek hi mukhya loop ka paalan karti hai: **segment nikalein → syntax ka sanrakshan karein → batch → cache lookup ya LLM call → output likhein**. Madhyasth sevaayein — config, placeholders, cache, glossary, `LlmClient` — [Shared infrastructure](#shared-infrastructure) ke neeche varnit hain.

<a id="module-map"></a>
### Module map

| Parat | Folder | Bhoomika |
| --- | --- | --- |
| **Entry** | `src/cli/` | CLI aadesh: `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **Pipelines** | `src/extractors/` | JS/TS, HTML markers, markdown, JSON, SVG, `.astro` se segment nikalna |
| | `src/processors/` | Placeholder sanrakshan, batching, validation, link rewriting |
| **Shared** | `src/core/` | Config, types, SQLite cache, prompts, output paths, locale utilities |
| | `src/api/` | `LlmClient` — provider-agnostic chat client (Vercel AI SDK) with model fallback |
| | `src/glossary/` | Glossary loading aur term hints for prompts |
| | `src/utils/` | Logger, hashing, ignore parser, display-width tables, `.env` loader |
| **Your app runtime** | `src/runtime/` | i18next helpers aur display utilities — `'ai-i18n-tools/runtime'` ke roop mein export kiye gaye ([Runtime helpers](/hi-Latn/guide/runtime-helpers)) |
| **Tool UI** *(dogfooding)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | Is package ke swayan CLI aur Translation Dashboard ko localize karta hai — aapke project content se alag ([Self-localization](#self-localization-tool-ui)) |

Sab kuch jo programmatic upyog ke liye hai, `src/index.ts` se punah-niryaat kiya gaya hai ([Programmatic API](/hi-Latn/reference/programmatic-api)).

<a id="pipeline-summaries"></a>
### Pipeline summaries

| Pipeline | Section | Input → output |
| --- | --- | --- |
| UI strings | [UI strings internals](#ui-strings-internals) | Source files → `strings.json` → flat `{locale}.json` |
| Documents | [Documents internals](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → per-locale files under `docs[].outputDir` |
| JSON bundles | [JSON internals](#json-internals) | Nested JSON under `json[]` → per-locale JSON files |
| SVG | [Documents internals — extractors](#extractors) | SVG files under `config.svg` → translated SVG copies |

---

<a id="ui-strings-internals"></a>
## UI strings internals

| Step | Component | Result |
| --- | --- | --- |
| 1 | Source files (JS/TS; optional `.astro` / `.html`) | Files on disk |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` via `ui-string-babel.ts`) | Segments keyed by MD5 hash |
| 3 | `strings.json` | Master catalog: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | JSON array of source strings → translations (+ model id per batch) |
| 5 | `de.json`, `pt-BR.json`, … | Flat maps: source string → translation (no model metadata) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

JS/TS files mein `i18next-scanner` ke `Parser.parseFuncFromString` ka upyog karke `t("literal")` aur `i18n.t("literal")` calls dhundhta hai. `.astro` sources ke liye (jab `ui.uiExtractor.extensions` mein soochi mein ho), `ui-string-babel.ts` frontmatter aur template `{expression}` blocks ko `@babel/parser` ke saath parse karta hai aur wahi `funcNames` rules lagoo karta hai. Function names aur file extensions `ui.uiExtractor` ke madhyam se configurable hain (`ui.reactExtractor` ek samarthit alias hai). `extract` **non-scanner inputs ko bhi usi catalog mein merge karta hai:** project `package.json` `description` jab `includePackageDescription` enabled hota hai (default), aur bundled ui-languages master catalog se har `englishName` (`sourceLocale` + `targetLocales` se bana) jab `includeUiLanguageEnglishNames` `true` hota hai (source mein pehle se mili strings ko prathamikta milti hai; `languagesManifestPath` nahi padhta hai). `extract` `ui-languages.json` ko `languagesManifestPath` par bhi regenerate karta hai. Segment hashes trimmed source string ke **MD5 ke pehle 8 hex chars** hote hain — ye `strings.json` mein keys ban jaate hain.

`.html` / `.htm` sources ke liye (jab `ui.uiExtractor.extensions` mein list kiya gaya ho), `extract` file ko `html-i18n-marks.ts` ke through route karta hai, jo `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` marker attributes ko scan karta hai (`ui.uiExtractor.htmlI18nAttributes` ke through configurable). Ek nanga marker apne source text ko element ke khud ke `textContent` / `title` / `placeholder` se leta hai; ek valued marker (`data-i18n="Key"`) value ka upyog karta hai. Yahi module `mark-html` command ko power karta hai, jo nange markers ko automatically insert karta hai. HTML files kabhi bhi Babel / i18next-scanner passes tak nahi pahunchti hain.

Saade Astro SSG site i18next ko chhod sakte hain: build time par flat `{locale}.json` load karein aur source-text key dwara `t('English')` ko resolve karein (`examples/astro-website/src/i18n/t.ts` aur [UI strings — Astro website](/hi-Latn/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight) dekhein).

Saade HTML apps marker attributes ke saath wahi catalog model follow karte hain, `t()` calls ke bajaye — [Marking HTML for translation](/hi-Latn/guide/ui-strings/plain-html#marking-html-for-translation) dekhein.

<a id="stringsjson"></a>
### `strings.json`

Master catalog ka roop hai:

```json
{
  "a1b2c3d4": {
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

`models` (optional) — har locale ke liye, kis model ne us translation ko us locale ke liye pichhle safal `translate-ui` run ke baad banaya (ya `user-edited` agar text Translation Dashboard se save kiya gaya tha). `locations` (optional) — jahan `extract` ne string dhoondi (scanner + package description line; bundled-master `englishName` strings mein `locations` chhod sakte hain).

`extract` nayi keys jodta hai aur scan mein abhi bhi maujood keys ke liye maujooda `translated` / `models` data ko surakshit rakhta hai (scanner literals, optional description, optional bundled-master `englishName`). `translate-ui` missing `translated` entries ko bharta hai, jin locales ka anuvad karta hai unke liye `models` ko update karta hai, aur flat locale files likhta hai.

`ui-languages.json` **manifest** — `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, reference `englishName`, `"ltr"` ya `"rtl"`) ka JSON array. `sourceLocale` + `targetLocales` aur bundled master `data/ui-languages-complete.json` se project file banane ke liye `generate-ui-languages` ya `extract` ka upyog karein.

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

`LlmClient.translateUIBatch` har model ko kram mein prayas karta hai, parse ya network error par wapas aata hai. CLI `localeModels`, vaikalpik `uiModels`, aur `translationModels` (dekhen [Providers and models](/hi-Latn/guide/providers-and-models#model-fallback-chain)) se har target locale ke liye us suchi ka nirmaan karta hai.

---

<a id="documents-internals"></a>
## Documents internals

| Step | Component | Result |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro` files (`translate-docs`) | Source files |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — typed segments with hash + content |
| 3 | `PlaceholderHandler` | Protected text — HTML, admonitions, anchors, MDX, URLs, inline code, emphasis masked as tokens |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — grouped by count + char limit |
| 5 | `TranslationCache` lookup | Cache hit → skip; miss → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | Final text — placeholders restored |
| 7 | `resolveDocumentationOutputPath` | Output file — Docusaurus layout or flat layout |

<a id="extractors"></a>
### Extractors

Sabhi extractors `BaseExtractor` ka vistar karte hain aur `extract(content, filepath): Segment[]` ko lagu karte hain.

- `MarkdownExtractor` - markdown ko typed segments mein baantta hai: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML frontmatter ko **non-translatable** ke roop mein classify kiya gaya hai (`slug`, `id`, aur anya routing keys stable rehte hain). Top-level `export ...` blocks (jaise React component definitions) ko existing `import ...` handling ke saath non-translatable `other` segments ke roop mein classify kiya gaya hai. Capital JSX tag se shuru hone wale multi-line blocks (jaise ki `<Tabs>` block) ko translatable paragraphs ke roop mein classify kiya gaya hai. Non-translatable segments (code blocks, raw HTML) ko jyon ka tyon rakha gaya hai.
- `AstroTemplateExtractor` - `.astro` marketing pages ke liye parse-and-replace (`translate-docs` via `translateAstroFile` in `doc-translate.ts`). User-facing HTML text nodes aur translatable attributes (`alt`, `title`, `aria-label`, `placeholder`) ko extract karta hai, saath hi template `{expression}` blocks ke andar string literals ko bhi jab user-facing ho. Frontmatter TypeScript, `<script>`, `<style>`, protected attribute/key values, aur `t('…')` ke andar literals ko chhod deta hai. Reassembly relative imports ko adjust karta hai jab output paths gehre hote hain (jaise `src/pages/de/index.astro`). [Astro website pages](/hi-Latn/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) dekhein.
- `JsonExtractor` - Docusaurus JSON label files se string values extract karta hai (Docusaurus UI catalogs, MDX body nahi).
- `SvgExtractor` - SVG se `<text>`, `<title>`, aur `<desc>` content extract karta hai (`translate-svg` dwara `config.svg` ke antargat files ke liye upyog kiya jata hai, `translate-docs` dwara nahi).
- `html-i18n-marks.ts` - ek focused HTML tag scanner jise `extract` `.html` / `.htm` sources ke liye aur `mark-html` command dwara istemal kiya jata hai. `collectHtmlI18nStrings` / `collectHtmlI18nLocations` `data-i18n*` marker attributes ko read karte hain (nanga marker → element `textContent` / `title` / `placeholder`; valued marker → value), aur `markHtmlContent` nange markers ko leaf text / title / placeholder elements mein insert karta hai (idempotent, `data-i18n-ignore` ko maan'ya karta hai, code-like aur mixed-content elements ko skip karta hai). Shared `normalizeI18nText` helper build-time keys ko browser runtime ke saman rakhta hai.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro hybrid sites (UI + page HTML)

Plain Astro apps aksar ek config mein **dono** UI strings aur documents enable karte hain (reference: `examples/astro-website/`):

| Layer | Mechanism | Output |
| --- | --- | --- |
| Template HTML | `AstroTemplateExtractor` + `translate-docs` | Per-locale `.astro` under `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | Flat `public/locales/{locale}.json` (key ke roop mein English source) |

`sync` command enabled steps ko order mein chalata hai: **extract** phir **translate-ui** (jab `features.translateUIStrings`) → optional **translate-svg** → **translate-docs** → optional **translate-json** (jab tak `--no-ui`, `--no-svg`, `--no-docs`, ya `--no-json` ke saath skip na kiya gaya ho). Init template `ui-astro-website` kewal UI strings ko scaffold karta hai; page HTML ke liye `docs[]` aur `features.translateDocs` jodein.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### Heading anchor insertion (`write-heading-ids` CLI)

`write-heading-ids` command documentation markdown ke liye ek **local, non-LLM** preprocessor hai. Implementation: `src/cli/write-heading-ids.ts` file discovery ko orchestrate karta hai; `src/markdown/write-heading-ids-core.ts` lines ko parse karta hai aur anchors insert karta hai.

Iske liye ek vaide config ki aavashyakta hoti hai jo **kam se kam ek `docs[]` block** ho. Pratyek block ke liye yeh `.md` / `.mdx` files ko `contentPaths` ke neeche ikattha karta hai, project ke `.translate-ignore` niyamon (doc anuvaad ke saman vichar) ko lagu karta hai, aur vaikalpik roop se `--path` / `--file` ke saath ek subtree tak seemit karta hai. Pratyek file ko `applyHeadingAnchorsToMarkdown` ke saath parivartit kiya jata hai: pratyek **flat ATX heading** (`# …` se `###### …`) ke liye fenced code blocks ke bahar, ek khali HTML line `<a id="slug"></a>` ko upar ki rekha par insert kiya jata hai jab yeh gayab ya purana hota hai. Slug algorithms aam taur par aam ecosystems — `github` (default), `bitbucket`, `gitlab`, `pymdown` (vaikalpik Unicode normalisation / percent-encoding flags), `azure-devops` — ke saath mel khate hain taaki anchor IDs maujuda tooling (doctoc, PyMdown, aadi) ke saath sthir rahein. `--dry-run` reports would-be edits ko bina likhe hue bataata hai.

Yeh command `translate-docs` ya `sync` ke andar **nahi** chalta hai; ise explicitly chalayen jab aap translation ya publishing se pehle source files mein stable fragment IDs chahte hain.

<a id="placeholder-protection"></a>
### Placeholder protection

Translation se pehle, sensitive syntax ko opaque tokens se badal diya jaata hai taaki LLM corruption ko roka ja sake, is order mein apply kiya jaata hai (restore ulta hota hai):

1. **HTML tags aur comments** (`<strong>`, `<!-- ... -->`, aadi) - ek gyat allowlist se lowercase HTML tags ko ```{{HTM_N}}``` tokens se badal diya jata hai. Capitalised JSX tags (`<Highlight>`, `<Tabs>`, `</Tab>`) ko MDX layer (step 4) dwara alag se handle kiya jata hai.
2. **Admonition markers** (`:::note`, `:::`) - opening line par keval directive prefix ko ```{{ADM_OPEN_N}}``` se badal diya jata hai; usi line par koi bhi title model ke anuvad ke liye chhod diya jata hai. Sahi mool text ke saath bahal kiya gaya.
3. **Doc anchors** (HTML `<a id="…">`, Docusaurus heading `{#…}`) - jyon ka tyon rakha gaya.
4. **MDX-only constructs** (`src/processors/mdx-placeholders.ts`):
   - **MDX comments** (`{/* … */}`, jismein Docusaurus heading-id form `{/* #my-id */}` shaamil hai) ko ```{{MDX_N}}``` se badal diya gaya hai.
   - **Capitalised JSX tags** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - ko ```{{MDX_N}}``` ke roop mein rakha gaya hai jismein anuvaad yogya string attributes (`label`, `tooltip`, `aria-label`) ko tag ke andar ```{{JXA_N}}``` mein dobara likha gaya hai jab tak ki attribute ka naam `docs[].protectAttributes` mein na dikhe; `label:` ko `<Tabs values={[ { label: '…' } ]}>` object literals (`docs[].protectKeys` ke maadhyam se chhodne yogya) aur `<TabItem value="…">` (jab koi `label` attribute maujood na ho, lowercase slug-like values ko chhodkar) ke andar bhi nikala jaata hai. Segment mein `||JXA_N: …||` lines ke roop mein joda gaya, `restoreMdx` dwara wapas merge kiya gaya.
   - **MDX brace expressions** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>) - depth-aware matching, ko ```{{MDX_N}}``` se badal diya gaya hai.
5. **Markdown URLs** (`](url)`, `src="…"`) - anuvaad ke baad ek map se restore kiya gaya hai.
6. **Inline code spans** (`` `code` ``) aur **bold-wrapped inline code** (`**`code`**`) - preserve kiye jaate hain.
7. **Markdown emphasis** (optional, CJK/RTL locales ke liye auto-enabled) - emphasis delimiters masked.

Astro templates aur MDX JSX ke liye shared attribute/key protection `src/processors/expression-attribute-protection.ts` mein lagu kiya gaya hai aur `docs[].protectAttributes` aur `docs[].protectKeys` dwara har block ke liye chalaya jata hai ([protectAttributes / protectKeys](/hi-Latn/reference/configuration#protectattributes-protectkeys) dekhen).

<a id="cache-translationcache"></a>
### Cache (`TranslationCache`)

SQLite database (`node:sqlite` ke madhyam se) `(source_hash, locale)` dwara keyed rows ko `translated_text`, `model`, `filepath`, `last_hit_at`, aur related fields ke saath store karta hai. Hash SHA-256 normalized content (whitespace collapsed) ke pehle 16 hex chars ka hota hai.

Har ek run par, segments ko hash × locale dwara dekha jata hai. Kewal cache misses LLM par jate hain. Translation ke baad, `last_hit_at` ko current translate scope mein segment rows ke liye reset kiya jata hai jo hit nahi hue the. Doc translation ke dauran safal cache hits us segment ke liye stale `translation_failures` rows ko saaf karte hain. `cleanup` pahle `sync --force-update` chalata hai, phir stale segment rows (null `last_hit_at` / empty filepath) ko hatata hai, `file_tracking` keys ko hata deta hai jab resolved source path disk par gayab hota hai (`doc-block:…`, `json-block:…`, `svg-files:…`, aadi), un translation rows ko hatata hai jinka metadata filepath ek gayab file ki or ishara karta hai, orphaned `translation_failures` rows ko hatata hai, aur orphaned `markdown_source_issues` rows ko hatata hai jinka resolved source path disk par gayab hai; yeh `cache.db` ka backup nahi leta jab tak ki `--backup <path>` pass na kiya jaye, jo pahle us path par ek backup likhta hai.

`translate-docs` command **file tracking** ka bhi upyog karta hai taki maujooda, up-to-date outputs ke saath aparivartit sources poore kaam ko chhod saken. `--force-update` segment cache ka upyog karte hue file processing ko phir se chalata hai; `--force` file tracking ko saaf karta hai aur API translation ke liye segment cache reads ko bypass karta hai. Jab har configured model ek markdown segment par AST validation mein fail ho jata hai, to `translate-docs` segment ko dheere-dheere split kar sakta hai aur chhote hisson ko phir se prayas kar sakta hai (`docs[].segmentSplitting.qualityRetrySplit`, default on). Poori flag table ke liye [Documents — cache behaviour and flags](/hi-Latn/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags) dekhen.

**Batch prompt format:** `translate-docs --prompt-format` keval `LlmClient.translateDocumentBatch` ke liye XML (`<seg>` / `<t>`) ya JSON array/object shapes ka chayan karta hai; extraction, placeholders, aur validation aparivartit rahte hain. [Batch prompt format](/hi-Latn/guide/documents/cli-options#batch-prompt-format) dekhen.

<a id="output-path-resolution"></a>
### Output path resolution

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` source-relative path ko output path par map karta hai:

- `nested` style (default): markdown ke liye `{outputDir}/{locale}/{relPath}`.
- `doc-system` style: `docsRoot` ke tahat, outputs `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` ka upyog karte hain; `docsRoot` ke bahar ke path nested layout par wapas aa jate hain. Aliases: `docusaurus` (default `localeSubpath` = Docusaurus plugin path), `astro-starlight` (default empty `localeSubpath`), `vitepress` (`doc-system` ke saman empty `localeSubpath` ke sath; BCP-47 folder casing ko banaye rakhta hai).
- `flat` style: `{outputDir}/{stem}.{locale}{extension}`. Jab `flatPreserveRelativeDir` `true` hota hai, to source subdirectories ko `outputDir` ke tahat rakha jata hai.
- **Custom** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}` ka upyog karne wala koi bhi markdown layout.
- **Custom** `jsonPathTemplate`: JSON label files ke liye alag custom layout, wahi placeholders ka upyog karte hue.
- `linkRewriteDocsRoot` flat-link rewriter ko sahi prefixes compute karne mein madad karta hai jab translated output default project root ke alawa kahin aur rooted hota hai.

<a id="flat-link-rewriting"></a>
### Flat link rewriting

Jab `docsOutput.style === "flat"`, anuvadit markdown files locale suffixes ke saath source ke bagal mein rakhe jaate hain. Pages ke beech relative links ko phir se likha jaata hai taaki `readme.de.md` mein `[Guide](./guide.md)` `guide.de.md` ko point kare. `rewriteRelativeLinks` dwara niyantrit (custom `pathTemplate` ke bina flat style ke liye auto-enabled). Wahi pass `postProcessing.regexAdjustments` chalne se pehle non-markdown asset URLs mein per-file depth prefix jodta hai — [Flat link rewriter](/hi-Latn/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) dekhein.

---

<a id="json-internals"></a>
## JSON internals

| Step | Component | Result |
| --- | --- | --- |
| 1 | `json[].contentPaths` | Files resolved (file, directory, or glob) |
| 2 | `NestedJsonExtractor` | String leaves selected by `keyPolicy` (dot paths + minimatch) |
| 3 | `PlaceholderHandler` + batch + `TranslationCache` | Cache hit → skip; miss → `LlmClient.translateDocumentBatch` (shared SQLite) |
| 4 | `NestedJsonExtractor.reassemble` | Output file via `expandJsonBlockOutputPath(outputPathTemplate)` |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) arbitrary nested JSON ko walk karta hai aur har translatable string leaf ke liye ek segment emit karta hai. `keyPolicy.mode` (`allowlist`, `denylist`, ya `both`) dot notation par minimatch ke saath paths ko filter karta hai (`slug` jaise bare names final key segment se match karte hain).
- Cache file tracking `file_tracking` mein `json-block:{blockIndex}:{projectRelPath}` ka upyog karta hai (docs aur SVG ke samaan `cacheDir`).
- Docusaurus `write-translations` catalogs (`{ message, description }` shape) ke liye **nahi** hai — ve Documents (`docs[].docusaurusCatalogDir` + `JsonExtractor` inside `translate-docs`) ka upyog karte hain.
- `t()` UI strings ke liye **nahi** hai — UI strings (`strings.json` + flat bundles).
- CLI: `translate-json`; `src/cli/translate-json-run.ts` mein orchestration. Init template: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## Shared infrastructure

<a id="llmclient"></a>
### `LlmClient`

Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) par bana provider-agnostic chat client. Yah `provider` / `providers` se active provider ko resolve karta hai, us provider ke `baseUrl` + API key ke liye ek OpenAI-compatible client (`createOpenAICompatible`) banata hai, aur sabhi calls ko `generateText` ke madhyam se route karta hai. `OpenRouterClient` ko ek deprecated alias ke roop mein rakha gaya hai. Mukhya vyavahar:

- **Model fallback**: hal ki gayi suchi mein har model ko kram mein prayas karta hai; anurodh ya parse asafaltaon par wapas aata hai. Har target locale ko apni hal ki gayi shrinkhala milti hai: `localeModels(locale)` pahle jab configure kiya gaya ho, phir `uiModels` (sirf UI pipelines), phir `translationModels`. Document, JSON, aur SVG anuvad ek per-locale client banate hain jismein non-UI shrinkhala hoti hai. Iske bajaye `bench-models` command har configure kiye gaye id ke liye ek single-model client banata hai (`translationModels`, `uiModels`, aur `localeModels` ka union; `translationModels: [id]`, koi fallback nahi) taki yah har model ko swantantra roop se samay aur kimat de sake.
- **Request timeout**: sakriya provider ka `requestTimeoutMs` (default 30 seconds) har anurodh ko `AbortSignal.timeout` ke madhyam se rokta hai. Yahi maan `GET /models` par lagu hota hai jab CLI `check-models` ke liye ek provider ki model suchi load karta hai (koi bhi provider). Vikalpik pre-flight filter jo agyat model ids ko hata deta hai, tabhi chalta hai jab sakriya provider OpenRouter ho.
- **OpenRouter extras** (sirf tab jab `openrouter` sakriya ho): `provider` request field ke madhyam se throughput routing, `HTTP-Referer` / `X-Title` headers, aur `usage.cost` se padhi gayi sahi USD lagat. Token upyog har provider ke liye report kiya jata hai; sahi lagat tabhi jab provider ise wapas karta hai.
- **Debug traffic log**: yadi `debugTrafficFilePath` set hai, to request aur response JSON ko ek file mein jodta hai.

<a id="config-loading"></a>
### Config loading

`loadI18nConfigFromFile(configPath, cwd)` pipeline:

1. `ai-i18n-tools.config.json` (JSON) padhein aur parse karein.
2. `mergeWithDefaults` - `defaultI18nConfigPartial` ke saath deep-merge karein, aur kisi bhi `docs[].sourceFiles` entries ko `contentPaths` mein merge karein.
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales` ko ek array mein coerce karein aur path-like entries ko reject karein (BCP-47 codes hone chahiye, na ki `ui-languages.json` ka path); `mergeWithDefaults` ke dauran `languagesManifestPath` default roop se `{ui.flatOutputDir}/ui-languages.json` hota hai.
4. `expandDocumentationTargetLocalesInRawInput` - har `docs[].targetLocales` entry ke liye wahi.
5. `expandJsonTargetLocalesInRawInput` - har `json[].targetLocales` entry ke liye saman.
6. `parseI18nConfig` - Zod validation + `validateI18nBusinessRules`.
7. `applyProviderOverrideToRawInput` - jab CLI par `-P` / `--provider` pass kiya jata hai.
8. `applyEnvOverrides` - `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE`, aur `I18N_TARGET_LOCALES` ko lagu karein jab set ho (API keys har provider ke andar `LlmClient` mein alag se resolve kiye jate hain).
9. `augmentConfigWithUiLanguagesMaster` - bundled master catalog se manifest display names attach karein.
10. `assertEffectiveLocalesInUiLanguagesMaster` - jab lagu ho to master catalog ke khilaf locale codes ko validate karein.

`init` `initConfigTemplates` se starter configs likhta hai: `ui-markdown` (UI + optional app markdown), `ui-docusaurus`, `ui-starlight`, `ui-vitepress` (VitePress docs + `vitepressThemeCatalog`), `ui-nextra` (Nextra docs + `nextraDictionaryPath`), `ui-astro-website` (plain Astro UI; `docs[]` ko `.astro` page anuvaad ke liye jodein), `ui-json-bundles` (JSON `json[]` only). [Quick start — Initialise](/hi-Latn/guide/quick-start#step-1-initialise) dekhein.

<a id="logger"></a>
### Logger

`Logger` ANSI colour output ke saath `debug`, `info`, `warn`, `error` levels ko support karta hai. Verbose mode (`-v`) `debug` ko enable karta hai. Jab `logFilePath` set hota hai, to log lines us file mein bhi likhi jaati hain.

<a id="self-localization-tool-ui"></a>
### Self-localization (tool UI)

The tool localizes its own UI — CLI help, high-traffic log/summary/error messages, and the Translation Dashboard — separately from the content it translates for you.

- **Locale resolution** (`resolveUiLocale` in `src/core/ui-locale.ts`): UI locale ko `-L` / `--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > host OS locale (`Intl.DateTimeFormat().resolvedOptions().locale`) se chunta hai. Candidate ko normalize kiya jata hai aur shipped bundle set ke khilaf theek ya sabse kareebi variation (jaise `pt-PT` → `pt-BR`, `en-US` → `en-GB`) se match kiya jata hai, source locale (`en-GB`) par fallback karte hue. CLI help banane se pehle ek baar resolve karta hai (pre-parse argv scan) aur config load ke baad phir se resolve karta hai taaki `uiLanguage` lagu ho (flag aur env var ab bhi jeetenge).
- **Runtime** (`src/i18n/index.ts`): ```{{name}}``` interpolation ke saath ek minimal `t(source, vars)`, `src/i18n/locales/<code>.json` mein flat per-locale bundles ke khilaf English source string dwara keyed (build par `dist/i18n/locales` mein copy kiya gaya). Missing keys ya bundles source text return karte hain. Yeh UI strings ke saman key-as-default model hai — koi hash lookup nahi hai.
- **Dashboard**: server `GET /api/ui-i18n` ko expose karta hai jo resolved UI locale ke liye `{ locale, dir, bundle }` return karta hai; frontend `<html lang>` / `dir` set karta hai aur `data-i18n*` attributes ke madhyam se static markup ko localize karta hai.
- **Dogfooding**: bundles package ke apne extract → `translate-ui` pipeline ko `ai-i18n-self.config.json` (`pnpm i18n:self`) ke khilaf chala kar banaye jate hain. Catalog keys `src/cli/` aur `src/i18n/` mein `t()` calls ke saath-saath `src/dashboard-app/index.html` mein dashboard ke `data-i18n*` markers se aate hain.

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
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

`'ai-i18n-tools'` se export kiye gaye public extractor classes (udharan ke liye subclass `MarkdownExtractor`) ko extend karke custom extractors register karein. CLI built-in extractors ko internally wire karta hai; `doc-translate.ts` ka koi supported deep import nahi hai.

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

---

<a id="source-tree"></a>
## Source tree

<details>
<summary>Pura <code>src/</code> layout (file-level reference)</summary>

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
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
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
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
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
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
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
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
