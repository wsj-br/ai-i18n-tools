<a id="models"></a>
# 모델

**모델** 탭은 활성 공급자의 채팅 모델 순위를 매기므로 `translationModels`을(를) 수동으로 복사할 필요 없이 선택할 수 있습니다. 이 탭은 [`suggest-models`](/ko/reference/cli-commands/models#suggest-models)과(와) 동일한 순위 지정 방식을 사용합니다.

**품질** 또는 **가격**을(를) 선택하세요. 품질은 languagebench ChrF 및 Arena 점수를 우선시합니다. 가격은 낮은 USD 요금을 우선시하면서도 품질 하한선을 유지합니다. 구성에 공급자가 둘 이상인 경우 **공급자** 메뉴가 나타납니다. 기본값은 대시보드가 시작된 공급자(`provider` 또는 `dashboard` 명령의 `-P` / `--provider`)입니다. 공급자나 우선순위를 변경하면 테이블이 다시 로드됩니다. 선택적 가중치는 [`modelSuggestion`](/ko/reference/configuration#modelsuggestion)에 있습니다.

테이블 열은 재정렬 컨트롤, 체크박스, 순위, 모델 ID, 인덱스 (가중 점수 곱하기 100), 측정된 ChrF, 측정된 아레나 점수, 그리고 100만 토큰당 USD 입/출력 가격입니다. 측정값이 누락된 경우 대시(—)로 표시됩니다. 순위 번호는 아래 필터가 적용되기 전 전체 순위에서 모델의 위치입니다. 행의 핸들을 끌거나 위/아래 버튼을 사용하여 이 테이블에서 위치를 변경할 수 있습니다. **업데이트**는 순위 순서를 다시 로드합니다.

컨트롤은 세 개의 카드에 있습니다. **순위**에는 우선순위 메뉴가 있습니다(구성에 공급자가 두 개 이상인 경우 공급자 메뉴도 있습니다). **필터**에는 **최대 출력 가격**, **최소 인덱스 델타**, **업데이트**가 있습니다. **작업**에는 **JSON 복사**와 **구성 업데이트**가 있습니다. 숫자 필드에서 Enter 키를 누르면 테이블이 새로고침됩니다. 메뉴를 변경해도 동일합니다.

**최대 출력 가격**은 100만 토큰당 출력 가격이 해당 USD 이하인 모델을 유지합니다. 출력 가격이 없는 모델은 제외됩니다. **최소 인덱스 델타**는 모델의 인덱스가 이전에 유지된 모델보다 최소한 해당 점수만큼 낮은 경우에만 모델을 유지합니다. 첫 번째로 남은 모델은 항상 유지됩니다. 두 상자 중 하나를 비워두면 해당 필터를 건너뛸 수 있습니다.

원하는 모델을 선택하세요. 상태 표시줄에 선택된 개수가 표시됩니다(예: `8 models selected.`). 체크박스 열 헤더의 좁은 숫자(기본값 8)는 해당 체크박스가 선택하는 선행 행의 개수를 나타냅니다. 이를 선택하면 해당 행들이 선택됩니다. 이를 해제하면 모든 체크박스가 해제됩니다. 선택된 행은 위에서 아래로 대체 순서가 됩니다. **구성 업데이트**는 확인을 요청하고, 현재 구성을 옆의 `ai-i18n-tools.config.{timestamp}.backup.json`로 복사한 다음, 해당 순서를 `providers.<selected>.translationModels`에 씁니다. `uiModels` 및 `localeModels`는 변경되지 않습니다. **JSON 복사**는 동일한 `{ "translationModels": [...] }` 조각을 클립보드에 복사합니다. `suggest-models --apply`는 동일한 종류의 백업을 작성합니다.

첫 로드 시 캐시가 비어 있으면 languagebench, Arena 및 models.dev를 다운로드하므로 시간이 다소 걸릴 수 있습니다. 이후 로드 시에는 `<cacheDir>/benchmark-scores.json`에 있는 7일 캐시를 재사용합니다. 탭에는 새로 고침 버튼이 없습니다. `ai-i18n-tools suggest-models --refresh`을(를) 사용하여 CLI에서 캐시를 새로 고친 다음 탭을 다시 로드하세요. 동일한 명령으로 목록을 출력하거나 적용할 수 있습니다.

::: info 외부 벤치마크 출처
  점수는 다음 외부 데이터 소스에서 계산됩니다:
  - [languagebench ChrF](https://languagebench.github.io/) (CC-BY-SA-4.0 라이선스),
  - [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC-BY-4.0 라이선스), 및
  - [models.dev](https://models.dev/)의 가격은 MIT 라이선스입니다.
:::
