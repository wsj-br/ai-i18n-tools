<a id="quick-start"></a>
# 빠른 시작

기본 `init` 템플릿(`ui-markdown`)은 **UI** 추출 및 번역만 활성화합니다. `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra` 및 `ui-fumadocs` 템플릿은 **문서** 번역(`translate-docs`)을 활성화합니다. `ui-vitepress`은 VitePress 테마 문자열을 위한 `docsOutput.vitepressThemeCatalog`도 스캐폴딩하며, `ui-nextra`은 Nextra 테마 사전을 위한 `docs[].nextraDictionaryPath`을 스캐폴딩합니다(사이드바 `_meta.ts`는 자동으로 수집됨). 또한 `ui-fumadocs`은 Fumadocs UI 재정의를 위한 `docsOutput.fumadocsUiCatalog`를 스캐폴딩합니다(사이드바 `meta.json`는 자동으로 수집됨). `ui-astro-website` 템플릿은 일반 Astro 앱(`.astro` 파일 포함)에 대한 **UI** 추출을 스캐폴딩합니다. `.astro` 페이지 HTML에 대한 `translate-docs`도 필요한 경우 `docs[]` 블록을 추가하십시오([Astro 웹사이트 페이지 (parse-and-replace)](/ko/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) 참조). [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 참조는 **두** 파이프라인을 모두 사용합니다. Python 템플릿은 `ui-python`, `ui-python-gettext`, `ui-python-flask` 및 `ui-python-django`입니다([Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) 참조). 구성에 따라 추출, UI 번역, 선택적 SVG 파일 번역 및 문서 번역을 실행하는 하나의 명령을 원할 때 `sync`을 사용하십시오.

Python 프로젝트는 독립 실행형 실행 파일을 사용하여 Node.js 설치를 건너뛸 수 있습니다. 다운로드 단계: [설치 — 독립 실행형 실행 파일](/ko/guide/installation#standalone-executables).

<a id="runnable-examples"></a>
### 실행 가능한 예시

실행 가능한 프로젝트와 픽스처는 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 아래에 있습니다. 전체 목록, 복사 명령 및 어떤 폴더가 `pnpm`과 Python 가상 환경을 사용하는지 확인하려면 [예제](/ko/examples) 카탈로그를 참조하십시오.

**Node.js 예제 하나를 독립적으로 실행**(전체 모노레포를 복제하지 않음):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

`console-app`을 다른 Node.js 예제 폴더 이름으로 바꾸십시오. 이러한 각 예제는 현재 패키지 버전과 일치하는 `ai-i18n-tools`의 게시된 캐럿 범위를 선언하고 npm에서 CLI를 설치합니다. Python 예제에는 `package.json`가 없습니다. 동일한 `degit` 명령으로 복사하거나 GitHub 릴리스에서 `ai-i18n-tools-python-examples.zip`를 사용한 다음 [예제 — Python](/ko/examples#python-examples)을 따르십시오.

**전체 ai-i18n-tools 저장소에서** — 전체 저장소를 복제한 경우(degit으로 단일 예제 폴더만 복제한 것이 아닌 경우):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

워크스페이스 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 항목(`ai-i18n-tools: workspace:*`)은 워크스페이스 예제를 로컬 체크아웃에 자동으로 연결합니다. 독립형 픽스처(`multi-provider`, `test-markdown`)는 워크스페이스 패키지가 아닙니다 — 해당 폴더에서 `node ../../bin/ai-i18n-tools.mjs …`를 사용하세요. **저장소 루트**(이 패키지 자체의 docs/i18n)에서 CLI를 실행하려면 `direnv allow` 이후에 단순히 `ai-i18n-tools`를 사용하거나, `pnpm i18n:sync` / `node bin/ai-i18n-tools.mjs …`를 사용하세요 — [설치 — 복제한 모노레포](/ko/guide/installation#cloned-monorepo) 및 [개발 가이드](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)를 참조하세요.

<a id="provider-and-api-key-required-for-translation"></a>
### 프로바이더 및 API 키(번역 필수)

LLM을 호출하는 모든 명령 — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync` — 에는 다음 **두 가지**가 모두 필요합니다:

1. **최소 하나의 제공자**가 `ai-i18n-tools.config.json`에 필요합니다: `translationModels`가 있는 `providers.<name>` 블록과, 둘 이상의 제공자가 구성된 경우 최상위 `provider` 키입니다. `init -P <provider>`는 해당 프리셋을 스캐폴드합니다; 제공자를 추가하거나 모델 목록을 조정하세요 — [LLM 제공자 및 모델](/ko/guide/providers-and-models)을 참조하세요.
2. **일치하는 API 키**를 환경 또는 프로젝트 루트의 `.env` 파일에 설정합니다. 각 기본 제공 프리셋은 [프리셋 테이블](/ko/guide/providers-and-models#built-in-providers)에서 명명된 환경 변수를 읽습니다 (예: `OPENROUTER_API_KEY`와 `-P openrouter`, 또는 `OPENAI_API_KEY`와 `-P openai`); **Ollama**는 예외입니다 — 로컬 엔드포인트를 사용하며 키가 필요하지 않습니다. [설치 — 제공자 API 키 설정](/ko/guide/installation#using-the-cli)을 참조하세요.

`extract`, `status` 및 LLM을 호출하지 않는 다른 명령에는 프로바이더나 API 키가 필요하지 않습니다.

<a id="core-cli-commands"></a>
### 핵심 CLI 명령어

`ai-i18n-tools`을(를) 설치하고 [bare 명령어에 맞게 셸 구성](/ko/guide/installation#using-the-cli)을 마친 후 **프로젝트 루트**에서 실행하세요. 아래 예제는 `ai-i18n-tools`을(를) 직접 사용합니다.

```bash
# Set the API key for the provider you pass to init (see preset table; skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# export OPENAI_API_KEY=sk-your-key-here
# export CHEAPERINFERENCE_API_KEY=your-key-here

# UI strings (ui-markdown template enables extract + translate-ui)
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models          # optional: ranked shortlist
ai-i18n-tools suggest-models --apply  # replace translationModels
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight -P cheaperinference
# VitePress docs: ai-i18n-tools init -t ui-vitepress -P anthropic
# Nextra docs: ai-i18n-tools init -t ui-nextra -P gemini
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs -P groq
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website -P ollama
# Plain HTML catalog: ai-i18n-tools init -t ui-plain-html -P openrouter
# Plain HTML documents: ai-i18n-tools init -t docs-plain-html -P openai
# Python flat JSON: ai-i18n-tools init -t ui-python -P cheaperinference
# Python JSON + gettext: ai-i18n-tools init -t ui-python-gettext -P anthropic
# Django catalogs: ai-i18n-tools init -t ui-python-django -P gemini
# Flask / Jinja gettext: ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles -P ollama
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

`init`이 작성한 모델 목록은 시작점입니다. `suggest-models`은 활성 공급자의 채팅 모델 순위를 매깁니다. `suggest-models --apply`는 `translationModels`을 대체하고 `uiModels`와 `localeModels`는 변경하지 않습니다. 동일한 순위가 [모델](/ko/guide/translation-dashboard/models) 탭에 있습니다. 명령 참조: [suggest-models](/ko/reference/cli-commands/models#suggest-models).

<a id="recommended-packagejson-scripts"></a>
### 권장 `package.json` 스크립트

패키지를 로컬에 설치하면 `package.json` 스크립트는 추가 셸 설정 없이 `node_modules/.bin`에서 `ai-i18n-tools`을(를) 해석합니다. 대화형 셸의 경우 먼저 PATH를 구성하세요 — [CLI 사용](/ko/guide/installation#using-the-cli)을 참조하세요.

**선호** `sync`는 “`translate-ui` 실행 후 `translate-svg`, 그 다음 `translate-docs`, 그 다음 `translate-json`”와 같은 모든 작업에 대해: `ai-i18n-tools sync`는 **추출** (활성화된 경우), **translate-ui**, 선택적 **translate-svg**, **translate-docs**, 그 다음 선택적 **translate-json**를 실행합니다—올바른 순서와 공유 플래그에 따라 귀하의 구성에 따라. 이러한 단계를 수동으로 연결하는 것은 (순서, 추출, 로케일 플래그) 잘못될 수 있습니다. `i18n:translate:ui`, `i18n:translate:svg`, `i18n:translate:docs`, 및 `i18n:translate:json`는 단일 **단계**가 격리된 상태에서 필요할 때만 사용하십시오.

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**팁:** CLI 출력과 대시보드를 다른 언어로 표시하려면 `-L <code>`를 전달하거나 `AI_I18N_LANG`를 설정하세요 — [도구 UI 언어](/ko/guide/tool-ui-language)를 참조하세요.

<a id="combined-sync"></a>
## 결합된 동기화

UI 문자열과 문서를 함께 실행하려면 단일 구성에서 모든 기능을 활성화합니다.

<details>
<summary>UI 및 문서 설정 예제 통합</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

UI 블록은 기본적으로 문서화를 위한 용어집 힌트로 `strings.json` 카탈로그를 포함합니다(`uiGlossary`). `glossary.userGlossary`는 제품 용어에 대한 CSV 재정의를 추가합니다. [용어집](/ko/guide/glossary)을 참조하세요.

하나의 파이프라인을 실행하려면 `ai-i18n-tools sync`를 실행하십시오: `features.translateUIStrings`이(가) 활성화된 경우 **추출**한 다음 **UI 번역** 문자열을 번역합니다; 선택적 **SVG 번역** (`features.translateSVG` + `svg` 블록); **문서 번역** (구성된 대로 `docs[]`); 그 다음 선택적 **translate-json** (`features.translateJson` + `json[]`). `--no-ui`, `--no-svg`, `--no-docs` 또는 `--no-json`으로 부분을 건너뜁니다. 문서 및 `json[]` 단계는 `--dry-run`, `-p` / `--path`, `--force`, `--force-update` 및 `--check-cache`을(를) 허용합니다 (`--no-docs`일 때 문서 전용 플래그는 무시됩니다; `--no-json`이(가) 설정되지 않은 경우 JSON은 동일한 캐시 플래그를 사용합니다).

블록에서 `docs[].targetLocales`을 사용하면 해당 블록의 파일을 UI보다 **더 작은 하위 집합**으로 번역할 수 있습니다(유효한 문서 로케일은 블록 전체에 대해 **합집합**으로 간주됨).

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### 혼합 문서 구성(`docsOutput.style = "docusaurus"` + `"flat"`)

`docs`에 두 개 이상의 항목을 추가하여 동일한 구성에서 여러 문서 파이프라인을 결합할 수 있습니다. 이 설정은 프로젝트에 Docusaurus 사이트(`docsOutput.style = "docusaurus"`)와 함께 로케일 접미사가 붙은 파일명으로 번역되어야 하는 루트 수준의 마크다운 파일(예: `docsOutput.style = "flat"`가 포함된 저장소 README)이 있는 경우 흔히 사용됩니다.

<details>
<summary>Docusaurus와 단순 README 설정 혼합 예제</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
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

`ai-i18n-tools sync`에서 이것이 어떻게 실행되는지:

- UI 문자열은 `src/`에서 추출되어 `public/locales/`로 번역됩니다.
- 첫 번째 문서 블록은 `docs-site/docs/`에서 **마크다운**을 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`로 번역합니다 (지역화된 문서 페이지).
- `docs[].docusaurusCatalogDir`가 설정되고 `features.translateDocs`가 활성화된 경우, 동일한 블록이 `docs-site/i18n/en/` 아래의 각 대상 로케일 폴더로 **Docusaurus 셸 JSON**도 번역합니다 — 내비게이션 바, 푸터, 테마/플러그인 카탈로그는 번역되지만 MDX 본문은 번역되지 않습니다.
- 두 번째 문서 블록은 `README.md`을 `translated-docs/` 아래의 로케일 접미사가 붙은 파일로 번역합니다 (`docsOutput.style = "flat"`).
- 모든 docs 블록은 `cacheDir`을 공유하므로 변경되지 않은 세그먼트는 실행 간에 재사용되어 API 호출과 비용을 줄입니다.
