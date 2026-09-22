<a id="cli--documents"></a>
# CLI — 문서

<a id="translate-docs"></a>
### `translate-docs`

**개요:** `ai-i18n-tools translate-docs [options]`

각 `docs` 블록에 대해 마크다운, MDX, `.astro`, 선택적 Docusaurus 카탈로그 JSON(`docusaurusCatalogDir`), 선택적 Nextra `_meta.ts`/사전 `.ts`, 선택적 VitePress 테마 카탈로그를 번역합니다.

**주요 옵션:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `--check-cache`, `-p` / `-f`, `--dry-run`

`-j`: 최대 병렬 로케일; `-b`: 파일당 최대 병렬 배치 API 호출. `--prompt-format`: 배치 와이어 형식(`xml` | `json-array` | `json-object`).

**참고 항목:** [캐시 동작 및 `translate-docs` 플래그](/ko/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags), [배치 프롬프트 형식](/ko/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**개요:** `ai-i18n-tools write-heading-ids [options]`

최소 하나의 `docs[]` 블록이 필요합니다. 각 블록의 `contentPaths` 아래에 `.md` / `.mdx`를 수집합니다(`.translate-ignore`를 준수). 기본적으로 각 플랫 ATX `#` 제목 바로 앞에 HTML 앵커 라인 `<a id="slug"></a>`를 삽입합니다(펜스 코드 블록 내부의 제목은 건너뜁니다). 모든 형태의 기존 제목 ID(HTML 앵커 라인, 클래식 `{#id}` 접미사, MDX `{/* #id */}` 주석)는 선택한 스타일로 대체되며, 슬러그는 항상 현재 제목 텍스트에서 파생됩니다. `--slug-style mdx-comment`를 사용하면 대신 제목 라인에 Docusaurus MDX 주석 접미사를 작성하고(동일한 github 스타일 슬러그 알고리즘 사용) 앞에 오는 HTML 앵커가 있을 경우 제거합니다. `--remove`는 이러한 모든 제목 ID 형태를 제거하고 그 자리에 아무것도 작성하지 않습니다.

소스 파일을 업데이트한 후, 이 명령은 각 로케일의 기존 번역된 마크다운도 순회합니다(`translate-docs`과 동일한 `docsOutput` 경로 매핑). 문서 순서에 따라 일치하는 ATX 헤딩에 **English** 헤딩 id를 복사합니다(번역된 제목을 슬러그화하지 않음). 또한 헤딩 중간에 있는 `{#id}` / `{/* #id */}`(또는 잘못된 HTML `<a id>`)을 Docusaurus 또는 선택한 스타일이 예상하는 형식으로 되돌립니다. 누락된 번역 파일은 건너뜁니다. `--remove`는 잘못 배치된 줄 중간 토큰을 포함하여 해당 번역 파일에서도 헤딩 id를 제거합니다.

번역된 파일의 제목 ID가 재배치되거나 복구될 때, 영어 원본과 기존 및 신규 번역 콘텐츠의 세그먼트 수가 동일하면 영어 원본 해시를 키로 하는 일치하는 캐시된 번역 세그먼트도 함께 업데이트됩니다. 개수가 불일치할 경우 해당 파일 및 로캘을 건너뜁니다. 이후 `sync --force-update`에서 업데이트된 캐시 행을 기반으로 파일을 재구성합니다.

**주요 옵션:** `-p` / `--path`, `-f` / `--file`, `--slug-style`, `--remove`, `--dry-run`

`--slug-style`: `github`(기본값; doctoc / anchor-markdown-header), `bitbucket`, `gitlab`, `pymdown`, `azure-devops`, `mdx-comment`(Docusaurus `{/* #… */}` 접미사). `pymdown` 사용 시, 선택적 `--pymdown-case`, `--pymdown-normalize`, `--pymdown-percent-encode` / `--no-pymdown-percent-encode`. `--remove`는 `--pymdown-*`와 함께 사용할 수 없습니다.

**참고 항목:** [앵커 링크](/ko/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**개요:** `ai-i18n-tools check-markdown [options]`

각 `docs[]` 블록의 `contentPaths` 아래에 있는 마크다운/MDX를 스캔합니다(`translate-docs`와 동일한 검색, `.translate-ignore` 적용): 구분자 쌍, 닫히지 않은 인라인 코드, 그리고 `**`/`__`가 `[text](url)` 링크를 감쌀 때 `STRONG_OUTSIDE_LINK`.

문제가 있을 경우 `relativePath:line: [ISSUE_CODE] message` 라인을 stderr로 출력하고 종료 코드는 **1**입니다. `--json`: stdout에 JSON 보고서를 출력합니다. `--no-cache`가 아닌 경우 `cacheDir`에 `markdown_source_issues`를 작성합니다. `-v`는 stderr 라인에 소스 해시를 추가합니다.

**주요 옵션:** `-p` / `--path`, `-f` / `--file`, `--json`, `--no-cache`

**참고 항목:** [마크다운 문제](/ko/guide/translation-dashboard/markdown-issues)
