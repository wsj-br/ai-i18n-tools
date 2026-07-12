<a id="cli--setup"></a>
# CLI — 설정

<a id="version"></a>
### `version`

**개요:** `ai-i18n-tools version`

CLI 버전과 빌드 타임스탬프를 출력합니다(루트 프로그램의 `-V` / `--version`와 동일한 정보).

---

<a id="init"></a>
### `init`

**개요:** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

스타터 구성 파일을 작성합니다(`provider` / `providers`, `concurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, `docs[].addFrontmatter` 포함). LLM을 호출하는 번역 명령에는 환경 변수 또는 `.env`에 활성 프로바이더의 API 키가 필요합니다(Ollama 제외) — [프로바이더 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요.

**주요 옵션:** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider`은(는) 스캐폴딩할 **기본 제공 프리셋**을 선택합니다(`openrouter` 생략 시). 다음 중 하나여야 합니다: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `ollama`.

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
