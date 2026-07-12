<a id="ui-strings"></a>
# UI 문자열

i18next를 사용하는 모든 JS/TS 프로젝트에 적합합니다: React 앱, Next.js(클라이언트 및 서버 구성 요소), Node.js 서비스, 평면 HTML, Astro 웹사이트 및 CLI 도구.

<a id="which-guide-to-read"></a>
## 어떤 가이드를 읽어야 할까요?

| 귀하의 앱 | 다음 읽기 |
| --- | --- |
| React / Next.js / Node + i18next | [i18next 연결](/ko/guide/ui-strings/i18next-runtime) (4단계) |
| 일반 HTML (마크업에 `t()` 없음) | [일반 HTML 앱](/ko/guide/ui-strings/plain-html) |
| Astro 마케팅 사이트 (하이브리드) | [Astro 웹사이트](/ko/guide/ui-strings/astro-website) |
| `t()` 규칙, 보간, 복수 | [t() 호출 및 복수](/ko/guide/ui-strings/t-calls-and-plurals) |
| 언어 선택기 / RTL | [언어 전환기 및 RTL](/ko/guide/ui-strings/language-switcher) |
| 런타임 API 서명 | [런타임 도우미](/ko/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## 1단계: 초기화

```bash
ai-i18n-tools init [-P <provider>]
```

이 작업은 기본 `provider` / `providers` 블록을 포함하여 `ui-markdown` 템플릿으로 `ai-i18n-tools.config.json`를 작성합니다. `translate-ui` 또는 `sync`를 실행하기 전에, 환경 변수나 `.env`에서 활성 프로바이더의 API 키를 설정하세요. 단, Ollama는 예외입니다. 자세한 내용은 [프로바이더 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요. config를 편집하여 다음을 설정하세요:

- `provider` 및 `providers` — 최소한 하나의 제공자가 `translationModels`를 가지고 있습니다; 기본값이 선택 사항이 아닌 경우 프리셋 또는 모델 목록을 변경하십시오 (`init -P <provider>`). [LLM 제공자 및 모델](/ko/guide/providers-and-models)를 참조하십시오.
- `sourceLocale` - 귀하의 소스 언어 BCP-47 코드 (예: `"en-GB"`). **일치해야 합니다** `SOURCE_LOCALE` 귀하의 런타임 i18n 설정 파일에서 내보낸 (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - 귀하의 대상 언어에 대한 BCP-47 코드 배열 (예: `["de", "fr", "pt-BR"]`). `generate-ui-languages`을 실행하여 이 목록에서 `ui-languages.json` 매니페스트를 생성하십시오.
- `ui.sourceRoots` - `t("…")` 호출을 스캔할 디렉토리 또는 글로브 패턴 (예: `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - 마스터 카탈로그를 작성할 위치(예: `"src/locales/strings.json"`).
- `ui.flatOutputDir` - `de.json`, `pt-BR.json` 등을 작성할 위치(예: `"src/locales/"`).
- `providers.<active>.uiModels` (선택 사항) - `translate-ui`, 복수형 생성 및 `proofread-ui`을 위한 정렬된 UI 전용 모델 목록(일치하는 `localeModels` 항목 이후, `translationModels` 이전). [프로바이더 및 모델](/ko/guide/providers-and-models#model-fallback-chain)을 참조하세요.

<a id="step-2-extract-strings"></a>
## 2단계: 문자열 추출

```bash
ai-i18n-tools extract
```

`ui.sourceRoots` 하위의 모든 JS/TS 파일을 스캔하여 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. `ui.stringsJson`에 쓰거나 병합합니다.

스캐너는 구성 가능합니다. `ui.uiExtractor.funcNames`(또는 레거시 `ui.reactExtractor.funcNames`)를 통해 사용자 지정 함수 이름을 추가합니다. Astro 페이지 및 구성 요소의 경우 `.astro`를 `ui.uiExtractor.extensions`에 추가합니다. 일반 HTML의 경우 [일반 HTML 앱](/ko/guide/ui-strings/plain-html)을 참조하십시오.

<a id="step-3-translate-ui-strings"></a>
## 3단계: UI 문자열 번역

```bash
ai-i18n-tools translate-ui
```

`strings.json`을(를) 읽고, 각 대상 로케일에 대해 활성 LLM 공급자에게 배치를 보내고, 플랫 JSON 파일(`de.json`, `fr.json` 등)을 `ui.flatOutputDir`에 씁니다. 모델 선택은 UI 체인 `localeModels(locale)` → `uiModels` → `translationModels`을(를) 사용합니다([공급자 및 모델](/ko/guide/providers-and-models#model-fallback-chain) 참조).

<a id="per-locale-model-overrides"></a>
### 로케일별 모델 재정의

대상 언어에 따라 일부 번역 모델은 다른 모델보다 훨씬 더 우수한 성능을 발휘할 수 있습니다. 예를 들어, qwen 및 z-ai 모델은 많은 서양(Occidental) 언어 모델에 비해 아시아 언어에 대해 더 높은 품질의 번역을 생성하는 경향이 있습니다. 이를 활용하기 위해, 각 BCP-47 로케일에 대해 우선 순위가 지정된 모델 목록을 지정하기 위해 선택적 `providers.<active>.localeModels` 항목을 사용할 수 있습니다. 이러한 모델 목록은 특정 로케일에 대해 보다 일반적인 `uiModels` 및 `translationModels`보다 **먼저** 시도됩니다. 이를 통해 모델 선택을 조정하고 언어별로 더 나은 번역 품질을 달성할 수 있습니다. 로케일 태그는 대소문자를 구분하지 않고 일치합니다(따라서 `zh-cn` 및 `ZH-CN`는 동일합니다). 사용자 인터페이스 번역을 위해 사용자 정의 항목과 일치하는 로케일이 없으면 도구는 기본 `uiModels` 및 `translationModels` 순서로 돌아갑니다. 동일한 `localeModels` 메커니즘은 문서, JSON 및 SVG 번역에도 적용됩니다.

<a id="translations-database-stringsjson"></a>
### 번역 데이터베이스 (`strings.json`)

각 항목에 대해 `translate-ui`는 선택적 `models` 개체(`translated`와 동일한 로케일 키)에 각 로케일을 성공적으로 번역한 **활성 공급자의 모델 ID**를 저장합니다. 번역 대시보드에서 편집된 문자열은 해당 로케일에 대해 `models`에 센티넬 값 `user-edited`으로 표시됩니다. `ui.flatOutputDir` 아래의 로케일별 플랫 파일은 **원본 문자열 → 번역**만 유지하며, `models`를 포함하지 않습니다(따라서 런타임 번들은 변경되지 않습니다).

> **참고:** UI 문자열에 대한 대시보드 편집은 SQLite 문서 캐시가 아닌 `strings.json`에 있습니다. 카탈로그에서 플랫 로케일 파일을 다시 작성하려면 일반 `sync` 또는 `translate-ui`(특수 플래그 없음)를 실행하십시오. `--force-update`는 UI 단계로 전달되지 **않습니다**. 수동 편집 후 UI 명령에서 `--force`를 사용하지 마십시오. 모든 항목을 다시 번역하고 `user-edited` 행을 덮어쓸 수 있습니다.

그런 다음 런타임에 i18next를 연결합니다. [i18next 연결](/ko/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## XLIFF 2.0으로 내보내기 (선택 사항)

UI 문자열을 번역 업체, TMS 또는 CAT 도구에 넘기기 위해 카탈로그를 **XLIFF 2.0** 형식으로 내보냅니다(대상 로케일당 하나의 파일). 이 명령은 **읽기 전용**입니다: `strings.json`을 수정하거나 API를 호출하지 않습니다.

```bash
ai-i18n-tools export-ui-xliff
```

기본적으로 파일은 `ui.stringsJson` 옆에 `strings.de.xliff`, `strings.pt-BR.xliff`(카탈로그의 기본 이름 + 로케일 + `.xliff`) 형태로 작성됩니다. 다른 위치에 쓰려면 `-o` / `--output-dir`를 사용하세요. `strings.json`의 기존 번역은 `<target>`에 나타나며, 누락된 로케일은 `state="initial"`을 사용하고 `<target>` 없이 표시되어 도구에서 채울 수 있습니다. `--untranslated-only`을 사용하면 각 로케일별로 아직 번역이 필요한 항목만 내보낼 수 있습니다(업체 배치에 유용함). `--dry-run`은 파일을 쓰지 않고 경로만 출력합니다.
