---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  안내 설정, AI 번역, 캐시된 재실행을 통해 단일 언어 앱, 웹사이트 또는 리포지토리 문서를 다국어로 만들어 보세요. JavaScript,
  TypeScript, Python 또는 README로 시작하세요.
hero:
  name: ai-i18n-tools
  text: 단일 언어 프로젝트를 다국어로 만들어 보세요.
  tagline: >-
    가이드 설정과 AI 번역을 통해 앱, 웹사이트 또는 리포지토리 문서에 언어를 추가하세요. 공급자와 모델을 선택하고, 프로젝트가 커짐에
    따라 캐시된 번역을 재사용하세요.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools 로고
  actions:
    - theme: brand
      text: 프로젝트 선택
      link: '#start-here'
    - theme: alt
      text: 예제 살펴보기
      link: /ko/examples
---



<a id="start-with-the-project-you-have"></a>
## 기존 프로젝트로 시작하기

현재 단일 언어를 사용하시나요? 여기서 시작하세요. 어떤 언어든 가능하며, `sourceLocale`(으)로 설정하면 됩니다. 이 가이드에서는 영어를 일반적인 예로 사용합니다. 국제화(i18n)는 프로젝트가 여러 언어를 지원하도록 준비하는 과정입니다. 이 가이드는 설정부터 GitHub, GitLab 또는 다른 호스트에 이미 표시된 리포지토리의 README를 포함한 첫 번역 경험까지 안내합니다.

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="javascript-or-typescript-app"></a>
### JavaScript 또는 TypeScript 앱

일반 텍스트 버튼, 레이블 및 메시지를 다국어 UI로 전환합니다. 런타임을 설정하고, 번역할 텍스트를 표시하고, 언어 전환을 연결합니다. 준비 단계에 필요한 코딩 에이전트 프롬프트가 포함되어 있습니다.

React · Next.js · Node.js · CLI

[JS/TS 앱에 i18n 추가하기](/ko/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-app"></a>
### Python 앱

사용자에게 보이는 텍스트를 래핑하고 생성된 헬퍼로 번역된 메시지를 로드하세요. 이미 Django 또는 GNU gettext를 사용 중이신가요? gettext 호출을 유지하고 도구가 `.po` 파일을 채우도록 하세요. 별도의 Node.js 설치 없이 독립 실행형 실행 파일에서 번역 CLI를 실행하세요.

Streamlit · FastAPI · Flask · Django · CLI

[Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) · [Django / Python gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="website-or-documentation"></a>
### 웹사이트 또는 문서

현지화된 페이지를 게시하고 사이트의 언어 경로에 연결하세요. 탐색, 테마 레이블 및 언어 메뉴에 대한 프레임워크별 단계를 따르세요.

VitePress · Starlight · Docusaurus · Astro

[웹사이트 또는 문서 사이트에 i18n 추가하기](/ko/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="repository-readme-and-docs"></a>
### 저장소 README 및 문서

`README.md` 및 기타 마크다운 파일을 언어별로 하나의 파일로 번역하고 파일들 사이에 링크 행을 추가하세요. 앱의 UI 문자열과 함께 사용하거나 README만 단독으로 번역할 수 있습니다.

GitHub · GitLab · Bitbucket

[README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme)

</article>
</div>

어떤 경로가 적합한지 잘 모르시겠나요? [프로젝트에 i18n 추가하기](/ko/guide/add-i18n-to-your-project)에서 모든 단계별 가이드를 확인할 수 있습니다. 파이프라인이 어떻게 함께 작동하는지 알아보려면 [ai-i18n-tools의 기능 보기](/ko/guide/what-is-ai-i18n-tools)를 참조하세요.

<a id="from-setup-to-your-first-new-language"></a>
## 설정부터 첫 번째 새 언어 추가까지

<div class="home-steps">

1. **프로젝트를 준비합니다.** 언어, 번역 공급자 및 시도할 모델을 선택합니다. 앱의 경우, 사용자에게 표시되는 텍스트를 표시하고 번역 런타임을 설정합니다. 사이트의 경우, 프레임워크의 언어 라우팅을 활성화합니다. 소스 변경이 필요한 경우 코딩 에이전트 프롬프트가 가이드에 포함되어 있습니다.
2. **사용할 수 있는 파일로 번역합니다.** 설정이 준비되면 `sync`을(를) 실행합니다. 그러면 지원되는 앱 문자열을 추출하고, 활성화한 콘텐츠를 번역하며, 로케일 파일 또는 현지화된 페이지를 작성합니다.
3. **로드하고, 확인하고, 계속 진행합니다.** 출력을 앱 또는 사이트에 연결하고, 언어 전환을 연결하며, 대상 언어를 확인합니다. 소스 변경 후 다시 실행하여 새 텍스트 또는 변경된 텍스트를 번역합니다.

</div>

런타임 및 라우팅 설정은 직접 또는 코딩 에이전트를 사용하여 처리합니다. CLI는 추출, 번역, 유효성 검사, 파일 생성을 처리하며, 자동 소스 재작성이나 언어 전환기 설치는 처리하지 않습니다. [전체 빠른 시작 가이드 따르기](/ko/guide/quick-start)를 참조하세요.

<a id="your-source-text-ready-for-more-languages"></a>
## 소스 텍스트. 더 많은 언어 지원 준비 완료.

이 설명용 JS/TS 예제는 런타임 설정 및 번역 후 결과의 형태를 보여줍니다. 소스 문자열을 마킹하면 검색할 수 있게 되며, 각각 생성된 로케일 파일은 해당 문장을 번역에 매핑합니다.

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

소스 문장은 코드에서 읽기 가능한 상태로 유지됩니다. 앱은 런타임에 생성된 로케일 파일을 로드합니다. 전체 연결 방식을 확인하고 싶으신가요? [작동하는 Next.js 예시 살펴보기](/ko/examples#nextjs-app). 웹사이트는 모든 단락을 래핑하는 대신 [현지화된 페이지를 생성](/ko/guide/add-i18n-to-website)하는 다른 경로를 따릅니다.

<a id="built-for-the-next-update-too"></a>
## 다음 업데이트에도 대비한 설계

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="choose-your-provider-and-models"></a>
### 공급자 및 모델 선택

OpenAI, Anthropic, OpenRouter, Gemini, 로컬 Ollama 또는 9개의 다른 내장 옵션과 같이 지원되는 공급자를 사용하세요. 또한 모든 OpenAI 호환 공급자를 사용할 수 있습니다. 번역 품질은 모델 목록(`translationModels`, 로캘별 재정의 포함)을 따릅니다. `suggest-models` 및 대시보드 **모델** 아래의 동일한 순위는 게시된 번역 벤치마크를 기반으로 해당 목록을 구성합니다.

[LLM 공급자](/ko/guide/providers-and-models) · [AI 모델](/ko/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="reuse-work-already-done"></a>
### 이미 완료된 작업 재사용

캐시된 번역을 사용하면 모든 것을 다시 번역하는 대신 재실행 시 새 텍스트나 변경된 텍스트에 집중할 수 있습니다.

[번역 상태 유지하기](/ko/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="review-ai-output-locally"></a>
### 로컬에서 AI 출력 검토

번역 대시보드에서 번역을 검사하고, 표현을 수정하고, 용어를 관리하세요.

[대시보드 보기](/ko/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="keep-app-and-content-together"></a>
### 앱과 콘텐츠를 함께 유지

하나의 구성으로 앱 메시지, 문서, 중첩된 로케일 JSON, SVG 텍스트 라벨을 번역하세요. 필요한 것만 활성화하면 됩니다.

[파이프라인 결합하기](/ko/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="translate-the-readme-with-the-app"></a>
### 앱과 함께 README 번역

하나의 `sync`으로 UI 문자열과 리포지토리 Markdown을 처리하고 README에 언어 행을 작성합니다.

[README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme)

</article>
</div>

<a id="see-a-working-project-first"></a>
## 먼저 작동하는 프로젝트 살펴보기

이 예제에는 구성 및 커밋된 번역 파일이 포함되어 있습니다. API 키 없이 출력을 살펴보세요. 번역을 다시 실행하려면 구성된 공급자와 일반적으로 키가 필요합니다. 로컬 Ollama는 API 키가 필요하지 않습니다.

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="a-multilingual-app"></a>
### 다국어 앱

작동하는 Next.js 프로젝트에서 React 컴포넌트, 런타임 연결, 복수형 및 언어 전환을 확인해 보세요.

[Next.js 예제 살펴보기](/ko/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-in-practice"></a>
### Python 실제 적용 사례

Streamlit 앱이 앱에 JavaScript 런타임을 추가하지 않고 메시지를 래핑하고 번역된 JSON을 사용하는 방법을 확인해 보세요.

[Streamlit 예제 살펴보기](/ko/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="docs-in-more-languages"></a>
### 더 많은 언어로 된 문서

현지화된 탐색 및 테마 레이블과 함께 번역된 VitePress 페이지를 확인하세요.

[VitePress 예제 살펴보기](/ko/examples#vitepress-docs)

</article>
</div>

일반 HTML, 다른 프레임워크, 기존 i18n 워크플로를 포함한 [모든 실행 가능한 예제를 둘러보세요](/ko/examples).

<a id="already-have-i18n-keep-what-works"></a>
## 이미 i18n이 있나요? 작동하는 것은 그대로 유지하세요.

처음부터 다시 시작할 필요가 없습니다.

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="source-string-calls"></a>
### 소스 문자열 호출

프로젝트에 이미 있는 `t()` 및 gettext 호출을 유지하세요.

[JS/TS UI 문자열](/ko/guide/ui-strings/) · [Python 및 gettext](/ko/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="json-bundles"></a>
### JSON 번들

i18next 네임스페이스를 포함한 중첩된 로케일 파일을 번역합니다. 사이트 탐색 및 테마 카탈로그는 이 경로가 아닌 [문서 번역](/ko/guide/add-i18n-to-website#what-gets-translated)에 속합니다.

[JSON 번들 번역하기](/ko/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="intlayer-dictionaries"></a>
### Intlayer 사전

Intlayer를 유지하고 누락된 번역을 채우거나, 앱을 소스 문자열 호출로 이동합니다.

[인플레이스 번역](/ko/guide/translating-intlayer) · [소스 문자열 호출로 마이그레이션하기](/ko/guide/migrating-from-intlayer)

</article>
</div>

다이어그램도 있으신가요? 앱 또는 문서와 함께 [SVG 텍스트 레이블을 번역](/ko/guide/svg-translation/)하세요.

<a id="ready-to-add-your-first-language"></a>
## 첫 번째 언어를 추가할 준비가 되셨나요?

<div class="home-cta">

전체 둘러보기를 보려면 [프로젝트를 선택](#start-here)하거나, 설치 및 구성을 위해 [빠른 시작을 여세요](/ko/guide/quick-start).

Node.js 프로젝트의 경우 [npm 패키지](/ko/guide/installation)를 설치하세요.

<a id="python-no-nodejs"></a>

Python의 경우, [독립 실행 파일을 다운로드](/ko/guide/installation#standalone-executables)하세요. 별도의 Node.js 설치가 필요하지 않습니다.

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="go-deeper-when-you-need-to"></a>
## 필요할 때 더 깊이 알아보기

[통합](/ko/guide/integrations/) · [LLM 공급자](/ko/guide/providers-and-models) · [AI 모델](/ko/guide/ai-models) · [구성](/ko/reference/configuration) · [CLI 참조](/ko/reference/cli-commands/)

<br/>

<br/>

::: info 이 사이트에 대하여
비영어 인터페이스와 문서는 ai-i18n-tools로 번역되었습니다. AI 번역에는 오류가 포함될 수 있습니다.

모든 제품명, 로고 및 상표는 해당 소유자의 자산입니다. 아이콘과 이름은 식별 목적으로만 사용됩니다. 이 프로젝트는 해당 브랜드와 제휴하거나 보증하지 않습니다.
:::
