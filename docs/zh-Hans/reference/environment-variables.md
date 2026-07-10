<a id="environment-variables"></a>
# 环境变量

| 变量               | 描述                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` 提供商的 API 密钥（在激活时需要）。 |
| 其他提供商密钥    | 每个提供商读取自己的密钥环境变量：`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY`（Ollama 不需要）。使用 `providers.<name>.apiKeyEnv` 为每个提供商覆盖。 |
| `OPENROUTER_BASE_URL`  | 覆盖 `providers.openrouter.baseUrl`（仅当该提供商已配置时）。 |
| `OLLAMA_BASE_URL`      | 覆盖 `providers.ollama.baseUrl`（仅当该提供商已配置时）。 |
| `AI_I18N_LANG`         | 工具自身 UI（CLI 帮助、日志、仪表板）的语言。被 `-L` / `--ui-lang` 覆盖；覆盖配置 `uiLanguage`。请参阅[工具 UI 语言](/guide/tool-ui-language)。 |
| `I18N_SOURCE_LOCALE`   | 在运行时覆盖 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`  | 以逗号分隔的语言代码，用于覆盖 `targetLocales`。  |
| `I18N_LOG_LEVEL` | 记录器级别 (`debug`、`info`、`warn`、`error`)。未知值（包括 `silent`）将回退到 `info`。 |
| `NO_COLOR`             | 当 `1` 时，禁用日志输出中的 ANSI 颜色。              |
| `I18N_LOG_SESSION_MAX` | 每个日志会话保留的最大行数（默认 `5000`）。           |

启动时，CLI 还会从当前工作目录自动加载 `.env` 文件（通过 Node 的 `process.loadEnvFile`），以便在不加载 `.envrc` / `direnv` 的非交互式 shell 中获取提供商 API 密钥。环境中已存在的变量永远不会被覆盖，因此真实的 CI/生产值仍然有效。
