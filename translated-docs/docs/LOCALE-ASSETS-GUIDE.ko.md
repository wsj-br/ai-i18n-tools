<a id="locale-assets-guide"></a>
# 로케일 리소스 가이드

이 가이드는 `ai-i18n-tools`을 사용하는 프로젝트에서 로케일별 리소스(스크린샷(PNG, JPEG, WebP) 및 일러스트레이션 SVG 파일)를 처리하는 방법을 설명합니다. 각 사용 가능한 패턴과 그 사용 시기, 그리고 나중에 로케일을 추가할 때 구조적 재작업이 필요 없는 프로젝트 초기 설정 방법을 안내합니다.

SVG 설정 참조는 [GETTING_STARTED.md](GETTING_STARTED.ko.md)의 [`svg`](#svg) 섹션을 참조하세요. `postProcessing.regexAdjustments` 옵션은 [설정 참조](GETTING_STARTED.ko.md#configuration-reference)를 참조하세요.

| 구성 경로 | 값 | 사용 사례 | 참고 사항 |
|-------------|-------|----------|-------|
| `docs[].docsOutput.style` | `"flat"` | 로케일 접미사가 붙은 README / USER-GUIDE 파일 | 평면 링크 재작성기 활성화; 소스가 하위 디렉터리에 있는 경우 `flatPreserveRelativeDir`와 함께 사용 |
| `docs[].docsOutput.style` | `"nested"` (기본값) | `outputDir` 아래의 간단한 로케일 하위 폴더 | 평면 링크 재작성기 미사용 |
| `docs[].docsOutput.style` | `"doc-system"` | 로케일 접두사가 붙은 문서 트리 (사용자 생성기) | `docsRoot` 및 `localeSubpath` 설정; 평면 링크 재작성기 미실행 |
| `docs[].docsOutput.style` | `"docusaurus"` / `"astro-starlight"` | 미리 정의된 `doc-system` 레이아웃 | 생성기별 기본값이 지정된 `localeSubpath`에 대한 별칭 |
| `svg.style` | `"flat"` | 웹 앱(`name.<locale>.svg`이 `public/assets/`에 있음) | 마크다운 `style`와 별도; `translate-svg`에서 사용 |
| `svg.style` | `"nested"` | 문서 시스템과 함께 위치한 SVG 출력 | 종종 `pathTemplate`와 함께 사용(패턴 E) |

이 가이드는 영어 단어 대신 구성 파일의 정확한 JSON 문자열을 사용하여 번역본에서도 의미가 명확하게 유지되도록 합니다. 로드 시 이전 키(`documentations`, `markdownOutput`)는 허용되지만, 새 구성에서는 `docs` 및 `docsOutput` 사용을 권장합니다.

<small>**다른 언어로 읽기:** </small>
<small id="lang-list">[English (UK)](../../docs/LOCALE-ASSETS-GUIDE.md) · [Deutsch](./LOCALE-ASSETS-GUIDE.de.md) · [Español](./LOCALE-ASSETS-GUIDE.es.md) · [Français](./LOCALE-ASSETS-GUIDE.fr.md) · [Hindi (Roman)](./LOCALE-ASSETS-GUIDE.hi-Latn.md) · [日本語](./LOCALE-ASSETS-GUIDE.ja.md) · [한국어](./LOCALE-ASSETS-GUIDE.ko.md) · [Português (Brasil)](./LOCALE-ASSETS-GUIDE.pt-BR.md) · [简体中文](./LOCALE-ASSETS-GUIDE.zh-Hans.md) · [繁體中文](./LOCALE-ASSETS-GUIDE.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [ai-i18n-tools가 자산(asset)과 함께 수행하는 작업 및 미수행 작업](#what-ai-i18n-tools-does-and-does-not-do-with-assets)
- [초기부터 i18n을 고려한 설계](#design-for-i18n-from-the-start)
  - [`docsOutput.style = "flat"`를 사용한 Markdown (README, USER-GUIDE)](#markdown-with-docsoutputstyle--flat-readme-user-guide)
  - [문서 시스템 사이트(`docsOutput.style = "doc-system"`)](#doc-system-sites-docsoutputstyle--doc-system)
    - [Docusaurus 프리셋](#docusaurus-preset)
    - [Astro/Starlight 프리셋](#astrostarlight-preset)
  - [SVG 자산을 사용하는 웹 앱(Next.js, Vite 등)](#web-apps-nextjs-vite-etc-with-svg-assets)
- [결정 가이드](#decision-guide)
- [패턴 A - 공유 래스터](#pattern-a---shared-raster)
  - [구현 예시](#implementation-example)
- [패턴 B - 로케일별 폴더(URL 재작성)](#pattern-b---per-locale-folder-url-rewriting)
  - [디렉터리 구조](#directory-layout)
  - [스크린샷 스크립트 계약](#screenshot-script-contract)
  - [구성 - `docsOutput.style = "flat"`](#config---docsoutputstyle--flat)
  - [구성 - `docsOutput.style = "doc-system"`](#config---docsoutputstyle--doc-system)
  - [프리셋 - `docsOutput.style = "docusaurus"`](#preset---docsoutputstyle--docusaurus)
  - [프리셋 - `docsOutput.style = "astro-starlight"`](#preset---docsoutputstyle--astro-starlight)
- [패턴 C - 함께 위치한 래스터(`doc-system`)](#pattern-c---colocated-raster-doc-system)
  - [디렉터리 구조](#directory-layout-1)
  - [스크린샷 스크립트 계약](#screenshot-script-contract-1)
  - [설정](#config)
  - [전제 조건](#prerequisites)
  - [구현 예시](#implementation-example-1)
- [패턴 D - `svg.style = "flat"`를 사용한 번역된 SVG](#pattern-d---translated-svg-with-svgstyle--flat)
  - [구성](#config-1)
  - [앱 참조](#app-reference)
  - [소스 구조 권장 사항](#source-layout-recommendation)
  - [구현 예시](#implementation-example-2)
- [패턴 E - 함께 위치한 번역된 SVG (문서 시스템)](#pattern-e---colocated-translated-svg-doc-system)
  - [구성](#config-2)
  - [소스 마크다운](#source-markdown)
  - [SVG 소스 위치](#svg-source-location)
  - [`pathTemplate` 자리 표시자](#pathtemplate-placeholders)
  - [구현 예시](#implementation-example-3)
- [평면 링크 재작성기 및 2단계 흐름](#the-flat-link-rewriter-and-two-step-flow)
  - [`docsOutput.style = "flat"`일 때의 2단계 흐름](#two-step-flow-when-docsoutputstyle--flat)
  - [`flatPreserveRelativeDir`를 사용한 파일별 깊이 접두사](#per-file-depth-prefix-with-flatpreserverelativedir)
  - [`rewriteRelativeLinks` 및 `linkRewriteDocsRoot`](#rewriterelativelinks-and-linkrewritedocsroot)
- [일반적인 실수 및 문제 해결](#common-mistakes-and-troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="what-ai-i18n-tools-does-and-does-not-do-with-assets"></a>
## ai-i18n-tools가 자산에 대해 하는 일 (및 하지 않는 일)

`translate-docs`는 마크다운/MDX 콘텐츠 — 이미지 대체 텍스트 포함 — 를 번역하지만, 래스터 파일을 복사, 생성 또는 출력하지 않습니다. 번역된 페이지에 로케일별 스크린샷이 필요하다면, 번역된 마크다운이 참조할 경로에 해당 파일을 배치해야 합니다.

`translate-svg`는 로케일별 이진 파일을 출력하는 유일한 명령입니다. 소스 SVG 파일을 읽고, 텍스트 요소(`<text>`, `<title>`, `<desc>`)를 번역하며, 로케일당 하나의 출력 SVG를 작성합니다. 도구는 래스터 파일(PNG, JPEG, WebP, GIF)을 절대 작성하지 않습니다.

---

<a id="design-for-i18n-from-the-start"></a>
## 처음부터 i18n을 고려한 디자인

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

일반적인 `[^/]+` 패턴은 모든 로케일 폴더 이름과 일치합니다 — 소스 로케일(예: `screenshots/en-GB/`)을 하드코딩하지 마세요. `sourceLocale`가 변경되면 그게 깨집니다.

로케일 하위 디렉터리를 생략한 경로(`images/screenshots/translate.png`)로 시작하는 경우, 패턴 B를 사용하기 전에 전체 트리를 재구성해야 합니다.

<a id="doc-system-sites-docsoutputstyle--doc-system"></a>
### 문서 시스템 사이트(`docsOutput.style = "doc-system"`)

로케일 접두사가 있는 트리 아래에 번역된 페이지를 저장하는 정적 문서 사이트에 사용하세요 — Docusaurus i18n, Astro Starlight 및 동일한 형태를 따르는 사용자 정의 생성기. `docsRoot` 아래의 파일은 다음과 같이 작성됩니다:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docs[].docsOutput.docsRoot`을 영문 소스 루트(예: `"docs"` 또는 `"src/content/docs"`)로 설정합니다. `style: "doc-system"`을 직접 설정할 경우, 사이트가 `{locale}/`와 번역된 파일 사이에 사용하는 경로 세그먼트를 `localeSubpath`에 반드시 설정해야 합니다. `"docusaurus"` 및 `"astro-starlight"` 별칭은 기본 `localeSubpath` 값을 가진 미리 정의된 `doc-system` 레이아웃입니다([출력 레이아웃](GETTING_STARTED.ko.md#output-layouts) 참조).

| 사전 설정된 별칭 | 기본 `localeSubpath` | 예제 출력 |
|--------------|-------------------------|----------------|
| `"docusaurus"` | `docusaurus-plugin-content-docs/current` | `i18n/de/docusaurus-plugin-content-docs/current/guide.md` |
| `"astro-starlight"` | `""` (비어 있음) | `src/content/docs/de/guide.md` |

플랫 링크 리라이터는 `doc-system`에 대해 **작동하지 않습니다** (`"flat"`와는 다르게). `postProcessing.regexAdjustments`는 소스 마크다운에서 원래 URL을 봅니다 — 일반적으로 `/img/screenshots/en-GB/foo.png`와 같은 절대 경로 또는 사이트 루트 경로입니다.

**패턴 B**는 스크린샷이 공유 정적 URL 트리에 존재할 때 적용됩니다: 처음부터 로케일 코드가 포함된 폴더를 사용하고 하나의 일반적인 `screenshots/[^/]+/` → `screenshots/${translatedLocale}/` 규칙을 사용하세요([구성 — 문서 시스템](#config---docsoutputstyle--doc-system) 참조).

**패턴 C**는 각 로케일의 번역된 문서가 자산을 마크다운 옆에 배치할 때 적용됩니다 (URL 재작성 없음). 당신의 스크린샷 스크립트는 `{outputDir}`, `{locale}`, `{localeSubpath}`에서 파생된 경로에 PNG를 작성해야 합니다 — 아래의 Docusaurus 사전 설정은 참조 레이아웃입니다.

<a id="docusaurus-preset"></a>
#### Docusaurus 사전 설정

프로젝트 설정 시 두 가지 습관을 들이면 이후의 정규식 연결 작업을 완전히 없앨 수 있습니다:

1. 스크린샷을 추가하기 전에 심볼릭 링크 `documentation/docs/assets → ../static/assets`을(를) 생성하세요. Docusaurus의 webpack은 기본적으로 심볼릭 링크를 따르며, 이를 통해 원본 문서와 번역 문서 모두에서 동일한 상대 경로를 사용할 수 있습니다.

2. 모든 문서 자산(PNG 및 SVG 파일)을 `static/assets/`(하나의 디렉터리)에 저장하세요. 자산을 `static/img/`(SVG)과 `static/assets/`(PNG)로 나누지 마세요. 하나의 통합된 위치를 사용하면 영어 및 번역된 모든 문서 페이지에서 동일한 상대 경로 `../assets/name.ext`를 참조할 수 있습니다.

소스 마크다운에서는 항상 안정적인 상대 경로 `../assets/name.ext`을(를) 사용하여 자산을 참조하세요. 절대 경로 `/img/` 또는 `/assets/` URL을 문서 자산에 사용하지 마세요. 이러한 URL은 영어 원본(`static/`에서 제공됨)과 번역된 로케일(번역된 문서와 함께 제공됨) 간에 달라지며, 이로 인해 `regexAdjustments` 규칙을 사용하여 연결해야 합니다.

나중에 i18n을 추가할 때 스크린샷 스크립트는 `getScreenshotDir` 분할을 채택하고(자세한 내용은 [패턴 C](#pattern-c---colocated-raster-doc-system) 참조) `translate-svg`은 `pathTemplate`를 사용합니다. 정규식 조정은 필요하지 않습니다.

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
## 결정 가이드

```
Is the asset an SVG with translatable text or labels?
  Yes → Pattern D (web app) or Pattern E (doc-system colocated)
  No (raster screenshot or decorative SVG) →
    doc-system site with assets colocated beside translated docs?
      Yes → Pattern C (rasters) + Pattern E (SVGs)
    Only one locale needs the image (no per-locale variants)?
      Yes → Pattern A
    Otherwise → Pattern B
```

| 패턴 | 자산 유형                  | 사이트 유형                                                                 | 도구 메커니즘                                               |
|---------|-----------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------|
| A       | 래스터 (공유)             | `docsOutput.style = "flat"` 문서                                      | 파일별 링크 재작성기; 일반적으로 정규식 미사용                     |
| B       | 래스터(로케일별)         | `"flat"` 또는 `"doc-system"` (`"docusaurus"`, `"astro-starlight"` 포함)    | `regexAdjustments` 로케일 세그먼트 교체                       |
| C       | 래스터(공동 위치)          | 자산이 함께 위치한 `"doc-system"` (Docusaurus 프리셋)                  | 스크린샷 스크립트가 파일 배치; 정규식 없음                     |
| D       | SVG(번역됨)            | 웹 앱                                                                   | `translate-svg`과(와) `svg.style = "flat"`                    |
| E       | SVG(번역됨, 공동 위치) | 자산이 함께 위치한 `"doc-system"` (Docusaurus 프리셋)                  | `translate-svg`과(와) `svg.style = "nested"` + `pathTemplate` |

---

<a id="pattern-a---shared-raster"></a>
## 패턴 A - 공유 래스터

`docsOutput.style = "flat"`일 때 단일 이미지가 모든 로케일에서 공유되는 경우(로케일별 변형 없음) 사용합니다. 평면 링크 리라이터가 출력 파일별로 깊이 접두사를 계산하므로, 소스 파일 옆에 있는 에셋(예: `docs/figure.png`을 `docs/page.md`에서 `figure.png`로 참조)이 모든 번역된 출력에서 올바르게 해결됩니다. 따라서 `postProcessing.regexAdjustments` 규칙이 필요하지 않습니다.

예: 이 패키지는 `docs/GETTING_STARTED.md`을(를) `translated-docs/docs/GETTING_STARTED.<locale>.md`로 변환합니다. 형제 이미지 `docs/translation-dashboard.png`는 `translation-dashboard.png`로 참조됩니다. 리라이터는 출력 파일의 디렉터리에서 소스 디렉터리로 돌아가는 각 파일별 접두사를 계산하여(`../../docs/`), `../../docs/translation-dashboard.png`를 생성합니다. `translated-docs/docs/`에서 이는 올바르게 `docs/translation-dashboard.png`로 해결됩니다.

대시보드 UI가 변경될 때 [`scripts/screenshot-translation-dashboard.sh`](../../docs/../scripts/screenshot-translation-dashboard.sh)를 사용하여 PNG를 새로 고칩니다. 이미지는 지역화별로 존재하지 않습니다.

다음과 같은 경우에는 여전히 `postProcessing` 규칙이 필요합니다:
- 에셋이 절대 URL로 참조되는 경우(예: `/img/figure.png`) — 재작성기는 상대 경로만 처리합니다.
- 다른 이유로 에셋 URL을 변경하고자 할 경우(예: CDN으로 전환)

<a id="implementation-example"></a>
### 구현 예시

이 저장소는 번역 대시보드 스크린샷에 대해 패턴 A를 사용합니다: [GETTING_STARTED.md](GETTING_STARTED.ko.md#translation-dashboard)는 동일한 폴더 내 [translation-dashboard.png](../../docs/../docs/translation-dashboard.png) 이미지를 참조합니다. [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)는 `docsOutput.style = "flat"` 및 `flatPreserveRelativeDir: true`을 설정합니다. 파일별 깊이 접두사가 스크린샷 `regexAdjustments` 없이 이미지 경로를 해결합니다.

---

<a id="pattern-b---per-locale-folder-url-rewriting"></a>
## 패턴 B - 로케일별 폴더(URL 재작성)

`docsOutput.style = "flat"`이 있는 README/USER-GUIDE 및 공유 정적 URL 트리에서 스크린샷을 제공하는 문서 시스템 사이트(`docsOutput.style = "doc-system"` 또는 별칭 `"docusaurus"` / `"astro-starlight"`)에 사용합니다.

<a id="directory-layout"></a>
### 디렉터리 구조

<details>
<summary>로케일별 예제 스크린샷 디렉터리 트리</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

소스 마크다운은 소스 로케일 디렉터리를 참조합니다:

```markdown
![Translate tab](../../docs/images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 스크린샷 스크립트 계약

`take-screenshots` 스크립트는 소스 로케일뿐 아니라 모든 로케일에 대한 파일을 작성해야 합니다. `translate-docs` 명령어는 경로를 재작성하지만 파일을 생성하지는 않습니다. 일반적인 패턴:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

[examples/nextjs-app]의 [스크린샷 스크립트](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh)에서 간단한 `bash` 예제를 확인하거나, [Transrewrt 프로젝트](https://github.com/wsj-br/transrewrt) 저장소의 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)에서 더 복잡한 예제를 확인할 수 있습니다.

> **참고:** 아래 네 개의 하위 섹션은 동일한 `regexAdjustments` 로케일 세그먼트 교환(`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`)을 공유합니다. 출력 레이아웃과 평면 링크 리라이터가 먼저 실행되는지 여부만 다릅니다. 사용자의 `docsOutput.style`에 맞는 하위 섹션으로 이동하세요.

<a id="config---docsoutputstyle--flat"></a>
### 설정 - `docsOutput.style = "flat"`

`docsOutput.style = "flat"`일 때 평면 링크 리라이터가 먼저 실행되며, 마크다운이 아닌 URL에 깊이 접두사를 추가합니다. `outputDir: "translated-docs/"`가 있는 저장소 루트의 `README.md`의 경우, `../`을 추가합니다:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

그 후 `regexAdjustments` 규칙이 이미 접두사가 붙은 URL 내 로케일 세그먼트를 대체합니다:

<details>
<summary>플랫 레이아웃을 위한 예제 regexAdjustments</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

결과: `../images/screenshots/de/translate.png` — `translated-docs/README.de.md`에서 저장소 루트로 돌아가는 올바른 상대 경로.

`postProcessing` 단계는 평면 링크 재작성기 후에 실행됩니다. 패턴에 `../` 접두사를 포함할 필요 없이, 이미 접두사가 붙은 URL 내 어디에나 있는 로케일 세그먼트와 일치하도록 `search` 패턴을 작성하세요.

구현 예제(프로덕션): [Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md)의 스크린샷 URL(`images/screenshots/en-GB/…`), [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json)의 로케일 재작성, 캡처 스크립트 [take-screenshots.js](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)(위의 [스크린샷 스크립트 계약](#screenshot-script-contract) 참조).

구현 예제(데모 설정): [examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json)의 두 번째 `docs[]` 블록(`images/screenshots/[^/]+/` → `${translatedLocale}`); 도우미 스크립트 [screenshot-locales.sh](../../docs/../examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### 설정 - `docsOutput.style = "doc-system"`

공유 정적 URL 접두사를 통해 스크린샷을 참조하는 모든 문서 시스템 사이트에 대한 일반 패턴 B. 평면 링크 재작성기는 실행되지 않으며, `postProcessing`가 원본 마크다운 URL의 로케일 세그먼트를 재작성합니다.

<details>
<summary>문서 시스템 레이아웃을 위한 예제 regexAdjustments</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`{locale}/`과 번역된 파일 사이에서 생성기의 레이아웃과 일치하도록 `localeSubpath`을 설정하거나, 기본값이 맞는 경우 `"doc-system"` 대신 사전 정의된 별칭(`"docusaurus"`, `"astro-starlight"`)을 사용합니다. 소스 마크다운은 일반적으로 URL 내에 소스 로케일을 포함합니다:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

모든 대상 로케일에 대해 동일한 경로에 일치하는 PNG 파일을 제공합니다(예: `static/img/screenshots/de/screenshot.png`). `sourceLocale` 변경 시에도 규칙이 유지되도록 하기 위해 `screenshots/en-GB/`를 하드코딩하는 것보다 `screenshots/[^/]+/` 사용을 권장합니다.

<a id="preset---docsoutputstyle--docusaurus"></a>
### 사전 설정 - `docsOutput.style = "docusaurus"`

`"doc-system"`과 동일하나 기본값 `localeSubpath = "docusaurus-plugin-content-docs/current"` 사용. 평면 링크 재작성기는 실행되지 않으며, `postProcessing`는 원본 마크다운 URL을 그대로 인식합니다. 영문 페이지는 일반적으로 소스 로케일이 포함된 절대 경로를 사용합니다:

```markdown
![Screenshot](../../docs//img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Docusaurus 프리셋을 위한 예제 regexAdjustments</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`docs-site/static/img/screenshots/<locale>/screenshot.png`에 일치하는 PNG 파일을 제공합니다. 소스 로케일에 무관한 설정의 경우 `screenshots/en-GB/`보다 `screenshots/[^/]+/` 사용을 권장합니다.

구현 예제: [examples/nextjs-app/docs-site/docs/feature-showcase.md](../../docs/../examples/nextjs-app/docs-site/docs/feature-showcase.md)(`/img/screenshots/en-GB/screenshot.png`) 및 [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json)의 첫 번째 `docs[]` 블록.

<a id="preset---docsoutputstyle--astro-starlight"></a>
### 사전 설정 - `docsOutput.style = "astro-starlight"`

`localeSubpath: ""`이 적용된 `"doc-system"`과 동일함 — 번역된 페이지가 `{outputDir}/{locale}/` 바로 아래에 위치함. 위의 일반 문서 시스템 설정과 동일한 패턴 B 원칙. 소스 마크다운은 `/img/screenshots/en-GB/screenshot.png` 사용:

<details>
<summary>Astro Starlight 프리셋을 위한 예제 regexAdjustments</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

`public/img/screenshots/<locale>/screenshot.png`에 PNG 파일을 제공합니다.

구현 예제: [examples/astro-docs](../../docs/../examples/astro-docs/) — [feature-showcase.mdx](../../docs/../examples/astro-docs/src/content/docs/feature-showcase.mdx) 및 [ai-i18n-tools.config.json](../../docs/../examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).

---

<a id="pattern-c---colocated-raster-doc-system"></a>
## 패턴 C - 함께 위치한 래스터(`doc-system`)

`doc-system` 사이트가 로케일별 에셋을 번역된 마크다운 옆에 함께 배치할 때 사용합니다 — URL 재작성이 필요하지 않습니다. Docusaurus 사전 설정(`docsOutput.style = "docusaurus"`)이 참조 구현이며, `"doc-system"`와 사용자 정의 `localeSubpath`를 사용하는 다른 생성기들도 동일한 개념을 따릅니다: 영문 에셋은 소스 로케일 경로에 위치하고, 번역된 에셋은 `{outputDir}/{locale}/[localeSubpath/]assets/` 아래에 위치합니다.

<a id="directory-layout-1"></a>
### 디렉터리 구조

<details>
<summary>공동 배치된 에셋 디렉터리 트리 예제(Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

모든 로케일의 문서가 동일한 상대 경로를 사용함:

```markdown
![Dashboard](../../docs/../assets/screen-dashboard.png)
```

영문(`en-GB`) 로케일의 경우, `../assets/`은 `static/assets/`로 연결된 심볼릭 링크를 통해 확인됨. 번역된 로케일의 경우 해당 로케일의 `current/assets/` 디렉터리로 직접 확인됨.

<a id="screenshot-script-contract-1"></a>
### 스크린샷 스크립트 계약

스크립트는 각 로케일에 대해 올바른 디렉터리에 PNG 파일을 작성해야 합니다. `getScreenshotDir` 함수가 분할을 인코딩합니다:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

[duplistatus](https://github.com/wsj-br/duplistatus) 저장소의 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)에서 프로덕션 구현을 확인하세요(로컬 참조 사본: [references/duplistatus/scripts/take-screenshots.ts](../../docs/../references/duplistatus/scripts/take-screenshots.ts)).

<a id="config"></a>
### 구성

래스터 파일에는 `regexAdjustments` 규칙이 필요하지 않습니다. `translate-docs`은 마크다운의 대체 텍스트를 번역하지만 URL은 그대로 유지됩니다:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

프로젝트에서 번역된 SVG도 사용하는 경우, 패턴 E가 이를 처리하며 추가 정규식 없이 `current/assets/`에 PNG와 함께 배치됩니다.

<a id="prerequisites"></a>
### 전제 조건

- `docs/assets` 심볼릭 링크가 존재해야 합니다: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus 웹팩은 기본적으로 심볼릭 링크를 따릅니다 (Docusaurus 빌드에서 `resolve.symlinks`는 기본적으로 `true`로 설정됨)
- 심볼릭 링크는 소스 로케일에 대해서만 존재하면 되며, 번역된 빌드에서는 사용하지 않습니다

<a id="implementation-example-1"></a>
### 구현 예시

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)의 `getScreenshotDir(locale)`; 영문 문서는 함께 위치한 PNG를 참조함(예: `../assets/screen-dashboard-summary.png`가 있는 [dashboard.md](../../docs/../references/duplistatus/documentation/docs/user-guide/dashboard.md)); [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json)에 PNG `regexAdjustments` 없음. 동일한 프로젝트의 패턴 E SVG는 동일한 `current/assets/` 디렉터리에 위치함(아래 참조).

---

<a id="pattern-d---translated-svg-with-svgstyle--flat"></a>
## 패턴 D - `svg.style = "flat"`이 포함된 번역된 SVG

웹 앱이 로케일별 SVG 일러스트나 다이어그램을 포함하고 런타임에 로케일 코드로 참조할 때 사용합니다.

<a id="config-1"></a>
### 구성

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg`는 `images/` 아래의 모든 `.svg`을 읽고 로케일별로 하나의 파일을 작성합니다:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### 앱 참조

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### 소스 레이아웃 권장 사항

소스 SVG를 출력 디렉터리와 별도로 유지하세요. `sourcePath: "images"` 및 `outputDir: "public/assets"`을 사용하면 두 디렉터리는 별개입니다. 두 디렉터리를 동일한 위치로 설정하지 마세요.

<a id="implementation-example-2"></a>
### 구현 예시

[examples/nextjs-app](../../docs/../examples/nextjs-app/) — [ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json)의 `svg` 블록 (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); 소스 [translation_demo_svg.svg](../../docs/../examples/nextjs-app/images/translation_demo_svg.svg); [public/assets/](../../docs/../examples/nextjs-app/public/assets/) 아래의 로케일별 출력 (예: `translation_demo_svg.de.svg`); [page.tsx](../../docs/../examples/nextjs-app/src/app/page.tsx)의 런타임 URL (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
## 패턴 E - 함께 배치된 번역된 SVG (doc-system)

번역된 SVG 일러스트가 각 로케일의 콘텐츠 디렉터리에 번역된 문서와 함께 나타나야 하는 문서 시스템 사이트에 사용합니다 — 패턴 C의 래스터 스크린샷과 동일한 위치입니다. Docusaurus 프리셋이 대표적인 예입니다.

<a id="config-2"></a>
### 구성

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg`은 각 로캘별로 하나의 SVG를 생성하며, 이를 Pattern C가 PNG 파일을 저장하는 것과 동일한 `current/assets/` 디렉터리에 씁니다.

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 소스 마크다운

모든 로캘의 문서는 동일한 상대 경로를 사용합니다.

```markdown
![Diagram](../../docs/../assets/diagram.svg)
```

영어 로캘의 경우 심볼릭 링크 `docs/assets → ../static/assets`이 이를 해결합니다. 번역된 로캘의 경우 직접 `current/assets/`을 가리킵니다.

영어 소스 문서와 번역된 출력 문서가 동일한 경로를 사용하므로 `regexAdjustments` 규칙이 필요 없습니다.

<a id="svg-source-location"></a>
### SVG 소스 위치

권장 사항: 소스 SVG 파일을 en-GB PNG 파일과 함께 `documentation/static/assets/`에 저장하세요. 이렇게 하면 모든 문서 자산이 한 곳에 모이며, 동일한 `docs/assets` 심볼릭 링크로 둘 다 처리할 수 있습니다. 그런 다음 `svg.sourcePath` 항목들은 `documentation/static/assets/name.svg`을 가리키게 됩니다.

<a id="pathtemplate-placeholders"></a>
### `pathTemplate` 플레이스홀더

| 플레이스홀더              | 값                                                  |
|--------------------------|--------------------------------------------------------|
| `{outputDir}`            | `svg.outputDir`의 절대 해결 경로              |
| `{locale}`               | 대상 로캘 코드                                     |
| `{LOCALE}`               | 대문자로 변환된 로캘 코드                                 |
| `{relPath}`              | `sourcePath` 루트에서 소스 SVG까지의 상대 경로 |
| `{stem}`                 | 확장자 없는 파일 이름                             |
| `{basename}`             | 확장자 포함 파일 이름                                |
| `{extension}`            | 점(.)을 포함한 확장자                                |
| `{relativeToSourceRoot}` | 가장 가까운 `sourcePath` 루트로부터의 상대 경로       |

전체 참조는 [svg 구성 테이블](GETTING_STARTED.ko.md#svg)에서 확인할 수 있습니다.

<a id="implementation-example-3"></a>
### 구현 예시

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](../../docs/../references/duplistatus/ai-i18n-tools.config.json) 내에 중첩된 `svg` 블록과 `pathTemplate` 포함; 소스 SVG 파일은 `documentation/static/img/` 아래에 나열되어 있음 (예: [duplistatus_toolbar.svg](../../docs/../references/duplistatus/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg`이 로캘별 파일을 Pattern C PNG 파일 옆의 `documentation/i18n/<locale>/…/current/assets/`에 작성; 현재 문서는 `/img/duplistatus_*.svg`를 통해 이를 포함하고 있음 (예: [overview.md](../../docs/../references/duplistatus/documentation/docs/user-guide/overview.md)). 향후 `../assets/` 경로로의 이전 및 SVG `regexAdjustments` 브리지 제거 계획은 [task-locale-assets-simplification.md](../../docs/../references/duplistatus/dev/task-locale-assets-simplification.md)에서 확인할 수 있습니다.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
## 평면 링크 재작성기 및 두 단계 흐름

`docsOutput.style = "flat"`의 경우(또는 `rewriteRelativeLinks: false`이 설정되지 않았거나 사용자 정의 `pathTemplate`가 지정되지 않은 경우), `postProcessing` 이전에 기본 제공되는 리라이터가 실행됩니다. 이 리라이터는 문서 간 링크(로케일 접미사 추가)를 처리하고 마크다운이 아닌 자산 URL에 깊이 접두사를 추가합니다.

<a id="two-step-flow-when-docsoutputstyle--flat"></a>
### `docsOutput.style = "flat"`일 때의 두 단계 흐름

```
source URL  →  [flat link rewriter: depth prefix]  →  [postProcessing: locale segment]  →  output URL
```

`outputDir: "translated-docs/"`이고 소스 `README.md`이 리포지토리 루트에 있는 예시:

1. 평면 링크 재작성기: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png` (`translated-docs/`에 대한 `../` 하나)
2. `postProcessing` 정규식 `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/`: `../images/screenshots/de/foo.png`

`docsOutput.style = "doc-system"`의 경우(`"docusaurus"`, `"astro-starlight"`, `"nested"` 포함), 평면 링크 리라이터는 실행되지 않습니다. `postProcessing`는 번역된 마크다운에서 원본 URL(일반적으로 `/img/screenshots/en-GB/foo.png` 같은 절대 경로)을 그대로 인식합니다.

<a id="per-file-depth-prefix-with-flatpreserverelativedir"></a>
### `flatPreserveRelativeDir`과 함께 사용하는 파일별 깊이 접두사

깊이 접두사는 전체 일괄 처리에 대해 전역으로 계산되는 것이 아니라 출력 파일별로 개별적으로 계산됩니다. 각 소스 파일에 대해 재작성기는 출력 파일 디렉터리에서 소스 파일 디렉터리까지의 상대 경로를 계산하고 이를 접두사로 사용합니다.

즉, `flatPreserveRelativeDir: true`을 사용하면 하위 디렉터리의 소스 파일에 올바른 접두사가 자동으로 적용됩니다. 예를 들어, `docs/GETTING_STARTED.md`은 `translated-docs/docs/GETTING_STARTED.<locale>.md`로 출력됩니다. 각 파일별 접두사는 `../../docs/`이므로, 소스를 기준으로 한 자산 `translation-dashboard.png`는 `../../docs/translation-dashboard.png`가 됩니다. 이는 `translated-docs/docs/`에서 `docs/translation-dashboard.png`로 올바르게 해결됩니다.

소스 파일과 함께 있는 상대 경로 자산의 경우 `postProcessing` 정규식 수정이 필요 없습니다.

<a id="rewriterelativelinks-and-linkrewritedocsroot"></a>
### `rewriteRelativeLinks` 및 `linkRewriteDocsRoot`

| 옵션                                   | 효과                                                                                                           |
|------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| `docsOutput.rewriteRelativeLinks`    | 평면 링크 리라이터를 명시적으로 활성화하거나 비활성화함(`docsOutput.style = "flat"`일 때 기본값을 재정의함) |
| `docsOutput.linkRewriteDocsRoot`     | `depthPrefix`가 계산되는 기준 루트(기본값 `"."`)                                                        |
| `docsOutput.flatPreserveRelativeDir` | 출력 경로 레이아웃에 영향을 주며, 리라이터는 알려진 번역 파일의 대상 경로를 계산할 때 이를 사용함       |

---

<a id="troubleshooting"></a>
<a id="common-mistakes-and-troubleshooting"></a>
## 일반적인 실수 및 문제 해결

**스크린샷 경로에 로케일 디렉터리가 없음**
`images/screenshots/screenshot.png` — 로케일 변형을 구분할 수 없으며 재작성이 불가능합니다. 패턴 B를 적용하기 전에 `images/screenshots/<locale>/screenshot.png`로 구조를 재조정하세요.

**정규식에 하드코딩된 소스 로케일**
`"search": "screenshots/en-GB/"` — `sourceLocale`이 변경되면 조용히 오류가 발생합니다. 대신 `"search": "screenshots/[^/]+/"`를 사용하세요.

**SVG 소스와 출력이 동일한 디렉터리에 있음**
`svg.sourcePath`과 `svg.outputDir`이 겹치면 생성된 파일이 수동 편집된 소스와 섞입니다. 별도의 디렉터리에 두세요.

**동일한 위치에 있는 SVG에 대한 절대 Docusaurus 정적 URL**
`/img/diagram.svg` (`static/img/`에서)은 번역된 출력에서 `../assets/`로 재작성하기 위해 `regexAdjustments` 규칙이 필요합니다. 이 문제를 완전히 피하려면 소스 SVG를 `static/assets/`에 두고 처음부터 상대 경로 `../assets/diagram.svg`를 사용하세요.

**Docusaurus에서 `docs/assets` 심볼릭 링크 누락**
심볼릭 링크가 없으면 `docs/user-guide/`의 소스 문서가 상대 경로를 통해 `static/assets/`의 PNG 또는 SVG를 참조할 수 없습니다. 프로젝트 생성 시 다음 심볼릭 링크를 설정하세요: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` 스크립트는 소스 로케일만 캡처합니다**
패턴 B는 모든 로케일에 대해 PNG 파일을 필요로 합니다. 스크립트가 `en-GB`만 캡처하는 경우, 번역된 문서에는 누락된 파일을 가리키는 경로가 다시 작성됩니다.
