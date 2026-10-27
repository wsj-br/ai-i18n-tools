<a id="cli--getting-started"></a>
# CLI — 시작하기

<a id="version"></a>
### `version`

**개요:** `ai-i18n-tools version`

CLI 버전과 빌드 타임스탬프를 출력합니다(루트 프로그램의 `-V` / `--version`와 동일한 정보).

---

<a id="init"></a>
### `init`

**개요:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

시작 구성 파일을 작성합니다 (`provider` / `providers`, `concurrency`, `uiBatchConcurrency`, `batchConcurrency`, `batchSize`, `maxBatchChars`, `docs[].addFrontmatter` 포함). LLM을 호출하는 번역 명령어는 환경 또는 `.env`에 활성 공급자의 API 키가 필요합니다(Ollama 제외) — [공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요.

**주요 옵션:** `-P` / `--provider` (필수), `-t` / `--template`, `-o` / `--output`, `--with-readme`, `--with-translate-ignore`

`-P` / `--provider`은(는) 필수입니다. 이는 스캐폴드할 **내장 프리셋**을(를) 선택합니다. 다음 중 하나여야 합니다: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `cheaperinference`, `ollama`.

**템플릿(`-t`):**

| 값 | 스캐폴드 |
|-------|-----------|
| `ui-markdown` | UI 문자열 및 README(플랫 출력, 언어 목록) |
| `ui-docusaurus` | Docusaurus UI + 문서 |
| `ui-starlight` | Starlight 문서 |
| `ui-vitepress` | VitePress 문서(`docsOutput.style: "vitepress"`) 및 테마 문자열을 위한 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra 문서(`docsOutput.style: "nextra"`) 및 테마 사전을 위한 `nextraDictionaryPath` (사이드바 `_meta.ts`는 자동으로 수집됨) |
| `ui-fumadocs` | Fumadocs 문서(`docsOutput.style: "fumadocs"`) 및 UI 오버라이드를 위한 `fumadocsUiCatalog` (사이드바 `meta.json`는 자동으로 수집됨) |
| `ui-astro-website` | Astro 웹사이트 UI 문자열 |
| `ui-plain-html` | 일반 HTML 카탈로그(`data-i18n*` 마커, 플랫 로케일 JSON) |
| `docs-plain-html` | 일반 HTML 문서(로케일당 파일 1개, 언어 목록, hreflang) |
| `docs-markdown` | 마크다운 문서: README 및 `.md` 파일, 플랫 출력, 언어 목록 |
| `ui-json-bundles` | JSON (`json[]`만 해당) |
| `ui-python` | Python UI 문자열, 소스 언어 문자열을 키로 사용하는 플랫 JSON 및 `i18n.py` |
| `ui-python-gettext` | 플랫 JSON 및 GNU `.po` / `.mo`을(를) 포함한 Python UI 문자열, 추가로 `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` 카탈로그(`flatOutput: false`, 도메인 `django`, `i18n.py` 없음) |
| `ui-python-flask` | `translations/` 하위의 Flask / Jinja 카탈로그(`flatOutput: false`) 및 `i18n.py` |

`--with-readme`은(는) `README.md` 문서 블록(`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, `languageListBlock`)을 추가하고 `features.translateDocs`을(를) true로 설정합니다. 문서 블록에 이미 `README.md`이(가) 나열된 경우에는 아무 작업도 수행하지 않으며, 이는 `ui-markdown` 및 `docs-markdown`의 경우에 해당합니다. 구성만 작성합니다. `README.md`에 붙여넣을 마커 라인을 출력하고 해당 파일이 누락되면 경고합니다. 가이드: [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore`은(는) 시작 `.translate-ignore`을(를) 생성합니다(Python 가상 환경 및 캐시 디렉터리 포함).

`ui-python`, `ui-python-gettext` 및 `ui-python-flask`은(는) 해당 파일이 누락된 경우 `i18n.py`도 작성합니다. Django 프로젝트는 Django 자체의 gettext 런타임을 유지하므로 `ui-python-django`은(는) `i18n.py`을(를) 작성하지 않습니다.

`migrate-python-i18n`은(는) 안전하지 않은 사전 평가 호출(`_(f"...")`, `_("..." % expr)`, `_("...".format(...))`)을(를) 형식 지정 전 조회 호출로 다시 작성합니다. 기본값은 드라이 런입니다. 파일을 편집하려면 `--write`을(를) 전달하고, 검토 메모를 보려면 `migrate-python-i18n-report.md`을(를) 읽으십시오. 생성된 `i18n.py` 파일은 건너뜁니다.

---

<a id="help"></a>
### `help`

**개요:** `ai-i18n-tools help [command]`

하위 명령어의 도움말을 표시합니다(`ai-i18n-tools <command> --help`와 동일한 출력).
