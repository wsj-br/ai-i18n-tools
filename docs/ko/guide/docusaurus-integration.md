<a id="docusaurus-integration"></a>
# Docusaurus 통합

`init -t ui-docusaurus` 및 `docsOutput.style: "docusaurus"`을(를) [Docusaurus](https://docusaurus.io/) 문서 사이트에 사용합니다. 이 사전 설정은 `docusaurusCatalogDir`이(가) 있는 `docs[]` 블록을 스캐폴드하여 `translate-docs`이(가) 페이지 마크다운과 Docusaurus 셸 JSON을 한 번의 명령으로 번역할 수 있도록 합니다.

다음 항목도 참조하세요. [문서](/guide/documents/), 실행 가능한 [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) 데모(Next.js 앱 및 중첩된 `docs-site/`), 그리고 Docusaurus 전용 연습을 위한 [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site).

<a id="quick-start"></a>
## 빠른 시작

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
```

문서 페이지와 사이트 크롬(탐색 모음, 바닥글, 테마 문자열)을 모두 번역할 때 `features.translateDocs`을(를) 활성화하고 `docs[].docusaurusCatalogDir`을(를) 설정합니다. `@docusaurus/*`을(를) 업그레이드하거나 탐색 모음/바닥글/테마 레이블을 변경할 때 Docusaurus 프로젝트에서 `docusaurus write-translations`을(를) 실행한 다음, `translate-docs` 또는 `sync`을(를) 다시 실행하여 셸 JSON이 각 로케일 폴더로 번역되도록 합니다.

<a id="page-layout"></a>
## 페이지 레이아웃

영어 마크다운 및 MDX는 Docusaurus `docs/` 폴더(예: `docs-site/docs/`) 아래에 있습니다. 번역된 사본은 각 로케일의 플러그인 콘텐츠 트리에 작성됩니다.

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

하나의 `docs[]` 블록을 구성합니다.

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

`contentPaths`을(를) 영어 `.md` / `.mdx` 파일 및 디렉터리를 가리키도록 합니다. `docsRoot`을(를) Docusaurus가 콘텐츠 루트로 사용하는 동일한 폴더로 설정합니다. `outputDir`을(를) `i18n/` 아래의 각 로케일 폴더의 상위 폴더로 설정합니다.

Docusaurus [국제화](https://docusaurus.io/docs/i18n/introduction)를 연결합니다. `ai-i18n-tools.config.json`의 `targetLocales`을(를) `docusaurus.config.js`의 `locales` 배열과 일치시킵니다. 각 `localeConfigs[locale].path`은(는) `i18n/` 아래의 폴더 이름(예: `i18n/fr/`의 경우 `path: "fr"`)과 일치해야 합니다.

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

<a id="framework-shell-translation"></a>
## 프레임워크 셸 번역

| 프레임워크 | 셸 / 테마 문자열 | 파이프라인 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 카탈로그 (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 테마/탐색/사이드바 카탈로그 | 문서 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 사이드바 레이블 | 문서 — `style: "nextra"` + `translate-docs`일 때 자동 |
| Nextra | 테마 사전 `.ts` | 문서 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 사이드바 레이블 | 문서 — `style: "fumadocs"` + `translate-docs` 시 자동 |
| Fumadocs | UI 오버라이드 카탈로그 | 문서 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 내장 UI 문자열(다국어); 추가 셸 파이프라인 없음 | 문서 — `translate-docs` (페이지 전용) |

**프레임워크 셸/테마 문자열을 `json[]`에 넣지 마세요** — 해당 파이프라인은 관련 없는 앱 로케일 번들을 위한 것입니다. 다른 프레임워크 패턴에 대해서는 [VitePress 통합](/guide/vitepress-integration), [Nextra 통합](/guide/nextra-integration), 및 [Fumadocs 통합](/guide/fumadocs-integration)을 참조하세요.

<a id="example-project"></a>
## 예제 프로젝트

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — `docs/`의 영어 소스, `i18n/<locale>/docusaurus-plugin-content-docs/current/` 아래의 커밋된 번역, 그리고 번역된 셸 JSON. 개발을 위해 포트 3040에서 `pnpm start`을(를) 실행합니다. 개발 모드에서 단일 로케일을 미리 보려면 `pnpm run start:fr`(및 유사한)을(를) 사용합니다.
