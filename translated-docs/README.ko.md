<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm 버전](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm 다운로드 수](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![라이선스: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

JavaScript/TypeScript 애플리케이션 및 문서 사이트의 국제화를 위한 CLI 및 툴킷입니다. UI 문자열을 추출하고 OpenRouter를 통해 대규모 언어 모델을 사용하여 번역한 후 i18next용으로 로케일에 맞는 JSON 파일을 생성합니다. 또한 마크다운, Docusaurus JSON, 독립형 SVG 자산을 위한 파이프라인도 포함되어 있습니다.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [두 가지 핵심 워크플로](#two-core-workflows)
- [설치](#installation)
  - [CLI 사용하기](#using-the-cli)
- [OpenRouter](#openrouter)
- [빠른 시작](#quick-start)
  - [워크플로 1 - UI 문자열](#workflow-1---ui-strings)
  - [워크플로 2 - 문서](#workflow-2---documentation)
  - [두 가지 워크플로](#both-workflows)
- [런타임 헬퍼](#runtime-helpers)
- [CLI 명령어](#cli-commands)
- [문서](#documentation)
- [라이선스](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 두 가지 핵심 워크플로우

**워크플로우 1 - UI 번역** (React, Next.js, Node.js, 모든 i18next 프로젝트)

마스터 카탈로그(`strings.json`)을 생성하며, 선택적으로 로케일별 `models` 메타데이터를 포함합니다. 이 과정은 `t("…")` / `i18n.t("…")` **literals**에서 수행되며, 선택적으로 `package.json` `description`를 병합하고, 설정에서 활성화된 경우 `ui-languages.json`의 각 `englishName`도 포함합니다. 누락된 항목은 OpenRouter를 통해 로케일별로 번역되며, i18next에서 사용할 수 있도록 평면 JSON 파일(`de.json`, `pt-BR.json`, …)로 출력합니다.

**워크플로우 2 - 문서 번역** (마크다운, Docusaurus JSON)

활성화된 경우 각 `documentations` 블록의 `contentPaths`과 해당 블록의 `jsonSource`에 있는 JSON 레이블 파일에서 `.md` 및 `.mdx`을 번역합니다. 블록별로 Docusaurus 스타일 또는 로케일 접미사가 붙은 평면 구조를 지원합니다(`documentations[].markdownOutput`). 공유 루트 `cacheDir`에 SQLite 캐시를 저장하여 새로운 또는 변경된 세그먼트만 LLM으로 전송합니다. **SVG:** `features.translateSVG`을 활성화하고 최상위 `svg` 블록을 추가한 후 `translate-svg`를 사용하세요 (둘 다 설정된 경우 `sync`에서도 실행됨).

두 워크플로우는 동일한 `ai-i18n-tools.config.json` 파일을 공유하며 독립적으로 또는 함께 사용할 수 있습니다. 독립형 SVG 번역은 `features.translateSVG`과 최상위 `svg` 블록을 사용하며 `translate-svg`을 통해 실행됩니다 (또는 `sync` 내부의 SVG 단계를 통해 실행됨).

---

<a id="installation"></a>
## 설치

게시된 패키지는 **ESM 전용**입니다(`"type": "module"`). Node.js, 번들러 또는 `import()`에서 `import`을 사용하세요. `require('ai-i18n-tools')` **는 지원되지 않습니다.** 이 패키지는 `engines.node` `>=22.16.0`를 선언합니다. 이전 버전의 Node.js는 지원되지 않습니다.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

### CLI 사용하기

**프로젝트별 설치 (권장)** — 종속성 또는 개발 종속성으로 설치한 후 `npx`, `pnpm exec`, 또는 `package.json` 스크립트를 통해 호출:

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

패키지 관리자는 Linux 및 macOS에서는 올바른 권한으로 `node_modules/.bin/ai-i18n-tools`를 작성하고, Windows에서는 `.cmd` / `.ps1` 쉼(Shim)을 생성합니다. 스크립트 실행기는 이를 자동으로 인식합니다.

**터미널에서 Bare** `ai-i18n-tools` **실행 시:** `package.json` 스크립트는 `PATH`에서 이미 `node_modules/.bin`로 실행되므로, `pnpm run i18n:sync`와 같은 명령어를 입력할 때 `npx`를 따로 타이핑하지 않아도 CLI를 실행할 수 있습니다. 로컬 설치 후 프로젝트 루트에서 대화형 셸에서 `ai-i18n-tools`을 직접 실행하려면, 로컬 bin 디렉터리를 `PATH`에 추가하세요.

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/)를 사용하여 프로젝트 루트의 `PATH_add node_modules/.bin`에 `.envrc`을(를) 추가하면, 저장소에 `cd`한 후에 베어 명령어를 사용할 수 있습니다. `PATH`을(를) 조정하지 않고도 `npx ai-i18n-tools …` 또는 `pnpm exec ai-i18n-tools …`을(를) 계속 사용할 수 있습니다.

**설치 없이 일회성 실행** — `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>` 사용 (해당 실행 시에만 패키지를 다운로드; `package.json`에 항목 추가 없음).

Linux, macOS 및 WSL에서는 레지스트리 설치 시 CLI 스크립트의 실행 권한 비트가 자동으로 설정됩니다. Windows에서는 패키지 관리자가 Node.js를 명시적으로 호출하는 `.cmd` 및 `.ps1` 쉼(Shim)을 생성합니다.

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

<a id="workflow-1---ui-strings"></a>
### 워크플로우 1 - UI 문자열

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

앱에서 `'ai-i18n-tools/runtime'`의 헬퍼를 사용하여 i18next를 연결하세요:

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### 워크플로우 2 - 문서

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

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

| 헬퍼 | 설명 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 키를 기본값으로 사용하는 설정을 위한 표준 i18next 초기화 옵션입니다. |
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

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

모든 명령어에 적용되는 전역 옵션: `-c <config>` (기본값: `ai-i18n-tools.config.json`), `-v` (자세한 출력), 선택적 `-w` / `--write-logs [path]` (콘솔 출력을 로그 파일로 복제; 기본값: 번역 캐시 디렉터리 아래), `-V` / `--version`, 그리고 `-h` / `--help`. 명령별 플래그는 [시작하기](docs/GETTING_STARTED.ko.md#cli-reference)를 참조하세요.

---

<a id="documentation"></a>
## 문서

- [시작하기](docs/GETTING_STARTED.ko.md) - 두 가지 워크플로우에 대한 전체 설정 안내, CLI 참조, 구성 항목 참조.
- [패키지 개요](docs/PACKAGE_OVERVIEW.ko.md) - 아키텍처, 내부 구조, 프로그래밍 방식 API 및 확장 포인트.
- [AI 에이전트 컨텍스트](../docs/ai-i18n-tools-context.md) - **이 패키지를 사용하는 앱을 위한:** 하위 프로젝트 통합 프롬프트 (리포지토리의 에이전트 규칙에 복사하세요).
- **이** 저장소 전용 유지 관리자 내부 정보: `dev/package-context.md` (복제 전용; npm에 없음).

---

<a id="license"></a>
## 라이선스

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
