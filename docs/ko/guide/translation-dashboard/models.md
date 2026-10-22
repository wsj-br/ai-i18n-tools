<a id="models"></a>
# 모델

**모델** 탭은 활성 공급자의 채팅 모델 순위를 매기므로 `translationModels`을(를) 수동으로 복사할 필요 없이 선택할 수 있습니다. 이 탭은 [`suggest-models`](/ko/reference/cli-commands/models#suggest-models)과(와) 동일한 순위 지정 방식을 사용합니다.

**품질** 또는 **가격**을(를) 선택하세요. 품질은 languagebench ChrF 및 Arena 점수를 우선시합니다. 가격은 낮은 USD 요금을 우선시하면서도 품질 하한선을 유지합니다. 구성에 공급자가 둘 이상인 경우 **공급자** 메뉴가 나타납니다. 기본값은 대시보드가 시작된 공급자(`provider` 또는 `dashboard` 명령의 `-P` / `--provider`)입니다. 공급자나 우선순위를 변경하면 테이블이 다시 로드됩니다. 선택적 가중치는 [`modelSuggestion`](/ko/reference/configuration#modelsuggestion)에 있습니다.

테이블 열은 순위, 모델 ID, 인덱스(가중치 점수에 100을 곱한 값), 측정된 ChrF, 측정된 Arena 점수, 그리고 100만 토큰당 USD 단위의 입력/출력 가격입니다. 측정값이 없는 경우 긴 대시(em dash)로 표시됩니다. 순위 번호는 아래 필터를 적용하기 전 전체 순위에서의 모델 위치입니다.

**최대 출력 가격**은(는) 100만 토큰당 출력 가격이 해당 USD 이하인 모델만 유지합니다. 출력 가격이 없는 모델은 제외됩니다. **최소 인덱스 델타**는 인덱스가 이전 유지 모델보다 해당 점수 이상 낮은 경우에만 모델을 유지합니다. 첫 번째로 남은 모델은 항상 유지됩니다. 해당 필터를 건너뛰려면 상자를 비워 두세요. 값을 변경하면 테이블이 다시 로드됩니다.

원하는 모델을 선택하세요. **상위 사용**(기본값 5)은 필터링된 목록의 상위 N개 행을 선택하고 순서를 재설정합니다. 선택한 ID를 위나 아래로 이동하여 대체 순서를 설정하세요. **구성 업데이트**는 해당 순서를 `providers.<selected>.translationModels`에 기록하고 `uiModels` 및 `localeModels`은(는) 변경하지 않습니다. **JSON 복사**는 동일한 `{ "translationModels": [...] }` 조각을 클립보드에 복사합니다.

첫 로드 시 캐시가 비어 있으면 languagebench, Arena 및 models.dev를 다운로드하므로 시간이 다소 걸릴 수 있습니다. 이후 로드 시에는 `<cacheDir>/benchmark-scores.json`에 있는 7일 캐시를 재사용합니다. 탭에는 새로 고침 버튼이 없습니다. `ai-i18n-tools suggest-models --refresh`을(를) 사용하여 CLI에서 캐시를 새로 고친 다음 탭을 다시 로드하세요. 동일한 명령으로 목록을 출력하거나 적용할 수 있습니다.

바닥글은 languagebench(CC BY-SA 4.0), LMArena Arena 점수(CC BY 4.0) 및 models.dev(MIT)의 출처를 밝힙니다.
