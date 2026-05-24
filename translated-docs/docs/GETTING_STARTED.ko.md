<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: 시작하기

`ai-i18n-tools`는 세 가지 독립적이고 조합 가능한 워크플로를 제공합니다:

- **워크플로 1 - UI 번역**: JS/TS 소스에서 `t("…")` 호출을 추출하고 OpenRouter를 통해 번역한 후 i18next에서 바로 사용할 수 있는 평면화된 언어별 JSON 파일을 생성합니다.
- **워크플로 2 - 문서 번역**: `docs[].contentPaths`에 나열된 **마크다운, MDX 및 `.astro` 페이지**를 `translate-docs`를 통해 번역하며, 스마트 캐싱을 지원합니다. 선택적으로 `features.translateDocs`가 활성화된 경우 **Docusaurus 카탈로그 JSON**(`docs[].docusaurusCatalogDir`, `docusaurus write-translations`에서 생성됨)도 동일한 명령어로 번역됩니다. 여기서 번역되는 것은 `docs/`의 본문이 아닌 사이트 UI 요소(네비게이션 바, 푸터, 테마 문자열)입니다.
- **워크플로 3 - JSON 파일 번역**: 최상위 `json[]`, `features.translateJson`, `translate-json`를 사용하여 임의의 중첩된 JSON 번들(예: `src/i18n/en/translation.json`)을 번역합니다. 소스 내에 `t()`를 사용하지 않고 UI 복사본을 언어별 JSON 파일로 관리하는 사이트에 적합합니다.

**SVG** 자산은 `features.translateSVG`, 최상위 `svg` 블록, 그리고 `translate-svg`를 사용합니다([CLI 참조](#cli-reference) 참조).

**어느 워크플로를 사용해야 하나요?** 소스 내 `t()`을 통해 사용자에게 표시되는 문자열 → 워크플로 1(`extract` / `translate-ui`). 지역화된 페이지 또는 Docusaurus 셸 JSON → 워크플로 2(`translate-docs`). 중첩된 JSON 언어 파일만 사용하는 경우 → 워크플로 3(`translate-json`).

두 워크플로우 모두 OpenRouter(호환 가능한 모든 LLM)를 사용하며, 하나의 설정 파일을 공유합니다.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

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
    - [복잡한 Markdown 및 품질 검사 실패](#complex-markdown-and-failed-quality-checks)
    - [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags)
    - [배치 프롬프트 형식](#batch-prompt-format)
    - [SQLite의 세그먼트 중복 제거 및 경로](#segment-dedupe-and-paths-in-sqlite)
  - [출력 레이아웃](#output-layouts)
    - [`markdownOutput.style = "flat"`일 때 앵커 링크](#anchor-links-when-markdownoutputstyle--flat)
    - [번역된 문서의 이미지 및 래스터 에셋](#images-and-raster-assets-in-translated-docs)
    - [언어 전환기(`languageListBlock`)](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` 자리 표시자](#pathtemplate--jsonpathtemplate-placeholders)
  - [문제 해결](#troubleshooting)
- [통합 워크플로(UI + 문서)](#combined-workflow-ui--docs)
  - [혼합 문서 워크플로(`markdownOutput.style = "docusaurus"` + `"flat"`)](#mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat)
- [번역 대시보드](#translation-dashboard)
  - [실패(문서 번역)](#failures-document-translation)
    - [사용 시기](#when-to-use-it)
    - [소스 편집이 중요한 이유](#why-source-edits-matter)
    - [탭 사용 방법](#how-to-use-the-tab)
  - [Markdown 문제(정적 검사)](#markdown-issues-static-checks)
- [구성 참조](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (선택 사항)](#uilanguagespath-optional)
  - [`concurrency` (선택 사항)](#concurrency-optional)
  - [`batchConcurrency` (선택 사항)](#batchconcurrency-optional)
  - [`fileConcurrency` (선택 사항)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (선택 사항)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [git 제외를 위한 모범 사례:](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI 참조](#cli-reference)
- [환경 변수](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## 설치

게시된 패키지는 **ESM 전용**입니다. Node.js 또는 번들러에서는 `import`/`import()`을 사용하고, `require('ai-i18n-tools')`는 사용하지 마십시오. 이 패키지는 `engines.node` `>=22.16.0`를 선언합니다. 이전 버전의 Node.js는 지원되지 않습니다. npm tarball에는 `docs/` 아래에 있는 영문 파일만 포함되어 있으며, `translated-docs/` 아래의 지역화된 사본은 [GitHub 저장소](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)에 있습니다.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools는 자체 문자열 추출기를 포함합니다. 기존에 `i18next-scanner`, `babel-plugin-i18next-extract` 또는 유사한 도구를 사용했다면, 마이그레이션 후 해당 개발 의존성을 제거할 수 있습니다.

<a id="using-the-cli"></a>
### CLI 사용하기

**프로젝트별(권장)** — 종속성 또는 devDependency로 설치한 후 `npx`, `pnpm exec` 또는 `package.json` 스크립트를 통해 호출합니다. `package.json` 스크립트는 `node_modules/.bin`에서 `PATH`로 이미 실행 중이므로 `npx`을 입력하지 않고도 `pnpm run i18n:sync` 명령을 실행할 수 있습니다.

**터미널에서 직접** `ai-i18n-tools` **실행:** 로컬 설치 후 프로젝트 루트에서 대화형 셸에서 CLI를 직접 실행하려면 로컬 bin 디렉터리를 `PATH`에 추가합니다.

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/)를 사용하여 프로젝트 루트의 `PATH_add node_modules/.bin`에 `.envrc`을(를) 추가하면, 저장소에 `cd`한 후에 베어 명령어를 사용할 수 있습니다. `PATH`을(를) 조정하지 않고도 `npx ai-i18n-tools …` 또는 `pnpm exec ai-i18n-tools …`을(를) 계속 사용할 수 있습니다.

**설치 없이 일회성 실행** — `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>` 사용 (해당 실행 시에만 패키지를 다운로드; `package.json`에 항목 추가 없음).

Linux, macOS 및 WSL에서는 레지스트리 설치 시 CLI 스크립트의 실행 권한 비트가 자동으로 설정됩니다. Windows에서는 패키지 관리자가 Node.js를 명시적으로 호출하는 `.cmd` 및 `.ps1` 쉼(Shim)을 생성합니다.

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

기본 `init` 템플릿(`ui-markdown`)은 **UI** 추출 및 번역만을 활성화합니다. `ui-docusaurus` 및 `ui-starlight` 템플릿은 **문서** 번역(`translate-docs`)을 활성화합니다. `ui-astro-website` 템플릿은 일반 Astro 앱(`.astro` 파일 포함)용 **UI** 추출 구조를 생성합니다. `.astro` 페이지 HTML에 대한 `translate-docs`도 원할 경우 `documentations[]` 블록을 추가하세요([Astro 웹사이트 페이지(parse-and-replace)](#astro-website-parse-and-replace) 참조). 참조 문서 [`examples/astro-website`](../../docs/../examples/astro-website/)은 **두 가지** 파이프라인을 모두 사용합니다. 구성에 따라 추출, UI 번역, 선택적 SVG 파일 번역 및 문서 번역을 하나의 명령으로 실행하려는 경우 `sync`을 사용하세요.

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 권장 `package.json` 스크립트

로컬에 패키지를 설치하면 CLI 명령을 스크립트에서 직접 사용할 수 있습니다(`npx` 필요 없음).

**선호** `sync`는 “run `translate-ui`, then `translate-svg`, then `translate-docs`”를 사용했던 모든 것에 대해: `ai-i18n-tools sync`는 **추출**(활성화된 경우), **UI 번역**, 선택적 **SVG 번역**, 그리고 **문서 번역**를 올바른 순서와 공유 플래그로 실행합니다—당신의 구성에 따라. 이 세 가지 번역 명령을 수동으로 연결하는 것은 순서, 추출, 로케일 플래그에서 쉽게 잘못될 수 있습니다. `i18n:translate:ui`, `i18n:translate:svg`, 및 `i18n:translate:docs`는 고립된 **단일** 단계가 필요할 때만 사용하세요.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
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

- `sourceLocale` - 소스 언어 BCP-47 코드 (예: `"en-GB"`). **일치해야 합니다** `SOURCE_LOCALE` 런타임 i18n 설정 파일에서 내보낸 `src/i18n.ts` / `src/i18n.js`.
- `targetLocales` - 대상 언어의 BCP-47 코드 배열 (예: `["de", "fr", "pt-BR"]`). `generate-ui-languages`를 실행하여 이 목록에서 `ui-languages.json` 매니페스트를 생성합니다.
- `ui.sourceRoots` - `t("…")` 호출을 스캔할 디렉토리 또는 glob 패턴 (예: `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - 마스터 카탈로그를 작성할 위치 (예: `"src/locales/strings.json"`).
- `ui.flatOutputDir` - `de.json`, `pt-BR.json`, 등을 어디에 작성할지 (예: `"src/locales/"`).
- `ui.preferredModel` (선택 사항) - `translate-ui`에 대해서만 **먼저** 시도할 OpenRouter 모델 ID; 실패 시 CLI는 중복을 건너뛰고 `openrouter.translationModels` (또는 레거시 `defaultModel` / `fallbackModel`)로 계속 진행합니다.

<a id="step-2-extract-strings"></a>
### 단계 2: 문자열 추출

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 하위의 모든 JS/TS 파일을 스캔하여 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. `ui.stringsJson`에 쓰거나 병합합니다.

스캐너는 구성 가능합니다: `ui.uiExtractor.funcNames`(또는 레거시 `ui.reactExtractor.funcNames`)을 통해 사용자 정의 함수 이름을 추가할 수 있습니다. Astro 페이지 및 컴포넌트의 경우 `.astro`를 `ui.uiExtractor.extensions`에 추가하세요.

<a id="astro-website"></a>
### Astro 웹사이트(Starlight이 아닌 일반 Astro)

정적 Astro 마케팅 사이트 또는 앱 사이트의 경우 [Astro 내장 i18n 라우팅](https://docs.astro.build/en/guides/internationalization/)과 ai-i18n-tools를 함께 사용하세요. 참조 구현은 [`examples/astro-website`](../../docs/../examples/astro-website/)입니다([README](../../docs/../examples/astro-website/README.md)도 참조). 영문은 `/`에, 9개의 대상 로케일은 `/{locale}/`에 있습니다(`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

대부분의 팀은 두 파이프라인의 **하이브리드**를 사용합니다(서로 충돌하지 않음):

| 파이프라인 | 용도 | 명령어 | 출력 |
|----------|---------|----------|--------|
| **페이지 HTML** | 템플릿 본문의 제목, 단락, 내비게이션 레이블, 인라인 배열 | `translate-docs` | 로케일별 `src/pages/{locale}/index.astro` |
| **UI 문자열(`t()`)** | 프론트매터 데이터, 스크린샷 탭 레이블, 공유 배열 | `extract` → `translate-ui` | `public/locales/{locale}.json`(영문 원문을 키로 사용) |

언어를 추가하거나 제거할 때 세 목록을 일치시켜야 합니다: `ai-i18n-tools.config.json`의 `targetLocales`, `astro.config.mjs`의 `i18n.locales`(Astro는 `pt-br`와 같은 **소문자** 라우트 코드 사용), 그리고 `ui-languages.json`(`generate-ui-languages`를 통해). 평면 번들 **파일 이름**은 구성 대소문자 규칙을 따릅니다(`pt-BR.json`); 매니페스트의 `code` 필드를 사용하여 Astro의 `pt-br` 라우트를 해당 파일에 매핑하세요(`examples/astro-website/src/i18n/locale.ts` 참조).

참조 프로젝트에서 가져온 예제 `package.json` 스크립트:

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings"></a>
### Astro 웹사이트 UI 문자열(SSG)

`init -t ui-astro-website`으로 UI 추출 구조를 생성한 후, 페이지 HTML 번역도 수행할 경우 아래에 설명된 대로 `documentations[]` 블록을 병합하세요. TypeScript 모듈과 `.astro` 프론트매터(로케일별 복제 페이지보다 UI 문자열을 선호할 경우 템플릿의 `{expression}` 블록)에서 `t('…')`로 텍스트를 감싸세요:

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

`astro.config.mjs`의 `i18n.defaultLocale`과 일치하도록 `sourceLocale`을 설정하세요. Astro가 빌드 시 가져올 수 있는 디렉터리에 평면 번들을 작성하세요(템플릿은 `public/locales/` 사용). 영문 원문 리터럴을 키로 조회하여 **빌드 시** `t('…')`를 해결하세요(`examples/astro-website/src/i18n/t.ts` 참조; `strings.json`은 런타임 번들이 아닌 추출 캐시임). 로드 후 언어 전환 기능을 클라이언트 아일랜드에 추가하지 않는 한 정적 사이트에서는 `ai-i18n-tools/runtime`이나 i18next가 **필요하지 않습니다**.

`t()`을 호출하는 모든 페이지(영문 루트 페이지 및 각 `src/pages/{locale}/` 복사본)에 연결하세요:

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

예제의 지원 헬퍼: 레이블, 방향, BCP-47 코드용 `src/i18n/utils.ts`, `src/i18n/locale.ts`, `ui-languages.json`. `targetLocales`를 변경한 후 `generate-ui-languages`을 실행하세요(`ui.uiLanguagesPath`를 설정하여 매니페스트가 헬퍼 옆에 위치하도록 할 수 있음, 예: `src/i18n/ui-languages.json`). `resolveUiLanguage(Astro.currentLocale)`에서 `<html lang>`과 `<html dir>`를 설정하는 `MainLayout.astro`; `astro:i18n`에서 `getRelativeLocaleUrl`를 사용하는 `LanguagePicker.astro`.

<a id="astro-website-parse-and-replace"></a>
### Astro 웹사이트 페이지(parse-and-replace)

`.astro` 파일에 하드코딩된 HTML이 포함된 마케팅 페이지의 경우, `translate-docs`이 텍스트 노드 및 속성(`alt`, `title`, `aria-label`, `placeholder`)을 추출하고 문서 캐시로 번역한 후 페이지 트리 아래에 로케일별 사본을 작성하도록 하세요. 대부분의 가시적 텍스트에는 `t()`이 **필요하지 않습니다**.

구조적 속성과 키 값은 **기본적으로** 번역되지 않습니다: 내장 보호는 `class`, `id`, `style`, `src`, `href`, `data-*`, 및 대부분의 `aria-*`와 같은 JSX/HTML 속성을 포함하며, 템플릿 `{expression}` 블록 내의 `class`, `key`, 및 `id`와 같은 객체 키도 포함됩니다. 사용자 정의 속성을 사용할 때 `documentations[].protectAttributes` 및 `documentations[].protectKeys`를 사용하여 이러한 목록을 확장하십시오(예: Tailwind `variant` 또는 CMS `slug` 필드). 동일한 옵션은 마크다운 번역 중 MDX JSX에도 적용됩니다(자세한 내용은 [protectAttributes / protectKeys](#protectattributes-protectkeys)를 참조하십시오).

`features.translateMarkdown`를 활성화하고 `documentations[]` 블록을 추가하십시오. 예:

```json
{
  "features": { "translateMarkdown": true },
  "documentations": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "markdownOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

`npx ai-i18n-tools translate-docs`(또는 [`pnpm i18n:translate`](../../docs/../examples/astro-website/)에서 `pnpm i18n:translate`)를 실행하십시오. 영어 소스는 `src/pages/index.astro`에 유지되며; 각 대상 로케일은 추가 디렉토리 수준에 맞게 조정된 `src/pages/{locale}/index.astro`를 받습니다(예: `../layouts/` → `../../layouts/`).

**템플릿 본문** 내에서, `{expression}` 블록의 문자열 리터럴(인라인 배열, 객체 `title`/`desc` 필드)은 사용자에게 표시될 때 번역됩니다; 보호된 속성/키의 인용된 값, `t('…')`, `<script>`, 및 `<style>` 내의 리터럴은 변경되지 않습니다. **프론트매터 TypeScript는 이 경로에 의해 번역되지 않습니다**—공유 프론트매터(포함 `t()` 가져오기 및 데이터 배열)를 영어 및 로케일 페이지에서 동일하게 유지하거나, 영어 페이지를 편집한 후 `translate-docs`을 다시 실행하여 로케일 복사본이 프론트매터 변경 사항을 반영하도록 하십시오. 프론트매터 전용 복사를 원할 경우, 대신 [UI-string 파이프라인](#astro-website-ui-strings)을 사용하십시오.

[`examples/astro-website`](../../docs/../examples/astro-website/)에서 전체 하이브리드 랜딩 페이지를 확인하십시오(HTML은 `translate-docs`을 통해, 스크린샷 탭 레이블은 `t()` + `translate-ui`를 통해).

<a id="step-3-translate-ui-strings"></a>
### 단계 3: UI 문자열 번역

```bash
npx ai-i18n-tools translate-ui
```

`strings.json`을 읽고, 각 대상 로케일별로 OpenRouter에 배치를 전송하여 평면 JSON 파일(`de.json`, `fr.json` 등)을 `ui.flatOutputDir`에 씁니다. `ui.preferredModel`가 설정된 경우, `openrouter.translationModels`의 정렬된 목록보다 먼저 해당 모델을 시도합니다(문서 번역 및 기타 명령은 여전히 `openrouter`만 사용함).

각 항목에 대해 `translate-ui`는 선택적 `models` 객체에 각 로캘을 성공적으로 번역한 **OpenRouter 모델 ID**를 저장합니다(`translated`와 동일한 로캘 키 사용). 로컬 `dashboard` 명령에서 편집된 문자열은 해당 로캘의 `models`에서 `user-edited`라는 센티널 값으로 표시됩니다. `ui.flatOutputDir` 아래의 로캘별 평면 파일은 **소스 문자열 → 번역**만 포함하며 `models`을 포함하지 않습니다(따라서 런타임 번들은 변경되지 않음).

> **참고:** 번역 대시보드에서 항목을 편집한 경우 업데이트된 캐시 항목으로 출력 파일을 다시 작성하기 위해 `sync --force-update`(또는 `--force-update`가 포함된 동등한 `translate` 명령)을 실행해야 합니다. 또한 나중에 소스 텍스트가 변경되면 새 캐시 키(해시)가 새 소스 문자열에 대해 생성되므로 수동 편집 내용이 손실된다는 점에 유의하세요.

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

<details>
<summary>i18n 부트스트랩 전체 예제(src/i18n.js)</summary>

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

</details>

#### `SOURCE_LOCALE` 동기화 유지

**세 값을 일치시켜 유지하세요:** `ai-i18n-tools.config.json`의 `sourceLocale`, 이 파일의 `SOURCE_LOCALE`, 그리고 평면 출력 디렉터리 아래에 `translate-ui`이 `{sourceLocale}.json`로 작성하는 복수형 평면 JSON (보통 `public/locales/`). 정적 `import`에서 동일한 기본 이름을 사용하세요 (위의 예: `en-GB` → `en-GB.json`). `sourcePluralFlatBundle`의 `lng` 필드는 `SOURCE_LOCALE`과 같아야 합니다. 정적 ES `import` 경로는 변수를 사용할 수 없습니다. 소스 로케일을 변경하는 경우 `SOURCE_LOCALE`과 가져오기 경로를 함께 업데이트하세요. 또는 동적 `import(\`을 사용하여 해당 파일을 로드하세요. ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, 또는 `readFileSync`처럼 경로가 `SOURCE_LOCALE`에서 생성되도록 합니다.

이 코드 조각은 `i18n`가 해당 폴더 옆에 위치하는 것처럼 `./locales/…`과 `./public/locales/…`을 사용합니다. 파일이 `src/` 아래에 있는 경우(일반적인 경우), `../locales/…`와 `../public/locales/…`를 사용하여 가져오기가 `ui.stringsJson`, `uiLanguagesPath`, `ui.flatOutputDir`와 동일한 경로를 참조하도록 하세요.

React가 렌더링하기 전에 `i18n.js`을 임포트하세요(예: 진입점 상단). 사용자가 언어를 변경하면 `await loadLocale(code)`을 호출한 후 `i18n.changeLanguage(code)`를 호출하세요.

`SOURCE_LOCALE`은 다른 파일(예: 언어 전환기)에서 직접 `'./i18n'`을 통해 가져올 수 있도록 내보내집니다. 기존의 i18next 설정을 마이그레이션하는 경우, 컴포넌트 전반에 흩어진 하드코딩된 소스 로케일 문자열(예: `'en-GB'` 확인 코드)을 i18n 부트스트랩 파일에서 `SOURCE_LOCALE`을 가져오는 방식으로 대체하세요.

기본 내보내기를 사용하지 않고 이름을 지정해 가져오기를 선호하는 경우에도 이름 지정된 가져오기(`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`)가 동일하게 작동합니다.

#### 로캘 로더

`ui-languages.json`에서 `makeLocaleLoadersFromManifest`를 사용하여 `localeLoaders`을 **구성과 동기화** 상태로 유지합니다(이 작업은 `makeLoadLocale`와 동일한 정규화를 사용하여 `SOURCE_LOCALE`를 필터링함). `targetLocales`에 로캘을 추가하고 `generate-ui-languages`을 실행하면 매니페스트가 업데이트되고 로더가 자동으로 변경 사항을 추적하므로 별도의 하드코딩된 맵을 관리할 필요가 없습니다.

`public/` 아래의 JSON 번들(일반적인 Next.js 설정)의 경우 공용 URL 경로에서 가져옵니다:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

번들러가 없는 Node CLI의 경우 각 코드에 대해 JSON 파일을 읽고 구문 분석하는 작은 도우미 내에서 `readFileSync`을 사용합니다.

#### 런타임 도우미 참조

`aiI18n.defaultI18nInitOptions(sourceLocale)`은 키를 기본값으로 설정하는 경우의 표준 옵션을 반환합니다:

- `parseMissingKeyHandler`은 키 자체를 반환하므로 번역되지 않은 문자열은 소스 텍스트를 표시합니다.
- `nsSeparator: false`은 콜론을 포함하는 키를 허용합니다.
- `interpolation.escapeValue: false` — 안전하게 비활성화 가능: React 자체가 값을 이스케이프하며, Node.js/CLI 출력에는 이스케이프할 HTML이 없습니다.

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })`은 ai-i18n-tools 프로젝트에 **권장되는** 배선 방식입니다. 키 축약 및 소스 로케일 <code>"{{var}}"</code> 보간 폴백을 적용하며(하위 수준의 `wrapI18nWithKeyTrim`과 동일한 동작), 선택적으로 `translate-ui` `{sourceLocale}.json` 복수형 접미사 키를 `addResourceBundle`를 통해 병합한 후, 사용자의 `strings.json`에서 복수형 인식 기능을 갖춘 `wrapT`를 설치합니다. 부트스트래핑 중일 때만 `sourcePluralFlatBundle`을 생략하고, `translate-ui`이 `{sourceLocale}.json`를 출력한 후에는 반드시 병합해야 합니다. 애플리케이션 코드에서는 `wrapI18nWithKeyTrim` 단독 사용이 **사용 중단됨** 상태이므로, 대신 `setupKeyAsDefaultT`을 사용하세요.

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

i18next의 기본 두 번째 인수 보간을 사용하여 <code>"{{var}}"</code> 자리 표시자를 처리합니다:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

추출 명령은 일반 객체 리터럴일 때 **두 번째 인수**를 구문 분석하고 `plurals: true` 및 `zeroDigit`과 같은 도구 전용 플래그를 읽습니다(아래 **카디널 복수형** 참조). 일반 문자열의 경우 해싱에는 리터럴 키만 사용되며, 보간 옵션은 여전히 런타임에 i18next로 전달됩니다.

프로젝트에서 사용자 정의 보간 유틸리티를 사용하는 경우 (예: `t('key')`를 호출한 다음 결과를 `interpolateTemplate(t('Hello {{name}}'), { name })`와 같은 템플릿 함수로 파이프하는 경우), `setupKeyAsDefaultT` (`wrapI18nWithKeyTrim`를 통해) 이를 불필요하게 만듭니다 — 소스 로케일이 원시 키를 반환할 때도 <code>"{{var}}"</code> 보간을 적용합니다. 호출 사이트를 `t('Hello {{name}}', { name })`로 마이그레이션하고 사용자 정의 유틸리티를 제거하십시오.

<a id="cardinal-plurals-plurals-true"></a>
### 기수 복수형(`plurals: true`)

개발자 기본 사본으로 원하는 **동일한 리터럴**을 사용하고, 추출 + `translate-ui`이 호출을 하나의 **기수 복수형 그룹**으로 처리하도록 `plurals: true`을 전달하세요 (i18next JSON v4 스타일 `_zero` … `_other` 형태).

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit` (선택 사항) — 도구 전용이며, i18next에서 **읽지 않음**. `true`인 경우, 해당 형태가 존재하는 각 로케일의 `_zero` 문자열에서 리터럴 아랍어 `0` 사용을 선호하도록 프롬프트에 지시함. `false`이거나 생략된 경우, 자연스러운 0 표현 방식을 사용함. `i18next.t` 호출 전에 이러한 키를 제거해야 함 (아래의 `wrapT` 참조).

**검증:** 메시지에 **두 개 이상**의 서로 다른 `{{…}}` 플레이스홀더가 포함되어 있으면, **그 중 하나는** `{{count}}`(복수 축)이어야 합니다. 그렇지 않으면 `extract` **실패**하며 명확한 파일/라인 메시지가 표시됩니다.

**두 개의 독립적인 수치**(예: 섹션 및 페이지)는 하나의 복수형 메시지를 공유할 수 없습니다. UI에서 연결하여 사용하려면 각각 `plurals: true`과 자체 `count`를 가진 **두 개**의 `t()` 호출을 사용해야 합니다.

**v1에는 없음:** 서수 복수형(`_ordinal_*`, `ordinal: true`), 구간 복수형, ICU 전용 파이프라인.

#### 복수형이 저장되고 출력되는 방식

**복수 그룹은** `strings.json`에서 **해시당 한 행**을 사용하며, `"plural": true`, 원본 리터럴은 `source`에, 그리고 `translated[locale]`은 기수 범주(`zero`, `one`, `two`, `few`, `many`, `other`)를 해당 로케일의 문자열에 매핑하는 객체로 표현됩니다.

**평탄화된 로케일 JSON:** 단수형 행은 **원문 문장 → 번역문** 형태를 유지함. 복수형 행은 i18next가 복수형을 네이티브로 해석할 수 있도록, `<groupId>_original` (참조용으로 `source`과 동일함)과 각 접미사에 대한 `<groupId>_<form>`로 출력됨. `translate-ui`는 또한 **복수형 평탄화 키만** 포함하는 `{sourceLocale}.json`를 작성함 (소스 언어용 번들을 로드하여 접미사 키가 해석되도록 함; 일반 문자열은 여전히 키를 기본값으로 사용함). 각 대상 로케일에 대해 출력된 접미사 키는 해당 로케일의 `Intl.PluralRules` (`requiredCldrPluralForms`)와 일치함: `strings.json`이 압축 후 다른 범주와 동일하여 범주를 생략한 경우(예: 아랍어 `many`이 `other`과 동일한 경우), `translate-ui`는 여전히 대체 문자열에서 복사하여 필요한 모든 접미사를 평탄화 파일에 기록하므로 런타임 조회 시 키 누락이 발생하지 않음.

런타임(`ai-i18n-tools/runtime`): **호출** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — `wrapI18nWithKeyTrim`를 실행하고, 선택적 `translate-ui` `{sourceLocale}.json` 복수형 번들을 등록한 후 `wrapT`를 `buildPluralIndexFromStringsJson(stringsJson)`를 사용하여 수행함. `wrapT`는 `plurals` / `zeroDigit`를 제거하고, 필요 시 키를 그룹 ID로 재작성하며, `count`를 전달함 (선택 사항: 단일 비-`{{count}}` 자리표시자가 있는 경우, `count`는 해당 숫자 옵션에서 복사됨).

**이전 환경:** 도구 및 일관된 동작을 위해 `Intl.PluralRules`이 필요합니다. 매우 오래된 브라우저를 대상으로 할 경우 폴리필을 사용하세요.

<a id="language-switcher-ui"></a>
### 언어 전환기 UI

언어 선택기를 만들기 위해 `ui-languages.json` 매니페스트를 사용하세요. `ai-i18n-tools`는 두 개의 표시 헬퍼를 내보냅니다:

<details>
<summary>LanguageSelect 컴포넌트 예제(React)</summary>

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

</details>

<br />

`getUILanguageLabel(lang, t)` - 번역되었을 때 `t(englishName)`을 표시하고, 두 값이 다를 경우 `englishName / t(englishName)`를 표시합니다. 설정 화면에 적합합니다.

`getUILanguageLabelNative(lang)` - `englishName / label`을 표시합니다(`t()` 호출 없이 각 행에 대해). 헤더 메뉴에서 네이티브 이름을 표시하고자 할 때 적합합니다.

`ui-languages.json` 매니페스트는 <code>"{ code, label, englishName, direction }"</code> 항목의 JSON 배열입니다 (`direction`은 `"ltr"` 또는 `"rtl"`입니다). 예:

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

주로 **markdown, MDX 및 `.astro` 문서**를 `docs[].contentPaths`에서 사용하도록 설계되었습니다. Docusaurus 사이트에서는 `docs[].docusaurusCatalogDir`를 `write-translations` 카탈로그 폴더(예: `docs-site/i18n/en`)로 설정하여 `translate-docs`가 셸 JSON(내비게이션 바, 푸터, 테마 문자열)도 번역하도록 합니다. 마크다운에 포함된 PNG 및 기타 래스터 이미지는 [번역된 문서의 이미지 및 래스터 에셋](#images-and-raster-assets-in-translated-docs)을 참조하세요. README 또는 문서에 `docsOutput.style = "flat"`과 함께 선택적 **언어 전환기** 블록을 추가하려면 [언어 전환기(`languageListBlock`)](#language-list-block)를 참조하세요. SVG 파일은 `features.translateSVG`가 활성화된 경우 [`translate-svg`](#cli-reference)을 통해 번역되며, `docs[].contentPaths`을 통해서는 번역되지 않습니다. 임의의 중첩된 UI JSON 파일은 `docs[]`이 아닌 워크플로 3(`json[]` / `translate-json`)을 사용합니다.

<a id="step-1-initialise-for-documentation"></a>
### 단계 1: 문서용 초기화

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Astro Starlight 문서 사이트의 경우:

```bash
npx ai-i18n-tools init -t ui-starlight
```

일반 Astro 웹사이트 UI(스타라이트 없음)의 경우:

```bash
npx ai-i18n-tools init -t ui-astro-website
```

해당 템플릿은 UI 추출만 가능하게 합니다. 페이지 HTML 번역을 위해서는 `features.translateDocs`도 설정하고 `docs[]` 블록을 추가해야 합니다([Astro 웹사이트 페이지(parse-and-replace)](#astro-website-parse-and-replace) 참조). [`examples/astro-website`](../../docs/../examples/astro-website/) 구성에는 두 파이프라인이 함께 표시되어 있습니다.

생성된 `ai-i18n-tools.config.json`을 편집하세요:

- `sourceLocale` - 소스 언어(`docusaurus.config.js`의 `defaultLocale`과 일치해야 함).
- `targetLocales` - BCP-47 로케일 코드 배열(예: `["de", "fr", "es"]`).
- `cacheDir` - 모든 파이프라인에 공유되는 SQLite 캐시 디렉터리(`--write-logs`의 기본 로그 디렉터리이기도 함).
- `docs` - 문서 블록들의 배열. 각 블록은 선택적 `description`, `contentPaths`(문자열 또는 배열; 파일, 디렉터리 또는 glob), `outputDir`, 선택적 `docusaurusCatalogDir`, `docsOutput`, 선택적 `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` 등을 포함할 수 있습니다.
- `docs[].description` - 유지 관리자를 위한 선택적 간단한 메모. 설정된 경우 `translate-docs` 제목 및 `status` 섹션 헤더에 표시됩니다.
- `docs[].contentPaths` - 마크다운/MDX/`.astro` 소스(`docusaurusCatalogDir`가 있는 경우 Docusaurus 셸 JSON 포함).
- `docs[].outputDir` - 해당 블록의 번역된 출력 루트.
- `docs[].docsOutput.style` - `"nested"`(기본값), `"flat"`, `"doc-system"` 또는 별칭 `"docusaurus"` / `"astro-starlight"`([출력 레이아웃](#output-layouts) 참조).

**주요 vs 보조:** 지역화된 페이지에는 `contentPaths`에 집중하세요. `write-translations`에서 Docusaurus 셸 JSON도 필요할 경우 `docusaurusCatalogDir`을 설정하세요. 페이지 번역만 수행할 경우 `docusaurusCatalogDir`는 생략하세요.

<a id="step-2-translate-documents"></a>
### 단계 2: 문서 번역

```bash
npx ai-i18n-tools translate-docs
```

이 명령은 모든 `docs[]` 블록의 `contentPaths`에 있는 모든 파일(및 `docusaurusCatalogDir`가 설정된 경우 Docusaurus 카탈로그 JSON)을 모든 유효한 문서 로케일로 번역합니다. 이미 번역된 세그먼트는 SQLite 캐시에서 제공되며, 새로 추가되거나 변경된 세그먼트만 LLM에 전송됩니다.

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

**어느 구문이 실패했는지**, 얼마나 자주 실패했는지, 그리고 저장된 **품질/오류 메시지**를 확인하려면 번역 대시보드의 **실패** 탭([번역 대시보드 → 실패](#failures-document-translation))을 사용하세요.

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### 캐시 동작 및 `translate-docs` 플래그

CLI는 SQLite에 **파일 추적**(파일별 소스 해시 × 로캘) 및 **세그먼트** 행(번역 가능한 청크별 해시 × 로캘)을 저장합니다. 일반 실행 시 추적된 해시가 현재 소스와 일치하고 **그리고** 출력 파일이 이미 존재하면 해당 파일을 완전히 건너뜁니다. 그렇지 않은 경우 파일을 처리하며 세그먼트 캐시를 사용하여 변경되지 않은 텍스트는 API를 호출하지 않습니다.

| 플래그                          | 효과                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(기본값)*                   | 추적 중인 파일과 디스크에 있는 출력이 동일할 경우 건너뛰고, 나머지에는 세그먼트 캐시를 사용합니다.                                                                                                                                                                          |
| `-l, --locale <codes>`        | 쉼표로 구분된 대상 로케일(생략 시 루트 `targetLocales`과 각 `documentations[]` 블록의 선택적 `targetLocales`의 통합값을 기본값으로 사용).                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | 이 경로 아래에서만 markdown/JSON을 번역합니다 (프로젝트 상대, 절대 또는 glob 패턴); `--file`는 `--path`의 별칭입니다.                                                                                                                                 |
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

| 모드                   | 사용자 메시지                                                           | 모델 응답                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | 의사-XML: 각 세그먼트에 하나의 `<seg id="N">…</seg>` 포함(XML 이스케이프 적용). | 각 세그먼트 인덱스에 하나의 `<t id="N">…</t>` 블록만 포함.       |
| `json-array` (기본값) | 순서대로 세그먼트당 하나의 항목을 가진 문자열의 JSON 배열.               | **동일한 길이**의 JSON 배열 (동일한 순서).           |
| `json-object`          | 세그먼트 인덱스로 키가 지정된 JSON 객체 `{"0":"…","1":"…",…}`.            | **동일한 키**를 가지고 번역된 값을 포함하는 JSON 객체. |

실행 헤더는 활성화된 모드를 확인할 수 있도록 `Batch prompt format: …`도 출력합니다. JSON 레이블 파일(`jsonSource`)과 SVG 파일 배치는 해당 단계가 `translate-docs`의 일부로 실행될 때(또는 `sync`의 문서 단계 — `sync`는 이 플래그를 노출하지 않으며 기본값은 `json-array`임) 동일한 설정을 사용합니다.

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### 세그먼트 중복 제거 및 SQLite의 경로

> **참고:** 이 섹션은 `cleanup` 동작이나 사용자 정의 도구 개발 시 디버깅에 유용한 내부 캐시 키 세부 정보를 다룹니다. 대부분의 사용자는 이 섹션을 건너뛰어도 됩니다.

- 세그먼트 행은 `(source_hash, locale)`(해시 = 정규화된 콘텐츠)를 전역적으로 키로 사용합니다. 두 파일에 동일한 텍스트가 있으면 하나의 행을 공유하며, `translations.filepath`은 메타데이터(마지막 작성자)이며 파일당 두 번째 캐시 항목이 아닙니다.
- `file_tracking.filepath`는 네임스페이스가 지정된 키를 사용합니다. `documentations` 블록당 `doc-block:{index}:{relPath}`(`relPath`는 프로젝트 루트 기준의 posix 경로임: 수집된 마크다운 경로; **JSON 레이블 파일은 소스 파일에 대한 현재 작업 디렉터리 기준 상대 경로를 사용함**, 예: `docs-site/i18n/en/code.json`이므로 정리 작업이 실제 파일을 확인할 수 있음), 및 `translate-svg` 아래의 SVG 파일에 대한 `svg-files:{relPath}`.
- `translations.filepath`는 마크다운, JSON 및 SVG 세그먼트에 대해 현재 작업 디렉터리 기준의 posix 상대 경로를 저장합니다(SVG는 다른 자산과 동일한 경로 형식을 사용하며, `svg-files:…` 접두사는 **오직** `file_tracking`에만 존재함).
- 실행 후 `last_hit_at`는 **같은 번역 범위 내**에서(`--path` 및 활성화된 종류를 고려하여) 접근되지 않은 세그먼트 행에 대해서만 삭제되므로, 필터링되거나 문서 전용 실행 시 관련 없는 파일이 오래되었다고 표시되지 않습니다.

<a id="output-layouts"></a>
### 출력 레이아웃

`markdownOutput.style`은 번역된 마크다운 파일이 작성되는 위치를 제어합니다. 아래의 정확한 문자열 값을 `documentations[].markdownOutput.style`에서 사용하세요(별칭은 사전 설정된 레이아웃이며 별도의 엔진이 아님).

`markdownOutput.style = "nested"` (생략 시 기본값) — `{outputDir}/{locale}/` 아래에 소스 트리를 미러링합니다(예: `docs/guide.md` → `i18n/de/docs/guide.md`).

`markdownOutput.style = "doc-system"` — 정적 문서 사이트를 위한 로케일 접두사가 붙은 문서 트리입니다. `docsRoot` 아래의 파일은 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`에 작성됩니다. `docsRoot` 외부의 경로는 중첩된 레이아웃으로 폴백됩니다. `documentations[].markdownOutput.docsRoot`를 영어 소스 루트로 설정하세요(예: `"docs"` 또는 `"src/content/docs"`). `markdownOutput.style = "doc-system"`인 경우, `localeSubpath`을 명시적으로 설정해야 합니다(사전 설정된 별칭 중 하나를 사용하세요).

**별칭**(동일한 레이아웃 엔진, 사전 설정된 `localeSubpath`):

- `markdownOutput.style = "docusaurus"` — `localeSubpath`의 기본값은 `docusaurus-plugin-content-docs/current`입니다(Docusaurus i18n 플러그인 레이아웃).
- `markdownOutput.style = "astro-starlight"` — `localeSubpath`의 기본값은 `""`입니다(번역된 페이지가 `{outputDir}/{locale}/` 바로 아래에 위치하며, 영어 콘텐츠가 콘텐츠 루트에 있고 `outputDir`이 `docsRoot`과 동일할 때 [Starlight](https://starlight.astro.build/guides/i18n/)와 일치함).

Docusaurus 사전 설정(기본 문서 페이지):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight 사전 설정(동일한 블록 구조, 다른 경로):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

선택적 JSON 레이블 — `jsonSource`에서 가져온 Docusaurus 셸 문자열(MDX 본문 복사본 아님):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight는 여러 로케일의 UI 문자열을 기본 제공하며, 필요 시 별도의 `documentations[]` 블록에서 `jsonPathTemplate: "{outputDir}/{locale}.json"`과 함께 `src/content/i18n/en.json`를 사용하여 선택적으로 사용자 정의 UI를 재정의할 수 있음.

`markdownOutput.style = "flat"` — 로케일 접미사가 붙거나 하위 디렉터리에 번역된 파일을 소스 옆에 배치합니다. `markdownOutput.style = "flat"`이 설정된 경우 페이지 간 상대 링크는 자동으로 다시 작성됩니다(`rewriteRelativeLinks: false` 또는 사용자 정의 `pathTemplate`이 설정된 경우 제외).

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-markdownoutputstyle--flat"></a>
#### `markdownOutput.style = "flat"`일 때 앵커 링크

`markdownOutput.style = "flat"`일 경우, 출력은 각 로케일에 대해 페이지 간 **상대 경로**를 다시 작성합니다(`guide.md` → `guide.de.md`). **앵커 링크** — 경로 뒤에 `#`가 붙는 일반적인 마크다운 인라인 형식 — 는 대상 파일 내 섹션으로 이동합니다:

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

여기서 링크 대상은 `setup.md`이며, `#first-run`은 앵커입니다. 해당 파일 내 적절한 제목으로 스크롤되어야 합니다.

**왜 앵커 링크에 주의가 필요한가**

- `rewriteRelativeLinks`은 각 로캘의 **파일명**을 고정합니다(`setup.md` → `setup.de.md`).
- 많은 렌더러는 **보이는 제목 텍스트**에서 `#` 슬러그를 유도합니다. 번역 후 제목은 로캘별로 달라지므로 자동 생성된 슬러그는 변경될 수 있지만, 다시 작성된 링크는 여전히 `#first-run`라고 표시될 수 있습니다. 또는 영어 `#…` 앵커가 번역된 제목에서 렌더러가 생성한 슬러그와 더 이상 일치하지 않을 수 있습니다.
- 결과: 독자는 올바른 **파일**에는 도달하지만 **잘못된 줄**에 도달하거나, 브라우저가 일치하는 제목을 찾지 못합니다.

**해야 할 조치**

1. `translate-docs` 전에 소스 `.md` / `.mdx`에서 `ai-i18n-tools write-heading-ids`을 실행하세요(일반적인 `documentations[]` / `contentPaths`와 동일). 이 도구는 각 제목 앞 줄에 명시적인 HTML 앵커를 삽입하여 `id` 값이 모든 번역본에서 공유되도록 합니다. 제목 이름을 변경한 후에는 이 도구를 다시 실행하여 오래된 앵커 ID가 현재 제목과 일치하도록 갱신하세요.
2. 마크다운 **앵커 링크**를 이러한 안정적인 ID를 가리키도록 설정하세요. 예: `[label](../../docs/other.md#section-id)`, 여기서 `section-id`은 도구가 작성한 앵커와 일치해야 하며, 영어 단어만으로 추측한 값이 아니어야 합니다.

**예시**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`write-heading-ids` 후의 `docs/security.md` (간소화됨):

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

`translate-docs` 후, 파일 경로와 `#…` 앵커는 모든 로캘 파일에서 일치하게 유지됩니다. 예를 들어:

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration` 앵커는 소스에서 `id`이 고정되어 있으므로 모든 로캘에서 동일합니다. 제목의 **텍스트**와 링크 **레이블**만 번역됩니다.

<a id="images-and-raster-assets-in-translated-docs"></a>
#### 번역된 문서의 이미지 및 래스터 자산

`translate-docs`은 이미지 대체 텍스트를 포함한 마크다운 구문을 번역합니다. 하지만 래스터 파일(PNG, JPEG, WebP, GIF)을 문서 `outputDir`에 복사하지는 않습니다. 번역된 URL이 가리키는 위치에 스크린샷 파일을 직접 배치하거나, 번역 후 `postProcessing.regexAdjustments`를 사용하여 경로를 다시 작성해야 합니다.

번역 가능한 텍스트가 포함된 SVG 파일의 경우 `svg` 블록과 `translate-svg`을 사용하세요 — [`svg`](#svg) 참조.

전체 결정 가이드, 구성 예제 및 디렉토리 레이아웃, 스크린샷 스크립트 계약, 디자인 권장 사항 및 일반적인 실수를 보려면 [로케일 자산 가이드](LOCALE-ASSETS-GUIDE.ko.md)를 참조하세요.

**빠른 참조 — 다섯 가지 패턴**

| 패턴                         | 사용 용도                                              | 메커니즘                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — 공유 래스터            | 단일 이미지, 로케일별 변형 없음                       | `regexAdjustments` 전체 경로 수정                  |
| B — 로케일별 폴더          | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/docs | `regexAdjustments` 로케일 세그먼트 교환            |
| C — Docusaurus 동시 배치     | `markdownOutput.style = "docusaurus"` 사이트 | 스크린샷 스크립트가 파일을 배치; 정규 표현식 없음          |
| D — 번역된 SVG             | SVG 일러스트레이션을 포함하는 웹 앱                    | `translate-svg`와 `svg.style = "flat"`         |
| E — 동시 배치된 번역 SVG   | `markdownOutput.style = "docusaurus"` 문서          | `translate-svg`와 `svg.style = "nested"` + `pathTemplate` |

**플랫 링크 리라이터 및 2단계 흐름**

`markdownOutput.style = "flat"`일 때, 내장 리라이터가 `postProcessing` 전에 실행됩니다. 출력 파일당 깊이 접두사를 계산합니다 — 출력 파일의 디렉토리에서 소스 파일의 디렉토리까지의 상대 경로 — 그리고 이를 비마크다운 자산 URL에 추가합니다. `postProcessing`는 이미 접두사가 추가된 URL에서 실행됩니다 — 로케일 세그먼트와 일치하는 `search` 패턴을 작성하세요, 선행 `../` 접두사가 아닙니다.

`flatPreserveRelativeDir: true`를 사용하면, 하위 디렉토리에 있는 소스 파일은 자동으로 파일 특정 접두사를 갖습니다. 예를 들어, `docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md`는 `../../docs/`의 접두사를 생성하므로, `translation-dashboard.png`(소스의 형제)는 `../../docs/translation-dashboard.png`가 되어 `postProcessing` 규칙 없이 올바르게 해결됩니다.

`markdownOutput.style`가 `"docusaurus"`, `"astro-starlight"`, `"nested"` 또는 `"flat"` 이외의 값일 때, 플랫 링크 리라이터는 실행되지 않습니다. `postProcessing`는 원래 마크다운 URL을 봅니다.

**패턴 A 예시** — `markdownOutput.style = "flat"`일 때 소스 파일과 함께 상대 경로 자산에 대한 구성 필요 없음. 패턴 A `postProcessing` 규칙은 절대 URL 자산(예: `/img/...`) 또는 CDN 대상 교체에만 필요합니다.

**패턴 B 예시 — `markdownOutput.style = "flat"` README** (`examples/nextjs-app`, 두 번째 `documentations[]` 블록)

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

일반적인 `[^/]+` 형식을 사용하고 하드코딩된 소스 로케일을 사용하지 마세요, 그러면 규칙이 `sourceLocale`가 변경되더라도 계속 작동합니다.

**패턴 B 예시 — `markdownOutput.style = "docusaurus"`** (`examples/nextjs-app`, 첫 번째 `documentations[]` 블록)

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**패턴 C — Docusaurus 동시 배치** (`regexAdjustments` 필요 없음)

en-GB 스크린샷을 `static/assets/`에 배치하고 심볼릭 링크 `docs/assets → ../static/assets`를 만듭니다. `take-screenshots` 스크립트는 다른 로케일을 `i18n/<locale>/…/current/assets/`에 직접 작성합니다. 모든 로케일의 모든 문서는 `../assets/name.png`를 참조합니다 — 경로는 안정적이며 URL 재작성은 필요하지 않습니다.

**패턴 D 예시** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → `public/assets/` 아래의 로케일별 파일. 앱은 로케일별로 참조합니다: `<img src={`/assets/icon.${locale}.svg`} />`.

**최소 README 전용 예제** (`examples/console-app`)

`examples/console-app/ai-i18n-tools.config.json`는 `README.md`을 `translated-docs/`로 변환합니다 [언어 전환 후처리](#language-list-block)만으로. 이미지 규칙은 정의되지 않았습니다 — README에 형제 래스터 파일이 없거나 호스트가 이미 제공하는 절대 URL만 사용하는 경우에 적합합니다.

대체 템플릿은 `markdownOutput.postProcessing.regexAdjustments` 행의 [구성 참조](#configuration-reference)에 있는 전체 목록을 참조하여 `${translatedLocale}` 및 `${translatedBasedir}`과 같은 자리표시자를 지원합니다.

<a id="language-switcher-languagelistblock"></a>
#### 언어 전환기 (`languageListBlock`)

번역된 마크다운 파일에 각 로케일별 링크가 포함된 **"다른 언어로 읽기"** 링크 행을 넣어야 할 때 `markdownOutput.postProcessing.languageListBlock`을 사용합니다. 각 출력 파일 기준으로 `href` 값이 계산되어 각 로케일마다 하나의 링크가 생성됩니다.

이 저장소는 [README.md](../README.ko.md) 및 [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md)에 이를 사용합니다. `translate-docs` 처리 후 각 번역본은 새로 고쳐진 블록을 가지게 됩니다. 예를 들어 [translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md)은 `translated-docs/docs/` 아래의 동일한 계층 구조에 있는 다른 로케일 파일들과 영어 원본인 `../../docs/GETTING_STARTED.md`로 돌아가는 링크를 포함합니다.

**1. 소스 마크다운에서 블록 지정하기**

전환기 블록을 `start`과 `end`이라는 하위 문자열 마커로 구분된 HTML(또는 기타 라인)로 감쌉니다. 이 저장소에서는 다음을 사용합니다.

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

초기 링크 텍스트는 단지 자리표시자일 뿐입니다. `translate-docs`은 `start`을 포함한 첫 번째 라인부터 이후에 등장하는 `end`를 포함한 첫 번째 라인까지의 전체 구간을 대체합니다 (코드 블록 안의 마커는 무시되므로 동일 파일 내 구성 예제는 대상에서 제외됨).

**2. 블록 구성하기**

`start`과 `end`은 임의의 하위 문자열 마커입니다. 반드시 `<small id="lang-list">` / `</small>`일 필요는 없습니다. 언어 전환기 블록에만 유일하게 나타나는 시작 및 종료 텍스트를 선택하면 됩니다. 예를 들어 다른 HTML 태그(`<div class="lang-switcher">` … `</div>`), HTML 주석(`<!-- lang-list -->` … `<!-- /lang-list -->`), 또는 마크다운 전용 경계(예: `**Languages:**`로 시작하는 라인부터 `---`로 끝나는 라인까지)를 사용할 수 있습니다. 소스 파일에 입력한 내용과 정확히 일치하도록 설정 파일의 `start`과 `end`을 지정하세요.

루트 설정 ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| 필드       | 역할                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | 블록의 시작 라인을 식별하는 하위 문자열                                                  |
| `end`       | 닫는 줄의 부분 문자열 (`start`와 함께 한 줄에 나타날 경우 동일한 줄일 수 있음)             |
| `separator` | 생성된 `[label](../../docs/href)` 링크 사이에 삽입될 텍스트 (이 저장소는 `" · "` 사용)                                    |
| `label`     | 선택 사항: `"local"`(기본값)은 매니페스트의 각 로케일 고유명을 사용하며, `"english"`는 `englishName`을 사용함 |

**3. 런타임 시 발생하는 일**

1. **추출** — 언어 목록 블록은 모델로 **전송되지 않음** (`translatable: false`).
2. **각 번역 파일별 처리** — 세그먼트 번역 및 선택적 평면 링크 재작성 후, `postProcessing`이 블록을 재구성합니다. 각 로케일마다 하나의 마크다운 링크를 생성하며, 레이블은 `ui-languages.json`에 존재하면 그 값을 사용하고(없으면 기본 마스터 카탈로그, 그 외에는 `localeDisplayNames` 사용), 경로는 현재 작성 중인 파일 기준의 상대 경로로 설정됩니다.
3. **소스 새로 고침** — `translate-docs` / `sync` 문서 처리가 끝난 후, 동일한 표준 블록이 `contentPaths`의 **영어 소스 파일**에 다시 쓰여지므로, 새로운 로케일 추가 시 모든 링크를 수동으로 편집하지 않고도 저장소 내 전환기가 자동으로 업데이트됩니다.

파일에 일치하는 블록이 없으면 CLI는 경고를 기록하고(`--verbose` 시), 본문은 그대로 유지됩니다.

**4. 레이블 매니페스트**

고유명 레이블(`label: "local"`)의 경우, `generate-ui-languages`를 통해 `ui-languages.json`을 생성하거나 유지 관리하세요 ([`uiLanguagesPath`](#uilanguagespath-optional) 참조). 이 저장소의 문서 전용 설정은 UI 파이프라인이 없으므로 레이블은 `sourceLocale` + `targetLocales`용 번들된 마스터 카탈로그에서 가져옵니다.

**5. 이 저장소의 예시**

| 예시                            | 파일들                                                                                                                                                                                        |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 이 패키지 (평면 문서 + 하위 디렉터리) | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [README.md](../README.ko.md), [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md), 출력물은 [translated-docs/](../../docs/../translated-docs/) 아래에 위치 |
| 최소한의 README만 | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json) (`markdownOutput.style = "flat"`), [examples/console-app/README.md](../../docs/../examples/console-app/README.md) |
| 단순 README + Docusaurus 문서 | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json) (두 번째 블록: `markdownOutput.style = "flat"`; 첫 번째 블록: `markdownOutput.style = "docusaurus"`) |

`<small id="lang-list">` 바로 이전 줄(예: `**Read in other languages:**`)은 일반적인 번역 가능한 구문이며 각 대상 로캘에서 로컬라이즈되며, 마커 내부의 링크 행은 `href` 및 매니페스트 기반 레이블을 제외하고는 원문 그대로 재생성됩니다.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` 자리표시자

`documentations[].markdownOutput.pathTemplate`(마크다운 및 MDX) 또는 `jsonPathTemplate`(JSON 레이블 파일)을 설정하여 번역된 파일이 작성되는 위치를 재정의할 수 있습니다. 두 옵션 모두 동일한 플레이스홀더를 사용합니다. 해결된 경로는 해당 블록의 `outputDir` 내에 있어야 합니다(CLI는 이를 벗어나는 경로를 거부합니다).

사용자 정의 `pathTemplate`을 사용하는 경우, 명시적으로 설정하지 않으면 `rewriteRelativeLinks`은 기본적으로 `false`가 됩니다. 상대 링크 재작성은 사용자 정의 템플릿 없이도 `markdownOutput.style = "flat"`용으로 구현되어 있습니다.

| 자리 표시자            | 역할                                                                                                       | 예시                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | 이 문서 블록의 `outputDir`에 대한 절대 해결 경로                                           | `/home/acme/repo/i18n`                                           |
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

`markdownOutput.style = "flat"`과 사용자 정의 `pathTemplate` 없이 사용할 때 일반적인 패턴은 `{stem}` 및 `{extension}`를 통해 파일 이름만 유지하는 것입니다. 예를 들어 `{outputDir}/{stem}.{locale}{extension}`는 해결된 `outputDir` 아래에서 `…/guide.de.md`를 생성합니다.

<a id="troubleshooting"></a>
### 문제 해결

**번역된 문서에서 섹션 앵커 링크가 작동하지 않음**

`[label](../../docs/other.md#section-id)`과 같은 링크는 올바른 번역된 파일을 열 수 있지만, 의도한 제목으로 스크롤하지 못하거나 잘못된 섹션으로 이동할 수 있습니다. 해당 로캘에서 `#…` 조각(fragment)이 더 이상 어떤 제목 `id`와도 일치하지 않습니다.

일반적인 원인:

- 원본 제목에 명시적인 앵커 ID가 없었으며, 사이트는 보이는 제목 텍스트에서 슬러그를 유도하므로 번역 후 변경됩니다.
- 원본에서 제목을 이름을 변경했지만 이전의 `<a id="…"></a>` 줄이 누락되었거나 여전히 이전 ID를 가지고 있습니다.
- 앵커 링크가 `write-heading-ids`가 생성할 ID 대신 영어 단어에서 추측한 `#…` 조각을 사용합니다.

**해결 방법**

1. **소스** `.md` / `.mdx`(`translate-docs`와 동일한 `documentations[]` / `contentPaths`)에서 `ai-i18n-tools write-heading-ids`을 실행합니다. 이 작업은 각 ATX 제목 앞에 `<a id="slug"></a>`을 삽입하거나, 제목 텍스트가 현재 슬러그와 더 이상 일치하지 않을 때 기존 앵커를 새로 고칩니다.
2. 앵커 링크를 해당 ID를 가리키도록 설정합니다. 예: `[setup](../../docs/guide.md#first-run)`에서 `#first-run`은 영문 제목에서 유추한 슬러그가 아닌, 대상 제목 위의 앵커 줄과 일치해야 합니다.
3. 모든 로캘 복사본에 업데이트된 앵커 줄이 포함되도록 `translate-docs`(또는 `sync --force-update`)를 다시 실행합니다.

변경 사항을 미리 보려면 먼저 `write-heading-ids`에서 `--dry-run`을 사용하세요. 전체 패턴은 [단순 레이아웃의 앵커 링크](#anchor-links-when-markdownoutputstyle--flat)를 참조하세요.

---

<a id="combined-workflow-ui--docs"></a>
## 통합 워크플로우 (UI + 문서)

단일 구성에서 모든 기능을 활성화하여 두 워크플로우를 함께 실행합니다:

<details>
<summary>UI 및 문서 설정 예제 통합</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
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

</details>

<br />

`glossary.uiGlossary`은 문서 번역을 UI와 동일한 `strings.json` 카탈로그를 가리키도록 하여 용어의 일관성을 유지합니다. `glossary.userGlossary`는 제품 용어에 대한 CSV 오버라이드를 추가합니다.

`features.translateUIStrings`이 활성화된 경우 `npx ai-i18n-tools sync`을 실행하여 하나의 파이프라인을 수행합니다: 먼저 **추출**, 그다음 **UI 번역** 문자열 처리; 선택적으로 **SVG 번역**(`features.translateSVG` + `svg` 블록); 선택적으로 **translate-json**(`features.translateJson` + `json[]`); 마지막으로 구성된 대로 **문서 번역**(`docs[]` 수행). `--no-ui`, `--no-svg`, `--no-json`, 또는 `--no-docs`를 사용하여 일부 단계를 건너뛸 수 있습니다. 문서 단계는 `--dry-run`, `-p` / `--path`, `--force`, `--force-update`를 허용하며(마지막 두 옵션은 문서 번역이 실행될 때만 적용되며, `--no-docs`을 전달하면 무시됨)를 허용합니다.

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

<a id="mixed-documentation-workflow-markdownoutputstyle--docusaurus--flat"></a>
### 혼합 문서 워크플로우(`markdownOutput.style = "docusaurus"` + `"flat"`)

동일한 구성에서 `documentations`에 두 개 이상의 항목을 추가하여 여러 문서 파이프라인을 결합할 수 있습니다. 이 설정은 프로젝트에 Docusaurus 사이트(`markdownOutput.style = "docusaurus"`)와 함께 루트 수준의 마크다운 파일(예: `markdownOutput.style = "flat"`가 있는 저장소 README)이 있고, 로캘 접미사가 붙은 파일 이름으로 번역되어야 하는 경우에 일반적입니다.

<details>
<summary>Docusaurus와 단순 README 설정 혼합 예제</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
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
      "description": "Docusaurus site content (markdown)",
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
      "description": "Root README with markdownOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

`npx ai-i18n-tools sync`으로 실행할 경우:

- UI 문자열은 `src/`에서 `public/locales/`로 추출/번역됩니다.
- 첫 번째 문서 블록은 **마크다운**을 `docs-site/docs/`에서 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`로 번역합니다(로컬라이즈된 문서 페이지).
- `features.translateJSON` 및 `jsonSource`를 사용하면 동일한 블록이 `docs-site/i18n/en/` 아래의 **Docusaurus 셸 JSON**도 각 대상 로캘 폴더로 번역합니다. 여기에는 내비게이션 바, 푸터, 테마/플러그인 카탈로그가 포함되며, MDX 본문은 제외됩니다.
- 두 번째 문서 블록은 `README.md`을 `translated-docs/` 아래의 로캘 접미사가 붙은 파일로 번역합니다(`markdownOutput.style = "flat"`).
- 모든 docs 블록은 `cacheDir`을 공유하므로 변경되지 않은 세그먼트는 실행 간에 재사용되어 API 호출과 비용을 줄입니다.

---

<a id="translation-dashboard"></a>
## 번역 대시보드

실행:

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

이것은 구성된 `cacheDir` SQLite 데이터베이스를 지원하는 로컬 웹 UI를 시작합니다—CLI가 문서 세그먼트, 로그 및 관련 메타데이터를 위해 사용하는 동일한 폴더입니다. 여기에는 **문서**(캐시된 문서 세그먼트), **UI 문자열**, **UI 복수형**, **용어집**, **실패**, **Markdown 문제**, 및 **통계** 탭이 포함됩니다.

![Translation Dashboard](../../docs/translation-dashboard.png)

이 앱에서 캐시 행(**예: 문서 세그먼트**)을 편집하는 경우, 디스크에 저장된 출력 결과가 캐시와 일치하도록 `sync --force-update` 또는 `--force-update`과 동일한 번역 명령을 실행하세요. 이후 저장소의 **원본 텍스트**가 변경되면 세그먼트 해시도 변경되며, 이전 텍스트에 대한 수동 편집 내용은 더 이상 유효하지 않게 됩니다.

<a id="failures-document-translation"></a>
### 실패(문서 번역)

**실패** 탭은 **문서** 번역 전용입니다. 로케일별로 세그먼트 번역에 실패했을 때(예: 빈 출력 또는 잘못된 모델 출력, 번역 후 검증 오류(`AST mismatch`, 자리 표시자 누수 등 **품질** 검사), 또는 진행을 차단하는 **치명적** 오류) SQLite에 기록된 실패 기록을 읽어옵니다. 이를 통해 다음 질문에 답할 수 있습니다: *어느 원본 세그먼트가 어떤 로케일과 모델에서 오류가 발생했으며, 어떤 오류 메시지가 기록되었는가?*

<a id="when-to-use-it"></a>
#### 언제 사용해야 하나요

- `translate-docs` 또는 `sync`이 오류, 부분적 로케일, 혼란스러운 로그와 함께 종료된 후에는 터미널 출력만 스크롤하는 대신 실패를 정렬하고 필터링할 수 있습니다.
- **재작업 우선 순위 지정**이 필요할 때: **실패 횟수**로 정렬하여 재시도 시 반복적으로 실패한 세그먼트를 맨 위에 표시합니다. 이러한 세그먼트는 향후 실행에서 성공할 수 있도록 소스 마크다운에서 **단순화하거나 재구성**하는 후보가 됩니다.
- **정확한 세그먼트**—파일 경로, 줄 힌트, 소스 해시, 전체 소스 텍스트—가 필요할 때, 저장소에서 올바른 단락을 편집할 수 있습니다.

<a id="why-source-edits-matter"></a>
#### 원본 편집이 중요한 이유

인라인 마크업이 복잡할 경우(**볼드**와 `` `code` ``가 혼합되거나, 강조가 중첩되거나, 많은 스팬을 포함한 긴 문장 등) 모델이 구조적 검사를 통과하는 번역을 반환하기 어려워집니다. **여러 번 실패 기록**이 있는 세그먼트는 원본 텍스트를 그대로 두고 번역을 다시 실행하는 것보다, 원본을 **다시 작성하거나 분할**하거나 예제를 fenced 코드 블록으로 옮기는 것이 더 큰 개선을 이룹니다. 이는 [복잡한 마크다운 및 실패한 품질 검사](#complex-markdown-and-failed-quality-checks)와 일치합니다.

<a id="how-to-use-the-tab"></a>
#### 탭 사용 방법

1. 대시보드에서 **실패**를 엽니다([번역 대시보드](#translation-dashboard)와 동일한 브라우저 세션).
2. **요약** 막대를 읽습니다(실패가 있는 세그먼트 및 **1**, **2**, **3+** 실패 기록이 있는 세그먼트 수 포함).
3. 부분 **파일 이름**, **로캘**, **모델**, **품질 오류**(캐시에서 가져온 값), **치명적 오류만**, 그리고 선택적 **소스 해시**, **소스 텍스트**, 또는 **오류 메시지** 부분 문자열로 필터링한 후 **적용**을 클릭합니다.
4. **정렬: 실패 수**(기본값) 또는 **정렬: 파일 경로 + 줄 번호**를 선택합니다.
5. 테이블 상단 또는 하단에 페이지네이션을 사용합니다. **행 클릭**하여 전체 소스 텍스트를 전환합니다. 활성화된 경우 행의 링크 컨트롤은 `ai-i18n-tools dashboard`가 실행 중인 **터미널**로 파일/라인 힌트를 기록하도록 서버 프로세스에 요청합니다. 이를 통해 브라우저에서 편집기로 바로 이동할 수 있습니다.
6. 프로젝트의 **소스 파일**을 수정한 후, 다시 `translate-docs` 또는 `sync`를 실행합니다. 성공적으로 실행한 후에도 목록이 **오래된 것처럼 보인다면**, `ai-i18n-tools sync --force-update`을 실행하고 대시보드를 새로고침하세요(실패 패널도 동일한 힌트를 표시합니다).

UI와 병행하여 파일 기반 디버깅이 필요한 경우, 여전히 재시도 중 `translate-docs --debug-failed`를 사용해 `cacheDir` 아래에 `FAILED-TRANSLATION` 세부 정보를 기록할 수 있습니다 — [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags) 참조.

<a id="markdown-issues-static-checks"></a>
### 마크다운 문제 (정적 검사)

**Markdown 문제** 탭은 `markdown_source_issues` SQLite 테이블의 행을 나열합니다. 각 행은 **사전 번역** 발견입니다: 예를 들어, 같은 CommonMark 스타일 규칙 `translate-docs`이 마스킹에 사용하는 강조/취소선으로 쌍을 이루지 않는 구분 기호 실행, 백틱으로 열렸지만 닫히지 않은 인라인 코드 범위, `STRONG_OUTSIDE_INLINE_CODE`가 `**` / `__`가 `` `...` `` 범위를 감쌀 때(백틱 안에 강조를 넣거나 일반 코드를 사용), 또는 `STRONG_OUTSIDE_LINK`가 `**` / `__`가 `[text](../../docs/url)` 링크를 감쌀 때(링크 텍스트 안에만 굵게 표시)를 포함합니다. 이는 **실패**와는 **다릅니다**, 이는 로케일별 모델 출력 및 번역 후 검증 문제( `AST mismatch`, 플레이스홀더 누수 및 유사한 문제)를 기록합니다.

토큰을 소비하기 전에 **소스 마크다운**을 수정하고자 할 때 이 탭을 사용하세요—특히 구조 관련 품질 검사가 반복적으로 실패할 경우 유용합니다. 파일 경로(캐시 키에 대한 부분 일치, `doc-block:{index}:` 접두사 포함), **이슈 코드**, 또는 **소스 해시**로 필터링할 수 있으며, 파일 경로 + 라인 또는 최신 스캔 시간 기준으로 정렬할 수 있습니다. 링크 버튼은 `ai-i18n-tools dashboard`가 실행 중인 터미널로 파일/라인 힌트를 기록합니다(문서 탭과 동일한 개념).

**행 새로 고침:** `ai-i18n-tools check-markdown`를 실행합니다 (선택 사항 `-p` / `--path` 범위, `--no-cache`는 SQLite를 건너뛰기 위해, `--json`는 stdout에서 기계 판독 가능한 출력과 stderr에서 인간 줄을 위해). 기본적으로 각 `translate-docs` 마크다운 파일 실행은 `documentations[].warnMarkdownSourceIssues`가 `false`로 설정되지 않은 경우 해당 파일의 행을 다시 스캔하고 교체합니다. 캐시 파일 경로에 대한 모든 번역을 지우면 해당 파일 경로에 대한 마크다운 문제 행이 실패와 같은 정리 경로의 일부로 제거됩니다.

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

- 매니페스트가 `ui.flatOutputDir` 외부에 위치하므로 CLI에 명시적으로 경로를 지정해야 합니다.
- [언어 전환기 후처리](#language-list-block)(`languageListBlock`)를 사용하여 매니페스트에서 로케일 레이블을 생성하려는 경우입니다.
- `extract`가 매니페스트의 `englishName` 항목을 `strings.json`에 병합해야 할 경우입니다(`ui.reactExtractor.includeUiLanguageEnglishNames: true` 필요).

<a id="concurrency-optional"></a>
### `concurrency` (선택 사항)

동시에 번역되는 최대 **대상 로캘** 수 (`translate-ui`, `translate-docs`, `translate-svg`, 및 `sync` 내 해당 단계). 생략 시 CLI는 UI 번역에 **4**, 문서 번역에 **3**를 사용합니다 (내장 기본값). 실행 시 `-j` / `--concurrency`로 재정의할 수 있습니다.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (선택 사항)

**translate-docs** 및 **translate-svg** (그리고 `sync`의 문서 번역 단계): 파일당 최대 병렬 OpenRouter **배치** 요청 수 (각 배치는 여러 세그먼트를 포함할 수 있음). 생략 시 기본값은 **4**입니다. `translate-ui`에서는 무시됩니다. `-b` / `--batch-concurrency`로 재정의할 수 있습니다. `sync`에서는 `-b`가 문서 번역 단계에만 적용됩니다.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (선택 사항)

단일 로케일 내에서 동시에 처리되는 파일의 최대 개수 **(하나의 로케일 내)**. `translate-docs` 및 `sync` 중에 사용됩니다.  **1**보다 큰 값으로 설정된 경우, 동일한 로케일 내 파일들이 메모리 사용량을 제어하기 위한 세마포어를 사용하여 병렬로 처리됩니다. 생략 시 기본값은 **1**(순차 처리)입니다. 더 높은 값은 I/O에 의해 제한되는 작업의 처리량을 크게 향상시킬 수 있으며, 특히 모든 세그먼트가 이미 캐시되어 있는 경우(별도의 API 호출이 필요 없는 경우) 더욱 효과적입니다.

**예시:**

```json
{
  "fileConcurrency": 4
}
```

**사용 사례:** 전체 처리 시간을 줄이기 위해 캐시 적중률이 100%인 상태에서 `sync --force-update`을 실행할 때 이 값을 `2-4`으로 설정합니다. 이는 작은 파일이 많은 경우에 특히 두드러진 개선을 보입니다.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (선택 사항)

문서 번역을 위한 세그먼트 배치: 요청당 세그먼트 수와 문자 수 상한. 기본값: **20** 세그먼트, **4096** 문자 (생략 시).

<a id="openrouter"></a>
### `openrouter`

- `baseUrl`
  OpenRouter API 기본 URL. 기본값: `https://openrouter.ai/api/v1`.
- `translationModels`
  선호하는 모델 ID의 우선순위 목록. 첫 번째 모델부터 시도되며, 오류 시 후속 항목이 대체로 사용됩니다. `translate-ui` 전용으로, `ui.preferredModel`를 설정하여 이 목록 이전에 한 모델을 먼저 시도할 수 있습니다(자세한 내용은 `ui` 참조).
- `defaultModel`
  레거시 단일 주요 모델. `translationModels`이 설정되지 않았거나 비어 있을 때만 사용됩니다.
- `fallbackModel`
  레거시 단일 대체 모델. `translationModels`이 설정되지 않았거나 비어 있을 때 `defaultModel` 이후에 사용됩니다.
- `maxTokens`
  요청당 최대 완성 토큰 수. 기본값: `8192`.
- `temperature`
  샘플링 온도. 기본값: `0.2`.
- `requestTimeoutMs`
  OpenRouter(채팅 완성 및 내부 `GET /models` 호출)에 대한 각 HTTP 요청의 최대 대기 시간(밀리초). 기본값: `30000`(30초).

**여러 모델을 사용하는 이유:** 다양한 제공업체와 모델은 언어 및 로캘별로 비용과 품질 수준이 다릅니다. 단일 모델이 아닌 `openrouter.translationModels`을 **우선 순위 기반 대체 체인**으로 구성하면 요청이 실패할 경우 CLI가 다음 모델을 시도할 수 있습니다.

아래 목록은 확장 가능한 **기준**으로 간주하세요. 특정 로캘의 번역 품질이 낮거나 실패하는 경우, 해당 언어 또는 문자 체계를 효과적으로 지원하는 모델을 조사하고 (온라인 자료 또는 제공업체 문서 참조), 해당 OpenRouter ID를 추가 대안으로 등록하세요.

이 목록은 36개의 대상 로케일을 포함하는 대규모 문서 프로젝트에서 **광범위한 로케일 커버리지 테스트**를 거쳤습니다. 실용적인 기본값으로 사용되지만, 모든 로케일에서 항상 우수한 성능을 보장하지는 않습니다.

예시 `translationModels` (`npx ai-i18n-tools init`과 동일한 기본값):

<details>
<summary>기본 translationModels 대체 목록</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

환경 또는 `.env` 파일에서 `OPENROUTER_API_KEY`을 설정하세요.

`translationModels`을 변경하기 전에 `npx ai-i18n-tools check-models`을 실행하여 구성된 각 모델 ID를 OpenRouter의 실시간 카탈로그(`GET /models`)와 대조하세요. 이 명령은 누락되었거나 `expiration_date`을 초과한 ID를 보고하고, 유효한 모델과 예상 입력/출력 가격(100만 토큰당 USD)을 나열하며, 구성된 ID 중 하나라도 유효하지 않을 경우 0이 아닌 상태 코드로 종료됩니다. `OPENROUTER_API_KEY`이 필요합니다.

<a id="features"></a>
### `features`

| 필드 | 워크플로 | 설명 |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1 | `t("…")` / `i18n.t("…")`를 `strings.json`로 추출한 후, 항목을 번역하고 로케일별로 단순한 JSON 파일을 작성합니다 (추출은 자동으로 실행되며, 카탈로그만 갱신하려면 독립 실행형 `extract`를 사용하세요). |
| `translateDocs` | 2 | `.md` / `.mdx` / `.astro` 페이지 번역; `docs[].docusaurusCatalogDir`가 설정된 경우 Docusaurus 셸 JSON 사용. |
| `translateJson` | 3 | `json[]` 아래의 임의의 중첩된 JSON (`translate-json`). |
| `translateSVG` | — | `.svg` 파일 번역 (최상위 `svg` 블록 필요). |

`features.translateSVG`이 true이고 최상위 `svg` 블록이 구성된 경우, `translate-svg`으로 SVG 파일을 **번역**합니다. `sync` 명령은 두 조건이 모두 충족될 때(단, `--no-svg`가 아닐 경우) 해당 단계를 실행합니다.

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  `t("…")` 호출을 위해 스캔된 디렉토리 또는 glob 패턴 (cwd에 상대적). `src/` 또는 `["src/**/*.ts"]`와 같은 패턴을 지원합니다.
- `stringsJson`  
  마스터 카탈로그 파일의 경로. `extract`에 의해 업데이트됩니다.
- `flatOutputDir`  
  로케일별 JSON 파일이 작성되는 디렉토리 (`de.json`, 등).
- `preferredModel`  
  선택 사항. `translate-ui`에 대해서만 먼저 시도되는 OpenRouter 모델 ID; 그런 다음 `openrouter.translationModels` (또는 레거시 모델) 순서대로, 이 ID를 중복하지 않고.
- `uiExtractor.funcNames`(또는 레거시 `reactExtractor.funcNames`)  
  스캔할 추가 함수 이름(기본값: `["t", "i18n.t"]`).
- `uiExtractor.extensions`(또는 레거시 `reactExtractor.extensions`)  
  포함할 파일 확장자(기본값: `[".js", ".jsx", ".ts", ".tsx"]`). Astro 프론트매터 및 템플릿 표현을 위해 `.astro`를 추가하십시오.
- `uiExtractor.includePackageDescription`(또는 레거시 `reactExtractor.includePackageDescription`)  
  `true`(기본값)일 때, `extract`은 또한 UI 문자열로 `package.json` `description`를 포함합니다.
- `uiExtractor.packageJsonPath`(또는 레거시 `reactExtractor.packageJsonPath`)  
  해당 선택적 설명 추출에 사용되는 `package.json` 파일에 대한 사용자 정의 경로.
- `uiExtractor.includeUiLanguageEnglishNames`(또는 레거시 `reactExtractor.includeUiLanguageEnglishNames`)

`true`일 때(기본값 `false`), `extract`는 소스 스캔에서 이미 존재하지 않는 경우(같은 해시 키 기준), 매니페스트의 `englishName`을 `uiLanguagesPath` 위치에서 `strings.json`에 추가합니다. 유효한 `ui-languages.json`을 가리키는 `uiLanguagesPath`이 필요합니다.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite 캐시 디렉터리(`documentations` 블록 전체에서 공유). 실행 간 재사용. 사용자 정의 문서 번역 캐시에서 마이그레이션하는 경우, 기존 캐시를 압축 보관하거나 삭제하세요 — `cacheDir`는 자체 SQLite 데이터베이스를 생성하며 다른 스키마와 호환되지 않습니다.

<a id="best-practice-for-git-exclusions"></a>
#### git 제외를 위한 모범 사례:

- 번역 캐시 폴더의 내용을 제외하세요(예: `.gitignore` 또는 `.git/info/exclude` 사용). 임시 캐시 아티팩트를 커밋하는 것을 방지할 수 있습니다.
- `cache.db`는 유지하세요(정기적으로 삭제하지 마세요). SQLite 캐시를 보존하면 변경되지 않은 세그먼트를 다시 번역하지 않아도 되므로, `ai-i18n-tools`를 사용하는 소프트웨어를 업데이트하거나 수정할 때 실행 시간과 API 비용을 절약할 수 있습니다.
- 백업 및 디버그 관련 파일이 커밋되는 것을 방지하기 위해 임시 파일과 로그 파일도 제외하세요.

<br/>

**예시:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="documentations"></a>
### `documentations`

문서 파이프라인 블록의 배열입니다. `translate-docs`과 `sync`의 docs 단계는 각 블록을 순서대로 **처리합니다**.

**콘텐츠 소스**

- `description`
이 블록에 대한 선택적 인간 가독성 노트(번역에 사용되지 않음). 설정 시 `translate-docs` `🌐` 제목에 접두사가 붙으며; `status` 섹션 헤더에도 표시됩니다.
- `contentPaths`
번역할 Markdown/MDX 페이지 본문 및 `.astro` 템플릿(`translate-docs`는 `.md`, `.mdx`, 및 `.astro`를 위해 이를 스캔합니다). **디렉토리 경로 또는 글로브 패턴**를 지원합니다(예: `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). 이것이 지역화된 문서 본문이 나오는 곳입니다.
- `sourceFiles`
로드 시 `contentPaths`에 병합되는 선택적 별칭.
- `targetLocales`
이 블록에 대해서만 선택적 로케일 하위 집합(그렇지 않으면 루트 `targetLocales`). 유효한 문서 로케일은 블록 간의 합집합입니다.
- `jsonSource`
선택 사항. 이 블록에 대한 Docusaurus JSON 레이블 카탈로그의 소스 디렉터리(e.g. `"i18n/en"` from `docusaurus write-translations`). 페이지 본문은 항상 `contentPaths`에서 가져오며, `jsonSource`는 MDX가 아닌 셸/UI JSON만 제공합니다.

**출력 레이아웃**

- `outputDir`
이 블록의 번역된 출력을 위한 루트 디렉터리입니다.
- `markdownOutput.style`
`"nested"`(기본값), `"flat"`, `"doc-system"`, 또는 별칭 `"docusaurus"` / `"astro-starlight"`.
- `markdownOutput.localeSubpath`
`{locale}/`과 `{relativeToDocsRoot}` 사이의 `doc-system` 경로 세그먼트(`style: "doc-system"` 직접 사용 시 필수; 별칭 사용 시 사전 설정됨). Starlight 스타일 로케일 폴더에는 `""`를 사용하세요.
- `markdownOutput.docsRoot`
Docusaurus 레이아웃을 위한 소스 문서 루트(e.g. `"docs"`).
- `markdownOutput.pathTemplate`
사용자 정의 마크다운 출력 경로. 자리표시자: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `markdownOutput.jsonPathTemplate`
레이블 파일을 위한 사용자 정의 JSON 출력 경로. `pathTemplate`와 동일한 자리표시자를 지원합니다.
- `markdownOutput.flatPreserveRelativeDir`
`markdownOutput.style = "flat"`인 경우, 동일한 기본 이름을 가진 파일이 충돌하지 않도록 소스 하위 디렉터리를 유지합니다.
- `markdownOutput.rewriteRelativeLinks`
번역 후 상대 링크를 다시 작성합니다(`markdownOutput.style = "flat"`이고 사용자 정의 `pathTemplate`가 없을 때 자동 활성화됨).
- `markdownOutput.linkRewriteDocsRoot`
플랫 링크 재작성 접두사를 계산할 때 사용되는 리포지터리 루트입니다. 번역된 문서가 다른 프로젝트 루트 아래에 있지 않은 한 일반적으로 `"."`로 두는 것이 좋습니다.

**후처리**

- `markdownOutput.postProcessing`
번역된 **마크다운 본문**에 선택적으로 적용할 수 있는 변환입니다 (YAML 키와 비서사형 프론트 매터 값은 그대로 유지됨). 세그먼트 재조합 및 평면 링크 재작성 후, `addFrontmatter` 이전에 실행됩니다.
- `markdownOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }`의 순서가 지정된 목록입니다. `search`는 정규 표현식 패턴이며 (일반 문자열은 `g` 플래그 또는 `/pattern/flags` 사용), `replace`는 `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}` 등의 자리표시자(placeholder)를 지원합니다.
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — 원본 및 번역된 마크다운에서 제한된 "다른 언어로 읽기" 링크 행을 다시 생성합니다. 설정, 동작 및 저장소 예시는 [언어 전환기(`languageListBlock`)](#language-list-block)를 참조하세요.

**동작 및 메타데이터**

- `translateFrontmatterFields`
`markdownOutput`과 동일한 수준 (`documentations[]` 블록 단위). 기본값 `true`: Starlight/Docusaurus의 사용자 인터페이스용 YAML 서사문 번역 (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` 레이블 포함). 전체 프론트 매터 블록을 변경 없이 유지하려면 `false`을 설정하고, 특정 도트 경로(dot-path)로 제한하려면 문자열 배열을 전달하세요.
- `segmentSplitting`
`markdownOutput`과 동일한 수준 (`documentations[]` 블록 단위). `translate-docs` 추출을 위한 선택적 세분화된 세그먼트: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`. `enabled`가 `true`인 경우 (`segmentSplitting` 생략 시 기본값), 밀집된 단락, GFM 파이프 테이블 (첫 번째 청크는 헤더, 구분자, 첫 번째 데이터 행 포함), 긴 목록이 분할되며, 하위 부분은 단일 줄바꿈으로 다시 결합됩니다 (`tightJoinPrevious`). `"enabled": false`을 설정하면 빈 줄로 구분된 본문 블록당 하나의 세그먼트만 사용합니다.
- `warnMarkdownSourceIssues`
`true`인 경우 (생략 시 기본값), 각 `translate-docs` 실행 시 마크다운 세그먼트에서 위험한 구분자/닫히지 않은 인라인 코드를 다시 검사하고 터미널 경고를 출력하며, 해당 파일의 캐시 파일 경로에 대한 `markdown_source_issues` 행을 대체합니다. 이 블록에 대해 경고 및 SQLite 업데이트를 건너뛰려면 `false`을 설정하세요.
- `addFrontmatter`
`true`인 경우 (생략 시 기본값), 번역된 마크다운 파일에는 `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path` 등의 YAML 키가 포함되며, 하나 이상의 세그먼트에 모델 메타데이터가 있을 경우 `translation_models` (사용된 OpenRouter 모델 ID의 정렬된 목록)도 포함됩니다. 건너뛰려면 `false`로 설정하세요.

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
선택 사항입니다. **따옴표로 묶인 문자열 값**이 번역기로 전송되지 않아야 하는 추가 JSX/HTML 속성 이름입니다. 기본 제공되는 기본값(`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, 대부분의 `aria-*` 등)과 병합됩니다. 대소문자 구분 없음. 다음에 적용됩니다.

- `.astro` 정적 HTML 태그 및 `attr=` 내부의 `{expression}` 블록에서 문자열 리터럴을 추출하여 치환하는 경우.
  - 마크다운/Astro 세그먼트 번역 중 MDX 플레이스홀더 추출 (대문자 JSX 태그의 `label`, `tooltip`, `aria-label` 및 해당되는 경우 `TabItem` `value`).

예: `"protectAttributes": ["variant", "size"]`은(는) `variant="primary"` 내부의 `{items.map(...)}`이(가) 여러 로케일에서 변경되지 않도록 유지합니다.

번역 가능한 속성(예: `"title"` 또는 `"aria-label"`)을 영어에서 그대로 복사하고자 할 때 이 목록에 포함시킬 수 있습니다.

- `protectKeys`
선택 사항입니다. 템플릿 `{expression}` 블록 및 MDX 객체 리터럴 내부(예: `label:` 내부의 `<Tabs values={[ … ]}>`)에서 따옴표로 묶인 문자열 값이 번역되어서는 안 되는 추가 **객체 속성 이름**입니다. 기본 제공되는 기본값(`class`, `key`, `id`, `href`, `src` 등)과 병합됩니다. 대소문자 구분 없음.

예: `"protectKeys": ["slug", "code"]`은(는) `{ slug: 'getting-started', title: 'Getting started' }`을(를) 건너뜁니다 → `slug`이(가) 보호된 상태에서 `title`만 번역됩니다.

<br/>

**예시 (`markdownOutput.style = "flat"` — 스크린샷 경로 + 선택적 언어 목록 래퍼):**

<details>
<summary>평면 레이아웃 postProcessing 예제(스크린샷 + languageListBlock)</summary>

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
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="svg"></a>
### `svg`

SVG 파일의 최상위 경로 및 레이아웃입니다. `features.translateSVG`이 true일 때만 번역이 실행됩니다(`translate-svg` 또는 `sync`의 SVG 단계를 통해).

| 필드            | 설명                                                                                                                                                                                                                                                        |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 하나 이상의 디렉터리 **또는 glob 패턴** (예: `"images/*.svg"`, `"**/icons/*.svg"`). 패턴은 프로젝트 루트를 기준으로 상대적으로 해석되며, `.svg` 파일을 재귀적으로 검색합니다.                                                                         |
| `outputDir`                   | 번역된 SVG 출력의 루트 디렉터리입니다.                                                                                                                                                                                                                                          |
| `style`                       | `pathTemplate`이 설정되지 않은 경우 `"flat"` 또는 `"nested"`입니다.                                                                                                                                                                                                                               |
| `pathTemplate`                | 사용자 정의 SVG 출력 경로. 자리표시자: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `forceLowercase` | SVG 재조합 시 소문자로 변환된 텍스트입니다. 모두 소문자 레이블에 의존하는 디자인에 유용합니다.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| 필드          | 설명                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 기존 번역을 기반으로 용어집을 자동 생성하는 `strings.json` 파일의 경로입니다.                                                                                                 |
| `userGlossary` | 열이 `Original language string`(또는 `en`), `locale`, `Translation`인 CSV 파일의 경로 - 각 원본 용어와 대상 로케일에 해당하는 행 하나씩 포함 (`locale`는 모든 대상에 대해 `*`일 수 있음). |

**빈 용어집 CSV 생성:**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLI 참조

| 명령                                                                                                    | 설명                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | CLI 버전 및 빌드 타임스탬프 출력 (루트 프로그램의 `-V` / `--version`와 동일한 정보).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website] [-o path] [--with-translate-ignore]` | 시작 구성 파일을 작성합니다 (`concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, `documentations[].addFrontmatter` 포함). `--with-translate-ignore`는 시작용 `.translate-ignore`을 생성합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `check-models`                                                                           | 구성된 각 OpenRouter 모델 ID를 `GET /models`(카탈로그 멤버십, `expiration_date`, 프롬프트/완성 시 100만 토큰당 USD)과 대조하여 유효성을 검사합니다. `OPENROUTER_API_KEY`이 필요합니다. 구성된 ID 중 누락되거나 만료된 것이 있을 경우 비제로 종료합니다. 카탈로그 요청 시 `openrouter.requestTimeoutMs`을(를) 따릅니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `extract`                                                                                                  | `t("…")` / `i18n.t("…")` 리터럴에서 `strings.json`을(를) 업데이트하고, 선택적으로 `package.json` 설명과 매니페스트 `englishName` 항목을 포함합니다(`ui.reactExtractor` 참조). 비어 있지 않은 `ui.sourceRoots`이(가) 필요합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | `sourceLocale` + `targetLocales` 및 번들된 `data/ui-languages-complete.json`(또는 설정 시 `--master`)을 사용하여 `ui.flatOutputDir`(또는 설정된 경우 `uiLanguagesPath`)에 `ui-languages.json`을(를) 씁니다. 마스터 파일에 없는 로케일에 대해서는 경고를 표시하고 `TODO` 자리 표시자를 출력합니다. 사용자 정의된 `label` 또는 `englishName` 값을 가진 기존 매니페스트가 있는 경우, 마스터 카탈로그의 기본값으로 대체됩니다. 생성된 파일을 나중에 검토하고 조정하십시오.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                       | 각 `documentations` 블록(`contentPaths`, 선택적 `jsonSource`)에 대해 마크다운/MDX 및 JSON을 번역합니다. `-j`: 최대 병렬 로케일 수; `-b`: 파일당 최대 병렬 배치 API 호출 수. `--prompt-format`: 배치 전송 형식(`xml` \| `json-array` \| `json-object`). [캐시 동작 및 `translate-docs` 플래그](#cache-behaviour-and-translate-docs-flags) 및 [배치 프롬프트 형식](#batch-prompt-format)을 참조하세요.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                    | 최소한 하나의 `documentations[]` 블록이 필요합니다. 각 블록의 `contentPaths` 아래에 `.md` / `.mdx`을(를) 수집합니다(`.translate-ignore` 적용). 평면 ATX `#` 제목 바로 **앞**에 HTML 앵커 줄 `<a id="slug"></a>`을(를) 삽입합니다(코드 블록 내부의 제목은 건너뜀). 앵커 줄이 이미 있는 경우, 현재 제목 텍스트에서 유도된 슬러그와 일치하지 않으면 `id`을(를) 업데이트합니다. `-p` / `--path` 또는 `-f` / `--file`: 프로젝트 기준 파일 또는 디렉터리로 제한. `--slug-style`: `github`(기본값; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`. `pymdown` 사용 시, 선택적 `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode` 가능. `--dry-run`: 변경 사항만 나열합니다.                                                                                                                                                                                                                                                                                                                                    |
| `strip-md-bold-inline …`                                                                 | 최소한 하나의 `documentations[]` 블록이 필요합니다. 각 블록의 `contentPaths` 아래에 있는 `.md` / `.mdx`에서 인라인 코드 주위의 `**`를 제거합니다(`.translate-ignore` 적용). `-p` / `--path` 또는 `-f` / `--file`, `--dry-run`, `--no-backup` (덮어쓰기 전 타임스탬프가 있는 `.backup.*` 건너뜀).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `check-markdown …`                                                                       | 각 `documentations[]` 블록의 `contentPaths` 아래에 있는 마크다운/MDX를 스캔합니다(`translate-docs`와 동일한 탐지 방식, `.translate-ignore` 적용): 구분자 쌍, 닫히지 않은 인라인 코드, `**`/`__`가 `` `...` `` 범위 또는 `[text](../../docs/url)` 링크를 감쌀 때의 `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK`. `-p` / `--path` 또는 `-f` / `--file`: 선택적 범위. 문제 발생 시 **stderr**에 `relativePath:line: [ISSUE_CODE] message` 줄을 출력하고, 문제 발생 시 종료 코드 **1**을 반환합니다. `--json`: **stdout**에 JSON 보고서 출력. `--no-cache`가 지정되지 않으면 `cacheDir`에 `markdown_source_issues`을 기록합니다. `-v`는 stderr 줄에 소스 해시를 추가합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | `config.svg`에 구성된 SVG 파일을 번역합니다(문서와 별도). `features.translateSVG`가 필요합니다. 문서와 동일한 캐시 방식을 사용하며, 해당 실행에서 SQLite 읽기/쓰기를 건너뛰기 위해 `--no-cache`를 지원합니다. `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | UI 문자열만 번역합니다 (`strings.json` → 로케일 JSON). `--locale`, `ui-languages.json`: 쉼표로 구분된 대상 로케일 (기본값은 설정 또는 `ui-languages.json`에서 가져옴). `--force`: 기존 번역을 무시하고 로케일별로 모든 항목을 다시 번역합니다. `--dry-run`: 쓰기 작업 없음, API 호출 없음. `-j`: 최대 병렬 처리 가능한 로케일 수. `features.translateUIStrings` 필요.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | UI 문자열 추출 후 번역(`features.translateUIStrings` 필요). UI 전용 — 문서나 SVG는 포함되지 않음. `translate-ui`과 동일한 `-l`, `--force`, `--dry-run`, `-j` 옵션 사용 가능.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | **최초**로 `extract`을(를) 실행하여 `features.translateUIStrings`가 필요함 → `strings.json`이(가) 원본과 일치한 후, **원본 로케일** UI 문자열에 대한 LLM 검토(철자, 문법)를 수행합니다. **용어 힌트**는 `glossary.userGlossary` CSV에서만 제공되며, `translate-ui`와 동일한 범위를 가집니다 (`strings.json` / `uiGlossary`는 제외하므로 잘못된 문구가 용어집으로 강화되지 않음). OpenRouter(`OPENROUTER_API_KEY`)를 사용합니다. 참고용이며, 실행 완료 시 **0**으로 종료됩니다. 요약, 문제점, 각 문자열별 **OK** 항목을 포함한 **사람이 읽기 쉬운** 보고서 형식으로 `cacheDir` 아래에 `lint-source-results_<timestamp>.log`을(를) 작성합니다. 터미널에는 요약 수치와 문제점만 출력되며 (문자열당 `[ok]` 줄은 출력되지 않음). 마지막 줄에 로그 파일 이름을 출력합니다. `--json`: 전체 기계 판독 가능한 JSON 보고서를 stdout에만 출력 (로그 파일은 사람이 읽기 쉬운 형식 유지). `--dry-run`: 여전히 `extract`을(를) 실행한 후, 배치 계획만 출력 (API 호출 없음). `--chunk`: API 배치당 문자열 수 (기본값 **50**). `-j`: 최대 병렬 배치 수 (기본값 `concurrency`). `--json` 사용 시, 인간 친화적인 출력은 stderr로 전달됩니다. 링크는 `dashboard` UI 문자열의 '링크' 버튼과 동일한 방식으로 `path:line`를 사용합니다. |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | XLIFF 2.0으로 `strings.json` 내보내기 (대상 로캘당 `.xliff` 하나씩). `-o` / `--output-dir`: 출력 디렉터리 (기본값: 카탈로그와 동일한 폴더). `--untranslated-only`: 해당 로캘에서 번역이 누락된 항목만. 읽기 전용; API 없음.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                 | 활성화된 경우 추출 후 UI 번역, 그리고 `features.translateSVG` 및 `config.svg`가 설정된 경우 `translate-svg`, 그 후 문서 번역 — 단, `--no-ui`, `--no-svg` 또는 `--no-docs`로 건너뛸 수 있음. 공유 플래그: `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b` (문서 배치 전용), `--force` / `--force-update` (문서 전용; 문서 실행 시 상호 배타적). 문서 단계는 또한 `--emphasis-placeholders` 및 `--debug-failed`를 전달함 (`translate-docs`와 동일한 의미). `--prompt-format`은 `sync` 플래그가 아님; 문서 단계는 내장 기본값(`json-array`)을 사용함.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `status [--max-columns <n>]`                                                             | `features.translateUIStrings`이 켜져 있으면 로캘별 UI 커버리지를 출력함 (`Translated` / `Missing` / `Total`). 그 후 파일 × 로캘별 마크다운 번역 상태를 출력함 (`--locale` 필터 없음; 로캘은 구성에서 가져옴). 많은 수의 로캘 목록은 터미널에서 줄이 너무 길어지지 않도록 최대 `n`개의 로캘 열을 가진 반복 테이블로 분할됨 (기본값 **9**).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | 문서화 캐시 및 `strings.json` 통계 출력 (번역 대시보드 → **통계**와 동일한 집계값 사용). `--max-columns`: 모델당 최대 로케일 열 × 로케일 테이블 (기본값은 대시보드와 일치).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                                    | 먼저 `sync --force-update` 실행(추출, UI, SVG, 문서), 이후 고립된 세그먼트 행(null `last_hit_at` / 파일 경로 없음) 제거; 디스크상에서 확인된 소스 경로가 누락된 `file_tracking` 행 삭제; `filepath` 메타데이터가 존재하지 않는 파일을 가리키는 번역 행 제거. 세 가지 카운트를 기록(고립된, 고아 세그먼트 `file_tracking`, 고아 번역). `--no-backup`이(가) 지정되지 않으면 캐시 디렉터리 아래에 타임스탬프가 포함된 SQLite 백업 생성.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **구성 없음.** 디렉터리 트리 탐색(기본값: 현재 작업 디렉터리)하여 `*.log` 및 `cache.db.backup*.sqlite` 검색하고, `find -print`처럼 `./…` 경로 출력. 일치 항목이 있는 경우: `-f` / `--force`가 없으면 `Delete these files? (y/n)` 확인 요청(확인 없이 삭제). 일치 항목이 없는 경우: 확인 요청 없이 종료. `--dry-run`: 목록만 출력, 확인 요청 또는 삭제 없음(`--force`를 무시함).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                      | 번역 대시보드를 실행합니다(로컬 웹 UI로, 캐시 세그먼트, `strings.json`, 용어집, 오류, 통계 등을 확인할 수 있음). `--no-open` 옵션 사용 시 기본 브라우저가 자동으로 열리지 않습니다. 더 이상 사용되지 않는 별칭 `editor`은 여전히 작동하지만 경고 메시지를 출력합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `glossary-generate [-o <path>]`                                                          | 빈 `glossary-user.csv` 템플릿을 작성합니다. `-o`: 출력 경로를 재정의합니다(기본값: 구성 파일의 `glossary.userGlossary` 또는 `glossary-user.csv`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | 하위 명령어에 대한 도움말을 표시합니다(`ai-i18n-tools <command> --help`과 동일한 출력).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### 루트 및 전역 옵션

| 옵션                       | 범위         | 설명                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | 루트 프로그램  | 버전 번호와 빌드 타임스탬프를 출력합니다(`version` 하위 명령어와 동일한 정보). |
| `-h` / `--help`              | 루트 프로그램  | 루트 프로그램 또는 명령어 이름과 함께 사용 시 해당 하위 명령어에 대한 도움말을 표시합니다.      |
| `-c` / `--config <path>`     | 모든 명령어 | 구성 파일 경로(기본값: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | 모든 명령어 | 자세한 로그 기록.                                                                          |
| `-w` / `--write-logs [path]` | 모든 명령어 | 콘솔 출력을 `.log` 파일로 복사(기본 경로: 루트 `cacheDir` 아래).                |

### 명령어별 도움말

| 사용법                            | 설명                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | 해당 명령어의 모든 옵션.      |
| `ai-i18n-tools help <command>`   | `<command> --help`과 동일한 출력. |

### 대상 로캘(`-l` / `--locale`)

| 명령어                                                                                | 동작                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — 쉼표로 구분된 대상 BCP-47 코드(예: `de,fr,pt-BR`). 생략 시 구성 파일과 `ui-languages.json`에서 기본값을 가져옴. |
| `lint-source`                                                                           | `-l` / `--locale <code>` — 검토할 단일 소스 로캘(기본값: 구성 `sourceLocale`).                                                            |

---

<a id="environment-variables"></a>
## 환경 변수

| 변수               | 설명                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **필수 항목.** OpenRouter API 키.                     |
| `OPENROUTER_BASE_URL`   | API 기본 URL을 재정의합니다.                                 |
| `I18N_SOURCE_LOCALE`    | 런타임에 `sourceLocale`을 재정의합니다.                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`을 재정의할 쉼표로 구분된 로케일 코드입니다.  |
| `I18N_LOG_LEVEL`        | 로거 레벨(`debug`, `info`, `warn`, `error`, `silent`). |
| `NO_COLOR`              | `1`인 경우 로그 출력에서 ANSI 색상을 비활성화합니다.              |
| `I18N_LOG_SESSION_MAX`  | 로그 세션당 유지되는 최대 줄 수(기본값 `5000`).           |
