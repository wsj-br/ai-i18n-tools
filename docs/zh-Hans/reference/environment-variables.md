<a id="environment-variables"></a>
# 环境变量

| 变量               | 描述                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` 提供商的 API 密钥（在激活时需要）。 |
| 其他提供商密钥    | 每个提供商读取自己的密钥环境变量：`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY`（Ollama 不需要）。使用 `providers.<name>.apiKeyEnv` 为每个提供商覆盖。 |
| `OPENROUTER_BASE_URL`  | 覆盖 `providers.openrouter.baseUrl`（仅当该提供商已配置时）。 |
| `OLLAMA_BASE_URL`      | 覆盖 `providers.ollama.baseUrl`（仅当该提供商已配置时）。 |
| `AI_I18N_LANG`         | 工具自身 UI 的语言（CLI 帮助、日志、仪表板）。被 `-L` / `--ui-lang` 覆盖；覆盖配置 `uiLanguage`。请参阅 [工具 UI 语言](#tool-ui-language)。 |
| `I18N_SOURCE_LOCALE`   | 在运行时覆盖 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`  | 以逗号分隔的语言代码，用于覆盖 `targetLocales`。  |
| `I18N_LOG_LEVEL` | 记录器级别 (`debug`、`info`、`warn`、`error`)。未知值（包括 `silent`）将回退到 `info`。 |
| `NO_COLOR`             | 当 `1` 时，禁用日志输出中的 ANSI 颜色。              |
| `I18N_LOG_SESSION_MAX` | 每个日志会话保留的最大行数（默认 `5000`）。           |

启动时，CLI 还会从当前工作目录自动加载 `.env` 文件（通过 Node 的 `process.loadEnvFile`），以便在不加载 `.envrc` / `direnv` 的非交互式 shell 中获取提供商 API 密钥。环境中已存在的变量永远不会被覆盖，因此真实的 CI/生产值仍然有效。

<a id="tool-ui-language"></a>
## 工具界面语言

该工具独立于您的项目 `sourceLocale` / `targetLocales` 来本地化其自身的 UI——CLI 帮助文本、高流量日志/摘要/错误消息以及翻译仪表板。UI 区域设置从以下来源解析，优先级最高：

1. `-L` / `--ui-lang <code>` 全局标志（例如 `-L pt-BR`）。
2. `AI_I18N_LANG` 环境变量（例如 `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` 中的 `uiLanguage` 配置键（BCP-47 字符串）。
4. 主机操作系统区域设置（通过 `Intl.DateTimeFormat().resolvedOptions().locale`）。

请求的区域设置会与提供的 UI 语言进行精确匹配或按最接近的变体匹配（例如，`pt-PT` 解析为 `pt-BR`，`en-US` 解析为 `en-GB`）；当没有任何匹配项时，它会回退到源区域设置（`en-GB`）。当显式请求 UI 语言（通过标志、环境变量或 `uiLanguage`）但没有匹配的已提供程序集时，CLI 会发出一次性警告，告知将使用默认区域设置；仅从主机操作系统推断出的区域设置永远不会发出警告。

提供的 UI 语言：`en-GB`（源）以及 `de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans` 和 `zh-Hant`。翻译仪表板会读取解析出的区域设置、布局方向和翻译程序集（来自 `GET /api/ui-i18n`），并在加载时应用它们（它会设置 `<html lang>` / `dir` 并通过 `data-i18n*` 属性本地化静态标记）。此功能不需要任何配置——默认情况下，该工具会遵循您的操作系统区域设置。
