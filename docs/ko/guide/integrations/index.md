<a id="integrations"></a>
# 통합

문서 사이트 및 Astro 프로젝트에 ai-i18n-tools를 연결하기 위한 프레임워크별 가이드입니다. 각 통합은 페이지 콘텐츠를 위해 [문서](/ko/guide/documents/) 파이프라인(`translate-docs` / `sync`)을 사용합니다. 셸 문자열(nav, sidebar, theme)은 별도의 [JSON](/ko/guide/json) 파이프라인이 아닌, 명시된 경우 동일한 파이프라인 내에서 처리됩니다.

<a id="which-guide-to-read"></a>
## 어떤 가이드를 읽어야 할까요?

| 사이트 | 초기화 템플릿 | 시작하기 |
| --- | --- | --- |
| Astro Starlight 또는 일반 Astro | `ui-starlight` / 하이브리드 UI 문자열 | [Astro](/ko/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/ko/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/ko/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/ko/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/ko/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## 공유 개념

모든 문서 프레임워크 통합은 [문서](/ko/guide/documents/)에 설명된 것과 동일한 `docs[]` 블록 모델을 공유합니다. 프레임워크(`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` 또는 `"astro-starlight"`)에 맞게 `docsOutput.style`을 설정하세요. 출력 폴더 레이아웃 및 링크 재작성 동작에 대해서는 [출력 레이아웃](/ko/guide/documents/output-layouts) 및 [링크 재작성](/ko/guide/documents/link-rewriting)을 참조하세요.

각 `init -t ui-*` 템플릿은 기본 LLM 제공자 블록을 스캐폴드합니다 (`-P <provider>`를 전달하지 않는 한 `openrouter`). `translate-docs` 또는 `sync` 전에 필요에 따라 `provider` / `providers`를 구성하고 일치하는 API 키를 설정하세요 — [제공자 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요.

프레임워크 간 비교는 [프레임워크 셸 번역](#framework-shell-translation)을 참조하세요. 아래 링크된 각 가이드는 해당 프레임워크의 설정 방법을 다룹니다.

<a id="framework-shell-translation"></a>
## 프레임워크 셸 번역

| 프레임워크 | 셸 / 테마 문자열 | 파이프라인 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 카탈로그 (`{ message, description }`) | 문서 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 테마/nav/sidebar 카탈로그 | 문서 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 사이드바 라벨 | 문서 — `style: "nextra"` + `translate-docs` 시 자동 |
| Nextra | 테마 사전 `.ts` | 문서 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 사이드바 라벨 | 문서 — `style: "fumadocs"` + `translate-docs` 시 자동 |
| Fumadocs | UI 오버라이드 카탈로그 | 문서 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 내장 UI 문자열 (다수 로케일); 추가 셸 파이프라인 없음 | 문서 — `translate-docs` (페이지만) |

프레임워크 셸/테마 문자열을 `json[]`에 넣지 **마세요** — 해당 파이프라인은 관련 없는 앱 로케일 번들을 위한 것입니다. 프레임워크별 설정 세부 정보는 [어떤 가이드를 읽어야 할지](#which-guide-to-read)에서 링크된 가이드에 나와 있습니다.

<a id="runnable-examples"></a>
## 실행 가능한 예제

| 프레임워크 | 예제 저장소 |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| 일반 Astro 웹사이트 | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
