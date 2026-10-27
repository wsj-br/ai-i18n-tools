<a id="add-i18n-to-a-website-or-docs-site"></a>
# 웹사이트 또는 문서 사이트에 i18n 추가하기

이 페이지는 단일 언어로 된 문서 사이트(Markdown 또는 MDX) 또는 마케팅이나 정적 사이트(Astro 웹사이트 또는 순수 HTML)를 위한 것입니다. 이 도구는 LLM 공급자의 모델을 사용하여 페이지 콘텐츠를 번역하고 언어별로 현지화된 사본을 하나씩 작성합니다. 사이트 프레임워크가 해당 사본을 제공하고 언어 전환기를 표시합니다.

UI 문자열이 `t()` 호출에 있는 앱의 경우, 대신 [JS/TS 앱에 i18n 추가하기](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가하기](/ko/guide/add-i18n-to-python)를 사용하세요.

<a id="what-do-you-have"></a>
## 무엇을 가지고 있나요?

| 사이트 | 초기화 템플릿 | 시작하기 |
| --- | --- | --- |
| Astro Starlight 또는 일반 Astro | `ui-starlight` / 하이브리드 UI 문자열 | [Astro](/ko/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/ko/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/ko/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/ko/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/ko/guide/integrations/fumadocs) |
| 일반 HTML 페이지 | `ui-plain-html` 또는 `docs-plain-html` | [일반 HTML 앱](/ko/guide/ui-strings/plain-html) |
| 사이트 프레임워크 없음, README 및 Markdown 파일만 | `docs-markdown`, 또는 모든 템플릿과 `--with-readme` | [README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>에이전트 프롬프트</summary>

- Astro Starlight: 참고 사항만. Astro `t()` 파일: [JS/TS 프롬프트](/ko/guide/add-i18n-to-js#agent-prompt) (i18next 건너뛰기).
- Docusaurus: 참고 사항만 (`<Translate>`는 Docusaurus 자체 API입니다.).
- VitePress: [테마 카탈로그 프롬프트](/ko/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off).
- Nextra: [사전 프롬프트](/ko/guide/integrations/nextra#agent-prompt-dictionary) 및 [하이브리드 `t()` 프롬프트](/ko/guide/integrations/nextra#optional-t-for-app-react-hybrid).
- Fumadocs: [UI 카탈로그 프롬프트](/ko/guide/integrations/fumadocs#agent-prompt).
- README 및 Markdown 파일: [README 프롬프트](/ko/guide/add-i18n-to-readme#agent-prompt).

</details>

<a id="steps"></a>
## 단계

동일한 형태가 모든 프레임워크에 적용됩니다. 자세한 내용은 위에 링크된 프레임워크 가이드에 있습니다.

1. CLI를 설치하고 API 키를 설정합니다: [설치](/ko/guide/installation), [공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key).
2. 스캐폴드: `ai-i18n-tools init -t <template> -P <provider>`.
3. `sourceLocale`, `targetLocales`, 및 `docs[].contentPaths`를 설정합니다(원본 언어로 작성된 페이지 및 폴더). `sourceLocale`는 어떤 언어든 될 수 있습니다. 프레임워크 가이드에 올바른 `docsOutput.style`가 나와 있습니다.
4. 프레임워크 자체 i18n을 활성화하여 현지화된 페이지를 제공하고 연결하도록 합니다. 각 가이드에는 "기존 사이트에 i18n 활성화" 섹션이 있습니다: [VitePress](/ko/guide/integrations/vitepress#enable-i18n-in-an-existing-site), [Docusaurus](/ko/guide/integrations/docusaurus#enable-i18n-in-an-existing-site), [Nextra](/ko/guide/integrations/nextra#enable-i18n-in-an-existing-site), [Fumadocs](/ko/guide/integrations/fumadocs#enable-i18n-in-an-existing-site), [Astro](/ko/guide/integrations/astro#enable-i18n-in-an-existing-site).
5. `ai-i18n-tools sync`(또는 `translate-docs`)를 실행한 다음 사이트를 빌드합니다.
6. 브라우저에서 현지화된 경로를 확인합니다. 프레임워크 자체 로케일 드롭다운이 전환기입니다. README와 같은 일반 Markdown 파일의 경우, [languageListBlock](/ko/guide/documents/language-switcher)을 사용하여 링크 행을 추가합니다.

<a id="what-gets-translated"></a>
## 무엇이 번역되나요?

페이지 본문은 항상 [문서](/ko/guide/documents/) 파이프라인을 거칩니다. 프레임워크 크롬(탐색, 사이드바, 테마 레이블)은 프레임워크가 지원하는 경우 별도의 [JSON](/ko/guide/json) 파이프라인을 통하지 않고 동일한 실행에서 처리됩니다.

| 프레임워크 | 셸 및 테마 문자열 | 방법 |
| --- | --- | --- |
| Docusaurus | `write-translations` 카탈로그 (`{ message, description }`) | `docs[].docusaurusCatalogDir`와 `translate-docs` |
| VitePress | 테마, 탐색 및 사이드바 카탈로그 | `docsOutput.vitepressThemeCatalog`와 `translate-docs` |
| Nextra | `_meta.ts` 사이드바 레이블 | `style: "nextra"`로 자동 |
| Nextra | 테마 사전 `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json` 사이드바 레이블 | `style: "fumadocs"`로 자동 |
| Fumadocs | UI 재정의 카탈로그 | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | 여러 로케일의 내장 UI 문자열 | 페이지 전용 |

이미지 및 스크린샷은 `translate-docs`에 의해 번역되지 않습니다. 로케일별 파일에 대해서는 [이미지 및 스크린샷](/ko/guide/images-and-screenshots/)을 참조하세요.

<a id="plain-html"></a>
## 일반 HTML

페이지가 동작해야 하는 방식에 따라 두 가지 옵션이 있습니다.

- 브라우저에서 언어를 전환하는 단일 페이지: 텍스트에 `data-i18n*` 속성을 표시하고 UI 문자열 런타임(`ui-plain-html`)을 사용합니다. [일반 HTML 앱](/ko/guide/ui-strings/plain-html)을 참조하세요.
- 로케일당 하나의 번역된 HTML 파일: 문서 파이프라인(`docs-plain-html`)을 사용합니다. [HTML 페이지](/ko/guide/documents/html-pages)를 참조하세요.

파일은 하나의 경로에 속합니다.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

- 앱 UI 문자열: [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python).
- 사이트 옆의 리포지토리 README 또는 마크다운 파일 및 사이트 프레임워크 없음: [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme). `init … --with-readme`는 사이트 템플릿 옆에 해당 블록을 추가합니다.
- 독립형 중첩 로케일 JSON: [JSON](/ko/guide/json).
- 사이트 및 앱 문자열 모두 번역: [파이프라인 결합](/ko/guide/combining-pipelines).

공유 옵션 및 프레임워크별 차이점에 대한 참조: [통합](/ko/guide/integrations/).
