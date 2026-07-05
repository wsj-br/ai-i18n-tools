<a id="quick-start"></a>
# 빠른 시작

기본 `init` 템플릿(`ui-markdown`)은 **UI** 추출 및 번역만 활성화합니다. `ui-docusaurus`, `ui-starlight`, `ui-vitepress` 템플릿은 **문서** 번역(`translate-docs`)을 활성화하며, `ui-vitepress`은 VitePress 테마 JSON용 JSON도 스캐폴드합니다. `ui-astro-website` 템플릿은 일반 Astro 앱(포함 `.astro` 파일)용 **UI** 추출을 스캐폴드합니다. `.astro` 페이지 HTML용 `translate-docs`도 원하는 경우 `docs[]` 블록을 추가하세요([Astro 웹사이트 페이지(구문 분석 및 교체)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) 참조). 참조 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)는 **두** 파이프라인을 모두 사용합니다. 구성에 따라 추출, UI 번역, 선택적 SVG 파일 번역 및 문서 번역을 실행하는 단일 명령을 원할 경우 `sync`을 사용하세요.

<a id="runnable-examples"></a>
### 실행 가능한 예시

[`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) 아래에 7개의 실행 가능한 프로젝트와 픽스처가 있습니다. [예제](/examples) 카탈로그(콘솔 앱, Next.js + Docusaurus, Astro 웹사이트, Astro Starlight 문서, VitePress 문서, 다중 공급자 비교, 마크다운 스트레스 테스트)를 참조하세요.

**하나의 예시를 독립적으로 실행합니다** (전체 모노레포를 복제하지 않고):

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

`console-app`를 예시 폴더 이름으로 바꿉니다. 각 예시는 `"ai-i18n-tools": "^1.7.2"`를 선언하고 npm에서 CLI를 설치합니다. 예시별 README에는 폴더 이름이 채워진 동일한 스니펫이 포함되어 있습니다.

**전체 ai-i18n-tools 저장소에서:** 전체 저장소를 복제한 경우(degit으로 하나의 예제 폴더만 복제한 것이 아닌 경우), 저장소 루트에서 `pnpm install`를 실행하세요. 작업 공간 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 항목(`ai-i18n-tools: workspace:*`)이 예제를 로컬 체크아웃에 자동으로 연결합니다.

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
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
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**팁:** CLI 출력 및 대시보드를 다른 언어로 보려면 `-L <code>`를 전달하거나 `AI_I18N_LANG`를 설정하세요([도구 UI 언어](/reference/environment-variables#tool-ui-language) 참조).

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

`npx ai-i18n-tools sync`을 실행하여 하나의 파이프라인을 실행합니다: `features.translateUIStrings`이 활성화된 경우, 먼저 UI 문자열을 **추출**한 다음 **번역**합니다. 선택적으로 **SVG 번역** (`features.translateSVG` + `svg` 블록); **문서 번역** (설정된 대로 `docs[]`); 그 후 선택적으로 **translate-json** (`features.translateJson` + `json[]`). `--no-ui`, `--no-svg`, `--no-docs`, 또는 `--no-json`으로 일부 단계를 건너뛸 수 있습니다. 문서 및 `json[]` 단계는 `--dry-run`, `-p` / `--path`, `--force`, `--force-update`을 허용합니다 (`--no-docs`일 때 문서 전용 플래그는 무시됨; `--no-json`이 설정되지 않은 경우 JSON은 동일한 캐시 플래그를 사용함).

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

`npx ai-i18n-tools sync`으로 실행할 경우:

- UI 문자열은 `src/`에서 추출되어 `public/locales/`로 번역됩니다.
- 첫 번째 문서 블록은 `docs-site/docs/`에서 **마크다운**을 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`로 번역합니다 (지역화된 문서 페이지).
- `docs[].docusaurusCatalogDir`가 설정되고 `features.translateDocs`가 활성화된 경우, 동일한 블록이 `docs-site/i18n/en/` 아래의 각 대상 로케일 폴더로 **Docusaurus 셸 JSON**도 번역합니다 — 내비게이션 바, 푸터, 테마/플러그인 카탈로그는 번역되지만 MDX 본문은 번역되지 않습니다.
- 두 번째 문서 블록은 `README.md`을 `translated-docs/` 아래의 로케일 접미사가 붙은 파일로 번역합니다 (`docsOutput.style = "flat"`).
- 모든 docs 블록은 `cacheDir`을 공유하므로 변경되지 않은 세그먼트는 실행 간에 재사용되어 API 호출과 비용을 줄입니다.
