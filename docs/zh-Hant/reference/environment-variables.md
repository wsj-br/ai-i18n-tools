<a id="environment-variables"></a>
# 環境變數

<a id="provider-api-keys"></a>
## 提供者 API 金鑰

`init -P <provider>` 會選取該內建預設，以及下表中的 API 金鑰。針對其中一個提供者，請使用 `providers.<name>.apiKeyEnv` 覆寫變數名稱。Ollama 沒有 API 金鑰。

| 變數 | 提供者 |
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

當該提供者處於啟用狀態時，必須提供此金鑰。預設 URL：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。

<a id="provider-base-urls"></a>
## 提供者基礎 URL

這兩個變數會覆寫已設定提供者的 `baseUrl`。所有其他預設設定皆透過設定檔 (`providers.<name>.baseUrl`) 變更其 URL，而非透過環境變數。

| 變數 | 覆寫對象 |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (僅在已設定該提供者時) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (僅在已設定該提供者時) |

<a id="tool-and-run"></a>
## 工具與執行

| 變數 | 說明 |
| --- | --- |
| `AI_I18N_LANG` | 工具本身使用者介面（CLI 說明、記錄檔、儀表板）的語言。會被 `-L` / `--ui-lang` 覆寫；並會覆寫設定檔中的 `uiLanguage`。請參閱 [工具使用者介面語言](/zh-Hant/guide/tool-ui-language)。 |
| `I18N_SOURCE_LOCALE`   | 在執行階段覆寫 `sourceLocale`。                        |
| `I18N_TARGET_LOCALES`  | 以逗號分隔的地區設定代碼，用於覆寫 `targetLocales`。  |
| `I18N_LOG_LEVEL`       | 記錄器層級 (`debug`、`info`、`warn`、`error`)。未知值 (包括 `silent`) 會回復為 `info`。 |
| `NO_COLOR`             | 當 `1` 時，停用日誌輸出中的 ANSI 顏色。              |
| `I18N_LOG_SESSION_MAX` | 每個日誌會話保留的最大行數（預設值 `5000`）。           |

啟動時，CLI 也會從目前工作目錄自動載入 `.env` 檔案（透過 Node 的 `process.loadEnvFile`），因此在未載入 `.envrc` / `direnv` 的非互動式 shell 中會讀取提供者 API 金鑰。環境中已存在的變數永遠不會被覆寫，因此實際的 CI/生產環境值仍然會生效。
