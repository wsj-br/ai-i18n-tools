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

從 Node.js 搭建設定檔（選擇性第四個引數用於指定內建預設；預設為 `openrouter`）：

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
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
| `JsonExtractor` | 從 Docusaurus JSON 標籤檔案中提取（UI 目錄，非 MDX 主體）。 |
| `SvgExtractor` | 從 SVG 檔案中提取。 |
| `LlmClient` | 向作用中的 LLM 提供者發出翻譯請求（`OpenRouterClient` 是已淘汰的別名）。 |
| `PlaceholderHandler` | 保護/還原翻譯周圍的 markdown 語法（HTML 標籤、警告、錨點、MDX 註解/JSX/大括號、URL、內嵌程式碼、強調）。 |
| `protectMdx` / `restoreMdx` | 保護/還原 MDX 註解、JSX 標籤、大括號表達式和 JSX 字串屬性（由 `PlaceholderHandler` 呼叫；也匯出供直接使用）。 |
| `splitTranslatableIntoBatches` | 將區段分組為 LLM 大小的批次。 |
| `validateTranslation` | 轉譯後的結構檢查（**async** — 必須等待）。 |
| `resolveDocumentationOutputPath` | 解析已翻譯文件的輸出檔案路徑。 |
| `Glossary` / `GlossaryMatcher` | 載入並套用翻譯詞彙表。 |
| `runTranslateUI` | 程式化翻譯 UI 的進入點。 |
| `writeInitConfigFile` | 寫入起始設定檔 JSON（`template`，選擇性 `providerKey` 預設為 `openrouter`）。 |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | 每個內建預設的起始 `translationModels`，由 `init -P` 使用。 |
| `PROVIDER_PRESETS` | 內建提供者預設映射（`baseUrl`、`apiKeyEnv`）。 |
