<a id="configuration-reference"></a>
# Configuration reference

<a id="sourcelocale"></a>
### `sourceLocale`

Source language ke liye BCP-47 code (jaise `"en-GB"`, `"en"`, `"pt-BR"`). Is locale ke liye koi translation file generate nahi hoti hai — key string khud source text hai.

Aapke runtime i18n setup file (`src/i18n.ts` / `src/i18n.js`) se export kiye gaye `SOURCE_LOCALE` se **match hona chahiye**.

<a id="targetlocales"></a>
### `targetLocales`

Translate karne ke liye BCP-47 locale codes ka array (jaise `["de", "fr", "es", "pt-BR"]`).

`targetLocales` UI translation ke liye primary locale list hai aur documentation blocks ke liye default locale list hai. `generate-ui-languages` ka upyog `sourceLocale` + `targetLocales` se `ui-languages.json` manifest banane ke liye karein.

<a id="uilanguage-optional"></a>
### `uiLanguage` (vaikalpik)

Tool ki apni UI bhasha ke liye BCP-47 code (CLI help, logs/summaries, aur Translation Dashboard). Yah `sourceLocale` / `targetLocales` se swatantra hai, aur `-L` / `--ui-lang` flag aur `AI_I18N_LANG` environment variable dwara override kiya jata hai. Agnyat man (values) source locale (`en-GB`) mein sahaj roop se degrade hote hain — koi sakht validation nahi hai. [Tool UI language](/reference/environment-variables#tool-ui-language) dekhen.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (optional)

Display names, locale filtering, aur language-list post-processing ke liye upyog kiye gaye `ui-languages.json` manifest ka path. Jab chhod diya jata hai, toh CLI manifest ko `ui.flatOutputDir/ui-languages.json` par khojta hai.

Iska upyog tab karein jab:

- Manifest `ui.flatOutputDir` ke bahar rehta hai aur aapko CLI ko is par explicitly point karne ki zaroorat hai.
- Aap [language switcher post-processing](#language-switcher-languagelistblock) (`languageListBlock`) chahte hain ki manifest se locale labels banaye.
- `extract` ko manifest se `englishName` entries ko `strings.json` mein merge karna chahiye (`ui.reactExtractor.includeUiLanguageEnglishNames: true` ki zaroorat hai).

<a id="concurrency-optional"></a>
### `concurrency` (optional)

Ek saath anuvaad kiye gaye adhiktam **lakshya sthaan** (`translate-ui`, `translate-docs`, `translate-svg`, aur `sync` ke andar milte-julte steps). Yadi chhod diya jaata hai, to CLI UI anuvaad ke liye **4** aur documentation anuvaad ke liye **3** (built-in defaults) ka upyog karta hai. `-j` / `--concurrency` ke saath har run ke liye override karen.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (vikalpik)

**translate-docs**, **translate-svg**, aur **translate-json** (aur `sync` ke andar ke matching steps): har file ke liye adhiktam parallel LLM **batch** requests (har batch mein kai segments ho sakte hain). Chhodne par default **4**. `translate-ui` dwara ignore kiya gaya. `-b` / `--batch-concurrency` se override karen.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (vikalpik)

`translate-docs` aur `sync` ke dauraan **ek hi locale ke bheetar** ek saath process kiye jaane wale files ki adhiktam sankhya. Jab **1** se adhik value par set kiya jaata hai, to ek hi locale ke bheetar files ko memory upyog ko niyantrit karne ke liye semaphore ka upyog karke parallel mein process kiya jaata hai. Chhodne par default **1** (sequential processing). Uchch values I/O-bound operations ke liye throughput mein mahatvapurna sudhaar kar sakti hain, khaaskar jab sabhi segments pehle se hi cache kiye gaye hon (koi API calls ki avashyakta nahin).

**Udharan:**

```json
{
  "fileConcurrency": 4
}
```

**Upyog ka mamla:** Kul processing samay ko kam karne ke liye 100% cache hits ke saath `sync --force-update` chalate samay ise `2-4` par set karen. Sudhaar kai chhoti files ke saath sabse adhik dhyan dene yogya hai.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (vikalpik)

**translate-docs**, **translate-svg**, aur **translate-json** ke liye segment batching: prati API request kitne segments, aur ek character ceiling. Defaults: **20** segments, **4096** characters (jab chhod diya jata hai).

<a id="provider-and-providers"></a>
### `provider` aur `providers`

`provider` (top-level, vikalpik) `providers` se active provider key ka chayan karta hai. Jab theek ek provider configure kiya jaata hai to yah vikalpik hota hai; jab ek se adhik configure kiye jaate hain to avashyak hota hai.

`providers` (top-level) ek provider key ko uske block se map karta hai. Built-in keys (neeche di gayi preset table dekhen) ko keval `translationModels` ki avashyakta hoti hai; koi anya key ek custom OpenAI-compatible endpoint ko paribhashit karti hai aur `baseUrl` ki avashyakta hoti hai (plus `apiKeyEnv` jab tak ki endpoint ko kisi key ki avashyakta na ho).

Har `providers.<name>` block swikaar karta hai:

- `translationModels`
  Model IDs ki pasandeeda ordered list (plain upstream ids, koi `provider/` prefix nahin; OpenRouter ids apne native `vendor/model` form ko banaye rakhte hain). Pehla pehle try kiya jaata hai; baad ke entries error par fallbacks hain. Keval `translate-ui` ke liye, aap is list se pehle ek model try karne ke liye `ui.preferredModel` bhi set kar sakte hain (`ui` dekhen).
- `baseUrl`
  OpenAI-compatible base URL. Preset base URL ko override karta hai; non-preset provider ke liye avashyak hai.
- `apiKeyEnv`
  API key rakhne wala environment variable. Preset env var ko override karta hai.
- `headers`
  Is provider ko har request ke saath bheje gaye atirikt HTTP headers.
- `maxTokens`
  Prati request adhiktam completion tokens. Default: `8192`.
- `temperature`
  Sampling temperature. Default: `0.2`.
- `requestTimeoutMs`
  Har request ke liye intazaar karne ka adhiktam samay milliseconds mein. Default: `30000` (30 seconds).

Built-in provider presets (key — base URL — API-key env var):

| Provider | Base URL | API-key env var |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (koi nahi) |

Ek legacy top-level `openrouter` block (jismein `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) abhi bhi swikar kiya jata hai aur load hone par `providers.openrouter` (jismein `provider: "openrouter"`) mein auto-migrate ho jata hai; `defaultModel` / `fallbackModel` `translationModels` mein fold ho jate hain.

Ek runnable example ke liye jo ek config mein kai providers ko configure karta hai aur `-P` ke saath unke beech switch karta hai, [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) (ek hi document par `openai`, `anthropic`, `nvidia`, aur `deepseek`) dekhen.

**Kai models ka upyog kyon karen:** Vibhinn providers aur models ki lagat alag-alag hoti hai aur ve bhashaon aur locales mein alag-alag star ki gunvatta pradan karte hain. `translationModels` ko **ek ordered fallback chain ke roop mein configure karen** (ek single model ke bajaye) taki yadi koi request fail ho jaye to CLI agle model ko prayas kar sake.

Niche di gayi list ko ek **baseline** ke roop mein mane jise aap badha sakte hain: yadi kisi vishesh locale ke liye anuvad kharab ya asafal hai, to research karen ki kaun se model us bhasha ya script ko prabhavi dhang se support karte hain (online resources ya apne provider ke documentation ka sandarbh len), aur un model ids ko aur vikalpon ke roop mein joden.

Yah suchi 36 target locales ke saath ek bade documentation project mein **vyapak locale coverage ke liye parikshit ki gayi thi**; yah ek vyavaharik default ke roop mein karya karti hai, lekin har locale ke liye achha pradarshan karne ki guarantee nahi hai.

Udaharan `translationModels` (`npx ai-i18n-tools init` ke saman defaults):

<details>
<summary>Default translationModels fallback list</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

Apne environment ya `.env` file mein active provider ka API-key env var (jaise `OPENROUTER_API_KEY`) set karen.

`translationModels` badalne se pehle, `npx ai-i18n-tools check-models` chalayen. Kisi bhi provider ke liye yah har configured model id ko us provider ki live model list (`GET /models`) ke khilaf verify karta hai, gayab ya `expiration_date` se aage ki ids ki report karta hai, valid models ki suchi banata hai, aur jab koi configured id invalid hoti hai to non-zero exit karta hai. Jab provider pricing wapas karta hai (jaise OpenRouter) to yah anumanit input/output pricing (USD prati 1M tokens) bhi dikhata hai.

Vastavik anuvad kary par configure kiye gaye modelon ki tulna karne ke liye, `npx ai-i18n-tools bench-models` chalayen. Yah har model ke madhyam se ek sample ka anuvad karta hai (samantar mein, `concurrency` dwara seemit) aur prati-model input/output token, wall-clock samay, aur USD lagat print karta hai, taki aap `translationModels` order par nirnay lene se pahle gati aur kimat ka tulnatmak adhyayan kar saken.

<a id="features"></a>
### `features`

| Field                | Pipeline | Description                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | `t("…")` / `i18n.t("…")` ko `strings.json` mein extract karein, phir entries ka anuvaad karein aur har-locale flat JSON likhein (extract apne aap chalta hai; catalog ko refresh karne ke liye standalone `extract` ka upyog karein). |
| `translateDocs` | 2 | `.md` / `.mdx` / `.astro` pages ka anuvad karen; Docusaurus shell JSON jab `docs[].docusaurusCatalogDir` set ho. |
| `translateJson` | 3 | `json[]` (`translate-json`) ke tahat manmana nested JSON. |
| `translateSVG` | — | `.svg` files ka anuvad karen (top-level `svg` block ki avashyakta hai). |

SVG files ka `translate-svg` ke saath **anuvad karen** jab `features.translateSVG` true ho aur ek top-level `svg` block configure kiya gaya ho. `sync` command us step ko chalata hai jab dono set hon (jab tak `--no-svg` na ho).

<a id="ui"></a>
### `ui`

- `sourceRoots`
Directories ya glob patterns (cwd ke sapeksh) `t("…")` calls ke liye scan kiye gaye. `src/` ya `["src/**/*.ts"]` jaise patterns ko support karta hai.
- `stringsJson`
Master catalog file ka path. `extract` dwara update kiya gaya.
- `flatOutputDir`
Directory jahan prati-locale JSON files likhe jate hain (`de.json`, aadi).
- `preferredModel`
Optional. Model id pehle keval `translate-ui` ke liye try kiya gaya; phir active provider ka `translationModels` kram mein, is id ko duplicate kiye bina.
- `uiExtractor.funcNames` (ya legacy `reactExtractor.funcNames`)
Scan karne ke liye atirikt function names (default: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (ya legacy `reactExtractor.extensions`)
Shamil karne ke liye file extensions (default: `[".js", ".jsx", ".ts", ".tsx"]`). Astro frontmatter aur template expressions ke liye `.astro` joden.
- `uiExtractor.includePackageDescription` (ya legacy `reactExtractor.includePackageDescription`)
Jab `true` (default), `extract` mein `package.json` `description` bhi shamil hota hai jab maujood ho to ek UI string ke roop mein.
- `uiExtractor.packageJsonPath` (ya legacy `reactExtractor.packageJsonPath`)
Us optional description extraction ke liye upyog kiye jane wale `package.json` file ka custom path.
- `uiExtractor.includeUiLanguageEnglishNames` (ya legacy `reactExtractor.includeUiLanguageEnglishNames`)

Jab `true` (default `false`), `extract` bhi bundled ui-languages master catalog (`sourceLocale` + `targetLocales` se nirmit) se har `englishName` ko `strings.json` mein jodta hai jab vah source scan se pahle se maujood na ho (saman hash keys). `uiLanguagesPath` nahi padhta hai.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite cache directory (sabhi `docs` blocks dwara saajha). Default `.translation-cache`. Runs ke beech punah upyog karen. Yadi aap ek custom doc translation cache se migrate kar rahe hain, to use archive ya delete karen — `cacheDir` apna khud ka SQLite database banata hai aur anya schemas ke saath compatible nahi hai.

<a id="best-practice-for-git-exclusions"></a>
#### Git exclusions ke liye sabse achha abhyas:

- Translation cache folder ki samagri ko exclude karen (udharan ke liye, `.gitignore` ya `.git/info/exclude` ka upyog karke) temporary cache artefacts ko commit hone se rokne ke liye.
- `cache.db` ko banaye rakhen (ise niyamit roop se delete na karen), kyunki SQLite cache ko banaye rakhne se aparivartit segments ka punah anuvad hone se bachta hai. Yah `ai-i18n-tools` ka upyog karne wale software ko update ya modify karte samay runtime aur API dono costs bachata hai.
- Backup aur debug-related files ko commit hone se bachne ke liye temporary aur log files ko exclude karen.

<br/>

**Udharan:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Documentation pipeline blocks ka array. `translate-docs` aur `sync` ka docs phase har block ko kram mein **process karta hai**. Legacy keys abhi bhi load time par swikar kiye jate hain aur config file writable hone par fir se likhe jate hain; nayi configs mein vartaman namon ko prefer karen.

| Legacy key | Current key / behaviour |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| top-level `openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | hataya gaya (`docs[].docusaurusCatalogDir` ya `json[]` ka upyog karen) |
| `features.extractUIStrings` | hataya gaya (`extract` UI translation se pahle chalta hai) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor` (alias abhi bhi swikar kiya jata hai) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**Content sources**

- `description`
Is block ke liye vikalpik manav-pathaniya note (anuvad ke liye upyog nahin kiya gaya hai). Jab set kiya jata hai to `translate-docs` `🌐` shirshak mein pratyay lagaya jata hai; `status` anubhag shirshakon mein bhi dikhaya jata hai.
- `contentPaths`
Markdown/MDX page bodies aur `.astro` templates ka anuvad karne ke liye (`translate-docs` inhen `.md`, `.mdx`, aur `.astro` ke liye scan karta hai). **Directory paths ya glob patterns** ka samarthan karta hai (jaise `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). Yahin se sthaniya documentation prose aata hai.
- `sourceFiles`
Load hone par `contentPaths` mein mila hua vikalpik alias.
- `targetLocales`
Is block ke liye locales ka vikalpik upsamuchchay (anyatha root `targetLocales`). Prabhavi documentation locales blocks ke paar ka union hain.
- `docusaurusCatalogDir`
Vikalpik. Is block ke liye Docusaurus JSON label catalogs ke liye source directory (jaise `"i18n/en"` `docusaurus write-translations` se). Page bodies hamesha `contentPaths` se aate hain; `docusaurusCatalogDir` keval shell/UI JSON pradan karta hai, MDX nahin.

**Output layout**

- `outputDir`
Is block ke liye anuvadit output ke liye root directory.
- `docsOutput.style`
`"nested"` (default), `"flat"`, `"doc-system"`, ya aliases `"docusaurus"` / `"astro-starlight"` / `"vitepress"`.
- `docsOutput.localeSubpath`
`doc-system` ke liye `{locale}/` aur `{relativeToDocsRoot}` ke beech path segment (`style: "doc-system"` ka sidhe upyog karte samay avashyak; alias ka upyog karte samay preset). Starlight-style locale folders ke liye `""` ka upyog karen.
- `docsOutput.docsRoot`
Docusaurus layout ke liye source docs root (jaise `"docs"`). Chhodne par default `"docs"`.
- `docsOutput.pathTemplate`
Custom markdown output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Label files ke liye custom JSON output path. `pathTemplate` ke saman placeholders ko support karta hai.
- `docsOutput.localePathLowercase`
Jab `true`, built-in output layouts (`nested`, `flat`, `doc-system` bina `pathTemplate`) paths mein lowercased locale segments ka upyog karte hain. Default `false`; `astro-starlight` aur `doc-system` khali `localeSubpath` ke saath config load par `true` par default hote hain.
- `docsOutput.flatPreserveRelativeDir`
Jab `docsOutput.style = "flat"`, source subdirectories ko banaye rakhen taki saman basename wali files takrayen nahi. Default `false`.
- `docsOutput.rewriteRelativeLinks`
Anuvaad ke baad relative links ko phir se likhen (jab `docsOutput.style = "flat"` aur koi custom `pathTemplate` na ho to swatah saksham ho jaata hai).
- `docsOutput.linkRewriteDocsRoot`
Flat-link rewrite prefixes ki ganna karte samay upyog kiya gaya repo root. Aam taur par ise `"."` chhod den jab tak ki aapke anuvaadit docs kisi alag project root ke tahat na hon.
- `docsOutput.rewriteVitepressLinks`
Jab `true` ho, to anuvaad ke baad VitePress link normalizer chalaen. Jab `docsOutput.style` `"vitepress"` ho to swatah saksham ho jaata hai. Kisi bhi `doc-system` layout ke saath upyog karen jahan locale folders English ke bagal mein `docsRoot` ke tahat hon. README-style `docs/guide/…` paths ko site routes (`/guide/…`) aur locale-relative `../guide/…` links mein phir se likhta hai. VitePress tree ke bahar repo files (`LICENSE`, `examples/`) ke links ke liye, English source mein poore URLs ka upyog karen — dekhen [VitePress integration — README as the docs homepage](/guide/vitepress-integration#readme-as-homepage).

**Post-processing**

- `docsOutput.postProcessing`
Anuvaadit **markdown body** par vaikalpik transforms (YAML keys aur non-prose front matter values surakshit rakhe jaate hain). Segment reassembly aur link rewriting (flat ya VitePress) ke baad, aur `addFrontmatter` se pehle chalta hai.
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` ki kramabaddh soochi. `search` ek regex pattern hai (plain string flag `g` ka upyog karta hai, ya `/pattern/flags`). `replace` placeholders jaise `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` ko support karta hai.
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — source aur anuvaadit markdown mein ek bounded "doosri bhashaon mein padhen" link row ko phir se banata hai. Jab `label: "local"` ho to endonym labels ke liye `uiLanguagesPath` (ya `ui.flatOutputDir/ui-languages.json` par ek manifest) ki avashyakta hoti hai.

**Behaviour aur metadata**

- `translateFrontmatterFields`
`docsOutput` ke samaan star par (prati `docs[]` block). Default `true`: Starlight/Docusaurus ke liye user-facing YAML prose ka anuvaad karen (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` labels). Poore front matter block ko aparivartit rakhne ke liye `false` set karen; vishisht dot-paths tak seemit karne ke liye ek string array paas karen.
- `segmentSplitting`
`docsOutput` ke samaan star par (prati `docs[]` block). `translate-docs` extraction ke liye vaikalpik behtar-grained segments: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Jab `enabled` `true` ho (jab `segmentSplitting` chhod diya jaata hai to default), ghane paragraphs, GFM pipe tables (pahle chunk mein header, separator, aur pahli data row shamil hai), aur lambi lists ko split kiya jaata hai; sub-parts single newlines (`tightJoinPrevious`) ke saath phir se judte hain. Prati blank-line-delimited body block keval ek segment ka upyog karne ke liye `"enabled": false` set karen. Jab `qualityRetrySplit` `true` ho (default), markdown segments jo sabhi models ke khatm hone ke baad AST validation mein fail ho jaate hain, unhe dheere-dheere split kiya jaata hai aur pahle model se phir se prayas kiya jaata hai; `maxQualityRetrySplitDepth` (default `3`) recursive splits ko cap karta hai.
- `warnMarkdownSourceIssues`
Jab `true` ho (jab chhod diya jaata hai to default), har `translate-docs` run risky delimiters / unclosed inline code ke liye markdown segments ko phir se scan karta hai, terminal warnings print karta hai, aur us file ke cache filepath ke liye `markdown_source_issues` rows ko badal deta hai. Is block ke liye warnings aur SQLite updates ko chhodne ke liye `false` set karen.
- `addFrontmatter`
Jab `true` ho (jab chhod diya jaata hai to default), anuvaadit markdown files mein YAML keys shamil hote hain: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, aur jab kam se kam ek segment mein model metadata ho, `translation_models` (active provider se model ids ki sorted list). Chhodne ke liye `false` par set karen.
- `emphasisPlaceholders`
Prati `docs[]` block. Jab `true` ho, to anuvaad se pahle markdown emphasis delimiters ko placeholders ke roop mein mask karen. CJK locales (`zh`, `ja`, `ko`) aur `rtlLocales` mein soochibaddh locales ke liye default `true` hai; anyatha default `false` hai. CLI `--emphasis-placeholders` / `--no-emphasis-placeholders` ke madhyam se overridable.
- `rtlLocales`
BCP-47 codes ka vaikalpik array jise emphasis-placeholder defaults ke liye RTL ke roop mein treat kiya jaata hai (built-in RTL detection ke saath merge kiya gaya).

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Vaikaipik. Atirikt JSX/HTML attribute names jinke **quoted string values** ko translator ko nahi bheja jaana chahiye. Built-in defaults (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, adhiktar `aria-*`, aadi) ke saath merge kiya gaya. Case-insensitive. Lagu hota hai:

- `.astro` parse-and-replace extraction (static HTML tags aur string literals `{expression}` blocks ke andar `attr=` ke baad).
  - Markdown/Astro segment translation ke dauraan MDX placeholder extraction (`label`, `tooltip`, aur `aria-label` capitalised JSX tags par, plus `TabItem` `value` jab lagu ho).

Udaaharan: `"protectAttributes": ["variant", "size"]` `variant="primary"` ko `{items.map(...)}` ke andar locales mein aparivartit rakhta hai.

Aap normally anuvaadit hone wale attributes (jaise `"title"` ya `"aria-label"`) ko bhi list kar sakte hain jab aap un values ko English se verbatim copy karna chahte hain.

- `protectKeys`
Vaikaipik. Atirikt **object property names** jinke quoted string values ko template `{expression}` blocks aur MDX object literals (jaise `label:` `<Tabs values={[ … ]}>` ke andar) ke andar anuvaad nahi kiya jaana chahiye. Built-in defaults (`class`, `key`, `id`, `href`, `src`, aadi) ke saath merge kiya gaya. Case-insensitive.

Udaaharan: `"protectKeys": ["slug", "code"]` `{ slug: 'getting-started', title: 'Getting started' }` ko chhod deta hai → keval `title` ka anuvaad kiya jaata hai jab `slug` surakshit ho.

<br/>

**Udaaharan (`docsOutput.style = "flat"` — screenshot paths + vaikalpik bhasha list wrapper):**

<details>
<summary>Flat layout postProcessing udaaharan (screenshots + languageListBlock)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

Nested JSON translation pipelines ka top-level array. Sirf tab upyog kiya jaata hai jab `features.translateJson` true ho (`translate-json` ya `sync` ka JSON stage). [JSON](/guide/json) dekhein.

| Field | Vivaran |
|-------|-------------|
| `description` | CLI / `status` ke liye vaikalpik note (anuvaadit nahi). |
| `contentPaths` | Project root ke antargat source `.json` files, directories, ya globs. |
| `outputPathTemplate` | Prati target locale ke liye avashyak output path. Placeholders: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Is block ke liye vaikalpik subset; anyatha root `targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist`, ya `both`. |
| `keyPolicy.translateKeys` | Dot paths / globs shamil karne ke liye jab mode `allowlist` ya `both` ho. |
| `keyPolicy.skipKeys` | Dot paths / globs ko chhodne ke liye (default denylist mein `id`, `slug`, `href`, `url`, `key`, `code` shamil hain). |

<a id="svg"></a>
### `svg`

SVG files ke liye top-level path aur layout. Anuvaad tabhi chalta hai jab `features.translateSVG` true ho (`translate-svg` ya `sync` ke SVG stage ke madhyam se).

| Field            | Description                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Ek ya ek se adhik directories **ya glob patterns** (jaise `"images/*.svg"`, `"**/icons/*.svg"`). Patterns ko project root ke saapeksh hal kiya jaata hai aur `.svg` files ke liye recursively scan kiya jaata hai.                                                                         |
| `outputDir`      | Anuvaadit SVG output ke liye root directory.                                                                                                                                                                                                                          |
| `style`          | `"flat"` ya `"nested"` jab `pathTemplate` unset ho.                                                                                                                                                                                                               |
| `pathTemplate`   | Custom SVG output path. Placeholders: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Jab `true`, built-in `flat` / `nested` SVG layouts lowercased locale segments ka upyog karte hain. Custom `pathTemplate` values aparivartit rahte hain; lowercase segments ke liye `{llocale}` ka upyog karein. |
| `forceLowercase` | SVG reassembly par lower-case anuvaadit text. Un designs ke liye upyogi jo all-lowercase labels par nirbhar karte hain.                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Field          | Description                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | `strings.json` ka path - maujooda anuvaadon se ek glossary auto-build karta hai.                                                                                                 |
| `userGlossary` | Columns `Original language string` (ya `en`), `locale`, `Translation` ke saath ek CSV ka path - har source term aur target locale ke liye ek row (`locale` sabhi targets ke liye `*` ho sakta hai). |
| `autoAddUserEditedToGlossary` | Jab `true` ho, to UI strings mein dashboard edits ko swatah user glossary mein joda ja sakta hai. |

**Ek khali glossary CSV generate karein:**

```bash
npx ai-i18n-tools glossary-generate
```
