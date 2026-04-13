---
translation_last_updated: '2026-04-13T00:28:24.858Z'
source_file_mtime: '2026-04-13T00:09:06.223Z'
source_file_hash: 0d67865859266b61296bab41fec3c62bd682a4d4808658743d84ee4af5ff9865
translation_language: ko
source_file_path: docs/GETTING_STARTED.md
---
# ai-i18n-tools: 시작하기

`ai-i18n-tools`는 두 가지 독립적이면서도 조합 가능한 워크플로우를 제공합니다:

- **워크플로우 1 - UI 번역**: JS/TS 소스에서 `t("…")` 호출을 추출하고 OpenRouter를 통해 번역한 후 i18next에서 바로 사용할 수 있는 평면화된 로케일별 JSON 파일을 생성합니다.
- **워크플로우 2 - 문서 번역**: 마크다운(MDX) 및 Docusaurus JSON 레이블 파일을 여러 로케일로 번역하며, 스마트 캐싱을 지원합니다. **SVG** 자산은 별도의 명령어(`translate-svg`)와 선택적 `svg` 설정을 사용합니다(자세한 내용은 [CLI 참조](#cli-reference) 참조).

두 워크플로우 모두 OpenRouter(호환되는 모든 LLM)를 사용하며 단일 설정 파일을 공유합니다.

<small>**다른 언어로 읽기:** </small>

<small id="lang-list">[en-GB](../../docs/GETTING_STARTED.md) · [de](./GETTING_STARTED.de.md) · [es](./GETTING_STARTED.es.md) · [fr](./GETTING_STARTED.fr.md) · [hi](./GETTING_STARTED.hi.md) · [ja](./GETTING_STARTED.ja.md) · [ko](./GETTING_STARTED.ko.md) · [pt-BR](./GETTING_STARTED.pt-BR.md) · [zh-CN](./GETTING_STARTED.zh-CN.md) · [zh-TW](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [설치](#installation)
- [빠른 시작](#quick-start)
- [워크플로우 1 - UI 번역](#workflow-1---ui-translation)
  - [1단계: 초기화](#step-1-initialise)
  - [2단계: 문자열 추출](#step-2-extract-strings)
  - [3단계: UI 문자열 번역](#step-3-translate-ui-strings)
  - [4단계: 런타임에서 i18next 연결](#step-4-wire-i18next-at-runtime)
  - [소스 코드에서 `t()` 사용하기](#using-t-in-source-code)
  - [보간](#interpolation)
  - [언어 전환 UI](#language-switcher-ui)
  - [RTL 언어](#rtl-languages)
- [워크플로우 2 - 문서 번역](#workflow-2---document-translation)
  - [1단계: 초기화](#step-1-initialise-1)
  - [2단계: 문서 번역](#step-2-translate-documents)
    - [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags)
  - [출력 레이아웃](#output-layouts)
- [통합 워크플로우(UI + 문서)](#combined-workflow-ui--docs)
- [설정 참조](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (선택 사항)](#uilanguagespath-optional)
  - [`concurrency` (선택 사항)](#concurrency-optional)
  - [`batchConcurrency` (선택 사항)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (선택 사항)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (선택 사항)](#svg-optional)
  - [`glossary`](#glossary)
- [CLI 참조](#cli-reference)
- [환경 변수](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 설치

배포된 패키지는 **ESM 전용**입니다. Node.js 또는 번들러에서는 `import`/`import()`를 사용하세요. **`require('ai-i18n-tools')`는 사용하지 마세요.**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

OpenRouter API 키를 설정하세요:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

또는 프로젝트 루트에 `.env` 파일을 생성하세요:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## 빠른 시작

기본 `init` 템플릿(`ui-markdown`)은 **UI** 추출 및 번역만을 활성화합니다. `ui-docusaurus` 템플릿은 **문서** 번역(`translate-docs`)을 활성화합니다. 설정에 따라 추출, UI 번역, 독립형 SVG 번역(선택 사항), 문서 번역을 하나의 명령어로 실행하고자 할 때 `sync`를 사용하세요.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## 워크플로우 1 - UI 번역

i18next를 사용하는 모든 JS/TS 프로젝트를 위한 것입니다: React 앱, Next.js(클라이언트 및 서버 컴포넌트), Node.js 서비스, CLI 도구 등.

### 1단계: 초기화

```bash
npx ai-i18n-tools init
```

이 명령은 `ui-markdown` 템플릿으로 `ai-i18n-tools.config.json` 파일을 생성합니다. 다음을 설정하기 위해 이 파일을 편집하세요:

- `sourceLocale` - 원본 언어의 BCP-47 코드 (예: `"en-GB"`). **반드시** 런타임 i18n 설정 파일(`src/i18n.ts` / `src/i18n.js`)에서 내보낸 `SOURCE_LOCALE`와 일치해야 합니다.  
- `targetLocales` - `ui-languages.json` 매니페스트 파일의 경로 또는 BCP-47 코드 배열.  
- `ui.sourceRoots` - `t("…")` 호출을 검색할 디렉터리 (예: `["src/"]`).  
- `ui.stringsJson` - 마스터 카탈로그를 저장할 위치 (예: `"src/locales/strings.json"`).  
- `ui.flatOutputDir` - `de.json`, `pt-BR.json` 등이 저장될 위치 (예: `"src/locales/"`).  
- `ui.preferredModel` (선택 사항) - `translate-ui` 명령어에서 **최초로** 시도할 OpenRouter 모델 ID. 실패 시 CLI는 `openrouter.translationModels` (또는 이전 방식인 `defaultModel` / `fallbackModel`)에 정의된 순서대로 시도하며, 중복은 건너뜁니다.

### 2단계: 문자열 추출

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 아래의 모든 JS/TS 파일에서 `t("literal")` 및 `i18n.t("literal")` 호출을 스캔하고, `ui.stringsJson`에 기록하거나 병합합니다.

스캐너는 설정 가능하며, `ui.reactExtractor.funcNames`를 통해 사용자 정의 함수 이름을 추가할 수 있습니다.

### 3단계: UI 문자열 번역

```bash
npx ai-i18n-tools translate-ui
```

`strings.json`을 읽은 후 각 대상 로케일에 대해 OpenRouter로 배치 전송하고, `ui.flatOutputDir`에 `de.json`, `fr.json` 등의 평면 JSON 파일을 작성합니다. `ui.preferredModel`이 설정된 경우, 해당 모델을 `openrouter.translationModels`에 정의된 순서대로 시도하기 전에 먼저 시도합니다 (문서 번역 및 기타 명령어는 여전히 `openrouter`만 사용합니다).

각 항목에 대해 `translate-ui`는 각 로케일을 성공적으로 번역한 **OpenRouter 모델 ID**를 선택적 `models` 객체에 저장합니다 (`translated`와 동일한 로케일 키 사용). 로컬 `editor` 명령어로 편집된 문자열은 해당 로케일의 `models`에 `user-edited`라는 시그널 값으로 표시됩니다. `ui.flatOutputDir` 아래의 로케일별 평면 파일은 **원본 문자열 → 번역문**만 포함되며, `models`는 포함되지 않습니다 (따라서 런타임 번들은 변경되지 않습니다).

> **캐시 에디터 사용 시 참고사항:** 캐시 에디터에서 항목을 편집한 경우, 업데이트된 캐시 항목으로 출력 파일을 다시 작성하기 위해 `sync --force-update` (또는 `--force-update` 옵션을 사용한 동등한 `translate` 명령어)를 실행해야 합니다. 또한, 이후 원본 텍스트가 변경되면 새로운 캐시 키(해시)가 생성되므로 수동 편집 내용이 사라진다는 점에 유의하세요.

### 4단계: 런타임에서 i18next 연결

`'ai-i18n-tools/runtime'`에서 내보낸 헬퍼를 사용하여 i18n 설정 파일을 만드세요:

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

React 렌더링 전에 (예: 진입점(entry point) 상단에서) `i18n.js`를 가져오세요. 사용자가 언어를 변경하면 `await loadLocale(code)`를 호출한 후 `i18n.changeLanguage(code)`를 실행하세요.

`SOURCE_LOCALE`는 내보내지므로 다른 파일(예: 언어 전환기)에서도 `'./i18n'`에서 직접 가져와 사용할 수 있습니다.

`defaultI18nInitOptions(sourceLocale)`은 키를 기본값으로 사용하는 설정을 위한 표준 옵션을 반환합니다:

- `parseMissingKeyHandler`는 키 자체를 반환하므로, 번역되지 않은 문자열은 원본 텍스트를 표시합니다.  
- `nsSeparator: false`는 콜론을 포함한 키 사용을 허용합니다.  
- `interpolation.escapeValue: false` - React가 자체적으로 값을 이스케이프하므로 안전하게 비활성화할 수 있으며, Node.js/CLI 출력에는 이스케이프할 HTML이 없습니다.

`wrapI18nWithKeyTrim(i18n)`은 `i18n.t`를 래핑하여 (1) 키가 조회 전에 자동으로 공백을 제거하여 추출 스크립트가 저장하는 방식과 일치하고, (2) 원본 로케일이 원시 키를 반환할 때 <code>{"{{var}}"}</code> 보간이 적용되도록 합니다. 따라서 <code>{"t('Hello {{name}}', { name })"}</code>이 원본 언어에서도 정상적으로 작동합니다.

`makeLoadLocale(i18n, loaders, sourceLocale)`은 로케일에 대한 JSON 번들을 동적으로 가져와 i18next에 등록하는 비동기 `loadLocale(lang)` 함수를 반환합니다.

### 소스 코드에서 `t()` 사용하기

추출 스크립트가 찾을 수 있도록 **리터럴 문자열**로 `t()`를 호출하세요:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

동일한 패턴은 React 외부(Node.js, 서버 컴포넌트, CLI)에서도 작동합니다:

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**규칙:**

- 다음 형식만 추출됩니다: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- 키는 **리터럴 문자열**이어야 하며, 변수나 표현식은 키로 사용할 수 없습니다.
- 템플릿 리터럴을 키로 사용하지 마십시오: <code>{'t(`Hello ${name}`)'}</code>은 추출할 수 없습니다.

### 보간

<code>{"{{var}}"}</code> 자리 표시자에는 i18next의 기본 두 번째 인수 보간을 사용합니다:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

추출 스크립트는 두 번째 인수를 무시하며, 리터럴 키 문자열인 <code>{"\"Hello {{name}}, you have {{count}} messages\""}</code>만 추출되어 번역을 위해 전송됩니다. 번역자에게는 <code>{"{{...}}"}</code> 토큰을 그대로 유지하도록 지시합니다.

### 언어 전환기 UI

`ui-languages.json` 매니페스트를 사용하여 언어 선택기를 구성합니다. `ai-i18n-tools`는 두 가지 표시 헬퍼를 내보냅니다:

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

`getUILanguageLabel(lang, t)` - 번역된 경우 `t(englishName)`을 표시하고, 다를 경우 `englishName / t(englishName)`을 표시합니다. 설정 화면에 적합합니다.

`getUILanguageLabelNative(lang)` - `englishName / label`을 표시합니다(`t()` 호출 없이 각 행에 표시). 헤더 메뉴처럼 현지 언어 이름을 보여주고자 할 때 적합합니다.

`ui-languages.json` 매니페스트는 <code>{"{ code, label, englishName }"}</code> 항목들의 JSON 배열입니다. 예시:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

`targetLocales`를 이 파일의 경로로 설정하여 번역 명령어가 동일한 목록을 사용하도록 합니다.

### RTL 언어

`ai-i18n-tools`는 `getTextDirection(lng)` 및 `applyDirection(lng)`을 내보냅니다:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection`은 브라우저에서 `document.documentElement.dir`을 설정하고, Node.js에서는 아무 작업도 하지 않습니다. 특정 요소를 대상으로 하려면 선택적으로 `element` 인수를 전달할 수 있습니다.

`→` 화살표를 포함할 수 있는 문자열의 경우 RTL 레이아웃에서는 이를 반대로 뒤집습니다:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## 워크플로 2 - 문서 번역

마크다운 문서, Docusaurus 사이트 및 JSON 레이블 파일을 위한 것입니다. SVG 다이어그램은 [`translate-svg`](#cli-reference) 및 구성의 `svg`를 통해 번역되며, `documentations[].contentPaths`를 통해 번역되지 않습니다.

### 1단계: 초기화

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

생성된 `ai-i18n-tools.config.json`을 편집합니다:

- `sourceLocale` - 소스 언어 (필수로 `docusaurus.config.js`의 `defaultLocale`과 일치해야 함).
- `targetLocales` - 로케일 코드 배열 또는 매니페스트 경로.
- `cacheDir` - 모든 문서 파이프라인에서 공유하는 SQLite 캐시 디렉터리(`--write-logs`의 기본 로그 디렉터리).
- `documentations` - 문서 블록들의 배열. 각 블록은 선택적 `description`, `contentPaths`, `outputDir`, 선택적 `jsonSource`, `markdownOutput`, `targetLocales`, `injectTranslationMetadata` 등을 가집니다.
- `documentations[].description` - 유지 관리자를 위한 선택적 간단한 메모(이 블록의 범위). 설정 시 `translate-docs` 헤드라인(`🌐 …: translating …`) 및 `status` 섹션 헤더에 표시됩니다.
- `documentations[].contentPaths` - 마크다운/MDX 소스 디렉터리 또는 파일(`documentations[].jsonSource`는 JSON 레이블 참조).
- `documentations[].outputDir` - 해당 블록의 번역된 출력 루트.
- `documentations[].markdownOutput.style` - `"nested"` (기본값), `"docusaurus"`, 또는 `"flat"` ([출력 레이아웃](#output-layouts) 참조).

### 2단계: 문서 번역

```bash
npx ai-i18n-tools translate-docs
```

이것은 모든 `documentations` 블록의 `contentPaths`에 있는 모든 파일을 모든 유효한 문서 로케일로 번역합니다(설정된 경우 각 블록의 `targetLocales`의 합집합, 그렇지 않으면 루트 `targetLocales`). 이미 번역된 세그먼트는 SQLite 캐시에서 제공되며 - 새로 추가되거나 변경된 세그먼트만 LLM으로 전송됩니다.

단일 로케일을 번역하려면:

```bash
npx ai-i18n-tools translate-docs --locale de
```

무엇을 번역해야 하는지 확인하려면:

```bash
npx ai-i18n-tools status
```

#### 캐시 동작 및 `translate-docs` 플래그

CLI는 SQLite에 **파일 추적**(파일당 소스 해시 × 로케일)과 **세그먼트** 행(번역 가능한 각 청크당 해시 × 로케일)을 유지합니다. 일반 실행에서는 추적된 해시가 현재 소스 **와** 출력 파일이 이미 존재할 때 파일 전체를 건너뜁니다. 그렇지 않으면 파일을 처리하고 세그먼트 캐시를 사용하므로 변경되지 않은 텍스트는 API를 호출하지 않습니다.

| 깃발                     | 효과                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(기본값)*              | 추적 시 변경되지 않은 파일 건너뛰기 + 디스크 출력 일치; 나머지에 대해 세그먼트 캐시 사용.                                                                                                             |
| `--force-update`         | 파일 추적이 건너뛰더라도 모든 일치 파일 재처리(추출, 재조립, 출력 작성). **세그먼트 캐시는 여전히 적용됨** - 변경되지 않은 세그먼트는 LLM에 전송되지 않습니다.                   |
| `--force`                | 처리된 각 파일에 대한 파일 추적을 지우고 **세그먼트 캐시를 읽지 않음** (전체 재번역). 새 결과는 여전히 **세그먼트 캐시에 기록됩니다**.                 |
| `--stats`                | 세그먼트 수, 추적된 파일 수, 로케일별 세그먼트 총계를 출력한 후 종료합니다.                                                                                                                   |
| `--clear-cache [locale]` | 캐시된 번역(및 파일 추적)을 삭제: 모든 로케일 또는 단일 로케일, 그리고 종료합니다.                                                                                                            |
| `--prompt-format <mode>` | 세그먼트 **배치**를 모델에 전송하고 구문 분석하는 방식(`xml`, `json-array` 또는 `json-object`). 기본값 **`xml`**. 추출, 자리표시자, 유효성 검사, 캐시 또는 대체 동작은 변경되지 않음 - [배치 프롬프트 형식](#batch-prompt-format) 참조. |

`--force`는 `--force-update`와 함께 사용할 수 없습니다(서로 배타적입니다).

#### 배치 프롬프트 형식

`translate-docs`는 번역 가능한 세그먼트를 **배치**(`batchSize` / `maxBatchChars`로 그룹화)로 OpenRouter에 보냅니다. **`--prompt-format`** 플래그는 해당 배치의 **와이어 형식**만 변경합니다. 세그먼트 분할, `PlaceholderHandler` 토큰, 마크다운 AST 검사, SQLite 캐시 키, 배치 구문 분석 실패 시 세그먼트별 대체는 변경되지 않습니다.

| 모드 | 사용자 메시지 | 모델 회신 |
| ---- | ------------ | ----------- |
| **`xml`** (기본값) | 의사 XML: 세그먼트당 하나의 `<seg id="N">…</seg>`(XML 이스케이프 포함). | `<t id="N">…</t>` 블록만, 세그먼트 인덱스당 하나. |
| **`json-array`** | 문자열 배열 JSON, 순서대로 세그먼트당 하나의 항목. | 동일한 **길이**의(동일한 순서) JSON 배열. |
| **`json-object`** | JSON 객체 `{"0":"…","1":"…",…}`, 세그먼트 인덱스로 키 지정. | 동일한 **키**와 번역된 값을 가진 JSON 객체. |

실행 헤더에도 `Batch prompt format: …`가 인쇄되므로 활성 모드를 확인할 수 있습니다. JSON 레이블 파일(`jsonSource`) 및 독립형 SVG 배치는 `translate-docs`(또는 `sync`의 문서 단계 - `sync`에서는 이 플래그를 노출하지 않음; 기본값은 **`xml`**)의 일부로 실행될 때 동일한 설정을 사용합니다.

**세그먼트 중복 제거 및 SQLite의 경로**

- 세그먼트 행은 전역적으로 `(source_hash, locale)`로 키가 지정됩니다(hash = 정규화된 콘텐츠). 두 파일에 동일한 텍스트가 있으면 하나의 행을 공유하며, `translations.filepath`는 메타데이터(마지막 작성자)일 뿐 파일별 두 번째 캐시 항목이 아닙니다.
- `file_tracking.filepath`는 네임스페이스가 있는 키를 사용합니다: 각 `documentations` 블록마다 `doc-block:{index}:{relPath}` (`relPath`는 프로젝트 루트 기준 posix: 수집된 마크다운 경로) 및 `translate-svg` 아래의 독립형 SVG 자산에는 `svg-assets:{relPath}`를 사용합니다. **JSON 레이블 파일은 소스 파일에 대한 cwd 기준 경로를 사용합니다**. 예: `docs-site/i18n/en/code.json`이므로 정리(cleanup)에서 실제 파일을 확인할 수 있습니다.
- `translations.filepath`는 마크다운, JSON 및 SVG 세그먼트에 대해 cwd 기준 posix 경로를 저장합니다(SVG는 다른 자산과 동일한 경로 형식을 사용하며, `svg-assets:…` 접두사는 **`file_tracking`에서만** 사용됩니다).
- 실행 후 `last_hit_at`은 같은 번역 범위 **내의 세그먼트 행에 대해서만** 지워집니다(`--path` 및 활성화된 종류를 준수). 따라서 필터링되었거나 문서 전용 실행은 관련 없는 파일을 오래된 상태로 표시하지 않습니다.

### 출력 레이아웃

`"nested"`(기본값, 생략 시) — `{outputDir}/{locale}/` 아래에 원본 트리를 그대로 반영합니다(예: `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — `docsRoot` 아래에 있는 파일을 `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`에 배치하며, 일반적인 Docusaurus i18n 레이아웃과 일치합니다. `documentations[].markdownOutput.docsRoot`를 문서 소스 루트로 설정하세요(예: `"docs"`).

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 번역된 파일을 로케일 접미사가 붙은 원본 옆이나 하위 디렉터리에 배치합니다. 페이지 간의 상대 링크는 자동으로 다시 작성됩니다.

```
docs/guide.md → i18n/guide.de.md
```

`documentations[].markdownOutput.pathTemplate`을 사용하여 경로를 완전히 재정의할 수 있습니다. 사용 가능한 자리표시자: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>.

---

## 통합 워크플로우(UI + 문서)

단일 설정에서 모든 기능을 활성화하여 두 워크플로우를 함께 실행합니다:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

`glossary.uiGlossary`는 UI와 동일한 `strings.json` 카탈로그를 문서 번역에 사용하여 용어 일관성을 유지합니다. `glossary.userGlossary`는 제품 용어에 대한 CSV 재정의를 추가합니다.

`npx ai-i18n-tools sync`를 실행하여 하나의 파이프라인을 실행합니다: **추출** UI 문자열(`features.extractUIStrings`인 경우), **번역 UI** 문자열(`features.translateUIStrings`인 경우), **독립형 SVG 자산 번역**(설정에 `svg` 블록이 있는 경우), 그 후 **문서 번역**(각 `documentations` 블록: 설정된 대로 마크다운/JSON). `--no-ui`, `--no-svg`, 또는 `--no-docs`로 일부 단계를 건너뛸 수 있습니다. 문서 단계는 `--dry-run`, `-p` / `--path`, `--force`, `--force-update`를 지원합니다(마지막 두 옵션은 문서 번역이 실행될 때만 적용되며, `--no-docs`를 전달하면 무시됩니다).

`documentations[].targetLocales`를 블록에 사용하여 해당 블록 파일을 UI보다 **더 작은 하위 집합**으로 번역합니다(효과적인 문서 로케일은 블록 간의 **합집합**입니다):

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

---

## 설정 참조

### `sourceLocale`

소스 언어의 BCP-47 코드(예: `"en-GB"`, `"en"`, `"pt-BR"`). 이 로케일에 대해서는 번역 파일이 생성되지 않으며, 키 문자열 자체가 소스 텍스트입니다.

**일치해야 합니다** 런타임 i18n 설정 파일(`src/i18n.ts` / `src/i18n.js`)에서 내보낸 `SOURCE_LOCALE`과.

### `targetLocales`

어떤 로케일로 번역할지 지정합니다. 다음을 허용합니다:

- **문자열 경로**: `ui-languages.json` 매니페스트 파일(`"src/locales/ui-languages.json"`). 파일이 로드되고 로케일 코드가 추출됩니다.
- **BCP-47 코드 배열**(`["de", "fr", "es"]`).
- **경로를 포함하는 1개 요소 배열**(`["src/locales/ui-languages.json"]`) - 문자열 형식과 동일한 동작을 합니다.

`targetLocales`는 UI 번역을 위한 주 로케일 목록이며 문서 블록의 기본 로케일 목록입니다. 여기에 명시적 배열을 유지하면서도 매니페스트 기반 레이블과 로케일 필터링을 원한다면 `uiLanguagesPath`도 설정하십시오.

### `uiLanguagesPath`(선택 사항)

표시 이름, 로케일 필터링 및 언어 목록 후처리를 위해 사용되는 `ui-languages.json` 매니페스트의 경로입니다.

다음과 같은 경우에 사용합니다:

- `targetLocales`가 명시적 배열이지만 여전히 매니페스트에서 영문/현지 언어 레이블을 원할 때.
- `markdownOutput.postProcessing.languageListBlock`이 동일한 매니페스트에서 로케일 레이블을 생성하도록 원할 때.
- UI 번역만 활성화되어 있고 매니페스트가 효과적인 UI 로케일 목록을 제공하도록 원할 때.

### `concurrency`(선택 사항)

동시에 번역할 수 있는 **대상 로케일**의 최대 수(`translate-ui`, `translate-docs`, `translate-svg` 및 `sync` 내의 일치하는 단계). 생략하면 CLI는 UI 번역에 **4**, 문서 번역에 **3**을 사용합니다(기본값). 실행 시 `-j` / `--concurrency`로 재정의할 수 있습니다.

### `batchConcurrency`(선택 사항)

**문서 번역** 및 **SVG 번역** (및 `sync`의 문서화 단계): 파일당 최대 병렬 OpenRouter **배치** 요청 수 (각 배치에는 여러 세그먼트가 포함될 수 있습니다). 기본값은 생략 시 **4**입니다. `translate-ui`에서는 무시됩니다. `-b` / `--batch-concurrency`로 재정의할 수 있습니다. `sync`에서는 `-b`가 문서 번역 단계에만 적용됩니다.

### `batchSize` / `maxBatchChars` (선택 사항)

문서 번역을 위한 세그먼트 배치: API 요청당 몇 개의 세그먼트와 문자 한계. 기본값: **20** 세그먼트, **4096** 문자 (생략 시).

### `openrouter`

| 필드               | 설명                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter API 기본 URL. 기본값: `https://openrouter.ai/api/v1`.                        |
| `translationModels` | 선호하는 모델 ID의 정렬된 목록. 첫 번째 모델이 먼저 시도되며, 이후 항목은 오류 발생 시 대체 모델입니다. `translate-ui` 전용으로**, 이 목록 전에 시도할 모델을 위해 `ui.preferredModel`을 설정할 수 있습니다 (자세한 내용은 `ui` 참조). |
| `defaultModel`      | 레거시 단일 기본 모델. `translationModels`가 설정되지 않거나 비어 있을 때만 사용됩니다.       |
| `fallbackModel`     | 레거시 단일 대체 모델. `translationModels`가 설정되지 않거나 비어 있을 때 `defaultModel` 이후에 사용됩니다. |
| `maxTokens`         | 요청당 최대 완료 토큰 수. 기본값: `8192`.                                      |
| `temperature`       | 샘플링 온도. 기본값: `0.2`.                                                    |

환경 또는 `.env` 파일에 `OPENROUTER_API_KEY`를 설정하세요.

### `features`

| 필드                | 워크플로우 | 설명                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | 소스에서 `t("…")`를 스캔하고 `strings.json`을 작성/병합합니다.          |
| `translateUIStrings` | 1        | `strings.json` 항목을 번역하고 지역별 JSON 파일을 작성합니다. |
| `translateMarkdown`  | 2        | `.md` / `.mdx` 파일을 번역합니다.                                   |
| `translateJSON`      | 2        | Docusaurus JSON 레이블 파일을 번역합니다.                            |

`features.translateSVG` 플래그는 없습니다. **독립형** SVG 자산은 `translate-svg` 및 구성의 최상위 `svg` 블록으로 번역하세요. `sync` 명령은 `svg`가 존재할 때 해당 단계를 실행합니다 (단, `--no-svg` 제외).

### `ui`

| 필드                       | 설명                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | `t("…")` 호출을 스캔하는 디렉토리 (현재 작업 디렉토리 기준).               |
| `stringsJson`               | 마스터 카탈로그 파일의 경로. `extract`에 의해 업데이트됩니다.                  |
| `flatOutputDir`             | 지역별 JSON 파일이 작성되는 디렉토리 (`de.json` 등).    |
| `preferredModel`            | 선택 사항. `translate-ui` 전용으로 먼저 시도할 OpenRouter 모델 ID; 이후 `openrouter.translationModels` (또는 레거시 모델) 순서대로, 이 ID를 중복하지 않고. |
| `reactExtractor.funcNames`  | 스캔할 추가 함수 이름 (기본값: `["t", "i18n.t"]`).         |
| `reactExtractor.extensions` | 포함할 파일 확장자 (기본값: `[".js", ".jsx", ".ts", ".tsx"]`). |
| `reactExtractor.includePackageDescription` | `true`일 때 (기본값), `extract`는 `package.json`의 `description`을 UI 문자열로 포함합니다 (존재할 경우). |
| `reactExtractor.packageJsonPath` | 해당 선택적 설명 추출에 사용되는 `package.json` 파일의 사용자 정의 경로. |

### `cacheDir`

| 필드      | 설명                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | 모든 `documentations` 블록에서 공유되는 SQLite 캐시 디렉토리. 실행 간 재사용됩니다. |

### `documentations`

문서화 파이프라인 블록들의 배열입니다. `translate-docs`와 `sync`의 docs 단계는 **각각**의 블록을 순서대로 처리합니다.

| 필드 | 설명 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description` | 이 블록에 대한 선택적 인간이 읽을 수 있는 메모(번역에는 사용되지 않음). 설정된 경우 `translate-docs`의 `🌐` 헤드라인 앞에 접두사로 표시되며, `status` 섹션 헤더에도 표시됨. |
| `contentPaths` | 번역할 마크다운/MDX 소스(`translate-docs`가 `.md` / `.mdx` 파일을 스캔함). JSON 레이블은 동일한 블록의 `jsonSource`에서 가져옴. |
| `outputDir` | 이 블록에 대한 번역 출력의 루트 디렉터리. |
| `sourceFiles` | 로드 시 `contentPaths`에 병합되는 선택적 별칭. |
| `targetLocales` | 이 블록에만 적용되는 선택적 로케일 하위 집합(그렇지 않으면 루트 `targetLocales` 사용). 유효한 문서 로케일은 모든 블록의 합집합임. |
| `jsonSource` | 이 블록에 대한 Docusaurus JSON 레이블 파일의 소스 디렉터리(예: `"i18n/en"`). |
| `markdownOutput.style` | `"nested"`(기본값), `"docusaurus"`, 또는 `"flat"`. |
| `markdownOutput.docsRoot` | Docusaurus 레이아웃을 위한 소스 문서 루트(예: `"docs"`). |
| `markdownOutput.pathTemplate` | 사용자 정의 마크다운 출력 경로. 자리표시자: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>. |
| `markdownOutput.jsonPathTemplate` | 레이블 파일에 대한 사용자 정의 JSON 출력 경로. `pathTemplate`과 동일한 자리표시자를 지원함. |
| `markdownOutput.flatPreserveRelativeDir` | `flat` 스타일의 경우, 동일한 basename을 가진 파일이 충돌하지 않도록 소스 하위 디렉터리를 유지함. |
| `markdownOutput.rewriteRelativeLinks` | 번역 후 상대 링크를 다시 작성함(`flat` 스타일에서는 자동으로 활성화됨). |
| `markdownOutput.linkRewriteDocsRoot` | 평면 링크 재작성 접두어를 계산할 때 사용되는 리포지터리 루트. 번역된 문서가 다른 프로젝트 루트 아래에 있지 않은 한 일반적으로 `"."`로 둠. |
| `markdownOutput.postProcessing` | 번역된 마크다운 **본문**에 대한 선택적 변환(YAML 프론트 매터는 보존됨). 세그먼트 재조합 및 평면 링크 재작성 후, `injectTranslationMetadata` 전에 실행됨. |
| `markdownOutput.postProcessing.regexAdjustments` | `{ "description"?, "search", "replace" }`의 순서가 지정된 목록. `search`는 정규식 패턴임(일반 문자열은 플래그 `g` 사용, 또는 `/pattern/flags`). `replace`는 `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`(참조 문서의 `additional-adjustments`와 동일한 개념) 등의 자리표시자를 지원함. |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 번역기는 `start`를 포함하는 첫 번째 줄과 일치하는 `end` 줄을 찾은 후, 해당 범위를 표준 언어 전환기로 대체함. 링크는 번역된 파일을 기준으로 상대 경로로 생성됨; 레이블은 구성된 경우 `uiLanguagesPath` / `ui-languages.json`에서 가져오고, 그렇지 않으면 `localeDisplayNames` 및 로케일 코드에서 가져옴. |
| `injectTranslationMetadata` | `true`일 경우(생략 시 기본값), 번역된 마크다운 파일에 YAML 키를 포함함: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`. 생략하려면 `false`로 설정함. |

예시 (단순한 README 파이프라인 — 스크린샷 경로 + 선택적 언어 목록 래퍼):

```json
"markdownOutput": {
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
      "separator": " · "
    }
  }
}
```

### `svg` (선택 사항)

`translate-svg` 및 `sync`의 SVG 단계에서 번역되는 독립형 SVG 자산을 위한 최상위 설정입니다.

| 필드                       | 설명 |
| --------------------------- | ----------- |
| `sourcePath`                | `.svg` 파일을 재귀적으로 검색할 하나의 디렉터리 또는 디렉터리 배열입니다. |
| `outputDir`                 | 번역된 SVG 출력의 루트 디렉터리입니다. |
| `style`                     | `pathTemplate`이 설정되지 않은 경우 `"flat"` 또는 `"nested"`입니다. |
| `pathTemplate`              | 사용자 정의 SVG 출력 경로입니다. 자리표시자: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | SVG 재조합 시 번역된 텍스트를 소문자로 변환합니다. 모두 소문자 레이블에 의존하는 디자인에 유용합니다. |

### `glossary`

| 필드          | 설명                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | `strings.json`에 대한 경로 - 기존 번역을 기반으로 용어집을 자동 생성합니다.                                                                                                                 |
| `userGlossary` | `Original language string`(또는 `en`), `locale`, `Translation` 열을 가진 CSV 파일에 대한 경로 - 각 원본 용어와 대상 로케일(`locale`은 모든 대상에 대해 `*`일 수 있음) 당 한 행씩 존재합니다. |

레거시 키 `uiGlossaryFromStringsJson`도 여전히 허용되며 설정 로드 시 `uiGlossary`에 매핑됩니다.

빈 용어집 CSV 생성:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI 참조

| 명령어                                                                   | 설명                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | 시작 구성 파일을 작성합니다(`concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, `documentations[].injectTranslationMetadata` 포함). `--with-translate-ignore`는 시작용 `.translate-ignore` 파일을 생성합니다.                                                                            |
| `extract`                                                                 | 소스에서 `t("…")` 호출을 스캔하고 `strings.json`을 업데이트합니다. `features.extractUIStrings`가 필요합니다.                                                                                                                                                                                                    |
| `translate-docs …`                                                        | 각 `documentations` 블록에 대해 마크다운/MDX 및 JSON을 번역합니다(`contentPaths`, 선택적으로 `jsonSource` 포함). `-j`: 최대 병렬 로케일 수; `-b`: 파일당 최대 병렬 배치 API 호출 수. `--prompt-format`: 배치 전송 형식 (`xml` \| `json-array` \| `json-object`). [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags) 및 [배치 프롬프트 형식](#batch-prompt-format) 참조. |
| `translate-svg …`                                                         | `config.svg`에 구성된 독립형 SVG 자산을 번역합니다(문서와 별도). 문서와 동일한 캐시 개념을 사용하며, 해당 실행 시 SQLite 읽기/쓰기를 건너뛰기 위한 `--no-cache`를 지원합니다. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | UI 문자열만 번역합니다. `--force`: 기존 번역을 무시하고 로케일별로 모든 항목을 다시 번역합니다. `--dry-run`: 쓰기 작업 없음, API 호출 없음. `-j`: 최대 병렬 로케일 수. `features.translateUIStrings` 필요.                                                                                 |
| `sync …`                                                                  | 활성화된 경우 추출(extract)을 수행한 후 UI 번역, `config.svg`가 존재하면 `translate-svg`, 그 후 문서 번역을 수행합니다. `--no-ui`, `--no-svg`, `--no-docs`로 건너뛸 수 있습니다. 공유 플래그: `-l`, `-p`, `--dry-run`, `-j`, `-b`(문서 배치 전용), `--force` / `--force-update`(문서 전용; 문서 실행 시 상호 배타적).                         |
| `status`                                                                  | 파일 × 로케일별 마크다운 번역 상태를 표시합니다(`--locale` 필터 없음; 로케일은 구성에서 가져옴).                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | 먼저 `sync --force-update`를 실행합니다(추출, UI, SVG, 문서), 그 후 오래된 세그먼트 행(null `last_hit_at` 또는 빈 filepath)을 제거하고, 디스크상에 존재하지 않는 해결된 소스 경로를 가진 `file_tracking` 행을 삭제하며, `filepath` 메타데이터가 존재하지 않는 파일을 가리키는 번역 행을 제거합니다. 세 가지 개수(오래된, 고아 `file_tracking`, 고아 번역)를 기록합니다. `--no-backup`이 없으면 캐시 디렉터리 아래에 타임스탬프가 붙은 SQLite 백업을 생성합니다. |
| `editor [-p <port>] [--no-open]`                                          | 캐시, `strings.json`, 용어집 CSV를 위한 로컬 웹 에디터를 실행합니다. `--no-open`: 기본 브라우저를 자동으로 열지 않습니다.<br><br>**참고:** 캐시 에디터에서 항목을 편집한 경우, 업데이트된 캐시 항목으로 출력 파일을 다시 작성하려면 `sync --force-update`를 실행해야 합니다. 또한 소스 텍스트가 나중에 변경되면 새로운 캐시 키가 생성되므로 수동 편집은 사라집니다. |
| `glossary-generate [-o <path>]`                                           | 빈 `glossary-user.csv` 템플릿을 작성합니다. `-o`: 출력 경로를 재정의합니다(기본값: 구성의 `glossary.userGlossary`, 또는 `glossary-user.csv`).                                                                                                                                                |

모든 명령어는 비기본 설정 파일을 지정하기 위한 `-c <경로>`, 자세한 출력을 위한 `-v`, 그리고 콘솔 출력을 로그 파일로 복제하기 위한 `-w` / `--write-logs [경로]`를 지원합니다(기본 경로: 루트 `cacheDir` 아래).

---

## 환경 변수

| 변수                     | 설명                                                         |
| ------------------------ | ------------------------------------------------------------ |
| `OPENROUTER_API_KEY`     | **필수.** OpenRouter API 키입니다.                           |
| `OPENROUTER_BASE_URL`    | API 기본 URL을 재정의합니다.                                   |
| `I18N_SOURCE_LOCALE`     | 런타임 시 `sourceLocale`를 재정의합니다.                        |
| `I18N_TARGET_LOCALES`    | 쉼표로 구분된 로케일 코드로 `targetLocales`를 재정의합니다.     |
| `I18N_LOG_LEVEL`         | 로거 레벨(`debug`, `info`, `warn`, `error`, `silent`).        |
| `NO_COLOR`               | `1`일 경우 로그 출력에서 ANSI 색상을 비활성화합니다.           |
| `I18N_LOG_SESSION_MAX`   | 로그 세션당 유지되는 최대 줄 수(기본값 `5000`).                |
