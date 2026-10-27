<a id="svg-troubleshooting"></a>
# SVG 문제 해결

[이미지 및 스크린샷 문제 해결](/ko/guide/images-and-screenshots/troubleshooting)도 참조하세요.

- **같은 디렉터리의 에스브이지 소스와 출력** — `svg.sourcePath` 및 `svg.outputDir`을 분리해 두세요.
- **같은 위치에 있는 에스브이지에 대한 절대 Docusaurus 정적 유알엘** — 처음부터 상대 `../assets/` 경로를 사용하세요.
- **번역 후 예상치 못한 닫는 태그 `text` 대 `g`** — Inkscape는 실제 레이블 옆에 빈 자체 닫힘 `<text … />`을 내보내는 경우가 많습니다. 이전 추출기 정규식은 이를 다음 `</text>`까지 포함했고 불필요한 닫는 태그를 작성했습니다. 업그레이드한 뒤 `translate-svg` 또는 `sync`을 다시 실행하여 로캘 에스브이지를 다시 생성하세요.
- **힌디어, 아랍어, 중국어·일본어·한국어 또는 키릴 문자 에스브이지의 로마자 표기 또는 라틴 문자만 있는 레이블** — 문서와 동일한 문자 체계 정책이 적용됩니다. 잘못된 문자 체계의 캐시 행은 다음 `translate-svg` / `sync`에서 거부됩니다. 모든 모델이 실패할 때뿐만 아니라 폐기된 모델 **각각**에 대해 `cacheDir` 아래에 `FAILED-TRANSLATION` 로그(프롬프트, 원시 출력, 스크립트 오류)를 작성하려면 전역 `--debug-failed`로 다시 실행하세요. [힌디어, 아랍어, 중국어·일본어·한국어 또는 키릴 문자 출력이 로마자 표기됨](/ko/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters)을 참조하세요.
