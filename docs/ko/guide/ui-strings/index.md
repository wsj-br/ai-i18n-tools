<a id="ui-strings"></a>
# UI 문자열

i18next를 사용하는 모든 JS/TS 프로젝트를 위한 것입니다: React 앱, Next.js(클라이언트 및 서버 컴포넌트), Node.js 서비스, CLI 도구 등.

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
npx ai-i18n-tools init
```

이 작업은 기본 `provider` / `providers` 블록을 포함하여 `ui-markdown` 템플릿으로 `ai-i18n-tools.config.json`를 작성합니다. `translate-ui` 또는 `sync`를 실행하기 전에, 환경 변수나 `.env`에서 활성 프로바이더의 API 키를 설정하세요. 단, Ollama는 예외입니다. 자세한 내용은 [프로바이더 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요. config를 편집하여 다음을 설정하세요:

- `provider` 및 `providers` — 최소 하나의 프로바이더에 `translationModels`가 있어야 합니다. OpenRouter를 사용하지 않으려면 프리셋이나 모델 목록을 변경하세요. [LLM 프로바이더 및 모델](/ko/guide/providers-and-models)을 참조하세요.
- `sourceLocale` - 소스 언어의 BCP-47 코드(예: `"en-GB"`). 런타임 i18n 설정 파일(`src/i18n.ts` / `src/i18n.js`)에서 내보낸 `SOURCE_LOCALE`와 **반드시 일치**해야 합니다.
- `targetLocales` - 타겟 언어의 BCP-47 코드 배열(예: `["de", "fr", "pt-BR"]`). 이 목록에서 `ui-languages.json` 매니페스트를 생성하려면 `generate-ui-languages`를 실행하세요.
- `ui.sourceRoots` - `t("…")` 호출을 스캔할 디렉터리 또는 glob 패턴(예: `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - 마스터 카탈로그를 작성할 위치(예: `"src/locales/strings.json"`).
- `ui.flatOutputDir` - `de.json`, `pt-BR.json` 등을 작성할 위치(예: `"src/locales/"`).
- `providers.<active>.uiModels` (선택 사항) - `translate-ui`, 복수형 생성 및 `proofread-ui`을 위한 정렬된 UI 전용 모델 목록(일치하는 `localeModels` 항목 이후, `translationModels` 이전). [프로바이더 및 모델](/ko/guide/providers-and-models#model-fallback-chain)을 참조하세요.

<a id="step-2-extract-strings"></a>
## 2단계: 문자열 추출

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 하위의 모든 JS/TS 파일을 스캔하여 `t("literal")` 및 `i18n.t("literal")` 호출을 찾습니다. `ui.stringsJson`에 쓰거나 병합합니다.

스캐너는 구성 가능합니다. `ui.uiExtractor.funcNames`(또는 레거시 `ui.reactExtractor.funcNames`)를 통해 사용자 지정 함수 이름을 추가합니다. Astro 페이지 및 구성 요소의 경우 `.astro`를 `ui.uiExtractor.extensions`에 추가합니다. 일반 HTML의 경우 [일반 HTML 앱](/ko/guide/ui-strings/plain-html)을 참조하십시오.

<a id="step-3-translate-ui-strings"></a>
## 3단계: UI 문자열 번역

```bash
npx ai-i18n-tools translate-ui
```

`strings.json`을(를) 읽고, 각 대상 로케일에 대해 활성 LLM 공급자에게 배치를 보내고, 플랫 JSON 파일(`de.json`, `fr.json` 등)을 `ui.flatOutputDir`에 씁니다. 모델 선택은 UI 체인 `localeModels(locale)` → `uiModels` → `translationModels`을(를) 사용합니다([공급자 및 모델](/ko/guide/providers-and-models#model-fallback-chain) 참조).

<a id="per-locale-model-overrides"></a>
### 로케일별 모델 재정의

선택적 `providers.<active>.localeModels` 항목은 BCP-47 로케일을 해당 로케일에 대한 `uiModels` 및 `translationModels` **이전**에 시도된 정렬된 모델 목록에 매핑합니다. 동일한 `localeModels` 항목은 문서, JSON 및 SVG 번역에도 적용됩니다. 로케일 태그는 대소문자를 구분하지 않고 일치합니다(`pt-br` = `pt-BR`). 일치하는 항목이 없으면 UI 작업에 `uiModels` 및 `translationModels`만 사용됩니다.

각 항목에 대해 `translate-ui`는 선택적 `models` 개체(`translated`와 동일한 로케일 키)에 각 로케일을 성공적으로 번역한 **활성 공급자의 모델 ID**를 저장합니다. 번역 대시보드에서 편집된 문자열은 해당 로케일에 대해 `models`에 센티넬 값 `user-edited`으로 표시됩니다. `ui.flatOutputDir` 아래의 로케일별 플랫 파일은 **원본 문자열 → 번역**만 유지하며, `models`를 포함하지 않습니다(따라서 런타임 번들은 변경되지 않습니다).

> **참고:** UI 문자열에 대한 대시보드 편집은 SQLite 문서 캐시가 아닌 `strings.json`에 있습니다. 카탈로그에서 플랫 로케일 파일을 다시 작성하려면 일반 `sync` 또는 `translate-ui`(특수 플래그 없음)를 실행하십시오. `--force-update`는 UI 단계로 전달되지 **않습니다**. 수동 편집 후 UI 명령에서 `--force`를 사용하지 마십시오. 모든 항목을 다시 번역하고 `user-edited` 행을 덮어쓸 수 있습니다.

그런 다음 런타임에 i18next를 연결합니다. [i18next 연결](/ko/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## XLIFF 2.0으로 내보내기 (선택 사항)

UI 문자열을 번역 업체, TMS 또는 CAT 도구에 넘기기 위해 카탈로그를 **XLIFF 2.0** 형식으로 내보냅니다(대상 로케일당 하나의 파일). 이 명령은 **읽기 전용**입니다: `strings.json`을 수정하거나 API를 호출하지 않습니다.

```bash
npx ai-i18n-tools export-ui-xliff
```

기본적으로 파일은 `ui.stringsJson` 옆에 `strings.de.xliff`, `strings.pt-BR.xliff`(카탈로그의 기본 이름 + 로케일 + `.xliff`) 형태로 작성됩니다. 다른 위치에 쓰려면 `-o` / `--output-dir`를 사용하세요. `strings.json`의 기존 번역은 `<target>`에 나타나며, 누락된 로케일은 `state="initial"`을 사용하고 `<target>` 없이 표시되어 도구에서 채울 수 있습니다. `--untranslated-only`을 사용하면 각 로케일별로 아직 번역이 필요한 항목만 내보낼 수 있습니다(업체 배치에 유용함). `--dry-run`은 파일을 쓰지 않고 경로만 출력합니다.
