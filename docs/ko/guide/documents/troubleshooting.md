<a id="troubleshooting"></a>
# 문제 해결

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## 번역된 문서에서 섹션 앵커 링크가 작동하지 않음

`[label](other.md#section-id)`과 같은 링크는 올바른 번역된 파일을 열 수 있지만, 의도한 제목으로 스크롤하지 못하거나 잘못된 섹션으로 이동할 수 있습니다. 해당 로캘에서 `#…` 조각(fragment)이 더 이상 어떤 제목 `id`와도 일치하지 않습니다.

일반적인 원인:

- 원본 제목에 명시적인 앵커 ID가 없었으며, 사이트는 보이는 제목 텍스트에서 슬러그를 유도하므로 번역 후 변경됩니다.
- 원본에서 제목을 이름을 변경했지만 이전의 `<a id="…"></a>` 줄이 누락되었거나 여전히 이전 ID를 가지고 있습니다.
- 앵커 링크가 `write-heading-ids`가 생성할 ID 대신 영어 단어에서 추측한 `#…` 조각을 사용합니다.

**해결 방법**

1. `ai-i18n-tools write-heading-ids`을 **소스** `.md` / `.mdx`에 실행합니다(`translate-docs`와 동일한 `docs[]` / `contentPaths`). 이 작업은 각 ATX 제목 앞에 `<a id="slug"></a>`을 삽입하거나, 제목 텍스트가 현재 슬러그와 일치하지 않을 경우 기존 앵커를 갱신합니다.
2. 앵커 링크를 해당 ID를 가리키도록 설정합니다. 예: `[setup](guide.md#first-run)`에서 `#first-run`은 대상 제목 위의 앵커 줄과 일치해야 하며, 영문 제목만으로 유추된 슬러그가 아닙니다.
3. `translate-docs`(또는 `sync --force-update`)을 다시 실행하여 모든 로케일 복사본에 업데이트된 앵커 줄이 포함되도록 합니다.

변경 사항을 미리 보려면 먼저 `write-heading-ids`에서 `--dry-run`를 사용하세요. 전체 패턴은 [앵커 링크](/ko/guide/documents/anchor-links)를 참조하세요.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## 번역된 문서에서 이미지 또는 에셋 링크 404 오류

마크다운 링크 또는 `![alt](url)`는 영어에서는 작동하지만 번역된 사본에서는 404 오류를 반환합니다. 이는 종종 URL이 여전히 원본 로케일 폴더 또는 영어 전용 정적 경로를 가리키기 때문입니다.

**해결 방법**

1. 에셋 레이아웃이 `docsOutput.style`와 일치하는지 확인합니다(플랫 vs 문서 시스템). [링크 재작성](/ko/guide/documents/link-rewriting) 및 [이미지 및 스크린샷](/ko/guide/images-and-screenshots/)을 참조하십시오.
2. 로케일 세그먼트를 교체하거나 절대 `/img/…` 경로를 연결하도록 `docsOutput.postProcessing.regexAdjustments`를 추가하거나 조정합니다. 플랫 레이아웃의 경우, 플랫 링크 재작성기가 `regexAdjustments` **이전**에 실행된다는 점을 기억하십시오. 이미 접두사가 붙은 URL에 대해 패턴을 일치시키십시오.
3. 재작성된 마크다운이 참조하는 경로에 로케일별 에셋 파일이 있는지 확인하십시오(`translate-docs`는 URL을 재작성하지만 래스터 파일을 복사하지는 않습니다).
