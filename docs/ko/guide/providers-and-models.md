<a id="llm-providers"></a>
# LLM 제공자

모든 번역 파이프라인 — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg` — 은 동일한 프로바이더 독립적 클라이언트를 통해 텍스트를 LLM으로 전송합니다. 이러한 명령을 실행하기 전에 `ai-i18n-tools.config.json`에서 **최소 한 개의 프로바이더**를 구성하고, 환경 변수 또는 `.env`에 일치하는 **API 키**를 설정해야 합니다 (**Ollama**를 제외한 내장 프리셋). `init`은(는) 시작용 `provider` / `providers` 블록을 작성하지만, 활성 프리셋에 대한 자격 증명은 직접 제공해야 합니다.

config에서 **어떤 API 엔드포인트를 호출할지** 한 번 구성하면 모든 번역 명령어가 해당 설정과 동일한 SQLite 캐시를 공유합니다. 해당 제공자가 시도할 모델은 별개의 단계입니다: [AI 모델](/ko/guide/ai-models).

CLI는 최상위 `provider` 키(또는 하나만 구성된 경우 `providers`의 유일한 항목)에서 활성 공급자를 확인합니다. 각 공급자 블록은 정렬된 `translationModels` 대체 체인을 나열합니다. 내장된 사전 설정은 `baseUrl` 및 API 키 환경 변수를 자동으로 상속합니다(필요한 경우 공급자별로 재정의).

<a id="built-in-providers"></a>
### 내장 공급자

사전 설정 공급자 키는 `translationModels`만 필요합니다. 기본 URL 및 API 키 환경 변수는 자동으로 채워집니다.

<div class="provider-presets">

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

</div>

**사전 설정이 아닌** 키의 경우, 구성에서 `baseUrl` 및 `apiKeyEnv`을 명시적으로 설정합니다.

활성 공급자의 API 키를 환경 또는 `.env` 파일에 설정합니다. CLI는 셸에 이미 설정된 변수를 재정의하지 않고 작업 디렉터리에서 `.env`을 자동으로 로드합니다. [환경 변수](/ko/reference/environment-variables)를 참조하세요.

<a id="zero-data-retention-cheaper-inference"></a>
### 제로 데이터 보존(더 저렴한 추론)

`providers.cheaperinference.zeroDataRetention`은(는) 선택 사항이며 기본적으로 비활성화되어 있습니다. 이 프로젝트가 프롬프트를 보존하지 않는 공급자를 통해서만 전송해야 할 때 설정하십시오.

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

이 플래그가 활성화되면 모든 채팅 요청에 `"zdr": true`이(가) 포함되며, `list-models`, `check-models`, `suggest-models` (대시보드 모델 탭 포함)은(는) `GET /v1/models?zdr=true`을(를) 읽습니다. 해당 카탈로그에는 제로 데이터 보존 요청이 사용할 수 있는 모델이 제로 데이터 보존 가격으로 나열됩니다. `check-models`은(는) 해당 카탈로그에 없는 ID를 유효하지 않은 것으로 처리합니다. 이 플래그는 카탈로그에 없는 모델에 대한 경로를 생성하지 않습니다. 해당 ID를 `translationModels`, `uiModels` 또는 `localeModels`에서 제거하십시오.

Cheaper Inference 계정에서 제로 데이터 보존이 필요하지 않은 경우 이 플래그를 비활성화 상태로 두십시오. 계정에 [데이터 보호](https://platform.cheaperinference.com/dashboard/data-protection)가 이미 활성화되어 있는 경우에도 Cheaper Inference는 제로 데이터 보존 경로가 없는 모델을 거부합니다. 오류 메시지에 해당 모델의 이름이 표시됩니다. 계정 정책을 유지하려면 `zeroDataRetention`을(를) `true`(으)로 설정하고 제로 데이터 보존 카탈로그의 모델로 전환하십시오. 거부된 모델을 유지하려면 해당 페이지에서 제로 데이터 보존을 비활성화하십시오. 그러면 폴백 체인이 다음으로 구성된 모델을 시도합니다.

<a id="model-fallback-chain"></a>
<a id="models"></a>
### 모델

모델 선택, 대체 목록 및 `suggest-models`, `check-models`, `list-models`, `bench-models`는 [AI 모델](/ko/guide/ai-models) 페이지에 있습니다.

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

- [AI 모델](/ko/guide/ai-models) — 순위별 후보 목록, 대체 목록 및 모델 명령어.
- [구성 — `provider` 및 `providers`](/ko/reference/configuration#provider-and-providers) — 사전 설정 테이블, 사용자 지정 엔드포인트, 요청 시간 초과, 비용 요율, Cheaper Inference 제로 데이터 보존, OpenRouter 관련 동작.
- [아키텍처 — LLM 클라이언트](/ko/reference/architecture) — 모델 대체, 일괄 처리, 비용 보고의 내부 작동 방식.
- [환경 변수](/ko/reference/environment-variables) — API 키 환경 변수 및 기본 URL 재정의.
