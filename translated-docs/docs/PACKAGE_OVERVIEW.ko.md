<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: 패키지 개요

`ai-i18n-tools`의 내부 아키텍처, 각 구성 요소의 상호 연결 방식, 두 가지 핵심 워크플로우의 구현 방법을 설명합니다.

실제 사용법은 [GETTING_STARTED.md](GETTING_STARTED.ko.md)를 참조하세요.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

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
  - [추출기](#extractors)
  - [제목 앵커 삽입 (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [플레이스홀더 보호](#placeholder-protection)
  - [캐시 (`TranslationCache`)](#cache-translationcache)
  - [출력 경로 결정](#output-path-resolution)
  - [평면화된 링크 재작성](#flat-link-rewriting)
- [공유 인프라](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [설정 로딩](#config-loading)
  - [로거](#logger)
- [런타임 헬퍼 API](#runtime-helpers-api)
  - [RTL 헬퍼](#rtl-helpers)
  - [i18next 설정 팩토리](#i18next-setup-factories)
  - [표시 헬퍼](#display-helpers)
  - [문자열 헬퍼](#string-helpers)
- [프로그래밍 방식 API](#programmatic-api)
- [확장 포인트](#extension-points)
  - [사용자 정의 함수 이름 (UI 추출)](#custom-function-names-ui-extraction)
  - [사용자 정의 추출기](#custom-extractors)
  - [사용자 정의 출력 경로](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## 아키텍처 개요

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
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
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
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
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
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
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

<a id="workflow-1---ui-translation-internals"></a>
## 워크플로 1 - UI 번역 내부 동작

```text
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

<a id="uistringextractor"></a>
### `UIStringExtractor`

`i18next-scanner`의 `Parser.parseFuncFromString`를 사용하여 JS/TS 파일 내의 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. 함수 이름과 파일 확장자는 구성 가능합니다. `extract` **또한 스캐너가 아닌 입력을 동일한 카탈로그에 병합합니다.** 프로젝트의 `package.json` `description`는 `reactExtractor.includePackageDescription`이 활성화된 경우(기본값), 그리고 `reactExtractor.includeUiLanguageEnglishNames`이 `true`이고 `uiLanguagesPath`가 설정된 경우 `ui-languages.json`의 각 `englishName`이 해당됩니다(소스에서 이미 발견된 문자열이 우선 적용됨). 세그먼트 해시는 잘린 원본 문자열의 **MD5 첫 8자리 16진수**이며, 이는 `strings.json`의 키가 됩니다.

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

`models` (선택 사항) — 로케일별로, 해당 로케일에 대해 마지막으로 성공한 `translate-ui` 실행 후 어떤 모델이 번역을 생성했는지 (또는 `editor` 웹 UI에서 텍스트를 저장한 경우 `user-edited`). `locations` (선택 사항) — `extract`가 문자열을 어디에서 찾았는지 (스캐너 + 패키지 설명 라인; 매니페스트 전용 `englishName` 문자열은 `locations`를 생략할 수 있음).

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

`OpenRouterClient.translateUIBatch`은 각 모델을 순서대로 시도하며, 파싱 또는 네트워크 오류 시 다음 모델로 전환합니다. CLI는 `openrouter.translationModels`(또는 레거시 기본값/대체값)에서 해당 목록을 생성하며, `translate-ui`의 경우 설정되어 있으면 선택적 `ui.preferredModel`가 앞에 추가됩니다(나머지 목록과 중복 제거됨).

---

<a id="workflow-2---document-translation-internals"></a>
## 워크플로 2 - 문서 번역 내부 동작

```text
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
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

- `MarkdownExtractor` - 마크다운을 유형별 세그먼트로 분할합니다: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. 번역 불가능한 세그먼트(코드 블록, 원시 HTML)는 원문 그대로 보존됩니다.
- `JsonExtractor` - Docusaurus JSON 레이블 파일에서 문자열 값을 추출합니다.
- `SvgExtractor` - SVG에서 `<text>`, `<title>`, `<desc>` 콘텐츠를 추출합니다(`config.svg` 아래의 자산에 대해 `translate-svg`에서 사용되며, `translate-docs`에서는 사용되지 않음).

<a id="heading-anchor-insertion-write-heading-ids"></a>
### 제목 앵커 삽입 (`write-heading-ids` CLI)

`write-heading-ids` 명령은 문서 마크다운을 위한 **로컬, 비-LLM** 전처리기입니다. 구현 방식: `src/cli/write-heading-ids.ts`이 파일 탐색을 조정하고, `src/markdown/write-heading-ids-core.ts`가 줄을 구문 분석하여 앵커를 삽입합니다.

유효한 설정 파일에 **최소한 하나의 `documentations[]` 블록**이 포함되어야 합니다. 각 블록에 대해 `contentPaths` 아래의 `.md` / `.mdx` 파일을 수집하고, 프로젝트의 `.translate-ignore` 규칙을 적용합니다(문서 번역과 동일한 개념), 필요 시 `--path` / `--file`를 사용해 하위 트리로 제한할 수 있습니다. 각 파일은 `applyHeadingAnchorsToMarkdown`로 변환됩니다. 코드 블록 외부의 **플랫 ATX 제목**(`# …`에서 `###### …`까지)마다, 누락되거나 오래된 경우 위쪽 줄에 빈 HTML 줄 `<a id="slug"></a>`이 삽입됩니다. 슬러그 알고리즘은 일반적인 에코시스템과 일치합니다 — `github`(기본값), `bitbucket`, `gitlab`, `pymdown`(선택적 유니코드 정규화/퍼센트 인코딩 플래그), `azure-devops` — 기존 도구(doctoc, PyMdown 등)와 앵커 ID가 일관되도록 합니다. `--dry-run`은 파일을 쓰지 않고도 예상 편집 내용을 보고합니다.

이 명령은 `translate-docs` 또는 `sync` 내부에서 **실행되지 않습니다**. 번역 또는 게시 전에 소스 파일 내 조각 ID를 안정적으로 유지하고자 할 때 명시적으로 실행해야 합니다.

<a id="placeholder-protection"></a>
### 자리 표시자 보호

번역 전, 민감한 구문은 LLM에 의해 손상되지 않도록 불투명한 토큰으로 대체됩니다:

1. **주석 마커** (`:::note`, `:::`) - 원본 텍스트 그대로 복원됩니다.
2. **문서 앵커** (HTML `<a id="…">`, Docusaurus 제목 `{#…}`) - 원문 그대로 보존됩니다.
3. **마크다운 URL** (`](url)`, `src="../…"`) - 번역 후 맵을 통해 복원됩니다.

<a id="cache-translationcache"></a>
### 캐시(`TranslationCache`)

SQLite 데이터베이스(`node:sqlite` 사용)는 `(source_hash, locale)`을 키로 하여 `translated_text`, `model`, `filepath`, `last_hit_at` 및 관련 필드를 포함한 행을 저장합니다. 해시는 정규화된 콘텐츠(공백이 축소됨)의 SHA-256 해시값 중 앞 16자리 16진수 문자로 생성됩니다.

각 실행 시 세그먼트는 해시 × 로케일 조합으로 조회됩니다. 캐시 미스 항목만 LLM으로 전송됩니다. 번역 후, 현재 번역 범위 내에서 조회되지 않은 세그먼트 행에 대해 `last_hit_at`이 재설정됩니다. `cleanup`은 먼저 `sync --force-update`를 실행한 후, 미사용 세그먼트 행(null `last_hit_at` 또는 빈 파일 경로)을 제거하고, 디스크상에 해당 소스 경로가 없을 경우(`doc-block:…`, `svg-assets:…` 등) `file_tracking` 키를 정리하며, 메타데이터 파일 경로가 존재하지 않는 파일을 가리키는 번역 행도 제거합니다. 또한 `--no-backup`이 전달되지 않으면 먼저 `cache.db`을 백업합니다.

`translate-docs` 명령어는 또한 **파일 추적**을 사용하여 기존 출력이 있는 변경되지 않은 소스가 작업을 완전히 건너뛸 수 있도록 합니다. `--force-update`은 세그먼트 캐시를 계속 사용하면서 파일 처리를 다시 실행하며, `--force`는 파일 추적을 초기화하고 API 번역 시 세그먼트 캐시 읽기를 우회합니다. 전체 플래그 표는 [시작하기](GETTING_STARTED.ko.md#cache-behaviour-and-translate-docs-flags)를 참조하세요.

**배치 프롬프트 형식:** `translate-docs --prompt-format`은 `OpenRouterClient.translateDocumentBatch`에 대해서만 XML(`<seg>` / `<t>`) 또는 JSON 배열/객체 형식을 선택합니다. 추출, 자리 표시자, 검증은 변경되지 않습니다. [배치 프롬프트 형식](GETTING_STARTED.ko.md#batch-prompt-format)을 참조하세요.

<a id="output-path-resolution"></a>
### 출력 경로 해석

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`은 소스 기준 경로를 출력 경로에 매핑합니다:

- `nested` 스타일(기본값): 마크다운은 `{outputDir}/{locale}/{relPath}` 사용.
- `docusaurus` 스타일: `docsRoot` 아래에 위치하며 출력은 `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}` 사용; `docsRoot` 외부의 경로는 중첩된 레이아웃으로 대체됨.
- `flat` 스타일: `{outputDir}/{stem}.{locale}{extension}`. `flatPreserveRelativeDir`이 `true`일 때, 소스 하위 디렉터리는 `outputDir` 아래에 유지됨.
- **사용자 정의** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`를 사용하는 임의의 마크다운 레이아웃.
- **사용자 정의** `jsonPathTemplate`: JSON 레이블 파일을 위한 별도의 사용자 정의 레이아웃으로, 동일한 플레이스홀더 사용.
- `linkRewriteDocsRoot`은 번역된 출력이 기본 프로젝트 루트가 아닌 다른 위치에 루트를 둘 때, 평면화된 링크 재작성기가 올바른 접두사를 계산하도록 도와줍니다.

<a id="flat-link-rewriting"></a>
### 단일 링크 재작성

`markdownOutput.style === "flat"`일 경우, 번역된 마크다운 파일은 로케일 접미사와 함께 소스와 동일한 위치에 배치됩니다. 페이지 간 상대 링크는 `readme.de.md`의 `[Guide](../guide.md)`이 `guide.de.md`을 가리키도록 재작성됩니다. `rewriteRelativeLinks`에 의해 제어되며, 사용자 정의 `pathTemplate` 없이 평면 스타일일 경우 자동으로 활성화됩니다.

---

<a id="shared-infrastructure"></a>
## 공유 인프라

<a id="openrouterclient"></a>
### `OpenRouterClient`

OpenRouter 채팅 완성 API를 래핑합니다. 주요 동작:

- **모델 폴백**: 확인된 목록의 각 모델을 순서대로 시도하며, HTTP 오류나 구문 분석 실패 시 폴백합니다. UI 번역은 존재할 경우 먼저 `ui.preferredModel`을 확인하고, 그다음 `openrouter` 모델을 확인합니다.
- **속도 제한**: 429 응답을 감지하면 `retry-after` 동안(또는 2초 동안) 대기한 후 한 번 재시도합니다.
- **디버그 트래픽 로그**: `debugTrafficFilePath`이 설정된 경우 요청 및 응답 JSON을 파일에 추가합니다.

<a id="config-loading"></a>
### 설정 로드

`loadI18nConfigFromFile(configPath, cwd)` 파이프라인:

1. `ai-i18n-tools.config.json` 읽고 파싱(JSON).
2. `mergeWithDefaults` - `defaultI18nConfigPartial`와 깊은 병합 수행, 그리고 `documentations[].sourceFiles` 항목들을 `contentPaths`에 병합.
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales`이 파일 경로인 경우 매니페스트를 로드하고 로케일 코드로 확장; `uiLanguagesPath` 설정.
4. `expandDocumentationTargetLocalesInRawInput` - 각 `documentations[].targetLocales` 항목에 대해 동일하게 수행.
5. `parseI18nConfig` - Zod 유효성 검사 + `validateI18nBusinessRules`.
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE` 등을 적용.
7. `augmentConfigWithUiLanguagesFile` - 매니페스트 표시 이름 연결.

<a id="logger"></a>
### 로거

`Logger`는 ANSI 색상 출력과 함께 `debug`, `info`, `warn`, `error` 수준을 지원합니다. 자세한 모드(`-v`)는 `debug`을 활성화합니다. `logFilePath`이 설정된 경우 로그 라인은 해당 파일에도 기록됩니다.

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

`generate-ui-languages` 후 `targetLocales`와 키가 일치하도록 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`로 `localeLoaders`를 빌드하세요. `docs/GETTING_STARTED.md`(런타임 설정) 및 `examples/nextjs-app/` / `examples/console-app/`를 참조하세요.

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
| `MarkdownExtractor` | 마크다운에서 번역 가능한 구문 추출. |
| `JsonExtractor` | Docusaurus JSON 레이블 파일에서 추출. |
| `SvgExtractor` | SVG 파일에서 추출. |
| `OpenRouterClient` | OpenRouter로 번역 요청 전송. |
| `PlaceholderHandler` | 번역 시 마크다운 구문 보호/복원. |
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
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

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

모든 파일 구조에 `markdownOutput.pathTemplate` 사용:

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
