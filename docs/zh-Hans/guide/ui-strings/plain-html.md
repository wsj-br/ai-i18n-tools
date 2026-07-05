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
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## 实例：本地化纯 HTML 应用程序（捆绑仪表板）

该软件包自带的翻译仪表板 (`src/dashboard-app`) 使用相同的标记。它的 `index.html` 包含裸标记，例如：

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` 将每个英文源字符串写入目录 (`strings.json`)，然后 `translate-ui` 为每个区域设置一个扁平化包，以英文源文本作为键。对于典型的静态 HTML 应用，您可以将 `ui.flatOutputDir` 指向一个 Web 服务器目录，例如 `public/locales/`：

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

运行时，加载活动区域设置的包，并遍历标记的元素。键来自标记值（如果存在），否则来自元素本身的文本/标题/占位符（以提取器规范化空格的相同方式进行规范化）：

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

此代码段中标记遍历的一半与 [`applyStaticI18n`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js) 中的 `src/dashboard-app/app.js` 完全相同。由于英文源文本是目录键，因此未翻译的字符串会自动回退到英文。

捆绑仪表板的不同之处：因为它有一个 Node 服务器，所以它不获取静态 `/locales/{locale}.json`。客户端调用 `GET /api/ui-i18n`，服务器解析活动区域设置（`--ui-lang` > `AI_I18N_LANG` > 配置 `uiLanguage` > 主机操作系统）并返回 `{ locale, dir, bundle }`。然后，客户端从该响应中设置 `document.documentElement` `lang`/`dir`（而不是读取 `lang` 来选择区域设置），然后调用 `applyStaticI18n`。捆绑包本身不是该工具的翻译内容，它们是仪表板自己的 UI 字符串，随 `src/i18n/locales/{locale}.json`（在构建时复制到 `dist/i18n/locales`）一起提供，并由 [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts) 中的 `loadUiBundle` 在服务器端读取。仪表板的 `t()` 还支持 ```{{name}}``` 插值，这与上面最小的 `t` 不同。
