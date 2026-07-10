<a id="integrations"></a>
# インテグレーション

ドキュメントサイトやAstroプロジェクトにai-i18n-toolsを組み込むための、フレームワーク固有のガイドです。各インテグレーションは、ページコンテンツに[Documents](/guide/documents/)パイプライン (`translate-docs` / `sync`) を使用します。シェル文字列 (ナビゲーション、サイドバー、テーマ) は、注記がある場合は同じパイプライン内で処理され、別の[JSON](/guide/json)パイプラインは経由しません。

<a id="which-guide-to-read"></a>
## 読むべきガイド

| あなたのサイト | 初期テンプレート | ここから開始 |
| --- | --- | --- |
| Astro StarlightまたはプレーンなAstro | `ui-starlight` / ハイブリッドUI文字列 | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## 共通の概念

すべてのドキュメントフレームワークのインテグレーションは、[Documents](/guide/documents/)で説明されている同じ`docs[]`ブロックモデルを共有しています。フレームワークに合わせて`docsOutput.style`を設定します (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"`, または `"astro-starlight"`)。出力フォルダのレイアウトとリンクの書き換え動作については、[Output layouts](/guide/documents/output-layouts)と[Link rewriting](/guide/documents/link-rewriting)を参照してください。

フレームワークのシェルやテーマの文字列を`json[]`に**入れないで**ください — そのパイプラインは無関係なアプリケーションロケールバンドル用です。各インテグレーションのページでは、そのフレームワークのナビゲーション、サイドバー、テーマラベルをカバーするカタログパスとCLIフラグについて説明しています。

<a id="examples"></a>
## 実行可能な例

| フレームワーク | リポジトリの例 |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| プレーンなAstroウェブサイト | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
