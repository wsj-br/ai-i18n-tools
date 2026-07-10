<a id="cli--tools"></a>
# CLI — 도구

<a id="dashboard"></a>
### `dashboard`

**개요:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

번역 대시보드(캐시 세그먼트, `strings.json`, 용어집, 실패 및 통계를 위한 로컬 웹 UI)를 실행합니다. 기본 포트는 **8675**입니다(사용할 수 없는 경우 다음 포트로 재시도). `--no-open`를 사용하면 기본 브라우저가 자동으로 열리지 않습니다. 더 이상 사용되지 않는 별칭 `editor`는 여전히 작동하지만 경고를 출력합니다.

**주요 옵션:** `-p` / `--port`, `--no-open`

**참고:** [번역 대시보드](/ko/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**개요:** `ai-i18n-tools glossary-generate [-o <path>]`

빈 `glossary-user.csv` 템플릿을 작성합니다. 기존 파일은 덮어쓰지 않습니다(종료 코드 **1**).

**주요 옵션:** `-o` / `--output`

`-o`: 출력 경로를 재정의합니다(기본값: 설정의 `glossary.userGlossary`, 또는 `glossary-user.csv`).

**참고:** [대시보드 용어집](/ko/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**개요:** `ai-i18n-tools help [command]`

하위 명령어의 도움말을 표시합니다(`ai-i18n-tools <command> --help`와 동일한 출력).
