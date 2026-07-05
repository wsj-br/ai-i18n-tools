<a id="output-layouts"></a>
# 출력 레이아웃

`docsOutput.style`은 번역된 마크다운 파일이 작성되는 위치를 제어합니다. 아래의 정확한 문자열 값을 `docs[].docsOutput.style`에서 사용하세요(별칭은 별도 엔진이 아닌 미리 설정된 레이아웃임).

`docsOutput.style = "nested"`(생략 시 기본값) — `{outputDir}/{locale}/` 아래에서 소스 트리를 미러링함(예: `docs/guide.md` → `i18n/de/docs/guide.md`).

`docsOutput.style = "doc-system"` — 정적 문서 사이트를 위한 로케일 접두사가 붙은 문서 트리. `docsRoot` 아래의 파일은 `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}`에 작성됨. `docsRoot` 외부의 경로는 중첩된 레이아웃으로 대체됨. 영어 소스 루트에 `docs[].docsOutput.docsRoot`를 설정하세요(예: `"docs"` 또는 `"src/content/docs"`). `docsOutput.style = "doc-system"`일 경우, `localeSubpath`을 명시적으로 설정해야 합니다(미리 설정된 별칭 중 하나를 사용하세요).

**별칭**(동일한 레이아웃 엔진, 사전 설정된 `localeSubpath`):

- `docsOutput.style = "docusaurus"` — `localeSubpath`은 기본적으로 `docusaurus-plugin-content-docs/current`(Docusaurus i18n 플러그인 레이아웃)입니다.
- `docsOutput.style = "astro-starlight"` — `localeSubpath`는 기본적으로 `""`입니다(번역된 페이지는 `{outputDir}/{locale}/` 바로 아래에 있으며, 영어가 콘텐츠 루트에 있고 `outputDir`이 `docsRoot`과 같을 때 [Starlight](https://starlight.astro.build/guides/i18n/)와 일치합니다).
- `docsOutput.style = "vitepress"` — `doc-system`과 동일한 레이아웃에 빈 `localeSubpath`이 있습니다. BCP-47 로케일 폴더 이름은 유지됩니다(`localePathLowercase`는 기본적으로 `false`입니다). [VitePress 통합](/guide/vitepress-integration)을 참조하십시오.

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

선택적 JSON 레이블 — `docusaurusCatalogDir`에서 가져온 Docusaurus 셸 문자열(MDX 본문 복사는 아님):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight는 여러 로케일의 UI 문자열을 제공하며, 필요 시 선택적 사용자 지정 UI 재정의는 별도의 `docs[]` 블록에서 `src/content/i18n/en.json`과 `jsonPathTemplate: "{outputDir}/{locale}.json"`을 사용합니다.

VitePress 탐색/사이드바/바닥글 문자열은 마크다운에 없습니다. `docs/.vitepress/i18n/theme.en.json`를 작성하고 JSON(`json[]`, `features.translateJson`)으로 번역하십시오. [VitePress 통합](/guide/vitepress-integration)을 참조하십시오.

`docsOutput.style = "flat"` — 로케일 접미사가 붙거나 하위 디렉터리에 소스 옆에 번역된 파일을 배치함. `docsOutput.style = "flat"`일 경우 페이지 간 상대 링크가 자동으로 다시 작성됨(`rewriteRelativeLinks: false` 또는 사용자 지정 `pathTemplate`이 설정된 경우 제외).

```text
docs/guide.md → i18n/guide.de.md
```

플랫 레이아웃의 페이지 간 앵커 링크에 대한 자세한 내용은 [앵커 링크](/guide/documents/anchor-links)를 참조하세요.

번역된 페이지의 스크린샷 및 래스터 자산에 대한 자세한 내용은 [이미지 및 스크린샷](/guide/images-and-screenshots/)을 참조하세요.

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` 플레이스홀더

번역된 파일이 기록되는 위치를 재정의하려면 `docs[].docsOutput.pathTemplate`(마크다운 및 MDX) 또는 `jsonPathTemplate`(JSON 레이블 파일)를 설정합니다. 둘 다 동일한 플레이스홀더를 허용합니다. 확인된 경로는 해당 블록의 `outputDir` 내에 유지되어야 합니다(CLI는 이를 벗어나는 경로를 거부합니다).

사용자 정의 `pathTemplate`을 사용하는 경우, 명시적으로 설정하지 않으면 `rewriteRelativeLinks`은 기본적으로 `false`가 됩니다. 상대 링크 재작성은 사용자 정의 템플릿 없이도 `docsOutput.style = "flat"`를 위해 설계되었습니다.

사용자 정의 템플릿 없이 기본 제공 레이아웃(`nested`, `flat`, `doc-system`)의 경우, `docsOutput.localePathLowercase`을 `true`로 설정하면 소문자 로케일 폴더 또는 파일 이름 조각(예: `pt-br`, `pt-BR` 대신)을 출력할 수 있습니다. `astro-starlight` 별칭은 기본값으로 `true`을 사용합니다. 사용자 정의 `pathTemplate` / `jsonPathTemplate` 값은 변경되지 않으며, BCP-47 형식의 `{locale}`는 유지하면서 소문자 조각이 필요한 경우 해당 위치에서 `{llocale}`을 사용하세요.

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
