<a id="vitepress-integration"></a>
# VitePress 통합

[VitePress](https://vitepress.dev/) 문서 사이트에 `init -t ui-vitepress` 및 `docsOutput.style: "vitepress"`를 사용하세요. 이 사전 설정은 빈 `localeSubpath`와 BCP-47 로케일 폴더 이름이 유지되는 `doc-system`의 별칭입니다 (`localePathLowercase`의 기본값은 `false`이므로 폴더는 `pt-BR`, `zh-Hans` 등으로 유지됩니다).

[문서](/ko/guide/documents/) 및 실행 가능한 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 데모도 참조하세요. `docs/` 아래의 이 리포지토리 자체 문서 사이트는 완전한 VitePress + ai-i18n-tools 참조입니다(9개 로케일, 테마 카탈로그, GitHub Pages).

<a id="quick-start"></a>
## 빠른 시작

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

페이지 콘텐츠와 VitePress 크롬 문자열을 한 번의 `sync` 실행으로 번역할 때 `features.translateDocs`를 활성화하세요.

<a id="page-layout"></a>
## 페이지 레이아웃

영어 마크다운은 VitePress 콘텐츠 루트(일반적으로 `docs/`)에 있습니다. 번역된 사본은 소스 트리 옆에 작성됩니다:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

하나의 `docs[]` 블록을 구성하세요:

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

`contentPaths`이(가) `sourceLocale`로 작성된 `.md` 파일 및 디렉터리를 가리키도록 하십시오. 해당 언어는 모든 언어가 될 수 있습니다. `docsRoot`을(를) VitePress가 콘텐츠 루트로 사용하는 동일한 폴더로 설정하십시오.

VitePress [국제화](https://vitepress.dev/guide/i18n)를 연결합니다. 소스 로캘은 `root`에, 각 대상 로캘은 `locales[code].link` 아래에(예: `/pt-BR/`) 둡니다. `ai-i18n-tools.config.json`의 `targetLocales`을(를) `.vitepress/config.mts`의 `locales` 키와 일치하도록 유지하십시오.

<a id="enable-i18n-in-an-existing-site"></a>
### 기존 사이트에서 i18n 활성화하기

영어 전용 VitePress 구성에서 번역된 페이지가 표시되려면 다음 부분이 필요합니다. [에이전트 프롬프트](#wire-configmts-to-generated-theme-json-one-off)는 테마 카탈로그 부분을 다룹니다.

- 영어용 `locales.root`(`label`, `lang`, `themeConfig`).
- 대상 로캘당 하나의 `locales[code]` 항목: `label`, `lang`, `link: '/${code}/'` 및 로캘별 `title` / `description`.
- `prefixVitepressThemeConfigLinks`를 사용하여 로캘별로 접두사가 붙은 `themeConfig` 링크 및 `activeMatch`([테마 탐색/사이드바 링크](#theme-navsidebar-links) 참조).
- 해당 `locales` 키와 일치하는 `targetLocales`, 그런 다음 `docs/<locale>/` 및 `theme.<locale>.json`이(가) 존재하도록 `sync`.

<a id="theme-strings"></a>
## 테마 문자열

VitePress 탐색, 사이드바, 바닥글, 검색 자리 표시자 및 기타 `themeConfig` 레이블은 마크다운에서 추출되지 않습니다. **`translate-docs`** 이(가) (문자열이 인라인일 때) `.vitepress/config.mts`에서 소스 로캘 카탈로그를 부트스트랩하고 로캘 테마 JSON 파일을 번역하도록 **`docsOutput.vitepressThemeCatalog`** 을(를) 구성하십시오.

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — 영어 중첩 JSON. `config.mts`의 부트스트랩은 해당 영어 문자열이 아직 구성에 인라인으로 있는 동안에만 적용됩니다. `themeConfigFor`이(가) 카탈로그를 읽은 후에는 `mergeThemeCatalogs`이(가) 기존 파일을 유지하고 `theme.en.json`이(가) 신뢰할 수 있는 단일 소스가 됩니다. 문구가 변경되면 해당 파일을 편집하십시오(또는 하나의 `sync`를 위해 영어를 `config.mts`에 다시 넣으십시오). 키 이름을 바꾸면 세그먼트 해시(`path`, NUL 바이트, 그 다음 값)가 변경되므로 다음 `sync`은(는) 모든 대상 로캘에 대해 해당 문자열을 한 번씩 다시 번역합니다.
- **`outputPathTemplate`**(선택 사항) — 로캘별 출력, 기본값: `theme.{locale}.json`이(가) 있는 `catalogPath`와(과) 동일한 디렉터리.

`init -t ui-vitepress`는 또한 해당 파일이 아직 존재하지 않을 때 시작용 `docs/.vitepress/config.mts` 및 `docs/.vitepress/i18n/theme.en.json`를 스캐폴드합니다. 구성은 `loadTheme()`를 통해 카탈로그를 로드하고 `themeConfigFor()`에 표준 VitePress i18n 레이블(`langMenuLabel` 포함)을 연결합니다.

`.vitepress/config.mts`에서 `loadTheme()`를 통해 로케일별 파일을 로드하고 번역된 JSON에서 `locales[code].themeConfig`를 빌드하세요. [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)를 참조하세요.

**언어 메뉴 문자열:** `locales[code].label`은(는) 드롭다운에 있는 각 언어의 표시 이름입니다(예: `Português (Brasil)`). `themeConfig.langMenuLabel`은(는) 언어 전환 버튼의 **aria-label**입니다. VitePress는 옵션이 생략될 때 `Change language`을(를) 사용합니다. 예제 카탈로그는 대신 `Language`을(를) 저장하며, `theme.en.json`와 `config.hardcoded.example.mts` 모두 동일한 문장을 사용합니다. `langMenuLabel`을(를) 테마 카탈로그에 넣고 `themeConfigFor()` 내부에 `langMenuLabel: t.langMenuLabel`을(를) 연결하십시오. 로캘별 `label` 문자열과 혼동하지 마십시오.

`sync` / `translate-docs` 동안, `theme.en.json`의 카탈로그 키가 `config.mts`에서 참조되지 않으면(예: `themeConfigFor()`에 `t.langMenuLabel` 누락) ai-i18n-tools가 경고합니다.

VitePress 테마 문자열에 `json[]`를 **사용하지 마세요** — 해당 패턴은 관련 없는 앱 로케일 번들에만 사용됩니다.

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## config.mts를 생성된 테마 JSON에 연결(일회성)

`vitepressThemeCatalog`를 사용한 첫 번째 성공적인 `i18n:sync` / `translate-docs` 실행 후, 리포지토리는 `theme.en.json` 및 `theme.{locale}.json`를 생성했지만 **기존** 사이트에는 여전히 `config.mts`에 하드코딩된 `text:` / `message:` 문자열이 있을 수 있습니다. 구성이 `loadTheme()`를 통해 로드할 때까지 VitePress는 번역된 JSON을 사용하지 않습니다.

**도구 범위 외:** 자동 코드모드. 프로젝트당 한 번 아래 프롬프트를 사용하거나(또는 예시 설정을 사용해 수동으로 리팩터링).

1. **시점** — 첫 동기화 후 `catalogPath`와 로케일 테마 파일이 생성된 이후; 개발/빌드에서 번역된 nav/sidebar를 기대하기 전.
2. **변경 금지** — 라우트 링크(`/guide/…`), 로케일 키, `defineConfig` 구조, 비문자열 옵션(검색 제공자, 축소 플래그).
3. **참조** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) 및 생성된 `theme.en.json` 형태.
4. **검증** — `pnpm docs:dev`, nav에서 로케일 전환, sidebar/footer/search 플레이스홀더 번역 확인; `pnpm docs:build` 통과.

**AI 에이전트 프롬프트 예시** (Cursor 또는 다른 코딩 에이전트에 복사):

<details class="agent-prompt">
<summary>테마 카탈로그 프롬프트</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress chrome through
`docsOutput.vitepressThemeCatalog`. `extractVitepressThemeCatalog` writes
positional keys while English is still inline in `config.mts`
(`themeConfig.nav.0.text`, `themeConfig.sidebar.0.items.0.text`,
`locales.root.label`). The runnable example uses stable names instead
(`nav.guide`, `sidebar.gettingStarted`, `site.title`):
https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts

Reshape to named keys once and keep those names. Renaming changes the segment
hash, so the next `sync` re-translates the theme catalog for every locale (a few
dozen short strings, once). After the refactor, `config.mts` has no inline
display literals, `mergeThemeCatalogs` keeps `theme.en.json`, and that file is
the source of truth. Do not tell the user to refresh the catalog from
`config.mts` after this edit.

`translate-docs` does not rewrite links in `config.mts`. Locale pages must
prefix `link` and `activeMatch` or they point at English routes.

## Scope

Edit `.vitepress/config.mts` and `theme.en.json` only. Skip markdown bodies,
route paths, `base`, search provider choice, collapsed flags, and external URLs.

## Call shape

Precondition: `docsOutput.vitepressThemeCatalog` is set and `sync` has already
written `catalogPath`. If `theme.en.json` is missing, stop and ask for that
`sync` first.

1. Add `ai-i18n-tools` as a devDependency. Import
   `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`.
2. Add `loadTheme(localeFile)` that reads `docs/.vitepress/i18n/` via
   `import.meta.url` and `fileURLToPath`. If a locale file is missing
   (`fs.existsSync`), fall back to the English theme so a fresh checkout does
   not crash before the first translation.
3. Rename positional keys in `theme.en.json` to short stable names. Update
   `themeConfigFor` to read those names. Keep links and structure in TypeScript.
   Only display strings come from the catalog.
4. If you keep positional keys instead, read them with string indexes:
   `t.themeConfig.nav["0"].text`. A numeric index `nav[0]` is invisible to the
   unused-key check and warns for every nav and sidebar entry.
5. Wrap the object `themeConfigFor` returns with
   `prefixVitepressThemeConfigLinks(themeConfig, localeRoutePrefix)`. Pass
   `/${code}` for each target locale and `null` for root. That prefixes `link`
   and `activeMatch`.
6. Per locale entry: `label` (native language name), `lang`,
   `link: '/${code}/'`, and that locale's `title` and `description` from the
   catalog.
7. Keys the extractor does not collect must be added to `theme.en.json` by hand,
   then referenced from `themeConfigFor`. That includes local-search copy under
   `search.options.locales.<code>.translations` (`button.buttonText`,
   `modal.noResultsText`, and the rest of that tree). Current VitePress docs do
   not use `options.placeholder` for local search. Also add
   `socialLinks[].ariaLabel`. A `notFound.title` inline in config is collected
   because `title` is a known key; `notFound.quote`, `notFound.linkText`,
   `notFound.linkLabel`, and `notFound.code` are not.

## Order

1. Confirm the catalog file exists.
2. Reshape keys, wire `loadTheme` and `themeConfigFor`, prefix links.
3. Ask the user to run `sync` so locale theme files are regenerated from the new
   key names. Do not hand-translate them.

## Do not

- Do not translate strings yourself.
- Do not leave a second copy of the same label in `config.mts` and in
  `theme.en.json`.
- Do not hand-edit `theme.<locale>.json`.
- Do not change markdown paths, `base`, or the path of internal links (only the
  locale prefix).

## Verify

- `pnpm docs:dev`: English and one target locale show translated nav, sidebar,
  footer, and search chrome.
- A locale page's nav `link` and `activeMatch` include the locale prefix
  (`/pt-BR/guide/`, not `/guide/`).
- `pnpm docs:build` passes.
- Removing a locale theme file still builds, because `loadTheme` falls back to
  English.

## Report back

List files changed, the old path key and the new name for each rename, any
string you added by hand because the extractor skips it, and anything you left
inline on purpose.
````

</details>

<a id="example-project"></a>
## 예시 프로젝트

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — `docs/`의 영어 소스, 커밋된 `pt-BR` 및 `zh-Hans` 페이지 트리, 그리고 `theme.pt-BR.json` / `theme.zh-Hans.json`. 포트 3060에서 `pnpm run docs:dev` 실행.

<a id="readme-and-the-docs-homepage"></a>
## README 및 문서 홈페이지

다운스트림 프로젝트에서는 때때로 `README.md`를 빌드 스크립트나 수동 동기화를 통해 VitePress 사이트의 `docs/index.md`로 복사합니다. 이 패턴은 GitHub와 문서 사이트 간에 하나의 파일을 공유하지만, 링크 규칙이 다릅니다:

| 링크 유형 | GitHub에서 작동 | VitePress에서 작동 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | 예 | 아니오 — 사이트 라우트를 사용하거나 동기화 중 노멀라이저가 재작성하도록 허용 |
| `./LICENSE`, `examples/demo/` | 예 (저장소 상대 경로) | 아니오 — **전체 URL** 사용 |
| `/guide/foo` | 아니오 | 예 |

**동기화된 README → index 권장 사항:** `README.md`에서 VitePress 콘텐츠 트리 외부의 모든 항목(`LICENSE`, `examples/`, 설정 파일, 에이전트 컨텍스트 파일) 및 `translated-docs/` 아래의 번역된 README 사본에 대해 **전체 URL**을 사용하십시오. 사이트 내 문서 링크에는 `docs/guide/…` 경로(또는 `docs/` 아래 영어 문서에서 사이트 라우트)를 사용하십시오; 동기화 스크립트나 `rewriteVitepressLinks` 노멀라이저가 이를 `/guide/…` 라우트로 변환할 수 있습니다.

**이 리포지토리는** `README.md`와 `docs/index.md`을 **독립된 파일**로 유지합니다: README는 간결한 GitHub/npm 랜딩 페이지이며, `docs/index.md`는 `/guide/` 및 `/reference/`로 연결되는 문서 사이트 진입점입니다. 상세 가이드는 `docs/` 아래에 있습니다 — README에 긴 참조 자료를 중복하지 마세요. 공유된 정보가 변경되면 각각의 대상 독자에 맞게 업데이트하세요.

다른 프로젝트에서 동기화된 README의 예시 링크:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/ko/guide/quick-start)
```

<a id="link-conventions"></a>
## 링크 규칙

VitePress는 콘텐츠 루트에서 영어 페이지를 제공하고 `docs/<locale>/…`에서 로케일 복사본을 제공하지만, **페이지 내 링크는 사이트 라우트를 사용해야** 합니다 (`/guide/quick-start`, `/reference/configuration`) — `docs/guide/quick-start.md` 또는 `../guide/quick-start.md`와 같은 저장소 상대 경로를 사용하지 마세요. 이러한 README 스타일의 경로는 GitHub에서는 작동하지만 VitePress 내부에서는 작동하지 않습니다(개발 환경 및 GitHub Pages에서 404 발생).

내장 노멀라이저를 활성화하여 `translate-docs`가 모든 번역 파일의 링크를 자동으로 수정하도록 하세요:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks`는 `style`이(가) `"vitepress"`일 때 기본적으로 활성화됩니다.

| 소스 로캘의 작성자 | 정규화 프로그램 이후(소스 로캘 루트 출력) | 정규화 프로그램 이후(번역된 `docs/<locale>/` 출력) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/ko/guide/json)` | `[JSON](/ko/guide/json)` | `[JSON](/pt-BR/guide/json)`(로캘 접두사가 폴더와 일치) |
| `[Quick start](/ko/guide/quick-start)` 본문 또는 `hero.actions[].link` | 변경 없음 (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| 로케일 인덱스의 `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | 변경 없음 | 변경 없음 (공유 `docs/public/` 에셋) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 변경 없음 (전체 URL) | 변경 없음 (전체 URL) |

`docs/` 아래의 소스 로캘 파일은 **로캘 중립적인** 사이트 경로(`/guide/…`)를 유지합니다. 이 예에서는 영어를 `sourceLocale`(으)로 사용합니다. 모든 언어가 유효합니다. `docs/<locale>/…`에 작성된 파일은 **홈 레이아웃 프런트매터**(`hero.actions[].link`, `features[].link`, `prev`/`next`)를 포함하여 내부 콘텐츠 경로에 로캘 접두사가 자동으로 붙습니다. `/ai-i18n-tools_logo.svg` 및 `/translation-dashboard.png`와(과) 같은 공유 공용 애셋은 모든 로캘에서 접두사가 붙지 않은 상태로 유지됩니다.

<a id="theme-navsidebar-links"></a>
### 테마 탐색/사이드바 링크

`translate-docs`는 `.vitepress/config.mts`의 링크를 재작성하지 **않습니다**. Navbar 및 sidebar `link` 값은 TypeScript에서 한 번 작성되며, 구성 빌드 시 로케일별로 접두사를 지정해야 합니다.

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting)는 **로케일 전환기**만 제어합니다(사용자가 다른 언어를 선택할 때 동등한 페이지 매핑). 현재 로케일 페이지에서 정적 `nav` / `sidebar` href를 재작성하지 **않습니다**.

`ai-i18n-tools`에서 `prefixVitepressThemeConfigLinks`를 사용하세요(markdown 링크 재작성과 동일한 접두사 규칙):

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

로케일 라우트에서 nav 하이라이팅이 작동하도록 **`link`** 와 함께 **`activeMatch`** 에 접두사를 지정하세요(`/guide/`이(가) 아닌 `/pt-BR/guide/`). 외부 URL 및 공유 퍼블릭 에셋은 변경되지 않습니다.

VitePress 프로젝트에 `ai-i18n-tools`을(를) **devDependency**로 추가하세요(`examples/vitepress-docs/package.json` 참조). 이를 통해 `config.mts`가 `prefixVitepressThemeConfigLinks`을(를) 임포트할 수 있습니다. 기본 ai-i18n-tools 문서 사이트는 모노레포 체크아웃을 자체적으로 사용(dogfood)하므로 `src/processors/…`에서 직접 임포트합니다. 독립 복사본(degit)은 npm 패키지를 사용해야 합니다.

**작성 규칙**

- 페이지 간 문서 링크: `docs/` 아래의 영어 마크다운에서는 **사이트 경로**(`/guide/…`, `/reference/…`)를 사용하고, 다른 프로젝트의 `docs/index.md`로 동기화될 README를 작성할 때는 `docs/guide/…` 경로를 사용합니다.
- 실행 가능한 데모, `LICENSE` 및 기타 리포지토리 파일: `README.md` 및 문서에서는 **전체 GitHub URL**을 사용합니다([README 및 문서 홈페이지](#readme-and-the-docs-homepage) 참조).
- `docs/<locale>/`의 링크는 **직접 수정하지** 마시고 `sync` / `translate-docs`를 사용하여 다시 생성하십시오.

[링크 재작성](/ko/guide/images-and-screenshots/link-rewriting) (플랫 vs VitePress) 및 [구성 — `docsOutput`](/ko/reference/configuration#docsoutput)도 참조하세요.
