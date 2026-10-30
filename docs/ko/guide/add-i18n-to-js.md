<a id="add-i18n-to-a-jsts-app"></a>
# JS/TS 앱에 i18n 추가

이 페이지는 버튼, 레이블, 메시지가 여전히 일반 소스 언어 텍스트인 JS/TS 앱(React, Next.js, Node 또는 CLI)을 위한 것입니다. `extract`는 `t()` 또는 `i18n.t()` 내의 문자열 리터럴일 때만 UI 문자열을 기록하므로, 현재 카탈로그는 비어 있고 `translate-ui`는 번역할 내용이 없을 것입니다.

단계: 도구를 설치하고, i18next를 설치하고, `extract`를 한 번 실행하고, `t`가 존재하도록 작은 설정 파일을 추가하고, 사용자에게 보이는 텍스트를 래핑한 다음 번역합니다. 이것이 해당 사례인지 확실하지 않으신가요? 마지막에 [해당 사례가 아닌가요?](#not-your-case)를 참조하세요.

<a id="install-and-choose-a-provider"></a>
## 도구 설치 및 키 설정

CLI를 설치하고([설치](/ko/guide/installation)) 공급자용 API 키를 설정합니다([공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key)). Ollama는 키가 필요 없습니다.

<a id="initialise-the-project"></a>
## 구성 초기화

```bash
ai-i18n-tools init -P openrouter
```

이것은 `ai-i18n-tools.config.json`를 작성합니다. 현재로서는 네 가지 키가 중요합니다:

- `sourceLocale`: 텍스트가 작성된 언어입니다. 어떤 언어든 유효합니다. 이 가이드에서는 영어가 일반적인 예시입니다.
- `targetLocales`: 추가할 언어입니다.
- `ui.sourceRoots`: `extract`가 스캔하는 폴더입니다. 예를 들어 `src/`입니다.
- `ui.stringsJson` 및 `ui.flatOutputDir`: 카탈로그와 로케일별 파일이 작성되는 위치입니다.

다른 모든 키는 [구성](/ko/reference/configuration)에 있습니다.

<a id="run-the-agent-prompt"></a>
## 런타임 라이브러리 설치

ai-i18n-tools는 `i18next` 또는 `react-i18next`에 의존하지 않습니다. 앱이 이를 설치합니다.

- 런타임에 문자열을 조회하는 모든 JS/TS 앱: `i18next`.
- `useTranslation()`를 호출하는 React 컴포넌트: `react-i18next`도 마찬가지입니다.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="review-the-result"></a>
## 추출을 한 번 실행

```bash
ai-i18n-tools extract
```

다음 단계의 설정 파일은 `strings.json`와 `ui-languages.json`를 가져오며, `extract`만 이를 작성합니다. `t()` 호출을 찾지 못하더라도 둘 다 작성하므로 앱이 컴파일됩니다. 0개의 문자열을 예상하거나, `package.json`에 `description`가 있다면 1개를 예상하세요. 추출기가 기본적으로 이를 포함하기 때문입니다 (`ui.uiExtractor.includePackageDescription`).

<a id="choose-models-and-translate"></a>
## 부트스트랩 추가

i18n 설정 파일을 생성합니다. 이 최소 버전으로도 문자열을 래핑하고 번역하기에 충분합니다. `SOURCE_LOCALE`는 `ai-i18n-tools.config.json`에서 `sourceLocale`과 같아야 합니다.

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

앱이 복수형을 사용하기 시작하면, 복수형이 해결되도록 소스 로케일 플랫 파일을 추가합니다. 이는 세 번째 가져오기(import)와 `sourcePluralFlatBundle` 옵션을 추가하며, [i18next 연결](/ko/guide/ui-strings/i18next-runtime)에 나와 있습니다.

첫 번째 렌더링 전에 앱 엔트리에서 이 파일을 가져옵니다. Next.js에서는 [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts)와 동일한 패턴으로 클라이언트 모듈에서 가져옵니다.

<a id="check-one-language"></a>
## 하드코딩된 텍스트 교체

수동으로 이 작업을 수행하거나 [JS/TS 프롬프트](#run-the-agent-prompt)를 코딩 에이전트에 붙여넣으세요. `t()`의 인수는 사용자가 보게 될 원본 언어 문장입니다. 플랫 로케일 파일은 해당 문장을 키로 사용합니다.

<details class="agent-prompt" id="agent-prompt">
<summary>JS/TS 에이전트 프롬프트</summary>

이것을 Cursor 또는 다른 코딩 에이전트에 복사하세요. 이것은 사용자에게 보이는 리터럴을 래핑합니다. 이것은 리터럴을 번역하지 않습니다.

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

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

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

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

<a id="keep-it-translated"></a>
## 추출 및 번역

리터럴이 제자리에 있을 때:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`features.translateUIStrings`가 켜져 있을 때 `sync`는 `extract`와 `translate-ui`를 함께 실행합니다. 이제 `extract`에 래핑한 문장들이 나열되어야 합니다. `ui.flatOutputDir` 아래에 생성된 로케일 파일 중 하나를 열어 번역이 있는지 확인하세요. 다음: `extract`가 스캔하고 쓰는 내용에 대해서는 [UI 문자열, 2단계](/ko/guide/ui-strings/#step-2-extract-strings)를 참조하세요.

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app)는 `src/main.js`가 이미 래핑된 작은 Node 앱입니다. Next.js 예시는 React 부트스트랩입니다.

<a id="do-it-by-hand"></a>
## 언어 전환

[i18next 연결](/ko/guide/ui-strings/i18next-runtime#startup-locale)에 설명된 대로 첫 렌더링 전에 저장된 로케일을 복원하세요. 그런 다음 `await loadLocale(code)`를 호출한 다음 `await i18n.changeLanguage(code)`를 호출하는 컨트롤을 추가하세요: [언어 전환기 및 RTL](/ko/guide/ui-strings/language-switcher).

<a id="step-1-install-the-runtime-libraries"></a>
## 번역 유지

원본 텍스트를 변경한 후 `sync`를 다시 실행하세요. 캐시는 새로 추가되거나 변경된 문자열만 모델로 전송됨을 의미합니다. [권장 package.json 스크립트](/ko/guide/quick-start#recommended-packagejson-scripts)에서 스크립트를 추가하고, 번역이 어긋나지 않도록 CI에서 `sync`를 실행하세요.

기본 `init` 템플릿은 `README.md`도 번역합니다. [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## 다른 도구에서 전환

ai-i18n-tools에는 자체 문자열 추출기가 포함되어 있습니다. `i18next-scanner`, `babel-plugin-i18next-extract` 또는 이와 유사한 것을 사용했다면, 마이그레이션 후 해당 개발 종속성을 제거할 수 있습니다. 기존 i18next 네임스페이스 JSON 파일은 [JSON 파이프라인](/ko/guide/json#i18next-namespace-files)에 유지될 수 있습니다. Intlayer `.content.ts` 사전은 `migrate-intlayer`를 사용하여 가져올 수 있습니다: [Intlayer에서 마이그레이션](/ko/guide/migrating-from-intlayer)을 참조하세요. 런타임에 Intlayer를 유지하고 번역만 채우려면 `translate-intlayer`를 사용하세요: [Intlayer를 제자리에서 번역](/ko/guide/translating-intlayer)을 참조하세요.

<a id="step-3-wrap-strings"></a>
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
| 리포지토리 README 또는 기타 마크다운 파일 | [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme) |
