<a id="usage--costs"></a>
# 사용 및 비용

**사용량 및 비용** 탭에서는 이 프로젝트에서 수행한 청구 대상 모델 API 호출(나중에 폐기된 재시도 포함)을 토큰 수 및 단일 USD 비용과 함께 요약합니다.

명령줄에서도 동일한 집계 결과를 `ai-i18n-tools usage`로 확인할 수 있습니다.

이를 통해 다음 질문에 답할 수 있습니다: *얼마나 많은 호출을 했으며, 어떤 모델과 작업이 토큰을 소비했고, 비용은 얼마였는가?*

<a id="what-is-recorded"></a>
## 기록되는 항목

각 세부 행은 사용량을 반환한 하나의 HTTP 완료입니다(나중에 파싱/스크립트/품질 문제로 번역이 거부되고 다음 폴백 모델이 시도된 경우에도 마찬가지입니다). 청구된 본문을 생성하지 않은 전송 실패는 기록되지 않습니다.

API를 호출한 명령이 완료되면, **UTC 기준 만 7일**(오늘부터 7일 전 UTC 00:00 기준)이 지난 행은 월별 합계(`api_totals`)로 집계되고 세부 로그에서 제거됩니다. 최근 1주간의 데이터는 개별 `api_calls` 행으로 유지됩니다. 요약 표는 선택한 기간에 대해 두 소스를 결합합니다.

<a id="cost-reporting"></a>
## 비용 보고

각 호출, 요약 카드 및 테이블에는 **하나의** USD 비용이 표시됩니다:

1. 응답에 포함된 경우(현재 OpenRouter) 제공자의 `usage.cost`.
2. 그렇지 않은 경우, 해당 호출의 입력 및 출력 토큰에 적용된 `providers.<name>.modelPricing`의 금액 또는 제공자 전체 `pricing` 기본값.

새 호출은 해당 금액을 `api_calls` 행에 저장합니다. 비용 없이 저장된 이전 행은 보고서를 열 때 동일한 방식으로 가격이 책정된 후 동일한 비용 수치에 추가됩니다. 이는 두 번째 열로 표시되지 않습니다. 어떤 소스도 적용되지 않는 경우 셀은 `—`이며, `$0.00`가 아닙니다. 나중에 구성된 요율을 변경해도 이미 비용이 저장된 행은 다시 작성되지 않습니다. 월별 롤업은 비용이 저장된 호출 수(`ncost_acc` / `ncost_dis`)를 계속 유지하므로 `$0.00`는 압축 후에도 "알 수 없음"과 구분됩니다.

<a id="filters"></a>
## 필터

시간 범위, 제공자, 모델, 작업(`translate-docs`, `translate-ui`, `translate-json`, `translate-svg`, `proofread-ui`, `bench-models`), 로케일 및 결과(수락됨 vs 폐기됨)별로 필터링합니다.

시간 범위:

- 짧은 범위(`Last 30 minutes` ~ `Last 30 days`)는 롤링 기간을 사용합니다. **시간 경과에 따른 사용량**은 해당 범위에 세부 정보가 남아 있는 각 UTC 달력일에 대해 하나의 행을 표시합니다.
- `Last 2 months` / `Last 3 months`은 현재 달력월의 첫째 날에서 1 / 2개월을 뺀 UTC 00:00에 시작합니다. **시간 경과에 따른 사용량**은 보존된 일일 행과 월별로 하나의 행을 표시합니다.
- `All time`에는 모든 월별 합계와 보존된 일일 행이 포함됩니다.

오래된 사용량을 삭제하려면 **다음보다 오래된 항목 삭제**(`> 1 month`, `> 2 months`, `> 3 months`, `> 6 months`, `> 1 year` 또는 `all data (clear)`)에서 기간을 선택한 다음 **데이터 삭제**를 클릭합니다. 메뉴는 `-`에서 시작되며, 기간을 선택할 때까지 **데이터 삭제**가 비활성화됩니다. 동일한 기간을 `ai-i18n-tools usage --clear [--older-than 1mo|2mo|3mo|6mo|1y|all]`로도 사용할 수 있습니다. 캘린더 기준일은 현재 월(`1mo`) 또는 현재 월과 이전 월을 유지합니다.

<a id="command-line"></a>
## 명령줄

```bash
ai-i18n-tools usage
# ai-i18n-tools usage --since 7d --operation translate-docs
# ai-i18n-tools usage --since 2mo
# ai-i18n-tools usage --clear --older-than 3mo --dry-run
```
