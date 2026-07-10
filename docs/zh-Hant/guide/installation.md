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

ai-i18n-tools 包含自己的字串提取器。如果您先前使用 `i18next-scanner`、`babel-plugin-i18next-extract` 或類似工具，遷移後可以移除這些開發相依性。

<a id="using-the-cli"></a>
### 使用 CLI

在您的專案中安裝 `ai-i18n-tools` 作為依賴項或開發依賴項（請參閱上方的 [安裝](#installation)）。該套件宣告了一個 `bin` 條目，您的套件管理器會將其連結到 `node_modules/.bin/ai-i18n-tools`。該墊片（安裝套件內的 `bin/ai-i18n-tools.mjs`）會載入已編譯的 CLI。

**`package.json` 腳本（建議）** — 當 npm 或 pnpm 執行腳本時，它會將 `node_modules/.bin` 附加到 `PATH`，因此像 `pnpm run i18n:sync` 這樣的命令會呼叫 `ai-i18n-tools`，而無需 `npx` 或 `pnpm exec` 前綴：

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

**互動式 Shell** — 從您的專案根目錄，在本地安裝後：

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
yarn ai-i18n-tools sync       # yarn (Berry: yarn dlx ai-i18n-tools … for one-off)
```

**裸** `ai-i18n-tools` **在終端機中** — 若要在互動式 Shell 中直接輸入命令名稱，請將本地 bin 目錄附加到 `PATH`：

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

使用 [**direnv**](https://direnv.net/)，將 `PATH_add node_modules/.bin` 新增到專案根目錄中的 `.envrc`，以便在 `cd` 進入專案後可以使用裸命令。如果未調整 `PATH`，請繼續使用 `npx ai-i18n-tools …` 或 `pnpm exec ai-i18n-tools …`。

**零安裝一次性使用** — `npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`（下載該次呼叫的套件；`package.json` 中沒有項目）。

<a id="cloned-ai-i18n-tools-monorepo"></a>
### 已複製的 ai-i18n-tools monorepo

在從 [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 的完整複本開發套件或執行工作區 **examples** 時：

- **工作區範例** (`examples/console-app`、`examples/nextjs-app`，以及 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 中列出的其他套件) — 在儲存庫根目錄執行 `pnpm install`，然後執行 `cd examples/<name>` 並使用 `pnpm exec ai-i18n-tools …` 或範例的 `pnpm run i18n:*` 腳本。工作區 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 會將 `ai-i18n-tools` 連結到你的本機簽出。
- **儲存庫根目錄** — pnpm 不會將根套件自身的 `bin` 連結到 `node_modules/.bin`，而在根目錄執行 `npx ai-i18n-tools` 會執行 **已發布的 npm** 套件，而非你的工作樹。請改用 `node bin/ai-i18n-tools.mjs …` 或根目錄的 `pnpm i18n:*` 腳本。
- **獨立測試夾具** (`multi-provider`、`test-markdown`) — 從測試夾具資料夾使用 `node ../../bin/ai-i18n-tools.mjs …`。

變更 CLI 原始碼後，請在儲存庫根目錄執行 `pnpm run build`。請參閱[開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)以了解建置步驟與可選的全域安裝替代方案。

在 Linux、macOS 和 WSL 上，登錄檔安裝會自動為 CLI 指令碼設定可執行位元。在 Windows 上，套件管理器會產生 `.cmd` 和 `.ps1` 代理程式，明確叫用 Node。

翻譯指令（`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`）需要在 `ai-i18n-tools.config.json` 中進行 **供應商設定**，並為目前使用的供應商提供 **API 金鑰**。執行 `ai-i18n-tools init` 來產生預設的 OpenRouter 區塊；編輯 `provider` / `providers` 以切換預設值或模型 — 請參閱 [LLM 供應商與模型](/zh-Hant/guide/providers-and-models)。Ollama 是唯一不需要 API 金鑰的內建預設值。

設定您的提供者 API 金鑰（顯示為 OpenRouter；請使用與您啟用中的提供者相符的環境變數 — 請參閱[預設表](/zh-Hant/guide/providers-and-models#built-in-providers)）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或在專案根目錄建立 `.env` 檔案：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 工具使用者介面語言

CLI 會將其自身的說明文字、日誌摘要與翻譯儀表板進行本地化，這與您所翻譯的地區設定無關。預設情況下，它會遵循您的作業系統地區設定。請在設定中使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 進行覆寫。請參閱[工具介面語言](/zh-Hant/guide/tool-ui-language)。
