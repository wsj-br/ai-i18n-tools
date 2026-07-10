<a id="environment-variables"></a>
# 환경 변수

| 변수               | 설명                                                       |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` 제공자의 API 키(해당 제공자가 활성일 때 필요). |
| 다른 제공자 키    | 각 제공자는 자체 키 환경 변수를 읽습니다: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY`(Ollama는 필요 없음). `providers.<name>.apiKeyEnv`로 제공자별로 재정의합니다. |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl`(해당 제공자가 구성된 경우에만)를 재정의합니다. |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl`(해당 제공자가 구성된 경우에만)를 재정의합니다. |
| `AI_I18N_LANG`         | 도구 자체 UI(CLI 도움말, 로그, 대시보드)의 언어입니다. `-L` / `--ui-lang`에 의해 재정의되며, 설정 `uiLanguage`을 재정의합니다. [도구 UI 언어](/ko/guide/tool-ui-language)를 참조하세요. |
| `I18N_SOURCE_LOCALE`    | 런타임에 `sourceLocale`을 재정의합니다.                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`을 재정의할 쉼표로 구분된 로케일 코드입니다.  |
| `I18N_LOG_LEVEL` | 로거 레벨(`debug`, `info`, `warn`, `error`). 알 수 없는 값(`silent` 포함)은 `info`으로 대체됩니다. |
| `NO_COLOR`              | `1`인 경우 로그 출력에서 ANSI 색상을 비활성화합니다.              |
| `I18N_LOG_SESSION_MAX`  | 로그 세션당 유지되는 최대 줄 수(기본값 `5000`).           |

시작 시 CLI는 현재 작업 디렉토리에서 `.env` 파일을 자동으로 로드합니다(Node의 `process.loadEnvFile` 사용). 따라서 provider API 키는 `.envrc` / `direnv`을 소싱하지 않는 비대화형 셸에서 가져올 수 있습니다. 환경에 이미 존재하는 변수는 재정의되지 않으므로 실제 CI/프로덕션 값이 우선합니다.
