<a id="cli--ui-strings"></a>
# CLI — UI 문자열

<a id="extract"></a>
### `extract`

**개요:** `ai-i18n-tools extract`

`strings.json`를 `t("…")` / `i18n.t("…")` 리터럴, 선택적 `package.json` 설명, 그리고 `includeUiLanguageEnglishNames`가 활성화된 경우 선택적 번들 마스터 `englishName` 항목에서 업데이트합니다(`ui.uiExtractor` 참조; `languagesManifestPath`는 읽지 않음). 또한 `languagesManifestPath`에서 `ui-languages.json`을(를) 재생성합니다. `.html` / `.htm`이(가) `ui.uiExtractor.extensions`에 나열된 경우, HTML에서 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 마커 문자열도 캡처합니다. 비어 있지 않은 `ui.sourceRoots`이(가) 필요합니다. LLM을 호출하지 않습니다.

**참고 항목:** [UI 문자열 개요](/guide/ui-strings/), [순수 HTML 앱](/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**개요:** `ai-i18n-tools mark-html [paths...] [--write]`

소스 텍스트가 한 번만 작성되도록(요소 자체에) HTML에 단순 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 마커를 삽입합니다. 지정된 파일/디렉터리/글로브를 스캔합니다(기본값: `ui.sourceRoots` 아래의 `.html` / `.htm`). 기본적으로 드라이 런(파일별 추가 개수 및 수동 `<span data-i18n>`이(가) 필요한 혼합 콘텐츠 요소를 보고); `--write`이(가) 변경 사항을 적용합니다. 멱등성을 유지하며, `data-i18n-ignore`을(를) 존중하고(해당 요소와 하위 트리를 건너뜀), 코드 유사 요소(`code`, `pre`, `kbd`, `samp`, `var`)나 빈/숫자 전용 텍스트는 처리하지 않으며, 값이 있는 마커는 생성하지 않습니다. LLM을 호출하지 않습니다.

**주요 옵션:** `--write`

**참고 항목:** [번역을 위한 HTML 마킹](/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**개요:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

`sourceLocale` + `targetLocales` 및 번들된 `data/ui-languages-complete.json`(또는 `--master`)를 사용하여 `ui-languages.json`을(를) `languagesManifestPath`(기본값: `{ui.flatOutputDir}/ui-languages.json`)에 씁니다. 마스터 파일에 없는 로케일에 대해 경고를 표시하고 `TODO` 자리 표시자를 생성합니다. 사용자 지정된 `label` 또는 `englishName` 값이 있는 기존 매니페스트가 있는 경우, 마스터 카탈로그 기본값으로 대체됩니다 — 생성된 파일을 이후에 검토하고 조정하십시오.

**주요 옵션:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**개요:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

UI 문자열만 번역합니다(`strings.json` → 로케일 JSON). `features.translateUIStrings`이(가) 필요합니다.

**주요 옵션:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: 쉼표로 구분된 대상 로케일(기본값: 설정의 `targetLocales`에서 `sourceLocale` 제외). `--force`: 로케일별 모든 항목을 다시 번역(기존 번역 무시). `--dry-run`: 쓰기 없음, API 호출 없음.

---

<a id="sync-ui"></a>
### `sync-ui`

**개요:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

UI 문자열을 추출한 다음 번역합니다(`features.translateUIStrings` 필요). UI 전용 — 문서, SVG 또는 `json[]`은(는) 제외됩니다. `translate-ui`과(와) 동일한 `-l`, `--force`, `--dry-run`, `-j` 옵션을 사용합니다.

---

<a id="proofread-ui"></a>
### `proofread-ui`

**개요:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

`strings.json`이(가) 소스와 일치하도록 먼저 `extract`을(를) 실행하고(`features.translateUIStrings` 필요), 그 다음 소스 로케일 UI 문자열(맞춤법, 문법)에 대한 LLM 검토를 수행합니다. 용어 힌트는 `glossary.userGlossary` CSV에서만 가져옵니다(`translate-ui`와 동일한 범위 — `strings.json` / `uiGlossary`이(가) 아니므로 잘못된 사본이 용어집으로 강화되지 않음). 활성 LLM 제공자(해당 API 키 환경 변수)를 사용합니다.

실패 시(기능 플래그 누락, 추출 실패, 카탈로그 누락/유효하지 않음, API 키 누락 또는 모든 배치 실패) **1**로 종료됩니다. 실행이 성공적으로 완료되면(결과는 권고 사항임) **0**으로 종료됩니다. `cacheDir` 아래에 `proofread-ui-results_<timestamp>.log`을(를) 사람이 읽을 수 있는 보고서(요약, 문제 및 문자열별 OK 행)로 작성합니다. 터미널에는 요약 개수와 문제만 인쇄됩니다(문자열당 `[ok]` 행 없음). 마지막 행에 로그 파일 이름을 인쇄합니다. `--json`을(를) 사용하면 사람 친화적 출력이 stderr로 전달됩니다. 링크는 대시보드 UI 문자열 링크 버튼처럼 `path:line`을(를) 사용합니다.

**주요 옵션:** `-l` / `--locale`, `--chunk` (기본값 **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**개요:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

`strings.json`을(를) XLIFF 2.0으로 내보냅니다(대상 로케일당 하나의 `.xliff`). 읽기 전용이며 API는 없습니다.

**주요 옵션:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: 출력 디렉터리(기본값: 카탈로그와 동일한 폴더). `--untranslated-only`: 해당 로케일에 대한 번역이 누락된 단위만 해당합니다.
