---
layout: home
title: ai-i18n-tools
description: LLM을 사용하여 JavaScript/TypeScript 애플리케이션 및 문서 사이트를 국제화하는 CLI 및 툴킷입니다.
hero:
  name: ai-i18n-tools
  text: 모든 LLM으로 앱과 문서를 번역하세요
  tagline: >-
    하나의 설정 파일, 세 가지 번역 모드, 그리고 원하는 공급자 — OpenAI, Anthropic, Gemini, OpenRouter,
    Ollama 또는 OpenAI 호환 API. 코드베이스를 다시 작성하지 않고도 프로젝트별 또는 로케일별로 모델을 전환하세요.
  image:
    src: /logo.svg
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
      JS, TS 및 Astro에서 t() 호출을 추출합니다. i18next 또는 정적 SSG 조회를 위한 로케일별 플랫 JSON을
      생성합니다.
  - icon: 📄
    title: 문서
    details: >-
      VitePress, Starlight, Docusaurus, Nextra, Fumadocs 및 일반 정적 사이트용 Markdown,
      MDX 및 Astro 페이지를 번역합니다.
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
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## 빠른 설치

게시된 패키지는 **ESM 전용**입니다. Node.js `>=22.16.0`이(가) 필요합니다.

```bash
pnpm add ai-i18n-tools
export OPENROUTER_API_KEY=sk-or-v1-your-key-here   # or your provider's env var
npx ai-i18n-tools init
npx ai-i18n-tools sync
```

CLI 호출 세부 정보는 [설치](/ko/guide/installation)를, 스캐폴드 템플릿은 [빠른 시작](/ko/guide/quick-start)을 참조하세요.

<a id="which-pipeline-should-i-use"></a>
## 어떤 파이프라인을 사용해야 하나요?

| 콘텐츠 | 명령 |
| --- | --- |
| 소스 코드에서 `t()` 사용 | **UI 문자열** — `extract` / `translate-ui` |
| 현지화된 페이지 또는 문서 사이트 | **문서** — `translate-docs` |
| 독립형 중첩 JSON 로케일 파일 | **JSON** — `translate-json` |

SVG 일러스트레이션은 별도의 `translate-svg` 경로를 사용합니다 — `docs[].contentPaths`이(가) 아닙니다. 전체 비교는 [ai-i18n-tools란?](/ko/guide/what-is-ai-i18n-tools)을 참조하세요.

<a id="explore-the-documentation"></a>
## 문서 살펴보기

- [**가이드**](/ko/guide/what-is-ai-i18n-tools) — 번역 모드, 설치, 빠른 시작 및 프레임워크 통합
- [**통합**](/ko/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus 및 Astro
- [**제공자 및 모델**](/ko/guide/providers-and-models) — 프리셋, 폴백 체인 및 `-P` 재정의
- [**CLI 참조**](/ko/reference/cli-commands/) — 모든 명령, 플래그 및 워크플로
- [**구성**](/ko/reference/configuration) — 전체 `ai-i18n-tools.config.json` 스키마
- [**예제**](/ko/examples) — `npx degit`를 사용한 9개의 실행 가능한 데모 프로젝트
- [**아키텍처**](/ko/reference/architecture) — 내부 구조, 프로그래밍 방식 API 및 확장 지점

전체 npm 스타일 가이드(제공자 표, CLI 명령 목록, 프레임워크 빠른 시작)는 [리포지토리 README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md)를 참조하세요. 패키지를 자체 프로젝트에 통합하시겠습니까? [AI 에이전트 컨텍스트](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md)로 시작하세요.
