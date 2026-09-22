<a id="architecture"></a>
# 아키텍처

<a id="architecture-overview"></a>
## 아키텍처 개요

코드베이스는 4개의 계층으로 구성됩니다. 이 섹션을 개념 모델에 사용하고, 파일 수준의 세부 정보가 필요할 때 [소스 트리](#source-tree)를 여세요.

<a id="how-a-sync-run-fits-together"></a>
### `sync` 실행이 함께 작동하는 방식

`sync`(및 개별 번역 명령)은 활성화된 기능을 순서대로 실행합니다.

| 단계 | 명령 | 기능 |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | UI 소스 스캔 → `strings.json` 업데이트 → 플랫 로케일 JSON 채우기(`de.json`, …) |
| 2 | `translate-svg` *(선택 사항)* | `config.svg` 아래의 SVG 텍스트 번역 |
| 3 | `translate-docs` | 마크다운, MDX, `.astro` 페이지 번역; Docusaurus 카탈로그 JSON; Nextra `_meta` / 사전 `.ts`; VitePress 테마 카탈로그 |
| 4 | `translate-json` *(선택 사항)* | `json[]` 아래의 중첩된 JSON 리프 번역 |

모든 파이프라인은 동일한 핵심 루프를 따릅니다. **세그먼트 추출 → 구문 보호 → 일괄 처리 → 캐시 조회 또는 LLM 호출 → 출력 쓰기**. 중간의 공유 서비스(구성, 자리 표시자, 캐시, 용어집, `LlmClient`)는 [공유 인프라](#shared-infrastructure)에 설명되어 있습니다.

<a id="module-map"></a>
### 모듈 맵

| 계층 | 폴더 | 역할 |
| --- | --- | --- |
| **진입** | `src/cli/` | CLI 명령: `init`, `extract`, `mark-html`, `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`, `status`, `dashboard`, … |
| **파이프라인** | `src/extractors/` | JS/TS, HTML 마커, 마크다운, JSON, SVG, `.astro`에서 세그먼트 추출 |
| | `src/processors/` | 자리 표시자 보호, 일괄 처리, 유효성 검사, 링크 다시 쓰기 |
| **공유** | `src/core/` | 구성, 유형, SQLite 캐시, 프롬프트, 출력 경로, 로케일 유틸리티 |
| | `src/api/` | `LlmClient` — 모델 대체 기능이 있는 공급자 독립적인 채팅 클라이언트(Vercel AI SDK) |
| | `src/glossary/` | 프롬프트용 용어집 로딩, 용어 힌트 및 선택적 프로젝트 컨텍스트 파일 |
| | `src/utils/` | 로거, 해싱, 무시 파서, 표시 너비 테이블, `.env` 로더 |
| **앱 런타임** | `src/runtime/` | i18next 도우미 및 표시 유틸리티 — `'ai-i18n-tools/runtime'`로 내보내짐([런타임 도우미](/ko/guide/runtime-helpers)) |
| **도구 UI** *(자체 사용)* | `src/i18n/`, `src/dashboard-app/`, `src/server/` | 이 패키지의 자체 CLI 및 번역 대시보드를 현지화합니다. 프로젝트 콘텐츠와는 별개입니다([자체 현지화](#self-localization-tool-ui)) |

프로그래밍 방식으로 사용하기 위한 모든 것은 `src/index.ts`에서 다시 내보내집니다([프로그래밍 API](/ko/reference/programmatic-api)).

<a id="pipeline-summaries"></a>
### 파이프라인 요약

| 파이프라인 | 섹션 | 입력 → 출력 |
| --- | --- | --- |
| UI 문자열 | [UI 문자열 내부](#ui-strings-internals) | 소스 파일 → `strings.json` → 플랫 `{locale}.json` |
| 문서 | [문서 내부](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → `docs[].outputDir` 아래의 로케일별 파일 |
| JSON 번들 | [JSON 내부](#json-internals) | `json[]` 아래의 중첩 JSON → 로케일별 JSON 파일 |
| SVG | [문서 내부 — 추출기](#extractors) | `config.svg` 아래의 SVG 파일 → 번역된 SVG 사본 |

---

<a id="ui-strings-internals"></a>
## UI 문자열 내부

| 단계 | 구성 요소 | 결과 |
| --- | --- | --- |
| 1 | 소스 파일 (JS/TS; 선택 사항 `.astro` / `.html`) | 디스크의 파일 |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` (`ui-string-babel.ts` 경유)) | MD5 해시로 키 지정된 세그먼트 |
| 3 | `strings.json` | 마스터 카탈로그: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | 소스 문자열의 JSON 배열 → 번역 (+ 배치당 모델 ID) |
| 5 | `de.json`, `pt-BR.json`, … | 플랫 맵: 소스 문자열 → 번역 (모델 메타데이터 없음) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

`i18next-scanner`의 `Parser.parseFuncFromString`를 사용하여 JS/TS 파일에서 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. `.astro` 소스(`ui.uiExtractor.extensions`에 나열된 경우)의 경우, `ui-string-babel.ts`는 `@babel/parser`로 프론트매터 및 템플릿 `{expression}` 블록을 파싱하고 동일한 `funcNames` 규칙을 적용합니다. 함수 이름과 파일 확장자는 `ui.uiExtractor`을 통해 구성할 수 있습니다(`ui.reactExtractor`는 지원되는 별칭입니다). `extract` **또한 비 스캐너 입력을 동일한 카탈로그로 병합합니다:** `includePackageDescription`가 활성화된 경우(기본값) 프로젝트 `package.json` `description`, 그리고 `includeUiLanguageEnglishNames`가 `true`일 때 번들된 ui-languages 마스터 카탈로그(`sourceLocale` + `targetLocales`로 구축됨)의 각 `englishName` (소스에서 이미 찾은 문자열이 우선합니다; `languagesManifestPath`를 읽지 않습니다). `extract`는 또한 `languagesManifestPath`에서 `ui-languages.json`를 재생성합니다. 세그먼트 해시는 잘라낸 소스 문자열의 **MD5 첫 8자리 16진수 문자**이며 — 이는 `strings.json`의 키가 됩니다.

`.html` / `.htm` 소스(`ui.uiExtractor.extensions`에 나열된 경우)에 대해, `extract`은 대신 파일을 `html-i18n-marks.ts`로 라우팅하여 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 마커 속성( `ui.uiExtractor.htmlI18nAttributes`을 통해 구성 가능)을 스캔한다. 빈 마커는 해당 요소의 자신의 `textContent` / `title` / `placeholder`에서 소스 텍스트를 가져온다. 값이 있는 마커(`data-i18n="Key"`)는 값을 사용한다. 동일한 모듈이 자동으로 빈 마커를 삽입하는 `mark-html` 명령을 구동한다. HTML 파일은 바벨 / i18next-스캐너 패스를 통과하지 않는다.

순수 Astro SSG 사이트는 i18next를 생략할 수 있습니다: 빌드 시점에 플랫 `{locale}.json`을(를) 로드하고 소스 텍스트 키로 `t('English')`을(를) 해석합니다(`examples/astro-website/src/i18n/t.ts` 및 [UI 문자열 — Astro 웹사이트](/ko/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight) 참조).

순수 HTML 앱은 `t()` 호출 대신 마커 속성을 사용하여 동일한 카탈로그 모델을 따릅니다 — [번역을 위한 HTML 마킹](/ko/guide/ui-strings/plain-html#marking-html-for-translation)을 참조하세요.

<a id="stringsjson"></a>
### `strings.json`

마스터 카탈로그의 구조는 다음과 같습니다:

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

`models` (선택 사항) — 로케일별로, 해당 로케일의 마지막 성공적인 `translate-ui` 실행 후 해당 번역을 생성한 모델입니다(또는 텍스트가 번역 대시보드에서 저장된 경우 `user-edited`). `locations` (선택 사항) — `extract`가 문자열을 찾은 위치입니다(스캐너 + 패키지 설명 줄; 번들된 마스터 `englishName` 문자열은 `locations`를 생략할 수 있음).

`extract`는 새 키를 추가하고 스캔에 여전히 존재하는 키(스캐너 리터럴, 선택적 설명, 선택적 번들된 마스터 `englishName`)에 대한 기존 `translated` / `models` 데이터를 보존합니다. `translate-ui`는 누락된 `translated` 항목을 채우고, 번역하는 로케일의 `models`를 업데이트하며, 플랫 로케일 파일을 작성합니다.

`ui-languages.json` **매니페스트** — `{ code, label, englishName, direction }`의 JSON 배열(BCP-47 `code`, UI `label`, 참조 `englishName`, `"ltr"` 또는 `"rtl"`). `generate-ui-languages` 또는 `extract`를 사용하여 `sourceLocale` + `targetLocales` 및 번들된 마스터 `data/ui-languages-complete.json`에서 프로젝트 파일을 빌드합니다.

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

- 소스 및 대상 언어를 식별합니다(`localeDisplayNames` 또는 `ui-languages.json`의 표시 이름 기준).
- 대상 로캘에 예상 문자 체계가 있는 경우(명시적 BCP-47 스크립트 또는 `hi` → 데바나가리, `ar` → 아랍 문자, `ja` → 일본어 가나/한자와 같은 언어 기본값) 스크립트 지시어를 앞에 추가합니다.
- 문자열의 JSON 배열을 전송하고 그에 대한 번역의 JSON 배열을 반환하도록 요청합니다.
- 사용 가능한 경우 용어집 힌트를 포함합니다.

`LlmClient.translateUIBatch`는 각 모델을 순서대로 시도하며, 구문 분석, 네트워크 또는 잘못된 스크립트 오류 발생 시 대체합니다(네이티브 스크립트 로캘의 경우 로마자/라틴 문자 대체 포함). CLI는 `localeModels`, 선택적 `uiModels`, `translationModels`에서 대상 로캘별로 해당 목록을 작성합니다([제공자 및 모델](/ko/guide/providers-and-models#model-fallback-chain) 참조).

---

<a id="documents-internals"></a>
## 문서 내부

| 단계 | 구성 요소 | 결과 |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro` 파일 (`translate-docs`) | 소스 파일 |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — 해시 + 콘텐츠가 있는 유형화된 세그먼트 |
| 3 | `PlaceholderHandler` | 보호된 텍스트 — HTML, 주의 사항, 앵커, MDX, URL, 인라인 코드, 토큰으로 마스킹된 강조 |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — 개수 + 문자 제한별로 그룹화됨 |
| 5 | `TranslationCache` 조회 | 캐시 적중 → 건너뛰기; 누락 → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | 최종 텍스트 — 자리 표시자 복원됨 |
| 7 | `resolveDocumentationOutputPath` | 출력 파일 — Docusaurus 레이아웃 또는 플랫 레이아웃 |

<a id="extractors"></a>
### 추출기

모든 추출기는 `BaseExtractor`를 확장하고 `extract(content, filepath): Segment[]`를 구현합니다.

- `MarkdownExtractor` - 마크다운을 타입화된 세그먼트로 분할합니다: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`. YAML frontmatter는 **번역 불가**로 분류됩니다(`slug`, `id` 및 기타 라우팅 키는 안정적으로 유지됨). 최상위 `export ...` 블록(예: React 컴포넌트 정의)은 기존 `import ...` 처리와 함께 번역 불가능한 `other` 세그먼트로 분류됩니다. 대문자 JSX 태그로 시작하는 여러 줄 블록(예: `<Tabs>` 블록)은 번역 가능한 단락으로 분류됩니다. 번역 불가능한 세그먼트(코드 블록, 원시 HTML)는 있는 그대로 보존됩니다.
- `AstroTemplateExtractor` - `.astro` 마케팅 페이지를 위한 파싱 및 교체(`doc-translate.ts`의 `translateAstroFile`를 통한 `translate-docs`). 사용자 대상 HTML 텍스트 노드 및 번역 가능한 속성(`alt`, `title`, `aria-label`, `placeholder`)과 사용자 대상일 때 템플릿 `{expression}` 블록 내부의 문자열 리터럴을 추출합니다. frontmatter TypeScript, `<script>`, `<style>`, 보호된 속성/키 값 및 `t('…')` 내부의 리터럴을 건너뜁니다. 재조립 과정에서는 출력 경로가 더 깊을 때 상대 임포트를 조정합니다(예: `src/pages/de/index.astro`). [Astro 웹사이트 페이지](/ko/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)를 참조하세요.
- `JsonExtractor` - Docusaurus JSON 레이블 파일에서 문자열 값을 추출합니다(MDX 본문이 아닌 Docusaurus UI 카탈로그).
- `SvgExtractor` - SVG에서 `<text>`, `<title>`, `<desc>` 콘텐츠를 추출합니다(`translate-docs`이(가) 아닌 `config.svg` 아래의 파일에 대해 `translate-svg`에서 사용됨).
- `html-i18n-marks.ts` - `extract`에서 `.html` / `.htm` 소스용으로, 그리고 `mark-html` 명령에서 사용하는 집중형 HTML 태그 스캐너입니다. `collectHtmlI18nStrings` / `collectHtmlI18nLocations`는 `data-i18n*` 마커 속성을 읽습니다(일반 마커 → 요소 `textContent` / `title` / `placeholder`; 값이 있는 마커 → 값). `markHtmlContent`은 일반 마커를 리프 텍스트 / 제목 / 플레이스홀더 요소에 삽입합니다(멱등성, `data-i18n-ignore` 존중, 코드와 유사하거나 혼합 콘텐츠인 요소는 건너뜁니다). 공유되는 `normalizeI18nText` 도우미는 빌드 시간 키를 브라우저 런타임과 동일하게 유지합니다.

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro 하이브리드 사이트(UI + 페이지 HTML)

일반 Astro 앱은 종종 UI 문자열과 문서를 하나의 구성에서 **모두** 활성화합니다 (참조: `examples/astro-website/`):

| 계층 | 메커니즘 | 출력 |
| --- | --- | --- |
| 템플릿 HTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` 아래의 로케일별 `.astro` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | 평면형 `public/locales/{locale}.json` (영문 소스를 키로 사용) |

`sync` 명령은 활성화된 단계를 순서대로 실행합니다: **추출** 다음 **UI 번역** (`features.translateUIStrings`인 경우) → 선택적 **SVG 번역** → **문서 번역** → 선택적 **JSON 번역** (`--no-ui`, `--no-svg`, `--no-docs` 또는 `--no-json`로 건너뛰지 않는 한). 초기 템플릿 `ui-astro-website`는 UI 문자열만 스캐폴드합니다. 페이지 HTML을 위해 `docs[]` 및 `features.translateDocs`를 추가합니다.

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 제목 앵커 삽입 (`write-heading-ids` CLI)

`write-heading-ids` 명령은 문서 마크다운을 위한 **로컬, 비-LLM** 전처리기입니다. 구현 방식: `src/cli/write-heading-ids.ts`이 파일 탐색을 조정하고, `src/markdown/write-heading-ids-core.ts`가 줄을 구문 분석하여 앵커를 삽입합니다.

유효한 구성에는 **최소 하나의 `docs[]` 블록**이 필요합니다. 각 블록에 대해 `contentPaths` 아래의 `.md` / `.mdx` 파일을 수집하고, 프로젝트의 `.translate-ignore` 규칙(문서 번역과 동일한 개념)을 적용하며, 선택적으로 `--path` / `--file`로 하위 트리로 제한합니다. 각 파일은 `applyHeadingAnchorsToMarkdown`로 변환됩니다: 펜스된 코드 블록 외부의 모든 **평면 ATX 제목**(`# …`부터 `###### …`까지)에 대해, 모든 형식의 기존 제목 ID가 선택된 스타일로 대체됩니다. HTML 스타일은 접미사가 없는 제목 위의 줄에 `<a id="slug"></a>`을 작성합니다; `--slug-style mdx-comment`은 제목 줄에 `{/* #slug */}`를 작성합니다(그리고 선행 HTML 앵커를 삭제합니다). 슬러그는 항상 현재 제목 텍스트에서 가져옵니다. `--remove`은 HTML 앵커, 클래식 `{#id}` 접미사 및 MDX 주석 ID를 제거하지만 새로 작성하지는 않습니다. 슬러그 알고리즘은 일반적인 생태계와 일치합니다 — `github`(기본값), `bitbucket`, `gitlab`, `pymdown`(선택적 유니코드 정규화 / 퍼센트 인코딩 플래그), `azure-devops`, 추가로 `mdx-comment`(깃허브 슬러그 + MDX 주석 출력) — 따라서 앵커 ID가 기존 도구(doctoc, PyMdown, Docusaurus 등)와 일관성을 유지합니다. `--dry-run`은 작성하지 않고 예정된 편집을 보고합니다.

소스 패스 이후, 동일한 명령이 각 로케일의 기존 번역된 마크다운(`resolveTranslatedOutputPath`)에 해당 영어 id들을 다시 배치합니다. 번역된 제목은 재슬러깅되지 않으며, 제목 중간의 `{#id}` / `{/* #id */}`는 선택된 스타일이 기대하는 접미사(또는 HTML 앵커)로 다시 이동됩니다. 누락된 로케일 파일은 건너뜁니다.

이 명령은 `translate-docs` 또는 `sync` 내부에서 **실행되지 않습니다**. 번역 또는 게시 전에 소스 파일 내 조각 ID를 안정적으로 유지하고자 할 때 명시적으로 실행해야 합니다.

<a id="placeholder-protection"></a>
### 자리 표시자 보호

번역 전에 민감한 구문은 LLM 손상을 방지하기 위해 불투명한 토큰으로 교체되며, 이 순서로 적용됩니다 (복원은 반대 순서입니다):

1. **제목-id 접미사** (ATX 제목 끝의 클래식 `{#id}` / MDX `{/* #id */}`) — 줄에서 완전히 분리되어 모델에 **전송되지 않습니다**. 복원 후 일치하는 제목의 끝에 다시 고정되어 Docusaurus가 여전히 유효한 id를 인식할 수 있습니다. 제목 중간의 주석은 텍스트에 그대로 남으며 이후의 MDX / `{#…}` 레이어에서 처리됩니다.
2. **HTML 태그 및 주석** (`<strong>`, `<!-- ... -->` 등) - 알려진 허용 목록의 소문자 HTML 태그는 ```{{HTM_N}}``` 토큰으로 대체됩니다. 대문자 JSX 태그(`<Highlight>`, `<Tabs>`, `</Tab>`)는 MDX 레이어(5단계)에서 별도로 처리됩니다.
3. **Admonition 마커** (`:::note`, `:::`) - 여는 줄의 디렉티브 접두사만 ```{{ADM_OPEN_N}}```로 대체되며, 같은 줄의 제목은 모델이 번역하도록 남겨집니다. 원본 텍스트 그대로 복원됩니다.
4. **문서 앵커** (HTML `<a id="…">`, 제목 중간에 남은 Docusaurus `{#…}`) - 그대로 보존됩니다.
5. **MDX 전용 구문** (`src/processors/mdx-placeholders.ts`):
   - **MDX 주석** (`{/* … */}`, 줄 끝 접미사가 아닌 제목 중간의 `{/* #my-id */}` 포함)는 ```{{MDX_N}}```로 대체됩니다.
   - **대문자 JSX 태그** (`<Highlight>`, `<Tabs>`, `<TabItem>`, `<TOCInline />`, `</Highlight>`) - ```{{MDX_N}}```로 보존되며, 번역 가능한 문자열 속성(`label`, `tooltip`, `aria-label`)은 속성 이름이 `docs[].protectAttributes`에 나타나지 않는 한 태그 내에서 ```{{JXA_N}}```로 재작성됩니다; `<Tabs values={[ { label: '…' } ]}>` 객체 리터럴 내의 `label:`(`docs[].protectKeys`를 통해 건너뛸 수 있음) 및 `<TabItem value="…">`(`label` 속성이 없을 때, 소문자 슬러그 형태의 값을 건너뜀)도 추출됩니다. 세그먼트에 `||JXA_N: …||` 줄로 추가되며 `restoreMdx`에 의해 다시 병합됩니다.
   - **MDX 중괄호 표현식** (`{frontMatter.title}`, <code v-pre>style={{…}}</code>) - 깊이 인식 매칭, ```{{MDX_N}}```로 대체됩니다.
6. **마크다운 URL** (`](url)`, `src="…"`) - 번역 후 맵에서 복원됩니다.
7. **인라인 코드 스팬** (`` `code` ``) 및 **굵게 처리된 인라인 코드** (`**`code`**`) - 보존됩니다.
8. **마크다운 강조** (선택 사항, CJK/RTL 로케일에서 자동 활성화) - 강조 구분자가 마스킹됩니다.

모델이 반환된 후, `translate-docs`는 맵을 복원하고 세그먼트의 유효성을 검사합니다: 동일한 이중 중괄호 토큰의 다중 집합이 존재해야 하며, 구조적 토큰(<code v-pre>{{HTM_N}}</code>, 경고 마커)은 순서가 지정된 하위 시퀀스를 유지해야 합니다(콘텐츠 토큰(예: <code v-pre>{{ILC_N}}</code> / <code v-pre>{{URL_N}}</code> / `**`)은 단어 순서에 따라 이동할 수 있음). 복원된 HTML 태그 종류는 보호되지 않은 소스와 일치해야 하며, 남은 이중 중괄호 식별자는 소스에 이미 존재했어야 합니다(따라서 새로 만든 토큰은 실패함). 문서 프롬프트는 또한 모델에게 각 토큰을 한 번 복사하고, 구조적 토큰 순서를 유지하며, 새로운 이중 중괄호 래퍼를 만들지 않도록 요청합니다; 기계적 검사는 여전히 권위를 갖습니다.

Astro 템플릿 및 MDX JSX에 대한 공유 속성/키 보호는 `src/processors/expression-attribute-protection.ts`에 구현되어 있으며 `docs[].protectAttributes` 및 `docs[].protectKeys`에 의해 블록별로 구동됩니다([protectAttributes / protectKeys](/ko/reference/configuration#protectattributes-protectkeys) 참조).

<a id="cache-translationcache"></a>
### 캐시(`TranslationCache`)

SQLite 데이터베이스(`node:sqlite`를 통해)는 정규화된 콘텐츠의 SHA-256 해시 값 중 앞 16자리 16진수 문자를 사용하여 `(source_hash, locale)`를 키로 하고 `translated_text`, `model`, `filepath`, `last_hit_at` 및 관련 필드를 포함하는 행을 저장합니다. 공백은 압축됩니다.

실행할 때마다 해시 × 로케일을 기준으로 세그먼트를 조회합니다. 캐시 미스만 LLM으로 전달됩니다. 번역 후, 현재 번역 범위에서 적중되지 않은 세그먼트 행에 대해 `last_hit_at`가 재설정됩니다. 문서 번역 중 캐시 적중에 성공하면 해당 세그먼트의 오래된 `translation_failures` 행이 지워집니다. `cleanup`는 먼저 `sync --force-update`를 실행한 다음, 오래된 세그먼트 행(null `last_hit_at` / 빈 파일 경로)을 제거하고, 확인된 소스 경로가 디스크에 없을 때 `file_tracking` 키를 정리하며(`doc-block:…`, `json-block:…`, `svg-files:…` 등), 메타데이터 파일 경로가 누락된 파일을 가리키는 번역 행을 제거하고, 고아가 된 `translation_failures` 행을 정리하며, 확인된 소스 경로가 디스크에 없는 고아가 된 `markdown_source_issues` 행을 정리하고, 설정에 없는 로케일의 캐시 행을 삭제합니다(`sourceLocale`, 루트 `targetLocales`, 블록별 `docs[]` / `json[]` `targetLocales`; SQLite 전용 — 생성된 파일을 삭제하려면 `purge-locale` 사용); `--backup <path>`가 전달되지 않는 한 `cache.db`를 백업하지 않으며, 전달될 경우 먼저 해당 경로에 백업을 기록합니다.

청구된 모델 호출(수락된 번역 및 폐기된 재시도)은 `api_calls`에 저장됩니다. 호출을 기록하는 명령을 실행한 후, UTC 기준 7일이 지난 세부 정보 행은 월별 `api_totals`로 집계됩니다. `usage` 및 대시보드의 사용량 및 비용 보기는 두 테이블을 결합합니다. [사용량 및 비용](/ko/guide/translation-dashboard/usage)을 참조하세요.

용어집 `Context` 참고 사항과 `glossary.contextFiles`은(는) 핑거프린팅(`prompt_context_hash`)되어 UI, 문서, JSON, SVG 및 교정 프롬프트에 주입됩니다. 해당 지침을 변경하면 다음 실행 시 일치하는 캐시된 세그먼트 및 파일 추적 행이 무효화됩니다. 대시보드 `user-edited` 캐시 행은 유지됩니다. 선호하는 용어집 번역만 변경하면 `--force` / `--force-update`까지 기존 캐시가 그대로 유지됩니다.

`translate-docs` 명령은 또한 **파일 추적**을 사용하므로, 변경되지 않은 소스는 최신 출력물이 이미 존재하는 경우 작업을 완전히 건너뛸 수 있습니다. `--check-cache`은(는) 예상되는 문자 체계로 로케일을 다시 열어 캐시된 세그먼트를 재검증합니다; `--force-update`은(는) 세그먼트 캐시를 계속 사용하면서 각 로케일에 대해 파일 처리를 다시 실행합니다; `--force`은(는) 파일 추적을 지우고 API 번역에 대한 세그먼트 캐시 읽기를 우회합니다. 구성된 모든 모델이 마크다운 세그먼트에서 AST 유효성 검사에 실패하면, `translate-docs`은(는) 세그먼트를 점진적으로 분할하고 더 작은 부분을 재시도할 수 있습니다(`docs[].segmentSplitting.qualityRetrySplit`, 기본값 켜짐). 전체 플래그 표는 [문서 — 캐시 동작 및 플래그](/ko/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)를 참조하십시오.

**배치 프롬프트 형식:** `translate-docs --prompt-format`은 `LlmClient.translateDocumentBatch`에 대해서만 XML(`<seg>` / `<t>`) 또는 JSON 배열/객체 모양을 선택합니다. 추출, 자리 표시자 및 유효성 검사는 변경되지 않습니다. [배치 프롬프트 형식](/ko/guide/documents/cli-options#batch-prompt-format)을 참조하십시오.

<a id="output-path-resolution"></a>
### 출력 경로 해석

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`은 소스 기준 경로를 출력 경로에 매핑합니다:

- `nested` 스타일(기본값): 마크다운의 경우 `{outputDir}/{locale}/{relPath}`.
- `doc-system` 스타일: `docsRoot` 아래에서 출력은 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`를 사용합니다. `docsRoot` 외부 경로는 중첩된 레이아웃으로 대체됩니다. 별칭: `docusaurus`(기본 `localeSubpath` = Docusaurus 플러그인 경로), `astro-starlight`(기본 빈 `localeSubpath`), `vitepress`(`doc-system`와 동일하며 빈 `localeSubpath` 포함; BCP-47 폴더 대소문자 유지).
- `flat` 스타일: `{outputDir}/{stem}.{locale}{extension}`. `flatPreserveRelativeDir`가 `true`인 경우, 소스 하위 디렉터리는 `outputDir` 아래에 유지됩니다.
- **사용자 지정** `pathTemplate`: `{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`을 사용하는 모든 마크다운 레이아웃.
- **사용자 정의** `jsonPathTemplate`: JSON 레이블 파일을 위한 별도의 사용자 정의 레이아웃으로, 동일한 플레이스홀더 사용.
- `linkRewriteDocsRoot`은 번역된 출력이 기본 프로젝트 루트가 아닌 다른 위치에 루트를 둘 때, 평면화된 링크 재작성기가 올바른 접두사를 계산하도록 도와줍니다.

<a id="flat-link-rewriting"></a>
### 단일 링크 재작성

`docsOutput.style === "flat"`인 경우, 번역된 마크다운 파일은 로케일 접미사와 함께 소스 옆에 배치됩니다. 페이지 간의 상대 링크는 `readme.de.md`의 `[Guide](./guide.md)`이(가) `guide.de.md`을(를) 가리키도록 다시 작성됩니다. `rewriteRelativeLinks`에 의해 제어됩니다(사용자 정의 `pathTemplate` 없이 플랫 스타일에 대해 자동 활성화됨). 동일한 패스는 `postProcessing.regexAdjustments`이(가) 실행되기 전에 마크다운이 아닌 에셋 URL에 파일별 깊이 접두사를 추가합니다 — [플랫 링크 재작성기](/ko/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)를 참조하세요.

---

<a id="json-internals"></a>
## JSON 내부

| 단계 | 구성 요소 | 결과 |
| --- | --- | --- |
| 1 | `json[].contentPaths` | 파일 해결됨(파일, 디렉터리 또는 글로브) |
| 2 | `NestedJsonExtractor` | `keyPolicy`에 의해 선택된 문자열 리프(점 경로 + 미니매치) |
| 3 | `PlaceholderHandler` + 배치 + `TranslationCache` | 캐시 히트 → 건너뛰기; 미스 → `LlmClient.translateDocumentBatch`(공유 SQLite) |
| 4 | `NestedJsonExtractor.reassemble` | `expandJsonBlockOutputPath(outputPathTemplate)`을 통한 출력 파일 |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`)는 임의의 중첩된 JSON을 탐색하고 번역 가능한 문자열 리프당 하나의 세그먼트를 내보냅니다. `keyPolicy.mode` (`allowlist`, `denylist` 또는 `both`)는 점 표기법에 minimatch를 사용하여 경로를 필터링합니다 (`slug`와 같은 일반 이름은 최종 키 세그먼트와 일치합니다).
- 캐시 파일 추적은 `file_tracking`에서 `json-block:{blockIndex}:{projectRelPath}`을 사용합니다 (문서 및 SVG와 동일한 `cacheDir`).
- Docusaurus `write-translations` 카탈로그 (`{ message, description }` 모양)에는 **사용되지 않습니다** — 이들은 문서 (`translate-docs` 내의 `docs[].docusaurusCatalogDir` + `JsonExtractor`)를 사용합니다.
- `t()` UI 문자열에는 **사용되지 않습니다** — UI 문자열 (`strings.json` + 플랫 번들).
- CLI: `translate-json`; 오케스트레이션은 `src/cli/translate-json-run.ts`에서 수행됩니다. 초기화 템플릿: `ui-json-bundles`.

---

<a id="shared-infrastructure"></a>
## 공유 인프라

<a id="llmclient"></a>
### `LlmClient`

Vercel AI SDK( `ai` + `@ai-sdk/openai-compatible` )를 기반으로 구축된 공급자 독립적인 채팅 클라이언트입니다. 활성 공급자를 `provider` / `providers`에서 확인하고, 해당 공급자의 `baseUrl` + API 키에 대한 OpenAI 호환 클라이언트( `createOpenAICompatible` )를 빌드한 다음, 모든 호출을 `generateText`를 통해 라우팅합니다. `OpenRouterClient`는 더 이상 사용되지 않는 별칭으로 유지됩니다. 주요 동작:

- **모델 폴백**: 확인된 목록의 각 모델을 순서대로 시도하며, 요청 또는 파싱 실패 시 폴백합니다. 각 대상 로캘은 자체 확인된 체인을 갖습니다: 설정된 경우 `localeModels(locale)`가 먼저, 그 다음 `uiModels` (UI 파이프라인만 해당), 그 다음 `translationModels`. 문서, JSON 및 SVG 번역은 비 UI 체인으로 로캘별 클라이언트를 생성합니다. `bench-models` 명령은 대신 구성된 각 id에 대해 단일 모델 클라이언트를 하나씩 구축합니다 (`translationModels`, `uiModels`, `localeModels`의 합집합; `translationModels: [id]`, 폴백 없음)하여 각 모델을 독립적으로 시간 측정하고 가격을 책정할 수 있습니다.
- **요청 타임아웃**: 활성 제공자의 `requestTimeout` (초) 또는 `requestTimeoutMs`, 그렇지 않으면 구성 상단의 동일한 키 (기본값 45초)가 `AbortSignal.timeout`를 통해 각 요청을 중단합니다. CLI가 `check-models` (모든 제공자)에 대해 제공자의 모델 목록을 로드할 때 `GET /models`에도 동일한 값이 적용됩니다. 알려지지 않은 모델 id를 제거하는 선택적 사전 필터는 활성 제공자가 OpenRouter인 경우에만 실행됩니다.
- **OpenRouter 추가 기능** (`openrouter`가 활성일 때만): `provider` 요청 필드를 통한 처리량 라우팅, `HTTP-Referer` / `X-Title` 헤더, `usage.cost`에서 읽은 정확한 USD 비용. 토큰 사용량은 모든 제공자에 대해 보고됩니다. 제공자가 `usage.cost`를 생략하는 경우, USD 비용은 `providers.<name>.modelPricing` 또는 제공자 전체 `pricing` 기본값에서 계산되어 `api_calls` 행에 저장됩니다. 제공자가 보고한 비용은 절대 대체되지 않습니다.
- **디버그 트래픽 로그**: `debugTrafficFilePath`가 설정된 경우, 요청 및 응답 JSON을 파일에 추가합니다 (프로그래밍 방식). CLI `--debug-failed`은 `cacheDir` 아래에 `FAILED-TRANSLATION` 파일을 작성하며, 실패한 UI, 문서, JSON 및 SVG 번역 확인 시도에 대한 시스템/사용자 프롬프트, 원시 어시스턴트 응답 및 검증 오류가 포함됩니다. 제공자 API / 빈 본문 실패는 프롬프트 전용 파일을 덤프하는 대신 콘솔에 출력됩니다.

<a id="config-loading"></a>
### 설정 로드

`loadI18nConfigFromFile(configPath, cwd)` 파이프라인:

1. `ai-i18n-tools.config.json`(JSON)를 읽고 파싱합니다.
2. `mergeWithDefaults` - `defaultI18nConfigPartial`와 깊은 병합을 수행하고, 모든 `docs[].sourceFiles` 항목을 `contentPaths`로 병합합니다.
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales`를 배열로 강제 변환하고 경로와 유사한 항목을 거부합니다(`ui-languages.json` 경로가 아닌 BCP-47 코드여야 함); `mergeWithDefaults` 동안 `languagesManifestPath`의 기본값은 `{ui.flatOutputDir}/ui-languages.json`입니다.
4. `expandDocumentationTargetLocalesInRawInput` - 각 `docs[].targetLocales` 항목에 대해 동일하게 적용합니다.
5. `expandJsonTargetLocalesInRawInput` - 각 `json[].targetLocales` 항목에 대해 동일합니다.
6. `parseI18nConfig` - Zod 유효성 검사 + `validateI18nBusinessRules`.
7. `applyProviderOverrideToRawInput` - `-P` / `--provider`가 CLI에 전달될 때.
8. `applyEnvOverrides` - 설정된 경우 `OPENROUTER_BASE_URL`, `OLLAMA_BASE_URL`, `I18N_SOURCE_LOCALE` 및 `I18N_TARGET_LOCALES`를 적용합니다(API 키는 `LlmClient` 내에서 공급자별로 별도로 확인됩니다).
9. `augmentConfigWithUiLanguagesMaster` - 번들로 제공되는 마스터 카탈로그에서 매니페스트 표시 이름을 첨부합니다.
10. `assertEffectiveLocalesInUiLanguagesMaster` - 해당되는 경우 마스터 카탈로그에 대해 로케일 코드를 검증합니다.

`init`는 `initConfigTemplates`에서 시작 구성 파일을 작성합니다: `ui-markdown`(UI + 선택적 앱 마크다운), `ui-docusaurus`, `ui-starlight`, `ui-vitepress`(VitePress 문서 + `vitepressThemeCatalog`), `ui-nextra`(Nextra 문서 + `nextraDictionaryPath`), `ui-astro-website`(일반 Astro UI; `docs[]`를 추가하여 `.astro` 페이지 번역), `ui-json-bundles`(JSON `json[]`만). [빠른 시작 — 초기화](/ko/guide/quick-start#step-1-initialise)를 참조하세요.

<a id="logger"></a>
### 로거

`Logger`는 ANSI 색상 출력과 함께 `debug`, `info`, `warn`, `error` 수준을 지원합니다. 자세한 모드(`-v`)는 `debug`을 활성화합니다. `logFilePath`이 설정된 경우 로그 라인은 해당 파일에도 기록됩니다.

<a id="self-localization-tool-ui"></a>
### 자체 지역화(도구 UI)

도구는 사용자가 번역한 콘텐츠와 별개로 자체 UI — CLI 도움말, 고交通 로그/요약/오류 메시지 및 번역 대시보드를 지역화합니다.

- **로케일 확인(Locale resolution)**(`resolveUiLocale` in `src/core/ui-locale.ts`): `-L` / `--ui-lang` > `AI_I18N_LANG` > 구성 `uiLanguage` > 호스트 OS 로케일(`Intl.DateTimeFormat().resolvedOptions().locale`)에서 UI 로케일을 선택합니다. 후보는 정규화되고 배송된 번들 세트와 정확히 일치하거나 가장 가까운 변형(예: `pt-PT` → `pt-BR`, `en-US` → `en-GB`)과 일치하며, 소스 로케일(`en-GB`)로 대체됩니다. CLI는 도움말이 빌드되기 전에 한 번(argv 스캔 사전 구문 분석) 그리고 구성 로드 후에 다시 한 번 확인하여 `uiLanguage`가 적용됩니다(플래그 및 환경 변수가 여전히 우선합니다).
- **런타임(Runtime)**(`src/i18n/index.ts`): ```{{name}}``` 보간이 포함된 최소 `t(source, vars)`로, `src/i18n/locales/<code>.json`의 플랫 로케일별 번들에 대해 영어 소스 문자열로 키가 지정됩니다(빌드 시 `dist/i18n/locales`로 복사됨). 누락된 키 또는 번들은 소스 텍스트를 반환합니다. 이는 UI 문자열과 동일한 키-기본 모델입니다. 해시 조회는 없습니다.
- **대시보드(Dashboard)**: 서버는 확인된 UI 로케일에 대해 `{ locale, dir, bundle }`를 반환하는 `GET /api/ui-i18n`를 노출합니다. 프런트엔드는 `<html lang>` / `dir`를 설정하고 `data-i18n*` 속성을 통해 정적 마크업을 현지화합니다.
- **자사 제품 사용(Dogfooding)**: 번들은 `ai-i18n-self.config.json`(`pnpm i18n:self`)에 대해 패키지 자체의 추출 → `translate-ui` 파이프라인을 실행하여 생성됩니다. 카탈로그 키는 `src/cli/` 및 `src/i18n/` 전반의 `t()` 호출과 `src/dashboard-app/index.html`의 대시보드 `data-i18n*` 마커에서 가져옵니다.

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
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

`'ai-i18n-tools'`에서 내보낸 공개 추출기 클래스를 확장하여 사용자 지정 추출기를 등록합니다(예: `MarkdownExtractor` 서브클래스). CLI는 내장 추출기를 내부적으로 연결합니다. `doc-translate.ts`의 지원되는 심층 가져오기는 없습니다.

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

---

<a id="source-tree"></a>
## 소스 트리

<details>
<summary>전체 <code>src/</code> 레이아웃(파일 수준 참조)</summary>

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
│   ├── placeholder-integrity.ts    Pre/post-restore token sequence + tag-kind + invented {{IDENT}} checks
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
│   ├── matcher.ts                  Term hint extraction for prompts
│   └── translation-context.ts      contextFiles loader and guidance fingerprints
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
