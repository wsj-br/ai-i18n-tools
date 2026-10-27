<a id="add-i18n-to-your-project"></a>
# プロジェクトにi18nを追加する

このセクションは、現在単一言語で作成されているプロジェクト向けのウォークスルー集です。ここから始めましょう。以下の各ページでは、ある種類のプロジェクトをセットアップから最初の翻訳済みファイルの作成まで進める手順を説明します。[はじめに](/ja/guide/what-is-ai-i18n-tools)では、ツールの概要、インストールオプション、プロバイダーとモデルについて説明しています。これらのページを先に読まなくても、ウォークスルーを開始できます。

<a id="what-you-do-and-what-the-tool-does"></a>
## あなたが行うこととツールが行うこと

| あなた | ツール |
| --- | --- |
| 試用する言語、プロバイダー、モデルを選択します | テキストを抽出し、翻訳し、結果をチェックして、カタログまたはページを書き出します |
| テキストを可視化する：アプリコード内の`t()`、サイトフレームワークのi18n、またはREADME内の言語リストマーカー | すべての翻訳をキャッシュし、次回の実行時に再利用する |
| ファイルをロードし、1つの言語を確認する | 進捗状況を表示し、[翻訳ダッシュボード](/ja/guide/translation-dashboard/)で文言を確認できる |

ウォークスルーでは、どのソース編集があなたが行うべきものかを示します。これらの編集が機械的なものである場合は、コーディングエージェントのプロンプトが含まれています。CLIはカタログと翻訳ファイルを書き込みます。i18nextやサイトフレームワークのi18nをインストールすることはありません。

<a id="shared-setup"></a>
## 共通のセットアップ

すべてのウォークスルーは同じ順序で進みます。選択したページで詳細が説明されます。

1. CLIをインストールし、プロバイダーのAPIキーを設定します。Ollamaはキーを必要としません。[インストール](/ja/guide/installation)と[プロバイダーとAPIキー](/ja/guide/quick-start#provider-and-api-key)を参照してください。
2. そのページで指定されているテンプレートを使用して`init`を実行します。これにより`ai-i18n-tools.config.json`が書き込まれます。
3. ツールがテキストを認識できるようにプロジェクトを準備します。
4. `ai-i18n-tools sync`を実行し、次に`ai-i18n-tools status`を実行します。
5. 出力をロードし、1つのターゲット言語を確認し、ソースが変更されたら`sync`を再実行します。キャッシュは、新規または変更されたテキストのみをモデルに送信します。

<a id="pages-in-this-section"></a>
## このセクションのページ

| お持ちのプロジェクト | ページ | そのページの内容 |
| --- | --- | --- |
| ボタンやメッセージがまだプレーンテキストのJS/TSアプリ（React、Next.js、Node、CLI） | [JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js) | i18nextをインストールし、ブートストラップを追加し、リテラルを`t()`でラップし、その後`extract`と`translate-ui`を実行する |
| Pythonアプリ（Streamlit、FastAPI、Flask、Django、gettext） | [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) | `t()`または`_()`でラップするか、GNU gettextを維持します。CLIはNode.jsをインストールせずにスタンドアロン実行可能ファイルから実行できます |
| ドキュメントまたはマーケティングサイト（VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro、プレーンHTML） | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website) | フレームワーク独自の言語ルートを有効にし、ページとテーマラベルを翻訳する |
| リポジトリのREADMEおよびその他のMarkdownファイル（通常はアプリの隣） | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) | 言語ごとに1つのファイル（`translated-docs/README.de.md`）とREADME内の言語行。`init --with-readme`は、そのブロックを任意のテンプレートに追加します |
| 1つのリポジトリに上記の複数がある場合 | [パイプラインの結合](/ja/guide/combining-pipelines) | 1つの設定と1つの`sync`。一般的な組み合わせは、アプリのUI文字列とREADMEです |
| Intlayer辞書があり、Intlayerを維持したい場合 | [Intlayerをその場で翻訳する](/ja/guide/translating-intlayer) | `translate-intlayer`は、`*.content.ts`内の欠落しているリーフと古いリーフを埋めます |
| Intlayer辞書があり、Intlayerから移行する場合 | [Intlayerからの移行](/ja/guide/migrating-from-intlayer) | `migrate-intlayer`は、辞書からカタログをシードし、安全な呼び出しサイトを`t()`に書き換えます |

READMEも持つアプリは、アプリのページとREADMEのページを組み合わせて使用します。READMEも持つサイトは、ウェブサイトのページと、READMEブロックには`init … --with-readme`を使用します。

<a id="where-to-go-deeper"></a>
## さらに詳しく学ぶには

最初の言語が設定されると、チュートリアルは終了します。以降は、以下のリファレンスページをご参照ください。

- [UI 文字列](/ja/guide/ui-strings/)、[ドキュメント](/ja/guide/documents/)、[JSON](/ja/guide/json)、[SVG](/ja/guide/svg-translation/): 一度に 1 つのパイプライン用。
- [統合](/ja/guide/integrations/): フレームワーク シェル文字列 (ナビゲーション、サイドバー、テーマ) 用。
- [クイックスタート](/ja/guide/quick-start): コマンドリストと推奨される `package.json` スクリプト用。
- [LLM プロバイダー](/ja/guide/providers-and-models): プリセットと API キー用。
- [AI モデル](/ja/guide/ai-models): ランク付けされたショートリストとフォールバック チェーン用。
