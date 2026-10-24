---
layout: home
title: ai-i18n-tools
description: >-
  JavaScript/TypeScript 애플리케이션, Python 애플리케이션 및 문서화 사이트를 원하는 LLM 공급자로 국제화하기 위한
  CLI 및 툴킷입니다.
hero:
  name: ai-i18n-tools
  text: 모든 LLM으로 앱과 문서를 번역하세요
  tagline: >-
    JavaScript, TypeScript, Python에서 t() 문자열을 추출합니다. OpenAI, Anthropic, Gemini,
    OpenRouter, Ollama 또는 모든 OpenAI 호환 API를 사용하여 단일 구성으로 Markdown, MDX, HTML
    페이지, JSON 번들 및 SVG 레이블을 번역합니다. 코드베이스를 다시 작성할 필요 없이 프로젝트 또는 로케일별로 모델을 전환할 수
    있습니다.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools 로고
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/quick-start
    - theme: alt
      text: GitHub에서 보기
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: npm 패키지
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: UI 문자열
    details: >-
      JavaScript, TypeScript, Astro, Python에서 t() 및 _()를 추출하거나 하나의 HTML 파일에서
      data-i18n 마커를 추출합니다. 로케일별 플랫 JSON 또는 GNU gettext 카탈로그.
  - icon: 📄
    title: 문서
    details: >-
      VitePress, Starlight, Docusaurus, Nextra, Fumadocs 및 일반 정적 사이트를 위한
      Markdown, MDX, Astro, HTML 페이지를 번역합니다.
  - icon: 📦
    title: JSON 번들
    details: UI 복사가 소스 t() 호출 외부에 있을 때 중첩된 로케일 JSON — 테마 레이블, 카탈로그 및 앱 오버라이드.
  - icon: 🔄
    title: 스마트 캐싱
    details: 모든 파이프라인에서 공유되는 SQLite 캐시. 다시 실행 시 새로 추가되거나 변경된 세그먼트만 모델로 전송됩니다.
  - icon: 🔌
    title: 공급자 독립적
    details: 주요 LLM API용 내장 프리셋과 커스텀 OpenAI 호환 엔드포인트. -P로 활성 공급자를 오버라이드할 수 있습니다.
  - icon: ⚡
    title: 하나의 동기화 명령
    details: >-
      단일 설정에서 extract, translate-ui, translate-svg, translate-docs,
      translate-json을 올바른 순서로 실행합니다.
  - icon: 🐍
    title: Python, Node.js 불필요
    details: >-
      각 GitHub Release의 독립형 실행 파일이 Python 앱을 위한 CLI를 실행합니다. Streamlit, FastAPI,
      Flask, Django 및 gettext가 포함되어 있습니다.
  - icon: 📊
    title: 모델 순위 목록
    details: >-
      suggest-models는 활성 공급자의 채팅 모델 순위를 지정하며 translationModels를 작성할 수 있습니다. 동일한
      순위가 대시보드의 Models 탭에도 표시됩니다.
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## 빠른 설치

게시된 패키지는 **ESM 전용**입니다. Node.js `>=22.16.0`이(가) 필요합니다.

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models`은 활성 공급자의 모델 순위를 매깁니다. `--apply`을 추가하여 스캐폴딩된 `translationModels` 목록을 대체하세요. [빠른 시작](/ko/guide/quick-start) 및 [모델](/ko/guide/translation-dashboard/models) 탭을 참조하세요.

<a id="python-no-nodejs"></a>
### Python, Node.js 불필요

[GitHub 릴리스](https://github.com/wsj-br/ai-i18n-tools/releases)에서 일치하는 파일: `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64` 또는 `ai-i18n-tools-win-x64.exe`를 다운로드합니다. `SHA256SUMS.txt`를 확인하고, Unix에서 `chmod +x`를 실행한 다음, 파일을 `PATH`에 넣습니다. 바이너리는 서명되지 않았습니다. 단계: [독립 실행 파일](/ko/guide/installation#standalone-executables). 그런 다음 `ai-i18n-tools init -t ui-python -P cheaperinference`. 연습: [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python).

[설치](/ko/guide/installation)에서 [베어 CLI 명령어 구성](/ko/guide/installation#using-the-cli) (包括 [클론된 모노레포 개발](/ko/guide/installation#cloned-monorepo)) 및 [快速 시작](/ko/guide/quick-start)에서 스캐폴드 템플릿에 대해 참조하십시오.

<a id="which-pipeline-should-i-use"></a>
## 어떤 파이프라인을 사용해야 하나요?

| 콘텐츠 | 명령어 |
| --- | --- |
| 소스 코드에서 `t()` 또는 `_()`(JavaScript, TypeScript 또는 Python), gettext 또는 마커가 포함된 하나의 HTML 파일 사용 | **UI 문자열** — `extract` / `translate-ui` |
| 지역화된 페이지, 문서 사이트 또는 로캘당 하나의 HTML 파일 | **문서** — `translate-docs` |
| 독립형 중첩 JSON 로케일 파일 | **JSON** — `translate-json` |

SVG 일러스트레이션은 별도의 `translate-svg` 경로를 사용합니다 — `docs[].contentPaths`이(가) 아닙니다. 전체 비교는 [ai-i18n-tools란?](/ko/guide/what-is-ai-i18n-tools)을 참조하세요.

<a id="explore-the-documentation"></a>
## 문서 살펴보기

- [**가이드**](/ko/guide/what-is-ai-i18n-tools) — 번역 모드, 설치, 빠른 시작 및 프레임워크 통합
- [**통합**](/ko/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro 및 Python
- [**공급자 및 모델**](/ko/guide/providers-and-models) — 프리셋, 폴백 체인, 순위가 매겨진 제안(`suggest-models`) 및 `-P` 재정의
- [**CLI 참조**](/ko/reference/cli-commands/) — 모든 명령어, 플래그 및 워크플로우
- [**구성**](/ko/reference/configuration) — 전체 `ai-i18n-tools.config.json` 스키마
- [**예제**](/ko/examples) — 17개의 실행 가능한 데모 프로젝트(`npx degit` 또는 Python 예제 zip)
- [**아키텍처**](/ko/reference/architecture) — 내부 구조, 프로그래밍 방식 API 및 확장 지점

패키지를 자체 프로젝트에 통합하시나요? [AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md)부터 시작하세요. [저장소 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)는 자세한 내용을 위해 이곳으로 연결되는 짧은 GitHub/npm 랜딩 페이지입니다.

<br/>
<br/>

::: tip 면책 조항
제품명 및 아이콘은 각 소유주의 재산이며 식별 목적으로만 사용됩니다. 이 소프트웨어는 해당 브랜드와 제휴하지 않으며 공식 승인을 받지 않았습니다.

영어(영국)를 제외한 모든 인터페이스 및 문서 언어는 이 패키지(ai-i18n-tools)를 사용하여 AI로 번역되었으며, 일부 표현이 부정확하거나 오류가 포함될 수 있습니다.
:::

<br/>
