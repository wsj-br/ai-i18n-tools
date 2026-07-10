<a id="cli--ui-strings"></a>
# CLI — UI 字串

<a id="extract"></a>
### `extract`

**概要：** `ai-i18n-tools extract`

從 `t("…")` / `i18n.t("…")` 字面值、可選的 `package.json` 描述，以及當啟用 `includeUiLanguageEnglishNames` 時的可選隨附主檔 `englishName` 項目更新 `strings.json`（請參閱 `ui.uiExtractor`；不會讀取 `languagesManifestPath`）。同時會在 `languagesManifestPath` 重新產生 `ui-languages.json`。當 `.html` / `.htm` 列於 `ui.uiExtractor.extensions` 時，也會從 HTML 擷取 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 標記字串。需要非空白的 `ui.sourceRoots`。不會呼叫 LLM。

**另請參閱：** [UI 字串概觀](/guide/ui-strings/), [純 HTML 應用程式](/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**概要：** `ai-i18n-tools mark-html [paths...] [--write]`

將裸露的 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 標記插入 HTML 中，以便原始文字只撰寫一次（位於元素本身上）。掃描給定的檔案/目錄/萬用字元（預設：`ui.sourceRoots` 下的 `.html` / `.htm`）。預設為模擬執行（報告每個檔案的新增計數以及任何需要手動 `<span data-i18n>` 的混合內容元素）；`--write` 會套用變更。具備等冪性，遵循 `data-i18n-ignore`（跳過元素及其子樹），絕不碰觸類似程式碼的元素（`code`, `pre`, `kbd`, `samp`, `var`）或空白/僅含數字的文字，且絕不發出帶有值的標記。不會呼叫 LLM。

**關鍵選項：** `--write`

**另請參閱：** [標記 HTML 以供翻譯](/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**概要：** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

使用 `sourceLocale` + `targetLocales` 與隨附的 `data/ui-languages-complete.json`（或 `--master`）將 `ui-languages.json` 寫入 `languagesManifestPath`（預設為 `{ui.flatOutputDir}/ui-languages.json`）。會針對主檔中缺少的地區設定發出警告並產生 `TODO` 佔位符。如果您現有的資訊清單包含自訂的 `label` 或 `englishName` 值，它們將會被主目錄預設值取代 — 請在之後檢閱並調整產生的檔案。

**關鍵選項：** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**概要：** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

僅翻譯 UI 字串（`strings.json` → 地區設定 JSON）。需要 `features.translateUIStrings`。

**關鍵選項：** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`：以逗號分隔的目標地區設定（預設：設定 `targetLocales` 減去 `sourceLocale`）。`--force`：重新翻譯每個地區設定的所有項目（忽略現有翻譯）。`--dry-run`：不寫入，不進行 API 呼叫。

---

<a id="sync-ui"></a>
### `sync-ui`

**概要：** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

先擷取，再翻譯 UI 字串（需要 `features.translateUIStrings`）。僅限 UI — 不含文件、SVG 或 `json[]`。與 `translate-ui` 使用相同的 `-l`、`--force`、`--dry-run` 及 `-j` 選項。

---

<a id="proofread-ui"></a>
### `proofread-ui`

**概要：** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

先執行 `extract`（需要 `features.translateUIStrings`），使 `strings.json` 與來源一致，再由 LLM 審查來源語系的 UI 字串（拼字、文法）。術語提示僅來自 `glossary.userGlossary` CSV（範圍與 `translate-ui` 相同 — 不含 `strings.json` / `uiGlossary`，因此不良文案不會被當作詞彙表而強化）。使用作用中的 LLM 供應商（其 API 金鑰環境變數）。

失敗時以 **1** 結束（缺少功能旗標、擷取失敗、缺少/無效的目錄、缺少 API 金鑰，或所有批次皆失敗）；成功完成時以 **0** 結束（審查結果僅供參考）。會在 `cacheDir` 下寫入 `proofread-ui-results_<timestamp>.log` 作為人類可讀的報告（摘要、問題及每個字串的 OK 列）；終端機僅印出摘要計數與問題（不會為每個字串印出 `[ok]` 列）。最後一行會印出日誌檔名。使用 `--json` 時，擬人化輸出會送至 stderr。連結使用 `path:line`，與儀表板 UI 字串的連結按鈕相同。

**關鍵選項：** `-l` / `--locale`、`--chunk`（預設 **50**）、`--dry-run`、`--json`、`-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**概要：** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

將 `strings.json` 匯出為 XLIFF 2.0（每個目標語系一個 `.xliff`）。唯讀；無 API。

**關鍵選項：** `-l` / `--locale`、`-o` / `--output-dir`、`--untranslated-only`、`--dry-run`

`-o` / `--output-dir`：輸出目錄（預設：與目錄相同的資料夾）。`--untranslated-only`：僅包含該語系缺少翻譯的單元。
