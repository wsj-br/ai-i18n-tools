<a id="vitepress-integration"></a>
# VitePress 통합

[VitePress](https://vitepress.dev/) 문서 사이트에 `init -t ui-vitepress` 및 `docsOutput.style: "vitepress"`를 사용하세요. 이 사전 설정은 빈 `localeSubpath`와 BCP-47 로케일 폴더 이름이 보존된 `doc-system`의 별칭입니다(`localePathLowercase`는 기본적으로 `false`이므로 폴더는 `pt-BR`, `zh-Hans` 등으로 유지됩니다).

또한 [문서](/guide/documents/) 및 실행 가능한 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 데모를 참조하십시오. 이 저장소의 `docs/` 아래에 있는 자체 문서 사이트는 완전한 VitePress + ai-i18n-tools 참조(9개 로케일, 테마 카탈로그, GitHub Pages)입니다.

<a id="quick-start"></a>
## 빠른 시작

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

페이지 콘텐츠와 VitePress 크롬 문자열을 한 번의 `sync` 실행으로 번역할 때 `features.translateDocs`를 활성화합니다.

<a id="page-layout"></a>
## 페이지 레이아웃

영어 마크다운은 VitePress 콘텐츠 루트(일반적으로 `docs/`)에 있습니다. 번역된 사본은 소스 트리 옆에 작성됩니다.

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

하나의 `docs[]` 블록을 구성합니다.

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

`contentPaths`를 영어 `.md` 파일 및 디렉터리를 가리키도록 설정합니다. `docsRoot`를 VitePress가 콘텐츠 루트로 사용하는 동일한 폴더로 설정합니다.

VitePress [국제화](https://vitepress.dev/guide/i18n)를 연결합니다. 영어는 `root`에, 각 대상 로케일은 `locales[code].link` 아래에 있습니다(예: `/pt-BR/`). `ai-i18n-tools.config.json`의 `targetLocales`를 `.vitepress/config.mts`의 `locales` 키와 일치하도록 유지합니다.

<a id="theme-strings"></a>
## 테마 문자열

VitePress 탐색, 사이드바, 바닥글, 검색 자리 표시자 및 기타 `themeConfig` 레이블은 마크다운에서 추출되지 않습니다. **`docsOutput.vitepressThemeCatalog`** 를 구성하여 **`translate-docs`** 가 `.vitepress/config.mts`에서 영어 카탈로그를 부트스트랩하고(문자열이 인라인일 때) 로케일 테마 JSON 파일을 번역하도록 합니다.

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

- **`catalogPath`** — 생성된 영어 중첩 JSON(부트스트랩 출력). 영어가 `config.mts`에 있을 때 작성자는 이 파일을 수동으로 유지 관리하지 않습니다. 새로 고치려면 `sync`를 다시 실행하십시오.
- **`outputPathTemplate`** (선택 사항) — 로케일별 출력; 기본값: `theme.{locale}.json`와 함께 `catalogPath`와 동일한 디렉터리.

`loadTheme()`를 통해 `.vitepress/config.mts`에 로케일별 파일을 로드하고 번역된 JSON에서 `locales[code].themeConfig`를 빌드합니다. [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)를 참조하십시오.

VitePress 테마 문자열에는 `json[]`를 **사용하지 마십시오**. 이 패턴은 관련 없는 앱 로케일 번들에만 해당됩니다.

<a id="wire-config-mts-to-generated-theme-json"></a>
## config.mts를 생성된 테마 JSON에 연결 (일회성)

`vitepressThemeCatalog`를 사용하여 첫 번째 성공적인 `i18n:sync` / `translate-docs` 실행 후, 저장소는 `theme.en.json` 및 `theme.{locale}.json`를 생성했지만, **기존** 사이트에는 여전히 `config.mts`에 하드코딩된 `text:` / `message:` 문자열이 있을 수 있습니다. VitePress는 config가 `loadTheme()`를 통해 로드할 때까지 번역된 JSON을 사용하지 않습니다.

**도구 범위 아님:** 자동 코드 수정. 프로젝트당 한 번만 아래 프롬프트를 사용하십시오(또는 예제 구성을 사용하여 수동으로 리팩터링).

1. **시기** — 첫 번째 동기화가 `catalogPath` 및 로케일 테마 파일을 생성한 후; 개발/빌드에서 번역된 탐색/사이드바를 기대하기 전.
2. **변경하지 마십시오** — 경로 링크(`/guide/…`), 로케일 키, `defineConfig` 구조, 비문자열 옵션(검색 공급자, 축소된 플래그).
3. **참조** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) 및 생성된 `theme.en.json` 형태.
4. **확인** — `pnpm docs:dev`, 탐색에서 로케일 전환, 사이드바/바닥글/검색 자리 표시자 번역 확인; `pnpm docs:build` 통과.

**예제 AI 에이전트 프롬프트** (Cursor 또는 다른 코딩 에이전트에 복사):

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

<a id="framework-shell-translation"></a>
## 프레임워크 셸 번역

| 프레임워크 | 셸 / 테마 문자열 | 파이프라인 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 카탈로그 (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 테마/탐색/사이드바 카탈로그 | 문서 — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` 사이드바 레이블 | 문서 — `style: "nextra"` + `translate-docs`일 때 자동 |
| Nextra | 테마 사전 `.ts` | 문서 — `docs[].nextraDictionaryPath` + `translate-docs` |
| Astro Starlight | 내장 UI 문자열(다국어); 추가 셸 파이프라인 없음 | 문서 — `translate-docs` (페이지 전용) |

**프레임워크 셸/테마 문자열을 `json[]`에 넣지 마십시오** — 해당 파이프라인은 관련 없는 앱 로케일 번들을 위한 것입니다. 다른 프레임워크 패턴에 대해서는 [Docusaurus 통합](/guide/docusaurus-integration) 및 [Nextra 통합](/guide/nextra-integration)을 참조하십시오.

<a id="example-project"></a>
## 예제 프로젝트

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — `docs/`의 영어 소스, 커밋된 `pt-BR` 및 `zh-Hans` 페이지 트리, 그리고 `theme.pt-BR.json` / `theme.zh-Hans.json`. 포트 3060에서 `pnpm run docs:dev`를 실행합니다.

<a id="readme-as-the-docs-homepage"></a>
## README를 문서 홈페이지로

일부 프로젝트는 `README.md`을 `docs/index.md`로 VitePress 사이트에 복사합니다(이 저장소는 `docs:build` 이전에 `scripts/sync-readme-to-docs.mjs`를 사용합니다). 이 패턴은 GitHub와 문서 사이트 간에 하나의 파일을 공유하지만, 링크 규칙은 다릅니다.

| 링크 유형 | GitHub에서 작동 | VitePress에서 작동 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | 예 | 아니요 — 사이트 경로를 사용하거나 동기화 중에 정규화 도구가 다시 작성하도록 허용 |
| `./LICENSE`, `examples/demo/` | 예 (저장소 상대) | 아니요 — **전체 URL** 사용 |
| `/guide/foo` | 아니요 | 예 |

**권장 사항:** `README.md`에서는 VitePress 콘텐츠 트리( `LICENSE`, `examples/`, 구성 파일, 에이전트 컨텍스트 파일) 외부의 모든 항목과 `translated-docs/` 아래의 번역된 README 사본에 **전체 URL**을 사용하세요. 사이트 내 문서 링크에는 `docs/guide/…` 경로(또는 `docs/` 아래의 영어 문서에서는 사이트 경로)를 사용하세요. 동기화 스크립트와 `rewriteVitepressLinks` 정규화 도구가 이를 `/guide/…` 경로로 변환합니다.

예시:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## 링크 규칙

VitePress는 콘텐츠 루트에서 영어 페이지를 제공하고 `docs/<locale>/…`에서 로케일 복사본을 제공하지만, **페이지 내 링크는 저장소 상대 경로(예: `docs/guide/quick-start.md` 또는 `../guide/quick-start.md`)가 아닌 사이트 경로(`/guide/quick-start`, `/reference/configuration`)를 사용해야 합니다.** 이러한 README 스타일 경로는 GitHub에서는 작동하지만 VitePress 내에서는 중단됩니다(개발 및 GitHub Pages에서 404 오류).

내장된 정규화 도구를 활성화하여 `translate-docs`가 모든 번역된 파일의 링크를 자동으로 수정하도록 합니다.

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks`은 `style`이 `"vitepress"`일 때 기본적으로 활성화됩니다.

| 영어 원본 작성 | 정규화 도구 적용 후 |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| 로케일 인덱스의 `[Home](./README.md)` | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 변경 없음 (전체 URL) |

**작성 규칙**

- 페이지 간 문서 링크: `docs/` 아래의 영어 마크다운에서는 **사이트 경로**(`/guide/…`, `/reference/…`)를 사용하거나, `README.md`에서 동기화할 때는 `docs/guide/…` 경로를 사용합니다.
- 실행 가능한 데모, `LICENSE` 및 기타 저장소 파일: `README.md` 및 문서에서 **전체 GitHub URL**을 사용합니다([README를 문서 홈페이지로 사용](#readme-as-homepage) 참조).
- `docs/<locale>/`의 링크를 수동으로 편집**하지 마세요** — `sync` / `translate-docs`로 다시 생성하세요.

[링크 재작성](/guide/images-and-screenshots/link-rewriting)(플랫 vs VitePress) 및 [구성 — `docsOutput`](/reference/configuration#docsoutput)도 참조하십시오.
