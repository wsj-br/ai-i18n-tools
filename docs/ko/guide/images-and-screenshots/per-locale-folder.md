<a id="per-locale-folder-url-rewriting"></a>
# 로케일별 폴더 (URL 재작성)

`docsOutput.style = "flat"`가 포함된 README/USER-GUIDE, 그리고 공유 정적 URL 트리에서 스크린샷을 제공하는 문서 시스템 사이트(`docsOutput.style = "doc-system"` 또는 별칭 `"docusaurus"` / `"astro-starlight"`) 및 `"vitepress"` / 기타 문서 시스템 프리셋에 사용하세요. VitePress의 링크 재작성 세부 정보: [Link rewriting — VitePress](/ko/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress).

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
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### 스크린샷 스크립트 계약

`take-screenshots` 스크립트는 소스 로케일뿐만 아니라 모든 로케일에 대해 파일을 작성해야 합니다. `translate-docs` 명령은 경로를 다시 작성하지만 파일을 생성하지는 않습니다. 일반적인 도우미는 다음과 같습니다.

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

[examples/nextjs-app의 스크린샷 스크립트](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh)에서 간단한 `bash` 예제를 확인하거나, [duplistatus](https://github.com/wsj-br/duplistatus) 프로젝트의 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)에서 더 복잡한 예제를 확인하세요 ([Transrewrt](https://github.com/wsj-br/transrewrt)에서 프로덕션 환경으로도 사용됨).

> **참고:** 아래의 네 하위 섹션은 동일한 `regexAdjustments` 로케일 세그먼트 교체(`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`)를 공유합니다. 출력 레이아웃과 플랫 링크 재작성기가 먼저 실행되는지 여부만 다르므로, 사용 중인 `docsOutput.style`와 일치하는 하위 섹션으로 이동하세요.
>
> **참고:** `regexAdjustments`는 펜스 코드 블록을 포함하여 번역된 전체 마크다운 본문에서 실행됩니다. 문서 페이지에 일치하는 경로가 포함된 구성 예제(예: `screenshots/en-GB/`)가 포함되어 있는 경우, 해당 스니펫도 번역된 출력에서 재작성됩니다. 재사용 가능한 예제에서는 일반적인 `screenshots/[^/]+/` 형식을 사용하세요.

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

`postProcessing` 단계는 플랫 링크 재작성기 다음에 실행됩니다. 이미 접두사가 붙은 URL 내의 모든 위치에서 로케일 세그먼트와 일치하는 `search` 정규식을 작성합니다. 정규식에 `../` 접두사를 포함할 필요는 없습니다.

구현 예제(프로덕션): [Transrewrt](https://github.com/wsj-br/transrewrt) — [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md)의 스크린샷 URL(`images/screenshots/en-GB/…`), [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json)의 로케일 재작성, duplistatus의 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)를 기반으로 한 캡처 스크립트(위의 [스크린샷 스크립트 계약](#screenshot-script-contract) 참조).

구현 예시(데모 구성): [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json)의 두 번째 `docs[]` 블록(`images/screenshots/[^/]+/` → `${translatedLocale}`); 도우미 스크립트 [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### 설정 - `docsOutput.style = "doc-system"`

공유 정적 URL 접두사를 통해 스크린샷을 참조하는 모든 문서 시스템 사이트에 대해 동일한 로케일별 폴더 접근 방식입니다. 플랫 링크 재작성기는 실행되지 않습니다. `postProcessing`는 원본 마크다운 URL에서 로케일 세그먼트를 다시 작성합니다.

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
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

모든 대상 로케일에 대해 동일한 경로에 일치하는 PNG 파일을 제공합니다(예: `static/img/screenshots/de/screenshot.png`). `sourceLocale` 변경 시에도 규칙이 유지되도록 하기 위해 `screenshots/en-GB/`를 하드코딩하는 것보다 `screenshots/[^/]+/` 사용을 권장합니다.

<a id="preset---docsoutputstyle--docusaurus"></a>
### 사전 설정 - `docsOutput.style = "docusaurus"`

`"doc-system"`과 동일하나 기본값 `localeSubpath = "docusaurus-plugin-content-docs/current"` 사용. 평면 링크 재작성기는 실행되지 않으며, `postProcessing`는 원본 마크다운 URL을 그대로 인식합니다. 영문 페이지는 일반적으로 소스 로케일이 포함된 절대 경로를 사용합니다:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
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

구현 예시: [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) 및 [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### 사전 설정 - `docsOutput.style = "astro-starlight"`

`"doc-system"`와 `localeSubpath: ""`는 동일합니다. 번역된 페이지는 `{outputDir}/{locale}/` 바로 아래에 있습니다. 위 일반 문서 시스템 구성과 동일한 로케일별 폴더 접근 방식입니다. 소스 마크다운은 `/img/screenshots/en-GB/screenshot.png`를 사용합니다.

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

`public/img/screenshots/<locale>/screenshot.png`에서 PNG를 제공하세요. `${translatedLocale}` 플레이스홀더는 구성 로케일 문자열(예: `pt-BR`)을 사용합니다. `astro-starlight` 프리셋은 기본적으로 로케일 **출력 경로**를 소문자로 변환하지만(`pt-br/`), `public/img/screenshots/` 아래의 정적 자산 폴더는 마크다운 URL에 작성된 로케일 세그먼트와 일치해야 합니다. 스크린샷 디렉터리는 Astro 라우트 대소문자가 아닌 `${translatedLocale}`에 맞춰 정렬하세요.

구현 예시: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) 및 [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).
