<a id="ai-models"></a>
# AI 모델

모델은 공급자에 있는 이름이 지정된 하나의 시스템입니다(예: `google/gemini-2.5-flash` 또는 `gpt-5-mini`). `init`는 선택한 공급자에 대한 시작 `translationModels` 목록을 작성합니다. 이 목록을 시작점으로 사용하세요.

`suggest-models`를 사용하거나 번역 대시보드의 **모델** 아래에서 동일한 순위를 사용하여 이 프로젝트의 목록을 선택하세요. 두 방법 모두 게시된 벤치마크를 기준으로 활성 공급자의 채팅 모델 순위를 매기고 그 결과를 `translationModels`에 쓸 수 있습니다. 먼저 공급자와 해당 API 키를 설정하세요. [LLM 공급자](/ko/guide/providers-and-models).

<a id="suggest-models"></a>
## 순위가 매겨진 후보 목록으로 시작하기

<a id="suggest-models-cli"></a>
### 명령줄에서

`suggest-models`는 활성 공급자가 현재 제공하는 채팅 모델의 순위를 매기고 간단한 표를 출력합니다. 기본값은 품질입니다. 번역 측정값과 일반 선호도 점수가 가격보다 더 중요하게 고려됩니다.

```bash
ai-i18n-tools suggest-models
```

열은 순위, 모델 ID, 지수, 측정된 ChrF, 측정된 Arena Score, 1백만 토큰당 입출력 가격(USD)입니다. 측정값이 없는 경우는 `—`입니다. 지수는 가중 점수에 100을 곱한 값입니다. 품질 순위에서는 지수가 높을수록 이 프로젝트에 더 적합합니다.

표가 올바르게 보이면 해당 후보 목록을 구성에 작성하세요.

```bash
ai-i18n-tools suggest-models --apply
```

`--apply`는 `providers.<active>.translationModels`을 대체합니다. 먼저 현재 구성을 형제 파일인 `ai-i18n-tools.config.{timestamp}.backup.json`에 복사합니다. `uiModels` 및 `localeModels`는 그대로 유지됩니다. `--top`(기본값 8)는 표와 `--apply`에 포함할 ID의 수입니다. 첫 번째 ID는 번역 시 가장 먼저 시도되는 ID입니다.

`--price`는 더 낮은 요금을 우선으로 하면서도 최소한의 품질을 유지하므로, 측정값이 없는 저렴한 모델은 점수가 있는 모델보다 순위가 낮습니다. `--quality`이 기본값입니다. 두 플래그를 모두 전달하면 오류가 발생합니다.

<a id="suggest-models-dashboard"></a>
### 대시보드에서

**모델** 탭에는 동일한 순위가 표시되며 각 행에 확인란이 있습니다.

```bash
ai-i18n-tools dashboard
```

**모델**을 엽니다. **품질** 또는 **가격**을 선택합니다. 원하는 행을 선택합니다. 선택된 행은 위에서 아래 순서로 번역 시 시도됩니다. **구성 업데이트**는 확인을 요청하고 동일한 종류의 백업을 작성한 다음 해당 순서를 `translationModels`에 저장합니다. 직접 붙여넣고 싶을 때는 **JSON 복사**를 사용하여 `{ "translationModels": [...] }` 조각을 클립보드에 복사할 수 있습니다.

**최대 출력 가격** 및 **최소 지수 델타**는 `suggest-models --max-output-price` 및 `--min-delta`과 일치합니다. 컨트롤 및 열: [모델 탭](/ko/guide/translation-dashboard/models).

<a id="how-models-are-ranked"></a>
### 순위 선정 방식

후보 목록은 공급자의 실시간 채팅 카탈로그에 대한 벤치마크 순위입니다. 처음 실행 시에는 세 개의 공개 데이터 세트를 다운로드하므로 시간이 걸릴 수 있습니다. 이후 실행 시에는 `<cacheDir>/benchmark-scores.json`(일반적으로 `.translation-cache/benchmark-scores.json`)에 있는 7일 캐시를 재사용합니다.

| 신호 | 기여 내용 | 출처 |
| --- | --- | --- |
| ChrF | 프로젝트 언어에 대한 번역 품질 | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Arena Score | 일대일 비교를 통한 전반적인 선호도 | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| 1백만 토큰당 USD | 입력 및 출력 가격 | 공급자가 요금을 게시하는 경우 해당 카탈로그, 그렇지 않은 경우 [models.dev](https://models.dev/) (MIT) |

ChrF는 `sourceLocale` 및 `targetLocales`에 대한 languagebench의 번역 점수를 사용합니다. 로캘은 languagebench 언어 코드에 매핑됩니다. 기본 하위 태그이며 `pt-BR`를 `pt`으로, `zh-Hant`를 `zh`으로 매핑하는 등의 별칭이 있습니다. 해당 언어를 잘 번역하는 모델이 전반적으로만 점수가 좋은 모델보다 순위가 높습니다. 임베딩, 이미지, 음성 및 기타 비채팅 모델은 건너뛰며, 만료일이 지난 ID도 마찬가지입니다.

기본 프로필인 Quality는 가격보다 ChrF와 Arena 점수에 가중치를 둡니다. Price는 그 강조점을 반대로 하고 위에서 설명한 품질 하한을 유지합니다. 선택적 가중치는 [`modelSuggestion`](/ko/reference/configuration#modelsuggestion)입니다.

`suggest-models --refresh`는 데이터 세트를 다시 다운로드합니다. 그 후에 **모델** 탭을 다시 로드하세요.

`--json`, `--list` 및 점수 공식을 포함한 모든 플래그: [suggest-models](/ko/reference/cli-commands/models#suggest-models).

<a id="why-more-than-one-model"></a>
## 목록에 모델이 두 개 이상 있는 이유

<a id="model-fallback-chain"></a>
### 모델 대체 체인

`translationModels`는 순서가 있는 목록입니다. CLI는 첫 번째 모델을 시도합니다. 요청이 실패하거나, 구문 분석할 수 없는 응답을 받거나, 또는 잘못된 쓰기 시스템의 텍스트가 있는 경우, 해당 배치의 다음 ID를 시도합니다.

ID가 하나이면 단일 장애점이 됩니다. 모델은 시간 초과되거나, 이 도구가 거부하는 텍스트를 반환하거나, 한 언어는 잘 번역하고 다른 언어는 제대로 번역하지 못할 수 있습니다. 일반적인 경우는 `hi`가 데바나가리 문자를 예상하는데 로마자화된 힌디어가 사용되는 경우입니다. 로마자화된 출력은 고유 스크립트 로캘에서 거부됩니다. 로마자화된 상태로 유지되어야 하는 로캘에는 `hi-Latn`와 같은 명시적인 `-Latn` 하위 태그가 필요합니다.

이것이 최종 후보 목록에 가장 강력한 ID부터 순서대로 여러 ID가 포함된 이유입니다. 목록의 순서는 번역이 시도되는 순서입니다.

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

`init`의 사전 설정 목록 및 필드 참조: [구성 — `provider` 및 `providers`](/ko/reference/configuration#provider-and-providers).

<a id="validate-and-compare-models"></a>
## 확인, 나열 및 벤치마크

최종 후보 목록이 구성에 포함되면 이 명령어로 검사할 수 있습니다. 이 명령어를 사용하기 전에 번역을 실행할 수 있습니다.

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

Cheaper Inference에 대해 [데이터 보존 없음](/ko/guide/providers-and-models#cheaperinference-zero-data-retention)이 켜져 있으면 `check-models`, `list-models`, `suggest-models`는 `GET /models?zdr=true`를 읽습니다.

명령어 세부정보: [CLI — 모델 및 언어](/ko/reference/cli-commands/models).

<a id="further-reference"></a>
## 추가 참조

- [LLM 제공업체](/ko/guide/providers-and-models) — 사전 설정, API 키, `-P`를 사용한 제공업체 전환.
- [모델 탭](/ko/guide/translation-dashboard/models) — 대시보드의 동일한 순위.
- [구성 — `provider` 및 `providers`](/ko/reference/configuration#provider-and-providers) — `translationModels`, `uiModels`, `localeModels`, 시간 초과, 비용 요율.
- [suggest-models](/ko/reference/cli-commands/models#suggest-models) — 플래그, 필터, 점수 공식.
