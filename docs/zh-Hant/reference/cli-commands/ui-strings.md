<a id="cli--ui-strings"></a>
# CLI — UI 字串

<a id="extract"></a>
### `extract`

**概要：** `ai-i18n-tools extract`

從 `t("…")` / `i18n.t("…")` 常值、選用的 `package.json` 描述，以及啟用 `includeUiLanguageEnglishNames` 時選用的內建主要 `englishName` 項目來更新 `strings.json`（請參閱 `ui.uiExtractor`；不會讀取 `languagesManifestPath`）。同時重新產生每個區塊的 `ui-languages.json`。當 `ui.uiExtractor.extensions` 中列出 `.html` / `.htm` 時，也會從 HTML 擷取 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 標記字串。遍歷每個具有 `sourceRoots` 的 `ui` 區塊。`--ui-block` 會將執行限制為單一區塊（索引、描述或 `stringsJson` 路徑）。不會呼叫 LLM。

**另請參閱：** [UI 字串概觀](/zh-Hant/guide/ui-strings/), [純 HTML 應用程式](/zh-Hant/guide/ui-strings/plain-html)

---

<a id="migrate-intlayer"></a>
### `migrate-intlayer`

**概要：** `ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]`

將 Intlayer `*.content.ts` 字典匯入 `strings.json` 和扁平化語系檔案，並將簡單的 `useIntlayer` / `getIntlayer` 呼叫位置重寫為 `t('source string')`。字串以 `sourceLocale` 撰寫，可以是任何語言。預設為模擬執行 (仍會寫入報告)。`--write` 會為目錄植入資料並套用安全的重寫。不會呼叫 LLM。

此報告是 `--write` 所留下所有內容的交接文件，結尾附有 **逐步待辦事項** 以安排後續工作：每個手動站點的具體 `t()` 或 JSX 呼叫、`import { t }` 行、字典檔與後續需刪除的 `IntlayerProvider` 殘留檔案、需要先 `extract` 再 `translate-ui` 的來源字串，以及用來覆寫應用程式 i18n 模組的 i18next 執行階段啟動程式碼。區域設定控制項必須呼叫 `i18n.changeLanguage` 與 `loadLocale`。`extract` 會寫入 `ui-languages.json`，並由該啟動程式碼匯入。請勿手動編輯 `strings.json`、扁平化區域設定檔案或 `ui-languages.json`。

**主要選項：** `--write`, `--report`, `--content-glob` (預設 `**/*.content.ts`), `--t-import`

**另請參閱：** [從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer)

---

<a id="translate-intlayer"></a>
### `translate-intlayer`

**概要：** `ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]`

就地翻譯 Intlayer `*.content.ts` 字典中遺失和過時的語系葉節點，並維持字典作為真實來源 (source of truth)。與 [`migrate-intlayer`](#migrate-intlayer) 不同，此操作不會將應用程式從 Intlayer 移出；它只會填入 `t({ … })` 葉節點。當您想在執行階段保留 Intlayer 並使用 ai-i18n-tools 作為翻譯引擎時，請使用此功能。

它會擷取每個 `t({ … })` 葉節點，用來源文字為所選 UI 區塊的 `strings.json` 植入資料，執行與 [`translate-ui`](#translate-ui) 相同的引擎 (供應商選擇、詞彙表、翻譯情境和模型備援)，然後將每個語系的新字串寫回各個 `t({ … })` 物件中。編輯是精準的：只會變更遺失或過時的語系行，因此您的格式和註解都會保留。Intlayer `{token}` 預留位置會往返轉換為 <code v-pre>{{token}}</code> 以進行翻譯，然後再轉換回來。

當葉節點中缺少該語系 (遺失)，或自上次針對該語系執行後來源語系文字已變更 (過時) 時，就會翻譯「葉節點+語系」。過時狀態會在 `cacheDir` 中追蹤，因此編輯該來源字串會在下次執行時重新翻譯該葉節點。來源語言為 `sourceLocale`，可以是任何語言。`--dry-run` 會報告遺失/過時的計數，而不會呼叫 LLM 或寫入任何內容。需要 `features.translateUIStrings` 和 UI 區塊的 `stringsJson` (與 `translate-ui` 相同)。

**主要選項：** `-l` / `--locale`、`--ui-block`、`--dry-run`、`-j` / `--concurrency`

`[paths...]`：要掃描的檔案/目錄/glob 模式 (預設：區塊的 `sourceRoots`)。`-l` / `--locale`：要填入的目標語系，以逗號分隔 (預設：區塊設定的 `targetLocales`)。`--ui-block`：從零開始的索引、描述或 `stringsJson` 路徑 (預設：區塊 0)。`-j` 會平行處理語系。

**另請參閱：** [migrate-intlayer](#migrate-intlayer)、[從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer)

---

<a id="mark-html"></a>
### `mark-html`

**概要：** `ai-i18n-tools mark-html [paths...] [--write]`

將純 `data-i18n` / `data-i18n-title` / `data-i18n-placeholder` 標記插入 HTML，使來源文字僅寫入一次（在元素本身上）。掃描指定的檔案/目錄/Glob 模式（預設：每個區塊 `sourceRoots` 下的 `.html` / `.htm`）。預設為試執行（回報每個檔案的新增計數，以及任何需要手動 `<span data-i18n>` 的混合內容元素）；`--write` 會套用變更。具備冪等性、遵循 `data-i18n-ignore`（跳過該元素及其子樹狀結構）、絕不觸及類似程式碼的元素（`code`、`pre`、`kbd`、`samp`、`var`）或空白/純數字文字，且絕不發出帶值的標記。不會呼叫 LLM。

**關鍵選項：** `--write`

**另請參閱：** [標記 HTML 以供翻譯](/zh-Hant/guide/ui-strings/plain-html#marking-html-for-translation)

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

`-l` / `--locale`：以逗號分隔的目標語言地區（預設：設定 `targetLocales` 減去 `sourceLocale`）。`--force`：重新翻譯每個語言地區的所有項目（忽略現有翻譯）。`--dry-run`：不寫入、不呼叫 API。`-j` 並行處理 **locales**；在每個語言地區內，設定 `uiBatchConcurrency`（預設 **2**）並行處理 LLM 批次（每 50 個字串為一區塊，接著是複數群組）。沒有用於 `uiBatchConcurrency` 的 CLI 旗標。

---

<a id="sync-ui"></a>
### `sync-ui`

**概要：** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

先擷取，再翻譯 UI 字串（需要 `features.translateUIStrings`）。僅限 UI — 不含文件、SVG 或 `json[]`。與 `translate-ui` 使用相同的 `-l`、`--force`、`--dry-run` 及 `-j` 選項。

---

<a id="proofread-ui"></a>
### `proofread-ui`

**概要：** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

先執行 `extract`（需要 `features.translateUIStrings`），使每個選取的目錄符合來源，然後由 LLM 審查來源語系的 UI 字串（拼字、文法）。`--ui-block` 會將擷取與審查限制為單一區塊。術語提示僅來自 `glossary.userGlossary` CSV（與 `translate-ui` 範圍相同——UI 目錄不會回饋輸入，因此不佳的文案不會被強化為術語表）。使用作用中的 LLM 提供者（其 API 金鑰環境變數）。

失敗時以 **1** 結束 (缺少功能旗標、擷取失敗、缺少/無效的目錄、缺少 API 金鑰，或所有批次皆失敗時)；執行成功完成時以 **0** 結束 (發現僅供參考)。將 `proofread-ui-results_<timestamp>.log` 寫入 `cacheDir` 下，作為人類可讀的報告 (摘要、問題、未審查的列，以及每個字串的 OK 列)；終端機僅列印摘要計數和問題 (每個字串沒有 `[ok]` 行)。失敗的批次，或是短於批次長度且在每個位置沒有可用 `index` 的模型回應，會將這些字串計為未審查。系統會捨棄其問題，以免將過短的陣列套用到錯誤的字串。在最後一行印出記錄檔名稱。使用 `--json` 時，人類風格的輸出會傳送至 stderr。連結會使用 `path:line`，類似儀表板 UI 字串的連結按鈕。

**關鍵選項：** `-l` / `--locale`、`--chunk`（預設 **50**）、`--dry-run`、`--json`、`-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**概要：** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

將 `strings.json` 匯出為 XLIFF 2.0（每個目標語系一個 `.xliff`）。唯讀；無 API。

**關鍵選項：** `-l` / `--locale`、`-o` / `--output-dir`、`--untranslated-only`、`--dry-run`

`-o` / `--output-dir`：輸出目錄（預設：與目錄相同的資料夾）。`--untranslated-only`：僅包含該語系缺少翻譯的單元。
