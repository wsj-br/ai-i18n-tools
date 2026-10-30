<a id="ui-strings"></a>
# UI 문자열

`t()` 호출을 로캘별 카탈로그로 전환하는 파이프라인인 `extract` 및 `translate-ui`에 대한 참조입니다. 앱에 i18n을 처음 추가하시나요? [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python)에서 시작하세요. 해당 문서에서 래핑 단계를 다룬 후, 2~4단계를 위해 여기로 다시 안내합니다.

이 파이프라인은 JS/TS 프로젝트(React, Next.js 클라이언트 및 서버 컴포넌트, Node.js 서비스, 일반 HTML, Astro 웹사이트, CLI 도구)와 Python 애플리케이션을 지원합니다. JS/TS는 소스가 `t()`를 호출한 후 i18next로 문자열을 조회합니다. Python은 생성된 `i18n.py`를 통해 `t()` 또는 gettext를 호출합니다(Django는 Django의 gettext를 유지합니다).

<a id="which-guide-to-read"></a>
## 어떤 가이드를 읽어야 할까요?

| 사용 중인 앱 | 다음에 읽을 문서 |
| --- | --- |
| 하드코딩된 소스 문자열이 있고 아직 `t()`가 없는 JS/TS | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) |
| 소스에 `t()`가 이미 있는 React / Next.js / Node | [i18next 연결](/ko/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [파이썬 애플리케이션](/ko/guide/ui-strings/python). 초기화: `ui-python`, `ui-python-gettext`, `ui-python-flask`, 또는 `ui-python-django`. 도우미: `i18n.py`. 기존 앱에 로케일을 추가하려면 [파이썬 앱에 i18n 추가](/ko/guide/add-i18n-to-python)를 참조하거나, 앱이 gettext를 사용하는 경우 [Django / 파이썬 gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext)를 참조하십시오. |
| 일반 HTML (마크업에 `t()` 없음) | [일반 HTML 앱](/ko/guide/ui-strings/plain-html) |
| Astro 마케팅 사이트 (하이브리드) | [Astro 웹사이트](/ko/guide/ui-strings/astro-website) |
| `t()` 규칙, 보간, 복수 | [t() 호출 및 복수](/ko/guide/ui-strings/t-calls-and-plurals) |
| 언어 선택기 / RTL | [언어 전환기 및 RTL](/ko/guide/ui-strings/language-switcher) |
| 런타임 API 서명 | [런타임 도우미](/ko/guide/runtime-helpers) |
| Intlayer에서 마이그레이션하는 Intlayer `.content.ts` 사전 | [Intlayer에서 마이그레이션](/ko/guide/migrating-from-intlayer) |
| Intlayer를 유지하는 Intlayer `.content.ts` 사전 | [Intlayer 인플레이스 번역](/ko/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## 1단계: 초기화

```bash
ai-i18n-tools init -P openrouter
```

이것은 `ui-markdown` 템플릿으로 `ai-i18n-tools.config.json`를 작성합니다(해당 프리셋에 대한 `provider` / `providers` 블록 포함). 해당 템플릿은 또한 `README.md`에 대한 문서 번역을 활성화하며, `translated-docs/` 아래에 플랫 파일로 작성됩니다. README 전용 리포지토리는 대신 `init -t docs-markdown`를 사용합니다. [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요. `translate-ui` 또는 `sync`를 실행하기 전에, 해당 공급자의 API 키를 환경 또는 `.env`에 설정하세요 — Ollama는 예외입니다. [공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요. UI 문자열에는 네 가지 키가 중요합니다.

- `sourceLocale`: 소스 텍스트가 작성된 언어의 BCP-47 코드입니다. 모든 언어가 유효하며, `"en-GB"`는 예시일 뿐입니다. 런타임 i18n 설정 파일(`src/i18n.ts` / `src/i18n.js`)에서 내보낸 `SOURCE_LOCALE`와 일치해야 합니다. `t()` 안의 문자열은 해당 소스 언어이며, 플랫 로캘 파일은 이를 키로 사용합니다.
- `targetLocales`: 대상 언어의 BCP-47 코드입니다(예: `["de", "fr", "pt-BR"]`). `generate-ui-languages`를 실행하여 이 목록에서 `ui-languages.json` 매니페스트를 생성합니다.
- `ui.sourceRoots`: `t("…")` 호출을 스캔할 디렉터리 또는 glob 패턴입니다(예: `["src/"]`).
- `ui.stringsJson` 및 `ui.flatOutputDir`: 마스터 카탈로그와 로캘별 파일(`de.json`, `pt-BR.json`)이 작성되는 위치입니다.

`providers.<active>.uiModels`를 포함한 다른 모든 키는 [구성](/ko/reference/configuration)에 있습니다.

<a id="step-2-extract-strings"></a>
## 2단계: 문자열 추출

`t()` / `i18n.t()` 호출이 존재할 때까지 `extract`는 유용한 작업을 수행하지 않습니다. 먼저 하드코딩된 사본을 래핑하세요: [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js).

```bash
ai-i18n-tools extract
```

`ui.sourceRoots` 아래의 파일에서 `t("literal")` 및 `i18n.t("literal")` 호출을 스캔합니다. `ui.stringsJson`에 쓰거나 병합합니다.

스캐너는 구성 가능합니다. `ui.uiExtractor.funcNames`(또는 레거시 `ui.reactExtractor.funcNames`)를 통해 사용자 지정 함수 이름을 추가합니다. Astro 페이지 및 구성 요소의 경우 `.astro`를 `ui.uiExtractor.extensions`에 추가합니다. 일반 HTML의 경우 [일반 HTML 앱](/ko/guide/ui-strings/plain-html)을 참조하십시오.

<a id="what-extract-scans"></a>
### extract가 스캔하는 대상

- 기본 확장자는 `.js`, `.jsx`, `.ts`, `.tsx`뿐입니다. `.mjs`, `.cjs`, `.mts`, `.cts`는 `ui.uiExtractor.extensions`에 추가할 때만 포함됩니다.
- `t(variable)`와 같은 리터럴이 아닌 키 또는 템플릿 리터럴은 경고 없이 건너뜁니다.
- `package.json` `description`는 기본적으로 포함됩니다(`ui.uiExtractor.includePackageDescription`).
- Vue 및 Svelte 단일 파일 컴포넌트는 지원되지 않습니다. `.vue` 또는 `.svelte`를 `extensions`에 추가해도 템플릿 텍스트가 추출되지 않습니다. SFC 파서가 없습니다.

<a id="step-3-translate-ui-strings"></a>
## 3단계: UI 문자열 번역

```bash
ai-i18n-tools translate-ui
```

`strings.json`을(를) 읽고, 각 대상 로케일에 대해 활성 LLM 제공자의 모델로 배치를 보내고, 플랫 JSON 파일(`de.json`, `fr.json` 등)을 `ui.flatOutputDir`에 씁니다. 모델 선택은 UI 체인: `localeModels(locale)` → `uiModels` → `translationModels`을(를) 사용합니다([AI 모델](/ko/guide/ai-models#model-fallback-chain) 참조). 로케일 내에서 최대 `uiBatchConcurrency`개의 배치가 동시에 실행됩니다(기본값 **2**; [구성 — uiBatchConcurrency](/ko/reference/configuration#uibatchconcurrency-optional) 참조). `-j`는 여전히 대상 로케일만 병렬화합니다.

<a id="translations-database-stringsjson"></a>
### 번역 데이터베이스 (`strings.json`)

각 항목에 대해 `translate-ui`는 선택적 `models` 개체(`translated`와 동일한 로케일 키)에 각 로케일을 성공적으로 번역한 **활성 공급자의 모델 ID**를 저장합니다. 번역 대시보드에서 편집된 문자열은 해당 로케일에 대해 `models`에 센티넬 값 `user-edited`으로 표시됩니다. `ui.flatOutputDir` 아래의 로케일별 플랫 파일은 **원본 문자열 → 번역**만 유지하며, `models`를 포함하지 않습니다(따라서 런타임 번들은 변경되지 않습니다).

> **참고:** UI 문자열에 대한 대시보드 편집 내용은 SQLite 문서 캐시가 아닌 `strings.json`에 저장됩니다. 카탈로그에서 플랫 로케일 파일을 다시 작성하려면 일반 `sync` 또는 `translate-ui`(특수 플래그 없음)를 실행하십시오. `--force-update`는 UI 단계로 **전달되지 않습니다**. 수동 편집 후 UI 명령에 `--force`를 사용하지 마십시오. 이는 모든 항목을 다시 번역하고 `user-edited` 행을 덮어쓸 수 있습니다. 저장된 번역이 로케일 쓰기 시스템 검사(예: `hi`에 대한 로마자화된 힌디어)에 실패한 카탈로그 행은 누락된 것으로 간주되어 `--force` 없이 다시 번역됩니다.

<a id="step-4-use-the-output-in-your-app"></a>
## 4단계: 앱에서 출력 사용하기

`translate-ui`는 파일만 작성합니다. 앱이 파일을 로드해야 합니다.

- JS/TS: 런타임 헬퍼를 사용하여 i18next를 설정하고, 사용자가 선택한 로케일 파일을 로드한 다음, 언어 전환기를 추가합니다. [i18next 연결](/ko/guide/ui-strings/i18next-runtime) 및 [언어 전환기 및 RTL](/ko/guide/ui-strings/language-switcher)을 참조하세요.
- Python: 생성된 `i18n.py` 또는 gettext 카탈로그를 사용합니다. [Python 애플리케이션](/ko/guide/ui-strings/python)을 참조하세요.
- 일반 HTML: 페이지 옆에 런타임 스크립트를 로드합니다. [일반 HTML 앱](/ko/guide/ui-strings/plain-html)을 참조하세요.
- Astro: [Astro 웹사이트](/ko/guide/ui-strings/astro-website)를 참조하세요.

<a id="optional"></a>
## 선택 사항

<a id="per-locale-model-overrides"></a>
### 로케일별 모델 재정의

일부 모델은 다른 모델보다 특정 언어를 더 잘 번역합니다. 예를 들어, qwen 및 z-ai 모델은 아시아 언어에 강한 경향이 있습니다. 각 BCP-47 로케일에 대한 우선순위 모델 목록을 제공하려면 `providers.<active>.localeModels` 항목을 추가하십시오. 해당 로케일에 대해 `uiModels` 및 `translationModels`보다 먼저 해당 목록이 시도됩니다. 로케일 태그는 대소문자를 구분하지 않습니다(`zh-cn`와 `ZH-CN`는 동일합니다). 일치하는 항목이 없으면 도구는 기본 `uiModels` 및 `translationModels` 순서를 사용합니다. 동일한 `localeModels` 메커니즘이 문서, JSON 및 SVG 번역에 적용됩니다.

<a id="exporting-to-xliff-20"></a>
### XLIFF 2.0으로 내보내기

UI 문자열을 번역 업체, TMS 또는 CAT 도구에 넘기기 위해 카탈로그를 **XLIFF 2.0** 형식으로 내보냅니다(대상 로케일당 하나의 파일). 이 명령은 **읽기 전용**입니다: `strings.json`을 수정하거나 API를 호출하지 않습니다.

```bash
ai-i18n-tools export-ui-xliff
```

기본적으로 파일은 `ui.stringsJson` 옆에 `strings.de.xliff`, `strings.pt-BR.xliff`(카탈로그의 기본 이름 + 로케일 + `.xliff`) 형태로 작성됩니다. 다른 위치에 쓰려면 `-o` / `--output-dir`를 사용하세요. `strings.json`의 기존 번역은 `<target>`에 나타나며, 누락된 로케일은 `state="initial"`을 사용하고 `<target>` 없이 표시되어 도구에서 채울 수 있습니다. `--untranslated-only`을 사용하면 각 로케일별로 아직 번역이 필요한 항목만 내보낼 수 있습니다(업체 배치에 유용함). `--dry-run`은 파일을 쓰지 않고 경로만 출력합니다.
