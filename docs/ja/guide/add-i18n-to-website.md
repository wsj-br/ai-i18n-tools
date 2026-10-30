<a id="add-i18n-to-a-website-or-docs-site"></a>
# ウェブサイトまたはドキュメントサイトにi18nを追加する

このページは、単一言語のドキュメントサイト (Markdown または MDX) や、マーケティングサイトまたは静的サイト (Astro ウェブサイトまたはプレーン HTML) を対象としています。このツールは、お使いの LLM プロバイダーのモデルでページコンテンツを翻訳し、言語ごとにローカライズされたコピーを1つ書き出します。サイトのフレームワークがそれらのコピーを配信し、言語スイッチャーを提供します。

UI文字列が`t()`呼び出しにあるアプリの場合は、代わりに[JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js)または[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)を使用してください。

<a id="install-and-choose-a-provider"></a>
## どのようなものをお持ちですか？

| あなたのサイト | 初期テンプレート | ここから開始 |
| --- | --- | --- |
| Astro StarlightまたはプレーンなAstro | `ui-starlight` / ハイブリッドUI文字列 | [Astro](/ja/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/ja/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/ja/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/ja/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/ja/guide/integrations/fumadocs) |
| プレーンなHTMLページ | `ui-plain-html` または `docs-plain-html` | [プレーンなHTMLアプリ](/ja/guide/ui-strings/plain-html) |
| サイトフレームワークなし、READMEとMarkdownファイルのみ | `docs-markdown`、または任意のテンプレートと`--with-readme` | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>エージェントプロンプト</summary>

- Astro Starlight: 注記のみ。Astro `t()`ファイル: [JS/TSプロンプト](/ja/guide/add-i18n-to-js#run-the-agent-prompt) (i18nextをスキップ)。
- Docusaurus: 注記のみ（`<Translate>`はDocusaurus独自のAPIです）。
- VitePress: [テーマカタログプロンプト](/ja/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)。
- Nextra: [ディクショナリプロンプト](/ja/guide/integrations/nextra#agent-prompt-dictionary-and-routes)と[ハイブリッド`t()`プロンプト](/ja/guide/integrations/nextra#optional-t-for-app-react-hybrid)。
- Fumadocs: [UIカタログプロンプト](/ja/guide/integrations/fumadocs#agent-prompt)。
- READMEとMarkdownファイル: [READMEプロンプト](/ja/guide/add-i18n-to-readme#run-the-agent-prompt)。

</details>

<a id="initialise-the-project"></a>
## 手順

同じ形式がすべてのフレームワークで機能します。詳細については、上記のフレームワークガイドを参照してください。

1. CLIをインストールし、APIキーを設定します: [インストール](/ja/guide/installation)、[プロバイダーとAPIキー](/ja/guide/quick-start#provider-and-api-key)。
2. スキャフォールド: `ai-i18n-tools init -t <template> -P <provider>`。
3. `sourceLocale`、`targetLocales`、および`docs[].contentPaths`（ソース言語で書かれたページとフォルダー）を設定します。`sourceLocale`は任意の言語にできます。フレームワークガイドには適切な`docsOutput.style`が示されています。
4. フレームワーク独自のi18nを有効にして、ローカライズされたページを提供し、リンクするようにします。各ガイドには「既存のサイトでi18nを有効にする」セクションがあります: [VitePress](/ja/guide/integrations/vitepress#enable-i18n-in-an-existing-site)、[Docusaurus](/ja/guide/integrations/docusaurus#enable-i18n-in-an-existing-site)、[Nextra](/ja/guide/integrations/nextra#enable-i18n-in-an-existing-site)、[Fumadocs](/ja/guide/integrations/fumadocs#enable-i18n-in-an-existing-site)、[Astro](/ja/guide/integrations/astro#enable-i18n-in-an-existing-site)。
5. `ai-i18n-tools sync`（または`translate-docs`）を実行し、サイトをビルドします。
6. ブラウザでローカライズされたルートを確認します。フレームワーク独自のロケールドロップダウンがスイッチャーです。READMEのようなフラットなMarkdownファイルの場合は、[languageListBlock](/ja/guide/documents/language-switcher)を使用してリンク行を追加します。

<a id="run-the-agent-prompt"></a>
## 何が翻訳されるか

ページ本文は常に[ドキュメント](/ja/guide/documents/)パイプラインを通過します。フレームワークのクローム（ナビゲーション、サイドバー、テーマラベル）は、フレームワークがサポートしている場合は同じ実行で処理され、個別の[JSON](/ja/guide/json)パイプラインを介しては処理されません。

| フレームワーク | シェルとテーマの文字列 | 方法 |
| --- | --- | --- |
| Docusaurus | `write-translations`カタログ (`{ message, description }`) | `docs[].docusaurusCatalogDir`と`translate-docs` |
| VitePress | テーマ、ナビゲーション、サイドバーのカタログ | `docsOutput.vitepressThemeCatalog`と`translate-docs` |
| Nextra | `_meta.ts`サイドバーラベル | `style: "nextra"`で自動 |
| Nextra | テーマディクショナリ`.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json`サイドバーラベル | `style: "fumadocs"`で自動 |
| Fumadocs | UIのオーバーライドカタログ | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | 多くのロケールに組み込まれたUI文字列 | ページのみ |

画像とスクリーンショットは`translate-docs`によって翻訳されません。ロケール固有のファイルについては、[画像とスクリーンショット](/ja/guide/images-and-screenshots/)を参照してください。

<a id="review-the-result"></a>
## プレーンHTML

ページの動作に応じて、2つのオプションがあります。

- ブラウザで言語を切り替える1つのページの場合：テキストに`data-i18n*`属性をマークし、UI文字列ランタイム (`ui-plain-html`) を使用します。[プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html)を参照してください。
- ロケールごとに1つの翻訳済みHTMLファイルの場合：ドキュメントパイプライン (`docs-plain-html`) を使用します。[HTMLページ](/ja/guide/documents/html-pages)を参照してください。

ファイルは1つのパスに属します。

<a id="choose-models-and-translate"></a>
## 当てはまりませんか？

- アプリのUI文字列：[JS/TSアプリにi18nを追加](/ja/guide/add-i18n-to-js) または [Pythonアプリにi18nを追加](/ja/guide/add-i18n-to-python)。
- サイトの隣にあるリポジトリのREADME、またはMarkdownファイルでサイトフレームワークがない場合：[READMEとMarkdownドキュメントにi18nを追加](/ja/guide/add-i18n-to-readme)。`init … --with-readme`は、サイトテンプレートの横にそのブロックを追加します。
- スタンドアロンのネストされたロケールJSON：[JSON](/ja/guide/json)。
- サイトとアプリの文字列の両方を翻訳する場合：[パイプラインの結合](/ja/guide/combining-pipelines)。

共有オプションとフレームワークごとの違いに関するリファレンス：[インテグレーション](/ja/guide/integrations/)。
