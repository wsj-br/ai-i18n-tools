<a id="ai-models"></a>
# AI 모델

모델은 공급자에 있는 이름이 지정된 하나의 시스템입니다(예: `google/gemini-2.5-flash` 또는 `gpt-5-mini`). `init`는 선택한 공급자에 대한 시작 `translationModels` 목록을 작성합니다. 이 목록을 시작점으로 사용하세요.

`suggest-models`를 사용하거나 번역 대시보드의 **모델** 아래에서 동일한 순위를 사용하여 이 프로젝트의 목록을 선택하세요. 두 방법 모두 게시된 벤치마크를 기준으로 활성 공급자의 채팅 모델 순위를 매기고 그 결과를 `translationModels`에 쓸 수 있습니다. 먼저 공급자와 해당 API 키를 설정하세요. [LLM 공급자](/ko/guide/providers-and-models).

<a id="start-with-a-ranked-list"></a>
## 순위 목록으로 시작하기

<a id="from-the-command-line"></a>
### 명령줄에서

`suggest-models`는 활성 공급자가 현재 제공하는 채팅 모델의 순위를 매기고 짧은 표를 출력합니다. 품질이 기본값입니다. 인덱스는 languagebench ChrF 및 Arena 점수입니다. 가격은 별도의 열이자 정렬 순서이며, 인덱스의 일부는 아닙니다.

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

컬럼은 순위, 모델 ID, 인덱스, 측정된 ChrF, 측정된 아레나 점수, 입력 가격, 출력 가격, 100만 토큰당 USD 혼합 가격, 그리고 프론티어 티어입니다. 누락된 측정값은 `—`입니다. 인덱스는 품질 점수에 100을 곱한 값입니다. 인덱스가 높을수록 이 프로젝트의 언어에 더 적합합니다. 다른 행의 ChrF, 아레나 점수 및 토큰 가격을 반복하는 ID는 이 표에서 제외됩니다. `--list`은 여전히 이를 출력합니다.

테이블이 올바르게 보일 때 해당 목록을 구성에 작성합니다:

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply`은 `providers.<active>.translationModels`을 대체합니다. 먼저 현재 구성을 형제 `ai-i18n-tools.config.{timestamp}.backup.json`로 복사합니다. `uiModels`과 `localeModels`는 그대로 유지됩니다. `--top`(기본값 8)는 표와 `--apply`에 포함되는 ID의 개수입니다. 첫 번째 ID는 번역이 먼저 시도하는 ID입니다. 해당 목록에는 `--max-price`과 `--min-delta`을 추가합니다. 가격 상한선은 예산보다 더 많은 비용이 드는 대체 모델을 방지하고, 인덱스 간격은 상위 모델과 작은 차이만 있는 모델을 제외합니다.

`--price`는 품질-가격 프론티어에서 가장 저렴한 모델을 먼저 나열하며 여전히 품질 하한선을 유지합니다. 따라서 측정값이 없는 저렴한 모델은 점수가 있는 모델보다 아래에 위치합니다. `--quality`이 기본값입니다. 두 플래그를 모두 전달하면 오류가 발생합니다.

<a id="from-the-dashboard"></a>
### 대시보드에서

**모델** 탭에는 동일한 순위가 표시되며 각 행에 확인란이 있습니다.

```bash
ai-i18n-tools dashboard
```

**모델**을 엽니다. **품질** 또는 **가격**을 선택합니다. 원하는 행을 선택합니다. 선택된 행은 위에서 아래 순서로 번역 시 시도됩니다. **구성 업데이트**는 확인을 요청하고 동일한 종류의 백업을 작성한 다음 해당 순서를 `translationModels`에 저장합니다. 직접 붙여넣고 싶을 때는 **JSON 복사**를 사용하여 `{ "translationModels": [...] }` 조각을 클립보드에 복사할 수 있습니다.

**최대 혼합 가격** 및 **최소 인덱스 델타**는 `suggest-models --max-price` 및 `--min-delta`와 일치합니다. 제어 및 열: [모델 탭](/ko/guide/translation-dashboard/models).

<a id="how-the-ranking-chooses"></a>
### 순위 결정 방식

해당 목록은 공급자의 라이브 채팅 카탈로그에 대한 벤치마크 순위입니다. 첫 실행은 세 개의 공개 데이터셋을 다운로드하며 시간이 다소 걸릴 수 있습니다. 이후 실행은 7일 캐시를 재사용합니다.

| 신호 | 기여 내용 | 출처 |
| --- | --- | --- |
| ChrF | 프로젝트 언어의 번역 품질 | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| Arena Score | 일대일 비교를 통한 전반적인 선호도 | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| 100만 토큰당 USD | 입력, 출력 및 혼합 가격 `(3 × input + output) / 4` | 공급자가 요율을 게시할 때의 카탈로그, 그렇지 않으면 [models.dev](https://models.dev/) (MIT) |

이러한 신호로부터 순위는 각 후보 모델에 대해 두 가지 값, 즉 품질 지수(ChrF와 Arena 점수를 결합한 값)와 [파레토 프론티어](https://en.wikipedia.org/wiki/Pareto_frontier) 계층(혼합 토큰 가격 대비 품질을 평가한 값)을 도출합니다.

ChrF는 `sourceLocale` 및 `targetLocales`에 대한 languagebench의 번역 점수를 사용합니다. 로캘은 languagebench 언어 코드에 매핑됩니다. 기본 하위 태그이며 `pt-BR`를 `pt`으로, `zh-Hant`를 `zh`으로 매핑하는 등의 별칭이 있습니다. 해당 언어를 잘 번역하는 모델이 전반적으로만 점수가 좋은 모델보다 순위가 높습니다. 임베딩, 이미지, 음성 및 기타 비채팅 모델은 건너뛰며, 만료일이 지난 ID도 마찬가지입니다.

인덱스는 ChrF와 아레나 점수입니다. 가격은 포함되지 않습니다. 점수는 ChrF(기본값 55%)와 아레나 점수(기본값 45%)에 가중치를 부여하며, 각 점수는 공급자의 채팅 카탈로그에서 가장 높은 점수를 기준으로 정규화되고 0-100 스케일에서 소수점 첫째 자리까지 반올림됩니다. 대체 값(ChrF의 경우 `0.35`, 아레나의 경우 `0.45`)은 측정값이 누락된 경우에만 적용됩니다. 테이블에는 `—`가 표시됩니다.

품질 하한선은 최소 ChrF 임계값입니다(품질의 경우 후보 풀 최고 ChrF의 기본값 70%, 가격의 경우 60%). 이 하한선 미만의 모델(ChrF 측정값이 없는 모델 포함)은 하한선을 통과한 모델 뒤에 정렬되며, 프론티어 열에 `—`이 표시됩니다. 기본 프로필인 품질은 인덱스별로 정렬하고, 인덱스가 동일한 경우 더 저렴한 혼합 가격으로 정렬합니다. 가격은 프론티어 티어별로 모델을 정렬합니다(티어 1이 가장 저렴하고, 그 다음 티어 2 순). 선택적 사용자 지정 가중치 및 하한선은 [`modelSuggestion`](/ko/reference/configuration#modelsuggestion-optional)에 있습니다.

ChrF, 아레나 점수, 입력 가격, 출력 가격을 공유하는 두 ID는 별칭입니다. 제안은 더 짧은 ID를 유지하며, `preview-06-05` 또는 `20241022`과 같이 날짜가 없는 ID를 날짜가 있는 ID보다 선호합니다. 다른 ID는 전체 순위에 남아 있으므로 `--list`는 구성된 별칭을 계속 표시할 수 있으며, 테이블, `--json` 및 `--apply`에서는 제외됩니다.

<a id="reading-the-frontier-column"></a>
#### 프론티어 열 읽기

프론티어 열은 점수가 아닌 티어입니다. 모델은 다른 모델이 더 비싸지 않고(혼합 가격) 최소한 동일한 인덱스를 가지며, 인덱스에서 엄격히 더 저렴하거나 엄격히 더 높은 경우 지배됩니다. `2`이 `1`보다 두 배 나쁜 것은 아니며, 티어 숫자는 행 간의 품질을 비교하지 않습니다. 오직 인덱스만이 비교합니다. 두 행이 `3`와 `4`을 표시하더라도 둘 모두를 능가하는 티어 1 모델과 한 포인트 이내에 있을 수 있습니다.

- `1`은 다른 어떤 모델도 인덱스에서 더 저렴하면서 더 높지 않다는 것을 의미합니다. `--price`에서 티어 1은 가장 저렴한 것부터 가장 비싼 것 순으로 정렬되며, 각 단계는 비용이 더 많이 들고 인덱스가 더 높습니다. `--min-delta`는 작은 이득만 추가하는 단계를 숨깁니다.
- `2`은 모델이 지배되지만, 티어 1 모델에 의해서만 지배된다는 것을 의미합니다. 테이블 아래 줄에는 각 지배된 행을 능가하는 티어 1 모델의 이름이 표시됩니다. 대시보드에서 해당 값에 마우스를 올리면 동일한 모델을 볼 수 있습니다.
- `3` 이상은 한 단계 더 아래에서 동일한 규칙을 따릅니다. 숫자가 높을수록 체인이 길어지며, 인덱스가 최고 모델에서 더 멀리 떨어져 있다는 의미는 아닙니다.
- `—`는 모델에 가격이 없거나, 품질 하한선 미만이거나, 다른 행의 별칭임을 의미합니다. 비교되지 않습니다.

티어 1은 효율성 검사입니다. 다른 어떤 것도 엄격히 더 저렴하면서 점수가 더 높지 않습니다. 더 높은 티어도 목록에 포함될 수 있습니다. 공급업체 다양성, 속도 제한, 지연 시간 및 컨텍스트 창은 인덱스 외부에 있으며, 티어 1 모델이 속도 제한에 걸리거나 배치를 거부할 때 다른 공급업체의 대체 모델이 여전히 도움이 됩니다. 동일한 모델의 다른 ID는 도움이 되지 않습니다.

별칭이 아닌 정확한 동점(동일한 혼합 가격 및 동일한 인덱스, 다른 토큰 가격 또는 다른 점수)은 티어를 공유합니다. 인덱스는 테이블에 표시된 대로 소수점 첫째 자리까지 반올림하여 비교됩니다.

티어는 전체 카탈로그에 걸쳐 계산되므로 `--max-price`, `--min-delta`, `--top`는 행의 번호를 다시 매기지 않고 숨깁니다. 전체 목록에서 티어 1인 모델은 가격 상한선 이후에도 티어 1로 유지됩니다. `--max-price`은 예산을 초과하는 모델을 제외합니다. 상한선 미만의 모든 지배된 행을 제거하지는 않습니다. 프론티어 열과 테이블 아래 줄에 해당 내용이 표시됩니다.

`--price`은 티어 1을 가장 저렴한 것부터 가장 비싼 것 순으로 나열하고, 그 다음 티어 2도 같은 방식으로 나열합니다. 기본값인 품질은 인덱스별로 정렬하고 프론티어 열을 레이블로 취급합니다.

`suggest-models --refresh`는 데이터 세트를 다시 다운로드합니다. 그 후에 **모델** 탭을 다시 로드하세요.

`--json`, `--list` 및 점수 공식을 포함한 모든 플래그: [suggest-models](/ko/reference/cli-commands/models#suggest-models).

<a id="why-the-list-has-more-than-one-model"></a>
## 목록에 여러 모델이 있는 이유

<a id="model-fallback-chain"></a>
### 모델 폴백 체인

`translationModels`는 순서가 있는 목록입니다. CLI는 첫 번째 모델을 시도합니다. 요청이 실패하거나, 구문 분석할 수 없는 응답을 받거나, 또는 잘못된 쓰기 시스템의 텍스트가 있는 경우, 해당 배치의 다음 ID를 시도합니다.

하나의 ID는 단일 실패 지점입니다. 모델은 시간 초과되거나, 이 도구가 거부하는 텍스트를 반환하거나, 한 언어는 잘 번역하고 다른 언어는 제대로 번역하지 못할 수 있습니다. 일반적인 경우는 `hi`이(가) 데바나가리어를 예상하는 로마자화된 힌디어입니다. 로마자화된 출력은 기본 스크립트 로케일에서는 거부됩니다. 로마자화를 유지해야 하는 로케일에는 `hi-Latn`와 같은 명시적인 `-Latn` 하위 태그가 필요합니다.

그렇기 때문에 목록에는 여러 ID가 포함되어 있으며, 가장 강력한 것이 먼저 옵니다. 목록의 순서는 번역이 시도하는 순서입니다.

**해결 계층** (중복 제거, 순서 유지):

| 파이프라인 | 순서 |
| --- | --- |
| UI (`translate-ui`, 복수형, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 문서, JSON, SVG | `localeModels(locale)` → `translationModels` |

대부분의 프로젝트는 `translationModels`만 설정합니다. 다른 두 목록은 한 종류의 텍스트나 한 언어에서 다른 모델을 먼저 시도해야 할 때 사용됩니다.

**UI 문자열.** 선택 사항인 `uiModels`는 일치하는 로캘별 재정의 다음에, 그리고 `translationModels` 전에 시도됩니다. UI 카피는 짧고 눈에 잘 띄므로 해당 체인에서 더 강력한 모델을 사용하는 것이 일반적인 분할 방식입니다. `suggest-models --apply`는 `translationModels`만 씁니다.

**단일 로캘.** 선택 사항인 `localeModels`는 BCP-47 태그를 모든 파이프라인에서 해당 로캘에 대해 먼저 시도되는 모델에 매핑합니다(`pt-br`가 `pt-BR`와 일치). 일본어, 한국어, 중국어는 범용 대체 모델을 사용할 때보다 `z-ai/glm-5.3` 및 `minimax/minimax-m2.7`와 같이 해당 스크립트에 맞게 조정된 모델에서 더 나은 성능을 보이는 경우가 많습니다. 일치하는 항목이 없으면 위의 파이프라인 계층만 적용됩니다.

예시(OpenRouter). ID는 세 목록의 형태를 보여줍니다. `suggest-models` 또는 **모델** 탭에서 `translationModels`를 가져옵니다. UI 카피나 단일 로캘에 자체 체인이 필요한 경우 `uiModels` 또는 `localeModels`를 추가하세요.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

`init`에서 제공하는 사전 설정 목록 및 필드 참조: [구성 —](/ko/reference/configuration#provider-and-providers) `provider` [및](/ko/reference/configuration#provider-and-providers) `providers`.

<a id="check-list-and-benchmark"></a>
## 확인, 목록 및 벤치마크

목록이 구성에 있으면 다음 명령을 사용하여 이를 검사할 수 있습니다. 번역은 이 명령을 사용하기 전에 실행될 수 있습니다.

<a id="check-models"></a>
### `check-models`

구성된 각 ID가 활성 공급자에 의해 여전히 제공되는지 확인합니다.

```bash
ai-i18n-tools check-models
```

공급자의 `GET /models` 엔드포인트를 호출하고, `translationModels`, `uiModels`, `localeModels`의 모든 ID를 확인하고, 누락되었거나 `expiration_date`가 지난 ID를 보고하며, 구성된 ID가 유효하지 않은 경우 0이 아닌 값으로 종료합니다. 공급자가 가격을 게시하는 경우(OpenRouter 및 Cheaper Inference가 해당), 1백만 토큰당 USD 가격도 표시합니다.

<a id="list-models"></a>
### `list-models`

공급자가 광고하는 전체 카탈로그를 ID별로 정렬하여 출력합니다. 순위에서 제외된 ID를 조회하는 데 사용하세요.

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

구성된 각 모델을 통해 샘플 하나를 개별적으로 번역하고 입력 및 출력 토큰, 실제 경과 시간, USD 비용을 출력합니다. `suggest-models`는 위에서 게시된 점수를 사용합니다. `bench-models`는 모델을 호출하므로 API 크레딧을 사용하고 계정의 지연 시간과 가격을 표시합니다.

```bash
ai-i18n-tools bench-models
```

`translationModels`, `uiModels`, `localeModels`의 각 고유 ID는 대체(fallback) 없이 실행됩니다. 특정 비교를 수행하려면 샘플 또는 ID를 재정의하세요.

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

명령어 세부정보: [CLI — 모델 및 언어](/ko/reference/cli-commands/models).

<a id="further-reference"></a>
## 추가 참조

- [LLM 제공업체](/ko/guide/providers-and-models) — 사전 설정, API 키 및 `-P`를 사용한 제공업체 전환.
- [모델 탭](/ko/guide/translation-dashboard/models) — 대시보드에 있는 동일한 순위.
- [구성 —](/ko/reference/configuration#provider-and-providers) `provider` [및](/ko/reference/configuration#provider-and-providers) `providers` — `translationModels`, `uiModels`, `localeModels`, 시간 초과 및 비용 요율.
- [suggest-models](/ko/reference/cli-commands/models#suggest-models) — 플래그, 필터 및 점수 공식.

::: info 외부 벤치마크 출처
점수는 외부 데이터 소스에서 계산됩니다:

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench), CC-BY-SA-4.0 라이선스
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset), CC-BY-4.0 라이선스
- [models.dev](https://models.dev/) 가격, MIT 라이선스
:::
