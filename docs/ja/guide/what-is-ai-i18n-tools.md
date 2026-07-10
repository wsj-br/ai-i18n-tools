<a id="what-is-ai-i18n-tools"></a>
# ai-i18n-tools とは

ai-i18n-tools は、好みの LLM プロバイダーを使用してアプリとドキュメントを翻訳するのに役立つコマンドラインツールキットです。単一の設定ファイルからすべてを制御し、有効にする翻訳機能を選択できます。「sync」コマンドを使用して、必要なモードを一度に実行できます。

<a id="translation-modes"></a>
## 翻訳モード

- **UI文字列** — JS/TSソースから`t("…")`呼び出し（および同様のマーカー）を抽出し、i18nextまたは静的ルックアップ用のロケールごとのフラットなJSONファイルを書き込みます。コマンド: `extract`、`translate-ui`。ガイド: [UI文字列](/ja/guide/ui-strings/)。
- **ドキュメント** — `docs[].contentPaths`にリストされているMarkdown、MDX、および`.astro`ページを翻訳します。VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro、およびその他の静的ドキュメントサイトで動作します。コマンド: `translate-docs`。ガイド: [ドキュメント](/ja/guide/documents/)。
- **JSON** — トップレベルの`json[]`で定義されているネストされたJSONロケールバンドル（テーマラベル、i18nオーバーライド、ソースにないアプリのコピー）を翻訳します。コマンド: `translate-json`。ガイド: [JSON](/ja/guide/json)。
- **SVG** — SVGイラスト（`<text>`、`<title>`、`<desc>`）内の表示テキストを翻訳し、ロケールごとに1つの出力ファイルを書き込みます。ドキュメント翻訳とは別です — `translate-docs`はSVGアセットを変更しません。コマンド: `translate-svg`。ガイド: [SVG翻訳](/ja/guide/svg-translation/)。

これら 4 つのモードはすべて、アクティブな [LLM プロバイダー](/ja/guide/providers-and-models) を使用し、同じ設定ファイルを共有し、SQLite キャッシュを再利用するため、再実行では新しいテキストまたは変更されたテキストのみがモデルに送信されます。

<a id="which-should-i-use"></a>
## どれを使用すべきですか？

| コンテンツ | モード | コマンド |
| --- | --- | --- |
| ソースコードが `t()` または HTML `data-i18n` マーカーを使用している場合 | UI 文字列 | `extract` / `translate-ui` |
| ローカライズされたページまたはドキュメントサイト | ドキュメント | `translate-docs` |
| スタンドアロンのネストされた JSON ロケールファイル | JSON | `translate-json` |
| SVG にラベルが付いた図またはイラスト | SVG | `translate-svg` |

多くのプロジェクトでは、複数のモードを組み合わせて使用します。たとえば、VitePress サイトの場合は UI 文字列とドキュメント、図解付きガイドの場合はドキュメントと SVG などです。[クイックスタート](/ja/guide/quick-start) でスキャフォールドテンプレートを、[設定](/ja/reference/configuration) で完全な設定スキーマを参照してください。

<a id="examples"></a>
## 例

リポジトリには、`examples/` の下に実行可能なサンプルプロジェクトが同梱されています。それぞれに独自の設定、コミットされたロケール出力、および README が含まれています。API キーなしで翻訳されたファイルを探索できます。翻訳を再実行するにはプロバイダーキーが必要です ([プロバイダーとモデル](/ja/guide/providers-and-models) を参照)。

| 例 | 内容 |
| --- | --- |
| [console-app](/ja/examples#console-app) | 最小のエンドツーエンドアプリ: `t()` UI 文字列と README 翻訳 |
| [nextjs-app](/ja/examples#nextjs-app) | Next.js UI、複数形、SVG、ネストされたDocusaurusドキュメント、フラットなREADME、ダッシュボード |
| [docusaurus-docs](/ja/examples#docusaurus-docs) | スタンドアロンのDocusaurusドキュメントサイト |
| [astro-website](/ja/examples#astro-website) | Astro マーケティングサイト: 全ページ HTML 翻訳と `t()` 文字列 |
| [astro-docs](/ja/examples#astro-docs) | Astro Starlight ドキュメントサイト |
| [vitepress-docs](/ja/examples#vitepress-docs) | VitePressドキュメントとテーマカタログ |
| [nextra-docs](/ja/examples#nextra-docs) | Nextraドキュメントと`_meta.ts`サイドバーラベルおよびテーマ辞書 |
| [fumadocs-docs](/ja/examples#fumadocs-docs) | Fumadocsドキュメントと`meta.json`サイドバーラベルおよびUIカタログ |
| [multi-provider](/ja/examples#multi-provider) | 同じドキュメントで LLM プロバイダーを比較 |
| [test-markdown](/ja/examples#test-markdown) | Markdown パイプラインのストレステスト (CJK、デーヴァナーガリー、エッジケース) |

[例](/ja/examples) で `npx degit` コピーコマンドと選択ガイドを参照してください。

<a id="next-steps"></a>
## 次のステップ

1. [インストール](/ja/guide/installation) — パッケージをインストールし、プロバイダーAPIキーを設定します。
2. [クイックスタート](/ja/guide/quick-start) — 設定をスキャフォールドし、最初の翻訳を実行します。
3. [プロバイダーとモデル](/ja/guide/providers-and-models) — プロバイダー、モデルフォールバックチェーン、および`-P`オーバーライドを選択します。
