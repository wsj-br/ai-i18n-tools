<a id="json"></a>
# JSON

대상: 로케일별로 중첩된 JSON 파일(예: `src/i18n/en/translation.json`)에 이미 텍스트를 보관하고 있으며 해당 레이아웃을 유지하려는 프로젝트입니다. 소스에 일반 텍스트가 있고 아직 `t()`이(가) 없는 경우, 대신 [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js)에서 시작하세요.

CLI는 해당 파일의 문자열 값을 순회하며 활성 LLM 제공업체의 모델로 번역하고, `json[].outputPathTemplate`을(를) 사용하여 로캘별 출력을 작성합니다. `translate-docs` 및 `translate-svg`와(과) 동일한 SQLite 캐시(`cacheDir`)를 사용합니다.

이 파이프라인은 **작동하지** 않습니다 `extract` — `strings.json` 카탈로그가 없습니다. `features.translateJson`로 활성화하고 최상위 `json[]`에 하나 이상의 항목을 추가하세요.

<a id="per-locale-model-overrides"></a>
### 로케일별 모델 재정의

`translate-json`은(는) **대상 로케일별로** 모델을 확인합니다. 구성된 경우 `localeModels(locale)`을(를) 먼저 확인하고, 그다음 `translationModels`를 확인합니다. 예를 들어 `zh-Hans` / `zh-Hant` 테마 파일과 같이 특정 로케일에서 전용 모델을 사용하는 것이 유리한 중첩된 JSON 번들에 이 기능을 사용하세요. [AI 모델](/ko/guide/ai-models#model-fallback-chain)을 참조하세요.

<a id="step-1-initialise-for-nested-json"></a>
### 1단계: 중첩된 JSON 초기화

```bash
ai-i18n-tools init -t ui-json-bundles -P ollama
```

해당 템플릿은 `features.translateJson: true`을(를) 설정하고, UI 추출 및 문서 번역을 비활성화하며, 출력 `src/i18n/{llocale}/translation.json`과 함께 `src/i18n/en/translation.json`를 가리키는 단일 `json[]` 블록을 스캐폴드합니다. 또한 `-P`으로 전달하는 사전 설정에 대한 `provider` / `providers` 블록을 포함합니다. `translate-json` 또는 `sync`을(를) 실행하기 전에 일치하는 API 키를 설정하거나 (로컬 Ollama를 사용하세요). 자세한 내용은 [공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요. 저장소 레이아웃에 맞게 `sourceLocale`, `targetLocales`, `contentPaths`, `outputPathTemplate`를 편집하세요.

<a id="step-2-configure-json"></a>
### 2단계: `json[]` 구성

각 `json[]` 블록은 하나의 파이프라인을 설명합니다:

- `contentPaths` — 하나 이상의 `.json` 파일, 디렉터리 또는 glob (예: `"src/i18n/en/translation.json"` 또는 `"src/i18n/en/overrides/*.json"`). 경로는 프로젝트 루트에서 해석됩니다.
- `outputPathTemplate` — 필수 항목. 각 대상 로케일 파일을 어디에 작성할지 지정합니다. 사용 가능한 자리표시자: `{locale}`, `{LOCALE}`, `{llocale}` (소문자 로케일, Astro 라우트 폴더에 유용), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (선택 사항) — 이 블록에만 적용되는 하위 집합. 그렇지 않으면 최상위 `targetLocales`이 적용됩니다.
- `keyPolicy` — 번역 가능한 문장과 안정적인 식별자 중 어떤 JSON 키가 포함되어 있는지 지정합니다 (아래 참조).
- `description` (선택 사항) — CLI 헤더 및 `status` 출력에 표시됩니다.

예시 (여러 소스 파일, 소문자 로케일 폴더):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | 동작 |
|-------------|-----------|
| `allowlist` | `translateKeys`와 일치하는 키만 번역합니다 (도트 경로; minimatch glob). |
| `denylist`  | `skipKeys`와 일치하는 키를 제외한 모든 문자열 값을 번역합니다. |
| `both`      | 먼저 `translateKeys`을 적용한 후 `skipKeys`와 일치하는 항목을 제거합니다. |

경로는 도트 표기법을 사용합니다 (`nav.home.label`). `slug`과 같은 단순 이름은 깊이에 관계없이 마지막 키 세그먼트와 일치합니다.

<a id="step-3-translate-json-bundles"></a>
### 3단계: JSON 번들 번역

```bash
ai-i18n-tools translate-json
```

선택적 플래그(`translate-docs`과 동일한 개념): 타겟 하위 집합에 대한 `-l` / `--locale`, 파일 제한을 위한 `-p` / `--path`, `--dry-run`, `--force` (일치하는 파일의 파일 추적 및 세그먼트 캐시 지우기), `--force-update` (파일 해시가 일치할 때 재처리; 세그먼트 캐시는 여전히 적용됨), `--check-cache` (파일 추적이 일치하더라도 네이티브 스크립트가 적용된 로케일의 캐시된 세그먼트 재검증), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

JSON 전용 프로젝트는 다음을 실행할 수 있습니다:

```bash
ai-i18n-tools sync --no-ui --no-svg --no-docs
```

UI 또는 문서도 활성화된 경우, `sync`은(는) **translate-docs 이후 translate-json**을 실행합니다 (`--no-json`이(가) 설정되지 않은 경우). `--no-json`를 사용하여 JSON을 건너뛸 수 있습니다.

파일 및 로케일별 커버리지를 확인하세요:

```bash
ai-i18n-tools status
```

`translateJson`이 켜져 있을 때, `status`은 `json[]` 섹션을 출력합니다 (✓ 최신 상태, ● 오래되거나 누락됨).

<a id="json-vs-other-pipelines"></a>
### JSON과 다른 파이프라인

| 상황 | 사용 |
|-----------|-----|
| JS/TS/Astro의 `t("…")` / `i18n.t("…")`에 있는 UI 문자열 | [UI 문자열](/ko/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations` 카탈로그 (`{ "key": { "message": "…", "description": "…" } }`) | 문서 — `docs[].docusaurusCatalogDir` + `translate-docs`, **아님** `json[]` |
| VitePress 테마/네비게이션/사이드바 문자열 | 문서 — `docsOutput.vitepressThemeCatalog` + `translate-docs`; `json[]`를 **사용하지 마세요** — [VitePress 통합](/ko/guide/integrations/vitepress) 참조 |
| Nextra `_meta.ts` 라벨 및 테마 사전 `.ts` | 문서 — `translate-docs` (`style: "nextra"`일 때 자동 `_meta`, 선택적 `nextraDictionaryPath`); `json[]`를 **사용하지 마세요** — [Nextra 통합](/ko/guide/integrations/nextra) 참조 |
| Fumadocs `meta.json` 라벨 및 UI 오버라이드 카탈로그 | 문서 — `translate-docs` (`style: "fumadocs"`일 때 자동 `meta.json`, 선택적 `fumadocsUiCatalog`); `json[]`를 **사용하지 마세요** — [Fumadocs 통합](/ko/guide/integrations/fumadocs) 참조 |
| 독립형 중첩 로케일 JSON (ZenBrowser 스타일 `translation.json` 트리) | JSON — `json[]` + `translate-json` |
| i18next 네임스페이스 파일 (`public/locales/en/common.json`, <code v-pre>{{name}}</code> 토큰, `key_one` / `key_other` 접미사) | JSON — `json[]` + `translate-json` ([i18next 네임스페이스 파일](#i18next-namespace-files) 참조) |
| Intlayer `*.content.ts` 사전 + `useIntlayer`(Intlayer에서 마이그레이션) | [Intlayer에서 마이그레이션](/ko/guide/migrating-from-intlayer) — `migrate-intlayer` 후 UI 문자열 |
| Intlayer `*.content.ts` 사전(Intlayer 유지, 번역 채우기) | [Intlayer 바로 번역](/ko/guide/translating-intlayer) — `translate-intlayer` |
| `<text>` / `<title>` / `<desc>`가 포함된 그림 `.svg` 파일 | `features.translateSVG` + [`svg`](/ko/reference/configuration#svg) + `translate-svg` (선택 사항, 세 가지 주요 파이프라인 중 하나가 아님) |

필드 참조: [구성 참조](/ko/reference/configuration#json)의 [`json`](#json). 정리를 위한 캐시 키는 `file_tracking`에서 `json-block:{blockIndex}:{projectRelPath}`을 사용합니다.

<a id="i18next-namespace-files"></a>
### i18next 네임스페이스 파일

JSON 파이프라인은 중첩된 객체, 문자열 배열, 값의 <code v-pre>{{name}}</code> 보간, 독립적인 복수형 접미사 키(`welcome_one`, `welcome_other`)와 같은 일반적인 i18next 키/값 로캘 파일을 지원합니다. `t("some.key")` 호출 사이트는 다시 작성하지 **않으며** 키 기반으로 유지됩니다. 프로젝트를 ai-i18n-tools의 소스 문자열 `t()` 스키마로 옮기려면 호출 사이트를 `t("source text")`로 변경하세요. 텍스트는 `sourceLocale`로 작성되며, 이는 모든 언어가 될 수 있습니다. 소스가 Intlayer `.content.ts`인 경우 `migrate-intlayer`을(를) 실행하세요. Intlayer를 유지하고 사전만 번역하려면 [`translate-intlayer`](/ko/guide/translating-intlayer)을(를) 사용하세요.

예시 (`public/locales/en/` 아래의 소스 영어 네임스페이스):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": { "translateJson": true },
  "json": [
    {
      "description": "i18next namespaces",
      "contentPaths": ["public/locales/en/*.json"],
      "outputPathTemplate": "public/locales/{locale}/{basename}"
    }
  ]
}
```

`key_one` / `key_other` / `key_zero` (및 기타 CLDR 접미사)는 별도의 리프로 번역됩니다. 이는 i18next가 접미사로 복수형을 계속 해석하기에 충분하며, 파이프라인은 이를 단일 카탈로그 행으로 재그룹화하지 않습니다.
