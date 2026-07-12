<a id="plain-html-apps"></a>
# 纯 HTML 应用程序

<a id="marking-html-for-translation"></a>
## 标记 HTML 以进行翻译

对于纯 HTML 应用（标记中没有 `t("…")` 调用），请使用属性标记可翻译元素，并让 `extract` 从元素本身捕获英文文本 — 无需重复的字符串字面量。

优先使用裸露形式（属性无值；源文本从元素读取）：

- `data-i18n` — 键是元素的 `textContent`；运行时您设置 `el.textContent = t(key)`。
- `data-i18n-title` — 键是元素的 `title`；运行时您设置翻译后的 `title`。
- `data-i18n-placeholder` — 键是元素的 `placeholder`。

仅当裸露形式无法奏效时，才使用带值的形式 `data-i18n="Some key"`：混合内容元素（文本与子标签交错），或当键必须与可见文本不同时。使用 `data-i18n-ignore` 排除某个元素（及其子树）。

约束：裸露的 `data-i18n` 仅用于叶子文本元素（单个文本节点，无子元素），因为设置 `textContent` 会替换任何子元素。对于像 `Run <code>build</code> now.` 这样的段落，请改用自己的标记包装每个文本片段：

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

手动添加标记，或让 `mark-html` 命令为您插入裸露标记。默认情况下它是一个试运行 — 它会报告每个文件将添加多少标记，并列出需要手动 `<span data-i18n>` 的任何混合内容元素 — 仅使用 `--write` 进行写入：

```bash
# Preview (no changes written)
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
```

`mark-html` 是幂等的，尊重 `data-i18n-ignore`，从不标记类似代码的元素（`code`、`pre`、`kbd`、`samp`、`var`）或空/仅数字文本，并且从不发出带值的标记。标记后，手动包装任何报告的混合内容片段，然后添加 `.html` 到 `ui.uiExtractor.extensions`，以便 `extract` 捕获字符串：

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app"></a>
## 实战示例：本地化纯 HTML 应用

[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) 工作区示例是一个可运行的静态应用，端到端地使用了这些标记。使用 `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` 克隆它，运行 `pnpm install` 和 `pnpm dev`，然后打开 [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) 以查看葡萄牙语（巴西）。

其 `public/index.html` 包含如下原始标记：

```html
<button type="button" id="btn-apply" data-i18n>Apply</button>
<input
  type="text"
  id="filter-filename"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-title
  data-i18n-placeholder
/>
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers, then</span> <code>extract</code>
  <span data-i18n>and</span> <code>translate-ui</code><span data-i18n>.</span>
</p>
```

`ai-i18n-tools.config.json` 将提取目标指向 `public/`，并将扁平化包写入静态文件旁边：

```jsonc
{
  "sourceLocale": "en",
  "targetLocales": ["es", "fr", "pt-BR"],
  "features": { "translateUIStrings": true },
  "ui": {
    "sourceRoots": ["public"],
    "stringsJson": "public/strings.json",
    "flatOutputDir": "public/locales",
    "uiExtractor": { "extensions": [".html"] }
  }
}
```

`extract` 将每个英语源字符串写入目录 (`public/strings.json`)，而 `translate-ui` 为每个区域设置填充一个扁平化包，以英语源文本为键：

```bash
pnpm i18n:extract        # public/index.html markers → public/strings.json
pnpm i18n:translate-ui   # strings.json → public/locales/{locale}.json
```

```jsonc
// public/locales/pt-BR.json
{
  "Apply": "Aplicar",
  "Filename (partial)": "Nome do arquivo (parcial)",
  "Filter by filepath": "Filtrar por caminho do arquivo",
  "Run": "Execute",
  "to add bare markers, then": "para adicionar marcadores simples, depois",
  "and": "e",
  ".": "."
}
```

在运行时，`public/app.js` 加载 `/locales/ui-languages.json` 以获取区域设置元数据，解析当前活动的区域设置 (`?locale=` → `localStorage` → 浏览器 → `en`)，获取 `/locales/{locale}.json`（英语跳过此步骤），然后遍历带标记的元素。如果存在标记值，则键来自标记值，否则来自元素自身的文本 / 标题 / 占位符（其规范化方式与提取器规范化空白字符的方式相同）：

```javascript
function normalizeI18nText(s) {
  return s.trim().replace(/\s+/g, " ");
}

function t(key) {
  const raw = I18N.bundle[key];
  return typeof raw === "string" && raw.length > 0 ? raw : key;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || normalizeI18nText(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || normalizeI18nText(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key =
      el.getAttribute("data-i18n-placeholder") ||
      normalizeI18nText(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
}
```

`normalizeI18nText` 必须与 [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) 中的 `normalizeI18nText` 保持一致。由于英语源文本是目录键，未翻译的字符串会自动回退到英语。

内置的 [翻译仪表板](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) 对其 HTML 标记使用相同的 `applyStaticI18n` 算法，但从 `GET /api/ui-i18n` 而不是静态 `/locales/{locale}.json` 文件提供区域设置包。有关完整的工作流程、项目布局和比较表，请参阅示例的 [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md)。
