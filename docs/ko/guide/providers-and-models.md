<a id="llm-providers-and-models"></a>
# LLM 공급자 및 모델

모든 번역 파이프라인 — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` — 은 동일한 프로바이더 독립적 클라이언트를 통해 텍스트를 LLM으로 전송합니다. 이러한 명령을 실행하기 전에 `ai-i18n-tools.config.json`에서 **최소 한 개의 프로바이더**를 구성하고, 환경 변수 또는 `.env`에 일치하는 **API 키**를 설정해야 합니다 (**Ollama**를 제외한 내장 프리셋). `init`은(는) 시작용 `provider` / `providers` 블록을 작성하지만, 활성 프리셋에 대한 자격 증명은 직접 제공해야 합니다.

구성(config)에서 **어떤 API 엔드포인트를 호출할지**와 **어떤 모델을 시도할지** 한 번만 설정하면, 모든 번역 명령이 해당 설정과 동일한 SQLite 캐시를 공유합니다.

CLI는 최상위 `provider` 키(또는 하나만 구성된 경우 `providers`의 유일한 항목)에서 활성 공급자를 확인합니다. 각 공급자 블록은 정렬된 `translationModels` 대체 체인을 나열합니다. 내장된 사전 설정은 `baseUrl` 및 API 키 환경 변수를 자동으로 상속합니다(필요한 경우 공급자별로 재정의).

<a id="built-in-providers"></a>
### 내장 공급자

사전 설정 공급자 키는 `translationModels`만 필요합니다. 기본 URL 및 API 키 환경 변수는 자동으로 채워집니다.

| 제공자 | 기본 URL | API 키 환경 변수 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (없음) |

**사전 설정이 아닌** 키의 경우, 구성에서 `baseUrl` 및 `apiKeyEnv`을 명시적으로 설정합니다.

활성 공급자의 API 키를 환경 또는 `.env` 파일에 설정합니다. CLI는 셸에 이미 설정된 변수를 재정의하지 않고 작업 디렉터리에서 `.env`을 자동으로 로드합니다. [환경 변수](/ko/reference/environment-variables)를 참조하세요.

<a id="model-fallback-chain"></a>
### 모델 대체 체인

`translationModels`은(는) 단일 선택이 아닌 **순서가 지정된 목록**입니다. CLI는 첫 번째 모델을 시도하며, 요청, 구문 분석 또는 잘못된 스크립트 실패 시 다음 항목으로 이동합니다. 일시적인 중단이나 특정 로캘을 처리하는 데 어려움을 겪는 모델(예: 데바나가리 대신 로마자 표기 힌디어)이 전체 실행을 차단하지 않도록 여러 모델을 구성하세요. 로마자 표기 출력은 기본 스크립트 로캘에 대해 거부됩니다. 로마자 표기를 유지해야 하는 로캘은 명시적인 `-Latn` 하위 태그(예: `hi-Latn`)로 구성해야 합니다.

**해결 계층** (중복 제거, 순서 유지):

| 파이프라인 | 순서 |
| --- | --- |
| UI (`translate-ui`, 복수형, `proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| 문서, JSON, SVG | `localeModels(locale)` → `translationModels` |

선택 사항인 `providers.<active>.uiModels`는 UI 전용 목록으로, 일치하는 로케일별 재정의 다음에, 그리고 전역 `translationModels` 체인 이전에 시도됩니다. 선택 사항인 `providers.<active>.localeModels`는 BCP-47 로케일을 모든 파이프라인에서 해당 로케일에 대해 **먼저** 시도되는 모델에 매핑합니다 (`pt-br`는 `pt-BR`와 일치). `localeModels` 항목이 일치하지 않으면 파이프라인별 계층만 적용됩니다.

다양한 제공업체와 모델은 언어에 따라 비용, 속도 및 품질이 다릅니다. `npx ai-i18n-tools init`의 기본 목록을 시작점으로 간주하고, 로케일에서 일관되게 좋지 않은 결과가 나오면 확장하거나 해당 로케일에 대한 `localeModels` 항목을 추가하세요. 전체 기본값 및 근거: [구성 — `provider` 및 `providers`](/ko/reference/configuration#provider-and-providers).

**UI 문자열:** 선택적 `uiModels`를 사용하면 `translate-ui`, 복수형 생성, `proofread-ui`를 전역 `translationModels` 체인 전에 프리미엄 모델로 라우팅할 수 있습니다. UI 문구는 짧지만 사용자에게 노출되므로 유용합니다.

**아시아 로케일:** `ja`, `ko`, `zh-Hans` 및 `zh-Hant`에 대한 선택적 `localeModels` 항목이 모든 파이프라인에서 우선적으로 시도되며, `z-ai/glm-5.3` 및 `minimax/minimax-m2.7`와 같은 모델은 범용 폴백보다 CJK 스크립트에서 종종 더 우수한 성능을 발휘합니다.

예제 구성(OpenRouter). `translationModels` 및 `uiModels`은 이 저장소에서 `ai-i18n-tools.config.json`에 사용하는 목록입니다. `localeModels`은 CJK 로케일을 위한 선택적 권장 추가 기능이지만 이 저장소에서는 설정하지 않습니다.

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### 모델 유효성 검사 및 비교

`translationModels`을 변경하기 전에 각 ID가 활성 공급자에서 여전히 사용 가능한지 확인합니다.

```bash
npx ai-i18n-tools check-models
```

`check-models`은(는) 공급자의 `GET /models` 엔드포인트를 호출하고, `translationModels`, `uiModels`, `localeModels`의 모든 ID를 검증하며, 누락되었거나 `expiration_date`를 지난 ID를 보고하고, 구성된 ID 중 하나라도 유효하지 않으면 0이 아닌 값으로 종료합니다. 공급자가 가격을 반환할 때(OpenRouter 및 Cheaper Inference가 해당됨), 100만 토큰당 USD 가격도 표시합니다.

공급자가 광고하는 전체 카탈로그를 탐색합니다.

```bash
npx ai-i18n-tools list-models
```

실제 번역 샘플에서 구성된 모델을 벤치마킹하세요. `translationModels`, `uiModels`, `localeModels`의 각 고유 ID는 격리된 상태로 실행되므로 실제 시간, 토큰 사용량 및 비용을 비교할 수 있습니다.

```bash
npx ai-i18n-tools bench-models
```

순위가 매겨진 최종 후보 목록(기본값은 품질, 또는 `--price`)을 요청하고 선택적으로 상위 ID를 `translationModels`에 기록합니다. [Models tab](/ko/guide/translation-dashboard/models)에서 동일한 순위, 필터 및 구성 업데이트를 확인할 수 있습니다.

```bash
npx ai-i18n-tools suggest-models
npx ai-i18n-tools suggest-models --list
npx ai-i18n-tools suggest-models --max-output-price 2 --min-delta 2
npx ai-i18n-tools suggest-models --price --top 5 --json
npx ai-i18n-tools suggest-models --apply
npx ai-i18n-tools suggest-models --refresh
```

테이블 열은 순위, 모델 ID, 인덱스, 측정된 ChrF, 측정된 Arena Score, 그리고 100만 토큰당 입력/출력 USD입니다. 측정값이 누락된 경우 `—`으로 표시됩니다. `--list`은(는) 이미 `translationModels`에 있는 모델에 대해 해당 열을 출력합니다. `--max-output-price`은(는) 100만 토큰당 출력 USD가 해당 값 이하인 모델을 유지하고 출력 가격이 없는 모델은 제외합니다. `--min-delta`는 인덱스가 이전 유지 모델보다 최소한 해당 포인트만큼 낮은 경우에만 모델을 유지합니다. `--top`(기본값 5)는 해당 필터 이후의 테이블, `--json` 및 `--apply`을 제한합니다. `--apply`은(는) `translationModels`만 대체합니다. `--refresh`은(는) 7일 벤치마크 캐시를 다시 다운로드합니다. 선택적 가중치는 [`modelSuggestion`](/ko/reference/configuration#modelsuggestion)을 참조하세요. [suggest-models](/ko/reference/cli-commands/models#suggest-models)을 확인하세요.

샘플 텍스트, 로케일 또는 모델 목록을 재정의합니다.

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

명령 세부 정보: [CLI 참조](/ko/reference/cli-commands/).

<a id="multiple-providers"></a>
### 여러 공급자

둘 이상의 공급자가 구성된 경우, 최상위 `provider` 키를 설정하여 기본값을 선택합니다. 구성을 편집하지 않고 실행별로 전환합니다.

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

각 프로바이더 블록은 자체 `translationModels`, 선택적 `uiModels` 및 `localeModels`, `maxTokens`, `temperature`, `requestTimeout`(초) 또는 `requestTimeoutMs`을 정의할 수 있습니다. 프로바이더의 타임아웃은 최상위 `requestTimeout` / `requestTimeoutMs`을 재정의합니다. 레거시 최상위 `openrouter` 블록은 여전히 허용되며 로드 시 `providers.openrouter`으로 자동 마이그레이션됩니다.

공급자가 `usage.cost`를 생략할 경우 선택적 `pricing` 및 `modelPricing`이 100만 토큰당 USD(`inputPerMTokens` 및 `outputPerMTokens`)를 설정합니다. `pricing`은(는) 공급자 전체 기본값이며, `modelPricing` 항목은 특정 모델 ID에 대해 이를 재정의합니다. OpenRouter 및 Cheaper Inference는 이미 호출당 비용을 반환하므로 해당 공급자에서는 두 항목 모두 설정하지 마세요. 공급자가 보고한 비용은 반환된 그대로 유지됩니다. 해당 금액은 번역 요약, [`usage`](/ko/reference/cli-commands/workflows#usage) 및 [Usage & costs](/ko/guide/translation-dashboard/usage)에 포함됩니다.

샘플 요금을 포함하여 동일한 문서에서 4개의 제공자를 사용하는 실행 가능한 예제: [`examples/multi-provider`](/ko/examples#multi-provider).

<a id="further-reference"></a>
### 추가 참조

- [구성 — `provider` 및 `providers`](/ko/reference/configuration#provider-and-providers) — 프리셋 테이블, 사용자 지정 엔드포인트, 요청 타임아웃, 비용 요율, OpenRouter 전용 동작.
- [아키텍처 — LLM 클라이언트](/ko/reference/architecture) — 모델 폴백, 일괄 처리 및 비용 보고가 내부적으로 작동하는 방식.
- [환경 변수](/ko/reference/environment-variables) — API 키 환경 변수 및 기본 URL 재정의.
