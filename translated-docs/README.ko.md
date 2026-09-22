<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**원하는 AI 모델로 앱과 문서를 번역하세요 — 벤더 종속성 없음, 재작성 불필요.**

JavaScript/TypeScript 앱 및 문서 사이트를 국제화하기 위한 CLI 및 툴킷입니다. `t()` 문자열을 추출하고 Markdown/MDX 페이지, JSON 번들 및 SVG 레이블을 번역합니다. 이 모든 작업을 단일 구성으로 처리할 수 있으며 OpenAI, Anthropic, Gemini, OpenRouter, Ollama를 비롯한 모든 OpenAI 호환 API에 대한 기본 프리셋이 제공됩니다. 코드베이스를 변경하지 않고도 프로젝트별 또는 로캘별로 공급자나 모델을 전환할 수 있습니다.

[VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/) 및 일반 [Markdown](https://commonmark.org/)과 함께 작동합니다. 기존 [i18next](https://www.i18next.com/) 카탈로그(네임스페이스 JSON 또는 `t()` 소스 문자열)를 유지하고, `migrate-intlayer`을(를) 사용하여 [Intlayer](https://intlayer.org/) 프로젝트를 마이그레이션합니다.

<a id="features"></a>
## 기능

| | |
| --- | --- |
| **UI 문자열** | JS/TS/Astro(및 HTML의 `data-i18n*`)에서 `t("…")` 추출 → 로케일별 평면 JSON |
| **문서** | 주요 문서 프레임워크를 위한 Markdown, MDX 및 `.astro` 페이지 번역 |
| **JSON** | 텍스트가 `t()` 호출 외부에 있을 때 중첩된 로케일 번들 번역 |
| **SVG** | `translate-svg`를 통해 일러스트레이션 SVG 라벨 번역 |
| **스마트 캐시** | 공유 SQLite 캐시 — 새롭거나 변경된 세그먼트만 모델을 호출함 |
| **단일 `sync`** | 하나의 설정에서 올바른 순서로 추출 → UI → SVG → 문서 → JSON 실행 |

<a id="which-pipeline"></a>
## 어떤 파이프라인을 사용하나요?

| 콘텐츠 | 명령 |
| --- | --- |
| 소스가 `t()` 또는 HTML 마커를 사용함 | **UI 문자열** — `extract` / `translate-ui` |
| 현지화된 페이지 또는 문서 사이트 | **문서** — `translate-docs` |
| 독립형 중첩 JSON 로케일 파일 | **JSON** — `translate-json` |
| SVG로 레이블이 지정된 다이어그램 또는 일러스트레이션 | **SVG** — `translate-svg` |

전체 비교는 [ai-i18n-tools란 무엇입니까?](https://wsj-br.github.io/ai-i18n-tools/ko/guide/what-is-ai-i18n-tools)를 참조하세요.

<a id="install"></a>
## 설치

ESM 전용입니다. Node.js `>=22.16.0`이 필요합니다.

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

프로바이더의 API 키를 설정하세요(기본 `init`은 OpenRouter를 사용; Ollama는 필요 없음):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

기본 `ai-i18n-tools` 명령(direnv, PATH, `package.json` 스크립트 또는 `npx`)을 구성합니다. [설치](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation)를 참조하세요.

<a id="quick-start"></a>
## 빠른 시작

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

문서 중심 스캐폴드: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website` 또는 `ui-json-bundles`.

개별 번역 명령을 연결하는 것보다 `sync`을(를) 사용하는 것이 좋습니다. 전체 가이드: [빠른 시작](https://wsj-br.github.io/ai-i18n-tools/ko/guide/quick-start).

<a id="documentation"></a>
## 문서

- [문서 사이트](https://wsj-br.github.io/ai-i18n-tools/ko/) — 가이드, 통합 및 레퍼런스
- [설치](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation) · [빠른 시작](https://wsj-br.github.io/ai-i18n-tools/ko/guide/quick-start) · [공급자 및 모델](https://wsj-br.github.io/ai-i18n-tools/ko/guide/providers-and-models)
- [UI 문자열](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/) · [문서](https://wsj-br.github.io/ai-i18n-tools/ko/guide/documents/) · [JSON](https://wsj-br.github.io/ai-i18n-tools/ko/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/ko/guide/svg-translation/)
- [통합](https://wsj-br.github.io/ai-i18n-tools/ko/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [CLI 레퍼런스](https://wsj-br.github.io/ai-i18n-tools/ko/reference/cli-commands/) · [구성](https://wsj-br.github.io/ai-i18n-tools/ko/reference/configuration) · [런타임 헬퍼](https://wsj-br.github.io/ai-i18n-tools/ko/guide/runtime-helpers)
- [예제](https://wsj-br.github.io/ai-i18n-tools/ko/examples) — 실행 가능한 데모(`npx degit …`)
- [AI 에이전트 컨텍스트](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — 소비자 리포지토리의 어시스턴트를 위한 통합 가이드

<a id="contributing"></a>
## 기여하기

이슈와 풀 리퀘스트를 환영합니다. 이 리포지토리의 유지보수자 워크플로: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) 및 [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md).

<a id="license"></a>
## 라이선스

MIT — [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)를 참조하세요.

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

제품명 및 아이콘은 각 소유권자에게 귀속되며 식별 목적으로만 사용됩니다. 본 소프트웨어는 해당 브랜드와 제휴하지 않았으며, 해당 브랜드의 보증을 받지 않습니다.

<small>

> **UI 및 문서 번역 참고 사항:** 영어(영국)를 제외한 모든 인터페이스 및 문서 언어는 이 패키지(ai-i18n-tools)를 사용하여 AI로 번역되었으며, 문구가 부정확하거나 오류가 포함될 수 있습니다.

</small>
