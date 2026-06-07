<a id="ai-i18n-tools-package-overview"></a>
# ai-i18n-tools: パッケージの概要

`ai-i18n-tools`の内部アーキテクチャ、各コンポーネントの統合方法、および3つの合成可能なワークフロー（UI文字列、ドキュメント、ネストされたJSON）とオプションのSVG翻訳の実装方法について説明します。

実際の使用方法については、[GETTING_STARTED.md](GETTING_STARTED.ja.md) を参照してください。翻訳されたドキュメント内のスクリーンショットや図入りSVGについては、[LOCALE-ASSETS-GUIDE.md](LOCALE-ASSETS-GUIDE.ja.md) を参照してください。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (GB)](../../docs/PACKAGE_OVERVIEW.md) · [Deutsch](./PACKAGE_OVERVIEW.de.md) · [Español](./PACKAGE_OVERVIEW.es.md) · [Français](./PACKAGE_OVERVIEW.fr.md) · [हिन्दी](./PACKAGE_OVERVIEW.hi.md) · [日本語](./PACKAGE_OVERVIEW.ja.md) · [한국어](./PACKAGE_OVERVIEW.ko.md) · [Português (Brasil)](./PACKAGE_OVERVIEW.pt-BR.md) · [中文 (中国大陆)](./PACKAGE_OVERVIEW.zh-CN.md) · [中文 (台灣)](./PACKAGE_OVERVIEW.zh-TW.md)</small>

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
- [ワークフロー3 - ネストされたJSONの内部構造](#workflow-3---nested-json-internals)
  - [エクストラクター](#extractors)
  - [Astroハイブリッドサイト（UI + ページHTML）](#astro-hybrid-sites-ui--page-html)
  - [見出しアンカー挿入（`write-heading-ids` CLI）](#heading-anchor-insertion-write-heading-ids-cli)
  - [プレースホルダー保護](#placeholder-protection)
  - [キャッシュ（`TranslationCache`）](#cache-translationcache)
  - [出力パス解決](#output-path-resolution)
  - [フラットリンクの書き換え](#flat-link-rewriting)
- [共有インフラストラクチャー](#shared-infrastructure)
  - [`OpenRouterClient`](#openrouterclient)
  - [設定の読み込み](#config-loading)
  - [ロガー](#logger)
- [ランタイムヘルパーAPI](#runtime-helpers-api)
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

<a id="architecture-overview"></a>
## アーキテクチャの概要

```text
ai-i18n-tools
├── CLI (src/cli/)             - commands: init, extract, translate-ui, translate-svg, translate-docs, translate-json, sync, status, dashboard, …
├── Core (src/core/)           - config, types, cache, prompts, output paths, UI languages
├── Extractors (src/extractors/)  - segment extraction from JS/TS, markdown, JSON, SVG
├── Processors (src/processors/)  - MDX placeholders, HTML tags, admonitions, anchors, URLs, batching, validation, link rewriting, emphasis
├── API (src/api/)             - OpenRouter HTTP client
├── Glossary (src/glossary/)   - glossary loading and term matching
├── Runtime (src/runtime/)     - i18next helpers, display helpers (no i18next import)
├── Server (src/server/)       - local Express app for the Translation Dashboard (cache / glossary)
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
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
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
│   ├── locale-utils.ts             BCP-47 normalisation and locale list parsing
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
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
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
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
source files (JS/TS, optional `.astro`)
      │
      ▼  UIStringExtractor (i18next-scanner Parser; `.astro` via ui-string-babel.ts)
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

`i18next-scanner`の`Parser.parseFuncFromString`を使用して、JS/TSファイル内の`t("literal")`および`i18n.t("literal")`呼び出しを検出します。`.astro`ソース（`ui.uiExtractor.extensions`に記載されている場合）については、`ui-string-babel.ts`がfrontmatterとテンプレート内の`{expression}`ブロックを`@babel/parser`で解析し、同じ`funcNames`ルールを適用します。関数名およびファイル拡張子は`ui.uiExtractor`で設定可能で、`ui.reactExtractor`はサポートされているエイリアスです。`extract`は**スキャナー以外の入力も同じカタログに統合します。**プロジェクトの`package.json` `description`（`includePackageDescription`が有効の場合、デフォルトで有効）および`includeUiLanguageEnglishNames`が`true`かつ`uiLanguagesPath`が設定されている場合の`ui-languages.json`からの各`englishName`（ソース内で既に見つかった文字列が優先されます）。セグメントのハッシュは、トリム済みのソース文字列の**MD5の最初の8桁の16進数**であり、これが`strings.json`内のキーとなります。

シンプルなAstro SSGサイトはi18nextをスキップできます。ビルド時にフラットな`{locale}.json`を読み込み、ソーステキストのキーで`t('English')`を解決します（`examples/astro-website/src/i18n/t.ts`および[GETTING_STARTED — Astro website](GETTING_STARTED.ja.md#astro-website)を参照）。

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

`models`（任意）— 各ロケールごとに、そのロケールで最後に成功した`translate-ui`実行後にどのモデルが翻訳を生成したか（または翻訳ダッシュボードからテキストが保存された場合は`user-edited`）。`locations`（任意）— `extract`が文字列をどこで発見したか（スキャナー＋パッケージの説明行。マニフェスト専用の`englishName`文字列は`locations`を省略する場合あり）。

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
markdown / MDX / JSON / `.astro` files (`translate-docs`)
      │
      ▼  MarkdownExtractor / JsonExtractor / AstroTemplateExtractor
segments[]  ─────────────────── typed segments with hash + content
      │
      ▼  PlaceholderHandler
protected text  ──────────────── HTML tags, admonitions, anchors, MDX comments/JSX/braces,
                                URLs, inline code, emphasis masked as tokens
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

- `MarkdownExtractor` - Markdownを型付きセグメントに分割：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。YAML frontmatterは**翻訳不要**と分類されます（`slug`、`id`、その他のルーティングキーは安定したまま）。トップレベルの`export ...`ブロック（例：Reactコンポーネント定義）は、既存の`import ...`処理と同様に、翻訳不要な`other`セグメントとして分類されます。大文字のJSXタグで始まる複数行のブロック（例：`<Tabs>`ブロック）は、翻訳可能な段落として分類されます。翻訳不要なセグメント（コードブロック、生のHTML）はそのまま保持されます。
- `AstroTemplateExtractor` - `.astro`マーケティングページ向けの解析と置換（`doc-translate.ts`の`translateAstroFile`経由で`translate-docs`）。ユーザー向けHTMLのテキストノードおよび翻訳可能な属性（`alt`、`title`、`aria-label`、`placeholder`）を抽出し、ユーザー向けである場合、テンプレート内の`{expression}`ブロック内の文字列リテラルも抽出します。frontmatter内のTypeScript、`<script>`、`<style>`、保護された属性/キーの値、および`t('…')`内のリテラルはスキップされます。再構成では、出力パスが深くなった場合に相対インポートを調整します（例：`src/pages/de/index.astro`）。[GETTING_STARTED — Astro website pages](GETTING_STARTED.ja.md#astro-website-parse-and-replace)を参照してください。
- `JsonExtractor` - DocusaurusのJSONラベルファイルから文字列値を抽出（Docusaurus UIカタログ、MDX本文ではない）。
- `SvgExtractor` - SVGから`<text>`、`<title>`、`<desc>`の内容を抽出（`config.svg`以下のファイルに対して`translate-svg`で使用、`translate-docs`では使用しない）。

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro ハイブリッドサイト (UI + ページHTML)

シンプルなAstroアプリでは、1つの設定で**両方**のワークフローを有効にすることがよくあります（参照：`examples/astro-website/`）：

| レイヤー | メカニズム | 出力 |
|-------|-----------|--------|
| テンプレートHTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` 配下のロケールごとの `.astro` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | フラットな`public/locales/{locale}.json`（英語ソースをキーとして使用） |

`sync`コマンドは、有効化されたステップを順に実行します：**extract**、次に`features.translateUIStrings`の場合は**translate-ui** → オプションで**translate-svg** → **translate-docs** → オプションで**translate-json**（`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`でスキップしない限り）。initテンプレート`ui-astro-website`はワークフロー1のみをスキャフォールドします。ページHTML用に`docs[]`と`features.translateDocs`を追加してください。

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 見出しアンカーの挿入（`write-heading-ids` CLI）

`write-heading-ids` コマンドは、ドキュメントの Markdown 用の**ローカルかつ非LLM**な前処理ツールです。実装：`src/cli/write-heading-ids.ts` がファイルの検出を調整し、`src/markdown/write-heading-ids-core.ts` が行を解析してアンカーを挿入します。

有効な設定ファイルが必要で、**少なくとも1つの `docs[]` ブロック**を含める必要があります。各ブロックについて、`contentPaths` 配下の `.md` / `.mdx` ファイルを収集し、プロジェクトの `.translate-ignore` 規則（ドキュメント翻訳と同じ概念）を適用します。また、必要に応じて `--path` / `--file` でサブツリーを制限できます。各ファイルは `applyHeadingAnchorsToMarkdown` で変換されます。コードブロック外の**フラットなATX見出し**（`# …` から `###### …`）ごとに、上側の行に空のHTML行 `<a id="slug"></a>` を挿入します（存在しない、または古くなっている場合）。スラッグ生成アルゴリズムは一般的なエコシステムと一致しています — `github`（デフォルト）、`bitbucket`、`gitlab`、`pymdown`（オプションのUnicode正規化／パーセントエンコーディングフラグ）、`azure-devops` — これにより、アンカーIDが既存のツール（doctoc、PyMdownなど）と一貫性を保ちます。`--dry-run` レポートは、実際に書き込みを行わず、変更予定内容を表示します。

このコマンドは `translate-docs` や `sync` 内では**実行されません**。翻訳または公開前に、ソースファイル内で安定したフラグメントIDを確保したい場合に明示的に実行してください。

<a id="placeholder-protection"></a>
### プレースホルダー保護

翻訳前に、LLMによる破損を防ぐために、機微な構文が不透明なトークンに置き換えられます。以下の順序で適用されます（復元は逆順）：

1. **HTMLタグおよびコメント**（`<strong>`、`<!-- ... -->`など） - 許可リストに含まれる小文字のHTMLタグは`{{HTM_N}}`トークンに置き換えられます。大文字で始まるJSXタグ（`<Highlight>`、`<Tabs>`、`</Tab>`）はMDXレイヤー（ステップ4）によって別途処理されます。
2. **注記マーカー**（`:::note`、`:::`） - 開始行のディレクティブ接頭辞のみが`{{ADM_OPEN_N}}`に置き換えられます。同じ行にあるタイトルはモデルによる翻訳対象として残されます。復元時は元のテキストと完全に一致させます。
3. **ドキュメントアンカー**（HTMLの`<a id="…">`、Docusaurusの見出し`{#…}`） - そのまま保持されます。
4. **MDX専用の構成要素**（`src/processors/mdx-placeholders.ts`）：
   - **MDXコメント**（`{/* … */}`、Docusaurusのheading-id形式 `{/* #my-id */}` を含む）は `{{MDX_N}}` に置き換えられます。
   - **大文字で始まるJSXタグ**（`<Highlight>`、`<Tabs>`、`<TabItem>`、`<TOCInline />`、`</Highlight>`）— `{{MDX_N}}` として保持され、翻訳可能な文字列属性（`label`、`tooltip`、`aria-label`）は、属性名が `docs[].protectAttributes` に含まれていない限り、タグ内にて `{{JXA_N}}` に書き換えられます。`label:` は `<Tabs values={[ { label: '…' } ]}>` オブジェクトリテラル内でも抽出され（`docs[].protectKeys` でスキップ可能）、`<TabItem value="…">` も同様に抽出されます（`label` 属性が存在せず、小文字のスラッグ風の値はスキップ）。これらはセグメントに `||JXA_N: …||` 行として追加され、`restoreMdx` によって元に戻されます。
   - **MDXの波括弧式**（`{frontMatter.title}`、`style={{…}}`）— ネスト深さを考慮したマッチングを行い、`{{MDX_N}}` に置き換えます。
5. **MarkdownのURL**（`](url)`、`src="../../docs/…"`）— 翻訳後にマップから復元されます。
6. **インラインコードスパン**（`` `code` ``）および**太字で囲まれたインラインコード**（`**`code`**`） - そのまま保持されます。
7. **Markdownの強調**（オプション。CJK/RTLロケールでは自動有効） - 強調区切り記号をマスクします。

AstroテンプレートおよびMDX JSXの共通属性／キー保護は `src/processors/expression-attribute-protection.ts` で実装されており、各ブロックごとに `docs[].protectAttributes` および `docs[].protectKeys` によって制御されます（[GETTING_STARTED — protectAttributes / protectKeys](GETTING_STARTED.ja.md#protectattributes-protectkeys)を参照）。

<a id="cache-translationcache"></a>
### キャッシュ (`TranslationCache`)

SQLiteデータベース (`node:sqlite` 経由) は、`(source_hash, locale)` をキーとして `translated_text`、`model`、`filepath`、`last_hit_at` および関連フィールドを持つ行を格納します。ハッシュは、正規化されたコンテンツ（空白文字を圧縮）のSHA-256の最初の16文字の16進数です。

各実行時、セグメントはハッシュ×ロケールで検索されます。キャッシュミスの場合のみLLMが呼び出されます。翻訳後、現在の翻訳スコープ内でヒットしなかったセグメント行の`last_hit_at`がリセットされます。ドキュメント翻訳中のキャッシュヒット成功時に、そのセグメントの古くなった`translation_failures`行がクリアされます。`cleanup`はまず`sync --force-update`を実行し、その後、古くなったセグメント行（`last_hit_at`がnullまたはファイルパスが空）を削除し、解決されたソースパスがディスク上に存在しない場合に`file_tracking`キーを削除（`doc-block:…`、`json-block:…`、`svg-files:…`など）、メタデータのファイルパスが存在しないファイルを指している翻訳行を削除し、孤立した`translation_failures`行を削除します。また、`--no-backup`が指定されていない限り、最初に`cache.db`をバックアップします。

`translate-docs`コマンドはまた、既存の出力を持つ変更されていないソースが処理を完全にスキップできるように**ファイル追跡**を使用します。`--force-update`はセグメントキャッシュを引き続き使用しつつファイル処理を再実行します。`--force`はファイル追跡をクリアし、API翻訳用にセグメントキャッシュの読み取りをバイパスします。構成されたすべてのモデルがマークダウンセグメントでAST検証に失敗した場合、`translate-docs`はセグメントを段階的に分割し、より小さな部分を再試行できます（`docs[].segmentSplitting.qualityRetrySplit`、デフォルトで有効）。完全なフラグ表については、[Getting Started](GETTING_STARTED.ja.md#cache-behaviour-and-translate-docs-flags)を参照してください。

**バッチプロンプト形式：** `translate-docs --prompt-format`は`OpenRouterClient.translateDocumentBatch`に対してのみXML（`<seg>` / `<t>`）またはJSON配列/オブジェクト形式を選択します。抽出、プレースホルダー、検証は変更されません。[Batch prompt format](GETTING_STARTED.ja.md#batch-prompt-format)を参照してください。

<a id="output-path-resolution"></a>
### 出力パスの解決

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`はソース相対パスを出力パスにマッピングします：

- `nested` スタイル（デフォルト）: markdown 用の `{outputDir}/{locale}/{relPath}`。
- `doc-system` スタイル: `docsRoot` 配下で、出力は `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` を使用。`docsRoot` の外側のパスは入れ子レイアウトにフォールバック。エイリアス: `docusaurus`（デフォルト `localeSubpath` = Docusaurus プラグインパス）、`astro-starlight`（デフォルトの `localeSubpath` は空）。
- `flat` スタイル: `{outputDir}/{stem}.{locale}{extension}`。`flatPreserveRelativeDir` が `true` の場合、ソースのサブディレクトリは `outputDir` 配下に保持される。
- **カスタム** `pathTemplate`: `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` を使用した任意の markdown レイアウト。
- **カスタム** `jsonPathTemplate`: JSON ラベルファイル用の個別のカスタムレイアウト。同じプレースホルダーを使用。
- `linkRewriteDocsRoot` は、翻訳された出力がデフォルトのプロジェクトルート以外に配置される場合に、フラットリンク書き換えツールが正しいプレフィックスを計算できるようにする。

<a id="flat-link-rewriting"></a>
### フラットリンクの書き換え

`docsOutput.style === "flat"` 時、翻訳されたMarkdownファイルはロケールサフィックスを付けてソースファイルと同じ場所に配置されます。ページ間の相対リンクは書き換えられ、`readme.de.md` 内の `[Guide](../../docs/guide.md)` が `guide.de.md` を指すようになります。これは `rewriteRelativeLinks` で制御され、カスタム `pathTemplate` を使用しないフラットスタイルでは自動的に有効になります。同じ処理では、`postProcessing.regexAdjustments` 実行前に、非MarkdownアセットのURLにファイルごとの階層深度プレフィックスが付加されます — [ロケールアセットガイド](LOCALE-ASSETS-GUIDE.ja.md#the-flat-link-rewriter-and-two-step-flow) を参照してください。

---

<a id="workflow-3---nested-json-internals"></a>
## ワークフロー3 - ネストされたJSONの内部構造

```text
json[].contentPaths  →  resolve files (file | directory | glob)
      │
      ▼  NestedJsonExtractor
string leaves selected by keyPolicy (dot paths + minimatch)
      │
      ▼  PlaceholderHandler + batch + TranslationCache (shared SQLite)
cache hit → skip, miss → OpenRouterClient.translateDocumentBatch
      │
      ▼  NestedJsonExtractor.reassemble
output file  ─────────── expandJsonBlockOutputPath(outputPathTemplate)
```

- `NestedJsonExtractor`（`src/extractors/nested-json-extractor.ts`）は任意のネストされたJSONを走査し、翻訳可能な文字列リーフごとに1つのセグメントを出力します。`keyPolicy.mode`（`allowlist`、`denylist`、または`both`）はドット表記でのminimatchを使用してパスをフィルタリングします（`slug`のような単純名は最終キーのセグメントに一致します）。
- キャッシュファイル追跡は`file_tracking`内の`json-block:{blockIndex}:{projectRelPath}`を使用します（ドキュメントおよびSVGと同じ`cacheDir`）。
- Docusaurus `write-translations`カタログ（`{ message, description }`の形状）には**使用しないでください** — これらはワークフロー2（`docs[].docusaurusCatalogDir` + `JsonExtractor`を`translate-docs`内に含む）を使用します。
- `t()` UI文字列には**使用しないでください** — ワークフロー1（`strings.json` + フラットバンドル）を使用します。
- CLI：`translate-json`；オーケストレーションは`src/cli/translate-json-run.ts`内。initテンプレート：`ui-json-bundles`。

---

<a id="shared-infrastructure"></a>
## 共有インフラストラクチャ

<a id="openrouterclient"></a>
### `OpenRouterClient`

OpenRouterのチャット補完APIをラップします。主な動作：

- **モデルフォールバック**: 解決されたリスト内の各モデルを順番に試行します。HTTPエラーや解析エラーの場合はフォールバックします。UIの翻訳では、存在する場合に `ui.preferredModel` を最初に解決し、次に `openrouter` モデルを解決します。
- **リクエストタイムアウト**: `openrouter.requestTimeoutMs`（デフォルト30秒）により、`AbortSignal.timeout` 経由で各チャット補完リクエストが中止されます。この同じ値がCLIがカタログを読み込む際に `GET /models` にも適用されます（例：`check-models` および不明なモデルIDを除外するオプションの事前フィルタリング）。
- **レート制限**: 429応答を検出し、`retry-after`（または2秒）待機して1回再試行します。
- **デバッグ用トラフィックログ**: `debugTrafficFilePath` が設定されている場合、リクエストおよび応答のJSONをファイルに追記します。

<a id="config-loading"></a>
### 設定の読み込み

`loadI18nConfigFromFile(configPath, cwd)`パイプライン：

1. `ai-i18n-tools.config.json` を読み込み、解析する（JSON）。
2. `mergeWithDefaults` — `defaultI18nConfigPartial` と深くマージし、`docs[].sourceFiles` エントリを `contentPaths` に統合する。
3. `expandTargetLocalesFileReferenceInRawInput` — `targetLocales` がファイルパスの場合、マニフェストを読み込み、ロケールコードに展開し、`uiLanguagesPath` を設定する。
4. `expandDocumentationTargetLocalesInRawInput` — 各 `docs[].targetLocales` エントリについて同様に処理。
5. `parseI18nConfig` - Zod によるバリデーション + `validateI18nBusinessRules`。
6. `applyEnvOverrides` - `OPENROUTER_API_KEY`、`I18N_SOURCE_LOCALE` などを適用。
7. `augmentConfigWithUiLanguagesFile` - マニフェストの表示名を関連付ける。

`init`は`initConfigTemplates`からスターターコンフィグを書き出します：`ui-markdown`（UI + オプションのアプリマークダウン）、`ui-docusaurus`、`ui-starlight`、`ui-astro-website`（プレーンAstro UI；`.astro`ページ翻訳用に`docs[]`を追加）、`ui-json-bundles`（ワークフロー3の`json[]`のみ）。[GETTING_STARTED — 初期化](GETTING_STARTED.ja.md#step-1-initialise)を参照してください。

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

`generate-ui-languages`後に`targetLocales`とキーが一致するように、`makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)`で`localeLoaders`をビルドします。`docs/GETTING_STARTED.md`（ランタイム接続）、`examples/nextjs-app/`、`examples/console-app/`、`examples/astro-website/`（i18nextなしのカスタム`makeT`）を参照してください。

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
| `JsonExtractor` | DocusaurusのJSONラベルファイルから抽出（UIカタログ、MDX本文ではない）。 |
| `SvgExtractor` | SVG ファイルから抽出します。 |
| `OpenRouterClient` | OpenRouter に翻訳リクエストを送信します。 |
| `PlaceholderHandler` | 翻訳前後にMarkdown構文（HTMLタグ、注記、アンカー、MDXコメント/JSX/波括弧、URL、インラインコード、強調）を保護・復元します。 |
| `protectMdx` / `restoreMdx` | MDXコメント、JSXタグ、波括弧式、JSX文字列属性を保護・復元します（`PlaceholderHandler`から呼び出され、直接使用するためにエクスポートもされます）。 |
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
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro"]
    }
  }
}
```

（`ui.reactExtractor`は`ui.uiExtractor`の完全にサポートされたエイリアスです。）

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

任意のファイルレイアウトには `docsOutput.pathTemplate` を使用します

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```
