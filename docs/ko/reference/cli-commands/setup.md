<a id="cli--getting-started"></a>
# CLI — 시작하기

<a id="version"></a>
### `version`

**개요:** `ai-i18n-tools version`

CLI 버전과 빌드 타임스탬프를 출력합니다(루트 프로그램의 `-V` / `--version`와 동일한 정보).

---

<a id="upgrade"></a>
### `upgrade`

**개요:** `ai-i18n-tools upgrade [--yes]`

실행 중인 설치를 최신 게시 버전으로 업그레이드합니다. 이 명령은 설치된 버전과 새 버전을 출력한 다음 `y`를 기다립니다. `--yes`는 표준 입력이 터미널이 아닌 경우에도 프롬프트에 응답합니다. 다른 응답은 설치를 변경하지 않습니다. `--yes`가 없는 비대화형 표준 입력은 오류와 함께 종료되며 아무것도 변경하지 않습니다. 설치가 이미 최신이거나 게시된 버전보다 새로운 경우, 이 명령은 해당 내용을 출력하고 프롬프트를 표시하지 않습니다.

Node.js 설치는 npm 레지스트리에서 `latest` dist-tag를 읽습니다. 프로젝트 종속성은 `package.json`에서 업데이트되고 (기존 `^`, `~` 또는 정확한 연산자는 유지됨) `packageManager` 필드 또는 잠금 파일에서 선택된 npm, pnpm, yarn 또는 bun으로 설치됩니다. 전역 Node.js 설치는 해당 패키지 관리자의 전역 설치를 실행하며 현재 디렉터리의 `package.json`를 편집하지 않습니다. `workspace:`, `file:`, `link:` 및 git 지정자는 변경되지 않고 명령이 중지됩니다. 이 저장소의 소스 체크아웃은 거부됩니다.

독립 실행형 실행 파일은 최신 GitHub 릴리스를 읽고, 현재 운영 체제 및 아키텍처에 맞는 gzip 아카이브를 다운로드하고, `SHA256SUMS.txt`를 확인한 다음, 실행 중인 파일을 교체합니다. 게시된 아카이브는 Linux x64, Linux arm64, macOS arm64, macOS x64 및 Windows x64입니다.

```bash
ai-i18n-tools upgrade
ai-i18n-tools upgrade --yes
```

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

`init`는 작업 디렉터리에 `.gitignore`을 생성하거나 여기에 추가합니다. 추가되는 줄은 `.translation-cache/*`, `!.translation-cache/cache.db`, `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, `*.backup.*`이며, 각 줄은 짧은 주석 아래에 있습니다. 이미 존재하는 줄은 그대로 유지되며, 두 번째 실행 시 중복되지 않습니다.

`ui-python`, `ui-python-gettext`, 및 `ui-python-flask`는 해당 파일이 없는 경우 `i18n.py`도 작성합니다. Django 프로젝트는 Django 자체의 gettext 런타임을 유지하므로 `ui-python-django`는 `i18n.py`를 작성하지 않습니다. `ui-dotnet`는 해당 파일이 없는 경우 `I18n.cs`을(를) 작성하고 `.csproj`에 추가할 `EmbeddedResource` 항목을 출력합니다. `ui-dotnet-resx`는 대신 `I18nResx.cs`을(를) 작성하고 `ui.resx`가 `Resources/SharedResource.<culture>.resx`을(를) 가리키도록 합니다. `--namespace`는 C# 네임스페이스를 재정의합니다. 가이드: [.NET 애플리케이션](/ko/guide/ui-strings/dotnet) 및 [.NET ResourceManager 앱에 i18n 추가](/ko/guide/add-i18n-to-dotnet-resourcemanager).

`migrate-python-i18n`는 안전하지 않은 사전 평가된 호출(``_(f"...")``, ``_("..." % expr)``, ``_("...".format(...))``)을 조회 후 형식 지정 호출로 재작성합니다. 기본값은 시뮬레이션 실행입니다. 파일을 편집하려면 ``--write``를 전달하고, 검토 노트를 보려면 ``migrate-python-i18n-report.md``를 읽으십시오. 복잡한 표현식은 안정적일 때 해당 표현식에서 이름을 따옵니다(``start.isoformat()``은 ``{start}``이 되고, ``len(rows)``은 ``{rows_count}``이 됩니다). 남은 ``{value_1}``은 이름을 바꿀 수 있도록 보고됩니다. 생성된 ``i18n.py`` 파일은 건너뜁니다. 깨끗한 보고서가 래핑되지 않은 f-문자열이 처리되었음을 의미하지는 않습니다.

``migrate-dotnet-i18n``는 ``T()`` 내에서 ``T($"...")``, 연결, ``string.Format``에 대해서도 동일하게 적용됩니다. ``--wrap``는 또한 표시되지 않은 XAML 레이블과 신뢰도 높은 C# 싱크를 표시합니다. ``--write``가 없으면 이는 감사가 됩니다. 보고서는 ``migrate-dotnet-i18n-report.md``입니다. 생성된 ``I18n.cs`` 및 ``I18nResx.cs``은 건너뜁니다. 가이드: [.NET 애플리케이션](/ko/guide/ui-strings/dotnet#rewrite-unsafe-calls).

---

<a id="doctor"></a>
### `doctor`

**개요:** `ai-i18n-tools doctor [--local] [--strict] [--json] [--fix-gitignore]`

프로젝트가 번역할 준비가 되었는지 확인하십시오. 보고서는 구성 구문 및 스키마, 비즈니스 규칙, 설치된 버전, 소스 및 출력 경로, UI 카탈로그 파일, 해당 카탈로그의 플레이스홀더 불일치, 캐시 통계, 구성된 공급자, 설정된 지원 환경 변수, 그리고 모델 ID를 다룹니다. 이름이 변경되거나, 삭제되거나, 재작성된 플레이스홀더가 있는 카탈로그는 경고이며 한 가지 예를 명시합니다.

기본적으로 `doctor`은(는) 활성 공급자의 카탈로그와 구성된 모델 ID를 확인하고 설치된 버전을 최신 GitHub 릴리스와 비교합니다. `--local`은(는) 두 네트워크 호출을 모두 건너뜁니다. 최신 릴리스 또는 실패한 GitHub 요청은 경고입니다. 누락되거나 만료된 모델 ID는 명령을 실패하게 합니다. 어떤 확인에서라도 경고가 발생하면 `--strict`은(는) 오류와 함께 종료됩니다.

API 키 값은 절대 출력되지 않습니다. 설정된 변수는 `Configured variables: NAME, ...`와 같이 알파벳 순서로 나열됩니다. API 키가 아닌 변수는 해당 값을 포함합니다.

누락된 입력 경로는 실패합니다. 누락된 출력 디렉터리는 첫 번째 번역 실행 시 생성되므로 참고 사항입니다. `doctor`은(는) 구성을 다시 작성하거나, 디렉터리를 생성하거나, 소스 텍스트를 모델로 보내지 않습니다. `--fix-gitignore`은(는) 누락된 `.gitignore` 줄을 추가하고 다른 모든 파일은 그대로 둡니다.

`doctor`은(는) 구성 옆의 `.gitignore`에 필수 패턴이 누락된 경우 경고합니다. 경고는 `ai-i18n-tools doctor --fix-gitignore`을(를) 실행하도록 안내합니다. `.gitignore`이(가) 이미 존재하는 경우, 빈 줄, 주석 `# ai-i18n-tools doctor fix`, 그리고 누락된 줄만 추가합니다. 이미 존재하는 줄은 중복되지 않습니다. 누락된 파일은 `init`이(가) 작성하는 것과 동일한 블록으로 생성됩니다. 두 캐시 패턴은 구성된 `cacheDir`을(를) 따르므로, `.i18n-cache`은(는) 기본 `.translation-cache` 줄 대신 `.i18n-cache/*` 및 `!.i18n-cache/cache.db`이(가) 필요합니다. 다른 패턴은 `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, 및 `*.backup.*`입니다. `.i18n-cache/`과(와) 같이 캐시 디렉터리 자체를 무시하는 줄도 경고입니다. Git은 무시된 디렉터리 아래의 `cache.db`을(를) 추적하지 않기 때문입니다. `--fix-gitignore`은(는) 해당 줄을 제거하지 않습니다. 이 경고는 `--strict`을(를) 통해서만 명령을 실패시킵니다.

**주요 옵션:** `--local`, `--strict`, `--json`, `--fix-gitignore`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
ai-i18n-tools doctor --fix-gitignore
```

---

<a id="help"></a>
### `help`

**개요:** `ai-i18n-tools help [command]`

하위 명령어의 도움말을 표시합니다(`ai-i18n-tools <command> --help`와 동일한 출력).
