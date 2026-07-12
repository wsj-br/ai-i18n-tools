<a id="shared-raster"></a>
# 공유 래스터

단일 이미지가 모든 로케일에서 공유될 때(로케일별 변형이 없는 경우) 사용합니다.

- **`docsOutput.style = "flat"`** — 플랫 링크 재작성기는 출력 파일별로 깊이 접두사를 계산하므로, 소스 파일 옆에 있는 상대적 에셋(예: `docs/page.md`에서 `figure.png`로 참조된 `docs/figure.png`)은 모든 번역 출력에서 올바르게 해석됩니다 — `postProcessing.regexAdjustments` 규칙이 필요하지 않습니다. 소스 파일이 하위 디렉토리에 있는 경우 `flatPreserveRelativeDir: true`를 활성화하여 출력 경로가 소스 트리를 유지하도록 합니다([파일별 깊이 접두사](/ko/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir) 참조).
- **`docsOutput.style = "vitepress"`** (및 링크 정규화기가 있는 다른 문서 시스템 사전 설정) — URL이 모든 로케일에서 동일한 경우 `/translation-dashboard.png`와 같은 사이트 루트 절대 경로는 변경되지 않고 그대로 유지됩니다 — `regexAdjustments` 규칙이 필요하지 않습니다.

**플랫 예시:** 프로젝트는 `docs/guide/quick-start.md`를 `translated-docs/docs/guide/quick-start.<locale>.md`로 번역합니다. 이는 `flatPreserveRelativeDir: true`라고 가정하므로 `docs/guide/quick-start.md`는 `translated-docs/docs/guide/quick-start.<locale>.md`로 출력됩니다(`translated-docs/quick-start.<locale>.md`가 아님). 형제 이미지 `docs/translation-dashboard.png`는 `quick-start.md`에서 `../translation-dashboard.png`로 참조됩니다. 재작성기는 출력 파일의 디렉토리에서 소스 디렉토리(`../../docs/`)까지 파일별 접두사를 계산하여 `../../docs/translation-dashboard.png`을 생성합니다. `translated-docs/docs/guide/`에서 이는 `docs/translation-dashboard.png`로 올바르게 다시 해석됩니다.

다음의 경우에는 여전히 `postProcessing` 규칙이 필요합니다:
- **`docsOutput.style = "flat"`** 에서 절대 URL을 통해 에셋이 참조되는 경우(예: `/img/figure.png`) — 플랫 재작성기는 상대 경로만 처리합니다
- 다른 이유로 에셋 URL을 변경하려는 경우(예: CDN으로 전환)

<a id="implementation-example"></a>
### 구현 예시

이 리포지토리의 자체 문서는 공유 이미지의 절대 URL 변형을 사용합니다: [번역 대시보드 가이드](/ko/guide/translation-dashboard/)는 스크린샷을 `![Translation Dashboard](/translation-dashboard.png)`로 참조합니다 — 이는 [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png)에서 제공되는 절대 사이트 루트 경로입니다. URL이 모든 로케일에서 동일하므로 `postProcessing.regexAdjustments` 규칙이 필요하지 않습니다.
