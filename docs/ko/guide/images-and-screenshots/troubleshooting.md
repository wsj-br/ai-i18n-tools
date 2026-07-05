<a id="common-mistakes-and-troubleshooting"></a>
# 일반적인 실수 및 문제 해결

**스크린샷 경로에 로케일 디렉터리가 없습니다.**
`images/screenshots/screenshot.png` — 로케일 변형을 구분할 수 없으며 다시 작성할 수 없습니다. [로케일별 폴더](/guide/images-and-screenshots/per-locale-folder) 다시 작성 기능을 사용하기 전에 `images/screenshots/<locale>/screenshot.png`로 재구성하세요.

**정규식에 하드코딩된 소스 로케일**
`"search": "screenshots/en-GB/"` — `sourceLocale`이 변경되면 조용히 오류가 발생합니다. 대신 `"search": "screenshots/[^/]+/"`를 사용하세요.

**SVG 소스와 출력이 동일한 디렉터리에 있음**
`svg.sourcePath`과 `svg.outputDir`이 겹치면 생성된 파일이 수동 편집된 소스와 섞입니다. 별도의 디렉터리에 두세요.

**동일한 위치에 있는 SVG에 대한 절대 Docusaurus 정적 URL**
`/img/diagram.svg` (`static/img/`에서)은 번역된 출력에서 `../assets/`로 재작성하기 위해 `regexAdjustments` 규칙이 필요합니다. 이 문제를 완전히 피하려면 소스 SVG를 `static/assets/`에 두고 처음부터 상대 경로 `../assets/diagram.svg`를 사용하세요.

**Docusaurus에서 `docs/assets` 심볼릭 링크 누락**
심볼릭 링크가 없으면 `docs/user-guide/`의 소스 문서가 상대 경로를 통해 `static/assets/`의 PNG 또는 SVG를 참조할 수 없습니다. 프로젝트 생성 시 다음 심볼릭 링크를 설정하세요: `ln -s ../static/assets documentation/docs/assets`.

**`take-screenshots` 스크립트는 소스 로케일만 캡처합니다.**
로케일별 폴더 레이아웃에는 모든 로케일에 대한 PNG 파일이 필요합니다. 스크립트가 `en-GB`만 캡처하는 경우, 번역된 문서에는 누락된 파일을 가리키는 다시 작성된 경로가 포함됩니다.
