<a id="integrations"></a>
# 통합

프레임워크 통합에 대한 참조: 공통점과 셸 문자열의 차이점. 사이트에 언어를 추가하려면 [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website)에서 시작하세요. 앱의 경우 [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python)에서 시작하세요. 리포지토리 README 및 기타 Markdown 파일의 경우 [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)에서 시작하세요.

문서 통합은 페이지 콘텐츠에 대해 [문서](/ko/guide/documents/) 파이프라인(`translate-docs` / `sync`)을 사용하며, 셸 문자열(탐색, 사이드바, 테마)은 명시된 경우 별도의 [JSON](/ko/guide/json) 파이프라인을 통하지 않고 동일한 파이프라인 내에서 처리됩니다. Python 애플리케이션은 [UI 문자열](/ko/guide/ui-strings/python) 파이프라인(`extract` / `translate-ui`)을 사용합니다.

<a id="which-guide-to-read"></a>
## 어떤 가이드를 읽어야 할까요?

프레임워크별 init 템플릿 및 에이전트 프롬프트가 포함된 선택기 테이블은 [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website#initialise-the-project)에 있습니다. Python 프레임워크: [Python](/ko/guide/integrations/python).

<a id="shared-concepts"></a>
## 공유 개념

문서 프레임워크 통합은 [Documents](/ko/guide/documents/)에 설명된 동일한 `docs[]` 블록 모델을 공유합니다. `docsOutput.style`을 사용 중인 프레임워크(`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` 또는 `"astro-starlight"`)와 일치하도록 설정하십시오. 출력 폴더 레이아웃 및 링크 재작성 동작에 대해서는 [Output layouts](/ko/guide/documents/output-layouts) 및 [Link rewriting](/ko/guide/documents/link-rewriting)을 참조하십시오. Python 설정은 별도로 진행됩니다: [Python](/ko/guide/integrations/python).

각 `init -t ui-* -P <provider>` 스캐폴드는 해당 프리셋의 LLM 공급자 블록을 작성합니다. `translate-docs` 또는 `sync` 전에, 일치하는 API 키를 설정하세요. 자세한 내용은 [공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key)를 참조하세요.

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
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
