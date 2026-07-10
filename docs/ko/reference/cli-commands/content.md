<a id="cli--other-content"></a>
# CLI — 기타 콘텐츠

<a id="translate-json"></a>
### `translate-json`

**개요:** `ai-i18n-tools translate-json [options]`

`json[]`에 따라 중첩된 JSON을 번역합니다(`features.translateJson` 필요). 공유 SQLite 캐시.

**주요 옵션:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**참고 항목:** [JSON](/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**개요:** `ai-i18n-tools translate-svg [options]`

`config.svg`에 구성된 SVG 파일을 번역합니다(문서와 별개). `features.translateSVG`이 필요합니다. 문서와 동일한 캐시 방식을 사용하며, 해당 실행 시 SQLite 읽기/쓰기를 건너뛰도록 `--no-cache`를 지원합니다.

**주요 옵션:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**참고 항목:** [SVG 번역](/guide/svg-translation/)
