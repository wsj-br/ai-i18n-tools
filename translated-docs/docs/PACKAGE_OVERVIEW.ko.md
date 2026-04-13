# ai-i18n-tools: 패키지 개요

이 문서는 `ai-i18n-tools`의 내부 아키텍처, 각 구성 요소의 상호 연결 방식 및 두 가지 핵심 워크플로우의 구현 방법을 설명합니다.

실제 사용법은 [GETTING_STARTED.md](GETTING_STARTED.ko.md)을 참조하세요.

<small>**다른 언어로 읽기:** </small>

<small id="lang-list">[en-GB](../../docs/PACKAGE_OVERVIEW.md) · [de](./PACKAGE_OVERVIEW.de.md) · [es](./PACKAGE_OVERVIEW.es.md) · [fr](./PACKAGE_OVERVIEW.fr.md) · [hi](./PACKAGE_OVERVIEW.hi.md) · [ja](./PACKAGE_OVERVIEW.ja.md) · [ko](./PACKAGE_OVERVIEW.ko.md) · [pt-BR](./PACKAGE_OVERVIEW.pt-BR.md) · [zh-CN](./PACKAGE_OVERVIEW.zh-CN.md) · [zh-TW](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [아키텍처 개요](#architecture-overview)
- [소스 트리](#source-tree)
- [워크플로우 1 - UI 번역 내부 구조](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [평면화된 로케일 파일](#flat-locale-files)
  - [UI 번역 프롬프트](#ui-translation-prompts)
- [워크플로우 2 - 문서 번역 내부 구조](#workflow-2---document-translation-internals)
  - [추출기](#extractors)
  - [플레이스홀더 보호](#placeholder-protection)
  - [캐시 (`TranslationCache`)](#cache-translationcache)
  - [출력 경로 결정](#output-path-resolution)
  - [평면화된 링크 재작성](#flat-link-rewriting)
- [공유 인프라](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [설정 로드](#config-loading)
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

## 아키텍처 개요

```
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

소비자가 프로그래밍 방식으로 필요로 할 수 있는 모든 항목은 `src/index.ts`에서 다시 내보냅니다.

---

## 소스 트리

```
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
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

## 워크플로우 1 - UI 번역 내부 구조

```
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

### `UIStringExtractor`

`i18next-scanner`의 `Parser.parseFuncFromString`을 사용하여 JS/TS 파일 내 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. 함수 이름과 파일 확장자는 구성 가능하며, `reactExtractor.includePackageDescription`가 활성화된 경우 프로젝트의 `package.json` `description`도 추출에 포함될 수 있습니다. 세그먼트 해시는 **MD5의 앞 8자리 16진수**이며, 이는 소스 문자열을 잘라낸 후 생성되며 `strings.json`의 키가 됩니다.

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

`models` (선택 사항) — 각 로케일별로, 해당 로케일에 대해 마지막으로 성공한 `translate-ui` 실행 후 어떤 모델이 번역을 생성했는지를 나타냅니다 (또는 `editor` 웹 UI에서 텍스트가 저장된 경우 `user-edited`). `locations` (선택 사항) — `extract`가 문자열을 찾은 위치입니다.

`extract`는 새로운 키를 추가하고, 스캔 결과에 여전히 존재하는 키에 대해 기존의 `translated` / `models` 데이터를 보존합니다. `translate-ui`는 누락된 `translated` 항목을 채우고, 번역한 로케일에 대해 `models`를 업데이트하며, 평면화된 로케일 파일을 작성합니다.

### 평면화된 로케일 파일

각 대상 로케일은 소스 문자열 → 번역을 매핑하는 평면화된 JSON 파일(`de.json`)을 가지며, `models` 필드는 포함하지 않습니다:

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18next는 이를 리소스 번들로 로드하고 소스 문자열을 키로 하여 번역을 조회합니다 (기본값으로 키를 사용하는 모델).

### UI 번역 프롬프트

`buildUIPromptMessages`는 다음을 수행하는 시스템 및 사용자 메시지를 구성합니다:
- 소스 및 대상 언어를 표시 이름(`localeDisplayNames` 또는 `ui-languages.json`에서)으로 식별합니다.
- 문자열의 JSON 배열을 전송하고 번역된 결과의 JSON 배열을 반환하도록 요청합니다.
- 가능할 경우 용어집 힌트를 포함합니다.

`OpenRouterClient.translateUIBatch`는 각 모델을 순서대로 시도하며, 파싱 또는 네트워크 오류 시 다음 모델로 폴백합니다. CLI는 `openrouter.translationModels`(또는 레거시 기본값/폴백)에서 해당 목록을 생성하며, `translate-ui`의 경우 선택적 `ui.preferredModel`이 설정되어 있으면 앞에 추가됩니다(나머지 목록과 중복 제거됨).

---

## 워크플로우 2 - 문서 번역 내부 구조

```
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

### 추출기

모든 추출기는 `BaseExtractor`를 확장하며 `extract(content, filepath): Segment[]`를 구현합니다.

- `MarkdownExtractor` - 마크다운을 `frontmatter`, `heading`, `paragraph`, `code`, `admonition`과 같은 타입의 세그먼트로 분할합니다. 번역이 불가능한 세그먼트(코드 블록, 원시 HTML)는 원문 그대로 보존됩니다.
- `JsonExtractor` - Docusaurus JSON 레이블 파일에서 문자열 값을 추출합니다.
- `SvgExtractor` - SVG에서 `<text>`, `<title>`, `<desc>` 콘텐츠를 추출합니다(`translate-svg`가 `config.svg` 아래의 자산에 대해 사용하며, `translate-docs`에서는 사용하지 않음).

### 자리 표시자 보호

번역 전에 민감한 구문은 LLM에 의한 손상을 방지하기 위해 불투명한 토큰으로 대체됩니다.

1. **주석 표시자** (`:::note`, `:::`) - 정확한 원본 텍스트로 복원됩니다.
2. **문서 앵커** (HTML `<a id="…">`, Docusaurus 제목 `{#…}`) - 원문 그대로 보존됩니다.
3. **마크다운 URL** (`](url)`, `src="../…"`) - 번역 후 맵에서 복원됩니다.

### 캐시(`TranslationCache`)

SQLite 데이터베이스(`node:sqlite`를 통해)는 `(source_hash, locale)`을 키로 하여 `translated_text`, `model`, `filepath`, `last_hit_at` 및 관련 필드와 함께 행을 저장합니다. 해시는 정규화된 콘텐츠(공백이 축소됨)의 SHA-256 해시값의 처음 16자리 16진수 문자입니다.

각 실행 시 세그먼트는 해시 × 로케일로 조회됩니다. 캐시 미스만 LLM으로 전송됩니다. 번역 후 현재 번역 범위 내에서 적중되지 않은 세그먼트 행의 `last_hit_at`이 재설정됩니다. `cleanup`은 먼저 `sync --force-update`를 실행한 후, 오래된 세그먼트 행(null `last_hit_at` 또는 빈 filepath)을 제거하고, 디스크상에 해결된 소스 경로가 없는 경우 `file_tracking` 키를 정리하며(`doc-block:…`, `svg-assets:…` 등), 메타데이터 filepath가 누락된 파일을 가리키는 번역 행을 제거합니다. 단, `--no-backup`이 지정되지 않은 경우 `cache.db`를 먼저 백업합니다.

`translate-docs` 명령어는 또한 **파일 추적**을 사용하여 기존 출력이 있는 변경되지 않은 소스가 작업을 완전히 건너뛸 수 있도록 합니다. `--force-update`는 세그먼트 캐시를 계속 사용하면서도 파일 처리를 다시 실행하며, `--force`는 파일 추적을 지우고 API 번역을 위해 세그먼트 캐시 읽기를 우회합니다. 전체 플래그 표는 [시작하기](GETTING_STARTED.ko.md#cache-behaviour-and-translate-docs-flags)를 참조하세요.

**배치 프롬프트 형식:** `translate-docs --prompt-format`은 `OpenRouterClient.translateDocumentBatch`에만 적용되는 XML(`<seg>` / `<t>`) 또는 JSON 배열/객체 형식을 선택합니다. 추출, 자리 표시자, 검증은 변경되지 않습니다. [배치 프롬프트 형식](GETTING_STARTED.ko.md#batch-prompt-format)을 참조하세요.

### 출력 경로 결정

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`은 소스 기준 경로를 출력 경로에 매핑합니다.

- `nested` 스타일(기본값): 마크다운의 경우 `{outputDir}/{locale}/{relPath}`.
- `docusaurus` 스타일: `docsRoot` 아래에서 출력은 `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`를 사용합니다. `docsRoot` 외부의 경로는 nested 레이아웃으로 대체됩니다.
- `flat` 스타일: `{outputDir}/{stem}.{locale}{extension}`. `flatPreserveRelativeDir`이 `true`인 경우 소스 하위 디렉터리가 `outputDir` 아래에 유지됩니다.
- **사용자 정의** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`를 사용하는 임의의 마크다운 레이아웃.
- **사용자 정의** `jsonPathTemplate`: JSON 레이블 파일을 위한 별도의 사용자 정의 레이아웃으로, 동일한 자리 표시자를 사용합니다.
- `linkRewriteDocsRoot`는 번역된 출력이 기본 프로젝트 루트 외부에 위치할 때 평면 링크 재작성기가 올바른 접두사를 계산할 수 있도록 도와줍니다.

### 평면 링크 재작성

`markdownOutput.style === "flat"`일 때 번역된 마크다운 파일은 로케일 접미사와 함께 소스와 동일한 위치에 배치됩니다. 페이지 간의 상대 링크는 `readme.de.md`의 `[Guide](../guide.md)`가 `guide.de.md`를 가리키도록 재작성됩니다. `rewriteRelativeLinks`에 의해 제어되며(사용자 정의 `pathTemplate` 없이 flat 스타일에서는 자동 활성화됨).

---

## 공유 인프라

### `OpenRouterClient`

OpenRouter 채팅 완성 API를 래핑합니다. 주요 동작:

- **모델 폴백**: 해결된 목록의 각 모델을 순서대로 시도하며, HTTP 오류 또는 파싱 실패 시 폴백합니다. UI 번역은 존재할 경우 먼저 `ui.preferredModel`을 확인하고, 그 다음 `openrouter` 모델을 사용합니다.
- **속도 제한**: 429 응답을 감지하면 `retry-after`(또는 2초) 동안 대기한 후 한 번 재시도합니다.
- **프롬프트 캐싱**: 지원되는 모델에서 프롬프트 캐싱을 활성화하기 위해 시스템 메시지를 `cache_control: { type: "ephemeral" }`와 함께 전송합니다.
- **디버그 트래픽 로그**: `debugTrafficFilePath`가 설정된 경우 요청 및 응답 JSON을 파일에 추가합니다.

### 설정 로딩

`loadI18nConfigFromFile(configPath, cwd)` 파이프라인:

1. `ai-i18n-tools.config.json` 파일을 읽고 파싱합니다(JSON).
2. `mergeWithDefaults` - `defaultI18nConfigPartial`과 깊은 병합을 수행하고, `documentations[].sourceFiles` 항목들을 `contentPaths`에 병합합니다.
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales`가 파일 경로인 경우 매니페스트를 로드하고 로케일 코드로 확장하며, `uiLanguagesPath`를 설정합니다.
4. `expandDocumentationTargetLocalesInRawInput` - 각 `documentations[].targetLocales` 항목에 대해 동일하게 수행합니다.
5. `parseI18nConfig` - Zod 유효성 검사 및 `validateI18nBusinessRules` 실행.
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`, `I18N_SOURCE_LOCALE` 등의 환경 변수를 적용합니다.
7. `augmentConfigWithUiLanguagesFile` - 매니페스트 표시 이름을 첨부합니다.

### 로거

`Logger`는 ANSI 색상 출력을 지원하는 `debug`, `info`, `warn`, `error` 레벨을 제공합니다. 상세 모드(`-v`)는 `debug` 레벨을 활성화합니다. `logFilePath`가 설정된 경우 로그 라인은 해당 파일에도 기록됩니다.

---

## 런타임 헬퍼 API

이 API는 `'ai-i18n-tools/runtime'`에서 내보내며, 모든 JavaScript 환경(브라우저, Node.js, Deno, Edge)에서 작동합니다. `i18next` 또는 `react-i18next`를 **임포트하지 않습니다**.

### RTL 헬퍼

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next 설정 팩토리

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

### 표시 헬퍼

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### 문자열 헬퍼

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## 프로그래밍 방식 API

모든 공개 타입과 클래스는 패키지 루트에서 내보내집니다. 예: CLI 없이 Node.js에서 UI 번역 단계를 실행하는 경우:

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

주요 내보내기 항목:

| 내보내기 | 설명 |
|---|---|
| `loadI18nConfigFromFile` | JSON 파일에서 설정을 로드하고 병합 및 검증합니다. |
| `parseI18nConfig` | 원시 설정 객체를 검증합니다. |
| `TranslationCache` | SQLite 캐시 - `cacheDir` 경로로 인스턴스를 생성합니다. |
| `UIStringExtractor` | JS/TS 소스 코드에서 `t("…")` 문자열을 추출합니다. |
| `MarkdownExtractor` | 마크다운에서 번역 가능한 세그먼트를 추출합니다. |
| `JsonExtractor` | Docusaurus JSON 레이블 파일에서 추출합니다. |
| `SvgExtractor` | SVG 파일에서 추출합니다. |
| `OpenRouterClient` | OpenRouter로 번역 요청을 보냅니다. |
| `PlaceholderHandler` | 번역 주변의 마크다운 구문을 보호하고 복원합니다. |
| `splitTranslatableIntoBatches` | 세그먼트를 LLM 크기의 배치로 그룹화합니다. |
| `validateTranslation` | 번역 후 구조적 검사를 수행합니다. |
| `resolveDocumentationOutputPath` | 번역된 문서의 출력 파일 경로를 결정합니다. |
| `Glossary` / `GlossaryMatcher` | 번역 용어집을 로드하고 적용합니다. |
| `runTranslateUI` | 프로그래밍 방식의 UI 번역 진입점입니다. |

---

## 확장 포인트

### 사용자 정의 함수 이름(UI 추출)

설정을 통해 비표준 번역 함수 이름을 추가할 수 있습니다:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### 사용자 정의 추출기

패키지에서 `ContentExtractor`를 구현합니다:

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

`doc-translate.ts` 유틸리티를 프로그래밍 방식으로 가져와 doc-translate 파이프라인에 전달합니다.

### 사용자 정의 출력 경로

모든 파일 레이아웃에 대해 `markdownOutput.pathTemplate`을 사용합니다:

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
