<a id="cli--models--languages"></a>
# CLI — 모델 및 언어

<a id="check-models"></a>
### `check-models`

**개요:** `ai-i18n-tools check-models`

활성 공급자의 `GET /models` 목록(멤버십 및 `expiration_date`)에 대해 구성된 각 모델 ID의 유효성을 검사합니다. 해당 공급자의 API 키가 필요합니다(Ollama와 같은 키 없는 공급자의 경우 필요 없음). 구성된 ID가 누락되었거나 만료된 경우 0이 아닌 값으로 종료되며, 확인된 요청 시간 초과(공급자의 `requestTimeout` 또는 `requestTimeoutMs`, 그렇지 않으면 최상위 값)를 따릅니다. 공급자가 가격 정보를 반환하는 경우(예: OpenRouter), 프롬프트/완성에 대해 100만 토큰당 USD도 표시합니다. `providers.cheaperinference.zeroDataRetention`가 true인 경우, 검사는 `GET /v1/models?zdr=true`를 사용하고 카탈로그에서 제외된 ID는 실패 처리합니다.

**참고:** [LLM 프로바이더](/ko/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**개요:** `ai-i18n-tools list-models`

활성 공급자가 해당 `GET /models` 목록을 통해 광고하는 모든 모델을 나열합니다(ID별로 정렬; 활성 공급자는 구성 `provider` 키를 따르며, `-P` / `--provider`로 재정의 가능). 해당 공급자의 API 키가 필요합니다(Ollama와 같은 키 없는 공급자의 경우 필요 없음). 공급자가 가격 정보를 반환하는 경우(예: OpenRouter), 프롬프트/완성에 대해 100만 토큰당 USD도 표시하고, `expiration_date`를 초과하는 항목에 태그를 지정합니다. `providers.cheaperinference.zeroDataRetention`가 true인 경우, 목록은 `GET /v1/models?zdr=true`입니다.

**주요 옵션:** `-P` / `--provider`

**참고:** [LLM 프로바이더](/ko/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**개요:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

활성 공급자의 채팅 모델 순위를 매기고 상위 모델(기본값 8개)을 출력합니다. 테이블 열은 순서대로 순위, 모델 ID, 인덱스(가중치 점수 * 100, 소수점 이하 한 자리), 측정된 languagebench ChrF, 측정된 Arena 점수, 그리고 100만 토큰당 USD 기준 입력 및 출력 가격입니다. 누락된 측정값은 `—`입니다. 이 명령에는 해당 공급자의 API 키가 필요합니다(Ollama와 같은 키 없는 공급자의 경우 필요 없음). 활성 공급자는 구성 `provider`을 따릅니다. `-P` / `--provider`로 재정의할 수 있습니다.

후보는 공급자의 `GET /models` 목록에서 가져옵니다. `providers.cheaperinference.zeroDataRetention`이 true인 경우, 해당 요청은 `GET /v1/models?zdr=true`입니다. 만료된 행과 비채팅 행(임베딩, 음성, 이미지, 비디오, 중재, 리랭커)은 제외됩니다. 해당 카탈로그 요청이 실패하면 명령은 1로 종료됩니다.

`--quality`이 기본값입니다. 이 설정은 가격보다 ChrF와 Arena 점수에 더 높은 가중치를 둡니다. `--price`은 해당 점수보다 가격에 가중치를 두면서도 품질 하한선을 유지하므로, 측정되지 않은 저가형 모델이 목록 상단으로 올라오지 않습니다. 두 플래그를 모두 전달하는 것은 오류입니다. 아무것도 전달하지 않으면 품질 우선으로 설정됩니다. 구성의 선택적 `modelSuggestion` 가중치는 두 프로필 중 하나를 대체합니다. [구성](/ko/reference/configuration#modelsuggestion)을 참조하세요. 동일한 가중치가 [대시보드 모델 탭](/ko/guide/translation-dashboard/models)에서도 사용됩니다.

ChrF는 메트릭이 `chrf`인 languagebench `translation_from` 및 `translation_to` 행의 평균이며, 이 프로젝트의 `sourceLocale` 및 `targetLocales`로 제한됩니다. 로캘은 languagebench 언어 코드(기본 하위 태그, `pt-BR`를 `pt`으로, `zh-Hant`을 `zh` 및 `yue`로 매핑하는 등의 몇 가지 별칭 포함)에 매핑됩니다. 빈 세트인 경우 `en`을 사용합니다. Arena는 Elo가 아닌 LMArena의 전체 Arena 점수입니다. 순위 산정 가격은 100만 토큰당 `(3 × input + output) / 4` USD입니다. 가격 출처는 0이 아닌 카탈로그 요금이며, 그다음은 models.dev 입력 및 출력 요금, 마지막으로 languagebench의 단일 비용 수치 순입니다. 카탈로그 가격이 `0`인 경우 무료가 아니라 가격이 책정되지 않은 것입니다. 알 수 없는 가격은 품질 프로필에서는 중립으로, 가격 프로필에서는 최악으로 간주됩니다. ChrF가 누락된 경우 품질 하한선 아래로 정렬됩니다. ChrF 또는 Arena가 누락되었을 때 사용되는 `0.35` 및 `0.45` 대용값은 지수에만 영향을 미치며, 테이블에는 `—`가 출력됩니다.

기준치를 통과한 행이 먼저 표시되고, 그 다음 높은 인덱스, 그 다음 저렴한 혼합 가격 순입니다. `--top` (기본값 `8`, 1 이상의 정수)는 아래 필터 적용 후 테이블, `--json` 조각, 그리고 `--apply`를 함께 제한합니다.

`--list`은 활성 공급자의 구성된 `translationModels`에 대해 동일한 열을 해당 순서대로 출력하며 `--top`는 무시합니다. 순위 열은 여전히 전체 순위에서의 각 모델 위치를 나타냅니다. 카탈로그에서 누락되었거나, 만료되었거나, 채팅 모델이 아닌 구성된 ID도 측정값에 `—`을 표시하며 나열됩니다. `--list`는 `--apply`와 결합할 수 없습니다.

`--max-output-price`은 100만 토큰당 출력 가격이 해당 USD 이하인 모델만 유지합니다. 출력 가격이 없는 모델은 제외됩니다. 그런 다음 `--min-delta`은 나머지 행을 순회하며 이전 유지 모델보다 지수가 최소 해당 포인트 이상 낮은 경우에만 모델을 유지합니다. 첫 번째 남은 모델은 항상 유지됩니다. 델타가 `0`인 경우 행을 삭제하지 않습니다. 델타가 `0`보다 클 때 지수가 없는 행은 제외됩니다. 순위 번호는 전체 목록의 번호를 유지합니다. `--list`를 사용하면 순회는 `translationModels` 순서를 따릅니다. 두 필터 모두 `--json` 및 `--apply`에도 적용됩니다. [모델 탭](/ko/guide/translation-dashboard/models)에도 동일한 두 가지 제어 기능이 있습니다.

`--json`은 이 객체를 stdout에 기록하고(공급자 블록 내에 붙여넣기), 테이블과 속성 바닥글을 stderr로 보냅니다:

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply`는 현재 구성을 형제 `ai-i18n-tools.config.{timestamp}.backup.json`로 복사합니다(또는 `-c`이 다른 파일의 이름을 지정하는 경우 `{name}.{timestamp}.backup.json`로 복사). 그런 다음 `providers.<active>.translationModels`를 해당 ID로 바꿉니다. 이름 충돌이 발생하면 `.backup.json` 앞에 `-2`, `-3` 등이 추가됩니다. 복사에 실패하면 구성 파일은 변경되지 않은 상태로 유지됩니다. `uiModels` 및 `localeModels`는 변경되지 않은 상태로 유지됩니다. 점수는 구성 파일에 기록되지 않습니다. 대시보드의 **구성 업데이트** 버튼은 동일한 백업을 기록합니다.

벤치마크 데이터는 `<cacheDir>/benchmark-scores.json`(보통 `.translation-cache/benchmark-scores.json`)에 7일 동안 캐시됩니다. 원시 데이터 세트는 런타임에 다운로드되며 패키지에 포함되어 있지 않습니다. `--refresh`는 languagebench, Arena 및 models.dev를 다시 다운로드합니다. `--refresh` 중에 실패한 소스는 이전 캐시에서 채워지지 않습니다. `--refresh`가 없으면, 다운로드 실패 시 캐시된 슬라이스를 재사용합니다. languagebench나 Arena 중 하나가 실패하면, 해당 명령은 다른 소스로 순위를 매기고 어떤 소스가 실패했는지 알립니다. 둘 다 실패하면 1을 반환하고 종료됩니다. models.dev가 실패해도 카탈로그 가격은 그대로 유지됩니다. 대시보드에는 새로 고침 제어 기능이 없으므로, CLI에서 `--refresh`를 실행한 다음 Models 탭을 새로 고침하십시오.

바닥글은 languagebench(CC BY-SA 4.0), LMArena Arena 점수(CC BY 4.0) 및 models.dev(MIT)의 출처를 밝힙니다.

**주요 옵션:** `--quality`, `--price`, `--top`, `--json`, `--apply`, `--list`, `--max-output-price`, `--min-delta`, `--refresh`, `-P` / `--provider`

**참고 항목:** [LLM 공급자](/ko/guide/providers-and-models), [Models 탭](/ko/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**개요:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

하나의 샘플을 격리 상태에서 번역하여 구성된 각 모델을 벤치마크합니다(단일 모델 클라이언트, 폴백 체인 없음). 모델 ID, 입력/출력 토큰, 실제 번역 시간, USD 비용(비용을 보고하지 않는 프로바이더의 경우 `—`)의 표를 출력하며, 합계 행과 모델별 실패도 함께 표시합니다.

모델은 기본적으로 활성 프로바이더의 `translationModels`, `uiModels`, `localeModels` ID의 합집합입니다(`--model`로 재정의 가능); 샘플은 기본적으로 내장 영어 마크다운 블록입니다(`--text` / `--file`로 재정의 가능); 소스/타겟은 기본적으로 구성 `sourceLocale` 및 첫 번째 `docs[]` 타겟 로케일이며, 최상위 `targetLocales`로 폴백합니다(`--source` / `--target`로 재정의 가능). 모델을 병렬로 실행하며, 구성 `concurrency`(기본값 4)에 의해 제한됩니다; 각 모델은 여전히 개별적으로 시간이 측정됩니다. 활성 프로바이더의 API 키가 필요합니다.

**주요 옵션:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**개요:** `ai-i18n-tools list-languages [search]`

번들된 UI 언어 카탈로그(`data/ui-languages-complete.json`)를 사람이 읽을 수 있는 표(코드, 텍스트 방향, 영어 이름, 원어 이름)로 나열합니다. 구성이나 API 키가 필요하지 않습니다. 선택적 `search` 용어를 전달하여 코드, 원어 이름, 영어 이름 또는 방향에 해당 용어가 포함된 항목만 유지합니다(대소문자 구분 안 함)(예: `list-languages portuguese`, `list-languages rtl`, `list-languages zh`).
