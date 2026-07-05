<a id="vitepress-integration"></a>
# VitePress 통합

[VitePress](https://vitepress.dev/) 문서 사이트에 `init -t ui-vitepress` 및 `docsOutput.style: "vitepress"`를 사용하세요. 이 사전 설정은 빈 `localeSubpath`와 BCP-47 로케일 폴더 이름이 보존된 `doc-system`의 별칭입니다(`localePathLowercase`는 기본적으로 `false`이므로 폴더는 `pt-BR`, `zh-Hans` 등으로 유지됩니다).

참고: [문서](/guide/documents/), [JSON](/guide/json)(테마 문자열), 실행 가능한 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) 데모. 이 저장소의 `docs/` 아래에 있는 자체 문서 사이트는 완전한 VitePress + ai-i18n-tools 참조(9개 로케일, 테마 JSON, GitHub Pages)입니다.

<a id="quick-start"></a>
## 빠른 시작

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

하나의 `sync` 실행에서 페이지 콘텐츠와 VitePress 크롬 문자열을 번역할 때 `features.translateDocs`와 `features.translateJson`를 모두 활성화하세요.

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

VitePress 탐색, 사이드바, 바닥글, 검색 자리 표시자 및 기타 `themeConfig` 레이블은 마크다운에서 추출되지 않습니다. 중첩된 JSON 카탈로그(예: `docs/.vitepress/i18n/theme.en.json`)를 작성하고 JSON으로 번역하세요.

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

`.vitepress/config.mts`에서 로케일별 파일을 로드하고 번역된 JSON(탐색 텍스트, 사이드바 그룹 제목, 바닥글 메시지 등)에서 `locales[code].themeConfig`을 빌드합니다. `config.mts`에 번역된 레이블을 하드코딩하지 마세요. 영어가 변경될 때 `sync` / `translate-json`로 다시 생성하세요.

이 패키지는 [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts)에서 `theme.{locale}.json`을 로드합니다. 최소한의 두 로케일 설정을 위해 [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)와 비교해 보세요.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus 대 VitePress 셸 JSON

| 프레임워크 | 셸 / 테마 문자열 | 파이프라인 |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` 카탈로그 (`{ message, description }`) | Documents — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | 직접 작성하는 사용자 지정 중첩 JSON 카탈로그 | JSON — `json[]` + `translate-json` (또는 `translateJson`이(가) 켜져 있을 때 `sync`) |

VitePress 테마 JSON을 `docs[]`에 넣지 마세요. 대신 `json[]`을 사용하세요.

<a id="example-project"></a>
## 예제 프로젝트

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — `docs/`의 영어 소스, 커밋된 `pt-BR` 및 `zh-Hans` 페이지 트리, 그리고 `theme.pt-BR.json` / `theme.zh-Hans.json`. 포트 3060에서 `pnpm run docs:dev`를 실행합니다.

<a id="readme-as-homepage"></a>
## README를 문서 홈페이지로 사용

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
