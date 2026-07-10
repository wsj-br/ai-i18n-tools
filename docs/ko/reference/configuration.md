<a id="configuration-reference"></a>
# 구성 참조

<a id="sourcelocale"></a>
### `sourceLocale`

소스 언어의 BCP-47 코드(예: `"en-GB"`, `"en"`, `"pt-BR"`). 이 로케일에 대해서는 번역 파일이 생성되지 않으며, 키 문자열 자체가 소스 텍스트입니다.

**일치해야 함** 런타임 i18n 설정 파일(`src/i18n.ts` / `src/i18n.js`)에서 내보낸 `SOURCE_LOCALE`과.

---

<a id="targetlocales"></a>
### `targetLocales`

번역할 BCP-47 로캘 코드 배열 (예: `["de", "fr", "es", "pt-BR"]`).

`targetLocales`은 UI 번역을 위한 기본 로캘 목록이자 문서 블록의 기본 로캘 목록입니다. `sourceLocale` + `targetLocales`에서 `ui-languages.json` 매니페스트를 생성하려면 `generate-ui-languages`을 사용하세요.

---

<a id="uilanguage-optional"></a>
### `uiLanguage` (선택 사항)

도구 자체 UI 언어(CLI 도움말, 로그/요약, 번역 대시보드)의 BCP-47 코드입니다. `sourceLocale` / `targetLocales`과(와) 독립적이며, `-L` / `--ui-lang` 플래그 및 `AI_I18N_LANG` 환경 변수에 의해 재정의됩니다. 알 수 없는 값은 소스 로케일(`en-GB`)로 정상적으로 저하되며, 엄격한 유효성 검사는 수행되지 않습니다. [도구 UI 언어](/ko/guide/tool-ui-language)를 참조하세요.

---

<a id="languagesmanifestpath-optional"></a>
### `languagesManifestPath` (선택 사항)

루트 수준의 선택적 문자열입니다 (`ui` 아래에 중첩되지 않음). `extract`와 `generate-ui-languages`가 `ui-languages.json` 매니페스트를 작성하는 경로이며, CLI가 표시 이름과 언어 목록 후처리를 위해 이를 읽어오는 경로입니다. 생략 시, 구성 로드 시 기본값으로 `ui.flatOutputDir/ui-languages.json`가 사용됩니다.

다음과 같은 경우에 사용하세요:

- 매니페스트는 `ui.flatOutputDir` 외부에 위치해야 합니다 (예: `src/i18n/` 아래의 앱 헬퍼 옆).
- [언어 전환 후처리](#language-switcher-languagelistblock) (`languageListBlock`)가 번들된 마스터 카탈로그만이 아닌 프로젝트 매니페스트로부터 로케일 라벨을 빌드하도록 하려는 경우.

`includeUiLanguageEnglishNames`는 이 파일을 **읽지 않습니다** — 번들된 마스터 카탈로그를 사용합니다 (아래 `ui.uiExtractor` 참조).

**레거시:** 구성 파일을 로드할 때 루트 수준의 `uiLanguagesPath`는 여전히 허용되며, 자동으로 `languagesManifestPath`로 다시 작성됩니다.

---

<a id="concurrency-optional"></a>
### `concurrency` (선택 사항)

동시에 번역되는 최대 **대상 로캘** 수 (`translate-ui`, `translate-docs`, `translate-svg`, 및 `sync` 내 해당 단계). 생략 시 CLI는 UI 번역에 **4**, 문서 번역에 **3**를 사용합니다 (내장 기본값). 실행 시 `-j` / `--concurrency`로 재정의할 수 있습니다.

---

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (선택 사항)

**translate-docs**, **translate-svg** 및 **translate-json**(및 `sync` 내부의 일치하는 단계): 파일당 최대 병렬 LLM **배치** 요청 수(각 배치에는 여러 세그먼트가 포함될 수 있음). 생략 시 기본값은 **4**입니다. `translate-ui`에서는 무시됩니다. `-b` / `--batch-concurrency`로 재정의합니다.

---

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (선택 사항)

단일 로케일 내에서 동시에 처리되는 파일의 최대 개수 **(하나의 로케일 내)**. `translate-docs` 및 `sync` 중에 사용됩니다.  **1**보다 큰 값으로 설정된 경우, 동일한 로케일 내 파일들이 메모리 사용량을 제어하기 위한 세마포어를 사용하여 병렬로 처리됩니다. 생략 시 기본값은 **1**(순차 처리)입니다. 더 높은 값은 I/O에 의해 제한되는 작업의 처리량을 크게 향상시킬 수 있으며, 특히 모든 세그먼트가 이미 캐시되어 있는 경우(별도의 API 호출이 필요 없는 경우) 더욱 효과적입니다.

**예시:**

```json
{
  "fileConcurrency": 4
}
```

**사용 사례:** 전체 처리 시간을 줄이기 위해 캐시 적중률이 100%인 상태에서 `sync --force-update`을 실행할 때 이 값을 `2-4`으로 설정합니다. 이는 작은 파일이 많은 경우에 특히 두드러진 개선을 보입니다.

---

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (선택 사항)

**translate-docs**, **translate-svg** 및 **translate-json**에 대한 세그먼트 배치: API 요청당 세그먼트 수 및 문자 상한. 기본값: **20** 세그먼트, **4096** 문자(생략 시).

---

<a id="provider-and-providers"></a>
### `provider` 및 `providers`

`provider` (최상위, 선택 사항)은 `providers`에서 활성 공급자 키를 선택합니다. 구성된 공급자가 하나뿐인 경우 선택 사항이며, 둘 이상 구성된 경우 필수입니다.

`providers` (최상위)는 공급자 키를 해당 블록에 매핑합니다. 내장 키 (아래 사전 설정 테이블 참조)는 `translationModels`만 필요합니다. 다른 키는 사용자 지정 OpenAI 호환 엔드포인트를 정의하며 `baseUrl` (및 `apiKeyEnv`, 엔드포인트에 키가 필요하지 않은 경우 제외)가 필요합니다.

각 `providers.<name>` 블록은 다음을 허용합니다:

- `translationModels`
  선호하는 모델 ID의 정렬된 목록(일반적인 업스트림 ID, `provider/` 접두사 없음; OpenRouter ID는 고유한 `vendor/model` 형식을 유지). 첫 번째 항목이 먼저 시도되며, 이후 항목은 오류 발생 시 대체 항목으로 사용됩니다. 이는 더 구체적인 계층이 적용되지 않을 때 모든 파이프라인에 대한 전역 기본 체인입니다.
- `uiModels` (선택 사항)
  `translate-ui`, 복수 생성(단계 0 및 통과 B), `proofread-ui`에 대한 정렬된 UI 전용 모델 목록입니다. 대상 로케일에 대한 일치하는 `localeModels` 항목 다음에, `translationModels` 이전에 시도됩니다.
- `localeModels` (선택 사항)
  **모든** 번역 파이프라인에 대한 로케일별 재정의입니다. `{ "locale": "<BCP-47>", "models": ["…"] }` 객체 배열입니다. 로케일 태그는 대소문자를 구분하지 않고 일치합니다(`pt-br` = `pt-BR`). 각 로케일의 목록은 해당 로케일에 대해서만 먼저 시도된 다음, 파이프라인별 계층(UI의 경우 `uiModels`) 및 `translationModels`이 시도됩니다. 중복된 정규화된 로케일 키는 구성 로드 시 거부됩니다.
- `baseUrl`
  OpenAI 호환 기본 URL입니다. 사전 설정된 기본 URL을 재정의합니다. 사전 설정되지 않은 공급자에게 필요합니다.
- `apiKeyEnv`
  API 키를 포함하는 환경 변수입니다. 사전 설정된 환경 변수를 재정의합니다.
- `headers`
  이 공급자에 대한 모든 요청과 함께 전송되는 추가 HTTP 헤더입니다.
- `maxTokens`
  요청당 최대 완료 토큰 수입니다. 기본값: `8192`.
- `temperature`
  샘플링 온도입니다. 기본값: `0.2`.
- `requestTimeoutMs`
  각 요청을 기다리는 최대 시간(밀리초)입니다. 기본값: `30000` (30초).

내장 제공자 사전 설정(키 — 기본 URL — API 키 환경 변수):

| 제공자 | 기본 URL | API 키 환경 변수 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (없음) |

레거시 최상위 `openrouter` 블록 (`baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs` 포함)은 여전히 허용되며 로드 시 `providers.openrouter` (`provider: "openrouter"` 포함)로 자동 마이그레이션됩니다. `defaultModel` / `fallbackModel`은 `translationModels`로 접힙니다.

하나의 구성에서 여러 공급자를 구성하고 `-P`로 전환하는 실행 가능한 예는 [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)을 참조하십시오(`openai`, `anthropic`, `nvidia` 및 `deepseek`가 동일한 문서에 있음).

**여러 모델을 사용하는 이유:** 공급자와 모델마다 비용이 다르고 언어 및 로케일에 따라 다른 수준의 품질을 제공합니다. `translationModels`를 **순서대로 대체되는 체인**으로 구성하십시오 (단일 모델이 아닌). 그러면 요청 실패 시 CLI가 다음 모델을 시도할 수 있습니다.

아래 목록을 확장할 수 있는 **기준선**으로 간주하십시오. 특정 로케일에 대한 번역이 불량하거나 성공적이지 않은 경우, 해당 언어 또는 스크립트를 효과적으로 지원하는 모델을 조사하고(온라인 리소스 또는 공급자 설명서 참조) 해당 모델 ID를 추가 대안으로 추가하십시오.

이 목록은 36개의 대상 로케일을 포함하는 대규모 문서 프로젝트에서 **광범위한 로케일 커버리지 테스트**를 거쳤습니다. 실용적인 기본값으로 사용되지만, 모든 로케일에서 항상 우수한 성능을 보장하지는 않습니다.

예시 `translationModels` (`npx ai-i18n-tools init`과 동일한 기본값):

<details>
<summary>기본 translationModels 대체 목록</summary>

```json
"translationModels": [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "openai/gpt-4o-mini",
  "google/gemma-4-26b-a4b-it",
  "anthropic/claude-3-haiku",
  "z-ai/glm-5.2",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

**권장 `uiModels`:** UI 문자열은 짧지만 매우 눈에 띕니다. 프리미엄 모델을 사용하면 어조, 복수형 및 일관성이 향상되는 경우가 많습니다. 선택적 `uiModels`은(는) 일치하는 `localeModels` 항목 이후, `translationModels` 이전에 시도됩니다(위의 필드 목록 참조). 예시:

<details>
<summary>UI 번역을 위한 권장 uiModels</summary>

```json
"uiModels": [
  "~anthropic/claude-sonnet-latest",
  "z-ai/glm-5.2"
]
```

</details>

**아시아 언어에 대한 권장 `localeModels`:** 일본어, 한국어 및 중국어 로케일은 해당 스크립트에 맞게 조정된 모델을 사용할 때 이점이 있는 경우가 많습니다. 대상 로케일이 일치할 때 **먼저** 시도되는(`uiModels` / `translationModels` 이전) 로케일별 재정의를 추가하세요:

<details>
<summary>ja, ko, zh-Hans, zh-Hant에 대한 권장 localeModels</summary>

```json
"localeModels": [
  { "locale": "ja",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "ko",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "zh-Hans", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "zh-Hant", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] }
]
```

</details>

<br />

활성 공급자의 API 키 환경 변수 (예: `OPENROUTER_API_KEY`)를 환경 또는 `.env` 파일에 설정하십시오.

모델 목록을 변경하기 전에 `npx ai-i18n-tools check-models`을(를) 실행하십시오. 모든 공급자에 대해 구성된 각 모델 ID(`translationModels`, `uiModels` 및 모든 `localeModels` 항목)를 해당 공급자의 라이브 모델 목록(`GET /models`)과 비교하여 확인하고, 누락되거나 `expiration_date`를 초과하는 ID를 보고하며, 유효한 모델을 나열하고, 구성된 ID가 유효하지 않은 경우 0이 아닌 값으로 종료합니다. 공급자가 가격 책정(예: OpenRouter)을 반환하는 경우 예상 입력/출력 가격(100만 토큰당 USD)도 표시합니다.

실제 번역 작업에서 구성된 모델을 비교하려면 `npx ai-i18n-tools bench-models`을(를) 실행하세요. 이 명령은 `translationModels`, `uiModels`, `localeModels`의 모든 고유 모델 ID를 각각 개별적으로(`concurrency`에 의해 제한된 병렬로) 하나의 샘플을 번역하여 벤치마킹하고, 모델별 입력/출력 토큰, 실제 시간, USD 비용을 출력하므로 모델 목록을 확정하기 전에 속도와 가격을 비교할 수 있습니다.

---

<a id="features"></a>
### `features`

| 필드                | 파이프라인 | 설명                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1        | `t("…")` / `i18n.t("…")`를 `strings.json`로 추출한 다음, 항목을 번역하고 로케일별 플랫 JSON을 작성합니다(추출은 자동으로 실행됩니다. 카탈로그만 새로 고치려면 독립형 `extract`를 사용하세요). |
| `translateDocs` | 2 | `.md` / `.mdx` / `.astro` 페이지 번역; `docs[].docusaurusCatalogDir`가 설정된 경우 Docusaurus 셸 JSON; Nextra `_meta` / 구성된 경우 사전; `docsOutput.vitepressThemeCatalog`가 설정된 경우 VitePress 테마; `docsOutput.style`가 `"fumadocs"`인 경우 Fumadocs `meta.json` / UI 카탈로그. |
| `translateJson` | 3 | `json[]` 아래의 임의의 중첩된 JSON (`translate-json`). |
| `translateSVG` | — | `.svg` 파일 번역 (최상위 `svg` 블록 필요). |

`features.translateSVG`이 true이고 최상위 `svg` 블록이 구성된 경우, `translate-svg`으로 SVG 파일을 **번역**합니다. `sync` 명령은 두 조건이 모두 충족될 때(단, `--no-svg`가 아닐 경우) 해당 단계를 실행합니다.

---

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  `t("…")` 호출을 스캔하는 디렉터리 또는 전역 패턴(현재 작업 디렉터리 기준)입니다. `src/` 또는 `["src/**/*.ts"]`와 같은 패턴을 지원합니다.
- `stringsJson`  
  마스터 카탈로그 파일의 경로입니다. `extract`에 의해 업데이트됩니다.
- `flatOutputDir`  
  로케일별 JSON 파일(`de.json` 등)이 작성되는 디렉터리입니다.
- `uiExtractor.funcNames` (또는 레거시 `reactExtractor.funcNames`)  
  스캔할 추가 함수 이름(기본값: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (또는 레거시 `reactExtractor.extensions`)  
  포함할 파일 확장자(기본값: `[".js", ".jsx", ".ts", ".tsx"]`). Astro 프론트매터 및 템플릿 표현식의 경우 `.astro`을(를) 추가합니다.
- `uiExtractor.includePackageDescription` (또는 레거시 `reactExtractor.includePackageDescription`)  
  `true` (기본값)인 경우, `extract`은(는) 존재하는 경우 `package.json` `description`을(를) UI 문자열로도 포함합니다.
- `uiExtractor.packageJsonPath` (또는 레거시 `reactExtractor.packageJsonPath`)  
  선택적 설명 추출에 사용되는 `package.json` 파일의 사용자 지정 경로입니다.
- `uiExtractor.includeUiLanguageEnglishNames` (또는 레거시 `reactExtractor.includeUiLanguageEnglishNames`)

`true`(기본값 `false`)인 경우, `extract`는 번들된 ui-languages 마스터 카탈로그(`sourceLocale` + `targetLocales`로부터 빌드됨)의 각 `englishName`를 소스 스캔에서 이미 존재하지 않는 한(동일한 해시 키) `strings.json`에 추가합니다. `languagesManifestPath`는 읽지 않습니다.

---

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite 캐시 디렉터리(모든 `docs` 블록에서 공유). 기본값 `.translation-cache`. 여러 실행에서 재사용합니다. 사용자 지정 문서 번역 캐시에서 마이그레이션하는 경우, 아카이브하거나 삭제하십시오. `cacheDir`는 자체 SQLite 데이터베이스를 생성하며 다른 스키마와 호환되지 않습니다.

<a id="best-practice-for-git-exclusions"></a>
#### git 제외를 위한 모범 사례:

- 번역 캐시 폴더의 내용을 제외하세요(예: `.gitignore` 또는 `.git/info/exclude` 사용). 임시 캐시 아티팩트를 커밋하는 것을 방지할 수 있습니다.
- `cache.db`는 유지하세요(정기적으로 삭제하지 마세요). SQLite 캐시를 보존하면 변경되지 않은 세그먼트를 다시 번역하지 않아도 되므로, `ai-i18n-tools`를 사용하는 소프트웨어를 업데이트하거나 수정할 때 실행 시간과 API 비용을 절약할 수 있습니다.
- 백업 및 디버그 관련 파일이 커밋되는 것을 방지하기 위해 임시 파일과 로그 파일도 제외하세요.

<br/>

**예시:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

---

<a id="docs"></a>
### `docs`

문서 파이프라인 블록 배열. `translate-docs` 및 `sync`의 문서 단계는 각 블록을 순서대로 **처리합니다**. 레거시 키는 로드 시 여전히 허용되며 구성 파일을 쓸 수 있을 때 다시 작성됩니다. 새 구성에서는 현재 이름을 선호합니다.

| 레거시 키 | 현재 키 / 동작 |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| 최상위 `openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | 제거됨(`docs[].docusaurusCatalogDir` 또는 `json[]` 사용) |
| `features.extractUIStrings` | 제거됨(`extract`은 UI 번역 전에 실행됨) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor`(별칭은 여전히 허용됨) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**콘텐츠 소스**

- `description`
이 블록에 대한 선택적 인간이 읽을 수 있는 메모(번역에는 사용되지 않음). 설정 시 `translate-docs` `🌐` 제목 앞에 접두사로 붙으며, `status` 섹션 헤더에도 표시됩니다.
- `contentPaths`
번역할 Markdown/MDX 페이지 본문 및 `.astro` 템플릿(`translate-docs`는 `.md`, `.mdx`, `.astro`를 검색함). **디렉터리 경로 또는 glob 패턴**을 지원합니다(예: `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). 이곳이 현지화된 문서 본문의 출처입니다.
- `sourceFiles`
로드 시 `contentPaths`에 병합되는 선택적 별칭입니다.
- `targetLocales`
이 블록에만 적용되는 선택적 로케일 하위 집합(그렇지 않으면 루트 `targetLocales` 사용). 유효한 문서 로케일은 모든 블록의 합집합입니다.
- `docusaurusCatalogDir`
선택 사항입니다. 이 블록에 대한 Docusaurus JSON 레이블 카탈로그의 소스 디렉터리(예: `docusaurus write-translations`의 `"i18n/en"`). 페이지 본문은 항상 `contentPaths`에서 가져옵니다. `docusaurusCatalogDir`는 셸/UI JSON만 제공하며 MDX는 제공하지 않습니다.
- `nextraMetaGlob`
`docsRoot` 아래 Nextra `_meta.ts` / `_meta.tsx` / `_meta.js`에 대한 선택적 glob입니다. `docsOutput.style`이 `"nextra"`이고 이 항목이 생략되면 `docsRoot` 아래의 모든 `_meta` 파일이 자동으로 수집됩니다.
- `nextraMetaTranslatableKeys`
Nextra `_meta` 개체에서 문자열 값이 번역되는 선택적 속성 이름(기본값: `title`, `display`, `breadcrumb`).
- `nextraDictionaryPath`
선택적 영어 Nextra 테마 사전 모듈(예: `"app/_dictionaries/en.ts"`). `translate-docs` 중에 `{dir}/{locale}.ts`로 번역됩니다.
- `nextraDictionaryOutputTemplate`
로케일 사전 모듈에 대한 선택적 출력 템플릿(기본값: 사전 디렉터리를 기준으로 `{dir}/{locale}.ts`).

**출력 레이아웃**

- `outputDir`
이 블록에 대한 번역된 출력의 루트 디렉터리입니다.
- `docsOutput.style`
`"nested"`(기본값), `"flat"`, `"doc-system"` 또는 별칭 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`.
- `docsOutput.localeSubpath`
`doc-system`에 대한 `{locale}/`과 `{relativeToDocsRoot}` 사이의 경로 세그먼트(`style: "doc-system"`을 직접 사용하는 경우 필수, 별칭을 사용하는 경우 사전 설정). Starlight 스타일 로케일 폴더에는 `""`를 사용합니다.
- `docsOutput.docsRoot`
Docusaurus 레이아웃의 소스 문서 루트(예: `"docs"`). 생략 시 기본값은 `"docs"`입니다.
- `docsOutput.pathTemplate`
사용자 지정 마크다운 출력 경로. 자리 표시자: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
레이블 파일에 대한 사용자 지정 JSON 출력 경로. `pathTemplate`와 동일한 자리 표시자를 지원합니다.
- `docsOutput.localePathLowercase`
`true`인 경우, 내장 출력 레이아웃(`nested`, `flat`, `doc-system` (`pathTemplate` 없음))은 경로에 소문자 로케일 세그먼트를 사용합니다. 기본값은 `false`입니다. `astro-starlight` 및 `doc-system`은 빈 `localeSubpath`와 함께 구성 로드 시 기본값으로 `true`을 사용합니다.
- `docsOutput.flatPreserveRelativeDir`
`docsOutput.style = "flat"`인 경우, 동일한 기본 이름을 가진 파일이 충돌하지 않도록 소스 하위 디렉터리를 유지합니다. 기본값은 `false`입니다.
- `docsOutput.rewriteRelativeLinks`
번역 후 상대 링크를 재작성합니다(`docsOutput.style = "flat"`이고 사용자 지정 `pathTemplate`가 없을 때 자동으로 활성화됨).
- `docsOutput.linkRewriteDocsRoot`
플랫 링크 재작성 접두사를 계산할 때 사용되는 저장소 루트입니다. 번역된 문서가 다른 프로젝트 루트 아래에 있지 않은 한 일반적으로 `"."`로 두십시오.
- `docsOutput.rewriteVitepressLinks`
`true`일 때, 번역 후 VitePress 링크 정규화기를 실행합니다. `docsOutput.style`이 `"vitepress"`일 때 기본적으로 활성화됩니다. 로케일 폴더가 `docsRoot` 아래의 영어 폴더 옆에 있는 모든 `doc-system` 레이아웃과 함께 사용하십시오. README 스타일의 `docs/guide/…` 경로를 사이트 라우트(`/guide/…`) 및 로케일 상대 `../guide/…` 링크로 재작성합니다. VitePress 트리 외부의 저장소 파일에 대한 링크(`LICENSE`, `examples/`)의 경우, 영어 소스에 전체 URL을 사용하십시오 — [VitePress 통합 — 문서 홈페이지로서의 README](/ko/guide/integrations/vitepress#readme-as-homepage)를 참조하십시오.
- `docsOutput.rewriteNextraLinks`
`true`일 때, 번역 후 Nextra 링크 정규화기를 실행합니다. `docsOutput.style`이 `"nextra"`일 때 기본적으로 활성화됩니다. Next.js `i18n`을 위해 `content/en/…` 및 상대 `.mdx` 경로를 로케일 중립적인 사이트 라우트(`/guide/…`)로 재작성합니다. [Nextra 통합 — 링크 규칙](/ko/guide/integrations/nextra#link-conventions)을 참조하십시오.
- `docsOutput.fumadocsParser`
`"dot"` (기본값) 또는 `"dir"`. Dot은 영어 소스 옆에 `stem.{locale}.mdx`을 작성하고, dir은 Nextra처럼 로케일 폴더를 작성합니다. [Fumadocs 통합 — 페이지 레이아웃](/ko/guide/integrations/fumadocs#page-layout)을 참조하십시오.
- `docsOutput.rewriteFumadocsLinks`
`true`일 때, 번역 후 Fumadocs 링크 정규화기를 실행합니다. `docsOutput.style`이 `"fumadocs"`일 때 기본적으로 활성화됩니다. 콘텐츠 경로와 상대 `.mdx` 링크를 `/docs/…` 라우트로 재작성합니다.
- `docsOutput.fumadocsUiCatalog`
선택 사항. `translate-docs` 내부의 Fumadocs UI 재정의 카탈로그 부트스트랩 + 번역입니다. 필드: `sourcePath` (예: `lib/layout.shared.ts`), `catalogPath` (생성된 영어 JSON), 선택적 `outputPathTemplate` (기본값: `catalogPath` 옆의 `ui.{locale}.json`).
- `docs[].fumadocsMetaGlob`
`docsOutput.style`이 `"fumadocs"`일 때 `meta.json` 컬렉션에 대한 선택적 glob입니다. 기본값: `docsOutput.docsRoot` 아래의 재귀적 `meta.json`.
- `docs[].fumadocsMetaTranslatableKeys`
Fumadocs `meta.json`에서 문자열 값이 번역되는 속성 이름(기본값: `title`, `description`).
- `docsOutput.vitepressThemeCatalog`
선택 사항입니다. `translate-docs` 내의 VitePress 테마/탐색/사이드바 카탈로그 부트스트랩 + 번역. 필드: `configPath`(테마 문자열이 있는 VitePress 구성), `catalogPath`(생성된 영어 중첩 JSON), 선택 사항인 `outputPathTemplate`(기본값: `catalogPath` 옆의 `theme.{locale}.json`).

**후처리**

- `docsOutput.postProcessing`
번역된 **마크다운 본문**에 대한 선택적 변환입니다 (YAML 키와 비산문 프론트 매터 값은 보존됩니다). 세그먼트 재조립 및 링크 재작성(flat 또는 VitePress) 이후, `addFrontmatter` 이전에 실행됩니다.
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }`의 정렬된 목록입니다. `search`는 정규식 패턴입니다 (일반 문자열은 플래그 `g`를 사용하거나 `/pattern/flags`를 사용합니다). `replace`는 `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`와 같은 플레이스홀더를 지원합니다.
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — 소스 및 번역된 마크다운에서 제한된 "다른 언어로 읽기" 링크 행을 재생성합니다. `label: "local"`일 때 고유어 라벨을 위해 `languagesManifestPath`(또는 `ui.flatOutputDir/ui-languages.json`의 매니페스트)가 필요합니다.

**동작 및 메타데이터**

- `translateFrontmatterFields`
`docsOutput`와 동일한 수준입니다 (`docs[]` 블록당). 기본 `true`: Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next` 레이블)에 대한 사용자 대면 YAML 산문을 번역합니다. 전체 프런트 매터 블록을 변경하지 않으려면 `false`로 설정하십시오. 특정 점 경로로 제한하려면 문자열 배열을 전달하십시오.
- `segmentSplitting`
`docsOutput`와 동일한 수준입니다 (`docs[]` 블록당). `translate-docs` 추출을 위한 선택적 세분화된 세그먼트: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. `enabled`가 `true`일 때 (`segmentSplitting`가 생략된 경우 기본값), 밀집된 단락, GFM 파이프 테이블 (첫 번째 청크에는 헤더, 구분 기호 및 첫 번째 데이터 행이 포함됨), 긴 목록이 분할됩니다. 하위 부분은 단일 줄 바꿈 (`tightJoinPrevious`)으로 다시 결합됩니다. 공백으로 구분된 본문 블록당 하나의 세그먼트만 사용하려면 `"enabled": false`으로 설정하십시오. `qualityRetrySplit`이 `true`일 때 (기본값), 모든 모델이 소진된 후 AST 유효성 검사에 실패한 마크다운 세그먼트는 점진적으로 분할되고 첫 번째 모델부터 다시 시도됩니다. `maxQualityRetrySplitDepth` (기본값 `3`)는 재귀 분할을 제한합니다.
- `warnMarkdownSourceIssues`
`true`일 때 (생략된 경우 기본값), 각 `translate-docs` 실행은 위험한 구분 기호/닫히지 않은 인라인 코드를 위해 마크다운 세그먼트를 다시 스캔하고, 터미널 경고를 인쇄하며, 해당 파일의 캐시 파일 경로에 대한 `markdown_source_issues` 행을 바꿉니다. 이 블록에 대한 경고 및 SQLite 업데이트를 건너뛰려면 `false`로 설정하십시오.
- `addFrontmatter`
`true`일 때 (생략된 경우 기본값), 번역된 마크다운 파일에는 YAML 키: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`가 포함되며, 하나 이상의 세그먼트에 모델 메타데이터가 있는 경우 `translation_models` (활성 공급자의 모델 ID 정렬 목록)가 포함됩니다. 건너뛰려면 `false`로 설정하십시오.
- `emphasisPlaceholders`
`docs[]` 블록당. `true`일 때, 번역 전에 마크다운 강조 구분 기호를 플레이스홀더로 마스킹합니다. CJK 로케일 (`zh`, `ja`, `ko`) 및 `rtlLocales`에 나열된 로케일의 경우 기본값은 `true`입니다. 그렇지 않으면 기본값은 `false`입니다. CLI `--emphasis-placeholders` / `--no-emphasis-placeholders`를 통해 재정의할 수 있습니다.
- `rtlLocales`
강조 플레이스홀더 기본값에 대해 RTL로 처리되는 BCP-47 코드의 선택적 배열 (내장 RTL 감지와 병합됨).

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
선택 사항입니다. **따옴표로 묶인 문자열 값**이 번역기로 전송되지 않아야 하는 추가 JSX/HTML 속성 이름입니다. 기본 제공되는 기본값(`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, 대부분의 `aria-*` 등)과 병합됩니다. 대소문자 구분 없음. 다음에 적용됩니다.

- `.astro` 정적 HTML 태그 및 `attr=` 내부의 `{expression}` 블록에서 문자열 리터럴을 추출하여 치환하는 경우.
  - 마크다운/Astro 세그먼트 번역 중 MDX 플레이스홀더 추출 (대문자 JSX 태그의 `label`, `tooltip`, `aria-label` 및 해당되는 경우 `TabItem` `value`).

예: `"protectAttributes": ["variant", "size"]`은(는) `variant="primary"` 내부의 `{items.map(...)}`이(가) 여러 로케일에서 변경되지 않도록 유지합니다.

번역 가능한 속성(예: `"title"` 또는 `"aria-label"`)을 영어에서 그대로 복사하고자 할 때 이 목록에 포함시킬 수 있습니다.

- `protectKeys`
선택 사항입니다. 템플릿 `{expression}` 블록 및 MDX 객체 리터럴 내부(예: `label:` 내부의 `<Tabs values={[ … ]}>`)에서 따옴표로 묶인 문자열 값이 번역되어서는 안 되는 추가 **객체 속성 이름**입니다. 기본 제공되는 기본값(`class`, `key`, `id`, `href`, `src` 등)과 병합됩니다. 대소문자 구분 없음.

예: `"protectKeys": ["slug", "code"]`은(는) `{ slug: 'getting-started', title: 'Getting started' }`을(를) 건너뜁니다 → `slug`이(가) 보호된 상태에서 `title`만 번역됩니다.

<br/>

**예시(`docsOutput.style = "flat"` — 스크린샷 경로 + 선택적 언어 목록 래퍼):**

<details>
<summary>평면 레이아웃 postProcessing 예제(스크린샷 + languageListBlock)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

---

<a id="json"></a>
### `json`

중첩된 JSON 번역 파이프라인의 최상위 배열입니다. `features.translateJson`가 true일 때만 사용됩니다(`translate-json` 또는 `sync`의 JSON 단계). [JSON](/ko/guide/json)을 참조하세요.

| 필드 | 설명 |
|-------|-------------|
| `description` | CLI / `status`용 선택적 메모(번역되지 않음). |
| `contentPaths` | 프로젝트 루트 내의 소스 `.json` 파일, 디렉터리 또는 glob 패턴. |
| `outputPathTemplate` | 대상 로케일별 필수 출력 경로. 자리표시자: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | 이 블록에 대한 선택적 하위 집합. 생략 시 루트 `targetLocales` 사용. |
| `keyPolicy.mode` | `allowlist`, `denylist` 또는 `both`. |
| `keyPolicy.translateKeys` | mode가 `allowlist` 또는 `both`일 때 포함할 도트 경로 / glob 패턴. |
| `keyPolicy.skipKeys` | 제외할 도트 경로 / glob 패턴(기본 denylist에는 `id`, `slug`, `href`, `url`, `key`, `code` 포함). |

---

<a id="svg"></a>
### `svg`

SVG 파일의 최상위 경로 및 레이아웃입니다. `features.translateSVG`이 true일 때만 번역이 실행됩니다(`translate-svg` 또는 `sync`의 SVG 단계를 통해).

| 필드            | 설명                                                                                                                                                                                                                                                        |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 하나 이상의 디렉터리 **또는 glob 패턴** (예: `"images/*.svg"`, `"**/icons/*.svg"`). 패턴은 프로젝트 루트를 기준으로 상대적으로 해석되며, `.svg` 파일을 재귀적으로 검색합니다.                                                                         |
| `outputDir`                   | 번역된 SVG 출력의 루트 디렉터리입니다.                                                                                                                                                                                                                                          |
| `style`                       | `pathTemplate`이 설정되지 않은 경우 `"flat"` 또는 `"nested"`입니다.                                                                                                                                                                                                                               |
| `pathTemplate`   | 사용자 지정 SVG 출력 경로. 사용 가능한 자리 표시자: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | `true`인 경우, 기본 제공 `flat` / `nested` SVG 레이아웃은 소문자 로케일 세그먼트를 사용합니다. 사용자 지정 `pathTemplate` 값은 변경되지 않으며, 소문자 세그먼트가 필요한 경우 `{llocale}`을(를) 사용하십시오. |
| `forceLowercase` | SVG 재조합 시 소문자로 변환된 텍스트입니다. 모두 소문자 레이블에 의존하는 디자인에 유용합니다.                                                                                                                                                                                |

---

<a id="glossary"></a>
### `glossary`

| 필드          | 설명                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 기존 번역을 기반으로 용어집을 자동 생성하는 `strings.json` 파일의 경로입니다.                                                                                                 |
| `userGlossary` | 열이 `Original language string`(또는 `en`), `locale`, `Translation`인 CSV 파일의 경로 - 각 원본 용어와 대상 로케일에 해당하는 행 하나씩 포함 (`locale`는 모든 대상에 대해 `*`일 수 있음). |
| `autoAddUserEditedToGlossary` | `true`일 때, UI 문자열에 대한 대시보드 편집 내용을 사용자 용어집에 자동으로 추가할 수 있습니다. |

**빈 용어집 CSV 생성:**

```bash
npx ai-i18n-tools glossary-generate
```
