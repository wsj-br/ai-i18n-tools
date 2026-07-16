<a id="cli-reference"></a>
# CLI 참조

명령의 모든 플래그에 대해 `ai-i18n-tools <command> --help`를 실행하세요. 아래 그룹 페이지에서는 컨텍스트, 주요 옵션 및 주제 가이드 링크를 제공합니다.

<a id="command-overview"></a>
## 명령어 개요

<a id="setupsetup"></a>
### [설정](setup)

| 명령 | 요약 |
|---------|---------|
| [`version`](setup#version) | CLI 버전과 빌드 타임스탬프를 출력합니다. |
| [`init`](setup#init) | 시작 구성을 작성합니다; `-t`은 스캐폴드 템플릿을 선택합니다. |

<a id="models--catalogmodels"></a>
### [모델 및 카탈로그](models)

| 명령 | 요약 |
|---------|---------|
| [`check-models`](models#check-models) | 구성된 모델 ID를 활성 제공자에 대해 검증합니다. |
| [`list-models`](models#list-models) | 활성 제공자가 제공하는 모델을 나열합니다. |
| [`bench-models`](models#bench-models) | 하나의 샘플 번역으로 구성된 모델을 벤치마크합니다. |
| [`list-languages`](models#list-languages) | 번들된 UI 언어 카탈로그를 나열합니다. |

<a id="ui-stringsui-strings"></a>
### [UI 문자열](ui-strings)

| 명령 | 요약 |
|---------|---------|
| [`extract`](ui-strings#extract) | 소스 리터럴과 HTML 마커에서 `strings.json`을 업데이트합니다. |
| [`mark-html`](ui-strings#mark-html) | HTML 파일에 `data-i18n*` 마커를 삽입합니다. |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | 구성 로케일에서 `ui-languages.json`을 작성합니다. |
| [`translate-ui`](ui-strings#translate-ui) | UI 문자열을 번역합니다 (`strings.json` → 로케일 JSON). |
| [`sync-ui`](ui-strings#sync-ui) | 추출한 다음 UI 문자열을 번역합니다. |
| [`proofread-ui`](ui-strings#proofread-ui) | 추출한 다음 소스 로케일 UI 문자열을 LLM으로 검토합니다. |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | `strings.json`을 XLIFF 2.0으로 내보냅니다. |

<a id="documentsdocuments"></a>
### [문서](documents)

| 명령 | 요약 |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | 마크다운, MDX, `.astro` 및 프레임워크 카탈로그를 번역합니다. |
| [`write-heading-ids`](documents#write-heading-ids) | ATX 제목 앞에 HTML 앵커 줄을 삽입합니다. |
| [`check-markdown`](documents#check-markdown) | 구분 기호 및 강조 문제에 대해 마크다운/MDX를 스캔합니다. |

<a id="other-contentcontent"></a>
### [기타 콘텐츠](content)

| 명령 | 요약 |
|---------|---------|
| [`translate-json`](content#translate-json) | `json[]` 구성 블록에 따라 중첩된 JSON을 번역합니다. |
| [`translate-svg`](content#translate-svg) | `config.svg`에 구성된 SVG 파일을 번역합니다. |

<a id="workflows--statusworkflows"></a>
### [워크플로 및 상태](workflows)

| 명령 | 요약 |
|---------|---------|
| [`sync`](workflows#sync) | 추출 + UI + SVG + 문서 + JSON을 하나의 파이프라인에서 실행합니다. |
| [`status`](workflows#status) | UI, 문서 및 JSON 번역 적용 범위를 출력합니다. |
| [`statistics`](workflows#statistics) | 캐시 및 `strings.json` 통계를 출력합니다. |

<a id="cache--maintenancemaintenance"></a>
### [캐시 및 유지 관리](maintenance)

| 명령어 | 요약 |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | 오래되거나 고아 또는 구성되지 않은 로케일 캐시 행을 정리하고 마크다운 이슈를 다시 채웁니다. |
| [`clean-temp`](maintenance#clean-temp) | `*.log`, `*.tmp` 및 캐시 백업을 찾아 삭제합니다. |
| [`purge-locale`](maintenance#purge-locale) | 로케일에 대한 캐시 행과 생성된 아티팩트를 제거합니다. |

<a id="toolstools"></a>
### [도구](tools)

| 명령 | 요약 |
|---------|---------|
| [`dashboard`](tools#dashboard) | 번역 대시보드 웹 UI를 실행합니다. |
| [`glossary-generate`](tools#glossary-generate) | 빈 `glossary-user.csv` 템플릿을 작성합니다. |
| [`help`](tools#help) | 하위 명령에 대한 도움말을 표시합니다. |

<a id="synopsis"></a>
## 요약

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [-P <provider>] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### 루트 및 전역 옵션

| 옵션                       | 범위         | 설명                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | 루트 프로그램  | 버전 번호와 빌드 타임스탬프를 출력합니다(`version` 하위 명령어와 동일한 정보). |
| `-h` / `--help`              | 루트 프로그램  | 루트 프로그램 또는 명령어 이름과 함께 사용 시 해당 하위 명령어에 대한 도움말을 표시합니다.      |
| `-c` / `--config <path>`     | 모든 명령어 | 구성 파일 경로(기본값: `ai-i18n-tools.config.json`).                                  |
| `-v` / `--verbose`           | 모든 명령어 | 자세한 로그 기록.                                                                          |
| `-P` / `--provider <name>`   | 모든 명령 | 이 실행의 활성 LLM 제공자이며, 구성 `provider` 키를 재정의합니다. `providers` 아래에 구성해야 합니다. |
| `-L` / `--ui-lang <code>`    | 모든 명령어 | 도구 자체 UI(CLI 도움말, 로그/요약, 대시보드)의 언어; 최우선 소스. [도구 UI 언어](/ko/guide/tool-ui-language)를 참조하십시오. |
| `-w` / `--write-logs [path]` | 선택한 명령 | 콘솔 출력을 `.log` 파일로 보냅니다(기본 경로: 루트 `cacheDir` 아래). `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync-ui`, `sync` 및 `cleanup`에만 연결됩니다. |

<a id="per-command-help"></a>
### 명령별 도움말

| 사용법                            | 설명                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | 해당 명령어의 모든 옵션.      |
| `ai-i18n-tools help <command>`   | `<command> --help`과 동일한 출력. |

<a id="target-locales--l----locale"></a>
### 대상 로캘(`-l` / `--locale`)

| 명령 | 동작 |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`, `translate-json`, `translate-svg`, `translate-ui`, `sync`, `sync-ui`, `export-ui-xliff` | `-l` / `--locale <codes>` — 쉼표로 구분된 대상 BCP-47 코드(예: `de,fr,pt-BR`). 생략하면 구성에서 기본값이 가져옵니다(`json[]` 블록은 블록당 `targetLocales`을 설정할 수도 있습니다. UI 단계는 `targetLocales`에서 `sourceLocale`을 뺀 값을 사용합니다). |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — 검토할 단일 소스 로캘 (기본값: 구성 `sourceLocale`).                                                            |
