<a id="shared-raster"></a>
# 공유 래스터

`docsOutput.style = "flat"`일 때 단일 이미지가 모든 로케일에서 공유되는 경우(로케일별 변형 없음) 사용합니다. 평면 링크 리라이터가 출력 파일별로 깊이 접두사를 계산하므로, 소스 파일 옆에 있는 에셋(예: `docs/figure.png`을 `docs/page.md`에서 `figure.png`로 참조)이 모든 번역된 출력에서 올바르게 해결됩니다. 따라서 `postProcessing.regexAdjustments` 규칙이 필요하지 않습니다.

예시: 프로젝트는 `docs/guide/quick-start.md`를 `translated-docs/docs/guide/quick-start.<locale>.md`로 번역합니다. 형제 이미지 `docs/translation-dashboard.png`는 `quick-start.md`에서 `../translation-dashboard.png`로 참조됩니다. 리라이터는 출력 파일의 디렉터리에서 소스 디렉터리(`../../docs/`)까지 파일별 접두사를 계산하여 `../../docs/translation-dashboard.png`을 생성합니다. `translated-docs/docs/guide/`에서 이는 `docs/translation-dashboard.png`로 올바르게 확인됩니다.

다음과 같은 경우에는 여전히 `postProcessing` 규칙이 필요합니다:
- 에셋이 절대 URL로 참조되는 경우(예: `/img/figure.png`) — 재작성기는 상대 경로만 처리합니다.
- 다른 이유로 에셋 URL을 변경하고자 할 경우(예: CDN으로 전환)

<a id="implementation-example"></a>
### 구현 예시

이 저장소의 자체 문서는 공유 이미지의 절대 URL 변형을 사용합니다. [번역 대시보드 가이드](/guide/translation-dashboard/)는 스크린샷을 `![Translation Dashboard](/translation-dashboard.png)`로 참조합니다. 이는 [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png)에서 제공되는 절대 사이트 루트 경로입니다. URL이 모든 로케일에서 동일하므로 `postProcessing.regexAdjustments` 규칙이 필요하지 않습니다. 대시보드 UI가 변경되면 [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh)로 PNG를 새로 고치세요.
