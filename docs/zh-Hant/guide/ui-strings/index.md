<a id="ui-strings"></a>
# UI 字串

`extract` 與 `translate-ui` 的參考文件，這個管線會將 `t()` 呼叫轉換為各語系的目錄。首次為應用程式新增 i18n 嗎？請從 [為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) 或 [為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python) 開始。這些文件涵蓋了包裝步驟，然後會引導您回到這裡完成第 2 至 4 步。

此管線適用於 JS/TS 專案（React、Next.js 客戶端與伺服器元件、Node.js 服務、純 HTML、Astro 網站及 CLI 工具）和 Python 應用程式。在原始碼呼叫 `t()` 後，JS/TS 會使用 i18next 查詢字串。Python 透過一個產生的 `i18n.py` 來呼叫 `t()` 或 gettext（Django 保留 Django 的 gettext）。

<a id="which-guide-to-read"></a>
## 閱讀哪份指南

| 您的應用程式 | 接下來請閱讀 |
| --- | --- |
| 含有寫死原始碼字串的 JS/TS，尚未使用 `t()` | [為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) |
| React / Next.js / Node，原始碼中已有 `t()` | [串接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [Python 應用程式](/zh-Hant/guide/ui-strings/python)。初始化：`ui-python`、`ui-python-gettext`、`ui-python-flask` 或 `ui-python-django`。輔助工具：`i18n.py`。若要將語系加入現有的應用程式，請參閱 [將 i18n 加入 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。 |
| 純 HTML (標記中沒有 `t()`) | [純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html) |
| Astro 行銷網站 (混合) | [Astro 網站](/zh-Hant/guide/ui-strings/astro-website) |
| `t()` 規則、插值、複數 | [t() 呼叫與複數](/zh-Hant/guide/ui-strings/t-calls-and-plurals) |
| 語言選擇器 / RTL | [語言切換器與 RTL](/zh-Hant/guide/ui-strings/language-switcher) |
| 執行時 API 簽章 | [執行時輔助函數](/zh-Hant/guide/runtime-helpers) |
| Intlayer `.content.ts` 字典，要從 Intlayer 遷移 | [從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer) |
| Intlayer `.content.ts` 字典，要保留 Intlayer | [原地翻譯 Intlayer](/zh-Hant/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## 步驟 1：初始化

```bash
ai-i18n-tools init -P openrouter
```

這會使用 `ui-markdown` 範本寫入 `ai-i18n-tools.config.json`（包含該預設組的 `provider` / `providers` 區塊）。該範本也會為 `README.md` 開啟文件翻譯，並以純文字檔案形式寫入 `translated-docs/` 下。僅含 README 的儲存庫則改用 `init -t docs-markdown`。請參閱 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。在執行 `translate-ui` 或 `sync` 之前，請在環境或 `.env` 中設定該供應商的 API 金鑰——Ollama 除外；請參閱 [供應商與 API 金鑰](/zh-Hant/guide/quick-start#provider-and-api-key)。有四個金鑰對 UI 字串很重要：

- `sourceLocale`：您原始碼文字所用語言的 BCP-47 代碼。任何語言皆可；`"en-GB"` 僅為範例。它必須與您執行階段 i18n 設定檔（`src/i18n.ts` / `src/i18n.js`）中匯出的 `SOURCE_LOCALE` 相符。`t()` 內的字串即為該原始語言，而純文字語系檔案會將其用作金鑰。
- `targetLocales`：您目標語言的 BCP-47 代碼（例如 `["de", "fr", "pt-BR"]`）。執行 `generate-ui-languages` 以從此清單建立 `ui-languages.json` 資訊清單。
- `ui.sourceRoots`：要掃描 `t("…")` 呼叫的目錄或 glob 模式（例如 `["src/"]`）。
- `ui.stringsJson` 和 `ui.flatOutputDir`：主要目錄和各語系檔案（`de.json`、`pt-BR.json`）的寫入位置。

所有其他金鑰，包含 `providers.<active>.uiModels`，都記載於 [設定](/zh-Hant/reference/configuration) 中。

<a id="step-2-extract-strings"></a>
## 步驟 2：提取字串

在 `t()` / `i18n.t()` 呼叫存在之前，`extract` 不會執行任何有用的操作。請先包裝寫死的文案：[為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js)。

```bash
ai-i18n-tools extract
```

掃描 `ui.sourceRoots` 下的檔案，尋找 `t("literal")` 和 `i18n.t("literal")` 呼叫。寫入（或合併至）`ui.stringsJson`。

掃描器可配置：透過 `ui.uiExtractor.funcNames` (或舊版 `ui.reactExtractor.funcNames`) 新增自訂函數名稱。對於 Astro 頁面和元件，將 `.astro` 新增至 `ui.uiExtractor.extensions`。對於純 HTML，請參閱[純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)。

<a id="what-extract-scans"></a>
### 擷取掃描的內容

- 預設副檔名僅有 `.js`、`.jsx`、`.ts` 和 `.tsx`。`.mjs`、`.cjs`、`.mts` 和 `.cts` 只有在您將它們新增至 `ui.uiExtractor.extensions` 時才會被納入。
- 非字面值金鑰（例如 `t(variable)`）或範本字面值會被略過，且不會發出警告。
- `package.json` `description` 預設會被納入（`ui.uiExtractor.includePackageDescription`）。
- 不支援 Vue 和 Svelte 的單一檔案元件。將 `.vue` 或 `.svelte` 新增至 `extensions` 並不會擷取範本文字。沒有 SFC 解析器。

<a id="step-3-translate-ui-strings"></a>
## 步驟 3：翻譯 UI 字串

```bash
ai-i18n-tools translate-ui
```

讀取 `strings.json`，將每個目標語系的批次傳送至作用中 LLM 供應商的模型，並將扁平 JSON 檔案 (`de.json`、`fr.json` 等) 寫入 `ui.flatOutputDir`。模型選取會使用 UI 鏈：`localeModels(locale)` → `uiModels` → `translationModels` (請參閱 [AI 模型](/zh-Hant/guide/ai-models#model-fallback-chain))。在單一語系內，最多可同時執行 `uiBatchConcurrency` 個批次 (預設為 **2**；請參閱 [設定 — uiBatchConcurrency](/zh-Hant/reference/configuration#uibatchconcurrency-optional))。`-j` 仍然只會平行處理目標語系。

<a id="translations-database-stringsjson"></a>
### 翻譯資料庫 (`strings.json`)

對於每個條目，`translate-ui` 會儲存來自作用中提供者的 **模型 ID**，該提供者已成功翻譯選用 `models` 物件中的每個地區設定 (與 `translated` 具有相同的地區設定金鑰)。在翻譯儀表板中編輯的字串，會以該地區設定的 `models` 中的標記值 `user-edited` 標記。`ui.flatOutputDir` 下的每個地區設定平面檔案仍僅包含 **來源字串 → 翻譯**；它們不包含 `models` (因此執行階段套件保持不變)。

> **注意：** 對 UI 字串的儀表板編輯位於 `strings.json` 中，而非 SQLite 文件快取。執行普通的 `sync` 或 `translate-ui`（無特殊旗標）以從目錄重寫平面語系檔案 —— `--force-update` **不會**轉送至 UI 步驟。避免在手動編輯後對 UI 指令使用 `--force`：它會重新翻譯每個項目，並可能覆寫您的 `user-edited` 列。儲存的翻譯未通過語系書寫系統檢查的目錄列（例如 `hi` 的羅馬拼音印地語）將被視為缺失，並在不使用 `--force` 的情況下重新翻譯。

<a id="step-4-use-the-output-in-your-app"></a>
## 第 4 步：在您的應用程式中使用輸出

`translate-ui` 只會寫入檔案。應用程式必須載入這些檔案。

- JS/TS：使用執行階段輔助程式串接 i18next、載入使用者選擇的語系檔案，並新增語言切換器。請參閱 [串接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime) 和 [語言切換器與 RTL](/zh-Hant/guide/ui-strings/language-switcher)。
- Python：使用產生的 `i18n.py` 或您的 gettext 目錄。請參閱 [Python 應用程式](/zh-Hant/guide/ui-strings/python)。
- 純 HTML：在頁面旁載入執行階段指令碼。請參閱 [純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)。
- Astro：請參閱 [Astro 網站](/zh-Hant/guide/ui-strings/astro-website)。

<a id="optional"></a>
## 選用

<a id="per-locale-model-overrides"></a>
### 每個地區模型覆蓋

有些模型在翻譯特定語言時，表現得比其他模型更好。例如，qwen 和 z-ai 模型在處理亞洲語言方面通常表現良好。新增 `providers.<active>.localeModels` 項目，為每個 BCP-47 語言環境提供優先模型清單。對於該語言環境，系統會先嘗試這些清單，然後才使用 `uiModels` 和 `translationModels`。語言環境標籤的比對不區分大小寫 (`zh-cn` 和 `ZH-CN` 是相等的)。如果沒有相符的項目，工具會使用預設的 `uiModels` 和 `translationModels` 順序。同樣的 `localeModels` 機制也適用於文件、JSON 和 SVG 的翻譯。

<a id="exporting-to-xliff-20"></a>
### 匯出至 XLIFF 2.0

若要將 UI 字串交給翻譯供應商、TMS 或 CAT 工具，請將目錄匯出為 **XLIFF 2.0**（每個目標地區一個檔案）。此命令是 **唯讀**的：它不會修改 `strings.json` 或呼叫任何 API。

```bash
ai-i18n-tools export-ui-xliff
```

預設情況下，檔案會寫在 `ui.stringsJson` 旁邊，命名方式類似 `strings.de.xliff`、`strings.pt-BR.xliff`（您的目錄的基底名稱 + 地區 + `.xliff`）。使用 `-o` / `--output-dir` 寫入其他位置。來自 `strings.json` 的現有翻譯會出現在 `<target>` 中；遺漏的地區會使用 `state="initial"`，沒有 `<target>`，以便工具可以填入。使用 `--untranslated-only` 只匯出每個地區仍需要翻譯的單位（對供應商批次很有用）。`--dry-run` 會列印路徑而不寫入檔案。
