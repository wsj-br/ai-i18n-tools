<a id="add-i18n-to-a-jsts-app"></a>
# JS/TS 앱에 i18n 추가

이 페이지에서는 단일 언어를 사용하는 JS/TS 앱(React, Next.js, Node 또는 CLI)에 ai-i18n-tools를 사용하여 로케일을 추가하는 방법을 설명합니다. 이 방법은 i18next, 작은 부트스트랩 파일, 그리고 번역 JSON 파일을 사용합니다. `extract`는 `t()` 또는 `i18n.t()` 내의 문자열 리터럴인 경우에만 UI 문자열을 기록하므로, 일반 소스 텍스트 카탈로그는 비어 있을 것입니다.

가장 빠른 방법은 이 페이지의 프롬프트를 코딩 에이전트에 제공하는 것입니다. 에이전트는 i18next를 설치하고, 부트스트랩을 추가하며, 문자열을 래핑하고, 언어 전환 기능을 추가할 수 있습니다. CLI를 설치하고, 공급자를 선택하고, 프로젝트를 직접 초기화해야 합니다. 이는 API 키와 선택 사항이 필요하기 때문입니다. 또한 번역은 사용자 계정에서 비용이 발생하므로 직접 실행해야 합니다.

웹사이트 또는 문서 사이트에는 [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website)를 사용합니다. Python 앱에는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python)를 사용합니다. 어떤 것이 적용되는지 확실하지 않으신가요? 마지막에 있는 [해당하지 않는 경우?](#not-your-case)를 참조하세요.

흐름:

1. [CLI 설치 및 공급자 선택](#install-and-choose-a-provider).
2. `init`를 사용하여 [프로젝트 초기화](#initialise-the-project).
3. [에이전트 프롬프트 실행](#run-the-agent-prompt).
4. [결과 검토](#review-the-result).
5. [모델 선택 및 번역](#choose-models-and-translate) 후 한 언어를 확인합니다.
6. [번역 유지](#keep-it-translated).

변경 사항을 직접 적용하고 싶거나 프롬프트가 무엇을 하는지 알고 싶으신가요? [수동으로 진행하기](#do-it-by-hand)에서 동일한 단계를 하나씩 안내합니다.

<a id="install-and-choose-a-provider"></a>
## 설치 및 공급자 선택

이 부분은 에이전트가 아닌 사용자가 직접 수행합니다. 설치 프로그램은 사용자 시스템을 변경하며, API 키는 프롬프트가 아닌 셸에 속하는 비밀 정보입니다.

패키지를 개발 종속성으로 설치합니다. 부트스트랩은 `ai-i18n-tools/runtime`를 가져오며, 전역 CLI 또는 독립 실행형 실행 파일은 해당 가져오기를 충족할 수 없습니다. 다른 설치 옵션: [설치](/ko/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 및 `yarn add --dev ai-i18n-tools`도 작동합니다. 아래 예시에서는 순수 `ai-i18n-tools` 명령을 사용합니다. 로컬 설치에는 `PATH`에 `node_modules/.bin`가 필요하거나 각 명령 앞에 `pnpm exec`가 필요합니다. [CLI 사용](/ko/guide/installation#using-the-cli)을 참조하세요.

설치 확인:

```bash
ai-i18n-tools --version
```

그런 다음 공급자를 선택하고 번역을 실행할 셸에 API 키를 설정합니다. 예를 들어, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama는 키가 필요 없습니다. 다른 사전 설정: [내장 공급자](/ko/guide/providers-and-models#built-in-providers). 다음 단계에서 `init`에 전달해야 하므로 공급자 이름을 기록해 두세요. 에이전트는 키가 필요 없습니다. 모델 호출을 하지 않는 명령만 실행합니다. 키는 나중에 [번역](#choose-models-and-translate)할 때 사용합니다.

<a id="initialise-the-project"></a>
## 프로젝트 초기화

이 작업은 프롬프트 전에 한 번 실행합니다. 이 작업은 구성을 작성하고 위에서 선택한 공급자를 사용합니다.

```bash
ai-i18n-tools init -P openrouter
```

기본 템플릿은 `ui-markdown`입니다. 이 템플릿은 UI 블록과 플랫 README 블록이 있는 `ai-i18n-tools.config.json`을 작성합니다. 앱에 중요한 네 가지 키:

- `sourceLocale`: 소스에 있는 문자열의 언어. 모든 BCP-47 언어가 유효하며, 스캐폴드는 종종 `en-GB`을 사용합니다.
- `targetLocales`: 추가할 언어.
- `ui.sourceRoots`: `extract`가 스캔하는 폴더(예: `src/`).
- `ui.stringsJson` 및 `ui.flatOutputDir`: 카탈로그와 로케일별 파일이 작성되는 위치.

`init`는 i18next를 설치하지 않으며 부트스트랩을 추가하지 않습니다. 이는 프롬프트(수동으로, [1단계](#step-1-install-the-runtime-libraries) 및 [2단계](#step-2-extract-once-and-add-the-bootstrap))입니다.

`init`를 한 번 실행합니다. 이 명령은 매번 `ai-i18n-tools.config.json`을 다시 작성하므로, 두 번째 실행 시에는 사용자가 변경한 내용이 삭제됩니다.

동일한 템플릿은 문서 번역을 위해 `README.md`를 나열합니다. 언어 목록 마커와 README 파일은 [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)입니다. 이 페이지는 `t()` 경로입니다.

다른 모든 키는 [구성](/ko/reference/configuration)에 있습니다. 호출 형태: [t() 호출 및 복수형](/ko/guide/ui-strings/t-calls-and-plurals). 부트스트랩 참조: [i18next 연결](/ko/guide/ui-strings/i18next-runtime).

<a id="run-the-agent-prompt"></a>
## 에이전트 프롬프트 실행

코딩 에이전트(Cursor, Claude Code, Copilot 등)에서 프로젝트를 열고, 새 채팅을 시작한 다음 아래 프롬프트를 붙여넣으세요. 프로젝트는 이미 초기화되어 있어야 합니다. 편집할 내용은 없습니다. 예를 들어 언어 전환을 원하지 않는 등 제외하고 싶은 것이 있다면 같은 메시지에 명시하세요.

에이전트는 먼저 CLI와 구성이 존재하는지 확인하고, 하나라도 없으면 지침과 함께 중단됩니다. 그런 다음 세 부분으로 작동합니다.

- 1부: i18next를 설치하고, `extract`를 한 번 실행하며, 부트스트랩을 추가합니다.
- 2부: 사용자에게 보이는 문자열을 `t()` 또는 `i18n.t()`로 래핑합니다.
- 3부: 언어 전환 또는 CLI 언어 옵션을 추가합니다.

CLI를 설치하거나, 구성을 초기화하거나, API 키를 읽거나, 번역하지 않습니다. 번역은 검토 후 단계이며, 사용자가 실행합니다.

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

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

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## 결과 검토

에이전트는 보고서로 끝냅니다. 번역하기 전에 확인하세요.

- 차이점(diff). 래핑된 텍스트는 관련 없는 재포맷 없이 이전과 동일하게 읽혀야 합니다. `git diff --stat`는 변경된 양을 보여줍니다. 부트스트랩, 해당 임포트, 래핑된 호출 및 언어 전환은 예상되는 편집 내용입니다.
- 생성된 카탈로그(`strings.json`, 로케일별 JSON, `ui-languages.json`)는 `extract`가 작성한 것 외에는 변경되지 않습니다.
- `ai-i18n-tools extract`는 깨끗하게 실행되고, `strings.json`는 예상하는 문장들을 나열합니다.
- 테스트가 통과하고, 앱이 원본 언어에서 동일하게 보입니다.
- 보고서의 건너뛴 문자열과 모호한 경우: 다른 의미로 사용된 한 단어, 조각으로 구성된 문장, 그리고 복수형. 이들은 수동으로 결정하세요.
- 부트스트랩의 `SOURCE_LOCALE`는 구성의 `sourceLocale`와 같습니다.

에이전트가 놓친 문자열은 나중에 원본 언어로 남아 있는 텍스트로 나타납니다.

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

이 부분은 사용자가 실행합니다. 사용자 API 키를 사용하며 사용자 계정에서 비용이 발생합니다.

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`는 `translationModels`만 대체합니다. 동일한 순위는 `ai-i18n-tools dashboard`의 [모델](/ko/guide/translation-dashboard/models) 탭에 있습니다.

그런 다음 추출하고 번역합니다.

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract`는 `strings.json`와 `ui-languages.json`를 작성합니다. `translate-ui`는 `ui.flatOutputDir` 아래에 대상 언어별로 하나의 JSON 파일을 작성합니다. 생성된 파일은 편집하지 마세요. `features.translateUIStrings`가 켜져 있을 때 `sync`는 `extract`와 `translate-ui`를 함께 실행합니다. `extract`가 스캔하고 작성하는 내용: [UI 문자열, 2단계](/ko/guide/ui-strings/#step-2-extract-strings).

`t()`는 로케일 JSON에서 원본 문장을 찾습니다. `strings.json`의 ID는 조회 키가 아닙니다. 파일이 없거나 키가 없으면 원본 문장을 반환합니다.

<a id="check-one-language"></a>
### 한 언어 확인

앱을 다시 로드하고, 하나의 대상 언어로 전환한 다음, 래핑된 문자열이 몇 개 있는 화면을 엽니다. 에이전트가 추가한 언어 전환을 사용하거나, 직접 `loadLocale` 및 `changeLanguage`를 호출하세요. 여전히 원본 언어로 되어 있는 텍스트는 래핑되지 않았거나, 가져오기 시점에 실행되거나, 로케일 JSON에 항목이 없는 것입니다. 코드를 의심하기 전에 JSON에서 해당 문장을 확인하세요.

래핑된 호출이 `{ plurals: true, count }`를 사용할 때, 복수형이 해결되도록 원본 로케일 플랫 파일을 추가하세요. 이는 `flatOutputDir`에서 `{sourceLocale}.json`를 가져오는 것을 추가하고, [i18next 연결](/ko/guide/ui-strings/i18next-runtime)에 표시된 대로 `sourcePluralFlatBundle` 옵션을 추가합니다.

<a id="keep-it-translated"></a>
## 번역 유지

소스 텍스트를 변경한 후 `ai-i18n-tools sync` (또는 `extract` 다음 `translate-ui`)를 다시 실행하세요. 캐시는 새롭거나 변경된 문자열만 모델로 전송됨을 의미합니다. [권장 package.json 스크립트](/ko/guide/quick-start#recommended-packagejson-scripts)에서 스크립트를 추가하고, 번역이 틀어지지 않도록 CI에서 `sync`를 실행하세요. 번역 실행 후 앱을 다시 로드하여 새 JSON을 가져오도록 하세요. `ai-i18n-tools dashboard`는 번역을 검토하기 위해 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

기본 `init` 템플릿에는 `README.md`도 나열됩니다. `sync`가 번역하기 전에 언어 목록 마커를 붙여넣으세요. [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="do-it-by-hand"></a>
## 수동으로 수행하기

변경 사항을 직접 적용하거나 프롬프트가 무엇을 하는지 알고 싶다면 다음 단계를 따르세요. 이 단계들은 프롬프트의 각 부분과 일치합니다. 마지막에는 여전히 [CLI 설치](#install-and-choose-a-provider), [프로젝트 초기화](#initialise-the-project), 그리고 [번역](#choose-models-and-translate)을 수행합니다.

1. [런타임 라이브러리 설치](#step-1-install-the-runtime-libraries).
2. [한 번 추출하고 부트스트랩 추가](#step-2-extract-once-and-add-the-bootstrap).
3. `t()` 또는 `i18n.t()`로 [문자열 래핑](#step-3-wrap-strings).
4. [언어 전환 추가](#step-4-add-a-language-switch).

<a id="step-1-install-the-runtime-libraries"></a>
## 1단계: 런타임 라이브러리 설치

ai-i18n-tools는 `i18next` 또는 `react-i18next`에 의존하지 않습니다. 앱이 이를 설치합니다.

- 런타임에 문자열을 조회하는 모든 JS/TS 앱: `i18next`.
- `useTranslation()`를 호출하는 React 컴포넌트: `react-i18next`도 마찬가지입니다.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## 2단계: 한 번 추출하고 부트스트랩 추가

부트스트랩은 `strings.json`와 `ui-languages.json`를 임포트하며, `extract`만 이들을 작성합니다. `t()` 호출을 찾지 못하더라도 앱이 컴파일되도록 둘 다 작성합니다.

```bash
ai-i18n-tools extract
```

`package.json`에 `description`가 있다면 0개 또는 1개의 문자열을 예상하세요. 추출기가 기본적으로 (`ui.uiExtractor.includePackageDescription`)를 포함하기 때문입니다.

i18n 설정 파일을 생성하세요. 이 버전은 문자열을 래핑하고 번역하기에 충분합니다. `ai-i18n-tools.config.json`에서 `SOURCE_LOCALE`는 `sourceLocale`와 같아야 합니다. `ui.stringsJson`와 `ui.flatOutputDir`에 맞게 임포트 경로를 조정하세요.

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

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

React를 사용하지 않으시나요? `react-i18next` 가져오기(import)와 `.use(initReactI18next)` 호출을 제거하세요.

`public/` 아래의 JSON 번들의 경우, 로더가 `/locales/${code}.json`를 가져옵니다. 번들러가 없는 Node CLI의 경우, `readFileSync`로 파일을 읽으세요. 두 가지 형태 모두 [로케일 로더](/ko/guide/ui-strings/i18next-runtime#locale-loaders)에 있습니다.

첫 번째 렌더링 전에 앱 엔트리에서 이 파일을 가져옵니다. Next.js에서는 [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts)와 동일한 패턴으로 클라이언트 모듈에서 가져옵니다.

<a id="step-3-wrap-strings"></a>
## 3단계: 문자열 래핑

`t()`의 인수는 사용자가 보게 될 원본 언어 문장입니다. 플랫 로케일 파일은 해당 문장을 키로 사용합니다.

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, CLI 또는 React가 아닌 모듈:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

규칙 ([t() 호출 및 복수형](/ko/guide/ui-strings/t-calls-and-plurals)에도 적용):

- 키는 리터럴입니다. `t(variable)` 및 <code>{'t(`Hello ${name}`)'}</code>는 추출되지 않으며, 리터럴이 아닌 호출은 경고 없이 건너뜁니다.
- 리터럴 내부의 플레이스홀더는 두 번째 인수로 전달되는 i18next 형식 <code v-pre>{{name}}</code>를 사용합니다.
- 복수형: 하나의 원본 문장과 `{ plurals: true, count }`. [기수 복수형](/ko/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true)을 참조하세요. `_one` / `_other` 키를 직접 만들지 마세요.
- React 컴포넌트는 `useTranslation()`에서 `t`를 가져옵니다. 다른 파일은 `i18n.t`를 호출합니다. 가져오기 시점에 평가되는 상수는 함수 또는 `useMemo(..., [t])`로 이동해야 하므로, 로케일 로드 후에 `t()`가 실행됩니다.
- Next.js 서버 컴포넌트는 공유 i18next 인스턴스에서 `changeLanguage`를 호출해서는 안 됩니다. 동시 요청은 해당 싱글톤을 공유합니다. 요청별 `createInstance()`를 사용하거나, 플랫 번들의 상태 비저장 조회를 사용하세요([Nextra 하이브리드](/ko/guide/integrations/nextra#optional-t-for-app-react-hybrid) 참조).

다음은 그대로 두세요: `className`, `href` 및 기타 URL, 가져오기 경로, ID, 테스트 ID, 오류 코드, 식별자로 사용되는 객체 키, 그리고 주석 내부 텍스트.

`ai-i18n-tools extract`를 다시 실행하세요. 이제 카탈로그에 래핑한 문장들이 나열되어야 합니다.

<a id="step-4-add-a-language-switch"></a>
## 4단계: 언어 전환 추가

[i18next 연결](/ko/guide/ui-strings/i18next-runtime#startup-locale)에 설명된 대로 첫 렌더링 전에 저장된 로케일을 복원하세요. 그런 다음 `await loadLocale(code)` 다음에 `await i18n.changeLanguage(code)`를 호출하는 컨트롤을 추가하세요. `ui-languages.json`에서 옵션을 빌드하세요. 위젯, 레이블 및 오른쪽에서 왼쪽 레이아웃: [언어 전환기 및 RTL](/ko/guide/ui-strings/language-switcher).

명령줄 프로그램에는 위젯이 없습니다. `--lang <code>` (그리고 해당 이름이 비어있다면 `-L`)를 추가한 다음, 앱이 이미 소유하고 있는 언어 환경 변수를 추가하세요. `AI_I18N_LANG`를 읽지 마세요. 해당 변수는 ai-i18n-tools CLI 전용입니다. `ui-languages.json`에 나열된 코드만 허용하세요.

프로그램이 사람이 읽을 텍스트를 표시하지 않을 때는 이 단계를 건너뛰세요.

이것이 마지막 수동 단계입니다. [모델 선택 및 번역](#choose-models-and-translate)에서 계속하세요.

<a id="coming-from-another-tool"></a>
## 다른 도구에서 전환

ai-i18n-tools에는 자체 문자열 추출기가 포함되어 있습니다. `i18next-scanner`, `babel-plugin-i18next-extract` 또는 이와 유사한 것을 사용했다면, 마이그레이션 후 해당 개발 종속성을 제거할 수 있습니다. 기존 i18next 네임스페이스 JSON 파일은 [JSON 파이프라인](/ko/guide/json#i18next-namespace-files)에 유지될 수 있습니다. Intlayer `.content.ts` 사전은 `migrate-intlayer`를 사용하여 가져올 수 있습니다: [Intlayer에서 마이그레이션](/ko/guide/migrating-from-intlayer)을 참조하세요. 런타임에 Intlayer를 유지하고 번역만 채우려면 `translate-intlayer`를 사용하세요: [Intlayer를 제자리에서 번역](/ko/guide/translating-intlayer)을 참조하세요.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 현재 코드 | 참조 |
| --- | --- |
| 원본 언어 문장으로 이미 `t("…")` 또는 `i18n.t("…")`인 경우 | [UI 문자열](/ko/guide/ui-strings/) 2~3단계, 그 다음 [i18next 연결](/ko/guide/ui-strings/i18next-runtime) |
| i18next 네임스페이스 JSON (`t("saveButton")` 및 `en/translation.json`) | [JSON](/ko/guide/json). 모든 호출을 변경할 준비가 되지 않았다면 해당 키를 원본 언어 문장으로 변경하지 마십시오. |
| Intlayer 사전, Intlayer에서 벗어나는 경우 | [Intlayer에서 마이그레이션](/ko/guide/migrating-from-intlayer) |
| Intlayer 사전, Intlayer를 유지하는 경우 | [Intlayer를 제자리에서 번역](/ko/guide/translating-intlayer) |
| 단일 HTML 파일 | [일반 HTML](/ko/guide/ui-strings/plain-html) 및 `mark-html` |
| 문서 사이트 또는 Astro 페이지 HTML | [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website) 및 [Astro 웹사이트](/ko/guide/ui-strings/astro-website). `t()`는 공유 데이터 및 프런트매터에만 해당됩니다. |
| Python 앱 | [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) |
| Django, Flask-Babel 카탈로그 또는 이미 GNU gettext를 사용하는 앱 | [Django / Python gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext) |
| 리포지토리 README 또는 기타 마크다운 파일 | [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 예시

| 예시 | 설명 |
| --- | --- |
| [콘솔 앱](/ko/examples#console-app) | 가장 작은 Node 앱, `t()`가 이미 래핑되어 있으며 README 블록이 포함되어 있습니다. |
| [Next.js 앱](/ko/examples#nextjs-app) | React 부트스트랩, 복수형, 문서 사이트 및 README 블록이 포함되어 있습니다. |

`npx degit`를 사용하여 하나를 복사합니다. 명령: [예시](/ko/examples#nodejs-examples).
