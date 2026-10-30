<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**모든 LLM 제공업체에서 원하는 모델로 앱, 웹사이트, 문서를 번역하세요. 하나의 구성, 캐시된 재실행.**

JavaScript/TypeScript 앱, Python 앱 및 문서 사이트에 언어를 추가하는 CLI 및 툴킷입니다. 시작 언어는 `sourceLocale`이며, 어떤 언어든 가능합니다. 텍스트를 찾아 번역하고 프로젝트가 로드하는 파일을 작성합니다. 내장된 사전 설정은 OpenAI, Anthropic, Gemini, OpenRouter, Ollama 및 모든 OpenAI 호환 API를 지원합니다. 프로젝트 또는 로케일별로 공급자나 모델을 전환할 수 있습니다.

[VitePress](https://vitepress.dev/), [Starlight](https://starlight.astro.build/), [Docusaurus](https://docusaurus.io/), [Nextra](https://nextra.site/), [Fumadocs](https://www.fumadocs.dev/), [Astro](https://astro.build/), [일반 Markdown](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-readme) (저장소 README 및 기타 `.md` 파일), 그리고 일반 HTML과 함께 작동합니다. Python 앱은 `t()` / `_()` 또는 GNU gettext(Streamlit, FastAPI, Flask, Django 및 데스크톱 툴킷)를 사용합니다. 기존 [i18next](https://www.i18next.com/) 카탈로그(네임스페이스 JSON 또는 `t()` 소스 문자열)를 유지합니다. [Intlayer](https://intlayer.org/)와 두 가지 방식으로 작동합니다: Intlayer를 유지하고 `translate-intlayer`로 사전을 채우거나, `migrate-intlayer`를 사용하여 소스 문자열 `t()` 호출로 전환할 수 있습니다. Intlayer는 유형화된 콘텐츠 사전 및 번역 관리 시스템에 계속 적합합니다.

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

<a id="where-do-i-start"></a>
## 어디서부터 시작해야 하나요?

| 가지고 있는 것 | 시작 지점 |
| --- | --- |
| 소스에 일반 텍스트가 있는 JS/TS 앱(React, Next.js, Node, CLI) | [JS/TS 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-js) |
| 파이썬 앱 (Streamlit, FastAPI, Flask, 데스크톱, 스크립트) | [파이썬 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-python) |
| Django 앱, Flask-Babel 카탈로그 또는 이미 GNU gettext를 사용하는 앱 | [Django / 파이썬 gettext 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-django-gettext) |
| 웹사이트 또는 문서 사이트(VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, 일반 HTML) | [웹사이트 또는 문서 사이트에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-website) |
| 저장소 README 및 기타 Markdown 파일(앱 유무와 관계없이) | [README 및 Markdown 문서에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-readme) |
| 이미 `t()` 또는 `_()`를 호출하는 코드 | [UI 문자열](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/) |
| 독립형 중첩 JSON 로케일 파일 | [JSON](https://wsj-br.github.io/ai-i18n-tools/ko/guide/json) |
| 텍스트 레이블이 있는 SVG 다이어그램 | [SVG 번역](https://wsj-br.github.io/ai-i18n-tools/ko/guide/svg-translation/) |
| Intlayer 사전(Intlayer 유지 또는 소스 문자열 호출로 전환) | [Intlayer 제자리 번역](https://wsj-br.github.io/ai-i18n-tools/ko/guide/translating-intlayer) · [Intlayer에서 소스 문자열 호출로 마이그레이션](https://wsj-br.github.io/ai-i18n-tools/ko/guide/migrating-from-intlayer) |

파이프라인이 어떻게 연결되는지 알아보려면 [ai-i18n-tools란 무엇인가요?](https://wsj-br.github.io/ai-i18n-tools/ko/guide/what-is-ai-i18n-tools)를 참조하세요.

<a id="install"></a>
## 설치

ESM 전용입니다. Node.js `>=22.16.0`이 필요합니다.

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

`init`에 전달하는 제공자에 대한 API 키를 설정합니다 (Ollama는 필요 없습니다):

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

기본 `ai-i18n-tools` 명령(direnv, PATH, `package.json` 스크립트 또는 `npx`)을 구성합니다. [설치](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation)를 참조하세요.

<a id="python-no-nodejs"></a>
### Python, Node.js 불필요

Linux 및 macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

설치 프로그램은 이 시스템에 맞는 실행 파일을 선택하고, `SHA256SUMS.txt`를 확인하며, `ai-i18n-tools`로 명령을 설치하고, `PATH`에 추가합니다. 바이너리는 공증되거나 Authenticode 서명되지 않았습니다. 수동 다운로드 단계: [독립형 실행 파일](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation#standalone-executables).

네 가지 Python 예제는 저장소와 릴리스의 `ai-i18n-tools-python-examples.zip`에 있습니다. npm tarball 또는 실행 파일 내에는 없습니다.

<a id="quick-start"></a>
## 빠른 시작

가지고 있는 것에 대한 구성을 스캐폴드한 다음, 경로에 맞는 가이드를 따르세요:

| 가지고 있는 것 | 스캐폴드 | 다음을 따르세요 |
| --- | --- | --- |
| JS/TS 앱 | `ai-i18n-tools init -P openrouter` | [JS/TS 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-js) |
| Python 앱 | `ai-i18n-tools init -t ui-python -P openrouter` | [Python 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-python) |
| Django 또는 GNU gettext 앱 | `ai-i18n-tools init -t ui-python-django -P openrouter` (또는 `ui-python-gettext`, `ui-python-flask`) | [Django / 파이썬 gettext 앱에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-django-gettext) |
| 웹사이트 또는 문서 사이트 | `ai-i18n-tools init -t ui-vitepress -P openrouter` (프레임워크에 맞게 템플릿을 교체하세요) | [웹사이트 또는 문서 사이트에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-website) |
| 앱 유무와 관계없이 README | `ai-i18n-tools init -P openrouter` (JS/TS 앱 + README) 또는 `init -t docs-markdown` | [README 및 마크다운 문서에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-readme) |

프로젝트가 준비되면 `ai-i18n-tools sync`을(를) 실행한 다음 `ai-i18n-tools status`을(를) 실행하여 무엇이 번역되었는지 확인하세요.

JS/TS 앱은 먼저 텍스트를 `t()`으로 래핑해야 합니다. 일반 텍스트에서 실행하면 `sync`은 오류 없이 완료되지만 유용한 내용을 작성하지 않습니다. 또한 사이트 프레임워크는 `sync` 전에 자체 i18n 라우팅이 활성화되어 있어야 합니다.

웹사이트용 템플릿: `ui-starlight`, `ui-docusaurus`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, 및 `ui-plain-html` 또는 `docs-plain-html`. README 및 Markdown 전용: `docs-markdown`. 다른 템플릿에 `--with-readme`를 추가하여 README 블록을 포함합니다. 파이썬 gettext 앱: `ui-python-django`, `ui-python-flask`, `ui-python-gettext`. 중첩된 i18next JSON: `ui-json-bundles`. 전체 목록: [CLI 설정 참조](https://wsj-br.github.io/ai-i18n-tools/ko/reference/cli-commands/setup).

`suggest-models`은(는) 게시된 벤치마크를 기준으로 활성 공급자의 채팅 모델 순위를 매기며, `suggest-models --apply`은(는) `translationModels`을(를) 대체합니다. 동일한 순위가 [모델](https://wsj-br.github.io/ai-i18n-tools/ko/guide/translation-dashboard/models) 탭에 있습니다. 가이드: [AI 모델](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ai-models). 명령어 참조: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/ko/reference/cli-commands/models#suggest-models).

개별 번역 명령을 연결하는 것보다 `sync`을(를) 선호하세요. 전체 연습: [빠른 시작](https://wsj-br.github.io/ai-i18n-tools/ko/guide/quick-start). 한 프로젝트에 여러 종류의 콘텐츠: [파이프라인 결합](https://wsj-br.github.io/ai-i18n-tools/ko/guide/combining-pipelines).

<a id="documentation"></a>
## 문서

- [문서 사이트](https://wsj-br.github.io/ai-i18n-tools/ko/) — 가이드, 통합 및 참조
- [설치](https://wsj-br.github.io/ai-i18n-tools/ko/guide/installation) · [빠른 시작](https://wsj-br.github.io/ai-i18n-tools/ko/guide/quick-start) · [LLM 공급자](https://wsj-br.github.io/ai-i18n-tools/ko/guide/providers-and-models) · [AI 모델](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ai-models)
- [UI 문자열](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/) · [일반 HTML](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/ko/guide/ui-strings/python) · [문서](https://wsj-br.github.io/ai-i18n-tools/ko/guide/documents/) · [HTML 페이지](https://wsj-br.github.io/ai-i18n-tools/ko/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/ko/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/ko/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [사전을 바로 번역](https://wsj-br.github.io/ai-i18n-tools/ko/guide/translating-intlayer) · [소스 문자열 호출로 이동](https://wsj-br.github.io/ai-i18n-tools/ko/guide/migrating-from-intlayer)
- [통합](https://wsj-br.github.io/ai-i18n-tools/ko/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro, 및 [파이썬](https://wsj-br.github.io/ai-i18n-tools/ko/guide/integrations/python)
- [프로젝트에 i18n 추가](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-your-project) — [JS/TS 앱](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-js) · [파이썬 앱](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-python) · [Django / gettext 앱](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-django-gettext) · [웹사이트 또는 문서 사이트](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-website) · [README 및 Markdown 문서](https://wsj-br.github.io/ai-i18n-tools/ko/guide/add-i18n-to-readme) · [파이프라인 결합](https://wsj-br.github.io/ai-i18n-tools/ko/guide/combining-pipelines)
- [CLI 참조](https://wsj-br.github.io/ai-i18n-tools/ko/reference/cli-commands/) · [구성](https://wsj-br.github.io/ai-i18n-tools/ko/reference/configuration) · [런타임 도우미](https://wsj-br.github.io/ai-i18n-tools/ko/guide/runtime-helpers)
- [예시](https://wsj-br.github.io/ai-i18n-tools/ko/examples) — 실행 가능한 데모 (`npx degit …`)
- [AI 에이전트 컨텍스트](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — 소비자 프로젝트를 위한 간결한 프롬프트 / `AGENTS.md` 진입점
- [휴대용 에이전트 스킬](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills) — 한 번 설치 후 워크플로당 슬래시 명령: `npx skills add wsj-br/ai-i18n-tools --all -y` (Node.js 22.20+); [설치 가이드](https://wsj-br.github.io/ai-i18n-tools/ko/guide/coding-agent-skill)

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
