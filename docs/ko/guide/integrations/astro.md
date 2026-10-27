<a id="astro-integration"></a>
# Astro 통합

ai-i18n-tools를 [Astro](https://astro.build/)와 함께 두 가지 일반적인 설정에서 사용하세요. **Astro Starlight** 문서 사이트와 **일반 Astro** 마케팅 또는 앱 사이트입니다. 둘 다 페이지 콘텐츠에 Documents(`translate-docs`)를 사용합니다. 일반 Astro 사이트는 종종 프런트매터 및 공유 데이터의 `t()` 문자열에 UI 문자열(`extract` / `translate-ui`)을 결합합니다.

또한 [UI 문자열](/ko/guide/ui-strings/astro-website), [문서](/ko/guide/documents/) 및 아래의 실행 가능한 예제를 참조하세요.

<a id="astro-starlight"></a>
## Astro Starlight

[Astro Starlight](https://starlight.astro.build/) 문서 사이트에는 `init -t ui-starlight` 및 `docsOutput.style: "astro-starlight"`를 사용하세요. 이 프리셋은 `localeSubpath`가 비어 있는 `doc-system`의 별칭으로, 번역된 페이지는 소스 로케일 트리 옆의 `src/content/docs/<locale>/` 아래에 위치합니다. `sourceLocale`는 모든 언어가 될 수 있습니다.

<a id="quick-start"></a>
### 빠른 시작

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### 페이지 레이아웃

영어 마크다운 및 MDX는 Starlight 콘텐츠 루트(일반적으로 `src/content/docs/`)에 있습니다. 번역된 사본은 소스 트리 옆에 작성됩니다.

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

하나의 `docs[]` 블록을 구성하세요:

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

`contentPaths`가 `sourceLocale`로 작성된 `.md` / `.mdx` 파일 및 디렉터리를 가리키도록 하세요. 해당 언어는 모든 언어가 될 수 있습니다. `docsRoot`를 Starlight가 콘텐츠 루트로 사용하는 동일한 폴더로 설정하세요.

Starlight UI 재정의는 필요한 경우 별도의 `docs[]` 블록에서 `src/content/i18n/en.json`와 `jsonPathTemplate`를 사용할 수 있습니다. [문서 — 문서화를 위한 초기화](/ko/guide/documents/#step-1-initialise-for-documentation)를 참조하세요.

Starlight는 여러 로케일에 대한 기본 제공 UI 문자열(탐색 레이블, 검색 플레이스홀더, 목차 등)을 제공합니다. 구성할 별도의 셸/테마 파이프라인이 없으며, 페이지 콘텐츠에는 `translate-docs`만 사용하면 됩니다. 다른 프레임워크는 [프레임워크 셸 번역](/ko/guide/integrations/#framework-shell-translation)을 참조하세요.

명시적인 사이드바 `label`, 사이트 `title`, `astro.config.mjs`의 `social[].label`는 이 도구가 번역하지 않는 영어 리터럴입니다. 페이지의 번역된 프런트매터(`title`)에서 레이블을 가져오도록 `slug` 항목을 사용하는 것이 좋습니다. 자체적인 표현이 필요한 그룹 또는 외부 링크는 Starlight의 로케일별 `translations` 맵(기본 로케일의 경우 `label`, 다른 로케일의 경우 `translations['pt-BR']`)을 사용합니다. 현재 Starlight 스키마에서 `social[].label`에는 번역 필드가 없으므로 작성된 그대로 유지됩니다. `slug` 항목을 사용하는 [Starlight 사이드바](https://starlight.astro.build/guides/sidebar/#internationalization) 및 [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs)를 참조하세요.

<a id="enable-i18n-in-an-existing-site"></a>
### 기존 사이트에서 i18n 활성화하기

- Starlight 구성의 `locales`. 영어가 접두사 없이 사용되어야 할 경우(`label` 및 필수 `lang`) `root` 항목을 포함합니다.
- 기본 언어가 해당 루트 로케일인 경우 `defaultLocale: 'root'`. Starlight의 기본값이 이미 일치하는 경우에만 `defaultLocale`를 생략합니다.
- 영어 페이지는 `src/content/docs/`에 유지되고, `translate-docs`는 `src/content/docs/<locale>/`를 작성합니다.
- `targetLocales`를 루트가 아닌 로케일 키와 정렬합니다(대소문자 주의: Starlight 디렉터리 키는 `pt-br`와 같이 종종 소문자입니다).

<a id="example-project"></a>
### 예제 프로젝트

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — `src/content/docs/`의 영어 소스, `src/content/docs/<locale>/` 아래의 커밋된 번역, RTL 로케일(`ar`) 및 용어집 기반 번역. 포트 3050에서 `pnpm dev`를 실행합니다.

<a id="plain-astro-marketing-and-app-sites"></a>
## 일반 Astro (마케팅 및 앱 사이트)

정적 Astro 마케팅 또는 앱 사이트(Starlight 아님)의 경우 [Astro 내장 i18n 라우팅](https://docs.astro.build/en/guides/internationalization/)을 ai-i18n-tools와 결합합니다. 참조 구현은 [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website)입니다. 영어는 `/`에, 대상 로케일은 `/{locale}/`에 있습니다.

대부분의 팀은 동일한 페이지에서 두 파이프라인의 **하이브리드**를 사용합니다.

| 파이프라인 | 용도 | 명령어 | 출력 |
|----------|---------|----------|--------|
| **페이지 HTML** | 템플릿 본문의 제목, 단락, 내비게이션 레이블, 인라인 배열 | `translate-docs` | 로케일별 `src/pages/{locale}/index.astro` |
| **UI 문자열(`t()`)** | 프런트매터 데이터, 탭 레이블, 공유 배열 | `extract` → `translate-ui` | `public/locales/{locale}.json`(소스 언어 문자열을 키로 사용) |

<a id="quick-start-1"></a>
### 빠른 시작

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

`init -t ui-astro-website -P ollama`을(를) 사용하여 UI 추출을 스캐폴드한 다음, 페이지 HTML도 번역할 때 `docs[]` 블록으로 병합합니다.

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

언어를 추가하거나 제거할 때 세 가지 목록을 정렬된 상태로 유지합니다. `ai-i18n-tools.config.json`의 `targetLocales`, `astro.config.mjs`의 `i18n.locales`(Astro는 `pt-br`와 같은 **소문자** 경로 코드를 사용합니다), 그리고 `ui-languages.json`(`generate-ui-languages`를 통해). 플랫 번들 **파일 이름**은 구성 대소문자(`pt-BR.json`)를 사용합니다. 매니페스트 `code` 필드를 통해 Astro의 `pt-br` 경로를 해당 파일에 매핑합니다.

소스 언어 리터럴을 키로 조회하여 **빌드 시**에 `t('…')`를 확인합니다(`examples/astro-website/src/i18n/t.ts` 참조). `sourceLocale`는 모든 언어가 될 수 있습니다. 예제에서는 영어를 사용합니다. 로드 후 언어를 전환하는 클라이언트 아일랜드를 추가하지 않는 한, 정적 사이트에는 `ai-i18n-tools/runtime` 또는 i18next가 필요하지 않습니다.

<a id="example-project-1"></a>
### 예제 프로젝트

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — `translate-docs`를 통한 HTML 및 `t()` + `translate-ui`를 통한 스크린샷 탭 레이블이 있는 하이브리드 랜딩 페이지입니다.

<a id="example-projects"></a>
## 예시 프로젝트

| 프로젝트 | 사용 사례 | 포트 |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight 문서 | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | 일반 Astro 마케팅 사이트 (HTML + `t()` 하이브리드) | (README 참조) |

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs)와 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs)를 비교해 보세요 — 유사한 튜토리얼 콘텐츠, Starlight 대신 Docusaurus 출력 스타일.
