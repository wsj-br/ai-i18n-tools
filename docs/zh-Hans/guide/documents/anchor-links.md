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

1. 在`translate-docs`之前，先在您的源`.md` / `.mdx` 上运行`ai-i18n-tools write-heading-ids`（与平常的`docs[]` / `contentPaths`相同）。它会在每个标题前插入显式的 HTML 锚点，这样`id`值在所有翻译后的副本中都是共享的。重命名标题后请重新运行，以确保过时的锚点 ID 会刷新以匹配当前标题。
2. 将您的 markdown **锚点链接**指向这些稳定的 ID，例如 `[label](other.md#section-id)`，其中 `section-id` 匹配工具写入的锚点 — 而不是仅凭英文单词猜测。

<a id="example"></a>
## 示例

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

如果翻译后链接仍然失效，请参阅[故障排除](/guide/documents/troubleshooting)。
