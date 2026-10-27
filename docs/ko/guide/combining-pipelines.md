<a id="combining-pipelines"></a>
# 파이프라인 결합

하나의 프로젝트에 여러 종류의 번역(예: 앱 UI 문자열과 문서, 문서 사이트와 루트 README, 또는 문서와 SVG 일러스트레이션)이 필요한 경우 이 내용을 읽어보세요. 한 종류의 콘텐츠만 번역하는 경우 [빠른 시작](/ko/guide/quick-start)으로 충분합니다.

앱과 해당 저장소 README는 일반적인 하이브리드 구성입니다. `init` (`ui-markdown` 템플릿) 또는 `init -t <template> --with-readme`를 사용하여 스캐폴드한 다음, [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 따르세요. 이 페이지의 뒷부분에 나오는 혼합 구성은 문서 사이트와 함께 사용하는 동일한 아이디어입니다.

이 저장소는 그러한 종류의 프로젝트입니다. [`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)는 CLI 및 번역 대시보드 UI 문자열과 이 VitePress 사이트를 하나의 `sync`로 번역합니다. UI 블록은 `src/cli`, `src/server`, `src/dashboard-app`, `src/api`를 포함하며, `src/i18n/locales` 아래에 플랫 JSON을 작성합니다. VitePress 블록은 `docs/` 및 테마 카탈로그에 `docsOutput.style: "vitepress"`을 사용합니다. 동일한 파일은 `translated-docs/` 아래에 `README.md` 번역도 작성합니다. 사이트 연결: [VitePress](/ko/guide/integrations/vitepress).

<a id="what-sync-runs"></a>
## 동기화 실행 내용

`ai-i18n-tools sync`는 활성화된 단계를 다음 순서로 실행합니다:

1. `features.translateUIStrings`가 활성화된 경우, `extract` 다음 `translate-ui`
2. `features.translateSVG`가 활성화되고 `svg` 블록이 존재하는 경우, `translate-svg`
3. `features.translateDocs`이 활성화되거나 `docs[].docusaurusCatalogDir`이 설정된 경우, `translate-docs`
4. `features.translateJson`이 활성화되고 `json[]`에 항목이 있는 경우, `translate-json`

`--no-ui`, `--no-svg`, `--no-docs` 또는 `--no-json`가 있는 부분은 건너뜁니다. 문서 및 `json[]` 단계는 `--dry-run`, `-p` / `--path`, `--force`, `--force-update`, `--check-cache`을 허용합니다. `--no-docs`이 설정된 경우 문서 전용 플래그는 무시됩니다. `--no-json`가 설정되지 않은 경우 JSON은 동일한 캐시 플래그를 사용합니다.

개별 명령을 수동으로 연결하는 것보다 `sync`를 선호합니다. 수동으로 실행할 때 순서, 추출 및 로케일 플래그가 잘못될 수 있습니다.

<a id="combined-sync"></a>

<a id="ui-strings-and-documents-together"></a>
## UI 문자열과 문서 함께 사용

단일 구성에서 두 기능을 모두 활성화하여 UI 문자열과 문서를 한 번에 실행합니다:

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

<a id="fewer-locales-for-documents"></a>
## 문서용 로케일 축소

블록에 `docs[].targetLocales`를 사용하여 해당 블록의 파일을 UI보다 더 작은 하위 집합으로 번역합니다. 유효한 문서 로케일은 블록 전체의 합집합입니다:

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

<a id="mixed-documentation-config"></a>
## 혼합 문서 구성

`docs`에 여러 항목을 추가하여 동일한 구성에서 여러 문서 파이프라인을 결합할 수 있습니다. 이는 프로젝트에 Docusaurus 사이트 (`docsOutput.style = "docusaurus"`)와 `docsOutput.style = "flat"`가 있는 저장소 README와 같이 로케일 접미사가 붙은 파일 이름으로 번역되어야 하는 루트 수준 마크다운 파일이 있는 경우 일반적인 설정입니다.

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
- 첫 번째 문서 블록은 `docs-site/docs/`의 마크다운을 `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (현지화된 문서 페이지)로 번역합니다.
- `docs[].docusaurusCatalogDir`가 설정되고 `features.translateDocs`가 활성화되면, 동일한 블록이 `docs-site/i18n/en/` 아래의 Docusaurus 셸 JSON을 각 대상 로케일 폴더(탐색 모음, 바닥글, 테마/플러그인 카탈로그, MDX 본문 복사본 제외)로 번역합니다.
- 두 번째 문서 블록은 `README.md`을 `translated-docs/` 아래의 로케일 접미사가 붙은 파일 (`docsOutput.style = "flat"`)로 번역합니다.
- 모든 docs 블록은 `cacheDir`을 공유하므로 변경되지 않은 세그먼트는 실행 간에 재사용되어 API 호출과 비용을 줄입니다.

다음: [빠른 시작](/ko/guide/quick-start)으로 돌아가거나, 전체 스키마는 [구성](/ko/reference/configuration)을 참조하세요.
