<a id="integrations"></a>
# インテグレーション

ドキュメントサイトやAstroプロジェクトにai-i18n-toolsを組み込むための、フレームワーク固有のガイドです。各インテグレーションは、ページコンテンツに[Documents](/ja/guide/documents/)パイプライン (`translate-docs` / `sync`) を使用します。シェル文字列 (ナビゲーション、サイドバー、テーマ) は、注記がある場合は同じパイプライン内で処理され、別の[JSON](/ja/guide/json)パイプラインは経由しません。

<a id="which-guide-to-read"></a>
## 読むべきガイド

| あなたのサイト | 初期テンプレート | ここから開始 |
| --- | --- | --- |
| Astro StarlightまたはプレーンなAstro | `ui-starlight` / ハイブリッドUI文字列 | [Astro](/ja/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/ja/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/ja/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/ja/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/ja/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## 共通の概念

すべてのドキュメントフレームワークのインテグレーションは、[Documents](/ja/guide/documents/)で説明されている同じ`docs[]`ブロックモデルを共有しています。フレームワークに合わせて`docsOutput.style`を設定します (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, または `"astro-starlight"`)。出力フォルダのレイアウトとリンクの書き換え動作については、[Output layouts](/ja/guide/documents/output-layouts)と[Link rewriting](/ja/guide/documents/link-rewriting)を参照してください。

各 `init -t ui-*` テンプレートは、デフォルトの LLM プロバイダーブロック (`-P <provider>` を渡さない限り `openrouter`) をスキャフォールディングします。`translate-docs` または `sync` の前に、必要に応じて `provider` / `providers` を設定し、対応する API キーを設定してください — [プロバイダーと API キー](/ja/guide/quick-start#provider-and-api-key) を参照してください。

フレーム間比較については、[フレームワークシェルの翻訳](#framework-shell-translation)を参照してください。以下にリンクされている各ガイドでは、そのフレームワークのセットアップについて説明しています。

<a id="framework-shell-translation"></a>
## フレームワークシェルの翻訳

| フレームワーク | シェル / テーマ文字列 | パイプライン |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` カタログ (`{ message, description }`) | ドキュメント — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | テーマ/ナビ/サイドバーカタログ | ドキュメント — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` サイドバーラベル | ドキュメント — `style: "nextra"` + `translate-docs` の時に自動 |
| Nextra | テーマ辞書 `.ts` | ドキュメント — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` サイドバーラベル | ドキュメント — `style: "fumadocs"` + `translate-docs` の時に自動 |
| Fumadocs | UIオーバーライドカタログ | ドキュメント — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 組み込みUI文字列（多数のロケール）、追加のシェルパイプラインなし | ドキュメント — `translate-docs` （ページのみ） |

`json[]`にフレームワークシェル/テーマ文字列を入れないで**put**ください — そのパイプラインは、関連のないアプリロケールバンドル用です。フレームワークごとのセットアップ詳細については、[読むべきガイドはどれ](#which-guide-to-read)からリンクされているガイドを参照してください。

<a id="runnable-examples"></a>
## 実行可能な例

| フレームワーク | リポジトリの例 |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| プレーンなAstroウェブサイト | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
