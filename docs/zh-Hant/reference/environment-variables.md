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
| `APIKEYFAN_API_KEY` | `apikeyfan` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

當該提供者啟用時，此金鑰為必需。對於 `apikeyfan`，當 `APIKEYFAN_API_KEY` 未設定或為空時，舊版 `APIFUN_API_KEY` 會被接受。自訂的 `apiKeyEnv` 會停用此備用機制。預設網址：[內建提供者](/zh-Hant/guide/providers-and-models#built-in-providers)。

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

當未設定提供者 API 金鑰時，CLI 和 `doctor` 會從包含 `ai-i18n-tools.config.json` 的目錄中讀取 `.env` 和 `.env.local`。僅會複製上方表格中的變數 (加上自訂的 `providers.*.apiKeyEnv`)，且僅當該變數未設定時。當兩個檔案設定相同名稱時，`.env.local` 會優先。會發出警告，指出已讀取的檔案和變數。`doctor` 會在「環境」區段中針對每個檔案重複一個警告，並在摘要中計算每個警告。該警告會以 0 結束，除非設定了 `--strict`，此時會以 1 結束。錯誤會以 2 結束。如果任何提供者 API 金鑰已經有值，則兩個檔案都不會被讀取。
