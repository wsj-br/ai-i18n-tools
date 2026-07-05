<a id="translation-dashboard"></a>
# 번역 대시보드

번역 대시보드는 프로젝트의 번역 데이터를 검사하고 편집하기 위한 로컬 웹 UI입니다. 다음 세 가지 저장소에서 데이터를 읽습니다.

- **SQLite 캐시** (`cacheDir`) — 문서 세그먼트 번역, 실패 기록, 마크다운 문제 스캔
- **`strings.json`** — UI 문자열 카탈로그(일반 문자열 및 복수 그룹)
- **사용자 용어집 CSV** (`glossary.userGlossary`) — `translate-ui` 및 `proofread-ui`에 대한 용어 힌트

번역 실행 후 이를 사용하여 문제를 찾거나, 잘못된 출력을 재정의하거나, 캐시 적용 범위를 검토할 수 있습니다. 수동으로 SQLite 또는 JSON을 파고들 필요가 없습니다.

<a id="start-the-dashboard"></a>
## 대시보드 시작

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

기본 수신 포트는 **8675**입니다. 해당 포트를 사용할 수 없는 경우, 서버는 다음 포트를 시도하며(최대 1000회 시도), 선택한 포트를 로그에 기록합니다. 더 이상 사용되지 않는 별칭 `editor`은 여전히 작동하지만 경고를 출력합니다. 대신 `dashboard`을 사용하는 것이 좋습니다.

대시보드 UI는 CLI와 동일한 로케일 확인을 사용합니다: `-L` / `--ui-lang` → `AI_I18N_LANG` → 구성 `uiLanguage` → OS 로케일. [도구 UI 언어](/reference/environment-variables#tool-ui-language)를 참조하십시오.

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## 어떤 탭을 사용해야 합니까?

| 원하는 작업… | 탭 | 가이드 |
| --- | --- | --- |
| 번역에 실패한 문서 세그먼트 수정 | **실패** | [실패](/guide/translation-dashboard/failures) |
| 번역하기 전에 원본 마크다운 수정 | **마크다운 문제** | [마크다운 문제](/guide/translation-dashboard/markdown-issues) |
| 캐시된 문서 번역 재정의 | **문서** | [문서 캐시](/guide/translation-dashboard/documentation-cache) |
| UI 레이블 수정 | **UI 문자열** | [UI 문자열 및 복수형](/guide/translation-dashboard/ui-strings) |
| 복수형 수정 (`one`, `other`, …) | **UI 복수형** | [UI 문자열 및 복수형](/guide/translation-dashboard/ui-strings) |
| UI 번역을 위한 용어 잠금 | **용어집** | [용어집](/guide/translation-dashboard/glossary) |
| 캐시 적용 범위 및 모델 사용량 확인 | **통계** | [통계](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## 편집 후

| 편집한 항목… | 다음을 실행… | 피해야 할 항목… |
| --- | --- | --- |
| 문서 캐시 행 | `sync --force-update` 또는 `translate-docs --force-update` | — |
| UI 문자열 또는 복수형 | 일반 `sync` 또는 `translate-ui` | `--force` (`user-edited` 행을 덮어씁니다) |
| 용어집 행 | 다음 `translate-ui` 또는 `proofread-ui` | — |

수동 편집은 캐시 또는 `strings.json`에서 모델 `user-edited`으로 태그가 지정됩니다. 변경되지 않은 원본 텍스트를 다시 번역하면 `--force`를 사용하지 않는 한 해당 행을 건너뜁니다.

<a id="tips"></a>
## 팁

- **로그 링크 버튼** (테이블 행의 🔗)은 `ai-i18n-tools dashboard`이 실행 중인 **터미널**에 파일:줄 힌트를 출력합니다. 브라우저에서 편집기로 이동하는 데 유용합니다.
- **닫기** (탭 바의 오른쪽 상단)는 대시보드 서버를 정상적으로 종료합니다.
- 브라우저 탭이 열려 있는 동안 서버가 중지되면 오버레이가 나타납니다. 다시 연결하려면 `ai-i18n-tools dashboard`을 다시 시작하십시오.
