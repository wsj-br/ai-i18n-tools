<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 버전](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 다운로드 수](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![라이선스: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[OpenRouter](https://openrouter.ai/)를 통해 대규모 언어 모델을 사용하여 JavaScript/TypeScript 애플리케이션 및 문서 사이트를 국제화하기 위한 CLI 및 툴킷입니다. 단일 구성 파일을 공유하는 세 가지 모듈식 워크플로우는 서로 다른 번역 요구 사항을 지원합니다:

- **워크플로우 1 — UI 번역:** JS/TS에서 `t("…")` 호출을 추출하고(선택적으로 `.astro` 파일에서도 추출 가능), i18next 또는 정적 SSG 조회를 위한 로케일별 단일 레벨 JSON을 생성합니다.
- **워크플로우 2 — 문서 번역:** `docs[].contentPaths`에 나열된 마크다운, MDX, `.astro` 페이지([웹사이트 및 Starlight]용)를 `translate-docs`를 사용하여 번역합니다.
- **워크플로우 3 — JSON 파일 번역:** `json[]`에 정의된 임의의 중첩된 JSON 번들을 번역합니다. 소스에서 `t()`을 사용하지 않고 UI 복사본이 로케일별 JSON 파일에 저장되는 경우 `translate-json`을 사용하세요.

**SVG** 자산은 `docs[].contentPaths`이 아닌 `features.translateSVG`, 최상위 `svg` 블록, 그리고 `translate-svg`를 사용하여 번역됩니다.

**어느 워크플로우를 사용해야 하나요?**
- 소스에서 `t()` 사용 → **워크플로우 1** (`extract` / `translate-ui`)
- 로컬화된 페이지 또는 Docusaurus 카탈로그 JSON → **워크플로우 2** (`translate-docs`)
- 독립형 중첩 JSON 로케일 파일만 있는 경우 → **워크플로우 3** (`translate-json`)

모든 워크플로우는 파일/SQLite 캐시를 유지하여 새로운 또는 변경된 세그먼트(문자열 또는 텍스트 조각)만 LLM에 전송되도록 합니다.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [핵심 워크플로우](#core-workflows)
- [설치](#installation)
  - [CLI 사용하기](#using-the-cli)
- [OpenRouter](#openrouter)
- [빠른 시작](#quick-start)
  - [워크플로우 1 - UI 번역](#workflow-1---ui-translation)
  - [워크플로우 2 - 문서 번역](#workflow-2---document-translation)
  - [Astro (일반 Astro 및 Starlight)](#astro-plain-astro--starlight)
  - [통합 워크플로우](#combined-workflow)
- [런타임 헬퍼](#runtime-helpers)
- [CLI 명령어](#cli-commands)
- [문서](#documentation)
- [라이선스](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## 핵심 워크플로우

**워크플로우 1 - UI 번역** — i18next를 사용하는 모든 JS/TS 프로젝트(React, Next.js, Node.js, CLI) 또는 정적 Astro SSG용

소스 파일에서 `t("…")` / `i18n.t("…")` 리터럴을 스캔하고(Astro 프론트매터 및 템플릿 표현식의 경우 `ui.uiExtractor.extensions`에 `.astro` 추가), 마스터 카탈로그(`strings.json`)를 생성하고, OpenRouter를 통해 로케일별 누락된 항목을 번역한 후 단일 레벨 JSON 파일(`de.json`, `pt-BR.json`, …)을 작성합니다. 영어 소스 텍스트는 이러한 번들에서 런타임 조회 키로 사용됩니다. — `strings.json`은 런타임 번들이 아닌 추출 캐시입니다.

**워크플로우 2 - 문서 번역** — `docs[].contentPaths` 하위의 마크다운, MDX, `.astro`용

주로 **마크다운, MDX, `.astro` 문서**(Docusaurus, [Astro Starlight](https://starlight.astro.build/), 일반 README 파일, 일반 Astro 마케팅 페이지)를 위한 것입니다. `translate-docs`은 공유된 SQLite 캐시를 사용하여 로컬라이즈된 사본을 작성합니다. Docusaurus 사이트에서는 `docs[].docusaurusCatalogDir`를 `write-translations` 카탈로그 폴더로 설정하여 셸 JSON(네비게이션 바, 푸터, 테마 문자열)이 동일한 명령어로 번역되도록 합니다. `docs[].docsOutput.style`는 `"nested"`, `"flat"`, `"doc-system"` 및 별칭 `"docusaurus"` / `"astro-starlight"`를 지원합니다([시작하기]의 [출력 레이아웃](docs/GETTING_STARTED.ko.md#output-layouts) 참조). Docusaurus 카탈로그가 아닌 임의의 중첩된 UI JSON은 워크플로우 3(`json[]` / `translate-json`)에 포함되어야 하며 `docs[]`에는 포함되지 않습니다.

**워크플로우 3 - JSON 파일 번역** — 소스에 `t()`가 없는 중첩된 로케일 JSON

`src/i18n/en/translation.json`과 같은 파일을 최상위 `json[]`, `features.translateJson`, `translate-json`을 통해 번역합니다. `init -t ui-json-bundles`로 스캐폴딩하세요.

모든 워크플로우는 `ai-i18n-tools.config.json`을 공유하며 조합할 수 있으며, `sync`은 `features` 플래그에 따라 추출, UI 번역, SVG 번역, `translate-docs`, `translate-json`을 순서대로 실행합니다.

---

<a id="installation"></a>
## 설치

출시된 패키지는 **ESM 전용**입니다(`"type": "module"`). Node.js `>=22.16.0` 이상이 필요합니다.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### CLI 사용하기

**프로젝트별 설치(권장)** — 개발 종속성으로 설치한 후 `npx`, `pnpm exec` 또는 `package.json` 스크립트를 통해 실행:

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

ai-i18n-tools CLI 명령어를 직접 사용할 수도 있습니다. 예: `ai-i18n-tools sync`.

수동으로 실행할 때 순서와 기능 플래그를 잘못 설정하기 쉬우므로 `extract`, `translate-ui`, `translate-svg`, `translate-docs`, `translate-json`를 수동으로 연결하는 것보다 `sync`을 선호하세요. [시작하기]의 [권장 `package.json` 스크립트](docs/GETTING_STARTED.ko.md#recommended-packagejson-scripts)를 참조하세요.

**설치 없이 일회성 실행** — `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>` 사용(해당 실행 시에만 다운로드됨).

> **팁:** `npx` 없이 대화형 쉘에서 `ai-i18n-tools`을 직접 실행하려면 `PATH`에 `node_modules/.bin`를 추가하세요(bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). direnv 및 Windows 지침은 [시작하기](docs/GETTING_STARTED.ko.md#installation)를 참조하세요.

OpenRouter API 키를 설정하세요:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

OpenRouter를 호출하는 명령어(`translate-ui`, `translate-docs`, `translate-json`, `sync`, `check-models` 및 관련 스크립트)는 환경에 `OPENROUTER_API_KEY`가 필요합니다. `check-markdown`은 OpenRouter를 사용하지 않습니다.

`ai-i18n-tools.config.json`에서, `openrouter` 객체는 모델 목록, `baseUrl`, `maxTokens`, `temperature`, 그리고 `requestTimeoutMs`: OpenRouter에 대한 각 HTTP 요청(채팅 완성 및 내부 `GET /models` 호출)을 기다리는 최대 시간(밀리초 단위)을 포함합니다. 기본값은 `30000`(30초)입니다.

설정된 각 모델 ID를 OpenRouter의 실시간 카탈로그와 비교하려면 `ai-i18n-tools check-models`을 실행하세요. 이 명령어는 누락되었거나 `expiration_date`을 초과한 ID를 보고하고, 유효한 모델을 100만 토큰당 예상 입력/출력 가격(USD)과 함께 나열하며, 설정된 ID 중 하나라도 유효하지 않으면 0이 아닌 상태 코드로 종료됩니다. 이 명령어는 `OPENROUTER_API_KEY`를 필요로 합니다.

---

<a id="quick-start"></a>
## 빠른 시작

<a id="workflow-1---ui-translation"></a>
### 워크플로우 1 - UI 번역

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

그런 다음 `'ai-i18n-tools/runtime'`의 헬퍼를 사용하여 앱에서 i18next를 연결하세요. 전체 설정 방법은 시작하기 가이드의 [4단계: 런타임에서 i18next 연결](docs/GETTING_STARTED.ko.md#step-4-wire-i18next-at-runtime)을 참조하세요.

<a id="workflow-2---document-translation"></a>
### 워크플로우 2 - 문서 번역

기본 `init` 템플릿(`ui-markdown`)은 UI 추출만 가능하게 합니다. `translate-docs` 전에 문서 중심 템플릿을 사용하거나 `features.translateDocs`를 활성화하고 `docs[]`를 추가하세요:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json` 편집: `docs[].contentPaths`을(를) markdown, MDX 및/또는 `.astro` 소스로 설정; `docs[].outputDir` 및 `docs[].docsOutput.style`(`"docusaurus"`, `"astro-starlight"`, `"flat"` 등). 전체 필드 참조: [Workflow 2 - Document Translation](docs/GETTING_STARTED.ko.md#workflow-2---document-translation).

<a id="astro-plain-astro--starlight"></a>
### Astro (순수 Astro 및 Starlight)

**Astro Starlight** — `init -t ui-starlight` 후 `translate-docs`. Starlight UI 오버라이드는 필요 시 별도의 `docs[]` 블록에서 `src/content/i18n/en.json`와 `jsonPathTemplate`를 함께 사용할 수 있습니다([Getting Started → Workflow 2](docs/GETTING_STARTED.ko.md#step-1-initialise-for-documentation)).

**순수 Astro** (Starlight이 아닌 마케팅 또는 앱 사이트) — [Astro 내장 i18n 라우팅](https://docs.astro.build/en/guides/internationalization/)과 ai-i18n-tools를 결합합니다. 참조 프로젝트: [`examples/astro-website`](../examples/astro-website/) (영어는 `/`에, 로케일은 `/{locale}/`에 있음).

대부분의 팀은 두 가지 파이프라인의 **하이브리드**를 사용합니다:

| 파이프라인 | 용도 | 명령어 | 출력 |
|----------|---------|----------|--------|
| **페이지 HTML** | 템플릿 본문의 제목, 단락, 내비게이션 레이블, 인라인 배열 | `translate-docs` | 로케일별 `src/pages/{locale}/index.astro` |
| **UI 문자열(`t()`)** | Frontmatter 데이터, 탭 레이블, 공유 배열 | `extract` → `translate-ui` | `public/locales/{locale}.json` (영어 소스를 키로 사용) |

`init -t ui-astro-website`으로 UI 스캐폴드를 생성합니다. `.astro` 페이지의 하드코딩된 HTML의 경우 `features.translateDocs`를 활성화하고 `docsOutput.style: "astro-starlight"`가 포함된 `docs[]` 블록을 추가합니다([Astro website pages (parse-and-replace)](docs/GETTING_STARTED.ko.md#astro-website-pages-parse-and-replace) 참조). `targetLocales`, `i18n.locales`을(를) `astro.config.mjs`에 유지하고 `ui-languages.json`을(를) 일치시킵니다(Astro 라우트는 `pt-br`과 같은 소문자 코드 사용; 평면 번들 파일명은 설정 대소문자 규칙을 따름, 예: `pt-BR.json`).

클라이언트 아일랜드를 추가하지 않는 한 빌드 타임에 i18next 없이 `t()`을(를) 연결합니다 — [Astro website UI strings (SSG)](docs/GETTING_STARTED.ko.md#astro-website-ui-strings-ssg) 및 예제의 `src/i18n/t.ts` 참조.

<a id="combined-workflow"></a>
### 통합 워크플로우

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## 런타임 헬퍼

`'ai-i18n-tools/runtime'`에서 내보내는 다음 헬퍼들은 모든 JavaScript 환경에서 사용할 수 있습니다. i18next를 가져오지 않아도 사용할 수 있습니다:

| 도우미                                                                  | 설명                                                                                                                                   |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | 키를 기본값으로 사용하는 설정을 위한 표준 i18next 초기화 옵션입니다.                                                                    |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 권장 연결 방식: `strings.json`에서 키 정리(key-trim) 및 복수형 `wrapT` 처리를 수행하고, 필요 시 `translate-ui` `{sourceLocale}.json` 복수형 키를 병합합니다. |
| `wrapI18nWithKeyTrim(i18n)` | 낮은 수준의 키 정리(key-trim) 래퍼만 제공합니다. (애플리케이션 연결 시 사용되지 않으며, `setupKeyAsDefaultT` 사용을 권장합니다.) |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | `ui-languages.json`에서 `makeLoadLocale`의 `localeLoaders` 맵을 생성합니다. (`sourceLocale` 제외한 모든 `code` 포함) |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 비동기 로케일 파일 로딩을 위한 팩토리입니다. |
| `getTextDirection(lng)` | BCP-47 코드에 대해 `'ltr'` 또는 `'rtl'`를 반환합니다. |
| `applyDirection(lng, element?)` | `document.documentElement`에 `dir` 속성을 설정합니다. |
| `getUILanguageLabel(lang, t)` | 언어 메뉴 항목을 위한 표시 레이블 (i18n 사용). |
| `getUILanguageLabelNative(lang)` | `t()` 호출 없이 표시 레이블 생성 (헤더 스타일). |
| `interpolateTemplate(str, vars)` | 일반 문자열에 대한 낮은 수준의 `{{var}}` 치환 (내부적으로 사용; 앱 코드는 대신 `t()` 사용 권장). |
| `flipUiArrowsForRtl(text, isRtl)` | RTL 레이아웃을 위해 `→`을 `←`로 전환합니다. |

---

<a id="cli-commands"></a>
## CLI 명령어

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

각 명령어별 플래그 목록은 [시작하기 — CLI 참조](docs/GETTING_STARTED.ko.md#cli-reference)에 있습니다. 내장 사용법 텍스트를 보려면 `ai-i18n-tools <command> --help`을 실행하세요.

모든 명령어의 전역 옵션: `-c <config>` (기본값: `ai-i18n-tools.config.json`), `-v` (자세히 표시), 선택적 `-w` / `--write-logs [path]` (콘솔 출력을 로그 파일에 저장, 기본값: 번역 캐시 디렉터리 하위), `-V` / `--version`, 및 `-h` / `--help`. 여러 명령어가 `-l` / `--locale <codes>` (쉼표로 구분된 BCP-47)를 받아 대상 로케일을 제한하며, `lint-source`은 단일 소스 로케일을 사용합니다. 명령어 개요 표는 [Getting Started](docs/GETTING_STARTED.ko.md#cli-reference) 참조.

---

<a id="documentation"></a>
## 문서

- [Getting Started](docs/GETTING_STARTED.ko.md) - 모든 워크플로우(UI, docs/`.astro`, JSON 번들, Astro Starlight 및 순수 Astro)를 위한 전체 설정, CLI 참조, 설정 필드 참조.
- [Locale assets guide](docs/LOCALE-ASSETS-GUIDE.ko.md) - 번역된 문서에 스크린샷 및 시각적 SVG 포함 (패턴 A–E, 평면 링크 리라이터, 스크린샷 스크립트).
- [Package Overview](docs/PACKAGE_OVERVIEW.ko.md) - 아키텍처, 내부 구조, 프로그래밍 방식 API 및 확장 포인트.
- [AI Agent Context](../docs/ai-i18n-tools-context.md) - **패키지를 사용하는 앱의 경우:** 하위 프로젝트를 위한 통합 프롬프트(리포지토리의 에이전트 규칙에 복사).
- **이** 저장소의 유지 관리 내부: `dev/package-context.md` (클론 전용; npm에는 없음).

---

<a id="license"></a>
## 라이선스

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
