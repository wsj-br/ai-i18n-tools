<a id="coding-agent-skill"></a>
# 程式碼代理程式技能

一次安裝會複製所有消費者技能。[共用技能](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools) 會教導代理程式如何使用 `sync` 安裝及維護 `ai-i18n-tools`，並且只載入符合任務的參考。每個工作流程都是一個獨立的斜線命令，例如 `/ai-i18n-vitepress`。

安裝 npm 套件或獨立可執行檔並不會註冊技能。每個代理程式請使用一種安裝方法。

<a id="install-with-the-skills-cli"></a>
## 使用技能 CLI 安裝

當 Node.js 版本為 22.20 或更新時，請使用此安裝方法。此套件本身的 CLI 允許 Node.js 22.16，但此版本對於技能 CLI 來說太舊了。在 22.16 到 22.19 版本上，或在沒有 Node.js 的機器上，請使用 [下載技能目錄](#download-the-skill-directory)。

從您希望代理程式工作的專案中：

```bash
npx skills add wsj-br/ai-i18n-tools
```

此命令會安裝 `skills/` 下的所有目錄，包括共用技能和每個工作流程命令。它不會在您的專案中留下此儲存庫的簽出。預設範圍是目前專案。新增 `-g` 以為您的使用者安裝，跨專案使用。

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y` 是一步式安裝：安裝所有技能，無提示。如果沒有 `--all`，安裝程式會詢問要複製哪些技能。`--list` 會列印技能，但不安裝任何東西。`--skill` 和 `-a` 會跳過一個技能和一個代理程式的提示。`npx skills update` 會重新整理以此方式安裝的技能。再次執行 `add` 以取得首次安裝後新增的技能。

若要將技能列印為提示，或使用它啟動支援的代理程式，而不安裝：

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

CLI 會偵測機器上安裝的程式碼代理程式。每個代理程式的安裝路徑都在 [技能 CLI 代理程式清單](https://github.com/vercel-labs/skills/blob/main/docs/agents.md) 中。該清單會變更。本頁面不會重複該清單，也不聲稱每個程式碼工具都會讀取技能資料夾。

技能 CLI 會收集匿名使用資料。設定 `DISABLE_TELEMETRY=1` 或 `DO_NOT_TRACK=1` 以關閉此功能。

安裝後，如果該產品需要重新載入，請啟動新的代理程式工作階段。輸入工作流程命令，例如 `/ai-i18n-vitepress`，或要求代理程式使用 `ai-i18n-tools` 技能。共用技能是未命名命令之請求的備用選項。發現的技能不保證代理程式會自行呼叫它。

<a id="slash-commands"></a>
## 斜線命令

共用 `ai-i18n-tools` 技能會持續供代理程式使用。其他技能是明確的命令。每個技能都遵循共用技能，然後只應用其範本和檢查。

| 命令 | 工作流程 |
| --- | --- |
| `/ai-i18n-js` | JavaScript 或 TypeScript 原始字串 UI |
| `/ai-i18n-python` | 產生的 Python 輔助程式和平面 JSON 目錄 |
| `/ai-i18n-django` | Django、Flask-Babel 或純 gettext |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Astro Starlight 文件 |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | 原生 Astro 網站 |
| `/ai-i18n-plain-html` | 一個 HTML 檔案，在瀏覽器中切換 |
| `/ai-i18n-plain-html-docs` | 每個語系一個 HTML 樹 |
| `/ai-i18n-readme` | README 和儲存庫 Markdown |
| `/ai-i18n-migrate-intlayer` | 從 Intlayer 一次性遷移到 `t()` 呼叫 |
| `/ai-i18n-translate-intlayer` | 就地填寫 Intlayer 字典 |

複製到 `.agents/skills/` 或 `.cursor/skills/` 的技能會顯示為這些指令。目前 Cursor 的一個錯誤會隱藏那些從 `/` 面板設定 `disable-model-invocation` 的市集外掛程式技能。Claude Code、Codex 和 Copilot 仍然會顯示這些指令。當您想在 Cursor 中使用這些指令時，請使用技能 CLI 安裝。一個散文式請求仍然會到達共享技能。

<a id="download-the-skill-directory"></a>
## 下載技能目錄

當技能 CLI 不可用時，請使用此方法。複製每個技能目錄，而不僅僅是 `ai-i18n-tools/`。每個工作流程指令都是一個獨立的資料夾，其中包含一個 `SKILL.md`。一個 git clone 和一個技能路徑的 `npx degit` 都會下載儲存庫原始碼壓縮檔，大約 50 MB。

從 [技能 CLI 代理程式清單](https://github.com/vercel-labs/skills/blob/main/docs/agents.md) 中選擇一個代理程式目錄。以下範例使用 `.agents/skills/`，多個代理程式會讀取它。在替換現有副本之前，請檢查該目標位置。每個代理程式一個副本就足夠了。在同一個代理程式的另一個發現資料夾中的第二個副本是重複的。

npm 套件已經包含這些目錄。當套件安裝後：

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

如果沒有 `node_modules`，請下載 CLI 報告的相同版本的 npm tarball。`ai-i18n-tools --version` 會列印版本，然後是建置時間戳記。只使用版本號碼。tarball 成員是 `package/skills/`。

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

將 `1.12.0` 替換為您已安裝的版本。這適用於當前版本。獨立可執行檔不包含技能檔案。將 tarball 與 `ai-i18n-tools --version` 匹配。

從添加它的版本開始，GitHub Releases 也會附加 `ai-i18n-tools-skill.zip`。該 zip 檔案在其頂層包含每個技能目錄。將其解壓縮到代理程式技能資料夾中，這樣結果就會包含 `ai-i18n-tools/SKILL.md` 和工作流程資料夾，例如 `ai-i18n-vitepress/SKILL.md`。在該 zip 檔案之前發布的版本不包含它。較舊的 zip 檔案只包含 `ai-i18n-tools/`。對於這些版本，請使用 npm tarball。標籤是 `v` 加上 CLI 版本，例如 `v1.12.0`，一旦該標籤的版本具有該資產。

<a id="agents-the-skills-cli-installs"></a>
## 技能 CLI 安裝的代理程式

當您想要一個代理程式時，將 ID 傳遞給 `-a`。對於這些工具，此儲存庫中不需要其他任何東西。

CLI 代理程式：Claude Code (`claude-code`)、Codex CLI (`codex`)、Gemini CLI (`gemini-cli`)、Antigravity CLI (`antigravity-cli`)、GitHub Copilot CLI (`github-copilot`)、OpenCode (`opencode`)、Goose (`goose`)、Qwen Code (`qwen-code`)、Kilo CLI (`kilo`)、Grok Build (`grok`)、Amp (`amp`)、Crush (`crush`)、Pi (`pi`)、Kiro CLI (`kiro-cli`)。

編輯器和 IDE：Cursor (`cursor`)、Windsurf (`windsurf`)、Devin for Terminal (`devin`)、Zed (`zed`)、Antigravity (`antigravity`)、Trae (`trae`)、Junie (`junie`)、Replit (`replit`)、Cline (`cline`)、Roo Code (`roo`)、Kilo Code (`kilo`)、Continue (`continue`)、Augment (`augment`)、Factory Droid (`droid`)、Tabnine CLI (`tabnine-cli`)。編輯器中的 GitHub Copilot 使用與 CLI 相同的 `github-copilot` ID。

兩個容易被忽略的路徑細節：

- Cursor：從 skills CLI 安裝的專案會前往 `.agents/skills/`。`-g` 會前往 `~/.cursor/skills/`。Cursor 自己的文件也接受專案中的 `.cursor/skills/`。請使用其中之一。
- GitHub Copilot：skills CLI 會在專案中寫入 `.agents/skills/`，並為 `-g` 寫入 `~/.copilot/skills/`。GitHub 的雲端代理程式文件也描述了 `.github/skills/`。並非所有 Copilot 聊天都會讀取該資料夾。請僅使用您所用介面中記載的資料夾。

Kiro CLI 的預設代理程式無需額外配置即可載入 `.kiro/skills/` 和 `~/.kiro/skills/`。自訂的 Kiro 代理程式需要 `.kiro/agents/<agent>.json` 中列出的已安裝技能：

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## 原生目錄

有些產品也會從此儲存庫中的目錄安裝技能。每個代理程式請使用一個通道：目錄或 skills CLI。套件升級不會重新整理手動複製的技能。`npx skills update` 會重新整理 skills CLI 的安裝。目錄安裝會遵循該產品的更新命令。

- Cursor Marketplace，在清單獲批後：從 Cursor Marketplace 安裝 `ai-i18n-tools`。在該清單存在之前，請使用 skills CLI。[Cursor Directory](https://cursor.directory) 是一個獨立的社群清單。
- Claude Code，從 Claude Code 會話中：

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- GitHub Copilot CLI：

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

然後從該市集安裝 `ai-i18n-tools` 外掛程式。外掛程式 ID 為 `ai-i18n-tools@ai-i18n-tools`。Copilot CLI 會讀取 Claude Code 使用的相同目錄檔案。

- Codex：

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

ChatGPT 工作區清單由工作區管理員單獨發佈。它與此命令的安裝方式不同。

<a id="agents-without-a-skills-install"></a>
## 未安裝技能的代理程式

這些產品不在 skills CLI 代理程式清單中。此儲存庫不為它們提供單獨的技能資料夾。將代理程式指向專案說明中的 [消費者上下文](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md)，例如 `AGENTS.md`：

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

該檔案使用文件網站和儲存庫 URL，因此當代理程式無法讀取此儲存庫時，該說明仍然有效。對於較舊的 CLI，請在匹配的發行標籤上開啟相同的路徑。消費者專案使用此上下文檔案。當更改此儲存庫時，維護者 `AGENTS.md` 適用。

此組中的產品：Aider、gptme、Amazon Q Developer CLI、DeepSeek Harness、JetBrains AI Assistant、Sourcegraph Cody、Qodo、Tabnine IDE 外掛程式、CodeGeeX 和 AskCodi。Junie 是 JetBrains 代理程式，它確實接受 skills CLI 安裝。Tabnine CLI 也是如此。AiderDesk 是與 Aider 不同的應用程式。

CodeLayer 和 Superset 沒有自己的技能目錄。CodeLayer 運行 Claude Code，因此請為 Claude Code 安裝技能。Superset 運行您配置的 CLI 代理程式，因此請為這些代理程式安裝技能。

<a id="stay-on-the-same-version"></a>
## 保持相同版本

將技能保持與 `ai-i18n-tools` 命令相同的版本。npm 升級和較新的獨立可執行檔會將手動複製的技能保留在原處。從匹配的版本再次安裝技能，或運行 `npx skills update` 進行 skills CLI 安裝。

線上文件可能描述了比您已安裝命令更新的版本。對於旗標，請優先使用 `ai-i18n-tools --help`。進一步參考：[安裝](/zh-Hant/guide/installation)、[配置](/zh-Hant/reference/configuration)、[提供者](/zh-Hant/guide/providers-and-models)、[CLI 參考](/zh-Hant/reference/cli-commands/)。
