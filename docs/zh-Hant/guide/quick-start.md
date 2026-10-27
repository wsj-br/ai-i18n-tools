<a id="quick-start"></a>
# 快速入門

本頁將帶您將一個單一語言的專案，產生其第一批翻譯檔案。適用於 JS/TS 應用程式、Python 應用程式、網站或文件站台，或是儲存庫 README 及其他 Markdown 檔案。本頁假設：

- 已安裝 Node.js `>=22.16.0`，若是 Python 專案，則需[獨立執行檔](/zh-Hant/guide/installation#standalone-executables)。
- 擁有 LLM 供應商的 API 金鑰，或是在本機安裝 Ollama。
- 專案已納入版本控制，以便您檢閱工具寫入的內容。

不同專案之間有兩點差異：工具如何尋找您的文字，以及您的應用程式如何載入結果。下方的[選擇您的路徑](#pick-your-path)會將您導向適合的指南。

<a id="runnable-examples"></a>
## 可執行範例

偏好先查看已完成的專案嗎？您可以複製一個專案，而無需複製整個儲存庫：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync
```

將 `console-app` 替換為任何其他 Node.js 範例。Python 範例沒有 `package.json`；請用同樣的方式複製，或從 GitHub Release 下載 `ai-i18n-tools-python-examples.zip`。完整的清單以及各範例的展示內容，請見[範例](/zh-Hant/examples)頁面。

<a id="install"></a>
## 安裝

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools` 和 `yarn add --dev ai-i18n-tools` 也可以。Python 專案安裝獨立執行檔，不需要 Node.js。Linux 和 macOS：`curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash`。Windows PowerShell：`irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex`。其他安裝選項：[安裝](/zh-Hant/guide/installation)。

<a id="provider-and-api-key"></a>
## 供應商與 API 金鑰

每個呼叫 LLM 的指令（`translate-ui`、`translate-docs`、`translate-json`、`translate-svg` 和 `sync`）都需要以下兩者：

1. 在 `ai-i18n-tools.config.json` 中至少有一個提供者：一個帶有 `translationModels` 的 `providers.<name>` 區塊，以及在設定多個提供者時，一個頂層的 `provider` 金鑰。`init -P <provider>` 會建立該預設設定的骨架。若要新增提供者，請參閱 [LLM 提供者](/zh-Hant/guide/providers-and-models)。若要選擇模型清單，請參閱 [AI 模型](/zh-Hant/guide/ai-models)。
2. 在您的環境或專案根目錄的 `.env` 檔案中，有相符的 API 金鑰。每個內建的預設設定都會從 [預設設定表格](/zh-Hant/guide/providers-and-models#built-in-providers) 讀取一個具名變數，例如 `OPENROUTER_API_KEY` 搭配 `-P openrouter` 或 `OPENAI_API_KEY` 搭配 `-P openai`。Ollama 使用本機端點，不需要金鑰。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`extract`、`status` 及其他不呼叫 LLM 的指令則兩者皆不需要。關於環境檔案和 PATH 的更多資訊：[安裝](/zh-Hant/guide/installation#using-the-cli)。

<a id="pick-your-path"></a>
## 選擇您的路徑

找出您擁有的專案類型，執行其區塊中的指令，然後繼續閱讀連結的指南。

<a id="core-cli-commands"></a>

<a id="a-jsts-app"></a>
### JS/TS 應用程式

您的按鈕和訊息在原始碼中仍是純文字，因此工具目前還找不到任何東西。必須先用 `t()` 將它們包裹起來，且應用程式需要一個小型的 i18next 設定檔。

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models --apply
```

接著請遵循[為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) 的說明。在執行 `extract` 和 `translate-ui` 之前，該指南會涵蓋包裹步驟，並提供一個代理提示。

<a id="a-python-app"></a>
### Python 應用程式

```bash
ai-i18n-tools init -t ui-python -P openrouter
ai-i18n-tools suggest-models --apply
```

對於這些設定，請使用 `ui-python-gettext`、`ui-python-flask` 或 `ui-python-django`。接著請遵循[為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python) 的說明。

<a id="a-website-or-documentation-site"></a>
### 網站或文件站台

為您的框架挑選範本：

| 您的網站 | 範本 |
| --- | --- |
| Astro Starlight | `ui-starlight` |
| Docusaurus | `ui-docusaurus` |
| VitePress | `ui-vitepress` |
| Nextra | `ui-nextra` |
| Fumadocs | `ui-fumadocs` |
| 純 Astro 網站 | `ui-astro-website` |
| 純 HTML 頁面 | `ui-plain-html` 或 `docs-plain-html` |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

您的框架必須先啟用其自身的 i18n 路由功能。然後依照 [為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website)。

<a id="a-readme-or-markdown-docs"></a>
### README 或 Markdown 文件

大多數儲存庫會希望將此與應用程式放在一起：預設的 `ui-markdown` 範本已包含一個扁平的 README 區塊。對於任何其他範本，請新增 `--with-readme`。僅包含 Markdown 的儲存庫則使用 `docs-markdown`。

```bash
ai-i18n-tools init -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
ai-i18n-tools init -t docs-markdown -P openrouter
```

然後依照 [為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)。將語言清單標記貼到 `README.md` 中，置於 `sync` 之前。應用程式路徑（若有的話）仍然是 [為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js) 或 [為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python)。

<a id="something-else"></a>
### 其他項目

- 保持原樣的巢狀 i18next JSON：`ai-i18n-tools init -t ui-json-bundles -P openrouter`，然後 [JSON](/zh-Hant/guide/json)。
- 帶有文字標籤的 SVG 圖表：[SVG 翻譯](/zh-Hant/guide/svg-translation/)。
- 從 Intlayer 遷移：[從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer)。
- 保留 Intlayer 並僅填入其翻譯：[就地翻譯 Intlayer](/zh-Hant/guide/translating-intlayer)。

完整的範本清單，包含所有 `init` 選項，可在 [CLI 設定參考](/zh-Hant/reference/cli-commands/setup) 中找到。

<a id="run-and-check"></a>
## 執行與檢查

當您的專案準備就緒時：

```bash
ai-i18n-tools sync
ai-i18n-tools status
```

`sync` 會依序執行您的設定所啟用的每個步驟。`status` 會顯示每個語系的翻譯內容。首次在工具無法看見文字的專案上執行時，會無錯誤地完成，但不會寫入任何有用的內容，因此如果 `status` 未顯示任何字串，請返回您所選路徑的指南。

`suggest-models` 會根據已發佈的基準測試，對作用中提供者的聊天模型進行排名。`suggest-models --apply` 會取代 `translationModels`，並保留 `uiModels` 和 `localeModels` 不變。儀表板的 **模型** 標籤頁上也有相同的排名。關於排名如何運作，以及為何清單中包含多個模型，請參閱：[AI 模型](/zh-Hant/guide/ai-models)。指令參考：[suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models)。

<a id="keep-it-translated"></a>
## 保持翻譯更新

每當來源文字變更時，請重新執行 `sync`。SQLite 快取意味著只有新的或變更的文字會傳送至模型，因此重新執行成本低廉。在 CI 中執行 `sync` 可防止翻譯內容產生偏差。`ai-i18n-tools dashboard` 會開啟 [翻譯儀表板](/zh-Hant/guide/translation-dashboard/) 以檢閱和編輯快取的翻譯。

<a id="recommended-packagejson-scripts"></a>
### 建議的 package.json 指令碼

在本機安裝套件後，指令碼會從 `node_modules/.bin` 解析 `ai-i18n-tools`，無需額外的 shell 設定。若要使用互動式 shell，請先設定 PATH：請參閱 [使用 CLI](/zh-Hant/guide/installation#using-the-cli)。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

建議使用 `sync`，而非串連個別的翻譯指令碼。只有在需要單獨執行某個步驟時，才使用單一步驟的指令碼。

若要讓 CLI 輸出和儀表板以另一種語言顯示，請傳遞 `-L <code>` 或設定 `AI_I18N_LANG`：請參閱 [工具 UI 語言](/zh-Hant/guide/tool-ui-language)。

<a id="combined-sync"></a>

要同時翻譯多種類型的內容，例如應用程式字串和文件網站嗎？請參閱 [結合管線](/zh-Hant/guide/combining-pipelines)。

下一步：請參閱 [選擇您的路徑](#pick-your-path) 下適合您路徑的指南。
