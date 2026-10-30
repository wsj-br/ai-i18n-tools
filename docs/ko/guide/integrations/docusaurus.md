<a id="docusaurus-integration"></a>
# Docusaurus 통합

`init -t ui-docusaurus` 및 `docsOutput.style: "docusaurus"`을(를) [Docusaurus](https://docusaurus.io/) 문서 사이트에 사용합니다. 이 사전 설정은 `docusaurusCatalogDir`이(가) 있는 `docs[]` 블록을 스캐폴드하여 `translate-docs`이(가) 페이지 마크다운과 Docusaurus 셸 JSON을 한 번의 명령으로 번역할 수 있도록 합니다.

[문서](/ko/guide/documents/), 실행 가능한 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) 데모, 그리고 중첩된 Docusaurus 문서, 플랫 README 및 SVG 에셋이 결합된 Next.js 앱을 위한 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)도 참조하세요.

<a id="quick-start"></a>
## 빠른 시작

```bash
ai-i18n-tools init -t ui-docusaurus -P openai
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
```

문서 페이지와 사이트 셸 문자열(내비게이션 바, 푸터, 테마 문자열)을 모두 번역할 때 `features.translateDocs`을(를) 활성화하고 `docs[].docusaurusCatalogDir`을(를) 설정합니다. `@docusaurus/*`을(를) 업그레이드하거나 내비게이션 바/푸터/테마 레이블을 변경할 때 Docusaurus 프로젝트에서 `docusaurus write-translations`을(를) 실행합니다. 그런 다음, 셸 JSON이 각 로케일 폴더로 번역되도록 `translate-docs` 또는 `sync`을(를) 다시 실행합니다.

<a id="page-layout"></a>
## 페이지 레이아웃

영어 마크다운 및 MDX는 Docusaurus `docs/` 폴더(예: `docs-site/docs/`) 아래에 있습니다. 번역된 사본은 각 로케일의 플러그인 콘텐츠 트리에 작성됩니다.

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

하나의 `docs[]` 블록을 구성하세요:

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

`contentPaths`을(를) `sourceLocale`로 작성된 `.md` / `.mdx` 파일 및 디렉터리로 지정합니다. 그 언어는 어떤 언어든 가능합니다. `docsRoot`를 Docusaurus가 콘텐츠 루트로 사용하는 것과 동일한 폴더로 설정합니다. `outputDir`를 `i18n/` 아래에 있는 각 로케일 폴더의 상위 폴더로 설정합니다.

Docusaurus [국제화](https://docusaurus.io/docs/i18n/introduction)를 연결합니다. `ai-i18n-tools.config.json`의 `targetLocales`을(를) `docusaurus.config.js`의 `locales` 배열과 일치시킵니다. 각 `localeConfigs[locale].path`은(는) `i18n/` 아래의 폴더 이름(예: `i18n/fr/`의 경우 `path: "fr"`)과 일치해야 합니다.

<a id="enable-i18n-in-an-existing-site"></a>
### 기존 사이트에서 i18n 활성화하기

첫 설정은 [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website#run-the-agent-prompt)의 프롬프트를 사용합니다. 아래 체크리스트는 수동으로 진행하는 것과 동일합니다.

- URL 경로가 로케일 코드와 달라야 하는 경우 `docusaurus.config.js`에 `i18n` 블록(`defaultLocale`, `locales`, `localeConfigs[locale].path`)을 추가합니다.
- `docusaurus write-translations`을(를) 실행하여 `i18n/<defaultLocale>/`이(가) 존재하도록 한 다음, `docusaurusCatalogDir`을(를) 해당 폴더로 지정하고 `sync`을(를) 실행합니다.
- `src/pages` 및 `src/components`의 사용자 지정 React는 마크다운이 아닙니다. `write-translations`이(가) `code.json`에 수집할 수 있도록 `@docusaurus/Translate`의 `<Translate>` 또는 `translate()`(으)로 사용자에게 표시되는 텍스트를 표시합니다. 메시지는 정적 문자열이어야 합니다. `write-translations`은(는) `i18n/<locale>/code.json`을(를) 작성합니다. `docusaurusCatalogDir`이(가) 설정되면 `translate-docs`은(는) 나머지 셸 카탈로그와 함께 해당 JSON을 번역합니다. ai-i18n-tools는 해당 JSX 트리에서 `t()`을(를) 스캔하지 않습니다.

<a id="shell-strings-write-translations"></a>
## 셸 문자열 (write-translations)

Docusaurus 탐색 모음, 바닥글, 검색 자리 표시자 및 기타 테마/플러그인 레이블은 마크다운에서 추출되지 않습니다. Docusaurus 프로젝트에서 `docusaurus write-translations`을(를) 실행하여 기본 로케일 폴더(일반적으로 `i18n/en/`) 아래에 JSON 카탈로그를 생성합니다. 그런 다음 `docs[].docusaurusCatalogDir`을(를) 해당 폴더를 가리키도록 합니다.

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

`docusaurusCatalogDir`이(가) 설정되고 `features.translateDocs`이(가) 활성화되면 `translate-docs`은(는) 다음을 모두 번역합니다.

- **문서 페이지** — `contentPaths`에서 `i18n/<locale>/docusaurus-plugin-content-docs/current/`(으)로 마크다운/MDX
- **셸 JSON** — `i18n/en/`에서 형제 로케일 폴더로 탐색 모음, 바닥글 및 테마/플러그인 카탈로그

Docusaurus 셸 JSON을 `json[]`에 넣지 마십시오. 대신 Documents와 함께 `docs[].docusaurusCatalogDir`을(를) 사용하십시오.

<a id="example-project"></a>
## 예시 프로젝트

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — `docs/`의 영어 소스, `i18n/<locale>/docusaurus-plugin-content-docs/current/`에 커밋된 번역, 그리고 번역된 셸 JSON. 로케일 드롭다운이 작동하도록 포트 3100에서 `pnpm start`를 실행(빌드 + 서브)하세요. 영어 전용 핫 리로드에는 `pnpm dev`를 사용하세요.

동일한 저장소 레이아웃의 UI 문자열, SVG 번역 및 플랫 README에 대해서는 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)(포트 3040의 중첩된 `docs-site/`)을 참조하세요.
