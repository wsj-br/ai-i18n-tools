<a id="colocated-translated-svg-doc-system"></a>
# 공동 배치된 번역 SVG (문서 시스템)

번역된 SVG 일러스트레이션이 각 로케일의 콘텐츠 디렉터리에 있는 번역된 문서와 함께 표시되어야 하는 문서 시스템 사이트에 사용합니다. [공동 배치된 스크린샷](/ko/guide/images-and-screenshots/colocated-screenshots)과 동일한 위치입니다. Docusaurus 사전 설정이 주요 예시입니다.

<a id="config"></a>
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

`translate-svg`는 공동 배치된 스크린샷이 PNG에 사용하는 것과 동일한 `current/assets/` 디렉터리에 로케일당 하나의 SVG를 작성합니다.

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### 소스 마크다운

모든 로캘의 문서는 동일한 상대 경로를 사용합니다.

```markdown
![Diagram](../assets/diagram.svg)
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

[SVG 구성 테이블](/ko/reference/configuration#svg)에서 전체 참조를 확인하세요.

<a id="implementation-example"></a>
### 구현 예시

[duplistatus](https://github.com/wsj-br/duplistatus) — [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json) 내에 `pathTemplate`이(가) 포함된 중첩 `svg` 블록; `documentation/static/assets/`의 소스 SVG(예: [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/assets/duplistatus_toolbar.svg)); `translate-svg`은(는) 동일 위치의 PNG 옆 `documentation/i18n/<locale>/…/current/assets/`에 로케일별 파일을 작성합니다; 문서는 `regexAdjustments` 브리지 없이 `../assets/` 경로(예: [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md))를 통해 이를 삽입합니다.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
