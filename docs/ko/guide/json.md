<a id="json"></a>
# JSON

UI 복사본을 소스에서 `t("…")` 대신 **로케일별 중첩 JSON 파일**(예: `src/i18n/en/translation.json`)에 보관하는 프로젝트용으로 설계되었습니다. CLI는 해당 파일의 문자열 값을 탐색하고, 활성 LLM 공급자를 통해 번역하며, `json[].outputPathTemplate`를 사용하여 로케일별 출력을 작성합니다. `translate-docs` 및 `translate-svg`(`cacheDir`)와 동일한 SQLite 캐시를 사용합니다.

이 파이프라인은 **작동하지** 않습니다 `extract` — `strings.json` 카탈로그가 없습니다. `features.translateJson`로 활성화하고 최상위 `json[]`에 하나 이상의 항목을 추가하세요.

<a id="step-1-initialise-for-nested-json"></a>
### 1단계: 중첩된 JSON 초기화

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

해당 템플릿은 `features.translateJson: true`을 설정하고, UI 추출 및 문서 번역을 비활성화하며, `src/i18n/en/translation.json`를 가리키고 출력은 `src/i18n/{llocale}/translation.json`인 단일 `json[]` 블록을 스캐폴드합니다. 저장소 구조에 맞게 `sourceLocale`, `targetLocales`, `contentPaths`, `outputPathTemplate`을 편집하세요.

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
npx ai-i18n-tools translate-json
```

선택적 플래그 (`translate-docs`과 동일한 개념): `-l` / `--locale`는 대상 하위 집합에 사용, `-p` / `--path`는 파일 제한에 사용, `--dry-run`, `--force` (일치하는 파일의 파일 추적 및 세그먼트 캐시 지우기), `--force-update` (파일 해시가 일치할 때 다시 처리; 세그먼트 캐시는 여전히 적용됨), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

JSON 전용 프로젝트는 다음을 실행할 수 있습니다:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

UI 또는 문서도 활성화된 경우, `sync`은(는) **translate-docs 이후 translate-json**을 실행합니다 (`--no-json`이(가) 설정되지 않은 경우). `--no-json`를 사용하여 JSON을 건너뛸 수 있습니다.

파일 및 로케일별 커버리지를 확인하세요:

```bash
npx ai-i18n-tools status
```

`translateJson`이 켜져 있을 때, `status`은 `json[]` 섹션을 출력합니다 (✓ 최신 상태, ● 오래되거나 누락됨).

<a id="json-vs-other-pipelines"></a>
### JSON과 다른 파이프라인

| 상황 | 사용 |
|-----------|-----|
| JS/TS/Astro의 `t("…")` / `i18n.t("…")`에 있는 UI 문자열 | [UI 문자열](/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations` 카탈로그 (`{ "key": { "message": "…", "description": "…" } }`) | 문서 — `docs[].docusaurusCatalogDir` + `translate-docs`, **아님** `json[]` |
| VitePress 테마/탐색/사이드바 JSON (작성하는 중첩 카탈로그) | JSON — `json[]` + `translate-json`; 페이지 본문은 문서에 유지됩니다 — [VitePress 통합](/guide/vitepress-integration) 참조 |
| 독립형 중첩 로케일 JSON (ZenBrowser 스타일 `translation.json` 트리) | JSON — `json[]` + `translate-json` |
| `<text>` / `<title>` / `<desc>`가 포함된 그림 `.svg` 파일 | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (선택 사항, 세 가지 주요 파이프라인 중 하나가 아님) |

필드 참조: [구성 참조](/reference/configuration#json)의 [`json`](#json). 정리를 위한 캐시 키는 `file_tracking`에서 `json-block:{blockIndex}:{projectRelPath}`을 사용합니다.
