<a id="colocated-raster-doc-system"></a>
# Colocated 래스터 (`doc-system`)

`doc-system` 사이트가 로케일별 에셋을 번역된 마크다운 옆에 함께 배치할 때 사용합니다 — URL 재작성이 필요하지 않습니다. Docusaurus 사전 설정(`docsOutput.style = "docusaurus"`)이 참조 구현이며, `"doc-system"`와 사용자 정의 `localeSubpath`를 사용하는 다른 생성기들도 동일한 개념을 따릅니다: 영문 에셋은 소스 로케일 경로에 위치하고, 번역된 에셋은 `{outputDir}/{locale}/[localeSubpath/]assets/` 아래에 위치합니다.

<a id="directory-layout"></a>
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
![Dashboard](../assets/screen-dashboard.png)
```

영문(`en-GB`) 로케일의 경우, `../assets/`은 `static/assets/`로 연결된 심볼릭 링크를 통해 확인됨. 번역된 로케일의 경우 해당 로케일의 `current/assets/` 디렉터리로 직접 확인됨.

<a id="screenshot-script-contract"></a>
### 스크린샷 스크립트 계약

스크립트는 각 로케일에 대해 올바른 디렉터리에 PNG 파일을 작성해야 합니다. `getScreenshotDir` 함수가 분할을 인코딩합니다:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

[duplistatus](https://github.com/wsj-br/duplistatus) 저장소의 [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)에서 실제 구현을 확인하세요.

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

프로젝트에서 번역된 SVG도 사용하는 경우, [동일 위치 SVG 번역](/guide/svg-translation/translated-svg-colocated)이 이를 처리하며 추가 정규식 없이 PNG와 함께 `current/assets/`에 배치됩니다.

<a id="prerequisites"></a>
### 전제 조건

- `docs/assets` 심볼릭 링크가 존재해야 합니다: `ln -s ../static/assets documentation/docs/assets`
- Docusaurus 웹팩은 기본적으로 심볼릭 링크를 따릅니다 (Docusaurus 빌드에서 `resolve.symlinks`는 기본적으로 `true`로 설정됨)
- 심볼릭 링크는 소스 로케일에 대해서만 존재하면 되며, 번역된 빌드에서는 사용하지 않습니다

<a id="implementation-example"></a>
### 구현 예시

[duplistatus](https://github.com/wsj-br/duplistatus) — [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts)의 `getScreenshotDir(locale)`; 영어 문서는 동일 위치 PNG(예: `../assets/screen-dashboard-summary.png`이 있는 [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md))를 참조합니다. 동일 프로젝트의 동일 위치 SVG는 동일한 `current/assets/` 디렉터리에 배치됩니다. — [동일 위치 SVG](/guide/svg-translation/translated-svg-colocated)를 참조하세요.
