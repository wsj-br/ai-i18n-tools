<a id="docusaurus-integration"></a>
# Docusaurus統合

[Docusaurus](https://docusaurus.io/) ドキュメント サイトでは、`init -t ui-docusaurus` と `docsOutput.style: "docusaurus"` を使用します。プリセットは、`docs[]` ブロックを `docusaurusCatalogDir` で作成し、`translate-docs` でページの Markdown と Docusaurus シェルの JSON を 1 つのコマンドで翻訳できるようにします。

[Documents](/ja/guide/documents/)、実行可能な [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) デモ、およびネストされたDocusaurusドキュメント、フラットなREADME、SVGアセットを組み合わせたNext.jsアプリである [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) も参照してください。

<a id="quick-start"></a>
## クイックスタート

```bash
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # or: cd examples/docusaurus-docs && pnpm build
```

`features.translateDocs`を有効にし、`docs[].docusaurusCatalogDir`を設定して、ドキュメントページとサイトのクローム（ナビバー、フッター、テーマ文字列）を翻訳する場合は、Docusaurusプロジェクトで`docusaurus write-translations`を実行します。`@docusaurus/*`をアップグレードしたり、ナビバー/フッター/テーマのラベルを変更した場合は、`translate-docs`または`sync`を再実行して、シェルのJSONを各ロケールフォルダーに翻訳します。

<a id="page-layout"></a>
## ページレイアウト

英語のマークダウンとMDXは、Docusaurusの`docs/`フォルダー（例：`docs-site/docs/`）の下にあります。翻訳されたコピーは、各ロケールのプラグインコンテンツツリーに書き込まれます。

```text
docs-site/docs/getting-started.md
  →  docs-site/i18n/de/docusaurus-plugin-content-docs/current/getting-started.md
docs-site/docs/guide/quick-start.md
  →  docs-site/i18n/fr/docusaurus-plugin-content-docs/current/guide/quick-start.md
```

`docs[]` ブロックを1つ設定します：

```json
{
  "contentPaths": ["docs-site/docs/"],
  "outputDir": "docs-site/i18n",
  "docusaurusCatalogDir": "docs-site/i18n/en",
  "addFrontmatter": true,
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "docs-site/docs"
  }
}
```

`contentPaths`を英語の`.md`/`.mdx`ファイルとディレクトリにポイントします。`docsRoot`をDocusaurusがコンテンツルートとして使用する同じフォルダーに設定します。`outputDir`を`i18n/`の下にある各ロケールフォルダーの親フォルダーに設定します。

Docusaurusの[i18n](https://docusaurus.io/docs/i18n/introduction)を接続します。`targetLocales`を`ai-i18n-tools.config.json`に、`locales`配列を`docusaurus.config.js`に合わせます。各`localeConfigs[locale].path`は、`i18n/`の下にあるフォルダ名（例：`path: "fr"` for `i18n/fr/`）と一致する必要があります。

<a id="shell-strings-write-translations"></a>
## シェル文字列（write-translations）

Docusaurusのナビバー、フッター、検索プレースホルダー、他のテーマ/プラグインラベルは、マークダウンから抽出されません。Docusaurusプロジェクトで`docusaurus write-translations`を実行して、デフォルトのロケールフォルダー（通常`i18n/en/`）の下にJSONカタログを生成します。次に、`docs[].docusaurusCatalogDir`をそのフォルダーにポイントします。

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "description": "Docusaurus pages + shell JSON",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    }
  ]
}
```

`docusaurusCatalogDir`が設定され、`features.translateDocs`が有効になっている場合、`translate-docs`は次の両方を翻訳します。

- **ドキュメントページ** — `contentPaths`から`i18n/<locale>/docusaurus-plugin-content-docs/current/`へのマークダウン/MDX
- **シェルJSON** — `i18n/en/`から同期ロケールフォルダへのナビバー、フッター、テーマ/プラグインカタログ

DocusaurusシェルJSONを`json[]`に配置しないでください。代わりに、ドキュメントで`docs[].docusaurusCatalogDir`を使用します。

<a id="example-project"></a>
## サンプルプロジェクト

[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) — `docs/` に英語ソース、`i18n/<locale>/docusaurus-plugin-content-docs/current/` にコミットされた翻訳、さらに翻訳されたシェルJSONがあります。ロケールドロップダウンが機能するように、ポート3100で `pnpm start` を実行し（ビルド + サーブ）、英語のみのホットリロードには `pnpm dev` を使用してください。

同じリポジトリレイアウトでのUI文字列、SVG翻訳、およびフラットなREADMEについては、[examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app)（ポート3040でのネストされた `docs-site/`）を参照してください。
