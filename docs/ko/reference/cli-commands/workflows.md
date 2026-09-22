<a id="cli--workflows--reporting"></a>
# CLI — 워크플로 및 보고

<a id="sync"></a>
### `sync`

**개요:** `ai-i18n-tools sync [options]`

추출(활성화된 경우), UI 번역, `features.translateSVG` 및 `config.svg`가 설정된 경우 `translate-svg`, 문서 번역, `features.translateJson` 및 `json[]`가 설정된 경우 `translate-json` 순으로 실행됩니다 — 단, `--no-ui`, `--no-svg`, `--no-docs` 또는 `--no-json`로 건너뛴 경우는 예외입니다.

**주요 옵션:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force`은(는) UI 및 SVG 단계뿐 아니라 docs/JSON에도 전달됩니다. `--force-update`은(는) docs, JSON, SVG에 적용됩니다(UI는 제외). `--check-cache`은(는) docs, JSON, SVG에 전달됩니다: 파일 추적이 건너뛰더라도 네이티브 스크립트가 강제되는 로케일에 대해 캐시된 세그먼트를 재검증합니다. docs 단계는 `--emphasis-placeholders`도 전달합니다(`translate-docs`와 동일한 의미). 전역 `--debug-failed`은(는) 체인의 모든 모델이 실패할 때뿐만 아니라, 각 폐기된 모델 시도(SVG/docs 스크립트 폴백 포함)에 대해 `cacheDir` 아래에 `FAILED-TRANSLATION` 로그를 작성합니다. `--prompt-format`은(는) `sync` 플래그가 아닙니다. docs 및 JSON 단계는 기본 제공 기본값(`json-array`)을 사용합니다.

---

<a id="status"></a>
### `status`

**개요:** `ai-i18n-tools status [--max-columns <n>]`

`features.translateUIStrings`가 켜져 있으면 로케일별 UI 커버리지(`Translated` / `Missing` / `Total`)를 출력합니다. 그런 다음 파일 × 로케일별 마크다운 번역 상태를 출력합니다(`--locale` 필터 없음, 로케일은 설정에서 가져옴). `features.translateJson`가 켜져 있고 `json[]`가 구성된 경우 블록별 JSON 번들 상태도 출력합니다. 로케일 목록이 큰 경우 터미널에서 줄이 좁게 유지되도록 최대 `n`개의 로케일 열로 반복되는 테이블로 분할됩니다(기본값 **9**).

**주요 옵션:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**개요:** `ai-i18n-tools statistics [--max-columns <n>]`

문서 캐시 및 `strings.json` 통계를 출력합니다(번역 대시보드 → 통계와 동일한 집계). `--max-columns`: 모델 × 로케일 테이블당 최대 로케일 열 수(기본값 **6**).

**주요 옵션:** `--max-columns`

**참고:** [대시보드 통계](/ko/guide/translation-dashboard/statistics)

---

<a id="usage"></a>
### `usage`

**개요:** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

기록된 모델 API 호출 통계(호출 수, 토큰 수, 단일 USD 비용)를 인쇄합니다. 비용은 제공자의 `usage.cost`가 있는 경우 해당 값을 사용하고, 그렇지 않으면 `providers.<name>.modelPricing`의 금액 또는 제공자 전체의 `providers.<name>.pricing` 기본값을 사용합니다(새 호출에 저장됨; 저장된 비용이 없는 이전 행의 경우 보고서 작성 시 적용됨). 번역 대시보드 → 사용량 및 비용과 동일한 집계입니다. 7 UTC 달력일보다 오래된 세부 행은 월간 `api_totals`로 통합됩니다; 보고서는 두 테이블을 모두 결합합니다. `--since`는 `YYYY-MM-DD`, 기간(`30m`, `1h`, `6h`, `12h`, `24h`, `7d`, `30d`) 또는 달력 월 창(`1mo`, `2mo`, `3mo`)을 허용합니다. `--clear`은 세부 행과 월간 합계를 삭제합니다(`--older-than`은 `1mo`, `2mo`, `3mo`, `6mo`, `1y` 또는 `all`입니다; `--dry-run`는 삭제하지 않고 개수를 보고합니다).

**주요 옵션:** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**참고:** [대시보드 사용량 및 비용](/ko/guide/translation-dashboard/usage)
