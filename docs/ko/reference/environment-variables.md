<a id="environment-variables"></a>
# 환경 변수

| 변수               | 설명                                                       |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` 제공자의 API 키(해당 제공자가 활성일 때 필요). |
| 다른 제공자 키    | 각 제공자는 자체 키 환경 변수를 읽습니다: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY`(Ollama는 필요 없음). `providers.<name>.apiKeyEnv`로 제공자별로 재정의합니다. |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl`(해당 제공자가 구성된 경우에만)를 재정의합니다. |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl`(해당 제공자가 구성된 경우에만)를 재정의합니다. |
| `AI_I18N_LANG`         | 도구 자체 UI(CLI 도움말, 로그, 대시보드) 언어입니다. `-L` / `--ui-lang`에 의해 재정의되며, 구성 `uiLanguage`을 재정의합니다. [도구 UI 언어](#tool-ui-language)를 참조하세요. |
| `I18N_SOURCE_LOCALE`    | 런타임에 `sourceLocale`을 재정의합니다.                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`을 재정의할 쉼표로 구분된 로케일 코드입니다.  |
| `I18N_LOG_LEVEL` | 로거 레벨(`debug`, `info`, `warn`, `error`). 알 수 없는 값(`silent` 포함)은 `info`으로 대체됩니다. |
| `NO_COLOR`              | `1`인 경우 로그 출력에서 ANSI 색상을 비활성화합니다.              |
| `I18N_LOG_SESSION_MAX`  | 로그 세션당 유지되는 최대 줄 수(기본값 `5000`).           |

시작 시 CLI는 현재 작업 디렉토리에서 `.env` 파일을 자동으로 로드합니다(Node의 `process.loadEnvFile` 사용). 따라서 provider API 키는 `.envrc` / `direnv`을 소싱하지 않는 비대화형 셸에서 가져올 수 있습니다. 환경에 이미 존재하는 변수는 재정의되지 않으므로 실제 CI/프로덕션 값이 우선합니다.

<a id="tool-ui-language"></a>
## 도구 UI 언어

도구는 프로젝트의 `sourceLocale` / `targetLocales`와 독립적으로 자체 사용자 인터페이스(CLI 도움말 텍스트, 트래픽이 많은 로그/요약/오류 메시지, 번역 대시보드)를 현지화합니다. UI 로케일은 다음 소스에서 우선순위가 높은 순서대로 확인됩니다.

1. `-L` / `--ui-lang <code>` 전역 플래그(예: `-L pt-BR`).
2. `AI_I18N_LANG` 환경 변수(예: `export AI_I18N_LANG=es`).
3. `ai-i18n-tools.config.json`의 `uiLanguage` 구성 키(BCP-47 문자열).
4. 호스트 OS 로캘(`Intl.DateTimeFormat().resolvedOptions().locale` 경유).

요청된 로케일은 배포된 UI 언어와 정확하게 일치하거나 가장 가까운 변형과 일치합니다(예: `pt-PT`은 `pt-BR`로, `en-US`는 `en-GB`으로 확인됨). 일치하는 항목이 없으면 소스 로케일(`en-GB`)로 대체됩니다. 플래그, 환경 변수 또는 `uiLanguage`를 통해 명시적으로 UI 언어가 요청되었지만 배포된 번들이 일치하지 않으면 CLI는 기본 로케일이 사용될 것이라는 경고를 한 번 표시합니다. 호스트 OS에서만 추론된 로케일은 경고하지 않습니다.

배포된 UI 언어: `en-GB`(소스) 및 `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, `zh-Hant`. 번역 대시보드는 확인된 로케일, 레이아웃 방향 및 번역 번들을 `GET /api/ui-i18n`에서 읽어 로드 시 적용합니다(`<html lang>` / `dir`를 설정하고 `data-i18n*` 속성을 통해 정적 마크업을 현지화함). 이 기능은 구성이 필요하지 않습니다. 기본적으로 도구는 OS 로케일을 따릅니다.
