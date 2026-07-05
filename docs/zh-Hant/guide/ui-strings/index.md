<a id="ui-strings"></a>
# UI 字串

專為任何使用 i18next 的 JS/TS 專案設計：React 應用程式、Next.js（用戶端和伺服器元件）、Node.js 服務、CLI 工具。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

| 您的應用程式 | 接下來閱讀 |
| --- | --- |
| React / Next.js / Node + i18next | [連接 i18next](/guide/ui-strings/i18next-runtime) (步驟 4) |
| 純 HTML (標記中沒有 `t()`) | [純 HTML 應用程式](/guide/ui-strings/plain-html) |
| Astro 行銷網站 (混合) | [Astro 網站](/guide/ui-strings/astro-website) |
| `t()` 規則、插值、複數 | [t() 呼叫與複數](/guide/ui-strings/t-calls-and-plurals) |
| 語言選擇器 / RTL | [語言切換器與 RTL](/guide/ui-strings/language-switcher) |
| 執行時 API 簽章 | [執行時輔助函數](/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## 步驟 1：初始化

```bash
npx ai-i18n-tools init
```

這會寫入使用 `ui-markdown` 範本的 `ai-i18n-tools.config.json`。編輯它以設定：

- `sourceLocale` - 您的來源語言 BCP-47 代碼（例如 `"en-GB"`）。**必須**與您運行時 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）中匯出的 `SOURCE_LOCALE` 相符。
- `targetLocales` - 您的目標語言的 BCP-47 代碼陣列（例如 `["de", "fr", "pt-BR"]`）。執行 `generate-ui-languages` 以從此清單建立 `ui-languages.json` manifest。
- `ui.sourceRoots` - 要掃描 `t("…")` 呼叫的目錄或 glob 模式（例如 `["src/"]`、`["src/**/*.ts"]`）。
- `ui.stringsJson` - 要寫入主目錄的位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 要寫入 `de.json`、`pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `ui.preferredModel`（選用）- 嘗試**首先**用於 `translate-ui` 的模型 ID；失敗時，CLI 會依序繼續使用作用中提供者的 `translationModels`，並略過重複項。

<a id="step-2-extract-strings"></a>
## 步驟 2：提取字串

```bash
npx ai-i18n-tools extract
```

掃描 `ui.sourceRoots` 下的所有 JS/TS 檔案，尋找 `t("literal")` 和 `i18n.t("literal")` 呼叫。寫入（或合併到）`ui.stringsJson`。

掃描器可配置：透過 `ui.uiExtractor.funcNames` (或舊版 `ui.reactExtractor.funcNames`) 新增自訂函數名稱。對於 Astro 頁面和元件，將 `.astro` 新增至 `ui.uiExtractor.extensions`。對於純 HTML，請參閱[純 HTML 應用程式](/guide/ui-strings/plain-html)。

<a id="step-3-translate-ui-strings"></a>
## 步驟 3：翻譯 UI 字串

```bash
npx ai-i18n-tools translate-ui
```

讀取 `strings.json`，將批次傳送給每個目標地區的活躍 LLM 提供者，將扁平化的 JSON 檔案（`de.json`、`fr.json` 等）寫入 `ui.flatOutputDir`。當設定了 `ui.preferredModel` 時，會先嘗試該模型，然後再嘗試活躍提供者的 `translationModels` 清單（文件翻譯和其他命令僅使用提供者的清單）。

對於每個條目，`translate-ui` 會儲存來自作用中提供者的 **模型 ID**，該提供者已成功翻譯選用 `models` 物件中的每個地區設定 (與 `translated` 具有相同的地區設定金鑰)。在翻譯儀表板中編輯的字串，會以該地區設定的 `models` 中的標記值 `user-edited` 標記。`ui.flatOutputDir` 下的每個地區設定平面檔案仍僅包含 **來源字串 → 翻譯**；它們不包含 `models` (因此執行階段套件保持不變)。

> **注意：** 儀表板對 UI 字串的編輯儲存在 `strings.json` 中，而不是 SQLite 文件快取中。執行純 `sync` 或 `translate-ui`（無特殊標誌）以從目錄重寫平面語言環境檔案 — `--force-update` **不會**轉發到 UI 步驟。手動編輯後避免在 UI 命令上使用 `--force`：它會重新翻譯每個條目並可能覆蓋您的 `user-edited` 行。

然後在執行時連接 i18next — [連接 i18next](/guide/ui-strings/i18next-runtime)。

<a id="exporting-to-xliff-20-optional"></a>
## 匯出為 XLIFF 2.0 (可選)

若要將 UI 字串交給翻譯供應商、TMS 或 CAT 工具，請將目錄匯出為 **XLIFF 2.0**（每個目標地區一個檔案）。此命令是 **唯讀**的：它不會修改 `strings.json` 或呼叫任何 API。

```bash
npx ai-i18n-tools export-ui-xliff
```

預設情況下，檔案會寫在 `ui.stringsJson` 旁邊，命名方式類似 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目錄的基底名稱 + 地區 + `.xliff`）。使用 `-o` / `--output-dir` 寫入其他位置。來自 `strings.json` 的現有翻譯會出現在 `<target>` 中；遺漏的地區會使用 `state="initial"`，沒有 `<target>`，以便工具可以填入。使用 `--untranslated-only` 只匯出每個地區仍需要翻譯的單位（對供應商批次很有用）。`--dry-run` 會列印路徑而不寫入檔案。
