<a id="ui-strings"></a>
# UI 字串

專為任何使用 i18next 的 JS/TS 專案而設計：React 應用程式、Next.js（客戶端與伺服器元件）、Node.js 服務、純 HTML、Astro 網站與 CLI 工具。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

| 您的應用程式 | 接下來閱讀 |
| --- | --- |
| React / Next.js / Node + i18next | [連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime) (步驟 4) |
| 純 HTML (標記中沒有 `t()`) | [純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html) |
| Astro 行銷網站 (混合) | [Astro 網站](/zh-Hant/guide/ui-strings/astro-website) |
| `t()` 規則、插值、複數 | [t() 呼叫與複數](/zh-Hant/guide/ui-strings/t-calls-and-plurals) |
| 語言選擇器 / RTL | [語言切換器與 RTL](/zh-Hant/guide/ui-strings/language-switcher) |
| 執行時 API 簽章 | [執行時輔助函數](/zh-Hant/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## 步驟 1：初始化

```bash
ai-i18n-tools init [-P <provider>]
```

這會使用 `ui-markdown` 模板寫入 `ai-i18n-tools.config.json`（包含預設的 `provider` / `providers` 區塊）。在執行 `translate-ui` 或 `sync` 之前，請在環境變數或 `.env` 中設定您目前使用的供應商 API 金鑰 — Ollama 除外；請參閱[供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。編輯設定檔以設定：

- `provider` 與 `providers` — 至少一個具有 `translationModels` 的供應商；如果預設值不是您的選擇，請變更預設集或模型列表 (`init -P <provider>`)。請參閱 [LLM 供應商與模型](/zh-Hant/guide/providers-and-models)。
- `sourceLocale` - 您的來源語言 BCP-47 代碼（例如 `"en-GB"`）。**必須符合** 從您的執行階段 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）匯出的 `SOURCE_LOCALE`。
- `targetLocales` - 您目標語言的 BCP-47 代碼陣列（例如 `["de", "fr", "pt-BR"]`）。執行 `generate-ui-languages` 以從此列表建立 `ui-languages.json` 資訊清單。
- `ui.sourceRoots` - 要掃描 `t("…")` 呼叫的目錄或 glob 模式（例如 `["src/"]`, `["src/**/*.ts"]`）。
- `ui.stringsJson` - 寫入主目錄的位置（例如 `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - 寫入 `de.json`, `pt-BR.json` 等的位置（例如 `"src/locales/"`）。
- `providers.<active>.uiModels`（選用）- 用於 `translate-ui`、複數生成與 `proofread-ui` 的有序僅限 UI 模型列表（在任何相符的 `localeModels` 項目之後，`translationModels` 之前）。請參閱[供應商與模型](/zh-Hant/guide/providers-and-models#model-fallback-chain)。

<a id="step-2-extract-strings"></a>
## 步驟 2：提取字串

```bash
ai-i18n-tools extract
```

掃描 `ui.sourceRoots` 下的所有 JS/TS 檔案，尋找 `t("literal")` 和 `i18n.t("literal")` 呼叫。寫入（或合併到）`ui.stringsJson`。

掃描器可配置：透過 `ui.uiExtractor.funcNames` (或舊版 `ui.reactExtractor.funcNames`) 新增自訂函數名稱。對於 Astro 頁面和元件，將 `.astro` 新增至 `ui.uiExtractor.extensions`。對於純 HTML，請參閱[純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)。

<a id="step-3-translate-ui-strings"></a>
## 步驟 3：翻譯 UI 字串

```bash
ai-i18n-tools translate-ui
```

讀取 `strings.json`，將批次傳送至每個目標語系的作用中 LLM 提供者，並將平面 JSON 檔案（`de.json`、`fr.json` 等）寫入至 `ui.flatOutputDir`。模型選擇使用 UI 鏈：`localeModels(locale)` → `uiModels` → `translationModels`（請參閱[提供者與模型](/zh-Hant/guide/providers-and-models#model-fallback-chain)）。在單一語系內，最多同時執行 `uiBatchConcurrency` 個批次（預設為 **2**；請參閱[設定 — uiBatchConcurrency](/zh-Hant/reference/configuration#uibatchconcurrency-optional)）。`-j` 仍然只會對目標語系進行平行處理。

<a id="per-locale-model-overrides"></a>
### 每個地區模型覆蓋

視目標語言而定，某些翻譯模型的表現可能顯著優於其他模型——例如，與許多西方語言模型相比，qwen 和 z-ai 模型在亞洲語言的翻譯品質上往往更高。為了利用這一點，您可以使用選用的 `providers.<active>.localeModels` 項目，為每個 BCP-47 語系指定優先的模型列表。對於該特定語系，這些模型列表會在更通用的 `uiModels` 和 `translationModels` **之前**被嘗試。這允許您調整模型選擇，並為每種語言實現更好的翻譯品質。語系標籤的比對不區分大小寫（因此 `zh-cn` 和 `ZH-CN` 是等效的）。如果沒有自訂項目符合某個語系，該工具將退回使用預設的 `uiModels` 和 `translationModels` 順序進行 UI 翻譯。相同的 `localeModels` 機制也適用於文件、JSON 和 SVG 翻譯。

<a id="translations-database-stringsjson"></a>
### 翻譯資料庫 (`strings.json`)

對於每個條目，`translate-ui` 會儲存來自作用中提供者的 **模型 ID**，該提供者已成功翻譯選用 `models` 物件中的每個地區設定 (與 `translated` 具有相同的地區設定金鑰)。在翻譯儀表板中編輯的字串，會以該地區設定的 `models` 中的標記值 `user-edited` 標記。`ui.flatOutputDir` 下的每個地區設定平面檔案仍僅包含 **來源字串 → 翻譯**；它們不包含 `models` (因此執行階段套件保持不變)。

> **注意：** 對 UI 字串的儀表板編輯位於 `strings.json` 中，而非 SQLite 文件快取。執行普通的 `sync` 或 `translate-ui`（無特殊旗標）以從目錄重寫平面語系檔案 —— `--force-update` **不會**轉送至 UI 步驟。避免在手動編輯後對 UI 指令使用 `--force`：它會重新翻譯每個項目，並可能覆寫您的 `user-edited` 列。儲存的翻譯未通過語系書寫系統檢查的目錄列（例如 `hi` 的羅馬拼音印地語）將被視為缺失，並在不使用 `--force` 的情況下重新翻譯。

然後在執行時連接 i18next — [連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime)。

<a id="exporting-to-xliff-20-optional"></a>
## 匯出為 XLIFF 2.0 (可選)

若要將 UI 字串交給翻譯供應商、TMS 或 CAT 工具，請將目錄匯出為 **XLIFF 2.0**（每個目標地區一個檔案）。此命令是 **唯讀**的：它不會修改 `strings.json` 或呼叫任何 API。

```bash
ai-i18n-tools export-ui-xliff
```

預設情況下，檔案會寫在 `ui.stringsJson` 旁邊，命名方式類似 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目錄的基底名稱 + 地區 + `.xliff`）。使用 `-o` / `--output-dir` 寫入其他位置。來自 `strings.json` 的現有翻譯會出現在 `<target>` 中；遺漏的地區會使用 `state="initial"`，沒有 `<target>`，以便工具可以填入。使用 `--untranslated-only` 只匯出每個地區仍需要翻譯的單位（對供應商批次很有用）。`--dry-run` 會列印路徑而不寫入檔案。
