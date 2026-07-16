<a id="vitepress-integration"></a>
# VitePress 통합

[VitePress](https://vitepress.dev/) 문서 사이트에 `init -t ui-vitepress` 및 `docsOutput.style: "vitepress"`를 사용하세요. 이 사전 설정은 빈 `localeSubpath`와 BCP-47 로케일 폴더 이름이 유지되는 `doc-system`의 별칭입니다 (`localePathLowercase`의 기본값은 `false`이므로 폴더는 `pt-BR`, `zh-Hans` 등으로 유지됩니다).

[문서](/ko/guide/documents/) 및 실행 가능한 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 데모도 참조하세요. `docs/` 아래의 이 리포지토리 자체 문서 사이트는 완전한 VitePress + ai-i18n-tools 참조입니다(9개 로케일, 테마 카탈로그, GitHub Pages).

<a id="quick-start"></a>
## 빠른 시작

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
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

`contentPaths`를 영어 `.md` 파일 및 디렉터리로 지정하세요. `docsRoot`를 VitePress가 콘텐츠 루트로 사용하는 폴더와 동일하게 설정하세요.

VitePress [국제화](https://vitepress.dev/guide/i18n)를 연결하세요: 영어는 `root`에, 각 대상 로케일은 `locales[code].link` 아래에 (예: `/pt-BR/`) 배치합니다. `ai-i18n-tools.config.json`의 `targetLocales`를 `.vitepress/config.mts`의 `locales` 키와 일치시키세요.

<a id="theme-strings"></a>
## 테마 문자열

VitePress 내비게이션, 사이드바, 푸터, 검색 플레이스홀더 및 기타 `themeConfig` 레이블은 마크다운에서 추출되지 않습니다. **`translate-docs`** 가 `.vitepress/config.mts`에서 영어 카탈로그를 부트스트랩(문자열이 인라인일 때)하고 로케일 테마 JSON 파일을 번역하도록 **`docsOutput.vitepressThemeCatalog`** 를 구성하세요:

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

- **`catalogPath`** — 생성된 영어 중첩 JSON(부트스트랩 출력). 영어가 `config.mts`에 있을 때 작성자는 이 파일을 수동으로 유지 관리하지 않습니다. 새로고침하려면 `sync`를 다시 실행하세요.
- **`outputPathTemplate`** (선택 사항) — 로케일별 출력; 기본값: `catalogPath`와 동일한 디렉터리에 `theme.{locale}.json`.

`init -t ui-vitepress`는 또한 해당 파일이 아직 존재하지 않을 때 시작용 `docs/.vitepress/config.mts` 및 `docs/.vitepress/i18n/theme.en.json`를 스캐폴드합니다. 구성은 `loadTheme()`를 통해 카탈로그를 로드하고 `themeConfigFor()`에 표준 VitePress i18n 레이블(`langMenuLabel` 포함)을 연결합니다.

`.vitepress/config.mts`에서 `loadTheme()`를 통해 로케일별 파일을 로드하고 번역된 JSON에서 `locales[code].themeConfig`를 빌드하세요. [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)를 참조하세요.

**언어 메뉴 문자열:** `locales[code].label`는 드롭다운에서 각 언어의 표시되는 이름입니다(예: `Português (Brasil)`). `themeConfig.langMenuLabel`는 언어 전환기 버튼의 **aria-label**입니다(VitePress 기본값: `Change language`). `langMenuLabel`를 테마 카탈로그에 넣고 `themeConfigFor()` 안에 `langMenuLabel: t.langMenuLabel`를 연결하세요 — 로케일별 `label` 문자열과 혼동하지 마세요.

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

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

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

| 영어 소스의 작성자 | 정규화 후 (영어 루트 출력) | 정규화 후 (번역된 `docs/<locale>/` 출력) |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/ko/guide/json)` | `[JSON](/ko/guide/json)` | `[JSON](/pt-BR/guide/json)` (로케일 접두사가 폴더와 일치) |
| `[Quick start](/ko/guide/quick-start)` 본문 또는 `hero.actions[].link` | 변경 없음 (`/guide/quick-start`) | `/pt-BR/guide/quick-start` |
| 로케일 인덱스의 `[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | 변경 없음 | 변경 없음 (공유 `docs/public/` 에셋) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 변경 없음 (전체 URL) | 변경 없음 (전체 URL) |

`docs/` 아래의 영어 루트 소스는 **로케일 중립적인** 사이트 라우트(`/guide/…`)를 유지합니다. `docs/<locale>/…`에 작성된 파일은 내부 콘텐츠 라우트에서 자동으로 로케일 접두사를 받습니다 — 여기에는 **홈 레이아웃 프론트매터** (`hero.actions[].link`, `features[].link`, `prev`/`next`)가 포함됩니다. `/ai-i18n-tools_logo.svg` 및 `/translation-dashboard.png`와 같은 공유 퍼블릭 에셋은 모든 로케일에서 접두사 없이 유지됩니다.

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

- 페이지 간 문서 링크: `docs/` 아래의 영어 마크다운에서는 **사이트 라우트** (`/guide/…`, `/reference/…`)를 사용하거나, 다른 프로젝트의 `docs/index.md`로 동기화될 README를 작성할 때는 `docs/guide/…` 경로를 사용하세요.
- 실행 가능한 데모, `LICENSE`, 기타 저장소 파일: `README.md` 및 문서에서 **전체 GitHub URL**을 사용하세요 ([README 및 문서 홈페이지](#readme-as-the-docs-homepage) 참조).
- `docs/<locale>/`의 링크는 직접 수정하지 **마세요** — `sync` / `translate-docs`로 다시 생성하세요.

[링크 재작성](/ko/guide/images-and-screenshots/link-rewriting) (플랫 vs VitePress) 및 [구성 — `docsOutput`](/ko/reference/configuration#docsoutput)도 참조하세요.
