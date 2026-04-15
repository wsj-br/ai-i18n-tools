# ai-i18n-tools: パッケージ概要

このドキュメントでは、`ai-i18n-tools` の内部アーキテクチャ、各コンポーネントの連携方法、および2つのコアワークフローの実装について説明します。

実用的な使用方法については、[GETTING_STARTED.md](GETTING_STARTED.ja.md) を参照してください。

**他の言語で読む:**

<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- このセクションを編集しないでください。更新するには doctoc を再実行してください -->
**目次**

- [アーキテクチャ概要](#architecture-overview)
- [ソースツリー](#source-tree)
- [ワークフロー1 - UI翻訳の内部構造](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [フラットロケールファイル](#flat-locale-files)
  - [UI翻訳プロンプト](#ui-translation-prompts)
- [ワークフロー2 - ドキュメント翻訳の内部構造](#workflow-2---document-translation-internals)
  - [抽出器](#extractors)
  - [プレースホルダー保護](#placeholder-protection)
  - [キャッシュ (`TranslationCache`)](#cache-translationcache)
  - [出力パス解決](#output-path-resolution)
  - [フラットリンク書き換え](#flat-link-rewriting)
- [共有インフラストラクチャ](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [設定読み込み](#config-loading)
  - [ロガー](#logger)
- [ランタイムヘルパーAPI](#runtime-helpers-api)
  - [RTLヘルパー](#rtl-helpers)
  - [i18next設定ファクトリ](#i18next-setup-factories)
  - [表示ヘルパー](#display-helpers)
  - [文字列ヘルパー](#string-helpers)
- [プログラムAPI](#programmatic-api)
- [拡張ポイント](#extension-points)
  - [カスタム関数名 (UI抽出)](#custom-function-names-ui-extraction)
  - [カスタム抽出器](#custom-extractors)
  - [カスタム出力パス](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

## アーキテクチャ概要

```
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

プログラム的に利用者が必要とするものはすべて、`src/index.ts` から再エクスポートされます。

---

## ソースツリー

```
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

```
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

任意の JS/TS ファイル内で `t("literal")` と `i18n.t("literal")` の呼び出しを見つけるために、`i18next-scanner` の `Parser.parseFuncFromString` を使用します。関数名とファイル拡張子は設定可能です。**`extract` は、スキャナー以外の入力も同じカタログにマージします:** `reactExtractor.includePackageDescription` が有効（デフォルト）な場合はプロジェクトの `package.json` `description` を、`reactExtractor.includeUiLanguageEnglishNames` が `true` で `uiLanguagesPath` が設定されている場合は `ui-languages.json` から各 **`englishName`** を取り込みます（ソース内ですでに見つかっている文字列が優先されます）。セグメントハッシュは、トリムしたソース文字列の **MD5 の先頭8桁の16進文字** です — これらは `strings.json` のキーになります。

### `strings.json`

マスターカタログの構造は以下の通りです：

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

`models`（オプション）— ロケールごとに、そのロケールで最後に正常に実行された`translate-ui`の後にどのモデルが翻訳を生成したか（または`editor`のWeb UIからテキストが保存された場合は`user-edited`）。`locations`（オプション）— `extract`が文字列をどこで見つけたか（スキャナー＋パッケージ記述行。マニフェストのみの`englishName`文字列は`locations`を省略する場合あり）。

`extract`は新しいキーを追加し、スキャンで引き続き存在するキーについては既存の`translated` / `models`データを保持します（スキャナーのリテラル、オプションの説明、オプションのマニフェスト`englishName`）。`translate-ui`は欠落している`translated`エントリを補完し、翻訳対象のロケールの`models`を更新し、フラットなロケールファイルを書き出します。

**`ui-languages.json`マニフェスト** — `{ code, label, englishName, direction }`（BCP-47 `code`、UI `label`、リファレンス `englishName`、`"ltr"`または`"rtl"`）のJSON配列。`generate-ui-languages`を使用して、`sourceLocale`＋`targetLocales`およびバンドルされたマスター`data/ui-languages-complete.json`からプロジェクトファイルを構築します。

### フラットロケールファイル

各ターゲットロケールには、ソース文字列 → 翻訳をマッピングするフラットな JSON ファイル（`de.json`）（`models` フィールドなし）が作成されます：

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18nextはこれらをリソースバンドルとして読み込み、ソース文字列（キーをデフォルトモデルとして）によって翻訳を検索します。

### UI翻訳プロンプト

`buildUIPromptMessages` は、以下のシステムメッセージとユーザーメッセージを構築します：
- ソース言語とターゲット言語を識別します（`localeDisplayNames` または `ui-languages.json` からの表示名を使用）。
- 文字列のJSON配列を送信し、返信として翻訳のJSON配列を要求します。
- 利用可能な場合は用語集のヒントを含めます。

`OpenRouterClient.translateUIBatch` は、各モデルを順番に試行し、パースまたはネットワークエラーが発生した場合はフォールバックします。CLI は `openrouter.translationModels`（またはレガシーのデフォルト/フォールバック）からそのリストを構築します；`translate-ui` の場合、オプションの `ui.preferredModel` が設定されているときに先頭に追加されます（残りと重複しないように）。

---

## ワークフロー2 - ドキュメント翻訳の内部構造

```
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

すべてのエクストラクターは `BaseExtractor` を拡張し、`extract(content, filepath): Segment[]` を実装します。

- `MarkdownExtractor` - マークダウンを型付きセグメントに分割します：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。翻訳不可能なセグメント（コードブロック、生の HTML）はそのまま保持されます。  
- `JsonExtractor` - Docusaurus JSON ラベルファイルから文字列値を抽出します。  
- `SvgExtractor` - SVG から `<text>`、`<title>`、および `<desc>` コンテンツを抽出します（`translate-svg` が `config.svg` の下のアセットに使用し、`translate-docs` では使用しません）。

### プレースホルダー保護

翻訳前に、敏感な構文は不透明なトークンに置き換えられ、LLMの破損を防ぎます:

1. **アドモニションマーカー** (`:::note`, `:::`) - 元のテキストを正確に復元します。
2. **ドキュメントアンカー** (HTML `<a id="…">`, Docusaurus見出し `{#…}`) - そのまま保持されます。
3. **マークダウンURL** (`](url)`, `src="../…"`) - 翻訳後にマップから復元されます。

### キャッシュ (`TranslationCache`)

SQLiteデータベース（`node:sqlite`経由）は、`(source_hash, locale)`でキー付けされた行を保存し、`translated_text`, `model`, `filepath`, `last_hit_at`、および関連フィールドを持ちます。ハッシュは正規化されたコンテンツのSHA-256最初の16進文字です（ホワイトスペースが圧縮されています）。

各実行時に、セグメントはハッシュ × ロケールで検索されます。キャッシュミスのみがLLMに送られます。翻訳後、現在の翻訳スコープでヒットしなかったセグメント行の `last_hit_at` はリセットされます。`cleanup` は最初に `sync --force-update` を実行し、その後、古いセグメント行（null `last_hit_at` / 空のファイルパス）を削除し、ディスク上に解決されたソースパスが存在しない場合に `file_tracking` キーを剪定し（`doc-block:…`, `svg-assets:…` など）、メタデータのファイルパスが存在しないファイルを指す翻訳行を削除します。`--no-backup` が渡されない限り、最初に `cache.db` のバックアップを取ります。

`translate-docs` コマンドは、変更されていないソースの既存の出力が作業を完全にスキップできるように **ファイルトラッキング** も使用します。`--force-update` はファイル処理を再実行しながらセグメントキャッシュを使用し続けます; `--force` はファイルトラッキングをクリアし、API翻訳のためにセグメントキャッシュの読み取りをバイパスします。完全なフラグテーブルについては [Getting Started](GETTING_STARTED.ja.md#cache-behaviour-and-translate-docs-flags) を参照してください。

**バッチプロンプト形式:** `translate-docs --prompt-format` は、`OpenRouterClient.translateDocumentBatch` のみのために XML（`<seg>` / `<t>`）または JSON 配列/オブジェクトの形状を選択します；抽出、プレースホルダー、および検証は変更されません。詳細は [バッチプロンプト形式](GETTING_STARTED.ja.md#batch-prompt-format) を参照してください。

### 出力パスの解決

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)` はソース相対パスを出力パスにマッピングします:

- `nested` スタイル（デフォルト）：`{outputDir}/{locale}/{relPath}` のマークダウン用。  
- `docusaurus` スタイル：`docsRoot` の下で、出力は `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}` を使用します；`docsRoot` の外のパスはネストされたレイアウトにフォールバックします。  
- `flat` スタイル：`{outputDir}/{stem}.{locale}{extension}`。`flatPreserveRelativeDir` が `true` の場合、ソースのサブディレクトリは `outputDir` の下に保持されます。  
- **カスタム** `pathTemplate`：`{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` を使用する任意のマークダウンレイアウト。  
- **カスタム** `jsonPathTemplate`：同じプレースホルダーを使用する JSON ラベルファイル用の別のカスタムレイアウト。  
- `linkRewriteDocsRoot` は、翻訳された出力がデフォルトのプロジェクトルート以外の場所にルートされているときに、フラットリンクリライターが正しいプレフィックスを計算するのを助けます。

### フラットリンクの書き換え

`markdownOutput.style === "flat"` の場合、翻訳されたマークダウンファイルはロケールサフィックスとともにソースの横に配置されます。ページ間の相対リンクは書き換えられ、`readme.de.md` の `[Guide](../guide.md)` は `guide.de.md` を指します。`rewriteRelativeLinks` によって制御されます（カスタム `pathTemplate` がないフラットスタイルでは自動的に有効になります）。

---

## 共有インフラストラクチャ

### `OpenRouterClient`

OpenRouterチャット完了APIをラップします。主な動作:

1. **モデルフォールバック**: 解決されたリスト内の各モデルを順番に試行し、HTTPエラーや解析失敗時にフォールバックします。UI翻訳では、`ui.preferredModel`が存在する場合はそれを最初に解決し、その後`openrouter`モデルを解決します。
2. **レート制限**: 429レスポンスを検出し、`retry-after`（または2秒）待機して、1回再試行します。
3. **プロンプトキャッシング**: システムメッセージは、サポートされているモデルでプロンプトキャッシングを有効にするために`cache_control: { type: "ephemeral" }`で送信されます。
4. **デバッグトラフィックログ**: `debugTrafficFilePath`が設定されている場合、リクエストとレスポンスのJSONをファイルに追記します。

### 設定ファイルの読み込み

`loadI18nConfigFromFile(configPath, cwd)` パイプライン:

1. `ai-i18n-tools.config.json`を読み取り、解析します（JSON）。
2. `mergeWithDefaults` - `defaultI18nConfigPartial`とディープマージし、`documentations[].sourceFiles`エントリを`contentPaths`にマージします。
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales`がファイルパスの場合、マニフェストを読み込み、ロケールコードに展開します。`uiLanguagesPath`を設定します。
4. `expandDocumentationTargetLocalesInRawInput` - 各`documentations[].targetLocales`エントリについて同様に処理します。
5. `parseI18nConfig` - Zod検証 + `validateI18nBusinessRules`。
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE`などを適用します。
7. `augmentConfigWithUiLanguagesFile` - マニフェストの表示名を付加します。

### ロガー

`Logger`は、ANSIカラー出力を伴う`debug`、`info`、`warn`、`error`レベルをサポートします。詳細モード（`-v`）は`debug`を有効にします。`logFilePath`が設定されている場合、ログ行はそのファイルにも書き込まれます。

---

## ランタイムヘルパーAPI

これらは`'ai-i18n-tools/runtime'`からエクスポートされ、任意のJavaScript環境（ブラウザ、Node.js、Deno、Edge）で動作します。`i18next`や`react-i18next`からはインポート**しません**。

### RTLヘルパー

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

### i18nextセットアップファクトリー

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
wrapI18nWithKeyTrim(i18n: I18nLike): void
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

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

## プログラムAPI

すべての公開型とクラスはパッケージルートからエクスポートされます。例：CLIを使用せずにNode.jsからtranslate-UIステップを実行する場合:

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

主要なエクスポート:

| エクスポート | 説明 |
|---|---|
| `loadI18nConfigFromFile` | JSONファイルから設定を読み込み、マージ、検証します。 |
| `parseI18nConfig` | 生の設定オブジェクトを検証します。 |
| `TranslationCache` | SQLiteキャッシュ - `cacheDir`パスでインスタンス化します。 |
| `UIStringExtractor` | JS/TSソースから`t("…")`文字列を抽出します。 |
| `MarkdownExtractor` | Markdownから翻訳可能なセグメントを抽出します。 |
| `JsonExtractor` | Docusaurus JSONラベルファイルから抽出します。 |
| `SvgExtractor` | SVGファイルから抽出します。 |
| `OpenRouterClient` | OpenRouterに翻訳リクエストを行います。 |
| `PlaceholderHandler` | 翻訳前後のMarkdown構文を保護/復元します。 |
| `splitTranslatableIntoBatches` | セグメントをLLMサイズのバッチにグループ化します。 |
| `validateTranslation` | 翻訳後の構造チェックを行います。 |
| `resolveDocumentationOutputPath` | 翻訳されたドキュメントの出力ファイルパスを解決します。 |
| `Glossary` / `GlossaryMatcher` | 翻訳用語集を読み込み、適用します。 |
| `runTranslateUI` | プログラムによるtranslate-UIエントリーポイント。 |

---

## 拡張ポイント

### カスタム関数名（UI抽出）

設定を介して非標準の翻訳関数名を追加します:

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

### カスタム抽出器

パッケージから `ContentExtractor` を実装します：

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

プログラム的に `doc-translate.ts` ユーティリティをインポートして、ドキュメント翻訳パイプラインに渡します。

### カスタム出力パス

任意のファイルレイアウトには `markdownOutput.pathTemplate` を使用します：

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
