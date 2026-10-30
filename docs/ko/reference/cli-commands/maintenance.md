<a id="cli--cache-maintenance"></a>
# CLI — 캐시 유지 관리

<a id="cleanup"></a>
### `cleanup`

**개요:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

전체 `markdown_source_issues` 테이블을 지운 다음, 현재 구성된 문서에 대한 마크다운 문제가 다시 채워지도록 `sync --force-update`(추출, UI, SVG, 문서 및 `translate-json`가 활성화된 경우)을(를) 실행합니다. 그런 다음 다음을 수행합니다.

- 오래된 세그먼트 행(null `last_hit_at` / 빈 파일 경로)을 제거합니다.
- 디스크에 확인된 소스 경로가 없는 `file_tracking` 행을 삭제합니다.
- `filepath` 메타데이터가 없는 파일을 가리키는 번역 행을 제거합니다.
- 고아 `translation_failures` 행을 정리합니다.
- 구성에 없는 로케일에 대한 캐시 행(`sourceLocale`, 루트 `targetLocales` 및 블록별 `docs[]` / `json[]` `targetLocales`)을 삭제합니다.

사용 중단된 로케일에 대해서는 캐시만 해당됩니다. 생성된 문서, 플랫 UI 파일 및 `strings.json` 항목은 그대로 둡니다(해당 항목을 제거하려면 [`purge-locale`](#purge-locale)을(를) 사용하십시오). 동기화 후 정리 개수(오래된 세그먼트, 고아 `file_tracking`, 고아 번역, 고아 실패, 구성되지 않은 로케일)와 선행 마크다운 문제 지우기 개수를 기록합니다.

**주요 옵션:** `--dry-run`, `--backup`

`--backup <path>`는 수정 전에 해당 경로에 SQLite 백업을 작성합니다(이 플래그를 설정하지 않으면 백업하지 않음).

---

<a id="clean-temp"></a>
### `clean-temp`

**개요:** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

구성이 없습니다. 디렉터리 트리(기본값: cwd)를 순회하며 `*.log`, `*.tmp`, `cache.db.backup*.sqlite`를 찾고 `find -print`와 같은 `./…` 경로를 출력합니다. 일치 항목이 있으면: `-f` / `--force`(확인 없이 삭제)가 없는 경우 `Delete these files? (y/n)` 확인을 요청합니다. 일치 항목이 없으면: 확인 없이 종료합니다. `--dry-run`: 목록만 표시하며 확인 요청이나 삭제를 수행하지 않습니다(`--force`보다 우선).

**주요 옵션:** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**개요:** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

`translations`, `file_tracking` 및 `translation_failures`에서 지정된 로케일에 대한 모든 캐시된 행과 해당 로케일에 대해 생성된 아티팩트(번역된 문서(`docs[]`에서 확인된 `.md` / `.mdx` / `.astro` 출력, 소스가 제거된 고아 출력 포함 — 사용자 지정 `pathTemplate`이(가) 구성된 경우를 제외하고 각 블록의 출력 트리를 스캔하여 찾음), 로케일별 플랫 UI 파일(`<flatOutputDir>/<locale>.json`) 및 `strings.json`에 있는 로케일의 항목)를 삭제합니다.

로케일은 반복 가능한 `-l` / `--locale`을(를) 통해 전달됩니다(BCP-47로 정규화됨). 로케일별 개수(캐시 행, 문서, `strings.json` 항목, 플랫 파일)를 출력합니다. 제거할 항목이 없는 로케일에 대해서는 경고합니다(오류는 아님). `-y` / `--yes` / `-f` / `--force`이(가) 아닌 경우 확인을 요청합니다. `--dry-run`: 개수와 제거될 파일을 보고하고 아무것도 삭제하지 않습니다. `--keep-files`: SQLite 캐시만 제거하고 생성된 파일과 `strings.json`는 그대로 둡니다. `--backup <path>`이(가) 전달되지 않으면 SQLite 백업이 생성되지 않으며, 이 경우 삭제 전에 해당 경로에 백업을 작성합니다.

**주요 옵션:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
