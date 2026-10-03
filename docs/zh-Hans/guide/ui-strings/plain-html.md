<a id="plain-html-apps"></a>
# 纯 HTML 应用程序

对于保持为单个 HTML 文件的交互式页面，请使用此路径。`extract` 将 `data-i18n*` 标记读取到 `strings.json` 中，`translate-ui` 为每个语言环境写入一个扁平的 JSON 资源包，然后由浏览器脚本应用这些字符串。该脚本还可以为图片文件名添加后缀，并将链接保留在当前页面上。

对于应为每个语言环境生成一个已翻译 HTML 文件的静态站点（无运行时，重写跨页链接），请改用 [HTML 页面](/zh-Hans/guide/documents/html-pages)。一个文件仅属于一条路径。

<a id="quick-start"></a>
## 快速开始

1. 使用 `ai-i18n-tools init -t ui-plain-html` 搭建脚手架，或添加以下配置。
2. 标记源 HTML（或让 `mark-html` 自动完成）。
3. 将 `ui.sourceRoots` 和 `ui.uiExtractor.extensions` 指向这些文件。
4. 运行 `extract`，然后运行 `translate-ui`（或使用 `sync-ui` 同时运行两者）。
5. 将 `i18n.js` 复制到页面同级目录，并在您自己的脚本之前加载它。
6. 通过 HTTP 托管该文件夹。`file://` 无法 `fetch` 区域设置 JSON。

```bash
ai-i18n-tools mark-html public/index.html --write
ai-i18n-tools extract
ai-i18n-tools translate-ui
# Equivalent to the previous two commands:
ai-i18n-tools sync-ui
```

`ai-i18n-tools.config.json` 示例：

```json
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

脚手架还会添加 `translate-ui` 使用的 LLM [提供程序配置](/zh-Hans/guide/providers-and-models)；上方将其省略，以便突出显示特定于 HTML 的设置。

`extract` 管理 `strings.json` 并写入 `ui-languages.json`；`translate-ui` 管理目标区域设置 JSON 文件。请勿手动编辑这些生成的文件。

`flatOutputDir` 是生成的区域设置文件所在的目录。脚本的 `data-locales-base` 必须将该目录指向为相对于 `i18n.js`（而非页面）的 URL。在 `public/i18n.js` 上使用 `./locales` 作为基础路径会加载 `public/locales/pt-BR.json`。请使用相对基础路径，以确保网站在部署子路径下仍能正常工作。

<a id="obtain-the-runtime"></a>
## 获取运行时

`i18n.js` 是一个传统脚本（非模块）。请复制以下其中之一；它们是同一个文件：

- 安装包后的 `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js`
- [examples/plain-html/public/i18n.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/plain-html/public/i18n.js)
- [运行时源代码](#runtime-source) 下的列表

在 `<body>` 的末尾加载它，然后再加载您自己的脚本。将 `class="i18n-pending"` 放在 `<html>` 上，并在设置该类时隐藏 body，以免源语言闪烁：

```html
<html lang="en" class="i18n-pending">
  <head>
    <style>
      html.i18n-pending body { visibility: hidden; }
    </style>
  </head>
  <body>
    <!-- page -->
    <script
      src="i18n.js"
      data-source-locale="en"
      data-locales-base="./locales"
      data-storage-key="ai-i18n-locale"
      data-locale-select="#locale-select"
      data-label-mode="native"
    ></script>
    <script src="app.js"></script>
  </body>
</html>
```

根据您的需求调整脚本属性：

| 属性 | 默认值 | 作用 |
| --- | --- | --- |
| `data-source-locale` | `en` | 保留英文 HTML 并跳过资源包获取的语言环境 |
| `data-locales-base` | `./locales` | `ui-languages.json` 和 `{locale}.json` 的目录，根据脚本 URL 解析 |
| `data-storage-key` | `ai-i18n-locale` | `localStorage` 键 |
| `data-locale-select` | （无） | 要从清单填充的 `<select>` 的 CSS 选择器 |
| `data-locale-list` | （无） | 要用语言链接填充的元素的 CSS 选择器 |
| `data-label-mode` | `native` | `native`（清单 `label`）、`english`（`englishName`）或 `both`（当它们不同时的 `englishName / label`） |

`window.i18n` 公开了 `t(key)`、`locale`、`dir`、`apply()`、`setLocale(code)` 和 `ready`（一个 Promise）。在您自己的脚本依赖于已解析的区域设置或翻译值之前，请等待 `ready`。在插入新的标记元素后调用 `apply()`。

<a id="marking-html-for-translation"></a>
## 标记 HTML 以进行翻译

建议优先使用裸标记。英文源文本保留在元素上，且该文本即为目录键。`extract` 会读取它；运行时会将翻译写回到同一属性上。

- `data-i18n` — 键为 `textContent`。运行时设置 `textContent`。
- `data-i18n-title` — 键为 `title`。
- `data-i18n-placeholder` — 键为 `placeholder`。
- `data-i18n-alt` — 键为 `alt`。
- `data-i18n-aria-label` — 键为 `aria-label`。

一个元素可以包含多个此类标记。每个标记都是其独立的目录条目。

<a id="text"></a>
### 文本

将 `data-i18n` 放在内容仅为文本的元素上：

```html
<title data-i18n>Plain HTML demo</title>
<h1 data-i18n>Plain HTML demo</h1>
<button type="button" data-i18n>Apply</button>
<option value="" data-i18n>All locales</option>
<th data-i18n>Filepath</th>
<figcaption data-i18n>Sample usage chart</figcaption>
```

运行时还会从 `<title>` 元素设置 `document.title`。请勿将 `data-i18n` 放在混合内容容器上：运行时会赋值给 `textContent`，这将移除其子元素。

<a id="tooltip"></a>
### 工具提示

```html
<select title="Filter by locale" data-i18n-title></select>
```

控件可以将其标签和工具提示作为两个键进行翻译：

```html
<button type="button" title="Clear the filters" data-i18n data-i18n-title>Clear</button>
```

<a id="placeholder"></a>
### 占位符

```html
<input type="search" placeholder="Filename (partial)" data-i18n-placeholder />
```

同一字段上的占位符和工具提示：

```html
<input
  type="text"
  placeholder="Filename (partial)"
  title="Filter by filepath"
  data-i18n-placeholder
  data-i18n-title
/>
```

<a id="alt-text"></a>
### 替代文本

```html
<img src="chart.png" alt="Sample usage chart" width="577" height="139" data-i18n-alt />
```

<a id="accessible-name"></a>
### 无障碍名称

```html
<button type="button" aria-label="Close dialog" data-i18n-aria-label>×</button>
```

按钮标签 `×` 没有 `data-i18n`，因此保持原样。无障碍名称是被翻译的字符串。

<a id="mixed-content"></a>
### 混合内容

`data-i18n` 读取元素的整个 `textContent`。当一个句子与另一个元素共享其父元素时，请包裹每个文本段：

```html
<p>
  <span data-i18n>Run</span> <code>mark-html</code>
  <span data-i18n>to add bare markers.</span>
</p>
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select"></select>
</label>
```

<a id="source-language-only"></a>
### 仅限源语言

`data-i18n-ignore` 会跳过该元素及其后代元素的 `mark-html` 和 UI 字符串 `extract`。请将其用于示例行、标识符和品牌名称：

```html
<a
  href="https://github.com/wsj-br/ai-i18n-tools"
  aria-label="wsj-br/ai-i18n-tools on GitHub"
  data-i18n-ignore
>
  <span>wsj-br/ai-i18n-tools</span>
</a>
<tbody data-i18n-ignore>
  <tr>
    <td>public/index.html</td>
    <td>pt-BR</td>
  </tr>
</tbody>
```

<a id="a-different-catalog-key"></a>
### 不同的目录键

带值标记会命名目录键。运行时仍会将翻译写入元素（或命名的属性）：

```html
<button type="button" data-i18n="Save changes">Save</button>
<img src="chart.png" alt="Chart" data-i18n-alt="Sample usage chart" />
```

`mark-html` 会插入上述裸标记。除非传入 `--write`，否则这只是一次试运行。它会跳过 `data-i18n-ignore` 子树、类似代码的元素（`code`、`pre`、`kbd`、`samp`、`var`）以及空文本或纯数字文本。它会报告包含混合内容的父元素，并留给您使用 `<span data-i18n>` 进行包裹。它绝不会写入带值标记。

运行时在首次执行时会将每个源键记录在内部的 `data-i18n-source` 属性上，因此后续切换区域设置时仍会查找英文字符串。这些属性不会被提取。

<a id="locale-specific-images-and-links"></a>
## 特定于区域设置的图片和链接

这些标记永远不会发送给翻译人员。`mark-html` 不会添加它们。

- `data-i18n-locale-src` — 裸标记：`chart.png` 变为 `chart-pt-BR.png`（区域代码插入在扩展名之前）。带值标记：值为模板。[`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) 使用 `chart_{locale}.png`，它变为 `chart_pt-BR.png`。
- `data-i18n-locale-href` — 追加 `?locale=`，以便链接保留在同一个 HTML 文件中。

```html
<img
  src="chart.png"
  alt="Sample usage chart"
  data-i18n-alt
  data-i18n-locale-src="chart_{locale}.png"
/>
<a href="about.html" data-i18n-locale-href>About</a>
```

源区域保留原始 URL。对于裸 `data-i18n-locale-src`，绝对 URL、协议相对 URL、`data:` URL 和 `#` 片段保持不变；查询字符串和片段保留在原位。带值标记会对每个非源区域使用其模板，并且仅替换 `{locale}`。如果本地化图片出现 404 错误，运行时会恢复一次原始 `src`。您需要自行发布 `chart_pt-BR.png`；脚本不会创建它。

`data-i18n-locale-href` 适用于此目录模型。指向 `about.pt-BR.html` 的链接属于 [HTML 页面](/zh-Hans/guide/documents/html-pages) 流水线。

<a id="language-selector"></a>
## 语言选择器

将 `data-locale-select` 指向一个空的 `<select>`。运行时会根据 `ui-languages.json` 的每一行填充一个 `<option>`（`code`、`label`、`englishName`、`direction`）。更改选择项会调用 `setLocale`，该函数会保存所选内容，使用 `history.pushState` 更新 `?locale=`（无需重新加载），获取语言包，重新应用所有标记，并设置 `<html lang>` 和 `dir`。后退按钮会重新应用 URL 中的区域设置。

`data-locale-list` 对链接执行相同操作（`lang`、`hreflang` 以及活动链接上的 `aria-current`）。这些链接用于切换目录页；它们不是由文档管道写入的逐文件链接。一个 script 标签可以同时设置这两个选择器：

```html
<label for="locale-select">
  <span data-i18n>Language</span>
  <select id="locale-select" title="Switch UI language" data-i18n-title></select>
</label>
<nav id="locale-list"></nav>
<script
  src="i18n.js"
  data-source-locale="en"
  data-locales-base="./locales"
  data-locale-select="#locale-select"
  data-locale-list="#locale-list"
  data-label-mode="native"
></script>
```

将两个控件留空。对于此清单，`data-label-mode="native"` 将葡萄牙语标记为 `Português (Brasil)`。`english` 将其标记为 `Portuguese (Brazil)`。`both` 将其标记为 `Portuguese (Brazil) / Português (Brasil)`，由于这两个名称不同，请参见下面来自 `ui-languages.json` 的代码片段：

```json
[
  {
    "code": "en",
    "label": "English",
    "englishName": "English",
    "direction": "ltr"
  },
  {
    "code": "pt-BR",
    "label": "Português (Brasil)",
    "englishName": "Portuguese (Brazil)",
    "direction": "ltr"
  }
]
```

使用 `?locale=pt-BR` 时，运行时会替换 select 的选项和列表的子元素。您在这些元素上设置的属性保持不变：

```html
<select id="locale-select" title="Switch UI language" data-i18n-title>
  <option value="en" lang="en">English</option>
  <option value="pt-BR" lang="pt-BR" selected>Português (Brasil)</option>
</select>
<nav id="locale-list">
  <a href="#" lang="en" hreflang="en">English</a>
  <a href="#" lang="pt-BR" hreflang="pt-BR" aria-current="true">Português (Brasil)</a>
</nav>
```

当该区域处于活动状态时，`"direction": "rtl"` 行会在 `<html>` 上设置 `dir="rtl"`。

请勿在此基础上额外通过 `navigator.language` 进行自动重定向。运行时仅在 URL 和 `localStorage` 未指定语言时才会使用浏览器语言。忽略 URL 的重定向会增加分享特定区域设置链接和爬取页面的难度。

`ui-languages.json` 由 `extract` 或 `generate-ui-languages` 写入 `languagesManifestPath`（默认为 `{ui.flatOutputDir}/ui-languages.json`）。请参阅[语言切换器与 RTL](/zh-Hans/guide/ui-strings/language-switcher)。

<a id="troubleshooting"></a>
## 故障排除

| 问题现象 | 排查方法 |
| --- | --- |
| 区域文件未加载 | 使用本地服务器打开站点。`file://` 会阻止 `fetch`；运行时会回退到源文本。 |
| `ui-languages.json` 返回 404 | `data-locales-base` 是相对于 `i18n.js` 的。它必须与 `flatOutputDir` 匹配。 |
| `{locale}.json` 出现 404 错误 | 为该区域运行 `translate-ui`，并检查区域代码是否与其文件名完全匹配。 |
| 字符串在 `/docs/` 下仍显示为英文 | 同样是基础路径问题。除非区域设置目录位于主机根目录，否则请避免使用前导 `/`。 |
| 英文短暂闪现，随后被翻译 | 在 `<html>` 上添加 `class="i18n-pending"` 以及上述可见性规则。 |
| 第二次切换时将已翻译的字符串显示为键 | 加载已发布的 `i18n.js`。它会在替换文本前保存 `data-i18n-source`。 |
| RTL 布局未翻转 | 清单行需要 `"direction": "rtl"`。运行时仅在 `<html>` 上设置 `dir`。 |
| 新增 DOM 节点仍显示为英文 | 请在插入这些节点后调用 `window.i18n.apply()`。 |
| 图片在葡萄牙语中仍为 `chart.png` | 该元素需要 `data-i18n-locale-src`，且区域不能是源区域。 |

运行时中的 `normalizeI18nText` 与 [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) 中的 `normalizeI18nText` 匹配：去除首尾空格，然后合并空白字符。由于英文源文本是目录键，缺失的翻译将回退为英文。

可运行的演示为 [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/)。`pnpm dev` 在 [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) 上提供此服务。

<a id="runtime-source"></a>
## 运行时源

```javascript
/* global document, window, localStorage, fetch, URLSearchParams, URL, history, navigator, PopStateEvent */
/**
 * Drop-in catalog runtime for plain HTML.
 *
 * Classic script (not a module) so `document.currentScript` is available.
 * Configure with data-* attributes on the script tag:
 *   data-source-locale, data-locales-base, data-storage-key,
 *   data-locale-select, data-locale-list, data-label-mode
 *
 * `data-locales-base` resolves against this script's URL, not the page URL.
 * Put class="i18n-pending" on <html> and hide the body while that class is set
 * to avoid a flash of source-locale text.
 */
(function () {
  "use strict";

  var TEXT_SOURCE_ATTR = "data-i18n-source";

  function runtimeScript() {
    if (document.currentScript) return document.currentScript;
    var marked = document.querySelectorAll(
      "script[data-ai-i18n-runtime], script[data-source-locale], script[data-locales-base]"
    );
    return marked.length > 0 ? marked[marked.length - 1] : null;
  }

  var scriptEl = runtimeScript();

  function attr(name, fallback) {
    if (!scriptEl) return fallback;
    var value = scriptEl.getAttribute(name);
    return value === null || value === "" ? fallback : value;
  }

  var SOURCE_LOCALE = attr("data-source-locale", "en");
  var LOCALES_BASE_ATTR = attr("data-locales-base", "./locales");
  var STORAGE_KEY = attr("data-storage-key", "ai-i18n-locale");
  var SELECT_SEL = attr("data-locale-select", "");
  var LIST_SEL = attr("data-locale-list", "");
  var LABEL_MODE = attr("data-label-mode", "native");

  function resolveLocalesBase() {
    var baseUrl = scriptEl && scriptEl.src ? scriptEl.src : window.location.href;
    return new URL(LOCALES_BASE_ATTR, baseUrl).href.replace(/\/$/, "");
  }

  var LOCALES_BASE = resolveLocalesBase();
  var I18N = { locale: SOURCE_LOCALE, dir: "ltr", bundle: {} };
  var languages = [];
  var titleKey = "";
  var selectBound = false;

  /**
   * Collapse insignificant whitespace. MUST stay identical to `normalizeI18nText`
   * in `src/extractors/html-i18n-marks.ts` and `src/dashboard-app/app.js`.
   */
  function normalizeI18nText(s) {
    return s.trim().replace(/\s+/g, " ");
  }

  function normalizeLocaleCode(code) {
    if (!code) return "";
    var parts = String(code).split("-");
    if (parts.length === 1) return parts[0].toLowerCase();
    return parts[0].toLowerCase() + "-" + parts.slice(1).join("-");
  }

  function isSourceLocale(locale) {
    return normalizeLocaleCode(locale) === normalizeLocaleCode(SOURCE_LOCALE);
  }

  function t(key) {
    var raw = I18N.bundle[key];
    return typeof raw === "string" && raw.length > 0 ? raw : key;
  }

  function findLanguage(code) {
    var norm = normalizeLocaleCode(code);
    for (var i = 0; i < languages.length; i++) {
      if (normalizeLocaleCode(languages[i].code) === norm) return languages[i];
    }
    return undefined;
  }

  function resolveLocale() {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("locale");
    if (fromUrl) return fromUrl;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* private mode */
    }
    var browser = navigator.language || (navigator.languages && navigator.languages[0]) || SOURCE_LOCALE;
    var match = findLanguage(browser);
    return match ? match.code : SOURCE_LOCALE;
  }

  function loadJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      return res.ok ? res.json() : null;
    });
  }

  function labelFor(row) {
    var native = row.label || row.code;
    var english = row.englishName || native;
    if (LABEL_MODE === "english") return english;
    if (LABEL_MODE === "both") return english === native ? english : english + " / " + native;
    return native;
  }

  function sourceAttrName(attrName) {
    return attrName ? TEXT_SOURCE_ATTR + "-" + attrName : TEXT_SOURCE_ATTR;
  }

  function rememberKey(el, attrName, marker) {
    var stored = el.getAttribute(sourceAttrName(attrName));
    if (stored) return stored;
    var valued = el.getAttribute(marker);
    var key = valued
      ? valued
      : attrName
        ? normalizeI18nText(el.getAttribute(attrName) || "")
        : normalizeI18nText(el.textContent || "");
    if (key) el.setAttribute(sourceAttrName(attrName), key);
    return key;
  }

  function applyTextMarkers(selector, attrName, write) {
    var marker = attrName ? "data-i18n-" + attrName : "data-i18n";
    document.querySelectorAll(selector).forEach(function (el) {
      var key = rememberKey(el, attrName, marker);
      if (key) write(el, t(key));
    });
  }

  function isSkippableUrl(url) {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
  }

  function withLocaleSuffix(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var hash = url.indexOf("#");
    var fragment = hash >= 0 ? url.slice(hash) : "";
    var pathQuery = hash >= 0 ? url.slice(0, hash) : url;
    var q = pathQuery.indexOf("?");
    var path = q >= 0 ? pathQuery.slice(0, q) : pathQuery;
    var query = q >= 0 ? pathQuery.slice(q) : "";
    return path.replace(/(\.[^./]+)$/, "-" + locale + "$1") + query + fragment;
  }

  function applyLocaleTemplate(template, locale) {
    return template.split("{locale}").join(locale);
  }

  function withLocaleQuery(url, locale) {
    if (!url || isSourceLocale(locale) || isSkippableUrl(url)) return url;
    var next = new URL(url, window.location.href);
    next.searchParams.set("locale", locale);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return next.href;
    return next.pathname + next.search + next.hash;
  }

  function applyLocaleSrc() {
    document.querySelectorAll("[data-i18n-locale-src]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-src-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("src") || "";
        el.setAttribute(baseAttr, raw);
      }
      var valued = el.getAttribute("data-i18n-locale-src") || "";
      var next = raw;
      if (!isSourceLocale(I18N.locale)) {
        next = valued ? applyLocaleTemplate(valued, I18N.locale) : withLocaleSuffix(raw, I18N.locale);
      }
      if (next) el.setAttribute("src", next);
      if (el.tagName === "IMG" && !el.hasAttribute("data-i18n-src-fallback-bound")) {
        el.setAttribute("data-i18n-src-fallback-bound", "");
        el.addEventListener("error", function onErr() {
          var original = el.getAttribute(baseAttr);
          if (original && el.getAttribute("src") !== original) el.setAttribute("src", original);
          el.removeEventListener("error", onErr);
        });
      }
    });
  }

  function applyLocaleHref() {
    document.querySelectorAll("[data-i18n-locale-href]").forEach(function (el) {
      var baseAttr = "data-i18n-locale-href-base";
      var raw = el.getAttribute(baseAttr);
      if (raw === null) {
        raw = el.getAttribute("href") || "";
        el.setAttribute(baseAttr, raw);
      }
      el.setAttribute("href", isSourceLocale(I18N.locale) ? raw : withLocaleQuery(raw, I18N.locale));
    });
  }

  function applyStaticI18n() {
    applyTextMarkers("[data-i18n]", "", function (el, text) {
      el.textContent = text;
    });
    applyTextMarkers("[data-i18n-title]", "title", function (el, text) {
      el.setAttribute("title", text);
    });
    applyTextMarkers("[data-i18n-placeholder]", "placeholder", function (el, text) {
      el.setAttribute("placeholder", text);
    });
    applyTextMarkers("[data-i18n-alt]", "alt", function (el, text) {
      el.setAttribute("alt", text);
    });
    applyTextMarkers("[data-i18n-aria-label]", "aria-label", function (el, text) {
      el.setAttribute("aria-label", text);
    });
    applyLocaleSrc();
    applyLocaleHref();
    if (titleKey) document.title = t(titleKey);
  }

  function fillSelect(select) {
    var previous = select.value;
    select.replaceChildren();
    languages.forEach(function (row) {
      var opt = document.createElement("option");
      opt.value = row.code;
      opt.textContent = labelFor(row);
      opt.lang = row.code;
      if (normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale)) opt.selected = true;
      select.appendChild(opt);
    });
    if (!select.value && previous) select.value = previous;
    if (!selectBound) {
      selectBound = true;
      select.addEventListener("change", function () {
        void setLocale(select.value);
      });
    }
  }

  function fillList(list) {
    list.replaceChildren();
    languages.forEach(function (row) {
      var link = document.createElement("a");
      link.href = "#";
      link.textContent = labelFor(row);
      link.lang = row.code;
      link.hreflang = row.code;
      var active = normalizeLocaleCode(row.code) === normalizeLocaleCode(I18N.locale);
      if (active) link.setAttribute("aria-current", "true");
      link.addEventListener("click", function (event) {
        event.preventDefault();
        void setLocale(row.code);
      });
      list.appendChild(link);
    });
  }

  function renderSelectors() {
    if (SELECT_SEL) {
      var select = document.querySelector(SELECT_SEL);
      if (select) fillSelect(select);
    }
    if (LIST_SEL) {
      var list = document.querySelector(LIST_SEL);
      if (list) fillList(list);
    }
  }

  function syncUrl(locale) {
    var url = new URL(window.location.href);
    if (isSourceLocale(locale)) url.searchParams.delete("locale");
    else url.searchParams.set("locale", locale);
    history.pushState({ locale: locale }, "", url.pathname + url.search + url.hash);
  }

  function setLocale(code, opts) {
    var push = !opts || opts.push !== false;
    I18N.locale = code;
    var langRow = findLanguage(code);
    I18N.dir = langRow && langRow.direction === "rtl" ? "rtl" : "ltr";
    var bundlePromise = isSourceLocale(code)
      ? Promise.resolve(null)
      : loadJson(LOCALES_BASE + "/" + encodeURIComponent(code) + ".json");
    return bundlePromise.then(function (bundle) {
      I18N.bundle = bundle && typeof bundle === "object" && !Array.isArray(bundle) ? bundle : {};
      document.documentElement.setAttribute("lang", (langRow && langRow.code) || code);
      document.documentElement.setAttribute("dir", I18N.dir);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* private mode */
      }
      applyStaticI18n();
      renderSelectors();
      if (push) syncUrl(code);
      document.documentElement.classList.remove("i18n-pending");
    });
  }

  function onPopState() {
    var params = new URLSearchParams(window.location.search);
    void setLocale(params.get("locale") || SOURCE_LOCALE, { push: false });
  }

  if (window.__aiI18nPop) window.removeEventListener("popstate", window.__aiI18nPop);
  window.__aiI18nPop = onPopState;
  window.addEventListener("popstate", onPopState);

  function captureTitleKey() {
    var titleEl = document.querySelector("title");
    if (!titleEl) {
      titleKey = normalizeI18nText(document.title || "");
      return;
    }
    titleKey =
      titleEl.getAttribute(TEXT_SOURCE_ATTR) ||
      titleEl.getAttribute("data-i18n") ||
      normalizeI18nText(titleEl.textContent || "");
    if (titleKey) titleEl.setAttribute(TEXT_SOURCE_ATTR, titleKey);
  }

  function initI18n() {
    document.documentElement.classList.add("i18n-pending");
    captureTitleKey();
    return loadJson(LOCALES_BASE + "/ui-languages.json").then(function (manifest) {
      languages = Array.isArray(manifest) ? manifest : [];
      return setLocale(resolveLocale(), { push: false });
    });
  }

  var ready = initI18n().catch(function () {
    applyStaticI18n();
    document.documentElement.classList.remove("i18n-pending");
  });

  window.i18n = {
    t: t,
    get locale() {
      return I18N.locale;
    },
    get dir() {
      return I18N.dir;
    },
    apply: applyStaticI18n,
    setLocale: function (code) {
      return setLocale(code);
    },
    ready: ready,
  };
})();
```
