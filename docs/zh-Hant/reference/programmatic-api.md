<a id="programmatic-api"></a>
# 程式化 API

所有公開的類型和類別都從套件根目錄導出。範例：從 Node.js 中執行 translate-UI 步驟，而不使用 CLI：

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

從 Node.js 建立設定骨架。第四個引數是內建預設 (`cwd` 是第三個)：

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'cheaperinference');
```

主要匯出（常用 — 請參閱 `src/index.ts` 以取得完整的公開介面）：

| 匯出 | 描述 |
|---|---|
| `loadI18nConfigFromFile` | 從 JSON 檔案載入、合併、驗證設定。 |
| `parseI18nConfig` | 驗證原始設定物件。 |
| `TranslationCache` | SQLite 快取 - 使用 `cacheDir` 路徑進行初始化。 |
| `UIStringExtractor` | 從 JS/TS 原始碼中提取 `t("…")` 字串。 |
| `collectHtmlI18nStrings` / `markHtmlContent` | 掃描 / 插入 HTML 中的 `data-i18n*` 標記（支援 `extract` 用於 `.html` 以及 `mark-html` 命令）。 |
| `MarkdownExtractor` | 從 markdown 中提取可翻譯的區段。 |
| `HtmlTemplateExtractor` | 擷取並重新組合純 HTML 文件（文字與可翻譯屬性；`src` / `href` 保持原位）。 |
| `JsonExtractor` | 從 Docusaurus JSON 標籤檔案中提取（UI 目錄，非 MDX 主體）。 |
| `SvgExtractor` | 從 SVG 檔案中提取。 |
| `LlmClient` | 向作用中的 LLM 提供者發出翻譯請求（`OpenRouterClient` 是已淘汰的別名）。 |
| `rankProviderModels` / `resolveSuggestionWeights` | 根據 `suggest-models` 所使用的品質或價格設定檔，對供應商的聊天目錄進行排名。不會列印或寫入設定。 |
| `PlaceholderHandler` | 保護/還原翻譯周圍的 markdown 語法（HTML 標籤、警告、錨點、MDX 註解/JSX/大括號、URL、內嵌程式碼、強調）。 |
| `protectMdx` / `restoreMdx` | 保護/還原 MDX 註解、JSX 標籤、大括號表達式和 JSX 字串屬性（由 `PlaceholderHandler` 呼叫；也匯出供直接使用）。 |
| `splitTranslatableIntoBatches` | 將區段分組為 LLM 大小的批次。 |
| `validateTranslation` | 轉譯後的結構檢查（**async** — 必須等待）。 |
| `resolveDocumentationOutputPath` | 解析已翻譯文件的輸出檔案路徑。 |
| `Glossary` / `GlossaryMatcher` | 載入並套用翻譯詞彙表，包括可選術語 `Context` 註解。 |
| `loadTranslationContext` / `computeGuidanceFingerprint` | 載入 `glossary.contextFiles` 和快取失效的指紋指引。 |
| `runTranslateUI` | 程式化翻譯 UI 的進入點。 |
| `writeInitConfigFile` | 寫入一個入門設定 JSON (`template`、`cwd`，以及一個必要的 `providerKey`)。 |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | 每個內建預設的起始 `translationModels`，由 `init -P` 使用。 |
| `PROVIDER_PRESETS` | 內建提供者預設映射（`baseUrl`、`apiKeyEnv`）。 |

<a id="python-runtime"></a>
## Python 執行階段 (`i18n.py`)

當缺少 `i18n.py` 時，`init -t ui-python`、`ui-python-gettext` 和 `ui-python-flask` 會將此模組寫入專案。這是適用於 Python 3.10 或更新版本的標準函式庫輔助程式。請從該檔案匯入它。下方的函式與上表中的 Node 匯出項目是分開的。Django 專案會保留 Django 的 gettext，因此 `ui-python-django` 不會寫入 `i18n.py`。

呼叫形狀、不安全的 f-strings 以及各框架的地區設定連線：[Python 應用程式](/zh-Hant/guide/ui-strings/python)。

| 函式 | 行為 |
| --- | --- |
| `set_locale(locale)` | 設定目前的地區設定。程式碼中的底線會儲存為連字號（`pt_BR` 會變成 `pt-BR`）。傳回一個 `ContextVar` 權杖。 |
| `reset_locale(token)` | 從該權杖還原地區設定。請在 `finally` 中呼叫它，包括 FastAPI 和 Flask 中介軟體。 |
| `get_locale()` | 傳回目前的地區設定。 |
| `set_backend(backend)` | 選擇 `"auto"`、`"json"` 或 `"gettext"`。 |
| `get_ui_languages()` | 讀取扁平化 JSON 目錄旁的 `ui-languages.json`，或在關閉扁平化輸出時讀取 gettext 目錄。 |
| `get_direction(locale=None)` | 從該地區設定的資訊清單列傳回 `"rtl"` 或 `"ltr"`（若省略則為目前地區設定）。 |
| `_(message)` | 查閱一個字面值，然後傳回目錄字串或訊息本身。 |
| `t(template, *, plurals=False, count=None, **values)` | 查閱字面值，然後進行插值。`translate` 是相同的函式。在 Python 3.14 上，`translate(t"Hello, {name}!")` 會保留範本及其值。關鍵字引數會覆寫從範本字串取得的值。 |
| `ngettext(singular, plural, n, **values)` | 複數查閱，然後進行插值。`count` 可用於格式化字串。 |
| `pgettext(context, message, **values)` | 內容查閱（`msgctxt`，或 `context` + U+0004 + 扁平化 JSON 中的英文來源），然後進行插值。 |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit 選擇方塊。寫入 `st.session_state.locale` 和 `st.query_params["lang"]`，呼叫 `set_locale`，並傳回選擇的代碼。 |
