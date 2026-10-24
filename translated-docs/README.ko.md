<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**원하는 AI 모델로 앱과 문서를 번역하세요 — 벤더 종속성 없음, 재작성 불필요.**

JavaScript/TypeScript 앱, Python 앱 및 문서 사이트를 국제화하기 위한 CLI 및 툴킷입니다. `t()` 문자열을 추출하고, Markdown, MDX, HTML 페이지, JSON 번들 및 SVG 레이블을 번역하세요. 이 모든 작업은 단일 설정 파일에서 이루어지며, OpenAI, Anthropic, Gemini, OpenRouter, Ollama 및 모든 OpenAI 호환 API에 대한 기본 제공 프리셋을 지원합니다. 코드베이스를 변경하지 않고 프로젝트별 또는 로케일별로 공급자나 모델을 전환할 수 있습니다.

[VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), 일반 Markdown 및 일반 HTML과 함께 작동합니다. Python 앱은 `t()` / `_()` 또는 GNU gettext(Streamlit, FastAPI, Flask, Django 및 데스크톱 툴킷)를 사용합니다. 기존 [i18next](https://www.i18next.com/) 카탈로그(네임스페이스 JSON 또는 `t()` 소스 문자열)를 유지하며, `migrate-intlayer`을 사용하여 [Intlayer](https://intlayer.org/) 프로젝트를 마이그레이션합니다.

<a id="features"></a>
## 기능

| | |
| --- | --- |
| **UI 문자열** | JS/TS/Astro 및 Python에서 `t("…")` / `_()`을 추출하거나, 하나의 HTML 파일에서 `data-i18n*`를 추출하여 로케일별 플랫 JSON 또는 GNU gettext로 변환 |
| **문서** | Markdown, MDX, `.astro` 및 HTML 페이지 번역(로캘당 하나의 파일) |
| **JSON** | 텍스트가 `t()` 호출 외부에 있을 때 중첩된 로케일 번들 번역 |
| **SVG** | `translate-svg`를 통해 일러스트레이션 SVG 라벨 번역 |
| **스마트 캐시** | 공유 SQLite 캐시 — 새롭거나 변경된 세그먼트만 모델을 호출함 |
| **단일 `sync`** | 하나의 설정에서 올바른 순서로 추출 → UI → SVG → 문서 → JSON 실행 |
| **Python** | 각 GitHub 릴리스의 독립 실행형 실행 파일 — Node.js 설치 없이 CLI 실행 가능 |
| **순위가 지정된 모델** | `suggest-models`은 활성 공급자의 채팅 모델 순위를 지정하며 `translationModels`을 작성할 수 있음 |

<a id="which-pipeline"></a>
## 어떤 파이프라인을 사용하나요?

| 콘텐츠 | 명령어 |
| --- | --- |
| 소스에서 `t()` 또는 `_()`(JavaScript, TypeScript 또는 Python), gettext 또는 `data-i18n*` 마커가 포함된 단일 HTML 파일 사용 | **UI 문자열** — `extract` / `translate-ui` |
| 지역화된 페이지, 문서 사이트 또는 로캘당 하나의 HTML 파일 | **문서** — `translate-docs` |
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

`init`에 전달하는 제공자에 대한 API 키를 설정합니다 (Ollama는 필요 없습니다):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

기본 `ai-i18n-tools` 명령(direnv, PATH, `package.json` 스크립트 또는 `npx`)을 구성합니다. [설치](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation)를 참조하세요.

<a id="python-no-nodejs"></a>
### Python, Node.js 불필요

[GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases)에서 일치하는 에셋을 다운로드하십시오: `ai-i18n-tools-linux-x64`, `ai-i18n-tools-linux-arm64`, `ai-i18n-tools-macos-arm64`, `ai-i18n-tools-macos-x64` 또는 `ai-i18n-tools-win-x64.exe`. `SHA256SUMS.txt`를 확인하고, Unix에서 `chmod +x`을 실행한 다음, 파일을 `PATH`에 배치하십시오. 바이너리는 공증되거나 Authenticode 서명이 되어 있지 않습니다. 4개의 Python 예제는 저장소와 릴리스의 `ai-i18n-tools-python-examples.zip`에 있습니다. 이 예제들은 npm tarball이나 실행 파일 내부에는 포함되어 있지 않습니다. 전체 단계: [Standalone executables](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation#standalone-executables).

<a id="quick-start"></a>
## 빠른 시작

```bash
ai-i18n-tools init -P openrouter   # scaffold config (UI strings template)
ai-i18n-tools suggest-models         # optional ranked shortlist
ai-i18n-tools suggest-models --apply # write that list to translationModels
ai-i18n-tools sync                   # extract + translate per features
```

`init`의 목록은 시작점입니다. `suggest-models`은 활성 공급자의 채팅 모델 순위를 지정합니다. `--apply`는 `translationModels`을 대체합니다. 동일한 순위가 [모델](https://wsj-br.github.io/ai-i18n-tools/ko/guide/translation-dashboard/models) 탭에 표시됩니다. 명령어 참조: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/ko/reference/cli-commands/models#suggest-models).

기타 스캐폴드: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, `docs-plain-html`, `ui-json-bundles`, `ui-python`, `ui-python-gettext`, `ui-python-django` 또는 `ui-python-flask`.

개별 번역 명령어를 연결하는 것보다 `sync`을 사용하는 것을 권장합니다. 전체 가이드: [빠른 시작](https://wsj-br.github.io/ai-i18n-tools/ko/guide/quick-start). Python: [Python 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-python).

<a id="documentation"></a>
## 문서

- [문서 사이트](https://wsj-br.github.io/ai-i18n-tools/ko/) — 가이드, 통합 및 참조
- [설치](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation) · [빠른 시작](https://wsj-br.github.io/ai-i18n-tools/ko/guide/quick-start) · [공급자 및 모델](https://wsj-br.github.io/ai-i18n-tools/ko/guide/providers-and-models)
- [UI 문자열](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/) · [일반 HTML](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/python) · [문서](https://wsj-br.github.io/ai-i18n-tools/ko/guide/documents/) · [HTML 페이지](https://wsj-br.github.io/ai-i18n-tools/ko/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/ko/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/ko/guide/svg-translation/)
- [통합](https://wsj-br.github.io/ai-i18n-tools/ko/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro 및 [Python](https://wsj-br.github.io/ai-i18n-tools/ko/guide/integrations/python)
- [Python 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-python)
- [CLI 참조](https://wsj-br.github.io/ai-i18n-tools/ko/reference/cli-commands/) · [구성](https://wsj-br.github.io/ai-i18n-tools/ko/reference/configuration) · [런타임 헬퍼](https://wsj-br.github.io/ai-i18n-tools/ko/guide/runtime-helpers)
- [예제](https://wsj-br.github.io/ai-i18n-tools/ko/examples) — 실행 가능한 데모 (`npx degit …`)
- [AI 에이전트 컨텍스트](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — 소비자 저장소 내 어시스턴트를 위한 통합 가이드

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
