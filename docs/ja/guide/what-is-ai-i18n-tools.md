<a id="what-is-ai-i18n-tools"></a>
# ai-i18n-tools とは

`ai-i18n-tools` パッケージは、3 つの翻訳機能を提供します。

- **UI文字列**: JS/TSソースから`t("…")`呼び出しを抽出し、アクティブな[LLMプロバイダー](/guide/providers-and-models)を介して翻訳し、i18nextに対応したロケールごとのフラットなJSONファイルを書き出します。
- **ドキュメント**: `docs[].contentPaths`にリストされている**Markdown、MDX、および`.astro`ページ**を`translate-docs`を介してスマートキャッシュで翻訳します。オプションの**DocusaurusカタログJSON** (`docs[].docusaurusCatalogDir`、`docusaurus write-translations`から) は、`features.translateDocs`が有効な場合、同じコマンドで翻訳されます。これはサイトのクローム (ナビゲーションバー、フッター、テーマ文字列) であり、`docs/`の散文ではありません。**VitePress**のページ本文は同じ`docs[]`パイプラインを使用します。ナビゲーション/サイドバー/フッターのラベルはJSON (`json[]` / `translate-json`) を使用します。詳細については、[VitePress統合](/guide/vitepress-integration)を参照してください。
- **JSON**: ソースの`t()`ではなく、ロケールごとのJSONファイルにUIコピーを保持するサイト向けに、トップレベルの`json[]`、`features.translateJson`、および`translate-json`を介して任意のネストされたJSONバンドル (例: `src/i18n/en/translation.json`) を翻訳します。
- **ツールUI (組み込み)** — CLIヘルプ、ログ、および翻訳ダッシュボードは複数の言語で提供されます。これは、**ご自身の**アプリのUI文字列やドキュメントの翻訳とは別です。

**SVG** アセットは、`features.translateSVG`、トップレベルの `svg` ブロック、および `translate-svg` を使用します ([CLI リファレンス](/reference/cli-commands) を参照)。

**どれを使用すべきですか？**

- `t()` 経由でソース内のユーザー向け文字列 → UI 文字列 (`extract` / `translate-ui`)。
- ローカライズされたページ、Docusaurus シェル JSON、または VitePress Markdown → ドキュメント (`translate-docs`)。
- VitePress テーマ JSON またはその他のスタンドアロンのネストされたロケールファイル → JSON (`translate-json`)。

これら3つはすべてアクティブなLLMプロバイダー ([プロバイダーとモデル](/guide/providers-and-models)を参照) を使用し、単一の設定ファイルを共有します。

<a id="next-steps"></a>
## 次のステップ

1. [インストール](/guide/installation) — パッケージをインストールし、プロバイダーAPIキーを設定します。
2. [クイックスタート](/guide/quick-start) — 設定をスキャフォールドし、最初の翻訳を実行します。
3. [プロバイダーとモデル](/guide/providers-and-models) — プロバイダー、モデルフォールバックチェーン、および`-P`オーバーライドを選択します。
