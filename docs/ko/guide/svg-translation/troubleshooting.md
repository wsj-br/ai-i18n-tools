<a id="svg-troubleshooting"></a>
# SVG 문제 해결

[이미지 및 스크린샷 문제 해결](/ko/guide/images-and-screenshots/troubleshooting)도 참조하세요.

- **같은 디렉터리의 SVG 소스와 출력** — `svg.sourcePath`와 `svg.outputDir`을 분리하세요.
- **같은 위치에 배치된 SVG의 절대 Docusaurus 정적 URL** — 처음부터 상대 `../assets/` 경로를 사용하세요.
- **번역 후 예상치 못한 닫는 태그 `text` vs `g`** — Inkscape는 종종 실제 라벨 옆에 빈 자기 닫기 `<text … />`를 생성합니다. 이전 추출기 정규식은 다음 `</text>`까지 걸쳐 있어 잘못된 닫는 태그를 작성했습니다. `translate-svg`(또는 `sync`)을 업그레이드하고 다시 실행하여 로케일 SVG를 재생성하세요.
- **힌디어, 아랍어, CJK 또는 키릴 SVG의 로마자화 또는 라틴 전용 라벨** — 문서와 동일한 문자 체계 정책이 적용됩니다. 잘못된 문자 체계의 캐시 행은 다음 `translate-svg` / `sync`에서 거부됩니다. 전역 `--debug-failed`로 다시 실행하여 **각** 폐기된 모델(프롬프트, 원시 출력, 스크립트 오류)에 대해 `cacheDir` 아래에 `FAILED-TRANSLATION` 로그를 작성하세요. 이는 모든 모델이 실패할 때만 해당하는 것이 아닙니다. [힌디어, 아랍어, CJK 또는 키릴 출력이 로마자화됨](/ko/guide/documents/troubleshooting#wrong-script-or-romanized-output)을 참조하세요.
