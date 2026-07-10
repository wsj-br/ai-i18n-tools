<a id="cli--setup"></a>
# CLI — 설정

<a id="version"></a>
### `version`

**개요:** `ai-i18n-tools version`

CLI 버전과 빌드 타임스탬프를 출력합니다(루트 프로그램의 `-V` / `--version`와 동일한 정보).

---

<a id="init"></a>
### `init`

**개요:** `ai-i18n-tools init [-t <template>] [-o <path>] [--with-translate-ignore]`

시작용 구성 파일을 작성합니다(`concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, `docs[].addFrontmatter` 포함).

**주요 옵션:** `-t` / `--template`, `-o` / `--output`, `--with-translate-ignore`

**템플릿(`-t`):**

| 값 | 스캐폴드 |
|-------|-----------|
| `ui-markdown` | 마크다운 UI 문자열 워크플로 |
| `ui-docusaurus` | Docusaurus UI + 문서 |
| `ui-starlight` | Starlight 문서 |
| `ui-vitepress` | VitePress 문서(`docsOutput.style: "vitepress"`) 및 테마 문자열을 위한 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra 문서(`docsOutput.style: "nextra"`) 및 테마 사전을 위한 `nextraDictionaryPath` (사이드바 `_meta.ts`는 자동으로 수집됨) |
| `ui-fumadocs` | Fumadocs 문서(`docsOutput.style: "fumadocs"`) 및 UI 오버라이드를 위한 `fumadocsUiCatalog` (사이드바 `meta.json`는 자동으로 수집됨) |
| `ui-astro-website` | Astro 웹사이트 UI 문자열 |
| `ui-json-bundles` | JSON (`json[]`만 해당) |

`--with-translate-ignore`는 시작용 `.translate-ignore`를 생성합니다.
