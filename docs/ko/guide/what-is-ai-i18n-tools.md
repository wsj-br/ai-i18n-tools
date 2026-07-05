<a id="what-is-ai-i18n-tools"></a>
# ai-i18n-tools란 무엇인가요?

`ai-i18n-tools` 패키지는 세 가지 번역 표면을 제공합니다.

- **UI 문자열**: 모든 JS/TS 소스에서 `t("…")` 호출을 추출하고, 활성 [LLM 공급자](/guide/providers-and-models)를 통해 번역한 다음, i18next에 사용할 수 있는 로케일별 플랫 JSON 파일을 작성합니다.
- **문서**: `docs[].contentPaths`에 나열된 **마크다운, MDX 및 `.astro` 페이지**를 `translate-docs`를 통해 스마트 캐싱으로 번역합니다. 선택 사항인 **Docusaurus 카탈로그 JSON**(`docs[].docusaurusCatalogDir`, `docusaurus write-translations`에서)은 `features.translateDocs`가 활성화되면 동일한 명령으로 번역됩니다. 이는 `docs/`의 산문이 아닌 사이트 크롬(탐색 모음, 바닥글, 테마 문자열)입니다. **VitePress** 페이지 본문은 동일한 `docs[]` 파이프라인을 사용합니다. 탐색/사이드바/바닥글 레이블은 JSON(`json[]` / `translate-json`)을 사용합니다. [VitePress 통합](/guide/vitepress-integration)을 참조하세요.
- **JSON**: 최상위 `json[]`, `features.translateJson` 및 `translate-json`를 통해 임의의 중첩된 JSON 번들(예: `src/i18n/en/translation.json`)을 번역합니다. 이는 소스의 `t()` 대신 로케일별 JSON 파일에 UI 복사본을 보관하는 사이트용입니다.
- **도구 UI(내장)** — CLI 도움말, 로그 및 번역 대시보드는 여러 언어로 제공됩니다. 이는 **사용자** 앱의 UI 문자열 또는 문서를 번역하는 것과는 별개입니다.

**SVG** 자산은 `features.translateSVG`, 최상위 `svg` 블록, `translate-svg`를 사용합니다([CLI 참조](/reference/cli-commands) 참조).

**어떤 것을 사용해야 하나요?**

- `t()`를 통한 소스의 사용자 대면 문자열 → UI 문자열 (`extract` / `translate-ui`).
- 지역화된 페이지, Docusaurus 셸 JSON 또는 VitePress 마크다운 → 문서 (`translate-docs`).
- VitePress 테마 JSON 또는 기타 독립형 중첩 로케일 파일 → JSON (`translate-json`).

세 가지 모두 활성 LLM 공급자를 사용하며([공급자 및 모델](/guide/providers-and-models) 참조) 단일 구성 파일을 공유합니다.

<a id="next-steps"></a>
## 다음 단계

1. [설치](/guide/installation) — 패키지를 설치하고 공급자 API 키를 설정합니다.
2. [빠른 시작](/guide/quick-start) — 구성을 스캐폴드하고 첫 번째 번역을 실행합니다.
3. [공급자 및 모델](/guide/providers-and-models) — 공급자, 모델 대체 체인 및 `-P` 재정의를 선택합니다.
