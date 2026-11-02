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

`-P` / `--provider`은(는) 필수입니다. 이 값은 스캐폴드할 **내장 프리셋**을 선택합니다. 다음 중 하나여야 합니다: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apikeyfan`, `cheaperinference`, `ollama`.

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
| `ui-dotnet` | .NET UI 문자열, 소스 언어 문자열을 키로 사용하는 플랫 JSON, 및 `I18n.cs` |
| `ui-dotnet-resx` | .NET UI 문자열을 `.resx` 위성(`flatOutput: false`)으로, 및 `I18nResx.cs` |

`--with-readme`은(는) `README.md` 문서 블록(`outputDir` `translated-docs`, `docsOutput.style` `"flat"`, `languageListBlock`)을 추가하고 `features.translateDocs`을(를) true로 설정합니다. 문서 블록에 이미 `README.md`이(가) 나열된 경우에는 아무 작업도 수행하지 않으며, 이는 `ui-markdown` 및 `docs-markdown`의 경우에 해당합니다. 구성만 작성합니다. `README.md`에 붙여넣을 마커 라인을 출력하고 해당 파일이 누락되면 경고합니다. 가이드: [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme).

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore`은(는) 시작 `.translate-ignore`을(를) 생성합니다(Python 가상 환경 및 캐시 디렉터리 포함).

`ui-python`, `ui-python-gettext`, 및 `ui-python-flask`는 해당 파일이 없는 경우 `i18n.py`도 작성합니다. Django 프로젝트는 Django 자체의 gettext 런타임을 유지하므로 `ui-python-django`는 `i18n.py`를 작성하지 않습니다. `ui-dotnet`는 해당 파일이 없는 경우 `I18n.cs`을(를) 작성하고 `.csproj`에 추가할 `EmbeddedResource` 항목을 출력합니다. `ui-dotnet-resx`는 대신 `I18nResx.cs`을(를) 작성하고 `ui.resx`가 `Resources/SharedResource.<culture>.resx`을(를) 가리키도록 합니다. `--namespace`는 C# 네임스페이스를 재정의합니다. 가이드: [.NET 애플리케이션](/ko/guide/ui-strings/dotnet) 및 [.NET ResourceManager 앱에 i18n 추가](/ko/guide/add-i18n-to-dotnet-resourcemanager).

`migrate-python-i18n`는 안전하지 않은 사전 평가된 호출(``_(f"...")``, ``_("..." % expr)``, ``_("...".format(...))``)을 조회 후 형식 지정 호출로 재작성합니다. 기본값은 시뮬레이션 실행입니다. 파일을 편집하려면 ``--write``를 전달하고, 검토 노트를 보려면 ``migrate-python-i18n-report.md``를 읽으십시오. 복잡한 표현식은 안정적일 때 해당 표현식에서 이름을 따옵니다(``start.isoformat()``은 ``{start}``이 되고, ``len(rows)``은 ``{rows_count}``이 됩니다). 남은 ``{value_1}``은 이름을 바꿀 수 있도록 보고됩니다. 생성된 ``i18n.py`` 파일은 건너뜁니다. 깨끗한 보고서가 래핑되지 않은 f-문자열이 처리되었음을 의미하지는 않습니다.

``migrate-dotnet-i18n``는 ``T()`` 내에서 ``T($"...")``, 연결, ``string.Format``에 대해서도 동일하게 적용됩니다. ``--wrap``는 또한 표시되지 않은 XAML 레이블과 신뢰도 높은 C# 싱크를 표시합니다. ``--write``가 없으면 이는 감사가 됩니다. 보고서는 ``migrate-dotnet-i18n-report.md``입니다. 생성된 ``I18n.cs`` 및 ``I18nResx.cs``은 건너뜁니다. 가이드: [.NET 애플리케이션](/ko/guide/ui-strings/dotnet#rewrite-unsafe-calls).

---

<a id="doctor"></a>
### `doctor`

**개요:** `ai-i18n-tools doctor [--local] [--strict] [--json]`

프로젝트가 번역할 준비가 되었는지 확인하십시오. 보고서는 구성 구문 및 스키마, 비즈니스 규칙, 설치된 버전, 소스 및 출력 경로, UI 카탈로그 파일, 해당 카탈로그의 플레이스홀더 불일치, 캐시 통계, 구성된 공급자, 설정된 지원 환경 변수, 그리고 모델 ID를 다룹니다. 이름이 변경되거나, 삭제되거나, 재작성된 플레이스홀더가 있는 카탈로그는 경고이며 한 가지 예를 명시합니다.

기본적으로 `doctor`은(는) 활성 공급자의 카탈로그와 구성된 모델 ID를 확인하고 설치된 버전을 최신 GitHub 릴리스와 비교합니다. `--local`은(는) 두 네트워크 호출을 모두 건너뜁니다. 최신 릴리스 또는 실패한 GitHub 요청은 경고입니다. 누락되거나 만료된 모델 ID는 명령을 실패하게 합니다. 어떤 확인에서라도 경고가 발생하면 `--strict`은(는) 오류와 함께 종료됩니다.

API 키 값은 절대 출력되지 않습니다. 설정된 변수는 `Configured variables: NAME, ...`와 같이 알파벳 순서로 나열됩니다. API 키가 아닌 변수는 해당 값을 포함합니다.

누락된 입력 경로는 실패합니다. 누락된 출력 디렉터리는 첫 번째 번역 실행 시 생성되기 때문에 참고 사항입니다. `doctor`은(는) 구성을 다시 작성하거나, 디렉터리를 생성하거나, 소스 텍스트를 모델로 보내지 않습니다.

**주요 옵션:** `--local`, `--strict`, `--json`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
```

---

<a id="help"></a>
### `help`

**개요:** `ai-i18n-tools help [command]`

하위 명령어의 도움말을 표시합니다(`ai-i18n-tools <command> --help`와 동일한 출력).
