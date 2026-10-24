<a id="installation"></a>
# 安裝

已發佈的套件為 **僅 ESM**。請在 Node.js 或您的建置工具中使用 `import`/`import()`；請勿使用 `require('ai-i18n-tools')`。該套件宣告了 `engines.node` `>=22.16.0`；舊版 Node.js 不受支援。npm tarball 僅在 `docs/` 下包含英文檔案；位於 `translated-docs/` 的地區設定專用副本位於 [GitHub 儲存庫](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### 獨立執行檔

GitHub Releases 附帶一個 Node.js 單一可執行檔組建。Python 專案可直接從該二進位檔案執行 CLI，包含 `extract`、`translate-ui` 和 `suggest-models`，無需安裝 Node.js。

| 平台 | 資產 |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

每個發行版本亦附帶 `SHA256SUMS.txt` 和 `ai-i18n-tools-python-examples.zip`（四個 Python 範例）。npm tarball 和可執行檔並不包含這些範例。它們同樣保留在儲存庫中。

1. 從 [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases) 頁面下載符合您機器的資產。
2. 對照 `SHA256SUMS.txt` 檢查校驗和。
3. 在 Linux 和 macOS 上，對該檔案執行 `chmod +x` 並將其移動至 `PATH`（或透過路徑呼叫它）。
4. 在 Windows 上，將 `ai-i18n-tools-win-x64.exe` 放置於 `PATH`。將其重新命名為 `ai-i18n-tools.exe` 可保持與其他平台相同的指令名稱。

這些二進位檔案未經公證或 Authenticode 簽章。macOS 可能會要求您批准未簽章的程式。Windows SmartScreen 可能會顯示警告。

設定使用中提供者的 API 金鑰方式與 npm 安裝相同（環境變數或工作目錄中的 `.env` 檔案）。來自 `init` 的模型清單是一個起點。`suggest-models` 會列印一份排序後的簡短清單。`suggest-models --apply` 會將其寫入 `translationModels`。相同的排序亦顯示於 [Models](/zh-Hant/guide/translation-dashboard/models) 頁籤中。

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

逐步指南：[將 i18n 加入 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。指令參考：[suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models)。

ai-i18n-tools 內建其專用的字串擷取器。如果您先前使用過 `i18next-scanner`、`babel-plugin-i18next-extract` 或類似工具，可以在遷移後移除這些開發依賴項。現有的 i18next **namespace JSON** 檔案可以繼續使用 [JSON 管線](/zh-Hant/guide/json#i18next-namespace-files)。Intlayer `.content.ts` 字典可以使用 `migrate-intlayer` 匯入 — 請參閱[從 Intlayer 遷移](/zh-Hant/guide/migrating-from-intlayer)。

<a id="using-the-cli"></a>
### 使用 CLI

在您的專案中安裝 `ai-i18n-tools` 作為依賴項或開發依賴項（請參閱上方的 [安裝](#installation)）。該套件宣告了一個 `bin` 條目，您的套件管理器會將其連結到 `node_modules/.bin/ai-i18n-tools`。該墊片（安裝套件內的 `bin/ai-i18n-tools.mjs`）會載入已編譯的 CLI。

要在互動式 shell 中輸入裸 `ai-i18n-tools` 指令，請設定下方其中一個選項。若未進行設定，即使完成本地安裝，shell 也無法找到該二進位檔案。

**direnv** — 在專案根目錄的 `.envrc` 中新增（bash/zsh；請參閱 [direnv.net](https://direnv.net/)）：

```bash
PATH_add node_modules/.bin
```

在 `direnv allow` 之後，每當您 `cd` 進入專案時，裸指令即可使用。

**手動 PATH** — 請從**專案根目錄**（包含 `node_modules/.bin` 的目錄）執行這些指令。只要您保留該 `PATH` 項目，子目錄之後仍會繼續運作；從巢狀資料夾重新執行匯出會失敗，因為 `$PWD` 不再指向專案根目錄。

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**全域安裝** — 安裝 CLI 一次後即可從任何目錄呼叫：

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

使用 pnpm 時，如果遺漏全域指令，請在每台機器上執行一次 `pnpm setup`（並開啟新的 shell）— pnpm 需要將其全域 bin 目錄放在 `PATH` 上。全域安裝會使用全域鎖定的版本。若要針對個別專案鎖定版本，建議使用 direnv 或手動 PATH，讓 `node_modules/.bin` 解析至專案的依賴項目。

**`package.json` 指令稿** — 當 npm 或 pnpm 執行指令稿時，會將 `node_modules/.bin` 前置到 `PATH`，因此在指令稿內部可以直接使用指令名稱而無需變更殼層的 PATH。建議使用 `sync` 而非手動串接翻譯步驟——手動執行時順序和功能旗標很容易出錯：

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

然後執行例如 `pnpm run i18n:sync`。請參閱[建議的 `package.json` 指令稿](/zh-Hant/guide/quick-start#recommended-packagejson-scripts)以取得完整建議清單。

**替代方案** — 若您不願調整 `PATH`：`npx ai-i18n-tools …` (npm) 或 `pnpm exec ai-i18n-tools …` (pnpm)。若要在沒有 `package.json` 項目的情況下進行零安裝的一次性執行：`npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`。

<a id="cloned-ai-i18n-tools-monorepo"></a>
### 已複製 ai-i18n-tools 單一儲存庫

在從 [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 的完整複本開發套件或執行工作區 **examples** 時：

- **工作區範例** （`examples/console-app`、`examples/nextjs-app`，以及 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 中列出的其他套件） — 在儲存庫根目錄執行 `pnpm install`，然後執行 `cd examples/<name>`。使用範例的 `pnpm run i18n:*` 腳本，或設定 PATH（請參閱 [使用 CLI](#using-the-cli)）並執行單獨的 `ai-i18n-tools …`。工作區 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 將 `ai-i18n-tools` 連結到您的本機簽出。
- **儲存庫根目錄** — pnpm 不會將根套件自身的 `bin` 連結到 `node_modules/.bin` 中。此簽出的 `.envrc` 會將 `bin/` 加入到 `PATH`，因此已提交的 `bin/ai-i18n-tools` 包裝器（在已發布的 `bin/ai-i18n-tools.mjs` 墊片旁邊）會在 `direnv allow` 之後提供單獨的命令。若未使用 direnv，請使用 `node bin/ai-i18n-tools.mjs …`、`./bin/ai-i18n-tools …` 或根 `pnpm i18n:*` 腳本（或 shell 別名 / `pnpm add -g .` — 請參閱 [開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)）。
- **獨立測試夾具** （`multi-provider`、`test-markdown`） — 從測試夾具資料夾中，使用 `node ../../bin/ai-i18n-tools.mjs …`。

變更 CLI 原始碼後，請在儲存庫根目錄執行 `pnpm run build`。請參閱[開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)以了解建置步驟與可選的全域安裝替代方案。

在 Linux、macOS 和 WSL 上，登錄檔安裝會自動為 CLI 指令碼設定可執行位元。在 Windows 上，套件管理器會產生 `.cmd` 和 `.ps1` 代理程式，明確叫用 Node。

翻譯指令 (`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`) 需要在 `ai-i18n-tools.config.json` 中進行 **供應商設定**，以及作用中供應商的 **API 金鑰**。執行 `ai-i18n-tools init -P <provider>` 以建立該預設；編輯 `provider` / `providers` 以新增模型 — 請參閱 [LLM 供應商與模型](/zh-Hant/guide/providers-and-models)。來自 `init` 的模型清單是一個起點。`ai-i18n-tools suggest-models` 會對作用中供應商的聊天模型進行排名，而 `suggest-models --apply` 會取代 `translationModels`。相同的排名位於 [模型](/zh-Hant/guide/translation-dashboard/models) 索引標籤上。指令參考：[suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models)。Ollama 是唯一不需要 API 金鑰的內建預設。

設定與您傳遞給 `init` 的供應商相符的 API 金鑰 (請參閱 [預設表格](/zh-Hant/guide/providers-and-models#built-in-providers))：

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

或在專案根目錄建立 `.env` 檔案：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 工具使用者介面語言

CLI 會將其自身的說明文字、日誌摘要與翻譯儀表板進行本地化，這與您所翻譯的地區設定無關。預設情況下，它會遵循您的作業系統地區設定。請在設定中使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 進行覆寫。請參閱[工具介面語言](/zh-Hant/guide/tool-ui-language)。
