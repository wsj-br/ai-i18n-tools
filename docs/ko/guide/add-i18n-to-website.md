<a id="add-i18n-to-a-website-or-docs-site"></a>
# 웹사이트 또는 문서 사이트에 i18n 추가하기

이 페이지에서는 단일 언어로 된 문서 사이트(Markdown 또는 MDX) 또는 마케팅/정적 사이트(Astro 웹사이트 또는 일반 HTML)에 ai-i18n-tools를 사용하여 로케일을 추가하는 방법을 설명합니다. 이 도구는 LLM 공급자의 모델을 사용하여 페이지 콘텐츠를 번역하고 언어별로 현지화된 사본을 작성합니다. 사이트 프레임워크는 해당 사본을 제공하고 언어 전환기를 제공합니다.

가장 빠른 방법은 코딩 에이전트에 이 페이지의 프롬프트를 제공하는 것입니다. 그러면 해당 프레임워크의 i18n이 활성화되고 구성이 확인됩니다. CLI를 설치하고, 공급자를 선택하고, 프로젝트를 직접 초기화해야 합니다. 이는 API 키와 선택 사항이 필요하기 때문입니다. 또한 계정 비용이 발생하므로 번역도 직접 실행해야 합니다.

UI 문자열이 `t()` 호출에 있는 앱의 경우, [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python)를 사용하세요. 사이트 프레임워크가 없는 리포지토리 README는 [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 사용합니다. 어떤 것이 적용되는지 확실하지 않다면, 마지막에 있는 [해당하지 않나요?](#not-your-case)를 참조하세요.

<a id="steps"></a>

흐름:

1. [CLI 설치 및 공급자 선택](#install-and-choose-a-provider).
2. `init`를 사용하여 [프로젝트 초기화](#initialise-the-project).
3. [에이전트 프롬프트 실행](#run-the-agent-prompt).
4. [결과 검토](#review-the-result).
5. [모델 선택 및 번역](#choose-models-and-translate) 후 한 언어를 확인합니다.
6. [번역 유지](#keep-it-translated).

변경 사항을 직접 적용하고 싶거나 프롬프트가 무엇을 하는지 알고 싶으신가요? [수동으로 진행하기](#do-it-by-hand)에서 동일한 단계를 하나씩 안내합니다.

<a id="install-and-choose-a-provider"></a>
## 설치 및 공급자 선택

이 부분은 에이전트가 아닌 사용자가 직접 수행합니다. 설치 프로그램은 사용자 시스템을 변경하며, API 키는 프롬프트가 아닌 셸에 속하는 비밀 정보입니다.

패키지를 개발 종속성으로 설치합니다. VitePress 구성은 `prefixVitepressThemeConfigLinks`를 `ai-i18n-tools`에서 가져오고, 일반 HTML 페이지는 패키지에서 `i18n.js`를 복사합니다. 독립 실행형 실행 파일은 사이트가 `ai-i18n-tools/runtime`를 가져오지 않고 구성에서 패키지를 가져오지 않는 경우에만 충분합니다. 다른 설치 옵션: [설치](/ko/guide/installation).

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 및 `yarn add --dev ai-i18n-tools`도 작동합니다. 아래 예시에서는 순수 `ai-i18n-tools` 명령을 사용합니다. 로컬 설치에는 `PATH`에 `node_modules/.bin`가 필요하거나 각 명령 앞에 `pnpm exec`가 필요합니다. [CLI 사용](/ko/guide/installation#using-the-cli)을 참조하세요.

설치 확인:

```bash
ai-i18n-tools --version
```

그런 다음 공급자를 선택하고 번역을 실행할 셸에 API 키를 설정합니다. 예를 들어, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama는 키가 필요 없습니다. 다른 사전 설정: [내장 공급자](/ko/guide/providers-and-models#built-in-providers). 다음 단계에서 `init`에 전달해야 하므로 공급자 이름을 기록해 두세요. 에이전트는 키가 필요 없습니다. 모델 호출을 하지 않는 명령만 실행합니다. 키는 나중에 [번역](#choose-models-and-translate)할 때 사용합니다.

<a id="initialise-the-project"></a>
## 프로젝트 초기화

프롬프트 전에 이 작업을 한 번 실행합니다. 그러면 `ai-i18n-tools.config.json`가 작성되고 위에서 선택한 공급자가 사용됩니다. 기존 사이트에서 i18n을 켜지는 않습니다. 그것은 프롬프트입니다.

| 귀하의 사이트 | 초기화 템플릿 | 세부 정보 가이드 |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/ko/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/ko/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/ko/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/ko/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/ko/guide/integrations/fumadocs) |
| 일반 Astro 웹사이트 | `ui-astro-website` | [Astro](/ko/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| 브라우저에서 언어를 전환하는 하나의 HTML 파일 | `ui-plain-html` | [일반 HTML 앱](/ko/guide/ui-strings/plain-html) |
| 로케일당 하나의 번역된 HTML 파일 | `docs-plain-html` | [HTML 페이지](/ko/guide/documents/html-pages) |
| 사이트 프레임워크 없음, README 및 Markdown 파일만 | `docs-markdown`, 또는 모든 템플릿과 `--with-readme` | [README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

테이블의 템플릿에 `ui-vitepress`를 바꿉니다. 그런 다음 `sourceLocale`, `targetLocales`, `docs[].contentPaths`를 편집합니다. `sourceLocale`는 페이지의 언어입니다. 모든 BCP-47 언어가 유효합니다. `contentPaths`는 해당 언어로 작성된 페이지와 폴더여야 합니다. 템플릿의 경로는 시작점입니다. `docsOutput.style`는 템플릿에 이미 설정되어 있습니다. `ui-astro-website` 및 `ui-plain-html`는 `ui` 블록과 빈 `docs` 배열을 작성합니다. 페이지 HTML을 번역할 때 프롬프트는 일반 Astro 사이트에 페이지-HTML `docs` 블록을 추가합니다.

`init`를 한 번 실행합니다. 이 명령은 매번 `ai-i18n-tools.config.json`을 다시 작성하므로, 두 번째 실행 시에는 사용자가 변경한 내용이 삭제됩니다.

<a id="run-the-agent-prompt"></a>
## 에이전트 프롬프트 실행

코딩 에이전트(Cursor, Claude Code, Copilot 등)에서 프로젝트를 열고, 새 채팅을 시작한 다음 아래 프롬프트를 붙여넣습니다. 프로젝트는 이미 초기화되어 있어야 합니다. 편집할 내용은 없습니다. 프레임워크 세부 정보를 생략하려면 같은 메시지에서 언급하세요.

에이전트는 먼저 CLI와 구성이 존재하는지 확인하고, 하나라도 없으면 지침과 함께 중지합니다. 그런 다음 프레임워크를 감지하고 해당 프레임워크의 로케일 라우팅을 활성화합니다. CLI를 설치하거나, 구성을 초기화하거나, API 키를 읽거나, 번역하지 않습니다. 번역은 검토 후 단계이며, 직접 실행합니다.

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## 결과 검토

에이전트는 보고서로 끝냅니다. 번역하기 전에 확인하세요.

- 차이점. 프레임워크 로케일 구성, `contentPaths` 및 브랜치가 설명하는 라우팅이어야 합니다. 원본 페이지 내용은 이전과 동일하게 읽혀야 합니다. `git diff --stat`는 변경된 양을 보여줍니다.
- `targetLocales`는 프레임워크가 제공할 로케일 키와 일치합니다.
- `contentPaths`는 도구가 작성해야 하는 로케일 폴더가 아니라 원본 언어 페이지를 가리킵니다.
- 생성된 로케일 트리는 편집되지 않았습니다: `docs/<locale>/`, 로케일 HTML, `content/<locale>/`, `theme.<locale>.json`, 또는 `write-translations`의 원본 카탈로그 외의 Docusaurus `i18n/<locale>/` 폴더.
- 프로젝트의 빌드 또는 타입 검사가 여전히 통과합니다.

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

이 부분은 사용자가 실행합니다. 사용자 API 키를 사용하며 사용자 계정에서 비용이 발생합니다.

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`는 `translationModels`만 대체합니다. 동일한 순위는 `ai-i18n-tools dashboard`의 [모델](/ko/guide/translation-dashboard/models) 탭에 있습니다.

그런 다음 번역하고 빌드합니다:

```bash
ai-i18n-tools sync
```

`sync`는 `features.translateDocs`가 켜져 있을 때 `translate-docs`를 실행하고, UI 문자열이 켜져 있을 때( `ui-plain-html` 및 `t()`도 사용하는 일반 Astro 사이트) `extract`와 `translate-ui`를 실행합니다. `ai-i18n-tools translate-docs`는 문서 단계를 자체적으로 실행합니다.

<a id="what-gets-translated"></a>
### 번역되는 내용

페이지 본문은 [문서](/ko/guide/documents/) 파이프라인을 거칩니다. 프레임워크 크롬(탐색, 사이드바, 테마 레이블)은 프레임워크가 지원하는 동일한 실행에서 처리됩니다. 이는 별도의 [JSON](/ko/guide/json) 파이프라인이 아닙니다. 브라우저에서 언어를 전환하는 일반 HTML 페이지는 예외입니다. `mark-html` 및 `translate-ui`은 플랫 JSON을 작성하고 브라우저 스크립트가 이를 적용합니다. 로케일당 하나의 HTML 파일은 문서 파이프라인에 남아 있습니다.

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

첫 번째 `sync` 이후에도 일부 프레임워크는 명령이 방금 작성한 카탈로그를 로드하기 위해 구성이 필요합니다. 해당 프롬프트는 통합 페이지에 있습니다. [VitePress 테마 카탈로그](/ko/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off), [Nextra 사전](/ko/guide/integrations/nextra#agent-prompt-dictionary-and-routes), [Fumadocs UI 카탈로그](/ko/guide/integrations/fumadocs#agent-prompt).

<a id="check-one-language"></a>
### 한 언어 확인

사이트를 빌드하고 브라우저에서 지역화된 경로 하나를 엽니다. 프레임워크 자체의 로케일 드롭다운이 전환기입니다. 브라우저에서 전환되는 하나의 HTML 파일의 경우, 런타임이 채우는 선택기를 사용합니다. 로케일당 하나의 HTML 파일의 경우, 로케일 폴더 아래의 파일을 엽니다.

아직 원본 언어로 되어 있는 텍스트는 `contentPaths`에서 제외되었거나, 코드 펜스, URL, 헤딩 앵커이거나, 경로가 연결되지 않은 경우입니다. 아직 원본 언어로 되어 있는 VitePress 탐색 레이블은 테마 카탈로그입니다. 먼저 `sync`을 실행한 다음, 문자열이 여전히 구성에 인라인으로 있는 경우 [테마 카탈로그 프롬프트](/ko/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)를 실행합니다.

<a id="keep-it-translated"></a>
## 번역 유지

원본 페이지가 변경된 후 `ai-i18n-tools sync`을 다시 실행합니다. 캐시는 새롭거나 변경된 텍스트만 모델로 전송됨을 의미합니다. 파이프라인이 작성하는 로케일 트리를 커밋합니다. `ai-i18n-tools dashboard`은 번역을 검토하기 위해 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

동일한 실행에서 `README.md`를 번역하려면, `--with-readme`로 스캐폴드합니다 (또는 기존 구성에 블록을 추가합니다). [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="do-it-by-hand"></a>
## 수동으로 수행하기

변경 사항을 직접 적용하거나 프롬프트가 무엇을 하는지 알고 싶다면 다음 단계를 따르세요. 마지막에는 여전히 [CLI를 설치](#install-and-choose-a-provider), [프로젝트를 초기화](#initialise-the-project), [번역](#choose-models-and-translate)해야 합니다.

1. `contentPaths` 및 `docsRoot`을 원본 언어 페이지로 지정합니다. 템플릿 경로는 시작점입니다.
2. 프레임워크의 로케일 라우팅을 활성화합니다. 템플릿과 일치하는 브랜치를 사용합니다. 통합 페이지에 전체 참조가 있습니다.

프레임워크가 카탈로그에서 읽는 셸 문자열은 첫 번째 `sync` 이후에 연결됩니다. 아래 각 브랜치는 해당 후속 조치를 연결합니다.

<a id="vitepress"></a>
### VitePress

`locales.root` 및 대상당 하나의 `locales[code]`을 추가하고, 탐색 및 사이드바 링크에 `prefixVitepressThemeConfigLinks`를 접두사로 붙입니다. 첫 번째 `sync`에 인라인 테마 문자열을 남겨둡니다. 체크리스트: [기존 사이트에서 i18n 활성화](/ko/guide/integrations/vitepress#enable-i18n-in-an-existing-site). `sync`가 `theme.<locale>.json`를 작성한 후, 구성에 문자열이 여전히 인라인으로 있는 경우 [테마 카탈로그 프롬프트](/ko/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)를 붙여넣습니다.

<a id="docusaurus"></a>
### Docusaurus

`i18n` 블록을 추가하고, `docusaurusCatalogDir`을 원본 카탈로그로 지정한 다음 `docusaurus write-translations`를 실행합니다. 체크리스트: [기존 사이트에서 i18n 활성화](/ko/guide/integrations/docusaurus#enable-i18n-in-an-existing-site). 셸 JSON: [셸 문자열](/ko/guide/integrations/docusaurus#shell-strings-write-translations).

<a id="nextra"></a>
### Nextra

MDX를 `content/<sourceLocale>/` 아래로 이동하고, `app/[lang]/`을 추가하고 원본 사전 모듈을 추가합니다. 체크리스트: [기존 사이트에서 i18n 활성화](/ko/guide/integrations/nextra#enable-i18n-in-an-existing-site). [사전 프롬프트](/ko/guide/integrations/nextra#agent-prompt-dictionary-and-routes)는 동일한 연결을 위한 더 긴 통과입니다. `t()`가 필요한 앱 React: [하이브리드 프롬프트](/ko/guide/integrations/nextra#optional-t-for-app-react-hybrid).

<a id="fumadocs"></a>
### Fumadocs

`defineI18n`, `app/[lang]/` 및 미들웨어를 추가합니다. `fumadocsParser`를 `dot` 또는 `dir`와 일치시킵니다. 체크리스트: [기존 사이트에서 i18n 활성화](/ko/guide/integrations/fumadocs#enable-i18n-in-an-existing-site). [UI 카탈로그 프롬프트](/ko/guide/integrations/fumadocs#agent-prompt)는 경로가 존재한 후 `i18n.translations()`를 연결합니다.

<a id="astro-starlight"></a>
### Astro Starlight

`locales`를 추가하고, 원본 언어에 접두사가 없는 경우 `root`을 포함합니다. 페이지는 `src/content/docs/`에 남아 있습니다. 체크리스트: [기존 사이트에서 i18n 활성화](/ko/guide/integrations/astro#enable-i18n-in-an-existing-site). Starlight는 자체 UI 문자열을 제공합니다. `slug` 사이드바 항목을 선호합니다.

<a id="plain-astro"></a>
### Plain Astro

Astro의 `i18n.locales`를 켜고, 페이지 HTML을 번역해야 하는 경우 [Plain Astro](/ko/guide/integrations/astro#plain-astro-marketing-and-app-sites)에서 `docs` 블록을 추가합니다. Frontmatter `t()` 호출은 i18next를 설치하지 않고 [JS/TS 프롬프트](/ko/guide/add-i18n-to-js#run-the-agent-prompt)를 사용합니다. Astro는 빌드 시 `t`를 해결합니다.

<a id="plain-html"></a>
### 일반 HTML

두 가지 옵션이 있으며, 파일은 그중 하나에 속합니다.

- 브라우저에서 언어를 전환하는 단일 페이지: `ui-plain-html`. `ai-i18n-tools mark-html`을(를) 실행하고 (드라이 런, 그 다음 `--write`), `i18n.js`을(를) 로드합니다. [일반 HTML 앱](/ko/guide/ui-strings/plain-html)을(를) 참조하세요.
- 로케일당 번역된 HTML 파일 하나: `docs-plain-html`. [HTML 페이지](/ko/guide/documents/html-pages)를 참조하세요.

이것이 마지막 수동 단계입니다. [모델 선택 및 번역](#choose-models-and-translate)에서 계속하세요.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 보유한 항목 | 읽을 내용 |
| --- | --- |
| 앱 UI 문자열 | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) 또는 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) |
| Django, Flask-Babel 카탈로그 또는 이미 GNU gettext를 사용하는 앱 | [Django / Python gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext) |
| 사이트 옆의 리포지토리 README 또는 마크다운 파일(사이트 프레임워크 없음) | [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme). `init … --with-readme`은(는) 사이트 템플릿 옆에 해당 블록을 추가합니다. |
| 독립형 중첩 로케일 JSON | [JSON](/ko/guide/json) |
| 단일 구성의 사이트 및 앱 문자열 | [파이프라인 결합](/ko/guide/combining-pipelines) |

공유 옵션 및 프레임워크별 차이점에 대한 참조: [통합](/ko/guide/integrations/).

<a id="examples"></a>
## 예시

| 예시 | 표시되는 내용 |
| --- | --- |
| [vitepress-docs](/ko/examples#vitepress-docs) | VitePress 페이지 및 테마 카탈로그 |
| [docusaurus-docs](/ko/examples#docusaurus-docs) | Docusaurus 페이지 및 셸 JSON |
| [astro-docs](/ko/examples#astro-docs) | Starlight 페이지 |
| [nextra-docs](/ko/examples#nextra-docs) | Nextra 4 경로 및 사전 |
| [fumadocs-docs](/ko/examples#fumadocs-docs) | Fumadocs 경로 및 UI 카탈로그 |
| [astro-website](/ko/examples#astro-website) | Astro 랜딩 페이지, HTML 및 `t()` |
| [plain-html](/ko/examples#plain-html) | 단일 HTML 파일, `data-i18n` 마커 |
| [plain-html-docs](/ko/examples#plain-html-docs) | 로케일당 단일 HTML 파일 |

`npx degit`를 사용하여 하나를 복사합니다. 명령: [예시](/ko/examples#nodejs-examples).
