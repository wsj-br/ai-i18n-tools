<a id="svg-troubleshooting"></a>
# SVG 문제 해결

[이미지 및 스크린샷 문제 해결](/ko/guide/images-and-screenshots/troubleshooting)도 참조하세요.

- **SVG 소스와 출력물을 같은 디렉터리에 두기** — `svg.sourcePath`와 `svg.outputDir`을 분리하세요.
- **공동 배치된 SVG에 대한 절대 Docusaurus 정적 URL** — 처음부터 상대 `../assets/` 경로를 사용하세요.
- **번역 후 예상치 못한 닫는 태그 `text` 대 `g`** — Inkscape는 실제 레이블 옆에 빈 자체 닫힘 `<text … />`를 자주 내보냅니다. 이전 추출기 정규식은 다음 `</text>`까지 확장되어 잘못된 닫힘 태그를 작성했습니다. `translate-svg`(또는 `sync`)을 업그레이드하고 다시 실행하여 로케일 SVG를 재생성하세요.
- **힌디어, 아랍어, CJK 또는 키릴 SVG에서 로마자 표기 또는 라틴 문자 전용 레이블** — 문서와 동일한 문자 체계 정책이 적용됩니다. 잘못된 문자 캐시 행은 다음 `translate-svg`/`sync`에서 거부됩니다. 전역 `--debug-failed`을 사용하여 다시 실행하면 `cacheDir` 아래에 `FAILED-TRANSLATION` 로그를 작성하여 **각** 폐기된 모델(프롬프트, 원시 출력, 스크립트 오류)에 대해 기록합니다. 모든 모델이 실패할 때만이 아니라. [힌디어, 아랍어, CJK 또는 키릴 출력이 로마자 표기됨](/ko/guide/documents/troubleshooting#hindi-arabic-cjk-or-cyrillic-output-is-romanised-latin-letters)을 참조하세요.
