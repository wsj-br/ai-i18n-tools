<a id="environment-variables"></a>
# 環境變數

| 變數               | 說明                                                 |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` 提供者的 API 金鑰（在啟用時需要）。 |
| 其他提供者金鑰    | 每個提供者讀取其自己的金鑰環境變數：`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama 不需要)。可透過 `providers.<name>.apiKeyEnv` 為每個提供者覆寫。 |
| `OPENROUTER_BASE_URL`  | 覆寫 `providers.openrouter.baseUrl`（僅當該提供者已設定時）。 |
| `OLLAMA_BASE_URL`      | 覆寫 `providers.ollama.baseUrl`（僅當該提供者已設定時）。 |
| `AI_I18N_LANG`         | 工具本身使用者介面的語言（CLI 說明、日誌、儀表板）。被 `-L` / `--ui-lang` 覆寫；覆寫設定 `uiLanguage`。請參閱 [工具使用者介面語言](#tool-ui-language)。 |
| `I18N_SOURCE_LOCALE`   | 在執行階段覆寫 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`  | 以逗號分隔的地區設定代碼，用於覆寫 `targetLocales`。  |
| `I18N_LOG_LEVEL`       | 記錄器層級 (`debug`、`info`、`warn`、`error`)。未知值 (包括 `silent`) 會回復為 `info`。 |
| `NO_COLOR`             | 當 `1` 時，停用日誌輸出中的 ANSI 顏色。              |
| `I18N_LOG_SESSION_MAX` | 每個日誌會話保留的最大行數（預設值 `5000`）。           |

啟動時，CLI 也會從目前工作目錄自動載入 `.env` 檔案（透過 Node 的 `process.loadEnvFile`），因此在未載入 `.envrc` / `direnv` 的非互動式 shell 中會讀取提供者 API 金鑰。環境中已存在的變數永遠不會被覆寫，因此實際的 CI/生產環境值仍然會生效。

<a id="tool-ui-language"></a>
## 工具使用者介面語言

該工具獨立於您專案的 `sourceLocale` / `targetLocales`，本地化其本身的使用者介面 — CLI 說明文字、高流量日誌/摘要/錯誤訊息以及翻譯儀表板。使用者介面地區設定從以下來源解析，優先級最高：

1. `-L` / `--ui-lang <code>` 全域旗標（例如 `-L pt-BR`）。
2. `AI_I18N_LANG` 環境變數（例如 `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` 中的 `uiLanguage` 設定鍵（BCP-47 字串）。
4. 主機作業系統地區設定（透過 `Intl.DateTimeFormat().resolvedOptions().locale`）。

所要求的地區設定會與提供的使用者介面語言進行精確匹配或透過最接近的變體進行匹配（例如 `pt-PT` 解析為 `pt-BR`，而 `en-US` 解析為 `en-GB`）；當沒有匹配項時，它會回退到來源地區設定（`en-GB`）。當明確要求使用者介面語言（透過標誌、環境變數或 `uiLanguage`）但沒有已提供的套件匹配時，CLI 會發出一次性警告，表示將使用預設地區設定；僅從主機 OS 推斷出的地區設定永遠不會發出警告。

提供的使用者介面語言：`en-GB`（來源）加上 `de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans` 和 `zh-Hant`。翻譯儀表板會讀取解析後的地區設定、佈局方向和翻譯套件（來自 `GET /api/ui-i18n`）並在載入時套用它們（它會設定 `<html lang>` / `dir` 並透過 `data-i18n*` 屬性本地化靜態標記）。此功能不需要任何設定 — 預設情況下，該工具會遵循您的 OS 地區設定。
