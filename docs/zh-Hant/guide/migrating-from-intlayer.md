<a id="migrating-from-intlayer"></a>
# 從 Intlayer 遷移

正在從 [Intlayer](https://intlayer.org/) 遷移嗎？此命令會將您現有的翻譯字典與應用程式中最基本的翻譯用法匯入 ai-i18n-tools。它會自動執行安全更新，並針對任何仍需您處理的事項產生清晰的報告。這能讓您逐步遷移，無需事先了解所有差異。

已經在使用 i18next JSON 翻譯檔案嗎？您不需要使用此遷移命令；請改用 [JSON 管線](/zh-Hant/guide/json#i18next-namespace-files)。

<a id="what-migrate-intlayer-does"></a>
## `migrate-intlayer` 的功能

1. 解析 `*.content.ts` 預設匯出 (`key` + `content` + `t({ locale: '…' })` 葉節點)。
2. 從來源語言文字與字典中已有的翻譯，植入 `ui.stringsJson` 以及 `ui.flatOutputDir` 下的各語言檔案。匯入的列沒有 `models` 欄位 (它們並非由此執行階段機器翻譯)。
3. 重寫**安全**的呼叫點：
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. 保持其他所有項目 (動態索引鍵、JSX 展開、鏈式 `.replace().replace()`、解構) 不變。報告會列出每個這些位置的確切運算式、具體的 `t()` 或 JSX 取代項目，以及要新增的 `import { t } from '…';` 行。
5. 預設為試執行。傳遞 `--write` 以套用目錄植入與安全重寫。報告一定會寫入。它也會列出字典檔案，以及在手動重寫後要刪除的殘留 `useIntlayer` / `IntlayerProvider` 用法、仍需要 `extract` 然後 `translate-ui` 的目錄索引鍵，以及要貼上覆蓋應用程式 i18n 模組的執行階段啟動程式。

<a id="migrate-your-project"></a>
## 遷移您的專案

1. 安裝 `ai-i18n-tools`（請參閱[安裝](/zh-Hant/guide/installation)）。如果您的專案還沒有 `ai-i18n-tools.config.json`，請建立一個：

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

編輯 `sourceLocale` 和 `targetLocales` 以符合 Intlayer 字典中已有的地區設定，並將 `ui.sourceRoots`、`ui.stringsJson`、`ui.flatOutputDir` 設定為指向您應用程式的來源與所需的目錄路徑——與 `translate-ui` 使用的索引鍵相同，請參閱 [UI 字串 — 步驟 1：初始化](/zh-Hant/guide/ui-strings/#step-1-initialise)。
2. 先進行試執行：`ai-i18n-tools migrate-intlayer`（不含 `--write`）。閱讀 `migrate-intlayer-report.md` 以查看其尋找到的內容，以及在任何檔案變更前哪些呼叫站點需要手動檢閱。
3. 執行 `ai-i18n-tools migrate-intlayer --write` 以植入 `ui.stringsJson` / `ui.flatOutputDir` 並重寫安全的呼叫站點。
4. 將重新產生的報告 `migrate-intlayer-report.md` 提供給 AI 程式碼代理程式（建議），或依照以下步驟自行處理：

- 報告結尾附有 **逐步待辦事項**：使用其中顯示的具體 `t('…')`/JSX 完成每個手動檢閱站點，新增 `import { t } from '…';` 行，然後刪除報告中列出的剩餘 `*.content.ts` 檔案與 `useIntlayer` / `IntlayerProvider` 用法。
   - 將報告的執行階段啟動程式碼貼上並覆蓋您應用程式的 i18n 模組。在地區設定控制項中，呼叫 `loadLocale(next)` 然後呼叫 `i18n.changeLanguage(next)`——`loadLocale` 只會註冊扁平套件組合，並不會切換作用中的語言。
   - 針對報告標記為新增的任何來源字串，執行 `ai-i18n-tools extract` 然後執行 `ai-i18n-tools translate-ui`（或 `sync`）。`extract` 也會寫入 `ui-languages.json`（啟動程式碼會匯入此檔案），因此即使沒有新增字串，也請在啟動應用程式前執行它。請勿手動編輯 `strings.json`、扁平地區設定檔案或 `ui-languages.json`——這些檔案由這些命令管理。
   - 一旦報告的清理清單完成，且應用程式在 ai-i18n-tools 上執行，請移除 `intlayer` / `react-intlayer` 相依性以及字典檔案。

<a id="run-the-example"></a>
## 執行範例

上述步驟適用於任何 Intlayer 專案。[intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) 範例在一個小型 Vite + React 應用程式上逐步解說這些步驟，其中包含基本（可自動重寫）與複雜（需手動檢閱）的案例，讓您在自己的程式碼上嘗試之前，可以先查看報告與執行階段啟動程式碼。`intlayer-pristine/` 絕不會被修改；`src/` 是工作複本。

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

將 `migrate-intlayer-report.md` 交給 AI 程式設計代理程式 (或自行編輯標記的檔案)。報告包含要貼上覆蓋 `src/i18n.ts` 的執行階段模組。在語言控制項中，呼叫 `loadLocale(next)` 然後呼叫 `i18n.changeLanguage(next)`。`loadLocale` 只會註冊扁平套件。

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` 會先執行 `extract`，並寫入 `ui-languages.json`。啟動程序會匯入該檔案，因此請在擷取完成後再啟動應用程式。請勿手動編輯 `strings.json`、扁平語系檔案或 `ui-languages.json`。

`pnpm reset` 會將 `intlayer-pristine/` 複製回 `src/` 並清除已產生的目錄，讓您可以重新開始。

完整逐步說明：[examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md)。

<a id="command"></a>
## 指令

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

需要在設定中包含 `ui.stringsJson` 和 `ui.flatOutputDir`（與 `translate-ui` 相同）。不會呼叫 LLM。

| 選項 | 意義 |
| --- | --- |
| `[paths...]` | 要掃描的檔案/目錄/glob（預設：`ui.sourceRoots`） |
| `--write` | 植入目錄並改寫安全呼叫點（預設：模擬執行） |
| `--report <path>` | 報告路徑（預設：`migrate-intlayer-report.md`） |
| `--content-glob <glob>` | 字典檔名萬用字元（預設：`**/*.content.ts`） |
| `--t-import <specifier>` | 產生的 `t()` 的匯入指定子（預設：若 `src/i18n.ts` 存在則為相對 `./i18n`，否則為 `i18next`） |

在 `--write` 完成後，請完成報告中需手動審查的網站，刪除報告列出的未使用 `*.content.ts` 檔案與 `IntlayerProvider` 包裝器，貼上執行階段啟動程序，並從語系控制項呼叫 `i18n.changeLanguage`。針對報告中標記為新增的來源字串，請執行 `extract` 接著執行 `translate-ui`（或 `sync`）。`extract` 也會寫入 `ui-languages.json`，供啟動程序匯入。請勿手動編輯 `strings.json`、扁平語系檔案或 `ui-languages.json`。

**另請參閱：** [CLI — UI 字串](/zh-Hant/reference/cli-commands/ui-strings#migrate-intlayer)、[接入 i18next](/zh-Hant/guide/ui-strings/i18next-runtime)
