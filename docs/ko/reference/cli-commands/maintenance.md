<a id="cli--cache--maintenance"></a>
# CLI — 캐시 및 유지 관리

<a id="cleanup"></a>
### `cleanup`

**개요:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

`markdown_source_issues` 테이블 전체를 지운 다음, `sync --force-update`(추출, UI, SVG, 문서 및 활성화된 경우 `translate-json`)를 실행하여 현재 구성된 문서에 대해 마크다운 이슈를 다시 채웁니다. 그런 다음 오래된 세그먼트 행(null `last_hit_at` / 빈 파일 경로)을 제거하고, 디스크에서 확인된 소스 경로가 없는 `file_tracking` 행을 삭제하며, `filepath` 메타데이터가 없는 파일을 가리키는 번역 행을 제거하고, 고립된 `translation_failures` 행을 정리합니다. 동기화 후 네 가지 정리 개수(오래된 세그먼트, 고립된 `file_tracking`, 고립된 번역, 고립된 실패)와 사전 마크다운 이슈 삭제 개수를 로그에 기록합니다.

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

지정된 로케일에 대해 `translations`, `file_tracking`, `translation_failures`의 모든 캐시 행과 해당 로케일의 생성된 산출물을 삭제합니다: 번역된 문서(`docs[]`에서 확인된 `.md` / `.mdx` / `.astro` 출력, 소스가 제거된 고립된 출력 포함 — 사용자 지정 `pathTemplate`이 구성된 경우를 제외하고 각 블록의 출력 트리를 스윕하여 찾음), 로케일별 플랫 UI 파일(`<flatOutputDir>/<locale>.json`), 해당 로케일의 `strings.json` 항목.

로케일은 반복 가능한 `-l` / `--locale`을 통해 전달됩니다(BCP-47로 정규화됨). 로케일별 개수(캐시 행, 문서, `strings.json` 항목, 플랫 파일)를 출력하며, 제거할 항목이 없는 로케일에 대해서는 경고(오류 아님)를 표시합니다. `-y` / `--yes` / `-f` / `--force`이 없는 경우 확인을 요청합니다. `--dry-run`: 개수와 제거될 파일을 보고하고 아무것도 삭제하지 않습니다. `--keep-files`: SQLite 캐시만 제거하며 생성된 파일과 `strings.json`는 그대로 유지합니다. `--backup <path>`이 전달되지 않는 한 SQLite 백업을 수행하지 않으며, 전달된 경우 삭제 전에 해당 경로에 백업을 작성합니다.

**주요 옵션:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
