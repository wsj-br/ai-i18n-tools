<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: パッケージの概要

`ai-i18n-tools` の内部アーキテクチャ、各コンポーネントの統合方法、および2つのコアワークフローの実装方法について説明します。

実際の使用手順については、[GETTING_STARTED.md](GETTING_STARTED.ja.md) を参照してください。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [German](./PACKAGE_OVERVIEW.de.md) · [Spanish](./PACKAGE_OVERVIEW.es.md) · [French](./PACKAGE_OVERVIEW.fr.md) · [Hindi](./PACKAGE_OVERVIEW.hi.md) · [Japanese](./PACKAGE_OVERVIEW.ja.md) · [Korean](./PACKAGE_OVERVIEW.ko.md) · [Portuguese (BR)](./PACKAGE_OVERVIEW.pt-BR.md) · [Chinese (CN)](./PACKAGE_OVERVIEW.zh-CN.md) · [Chinese (TW)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [アーキテクチャの概要](#architecture-overview)
- [ソースツリー](#source-tree)
- [ワークフロー 1 - UI 翻訳の内部構造](#workflow-1---ui-translation-internals)
  - [`UIStringExtractor`](#uistringextractor)
  - [`strings.json`](#stringsjson)
  - [フラットなロケールファイル](#flat-locale-files)
  - [UI 翻訳プロンプト](#ui-translation-prompts)
- [ワークフロー 2 - ドキュメント翻訳の内部構造](#workflow-2---document-translation-internals)
  - [エクストラクター](#extractors)
  - [見出しアンカー挿入 (`write-heading-ids` CLI)](#heading-anchor-insertion-write-heading-ids-cli)
  - [プレースホルダー保護](#placeholder-protection)
  - [キャッシュ (`TranslationCache`)](#cache-translationcache)
  - [出力パスの解決](#output-path-resolution)
  - [フラットリンクの書き換え](#flat-link-rewriting)
- [共有インフラ](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [設定の読み込み](#config-loading)
  - [ロガー](#logger)
- [ランタイムヘルパーAPI](#runtime-helpers-api)
  - [RTL ヘルパー](#rtl-helpers)
  - [i18next 設定ファクトリ](#i18next-setup-factories)
  - [表示ヘルパー](#display-helpers)
  - [文字列ヘルパー](#string-helpers)
- [プログラムによるAPI](#programmatic-api)
- [拡張ポイント](#extension-points)
  - [カスタム関数名 (UI 抽出)](#custom-function-names-ui-extraction)
  - [カスタムエクストラクター](#custom-extractors)
  - [カスタム出力パス](#custom-output-paths)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

<a id="architecture-overview"></a>
## アーキテクチャの概要

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-docs, write-heading-ids, translate-svg, translate-ui, sync, status, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - placeholders, batching, validation, link rewriting
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express web editor for cache / glossary
└── Utils (src/utils/)         - logger, hash, ignore parser
```

利用者がプログラムで必要とするすべてのものは、`src/index.ts` から再エクスポートされます。

---

<a id="source-tree"></a>
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
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
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

<a id="workflow-1---ui-translation-internals"></a>
## ワークフロー 1 - UI 翻訳の内部構造

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

<a id="uistringextractor"></a>
### `UIStringExtractor`

`i18next-scanner` の `Parser.parseFuncFromString` を使用して、任意の JS/TS ファイル内の `t("literal")` および `i18n.t("literal")` 呼び出しを検出します。関数名およびファイル拡張子は構成可能になっています。`extract` **はまた、スキャナー以外の入力を同じカタログに統合します。たとえば、`reactExtractor.includePackageDescription` が有効（デフォルト）の場合のプロジェクトの `package.json` `description`、および `reactExtractor.includeUiLanguageEnglishNames` が `true` で `uiLanguagesPath` が設定されている場合の `ui-languages.json` からの各 `englishName` です（ソース内ですでに見つかった文字列が優先されます）。** セグメントのハッシュは、トリム済みのソース文字列の **MD5 の最初の8桁の16進数文字** であり、これが `strings.json` 内のキーとなります。

<a id="stringsjson"></a>
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

`models`（オプション）— ロケールごとに、そのロケールで最後に正常に実行された `translate-ui` 実行後にどのモデルが翻訳を生成したか（または `editor` のWeb UIからテキストが保存された場合は `user-edited`）。`locations`（オプション）— `extract` が文字列をどこで見つけたか（スキャナー＋パッケージ記述行。マニフェストのみの `englishName` 文字列は `locations` を省略する場合がある）。

`extract` は新しいキーを追加し、スキャンに引き続き存在するキーについては既存の `translated` / `models` データを保持します（スキャナーリテラル、オプションの説明、オプションのマニフェスト `englishName`）。`translate-ui` は欠落している `translated` エントリを補完し、翻訳対象のロケールの `models` を更新し、フラットロケールファイルを書き出します。

`ui-languages.json` **マニフェスト** — `{ code, label, englishName, direction }`（BCP-47 `code`、UI `label`、リファレンス `englishName`、`"ltr"` または `"rtl"`）のJSON配列。`generate-ui-languages` を使用して、`sourceLocale` と `targetLocales`、およびバンドルされたマスター `data/ui-languages-complete.json` からプロジェクトファイルを作成します。

<a id="flat-locale-files"></a>
### フラットなロケールファイル

各ターゲットロケールには、ソース文字列 → 翻訳（`models` フィールドなし）をマッピングするフラットなJSONファイル（`de.json`）が割り当てられます。

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18nextはこれらをリソースバンドルとして読み込み、ソース文字列（キーをデフォルトとするモデル）で翻訳を検索します。

<a id="ui-translation-prompts"></a>
### UI 翻訳プロンプト

`buildUIPromptMessages` は以下の内容を含むシステムおよびユーザー向けメッセージを構築します。

- ソース言語とターゲット言語を特定します（`localeDisplayNames` または `ui-languages.json` の表示名で）。
- 文字列のJSON配列を送信し、翻訳された文字列のJSON配列を返信として要求します。
- 利用可能な場合は用語集のヒントを含めてください。

`OpenRouterClient.translateUIBatch` は、パースエラーやネットワークエラーの際にフォールバックしながら、順に各モデルを試行します。CLIは、`openrouter.translationModels`（またはレガシーなデフォルト/フォールバック）からそのリストを構築します。`translate-ui` では、オプションの `ui.preferredModel` が設定されている場合、先頭に追加されます（残りとの重複は除去されます）。

---

<a id="workflow-2---document-translation-internals"></a>
## ワークフロー 2 - ドキュメント翻訳の内部構造

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

<a id="extractors"></a>
### エクストラクター

すべてのエクストラクターは `BaseExtractor` を継承し、`extract(content, filepath): Segment[]` を実装しています。

- `MarkdownExtractor` - Markdownを型付きセグメントに分割します：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。翻訳不要なセグメント（コードブロック、生のHTML）はそのまま保持されます。
- `JsonExtractor` - DocusaurusのJSONラベルファイルから文字列値を抽出します。
- `SvgExtractor` - SVGから`<text>`、`<title>`、`<desc>`のコンテンツを抽出します（`config.svg`以下のアセットに対して`translate-svg`で使用され、`translate-docs`では使用されません）。

<a id="heading-anchor-insertion-write-heading-ids"></a>
### 見出しアンカー挿入 (`write-heading-ids` CLI)

`write-heading-ids` コマンドは、ドキュメントの Markdown 用の**ローカルかつ非LLM**な前処理ツールです。実装：`src/cli/write-heading-ids.ts` がファイルの検出を調整し、`src/markdown/write-heading-ids-core.ts` が行を解析してアンカーを挿入します。

有効な設定ファイルに**少なくとも1つの `documentations[]` ブロックが含まれている必要があります**。各ブロックについて、`contentPaths` 配下の `.md` / `.mdx` ファイルを収集し、プロジェクトの `.translate-ignore` 規則（ドキュメント翻訳と同じ考え方）を適用します。必要に応じて、`--path` / `--file` を使用してサブツリーに制限します。各ファイルは `applyHeadingAnchorsToMarkdown` で変換されます：コードブロック外のすべての**フラットなATX見出し**（`# …` から `###### …`）について、不足または古くなっている場合に、その上の行に空のHTML行 `<a id="slug"></a>` を挿入します。スラッグ生成アルゴリズムは一般的なエコシステムと一致しています — `github`（デフォルト）、`bitbucket`、`gitlab`、`pymdown`（オプションのUnicode正規化／パーセントエンコーディングフラグ）、`azure-devops` — これにより、アンカーIDが既存のツール（doctoc、PyMdown など）と一貫性を保ちます。`--dry-run` は書き込みを行わず、変更される予定の内容をレポートします。

このコマンドは `translate-docs` や `sync` 内では**実行されません**。翻訳または公開前に、ソースファイル内で安定したフラグメントIDを確保したい場合に明示的に実行してください。

<a id="placeholder-protection"></a>
### プレースホルダー保護

翻訳前に、LLMによる破損を防ぐために、重要な構文は不透明なトークンに置き換えられます：

1. **注記マーカー**（`:::note`、`:::`） - 元のテキストを正確に復元します。
2. **ドキュメントアンカー**（HTML `<a id="…">`、Docusaurus見出し `{#…}`） - そのまま保持されます。
3. **MarkdownのURL**（`](url)`、`src="../…"`） - 翻訳後にマップから復元されます。

<a id="cache-translationcache"></a>
### キャッシュ (`TranslationCache`)

SQLiteデータベース（`node:sqlite`経由）は、`(source_hash, locale)`をキーとして、`translated_text`、`model`、`filepath`、`last_hit_at`および関連フィールドを持つ行を保存します。ハッシュは、正規化されたコンテンツ（空白を圧縮）のSHA-256の最初の16文字の16進数です。

各実行時に、セグメントはハッシュ×ロケールで検索されます。キャッシュヒットしなかったものだけがLLMに送られます。翻訳後、現在の翻訳スコープ内でヒットしなかったセグメント行に対して`last_hit_at`がリセットされます。`cleanup`はまず`sync --force-update`を実行し、次にヒットしなかったセグメント行（`last_hit_at`がnullまたはファイルパスが空）を削除し、解決されたソースパスがディスク上に存在しない場合に`file_tracking`キーを削除（`doc-block:…`、`svg-assets:…`など）し、メタデータのファイルパスが存在しないファイルを指している翻訳行を削除します。また、`--no-backup`が指定されていない限り、最初に`cache.db`をバックアップします。

`translate-docs`コマンドはまた、変更のないソースに対して既存の出力があれば処理を完全にスキップできるように**ファイル追跡**を使用しています。`--force-update`はセグメントキャッシュを引き続き使用しつつファイル処理を再実行します。`--force`はファイル追跡をクリアし、API翻訳のためにセグメントキャッシュの読み取りをバイパスします。完全なフラグ表については[Getting Started](GETTING_STARTED.ja.md#cache-behaviour-and-translate-docs-flags)を参照してください。

**バッチプロンプト形式：** `translate-docs --prompt-format`は`OpenRouterClient.translateDocumentBatch`に対してのみXML（`<seg>` / `<t>`）またはJSON配列/オブジェクト形式を選択します。抽出、プレースホルダー、検証は変更されません。[Batch prompt format](GETTING_STARTED.ja.md#batch-prompt-format)を参照してください。

<a id="output-path-resolution"></a>
### 出力パスの解決

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`はソース相対パスを出力パスにマッピングします：

- `nested` スタイル (デフォルト): markdown 用に `{outputDir}/{locale}/{relPath}` を使用。
- `docusaurus` スタイル: `docsRoot` 配下で、出力は `{outputDir}/{locale}/docusaurus-plugin-content-docs/current/{relativeToDocsRoot}` を使用。`docsRoot` 外のパスはネストされたレイアウトにフォールバック。
- `flat` スタイル: `{outputDir}/{stem}.{locale}{extension}`。`flatPreserveRelativeDir` が `true` の場合、ソースのサブディレクトリは `outputDir` 配下に保持される。
- **カスタム** `pathTemplate`: `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` を使用した任意の markdown レイアウト。
- **カスタム** `jsonPathTemplate`: JSON ラベルファイル用の個別のカスタムレイアウト。同じプレースホルダーを使用。
- `linkRewriteDocsRoot` は、翻訳された出力がデフォルトのプロジェクトルート以外に配置される場合に、フラットリンク書き換えツールが正しいプレフィックスを計算できるようにする。

<a id="flat-link-rewriting"></a>
### フラットリンクの書き換え

`markdownOutput.style === "flat"`の場合、翻訳されたMarkdownファイルはロケールのサフィックスを付けてソースと同じ場所に配置されます。ページ間の相対リンクは、`readme.de.md`の`[Guide](../guide.md)`が`guide.de.md`を指すように書き換えられます。`rewriteRelativeLinks`で制御され、カスタム`pathTemplate`なしのフラットスタイルでは自動的に有効になります。

---

<a id="shared-infrastructure"></a>
## 共有インフラストラクチャ

<a id="openrouterclient"></a>
### `OpenRouterClient`

OpenRouterのチャット補完APIをラップします。主な動作：

- **モデルフォールバック**: 解決されたリスト内の各モデルを順番に試行します。HTTPエラーや解析エラーの場合はフォールバックします。UI翻訳では、存在する場合にまず`ui.preferredModel`を解決し、次に`openrouter`モデルを解決します。
- **レート制限**: 429応答を検出すると、`retry-after`（または2秒）待機して1回再試行します。
- **デバッグ用トラフィックログ**: `debugTrafficFilePath`が設定されている場合、リクエストとレスポンスのJSONをファイルに追記します。

<a id="config-loading"></a>
### 設定の読み込み

`loadI18nConfigFromFile(configPath, cwd)`パイプライン：

1. `ai-i18n-tools.config.json` (JSON) を読み込んで解析。
2. `mergeWithDefaults` - `defaultI18nConfigPartial` とディープマージを行い、`documentations[].sourceFiles` エントリを `contentPaths` にマージ。
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales` がファイルパスの場合、マニフェストを読み込み、ロケールコードに展開。`uiLanguagesPath` を設定。
4. `expandDocumentationTargetLocalesInRawInput` - 各 `documentations[].targetLocales` エントリについて同様に処理。
5. `parseI18nConfig` - Zod によるバリデーション + `validateI18nBusinessRules`。
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE` などを適用。
7. `augmentConfigWithUiLanguagesFile` - マニフェストの表示名を関連付ける。

<a id="logger"></a>
### ロガー

`Logger`は、ANSIカラー出力で`debug`、`info`、`warn`、`error`レベルをサポートします。詳細モード（`-v`）では`debug`が有効になります。`logFilePath`が設定されている場合、ログ行はそのファイルにも書き込まれます。

---

<a id="runtime-helpers-api"></a>
## ランタイムヘルパー API

これらは`'ai-i18n-tools/runtime'`からエクスポートされ、任意のJavaScript環境（ブラウザ、Node.js、Deno、Edgeなど）で動作します。`i18next`や`react-i18next`からのインポートは**行いません**。

<a id="rtl-helpers"></a>
### RTL ヘルパー

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 設定ファクトリ

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

通常のアプリケーションエントリポイントとして `setupKeyAsDefaultT` を使用してください（キーのトリミング＋複数形 `wrapT`＋オプションの `translate-ui` `{sourceLocale}.json`）。アプリケーションの配線において、単独で `wrapI18nWithKeyTrim` を呼び出すことは**非推奨**です。

`generate-ui-languages` 後も `targetLocales` とキーが一致するように、`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` を使用して `localeLoaders` を構築してください。`docs/GETTING_STARTED.md`（ランタイム配線）および `examples/nextjs-app/` / `examples/console-app/` を参照してください。

<a id="display-helpers"></a>
### 表示ヘルパー

```ts
getUILanguageLabel(lang: UiLanguageEntry, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageEntry): string
```

<a id="string-helpers"></a>
### 文字列ヘルパー

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

---

<a id="programmatic-api"></a>
## プログラムによるAPI

すべてのパブリック型およびクラスはパッケージルートからエクスポートされます。例：CLIを使わずにNode.jsでUI翻訳ステップを実行する場合：

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
| `TranslationCache` | SQLite キャッシュ - `cacheDir` パスでインスタンス化します。 |
| `UIStringExtractor` | JS/TS ソースから `t("…")` 文字列を抽出します。 |
| `MarkdownExtractor` | Markdown から翻訳対象のセグメントを抽出します。 |
| `JsonExtractor` | Docusaurus の JSON ラベルファイルから抽出します。 |
| `SvgExtractor` | SVG ファイルから抽出します。 |
| `OpenRouterClient` | OpenRouter に翻訳リクエストを送信します。 |
| `PlaceholderHandler` | 翻訳の前後で Markdown 構文を保護・復元します。 |
| `splitTranslatableIntoBatches` | セグメントを LLM 向けのバッチサイズにグループ化します。 |
| `validateTranslation` | 翻訳後の構造チェックを実行します。 |
| `resolveDocumentationOutputPath` | 翻訳済みドキュメントの出力ファイルパスを解決します。 |
| `Glossary` / `GlossaryMatcher` | 翻訳用語集を読み込み、適用します。 |
| `runTranslateUI` | プログラムによる翻訳UIのエントリポイントです。 |

---

<a id="extension-points"></a>
## 拡張ポイント

<a id="custom-function-names-ui-extraction"></a>
### カスタム関数名（UI抽出）

設定を通じて非標準の翻訳関数名を追加します。

```json
{
  "ui": {
    "reactExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"]
    }
  }
}
```

<a id="custom-extractors"></a>
### カスタムエクストラクタ

パッケージから `ContentExtractor` を実装します。

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

プログラムで `doc-translate.ts` ユーティリティをインポートし、doc-translate パイプラインに渡します。

<a id="custom-output-paths"></a>
### カスタム出力パス

任意のファイル構成に `markdownOutput.pathTemplate` を使用します。

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
