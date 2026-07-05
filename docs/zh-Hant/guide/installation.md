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

在 Linux、macOS 和 WSL 上，登錄檔安裝會自動為 CLI 指令碼設定可執行位元。在 Windows 上，套件管理器會產生 `.cmd` 和 `.ps1` 代理程式，明確叫用 Node。

設定您的提供者 API 金鑰（顯示為 OpenRouter；請使用與您啟用中的提供者相符的環境變數 — 請參閱[預設表](/guide/providers-and-models#built-in-providers)）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

或在專案根目錄建立 `.env` 檔案：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 工具使用者介面語言

CLI 會獨立於您翻譯的地區設定，將其自身的說明文字、日誌摘要和翻譯儀表板本地化。預設情況下，它會遵循您的作業系統地區設定。在設定中，使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 覆寫。請參閱[工具使用者介面語言](/reference/environment-variables#tool-ui-language)。
