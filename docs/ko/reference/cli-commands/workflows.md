<a id="cli--workflows--status"></a>
# CLI — 워크플로 및 상태

<a id="sync"></a>
### `sync`

**개요:** `ai-i18n-tools sync [options]`

추출(활성화된 경우), UI 번역, `features.translateSVG` 및 `config.svg`가 설정된 경우 `translate-svg`, 문서 번역, `features.translateJson` 및 `json[]`가 설정된 경우 `translate-json` 순으로 실행됩니다 — 단, `--no-ui`, `--no-svg`, `--no-docs` 또는 `--no-json`로 건너뛴 경우는 예외입니다.

**주요 옵션:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force`은(는) UI 및 SVG 단계뿐만 아니라 docs/JSON으로도 전달됩니다. `--force-update`은(는) docs, JSON 및 SVG(UI 제외)에 적용됩니다. Docs 단계에서는 `--emphasis-placeholders`(`translate-docs`과(와) 동일한 의미)도 전달합니다. 전역 `--debug-failed`은(는) 체인의 모든 모델이 실패할 때뿐만 아니라, 각 폐기된 모델 시도(SVG/docs 스크립트 폴백 포함)에 대해 `cacheDir` 아래에 `FAILED-TRANSLATION` 로그를 작성합니다. `--prompt-format`은(는) `sync` 플래그가 아니며, docs 및 JSON 단계에서는 기본 제공 기본값(`json-array`)을 사용합니다.

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
