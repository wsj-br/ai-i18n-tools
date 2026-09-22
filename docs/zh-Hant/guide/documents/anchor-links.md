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

在 [Docusaurus](/zh-Hant/guide/integrations/docusaurus) 文件 (`docsOutput.style = "docusaurus"`) 中，請優先使用 Docusaurus 原生的標題 ID，而不是來自 `ai-i18n-tools write-heading-ids` 的 HTML 錨點：

1. 在標題列新增明確的 id，使用 Docusaurus 經典的 `{#…}` 後綴 (CommonMark) 或 MDX 註解 `{/* #… */}`（建議用於 `.mdx`），例如 `## TLS configuration {#tls-configuration}` 或 `## TLS configuration {/* #tls-configuration */}`。在 `translate-docs` 期間，只有可見的標題文字會傳送至模型 — 系統會先剝離 id 後綴，然後將其附加回翻譯後標題列的**結尾**（Docusaurus 會忽略落在標題中間的 `{/* #id */}`）。
2. 從您的 Docusaurus 專案根目錄執行 `docusaurus write-heading-ids`（在 `package.json` 中整合時通常為 `pnpm run write-heading-ids`），以便在缺少 id 的標題上新增或重新整理 id — 使用 `--syntax mdx-comment` 來處理 `{/* #… */}` 格式。或者，在相同的 `docs[]` / `contentPaths` 上執行 `ai-i18n-tools write-heading-ids --slug-style mdx-comment`。該命令也會重新定位現有翻譯檔案中相同的英文 id（它不會將翻譯後的標題轉換為 slug），並在區段計數相符時更新相符的快取區段，以便後續的 `sync --force-update` 保留修復後的 id。重新命名標題後請重新執行，讓過時的 id 與目前的標題相符。

將您的 markdown **錨點連結** 指向這些穩定的 id，例如 `[label](other.md#tls-configuration)`，其中的片段與 `{#…}` 或 `{/* #… */}` id 相符 — 而不是僅從英文單字猜測的 slug。請參閱 [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) 以取得使用此模式的已提交文件。

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### 其他版面配置（扁平、Starlight、VitePress 等）

當您不在 Docusaurus 上，或者您需要 HTML 錨點而不是 `{#…}` / `{/* #… */}` 後綴時：

1. 在 `translate-docs` 之前，對您的來源 `.md` / `.mdx` 執行 `ai-i18n-tools write-heading-ids`（與平常相同的 `docs[]` / `contentPaths`）。它會在每個標題前的那一列插入明確的 HTML 錨點，讓每個翻譯副本共用 `id` 值，並將這些相同的英文 id 複製到現有的翻譯檔案中。當區段計數相符時，也會更新相符的快取區段，以便後續的 `sync --force-update` 保留修復後的 id。重新命名標題後請重新執行，以便重新整理過時的錨點 id 來符合目前的標題。
2. 將您的 markdown **錨點連結**指向這些穩定的 id，例如 `[label](other.md#section-id)`，其中 `section-id` 符合工具寫入的錨點 — 而不是僅憑英文單字猜測。

<a id="example"></a>
## 範例

<a id="docusaurus------suffix"></a>
### Docusaurus `{#…}` / `{/* #… */}` 後綴

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md`（英文來源，經典）：

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

或是 MDX 首選的註解形式：

```markdown
## TLS configuration {/* #tls-configuration */}

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
