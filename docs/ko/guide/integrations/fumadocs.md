<a id="fumadocs-integration"></a>
# Fumadocs 통합

Next.js App Router에서 [Fumadocs](https://www.fumadocs.dev/) 4 문서 사이트를 위한 `init -t ui-fumadocs`와 `docsOutput.style: "fumadocs"`를 사용합니다. 프리셋은 빈 `localeSubpath`과 BCP-47 또는 짧은 로케일 코드가 보존된 `doc-system`의 별칭입니다 (`localePathLowercase`는 `false`가 기본값입니다).

[Documents](/ko/guide/documents/)와 실행 가능한 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 데모(점 구문 분석기, 포트 3080)를 참조하십시오.

<a id="quick-start"></a>
## 빠른 시작

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

페이지 콘텐츠, `meta.json` 사이드바 레이블 및 Fumadocs UI 오버라이드를 한 번의 `sync` 실행으로 번역할 때 `features.translateDocs`를 활성화합니다.

<a id="page-layout"></a>
## 페이지 레이아웃

Fumadocs는 `docsOutput.fumadocsParser`를 통해 두 가지 i18n 콘텐츠 레이아웃을 지원합니다. **dot** 파서는 기본값(Fumadocs 내장 및 프로덕션 사이트 such as [SWR](https://github.com/vercel/swr-site))입니다.

<a id="dot-parser-default"></a>
### Dot 파서(기본값)

영어 MDX는 컬렉션 루트에 있습니다. 번역된 복사본은 동일한 디렉토리에서 로케일 접미사를 사용합니다:

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

`targetLocales`를 `lib/i18n.ts`의 `defineI18n().languages`과 정확하게 일치시킵니다(예제는 짧은 코드 `pt` 및 `zh`를 사용합니다).

<a id="dir-parser-nextra-style"></a>
### 디렉토리 구문 분석기(Nextra 스타일)

로케일 폴더( `content/docs/en/` → `content/docs/pt-BR/` )에 익숙한 팀의 경우 `fumadocsParser`를 `"dir"`으로 설정합니다:

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

복사해서 사용할 수 있는 dir 설정은 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/)의 `ai-i18n-tools.config.dir.example.json`를 참조하세요. 멘탈 모델은 [Nextra 통합](/ko/guide/integrations/nextra#page-layout)과 일치합니다.

<a id="sidebar-metajson"></a>
## 사이드바(`meta.json`)

Fumadocs는 사이드바 구조 및 제목을 위한 JSON `meta.json` 파일을 사용합니다. `docsOutput.style`이 `"fumadocs"`인 경우 **`translate-docs`** 은 `docsRoot`(또는 `docs[].fumadocsMetaGlob`) 아래에서 `meta.json`을 수집하고 `docs[].fumadocsMetaTranslatableKeys`(기본값: `title`, `description`)에 나열된 키에 대한 문자열 값을 번역한 다음 로케일 출력을 작성합니다:

| 구문 분석기 | 영어 소스 | 출력 |
|--------|----------------|--------|
| **점** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **디렉토리** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**번역하지 않습니다** `pages` 슬러그 배열, `root`, `icon`, `defaultOpen`, 또는 기타 구조 키 — 읽을 수 있는 레이블만 번역합니다.

<a id="ui-catalog"></a>
## UI 카탈로그

Fumadocs 레이아웃 크롬(검색 플레이스 홀더, 로케일 표시 이름 및 `defineTranslations` / `i18n.translations()`의 기타 오버라이드 `lib/layout.shared.ts`)은 마크다운에서 추출되지 않습니다. **`docsOutput.fumadocsUiCatalog`** 을 구성하여 **`translate-docs`** 이 `sourcePath`에서 영어 카탈로그를 부트스트랩하고 로케일별 JSON을 번역합니다.

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — 생성된 영어 평면 JSON(부트스트랩 출력). `layout.shared.ts`의 영어 오버라이드가 변경되면 `sync`을 다시 실행합니다.
- **`outputPathTemplate`** (선택 사항) — 로케일별 출력; 기본값: `ui.{locale}.json` `catalogPath` 옆에 있습니다.

로캘별 JSON을 `layout.shared.ts`에서 `loadUiCatalog(locale)`를 통해 로드하고 루트 레이아웃의 `i18nProvider(translations, lang)`과 병합하십시오. [examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts)를 참조하십시오.

표준 로케일은 `@fumadocs/language/*` 프리셋으로 처리될 수 있으며, LLM 비용이 들지 않습니다. 카탈로그는 영어 블록에서만 **프로젝트 오버라이드**를 번역합니다.

**Fumadocs UI 문자열**에 `json[]`를 사용하지 마십시오. 해당 파이프라인은 관련된 앱 로케일 번들을 위한 것입니다.

<a id="framework-shell-translation"></a>
## 프레임워크 셸 번역

| 프레임워크 | 셸/테마 문자열 | 파이프라인 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 카탈로그 | 문서 — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 테마/nav/sidebar 카탈로그 | 문서 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 사이드바 라벨 | 문서 — `style: "nextra"` + `translate-docs` 시 자동 |
| Nextra | 테마 사전 `.ts` | 문서 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` 사이드바 라벨 | 문서 — `style: "fumadocs"` + `translate-docs` 시 자동 |
| Fumadocs | UI 오버라이드 카탈로그 | 문서 — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 내장 UI 문자열 (다수 로케일); 추가 셸 파이프라인 없음 | 문서 — `translate-docs` (페이지만) |

프레임워크 셸/테마 문자열을 `json[]`에 넣지 **마세요** — 해당 파이프라인은 관련 없는 앱 로케일 번들을 위한 것입니다. 다른 프레임워크 패턴은 [Docusaurus 통합](/ko/guide/integrations/docusaurus), [VitePress 통합](/ko/guide/integrations/vitepress), [Nextra 통합](/ko/guide/integrations/nextra)을 참조하세요.

<a id="link-conventions"></a>
## 링크 규칙

Fumadocs는 Next.js 미들웨어(`/docs/getting-started`, `/pt/docs/getting-started`)를 통해 로케일 접두사가 붙은 경로를 제공합니다. 활성 로케일 접두사가 자동으로 적용되도록 **페이지 내 링크는 로케일 중립적이어야 합니다**(`/docs/getting-started`).

내장 노멀라이저를 활성화하여 `translate-docs`가 모든 번역 파일의 링크를 자동으로 수정하도록 하세요:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks`는 `style`이 `"fumadocs"`일 때 기본적으로 활성화됩니다.

| 영어 원본 작성자 | 정규화 후 |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/ko/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | 변경 없음 (전체 URL) |

**작성 규칙**

- 페이지 간 문서 링크: 영어 MDX에서 **로케일 중립 사이트 경로**(`/docs/…`)를 사용하거나, `content/docs/…` / 상대 `.mdx` 경로를 사용하고 `sync` 중에 정규화 도구가 다시 작성하도록 합니다.
- 콘텐츠 트리 외부의 저장소 파일: **전체 URL**을 사용합니다.
- 로케일 접미사가 붙은 복사본(`*.pt.mdx`) 또는 `content/{locale}/` 트리에서 링크를 수동으로 편집**하지 마십시오**. `sync` / `translate-docs`로 다시 생성하십시오.

참조: [문서 — 링크 재작성](/ko/guide/documents/link-rewriting) 및 [구성 — `docsOutput`](/ko/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## 로케일 코드

Fumadocs 앱 **정확히** `ai-i18n-tools.config.json`의 `targetLocales`를 `defineI18n().languages`와 일치시켜야 합니다. 점 예제는 짧은 코드(`pt`, `zh`)를 사용합니다. 디렉토리 구성은 BCP-47 폴더(`pt-BR`, `zh-Hans`)를 사용할 수 있습니다. 강제 정규화는 없으므로 코드가 일치하지 않으면 잘못된 출력 경로 또는 페이지가 누락됩니다.

<a id="multiple-collections"></a>
## 여러 컬렉션

Fumadocs 프로젝트는 `source.config.ts`(문서, 블로그, 예제)에 여러 `defineDocs` 블록을 정의할 수 있습니다. 각 컬렉션에 대해 `docs[]` 블록을 추가하고, 각 블록에自己的 `contentPaths`, `outputDir`, `docsRoot`를 지정합니다.

<a id="example-project"></a>
## 예시 프로젝트

[예제/Fumadocs 문서](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — `content/docs/`의 영어 MDX, `pt` 및 `zh` 점 접미사 페이지, `meta.json`, `lib/i18n/ui.{locale}.json` 커밋. `pnpm run dev`를 포트 **3080**에서 실행합니다.

<a id="cross-references"></a>
## 크로스 참조

- [설정 — `docsOutput`](/ko/reference/configuration#docsoutput)
- [출력 레이아웃](/ko/guide/documents/output-layouts)
- [Docusaurus 통합](/ko/guide/integrations/docusaurus)
- [Nextra 통합](/ko/guide/integrations/nextra) (dir 파서 멘탈 모델)
- [VitePress 통합](/ko/guide/integrations/vitepress) (UI 카탈로그 부트스트랩 패턴)
