<a id="fumadocs-integration"></a>
# Fumadocs 통합

Next.js App Router에서 [Fumadocs](https://www.fumadocs.dev/) 4 문서 사이트를 위한 `init -t ui-fumadocs`와 `docsOutput.style: "fumadocs"`를 사용합니다. 프리셋은 빈 `localeSubpath`과 BCP-47 또는 짧은 로케일 코드가 보존된 `doc-system`의 별칭입니다 (`localePathLowercase`는 `false`가 기본값입니다).

[Documents](/ko/guide/documents/)와 실행 가능한 [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) 데모(점 구문 분석기, 포트 3080)를 참조하십시오.

<a id="quick-start"></a>
## 빠른 시작

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
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

<a id="enable-i18n-in-an-existing-site"></a>
### 기존 사이트에서 i18n 활성화하기

영어 전용 Fumadocs 앱은 `translate-docs`가 형제 파일을 작성하기 전에 로케일 경로와 `defineI18n`가 필요합니다. 첫 설정은 [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website#run-the-agent-prompt)의 프롬프트를 사용합니다. 이 페이지의 [에이전트 프롬프트](#agent-prompt)는 UI 카탈로그를 연결하는 후속 작업입니다. 체크리스트:

- `languages`, `defaultLanguage`, `parser: "dot"` 또는 `"dir"`와(과) 함께 `lib/i18n.ts`에 `defineI18n`을(를) 설정합니다.
- `proxy.ts`(예제 파일)에서 경로를 `app/[lang]/`하고 `createI18nMiddleware`합니다.
- `lib/layout.shared.ts`에 `i18n.translations()`을(를) 설정하고 `i18nProvider`에 전달합니다.
- 컬렉션 루트(점) 또는 `content/docs/en/`(디렉터리) 아래에 영어 MDX를 배치합니다.
- `targetLocales`은(는) `languages`에서 기본 언어를 뺀 다음 `sync`한 값과 같습니다.

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

Fumadocs는 사이드바 구조와 제목을 위해 JSON `meta.json` 파일을 사용합니다. `docsOutput.style`가 `"fumadocs"`일 때, `translate-docs`는 `docsRoot`(또는 `docs[].fumadocsMetaGlob`) 아래의 `meta.json`를 수집하고, `docs[].fumadocsMetaTranslatableKeys`에 나열된 키(기본값: `title`, `description`)에 대한 문자열 값을 번역하며, 로케일 출력을 작성합니다:

| 파서 | 소스 로케일 | 출력 |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **디렉토리** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**번역하지 않습니다** `pages` 슬러그 배열, `root`, `icon`, `defaultOpen`, 또는 기타 구조 키 — 읽을 수 있는 레이블만 번역합니다.

<a id="ui-catalog"></a>
## UI 카탈로그

Fumadocs 레이아웃 크롬(검색 플레이스홀더, 로케일 표시 이름 및 `lib/layout.shared.ts`의 기타 `defineTranslations` / `i18n.translations()` 재정의)은 마크다운에서 추출되지 않습니다. `docsOutput.fumadocsUiCatalog`를 구성하여 `translate-docs`가 `sourcePath`에서 소스 로케일 카탈로그를 부트스트랩하고 로케일별 JSON을 번역하도록 하세요:

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

- `catalogPath` — 영어 플랫 JSON. 부트스트랩은 `sourcePath`에 있는 `.add({ … })`의 `en` 객체만 읽습니다. 해당 객체의 문자열 리터럴은 카탈로그 키(`displayName`, `Search(search trigger)`)가 됩니다. `.add()`는 Fumadocs UI 프리셋에 등록된 키만 허용하므로, `site.title`와 같은 탐색 제목은 그곳에 있을 수 없습니다. 예시에서는 JSON에 `site.title`을 유지하고 `nav.title`에 대해 `catalog["site.title"]`를 읽습니다. 파일에 이미 있지만 `en` 객체에 없는 키는 유지됩니다: 병합은 `{ ...existing, ...extracted }`입니다. 영어 리터럴이 변경되면 `sync`를 다시 실행하세요.
- `outputPathTemplate` (선택 사항) — 로케일별 출력; 기본값: `catalogPath` 옆의 `ui.{locale}.json`.

번역된 키는 앱이 읽을 때까지 아무 작업도 수행하지 않습니다. `i18n.translations().get(lang)`은(는) `.extend()`(Fumadocs UI 프리셋)에 등록된 키만 반환합니다. 해당 키가 적용되도록 로케일 카탈로그를 `.add()`에 전개하고, 영어 이름의 번역이 이를 대체하지 않도록 전개 **뒤에** 네이티브 `displayName`을(를) 배치하세요.

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title`은(는) Fumadocs UI 키가 아닙니다. 예제에서는 `nav.title`을(를) 위해 카탈로그에서 이를 읽습니다. `ui.pt-BR.json`에만 존재하는 검색 레이블은 해당 전개(또는 다른 읽기)가 사용할 때까지 내장 프리셋에 남아 있습니다.

[examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts)를 참조하세요.

표준 로케일은 `@fumadocs/language/*` 프리셋으로 처리될 수 있으며, LLM 비용이 들지 않습니다. 카탈로그는 영어 블록에서만 **프로젝트 오버라이드**를 번역합니다.

<a id="agent-prompt"></a>
## 에이전트 프롬프트

영어 전용 Fumadocs 사이트에 로케일을 추가해야 할 때 이것을 복사하세요. 라우팅과 UI 카탈로그를 연결합니다. 문자열은 번역하지 않습니다.

<details class="agent-prompt">
<summary>UI 카탈로그 프롬프트</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

**Fumadocs UI 문자열**에 `json[]`를 사용하지 마십시오. 해당 파이프라인은 관련된 앱 로케일 번들을 위한 것입니다.

<a id="link-conventions"></a>
## 링크 규칙

Fumadocs는 Next.js 미들웨어(`/docs/getting-started`, `/pt/docs/getting-started`)를 통해 로케일 접두사가 붙은 경로를 제공합니다. 활성 로케일 접두사가 자동으로 적용되도록 **페이지 내 링크는 로케일 중립적이어야 합니다**(`/docs/getting-started`).

내장된 정규화 도구를 활성화하여 `translate-docs`가 모든 번역된 파일의 링크를 자동으로 수정하도록 하세요:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks`는 `style`이 `"fumadocs"`일 때 기본적으로 활성화됩니다.

| 소스 로케일에서 작성 | 정규화 도구 적용 후 |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/ko/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | 변경 없음 (전체 URL) |

**작성 규칙**

- 페이지 간 문서 링크: 영어 MDX에서 **로케일 중립 사이트 경로** (`/docs/…`)를 사용하거나, `content/docs/…` / 상대 `.mdx` 경로를 사용하고 `sync` 동안 정규화 도구가 다시 작성하도록 하세요.
- 콘텐츠 트리 외부의 저장소 파일: **전체 URL**을 사용하세요.
- 로케일 접미사가 붙은 사본(`*.pt.mdx`) 또는 `content/{locale}/` 트리에서 링크를 수동으로 편집**하지 마세요** — `sync` / `translate-docs`로 다시 생성하세요.

참조: [문서 — 링크 재작성](/ko/guide/documents/link-rewriting) 및 [구성 — `docsOutput`](/ko/reference/configuration#docsoutput).

<a id="locale-codes"></a>
## 로케일 코드

Fumadocs 앱에서 `ai-i18n-tools.config.json`의 `targetLocales`를 `defineI18n().languages`와 **정확히** 일치시키세요. 점 예시는 짧은 코드(`pt`, `zh`)를 사용합니다. 디렉터리 구성은 BCP-47 폴더(`pt-BR`, `zh-Hans`)를 사용할 수 있습니다. 강제 정규화는 없습니다 — 코드가 일치하지 않으면 잘못된 출력 경로가 생성되거나 페이지가 누락됩니다.

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
