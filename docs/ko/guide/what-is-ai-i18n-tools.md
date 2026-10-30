<a id="what-is-ai-i18n-tools"></a>
# ai-i18n-tools란 무엇인가요?

앱, 웹사이트, 문서 사이트 또는 저장소 README가 하나의 언어로 되어 있고 더 많은 언어를 추가하고 싶을 수 있습니다. 이 언어는 `sourceLocale`이며 어떤 언어든 될 수 있습니다. 이 가이드에서는 영어가 일반적인 예입니다. ai-i18n-tools는 텍스트를 찾고, 선택한 LLM 제공업체의 모델로 번역한 다음, 프로젝트가 이미 로드하는 파일에 작성합니다. 모든 결과를 캐시하므로 다시 실행할 때는 새 텍스트나 변경된 텍스트만 모델로 전송합니다.

<a id="what-you-do-and-what-the-tool-does"></a>
## 당신이 하는 일과 도구가 하는 일

| 사용자 | 도구 |
| --- | --- |
| 시도할 언어, 제공업체, 모델 선택 | 텍스트 추출, 번역, 결과 검증, 카탈로그 또는 페이지 작성 |
| 사용자에게 표시되는 텍스트를 도구에 노출: 앱 코드의 `t()` 호출, 사이트용 프레임워크 자체 i18n 또는 README의 언어 목록 마커 | 번역을 캐시하고 매 재실행 시 재사용합니다 |
| 결과를 앱, 사이트 라우팅 또는 README의 언어 행에 연결합니다 | 진행 상황을 표시하고 대시보드에서 번역을 검토할 수 있도록 합니다 |

이 도구는 소스를 다시 작성하지 않습니다. 래핑 단계를 위해 코딩 에이전트 프롬프트가 제공됩니다. i18next나 사이트 프레임워크의 i18n을 설치하지 않으며, 언어 전환기를 빌드하지도 않습니다. 단, 이를 위한 런타임 헬퍼는 제공됩니다.

<a id="where-do-i-start"></a>
## 어디서부터 시작해야 하나요?

둘러보기는 [프로젝트에 i18n 추가하기](/ko/guide/add-i18n-to-your-project)에 그룹화되어 있으며, 공통 설정과 각 프로젝트 종류별 페이지가 있습니다. 행을 선택하세요.

| 보유한 프로젝트 | 시작 위치 |
| --- | --- |
| 소스에 일반 텍스트가 있는 JS/TS 앱(React, Next.js, Node, CLI) | [JS/TS 앱에 i18n 추가하기](/ko/guide/add-i18n-to-js) |
| Python 앱(Streamlit, FastAPI, Flask, Django, gettext, 데스크톱) | [Python 앱에 i18n 추가하기](/ko/guide/add-i18n-to-python) |
| 웹사이트 또는 문서 사이트(VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, 일반 HTML) | [웹사이트 또는 문서 사이트에 i18n 추가하기](/ko/guide/add-i18n-to-website) |
| 리포지토리 README 및 기타 Markdown 파일(보통 앱 옆에 위치) | [README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme) |
| 독립형 중첩 JSON 로케일 파일 | [JSON](/ko/guide/json) |
| 텍스트 레이블이 있는 SVG 다이어그램 | [SVG 번역](/ko/guide/svg-translation/) |
| Intlayer 사전(Intlayer에서 마이그레이션) | [Intlayer에서 마이그레이션하기](/ko/guide/migrating-from-intlayer) |
| Intlayer 사전(Intlayer 유지, 인플레이스 번역) | [Intlayer 인플레이스 번역하기](/ko/guide/translating-intlayer) |

<a id="how-it-works"></a>
## 작동 방식

1. CLI를 설치하고 제공업체의 API 키를 설정합니다: [설치](/ko/guide/installation).
2. `init`를 실행하여 `ai-i18n-tools.config.json`를 작성합니다: [빠른 시작](/ko/guide/quick-start).
3. 프로젝트 준비: 문자열을 `t()`로 래핑하거나, 사이트 프레임워크의 i18n을 활성화하거나, README에 언어 목록 마커를 추가합니다.
4. `sync`를 실행합니다. 텍스트를 추출하고, 새로운 내용을 번역하고, 출력을 작성합니다.
5. 앱이나 사이트에서 출력을 로드하고, 언어 전환기를 추가하고, 소스가 변경되면 `sync`를 다시 실행합니다.

<a id="translation-modes"></a>
## 번역 모드

내부적으로 이 도구는 네 개의 파이프라인을 실행합니다. 구성에서 필요한 파이프라인을 활성화하면 `sync`가 순서대로 실행합니다.

- UI 문자열 — JS/TS 및 Python 소스에서 `t("…")` 및 `_()` 호출(및 GNU gettext를 포함한 유사한 마커)을 추출하고 로케일별 플랫 JSON 또는 `.po` / `.mo` 카탈로그를 작성합니다. 명령어: `extract`, `translate-ui`. 가이드: [UI 문자열](/ko/guide/ui-strings/). Python: [Python 애플리케이션](/ko/guide/ui-strings/python).
- 문서 — `docs[].contentPaths`에 나열된 Markdown, MDX 및 `.astro` 페이지를 번역합니다. VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro 및 기타 정적 문서 사이트와 리포지토리 README(`flat`의 `docsOutput.style`)와 함께 작동합니다. 명령어: `translate-docs`. 가이드: [문서](/ko/guide/documents/) 및 [README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme).
- JSON — 최상위 `json[]`에 정의된 중첩된 JSON 로케일 번들(테마 레이블, i18n 재정의, 소스에 없는 앱 사본)을 번역합니다. 명령어: `translate-json`. 가이드: [JSON](/ko/guide/json).
- SVG — SVG 일러스트레이션(`<text>`, `<title>`, `<desc>`) 내부의 보이는 텍스트를 번역하고 로케일당 하나의 출력 파일을 작성합니다. 문서 번역과는 별개입니다. 명령어: `translate-svg`. 가이드: [SVG 번역](/ko/guide/svg-translation/).

많은 프로젝트가 모드를 결합합니다. 일반적인 조합은 UI 문자열과 리포지토리 README입니다. VitePress와 같은 문서 사이트도 자주 사용되는 또 다른 조합입니다. [파이프라인 결합](/ko/guide/combining-pipelines) 및 [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="examples"></a>
## 예시

리포지토리는 `examples/` 아래에 실행 가능한 예제 프로젝트를 제공하며, 각 프로젝트에는 자체 구성, 커밋된 로케일 출력 및 README가 있습니다. API 키 없이 번역된 파일을 탐색할 수 있으며, 번역을 다시 실행하려면 공급자 키가 필요합니다.

| 프로젝트 유형 | 예제 |
| --- | --- |
| JS/TS 앱 | [console-app](/ko/examples#console-app), [nextjs-app](/ko/examples#nextjs-app) |
| 앱과 함께 있는 리포지토리 README | [console-app](/ko/examples#console-app), [nextjs-app](/ko/examples#nextjs-app) |
| Python 앱 | [python-streamlit](/ko/examples#python-streamlit), [python-fastapi](/ko/examples#python-fastapi), [python-gettext](/ko/examples#python-gettext) |
| 문서 사이트 | [docusaurus-docs](/ko/examples#docusaurus-docs), [vitepress-docs](/ko/examples#vitepress-docs), [astro-docs](/ko/examples#astro-docs) |
| 웹사이트 또는 일반 HTML | [astro-website](/ko/examples#astro-website), [plain-html](/ko/examples#plain-html) |

전체 목록과 `npx degit` 복사 명령은 [예제](/ko/examples)를 참조하세요.

<a id="next-steps"></a>
## 다음 단계

1. [설치](/ko/guide/installation) — npm 패키지를 설치하거나 Python 프로젝트의 경우 [독립 실행형 파일](/ko/guide/installation#standalone-executables)을 다운로드하고 공급자 API 키를 설정합니다.
2. [빠른 시작](/ko/guide/quick-start) — 구성을 스캐폴드하고 첫 번역을 실행합니다.
3. [LLM 공급자](/ko/guide/providers-and-models) — 공급자, API 키 및 `-P` 재정의를 선택합니다.
4. [AI 모델](/ko/guide/ai-models) — `suggest-models` 또는 대시보드 **모델** 탭을 사용하여 후보 목록의 순위를 지정하고, 번역 실패 시 다음 모델을 시도할 수 있도록 여러 모델을 유지합니다.
