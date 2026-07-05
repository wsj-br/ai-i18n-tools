<a id="llm-providers-and-models"></a>
# LLM 공급자 및 모델

모든 번역 파이프라인(`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`)은 동일한 공급자 독립적인 클라이언트를 통해 LLM으로 텍스트를 보냅니다. **호출할 API 엔드포인트**와 **시도할 모델**을 `ai-i18n-tools.config.json`에서 한 번 구성하면 모든 명령이 해당 설정과 동일한 SQLite 캐시를 공유합니다.

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
| `ollama` | `http://localhost:11434/v1` | (없음) |

**사전 설정이 아닌** 키의 경우, 구성에서 `baseUrl` 및 `apiKeyEnv`을 명시적으로 설정합니다.

활성 공급자의 API 키를 환경 또는 `.env` 파일에 설정합니다. CLI는 셸에 이미 설정된 변수를 재정의하지 않고 작업 디렉터리에서 `.env`을 자동으로 로드합니다. [환경 변수](/reference/environment-variables)를 참조하세요.

<a id="model-fallback-chain"></a>
### 모델 대체 체인

`translationModels`은 단일 선택이 아닌 **정렬된 목록**입니다. CLI는 첫 번째 모델을 시도하고, 요청 또는 구문 분석 실패 시 다음 항목으로 이동합니다. 일시적인 중단이나 특정 로케일에서 어려움을 겪는 모델이 전체 실행을 차단하지 않도록 여러 모델을 구성하세요.

`translate-ui`에 대해서만 선택적 `ui.preferredModel`이 공급자의 `translationModels` 목록 **전에** 시도됩니다(중복 제거됨).

다양한 공급자와 모델은 언어에 따라 비용, 속도, 품질이 다릅니다. `npx ai-i18n-tools init`의 기본 목록을 시작점으로 삼고, 로케일에서 지속적으로 좋지 않은 결과가 나올 경우 확장하세요. 전체 기본값 및 근거: [구성 — `provider` 및 `providers`](/reference/configuration#provider-and-providers).

최소 구성 예시 (OpenRouter):

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3-235b-a22b-2507",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-v4-flash"
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

`check-models`은 공급자의 `GET /models` 엔드포인트를 호출하고, 누락되거나 `expiration_date`를 초과한 ID를 보고하며, 구성된 ID가 유효하지 않은 경우 0이 아닌 값으로 종료됩니다. 공급자가 가격을 반환하는 경우(OpenRouter는 반환함), 100만 토큰당 예상 USD도 표시합니다.

공급자가 광고하는 전체 카탈로그를 탐색합니다.

```bash
npx ai-i18n-tools list-models
```

실제 번역 샘플에서 구성된 모델을 벤치마킹합니다. 각 모델은 독립적으로 실행되므로 실제 시간, 토큰 사용량 및 비용을 비교할 수 있습니다.

```bash
npx ai-i18n-tools bench-models
```

샘플 텍스트, 로케일 또는 모델 목록을 재정의합니다.

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --models openai/gpt-4o-mini,anthropic/claude-3-haiku
```

명령 세부 정보: [CLI 참조](/reference/cli-commands).

<a id="multiple-providers"></a>
### 여러 공급자

둘 이상의 공급자가 구성된 경우, 최상위 `provider` 키를 설정하여 기본값을 선택합니다. 구성을 편집하지 않고 실행별로 전환합니다.

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

각 공급자 블록은 자체 `translationModels`, `maxTokens`, `temperature` 및 `requestTimeoutMs`를 정의할 수 있습니다. 레거시 최상위 `openrouter` 블록은 여전히 허용되며 로드 시 `providers.openrouter`로 자동 마이그레이션됩니다.

동일한 문서에 4개의 공급자가 있는 실행 가능한 예시: [`examples/multi-provider`](/examples#multi-provider).

<a id="further-reference"></a>
### 추가 참조

- [구성 — `provider` 및 `providers`](/reference/configuration#provider-and-providers) — 사전 설정 테이블, 사용자 지정 엔드포인트, 요청 시간 초과, OpenRouter 관련 동작.
- [아키텍처 — LLM 클라이언트](/reference/architecture) — 모델 대체, 배치 및 비용 보고가 내부적으로 작동하는 방식.
- [환경 변수](/reference/environment-variables) — API 키 환경 변수 및 기본 URL 재정의.
