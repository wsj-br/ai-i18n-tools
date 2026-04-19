# ai-i18n-tools: パッケージ概要

`ai-i18n-tools`の内部アーキテクチャ、各コンポーネントの統合方法、および2つのコアワークフローの実装方法について説明します。

実際の使用手順については、[GETTING_STARTED.md](GETTING_STARTED.ja.md) を参照してください。

<small>**他の言語で読む：** </small>

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## 目次

- [アーキテクチャ概要](#architecture-overview)
- [ソースツリー](#source-tree)
- [ワークフロー1 - UI翻訳の内部構造](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [フラットロケールファイル](#flat-locale-files)
  - [UI翻訳プロンプト](#ui-translation-prompts)
- [ワークフロー2 - ドキュメント翻訳の内部構造](#workflow-2---document-translation-internals)
  - [エクストラクター](#extractors)
  - [プレースホルダー保護](#placeholder-protection)
  - [キャッシュ (`TranslationCache`)](#cache-translationcache)
  - [出力パスの解決](#output-path-resolution)
  - [フラットリンクの書き換え](#flat-link-rewriting)
- [共有インフラストラクチャ](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [設定の読み込み](#config-loading)
  - [ロガー](#logger)
- [ランタイムヘルパーアプリケーションプログラミングインターフェース（API）](#runtime-helpers-api)
  - [RTLヘルパー](#rtl-helpers)
  - [i18nextセットアップファクトリー](#i18next-setup-factories)
  - [表示ヘルパー](#display-helpers)
  - [文字列ヘルパー](#string-helpers)
- [プログラムによるAPI](#programmatic-api)
- [拡張ポイント](#extension-points)
  - [カスタム関数名（UI抽出）](#custom-function-names-ui-extraction)
  - [カスタムエクストラクター](#custom-extractors)
  - [カスタム出力パス](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## アーキテクチャ概要

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

利用者がプログラム的に必要とするすべてのものは、`src/index.ts`から再エクスポートされます。

---

## ソースツリー

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-svg.ts            `translate-svg` command (standalone assets from `config.svg`)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── locale-utils.ts             BCP-47 normalization and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner)
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── json-extractor.ts           JSON label file extraction
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: admonitions → anchors → URLs
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   └── openrouter.ts               OpenRouter HTTP client with model fallback chain
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   └── matcher.ts                  Term hint extraction for prompts
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── server/
│   └── translation-editor.ts       Express app for cache / strings.json / glossary editor
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    └── ignore-parser.ts            .translate-ignore file parser
```

---

## ワークフロー1 - UI翻訳の内部構造

```text
source files (JS/TS)
      │
      ▼  UIStringExtractor (i18next-scanner Parser)
strings.json  ─────────────────── master catalog
      │             { hash: { source, translated, models?, locations? } }
      ▼
OpenRouterClient.translateUIBatch()
      │  sends JSON array of source strings, receives JSON array of translations (+ model id per batch)
      ▼
de.json, pt-BR.json …  ─────────── per-locale flat maps: source → translation (no model metadata)
```

### `UIStringExtractor`

`i18next-scanner`の`Parser.parseFuncFromString`を使用して、任意のJS/TSファイル内の`t("literal")`および`i18n.t("literal")`呼び出しを見つけます。関数名とファイル拡張子は設定可能です。`extract` **はスキャナー以外の入力も同じカタログにマージします：**プロジェクト`package.json` `description`は、`reactExtractor.includePackageDescription`が有効な場合（デフォルト）に、`ui-languages.json`からの各**`englishName`** と、`reactExtractor.includeUiLanguageEnglishNames`が`true`で、`uiLanguagesPath`が設定されている場合（ソース内で既に見つかった文字列が優先されます）。セグメントハッシュは**MD5の最初の8つの16進数**で、トリミングされたソース文字列のものです — これらは`strings.json`のキーになります。

### `strings.json`

マスターカタログの構造は以下の通りです。

```json
{
  "<md5-8>": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models`（オプション）— ロケールごとに、そのロケールで最後に正常に`translate-ui`が実行された後にどのモデルが翻訳を生成したか（または`editor`のWeb UIからテキストが保存された場合は`user-edited`）。`locations`（オプション）— `extract`が文字列をどこで見つけたか（スキャナー＋パッケージの説明行；マニフェストのみの`englishName`文字列は`locations`を省略する場合がある）。

`extract`は新しいキーを追加し、スキャンでまだ存在するキーに対しては既存の`translated` / `models`データを保持します（スキャナーリテラル、オプションの説明、オプションのマニフェスト`englishName`）。`translate-ui`は欠落している`translated`エントリを補完し、翻訳するロケールの`models`を更新し、フラットロケールファイルを書き出します。

`ui-languages.json` **マニフェスト** — `{ code, label, englishName, direction }`のJSON配列（BCP-47 `code`、UI `label`、リファレンス`englishName`、`"ltr"`または`"rtl"`）。`generate-ui-languages`を使用して、`sourceLocale` + `targetLocales`およびバンドルされたマスター`data/ui-languages-complete.json`からプロジェクトファイルを構築します。

### フラットロケールファイル

各ターゲットロケールには、ソース文字列 → 翻訳をマッピングするフラットなJSONファイル（`de.json`）が作成されます（`models`フィールドなし）：

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18nextはこれらをリソースバンドルとして読み込み、ソース文字列によって翻訳を検索します（キーをデフォルトモデルとして使用）。

### UI翻訳プロンプト

`buildUIPromptMessages`は、以下のシステムおよびユーザーのメッセージを構築します。

- ソース言語およびターゲット言語を（`localeDisplayNames`または`ui-languages.json`からの表示名で）識別します。
- 文字列のJSON配列を送信し、翻訳された文字列のJSON配列を返すことを要求します。
- 利用可能な場合は、用語集のヒントを含めます。

`OpenRouterClient.translateUIBatch`は各モデルを順番に試し、パースまたはネットワークエラーが発生した場合はフォールバックします。CLIは`openrouter.translationModels`（またはレガシーのデフォルト/フォールバック）からそのリストを構築します；`translate-ui`の場合、オプションの`ui.preferredModel`が設定されているときに先頭に追加されます（他のものと重複しないように）。

---

## ワークフロー2 - ドキュメント翻訳内部

```text
markdown/MDX/JSON files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── URLs, admonitions, anchors replaced with tokens
      │
      ▼  splitTranslatableIntoBatches
batches[]  ───────────────────── grouped by count + char limit
      │
      ▼  TranslationCache lookup
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
      │
      ▼  PlaceholderHandler.restoreAfterTranslation
final text  ──────────────────── placeholders restored
      │
      ▼  resolveDocumentationOutputPath
output file  ─────────────────── Docusaurus layout or flat layout
```

### 抽出器

すべての抽出器は`BaseExtractor`を拡張し、`extract(content, filepath): Segment[]`を実装します。

- `MarkdownExtractor` - マークダウンを型付きセグメントに分割します: `frontmatter`, `heading`, `paragraph`, `code`, `admonition`。翻訳不可能なセグメント（コードブロック、生のHTML）はそのまま保持されます。
- `JsonExtractor` - Docusaurus JSONラベルファイルから文字列値を抽出します。
- `SvgExtractor` - SVGから`<text>`, `<title>`, および`<desc>`コンテンツを抽出します（`translate-svg`が`config.svg`の下のアセットに使用し、`translate-docs`では使用しません）。

### プレースホルダー保護

翻訳の前に、敏感な構文は不透明なトークンに置き換えられ、LLMの破損を防ぎます:

1. **アドモニションマーカー**（`:::note`, `:::`） - 元のテキストを正確に復元します。
2. **ドキュメントアンカー**（HTML `<a id="…">`, Docusaurus見出し `{#…}`） - そのまま保持されます。
3. **マークダウンURL**（`](url)`, `src="../…"`） - 翻訳後にマップから復元されます。

### キャッシュ（`TranslationCache`）

SQLiteデータベース（`node:sqlite`経由）は、`(source_hash, locale)`でキー付けされた行を`translated_text`, `model`, `filepath`, `last_hit_at`および関連フィールドと共に保存します。ハッシュは正規化されたコンテンツのSHA-256の最初の16進数文字です（ホワイトスペースが圧縮されます）。

各実行時に、セグメントはハッシュ×ロケールによって検索されます。キャッシュミスのみがLLMに送信されます。翻訳後、`last_hit_at`は現在の翻訳スコープ内でヒットしなかったセグメント行のためにリセットされます。`cleanup`は最初に`sync --force-update`を実行し、その後古いセグメント行（null `last_hit_at` / 空のファイルパス）を削除し、ディスク上で解決されたソースパスが欠落している場合は`file_tracking`キーをプルーニングし（`doc-block:…`, `svg-assets:…`など）、メタデータファイルパスが欠落しているファイルを指す翻訳行を削除します；`--no-backup`が渡されない限り、最初に`cache.db`をバックアップします。

`translate-docs`コマンドはまた、変更されていないソースと既存の出力がある場合に作業を完全にスキップできるように**ファイルトラッキング**を使用します。`--force-update`はセグメントキャッシュを使用しながらファイル処理を再実行します；`--force`はファイルトラッキングをクリアし、API翻訳のためにセグメントキャッシュの読み取りをバイパスします。完全なフラグテーブルについては[はじめに](GETTING_STARTED.ja.md#cache-behaviour-and-translate-docs-flags)を参照してください。

**バッチプロンプト形式:** `translate-docs --prompt-format`はXML（`<seg>` / `<t>`）またはJSON配列/オブジェクトの形状を`OpenRouterClient.translateDocumentBatch`のみに選択します；抽出、プレースホルダー、および検証は変更されません。バッチプロンプト形式については[こちら](GETTING_STARTED.ja.md#batch-prompt-format)を参照してください。

### 出力パスの解決

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`はソース相対パスを出力パスにマッピングします:

- `nested`スタイル（デフォルト）：マークダウン用の`{outputDir}/{locale}/{relPath}`。
- `docusaurus`スタイル：`docsRoot`の下で、出力は`{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}`を使用します；`docsRoot`の外のパスはネストされたレイアウトにフォールバックします。
- `flat`スタイル：`{outputDir}/{stem}.{locale}{extension}`。`flatPreserveRelativeDir`が`true`の場合、ソースのサブディレクトリは`outputDir`の下に保持されます。
- **カスタム** `pathTemplate`：`{outputDir}`, `{locale}`, `{LOCALE}`, `{relPath}`, `{stem}`, `{basename}`, `{extension}`, `{docsRoot}`, `{relativeToDocsRoot}`を使用する任意のマークダウンレイアウト。
- **カスタム** `jsonPathTemplate`：同じプレースホルダーを使用するJSONラベルファイル用の別のカスタムレイアウト。
- `linkRewriteDocsRoot`は、翻訳された出力がデフォルトのプロジェクトルート以外のどこかにルートされているときに、フラットリンクリライターが正しいプレフィックスを計算するのを助けます。

### フラットリンクの書き換え

`markdownOutput.style === "flat"`の場合、翻訳されたMarkdownファイルはロケールサフィックスを付けてソースファイルと同じ場所に配置されます。ページ間の相対リンクは、`readme.de.md`の`[Guide](../guide.md)`が`guide.de.md`を指すように書き換えられます。`rewriteRelativeLinks`で制御され、カスタム`pathTemplate`なしのフラットスタイルでは自動的に有効になります。

---

## 共通インフラ

### `OpenRouterClient`

OpenRouterチャット補完APIをラップしています。主な動作：

- **モデルフォールバック**：解決されたリスト内の各モデルを順に試行します。HTTPエラーや解析失敗時にはフォールバックします。UI翻訳では、存在する場合にまず`ui.preferredModel`を解決し、次に`openrouter`モデルを解決します。
- **レート制限**：429応答を検出すると、`retry-after`（または2秒）待機して1回再試行します。
- **プロンプトキャッシュ**：システムメッセージに`cache_control: { type: "ephemeral" }`を付けて送信し、対応するモデルでプロンプトキャッシュを有効にします。
- **デバッグ用トラフィックログ**：`debugTrafficFilePath`が設定されている場合、リクエストとレスポンスのJSONをファイルに追記します。

### 設定の読み込み

`loadI18nConfigFromFile(configPath, cwd)`パイプライン：

1. `ai-i18n-tools.config.json`（JSON）を読み込み、解析します。
2. `mergeWithDefaults` - `defaultI18nConfigPartial`とディープマージし、`documentations[].sourceFiles`エントリをすべて`contentPaths`にマージします。
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales`がファイルパスの場合、マニフェストを読み込み、ロケールコードに展開し、`uiLanguagesPath`を設定します。
4. `expandDocumentationTargetLocalesInRawInput` - 各`documentations[].targetLocales`エントリについて同様に処理します。
5. `parseI18nConfig` - Zodによるバリデーションと`validateI18nBusinessRules`。
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE`などを適用します。
7. `augmentConfigWithUiLanguagesFile` - マニフェストの表示名を付加します。

### ロガー

`Logger`は、ANSIカラーアウトプット付きの`debug`、`info`、`warn`、`error`レベルをサポートしています。詳細モード（`-v`）では`debug`が有効になります。`logFilePath`が設定されている場合、ログ行はそのファイルにも書き込まれます。

---

## ランタイムヘルパーアプリケーションプログラミングインタフェース（API）

これらは`'ai-i18n-tools/runtime'`からエクスポートされ、任意のJavaScript環境（ブラウザ、Node.js、Deno、Edge）で動作します。`i18next`や`react-i18next`からのインポートは**しません**。

### 右から左（RTL）ヘルパー

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18next設定ファクトリ

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

通常のアプリケーションエントリポイントとして **`setupKeyAsDefaultT`** を使用します（キーのトリム＋複数形の **`wrapT`**＋オプションの **`translate-ui`** `{sourceLocale}.json`）。アプリケーションのワイヤリングにおいて、単独で **`wrapI18nWithKeyTrim`** を呼び出すことは **非推奨**です。

**`localeLoaders`** を **`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`** で構築して、**`generate-ui-languages`** 後もキーが **`targetLocales`** と整列された状態を維持します。**`docs/GETTING_STARTED.md`**（ランタイム配線）および **`examples/nextjs-app/`** / **`examples/console-app/`** を参照してください。

### 表示ヘルパー

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

### 文字列ヘルパー

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

## プログラムによるAPI

すべてのパブリック型およびクラスはパッケージルートからエクスポートされています。例：CLIを使わずNode.jsからUI翻訳ステップを実行する場合：

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

主要なエクスポート：

| エクスポート | 説明 |
|---|---|
| `loadI18nConfigFromFile` | JSONファイルから設定を読み込み、マージし、検証します。 |
| `parseI18nConfig` | 生の設定オブジェクトを検証します。 |
| `TranslationCache` | SQLiteキャッシュ - `cacheDir`パスでインスタンス化します。 |
| `UIStringExtractor` | JS/TSソースから`t("…")`文字列を抽出します。 |
| `MarkdownExtractor` | Markdownから翻訳可能なセグメントを抽出します。 |
| `JsonExtractor` | DocusaurusのJSONラベルファイルから抽出します。 |
| `SvgExtractor` | SVGファイルから抽出します。 |
| `OpenRouterClient` | OpenRouterに翻訳リクエストを送信します。 |
| `PlaceholderHandler` | 翻訳の前後でMarkdown構文を保護・復元します。 |
| `splitTranslatableIntoBatches` | セグメントをLLMサイズのバッチにグループ化します。 |
| `validateTranslation` | 翻訳後の構造チェックを行います。 |
| `resolveDocumentationOutputPath` | 翻訳済みドキュメントの出力ファイルパスを解決します。 |
| `Glossary` / `GlossaryMatcher` | 翻訳用語集を読み込み、適用します。 |
| `runTranslateUI` | プログラムによる翻訳UIのエントリポイントです。 |

---

## 拡張ポイント

### カスタム関数名（UI抽出）

設定ファイルで非標準の翻訳関数名を追加します：

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### カスタムエクストラクタ

パッケージから`ContentExtractor`を実装します：

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

プログラムで`doc-translate.ts`ユーティリティをインポートし、doc-translateパイプラインに渡します。

### カスタム出力パス

`markdownOutput.pathTemplate` を使用して、任意のファイルレイアウトを指定できます：

```json
{
  "documentations": [
    {
      "markdownOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
