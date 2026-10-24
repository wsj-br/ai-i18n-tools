<a id="programmatic-api"></a>
# 프로그래밍 방식 API

모든 공용 타입과 클래스는 패키지 루트에서 내보냅니다. 예: CLI 없이 Node.js에서 UI 번역 단계를 실행하는 경우:

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Node.js에서 구성을 스캐폴드합니다. 네 번째 인수는 내장된 프리셋입니다 (`cwd`는 세 번째입니다):

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'cheaperinference');
```

주요 내보내기 (일반적으로 사용됨 — 전체 공개 표면은 `src/index.ts` 참조):

| 내보내기 | 설명 |
|---|---|
| `loadI18nConfigFromFile` | JSON 파일에서 설정을 로드하고 병합한 후 유효성을 검사합니다. |
| `parseI18nConfig` | 원시 설정 객체의 유효성을 검사합니다. |
| `TranslationCache` | SQLite 캐시 - `cacheDir` 경로로 인스턴스 생성. |
| `UIStringExtractor` | JS/TS 소스에서 `t("…")` 문자열 추출. |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML에서 `data-i18n*` 마커 스캔/삽입 (`extract`용 `.html` 및 `mark-html` 명령 지원). |
| `MarkdownExtractor` | 마크다운에서 번역 가능한 구문 추출. |
| `HtmlTemplateExtractor` | 일반 HTML 문서 추출 및 재구성(텍스트 및 번역 가능한 속성; `src` / `href`는 제자리에 유지). |
| `JsonExtractor` | Docusaurus JSON 레이블 파일(UI 카탈로그, MDX 본문 아님)에서 추출합니다. |
| `SvgExtractor` | SVG 파일에서 추출. |
| `LlmClient` | 활성 LLM 공급자에게 번역 요청을 합니다( `OpenRouterClient`는 더 이상 사용되지 않는 별칭). |
| `rankProviderModels` / `resolveSuggestionWeights` | `suggest-models`에서 사용하는 품질 또는 가격 프로필을 기준으로 1순위 제공업체의 채팅 카탈로그를 나열합니다. 구성을 출력하거나 기록하지 않습니다. |
| `PlaceholderHandler` | 번역 주위의 마크다운 구문 보호/복원 (HTML 태그, 주석, 앵커, MDX 주석/JSX/중괄호, URL, 인라인 코드, 강조). |
| `protectMdx` / `restoreMdx` | MDX 주석, JSX 태그, 중괄호 표현식 및 JSX 문자열 속성 보호/복원 (`PlaceholderHandler`에 의해 호출됨; 직접 사용을 위해 내보내기도 함). |
| `splitTranslatableIntoBatches` | 구문을 LLM 크기의 배치로 그룹화. |
| `validateTranslation` | 번역 후 구조 검사 (**async** — 대기해야 함). |
| `resolveDocumentationOutputPath` | 번역된 문서의 출력 파일 경로 결정. |
| `Glossary` / `GlossaryMatcher` | 번역 용어집을 로드하고 적용하며, 선택적인 용어 `Context` 메모를 포함합니다. |
| `loadTranslationContext` / `computeGuidanceFingerprint` | 캐시 무효화를 위한 `glossary.contextFiles` 및 지문 가이드를 로드합니다. |
| `runTranslateUI` | 프로그래밍 방식 번역 UI 진입점. |
| `writeInitConfigFile` | 기본 구성 JSON을 작성합니다 (`template`, `cwd`, 그리고 필수 `providerKey`). |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P`에서 사용하는 내장 프리셋당 스타터 `translationModels`. |
| `PROVIDER_PRESETS` | 내장 공급자 사전 설정 맵 (`baseUrl`, `apiKeyEnv`). |

<a id="python-runtime"></a>
## Python 런타임 (`i18n.py`)

`init -t ui-python`, `ui-python-gettext` 및 `ui-python-flask`는 `i18n.py`이(가) 누락된 경우 이 모듈을 프로젝트에 작성합니다. 이는 Python 3.10 이상을 위한 표준 라이브러리 도우미입니다. 해당 파일에서 가져오십시오. 아래 함수들은 위 표의 Node 내보내기와는 별개입니다. Django 프로젝트는 Django의 gettext를 유지하므로 `ui-python-django`는 `i18n.py`을(를) 작성하지 않습니다.

호출 형태, 안전하지 않은 f-string 및 프레임워크별 로캘 연결: [Python 애플리케이션](/ko/guide/ui-strings/python).

| 함수 | 동작 |
| --- | --- |
| `set_locale(locale)` | 현재 로캘을 설정합니다. 코드의 밑줄은 하이픈으로 저장됩니다(`pt_BR`은(는) `pt-BR`이(가) 됨). `ContextVar` 토큰을 반환합니다. |
| `reset_locale(token)` | 해당 토큰에서 로캘을 복원합니다. FastAPI 및 Flask 미들웨어를 포함하여 `finally`에서 호출하십시오. |
| `get_locale()` | 현재 로캘을 반환합니다. |
| `set_backend(backend)` | `"auto"`, `"json"` 또는 `"gettext"`을(를) 선택합니다. |
| `get_ui_languages()` | 플랫 JSON 디렉터리 옆에 있는 `ui-languages.json`을(를) 읽거나, 플랫 출력이 꺼져 있을 때는 gettext 디렉터리를 읽습니다. |
| `get_direction(locale=None)` | 해당 로캘(생략 시 현재 로캘)에 대한 매니페스트 행에서 `"rtl"` 또는 `"ltr"`을(를) 반환합니다. |
| `_(message)` | 리터럴 하나를 조회한 다음 카탈로그 문자열 또는 메시지 자체를 반환합니다. |
| `t(template, *, plurals=False, count=None, **values)` | 리터럴을 조회한 다음 보간합니다. `translate`은(는) 동일한 함수입니다. Python 3.14에서 `translate(t"Hello, {name}!")`은(는) 템플릿과 해당 값을 유지합니다. 키워드 인수는 템플릿 문자열에서 가져온 값을 재정의합니다. |
| `ngettext(singular, plural, n, **values)` | 복수형 조회 후 보간합니다. `count`은(는) 형식 문자열에서 사용할 수 있습니다. |
| `pgettext(context, message, **values)` | 컨텍스트 조회(`msgctxt` 또는 `context` + U+0004 + 플랫 JSON의 영어 소스) 후 보간합니다. |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit 선택 상자입니다. `st.session_state.locale` 및 `st.query_params["lang"]`을(를) 작성하고, `set_locale`을(를) 호출하며, 선택한 코드를 반환합니다. |
