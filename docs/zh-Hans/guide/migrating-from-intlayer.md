<a id="migrating-from-intlayer"></a>
# 从 Intlayer 迁移

正在从 [Intlayer](https://intlayer.org/) 迁移？此命令会将您现有的翻译字典以及应用中最基础的翻译用法迁移至 ai-i18n-tools。它会自动执行安全的更新，并针对仍需您处理的事项生成清晰的报告。这样您就可以逐步完成迁移，而无需事先了解所有差异。

已在使用 i18next JSON 翻译文件？您无需使用此迁移命令；请改用 [JSON 管道](/zh-Hans/guide/json#i18next-namespace-files)。

<a id="what-migrate-intlayer-does"></a>
## `migrate-intlayer` 的作用

1. 解析 `*.content.ts` 默认导出（`key` + `content` + `t({ locale: '…' })` 个叶节点）。
2. 使用源区域设置文本和字典中已有的任何翻译来填充 `ui.stringsJson` 以及 `ui.flatOutputDir` 下的各区域设置文件。导入的行没有 `models` 字段（它们未在此运行中进行机器翻译）。
3. 重写**安全**调用点：
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. 保持其他所有内容（动态键、JSX 展开、链式 `.replace().replace()`、解构）不变。报告会列出这些调用点及其确切表达式、具体的 `t()` 或 JSX 替换方案，以及要添加的 `import { t } from '…';` 行。
5. 默认进行试运行。传递 `--write` 以应用目录填充和安全重写。报告始终会被写入。它还会列出字典文件以及在手动重写后需要删除的残留 `useIntlayer` / `IntlayerProvider` 用法、仍需要 `extract` 然后 `translate-ui` 的目录键，以及用于覆盖应用 i18n 模块的运行时引导代码。

<a id="migrate-your-project"></a>
## 迁移您的项目

1. 安装 `ai-i18n-tools`（请参阅[安装](/zh-Hans/guide/installation)）。如果您的项目还没有 `ai-i18n-tools.config.json`，请使用脚手架创建一个：

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

修改 `sourceLocale` 和 `targetLocales` 以匹配 Intlayer 字典中已有的区域设置，并将 `ui.sourceRoots`、`ui.stringsJson`、`ui.flatOutputDir` 设置为指向应用的源代码和所需目录路径——与 `translate-ui` 使用的键相同，请参阅 [UI 字符串 — 第 1 步：初始化](/zh-Hans/guide/ui-strings/#step-1-initialise)。
2. 首先进行试运行：`ai-i18n-tools migrate-intlayer`（不带 `--write`）。阅读 `migrate-intlayer-report.md` 以查看其发现的内容以及在更改任何文件之前哪些调用点需要手动审查。
3. 运行 `ai-i18n-tools migrate-intlayer --write` 以填充 `ui.stringsJson` / `ui.flatOutputDir` 并重写安全的调用点。
4. 将重新生成的报告 `migrate-intlayer-report.md` 提供给 AI 编程智能体（推荐），或者按照以下步骤自行处理：

- 报告末尾包含一个 **分步待办事项**：使用其中显示的具体 `t('…')`/JSX 完成每个需手动审查的调用点，添加 `import { t } from '…';` 行，然后删除报告中列出的剩余 `*.content.ts` 文件以及 `useIntlayer` / `IntlayerProvider` 用法。
   - 将报告中的运行时引导代码粘贴并覆盖应用的 i18n 模块。在区域设置控件中，先调用 `loadLocale(next)`，然后调用 `i18n.changeLanguage(next)`——`loadLocale` 仅注册扁平化包，不会切换活动语言。
   - 对于报告中标记为新增的任何源字符串，运行 `ai-i18n-tools extract` 然后运行 `ai-i18n-tools translate-ui`（或 `sync`）。`extract` 还会写入 `ui-languages.json`（引导代码会导入该文件），因此即使没有添加新字符串，也必须在启动应用前运行它。请勿手动编辑 `strings.json`、扁平化区域设置文件或 `ui-languages.json`——这些文件由上述命令管理。
   - 完成报告的清理列表且应用在 ai-i18n-tools 上运行后，移除 `intlayer` / `react-intlayer` 依赖项和字典文件。

<a id="run-the-example"></a>
## 运行示例

上述步骤适用于任何 Intlayer 项目。[intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) 示例通过一个小型的 Vite + React 应用演示了这些步骤，涵盖了基础（可自动重写）和复杂（需人工审查）的用例，以便您在自己的代码上尝试之前查看报告和运行时引导代码。`intlayer-pristine/` 永远不会被修改；`src/` 是工作副本。

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

将 `migrate-intlayer-report.md` 交给 AI 编程代理（或自行编辑标记的文件）。报告包含用于覆盖 `src/i18n.ts` 的运行时模块。在区域设置控件中，先调用 `loadLocale(next)`，然后调用 `i18n.changeLanguage(next)`。`loadLocale` 仅注册扁平包。

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` 首先运行 `extract`，它会写入 `ui-languages.json`。引导程序会导入该文件，因此请在提取完成后再启动应用。请勿手动编辑 `strings.json`、扁平化区域设置文件或 `ui-languages.json`。

`pnpm reset` 将 `intlayer-pristine/` 复制回 `src/` 并清除生成的目录，以便您可以重新开始。

完整演练：[examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md)。

<a id="command"></a>
## 命令

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

需要在配置中设置 `ui.stringsJson` 和 `ui.flatOutputDir`（与 `translate-ui` 相同）。不会调用 LLM。

| 选项 | 含义 |
| --- | --- |
| `[paths...]` | 要扫描的文件/目录/通配符（默认：`ui.sourceRoots`） |
| `--write` | 填充目录并改写安全的调用点（默认：试运行） |
| `--report <path>` | 报告路径（默认：`migrate-intlayer-report.md`） |
| `--content-glob <glob>` | 字典文件名 glob（默认值：`**/*.content.ts`） |
| `--t-import <specifier>` | 生成的 `t()` 的导入说明符（默认：如果 `src/i18n.ts` 存在则为相对路径 `./i18n`，否则为 `i18next`） |

在 `--write` 之后，完成报告中需要人工审核的站点，删除未使用的 `*.content.ts` 文件及其列出的 `IntlayerProvider` 包装器，粘贴运行时引导程序，并从区域设置控件调用 `i18n.changeLanguage`。对于报告中标记为新增的源字符串，先运行 `extract`，然后运行 `translate-ui`（或 `sync`）。`extract` 还会写入 `ui-languages.json`，引导程序会导入该文件。请勿手动编辑 `strings.json`、扁平化区域设置文件或 `ui-languages.json`。

**另请参阅：**[CLI — UI 字符串](/zh-Hans/reference/cli-commands/ui-strings#migrate-intlayer)，[接入 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)
