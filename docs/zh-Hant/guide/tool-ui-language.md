<a id="tool-ui-language"></a>
# 工具介面語言

`ai-i18n-tools` 會獨立於您專案的 `sourceLocale` / `targetLocales`，對其自身的使用者介面進行在地化 —— 包含 CLI 說明文字、高頻率的日誌/摘要/錯誤訊息，以及翻譯儀表板。無需任何設定：預設情況下，此工具會遵循您作業系統的地區設定。

<a id="locale-resolution"></a>
## 語言環境解析

UI 語言環境會從以下來源解析，按優先級由高至低排列：

1. `-L` / `--ui-lang <code>` 全域旗標（例如 `-L pt-BR`）。
2. `AI_I18N_LANG` 環境變數（例如 `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` 中的 `uiLanguage` 設定鍵（BCP-47 字串）。
4. 主機作業系統地區設定（透過 `Intl.DateTimeFormat().resolvedOptions().locale`）。

<a id="matching-and-fallback"></a>
## 比對與後備

所要求的地區設定會與提供的使用者介面語言進行精確匹配或透過最接近的變體進行匹配（例如 `pt-PT` 解析為 `pt-BR`，而 `en-US` 解析為 `en-GB`）；當沒有匹配項時，它會回退到來源地區設定（`en-GB`）。當明確要求使用者介面語言（透過標誌、環境變數或 `uiLanguage`）但沒有已提供的套件匹配時，CLI 會發出一次性警告，表示將使用預設地區設定；僅從主機 OS 推斷出的地區設定永遠不會發出警告。

<a id="shipped-ui-languages"></a>
## 內建介面語言

英文（英國，來源）、德文、西班牙文、法文、印地文（拉丁字母）、日文、韓文、葡萄牙文（巴西）、簡體中文、繁體中文。

<a id="translation-dashboard"></a>
## 翻譯儀表板

翻譯儀表板會從 `GET /api/ui-i18n` 讀取已解析的語言環境、版面方向和翻譯套件，並在載入時套用（它會設定 `<html lang>` / `dir`，並透過 `data-i18n*` 屬性來本地化靜態標記）。

<a id="related"></a>
## 相關內容

- [`AI_I18N_LANG`](/zh-Hant/reference/environment-variables) — 環境變數覆寫
- [`uiLanguage`](/zh-Hant/reference/configuration#uilanguage-optional) — 設定鍵覆寫
- [`-L` / `--ui-lang`](/zh-Hant/reference/cli-commands/) — CLI 旗標覆寫（最高優先級）
