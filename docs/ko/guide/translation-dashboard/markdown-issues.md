<a id="markdown-issues-static-checks"></a>
# 정적 검사(Markdown 문제)

**Markdown 문제** 탭은 `markdown_source_issues`SQLite 테이블의 행을 나열합니다. 각 행은 **예비 번역** 결과입니다. 예를 들어 공통 마크다운 스타일 규칙 `translate-docs` 에서 마스킹에 사용하는 것과 동일한 규칙으로 강조/취소선으로 결합되지 않는 구분자 실행, 백틱으로 열렸지만 닫히지 않은 인라인 코드 범위 또는 `STRONG_OUTSIDE_LINK` `**` / `__` 이 `[text](url)` 링크를 감쌌을 때(링크 텍스트 내에만 볼드를 넣음).

이것은 **실패**와 동일하지 않습니다. **실패**는 로컬 모델 출력 및 번역 후 유효성 검사 문제( `AST mismatch` , 플레이스홀더 누수 등)를 기록합니다.

<a id="when-to-use-it"></a>
## 언제 사용하는가

이 탭을 사용하여 **소스 마크다운**을 수정하고자 할 때 특히 [실패](/ko/guide/translation-dashboard/failures) 탭에서 구조에 대한 품질 검사가 계속 실패하는 경우에 사용합니다.

<a id="how-to-use-the-tab"></a>
## 사용 방법

1. **요약** 스트립을 읽으십시오. 총 문제 행 및 문제 코드당 수입니다.
2. 캐시 키( `doc-block:{index}:` 접두사 포함)와 부분 일치에 대한 파일 경로, **문제 코드** 또는 **소스 해시**로 필터링합니다.
3. 기본적으로 **파일 경로 + 줄** 또는 **최신 스캔 시간**으로 정렬합니다.
4. 🔗 링크 버튼은 `ai-i18n-tools dashboard`이 실행 중인 터미널에 파일/줄 힌트를 기록합니다.

소스 파일을 수정한 다음 번역을 다시 실행합니다.

<a id="refreshing-rows"></a>
## 행 새로 고침

| 명령/이벤트 | 효과 |
| --- | --- |
| `ai-i18n-tools check-markdown` | 구성된 문서 다시 스캔; 선택적 `-p` / `--path` 범위, `--no-cache`, `--json` |
| `translate-docs` (기본값) | `docs[].warnMarkdownSourceIssues`이 `false`가 아닌 경우 각 마크다운 파일에 대한 행을 다시 스캔하고 대체합니다 |
| 파일 경로에 대한 모든 번역 삭제 | 동일한 정리(실패와 동일)로 해당 파일 경로에 대한 마크다운 문제 행을 제거합니다 |
| `cleanup` | 전체 `markdown_source_issues` 테이블을 지우고 행을 다시 채우기 위해 `sync --force-update`를 실행합니다 |

<a id="common-issue-codes"></a>
## 일반적인 문제 코드

| 코드 | 의미 |
| --- | --- |
| 페어링되지 않은 강조/취소선 | 공통 마크다운 규칙에 따라 닫히지 않는 구분자 실행 |
| 닫히지 않은 인라인 코드 | 백틱 범위가 열렸지만 닫히지 않음 |
| `STRONG_OUTSIDE_LINK` | 볼드 마커가 마크다운 링크를 감쌉니다. 링크 텍스트 내부로 볼드를 이동합니다 |

[복잡한 마크다운 및 실패한 품질 검사](/ko/guide/documents/#complex-markdown-and-failed-quality-checks)도 참조하십시오.
