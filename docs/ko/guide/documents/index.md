<a id="documents"></a>
# 문서

주로 **마크다운, MDX, `.astro` 문서**용으로 설계되었으며, `docs[]` 구성 블록**을 통해 관리됩니다. 각 블록의 `contentPaths` 필드에는 번역할 파일 또는 폴더가 나열됩니다.

[Docusaurus](/ko/guide/integrations/docusaurus) 사이트에서는 `docusaurusCatalogDir`를 `write-translations` 카탈로그 폴더(예: `docs-site/i18n/en`)로도 설정하세요. 그러면 `translate-docs`가 navbar, footer, 테마 문자열 등 shell JSON도 함께 포함합니다.

[VitePress](/ko/guide/integrations/vitepress) 사이트에서는 페이지 본문이 동일한 `docs[]` 파이프라인을 사용합니다. Nav, sidebar, footer 레이블은 `docsOutput.vitepressThemeCatalog`에 있습니다 — `translate-docs`가 영어 카탈로그를 부트스트랩하고 페이지와 함께 번역하므로 별도의 파이프라인이 필요 없습니다.

[Nextra](/ko/guide/integrations/nextra) 사이트에서는 페이지 본문이 `docsOutput.style: "nextra"`과(와) 함께 동일한 `docs[]` 파이프라인을 사용합니다. `_meta.ts` 사이드바 레이블은 `translate-docs`에 의해 자동으로 수집 및 번역되며, 테마 사전 문자열은 동일한 파이프라인에서 `docs[].nextraDictionaryPath`를 통해 번역됩니다.

[Fumadocs](/ko/guide/integrations/fumadocs) 사이트에서는 페이지 본문이 `fumadocsParser` `"dot"`(기본값) 또는 `"dir"`과(와) 함께 `docsOutput.style: "fumadocs"`를 사용합니다. `meta.json` 사이드바 레이블은 자동으로 수집되며, UI 재정의는 `docsOutput.fumadocsUiCatalog`를 통해 번역됩니다.

[Astro Starlight](/ko/guide/integrations/astro#astro-starlight) 사이트에서는 페이지 본문이 Starlight 콘텐츠 루트(일반적으로 `src/content/docs/`)의 `docsRoot`와 함께 `docsOutput.style: "astro-starlight"`를 사용합니다. `translate-docs`는 영어 트리 옆 `src/content/docs/<locale>/` 아래에 현지화된 markdown/MDX를 작성합니다. Starlight는 많은 로케일에 대해 내장 UI 문자열을 제공하므로 별도의 테마 카탈로그 파이프라인이 필요 없습니다. 선택적 UI 재정의는 `src/content/i18n/en.json`에 대해 `docs[]` 블록에서 `jsonPathTemplate`를 사용할 수 있습니다.

마크다운에 포함된 PNG 및 기타 래스터 이미지에 대해서는 [이미지 및 스크린샷](/ko/guide/images-and-screenshots/)을 참조하십시오. `translate-docs`는 alt 텍스트만 번역하며 래스터 파일을 복사하지 않습니다.

README나 문서에서 선택적 **언어 전환기** 블록을 사용하려면 `docsOutput.style`를 `"flat"`로 설정하세요 — [언어 전환기](/ko/guide/documents/language-switcher)를 참조하세요.

[SVG](/ko/guide/svg-translation/) 파일은 `features.translateSVG`가 활성화된 경우 [`translate-svg`](/ko/reference/cli-commands/content#translate-svg)를 통해 번역됩니다 — `docs[]` / `contentPaths`를 통하지 않습니다.

문서 프레임워크의 셸/테마 문자열과 관련 없는 임의의 중첩된 UI JSON 번들은 `docs[]`이 아닌 [JSON](/ko/guide/json) 파이프라인에 속합니다.

UI와 문서 간 **용어 일관성**을 위해 `glossary.uiGlossary`를 `strings.json` 경로로 설정하세요 — `translate-docs`는 세그먼트에 일치하는 용어가 나타날 때 LLM 프롬프트의 힌트로 기존 UI 번역을 재사용합니다. 선택적 `glossary.userGlossary`은 제품 용어에 대한 CSV 재정의를 추가합니다(`translate-ui` 및 `proofread-ui`와 공유됨). 좁은 열에 맞추기 위해 사용된 간결한 UI 라벨 약어(예: `Size` → `Tam`)는 UI 번역에는 사용할 수 있지만 문서 용어집 힌트에서는 생략됩니다. `glossary-generate`로 시작 CSV를 생성하고, Translation Dashboard **Glossary** 탭에서 행을 편집하거나 [Configuration — `glossary`](/ko/reference/configuration#glossary) 및 [Glossary](/ko/guide/translation-dashboard/glossary)를 참조하세요.

<a id="per-locale-model-overrides"></a>
### 로케일별 모델 재정의

`translate-docs`와 `sync`의 문서 단계는 **대상 로케일별**로 모델을 결정합니다: 설정된 경우 `localeModels(locale)`가 먼저, 그 다음 provider의 글로벌 `translationModels` 체인이 적용됩니다. 특정 언어가 기본 폴백 목록과 다른 모델이 필요할 때 사용하세요 — 예를 들어, 글로벌 체인이 포르투갈어를 처리하는 데 어려움이 있을 때 `pt-BR` 문서에 Gemini를 선호하는 경우입니다. [Provider 및 모델](/ko/guide/providers-and-models#model-fallback-chain) 및 [구성 - `localeModels`](/ko/reference/configuration#provider-and-providers)을 참조하세요.

<a id="which-guide-to-read"></a>
## 어떤 가이드를 읽어야 할까요?

| 설정 | 시작하기 |
| --- | --- |
| Docusaurus 사이트 | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/ko/guide/integrations/docusaurus) |
| VitePress 사이트 | 테마용 `init -t ui-vitepress` + `vitepressThemeCatalog` - [VitePress](/ko/guide/integrations/vitepress) |
| Nextra 사이트 | 사전용 `init -t ui-nextra` + `nextraDictionaryPath` (sidebar `_meta.ts`는 자동) - [Nextra](/ko/guide/integrations/nextra) |
| Fumadocs 사이트 | UI용 `init -t ui-fumadocs` + `fumadocsUiCatalog` (sidebar `meta.json`는 자동) - [Fumadocs](/ko/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/ko/guide/integrations/astro#astro-starlight) |
| 단일 문서 (README, changelog 등) | `docsOutput.style = "flat"` - [출력 레이아웃](/ko/guide/documents/output-layouts), 선택적 [언어 전환기](/ko/guide/documents/language-switcher) |
| 번역된 파일이 저장되는 위치 | [출력 레이아웃](/ko/guide/documents/output-layouts) |
| 페이지 간 `#anchor` 링크 | [앵커 링크](/ko/guide/documents/anchor-links) |
| 링크 및 애셋 URL 재작성(`regexAdjustments`) | [링크 재작성](/ko/guide/documents/link-rewriting) |
| 문서의 스크린샷 | [이미지 및 스크린샷](/ko/guide/images-and-screenshots/) |
| 제품 용어 및 UI/문서 일관성 | [구성 — `glossary`](/ko/reference/configuration#glossary), [용어집](/ko/guide/translation-dashboard/glossary) |
| `translate-docs` 플래그 및 캐시 | [CLI 옵션](/ko/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## 1단계: 문서 초기화

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

Astro Starlight 문서 사이트의 경우:

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

VitePress 문서 사이트의 경우:

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

nav/sidebar/footer 문자열에 대해 `docsOutput.vitepressThemeCatalog`를 설정하세요 — [VitePress 통합](/ko/guide/integrations/vitepress)을 참조하세요.

Nextra 문서 사이트의 경우:

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

테마 사전 문자열에 대해 `docs[].nextraDictionaryPath`를 설정하세요 — [Nextra 통합](/ko/guide/integrations/nextra)을 참조하세요. Sidebar `_meta.ts` 레이블은 자동으로 수집됩니다.

Fumadocs 문서 사이트의 경우:

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

UI 재정의에 대해 `docsOutput.fumadocsUiCatalog`를 설정하세요 — [Fumadocs 통합](/ko/guide/integrations/fumadocs)을 참조하세요. Sidebar `meta.json` 레이블은 자동으로 수집됩니다.

일반 Astro 웹사이트 UI(스타라이트 없음)의 경우:

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

이 템플릿은 UI 추출만 활성화합니다. 페이지 HTML 번역을 위해서는 `features.translateDocs`도 설정하고 `docs[]` 블록을 추가하십시오([Astro 웹사이트 페이지(구문 분석 및 교체)](/ko/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) 참조). [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 구성은 두 파이프라인을 함께 보여줍니다.

생성된 `ai-i18n-tools.config.json`을 편집하세요:

- `provider` 및 `providers` — `init`는 기본 provider 블록을 스캐폴드합니다(`-P <provider>`를 전달하지 않으면 `openrouter`); `translate-docs` 또는 `sync` 전에 최소 하나의 provider를 구성하고 API 키를 설정하세요(Ollama는 키가 필요 없음). [Provider 및 API 키](/ko/guide/quick-start#provider-and-api-key) 및 [LLM provider 및 모델](/ko/guide/providers-and-models)을 참조하세요.
- `sourceLocale` - 소스 언어(`docusaurus.config.js`의 `defaultLocale`와 일치해야 함).
- `targetLocales` - BCP-47 로케일 코드 배열(예: `["de", "fr", "es"]`).
- `cacheDir` - 모든 파이프라인의 공유 SQLite 캐시 디렉토리(`--write-logs`의 기본 로그 디렉토리이기도 함).
- `docs` - 문서 블록 배열. 각 블록에는 선택적 `description`, `contentPaths`(문자열 또는 배열; 파일, 디렉터리 또는 glob), `outputDir`, 선택적 `docusaurusCatalogDir`, `docsOutput`, 선택적 `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` 등이 있습니다.
- `docs[].description` - 유지 관리자를 위한 선택적 짧은 메모. 설정하면 `translate-docs` 헤드라인과 `status` 섹션 헤더에 나타납니다.
- `docs[].contentPaths` - markdown/MDX/`.astro` 소스(및 Docusaurus 셸 JSON을 위한 선택적 `docusaurusCatalogDir`).
- `docs[].outputDir` - 해당 블록의 번역된 출력 루트.
- `docs[].docsOutput.style` - `"nested"` (기본값), `"flat"`, `"doc-system"`, 또는 별칭 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` ([출력 레이아웃](/ko/guide/documents/output-layouts) 참조).
- `glossary.uiGlossary` - `strings.json` 경로로, 문서 세그먼트가 UI 카탈로그에서 용어 힌트를 받습니다([구성 — `glossary`](/ko/reference/configuration#glossary) 참조).
- `glossary.userGlossary` - 고정된 제품 용어 번역을 위한 선택적 CSV; UI 파이프라인에서도 사용되며 [용어집](/ko/guide/translation-dashboard/glossary) 대시보드 탭에서 편집할 수 있습니다.

**주요 vs 보조:** 로컬화된 페이지에 대해 `contentPaths`에 집중하십시오. `docusaurusCatalogDir`을 설정하면 `write-translations`에서 Docusaurus 셸 JSON도 필요할 때입니다. 페이지만 번역하는 경우 `docusaurusCatalogDir`는 생략하십시오.

<a id="step-2-translate-documents"></a>
## 2단계: 문서 번역

```bash
ai-i18n-tools translate-docs
```

이것은 모든 `docs[]` 블록의 `contentPaths`(및 `docusaurusCatalogDir`가 설정된 경우 Docusaurus 카탈로그 JSON)에 있는 모든 파일을 모든 유효한 문서 로케일로 번역합니다. 이미 번역된 세그먼트는 SQLite 캐시에서 제공되며 - 새롭거나 변경된 세그먼트만 LLM으로 전송됩니다.

단일 로케일을 번역하려면:

```bash
ai-i18n-tools translate-docs --locale de
```

번역이 필요한 항목을 확인하려면:

```bash
ai-i18n-tools status
```

플래그, 캐시 동작 및 배치 프롬프트 형식에 대한 자세한 내용은 [CLI 옵션](/ko/guide/documents/cli-options)을 참조하십시오.

<a id="complex-markdown-and-failed-quality-checks"></a>
## 복잡한 마크다운 및 품질 검사 실패

`translate-docs`는 각 번역된 세그먼트가 마크다운 구조(문서에서 파싱된 강조 포함)를 유지하고 내부 플레이스홀더 토큰이 깔끔하게 복원되는지 확인합니다. `` `inline code` `` 주변에 여러 `bold` 스팬을 쌓거나, 굵게 안에 백틱을 중첩하거나(예: `` `fetch(\`/locales/${code}.json\`)` ``와 같은 템플릿 리터럴), 하나의 긴 문장에 굵게와 코드를 엮는 단락은 취약합니다. 일부 로캘은 다른 어순이 필요하므로, 번역 후 `**` 및 `` ` ``가 정렬되는 방식이 변경되어 `AST mismatch`과 같은 CLI 오류가 발생할 수 있습니다.

복원 후, `translate-docs`는 HTML 태그 플레이스홀더가 재사용되거나 누락된 세그먼트(따라서 복원된 태그가 소스 맵과 더 이상 일치하지 않음) 또는 모델이 소스에 없는 이중 중괄호 토큰을 새로 만들어낸 세그먼트(예: 가짜 용어집 스타일 토큰)도 거부합니다. 복원 전 검사에서는 <code v-pre>{{…}}</code> 토큰의 동일한 다중 집합과 번호가 매겨진 토큰(<code v-pre>{{HTM_N}}</code>, <code v-pre>{{URL_N}}</code>, …)의 동일한 정렬된 하위 시퀀스가 필요합니다. <code v-pre>**</code>와 같은 강조 표시는 유형별 개수가 여전히 일치하는 경우 자연스러운 어순에 따라 이동할 수 있습니다. 이러한 실패는 남은 공식 내부 토큰과 동일한 모델 폴백 경로를 사용합니다.

**이러한 종류의 유효성 검사 실패가 발생하면, 소스 언어 텍스트를 단순화하는 것을 선호하십시오** - 단락을 분할하거나, 예제를 펜스 코드 블록으로 이동하거나, 겹겨진 굵게/코드 쌍을 줄여 동일한 아이디어를 설명하십시오 - 모든 모델과 로케일이 조밀한 인라인 마크업을 완벽하게 재현할 것으로 기대하지 마십시오.

모든 구성된 모델이 동일한 세그먼트에서 `AST mismatch` 오류를 내며 실패할 경우, `translate-docs`은 해당 세그먼트를 더 작은 부분으로 자동 분할할 수 있습니다(리스트 중간부터 시작한 후, 개별 리스트 항목이나 더 짧은 단락 조각으로 나눔), 각 부분을 첫 번째 모델부터 다시 시도하고, 원래 세그먼트 캐시 키 아래에서 결과를 다시 결합합니다. 이 기능은 기본적으로 활성화되어 있습니다(`segmentSplitting.qualityRetrySplit`); 모델 소진 후 중단하려면 `false`으로 설정하십시오. 이 대체 방법이 실행될 경우 실행 요약에서 `Quality split retries`를 보고합니다.

**어떤 세그먼트가 실패했는지**, 얼마나 자주 실패했는지, 저장된 **품질/오류 메시지**를 확인하려면 번역 대시보드의 **실패** 탭([번역 대시보드 → 실패](/ko/guide/translation-dashboard/failures#failures-document-translation))을 사용하십시오.
