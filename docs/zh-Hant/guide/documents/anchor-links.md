<a id="anchor-links"></a>
# 錨點連結

當 `docsOutput.style = "flat"` 時，輸出會為每個地區重寫頁面之間的 **相對路徑**（`guide.md` → `guide.de.md`）。**錨點連結** — 通常的 markdown 行內形式，在路徑後加上 `#` — 會跳轉到目標檔案內的某個部分：

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

這裡連結目標是 `setup.md`，而 `#first-run` 是錨點：它應該會捲動到該檔案內的正確標題。

<a id="why-anchor-links-need-attention"></a>
## 為何錨點連結需要注意

- `rewriteRelativeLinks` 會修正每個地區設定檔的 **檔名**（`setup.md` → `setup.de.md`）。
- 許多渲染器會從 **顯示的標題文字**衍生出 `#` 縮寫。翻譯後，標題在不同地區設定檔中會有所不同，因此自動產生的縮寫可能會變更，但重寫的連結可能仍會顯示 `#first-run` — 或者您英文的 `#…` 錨點不再符合渲染器根據翻譯後標題建立的縮寫。
- 結果：讀者會連到正確的 **檔案**，但卻是 **錯誤的行**，或者瀏覽器找不到符合的標題。

<a id="what-to-do"></a>
## 該怎麼做

<a id="docusaurus-sites-preferred"></a>
### Docusaurus 網站（首選）

在 [Docusaurus](/zh-Hant/guide/integrations/docusaurus) 文件（`docsOutput.style = "docusaurus"`）中，請優先使用 Docusaurus 的原生標題 ID，而非 `ai-i18n-tools write-heading-ids`：

1. 在標題行上使用 Docusaurus 的 `{#…}` 後綴加入明確的 id，例如 `## TLS configuration {#tls-configuration}`。在 `translate-docs` 期間，只會翻譯可見的標題文字 —— `{#tls-configuration}` 後綴在每個語言環境中都會保留。
2. 從你的 Docusaurus 專案根目錄（通常是在 `package.json` 中設定時的 `pnpm run write-heading-ids`）執行 `docusaurus write-heading-ids`，為缺少後綴的標題新增或重新整理 `{#…}` 後綴。重新命名標題後請重新執行，讓過時的 id 符合目前的標題。

將你的 markdown **錨點連結**指向這些穩定的 id，例如 `[label](other.md#tls-configuration)`，其中的片段符合 `{#…}` 後綴 —— 而非僅從英文單詞猜測的 slug。請參閱 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) 以查看使用此模式的已提交文件。

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### 其他版面配置（扁平、Starlight、VitePress 等）

當你不在 Docusaurus 上，或者你需要 HTML 錨點而非 `{#…}` 後綴時：

1. 在 `translate-docs` 之前，先對您的原始 `.md` / `.mdx` 執行 `ai-i18n-tools write-heading-ids`（使用與平常相同的 `docs[]` / `contentPaths`）。它會在每個標題前插入明確的 HTML 錨點，以便 `id` 值能在所有翻譯後的副本中共享。在重新命名標題後重新執行，以確保過時的錨點 ID 會更新以符合目前的標題。
2. 將您的 markdown **錨點連結**指向這些穩定的 ID，例如 `[label](other.md#section-id)`，其中 `section-id` 應符合該工具寫入的錨點 — 而非僅憑英文單字猜測。

<a id="example"></a>
## 範例

<a id="example-docusaurus"></a>
### Docusaurus `{#…}` 後綴

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md`（英文來源）：

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

在 `translate-docs` 之後，連結片段在每個語言環境中都保持為 `#tls-configuration`；只有標題文字和連結標籤會改變：

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTML 錨點（`write-heading-ids`）

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

執行 `write-heading-ids` 後的 `docs/security.md`（簡化版）：

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

執行 `translate-docs` 後，檔案路徑和 `#…` 錨點在每個地區設定檔中都會保持一致，例如：

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

由於 `id` 在原始檔中是固定的，因此所有地區設定檔中的 `#tls-configuration` 錨點都相同；只有標題 **文字** 和連結 **標籤** 會被翻譯。

如果翻譯後連結仍然失效，請參閱[疑難排解](/zh-Hant/guide/documents/troubleshooting)。
