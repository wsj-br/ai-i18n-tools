<a id="docusaurus-integration"></a>
# Docusaurus統合

[Docusaurus](https://docusaurus.io/) ドキュメント サイトでは、`init -t ui-docusaurus` と `docsOutput.style: "docusaurus"` を使用します。プリセットは、`docs[]` ブロックを `docusaurusCatalogDir` で作成し、`translate-docs` でページの Markdown と Docusaurus シェルの JSON を 1 つのコマンドで翻訳できるようにします。

以下も参照してください: [ドキュメント](/guide/documents/)、実行可能な [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) デモ (Next.js アプリとネストされた `docs-site/`)、および Docusaurus のみに焦点を当てたチュートリアルについては [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site)。

<a id="quick-start"></a>
## クイックスタート

```bash
npx ai-i18n-tools init -t ui-docusaurus
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths, docusaurusCatalogDir)
pnpm run i18n:sync   # or: ai-i18n-tools sync
cd docs-site && pnpm build   # Docusaurus build (project-specific script)
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

1つの`docs[]`ブロックを設定します。

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

<a id="framework-shell-translation"></a>
## フレームワークシェルの翻訳

| フレームワーク | シェル/テーマ文字列 | パイプライン |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`カタログ（`{ message, description }`） | ドキュメント — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | テーマ/ナビゲーション/サイドバーカタログ | ドキュメント — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` サイドバーラベル | ドキュメント — `style: "nextra"` + `translate-docs` の場合に自動 |
| Nextra | テーマ辞書 `.ts` | ドキュメント — `docs[].nextraDictionaryPath` + `translate-docs` |
| Astro Starlight | 組み込みのUI文字列（多くのロケール）。追加のシェルパイプラインなし | ドキュメント — `translate-docs`（ページのみ） |

**不要**将框架 shell/主题字符串放在 `json[]` 中 —— 该管道用于无关的应用程序本地化包。请参阅 [VitePress 集成](/guide/vitepress-integration) 和 [Nextra 集成](/guide/nextra-integration) 以了解 VitePress/Nextra 模式。

<a id="example-project"></a>
## サンプルプロジェクト

[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) — 英語ソースは`docs/`に、コミットされた翻訳は`i18n/<locale>/docusaurus-plugin-content-docs/current/`の下にあり、翻訳されたシェルJSONもあります。開発のために3040ポートで`pnpm start`を実行します。開発モードで単一のロケールをプレビューするには、`pnpm run start:fr`（および同様のもの）を使用します。
