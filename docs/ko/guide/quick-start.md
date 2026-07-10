<a id="quick-start"></a>
# 빠른 시작

기본 `init` 템플릿(`ui-markdown`)은 **UI** 추출 및 번역만 활성화합니다. `ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs` 템플릿은 **문서** 번역(`translate-docs`)을 활성화합니다. `ui-vitepress`은 VitePress 테마 문자열용 `docsOutput.vitepressThemeCatalog`도 스캐폴드하고, `ui-nextra`은 Nextra 테마 사전용 `docs[].nextraDictionaryPath`을 스캐폴드하며(사이드바 `_meta.ts`는 자동으로 수집됨), `ui-fumadocs`은 Fumadocs UI 재정의용 `docsOutput.fumadocsUiCatalog`를 스캐폴드합니다(사이드바 `meta.json`는 자동으로 수집됨). `ui-astro-website` 템플릿은 일반 Astro 앱(포함 `.astro` 파일)용 **UI** 추출을 스캐폴드합니다. `.astro` 페이지 HTML용 `translate-docs`도 원하는 경우 `docs[]` 블록([Astro 웹사이트 페이지(구문 분석 및 대체)](/ko/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) 참조)을 추가하세요. 참조 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)는 **두** 파이프라인을 모두 사용합니다. 구성에 따라 추출, UI 번역, 선택적 SVG 파일 번역 및 문서 번역을 실행하는 단일 명령을 원할 경우 `sync`를 사용하세요.

<a id="runnable-examples"></a>
### 실행 가능한 예시

실행 가능한 9개의 프로젝트와 픽스처는 [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/)에 있습니다. [예시](/ko/examples) 카탈로그(콘솔 앱, Next.js + Docusaurus, Astro 웹사이트, Astro Starlight 문서, VitePress 문서, Nextra 문서, Fumadocs 문서, 다중 공급자 비교, 마크다운 스트레스 테스트)를 참조하세요.

**하나의 예시를 독립적으로 실행합니다** (전체 모노레포를 복제하지 않고):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

`console-app`를 예시 폴더 이름으로 바꿉니다. 각 예시는 `"ai-i18n-tools": "^1.7.2"`를 선언하고 npm에서 CLI를 설치합니다. 예시별 README에는 폴더 이름이 채워진 동일한 스니펫이 포함되어 있습니다.

**전체 ai-i18n-tools 저장소에서** — 전체 저장소를 복제한 경우(degit으로 단일 예제 폴더만 복제한 것이 아닌 경우):

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: pnpm exec ai-i18n-tools sync
```

워크스페이스 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 항목(`ai-i18n-tools: workspace:*`)은 워크스페이스 예제를 로컬 체크아웃에 자동으로 연결합니다. 독립형 픽스처(`multi-provider`, `test-markdown`)는 워크스페이스 패키지가 아닙니다. 해당 폴더에서 `node ../../bin/ai-i18n-tools.mjs …`를 사용하세요. **저장소 루트**에서 CLI를 실행하려면(이 패키지 자체의 docs/i18n), `pnpm i18n:sync` 또는 `node bin/ai-i18n-tools.mjs …`를 사용하세요 — [설치 — 복제된 모노레포](/ko/guide/installation#cloned-monorepo) 및 [개발 가이드](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)를 참조하세요.

<a id="provider-and-api-key-required-for-translation"></a>
### 프로바이더 및 API 키(번역 필수)

LLM을 호출하는 모든 명령 — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync` — 에는 다음 **두 가지**가 모두 필요합니다:

1. `ai-i18n-tools.config.json` 내의 **최소 한 개의 프로바이더**: `translationModels`가 포함된 `providers.<name>` 블록, 그리고 두 개 이상의 프로바이더가 구성된 경우 최상위 `provider` 키. `init`는 기본적으로 OpenRouter를 스캐폴드합니다. 프리셋을 전환하거나, 프로바이더를 추가하거나, 모델 목록을 조정하려면 [LLM 프로바이더 및 모델](/ko/guide/providers-and-models)을 참조하세요.
2. 환경 변수 또는 프로젝트 루트의 `.env` 파일에 있는 **일치하는 API 키**. 각 빌트인 프리셋은 명명된 환경 변수(예: `OPENROUTER_API_KEY`)를 읽습니다. **Ollama**는 예외입니다 — 로컬 엔드포인트를 사용하며 키가 필요하지 않습니다. [설치 — 프로바이더 API 키 설정](/ko/guide/installation#using-the-cli) 및 [프리셋 환경 변수 테이블](/ko/guide/providers-and-models#built-in-providers)을 참조하세요.

`extract`, `status` 및 LLM을 호출하지 않는 다른 명령에는 프로바이더나 API 키가 필요하지 않습니다.

<a id="core-cli-commands"></a>
### 핵심 CLI 명령어

`ai-i18n-tools` 설치 후 **프로젝트 루트**에서 실행하세요 (`npx`, `pnpm exec`, `package.json` 스크립트는 [CLI 사용](/ko/guide/installation#using-the-cli) 참조). 아래 예제는 기본 명령어 이름을 사용합니다; npm 사용자는 `npx`를 접두어로 붙일 수 있고, pnpm 사용자는 `pnpm exec`를 접두어로 붙일 수 있습니다.

```bash
# Set API key for your active provider (skip for local Ollama)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here   # or your provider's env var

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init    # writes config including provider block; edit provider/models if needed
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight
# VitePress docs: ai-i18n-tools init -t ui-vitepress
# Nextra docs: ai-i18n-tools init -t ui-nextra
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 권장 `package.json` 스크립트

로컬에 패키지를 설치하면 CLI 명령을 스크립트에서 직접 사용할 수 있습니다(`npx` 필요 없음).

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
    "uiGlossary": "src/locales/strings.json",
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

`glossary.uiGlossary`은 문서 번역을 UI와 동일한 `strings.json` 카탈로그를 가리키도록 하여 용어의 일관성을 유지합니다. `glossary.userGlossary`는 제품 용어에 대한 CSV 오버라이드를 추가합니다.

하나의 파이프라인을 실행하려면 `ai-i18n-tools sync`을 실행하세요: `features.translateUIStrings`이 활성화된 경우, **추출**한 다음 UI 문자열을 **번역**합니다; 선택적 **SVG 번역** (`features.translateSVG` + `svg` 블록); **문서 번역** (구성된 대로 `docs[]`); 그다음 선택적 **translate-json** (`features.translateJson` + `json[]`). `--no-ui`, `--no-svg`, `--no-docs` 또는 `--no-json`으로 부분을 건너뜁니다. 문서 및 `json[]` 단계는 `--dry-run`, `-p` / `--path`, `--force`, `--force-update`을 허용합니다 (`--no-docs`일 때 문서 전용 플래그는 무시됩니다; `--no-json`이 설정되지 않은 경우 JSON은 동일한 캐시 플래그를 사용합니다).

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
