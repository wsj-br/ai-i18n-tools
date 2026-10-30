<a id="environment-variables"></a>
# 环境变量

<a id="provider-api-keys"></a>
## 提供商 API 密钥

`init -P <provider>` 选择下表中的该内置预设和 API 密钥。使用 `providers.<name>.apiKeyEnv` 覆盖一个提供商的变量名。Ollama 没有 API 密钥。

| 变量 | 提供商 |
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

当该提供商处于活动状态时，必须提供此密钥。预设 URL：[内置提供商](/zh-Hans/guide/providers-and-models#built-in-providers)。

<a id="provider-base-urls"></a>
## 提供商基础 URL

这两个变量会覆盖已配置提供商的 `baseUrl`。所有其他预设均在配置 (`providers.<name>.baseUrl`) 中更改其 URL，而非通过环境变量。

| 变量 | 覆盖对象 |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl`（仅当配置了该提供商时） |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl`（仅当配置了该提供商时） |

<a id="tool-and-run"></a>
## 工具与运行

| 变量 | 描述 |
| --- | --- |
| `AI_I18N_LANG` | 工具自身界面（CLI 帮助、日志、仪表板）的语言。会被 `-L` / `--ui-lang` 覆盖；并会覆盖配置 `uiLanguage`。请参阅 [工具 UI 语言](/zh-Hans/guide/tool-ui-language)。 |
| `I18N_SOURCE_LOCALE`   | 在运行时覆盖 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`  | 以逗号分隔的语言代码，用于覆盖 `targetLocales`。  |
| `I18N_LOG_LEVEL` | 记录器级别 (`debug`、`info`、`warn`、`error`)。未知值（包括 `silent`）将回退到 `info`。 |
| `NO_COLOR`             | 当 `1` 时，禁用日志输出中的 ANSI 颜色。              |
| `I18N_LOG_SESSION_MAX` | 每个日志会话保留的最大行数（默认 `5000`）。           |

启动时，CLI 还会从当前工作目录自动加载一个 `.env` 文件（通过 Node 的 `process.loadEnvFile`），这样提供商 API 密钥就会在不通过 `direnv` 加载 `.envrc` 的非交互式 shell 中被加载。环境中已存在的变量永远不会被覆盖，因此真实的 CI/生产值具有优先权。
