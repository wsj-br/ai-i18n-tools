<a id="environment-variables"></a>
# 環境變數

| 變數               | 說明                                                 |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` 提供者的 API 金鑰（在啟用時需要）。 |
| 其他提供者金鑰    | 每個提供者讀取其自己的金鑰環境變數：`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollama 不需要)。可透過 `providers.<name>.apiKeyEnv` 為每個提供者覆寫。 |
| `OPENROUTER_BASE_URL`  | 覆寫 `providers.openrouter.baseUrl`（僅當該提供者已設定時）。 |
| `OLLAMA_BASE_URL`      | 覆寫 `providers.ollama.baseUrl`（僅當該提供者已設定時）。 |
| `AI_I18N_LANG`         | 工具自身介面（CLI 說明、日誌、儀表板）的語言。由 `-L` / `--ui-lang` 覆寫；覆寫設定 `uiLanguage`。請參閱[工具介面語言](/guide/tool-ui-language)。 |
| `I18N_SOURCE_LOCALE`   | 在執行階段覆寫 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`  | 以逗號分隔的地區設定代碼，用於覆寫 `targetLocales`。  |
| `I18N_LOG_LEVEL`       | 記錄器層級 (`debug`、`info`、`warn`、`error`)。未知值 (包括 `silent`) 會回復為 `info`。 |
| `NO_COLOR`             | 當 `1` 時，停用日誌輸出中的 ANSI 顏色。              |
| `I18N_LOG_SESSION_MAX` | 每個日誌會話保留的最大行數（預設值 `5000`）。           |

啟動時，CLI 也會從目前工作目錄自動載入 `.env` 檔案（透過 Node 的 `process.loadEnvFile`），因此在未載入 `.envrc` / `direnv` 的非互動式 shell 中會讀取提供者 API 金鑰。環境中已存在的變數永遠不會被覆寫，因此實際的 CI/生產環境值仍然會生效。
