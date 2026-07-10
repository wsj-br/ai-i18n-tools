<a id="documents"></a>
# ドキュメント

主に**Markdown、MDX、および`.astro`ドキュメント**用に設計されており、`docs[]`設定ブロックを通じて管理されます。各ブロックの`contentPaths`フィールドには、翻訳するファイルまたはフォルダーがリストされます。

Docusaurusサイトでは、`docusaurusCatalogDir`を`write-translations`カタログフォルダー（例: `docs-site/i18n/en`）に設定します。これにより、`translate-docs`にはシェルJSONも含まれます。ナビゲーションバー、フッター、テーマの文字列などです。

[VitePress](/ja/guide/integrations/vitepress) サイトでは、ページ本文は同じ `docs[]` パイプラインを使用します。ナビゲーション、サイドバー、フッターのラベルは `docsOutput.vitepressThemeCatalog` に存在します — `translate-docs` は英語のカタログをブートストラップし、ページと一緒に翻訳します。別のパイプラインは不要です。

[Nextra](/ja/guide/integrations/nextra) サイトでは、ページ本文は `docsOutput.style: "nextra"` を伴う同じ `docs[]` パイプラインを使用します。`_meta.ts` サイドバーのラベルは `translate-docs` によって自動的に収集および翻訳されます。テーマ辞書の文字列は、同じパイプライン内で `docs[].nextraDictionaryPath` を介して翻訳されます。

[Fumadocs](/ja/guide/integrations/fumadocs) サイトでは、ページ本文は `fumadocsParser` `"dot"` (デフォルト) または `"dir"` を伴う `docsOutput.style: "fumadocs"` を使用します。`meta.json` サイドバーのラベルは自動的に収集されます。UI オーバーライドは `docsOutput.fumadocsUiCatalog` を介して翻訳されます。

Markdownに埋め込まれたPNGやその他のラスター画像については、[画像とスクリーンショット](/ja/guide/images-and-screenshots/)を参照してください。`translate-docs`は代替テキストのみを翻訳し、ラスターファイルをコピーしません。

READMEまたはドキュメントにオプションの**言語スイッチャー**ブロックを配置するには、`docsOutput.style`を`"flat"`に設定します。詳細については、[言語スイッチャー](/ja/guide/documents/language-switcher)を参照してください。

SVGファイルは、`features.translateSVG`が有効な場合に[`translate-svg`](/ja/reference/cli-commands/content#translate-svg)経由で翻訳されます — `docs[]` / `contentPaths`経由ではありません。

ドキュメントフレームワークのシェル/テーマ文字列とは無関係な任意のネストされたUI JSONバンドルは、`docs[]`ではなく、[JSON](/ja/guide/json)パイプラインに属します。

<a id="per-locale-model-overrides"></a>
### ロケールごとのモデルオーバーライド

`translate-docs`と`sync`のドキュメントステップは、モデルを**ターゲットロケールごとに**解決します。まず、設定されている場合は`localeModels(locale)`、次にプロバイダーのグローバル`translationModels`チェーンを解決します。これは、特定の言語でデフォルトのフォールバックリストとは異なるモデルが必要な場合に使用します。たとえば、グローバルチェーンがポルトガル語で苦戦する場合に、`pt-BR`ドキュメントにGeminiを優先する場合などです。[プロバイダーとモデル](/ja/guide/providers-and-models#model-fallback-chain)および[構成 — `localeModels`](/ja/reference/configuration#provider-and-providers)を参照してください。

<a id="which-guide-to-read"></a>
## 読むべきガイド

| 設定 | ここから開始 |
| --- | --- |
| Docusaurusサイト | `init -t ui-docusaurus`、`docsOutput.style = "docusaurus"` — [ステップ1](#step-1-initialise-for-documentation) |
| VitePress サイト | テーマ用 `init -t ui-vitepress` + `vitepressThemeCatalog` — [VitePress インテグレーション](/ja/guide/integrations/vitepress) |
| Nextra サイト | 辞書用 `init -t ui-nextra` + `nextraDictionaryPath` (サイドバー `_meta.ts` は自動) — [Nextra インテグレーション](/ja/guide/integrations/nextra) |
| Fumadocs サイト | UI 用 `init -t ui-fumadocs` + `fumadocsUiCatalog` (サイドバー `meta.json` は自動) — [Fumadocs インテグレーション](/ja/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` — [ステップ1](#step-1-initialise-for-documentation) |
| フラットドキュメント (README、変更ログなど) | `docsOutput.style = "flat"` — [出力レイアウト](/ja/guide/documents/output-layouts)、オプションの[言語スイッチャー](/ja/guide/documents/language-switcher) |
| 翻訳されたファイルの保存場所 | [出力レイアウト](/ja/guide/documents/output-layouts) |
| ページ間の`#anchor`リンク | [アンカーリンク](/ja/guide/documents/anchor-links) |
| リンクとアセットの URL 書き換え (`regexAdjustments`) | [リンクの書き換え](/ja/guide/documents/link-rewriting) |
| ドキュメント内のスクリーンショット | [画像とスクリーンショット](/ja/guide/images-and-screenshots/) |
| `translate-docs`フラグとキャッシュ | [CLIオプション](/ja/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## ステップ1: ドキュメントの初期化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Astro Starlight ドキュメントサイトの場合：

```bash
npx ai-i18n-tools init -t ui-starlight
```

VitePressドキュメントサイトの場合:

```bash
npx ai-i18n-tools init -t ui-vitepress
```

ナビゲーション/サイドバー/フッターの文字列に `docsOutput.vitepressThemeCatalog` を設定します — [VitePress インテグレーション](/ja/guide/integrations/vitepress) を参照してください。

Nextraドキュメントサイトの場合:

```bash
npx ai-i18n-tools init -t ui-nextra
```

テーマ辞書の文字列に `docs[].nextraDictionaryPath` を設定します — [Nextra インテグレーション](/ja/guide/integrations/nextra) を参照してください。サイドバーの `_meta.ts` ラベルは自動的に収集されます。

Fumadocsドキュメントサイトの場合:

```bash
npx ai-i18n-tools init -t ui-fumadocs
```

UI オーバーライドに `docsOutput.fumadocsUiCatalog` を設定します — [Fumadocs インテグレーション](/ja/guide/integrations/fumadocs) を参照してください。サイドバーの `meta.json` ラベルは自動的に収集されます。

プレーンなAstroウェブサイトUI（Starlightなし）の場合：

```bash
npx ai-i18n-tools init -t ui-astro-website
```

このテンプレートはUI抽出のみを有効にします。ページHTMLの翻訳には、`features.translateDocs`も設定し、`docs[]`ブロックを追加します（[Astroウェブサイトページ (解析と置換)](/ja/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)を参照）。[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)設定は、両方のパイプラインを一緒に示しています。

生成された`ai-i18n-tools.config.json`を編集します。

- `provider`および`providers` — `init`はデフォルトでOpenRouterをスキャフォールドします。`translate-docs`または`sync`の前に、少なくとも1つのプロバイダーを設定し、そのAPIキーを設定してください（Ollamaはキー不要）。[プロバイダーとAPIキー](/ja/guide/quick-start#provider-and-api-key)および[LLMプロバイダーとモデル](/ja/guide/providers-and-models)を参照してください。
- `sourceLocale` - ソース言語（`docusaurus.config.js`の`defaultLocale`と一致する必要があります）。
- `targetLocales` - BCP-47ロケールコードの配列（例: `["de", "fr", "es"]`）。
- `cacheDir` - すべてのパイプラインの共有SQLiteキャッシュディレクトリ（および`--write-logs`のデフォルトログディレクトリ）。
- `docs` - ドキュメントブロックの配列。各ブロックにはオプションの`description`、`contentPaths`（文字列または配列、ファイル、ディレクトリ、またはglob）、`outputDir`、オプションの`docusaurusCatalogDir`、`docsOutput`、オプションの`segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter`などがあります。
- `docs[].description` - メンテナ向けのオプションの短いメモ。設定すると、`translate-docs`の見出しと`status`のセクションヘッダーに表示されます。
- `docs[].contentPaths` - markdown/MDX/`.astro`ソース（およびDocusaurusシェルJSON用のオプションの`docusaurusCatalogDir`）。
- `docs[].outputDir` - そのブロックの翻訳出力ルート。
- `docs[].docsOutput.style` - `"nested"`（デフォルト）、`"flat"`、`"doc-system"`、またはエイリアス`"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"`（[出力レイアウト](/ja/guide/documents/output-layouts)を参照）。

**プライマリ対サプライメンタリ：** ローカライズされたページには `contentPaths` を使用してください。`write-translations` から Docusaurus シェルの JSON も必要な場合は、`docusaurusCatalogDir` を設定します。ページの翻訳のみを行う場合は、`docusaurusCatalogDir` を省略してください。

<a id="step-2-translate-documents"></a>
## ステップ2: ドキュメントを翻訳する

```bash
npx ai-i18n-tools translate-docs
```

これは、すべての`docs[]`ブロックの`contentPaths`（および`docusaurusCatalogDir`が設定されている場合はDocusaurusカタログJSON）内のすべてのファイルを、すべての有効なドキュメントロケールに翻訳します。すでに翻訳されたセグメントはSQLiteキャッシュから提供され、新規または変更されたセグメントのみがLLMに送信されます。

単一のロケールを翻訳するには：

```bash
npx ai-i18n-tools translate-docs --locale de
```

翻訳が必要な内容を確認するには：

```bash
npx ai-i18n-tools status
```

フラグ、キャッシュの動作、およびバッチプロンプトの形式については、[CLIオプション](/ja/guide/documents/cli-options)を参照してください。

<a id="complex-markdown-and-failed-quality-checks"></a>
## 複雑なMarkdownと品質チェックの失敗

`translate-docs`は、各翻訳されたセグメントがMarkdown構造（文書から解析された強調も含む）を保持しているかをチェックします。多くの`bold`スパンが`` `inline code` ``の周囲に重なっている段落、太字内にバッククォートがネストしている（たとえばテンプレートリテラル`` `fetch(\`/locales/${code}.json\`)` ``など）、または長い文のなかで太字とコードが複雑に交じっている場合、構造は脆弱です。一部のロケールでは語順が異なる必要があり、翻訳後に`**`と`` ` ``の位置関係が変化して`AST mismatch`などのCLIエラーを引き起こす可能性があります。

**このような検証の失敗が発生した場合は、ソース言語のテキストを簡素化する**ことをお勧めします。段落を分割したり、例をフェンスで囲まれたコードブロックに移動したり、同じアイデアをより少ない階層の太字/コードのペアで記述したりするなど、すべてのモデルとロケールが密なインラインマークアップを完全に再現することを期待するよりも、簡素化を優先してください。

すべての構成済みモデルが同じセグメントで `AST mismatch` エラーを発生させた場合、`translate-docs` はそのセグメントをより小さい部分に自動的に分割できます（最初にリストの中間点、次に個々のリスト項目または短い段落のチャンク）。その後、各部分を最初のモデルから再試行し、元のセグメントキャッシュキーの下で結果を再結合します。これはデフォルトで有効になっています（`segmentSplitting.qualityRetrySplit`）。モデルを使い切った後に停止するには、`false` に設定してください。このフォールバックが実行された場合、実行サマリーに `Quality split retries` が報告されます。

どの**セグメントが失敗したか**、その頻度、および保存されている**品質/エラーメッセージ**を確認するには、翻訳ダッシュボードの**失敗**タブ（[翻訳ダッシュボード → 失敗](/ja/guide/translation-dashboard/failures#failures-document-translation)）を使用します。
