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
ai-i18n-tools mark-html public/index.html

# Apply the bare markers
ai-i18n-tools mark-html public/index.html --write
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

<a id="worked-example-localizing-a-plain-html-app"></a>
## 實際範例：本機 HTML 應用程式的本地化

此 [`examples/plain-html`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/) 工作區範例是一個可執行的靜態應用程式，從頭到尾使用這些標記。請使用 `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` 複製它，執行 `pnpm install` 和 `pnpm dev`，然後開啟 [http://localhost:3090/?locale=pt-BR](http://localhost:3090/?locale=pt-BR) 以查看葡萄牙文（巴西）版本。

其 `public/index.html` 攜帶裸露的標記，例如：

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

`ai-i18n-tools.config.json` 在 `public/` 處指向擷取作業，並將扁平套件寫入靜態檔案旁邊：

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

`extract` 將每個英文來源字串寫入目錄 (`public/strings.json`)，而 `translate-ui` 為每個地區設定填入一個扁平套件，以英文來源文字作為索引鍵：

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

在執行階段，`public/app.js` 載入 `/locales/ui-languages.json` 以取得地區設定中繼資料，解析作用中的地區設定 (`?locale=` → `localStorage` → 瀏覽器 → `en`)，擷取 `/locales/{locale}.json`（英文會跳過），然後逐一處理標記的元素。索引鍵來自標記值（若存在），否則來自元素本身的文字 / 標題 / 預留位置（正規化方式與擷取器正規化空白的方式相同）：

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

`normalizeI18nText` 必須與 [`src/extractors/html-i18n-marks.ts`](https://github.com/wsj-br/ai-i18n-tools/blob/main/src/extractors/html-i18n-marks.ts) 中的 `normalizeI18nText` 保持一致。由於英文來源文字作為目錄索引鍵，未翻譯的字串會自動回退至英文。

附帶的 [翻譯儀表板](https://github.com/wsj-br/ai-i18n-tools/tree/main/src/dashboard-app) 對其 HTML 標記使用相同的 `applyStaticI18n` 演算法，但從 `GET /api/ui-i18n` 而非靜態 `/locales/{locale}.json` 檔案提供地區設定套件。請參閱範例的 [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) 以了解完整工作流程、專案架構和比較表。
