<a id="translating-intlayer-in-place"></a>
# 就地翻譯 Intlayer

[Intlayer](https://intlayer.org/) 對於將翻譯保存在類型化內容字典中，或使用翻譯管理系統和人工翻譯的應用程式來說，是個很好的解決方案。`translate-intlayer` 正是為這類使用者所設計。它會就地填補您 `*.content.ts` 字典內遺失和過時的語系葉節點。字典仍是真實來源，Intlayer 則在執行階段運作，而 ai-i18n-tools 則扮演翻譯引擎的角色（負責提供者選擇、詞彙表、翻譯情境和模型備援）。

<a id="keep-intlayer-or-move-to-source-string-calls"></a>
## 保留 Intlayer，或改用來源字串呼叫？

| 您的使用者類型 | 指令 | 指南 |
| --- | --- | --- |
| 類型化內容字典、翻譯管理系統或人工翻譯。Intlayer 在執行階段運作。 | `translate-intlayer` | 本頁 |
| 來源字串呼叫，`t('…')`，來源語言文字與使用它的程式碼保存在一起。來源語言可以是任何語言。 | `migrate-intlayer` | [從 Intlayer 移轉至來源字串呼叫](/zh-Hant/guide/migrating-from-intlayer) |

`translate-intlayer` 是一項持續性任務，每當您新增來源字串或編輯現有字串時，都需重新執行。`migrate-intlayer` 則是為另一類使用者設計的一次性移轉。每個重寫後的呼叫都將來源語言字串與使用它的程式碼放在一起，這能簡化維護並降低該程式碼的複雜度。該語言是 `sourceLocale`，且可以是任何語言。

<a id="what-translate-intlayer-does"></a>
## `translate-intlayer` 的功能

1. 解析 `*.content.ts` 預設匯出，並收集每個 `t({ locale: '…' })` 葉節點。語系值可以是純字串或 Intlayer `insert('…')` 插入節點。
2. 使用原始文字填充 UI 區塊的 `ui.stringsJson`，然後針對遺失和過時的語系執行與 [`translate-ui`](/zh-Hant/reference/cli-commands/ui-strings#translate-ui) 相同的引擎。
3. 將新的每個語系字串寫回每個 `t({ … })` 物件。編輯是精確的：只有遺失或過時的語系行會變更，因此您的格式、鍵順序和註解都會保留。現有翻譯會保持原樣。當葉節點使用 `insert('…')` 時，新的語系值也會被 `insert(…)` 包裹，以便葉節點在執行時仍可呼叫。
4. 保留預留位置。Intlayer 的插入語法 <code v-pre>{{token}}</code> 會原樣傳遞。也支援單大括號 `{token}` 預留位置：它們在翻譯時會變成 <code v-pre>{{token}}</code>，並在寫入時返回 `{token}`。
5. 使用 `--dry-run` 進行模擬執行：它會回報遺失/過時的數量，而不會呼叫 LLM 或寫入任何內容。

<a id="missing-vs-stale"></a>
## 遺失與過時

當符合以下任一情況時，會翻譯「葉節點 + 語系」：

- 葉節點中缺少該語系（遺失），或
- 自上次針對該語系執行後，來源語系的文字已變更（過時）。來源語言是 `sourceLocale`，且可以是任何語言。

在 `cacheDir` 中，過時狀態是針對每個葉節點追蹤的，因此編輯一個英文字串，在下次執行時只會重新翻譯該葉節點；其他所有內容則維持快取狀態。在首次執行時就已過時的翻譯會被視為最新 — 只有後續的編輯才會將其標示為過時。

<a id="translate-your-project"></a>
## 翻譯您的專案

1. 安裝 `ai-i18n-tools`（請參閱[安裝](/zh-Hant/guide/installation)）。如果您的專案還沒有 `ai-i18n-tools.config.json`，請建立一個：

   ```bash
   ai-i18n-tools init -P gemini
   ```

將 `sourceLocale` 和 `targetLocales` 設定為您字典使用的語系，並將 `ui.sourceRoots`、`ui.stringsJson` 和 `ui.flatOutputDir` 指向您的來源和目錄路徑 — 這與 `translate-ui` 使用的鍵相同，請參閱 [UI 字串 — 步驟 1：初始化](/zh-Hant/guide/ui-strings/#step-1-initialise)。目錄可以放在暫存目錄中（例如 `.i18n/`）；它被用作翻譯快取，您絕不應手動編輯它。
2. 先進行模擬執行，看看會填入哪些內容：

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. 套用它（需要提供者 API 金鑰）：

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. 每當您新增字串或編輯英文字串時，請重新執行。只有新增或變更的葉節點會被翻譯。需要時，使用 `-l de,fr` 或 `--ui-block` 來限定執行範圍。

<a id="run-the-example"></a>
## 執行範例

[intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) 範例是一個小型的 Vite + React 應用程式，其字典隨附英文和巴西葡萄牙文；西班牙文和簡體中文則是刻意遺漏的。`pristine/` 是唯讀參考；`src/` 是工作複本。`pnpm reset` 會將 `src/` 還原到該初始狀態（並清除目錄和快取），這樣您就可以重複練習。

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev` 會在 `http://localhost:3093` 上執行應用程式。在翻譯之前，將地區設定切換為 `es` 或 `zh-Hans`，字串會回退為英文；在 `pnpm translate` 之後，已填入的翻譯就會顯示。編輯一個英文字串並重新執行 `pnpm translate`，即可看到只有該「葉」重新整理。

完整逐步教學：[examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md)。

<a id="command"></a>
## 指令

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

需要 `features.translateUIStrings` 以及 UI 區塊的 `ui.stringsJson` (與 `translate-ui` 相同)。`--dry-run` 不會呼叫 LLM。

| 選項 | 意義 |
| --- | --- |
| `[paths...]` | 要掃描的檔案/目錄/glob（預設：`ui.sourceRoots`） |
| `-l`, `--locale <codes>` | 要填入的目標語系，以逗號分隔 (預設值：區塊的 `targetLocales`) |
| `--ui-block <selector>` | UI 區塊：從零開始的索引、描述或 `stringsJson` 路徑 (預設值：區塊 0) |
| `--dry-run` | 僅回報遺失/過時的計數；不呼叫 LLM，也不寫入 |
| `-j`, `--concurrency <n>` | 最大平行目標語系數 (預設值：設定檔 `concurrency` 或 4) |

**另請參閱：** [CLI — UI 字串](/zh-Hant/reference/cli-commands/ui-strings#translate-intlayer)、[從 Intlayer 遷移至來源字串呼叫](/zh-Hant/guide/migrating-from-intlayer)
