<a id="documents"></a>
# ドキュメント

主に**Markdown、MDX、および`.astro`ドキュメント**用に設計されており、`docs[]`設定ブロックを通じて管理されます。各ブロックの`contentPaths`フィールドには、翻訳するファイルまたはフォルダーがリストされます。

[Docusaurus](/ja/guide/integrations/docusaurus) サイトでは、`docusaurusCatalogDir` を `write-translations` カタログフォルダ（例: `docs-site/i18n/en`）に設定します。これにより、`translate-docs` にはナビバー、フッター、テーマ文字列などのシェル JSON も含まれます。

[VitePress](/ja/guide/integrations/vitepress) サイトでは、ページ本文は同じ `docs[]` パイプラインを使用します。ナビ、サイドバー、フッターのラベルは `docsOutput.vitepressThemeCatalog` に存在し、`translate-docs` は英語カタログをブートストラップしてページと一緒に翻訳するため、別のパイプラインは不要です。

[Nextra](/ja/guide/integrations/nextra) サイトでは、ページ本文は `docsOutput.style: "nextra"` を伴う同じ `docs[]` パイプラインを使用します。`_meta.ts` サイドバーのラベルは `translate-docs` によって自動的に収集および翻訳されます。テーマ辞書の文字列は、同じパイプライン内で `docs[].nextraDictionaryPath` を介して翻訳されます。

[Fumadocs](/ja/guide/integrations/fumadocs) サイトでは、ページ本文は `fumadocsParser` `"dot"` (デフォルト) または `"dir"` を伴う `docsOutput.style: "fumadocs"` を使用します。`meta.json` サイドバーのラベルは自動的に収集されます。UI オーバーライドは `docsOutput.fumadocsUiCatalog` を介して翻訳されます。

[Astro Starlight](/ja/guide/integrations/astro#astro-starlight) サイトでは、ページ本文は Starlight コンテンツルート（通常は `src/content/docs/`）にある `docsRoot` と共に `docsOutput.style: "astro-starlight"` を使用します。`translate-docs` は、英語ツリーの隣にある `src/content/docs/<locale>/` の下にローカライズされた markdown/MDX を書き込みます。Starlight は多くのロケール向けの組み込み UI 文字列を出荷しているため、別のテーマカタログパイプラインは不要です。オプションの UI オーバーライドは、`src/content/i18n/en.json` の `docs[]` ブロックで `jsonPathTemplate` を使用できます。

Markdownに埋め込まれたPNGやその他のラスター画像については、[画像とスクリーンショット](/ja/guide/images-and-screenshots/)を参照してください。`translate-docs`は代替テキストのみを翻訳し、ラスターファイルをコピーしません。

README またはドキュメント内のオプションの **言語スイッチャー** ブロックについては、`docsOutput.style` を `"flat"` に設定してください - [言語スイッチャー](/ja/guide/documents/language-switcher) を参照してください。

[SVG](/ja/guide/svg-translation/) ファイルは、`features.translateSVG` が有効な場合に [`translate-svg`](/ja/reference/cli-commands/content#translate-svg) を介して翻訳されます - `docs[]` / `contentPaths` は経由しません。

ドキュメントフレームワークのシェル/テーマ文字列とは無関係な任意のネストされたUI JSONバンドルは、`docs[]`ではなく、[JSON](/ja/guide/json)パイプラインに属します。

UIとドキュメント間の**用語の一貫性**を保つため、`glossary.uiGlossary`を`strings.json`のパスに設定してください — `translate-docs`は、セグメント内に一致する用語が含まれる場合、LLMプロンプトのヒントとして既存のUI翻訳を再利用します。オプションの`glossary.userGlossary`で、製品用語のCSVオーバーライドを追加できます（`translate-ui`および`proofread-ui`と共有）。狭い列に合わせるために使用されるコンパクトなUIラベルの略語（例: `Size` → `Tam`）は、UI翻訳では引き続き使用できますが、ドキュメントの用語集ヒントからは除外されます。`glossary-generate`で初期CSVを生成し、Translation Dashboardの**用語集**タブで行を編集するか、[設定 — `glossary`](/ja/reference/configuration#glossary)および[用語集](/ja/guide/translation-dashboard/glossary)を参照してください。

<a id="per-locale-model-overrides"></a>
### ロケールごとのモデルオーバーライド

`translate-docs` と `sync` のドキュメントステップは、**ターゲットロケールごとに** モデルを解決します。設定されている場合は最初に `localeModels(locale)`、次にプロバイダーのグローバルな `translationModels` チェーンが使用されます。特定の言語がデフォルトのフォールバックリストとは異なるモデルを必要とする場合にこれを使用します。例えば、グローバルチェーンがポルトガル語の処理に苦戦する場合、`pt-BR` ドキュメントには Gemini を優先します。[プロバイダーとモデル](/ja/guide/providers-and-models#model-fallback-chain) および [設定 - `localeModels`](/ja/reference/configuration#provider-and-providers) を参照してください。

<a id="which-guide-to-read"></a>
## 読むべきガイド

| あなたのセットアップ | ここから始める |
| --- | --- |
| Docusaurus サイト | `init -t ui-docusaurus`, `docsOutput.style = "docusaurus"` - [Docusaurus](/ja/guide/integrations/docusaurus) |
| VitePress サイト | テーマ用に `init -t ui-vitepress` + `vitepressThemeCatalog` - [VitePress](/ja/guide/integrations/vitepress) |
| Nextra サイト | 辞書用に `init -t ui-nextra` + `nextraDictionaryPath` (サイドバー `_meta.ts` は自動) - [Nextra](/ja/guide/integrations/nextra) |
| Fumadocs サイト | UI 用に `init -t ui-fumadocs` + `fumadocsUiCatalog` (サイドバー `meta.json` は自動) - [Fumadocs](/ja/guide/integrations/fumadocs) |
| Astro Starlight | `init -t ui-starlight` - [Astro Starlight](/ja/guide/integrations/astro#astro-starlight) |
| フラットなドキュメント (README、変更履歴など) | `docsOutput.style = "flat"` - [出力レイアウト](/ja/guide/documents/output-layouts)、オプションの [言語スイッチャー](/ja/guide/documents/language-switcher) |
| 翻訳されたファイルの保存場所 | [出力レイアウト](/ja/guide/documents/output-layouts) |
| ページ間の`#anchor`リンク | [アンカーリンク](/ja/guide/documents/anchor-links) |
| リンクとアセットの URL 書き換え (`regexAdjustments`) | [リンクの書き換え](/ja/guide/documents/link-rewriting) |
| ドキュメント内のスクリーンショット | [画像とスクリーンショット](/ja/guide/images-and-screenshots/) |
| 製品用語と UI/ドキュメントの一貫性 | [設定 — `glossary`](/ja/reference/configuration#glossary), [用語集](/ja/guide/translation-dashboard/glossary) |
| `translate-docs`フラグとキャッシュ | [CLIオプション](/ja/guide/documents/cli-options) |

<a id="step-1-initialise-for-documentation"></a>
## ステップ1: ドキュメントの初期化

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
```

Astro Starlight ドキュメントサイトの場合：

```bash
ai-i18n-tools init -t ui-starlight [-P <provider>]
```

VitePressドキュメントサイトの場合:

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
```

ナビ/サイドバー/フッター文字列のために `docsOutput.vitepressThemeCatalog` を設定します - [VitePress 統合](/ja/guide/integrations/vitepress) を参照してください。

Nextraドキュメントサイトの場合:

```bash
ai-i18n-tools init -t ui-nextra [-P <provider>]
```

テーマ辞書文字列のために `docs[].nextraDictionaryPath` を設定します - [Nextra 統合](/ja/guide/integrations/nextra) を参照してください。サイドバーの `_meta.ts` ラベルは自動的に収集されます。

Fumadocsドキュメントサイトの場合:

```bash
ai-i18n-tools init -t ui-fumadocs [-P <provider>]
```

UI オーバーライドのために `docsOutput.fumadocsUiCatalog` を設定します - [Fumadocs 統合](/ja/guide/integrations/fumadocs) を参照してください。サイドバーの `meta.json` ラベルは自動的に収集されます。

プレーンなAstroウェブサイトUI（Starlightなし）の場合：

```bash
ai-i18n-tools init -t ui-astro-website [-P <provider>]
```

このテンプレートはUI抽出のみを有効にします。ページHTMLの翻訳には、`features.translateDocs`も設定し、`docs[]`ブロックを追加します（[Astroウェブサイトページ (解析と置換)](/ja/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)を参照）。[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)設定は、両方のパイプラインを一緒に示しています。

生成された`ai-i18n-tools.config.json`を編集します。

- `provider` と `providers` — `init` はデフォルトのプロバイダーブロックをスキャフォールドします (`-P <provider>` を渡さない限り `openrouter`)。`translate-docs` または `sync` の前に、少なくとも1つのプロバイダーを設定し、その API キーを設定してください (Ollama はキー不要)。[プロバイダーと API キー](/ja/guide/quick-start#provider-and-api-key) および [LLM プロバイダーとモデル](/ja/guide/providers-and-models) を参照してください。
- `sourceLocale` - ソース言語 (`docusaurus.config.js` の `defaultLocale` と一致する必要があります)。
- `targetLocales` - BCP-47 ロケールコードの配列 (例: `["de", "fr", "es"]`)。
- `cacheDir` - すべてのパイプラインの共有 SQLite キャッシュディレクトリ (および `--write-logs` のデフォルトログディレクトリ)。
- `docs` - ドキュメントブロックの配列。各ブロックにはオプションの`description`、`contentPaths`（文字列または配列、ファイル、ディレクトリ、またはglob）、`outputDir`、オプションの`docusaurusCatalogDir`、`docsOutput`、オプションの`segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter`などがあります。
- `docs[].description` - メンテナ向けのオプションの短いメモ。設定すると、`translate-docs`の見出しと`status`のセクションヘッダーに表示されます。
- `docs[].contentPaths` - markdown/MDX/`.astro`ソース（およびDocusaurusシェルJSON用のオプションの`docusaurusCatalogDir`）。
- `docs[].outputDir` - そのブロックの翻訳出力ルート。
- `docs[].docsOutput.style` - `"nested"` (デフォルト), `"flat"`, `"doc-system"`, またはエイリアス `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"` / `"fumadocs"` ([出力レイアウト](/ja/guide/documents/output-layouts) を参照)。
- `glossary.uiGlossary` - `strings.json` へのパス。これにより、ドキュメントセグメントは UI カタログから用語のヒントを得られます ([設定 — `glossary`](/ja/reference/configuration#glossary) を参照)。
- `glossary.userGlossary` - 固定の製品用語翻訳用のオプション CSV。UI パイプラインでも使用され、[用語集](/ja/guide/translation-dashboard/glossary) ダッシュボードタブで編集可能です。

**プライマリ対サプライメンタリ：** ローカライズされたページには `contentPaths` を使用してください。`write-translations` から Docusaurus シェルの JSON も必要な場合は、`docusaurusCatalogDir` を設定します。ページの翻訳のみを行う場合は、`docusaurusCatalogDir` を省略してください。

<a id="step-2-translate-documents"></a>
## ステップ2: ドキュメントを翻訳する

```bash
ai-i18n-tools translate-docs
```

これは、すべての `docs[]` ブロックの `contentPaths` 内のすべてのファイル（および `docusaurusCatalogDir` が設定されている場合の Docusaurus カタログ JSON）を、すべての有効なドキュメントロケールに翻訳します。すでに翻訳されたセグメントは SQLite キャッシュから提供され、新規または変更されたセグメントのみが LLM に送信されます。

単一のロケールを翻訳するには：

```bash
ai-i18n-tools translate-docs --locale de
```

翻訳が必要な内容を確認するには：

```bash
ai-i18n-tools status
```

フラグ、キャッシュの動作、およびバッチプロンプトの形式については、[CLIオプション](/ja/guide/documents/cli-options)を参照してください。

<a id="complex-markdown-and-failed-quality-checks"></a>
## 複雑なMarkdownと品質チェックの失敗

`translate-docs`は、翻訳された各セグメントがMarkdownの構造（ドキュメントから解析された強調を含む）を保持し、内部のプレースホルダートークンが正しく復元されるかどうかをチェックします。`` `inline code` ``の周囲に多数の`bold`スパンを重ねたり、太字の中にバッククォートをネストしたり（例えば`` `fetch(\`/locales/${code}.json\`)` ``のようなテンプレートリテラル）、1つの長い文の中に太字とコードを織り交ぜたりする段落は脆弱です。一部のロケールでは異なる語順が必要になるため、翻訳後に`**`と`` ` ``の並びが変わり、`AST mismatch`のようなCLIエラーがトリガーされる可能性があります。

復元後、`translate-docs`は、HTMLタグのプレースホルダーが再利用または削除された（その結果、復元されたタグがソースマップと一致しなくなった）セグメントや、モデルがソースに存在しない二重中括弧トークンを作成して残した（例えば、架空の用語集スタイルのトークン）セグメントも拒否します。これらの失敗は、残された公式内部トークンと同じモデルフォールバックパスを使用します。

**そのような検証エラーが発生した場合は、ソース言語のテキストを簡略化することをお勧めします** - 段落を分割する、例をコードブロックに移動する、または階層化された太字/コードのペアを減らして同じ概念を説明するなど - すべてのモデルとロケールが密集したインラインマークアップを完全に再現することを期待するのではなく。

すべての構成済みモデルが同じセグメントで `AST mismatch` エラーを発生させた場合、`translate-docs` はそのセグメントをより小さい部分に自動的に分割できます（最初にリストの中間点、次に個々のリスト項目または短い段落のチャンク）。その後、各部分を最初のモデルから再試行し、元のセグメントキャッシュキーの下で結果を再結合します。これはデフォルトで有効になっています（`segmentSplitting.qualityRetrySplit`）。モデルを使い切った後に停止するには、`false` に設定してください。このフォールバックが実行された場合、実行サマリーに `Quality split retries` が報告されます。

どの**セグメントが失敗したか**、その頻度、および保存されている**品質/エラーメッセージ**を確認するには、翻訳ダッシュボードの**失敗**タブ（[翻訳ダッシュボード → 失敗](/ja/guide/translation-dashboard/failures#failures-document-translation)）を使用します。
