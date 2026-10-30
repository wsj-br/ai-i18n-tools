<a id="what-is-ai-i18n-tools"></a>
# ai-i18n-tools とは

アプリ、ウェブサイト、ドキュメントサイト、またはリポジトリのREADMEが1つの言語で書かれており、それを多言語化したいと考えているとします。その言語は`sourceLocale`であり、どの言語でもかまいません。このガイドでは、英語が一般的な例です。ai-i18n-toolsはテキストを検索し、選択したLLMプロバイダーのモデルで翻訳し、プロジェクトがすでに読み込んでいるファイルに書き込みます。すべての結果をキャッシュするため、再実行時には新規または変更されたテキストのみがモデルに送信されます。

<a id="what-you-do-and-what-the-tool-does"></a>
## あなたが行うこととツールが行うこと

| ユーザー | ツール |
| --- | --- |
| 言語、プロバイダー、試行するモデルを選択 | テキストを抽出し、翻訳し、結果を検証して、カタログまたはページを書き込みます |
| ユーザー向けテキストをツールから見えるようにする: アプリコード内の `t()` 呼び出し、サイト用フレームワーク標準の国際化機能、またはREADME内の言語リストマーカー | 翻訳をキャッシュし、再実行のたびに再利用する |
| 結果をアプリ、サイトのルーティング、またはREADMEの言語行に組み込む | 進行状況を表示し、ダッシュボードで翻訳を確認できるようにする |

このツールはソースを書き換えません。ラップ手順用に、コーディングエージェント向けのプロンプトが提供されています。i18next やサイト用フレームワークの国際化機能はインストールせず、言語切り替え機能も構築しませんが、そのための実行時ヘルパーは提供されています。

<a id="where-do-i-start"></a>
## どこから始めればよいですか？

ウォークスルーは [プロジェクトに国際化を追加する](/ja/guide/add-i18n-to-your-project) にまとめられており、共通セットアップとプロジェクトの種類ごとのページがあります。行を選択してください:

| 対象 | ここから開始 |
| --- | --- |
| ソース内にプレーンテキストがあるジェイエス／ティーエスアプリ（React、Next.js、Node、コマンドラインインターフェイス） | [ジェイエス／ティーエスアプリに国際化を追加する](/ja/guide/add-i18n-to-js) |
| Pythonアプリ (Streamlit、FastAPI、Flask、デスクトップ、スクリプト) | [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) |
| Djangoアプリ、Flask-Babelカタログ、またはGNU gettextを既に利用しているアプリ | [Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext) |
| ウェブサイトまたはドキュメントサイト（VitePress、Docusaurus、Starlight、Nextra、Fumadocs、Astro、プレーンHTML） | [ウェブサイトまたはドキュメントサイトに国際化を追加する](/ja/guide/add-i18n-to-website) |
| リポジトリのREADMEとその他のマークダウン形式ファイル（通常はアプリの隣） | [READMEとマークダウン形式のドキュメントに国際化を追加する](/ja/guide/add-i18n-to-readme) |
| スタンドアロンのネストされたJSONロケールファイル | [JSON](/ja/guide/json) |
| テキストラベルを含むSVG図 | [SVG翻訳](/ja/guide/svg-translation/) |
| Intlayer辞書（Intlayerから移行） | [Intlayerからの移行](/ja/guide/migrating-from-intlayer) |
| Intlayer辞書（Intlayerを維持し、その場で翻訳） | [Intlayerをその場で翻訳する](/ja/guide/translating-intlayer) |

<a id="how-it-works"></a>
## 仕組み

1. コマンドラインインターフェイスをインストールし、プロバイダーの認証キーを設定します: [インストール](/ja/guide/installation)。
2. `init` を実行して `ai-i18n-tools.config.json` を書き込みます: [クイックスタート](/ja/guide/quick-start)。
3. プロジェクトを準備します: 文字列を `t()` でラップする、サイト用フレームワークの国際化機能を有効にする、またはREADMEに言語リストマーカーを追加します。
4. `sync` を実行します。テキストを抽出し、新しい内容を翻訳して、出力を書き込みます。
5. 出力をアプリまたはサイトで読み込み、言語切り替え機能を追加し、ソースが変更されたら `sync` を再実行します。

<a id="translation-modes"></a>
## 翻訳モード

内部では、ツールは4つのパイプラインを実行します。設定で必要なものを有効にし、`sync` がそれらを順番に実行します。

- ユーザーインターフェイス文字列 — ジェイエス／ティーエスおよびパイソンのソースから `t("…")` と `_()` の呼び出し（GNU gettext などの同様のマーカーを含む）を抽出し、ロケールごとのフラットなJSON、または `.po` / `.mo` カタログを書き込みます。コマンド: `extract`、`translate-ui`。ガイド: [ユーザーインターフェイス文字列](/ja/guide/ui-strings/)。パイソン: [パイソンアプリケーション](/ja/guide/ui-strings/python)。
- ドキュメント — `docs[].contentPaths` に列挙されたマークダウン、MDX、`.astro` ページを翻訳します。VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro、その他の静的ドキュメントサイト、およびリポジトリREADME（`flat` の `docsOutput.style`）で動作します。コマンド: `translate-docs`。ガイド: [ドキュメント](/ja/guide/documents/) および [READMEとマークダウン形式のドキュメントに国際化を追加する](/ja/guide/add-i18n-to-readme)。
- JSON — トップレベルの `json[]` で定義された、ネストされたJSONロケールバンドル（テーマラベル、国際化の上書き、ソース内にないアプリ文言）を翻訳します。コマンド: `translate-json`。ガイド: [JSON](/ja/guide/json)。
- SVG — SVGイラスト内の表示テキスト（`<text>`、`<title>`、`<desc>`）を翻訳し、ロケールごとに1つの出力ファイルを書き込みます。ドキュメント翻訳とは別です。コマンド: `translate-svg`。ガイド: [SVG翻訳](/ja/guide/svg-translation/)。

多くのプロジェクトではモードを組み合わせて使用します。一般的な組み合わせは、UI文字列とリポジトリのREADMEです。VitePressなどのドキュメントサイトも、よくある組み合わせです。詳しくは、[パイプラインの組み合わせ](/ja/guide/combining-pipelines)と[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)をご覧ください。

<a id="examples"></a>
## 例

このリポジトリには、`examples/`配下に実行可能なサンプルプロジェクトが含まれています。各プロジェクトには、それぞれ独自の設定、コミット済みのロケール出力、READMEがあります。APIキーがなくても翻訳済みファイルを確認できますが、翻訳を再実行するにはプロバイダーキーが必要です。

| 対象 | 例 |
| --- | --- |
| JS/TSアプリ | [console-app](/ja/examples#console-app), [nextjs-app](/ja/examples#nextjs-app) |
| アプリに付随するリポジトリのREADME | [console-app](/ja/examples#console-app), [nextjs-app](/ja/examples#nextjs-app) |
| Pythonアプリ | [python-streamlit](/ja/examples#python-streamlit), [python-fastapi](/ja/examples#python-fastapi), [python-gettext](/ja/examples#python-gettext) |
| ドキュメントサイト | [docusaurus-docs](/ja/examples#docusaurus-docs), [vitepress-docs](/ja/examples#vitepress-docs), [astro-docs](/ja/examples#astro-docs) |
| ウェブサイトまたはプレーンHTML | [astro-website](/ja/examples#astro-website), [plain-html](/ja/examples#plain-html) |

全リストと`npx degit`のコピーコマンドについては、[サンプル](/ja/examples)をご覧ください。

<a id="next-steps"></a>
## 次のステップ

1. [インストール](/ja/guide/installation) — npm パッケージをインストールするか、Python プロジェクト用に [スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables) をダウンロードして、プロバイダーの API キーを設定します。
2. [クイックスタート](/ja/guide/quick-start) — 設定の雛形を作成し、最初の翻訳を実行します。
3. [LLM プロバイダー](/ja/guide/providers-and-models) — プロバイダーと API キーを選択し、`-P` で上書きします。
4. [AI モデル](/ja/guide/ai-models) — `suggest-models` またはダッシュボードの **モデル** タブで候補リストをランク付けし、翻訳が失敗した場合に次のモデルを試せるように、複数のモデルを保持します。
