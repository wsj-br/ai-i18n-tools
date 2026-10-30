---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  透過引導式設定、AI 翻譯和快取重新執行，將您的單一語言應用程式、網站或儲存庫文件變成多語言。從 JavaScript、TypeScript、Python
  或 README 開始。
hero:
  name: ai-i18n-tools
  text: 將您的單一語言專案變成多語言。
  tagline: 透過引導式設定和 AI 翻譯，為您的應用程式、網站或存放庫文件新增語言。選擇您的供應商和模型，並在專案成長時重複使用快取的翻譯。
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools 標誌
  actions:
    - theme: brand
      text: 選擇您的專案
      link: '#start-here'
    - theme: alt
      text: 探索範例
      link: /zh-Hant/examples
---



<a id="start-with-the-project-you-have"></a>
## 從您現有的專案開始

今天只有一種語言？從這裡開始。該語言可以是任何語言：將其設定為 `sourceLocale`。在這些指南中，英文是一個常見的範例。國際化 (i18n) 為您的專案做好支援不同語言的準備；這些指南將帶您從設定到首次翻譯體驗，包括您的儲存庫已在 GitHub、GitLab 或任何其他主機上顯示的 README。

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="javascript-or-typescript-app"></a>
### JavaScript 或 TypeScript 應用程式

將純文字按鈕、標籤和訊息變成多語言 UI。設定您的執行階段、標記要翻譯的文字，並連接語言切換功能。包含用於準備步驟的編碼代理提示。

React · Next.js · Node.js · CLI

[為 JS/TS 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-app"></a>
### Python 應用程式

將使用者可見文字包裝起來，並透過產生的輔助工具載入翻譯訊息。已經在使用 Django 或 GNU gettext 了嗎？保留您的 gettext 呼叫，讓工具填入 `.po` 檔案。從獨立的可執行檔執行翻譯 CLI，無需另外安裝 Node.js。

Streamlit · FastAPI · Flask · Django · CLI

[為 Python 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-python) · [為 Django / Python gettext 應用程式新增 i18n](/zh-Hant/guide/add-i18n-to-django-gettext)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="website-or-documentation"></a>
### 網站或文件

發佈本地化頁面，並將它們連接到您網站的語言路由。遵循框架特定的步驟，以設定導覽、主題標籤和語言選單。

VitePress · Starlight · Docusaurus · Astro

[為網站或文件網站新增 i18n](/zh-Hant/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="repository-readme-and-docs"></a>
### 儲存庫 README 與文件

將 `README.md` 和其他 Markdown 檔案翻譯成每種語言一個檔案，並在檔案之間加上一排連結。將其與您應用程式的 UI 字串配對，或單獨翻譯 README。

GitHub · GitLab · Bitbucket

[為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)

</article>
</div>

不確定哪條路徑適合您？[為您的專案新增 i18n](/zh-Hant/guide/add-i18n-to-your-project) 列出了每個詳細教學。[查看 ai-i18n-tools 的功能](/zh-Hant/guide/what-is-ai-i18n-tools) 以了解管線如何組合在一起。

<a id="from-setup-to-your-first-new-language"></a>
## 從設定到您的第一個新語言

<div class="home-steps">

1. **準備您的專案。** 選擇您的語言、翻譯供應商以及要嘗試的模型。對於應用程式，標記使用者可見文字並設定翻譯執行階段。對於網站，啟用您框架的語言路由。指南中包含需要修改原始碼時的程式碼代理提示。
2. **翻譯成可用的檔案。** 設定完成後，執行 `sync`。它會提取支援的應用程式字串、翻譯您啟用的內容，並寫入地區設定檔案或本地化頁面。
3. **載入、檢查並繼續。** 將輸出連接到您的應用程式或網站，設定語言切換，並檢查目標語言。原始碼變更後重新執行，以翻譯新增或變更的文字。

</div>

您可以手動或透過編碼代理來處理執行階段和路由設定。CLI 負責處理擷取、翻譯、驗證和檔案生成 — 而非自動重寫原始碼或安裝語言切換器。[遵循完整的快速入門](/zh-Hant/guide/quick-start)。

<a id="your-source-text-ready-for-more-languages"></a>
## 您的來源文字。為更多語言做好準備。

此 JS/TS 說明範例顯示了執行階段設定與翻譯後的結果樣貌。標記來源字串可使其被探索；每個產生的語系檔案會將該句子對應至其翻譯。

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

原始碼中的句子保持可讀性。您的應用程式會在執行階段載入產生的地區設定檔案。想要查看完整的連接方式嗎？[探索運作中的 Next.js 範例](/zh-Hant/examples#nextjs-app)。網站則遵循不同的路徑：[產生本地化頁面](/zh-Hant/guide/add-i18n-to-website)，而不是包裝每個段落。

<a id="built-for-the-next-update-too"></a>
## 也為下一次更新而建置

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="choose-your-provider-and-models"></a>
### 選擇您的供應商和模型

使用支援的供應商，例如 OpenAI、Anthropic、OpenRouter、Gemini、本機 Ollama 或其他九個內建選項。您也可以使用任何與 OpenAI 相容的供應商。翻譯品質遵循模型清單 (`translationModels`，加上每個地區設定的覆寫)。`suggest-models` 以及儀表板 **模型** 下的相同排名，會從已發布的翻譯基準建立該清單。

[LLM 供應商](/zh-Hant/guide/providers-and-models) · [AI 模型](/zh-Hant/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="reuse-work-already-done"></a>
### 重複使用已完成的工作

快取的翻譯讓重新執行時能專注於新增或變更的文字，而無須再次翻譯所有內容。

[維持翻譯](/zh-Hant/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="review-ai-output-locally"></a>
### 在本機檢閱 AI 輸出

在「翻譯儀表板」中檢查翻譯、修正措辭並管理術語。

[查看儀表板](/zh-Hant/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="keep-app-and-content-together"></a>
### 將應用程式與內容放在一起

透過單一設定檔，翻譯應用程式訊息、文件、巢狀的地區設定 JSON 以及 SVG 文字標籤。只啟用您需要的功能。

[結合管線](/zh-Hant/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="translate-the-readme-with-the-app"></a>
### 使用應用程式翻譯 README

單一 `sync` 即可涵蓋 UI 字串和儲存庫的 Markdown，並將語言列寫入 README 中。

[為您的 README 和 Markdown 文件新增 i18n](/zh-Hant/guide/add-i18n-to-readme)

</article>
</div>

<a id="see-a-working-project-first"></a>
## 先看看可運作的專案

這些範例包含設定和已提交的翻譯檔案。無需 API 金鑰即可探索輸出結果；重新執行翻譯需要已設定的提供者，且通常需要金鑰。本機的 Ollama 不需要 API 金鑰。

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="a-multilingual-app"></a>
### 多語言應用程式

在一個可運作的 Next.js 專案中，查看 React 元件、執行階段的串接、複數形式和語言切換。

[探索 Next.js 範例](/zh-Hant/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-in-practice"></a>
### Python 實務

查看 Streamlit 應用程式如何包裝其訊息，並在不新增 JavaScript 執行階段的情況下使用翻譯後的 JSON。

[探索 Streamlit 範例](/zh-Hant/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="docs-in-more-languages"></a>
### 更多語言的文件

查看翻譯後的 VitePress 頁面，以及本地化的導覽和主題標籤。

[探索 VitePress 範例](/zh-Hant/examples#vitepress-docs)

</article>
</div>

[瀏覽所有可執行的範例](/zh-Hant/examples)，包括純 HTML、其他框架以及現有的 i18n 工作流程。

<a id="already-have-i18n-keep-what-works"></a>
## 已經有 i18n？保留可行的部分。

您不必從頭來過。

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="source-string-calls"></a>
### 來源字串呼叫

保留專案中既有的 `t()` 與 gettext 呼叫。

[JS/TS UI 字串](/zh-Hant/guide/ui-strings/) · [Python 與 gettext](/zh-Hant/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="json-bundles"></a>
### JSON 套件

翻譯巢狀的語系檔案，包含 i18next 命名空間。網站導覽和主題目錄屬於[文件翻譯](/zh-Hant/guide/add-i18n-to-website#what-gets-translated)，而非此路徑。

[翻譯 JSON 套件](/zh-Hant/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="intlayer-dictionaries"></a>
### Intlayer 字典

保留 Intlayer 並填補缺少的翻譯，或將應用程式移至來源字串呼叫。

[就地翻譯](/zh-Hant/guide/translating-intlayer) · [遷移至來源字串呼叫](/zh-Hant/guide/migrating-from-intlayer)

</article>
</div>

也有圖表嗎？與您的應用程式或文件一起[翻譯 SVG 文字標籤](/zh-Hant/guide/svg-translation/)。

<a id="ready-to-add-your-first-language"></a>
## 準備好新增您的第一種語言了嗎？

<div class="home-cta">

[選擇您的專案](#start-here) 以取得完整的逐步解說，或[開啟快速入門](/zh-Hant/guide/quick-start) 以進行安裝與設定。

為 Node.js 專案安裝 [npm 套件](/zh-Hant/guide/installation)。

<a id="python-no-nodejs"></a>

若為 Python，請[下載獨立執行檔](/zh-Hant/guide/installation#standalone-executables)——無需另外安裝 Node.js。

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="go-deeper-when-you-need-to"></a>
## 需要時可深入了解

[整合](/zh-Hant/guide/integrations/) · [LLM 供應商](/zh-Hant/guide/providers-and-models) · [AI 模型](/zh-Hant/guide/ai-models) · [設定](/zh-Hant/reference/configuration) · [CLI 參考](/zh-Hant/reference/cli-commands/)

<br/>

<br/>

::: info 關於本站
非英文介面與文件是使用 ai-i18n-tools 翻譯的。AI 翻譯可能包含錯誤。

所有產品名稱、標誌和商標均為其各自所有者的財產。圖示和名稱僅用於識別目的。本專案與這些品牌沒有任何附屬關係，也未受其認可。
:::
