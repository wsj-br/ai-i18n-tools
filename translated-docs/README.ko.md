<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**  *[DocToc](https://github.com/thlorenz/doctoc)으로 생성됨*

- [ai-i18n-tools](#ai-i18n-tools)
  - [두 가지 핵심 워크플로우](#two-core-workflows)
  - [설치](#installation)
  - [빠른 시작](#quick-start)
    - [워크플로우 1 - UI 문자열](#workflow-1---ui-strings)
    - [워크플로우 2 - 문서](#workflow-2---documentation)
    - [두 워크플로우 모두](#both-workflows)
  - [런타임 헬퍼](#runtime-helpers)
  - [CLI 명령어](#cli-commands)
  - [문서](#documentation)
  - [라이선스](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# ai-i18n-tools

JavaScript/TypeScript 애플리케이션 및 문서 사이트의 국제화를 위한 CLI 및 프로그래밍 툴킷입니다. UI 문자열을 추출하고 OpenRouter를 통해 LLM으로 번역하며, i18next를 위한 로케일 준비 완료 JSON 파일과 Markdown, Docusaurus JSON, 그리고 (`features.translateSVG`, `translate-svg`, 및 `svg` 블록을 통해) 독립형 SVG 자산을 생성합니다.

<small>**다른 언어로 읽기:** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## 두 가지 핵심 워크플로우

**워크플로우 1 - UI 번역** (React, Next.js, Node.js, 모든 i18next 프로젝트)

`t("…")` / `i18n.t("…")` **리터럴**에서 마스터 카탈로그(`strings.json` 및 선택적으로 로케일별 **`models`** 메타데이터 포함)를 생성하고, 선택적으로 **`package.json` `description`** 를 포함하며, 구성에서 활성화된 경우 각 **`englishName`** 을 `ui-languages.json`에서 생성합니다. OpenRouter를 통해 로케일별 누락된 항목을 번역하고 i18next에서 사용할 수 있도록 평면 JSON 파일(`de.json`, `pt-BR.json`, …)을 작성합니다.

**워크플로우 2 - 문서 번역** (Markdown, Docusaurus JSON)

각 `documentations` 블록의 `contentPaths` 및 해당 블록의 `jsonSource`에서 JSON 레이블 파일을 `.md` 및 `.mdx`에서 번역합니다. 블록별로 Docusaurus 스타일 및 평면 로케일 접미사 레이아웃을 지원합니다 (`documentations[].markdownOutput`). 공유 루트 `cacheDir`는 SQLite 캐시를 보유하므로 새로 추가되거나 변경된 세그먼트만 LLM으로 전송됩니다. **SVG:** `features.translateSVG`를 활성화하고 최상위 `svg` 블록을 추가한 다음 `translate-svg`를 사용합니다 (둘 다 설정된 경우 `sync`에서 실행됨).

두 워크플로우는 단일 `ai-i18n-tools.config.json` 파일을 공유하며 독립적으로 또는 함께 사용할 수 있습니다. 독립형 SVG 번역은 `features.translateSVG`과 최상위 `svg` 블록을 사용하고 `translate-svg`를 통해 실행됩니다 (또는 `sync` 내부의 SVG 단계).

---

## 설치

게시된 패키지는 **ESM 전용**(`"type": "module"`)입니다. Node.js, 번들러 또는 `import()`에서 `import`을 사용하세요. `require('ai-i18n-tools')` **은 지원되지 않습니다.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

OpenRouter API 키를 설정하세요:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 빠른 시작

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

### 워크플로우 2 - 문서

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### 두 워크플로우

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## 런타임 헬퍼

`'ai-i18n-tools/runtime'`에서 내보내기 - 모든 JS 환경에서 작동하며 i18next 가져오기가 필요하지 않습니다:

| 헬퍼 | 설명 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | 키를 기본값으로 설정하는 표준 i18next 초기화 옵션입니다. |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 권장 배선: **`strings.json`** 의 키-트림 + 복수형 **`wrapT`**, 선택적으로 **`translate-ui`** `{sourceLocale}.json` 복수 키를 병합합니다. |
| `wrapI18nWithKeyTrim(i18n)` | 하위 수준 키-트림 래퍼 전용 (앱 배선에서는 사용 중단됨; **`setupKeyAsDefaultT`** 사용 권장). |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | **`ui-languages.json`** 에서 **`makeLoadLocale`** 의 **`localeLoaders`** 맵을 생성합니다 (**`sourceLocale`** 제외한 모든 **`code`**). |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 비동기 로케일 파일 로딩을 위한 팩토리. |
| `getTextDirection(lng)` | BCP-47 코드에 대해 `'ltr'` 또는 `'rtl'`를 반환합니다. |
| `applyDirection(lng, element?)` | `document.documentElement`에 `dir` 속성을 설정합니다. |
| `getUILanguageLabel(lang, t)` | 언어 메뉴 행의 표시 레이블 (i18n 포함). |
| `getUILanguageLabelNative(lang)` | `t()` 호출 없이 표시 레이블 생성 (헤더 스타일). |
| `interpolateTemplate(str, vars)` | 일반 문자열에 대한 저수준 `{{var}}` 치환 (내부 사용; 앱 코드는 대신 `t()` 사용). |
| `flipUiArrowsForRtl(text, isRtl)` | RTL 레이아웃을 위해 `→`을(를) `←`로 전환합니다. |

---

## CLI 명령어

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

모든 명령어의 전역 옵션: `-c <config>` (기본값: `ai-i18n-tools.config.json`), `-v` (상세 출력), 선택적 `-w` / `--write-logs [path]` (콘솔 출력을 로그 파일로 병행 기록; 기본값: 번역 캐시 디렉터리 내), `-V` / `--version`, 및 `-h` / `--help`. 명령별 플래그는 [시작하기](docs/GETTING_STARTED.ko.md#cli-reference)를 참조하세요.

---

## 문서

- [시작하기](docs/GETTING_STARTED.ko.md) - 두 가지 워크플로우에 대한 전체 설정 가이드, CLI 참조, 구성 필드 참조.
- [패키지 개요](docs/PACKAGE_OVERVIEW.ko.md) - 아키텍처, 내부 구조, 프로그래밍 API 및 확장 포인트.
- [AI 에이전트 컨텍스트](../docs/ai-i18n-tools-context.md) - **이 패키지를 사용하는 앱을 위한:** 하위 프로젝트 통합 프롬프트 (리포지토리의 에이전트 규칙에 복사하세요).
- **이** 저장소의 관리자 내부 정보: `dev/package-context.md` (복제 전용; npm에 없음).

---

## 라이선스

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
