<a id="integrations"></a>
# インテグレーション

フレームワーク統合のリファレンスです。共通点とシェル文字列の違いについて説明します。サイトに言語を追加するには、[ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website)から始めてください。アプリの場合は、[JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js)または[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)から始めてください。リポジトリのREADMEやその他のMarkdownファイルの場合は、[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)から始めてください。

ドキュメント統合では、ページコンテンツ用に[ドキュメント](/ja/guide/documents/)パイプライン（`translate-docs` / `sync`）を使用します。シェル文字列（ナビゲーション、サイドバー、テーマ）は、注記がある場合は、別の[JSON](/ja/guide/json)パイプライン経由ではなく、同じパイプライン内で処理されます。Pythonアプリケーションでは、[UI文字列](/ja/guide/ui-strings/python)パイプライン（`extract` / `translate-ui`）を使用します。

<a id="which-guide-to-read"></a>
## 読むべきガイド

フレームワークごとに1つの初期化テンプレートを備えた選択テーブルは、[ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website#initialise-the-project) にあります。そのページのウォークスループロンプトは、フレームワークのi18nを有効にします。以下の統合ページには、シェルカタログの詳細が記載されています。Pythonフレームワーク: [Python](/ja/guide/integrations/python)。

<a id="shared-concepts"></a>
## 共通の概念

ドキュメントフレームワークの統合では、[Documents](/ja/guide/documents/)で説明されているものと同じ`docs[]`ブロックモデルを共有します。`docsOutput.style`を自身のフレームワーク（`"docusaurus"`、`"vitepress"`、`"nextra"`、`"fumadocs"`、または`"astro-starlight"`）に合わせて設定してください。出力フォルダーのレイアウトとリンク書き換えの動作については、[Output layouts](/ja/guide/documents/output-layouts)および[Link rewriting](/ja/guide/documents/link-rewriting)を参照してください。Pythonのセットアップは別個に行います：[Python](/ja/guide/integrations/python)。

各`init -t ui-* -P <provider>`スキャフォールドは、そのプリセットの大規模言語モデルプロバイダーブロックを書き込みます。`translate-docs`または`sync`の前に、一致するエーピーアイキーを設定してください。詳しくは[プロバイダーとエーピーアイキー](/ja/guide/quick-start#provider-and-api-key)を参照してください。

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
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
