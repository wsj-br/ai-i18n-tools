<a id="environment-variables"></a>
# 환경 변수

<a id="provider-api-keys"></a>
## 공급자 API 키

`init -P <provider>`는 아래 표에서 해당 내장 프리셋과 API 키를 선택합니다. 한 공급자의 변수 이름을 `providers.<name>.apiKeyEnv`로 재정의합니다. Ollama는 API 키가 없습니다.

| 변수 | 공급자 |
| --- | --- |
| `OPENROUTER_API_KEY` | `openrouter` |
| `OPENAI_API_KEY` | `openai` |
| `ANTHROPIC_API_KEY` | `anthropic` |
| `GOOGLE_API_KEY` | `gemini` |
| `DEEPSEEK_API_KEY` | `deepseek` |
| `CEREBRAS_API_KEY` | `cerebras` |
| `GROQ_API_KEY` | `groq` |
| `MISTRAL_API_KEY` | `mistral` |
| `XAI_API_KEY` | `xai` |
| `NVIDIA_API_KEY` | `nvidia` |
| `ALIBABA_API_KEY` | `alibaba` |
| `APIFUN_API_KEY` | `apifun` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

해당 공급자가 활성화된 경우 키가 필요합니다. 사전 설정 URL: [내장 공급자](/ko/guide/providers-and-models#built-in-providers).

<a id="provider-base-urls"></a>
## 공급자 기본 URL

이 두 변수는 구성된 공급자에 대해 `baseUrl`을(를) 재정의합니다. 다른 모든 사전 설정은 환경 변수가 아닌 구성(`providers.<name>.baseUrl`)을 통해 URL을 변경합니다.

| 변수 | 재정의 대상 |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (해당 공급자가 구성된 경우에만) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (해당 공급자가 구성된 경우에만) |

<a id="tool-and-run"></a>
## 도구 및 실행

| 변수 | 설명 |
| --- | --- |
| `AI_I18N_LANG` | 도구 자체 UI(CLI 도움말, 로그, 대시보드)에 대한 언어입니다. `-L` / `--ui-lang`에 의해 재정의되며, 구성 `uiLanguage`을(를) 재정의합니다. [도구 UI 언어](/ko/guide/tool-ui-language)를 참조하세요. |
| `I18N_SOURCE_LOCALE`    | 런타임에 `sourceLocale`을 재정의합니다.                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`을 재정의할 쉼표로 구분된 로케일 코드입니다.  |
| `I18N_LOG_LEVEL` | 로거 레벨(`debug`, `info`, `warn`, `error`). 알 수 없는 값(`silent` 포함)은 `info`으로 대체됩니다. |
| `NO_COLOR`              | `1`인 경우 로그 출력에서 ANSI 색상을 비활성화합니다.              |
| `I18N_LOG_SESSION_MAX`  | 로그 세션당 유지되는 최대 줄 수(기본값 `5000`).           |

시작 시 CLI는 현재 작업 디렉토리에서 `.env` 파일을 자동으로 로드합니다(Node의 `process.loadEnvFile` 사용). 따라서 provider API 키는 `.envrc` / `direnv`을 소싱하지 않는 비대화형 셸에서 가져올 수 있습니다. 환경에 이미 존재하는 변수는 재정의되지 않으므로 실제 CI/프로덕션 값이 우선합니다.
