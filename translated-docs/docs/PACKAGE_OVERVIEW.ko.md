<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: 패키지 개요

`ai-i18n-tools`의 내부 아키텍처, 각 구성 요소의 결합 방식, 그리고 세 가지 조합 가능한 워크플로(UI 문자열, 문서, 중첩된 JSON)와 선택적 SVG 번역이 구현되는 방식에 대해 설명합니다.

실제 사용 지침은 [GETTING_STARTED.md](GETTING_STARTED.ko.md)를 참조하세요. 번역된 문서의 스크린샷 및 삽화 SVG에 대해서는 [LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.ko.md)를 참조하세요.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (UK)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [Hindi (Roman)](./PACKAGE_OVERVIEW.hi-Latn.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [简体中文](./PACKAGE_OVERVIEW.zh-Hans.md) · [繁體中文](./PACKAGE_OVERVIEW.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [아키텍처 개요](#architecture-overview)
- [소스 트리](#source-tree)
- [워크플로 1 - UI 번역 내부 구조](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [평면화된 로케일 파일](#flat-locale-files)
  - [UI 번역 프롬프트](#ui-translation-prompts)
- [워크플로 2 - 문서 번역 내부 구조](#workflow-2---document-translation-internals)
- [워크플로 3 - 중첩된 JSON 내부](#workflow-3---nested-json-internals)
  - [추출기](#extractors)
  - [Astro 하이브리드 사이트(UI + 페이지 HTML)](#astro-hybrid-sites-ui--page-html)
  - [제목 앵커 삽입(`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [플레이스홀더 보호](#placeholder-protection)
  - [캐시(`TranslationCache`)](#cache-translationcache)
  - [출력 경로 확인](#output-path-resolution)
  - [평면 링크 재작성](#flat-link-rewriting)
- [공유 인프라](#shared-infrastructure)
  - [`LlmClient`](#openrouterclient)
  - [구성 로딩](#config-loading)
  - [로거](#logger)
- [런타임 헬퍼 API](#runtime-helpers-api)
  - [RTL 헬퍼](#rtl-helpers)
  - [i18next 설정 팩토리](#i18next-setup-factories)
  - [표시 헬퍼](#display-helpers)
  - [문자열 헬퍼](#string-helpers)
- [프로그래밍 방식 API](#programmatic-api)
- [확장 포인트](#extension-points)
  - [사용자 정의 함수 이름(UI 추출)](#custom-function-names-ui-extraction)
  - [사용자 정의 추출기](#custom-extractors)
  - [사용자 정의 출력 경로](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## 아키텍처 개요

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, mark-html, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - LlmClient: provider-agnostic chat client (Vercel AI SDK) with model fallback
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── i18n (src/i18n/)           - self-localization runtime for the tool's own UI (t() + per-locale bundles)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
└── Utils (src/utils/)         - logger, hash, ignore parser, display-width table, .env loader
```

사용자가 프로그래밍 방식으로 필요로 할 수 있는 모든 항목은 `src/index.ts`에서 재내보냅니다.

---

<a id="source-tree"></a>
## 소스 트리

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

---

<a id="workflow-1---ui-translation-internals"></a>
## 워크플로 1 - UI 번역 내부 동작

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

`i18next-scanner`의 `Parser.parseFuncFromString`을 사용하여 JS/TS 파일에서 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. `.astro` 소스의 경우(`ui.uiExtractor.extensions`에 나열된 경우), `ui-string-babel.ts`은 frontmatter와 템플릿 `{expression}` 블록을 `@babel/parser`로 구문 분석하고 동일한 `funcNames` 규칙을 적용합니다. 함수 이름과 파일 확장자는 `ui.uiExtractor`을 통해 구성할 수 있으며, `ui.reactExtractor`은 지원되는 별칭입니다. `extract` **또한 스캐너가 아닌 입력을 동일한 카탈로그에 병합합니다.** `includePackageDescription`가 활성화된 경우(기본값) 프로젝트 `package.json` `description`와, `includeUiLanguageEnglishNames`이 `true`이고 `uiLanguagesPath`이 설정된 경우 `ui-languages.json`의 각 `englishName`을 병합합니다(소스에서 이미 발견된 문자열이 우선 적용됨). 세그먼트 해시는 소스 문자열을 잘라낸 후의 **MD5 첫 8자리 16진수**이며, 이는 `strings.json`의 키가 됩니다.

`.html` / `.htm` 소스(`ui.uiExtractor.extensions`에 나열된 경우)에 대해, `extract`은 대신 파일을 `html-i18n-marks.ts`로 라우팅하여 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 마커 속성( `ui.uiExtractor.htmlI18nAttributes`을 통해 구성 가능)을 스캔한다. 빈 마커는 해당 요소의 자신의 `textContent` / `title` / `placeholder`에서 소스 텍스트를 가져온다. 값이 있는 마커(`data-i18n="Key"`)는 값을 사용한다. 동일한 모듈이 자동으로 빈 마커를 삽입하는 `mark-html` 명령을 구동한다. HTML 파일은 바벨 / i18next-스캐너 패스를 통과하지 않는다.

일반 Astro SSG 사이트는 i18next를 생략할 수 있습니다. 빌드 시 단순한 `{locale}.json`을 로드하고 소스 텍스트 키로 `t('English')`을 해결합니다(`examples/astro-website/src/i18n/t.ts` 및 [GETTING_STARTED — Astro 웹사이트](GETTING_STARTED.ko.md#astro-website) 참조).

일반 HTML 앱은 `t()` 호출 대신 마커 속성을 사용하여 동일한 카탈로그 모델을 따릅니다. [GETTING_STARTED — 번역을 위한 HTML 마킹](GETTING_STARTED.ko.md#marking-html-for-translation) 참조.

<a id="stringsjson"></a>
### `strings.json`

마스터 카탈로그의 구조는 다음과 같습니다:

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

`models` (선택 사항) — 각 로케일별로 마지막으로 성공한 `translate-ui` 실행 후 어떤 모델이 번역을 생성했는지를 나타냅니다(또는 텍스트가 번역 대시보드에서 저장된 경우 `user-edited`). `locations` (선택 사항) — `extract`가 문자열을 어디에서 찾았는지를 나타냅니다(스캐너 + 패키지 설명 라인; 매니페스트 전용 `englishName` 문자열은 `locations`을 생략할 수 있음).

`extract`은 새 키를 추가하고 스캔에 여전히 존재하는 키에 대해 기존 `translated` / `models` 데이터를 보존합니다 (스캐너 리터럴, 선택 설명, 선택 매니페스트 `englishName`). `translate-ui`는 누락된 `translated` 항목을 채우고, 번역하는 로케일에 대해 `models`을 업데이트하며, 평면화된 로케일 파일을 작성합니다.

`ui-languages.json` **매니페스트** — `{ code, label, englishName, direction }` (BCP-47 `code`, UI `label`, 참조 `englishName`, `"ltr"` 또는 `"rtl"`)의 JSON 배열입니다. `generate-ui-languages`을 사용하여 `sourceLocale` + `targetLocales` 및 번들된 마스터 `data/ui-languages-complete.json`에서 프로젝트 파일을 생성합니다.

<a id="flat-locale-files"></a>
### 단일화된 로케일 파일

각 대상 로케일은 원본 문자열 → 번역을 매핑하는 평면화된 JSON 파일(`de.json`)을 가집니다 (`models` 필드 없음):

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next는 이를 리소스 번들로 로드하고 원본 문자열을 키로 하여 번역을 조회합니다 (키를 기본값으로 사용하는 모델).

<a id="ui-translation-prompts"></a>
### UI 번역 프롬프트

`buildUIPromptMessages`은 다음을 수행하는 시스템 및 사용자 메시지를 구성합니다:

- 소스 및 대상 언어를 식별합니다(표시 이름은 `localeDisplayNames` 또는 `ui-languages.json`에서 가져옴).
- 문자열의 JSON 배열을 보내고 번역된 결과의 JSON 배열을 반환하도록 요청합니다.
- 가능할 경우 용어집 힌트를 포함합니다.

`LlmClient.translateUIBatch`는 각 모델을 순서대로 시도하며, 구문 분석 또는 네트워크 오류 시 대체합니다. CLI는 활성 공급자의 `translationModels`에서 해당 목록을 빌드합니다. `translate-ui`의 경우, 설정된 경우 선택적 `ui.preferredModel`가 앞에 추가됩니다(나머지와 중복 제거됨).

---

<a id="workflow-2---document-translation-internals"></a>
## 워크플로 2 - 문서 번역 내부 동작

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
### 추출기

모든 추출기는 `BaseExtractor`를 확장하고 `extract(content, filepath): Segment[]`를 구현합니다.

- `MarkdownExtractor` - 마크다운을 유형별 세그먼트로 분할합니다: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML frontmatter은 **번역 불가**로 분류됩니다(`slug`, `id` 및 기타 라우팅 키는 그대로 유지됨). 최상위 `export ...` 블록(예: React 컴포넌트 정의)은 기존 `import ...` 처리와 함께 번역 불가 `other` 세그먼트로 분류됩니다. 대문자 JSX 태그로 시작하는 여러 줄 블록(예: `<Tabs>` 블록)은 번역 가능한 단락으로 분류됩니다. 번역 불가 세그먼트(코드 블록, 원시 HTML)는 원본 그대로 유지됩니다.
- `AstroTemplateExtractor` - `.astro` 마케팅 페이지를 위한 구문 분석 및 대체(`doc-translate.ts`의 `translateAstroFile`를 통해 `translate-docs`). 사용자 인터페이스에 표시되는 HTML 텍스트 노드와 번역 가능한 속성(`alt`, `title`, `aria-label`, `placeholder`)을 추출하며, 사용자 인터페이스에 표시되는 템플릿 `{expression}` 블록 내 문자열 리터럴도 추출합니다. frontmatter TypeScript, `<script>`, `<style>`, 보호된 속성/키 값, `t('…')` 내 리터럴은 건너뜁니다. 재조합 시 출력 경로가 더 깊은 경우 상대 경로를 조정합니다(예: `src/pages/de/index.astro`). [GETTING_STARTED — Astro 웹사이트 페이지](GETTING_STARTED.ko.md#astro-website-parse-and-replace) 참조.
- `JsonExtractor` - Docusaurus JSON 레이블 파일에서 문자열 값을 추출합니다(Docusaurus UI 카탈로그, MDX 본문 제외).
- `SvgExtractor` - SVG에서 `<text>`, `<title>`, `<desc>` 콘텐츠를 추출합니다(`config.svg` 하위 파일에 대해 `translate-svg`에서 사용하며, `translate-docs`에서는 사용하지 않음).
- `html-i18n-marks.ts` - `extract`에서 `.html` / `.htm` 소스용으로, 그리고 `mark-html` 명령에서 사용하는 집중형 HTML 태그 스캐너입니다. `collectHtmlI18nStrings` / `collectHtmlI18nLocations`는 `data-i18n*` 마커 속성을 읽습니다(일반 마커 → 요소 `textContent` / `title` / `placeholder`; 값이 있는 마커 → 값). `markHtmlContent`은 일반 마커를 리프 텍스트 / 제목 / 플레이스홀더 요소에 삽입합니다(멱등성, `data-i18n-ignore` 존중, 코드와 유사하거나 혼합 콘텐츠인 요소는 건너뜁니다). 공유되는 `normalizeI18nText` 도우미는 빌드 시간 키를 브라우저 런타임과 동일하게 유지합니다.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro 하이브리드 사이트(UI + 페이지 HTML)

일반 Astro 앱은 종종 하나의 설정 파일에서 **두 가지** 워크플로를 모두 활성화합니다(참조: `examples/astro-website/`):

| 레이어 | 메커니즘 | 출력 |
|-------|-----------|--------|
| 템플릿 HTML | `AstroTemplateExtractor` + `translate-docs` | 로케일별 `.astro` 위치: `docs[].outputDir` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | 평면형 `public/locales/{locale}.json` (영문 소스를 키로 사용) |

`sync` 명령어는 활성화된 단계를 순서대로 실행합니다: **추출** 후 `features.translateUIStrings`인 경우 **translate-ui** → 선택적 **translate-svg** → **translate-docs** → 선택적 **translate-json** (`--no-ui`, `--no-svg`, `--no-docs` 또는 `--no-json`로 건너뛸 경우 제외). 초기화 템플릿 `ui-astro-website`은 워크플로 1만 생성합니다. 페이지 HTML을 위해 `docs[]`과 `features.translateDocs`을 추가하세요.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 제목 앵커 삽입 (`write-heading-ids` CLI)

`write-heading-ids` 명령은 문서 마크다운을 위한 **로컬, 비-LLM** 전처리기입니다. 구현 방식: `src/cli/write-heading-ids.ts`이 파일 탐색을 조정하고, `src/markdown/write-heading-ids-core.ts`가 줄을 구문 분석하여 앵커를 삽입합니다.

유효한 설정 파일이 필요하며, **적어도 하나의 `docs[]` 블록**을 포함해야 합니다. 각 블록마다 `contentPaths` 하위의 `.md` / `.mdx` 파일들을 수집하고, 프로젝트의 `.translate-ignore` 규칙을 적용합니다(문서 번역과 동일한 개념). 선택적으로 `--path` / `--file`를 사용해 하위 트리로 범위를 제한할 수 있습니다. 각 파일은 `applyHeadingAnchorsToMarkdown`로 변환되며, 코드 블록 외부의 **일반 ATX 제목** (`# …`부터 `###### …`까지) 위에 누락되었거나 오래된 경우 빈 HTML 줄 `<a id="slug"></a>`을 삽입합니다. 슬러그 알고리즘은 일반적인 에코시스템과 일치합니다 — `github` (기본값), `bitbucket`, `gitlab`, `pymdown` (선택적 유니코드 정규화 / 퍼센트 인코딩 플래그), `azure-devops` — 따라서 앵커 ID가 기존 도구들(doctoc, PyMdown 등)과 일관되게 유지됩니다. `--dry-run`은 실제 쓰기 없이 예상 편집 내용을 보고합니다.

이 명령은 `translate-docs` 또는 `sync` 내부에서 **실행되지 않습니다**. 번역 또는 게시 전에 소스 파일 내 조각 ID를 안정적으로 유지하고자 할 때 명시적으로 실행해야 합니다.

<a id="placeholder-protection"></a>
### 자리 표시자 보호

번역 전에 민감한 구문은 LLM 손상을 방지하기 위해 불투명한 토큰으로 교체되며, 이 순서로 적용됩니다 (복원은 반대 순서입니다):

1. **HTML 태그 및 주석** (`<strong>`, `<!-- ... -->`, 등) - 알려진 허용 목록의 소문자 HTML 태그는 `{{HTM_N}}` 토큰으로 교체됩니다. 대문자 JSX 태그 (`<Highlight>`, `<Tabs>`, `</Tab>`)는 MDX 레이어에 의해 별도로 처리됩니다 (4단계).
2. **주석 마커** (`:::note`, `:::`) - 여는 줄의 지시어 접두사만 `{{ADM_OPEN_N}}`로 교체되며, 같은 줄의 제목은 모델이 번역하도록 남겨둡니다. 원본 텍스트로 정확하게 복원됩니다.
3. **문서 앵커** (HTML `<a id="…">`, Docusaurus 제목 `{#…}`) - 원문 그대로 보존됩니다.
4. **MDX 전용 구성요소** (`src/processors/mdx-placeholders.ts`):
   - **MDX 주석** (`{/* … */}`, Docusaurus 제목 ID 형식 `{/* #my-id */}` 포함)은 `{{MDX_N}}`로 대체됩니다.
   - **대문자로 시작하는 JSX 태그** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - `{{MDX_N}}`로 보존되며, 번역 가능한 문자열 속성 (`label`, `tooltip`, `aria-label`)은 속성 이름이 `docs[].protectAttributes`에 없는 한 태그 내에서 `{{JXA_N}}`로 다시 작성됩니다. `label:`는 `<Tabs values={[ { label: '…' } ]}>` 객체 리터럴 내에서도 추출되며 (`docs[].protectKeys`으로 건너뛸 수 있음), `<TabItem value="…">`도 추출됩니다 (`label` 속성이 없고 소문자 슬러그 형태의 값은 건너뜀). 이들은 세그먼트에 `||JXA_N: …||` 줄로 추가되며, `restoreMdx`에 의해 다시 병합됩니다.
   - **MDX 중괄호 표현식** (`{frontMatter.title}`, `style={{…}}`) - 깊이 인식 매칭, `{{MDX_N}}`으로 대체.
5. **마크다운 URL** (`](url)`, `src="../../docs/…"`) - 번역 후 맵에서 복원됨.
6. **인라인 코드 스팬** (`` `code` ``) 및 **볼드로 감싼 인라인 코드** (`**`코드`**`) - 보존됩니다.
7. **마크다운 강조** (선택 사항, CJK/RTL 로케일에 대해 자동 활성화) - 강조 구분 기호가 마스킹됩니다.

Astro 템플릿과 MDX JSX에 대한 공유 속성/키 보호 기능은 `src/processors/expression-attribute-protection.ts`에서 구현되며, 각 블록별로 `docs[].protectAttributes`과 `docs[].protectKeys`에 의해 제어됩니다([GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.ko.md#protectattributes-protectkeys) 참조).

<a id="cache-translationcache"></a>
### 캐시(`TranslationCache`)

SQLite 데이터베이스(`node:sqlite`를 통해)는 정규화된 콘텐츠의 SHA-256 해시 값 중 앞 16자리 16진수 문자를 사용하여 `(source_hash, locale)`를 키로 하고 `translated_text`, `model`, `filepath`, `last_hit_at` 및 관련 필드를 포함하는 행을 저장합니다. 공백은 압축됩니다.

각 실행 시 세그먼트는 해시 × 로케일로 조회됩니다. 캐시 미스만 LLM으로 이동합니다. 번역 후, 현재 번역 범위에서 적중되지 않은 세그먼트 행에 대해 `last_hit_at`이 재설정됩니다. 문서 번역 중 성공적인 캐시 적중은 해당 세그먼트에 대한 오래된 `translation_failures` 행을 지웁니다. `cleanup`는 먼저 `sync --force-update`을 실행한 다음, 오래된 세그먼트 행(null `last_hit_at` / 빈 파일 경로)을 제거하고, 해결된 소스 경로가 디스크에 없는 경우(`doc-block:…`, `json-block:…`, `svg-files:…` 등) `file_tracking` 키를 정리하고, 메타데이터 파일 경로가 없는 파일을 가리키는 번역 행을 제거하고, 고아 `translation_failures` 행을 정리하고, 해결된 소스 경로가 디스크에 없는 고아 `markdown_source_issues` 행을 정리합니다. `--backup <path>`가 전달되지 않는 한 `cache.db`을 백업하지 않으며, 이 경우 먼저 해당 경로에 백업을 작성합니다.

`translate-docs` 명령어는 **파일 추적**을 사용하여 기존 출력이 존재하는 변경되지 않은 소스가 작업을 완전히 건너뛸 수 있도록 합니다. `--force-update`은 세그먼트 캐시를 계속 사용하면서 파일 처리를 다시 실행하고, `--force`는 파일 추적을 지우고 API 번역 시 세그먼트 캐시 읽기를 우회합니다. 구성된 모든 모델이 마크다운 세그먼트에서 AST 검증에 실패할 경우, `translate-docs`은 세그먼트를 점진적으로 분할하고 더 작은 부분을 재시도할 수 있습니다(`docs[].segmentSplitting.qualityRetrySplit`, 기본값 활성화). 전체 플래그 표는 [시작하기](GETTING_STARTED.ko.md#cache-behaviour-and-translate-docs-flags)를 참조하세요.

**배치 프롬프트 형식:** `translate-docs --prompt-format`는 `LlmClient.translateDocumentBatch`에 대해서만 XML(`<seg>` / `<t>`) 또는 JSON 배열/객체 모양을 선택합니다. 추출, 자리 표시자 및 유효성 검사는 변경되지 않습니다. [배치 프롬프트 형식](GETTING_STARTED.ko.md#batch-prompt-format)을 참조하세요.

<a id="output-path-resolution"></a>
### 출력 경로 해석

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`은 소스 기준 경로를 출력 경로에 매핑합니다:

- `nested` 스타일(기본값): 마크다운용 `{outputDir}/{locale}/{relPath}`.
- `doc-system` 스타일: `docsRoot` 아래에서 출력은 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`를 사용함. `docsRoot` 외부의 경로는 중첩된 레이아웃으로 대체됨. 별칭: `docusaurus`(기본값 `localeSubpath` = Docusaurus 플러그인 경로), `astro-starlight`(기본값 빈 `localeSubpath`).
- `flat` 스타일: `{outputDir}/{stem}.{locale}{extension}`. `flatPreserveRelativeDir`가 `true`일 때, 소스 하위 디렉터리는 `outputDir` 아래에 유지됨.
- **사용자 정의** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`를 사용하는 임의의 마크다운 레이아웃.
- **사용자 정의** `jsonPathTemplate`: JSON 레이블 파일을 위한 별도의 사용자 정의 레이아웃으로, 동일한 플레이스홀더 사용.
- `linkRewriteDocsRoot`은 번역된 출력이 기본 프로젝트 루트가 아닌 다른 위치에 루트를 둘 때, 평면화된 링크 재작성기가 올바른 접두사를 계산하도록 도와줍니다.

<a id="flat-link-rewriting"></a>
### 단일 링크 재작성

`docsOutput.style === "flat"`일 때, 번역된 마크다운 파일은 로케일 접미사와 함께 소스 옆에 배치됩니다. 페이지 간 상대 링크는 `readme.de.md`의 `[Guide](../../docs/guide.md)`가 `guide.de.md`를 가리키도록 재작성됩니다. `pathTemplate`가 지정되지 않은 경우 평면 스타일에서 자동으로 활성화되는 `rewriteRelativeLinks`에 의해 제어됩니다. 동일한 처리 과정에서 `postProcessing.regexAdjustments` 실행 전에 마크다운이 아닌 에셋 URL에 파일별 깊이 접두사가 추가됩니다. 자세한 내용은 [로케일 에셋 가이드](LOCALE-ASSETS-GUIDE.ko.md#the-flat-link-rewriter-and-two-step-flow)를 참조하세요.

---

<a id="workflow-3---nested-json-internals"></a>
## 워크플로 3 - 중첩된 JSON 내부

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

- `NestedJsonExtractor`(`src/extractors/nested-json-extractor.ts`)은 임의의 중첩된 JSON을 탐색하고 번역 가능한 문자열 리프마다 하나의 세그먼트를 생성합니다. `keyPolicy.mode`(`allowlist`, `denylist` 또는 `both`)은 점 표기법에 대해 minimatch를 사용하여 경로를 필터링합니다(예: `slug`과 같은 단순 이름은 최종 키 세그먼트와 일치합니다).
- 캐시 파일 추적은 `file_tracking`의 `json-block:{blockIndex}:{projectRelPath}`을 사용합니다(문서 및 SVG와 동일한 `cacheDir`).
- Docusaurus `write-translations` 카탈로그(`{ message, description }` 형태)에는 **사용되지 않음** — 이들은 워크플로 2(`docs[].docusaurusCatalogDir` + `JsonExtractor` inside `translate-docs`)를 사용합니다.
- `t()` UI 문자열에는 **사용되지 않음** — 워크플로 1(`strings.json` + 평면 번들).
- CLI: `translate-json`; 오케스트레이션은 `src/cli/translate-json-run.ts`에서 수행됩니다. 초기화 템플릿: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## 공유 인프라

<a id="openrouterclient"></a>
### `LlmClient`

Vercel AI SDK( `ai` + `@ai-sdk/openai-compatible` )를 기반으로 구축된 공급자 독립적인 채팅 클라이언트입니다. 활성 공급자를 `provider` / `providers`에서 확인하고, 해당 공급자의 `baseUrl` + API 키에 대한 OpenAI 호환 클라이언트( `createOpenAICompatible` )를 빌드한 다음, 모든 호출을 `generateText`를 통해 라우팅합니다. `OpenRouterClient`는 더 이상 사용되지 않는 별칭으로 유지됩니다. 주요 동작:

- **모델 대체**: 해결된 목록의 각 모델을 순서대로 시도합니다. 요청 또는 구문 분석 실패 시 대체됩니다. UI 번역은 `ui.preferredModel`이 있으면 먼저 확인하고, 그 다음 공급자의 `translationModels`을 확인합니다.
- **요청 시간 초과**: 활성 공급자의 `requestTimeoutMs`(기본값 30초)는 `AbortSignal.timeout`을 통해 각 요청을 중단합니다. CLI가 `check-models`(모든 공급자)에 대한 공급자 모델 목록을 로드하고 알 수 없는 모델 ID를 삭제하는 선택적 사전 필터(OpenRouter 전용)를 로드할 때도 동일한 값이 `GET /models`에 적용됩니다.
- **OpenRouter 추가 기능** (`openrouter`이 활성화된 경우에만): `provider` 요청 필드, `HTTP-Referer` / `X-Title` 헤더를 통한 처리량 라우팅, `usage.cost`에서 읽은 정확한 USD 비용. 토큰 사용량은 모든 공급자에 대해 보고되며, 정확한 비용은 공급자가 반환하는 경우에만 보고됩니다.
- **디버그 트래픽 로그**: `debugTrafficFilePath`이 설정된 경우 요청 및 응답 JSON을 파일에 추가합니다.

<a id="config-loading"></a>
### 설정 로드

`loadI18nConfigFromFile(configPath, cwd)` 파이프라인:

1. `ai-i18n-tools.config.json` 읽고 파싱 (JSON).
2. `mergeWithDefaults` - `defaultI18nConfigPartial`와 깊은 병합, `docs[].sourceFiles` 항목들을 `contentPaths`에 병합.
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales`이 파일 경로인 경우 매니페스트를 로드하고 로케일 코드로 확장; `uiLanguagesPath` 설정.
4. `expandDocumentationTargetLocalesInRawInput` - 각 `docs[].targetLocales` 항목에 대해 동일하게 수행.
5. `parseI18nConfig` - Zod 유효성 검사 + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE` 등을 적용.
7. `augmentConfigWithUiLanguagesFile` - 매니페스트 표시 이름 연결.

`init`은 `initConfigTemplates`에서 시작 구성 파일을 생성합니다: `ui-markdown`(UI + 선택적 앱 마크다운), `ui-docusaurus`, `ui-starlight`, `ui-astro-website`(순수 Astro UI; `.astro` 페이지 번역을 위해 `docs[]` 추가), `ui-json-bundles`(워크플로 3 `json[]` 전용). [GETTING_STARTED — 초기화](GETTING_STARTED.ko.md#step-1-initialise)를 참조하세요.

<a id="logger"></a>
### 로거

`Logger`는 ANSI 색상 출력과 함께 `debug`, `info`, `warn`, `error` 수준을 지원합니다. 자세한 모드(`-v`)는 `debug`을 활성화합니다. `logFilePath`이 설정된 경우 로그 라인은 해당 파일에도 기록됩니다.

<a id="self-localization-tool-ui"></a>
### 자체 지역화(도구 UI)

도구는 사용자가 번역한 콘텐츠와 별개로 자체 UI — CLI 도움말, 고交通 로그/요약/오류 메시지 및 번역 대시보드를 지역화합니다.

- **로캘 해결** (`resolveUiLocale` in `src/core/ui-locale.ts`): `-L` / `--ui-lang` > `AI_I18N_LANG` > config `uiLanguage` > 호스트 OS 로캘 (`Intl.DateTimeFormat().resolvedOptions().locale`)에서 UI 로캘을 선택합니다. 후보는 정규화되고 정확히 일치하거나 가장 가까운 변형(예: `pt-PT` → `pt-BR`, `en-US` → `en-GB`)으로 배송된 번들 세트와 일치하며, 소스 로캘 (`en-GB`)로 돌아갑니다. CLI는 도움말을 빌드하기 전에 한 번(전처리 인수 스캔) 및 구성 로드 후에 다시 한 번 해결되므로 `uiLanguage`이 적용됩니다(플래그 및 환경 변수는 여전히 우선합니다).
- **런타임** (`src/i18n/index.ts`): `t(source, vars)`에 `{{name}}` 보간이 있는 최소한의 런타임으로, 영어 소스 문자열에 대한 평면 로캘 번들에서 키를 사용하여 `src/i18n/locales/<code>.json`(빌드 시 `dist/i18n/locales`에 복사)에 있습니다. 누락된 키 또는 번들은 소스 텍스트를 반환합니다. 이는 워크플로 1과 동일한 키-기본 모델입니다. 해시 조회는 없습니다.
- **대시보드**: 서버는 해결된 UI 로캘에 대한 `GET /api/ui-i18n`을(를) 반환하는 `{ locale, dir, bundle }`을(를) 노출하며, 프론트엔드는 `<html lang>` / `dir`을(를) 설정하고 `data-i18n*` 속성을 통해 정적 마크업을 지역화합니다.
- **도그푸딩**: 번들은 패키지 자신의 추출 → `translate-ui` 파이프라인을 `ai-i18n-self.config.json`(`pnpm i18n:self`)에 대해 실행하여 생성됩니다. 카탈로그 키는 `t()` 호출에서 `src/cli/` 및 `src/i18n/`에 걸쳐서 나며, 대시보드의 `data-i18n*` 마커는 `src/dashboard-app/index.html`에 있습니다.

---

<a id="runtime-helpers-api"></a>
## 런타임 헬퍼 API

이 기능들은 `'ai-i18n-tools/runtime'`에서 내보내지며 모든 JavaScript 환경(브라우저, Node.js, Deno, Edge)에서 작동합니다. `i18next` 또는 `react-i18next`에서 **가져오지 않습니다**.

<a id="rtl-helpers"></a>
### RTL 헬퍼

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 설정 팩토리

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

일반적인 앱 진입점으로 `setupKeyAsDefaultT`를 사용하세요(키 자르기 + 복수형 `wrapT` + 선택적 `translate-ui` `{sourceLocale}.json`). 애플리케이션 설정을 위해 `wrapI18nWithKeyTrim`만 호출하는 것은 **사용 중단됨**입니다.

`generate-ui-languages` 후에도 `targetLocales`와 키가 일치하도록 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`로 `localeLoaders`을 빌드하세요. `docs/GETTING_STARTED.md` (런타임 연결), `examples/nextjs-app/`, `examples/console-app/`, `examples/astro-website/` (i18next 없이 사용자 정의 `makeT`) 참조.

<a id="display-helpers"></a>
### 표시 도우미

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### 문자열 도우미

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## 프로그래밍 방식 API

모든 공용 타입과 클래스는 패키지 루트에서 내보냅니다. 예: CLI 없이 Node.js에서 UI 번역 단계를 실행하는 경우:

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

주요 내보내기:

| 내보내기 | 설명 |
|---|---|
| `loadI18nConfigFromFile` | JSON 파일에서 설정을 로드하고 병합한 후 유효성을 검사합니다. |
| `parseI18nConfig` | 원시 설정 객체의 유효성을 검사합니다. |
| `TranslationCache` | SQLite 캐시 - `cacheDir` 경로로 인스턴스 생성. |
| `UIStringExtractor` | JS/TS 소스에서 `t("…")` 문자열 추출. |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML에서 `data-i18n*` 마커 스캔/삽입 (`extract`용 `.html` 및 `mark-html` 명령 지원). |
| `MarkdownExtractor` | 마크다운에서 번역 가능한 구문 추출. |
| `JsonExtractor` | Docusaurus JSON 레이블 파일(UI 카탈로그, MDX 본문 아님)에서 추출합니다. |
| `SvgExtractor` | SVG 파일에서 추출. |
| `LlmClient` | 활성 LLM 공급자에게 번역 요청을 합니다( `OpenRouterClient`는 더 이상 사용되지 않는 별칭). |
| `PlaceholderHandler` | 번역 주위의 마크다운 구문 보호/복원 (HTML 태그, 주석, 앵커, MDX 주석/JSX/중괄호, URL, 인라인 코드, 강조). |
| `protectMdx` / `restoreMdx` | MDX 주석, JSX 태그, 중괄호 표현식 및 JSX 문자열 속성 보호/복원 (`PlaceholderHandler`에 의해 호출됨; 직접 사용을 위해 내보내기도 함). |
| `splitTranslatableIntoBatches` | 구문을 LLM 크기의 배치로 그룹화. |
| `validateTranslation` | 번역 후 구조적 검사. |
| `resolveDocumentationOutputPath` | 번역된 문서의 출력 파일 경로 결정. |
| `Glossary` / `GlossaryMatcher` | 번역 용어집 로드 및 적용. |
| `runTranslateUI` | 프로그래밍 방식 번역 UI 진입점. |

---

<a id="extension-points"></a>
## 확장 포인트

<a id="custom-function-names-ui-extraction"></a>
### 사용자 정의 함수 이름(UI 추출)

구성 파일을 통해 비표준 번역 함수 이름 추가:

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

(`ui.reactExtractor`은 `ui.uiExtractor`의 완전히 지원되는 별칭입니다.)

`extract` 중에 HTML 마커 속성을 스캔하도록 `extensions`에 `.html` / `.htm`을(를) 추가합니다. `ui.uiExtractor.htmlI18nAttributes`는 선택 사항이며 기본값은 `["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`입니다. `data-i18n`은(는) 요소 `textContent`에 매핑되고 `data-i18n-<attr>`은(는) 해당 속성의 값에 매핑됩니다(예: `data-i18n-aria-label`).

<a id="custom-extractors"></a>
### 사용자 정의 추출기

패키지에서 `ContentExtractor`를 구현하세요:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

프로그램 방식으로 `doc-translate.ts` 유틸리티를 가져와 doc-translate 파이프라인에 전달합니다.

<a id="custom-output-paths"></a>
### 사용자 정의 출력 경로

모든 파일 레이아웃에 `docsOutput.pathTemplate`를 사용하세요.

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
