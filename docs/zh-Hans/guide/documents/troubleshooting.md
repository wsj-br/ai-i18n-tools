<a id="troubleshooting"></a>
# 故障排除

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## 翻译文档中的章节锚点链接不起作用

像 `[label](other.md#section-id)` 这样的链接可能会打开正确的翻译文件，但无法滚动到目标标题 — 或跳转到错误的章节。片段 `#…` 在该区域设置中不再匹配任何标题 `id`。

常见原因：

- 源标题从未有过显式的锚点 ID；网站从可见的标题文本派生 slug，而该文本在翻译后会发生变化。
- 您在源文件中重命名了标题，但前面的 `<a id="…"></a>` 行丢失或仍是旧 ID。
- 锚点链接使用了根据英文单词猜测的 `#…` 片段，而不是 `write-heading-ids` 会生成的 ID。

**修复**

1. 在你的 **源** `.md` / `.mdx`（与 `translate-docs` 相同的 `docs[]` / `contentPaths`）上运行 `ai-i18n-tools write-heading-ids`。默认情况下，它会在每个 ATX 标题之前插入 `<a id="slug"></a>`，或者在标题文本不再与当前 slug 匹配时刷新现有锚点。对于 Docusaurus MDX 注释 id，请使用 `--slug-style mdx-comment`。
2. 将锚点链接指向这些 id —— 例如 `[setup](guide.md#first-run)`，其中 `#first-run` 与目标标题上方的锚点行匹配，而不是仅从英文标题推断出的 slug。
3. 重新运行 `translate-docs`（或 `sync --force-update`），以便每个语言环境的副本都包含更新后的锚点行。

首先在 `write-heading-ids` 上使用 `--dry-run` 预览更改。有关完整模式，请参阅[锚点链接](/zh-Hans/guide/documents/anchor-links)。

<a id="image-or-asset-links-404-in-translated-docs"></a>
## 翻译文档中的图片或资产链接 404

Markdown 链接或 `![alt](url)` 在英文版中有效，但在翻译版本中返回 404 错误 — 通常是因为 URL 仍然指向源语言环境文件夹或仅限英文的静态路径。

**修复**

1. 确认您的资产布局与您的 `docsOutput.style` 匹配（扁平式与文档系统）。请参阅[链接重写](/zh-Hans/guide/documents/link-rewriting)和[图片与截图](/zh-Hans/guide/images-and-screenshots/)。
2. 添加或调整 `docsOutput.postProcessing.regexAdjustments` 以交换区域设置段或桥接绝对 `/img/…` 路径。对于扁平式布局，请记住扁平链接重写器在 **之前** 运行 `regexAdjustments` — 根据已添加前缀的 URL 匹配模式。
3. 确保区域设置特定的资产文件存在于重写后的 markdown 引用的路径中（`translate-docs` 重写 URL 但不复制栅格文件）。

<a id="hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters"></a>
## 印地语、阿拉伯语、CJK 或西里尔文输出被罗马化（拉丁字母）

某些模型会翻译含义，但将结果以拉丁/罗马字母书写（例如将印地语写为 `Namaste` 而非 `नमस्ते`）。不带后缀的 `hi` 表示天城文；仅当您需要罗马化印地语时才使用 `hi-Latn`。

**修复**

1. 确认区域设置代码与您想要的脚本匹配（`hi` vs `hi-Latn`、`zh-Hans` vs `zh-Hant`、`sr` vs `sr-Latn`）。
2. 重新运行翻译以拒绝脚本错误的缓存行：对于 UI 字符串，请使用 `translate-ui --force`；或者使用 `translate-docs --check-cache` / `sync --check-cache`（仅当区域设置具有预期脚本时，才会绕过文件级跳过；有效的片段缓存仍会重复使用）。`--force-update` 会重新处理所有区域设置。
3. 如果某个模型持续无法通过脚本检查，请为该区域设置添加一个 `localeModels` 条目，以便首先尝试更强大的模型 — 请参阅 [AI 模型](/zh-Hans/guide/ai-models#model-fallback-chain)。
