<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**원하는 AI 모델을 사용하여 앱과 문서를 번역하세요: 종속성 없음, 재작성 없음.**

`ai-i18n-tools`는 대규모 언어 모델을 사용하여 JavaScript/TypeScript 애플리케이션 및 Docusaurus, Astro, Starlight, VitePress, Nextra, Fumadocs, 일반 Markdown/MDX를 포함한 문서 사이트를 국제화하기 위한 CLI 및 툴킷입니다.

내장 프리셋(**OpenAI**, **Anthropic**, **Google Gemini**, **NVIDIA**, **DeepSeek**, **Groq**, **Mistral**, **xAI**, **Cerebras**, **Alibaba**, **APIFUN**, **OpenRouter**, **Ollama**) 중에서 선택하거나 OpenAI 호환 API를 가리키도록 설정하세요. 코드베이스를 수정하지 않고 프로젝트별로, 심지어 언어별로 프로바이더 또는 모델을 전환할 수 있습니다.

하나의 구성 파일이 세 가지 번역 모드를 구동하므로 콘텐츠 구조에 따라 혼합하여 사용할 수 있습니다.

- **UI 문자열** — JS/TS(선택적으로 `.astro` 파일)에서 `t("…")` 호출을 추출하고 i18next 또는 정적 SSG 조회를 위한 플랫, 로케일별 JSON을 생성합니다.
- **문서** — `translate-docs`를 사용하여 `docs[].contentPaths`에 나열된 Markdown, MDX 및 `.astro` 페이지를 번역합니다. **VitePress**, **Starlight**, **Docusaurus**, **Nextra**, **Fumadocs**, Astro 기반 사이트 또는 Markdown/MDX/`.astro` 소스 파일에서 읽는 모든 정적 사이트 생성기와 함께 작동합니다.
- **JSON** — `json[]`에 정의된 임의의 중첩 JSON 번들을 번역합니다. UI 복사본이 소스의 `t()` 호출 대신 로케일별 JSON 파일에 있는 경우 `translate-json`을 사용합니다.

**SVG** 자산은 자체 경로를 가집니다. `features.translateSVG`, 최상위 `svg` 블록 및 `translate-svg`이며, `docs[].contentPaths`는 아닙니다.

**어떤 것을 사용해야 할까요?**

| 귀하의 콘텐츠                                                                  | 명령                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| 소스 코드는 `t()`를 사용합니다                                                        | **UI 문자열** — `extract` / `translate-ui` |
| 현지화된 페이지 또는 문서 사이트 (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro 등) | **문서** — `translate-docs` |
| 독립형, 중첩 JSON 로케일 파일                                          | **JSON** — `translate-json`                 |

세 가지 모두 파일/SQLite 캐시를 공유하므로 새롭거나 변경된 세그먼트(문자열 또는 텍스트 청크)만 모델로 다시 전송됩니다. 어떤 공급자를 사용하든 재실행은 빠르고 저렴합니다.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**목차**

- [번역 유형](#translation-types)
- [설치](#installation)
  - [CLI 사용](#using-the-cli)
- [LLM 공급자](#llm-providers)
- [빠른 시작](#quick-start)
  - [UI 문자열](#ui-strings)
  - [문서](#documents)
  - [VitePress](#vitepress)
  - [Nextra](#nextra)
  - [Fumadocs](#fumadocs)
  - [Astro (일반 Astro & Starlight)](#astro-plain-astro--starlight)
  - [결합된 동기화](#combined-sync)
- [런타임 헬퍼](#runtime-helpers)
- [CLI 명령](#cli-commands)
  - [도구 UI 언어(로그, 도움말, 대시보드)](#tool-ui-language-logs-help-dashboard)
- [문서](#documentation)
- [라이선스](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="translation-types"></a>
## 번역 유형

각 번역 유형에는 전체 구성 세부 정보가 포함된 자체 가이드가 있습니다. [UI 문자열](../docs/guide/ui-strings/), [문서](../docs/guide/documents/), [JSON](../docs/guide/json.md)을 참조하세요. 나란히 비교하려면 [ai-i18n-tools란 무엇인가요?](../docs/guide/what-is-ai-i18n-tools.md)를 참조하세요.

미리 알아두면 좋은 몇 가지 사항: UI 문자열은 활성 LLM 공급자를 통해 로케일별로 누락된 항목을 번역하고([LLM 공급자](#llm-providers) 참조) 플랫 JSON 파일(`de.json`, `pt-BR.json`, …)을 작성하며, 영어 원본 텍스트를 런타임 조회 키로 사용합니다. — `strings.json`는 추출 캐시이지 런타임 번들이 아닙니다. 문서는 `docs[].docsOutput.style` 값 `"nested"`, `"flat"`, `"doc-system"` 및 별칭 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"`을 지원합니다([출력 레이아웃](../docs/guide/documents/output-layouts.md) 참조). 세 가지 모두 `ai-i18n-tools.config.json`를 공유하며 결합할 수 있습니다. `sync`은 `features` 플래그에 따라 추출, UI 번역, SVG 번역, `translate-docs` 및 `translate-json`를 순서대로 실행합니다.

---

<a id="installation"></a>
## 설치

출시된 패키지는 **ESM 전용**입니다(`"type": "module"`). Node.js `>=22.16.0` 이상이 필요합니다.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### CLI 사용하기

프로젝트에 패키지를 설치한 후, npm/pnpm/yarn은 게시된 bin 항목(`bin/ai-i18n-tools.mjs`)을 `node_modules/.bin/ai-i18n-tools`에 연결합니다. 이 shim은 설치된 패키지에서 컴파일된 CLI를 로드합니다.

인터랙티브 셸에서 bare `ai-i18n-tools` 명령을 입력하려면 아래 옵션 중 하나를 구성하세요. 설정하지 않으면 로컬 설치 후에도 셸에서 바이너리를 찾을 수 없습니다.

**direnv** — 프로젝트 루트의 `.envrc`에 추가합니다(bash/zsh; [direnv.net](https://direnv.net/) 참조).

```bash
PATH_add node_modules/.bin
```

`direnv allow` 후에는 프로젝트에 `cd`할 때마다 bare 명령을 사용할 수 있습니다.

**수동 PATH** — 인터랙티브 셸의 프로젝트 루트에서 다음을 실행합니다.

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**전역 설치** — CLI를 한 번 설치하고 모든 디렉터리에서 호출합니다.

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

전역 설치는 전역으로 고정된 버전을 사용합니다. 프로젝트별 버전 고정을 위해서는 `node_modules/.bin`가 프로젝트의 종속성으로 확인되도록 direnv 또는 수동 PATH를 사용하는 것이 좋습니다.

**`package.json` 스크립트** — npm 또는 pnpm이 스크립트를 실행할 때 `node_modules/.bin`을(를) `PATH` 앞에 추가하므로 셸 PATH를 변경하지 않고도 스크립트 내에서 bare 명령 이름이 작동합니다.

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

그런 다음 예를 들어 `pnpm run i18n:sync`을(를) 실행합니다. 스크립트는 추가 셸 설정 없이 로컬 바이너리를 확인합니다.

**대안** — `PATH`을(를) 조정하지 않으려면 `npx ai-i18n-tools …`(npm) 또는 `pnpm exec ai-i18n-tools …`(pnpm)을(를) 사용하세요. `package.json` 항목이 없는 제로 설치 일회성 실행의 경우 `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>`을(를) 사용하세요.

`extract`, `translate-ui`, `translate-svg`, `translate-docs`, `translate-json`를 수동으로 연결하는 것보다 `sync`를 선호하세요. 수동으로 실행할 때 순서와 기능 플래그가 잘못될 수 있습니다. 빠른 시작 가이드의 [권장 `package.json` 스크립트](../docs/guide/quick-start.md#recommended-packagejson-scripts)를 참조하세요.

선택한 프로바이더의 API 키를 설정하세요(환경 변수 이름은 [LLM 프로바이더](#llm-providers)에 있습니다):

```bash
export PROVIDER_API_KEY=sk-your-key-here
```

---

<a id="llm-providers"></a>
## LLM 공급자

번역 명령( `translate-ui` , `translate-docs` , `translate-json` , `sync` , `check-models` 및 관련 스크립트)은 LLM 제공자를 호출합니다. `check-markdown` , `mark-html` , `extract` 는 그렇지 않습니다.

최상위 `providers` 맵 아래에서 제공자를 구성하고 최상위 `provider` 선택기로 활성 제공자를 선택합니다(제공자가 하나만 구성된 경우 선택 사항). 대부분의 제공자는 `translationModels` 목록만 필요합니다. `baseUrl` 및 API 키 환경 변수는 내장된 사전 설정에서 가져옵니다. 제공자별로 `baseUrl`, `apiKeyEnv`, `headers`, `maxTokens`, `temperature`, `requestTimeoutMs`를 재정의할 수 있습니다. `requestTimeoutMs`은 각 요청에 대해 대기할 최대 시간(밀리초)입니다(기본값 `30000`).

각 공급자 블록의 선택적 모델 계층:

- `translationModels` — 전역 순서 대체 체인(번역 기능에 필요).
- `uiModels` — UI 전용 체인(`translate-ui`, 복수 생성, `proofread-ui`): 일치하는 `localeModels` 항목 다음에 `translationModels` 이전에 시도됩니다.
- `localeModels` — **모든** 파이프라인에 대한 로케일별 재정의: 각 항목은 BCP-47 로케일을 해당 로케일에 대해서만 먼저 시도되는 순서가 지정된 모델 목록에 매핑합니다(`pt-br`는 `pt-BR`과 일치).

해결 순서: **UI** → `localeModels(locale)` → `uiModels` → `translationModels`; **문서 / JSON / SVG** → `localeModels(locale)` → `translationModels`. 중복 모델 ID는 순서를 유지하면서 건너뜁니다.

구성을 편집하지 않고 단일 실행에 대해 공급자를 전환하려면 전역 `-P` / `--provider <name>` 옵션(예: `ai-i18n-tools -P groq translate-ui`)을 전달하십시오. 이름은 구성된 `providers` 키 중 하나여야 합니다.

```jsonc
{
  "provider": "ollama",
  "providers": {
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

내장 제공자 사전 설정(키 — 기본 URL — API 키 환경 변수):

| 프로바이더     | 베이스 URL                                                  | API 키 환경 변수      |
|--------------|-----------------------------------------------------------|----------------------|
| `alibaba`    | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`  | `ALIBABA_API_KEY`    |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (없음) |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |

사용자 지정 OpenAI 호환 제공자를 정의하려면 `baseUrl`(키가 필요하지 않은 경우 `apiKeyEnv` 제외)와 함께 새 키를 추가합니다. 모델 ID는 일반 업스트림 ID입니다. 제공자는 구성 수준에서 선택되므로 `provider/` 접두사가 필요하지 않습니다(OpenRouter ID는 네이티브 `vendor/model` 형식을 유지합니다).

모든 프로바이더에 대해 토큰 사용량이 보고되며, 정확한 USD 비용은 프로바이더가 이를 반환할 때만 표시됩니다. `ai-i18n-tools check-models`은(는) 구성된 모든 모델 ID(`translationModels`, `uiModels`, 그리고 모든 `localeModels` 항목)를 활성 프로바이더의 라이브 `GET /models` 목록과 대조하여 검증하며, 프로바이더가 반환할 때 가격을 표시합니다. `ai-i18n-tools list-models`은(는) 활성 프로바이더가 제공하는 모든 모델을 나열합니다(다른 구성된 프로바이더를 검사하려면 `-P` / `--provider`을(를) 사용하세요). `ai-i18n-tools bench-models`은(는) 격리된 상태에서 샘플을 번역하여 모든 고유한 구성 모델 ID(`translationModels`, `uiModels`, `localeModels`)를 벤치마크합니다(모델은 병렬로 실행되며 `concurrency`에 의해 제한됨). 그리고 모델별 입력/출력 토큰, 실제 경과 시간, USD 비용을 출력합니다.

단일 문서에서 `-P`를 사용하여 공급자를 전환하는 실습 데모는 [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)를 참조하세요.

---

<a id="quick-start"></a>
## 빠른 시작

먼저 bare 명령을 위해 셸을 구성하세요 — [CLI 사용](#using-the-cli)을 참조하세요.

<a id="ui-strings"></a>
### UI 문자열

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
ai-i18n-tools init [-P <provider>]

# 2. Extract UI strings to strings.json
ai-i18n-tools extract

# 3. Translate to all target locales
ai-i18n-tools translate-ui
```

그런 다음 `'ai-i18n-tools/runtime'`의 헬퍼를 사용하여 앱에 i18next를 연결합니다. 전체 설정은 UI 문자열 가이드의 [4단계: 런타임에 i18next 연결](../docs/guide/ui-strings/i18next-runtime.md)을 참조하세요.

<a id="documents"></a>
### 문서

기본 `init` 템플릿(`ui-markdown`)은 UI 추출만 가능하게 합니다. `translate-docs` 전에 문서 중심 템플릿을 사용하거나 `features.translateDocs`를 활성화하고 `docs[]`를 추가하세요:

```bash
# Docusaurus docs + optional write-translations catalog
ai-i18n-tools init -t ui-docusaurus [-P <provider>]

# Astro Starlight documentation
# ai-i18n-tools init -t ui-starlight [-P <provider>]

# VitePress documentation (pages + theme catalog)
# ai-i18n-tools init -t ui-vitepress [-P <provider>]

# Nextra documentation (pages + _meta.ts + theme dictionary)
# ai-i18n-tools init -t ui-nextra [-P <provider>]

# Fumadocs documentation (pages + meta.json + UI catalog)
# ai-i18n-tools init -t ui-fumadocs [-P <provider>]

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# ai-i18n-tools init -t ui-astro-website [-P <provider>]

ai-i18n-tools translate-docs
ai-i18n-tools status
# ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json` 편집: `docs[].contentPaths`을 markdown, MDX 및/또는 `.astro` 소스로 설정합니다. `docs[].outputDir` 및 `docs[].docsOutput.style`(`"docusaurus"`, `"astro-starlight"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, `"flat"` 등). 전체 필드 참조: [문서](../docs/guide/documents/).

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress`는 nav/sidebar/footer 문자열을 위한 `docsOutput.style: "vitepress"`와 `docsOutput.vitepressThemeCatalog`를 스캐폴드합니다. `sync`를 실행하여 페이지 마크다운과 테마 카탈로그를 함께 번역하세요. 별도의 JSON 파이프라인이 필요 없습니다. [VitePress 통합](../docs/guide/integrations/vitepress.md) 및 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)을 참조하세요.

<a id="nextra"></a>
### Nextra

`init -t ui-nextra`는 `docsOutput.style: "nextra"`를 스캐폴드합니다. `translate-docs`는 `_meta.ts` 사이드바 레이블을 자동으로 수집하고 번역합니다. `docs[].nextraDictionaryPath`를 설정하여 테마 사전 모듈(예: `app/_dictionaries/en.ts`)도 번역하세요. 모두 동일한 `sync` 실행 내에서 이루어지며, JSON 사이드카는 필요 없습니다. [Nextra 통합](../docs/guide/integrations/nextra.md) 및 [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/)을 참조하세요.

<a id="fumadocs"></a>
### Fumadocs

`init -t ui-fumadocs`는 dot 파서(기본값) 또는 Nextra 스타일 로케일 폴더용 dir 파서를 사용하여 `docsOutput.style: "fumadocs"`를 스캐폴드합니다. `translate-docs`는 `meta.json` 사이드바 레이블을 자동으로 수집하고 번역합니다. `docsOutput.fumadocsUiCatalog`를 설정하여 `lib/layout.shared.ts`의 UI 재정의도 번역하세요. 모두 동일한 `sync` 실행 내에서 이루어지며, JSON 사이드카는 필요 없습니다. [Fumadocs 통합](../docs/guide/integrations/fumadocs.md) 및 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/)을 참조하세요.

<a id="astro-plain-astro--starlight"></a>
### Astro (순수 Astro 및 Starlight)

**Astro Starlight** — `init -t ui-starlight`, 다음 `translate-docs`. Starlight UI 재정의는 필요한 경우 별도의 `docs[]` 블록에서 `jsonPathTemplate`와 함께 `src/content/i18n/en.json`를 사용할 수 있습니다([문서 — 문서 초기화](../docs/guide/documents/index.md#step-1-initialise-for-documentation)).

**일반 Astro** (마케팅 또는 앱 사이트, Starlight 아님) — [Astro 내장 i18n 라우팅](https://docs.astro.build/en/guides/internationalization/)과 ai-i18n-tools를 결합합니다. 참조 프로젝트: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`/`의 영어, `/{locale}/`의 로케일).

대부분의 팀은 두 가지 파이프라인의 **하이브리드**를 사용합니다:

| 파이프라인               | 용도                                                              | 명령                   | 출력                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **페이지 HTML**          | 템플릿 본문의 제목, 단락, 탐색 레이블, 인라인 배열 | `translate-docs`           | 로케일당 `src/pages/{locale}/index.astro`            |
| **UI 문자열(`t()`)** | Frontmatter 데이터, 탭 레이블, 공유 배열 | `extract` → `translate-ui` | `public/locales/{locale}.json` (영어 소스를 키로 사용) |

`init -t ui-astro-website`로 UI를 스캐폴드합니다. `.astro` 페이지의 하드코딩된 HTML의 경우, `features.translateDocs`를 활성화하고 `docsOutput.style: "astro-starlight"`가 포함된 `docs[]` 블록을 추가합니다([Astro 웹사이트 페이지(구문 분석 및 교체)](../docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace) 참조). `targetLocales`, `astro.config.mjs`의 `i18n.locales`, `ui-languages.json`를 정렬합니다(Astro 경로는 `pt-br`와 같은 소문자 코드를 사용하며, 플랫 번들 파일 이름은 `pt-BR.json`와 같이 구성 대소문자를 따릅니다).

클라이언트 아일랜드를 추가하지 않는 한 빌드 시 i18next 없이 `t()`를 연결합니다. [Astro 웹사이트 UI 문자열(SSG)](../docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg) 및 예제의 `src/i18n/t.ts`를 참조하십시오.

<a id="combined-sync"></a>
### 결합된 동기화

```bash
ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## 런타임 헬퍼

`'ai-i18n-tools/runtime'`에서 내보내는 다음 헬퍼들은 모든 JavaScript 환경에서 사용할 수 있습니다. i18next를 가져오지 않아도 사용할 수 있습니다:

| 도우미                                                                  | 설명                                                                                                                                   |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)`                                 | 키를 기본값으로 사용하는 설정을 위한 표준 i18next 초기화 옵션입니다.                                                                    |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 권장 연결 방식: `strings.json`에서 키 정리(key-trim) 및 복수형 `wrapT` 처리를 수행하고, 필요 시 `translate-ui` `{sourceLocale}.json` 복수형 키를 병합합니다. |
| `wrapT(i18n, options)`                                                 | 복수형 인식 기능을 갖춘 저수준 `t()` 래퍼 (일반적으로 `setupKeyAsDefaultT`에 의해 설치됨).                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | 카탈로그 행의 `"plural": true`를 사용하여 `wrapT`에서 사용하는 복수형 그룹 인덱스를 생성합니다.                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | 소스 키에서 `{{var}}` 이름을 구문 분석하여 `wrapT` / 키 자르기 폴백에 사용합니다.                                                              |
| `wrapI18nWithKeyTrim(i18n)` | 낮은 수준의 키 정리(key-trim) 래퍼만 제공합니다. (애플리케이션 연결 시 사용되지 않으며, `setupKeyAsDefaultT` 사용을 권장합니다.) |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | `ui-languages.json`에서 `makeLoadLocale`의 `localeLoaders` 맵을 생성합니다. (`sourceLocale` 제외한 모든 `code` 포함) |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 비동기 로케일 파일 로딩을 위한 팩토리입니다. |
| `getTextDirection(lng)` | BCP-47 코드에 대해 `'ltr'` 또는 `'rtl'`를 반환합니다. |
| `applyDirection(lng, element?)` | `document.documentElement`에 `dir` 속성을 설정합니다. |
| `getUILanguageLabel(lang, t)` | 언어 메뉴 항목을 위한 표시 레이블 (i18n 사용). |
| `getUILanguageLabelNative(lang)` | `t()` 호출 없이 표시 레이블 생성 (헤더 스타일). |
| `interpolateTemplate(str, vars)` | 일반 문자열에 대한 낮은 수준의 `{{var}}` 치환 (내부적으로 사용; 앱 코드는 대신 `t()` 사용 권장). |
| `flipUiArrowsForRtl(text, isRtl)` | RTL 레이아웃을 위해 `→`을 `←`로 전환합니다. |

---

<a id="cli-commands"></a>
## CLI 명령어

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

일반 HTML 앱의 경우, 일반 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 마커로 요소를 주석 처리합니다(소스 텍스트는 요소 자체의 textContent / title / placeholder에서 한 번 작성됨). `mark-html`가 이를 삽입하고 `extract`가 이를 `strings.json`로 캡처합니다. [번역을 위한 HTML 마킹](../docs/guide/ui-strings/plain-html.md#marking-html-for-translation)을 참조하십시오.

명령별 플래그 전체 목록은 [CLI 참조](../docs/reference/cli-commands/)에서 확인할 수 있습니다. 내장 사용법 텍스트를 보려면 `ai-i18n-tools <command> --help`을(를) 실행하세요.

전역 옵션: `-c <config>` (기본값: `ai-i18n-tools.config.json`), `-v` (상세 출력), `-P` / `--provider <name>` (활성 LLM 제공자 재정의, `providers` 아래에 구성되어야 함), `-L` / `--ui-lang <code>` (도구 자체 UI/로그 언어), `-V` / `--version`, `-h` / `--help` — 모든 명령에서 사용 가능합니다. `-w` / `--write-logs [path]`은(는) 콘솔 출력을 로그 파일로 틼(tee)합니다(기본값: 번역 캐시 디렉터리 아래). 단, 번역 및 동기화 명령(`translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync`, `cleanup`)에서만 적용됩니다. 일부 명령은 대상 로케일을 제한하기 위해 `-l` / `--locale <codes>`(쉼표로 구분된 BCP-47)를 지원합니다. `proofread-ui`은(는) 단일 소스 로케일을 사용합니다. 명령 개요는 [CLI 참조](../docs/reference/cli-commands/)를 참조하세요.

<a id="tool-ui-language-logs-help-dashboard"></a>
### 도구 UI 언어(로그, 도움말, 대시보드)

이 도구는 번역하는 로케일과 관계없이 자체 CLI 도움말, 로그 요약 및 번역 대시보드를 현지화합니다. 기본적으로 OS 로케일을 따르며, config에서 `-L pt-BR`, `export AI_I18N_LANG=es` 또는 `"uiLanguage"`로 재정의할 수 있습니다. 로케일 결정, 제공되는 언어 및 대시보드 동작에 대해서는 [도구 UI 언어](../docs/guide/tool-ui-language.md)를 참조하세요.

---

<a id="documentation"></a>
## 문서

- [문서 사이트](https://wsj-br.github.io/ai-i18n-tools/) — VitePress 가이드(GitHub Pages에서 9개 로케일 지원); 전체 가이드로 연결되는 간결한 진입점.
- [빠른 시작](../docs/guide/quick-start.md) — UI 문자열, 문서 및 JSON 설정(UI, docs/`.astro`, JSON 번들, VitePress, Nextra, Fumadocs, Astro Starlight 및 일반 Astro).
- [로케일 에셋 가이드](../docs/guide/images-and-screenshots/) - 번역된 문서의 스크린샷 및 일러스트 SVG(플랫 링크 재작성기, 스크린샷 스크립트).
- [아키텍처](../docs/reference/architecture.md) - 아키텍처, 내부 구조, 프로그래밍 API 및 확장 포인트.
- [AI 에이전트 컨텍스트](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - 패키지를 사용하는 앱을 위한 **통합 프롬프트:** 다운스트림 프로젝트용 (리포지토리의 에이전트 규칙에 복사).
- **이** 리포지토리를 위한 관리자 가이드: `AGENT.md` (규칙 및 워크플로; 클론 전용; npm에 없음). 파이프라인 참조: `docs/reference/`. 로컬 개발 및 게시: `dev/DEVEL.md`.

---

<a id="license"></a>
## 라이선스

이 프로젝트는 MIT 라이선스에 따라 라이선스가 부여됩니다. 
자세한 내용은 [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) 파일을 참조하십시오.

Copyright &copy; 2026 Waldemar Scudeller Jr.
