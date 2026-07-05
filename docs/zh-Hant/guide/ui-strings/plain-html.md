<a id="plain-html-apps"></a>
# 純 HTML 應用程式

<a id="marking-html-for-translation"></a>
## 標記 HTML 以進行翻譯

對於純 HTML 應用程式（標記中沒有 `t("…")` 呼叫），請使用屬性標記可翻譯的元素，並讓 `extract` 從元素本身擷取英文文字 — 無需重複的字串文字。

優先使用簡潔形式（屬性沒有值；來源文字從元素讀取）：

- `data-i18n` — 鍵是元素的 `textContent`；執行階段時您會設定 `el.textContent = t(key)`。
- `data-i18n-title` — 鍵是元素的 `title`；執行階段時您會設定翻譯後的 `title`。
- `data-i18n-placeholder` — 鍵是元素的 `placeholder`。

僅在簡潔形式無法正常運作時才使用帶值形式 `data-i18n="Some key"`：混合內容元素（文字與子標記交錯），或當鍵必須與可見文字不同時。使用 `data-i18n-ignore` 選擇退出某個元素（及其子樹）。

限制：簡潔形式的 `data-i18n` 僅適用於葉片文字元素（單一文字節點，沒有子元素），因為設定 `textContent` 會取代任何子元素。對於像 `Run <code>build</code> now.` 這樣的段落，請改為將每個文字片段包裝在其自己的標記中：

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

手動新增標記，或讓 `mark-html` 命令為您插入簡潔標記。預設為模擬執行 — 它會報告每個檔案會新增多少標記，並列出需要手動 `<span data-i18n>` 的任何混合內容元素 — 僅使用 `--write` 寫入：

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html` 是冪等的，會尊重 `data-i18n-ignore`，從不標記類似程式碼的元素（`code`、`pre`、`kbd`、`samp`、`var`）或空字串/僅數字文字，且從不發出帶值標記。標記後，手動包裝任何報告的混合內容片段，然後新增 `.html` 到 `ui.uiExtractor.extensions`，以便 `extract` 擷取字串：

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="worked-example-localizing-a-plain-html-app-the-bundled-dashboard"></a>
## 實作範例：本地化純 HTML 應用程式（隨附的儀表板）

該套件自帶的翻譯儀表板 (`src/dashboard-app`) 使用相同的標記。它的 `index.html` 包含裸標記，例如：

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract` 會將每個英文來源字串寫入目錄 (`strings.json`)，而 `translate-ui` 則為每個地區設定一個扁平的套件，以英文來源文字作為鍵。對於典型的靜態 HTML 應用程式，您可以將 `ui.flatOutputDir` 指向一個透過網路提供的目錄，例如 `public/locales/`：

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

執行階段時，載入作用中地區設定的套件，並遍歷標記的元素。鍵來自標記值（如果存在），否則來自元素本身的文字/標題/預留位置（以與擷取器正規化空白字元相同的方式正規化）：

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

此程式碼片段中標記遍歷的部分與 [`src/dashboard-app/app.js`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/dashboard-app/app.js) 中的 `applyStaticI18n` 完全相同。由於英文原始文字是目錄鍵，因此未翻譯的字串會自動回退為英文。

隨附儀表板的不同之處：由於它有一個 Node 伺服器，因此它不會擷取靜態 `/locales/{locale}.json`。用戶端呼叫 `GET /api/ui-i18n`，伺服器解析活動語言環境（`--ui-lang` > `AI_I18N_LANG` > 設定 `uiLanguage` > 主機作業系統）並傳回 `{ locale, dir, bundle }`。然後，用戶端從該回應設定 `document.documentElement` `lang`/`dir`（而不是讀取 `lang` 來選擇語言環境），然後呼叫 `applyStaticI18n`。這些套件本身不是工具的翻譯內容 — 它們是儀表板自己的 UI 字串，以 `src/i18n/locales/{locale}.json` 形式發布（在建置時複製到 `dist/i18n/locales`），並由 [`src/i18n/index.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/i18n/index.ts) 中的 `loadUiBundle` 在伺服器端讀取。儀表板的 `t()` 也支援 ```{{name}}``` 插值，這與上面最小的 `t` 不同。
