<a id="documents"></a>
# 문서

주로 **마크다운, MDX, `.astro` 문서**용으로 설계되었으며, `docs[]` 구성 블록**을 통해 관리됩니다. 각 블록의 `contentPaths` 필드에는 번역할 파일 또는 폴더가 나열됩니다.

Docusaurus 사이트에서는 `docusaurusCatalogDir`를 `write-translations` 카탈로그 폴더(예: `docs-site/i18n/en`)로 설정하십시오. 그러면 `translate-docs`에 셸 JSON도 포함됩니다(내비게이션 바, 푸터, 테마 문자열).

[VitePress](/guide/vitepress-integration) 사이트에서 페이지 본문은 동일한 `docs[]` 파이프라인을 사용합니다. 탐색, 사이드바 및 바닥글 레이블은 `docsOutput.vitepressThemeCatalog`에 있으며, `translate-docs`는 영어 카탈로그를 부트스트랩하고 페이지와 함께 번역하며 별도의 파이프라인은 없습니다.

[Nextra](/guide/nextra-integration) 사이트에서 페이지 본문은 `docsOutput.style: "nextra"`과 함께 동일한 `docs[]` 파이프라인을 사용합니다. `_meta.ts` 사이드바 레이블은 `translate-docs`에 의해 자동으로 수집 및 번역됩니다. 테마 사전 문자열은 동일한 파이프라인에서 `docs[].nextraDictionaryPath`를 통해 번역됩니다.

마크다운에 포함된 PNG 및 기타 래스터 이미지에 대해서는 [이미지 및 스크린샷](/guide/images-and-screenshots/)을 참조하십시오. `translate-docs`는 alt 텍스트만 번역하며 래스터 파일을 복사하지 않습니다.

README 또는 문서에 선택적 **언어 전환기** 블록을 추가하려면 `docsOutput.style`를 `"flat"`로 설정하십시오. [언어 전환기](/guide/documents/language-switcher)를 참조하십시오.

SVG 파일은 `features.translateSVG`이 활성화된 경우 [`translate-svg`](/reference/cli-commands)를 통해 번역되며, `docs[]` / `contentPaths`를 통하지 않습니다.

문서 프레임워크의 셸/테마 문자열과 관련 없는 임의의 중첩된 UI JSON 번들은 `docs[]`이 아닌 [JSON](/guide/json) 파이프라인에 속합니다.

<a id="per-locale-model-overrides"></a>
### 로케일별 모델 재정의

`translate-docs` 및 `sync`의 문서 단계는 대상 로캘**마다 모델을 해결합니다**: `localeModels(locale)`가 먼저 구성되면 공급자의 전역 `translationModels` 체인을 사용합니다. 기본 폴백 목록과 다른 모델이 필요한 특정 언어의 경우에 사용하십시오. 예를 들어, 전역 체인이 포르투갈어로 어려움을 겪을 때 Gemini를 `pt-BR` 문서에 사용하는 것을 선호하는 경우입니다. [공급자 및 모델](/guide/providers-and-models#model-fallback-chain) 및 [구성 — `localeModels`](/reference/configuration#provider-and-providers)를 참조하십시오.

<a id="which-guide-to-read"></a>
## 어떤 가이드를 읽어야 할까요?

| 설정 | 여기에서 시작 |
| --- | --- |
| Docusaurus 사이트 | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` — [1단계](#step-1-initialise-for-documentation) |
| VitePress 사이트 | 테마용 `init -t ui-vitepress` + `vitepressThemeCatalog` — [VitePress 통합](/guide/vitepress-integration) |
| Nextra 사이트 | 사전용 `init -t ui-nextra` + `nextraDictionaryPath` (사이드바 `_meta.ts`는 자동) — [Nextra 통합](/guide/nextra-integration) |
| Astro Starlight | `init -t ui-starlight` — [1단계](#step-1-initialise-for-documentation) |
| 플랫 문서(README, 변경 로그 등) | `docsOutput.style = "flat"` — [출력 레이아웃](/guide/documents/output-layouts), 선택적 [언어 전환기](/guide/documents/language-switcher) |
| 번역된 파일이 저장되는 위치 | [출력 레이아웃](/guide/documents/output-layouts) |
| 페이지 간 `#anchor` 링크 | [앵커 링크](/guide/documents/anchor-links) |
| 링크 및 애셋 URL 재작성(`regexAdjustments`) | [링크 재작성](/guide/documents/link-rewriting) |
| 문서의 스크린샷 | [이미지 및 스크린샷](/guide/images-and-screenshots/) |
| `translate-docs` 플래그 및 캐시 | [CLI 옵션](/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## 1단계: 문서 초기화

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Astro Starlight 문서 사이트의 경우:

```bash
npx ai-i18n-tools init -t ui-starlight
```

VitePress 문서 사이트의 경우:

```bash
npx ai-i18n-tools init -t ui-vitepress
```

탐색/사이드바/바닥글 문자열에 대해 `docsOutput.vitepressThemeCatalog`을(를) 설정합니다. [VitePress 통합](/guide/vitepress-integration)을(를) 참조하십시오.

일반 Astro 웹사이트 UI(스타라이트 없음)의 경우:

```bash
npx ai-i18n-tools init -t ui-astro-website
```

이 템플릿은 UI 추출만 활성화합니다. 페이지 HTML 번역을 위해서는 `features.translateDocs`도 설정하고 `docs[]` 블록을 추가하십시오([Astro 웹사이트 페이지(구문 분석 및 교체)](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace) 참조). [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 구성은 두 파이프라인을 함께 보여줍니다.

생성된 `ai-i18n-tools.config.json`을 편집하세요:

- `sourceLocale` - 소스 언어(`docusaurus.config.js`의 `defaultLocale`과 일치해야 함).
- `targetLocales` - BCP-47 로케일 코드 배열(예: `["de", "fr", "es"]`).
- `cacheDir` - 모든 파이프라인에 공유되는 SQLite 캐시 디렉터리(`--write-logs`의 기본 로그 디렉터리이기도 함).
- `docs` - 문서 블록들의 배열. 각 블록은 선택적 `description`, `contentPaths`(문자열 또는 배열; 파일, 디렉터리 또는 glob), `outputDir`, 선택적 `docusaurusCatalogDir`, `docsOutput`, 선택적 `segmentSplitting`, `translateFrontmatterFields`, `protectAttributes`, `protectKeys`, `targetLocales`, `addFrontmatter` 등을 포함할 수 있습니다.
- `docs[].description` - 유지 관리자를 위한 선택적 짧은 메모입니다. 설정하면 `translate-docs` 헤드라인과 `status` 섹션 헤더에 나타납니다.
- `docs[].contentPaths` - 마크다운/MDX/`.astro` 소스(및 Docusaurus 셸 JSON용 선택적 `docusaurusCatalogDir`).
- `docs[].outputDir` - 해당 블록의 번역된 출력 루트입니다.
- `docs[].docsOutput.style` - `"nested"`(기본값), `"flat"`, `"doc-system"` 또는 별칭 `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`([출력 레이아웃](/guide/documents/output-layouts) 참조).

**주요 vs 보조:** 로컬화된 페이지에 대해 `contentPaths`에 집중하십시오. `docusaurusCatalogDir`을 설정하면 `write-translations`에서 Docusaurus 셸 JSON도 필요할 때입니다. 페이지만 번역하는 경우 `docusaurusCatalogDir`는 생략하십시오.

<a id="step-2-translate-documents"></a>
## 2단계: 문서 번역

```bash
npx ai-i18n-tools translate-docs
```

이것은 모든 `docs[]` 블록의 `contentPaths`(및 `docusaurusCatalogDir`가 설정된 경우 Docusaurus 카탈로그 JSON)에 있는 모든 파일을 모든 유효한 문서 로케일로 번역합니다. 이미 번역된 세그먼트는 SQLite 캐시에서 제공되며, 새롭거나 변경된 세그먼트만 LLM으로 전송됩니다.

단일 로케일을 번역하려면:

```bash
npx ai-i18n-tools translate-docs --locale de
```

번역이 필요한 항목을 확인하려면:

```bash
npx ai-i18n-tools status
```

플래그, 캐시 동작 및 배치 프롬프트 형식에 대한 자세한 내용은 [CLI 옵션](/guide/documents/cli-options)을 참조하십시오.

<a id="complex-markdown-and-failed-quality-checks"></a>
## 복잡한 마크다운 및 품질 검사 실패

`translate-docs`은 각 번역된 구문이 문서에서 파싱된 강조 표현을 포함한 마크다운 구조를 유지하는지 확인합니다. 여러 `bold` 범위가 연속된 문단이나 `` `inline code` `` 주위에 백틱을 굵은 글씨 안에 중첩한 경우(예: `` `fetch(\`/locales/${code}.json\`)` `` 같은 템플릿 리터럴), 또는 긴 문장 전체에 걸쳐 굵은 글씨와 코드를 교차 사용하는 경우는 취약합니다. 일부 로케일은 다른 어순이 필요할 수 있으므로 번역 후 `**`와 `` ` ``의 위치가 달라질 수 있으며, 이로 인해 `AST mismatch` 같은 CLI 오류가 발생할 수 있습니다.

**이러한 종류의 유효성 검사 실패가 발생하면 원본 언어 텍스트를 단순화하는 것을 선호하십시오**. 단락을 나누거나, 예제를 펜스 코드 블록으로 이동하거나, 동일한 아이디어를 더 적은 계층형 볼드/코드 쌍으로 설명하는 것이 모든 모델과 로케일이 밀집된 인라인 마크업을 완벽하게 재현할 것이라고 기대하는 것보다 낫습니다.

모든 구성된 모델이 동일한 세그먼트에서 `AST mismatch` 오류를 내며 실패할 경우, `translate-docs`은 해당 세그먼트를 더 작은 부분으로 자동 분할할 수 있습니다(리스트 중간부터 시작한 후, 개별 리스트 항목이나 더 짧은 단락 조각으로 나눔), 각 부분을 첫 번째 모델부터 다시 시도하고, 원래 세그먼트 캐시 키 아래에서 결과를 다시 결합합니다. 이 기능은 기본적으로 활성화되어 있습니다(`segmentSplitting.qualityRetrySplit`); 모델 소진 후 중단하려면 `false`으로 설정하십시오. 이 대체 방법이 실행될 경우 실행 요약에서 `Quality split retries`를 보고합니다.

**어떤 세그먼트가 실패했는지**, 얼마나 자주 실패했는지, 저장된 **품질/오류 메시지**를 확인하려면 번역 대시보드의 **실패** 탭([번역 대시보드 → 실패](/guide/translation-dashboard/failures#failures-document-translation))을 사용하십시오.
