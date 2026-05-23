<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 버전](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 다운로드 수](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![라이선스: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[OpenRouter](https://openrouter.ai/)를 통해 대규모 언어 모델(LLM)을 사용하여 JavaScript/TypeScript 애플리케이션 및 문서 사이트를 국제화하기 위한 CLI 및 툴킷입니다. 두 가지 독립적인 워크플로우를 제공합니다: **UI 번역**은 `t("…")` 호출을 추출하고 i18next용 로케일 준비된 JSON을 생성하며, **문서 번역**은 스마트한 SQLite 캐시를 사용하여 변경된 세그먼트만 LLM에 재전송하면서 마크다운, MDX, SVG 파일을 번역합니다.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>번역된 README 및 문서는 GitHub의 [`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)에 커밋되며, npm 패키지는 영문 `docs/`만 제공합니다.</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [두 가지 핵심 워크플로](#two-core-workflows)
- [설치](#installation)
  - [CLI 사용하기](#using-the-cli)
- [OpenRouter](#openrouter)
- [빠른 시작](#quick-start)
  - [워크플로우 1 - UI 번역](#workflow-1---ui-translation)
  - [워크플로우 2 - 문서 번역](#workflow-2---document-translation)
  - [두 가지 워크플로우](#both-workflows)
- [런타임 헬퍼](#runtime-helpers)
- [CLI 명령어](#cli-commands)
- [문서](#documentation)
- [라이선스](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 두 가지 핵심 워크플로우

**워크플로우 1 - UI 번역** — i18next를 사용하는 모든 JS/TS 프로젝트(React, Next.js, Node.js, CLI)에 적합

소스 파일에서 `t("…")` / `i18n.t("…")` 리터럴을 스캔하고 마스터 카탈로그(`strings.json`)를 생성한 후 OpenRouter를 통해 각 로케일별 누락된 항목을 번역하고 i18next에서 바로 사용할 수 있는 평면 JSON 파일(`de.json`, `pt-BR.json`, …)을 작성합니다.

**워크플로우 2 - 문서 번역** — 마크다운/MDX 문서(Docusaurus, Astro Starlight, 일반 README 파일)에 적합

`.md` 및 `.mdx` 소스 파일을 모든 대상 로케일로 번역하며 공유된 SQLite 캐시를 사용하므로 새로운 또는 변경된 세그먼트만 LLM에 전송됩니다. 선택적으로 Docusaurus 셸 JSON(`jsonSource`, `write-translations`에서 생성)을 통해 내비게이션 바, 푸터 및 테마 UI 문자열을 번역할 수 있습니다. SVG 파일 번역은 `features.translateSVG`와 최상위 `svg` 블록을 통해 활성화됩니다.

두 워크플로우는 동일한 `ai-i18n-tools.config.json` 파일을 공유하며 독립적으로 또는 함께 사용할 수 있습니다.

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
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**설치 없이 일회성 실행** — `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>` 사용(해당 실행 시에만 다운로드됨).

> **팁:** `npx` 없이 대화형 쉘에서 `ai-i18n-tools`을 직접 실행하려면 `PATH`에 `node_modules/.bin`를 추가하세요(bash/zsh: `export PATH="$PWD/node_modules/.bin:$PATH"`). direnv 및 Windows 지침은 [시작하기](docs/GETTING_STARTED.ko.md#installation)를 참조하세요.

OpenRouter API 키를 설정하세요:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

OpenRouter를 호출하는 명령어(`translate-ui`, `translate-docs`, `sync`, `check-models` 및 관련 스크립트)는 환경에 `OPENROUTER_API_KEY`가 필요합니다. `check-markdown`는 OpenRouter를 사용하지 않습니다.

`ai-i18n-tools.config.json`에서, `openrouter` 객체는 모델 목록, `baseUrl`, `maxTokens`, `temperature`, 그리고 `requestTimeoutMs`: OpenRouter에 대한 각 HTTP 요청(채팅 완성 및 내부 `GET /models` 호출)을 기다리는 최대 시간(밀리초 단위)을 포함합니다. 기본값은 `30000`(30초)입니다.

설정된 각 모델 ID를 OpenRouter의 실시간 카탈로그와 비교하려면 `ai-i18n-tools check-models`을 실행하세요. 이 명령어는 누락되었거나 `expiration_date`을 초과한 ID를 보고하고, 유효한 모델을 100만 토큰당 예상 입력/출력 가격(USD)과 함께 나열하며, 설정된 ID 중 하나라도 유효하지 않으면 0이 아닌 상태 코드로 종료됩니다. 이 명령어는 `OPENROUTER_API_KEY`를 필요로 합니다.

---

<a id="quick-start"></a>
## 빠른 시작

<a id="workflow-1---ui-translation"></a>
### 워크플로우 1 - UI 번역

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

그런 다음 `'ai-i18n-tools/runtime'`의 헬퍼를 사용하여 앱에서 i18next를 연결하세요. 전체 설정 방법은 시작하기 가이드의 [4단계: 런타임에서 i18next 연결](docs/GETTING_STARTED.ko.md#step-4-wire-i18next-at-runtime)을 참조하세요.

<a id="workflow-2---document-translation"></a>
### 워크플로우 2 - 문서 번역

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### 두 워크플로우 모두

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
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
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

각 명령어별 플래그 목록은 [시작하기 — CLI 참조](docs/GETTING_STARTED.ko.md#cli-reference)에 있습니다. 내장 사용법 텍스트를 보려면 `ai-i18n-tools <command> --help`을 실행하세요.

모든 명령어에서 사용할 수 있는 전역 옵션: `-c <config>` (기본값: `ai-i18n-tools.config.json`), `-v` (자세히 보기), 로그 파일에 콘솔 출력을 중계하는 선택적 `-w` / `--write-logs [path]` (기본값: 번역 캐시 디렉터리 아래), `-V` / `--version`, 그리고 `-h` / `--help`. 명령어 개요 표는 [시작하기](docs/GETTING_STARTED.ko.md#cli-reference)를 참조하세요.

---

<a id="documentation"></a>
## 문서

- [시작하기](docs/GETTING_STARTED.ko.md) - 두 워크플로우의 전체 설정 가이드, CLI 참조, 구성 항목 참조.
- [로케일 자산 가이드](docs/LOCALE-ASSETS-GUIDE.ko.md) - 번역된 문서에 스크린샷 및 삽화 SVG 포함(Pattern A–E, 평면 링크 리라이터, 스크린샷 스크립트).
- [패키지 개요](docs/PACKAGE_OVERVIEW.ko.md) - 아키텍처, 내부 구조, 프로그래밍 방식 API 및 확장 포인트.
- [AI 에이전트 컨텍스트](../docs/ai-i18n-tools-context.md) - **이 패키지를 사용하는 앱을 위한 안내:** 하위 프로젝트를 위한 통합 프롬프트(리포지토리의 에이전트 규칙에 복사 가능).
- **이** 저장소의 유지 관리 내부: `dev/package-context.md` (클론 전용; npm에는 없음).

---

<a id="license"></a>
## 라이선스

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
