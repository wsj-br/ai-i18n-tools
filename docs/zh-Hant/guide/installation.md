<a id="installation"></a>
# 安裝

本頁面將說明如何安裝 CLI，並讓基本的 `ai-i18n-tools` 指令能夠運作。已經安裝了嗎？請前往 [快速入門](/zh-Hant/guide/quick-start)。

已發佈的套件僅支援 ESM。在 Node.js 或您的打包工具中，請使用 `import` 或 `import()`；請勿使用 `require('ai-i18n-tools')`。此套件宣告了 `engines.node` `>=22.16.0`；不支援較舊的 Node.js 版本。npm tarball 僅在 `docs/` 下包含英文檔案；在 `translated-docs/` 下的地區設定特定副本則位於 [GitHub 存放庫](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs) 中。

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

Linux 和 macOS：

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell)：

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

安裝程式會偵測系統、下載相符的可執行檔、檢查 `SHA256SUMS.txt`、將指令安裝為 `ai-i18n-tools` (在 Windows 上為 `ai-i18n-tools.exe`)，並將安裝目錄新增至 `PATH`。預設目錄為 `~/.local/bin`。如果還找不到指令，請開啟一個新的終端機。設定 `AI_I18N_VERSION` (例如 `v1.11.0`) 以鎖定特定版本，或設定 `AI_I18N_INSTALL_DIR` 以選擇其他目錄。

二進位檔未經公證或 Authenticode 簽署。macOS 可能會要求您核准未簽署的程式。Windows SmartScreen 可能會顯示警告。在校驗和相符後，macOS 安裝程式會清除隔離旗標。

每個版本也附加了 `SHA256SUMS.txt`、`install.sh`、`install.ps1` 和 `ai-i18n-tools-python-examples.zip` (四個 Python 範例)。npm tarball 和可執行檔不包含這些範例。它們也保留在存放庫中。

<details>
<summary>手動安裝 <code>ai-i18n-tools</code> 可執行檔的說明</summary>

| 平台 | 資產 |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. 從 [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases) 頁面下載符合您機器的資產以及 `SHA256SUMS.txt`。
2. 檢查校驗和。在 Linux 上，執行 `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -` (請使用您下載的資產名稱)。在 macOS 上，執行相同的指令列，但使用 `shasum -a 256 -c -`。在 Windows 上，執行 `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` 並將其與 `SHA256SUMS.txt` 中的雜湊值進行比較。
3. 將下載的檔案重新命名為 `ai-i18n-tools`，並將該目錄放在 `PATH` 上。

Linux 和 macOS，以 Linux x64 資產為例 (請替換為您下載的資產)：

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

如果 `$HOME/.local/bin` 尚未在 `PATH` 中，請將以下內容新增至您的 shell 設定檔 (`.bashrc`、`.bash_profile`、`.profile` 或 `.zshrc`)，並開啟一個新的終端機：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell)，將 `ai-i18n-tools-win-x64.exe` 重新命名為 `ai-i18n-tools.exe`：

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Move-Item -Force .\ai-i18n-tools-win-x64.exe "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

開啟一個新的終端機並執行 `ai-i18n-tools --version`。在所有平台上，指令名稱都是 `ai-i18n-tools`。

</details>

為作用中的供應商設定 API 金鑰的方法與 npm 安裝相同 (請見下方)。然後：

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

逐步指南：[將 i18n 加入 Python 應用程式](/zh-Hant/guide/add-i18n-to-python)。指令參考：[suggest-models](/zh-Hant/reference/cli-commands/models#suggest-models)。

<a id="set-the-api-key"></a>
### 設定 API 金鑰

翻譯指令 (`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`) 需要在 `ai-i18n-tools.config.json` 中設定供應商，並提供現用供應商的 API 金鑰。執行 `ai-i18n-tools init -P <provider>` 以建立該預設設定。供應商預設設定與 API 金鑰：[LLM 供應商](/zh-Hant/guide/providers-and-models)。`init` 中的模型清單是一個起點。請從 [AI 模型](/zh-Hant/guide/ai-models) 取得模型，並使用 `suggest-models` 或儀表板的 **模型** 索引標籤來取代它。Ollama 是唯一不需要 API 金鑰的內建預設設定。

設定與您傳遞給 `init` 的供應商相符的金鑰 (請參閱 [預設設定表](/zh-Hant/guide/providers-and-models#built-in-providers))：

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

<a id="using-the-cli"></a>
### 使用 CLI

在您的專案中將 `ai-i18n-tools` 安裝為依賴項或開發依賴項 (請參閱本頁頂部)。該套件宣告了一個 `bin` 項目，您的套件管理器會將其連結至 `node_modules/.bin/ai-i18n-tools`。該填充碼 (shim) (位於已安裝套件內的 `bin/ai-i18n-tools.mjs`) 會載入已編譯的 CLI。

要在互動式 shell 中輸入裸 `ai-i18n-tools` 指令，請設定下方其中一個選項。若未進行設定，即使完成本地安裝，shell 也無法找到該二進位檔案。

direnv — 新增至專案根目錄中的 `.envrc` (bash/zsh；請參閱 [direnv.net](https://direnv.net/))：

```bash
PATH_add node_modules/.bin
```

在 `direnv allow` 之後，每當您 `cd` 進入專案時，裸指令即可使用。

手動設定 PATH — 從專案根目錄 (包含 `node_modules/.bin` 的目錄) 執行這些指令。只要您保留該 `PATH` 項目，之後子目錄仍可正常運作；從巢狀資料夾重新執行 export 會失敗，因為 `$PWD` 不再指向專案根目錄。

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

全域安裝 — 安裝 CLI 一次，即可從任何目錄叫用它：

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

使用 pnpm 時，如果遺漏全域指令，請在每台機器上執行一次 `pnpm setup`（並開啟新的 shell）— pnpm 需要將其全域 bin 目錄放在 `PATH` 上。全域安裝會使用全域鎖定的版本。若要針對個別專案鎖定版本，建議使用 direnv 或手動 PATH，讓 `node_modules/.bin` 解析至專案的依賴項目。

package.json 指令碼 — 當 npm 或 pnpm 執行指令碼時，它會將 `node_modules/.bin` 加到 `PATH` 的開頭，因此，不需變更 shell 的 PATH，基本的指令名稱就能在指令碼中運作：

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

然後執行，例如 `pnpm run i18n:sync`。如需完整的建議設定，請參閱 [建議的 package.json 指令碼](/zh-Hant/guide/quick-start#recommended-packagejson-scripts)。

替代方案 — 如果您不想調整 `PATH`：`npx ai-i18n-tools …` (npm) 或 `pnpm exec ai-i18n-tools …` (pnpm)。若要進行一次性的零安裝執行，且不在 `package.json` 中建立項目：`npx ai-i18n-tools <cmd>` 或 `pnpm dlx ai-i18n-tools <cmd>`。

<a id="coding-agent-skill"></a>
### 已複製的 monorepo

從 [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) 的完整複製版本開發套件或執行工作區範例時：

- 工作區範例 (`examples/console-app`、`examples/nextjs-app` 及 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 中列出的其他套件) — 在儲存庫根目錄執行 `pnpm install`，然後執行 `cd examples/<name>`。使用範例的 `pnpm run i18n:*` 指令碼，或設定 PATH (請參閱 [使用 CLI](#using-the-cli)) 並直接執行 `ai-i18n-tools …`。工作區 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) 會將 `ai-i18n-tools` 連結至您的本機簽出版本。
- 儲存庫根目錄 — pnpm 不會將根套件自己的 `bin` 連結至 `node_modules/.bin`。此簽出版本的 `.envrc` 會將 `bin/` 新增至 `PATH`，如此一來，在 `direnv allow` 之後，已提交的 `bin/ai-i18n-tools` 包裝器 (位於已發佈的 `bin/ai-i18n-tools.mjs` 填充碼旁) 即可讓您直接執行指令。若未使用 direnv，請使用 `node bin/ai-i18n-tools.mjs …`、`./bin/ai-i18n-tools …` 或根目錄的 `pnpm i18n:*` 指令碼 (或 shell 別名 / `pnpm add -g .`)。
- 獨立的 fixtures (`multi-provider`、`test-markdown`) — 從 fixture 資料夾中，使用 `node ../../bin/ai-i18n-tools.mjs …`。

變更 CLI 原始碼後，請在儲存庫根目錄執行 `pnpm run build`。請參閱[開發指南](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)以了解建置步驟與可選的全域安裝替代方案。

在 Linux、macOS 和 WSL 上，登錄檔安裝會自動為 CLI 指令碼設定可執行位元。在 Windows 上，套件管理器會產生 `.cmd` 和 `.ps1` 代理程式，明確叫用 Node。

下一步：[快速入門](/zh-Hant/guide/quick-start)。
