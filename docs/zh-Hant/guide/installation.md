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

要在互動式 shell 中輸入裸 `ai-i18n-tools` 指令，請設定下方其中一個選項。若未進行設定，即使完成本地安裝，shell 也無法找到該二進位檔案。

**direnv** — 在專案根目錄的 `.envrc` 中新增（bash/zsh；請參閱 [direnv.net](https://direnv.net/)）：

```bash
PATH_add node_modules/.bin
```

在 `direnv allow` 之後，每當您 `cd` 進入專案時，裸指令即可使用。

**手動 PATH** — 在互動式 shell 中從專案根目錄執行：

```bash
# bash/zsh
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

**全域安裝** — 安裝 CLI 一次後即可從任何目錄呼叫：

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

全域安裝會使用全域鎖定的版本。若要進行各專案的版本鎖定，建議使用 direnv 或手動 PATH，以便 `node_modules/.bin` 解析至專案的相依性。

**`package.json` 指令碼** — 當 npm 或 pnpm 執行指令碼時，它會將 `node_modules/.bin` 置於 `PATH` 之前，因此裸指令名稱可在指令碼內運作，而無需更改 shell PATH：

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync"
}
```

然後執行例如 `pnpm run i18n:sync`。

**替代方案** — 若您不願調整 `PATH`：`npx ai-i18n-tools …` (npm) 或 `pnpm exec ai-i18n-tools …` (pnpm)。若要在沒有 `package.json` 項目的情況下進行零安裝的一次性執行：`npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`。

<a id="cloned-ai-i18n-tools-monorepo"></a>
### 已複製的 ai-i18n-tools monorepo

在從 [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 的完整複本開發套件或執行工作區 **examples** 時：

- **工作區範例**（`examples/console-app`、`examples/nextjs-app`，以及 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 中列出的其他套件）— 在儲存庫根目錄執行 `pnpm install`，然後執行 `cd examples/<name>`。使用範例的 `pnpm run i18n:*` 腳本，或設定 PATH（請參閱 [使用 CLI](#using-the-cli)）並直接執行 `ai-i18n-tools …`。工作區 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 會將 `ai-i18n-tools` 連結到你的本地檢出。
- **儲存庫根目錄** — pnpm 不會將根套件自身的 `bin` 連結到 `node_modules/.bin`。請改用 `node bin/ai-i18n-tools.mjs …` 或根 `pnpm i18n:*` 腳本（或 shell 別名 / `pnpm add -g .` — 請參閱 [開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)）。
- **獨立夾具** (`multi-provider`, `test-markdown`) — 從夾具資料夾中，使用 `node ../../bin/ai-i18n-tools.mjs …`。

變更 CLI 原始碼後，請在儲存庫根目錄執行 `pnpm run build`。請參閱[開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)以了解建置步驟與可選的全域安裝替代方案。

在 Linux、macOS 和 WSL 上，登錄檔安裝會自動為 CLI 指令碼設定可執行位元。在 Windows 上，套件管理器會產生 `.cmd` 和 `.ps1` 代理程式，明確叫用 Node。

翻譯指令 (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) 需要在 `ai-i18n-tools.config.json` 中進行 **供應商設定**，並為目前使用的供應商提供 **API 金鑰**。執行 `ai-i18n-tools init [-P <provider>]` 來建立預設的供應商區塊（省略時為 `openrouter`）；編輯 `provider` / `providers` 來切換預設值或模型 — 請參閱 [LLM 供應商與模型](/zh-Hant/guide/providers-and-models)。Ollama 是唯一不需要 API 金鑰的內建預設值。

設定與你目前使用的供應商相符的 API 金鑰（請參閱 [預設值表格](/zh-Hant/guide/providers-and-models#built-in-providers)）：

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

或在專案根目錄建立 `.env` 檔案：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### 工具使用者介面語言

CLI 會將其自身的說明文字、日誌摘要與翻譯儀表板進行本地化，這與您所翻譯的地區設定無關。預設情況下，它會遵循您的作業系統地區設定。請在設定中使用 `-L pt-BR`、`export AI_I18N_LANG=es` 或 `"uiLanguage"` 進行覆寫。請參閱[工具介面語言](/zh-Hant/guide/tool-ui-language)。
