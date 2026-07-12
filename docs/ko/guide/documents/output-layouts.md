<a id="output-layouts"></a>
# 출력 레이아웃

`docsOutput.style`은(는) 번역된 마크다운 파일이 작성되는 위치를 제어합니다. `docs[].docsOutput.style`에서 아래의 정확한 문자열 값을 사용하세요. 별칭은 별도의 엔진이 아닌 사전 설정된 `doc-system` 레이아웃(또는 Fumadocs 점 접미사 레이아웃)이며, 구성 로드 시 `stylePreset`에 원래 사전 설정을 유지하면서 별칭 `style` 값을 정규 `"doc-system"`로 다시 작성할 수 있습니다.

내장 레이아웃을 재정의하려면 `docs[].docsOutput.pathTemplate`(마크다운/MDX) 또는 `jsonPathTemplate`(JSON 라벨 파일)을 설정하세요. 아래의 [경로 템플릿 플레이스홀더](#pathtemplate--jsonpathtemplate-placeholders)를 참조하세요.

<a id="layout-overview"></a>
## 레이아웃 개요

| `docsOutput.style` | 엔진 | 일반적인 용도 |
| --- | --- | --- |
| `"nested"` | 로케일 폴더가 전체 소스 트리를 미러링 | 기본값; `{outputDir}/{locale}/` 하의 일반 i18n 출력 |
| `"flat"` | 파일명에 로케일 접미사 (선택적 하위 디렉터리) | README, 변경 로그, 저장소 루트 문서, [언어 전환기](/ko/guide/documents/language-switcher) |
| `"doc-system"` | 로케일 폴더 + `docsRoot` 하의 선택적 `localeSubpath` | 맞춤 정적 문서 생성기 |
| `"docusaurus"` | `doc-system` 사전 설정 | [Docusaurus](/ko/guide/integrations/docusaurus) i18n 플러그인 레이아웃 |
| `"astro-starlight"` | `doc-system` 사전 설정 (`localeSubpath: ""`) | [Astro Starlight](/ko/guide/integrations/astro#astro-starlight), 일반 Astro 로케일 페이지 |
| `"vitepress"` | `doc-system` 사전 설정 (`localeSubpath: ""`) | [VitePress](/ko/guide/integrations/vitepress) 영어 옆의 로케일 폴더 |
| `"nextra"` | `doc-system` 사전 설정 (`localeSubpath: ""`) | [Nextra](/ko/guide/integrations/nextra) 로케일 폴더 (`content/en/` → `content/{locale}/`) |
| `"fumadocs"` | 점 접미사(기본값) 또는 `fumadocsParser: "dir"`일 때 `doc-system` | [Fumadocs](/ko/guide/integrations/fumadocs) 점 또는 디렉터리 콘텐츠 레이아웃 |

<a id="nested-default"></a>
## `nested` (기본값)

`docsOutput.style = "nested"` (생략 시 기본값) — `{outputDir}/{locale}/` 하에 소스 트리를 미러링합니다.

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

`docsRoot`(설정된 경우) 외부의 경로는 동일한 중첩 구조를 사용합니다.

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — 파일명에 로케일 접미사를 사용하여 번역된 파일을 `outputDir` 아래에 작성합니다. 기본적으로 기본 이름만 유지되므로(`{outputDir}/{stem}.{locale}{extension}`), `flatPreserveRelativeDir`를 활성화하지 않으면 `docs/guide.md`와(과) `docs/other/guide.md`이(가) 충돌합니다.

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

`docsOutput.style = "flat"`일 때 페이지 간 상대 링크가 자동으로 다시 작성됩니다(`rewriteRelativeLinks: false` 또는 맞춤 `pathTemplate`이(가) 설정된 경우 제외). 페이지 간 `#anchor` 처리는 [앵커 링크](/ko/guide/documents/anchor-links)를 참조하세요.

<a id="flat-with-flatpreserverelativedir"></a>
### `flat`와 `flatPreserveRelativeDir` 함께

소스 하위 디렉터리를 `outputDir` 아래에 유지하려면 `docsOutput.flatPreserveRelativeDir`을(를) `true`(으)로 설정하세요. 여러 폴더에서 기본 이름을 공유하는 여러 마크다운 파일을 번역하거나, 평면 출력이 얕은 트리를 미러링해야 할 때(예: 저장소 루트의 README와 `docs/*.md`) 사용하세요.

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

평면 링크 재작성기는 에셋 URL의 깊이 접두사를 계산할 때 파일별 출력 경로를 사용합니다 — [링크 재작성](/ko/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)을 참조하세요.

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — 정적 문서 사이트를 위한 로케일 접두사 문서 트리입니다. `docsRoot` 아래의 파일은 다음 경로에 작성됩니다:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docsRoot` 외부의 경로는 [중첩](#nested) 레이아웃(`{outputDir}/{locale}/{relPath}`)으로 대체됩니다.

`docs[].docsOutput.docsRoot`를 영어 소스 루트로 설정하세요(예: `"docs"`, `"src/content/docs"` 또는 `"content/en"`). `docsOutput.style = "doc-system"`인 경우, `localeSubpath`를 명시적으로 설정해야 합니다(프리셋의 경우 아래 별칭을 사용하세요). 번역된 페이지가 `{outputDir}/{locale}/` 바로 아래에 위치할 때(Starlight 방식) `localeSubpath: ""`를 사용하세요.

`docusaurusCatalogDir`의 Docusaurus 셸 JSON 및 doc-system 프리셋 하의 기타 JSON 산출물은 마크다운과 동일한 폴더 레이아웃을 따릅니다. `style: "flat"`인 경우, `jsonPathTemplate`를 설정하지 않는 한 JSON 라벨 파일은 여전히 중첩 형태를 사용합니다.

<a id="doc-system-aliases"></a>
## Doc-system 별칭

**별칭** (동일한 `doc-system` 엔진, 프리셋 `localeSubpath` 및 기본값):

- `docsOutput.style = "docusaurus"` — `localeSubpath`의 기본값은 `docusaurus-plugin-content-docs/current`입니다(Docusaurus i18n 플러그인 레이아웃).
- `docsOutput.style = "astro-starlight"` — `localeSubpath`의 기본값은 `""`입니다; `localePathLowercase`의 기본값은 `true`입니다. `{outputDir}/{locale}/` 아래의 번역 페이지는 영어가 콘텐츠 루트에 있고 `outputDir`가 `docsRoot`과 같을 때 [Starlight](https://starlight.astro.build/guides/i18n/)와 일치합니다. 일반 Astro 로케일 페이지(`src/pages/index.astro` → `src/pages/{locale}/index.astro`)에도 사용됩니다 — [Astro 웹사이트 페이지](/ko/guide/ui-strings/astro-website#pages-parse-and-replace)를 참조하세요.
- `docsOutput.style = "vitepress"` — `doc-system`와 동일한 레이아웃이지만 `localeSubpath`가 비어 있습니다; BCP-47 로케일 폴더 이름이 보존됩니다(`localePathLowercase`의 기본값은 `false`). [VitePress 통합](/ko/guide/integrations/vitepress)을 참조하세요.
- `docsOutput.style = "nextra"` — `doc-system`와 동일한 레이아웃이지만 `localeSubpath`가 비어 있습니다; 영어 소스가 로케일 폴더 아래에 위치합니다(예: `content/en/`). [Nextra 통합](/ko/guide/integrations/nextra)을 참조하세요.

Docusaurus 사전 설정(기본 문서 페이지):

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight 사전 설정(동일한 블록 구조, 다른 경로):

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePress 사전 설정(콘텐츠 루트에 영어, 소스 옆에 로케일 폴더):

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Nextra 사전 설정(로케일 폴더 아래의 영어, 대상에 대한 형제 로케일 폴더):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

선택적 JSON 레이블 — `docusaurusCatalogDir`에서 가져온 Docusaurus 셸 문자열(MDX 본문 복사는 아님):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight는 여러 로케일의 UI 문자열을 제공하며, 필요 시 선택적 사용자 지정 UI 재정의는 별도의 `docs[]` 블록에서 `src/content/i18n/en.json`과 `jsonPathTemplate: "{outputDir}/{locale}.json"`을 사용합니다.

VitePress 내비게이션/사이드바/푸터 문자열은 마크다운에 없습니다 — `docsOutput.vitepressThemeCatalog`를 구성하고 **`translate-docs`** 내에서 번역하세요. [VitePress 통합](/ko/guide/integrations/vitepress)을 참조하세요.

Nextra 테마 사전(`.ts`)과 `_meta.ts` 사이드바 라벨은 마크다운에 없습니다 — `style: "nextra"`일 때 `docs[].nextraDictionaryPath`와 자동 `_meta` 수집을 사용하며, 모두 **`translate-docs`** 내에서 진행됩니다. [Nextra 통합](/ko/guide/integrations/nextra)을 참조하세요.

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — `docsOutput.fumadocsParser`를 통한 Fumadocs 콘텐츠 레이아웃:

- **`"dot"` (기본값)** — 영어 소스 아래 `outputDir` 경로의 파일명에 로케일 접미사를 사용합니다(로케일 폴더가 아님). 이는 `doc-system` 경로 형태와 별개입니다.

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — Nextra 방식의 로케일 폴더; `localeSubpath`가 비어 있는 동일한 `doc-system` 엔진을 사용합니다.

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Fumadocs UI 오버라이드(`lib/layout.shared.ts`)와 `meta.json` 사이드바 라벨은 마크다운에 없습니다 — `style: "fumadocs"`일 때 `docsOutput.fumadocsUiCatalog`와 자동 `meta.json` 수집을 사용하며, 모두 **`translate-docs`** 내에서 진행됩니다. [Fumadocs 통합](/ko/guide/integrations/fumadocs)을 참조하세요.

내장된 상대 링크 수정 외에 링크 및 애셋 URL 재작성에 대한 자세한 내용은 [링크 재작성](/ko/guide/documents/link-rewriting) (`docsOutput.postProcessing.regexAdjustments`)을 참조하세요.

번역된 페이지의 스크린샷 및 래스터 자산에 대한 자세한 내용은 [이미지 및 스크린샷](/ko/guide/images-and-screenshots/)을 참조하세요.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` 플레이스홀더

번역된 파일이 기록되는 위치를 재정의하려면 `docs[].docsOutput.pathTemplate`(마크다운 및 MDX) 또는 `jsonPathTemplate`(JSON 레이블 파일)를 설정합니다. 둘 다 동일한 플레이스홀더를 허용합니다. 확인된 경로는 해당 블록의 `outputDir` 내에 유지되어야 합니다(CLI는 이를 벗어나는 경로를 거부합니다).

사용자 정의 `pathTemplate`을 사용하는 경우, 명시적으로 설정하지 않으면 `rewriteRelativeLinks`은 기본적으로 `false`가 됩니다. 상대 링크 재작성은 사용자 정의 템플릿 없이도 `docsOutput.style = "flat"`를 위해 설계되었습니다.

내장 레이아웃(커스텀 템플릿 없이 `nested`, `flat`, `doc-system`)의 경우, `docsOutput.localePathLowercase`를 `true`로 설정하면 소문자 로케일 폴더 또는 파일명 세그먼트를 작성합니다(예: `pt-BR` 대신 `pt-br`). `astro-starlight` 별칭과 `localeSubpath`가 비어 있는 `doc-system`은 구성 로드 시 이 값을 `true`으로 기본 설정합니다. 커스텀 `pathTemplate` / `jsonPathTemplate` 값은 변경되지 않습니다 — `{locale}`를 BCP-47로 유지하면서 소문자 세그먼트가 필요한 경우 `{llocale}`를 사용하세요.

| 플레이스홀더            | 역할                                                                                                       | 예시                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | 이 문서 블록의 `outputDir`에 대한 절대 확인 경로                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | 대상 로캘 코드(설정/CLI에서와 동일한 형식) | `de`, `pt-BR` |
| `{LOCALE}` | 동일한 로캘을 대문자로 표기 | `DE`, `PT-BR` |
| `{llocale}`            | 동일한 로케일을 소문자로 표기(예: `pt-br`, `zh-cn`와 같은 Astro 라우트 폴더와 일치)                               | `de`, `pt-br`                                                    |
| `{relPath}` | 프로젝트 루트를 기준으로 한 소스 파일 경로, POSIX `/` | `docs/guide.md`, `README.md` |
| `{stem}` | 파일 이름 **확장자 없이** | `guide`에 대한 `docs/guide.md` |
| `{basename}` | 파일 이름 **와** 확장자 | `guide.md` |
| `{extension}` | 확장자 (점 포함) **including** the dot | `.md`, `.mdx` |
| `{docsRoot}`           | `docsOutput.docsRoot`의 절대 해석 경로 (생략 시 기본값 `docs`)                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | 경로 문자열이 일치할 경우 일치하는 `docsRoot` 접두사가 제거된 `{relPath}` (POSIX 기준); 그렇지 않으면 변경 없음 | `docs/guide.md` (일반적); 접두사 제거가 적용될 때만 `guide.md` |

**예시**

설정 조각:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

로케일 `de`, 소스 `docs/guide.md`, 프로젝트 루트 `/home/acme/repo`, 그리고 `outputDir`이(가) `/home/acme/repo/i18n`로 해결되는 경우, 확장된 경로는 다음과 같습니다:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`docsOutput.style = "flat"`과 사용자 정의 `pathTemplate` 없이, 일반적인 패턴은 `{stem}` 및 `{extension}`를 통해 파일 이름만 유지하는 것입니다. 예를 들어 `{outputDir}/{stem}.{locale}{extension}`는 해석된 `outputDir` 아래에 `…/guide.de.md`를 생성합니다.
