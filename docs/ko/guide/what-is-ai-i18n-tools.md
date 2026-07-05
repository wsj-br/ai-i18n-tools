<a id="what-is-ai-i18n-tools"></a>
# ai-i18n-tools란 무엇인가요?

ai-i18n-tools는 선호하는 LLM 공급자를 사용하여 앱과 문서를 번역하는 데 도움이 되는 명령줄 도구 및 툴킷입니다. 단일 구성 파일에서 모든 것을 제어하여 활성화할 번역 기능을 선택할 수 있습니다. "sync" 명령을 사용하여 필요한 모드를 한 번에 실행하세요.

<a id="translation-modes"></a>
## 번역 모드

- **UI 문자열** — JS/TS 소스에서 `t("…")` 호출(및 유사한 마커)을 추출하고 i18next 또는 정적 조회를 위한 로케일별 플랫 JSON 파일을 작성합니다. 명령: `extract`, `translate-ui`. 가이드: [UI 문자열](/guide/ui-strings/).
- **문서** — `docs[].contentPaths`에 나열된 Markdown, MDX 및 `.astro` 페이지를 번역합니다. VitePress, Starlight, Docusaurus, Astro 및 기타 정적 문서 사이트에서 작동합니다. 명령: `translate-docs`. 가이드: [문서](/guide/documents/).
- **JSON** — 최상위 `json[]`에 정의된 중첩된 JSON 로케일 번들(테마 레이블, i18n 재정의, 소스에 없는 앱 복사본)을 번역합니다. 명령: `translate-json`. 가이드: [JSON](/guide/json).
- **SVG** — SVG 일러스트레이션 내의 보이는 텍스트(`<text>`, `<title>`, `<desc>`)를 번역하고 로케일당 하나의 출력 파일을 작성합니다. 문서 번역과는 별개입니다. `translate-docs`은 SVG 자산을 수정하지 않습니다. 명령: `translate-svg`. 가이드: [SVG 번역](/guide/svg-translation/).

네 가지 모드 모두 활성 [LLM 공급자](/guide/providers-and-models)를 사용하고, 동일한 구성 파일을 공유하며, SQLite 캐시를 재사용하므로 재실행 시 새 텍스트 또는 변경된 텍스트만 모델로 전송됩니다.

<a id="which-should-i-use"></a>
## 어떤 것을 사용해야 할까요?

| 콘텐츠 | 모드 | 명령 |
| --- | --- | --- |
| 소스 코드가 `t()` 또는 HTML `data-i18n` 마커를 사용하는 경우 | UI 문자열 | `extract` / `translate-ui` |
| 현지화된 페이지 또는 문서 사이트 | 문서 | `translate-docs` |
| 독립형 중첩 JSON 로케일 파일 | JSON | `translate-json` |
| SVG에 레이블이 있는 다이어그램 또는 일러스트레이션 | SVG | `translate-svg` |

많은 프로젝트에서 모드를 결합합니다. 예를 들어 VitePress 사이트의 UI 문자열과 문서, 또는 그림 가이드의 문서와 SVG를 결합합니다. 스캐폴드 템플릿은 [빠른 시작](/guide/quick-start)을 참조하고 전체 구성 스키마는 [구성](/reference/configuration)을 참조하세요.

<a id="examples"></a>
## 예시

리포지토리에는 `examples/` 아래에 실행 가능한 예제 프로젝트가 제공됩니다. 각 프로젝트에는 자체 구성, 커밋된 로케일 출력 및 README가 있습니다. API 키 없이 번역된 파일을 탐색할 수 있습니다. 번역을 다시 실행하려면 공급자 키가 필요합니다([공급자 및 모델](/guide/providers-and-models) 참조).

| 예시 | 내용 |
| --- | --- |
| [console-app](/examples#console-app) | 가장 작은 엔드투엔드 앱: `t()` UI 문자열 및 README 번역 |
| [nextjs-app](/examples#nextjs-app) | Next.js UI, 복수형, SVG, Docusaurus 문서 사이트, 대시보드 |
| [astro-website](/examples#astro-website) | Astro 마케팅 사이트: 전체 페이지 HTML 번역 및 `t()` 문자열 |
| [astro-docs](/examples#astro-docs) | Astro Starlight 문서 사이트 |
| [vitepress-docs](/examples#vitepress-docs) | VitePress 문서 및 테마 JSON |
| [multi-provider](/examples#multi-provider) | 동일한 문서에서 LLM 공급자 비교 |
| [test-markdown](/examples#test-markdown) | Markdown 파이프라인 스트레스 테스트(CJK, 데바나가리, 엣지 케이스) |

`npx degit` 복사 명령 및 선택 가이드는 [예시](/examples)를 참조하세요.

<a id="next-steps"></a>
## 다음 단계

1. [설치](/guide/installation) — 패키지를 설치하고 공급자 API 키를 설정합니다.
2. [빠른 시작](/guide/quick-start) — 구성을 스캐폴드하고 첫 번째 번역을 실행합니다.
3. [공급자 및 모델](/guide/providers-and-models) — 공급자, 모델 대체 체인 및 `-P` 재정의를 선택합니다.
