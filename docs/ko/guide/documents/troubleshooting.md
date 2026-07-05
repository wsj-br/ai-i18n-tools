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

변경 사항을 미리 보려면 먼저 `write-heading-ids`에서 `--dry-run`를 사용하세요. 전체 패턴은 [앵커 링크](/guide/documents/anchor-links)를 참조하세요.
