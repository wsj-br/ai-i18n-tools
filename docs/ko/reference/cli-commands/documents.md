<a id="cli--documents"></a>
# CLI — 문서

<a id="translate-docs"></a>
### `translate-docs`

**개요:** `ai-i18n-tools translate-docs [options]`

각 `docs` 블록에 대해 마크다운, MDX, `.astro`, 선택적 Docusaurus 카탈로그 JSON(`docusaurusCatalogDir`), 선택적 Nextra `_meta.ts`/사전 `.ts`, 선택적 VitePress 테마 카탈로그를 번역합니다.

**주요 옵션:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `-p` / `-f`, `--dry-run`

`-j`: 최대 병렬 로케일; `-b`: 파일당 최대 병렬 배치 API 호출. `--prompt-format`: 배치 와이어 형식(`xml` | `json-array` | `json-object`).

**참고 항목:** [캐시 동작 및 `translate-docs` 플래그](/ko/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [배치 프롬프트 형식](/ko/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**개요:** `ai-i18n-tools write-heading-ids [options]`

최소 하나 이상의 `docs[]` 블록이 필요합니다. 각 블록의 `contentPaths` 아래에 `.md` / `.mdx`를 수집합니다(`.translate-ignore`를 준수). 기본적으로 각 플랫 ATX `#` 제목 바로 앞에 HTML 앵커 라인 `<a id="slug"></a>`를 삽입합니다(펜스드 코드 블록 내부의 제목은 건너뜁니다). 앵커 라인이 이미 존재하는 경우, 현재 제목 텍스트에서 파생된 slug와 더 이상 일치하지 않으면 `id`를 업데이트합니다. `--slug-style mdx-comment`를 사용하면, 대신 제목 라인에 Docusaurus MDX 코멘트 접미사 `{/* #slug */}`를 추가합니다(동일한 github 스타일 slug 알고리즘). 제목 텍스트가 변경되면 오래된 코멘트를 갱신합니다.

**주요 옵션:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--dry-run`

`--slug-style`: `github` (기본값; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment` (Docusaurus `{/* #… */}` 접미사). `pymdown`를 사용하면, 선택적 `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`.

**참고 항목:** [앵커 링크](/ko/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**개요:** `ai-i18n-tools check-markdown [options]`

각 `docs[]` 블록의 `contentPaths` 아래에 있는 마크다운/MDX를 스캔합니다(`translate-docs`와 동일한 검색, `.translate-ignore` 적용): 구분자 쌍, 닫히지 않은 인라인 코드, 그리고 `**`/`__`가 `[text](url)` 링크를 감쌀 때 `STRONG_OUTSIDE_LINK`.

문제가 있을 경우 `relativePath:line: [ISSUE_CODE] message` 라인을 stderr로 출력하고 종료 코드는 **1**입니다. `--json`: stdout에 JSON 보고서를 출력합니다. `--no-cache`가 아닌 경우 `cacheDir`에 `markdown_source_issues`를 작성합니다. `-v`는 stderr 라인에 소스 해시를 추가합니다.

**주요 옵션:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**참고 항목:** [마크다운 문제](/ko/guide/translation-dashboard/markdown-issues)
