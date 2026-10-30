<a id="add-i18n-to-your-project"></a>
# 프로젝트에 i18n 추가하기

이 섹션은 현재 단일 언어만 지원하는 프로젝트를 위한 워크스루 모음입니다. 여기서 시작하세요. 아래 각 페이지는 설정부터 첫 번역 파일까지 한 가지 유형의 프로젝트를 다룹니다. [시작하기](/ko/guide/what-is-ai-i18n-tools)에서는 도구가 무엇인지, 설치 옵션, 그리고 공급자 및 모델에 대해 다룹니다. 해당 페이지를 먼저 읽지 않고도 워크스루를 열 수 있습니다.

<a id="what-you-do-and-what-the-tool-does"></a>
## 당신이 하는 일과 도구가 하는 일

| 사용자 | 도구 |
| --- | --- |
| 언어, 제공업체, 사용해 볼 모델을 선택합니다 | 텍스트를 추출하고 번역한 다음, 결과를 확인하고 카탈로그 또는 페이지를 작성합니다 |
| 텍스트를 보이게 만듭니다: 앱 코드의 `t()`, 사이트 프레임워크의 i18n, 또는 README의 언어 목록 마커 | 모든 번역을 캐시하고 다음 실행 시 재사용합니다 |
| 파일을 로드하고 한 언어를 확인합니다 | 진행 상황을 보여주고, [번역 대시보드](/ko/guide/translation-dashboard/)에서 문구를 검토할 수 있도록 합니다 |

단계별 안내서에는 어떤 소스 편집이 당신의 몫인지 명시되어 있습니다. 해당 편집이 기계적인 경우 코딩 에이전트 프롬프트가 포함됩니다. CLI는 카탈로그와 번역된 파일을 작성합니다. i18next 또는 사이트 프레임워크의 i18n을 설치하지 않습니다.

<a id="shared-setup"></a>
## 공통 설정

모든 단계별 안내서는 동일한 순서를 따릅니다. 선택한 페이지에서 세부 정보를 채워줍니다.

1. CLI를 설치하고 공급자의 API 키를 설정합니다. Ollama는 키가 필요 없습니다. [설치](/ko/guide/installation) 및 [공급자 및 API 키](/ko/guide/quick-start#provider-and-api-key).
2. 해당 페이지에 명시된 템플릿으로 `init`를 실행합니다. 그러면 `ai-i18n-tools.config.json`이(가) 작성됩니다.
3. 도구가 텍스트를 인식할 수 있도록 프로젝트를 준비합니다. 해당 페이지의 에이전트 프롬프트 또는 같은 페이지의 수동 단계를 사용합니다.
4. `ai-i18n-tools sync`를 실행한 다음 `ai-i18n-tools status`를 실행합니다.
5. 출력을 로드하고, 하나의 대상 언어를 확인한 다음, 소스가 변경되면 `sync`을(를) 다시 실행합니다. 캐시는 새롭거나 변경된 텍스트만 모델로 보냅니다.

<a id="pages-in-this-section"></a>
## 이 섹션의 페이지

| 보유한 항목 | 페이지 | 해당 페이지에서 다루는 내용 |
| --- | --- | --- |
| 버튼과 메시지가 일반 텍스트인 JS/TS 앱 (React, Next.js, Node, CLI) | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) | i18next를 설치하고, 부트스트랩을 추가하고, 리터럴을 `t()`로 래핑하고, 언어 전환기를 추가한 다음, `extract` 및 `translate-ui`를 수행합니다 |
| Python 앱 (Streamlit, FastAPI, Flask, 데스크톱, 스크립트) | [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) | `i18n.py` 헬퍼를 배치하고, `t()` 또는 `_()`를 래핑하고, 언어 전환기를 추가합니다. CLI는 Node.js 설치 없이 독립 실행형 실행 파일로 실행할 수 있습니다 |
| Django 앱, Flask-Babel 카탈로그를 사용하는 Flask 또는 이미 GNU gettext를 사용하는 모든 앱 | [Django / Python gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext) | `gettext`, `{% blocktranslate %}` 및 `.po` 파일을 유지합니다. 도구가 카탈로그를 채우고 컴파일합니다 |
| 문서 또는 마케팅 사이트 (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, 일반 HTML) | [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website) | 해당 페이지의 에이전트 프롬프트를 사용하여 프레임워크의 i18n을 활성화한 다음, `sync`를 사용하여 페이지 및 테마 레이블을 번역합니다 |
| 일반적으로 앱 옆에 있는 저장소 README 및 기타 마크다운 파일 | [README 및 마크다운 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme) | 언어당 하나의 파일 (`translated-docs/README.de.md`) 및 README의 언어 행. `init --with-readme`은(는) 해당 블록을 모든 템플릿에 추가합니다 |
| 하나의 저장소에 위 항목 중 두 개 이상 | [파이프라인 결합하기](/ko/guide/combining-pipelines) | 하나의 구성과 하나의 `sync`. 일반적인 쌍은 앱 UI 문자열과 README입니다 |
| Intlayer 사전이 있고 Intlayer를 유지하려는 경우 | [Intlayer를 제자리에서 번역하기](/ko/guide/translating-intlayer) | `translate-intlayer`은(는) `*.content.ts` 내에서 누락되거나 오래된 리프를 채웁니다 |
| Intlayer 사전이 있고 Intlayer에서 벗어나려는 경우 | [Intlayer에서 마이그레이션하기](/ko/guide/migrating-from-intlayer) | `migrate-intlayer`은(는) 사전에서 카탈로그를 시드하고 안전한 호출 사이트를 `t()`으로(로) 다시 작성합니다 |

README도 있는 앱은 앱 페이지와 README 페이지를 함께 사용합니다. README도 있는 사이트는 웹사이트 페이지와 README 블록에 `init … --with-readme`을(를) 사용합니다.

<a id="where-to-go-deeper"></a>
## 더 알아보기

단계별 안내는 첫 번째 언어 설정이 완료되면 중단됩니다. 그 이후부터는 참조 페이지를 참고하세요:

- 한 번에 하나의 파이프라인에 대한 [UI 문자열](/ko/guide/ui-strings/), [문서](/ko/guide/documents/), [JSON](/ko/guide/json), [SVG](/ko/guide/svg-translation/).
- 프레임워크 셸 문자열(탐색, 사이드바, 테마)에 대한 [통합](/ko/guide/integrations/).
- 명령어 목록 및 권장 `package.json` 스크립트에 대한 [빠른 시작](/ko/guide/quick-start).
- 사전 설정 및 API 키에 대한 [LLM 공급자](/ko/guide/providers-and-models).
- 순위가 매겨진 최종 후보 목록 및 대체 체인에 대한 [AI 모델](/ko/guide/ai-models).
