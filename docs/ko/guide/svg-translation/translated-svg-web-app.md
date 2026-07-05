<a id="translated-svg-with-svgstyle--flat"></a>
# `svg.style = "flat"`로 번역된 SVG

웹 앱이 로케일별 SVG 일러스트나 다이어그램을 포함하고 런타임에 로케일 코드로 참조할 때 사용합니다.

<a id="config"></a>
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

<a id="implementation-example"></a>
### 구현 예시

[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json)의 `svg` 블록(`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); 소스 [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg); [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) 아래의 로케일별 출력(예: `translation_demo_svg.de.svg`); [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx)의 런타임 URL(`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
