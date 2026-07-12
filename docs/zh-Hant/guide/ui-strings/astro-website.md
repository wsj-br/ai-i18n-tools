<a id="astro-website"></a>
# Astro 網站

對於靜態 Astro 行銷或應用程式網站（純 Astro，非 Starlight），請將 [Astro 內建 i18n 路由](https://docs.astro.build/en/guides/internationalization/) 與 ai-i18n-tools 結合使用。另請參閱 [Astro 整合](/zh-Hant/guide/integrations/astro)。

參考實作是 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（另請參閱其 [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md))：英文位於 `/`，九個目標語系位於 `/{locale}/` (`de`、`fr`、`es`、`ar`、`ja`、`ko`、`zh-cn`、`zh-tw`、`pt-br`)。

<a id="hybrid-pipelines"></a>
## 混合管線

大多數團隊使用兩種管道的**混合**（它們不會衝突）：

| 管道 | 用途 | 命令 | 輸出 |
|----------|---------|----------|--------|
| **頁面 HTML** | 範本主體中的標題、段落、導覽標籤、內嵌陣列 | `translate-docs` | 每種語言 `src/pages/{locale}/index.astro` |
| **UI 字串（`t()`）** | Frontmatter 資料、螢幕截圖標籤、共用陣列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（英文來源作為金鑰）|

新增或移除語言時，請保持三個清單對齊：`targetLocales` 在 `ai-i18n-tools.config.json` 中，`i18n.locales` 在 `astro.config.mjs` 中（Astro 使用 **小寫** 路由代碼，例如 `pt-br`），以及 `ui-languages.json`（透過 `generate-ui-languages`）。扁平化套件 **檔案名稱** 使用組態大小寫 (`pt-BR.json`)；透過您的資訊清單 `code` 欄位將 Astro 的 `pt-br` 路由對應到該檔案（請參閱 `examples/astro-website/src/i18n/locale.ts`）。

範例 `package.json` 腳本（來自參考專案）：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## UI 字串 (SSG)

使用 `init -t ui-astro-website` 搭建 UI 擷取，然後在您也翻譯頁面 HTML 時合併到 `docs[]` 區塊中（請參閱 [解析並取代頁面](#astro-website-pages-parse-and-replace))。將 TypeScript 模組中的 `t('…')` 和 `.astro` 前置內容（以及當您偏好 UI 字串而非重複的地區設定頁面時的範本 `{expression}` 區塊）中的文字包裝起來：

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

將 `sourceLocale` 設定為與 `astro.config.mjs` 中的 `i18n.defaultLocale` 相符。將 flat bundles 寫入 Astro 在建置時可以匯入的目錄（模板使用 `public/locales/`）。**建置時**透過查找英文來源文字串作為金鑰來解析 `t('…')`（請參閱 `examples/astro-website/src/i18n/t.ts`；`strings.json` 是提取快取，而不是運行時 bundle）。除非您新增在載入後切換語言的用戶端 islands，否則靜態網站**不需要** `ai-i18n-tools/runtime` 或 i18next。

連接每個呼叫 `t()` 的頁面（英文根頁面和每個 `src/pages/{locale}/` 的副本）：

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

範例中的支援輔助函式：`src/i18n/utils.ts`、`src/i18n/locale.ts` 與 `ui-languages.json` 用於標籤、方向與 BCP-47 代碼。變更 `targetLocales` 後執行 `generate-ui-languages`（可選擇設定 `languagesManifestPath`，讓資訊清單與您的輔助函式放在一起，例如 `src/i18n/ui-languages.json`）。`MainLayout.astro` 會從 `resolveUiLanguage(Astro.currentLocale)` 設定 `<html lang>` 與 `<html dir>`；`LanguagePicker.astro` 會使用來自 `astro:i18n` 的 `getRelativeLocaleUrl`。

<a id="pages-parse-and-replace"></a>
## 頁面（解析並取代）

對於在 `.astro` 檔案中有硬式編碼 HTML 的行銷頁面，讓 `translate-docs` 提取文字節點和屬性（`alt`、`title`、`aria-label`、`placeholder`），使用文件快取翻譯它們，並在您的頁面樹下寫入特定地區設定的副本。對於大多數可見的文字，您**不需要** `t()`。

結構屬性和鍵值預設**不會**翻譯：內建保護涵蓋 JSX/HTML 屬性，例如 `class`、`id`、`style`、`src`、`href`、`data-*` 和大多數 `aria-*`，以及範本 `{expression}` 區塊內的物件鍵，例如 `class`、`key` 和 `id`。當您使用自訂屬性（例如 Tailwind `variant` 或 CMS `slug` 欄位）時，請使用 `docs[].protectAttributes` 和 `docs[].protectKeys` 擴展這些清單。相同的選項適用於 Markdown 翻譯期間的 MDX JSX（請參閱 [protectAttributes / protectKeys](/zh-Hant/reference/configuration#protectattributes-protectkeys))。

啟用 `features.translateDocs` 並新增一個 `docs[]` 區塊，例如：

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

執行 `ai-i18n-tools translate-docs`（或在 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 中執行 `pnpm i18n:translate`）。英文原始碼保留在 `src/pages/index.astro`；每個目標地區設定會取得 `src/pages/{locale}/index.astro`，並調整匯入以適應額外的目錄層級（例如 `../layouts/` → `../../layouts/`）。

在 **範本主體** 內部，當 `{expression}` 區塊（內聯陣列、物件 `title`/`desc` 欄位）中的字串常值面向使用者時，它們會被翻譯；受保護屬性/鍵上的引號值、`t('…')`、`<script>` 和 `<style>` 內部的常值保持不變。**前置內容 TypeScript 不會**透過此路徑翻譯 — 保持英文和地區設定頁面上的共享前置內容（包括 `t()` 匯入和資料陣列）相同，或在編輯英文頁面後重新執行 `translate-docs`，以便地區設定副本擷取前置內容變更。對於僅限前置內容的副本，請改用 [UI 字串管線](#astro-website-ui-strings-ssg)。

請參閱 [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) 以取得完整的混合登陸頁面（HTML 透過 `translate-docs`，螢幕截圖標籤透過 `t()` + `translate-ui`）。
