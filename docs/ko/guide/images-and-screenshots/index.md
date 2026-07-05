<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
# ai-i18n-tools가 애셋으로 하는 작업(및 하지 않는 작업)

`translate-docs`는 마크다운/MDX 콘텐츠 — 이미지 대체 텍스트 포함 — 를 번역하지만, 래스터 파일을 복사, 생성 또는 출력하지 않습니다. 번역된 페이지에 로케일별 스크린샷이 필요하다면, 번역된 마크다운이 참조할 경로에 해당 파일을 배치해야 합니다.

`translate-svg`는 로케일별 이진 파일을 출력하는 유일한 명령입니다. 소스 SVG 파일을 읽고, 텍스트 요소(`<text>`, `<title>`, `<desc>`)를 번역하며, 로케일당 하나의 출력 SVG를 작성합니다. 도구는 래스터 파일(PNG, JPEG, WebP, GIF)을 절대 작성하지 않습니다.

---

<a id="design-for-i18n-from-the-start"></a>
# 처음부터 i18n을 위한 설계

스크린샷이 존재하기 전에 올바른 디렉토리 레이아웃을 선택하는 것은 나중에 로케일별 자산이 얼마나 수월한지를 결정짓는 가장 큰 요소입니다. 수십 개의 스크린샷이 커밋된 후 레이아웃을 수정하는 것은 경로를 재구성하고 모든 마크다운 참조를 업데이트해야 함을 의미합니다.

<a id="markdown-with-docsoutputstyle--flat-readme-user-guide"></a>
### `docsOutput.style = "flat"`를 사용한 Markdown (README, USER-GUIDE)

첫날부터 로케일 코드가 포함된 하위 디렉토리에 스크린샷을 저장하세요:

```
images/screenshots/en-GB/translate.png
images/screenshots/en-GB/settings.png
```

나중에 i18n을 추가할 때, 당신의 `take-screenshots` 스크립트는 모든 로케일에 대해 `images/screenshots/<locale>/`에 기록하고, 하나의 `regexAdjustments` 규칙이 모든 것을 처리합니다:

```json
{
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

일반 `[^/]+` 정규식은 모든 로케일 폴더 이름과 일치합니다. 소스 로케일(예: `screenshots/en-GB/`)을 하드코딩하지 마십시오. `sourceLocale`가 변경되면 문제가 발생합니다.

로케일 하위 디렉터리(`images/screenshots/translate.png`)를 생략하는 경로로 시작하는 경우, [로케일별 폴더](/guide/images-and-screenshots/per-locale-folder) 재작성이 작동하려면 전체 트리를 재구성해야 합니다.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### 문서 시스템 사이트(`docsOutput.style = "doc-system"`)

로케일 접두사가 있는 트리 아래에 번역된 페이지를 저장하는 정적 문서 사이트에 사용하세요 — Docusaurus i18n, Astro Starlight 및 동일한 형태를 따르는 사용자 정의 생성기. `docsRoot` 아래의 파일은 다음과 같이 작성됩니다:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docs[].docsOutput.docsRoot`를 영어 소스 루트(예: `"docs"` 또는 `"src/content/docs"`)로 설정합니다. `style: "doc-system"`를 직접 설정하는 경우, `localeSubpath`를 사이트에서 `{locale}/`와 번역된 파일 사이에 사용하는 경로 세그먼트로 설정해야 합니다. 별칭 `"docusaurus"`, `"astro-starlight"`, `"vitepress"`은 기본 `localeSubpath` 값이 있는 사전 설정 `doc-system` 레이아웃입니다([출력 레이아웃](/guide/documents/output-layouts) 참조).

| 사전 설정된 별칭 | 기본 `localeSubpath` | 예제 출력 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (비어 있음) | `src/content/docs/de/guide.md` |
| `"vitepress"` | `""` (비어 있음) | `docs/de/guide/quick-start.md` |

플랫 링크 리라이터는 `doc-system`에 대해 **작동하지 않습니다** (`"flat"`와는 다르게). `postProcessing.regexAdjustments`는 소스 마크다운에서 원래 URL을 봅니다 — 일반적으로 `/img/screenshots/en-GB/foo.png`와 같은 절대 경로 또는 사이트 루트 경로입니다.

**로케일별 폴더** 레이아웃은 스크린샷이 공유 정적 URL 트리에 있을 때 적용됩니다. 처음부터 로케일 코딩된 폴더와 일반 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 규칙을 사용합니다([구성 — 문서 시스템](#config---docsoutputstyle--doc-system) 참조).

**동일 위치 스크린샷**은 각 로케일의 번역된 문서가 마크다운 옆에 자산을 저장할 때 적용됩니다(URL 재작성 없음). 스크린샷 스크립트는 `{outputDir}`, `{locale}`, `{localeSubpath}`에서 파생된 경로에 PNG를 작성해야 합니다. 아래 Docusaurus 사전 설정은 참조 레이아웃입니다.

<a id="docusaurus-preset"></a>
#### Docusaurus 사전 설정

프로젝트 설정 시 두 가지 습관을 들이면 이후의 정규식 연결 작업을 완전히 없앨 수 있습니다:

1. 스크린샷을 추가하기 전에 심볼릭 링크 `documentation/docs/assets → ../static/assets`을(를) 생성하세요. Docusaurus의 webpack은 기본적으로 심볼릭 링크를 따르며, 이를 통해 원본 문서와 번역 문서 모두에서 동일한 상대 경로를 사용할 수 있습니다.

2. 모든 문서 자산(PNG 및 SVG 파일)을 `static/assets/`(하나의 디렉터리)에 저장하세요. 자산을 `static/img/`(SVG)과 `static/assets/`(PNG)로 나누지 마세요. 하나의 통합된 위치를 사용하면 영어 및 번역된 모든 문서 페이지에서 동일한 상대 경로 `../assets/name.ext`를 참조할 수 있습니다.

소스 마크다운에서는 항상 안정적인 상대 경로 `../assets/name.ext`을(를) 사용하여 자산을 참조하세요. 절대 경로 `/img/` 또는 `/assets/` URL을 문서 자산에 사용하지 마세요. 이러한 URL은 영어 원본(`static/`에서 제공됨)과 번역된 로케일(번역된 문서와 함께 제공됨) 간에 달라지며, 이로 인해 `regexAdjustments` 규칙을 사용하여 연결해야 합니다.

나중에 i18n을 추가하면 스크린샷 스크립트가 `getScreenshotDir` 분할을 채택하고([동일 위치 스크린샷](/guide/images-and-screenshots/colocated-screenshots) 참조) `translate-svg`은 `pathTemplate`를 사용합니다. 정규식 조정은 필요하지 않습니다.

> **참고:** `resolve.symlinks = false`을(를) `next.config.ts`에 설정하면 Next.js 애플리케이션의 webpack 빌드에서만 심볼릭 링크 해결이 비활성화됩니다. Docusaurus 문서 사이트 빌드에는 영향을 주지 않으며, 이는 별도의 webpack 인스턴스를 사용합니다.

<a id="astrostarlight-preset"></a>
#### Astro/Starlight 프리셋

`docsOutput.style = "doc-system"`에 `localeSubpath: ""`을 설정한 것과 동일하며, 번역된 페이지가 `{outputDir}/{locale}/` 바로 아래에 위치합니다.

처음부터 로케일 코드가 포함된 경로 아래에 스크린샷을 저장하세요:

```
public/img/screenshots/en-GB/screenshot.png
```

`regexAdjustments`에서 일반적인 정규식을 사용하세요:

```json
{
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

<a id="web-apps-nextjs-vite-etc-with-svg-assets"></a>
### SVG 자산을 사용하는 웹 앱(Next.js, Vite 등)

SVG 소스 파일은 전용 소스 디렉터리(예: `images/` 또는 `src/assets/`)에 보관하고, `svg.outputDir`를 별도의 제공 디렉터리(예: `public/assets/`)로 설정하세요. 소스 SVG 파일과 `translate-svg` 출력 파일을 동일한 폴더에 혼합하지 마세요 — 생성된 파일과 원본 파일을 구분할 수 없게 됩니다.

처음부터 SVG를 번역 가능하게 설계하세요: 모든 사람이 읽을 수 있는 레이블에는 `<text>`, `<title>`, `<desc>` 요소를 사용하세요. 텍스트를 경로 데이터로 직접 포함하지 마세요.

파일 시스템 및 CDN 간의 대소문자 구분 불일치를 방지하려면 `svg` 구성 블록에서 `forceLowercase: true`을(를) 활성화하세요.

---

<a id="decision-guide"></a>
# 결정 가이드

```
Is the asset an SVG with translatable text or labels?
  Yes → Web app SVG or Colocated SVG
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Colocated screenshots (rasters) + Colocated SVG (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Shared image
    Otherwise → Per-locale folder
```

SVG 레이아웃은 [SVG 번역](/guide/svg-translation/) 가이드에 설명되어 있습니다.

| 레이아웃 | 자산 유형 | 사이트 유형 | 도구 메커니즘 |
|--------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| [공유 이미지](/guide/images-and-screenshots/shared-image) | 래스터(공유) | `docsOutput.style = "flat"` 문서 | 파일별 링크 재작성기; 일반적으로 정규식 없음 |
| [로케일별 폴더](/guide/images-and-screenshots/per-locale-folder) | 래스터(로케일별) | `"flat"` 또는 `"doc-system"` (`"docusaurus"`, `"astro-starlight"` 포함) | `regexAdjustments` 로케일 세그먼트 교체 |
| [동일 위치 스크린샷](/guide/images-and-screenshots/colocated-screenshots) | 래스터(동일 위치) | 동일 위치 자산이 있는 `"doc-system"`(Docusaurus 사전 설정) | 스크린샷 스크립트가 파일을 배치합니다. 정규식 없음 |
| [웹 앱 SVG](/guide/svg-translation/translated-svg-web-app) | SVG(번역됨) | 웹 앱 | `translate-svg` 및 `svg.style = "flat"` |
| [동일 위치 SVG](/guide/svg-translation/translated-svg-colocated) | SVG(번역됨, 동일 위치) | 동일 위치 자산이 있는 `"doc-system"`(Docusaurus 사전 설정) | `translate-svg` 및 `svg.style = "nested"` + `pathTemplate` |
