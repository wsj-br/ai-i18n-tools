<a id="anchor-links"></a>
# 锚点链接

当 `docsOutput.style = "flat"` 时，输出会为每个本地化版本重写页面之间的**相对路径**（`guide.md` → `guide.de.md`）。**锚点链接**——带有路径后跟 `#` 的常规 markdown 内联形式——用于跳转到目标文件中的某个部分：

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

这里链接目标是 `setup.md`，`#first-run` 是锚点：它应该滚动到该文件中的正确标题。

<a id="why-anchor-links-need-attention"></a>
## 为什么锚点链接需要注意

- `rewriteRelativeLinks` 会为每个区域设置修复**文件名**（`setup.md` → `setup.de.md`）。
- 许多渲染器会从**可见的标题文本**派生出`#` slug。翻译后，不同区域的标题会不同，因此自动生成的 slug 可能会发生变化，而重写的链接可能仍然显示`#first-run` — 或者您的英文`#…`锚点不再匹配渲染器根据翻译后的标题构建的 slug。
- 结果：读者会跳转到正确的**文件**但**错误的行**，或者浏览器找不到匹配的标题。

<a id="what-to-do"></a>
## 如何操作

<a id="docusaurus-sites-preferred"></a>
### Docusaurus 站点（首选）

在 [Docusaurus](/zh-Hans/guide/integrations/docusaurus) 文档 (`docsOutput.style = "docusaurus"`) 中，优先使用 Docusaurus 原生的标题 ID，而不是来自 `ai-i18n-tools write-heading-ids` 的 HTML 锚点：

1. 在标题行添加显式 ID，使用 Docusaurus 经典的 `{#…}` 后缀（CommonMark）或 MDX 注释 `{/* #… */}`（对于 `.mdx` 推荐使用），例如 `## TLS configuration {#tls-configuration}` 或 `## TLS configuration {/* #tls-configuration */}`。在 `translate-docs` 期间，只有可见的标题文本会发送给模型——ID 后缀会先被剥离，然后固定回翻译后标题行的**末尾**（Docusaurus 会忽略出现在标题中间的 `{/* #id */}`）。
2. 从 Docusaurus 项目根目录运行 `docusaurus write-heading-ids`（在 `package.json` 中配置时通常为 `pnpm run write-heading-ids`），以为缺少 ID 的标题添加或刷新 ID——对于 `{/* #… */}` 形式，请使用 `--syntax mdx-comment`。或者在相同的 `docs[]` / `contentPaths` 上运行 `ai-i18n-tools write-heading-ids --slug-style mdx-comment`。该命令还会重新定位现有翻译文件中相同的英文 ID（它不会对翻译后的标题进行 slug 处理），并在分段数匹配时更新相应的缓存分段，以便后续的 `sync --force-update` 保留修复后的 ID。重命名标题后请重新运行，以便过时的 ID 能与当前标题匹配。

将你的 markdown **锚点链接** 指向这些稳定的 id，例如 `[label](other.md#tls-configuration)`，其中片段匹配 `{#…}` 或 `{/* #… */}` id——而不是仅从英文单词猜测的 slug。请参阅 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) 以获取使用此模式的已提交文档。

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### 其他布局（扁平、Starlight、VitePress 等）

当你不在 Docusaurus 上，或者你需要 HTML 锚点而不是 `{#…}` / `{/* #… */}` 后缀时：

1. 在 `translate-docs` 之前，对源 `.md` / `.mdx` 运行 `ai-i18n-tools write-heading-ids`（使用与平时相同的 `docs[]` / `contentPaths`）。它会在每个标题前的行中插入显式 HTML 锚点，以便每个翻译副本共享 `id` 值，并将这些相同的英文 ID 复制到现有的翻译文件中。当分段数匹配时，相应的缓存分段也会更新，以便后续的 `sync --force-update` 保留修复后的 ID。重命名标题后请重新运行，以便刷新过时的锚点 ID 使其与当前标题匹配。
2. 将 Markdown **锚点链接**指向这些稳定的 ID，例如 `[label](other.md#section-id)`，其中 `section-id` 需与工具写入的锚点匹配——而不是仅凭英文单词猜测。

<a id="example"></a>
## 示例

<a id="docusaurus------suffix"></a>
### Docusaurus `{#…}` / `{/* #… */}` 后缀

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md`（英文源码，经典）：

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

或者 MDX 首选的注释形式：

```markdown
## TLS configuration {/* #tls-configuration */}

Your CA and cert steps…
```

在 `translate-docs` 之后，链接片段在每个语言环境中保持为 `#tls-configuration`；仅标题文本和链接标签会改变：

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTML 锚点（`write-heading-ids`）

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

运行`write-heading-ids`（简化版）后的`docs/security.md`：

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

运行`translate-docs`后，文件路径和`#…`锚点在每个区域设置文件中都保持一致，例如：

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

由于`id`在源文件中是固定的，因此所有区域设置中的`#tls-configuration`锚点都相同；只有标题**文本**和链接**标签**被翻译。

如果翻译后链接仍然失效，请参阅[故障排除](/zh-Hans/guide/documents/troubleshooting)。
