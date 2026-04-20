<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: 시작하기

`ai-i18n-tools`는 두 가지 독립적이면서도 조합 가능한 워크플로우를 제공합니다:

- **워크플로우 1 - UI 번역**: JS/TS 소스 코드에서 `t("…")` 호출을 추출하고, OpenRouter를 통해 번역한 후 i18next에서 바로 사용할 수 있는 평면 구조의 언어별 JSON 파일을 생성합니다.
- **워크플로우 2 - 문서 번역**: 마크다운(MDX) 및 Docusaurus JSON 레이블 파일을 여러 로케일로 번역하며, 스마트 캐싱을 지원합니다. **SVG** 자산은 `features.translateSVG`, 최상위 `svg` 블록, 그리고 `translate-svg`를 사용합니다(자세한 내용은 [CLI 참조](#cli-reference) 참조).

두 워크플로우 모두 OpenRouter(호환 가능한 모든 LLM)를 사용하며, 하나의 설정 파일을 공유합니다.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [German](./GETTING_STARTED.de.md) · [Spanish](./GETTING_STARTED.es.md) · [French](./GETTING_STARTED.fr.md) · [Hindi](./GETTING_STARTED.hi.md) · [Japanese](./GETTING_STARTED.ja.md) · [Korean](./GETTING_STARTED.ko.md) · [Portuguese (BR)](./GETTING_STARTED.pt-BR.md) · [Chinese (CN)](./GETTING_STARTED.zh-CN.md) · [Chinese (TW)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [설치](#installation)
- [빠른 시작](#quick-start)
  - [권장 `package.json` 스크립트](#recommended-packagejson-scripts)
- [워크플로 1 - UI 번역](#workflow-1---ui-translation)
  - [1단계: 초기화](#step-1-initialise)
  - [2단계: 문자열 추출](#step-2-extract-strings)
  - [3단계: UI 문자열 번역](#step-3-translate-ui-strings)
  - [XLIFF 2.0으로 내보내기 (선택 사항)](#exporting-to-xliff-20-optional)
  - [4단계: 런타임에 i18next 연결](#step-4-wire-i18next-at-runtime)
  - [소스 코드에서 `t()` 사용하기](#using-t-in-source-code)
  - [보간](#interpolation)
  - [기수 복수형 (`plurals: true`)](#cardinal-plurals-plurals-true)
  - [언어 전환기 UI](#language-switcher-ui)
  - [RTL 언어](#rtl-languages)
- [워크플로 2 - 문서 번역](#workflow-2---document-translation)
  - [1단계: 문서용 초기화](#step-1-initialise-for-documentation)
  - [2단계: 문서 번역](#step-2-translate-documents)
    - [복잡한 마크다운 및 품질 검사 실패](#complex-markdown-and-failed-quality-checks)
    - [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags)
    - [배치 프롬프트 형식](#batch-prompt-format)
    - [SQLite의 세그먼트 중복 제거 및 경로](#segment-dedupe-and-paths-in-sqlite)
  - [출력 레이아웃](#output-layouts)
    - [평면 레이아웃의 앵커 링크](#anchor-links-in-flat-layout)
    - [`pathTemplate` / `jsonPathTemplate` 자리표시자](#pathtemplate--jsonpathtemplate-placeholders)
- [통합 워크플로 (UI + 문서)](#combined-workflow-ui--docs)
  - [혼합 문서 워크플로 (Docusaurus + 평면)](#mixed-documentation-workflow-docusaurus--flat)
- [번역 캐시 편집기](#translation-cache-editor)
  - [실패 (문서 번역)](#failures-document-translation)
    - [사용 시기](#when-to-use-it)
    - [소스 편집이 중요한 이유](#why-source-edits-matter)
    - [탭 사용 방법](#how-to-use-the-tab)
- [구성 참조](#configuration-reference)
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

<a id="installation"></a>
## 설치

배포된 패키지는 **ESM 전용**입니다. Node.js 또는 번들러에서 `import`/`import()`를 사용하세요. `require('ai-i18n-tools')`는 사용하지 마세요.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools는 자체 문자열 추출기를 포함합니다. 기존에 `i18next-scanner`, `babel-plugin-i18next-extract` 또는 유사한 도구를 사용했다면, 마이그레이션 후 해당 개발 의존성을 제거할 수 있습니다.

OpenRouter API 키를 설정하세요:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

또는 프로젝트 루트에 `.env` 파일을 생성하세요:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## 빠른 시작

기본 `init` 템플릿(`ui-markdown`)은 **UI** 추출 및 번역만을 활성화합니다. `ui-docusaurus` 템플릿은 **문서** 번역(`translate-docs`)을 활성화합니다. 설정에 따라 추출, UI 번역, 선택적 독립 SVG 번역, 문서 번역을 하나의 명령어로 실행하려면 `sync`를 사용하세요.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 권장 `package.json` 스크립트

패키지를 로컬로 설치한 후에는 CLI 명령어를 스크립트에서 직접 사용할 수 있습니다(`npx` 필요 없음):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## 워크플로 1 - UI 번역

i18next를 사용하는 모든 JS/TS 프로젝트를 위한 것입니다: React 앱, Next.js(클라이언트 및 서버 컴포넌트), Node.js 서비스, CLI 도구 등.

<a id="step-1-initialise"></a>
### 단계 1: 초기화

```bash
npx ai-i18n-tools init
```

이 명령어는 `ui-markdown` 템플릿으로 `ai-i18n-tools.config.json` 파일을 생성합니다. 다음 항목을 설정하려면 파일을 편집하세요:

- `sourceLocale` - 소스 언어 BCP-47 코드 (예: `"en-GB"`). 런타임 i18n 설정 파일(`src/i18n.ts` / `src/i18n.js`)에서 내보낸 `SOURCE_LOCALE`와 **일치해야 합니다**.
- `targetLocales` - 대상 언어의 BCP-47 코드 배열 (예: `["de", "fr", "pt-BR"]`). 이 목록에서 `ui-languages.json` 매니페스트를 생성하려면 `generate-ui-languages`을 실행하세요.
- `ui.sourceRoots` - `t("…")` 호출을 검색할 디렉터리 (예: `["src/"]`).
- `ui.stringsJson` - 마스터 카탈로그를 저장할 위치 (예: `"src/locales/strings.json"`).
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, 등을 어디에 작성할지 (예: `"src/locales/"`).
- `ui.preferredModel` (선택 사항) - `translate-ui`에 대해서만 **먼저** 시도할 OpenRouter 모델 ID; 실패 시 CLI는 중복을 건너뛰고 `openrouter.translationModels` (또는 레거시 `defaultModel` / `fallbackModel`)로 계속 진행합니다.

<a id="step-2-extract-strings"></a>
### 단계 2: 문자열 추출

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 하위의 모든 JS/TS 파일을 스캔하여 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. `ui.stringsJson`에 쓰거나 병합합니다.

스캐너는 구성이 가능합니다: `ui.reactExtractor.funcNames`을 통해 사용자 정의 함수 이름을 추가할 수 있습니다.

<a id="step-3-translate-ui-strings"></a>
### 단계 3: UI 문자열 번역

```bash
npx ai-i18n-tools translate-ui
```

`strings.json`을 읽고, 각 대상 로케일별로 OpenRouter에 배치를 전송하여 평면 JSON 파일(`de.json`, `fr.json` 등)을 `ui.flatOutputDir`에 씁니다. `ui.preferredModel`가 설정된 경우, `openrouter.translationModels`의 정렬된 목록보다 먼저 해당 모델을 시도합니다(문서 번역 및 기타 명령은 여전히 `openrouter`만 사용함).

각 항목에 대해, `translate-ui`은 선택적 `models` 객체에 각 로케일을 성공적으로 번역한 **OpenRouter 모델 ID**를 저장합니다(`translated`와 동일한 로케일 키 사용). 로컬 `editor` 명령에서 편집된 문자열은 해당 로케일의 `models`에 `user-edited`라는 센티넬 값으로 표시됩니다. `ui.flatOutputDir` 하위의 로케일별 평면 파일은 **원문 → 번역문**만 포함하며, `models`을 포함하지 않습니다(따라서 런타임 번들은 변경되지 않음).

> **캐시 편집기 사용 시 참고:** 캐시 편집기에서 항목을 편집한 경우, 업데이트된 캐시 항목으로 출력 파일을 다시 쓰기 위해 `sync --force-update`(또는 `--force-update`와 동등한 `translate` 명령)을 실행해야 합니다. 또한, 나중에 원문이 변경되면 수동 편집 내용이 손실된다는 점에 유의하세요. 새로운 원문 문자열에 대해 새로운 캐시 키(해시)가 생성되기 때문입니다.

<a id="exporting-to-xliff-20-optional"></a>
### XLIFF 2.0으로 내보내기(선택 사항)

UI 문자열을 번역 업체, TMS 또는 CAT 도구에 넘기기 위해 카탈로그를 **XLIFF 2.0** 형식으로 내보냅니다(대상 로케일당 하나의 파일). 이 명령은 **읽기 전용**입니다: `strings.json`을 수정하거나 API를 호출하지 않습니다.

```bash
npx ai-i18n-tools export-ui-xliff
```

기본적으로 파일은 `ui.stringsJson` 옆에 `strings.de.xliff`, `strings.pt-BR.xliff`(카탈로그의 기본 이름 + 로케일 + `.xliff`) 형태로 작성됩니다. 다른 위치에 쓰려면 `-o` / `--output-dir`를 사용하세요. `strings.json`의 기존 번역은 `<target>`에 나타나며, 누락된 로케일은 `state="initial"`을 사용하고 `<target>` 없이 표시되어 도구에서 채울 수 있습니다. `--untranslated-only`을 사용하면 각 로케일별로 아직 번역이 필요한 항목만 내보낼 수 있습니다(업체 배치에 유용함). `--dry-run`은 파일을 쓰지 않고 경로만 출력합니다.

<a id="step-4-wire-i18next-at-runtime"></a>
### 단계 4: 런타임에 i18next 연결

`'ai-i18n-tools/runtime'`이 내보내는 헬퍼를 사용하여 i18n 설정 파일을 만드세요:

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**세 값을 일치시켜 유지하세요:** `ai-i18n-tools.config.json`의 `sourceLocale`, 이 파일의 `SOURCE_LOCALE`, 그리고 평면 출력 디렉터리 아래에 `translate-ui`이 `{sourceLocale}.json`로 작성하는 복수형 평면 JSON (보통 `public/locales/`). 정적 `import`에서 동일한 기본 이름을 사용하세요 (위의 예: `en-GB` → `en-GB.json`). `sourcePluralFlatBundle`의 `lng` 필드는 `SOURCE_LOCALE`과 같아야 합니다. 정적 ES `import` 경로는 변수를 사용할 수 없습니다. 소스 로케일을 변경하는 경우 `SOURCE_LOCALE`과 가져오기 경로를 함께 업데이트하세요. 또는 동적 `import(\`을 사용하여 해당 파일을 로드하세요. ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, 또는 `readFileSync`처럼 경로가 `SOURCE_LOCALE`에서 생성되도록 합니다.

이 코드 조각은 `i18n`가 해당 폴더 옆에 위치하는 것처럼 `./locales/…`과 `./public/locales/…`을 사용합니다. 파일이 `src/` 아래에 있는 경우(일반적인 경우), `../locales/…`와 `../public/locales/…`를 사용하여 가져오기가 `ui.stringsJson`, `uiLanguagesPath`, `ui.flatOutputDir`와 동일한 경로를 참조하도록 하세요.

React가 렌더링하기 전에 `i18n.js`을 임포트하세요(예: 진입점 상단). 사용자가 언어를 변경하면 `await loadLocale(code)`을 호출한 후 `i18n.changeLanguage(code)`를 호출하세요.

`ui-languages.json`에서 `makeLocaleLoadersFromManifest`를 사용하여 파생함으로써 `localeLoaders`을 구성과 **일치시켜 유지하세요** (이 작업은 `makeLoadLocale`와 동일한 정규화를 사용하여 `SOURCE_LOCALE`를 필터링합니다). `targetLocales`에 로케일을 추가하고 `generate-ui-languages`을 실행하면 매니페스트가 업데이트되고 로더가 자동으로 변경 사항을 추적합니다. 별도의 하드코딩된 맵을 유지할 필요가 없습니다.

JSON 번들을 `public/` 아래에 두었다면(일반적인 Next.js 설정), 각 로더를 구현하여 공용 URL 경로에서 파일을 가져오도록 하세요. 예:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

이렇게 하면 브라우저가 정적 JSON을 로드할 수 있습니다.

번들러가 없는 Node CLI의 경우, 각 코드에 대해 JSON 파일을 읽고 파싱하는 작은 `makeFileLoader` 도우미 내에서 `readFileSync`을 사용하세요.

`SOURCE_LOCALE`은 다른 파일(예: 언어 전환기)에서 직접 `'./i18n'`을 통해 가져올 수 있도록 내보내집니다. 기존의 i18next 설정을 마이그레이션하는 경우, 컴포넌트 전반에 흩어진 하드코딩된 소스 로케일 문자열(예: `'en-GB'` 확인 코드)을 i18n 부트스트랩 파일에서 `SOURCE_LOCALE`을 가져오는 방식으로 대체하세요.

기본 내보내기를 사용하지 않고 이름을 지정해 가져오기를 선호하는 경우에도 이름 지정된 가져오기(`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`)가 동일하게 작동합니다.

`aiI18n.defaultI18nInitOptions(sourceLocale)`(또는 이름으로 가져올 경우 `defaultI18nInitOptions(sourceLocale)`)은 키를 기본값으로 사용하는 설정에 대한 표준 옵션을 반환합니다:

- `parseMissingKeyHandler`은 키 자체를 반환하므로 번역되지 않은 문자열은 소스 텍스트로 표시됩니다.
- `nsSeparator: false`은 콜론을 포함하는 키를 허용합니다.
- `interpolation.escapeValue: false` - 안전하게 비활성화 가능: React는 자체적으로 값을 이스케이프 처리하며, Node.js/CLI 출력에는 이스케이프할 HTML이 없습니다.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })`은 ai-i18n-tools 프로젝트에서 **권장되는** 연결 방식입니다. 키 자르기 + 소스 로케일 <code>{"{{var}}"}</code> 보간 폴백을 적용하며(하위 수준 `wrapI18nWithKeyTrim`과 동일한 동작), 선택적으로 `addResourceBundle`를 통해 `translate-ui` `{sourceLocale}.json` 복수형 접미사 키를 병합한 다음, `strings.json`에서 복수형 인식 `wrapT`를 설치합니다. 이 번들된 파일은 **구성된** 소스 로케일에 대한 복수형 평면이어야 하며, i18n 부트스트랩의 `ai-i18n-tools.config.json` 및 `SOURCE_LOCALE`와 동일한 `sourceLocale`이어야 합니다(위의 4단계 참조). 부트스트래핑 중일 때만 `sourcePluralFlatBundle`을 생략하세요(`translate-ui`이 `{sourceLocale}.json`을 출력한 후 병합하세요). 애플리케이션 코드에서는 `wrapI18nWithKeyTrim`만 사용하는 것이 **사용 중단됨** — 대신 `setupKeyAsDefaultT`를 사용하세요.

`makeLoadLocale(i18n, loaders, sourceLocale)`은 로케일에 대한 JSON 번들을 동적으로 가져와 i18next에 등록하는 비동기 `loadLocale(lang)` 함수를 반환합니다.

<a id="using-t-in-source-code"></a>
### 소스 코드에서 `t()` 사용

추출 스크립트가 이를 찾을 수 있도록 **리터럴 문자열**로 `t()`을 호출하세요:

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
- 키에 템플릿 리터럴 사용 금지: <code>{'t(`Hello ${name}`)'}</code>은 추출할 수 없습니다.

<a id="interpolation"></a>
### 보간

<code>{"{{var}}"}</code> 자리 표시자에 대해 i18next의 기본 두 번째 인수 보간을 사용하세요:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

추출 명령은 일반 객체 리터럴일 때 **두 번째 인수**를 구문 분석하고 `plurals: true` 및 `zeroDigit`과 같은 도구 전용 플래그를 읽습니다(아래 **카디널 복수형** 참조). 일반 문자열의 경우 해싱에는 리터럴 키만 사용되며, 보간 옵션은 여전히 런타임에 i18next로 전달됩니다.

프로젝트에서 사용자 지정 보간 유틸리티를 사용하는 경우(예: `t('key')`을 호출한 후 `interpolateTemplate(t('Hello {{name}}'), { name })`과 같은 템플릿 함수로 결과를 파이프 처리), `wrapI18nWithKeyTrim`을 통한 `setupKeyAsDefaultT`는 이를 불필요하게 만듭니다 — 소스 로케일이 원시 키를 반환할 때도 <code>{"{{var}}"}</code> 보간을 적용합니다. 호출 지점을 `t('Hello {{name}}', { name })`로 마이그레이션하고 사용자 지정 유틸리티를 제거하세요.

<a id="cardinal-plurals-plurals-true"></a>
### 기수 복수형(`plurals: true`)

개발자 기본 사본으로 원하는 **동일한 리터럴**을 사용하고, 추출 + `translate-ui`이 호출을 하나의 **기수 복수형 그룹**으로 처리하도록 `plurals: true`을 전달하세요 (i18next JSON v4 스타일 `_zero` … `_other` 형태).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (선택 사항) — 도구 전용이며, i18next에서 **읽지 않음**. `true`인 경우, 해당 형태가 존재하는 각 로케일의 `_zero` 문자열에서 리터럴 아랍어 `0` 사용을 선호하도록 프롬프트에 지시함. `false`이거나 생략된 경우, 자연스러운 0 표현 방식을 사용함. `i18next.t` 호출 전에 이러한 키를 제거해야 함 (아래의 `wrapT` 참조).

**검증:** 메시지에 **두 개 이상**의 서로 다른 `{{…}}` 자리 표시자가 포함된 경우, **그 중 하나는 반드시 `{{count}}`** 이어야 합니다(복수형 축). 그렇지 않으면 `extract`가 명확한 파일/줄 메시지와 함께 **실패합니다**.

**두 개의 독립적인 수치**(예: 섹션 및 페이지)는 하나의 복수형 메시지를 공유할 수 없습니다. UI에서 연결하여 사용하려면 각각 `plurals: true`과 자체 `count`를 가진 **두 개**의 `t()` 호출을 사용해야 합니다.

**복수 그룹은** `strings.json`에서 **해시당 한 행**을 사용하며, `"plural": true`, 원본 리터럴은 `source`에, 그리고 `translated[locale]`은 기수 범주(`zero`, `one`, `two`, `few`, `many`, `other`)를 해당 로케일의 문자열에 매핑하는 객체로 표현됩니다.

**평탄화된 로케일 JSON:** 단수형 행은 **원문 문장 → 번역문** 형태를 유지함. 복수형 행은 i18next가 복수형을 네이티브로 해석할 수 있도록, `<groupId>_original` (참조용으로 `source`과 동일함)과 각 접미사에 대한 `<groupId>_<form>`로 출력됨. `translate-ui`는 또한 **복수형 평탄화 키만** 포함하는 `{sourceLocale}.json`를 작성함 (소스 언어용 번들을 로드하여 접미사 키가 해석되도록 함; 일반 문자열은 여전히 키를 기본값으로 사용함). 각 대상 로케일에 대해 출력된 접미사 키는 해당 로케일의 `Intl.PluralRules` (`requiredCldrPluralForms`)와 일치함: `strings.json`이 압축 후 다른 범주와 동일하여 범주를 생략한 경우(예: 아랍어 `many`이 `other`과 동일한 경우), `translate-ui`는 여전히 대체 문자열에서 복사하여 필요한 모든 접미사를 평탄화 파일에 기록하므로 런타임 조회 시 키 누락이 발생하지 않음.

런타임(`ai-i18n-tools/runtime`): **호출** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — `wrapI18nWithKeyTrim`를 실행하고, 선택적 `translate-ui` `{sourceLocale}.json` 복수형 번들을 등록한 후 `wrapT`를 `buildPluralIndexFromStringsJson(stringsJson)`를 사용하여 수행함. `wrapT`는 `plurals` / `zeroDigit`를 제거하고, 필요 시 키를 그룹 ID로 재작성하며, `count`를 전달함 (선택 사항: 단일 비-`{{count}}` 자리표시자가 있는 경우, `count`는 해당 숫자 옵션에서 복사됨).

**이전 환경:** 도구 및 일관된 동작을 위해 `Intl.PluralRules`이 필요합니다. 매우 오래된 브라우저를 대상으로 할 경우 폴리필을 사용하세요.

**v1에는 없음:** 서수 복수형(`_ordinal_*`, `ordinal: true`), 구간 복수형, ICU 전용 파이프라인.

<a id="language-switcher-ui"></a>
### 언어 전환기 UI

언어 선택기를 만들기 위해 `ui-languages.json` 매니페스트를 사용하세요. `ai-i18n-tools`는 두 개의 표시 헬퍼를 내보냅니다:

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

`getUILanguageLabel(lang, t)` - 번역되었을 때 `t(englishName)`을 표시하고, 두 값이 다를 경우 `englishName / t(englishName)`를 표시합니다. 설정 화면에 적합합니다.

`getUILanguageLabelNative(lang)` - `englishName / label`을 표시합니다(`t()` 호출 없이 각 행에 대해). 헤더 메뉴에서 네이티브 이름을 표시하고자 할 때 적합합니다.

`ui-languages.json` 매니페스트는 <code>{"{ code, label, englishName, direction }"}</code> 항목의 JSON 배열입니다(`direction`은 `"ltr"` 또는 `"rtl"`). 예시:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

매니페스트는 `sourceLocale` + `targetLocales` 및 번들된 마스터 카탈로그에서 `generate-ui-languages`에 의해 생성되며, `ui.flatOutputDir`에 기록됩니다. 구성에서 로케일을 변경한 경우 `generate-ui-languages`를 실행하여 `ui-languages.json` 파일을 업데이트하세요.

<a id="rtl-languages"></a>
### RTL 언어

`ai-i18n-tools`는 `getTextDirection(lng)` 및 `applyDirection(lng)`를 내보냅니다:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection`는 브라우저에서 `document.documentElement.dir`을 설정하거나, Node.js에서는 아무 작업도 하지 않습니다. 특정 요소를 대상으로 하려면 선택적 인수 `element`를 전달하세요.

`→` 화살표를 포함할 수 있는 문자열의 경우 RTL 레이아웃에 맞춰 방향을 반전하세요:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## 워크플로 2 - 문서 번역

마크다운 문서, Docusaurus 사이트 및 JSON 레이블 파일을 위해 설계되었습니다. 독립형 SVG 자산은 `documentations[].contentPaths`을 통한 것이 아니라, `features.translateSVG`이 활성화되고 최상위 `svg` 블록이 설정된 경우 [`translate-svg`](#cli-reference)를 통해 번역됩니다.

<a id="step-1-initialise-for-documentation"></a>
### 단계 1: 문서용 초기화

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

생성된 `ai-i18n-tools.config.json`을 편집하세요:

- `sourceLocale` - 소스 언어 (`docusaurus.config.js`의 `defaultLocale`와 일치해야 함).
- `targetLocales` - BCP-47 로케일 코드 배열 (예: `["de", "fr", "es"]`).
- `cacheDir` - 모든 문서 파이프라인에 공유되는 SQLite 캐시 디렉터리 (및 `--write-logs`의 기본 로그 디렉터리).
- `documentations` - 문서 블록 배열. 각 블록은 선택적 `description`, `contentPaths`, `outputDir`, 선택적 `jsonSource`, `markdownOutput`, 선택적 `segmentSplitting`, `targetLocales`, `addFrontmatter` 등을 포함합니다.
- `documentations[].description` - 유지 관리자를 위한 선택적 간단한 메모 (이 블록의 범위). 설정 시 `translate-docs` 제목 (`🌐 …: translating …`) 및 `status` 섹션 헤더에 표시됩니다.
- `documentations[].contentPaths` - 마크다운/MDX 소스 디렉터리 또는 파일 (JSON 레이블은 `documentations[].jsonSource` 참조).
- `documentations[].outputDir` - 해당 블록의 번역된 출력 루트.
- `documentations[].markdownOutput.style` - `"nested"` (기본값), `"docusaurus"`, 또는 `"flat"` ([출력 레이아웃](#output-layouts) 참조).

<a id="step-2-translate-documents"></a>
### 단계 2: 문서 번역

```bash
npx ai-i18n-tools translate-docs
```

이 작업은 각 `documentations` 블록의 `contentPaths`에 있는 모든 파일을 모든 유효한 문서 로케일로 번역합니다(`targetLocales`가 설정된 경우 각 블록의 로케일을 통합하고, 그렇지 않으면 루트 `targetLocales` 사용). 이미 번역된 세그먼트는 SQLite 캐시에서 제공되며, 새로 추가되거나 변경된 세그먼트만 LLM으로 전송됩니다.

단일 로케일을 번역하려면:

```bash
npx ai-i18n-tools translate-docs --locale de
```

번역이 필요한 항목을 확인하려면:

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### 복잡한 마크다운 및 품질 검사 실패

`translate-docs`은 각 번역된 구문이 문서에서 파싱된 강조 표현을 포함한 마크다운 구조를 유지하는지 확인합니다. 여러 `bold` 범위가 연속된 문단이나 `` `inline code` `` 주위에 백틱을 굵은 글씨 안에 중첩한 경우(예: `` `fetch(\`/locales/${code}.json\`)` `` 같은 템플릿 리터럴), 또는 긴 문장 전체에 걸쳐 굵은 글씨와 코드를 교차 사용하는 경우는 취약합니다. 일부 로케일은 다른 어순이 필요할 수 있으므로 번역 후 `**`와 `` ` ``의 위치가 달라질 수 있으며, 이로 인해 `AST mismatch` 같은 CLI 오류가 발생할 수 있습니다.

**이러한 유형의 검증 오류가 발생하면 원문 텍스트를 단순화하는 것이 더 낫습니다** — 단락을 분할하거나, 예제를 코드 블록으로 옮기거나, 볼드/코드 쌍을 덜 사용하여 동일한 아이디어를 설명하세요 — 밀집된 인라인 마크업을 모든 모델과 로케일이 완벽하게 재현하도록 기대하기보다는 이렇게 하세요. 이 페이지의 다른 부분(특히 `SOURCE_LOCALE`, 로더, `public/` 경로에 대한 4단계의 설명 등)은 의도적으로 현실적인 형식을 사용하고 있지만, 자신의 문서에서 유사한 표현을 재사용할 때는 번역 범위가 넓어질 경우 더 단순하게 유지하세요.

**어떤 세그먼트가 실패했는지**, 얼마나 자주 실패했는지, 저장된 **품질/오류 메시지**를 확인하려면 번역 캐시 편집기의 **실패** 탭을 사용하세요 ([번역 캐시 편집기 → 실패](#translation-cache-editor-failures)).

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### 캐시 동작 및 `translate-docs` 플래그

CLI는 SQLite에 **파일 추적**(파일별 소스 해시 × 로캘) 및 **세그먼트** 행(번역 가능한 청크별 해시 × 로캘)을 저장합니다. 일반 실행 시 추적된 해시가 현재 소스와 일치하고 **그리고** 출력 파일이 이미 존재하면 해당 파일을 완전히 건너뜁니다. 그렇지 않은 경우 파일을 처리하며 세그먼트 캐시를 사용하여 변경되지 않은 텍스트는 API를 호출하지 않습니다.

| 플래그                          | 효과                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(기본값)*                   | 추적 정보와 디스크상 출력이 일치할 경우 변경되지 않은 파일 건너뛰기; 나머지에는 세그먼트 캐시 사용.                                                                                                                                                                              |
| `-l, --locale <codes>`        | 쉼표로 구분된 대상 로케일(생략 시 루트 `targetLocales`과 각 `documentations[]` 블록의 선택적 `targetLocales`의 통합값을 기본값으로 사용).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | 이 경로 아래의 마크다운/JSON만 번역(프로젝트 기준 또는 절대 경로); `--file`는 `--path`의 별칭입니다.                                                                                                                                                         |
| `--dry-run`                   | 파일 쓰기 및 API 호출 없음.                                                                                                                                                                                                                                        |
| `--type <kind>`               | `markdown` 또는 `json`로 제한(구성에서 활성화된 경우 둘 다가 기본값).                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | JSON 레이블 파일만 번역하거나, JSON은 건너뛰고 마크다운만 번역합니다.                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | 최대 병렬 대상 로케일 수 (기본값은 설정 또는 CLI의 기본값에서 가져옴).                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | 파일당 최대 병렬 배치 API 호출 수 (문서 기준; 기본값은 설정 또는 CLI에서 가져옴).                                                                                                                                                                                               |
| `--emphasis-placeholders`     | 번역 전 마크다운 강조 표시자를 플레이스홀더로 마스킹합니다 (선택 사항; 기본값 꺼짐).                                                                                                                                                                              |
| `--debug-failed`              | 검증에 실패할 경우 `FAILED-TRANSLATION` 로그를 `cacheDir` 아래에 자세히 기록합니다.                                                                                                                                                                                        |
| `--force-update`              | 파일 추적이 건너뛸 수 있어도 일치하는 모든 파일을 다시 처리합니다 (추출, 재조합, 출력 쓰기). **세그먼트 캐시는 여전히 적용됩니다** — 변경되지 않은 세그먼트는 LLM에 전송되지 않습니다.                                                                                    |
| `--force`                     | 처리된 각 파일에 대한 파일 추적을 지우고 API 번역을 위해 **세그먼트 캐시를 읽지 않습니다** (완전한 재번역). 새 결과는 여전히 **세그먼트 캐시에 기록됩니다**.                                                                                 |
| `--stats`                     | 세그먼트 수, 추적된 파일 수, 로케일별 세그먼트 총합을 출력한 후 종료합니다.                                                                                                                                                                                    |
| `--clear-cache [locale]`      | 캐시된 번역(및 파일 추적)을 삭제합니다: 모든 로케일 또는 단일 로케일만 삭제한 후 종료합니다.                                                                                                                                                                             |
| `--prompt-format <mode>`      | 각 **배치**의 세그먼트가 모델에 전송되고 파싱되는 방식 (`xml`, `json-array`, 또는 `json-object`). 기본값은 `json-array`. 추출, 자리표시자, 검증, 캐시, 대체 동작에는 영향을 주지 않음 — [배치 프롬프트 형식](#batch-prompt-format) 참조. |

`--force`과(와) `--force-update`을 조합할 수 없습니다 (서로 배타적입니다).

<a id="batch-prompt-format"></a>
#### 일괄 프롬프트 형식

`translate-docs`은 번역 가능한 세그먼트를 OpenRouter에 **배치** 단위로 전송함 (`batchSize` / `maxBatchChars` 기준으로 그룹화됨). `--prompt-format` 플래그는 해당 배치의 **전송 형식**만 변경함; `PlaceholderHandler` 토큰, 마크다운 AST 검사, SQLite 캐시 키, 배치 파싱 실패 시 세그먼트별 대체 동작은 변경되지 않음.

| 모드                       | 사용자 메시지                                                           | 모델 응답                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 의사-XML: 세그먼트당 하나의 `<seg id="N">…</seg>` (XML 이스케이프 포함). | 세그먼트 인덱스당 하나씩, `<t id="N">…</t>` 블록만 포함.       |
| `json-array` (기본값) | 순서대로 세그먼트당 하나의 항목을 가진 문자열의 JSON 배열.               | **동일한 길이**의 JSON 배열 (동일한 순서).           |
| `json-object`          | 세그먼트 인덱스로 키가 지정된 JSON 객체 `{"0":"…","1":"…",…}`.            | **동일한 키**를 가지고 번역된 값을 포함하는 JSON 객체. |

실행 헤더는 활성 모드를 확인할 수 있도록 `Batch prompt format: …`도 출력합니다. JSON 레이블 파일(`jsonSource`)과 독립형 SVG 배치는 이러한 단계가 `translate-docs`의 일부로 실행될 때 동일한 설정을 사용합니다(또는 `sync`의 docs 단계 — `sync`는 이 플래그를 노출하지 않으며 기본값은 `json-array`입니다).

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### 세그먼트 중복 제거 및 SQLite의 경로

- 세그먼트 행은 전역적으로 `(source_hash, locale)`(해시 = 정규화된 콘텐츠)를 키로 사용합니다. 두 파일에 동일한 텍스트가 있으면 하나의 행을 공유하며, `translations.filepath`은 메타데이터(최종 작성자)이며 파일당 두 번째 캐시 항목이 아닙니다.
- `file_tracking.filepath`는 네임스페이스가 지정된 키를 사용합니다. `documentations` 블록당 `doc-block:{index}:{relPath}` (`relPath`는 프로젝트 루트 기준 posix 경로임: 수집된 마크다운 경로; **JSON 레이블 파일은 소스 파일에 대한 현재 작업 디렉터리 기준 상대 경로를 사용함**, 예: `docs-site/i18n/en/code.json`. 따라서 정리 작업이 실제 파일을 확인할 수 있음) 및 `translate-svg` 아래의 독립형 SVG 자산에 대한 `svg-assets:{relPath}`.
- `translations.filepath`는 마크다운, JSON 및 SVG 세그먼트에 대해 현재 작업 디렉터리 기준 posix 상대 경로를 저장합니다(SVG는 다른 자산과 동일한 경로 형식을 사용함; `svg-assets:…` 접두사는 **오직** `file_tracking`에만 존재함).
- 실행 후 `last_hit_at`는 **동일한 번역 범위 내**에서(`--path` 및 활성화된 종류를 고려하여) 접근되지 않은 세그먼트 행에 대해서만 지워지므로, 필터링되거나 문서 전용 실행 시 관련 없는 파일이 오래되었다고 표시되지 않습니다.

<a id="output-layouts"></a>
### 출력 레이아웃

`"nested"` (생략 시 기본값) — `{outputDir}/{locale}/` 아래에 소스 트리를 미러링합니다(예: `docs/guide.md` → `i18n/de/docs/guide.md`).

`"docusaurus"` — 일반적인 Docusaurus i18n 레이아웃과 일치하도록 `docsRoot` 아래에 있는 파일을 `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`에 배치합니다. `documentations[].markdownOutput.docsRoot`을 문서 소스 루트로 설정하세요(예: `"docs"`).

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 번역된 파일을 소스 옆에 로케일 접미어를 붙여 배치하거나 하위 디렉터리에 배치합니다. 페이지 간 상대 링크는 자동으로 재작성됩니다.

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### 평면 레이아웃의 앵커 링크

평면 출력은 각 로캘에 대해 페이지 간의 **상대 경로**를 다시 작성합니다(`guide.md` → `guide.de.md`). **앵커 링크** — 경로 뒤에 `#`가 오는 일반적인 마크다운 인라인 형식 — 는 대상 파일 내 섹션으로 이동합니다:

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

여기서 링크 대상은 `setup.md`이며, `#first-run`은 앵커입니다. 해당 파일 내 적절한 제목으로 스크롤되어야 합니다.

**왜 앵커 링크에 주의가 필요한가**

- `rewriteRelativeLinks`은 각 로캘의 **파일명**을 고정합니다(`setup.md` → `setup.de.md`).
- 많은 렌더러는 **보이는 제목 텍스트**에서 `#` 슬러그를 유도합니다. 번역 후 제목은 로캘별로 달라지므로 자동 생성된 슬러그는 변경될 수 있지만, 다시 작성된 링크는 여전히 `#first-run`라고 표시될 수 있습니다. 또는 영어 `#…` 앵커가 번역된 제목에서 렌더러가 생성한 슬러그와 더 이상 일치하지 않을 수 있습니다.
- 결과: 독자는 올바른 **파일**에는 도달하지만 **잘못된 줄**에 도달하거나, 브라우저가 일치하는 제목을 찾지 못합니다.

**해야 할 조치**

1. `translate-docs` **이전에** `documentations[]` / `contentPaths`와 동일한) **소스** `.md` / `.mdx`에 대해 `ai-i18n-tools write-heading-ids`을 실행하세요. 그러면 각 제목 바로 전 줄에 명시적인 HTML 앵커를 삽입하여 `id` 값이 모든 번역본에서 공유됩니다.
2. 마크다운 **앵커 링크**를 이러한 안정적인 ID를 가리키도록 설정하세요. 예: `[label](../other.md#section-id)`, 여기서 `section-id`은 도구가 작성한 앵커와 일치해야 하며, 영어 단어만으로 추측한 값이 아니어야 합니다.

**예시**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`write-heading-ids` 후의 `docs/security.md` (간소화됨):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

`translate-docs` 후, 파일 경로와 `#…` 앵커는 모든 로캘 파일에서 일치하게 유지됩니다. 예를 들어:

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` 앵커는 소스에서 `id`이 고정되어 있으므로 모든 로캘에서 동일합니다. 제목의 **텍스트**와 링크 **레이블**만 번역됩니다.

<a id="markdown-output-path-template-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` 플레이스홀더

`documentations[].markdownOutput.pathTemplate`(마크다운 및 MDX) 또는 `jsonPathTemplate`(JSON 레이블 파일)을 설정하여 번역된 파일이 작성되는 위치를 재정의할 수 있습니다. 두 옵션 모두 동일한 플레이스홀더를 사용합니다. 해결된 경로는 해당 블록의 `outputDir` 내에 있어야 합니다(CLI는 이를 벗어나는 경로를 거부합니다).

사용자 정의 `pathTemplate`을 사용하는 경우, 명시적으로 설정하지 않으면 `rewriteRelativeLinks`은 기본적으로 `false`가 됩니다 — 평면 스타일 링크 재작성은 기본 `flat` 레이아웃을 위해 설계되었습니다.

| 플레이스홀더 | 역할 | 예시 |
|-------------|------|---------|
| `{outputDir}` | 이 문서 블록의 `outputDir`에 대한 절대 해결 경로 | `/home/acme/repo/i18n` |
| `{locale}` | 대상 로캘 코드(설정/CLI에서와 동일한 형식) | `de`, `pt-BR` |
| `{LOCALE}` | 동일한 로캘을 대문자로 표기 | `DE`, `PT-BR` |
| `{relPath}` | 프로젝트 루트를 기준으로 한 소스 파일 경로, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | 파일 이름 **확장자 없이** | `guide`에 대한 `docs/guide.md` |
| `{basename}` | 파일 이름 **와** 확장자 | `guide.md` |
| `{extension}` | 확장자 (점 포함) **including** the dot | `.md`, `.mdx` |
| `{docsRoot}` | `markdownOutput.docsRoot`의 절대 해결된 경로 (생략 시 기본값 `docs`) | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | 경로 문자열이 일치할 경우 일치하는 `docsRoot` 접두사가 제거된 `{relPath}` (POSIX 기준); 그렇지 않으면 변경 없음 | `docs/guide.md` (일반적); 접두사 제거가 적용될 때만 `guide.md` |

**예시**

설정 조각:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

로케일 `de`, 소스 `docs/guide.md`, 프로젝트 루트 `/home/acme/repo`, 그리고 `outputDir`이(가) `/home/acme/repo/i18n`로 해결되는 경우, 확장된 경로는 다음과 같습니다:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`flat` 스타일 패턴 중 파일 이름만 유지하는 것은 `{stem}`과 `{extension}`를 사용할 수 있으며, 예를 들어 `{outputDir}/{stem}.{locale}{extension}`는 해결된 `outputDir` 하에서 `…/guide.de.md`를 생성합니다.

---

<a id="combined-workflow-ui--docs"></a>
## 통합 워크플로우 (UI + 문서)

단일 구성에서 모든 기능을 활성화하여 두 워크플로우를 함께 실행합니다:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
    "translateSVG": false
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

`glossary.uiGlossary`은 문서 번역을 UI와 동일한 `strings.json` 카탈로그를 가리키도록 하여 용어의 일관성을 유지합니다. `glossary.userGlossary`는 제품 용어에 대한 CSV 오버라이드를 추가합니다.

`npx ai-i18n-tools sync`을 실행하여 하나의 파이프라인을 실행합니다: **추출** UI 문자열(만약 `features.extractUIStrings` 설정 시), **번역 UI** 문자열(만약 `features.translateUIStrings` 설정 시), **독립형 SVG 자산 번역** (만약 `features.translateSVG` 및 `svg` 블록이 설정된 경우), 그 후 **문서 번역** (각 `documentations` 블록: 구성된 대로 마크다운/JSON 처리). `--no-ui`, `--no-svg`, 또는 `--no-docs`로 일부 단계를 건너뛸 수 있습니다. 문서 단계는 `--dry-run`, `-p` / `--path`, `--force`, 및 `--force-update`를 허용합니다(마지막 두 옵션은 문서 번역 실행 시에만 적용되며, `--no-docs`를 전달하면 무시됨).

`documentations[].targetLocales` 블록에서 **더 작은 하위 집합**으로 해당 블록 파일을 번역하여 UI보다 제한된 로케일로 문서를 번역할 수 있습니다(효과적인 문서 로케일은 블록 간의 **합집합**입니다):

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### 혼합 문서 워크플로우 (Docusaurus + 평면 구조)

`documentations`에 두 개 이상의 항목을 추가하여 동일한 구성에서 여러 문서 파이프라인을 결합할 수 있습니다. 이 설정은 프로젝트에 Docusaurus 사이트와 함께 루트 수준의 마크다운 파일(예: 저장소의 README)이 있으며, 이 파일들을 평면 출력으로 번역해야 할 때 일반적으로 사용됩니다.

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus docs and JSON labels",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

`npx ai-i18n-tools sync`으로 실행할 경우:

- UI 문자열은 `src/`에서 `public/locales/`로 추출/번역됩니다.
- 첫 번째 문서 블록은 마크다운 및 JSON 레이블을 Docusaurus `i18n/<locale>/...` 레이아웃으로 번역합니다.
- 두 번째 문서 블록은 `README.md`을 `translated-docs/` 아래에 로케일 접미어가 붙은 평면 파일로 번역합니다.
- 모든 문서 블록은 `cacheDir`를 공유하므로, 변경되지 않은 세그먼트가 실행 간에 재사용되어 API 호출과 비용을 줄입니다.

---

<a id="translation-cache-editor"></a>
## 번역 캐시 편집기

실행:

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

이 명령은 구성된 **`cacheDir`** SQLite 데이터베이스를 기반으로 로컬 웹 UI를 시작합니다. CLI가 문서 세그먼트, 로그 및 관련 메타데이터에 사용하는 동일한 폴더입니다. **문서** (캐시된 문서 세그먼트), **UI 문자열**, **UI 복수형**, **용어집**, **실패**, **통계** 탭을 포함합니다.

이 앱에서 캐시 행(**예: 문서 세그먼트**)을 편집하는 경우, 디스크에 저장된 출력 결과가 캐시와 일치하도록 `sync --force-update` 또는 `--force-update`과 동일한 번역 명령을 실행하세요. 이후 저장소의 **원본 텍스트**가 변경되면 세그먼트 해시도 변경되며, 이전 텍스트에 대한 수동 편집 내용은 더 이상 유효하지 않게 됩니다.

<a id="translation-cache-editor-failures"></a>
### 실패 (문서 번역)

**실패** 탭은 **문서** 번역 전용입니다. 로케일별로 세그먼트 번역에 실패했을 때(예: 빈 출력 또는 잘못된 모델 출력, 번역 후 검증 오류(`AST mismatch`, 자리 표시자 누수 등 **품질** 검사), 또는 진행을 차단하는 **치명적** 오류) SQLite에 기록된 실패 기록을 읽어옵니다. 이를 통해 다음 질문에 답할 수 있습니다: *어느 원본 세그먼트가 어떤 로케일과 모델에서 오류가 발생했으며, 어떤 오류 메시지가 기록되었는가?*

<a id="when-to-use-it"></a>
#### 언제 사용해야 하나요

- `translate-docs` 또는 `sync` 실행 후 오류, 부분적으로 완료된 로케일, 혹은 혼란스러운 로그가 발생했을 때 — 터미널 출력만 스크롤하는 대신 실패 내역을 정렬하고 필터링할 수 있습니다.
- **재작업 우선순위**를 정하고 싶을 때: **실패 횟수**로 정렬하면 재시도 시 반복적으로 실패한 세그먼트가 먼저 표시됩니다. 이러한 세그먼트는 향후 실행 시 성공 가능성을 높이기 위해 원본 마크다운에서 **간소화하거나 재구성**하는 후보가 됩니다.
- 정확한 **세그먼트** 정보(파일 경로, 라인 힌트, 원본 해시, 전체 원본 텍스트)가 필요할 때 — 저장소에서 올바른 단락을 편집할 수 있습니다.

<a id="why-source-edits-matter"></a>
#### 원본 편집이 중요한 이유

인라인 마크업이 복잡할 경우(**볼드**와 `` `code` ``가 혼합되거나, 강조가 중첩되거나, 많은 스팬을 포함한 긴 문장 등) 모델이 구조적 검사를 통과하는 번역을 반환하기 어려워집니다. **여러 번 실패 기록**이 있는 세그먼트는 원본 텍스트를 그대로 두고 번역을 다시 실행하는 것보다, 원본을 **다시 작성하거나 분할**하거나 예제를 fenced 코드 블록으로 옮기는 것이 더 큰 개선을 이룹니다. 이는 [복잡한 마크다운 및 실패한 품질 검사](#complex-markdown-and-failed-quality-checks)와 일치합니다.

<a id="how-to-use-the-tab"></a>
#### 탭 사용 방법

1. **실패**를 편집기에서 엽니다 ( [번역 캐시 편집기](#translation-cache-editor)와 동일한 브라우저 세션).
2. **요약** 스트립을 읽습니다 (실패가 있는 세그먼트와 **1**, **2**, 또는 **3+** 실패 기록이 있는 세그먼트의 수).
3. 부분 **파일 이름**, **로케일**, **모델**, **품질 오류** (값은 캐시에서 가져옴), **치명적만**, 선택적 **소스 해시**, **소스 텍스트**, 또는 **오류 메시지** 부분 문자열로 필터링한 후 **적용**를 클릭합니다.
4. **정렬: # 실패** (기본값) 또는 **정렬: 파일 경로 + 줄 번호**를 선택합니다.
5. 테이블 상단 또는 하단의 페이지네이션을 사용하세요. **행 클릭**으로 전체 원본 텍스트를 토글할 수 있습니다. 활성화된 경우 행의 링크 컨트롤은 `ai-i18n-tools editor`가 실행 중인 **터미널**로 파일/라인 힌트를 기록하도록 서버 프로세스에 요청합니다 — 브라우저에서 편집기로 이동할 때 유용합니다.
6. 프로젝트의 **원본 파일**을 수정한 후 `translate-docs` 또는 `sync`를 다시 실행하세요. 성공적인 실행 후에도 목록이 **오래된 것처럼** 보이면 `ai-i18n-tools sync --force-update`을 실행하고 에디터를 새로고침하세요(실패 패널에 동일한 힌트가 표시됨).

UI와 병행하여 파일 기반 디버깅이 필요한 경우, 여전히 재시도 중 `translate-docs --debug-failed`를 사용해 `cacheDir` 아래에 `FAILED-TRANSLATION` 세부 정보를 기록할 수 있습니다 — [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags) 참조.

---

<a id="configuration-reference"></a>
## 구성 참조

<a id="sourcelocale"></a>
### `sourceLocale`

소스 언어의 BCP-47 코드(예: `"en-GB"`, `"en"`, `"pt-BR"`). 이 로케일에 대해서는 번역 파일이 생성되지 않으며, 키 문자열 자체가 소스 텍스트입니다.

**일치해야 함** 런타임 i18n 설정 파일(`src/i18n.ts` / `src/i18n.js`)에서 내보낸 `SOURCE_LOCALE`과.

<a id="targetlocales"></a>
### `targetLocales`

번역할 BCP-47 로캘 코드 배열 (예: `["de", "fr", "es", "pt-BR"]`).

`targetLocales`은 UI 번역을 위한 기본 로캘 목록이자 문서 블록의 기본 로캘 목록입니다. `sourceLocale` + `targetLocales`에서 `ui-languages.json` 매니페스트를 생성하려면 `generate-ui-languages`을 사용하세요.

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath` (선택 사항)

표시 이름, 로캘 필터링 및 언어 목록 후처리에 사용되는 `ui-languages.json` 매니페스트의 경로입니다. 생략하면 CLI는 `ui.flatOutputDir/ui-languages.json` 위치에서 매니페스트를 찾습니다.

다음과 같은 경우에 사용하세요:

- 매니페스트가 `ui.flatOutputDir` 외부에 있으며 CLI가 명시적으로 참조할 수 있도록 경로를 지정해야 할 때.
- `markdownOutput.postProcessing.languageListBlock`이 매니페스트에서 로캘 레이블을 생성하도록 하려는 경우.
- `extract`가 매니페스트의 `englishName` 항목을 `strings.json`에 병합하도록 하려는 경우 (`ui.reactExtractor.includeUiLanguageEnglishNames: true` 필요).

<a id="concurrency-optional"></a>
### `concurrency` (선택 사항)

동시에 번역되는 최대 **대상 로캘** 수 (`translate-ui`, `translate-docs`, `translate-svg`, 및 `sync` 내 해당 단계). 생략 시 CLI는 UI 번역에 **4**, 문서 번역에 **3**를 사용합니다 (내장 기본값). 실행 시 `-j` / `--concurrency`로 재정의할 수 있습니다.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (선택 사항)

**translate-docs** 및 **translate-svg** (그리고 `sync`의 문서 번역 단계): 파일당 최대 병렬 OpenRouter **배치** 요청 수 (각 배치는 여러 세그먼트를 포함할 수 있음). 생략 시 기본값은 **4**입니다. `translate-ui`에서는 무시됩니다. `-b` / `--batch-concurrency`로 재정의할 수 있습니다. `sync`에서는 `-b`가 문서 번역 단계에만 적용됩니다.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (선택 사항)

문서 번역을 위한 세그먼트 배치: 요청당 세그먼트 수와 문자 수 상한. 기본값: **20** 세그먼트, **4096** 문자 (생략 시).

<a id="openrouter"></a>
### `openrouter`

| 필드               | 설명                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | OpenRouter API 기본 URL. 기본값: `https://openrouter.ai/api/v1`.                                                                                                                                                |
| `translationModels` | 선호하는 모델 ID의 우선 순위 목록. 첫 번째 모델부터 시도하며, 오류 발생 시 이후 모델이 대체로 사용됩니다. `translate-ui` 전용으로, `ui.preferredModel`를 설정하여 이 목록 이전에 하나의 모델을 먼저 시도할 수도 있습니다 (`ui` 참조). |
| `defaultModel`      | 레거시 단일 기본 모델. `translationModels`이 설정되지 않았거나 비어 있을 때만 사용됩니다.                                                                                                                               |
| `fallbackModel`     | 레거시 단일 대체 모델. `translationModels`이 설정되지 않았거나 비어 있을 때 `defaultModel` 이후에 사용됩니다.                                                                                                              |
| `maxTokens`         | 요청당 최대 완성 토큰 수. 기본값: `8192`.                                                                                                                                                              |
| `temperature`       | 샘플링 온도. 기본값: `0.2`.                                                                                                                                                                            |

**여러 모델을 사용하는 이유:** 다양한 제공업체와 모델은 언어 및 로캘별로 비용과 품질 수준이 다릅니다. 단일 모델이 아닌 `openrouter.translationModels`을 **우선 순위 기반 대체 체인**으로 구성하면 요청이 실패할 경우 CLI가 다음 모델을 시도할 수 있습니다.

아래 목록은 확장 가능한 **기준**으로 간주하세요. 특정 로캘의 번역 품질이 낮거나 실패하는 경우, 해당 언어 또는 문자 체계를 효과적으로 지원하는 모델을 조사하고 (온라인 자료 또는 제공업체 문서 참조), 해당 OpenRouter ID를 추가 대안으로 등록하세요.

이 목록은 **광범위한 로케일 적용 범위에 대해 테스트되었습니다** (예: 대규모 문서 프로젝트에서 **36개**의 대상 로케일을 번역하던 **2026년 4월**에 수행됨). 실용적인 기본값으로 사용되지만, 모든 로케일에서 항상 우수한 성능을 보장하지는 않습니다.

예시 `translationModels` (`npx ai-i18n-tools init`과 동일한 기본값):

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-5.3-codex",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash-preview"
]
```

환경 또는 `.env` 파일에서 `OPENROUTER_API_KEY`을 설정하세요.

<a id="features"></a>
### `features`

| 필드                | 워크플로 | 설명                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | 소스에서 `t("…")` / `i18n.t("…")`를 스캔하고, 선택적 `package.json` 설명과 (활성화된 경우) `ui-languages.json` `englishName` 값을 `strings.json`에 병합합니다. |
| `translateUIStrings` | 1        | `strings.json` 항목을 번역하고 로케일별 JSON 파일을 작성합니다.                                                                                                  |
| `translateMarkdown`  | 2        | `.md` / `.mdx` 파일을 번역합니다.                                                                                                                                    |
| `translateJSON`      | 2        | Docusaurus JSON 레이블 파일을 번역합니다.                                                                                                                             |
| `translateSVG`       | 2        | 독립형 `.svg` 리소스 번역 (최상위 `svg` 블록 필요).                                                                                         |

**독립형** SVG 자산은 `features.translateSVG`이 true이고 최상위 `svg` 블록이 구성된 경우 `translate-svg`로 번역됩니다. `sync` 명령은 두 조건이 모두 충족되면 해당 단계를 실행합니다 (`--no-svg`가 아닌 경우).

<a id="ui"></a>
### `ui`

| 필드                                          | 설명                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | `t("…")` 호출을 위해 스캔할 디렉터리 (현재 작업 디렉터리 기준 상대 경로).                                                                                                                                                                                                          |
| `stringsJson`                                  | 마스터 카탈로그 파일의 경로. `extract`에 의해 업데이트됨.                                                                                                                                                                                                             |
| `flatOutputDir`                                | 로케일별 JSON 파일이 작성되는 디렉터리 (`de.json` 등).                                                                                                                                                                                               |
| `preferredModel`                               | 선택 사항. `translate-ui`에 대해서만 먼저 시도할 OpenRouter 모델 ID; 그 후 이 ID를 중복하지 않고 순서대로 `openrouter.translationModels` (또는 이전 모델)을 시도합니다.                                                                                                   |
| `reactExtractor.funcNames`                     | 스캔할 추가 함수 이름 (기본값: `["t", "i18n.t"]`).                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | 포함할 파일 확장자 (기본값: `[".js", ".jsx", ".ts", ".tsx"]`).                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | `true`일 때(기본값), `extract`는 존재하는 경우 UI 문자열로 `package.json` `description`도 포함합니다.                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | 선택적 설명 추출에 사용되는 `package.json` 파일의 사용자 정의 경로입니다.                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | `true`일 때(`false`가 기본값), `extract`은 소스 스캔에서 이미 존재하지 않는 경우 매니페스트의 `englishName` 각 항목을 `uiLanguagesPath`에서 `strings.json`로 추가합니다(동일한 해시 키 사용). 유효한 `ui-languages.json`을 가리키는 `uiLanguagesPath`이 필요합니다. |

<a id="cachedir"></a>
### `cacheDir`

| 필드      | 설명                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite 캐시 디렉터리(모든 `documentations` 블록에서 공유). 실행 간 재사용. 사용자 정의 문서 번역 캐시에서 마이그레이션하는 경우 보관하거나 삭제하세요. `cacheDir`는 자체 SQLite 데이터베이스를 생성하며 다른 스키마와 호환되지 않습니다. |

VCS 제외를 위한 모범 사례:

- 임시 캐시 아티팩트의 커밋을 방지하기 위해 번역 캐시 폴더 내용을 제외하세요(예: `.gitignore` 또는 `.git/info/exclude` 사용).
- `ai-i18n-tools`을 사용하는 소프트웨어를 변경하거나 업그레이드할 때 미변경 세그먼트의 재번역을 방지하여 실행 시간과 API 비용을 절약할 수 있도록 `cache.db`를 유지하세요(일상적으로 삭제하지 마세요).

예시:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

<a id="documentations"></a>
### `documentations`

문서 파이프라인 블록의 배열입니다. `translate-docs`과 `sync`의 docs 단계는 각 블록을 순서대로 **처리합니다**.

| 필드                                             | 설명                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | 이 블록에 대한 선택적 사람이 읽을 수 있는 메모(번역에는 사용되지 않음). 설정된 경우 `translate-docs` `🌐` 제목 앞에 접두사로 붙으며, `status` 섹션 헤더에도 표시됨.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | 번역할 마크다운/MDX 소스(`translate-docs`가 `.md` / `.mdx`를 위해 이를 스캔함). JSON 레이블은 동일한 블록의 `jsonSource`에서 가져옴.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | 이 블록의 번역된 출력을 위한 루트 디렉터리.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | 로드 시 `contentPaths`에 병합되는 선택적 별칭입니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `targetLocales`                                   | 이 블록에만 적용되는 선택적 로케일 하위 집합입니다 (지정하지 않으면 루트 `targetLocales` 사용). 효과적인 문서 로케일은 모든 블록의 로케일을 통합한 것입니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | 이 블록에 대한 Docusaurus JSON 레이블 파일의 소스 디렉터리입니다 (예: `"i18n/en"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.style`                            | `"nested"` (기본값), `"docusaurus"`, 또는 `"flat"`입니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | Docusaurus 레이아웃을 위한 소스 문서 루트입니다 (예: `"docs"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `markdownOutput.pathTemplate`                     | 사용자 정의 마크다운 출력 경로. 사용 가능한 자리 표시자: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | 레이블 파일의 사용자 정의 JSON 출력 경로. `pathTemplate`와 동일한 자리 표시자를 지원합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | `flat` 스타일의 경우, 동일한 기본 이름을 가진 파일이 충돌하지 않도록 소스 하위 디렉터리를 유지합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | 번역 후 상대 링크를 다시 작성합니다 (`flat` 스타일의 경우 자동으로 활성화됨).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | 평면 링크 재작성 접두사를 계산할 때 사용되는 리포지토리 루트입니다. 번역된 문서가 다른 프로젝트 루트 아래에 있지 않은 한 일반적으로 `"."`로 둡니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | 번역된 **마크다운 본문**에 대한 선택적 변환(YAML 프론트 매터는 보존됨). 세그먼트 재조합 및 평면 링크 재작성 후, `addFrontmatter` 이전에 실행됨.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | `markdownOutput`과 동일한 수준(`documentations[]` 블록 기준). `translate-docs` 추출을 위한 선택적 세분화된 세그먼트: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. `enabled`가 `true`일 때(`segmentSplitting`이 생략된 경우 기본값), 밀집된 단락, GFM 파이프 테이블(첫 번째 청크는 헤더, 구분자, 첫 번째 데이터 행 포함), 긴 목록이 분할되며, 하위 부분은 단일 줄바꿈(`tightJoinPrevious`)으로 다시 결합됩니다. 본문 블록을 구분하는 빈 줄 단위로 각각 하나의 세그먼트를 사용하려면 `"enabled": false`로 설정하십시오. |
| `markdownOutput.postProcessing.regexAdjustments`  | `{ "description"?, "search", "replace" }`의 순서 목록. `search`는 정규식 패턴임(일반 문자열은 `g` 플래그 또는 `/pattern/flags` 사용). `replace`는 `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` 등의 자리표시자를 지원함.                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 번역기는 `start`를 포함하는 첫 번째 줄과 일치하는 `end` 줄을 찾은 후, 해당 영역을 표준 언어 전환기로 대체함. 링크는 번역된 파일을 기준으로 상대 경로로 생성되며, 레이블은 설정 시 `uiLanguagesPath` / `ui-languages.json`에서, 그렇지 않으면 `localeDisplayNames` 및 로케일 코드에서 가져옴.                                                                                                                                                                                                                                                                                       |
| `addFrontmatter`                                  | `true`일 경우(생략 시 기본값), 번역된 마크다운 파일에는 YAML 키 `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`가 포함되며, 하나 이상의 세그먼트에 모델 메타데이터가 있을 경우 `translation_models`(사용된 OpenRouter 모델 ID의 정렬된 목록)도 포함됨. 생략하려면 `false`로 설정.                                                                                                                                                                                                                                                                                                                           |

예시(단순 README 파이프라인 — 스크린샷 경로 + 선택적 언어 목록 래퍼):

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

<a id="svg-optional"></a>
### `svg` (선택 사항)

독립형 SVG 리소스를 위한 최상위 경로 및 레이아웃. `features.translateSVG`이 true일 때만 번역이 실행됨 (`translate-svg` 또는 `sync`의 SVG 단계를 통해).

| 필드                         | 설명                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | `.svg` 파일을 재귀적으로 검색할 하나 이상의 디렉터리입니다.                                                                                                                                                                                                     |
| `outputDir`                   | 번역된 SVG 출력의 루트 디렉터리입니다.                                                                                                                                                                                                                                          |
| `style`                       | `pathTemplate`이 설정되지 않은 경우 `"flat"` 또는 `"nested"`입니다.                                                                                                                                                                                                                               |
| `pathTemplate`                | 사용자 정의 SVG 출력 경로. 자리표시자: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | SVG 재조합 시 소문자로 번역된 텍스트입니다. 모두 소문자 레이블을 사용하는 디자인에 유용합니다.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 필드          | 설명                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 기존 번역을 기반으로 용어집을 자동 생성하는 `strings.json` 파일의 경로입니다.                                                                                                 |
| `userGlossary` | 열이 `Original language string`(또는 `en`), `locale`, `Translation`인 CSV 파일의 경로 - 각 원본 용어와 대상 로케일에 해당하는 행 하나씩 포함 (`locale`는 모든 대상에 대해 `*`일 수 있음). |

레거시 키 `uiGlossaryFromStringsJson`는 여전히 허용되며 설정 로드 시 `uiGlossary`에 매핑됩니다.

빈 용어집 CSV 생성:

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI 참조

| 명령어                                                                     | 설명                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                   | CLI 버전 및 빌드 타임스탬프 출력 (루트 프로그램의 `-V` / `--version`와 동일한 정보).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | 시작 구성 파일을 작성합니다 (`concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, `documentations[].addFrontmatter` 포함). `--with-translate-ignore`가 시작용 `.translate-ignore`을 생성합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `extract`                                                                   | `t("…")` / `i18n.t("…")` 리터럴, 선택적 `package.json` 설명, 선택적 매니페스트 `englishName` 항목들로부터 `strings.json`을 업데이트합니다 (`ui.reactExtractor` 참조). `features.extractUIStrings`이 필요합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | `sourceLocale` + `targetLocales`와 번들된 `data/ui-languages-complete.json`(또는 `--master`)을 사용하여 `ui.flatOutputDir`에 `ui-languages.json`을 씁니다(설정된 경우 `uiLanguagesPath` 사용). 마스터 파일에 없는 로케일에 대해서는 경고를 표시하고 `TODO` 자리 표시자를 출력합니다. 기존 매니페스트에 사용자 정의된 `label` 또는 `englishName` 값이 있는 경우, 마스터 카탈로그의 기본값으로 대체됩니다. 생성된 파일을 이후 검토하고 조정하십시오.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | 각 `documentations` 블록(`contentPaths`, 선택적 `jsonSource`)에 대해 마크다운/MDX 및 JSON을 번역합니다. `-j`: 최대 병렬 로케일 수; `-b`: 파일당 최대 병렬 배치 API 호출 수. `--prompt-format`: 배치 전송 형식(`xml` \| `json-array` \| `json-object`). [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags) 및 [배치 프롬프트 형식](#batch-prompt-format) 참조.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `write-heading-ids …` | **API 없음.** 최소한 하나의 `documentations[]` 블록이 필요함. 각 블록의 `contentPaths` 아래에 있는 `.md` / `.mdx`를 수집함(`.translate-ignore` 적용). 평면 ATX `#` 제목 바로 **앞에** HTML 앵커 줄 `<a id="slug"></a>`을 삽입함(_fence 코드 블록 내부의 제목은 건너뜀). `-p` / `--path` 또는 `-f` / `--file`: 프로젝트 기준 파일 또는 디렉터리로 제한. `--slug-style`: `github`(기본값; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. `pymdown` 사용 시, 선택적으로 `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode` 가능. `--dry-run`: 변경 사항만 나열. |
| `translate-svg …`                                                           | `config.svg`에서 구성된 독립형 SVG 자산 번역(문서와 별도). `features.translateSVG` 필요. 문서와 동일한 캐시 방식 적용; 해당 실행에서 SQLite 읽기/쓰기를 건너뛰기 위해 `--no-cache` 지원. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | UI 문자열만 번역합니다. `--force`: 기존 번역을 무시하고 로케일별로 모든 항목을 다시 번역합니다. `--dry-run`: 쓰기 없음, API 호출 없음. `-j`: 최대 병렬 로케일 수. `features.translateUIStrings` 필요.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | `extract`을 **최초**로 실행 (`features.extractUIStrings` 필요)하여 `strings.json`가 원본과 일치하도록 한 후, **소스-로케일** UI 문자열에 대한 LLM 검토(철자, 문법). **용어 힌트**는 `glossary.userGlossary` CSV에서만 제공됨 (`translate-ui`와 동일한 범위 — `strings.json` / `uiGlossary` 아님. 따라서 잘못된 문구가 용어집으로 강화되지 않음). OpenRouter 사용 (`OPENROUTER_API_KEY`). 참고용 (실행 완료 시 종료 코드 **0**). `cacheDir` 아래에 **사람이 읽기 쉬운** 보고서 (요약, 문제점, 문자열별 **OK** 행)로 `lint-source-results_<timestamp>.log` 작성; 터미널에는 요약 수치와 문제점만 출력 (문자열당 `[ok]` 행 없음). 마지막 줄에 로그 파일 이름 출력. `--json`: 전체 기계 판독 가능 JSON 보고서를 stdout에만 출력 (로그 파일은 사람용 가독성 유지). `--dry-run`: 여전히 `extract` 실행 후 배치 계획만 출력 (API 호출 없음). `--chunk`: API 배치당 문자열 수 (기본값 **50**). `-j`: 최대 병렬 배치 수 (기본값 `concurrency`). `--json` 사용 시, 인간 친화적 출력은 stderr로 전달됨. 링크는 `editor` UI 문자열의 '링크' 버튼과 동일한 방식으로 `path:line` 사용. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | XLIFF 2.0으로 `strings.json` 내보내기(대상 로캘당 하나의 `.xliff`). `-o` / `--output-dir`: 출력 디렉터리(기본값: 카탈로그와 동일한 폴더). `--untranslated-only`: 해당 로캘에 대해 번역이 누락된 항목만. 읽기 전용이며 API를 사용하지 않습니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | 활성화된 경우 추출 후 UI 번역, 그리고 `features.translateSVG` 및 `config.svg`이 설정된 경우 `translate-svg` 실행, 그 후 문서 번역 — 단, `--no-ui`, `--no-svg`, 또는 `--no-docs`로 건너뛸 수 있음. 공유 플래그: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`(문서 배치 전용), `--force` / `--force-update`(문서 전용; 문서 실행 시 상호 배타적). 문서 단계는 또한 `--emphasis-placeholders` 및 `--debug-failed`을(를) 전달합니다(`translate-docs`과 동일한 의미). `--prompt-format`은 `sync` 플래그가 아니며, 문서 단계는 내장 기본값(`json-array`)을 사용합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | `features.translateUIStrings`이 켜져 있을 때, 각 로케일별 UI 커버리지(`Translated` / `Missing` / `Total`)를 출력합니다. 그런 다음 파일 × 로케일별 마크다운 번역 상태를 출력합니다(`--locale` 필터 없음; 로케일은 설정 파일에서 가져옴). 많은 수의 로케일 목록은 터미널에서 줄이 너무 길어지지 않도록 최대 `n`개의 로케일 열을 가진 반복 테이블로 나누어 출력됩니다(기본값 **9**).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | 먼저 `sync --force-update`를 실행(extract, UI, SVG, docs)한 후, 더 이상 사용되지 않는 세그먼트 행(null `last_hit_at` 또는 파일 경로가 비어 있음)을 제거합니다. 디스크상에서 해당 소스 경로를 찾을 수 없는 `file_tracking` 행을 삭제하고, `filepath` 메타데이터가 존재하지 않는 파일을 가리키는 번역 행을 제거합니다. 세 가지 카운트(더 이상 사용되지 않는, 고아 상태의 `file_tracking`, 고아 상태의 번역)를 로그로 기록합니다. `--no-backup`이 설정되지 않은 경우 캐시 디렉터리 아래에 타임스탬프가 포함된 SQLite 백업을 생성합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | 캐시, `strings.json`, 용어집 CSV를 위한 로컬 웹 편집기를 실행합니다. `--no-open`는 기본 브라우저를 자동으로 열지 않습니다.<br><br>**참고:** 캐시 편집기에서 항목을 편집한 경우, 업데이트된 캐시 항목을 반영하기 위해 `sync --force-update`을(를) 다시 실행해야 합니다. 또한 이후 소스 텍스트가 변경되면 새로운 캐시 키가 생성되기 때문에 수동 편집 내용은 사라집니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | 빈 `glossary-user.csv` 템플릿을 작성합니다. `-o`: 출력 경로를 재정의합니다(기본값: 구성에서 `glossary.userGlossary`, 또는 `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

모든 명령어는 비기본 구성 파일을 지정하기 위한 `-c <path>`, 자세한 출력을 위한 `-v`, 콘솔 출력을 로그 파일로 중계하기 위한 `-w` / `--write-logs [path]`를 허용합니다(기본 경로: 루트의 `cacheDir` 아래). 루트 프로그램은 또한 `-V` / `--version` 및 `-h` / `--help`를 지원하며, `ai-i18n-tools help [command]`는 `ai-i18n-tools <command> --help`과 동일한 명령어별 사용법을 표시합니다.

---

<a id="environment-variables"></a>
## 환경 변수

| 변수                    | 설명                                                         |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **필수 항목.** OpenRouter API 키입니다.                     |
| `OPENROUTER_BASE_URL`   | API 기본 URL을 재정의합니다.                                 |
| `I18N_SOURCE_LOCALE`    | 런타임에 `sourceLocale`을 재정의합니다.                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`을 재정의할 쉼표로 구분된 로케일 코드입니다.  |
| `I18N_LOG_LEVEL`        | 로거 레벨(`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | `1`인 경우 로그 출력에서 ANSI 색상을 비활성화합니다.              |
| `I18N_LOG_SESSION_MAX`  | 로그 세션당 유지되는 최대 줄 수(기본값 `5000`).           |
