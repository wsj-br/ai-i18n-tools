<a id="translation-dashboard"></a>
# 翻译仪表板

翻译仪表板是一个本地 Web UI，用于检查和编辑项目的翻译数据。它从三个存储中读取：

- **SQLite 缓存** (`cacheDir`) — 文档段翻译、失败记录、Markdown 问题扫描
- **`strings.json`** — UI 字符串目录（纯字符串和复数组）
- **用户词汇表 CSV** (`glossary.userGlossary`) — `translate-ui` 和 `proofread-ui` 的术语提示

在翻译运行后使用它来查找问题、覆盖错误输出或检查缓存覆盖率 — 无需手动深入研究 SQLite 或 JSON。

<a id="start-the-dashboard"></a>
## 启动仪表板

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

默认监听端口是 **8675**。如果该端口不可用，服务器将尝试下一个端口（最多尝试 1000 次）并记录所选端口。已弃用的别名 `editor` 仍然可用，但会显示警告 — 请优先使用 `dashboard`。

仪表板 UI 使用与 CLI 相同的区域设置解析方式：`-L` / `--ui-lang` → `AI_I18N_LANG` → 配置 `uiLanguage` → 操作系统区域设置。请参阅[工具 UI 语言](/guide/tool-ui-language)。

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## 我应该使用哪个选项卡？

| 我想… | 选项卡 | 指南 |
| --- | --- | --- |
| 修复翻译失败的文档段 | **失败** | [失败](/guide/translation-dashboard/failures) |
| 在翻译前修复源 Markdown | **Markdown 问题** | [Markdown 问题](/guide/translation-dashboard/markdown-issues) |
| 覆盖缓存的文档翻译 | **文档** | [文档缓存](/guide/translation-dashboard/documentation-cache) |
| 修复 UI 标签 | **UI 字符串** | [UI 字符串和复数](/guide/translation-dashboard/ui-strings) |
| 修复复数形式 (`one`、`other`、…) | **UI 复数** | [UI 字符串和复数](/guide/translation-dashboard/ui-strings) |
| 锁定 UI 翻译的术语 | **词汇表** | [词汇表](/guide/translation-dashboard/glossary) |
| 查看缓存覆盖率和模型使用情况 | **统计** | [统计](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## 编辑后

| 您编辑了… | 然后运行… | 避免… |
| --- | --- | --- |
| 文档缓存行 | `sync --force-update` 或 `translate-docs --force-update` | — |
| UI 字符串或复数 | 纯 `sync` 或 `translate-ui` | `--force`（覆盖 `user-edited` 行） |
| 词汇表行 | 下一个 `translate-ui` 或 `proofread-ui` | — |

**文档（SQLite 缓存）** — 手动编辑在缓存中用模型 `user-edited` 标记。对未更改的源重新运行 `translate-docs` 或 `sync` 会重用缓存的翻译（无 LLM 调用）。运行 `sync --force-update` 或 `translate-docs --force-update` 以从缓存刷新磁盘上的 Markdown。仅当您想绕过缓存并从 LLM 重新翻译（覆盖手动修复）时才使用 `--force`。

**UI 字符串 (`strings.json`)** — 手动编辑在 `models[locale]` 中用 `user-edited` 标记。重新运行 `translate-ui` 或 `sync` 会跳过已存在翻译的条目。在 UI 命令上使用 `--force` 以重新翻译并覆盖手动修复。

<a id="tips"></a>
## 提示

- **日志链接按钮**（表格行中的 🔗）会将文件:行提示打印到运行 `ai-i18n-tools dashboard` 的**终端**中 — 这对于从浏览器跳转到编辑器非常有用。如果您正在使用基于 VS Code 的 IDE（如 Cursor、Antigravity 等），您可以 `CTRL`-点击终端窗口中的文件:行链接，以在指定行打开文件。
- **关闭**（选项卡栏的右上角）会正常关闭仪表板服务器。
- 如果服务器在浏览器选项卡仍打开时停止，则会出现一个覆盖层。重新启动 `ai-i18n-tools dashboard` 以重新连接，或者如果您已完成仪表板操作，则关闭窗口。
