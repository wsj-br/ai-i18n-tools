---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  ガイド付きセットアップ、AI
  翻訳、キャッシュの再利用で、単一言語のアプリ、ウェブサイト、リポジトリのドキュメントを多言語化しましょう。JavaScript、TypeScript、Python、または
  README から始められます。
hero:
  name: ai-i18n-tools
  text: 単一言語のプロジェクトを多言語化。
  tagline: >-
    ガイド付きセットアップと AI
    翻訳を使用して、アプリ、ウェブサイト、またはリポジトリのドキュメントに言語を追加します。プロバイダーとモデルを選択し、プロジェクトの成長に合わせてキャッシュされた翻訳を再利用します。
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools ロゴ
  actions:
    - theme: brand
      text: プロジェクトを選択
      link: '#start-here'
    - theme: alt
      text: サンプルを見る
      link: /ja/examples
---



<a id="start-with-the-project-you-have"></a>
## 既存のプロジェクトから始める

現在は単一言語ですか？ここから始めましょう。その言語はどの言語でもかまいません。`sourceLocale` として設定してください。このガイドでは、一般的な例として英語を使用します。国際化 (i18n) は、プロジェクトがさまざまな言語をサポートするための準備です。このガイドでは、セットアップから最初の翻訳体験までを案内します。これには、GitHub、GitLab、またはその他のホストでリポジトリにすでに表示されている README も含まれます。

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="javascript-or-typescript-app"></a>
### JavaScript または TypeScript アプリ

プレーンテキストのボタン、ラベル、メッセージを多言語 UI に変換します。ランタイムをセットアップし、翻訳するテキストをマークし、言語の切り替えを実装します。準備ステップのためのコーディングエージェントのプロンプトが含まれています。

React · Next.js · Node.js · CLI

[JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-app"></a>
### Python アプリ

ユーザー向けのテキストをラップし、生成されたヘルパーで翻訳済みメッセージを読み込むか、ネイティブの gettext をそのまま使用します。別途 Node.js をインストールする必要なく、スタンドアロンの実行可能ファイルから翻訳 CLI を実行できます。

Streamlit · FastAPI · Flask · Django · CLI

[Python アプリに i18n を追加する](/ja/guide/add-i18n-to-python)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="website-or-documentation"></a>
### ウェブサイトまたはドキュメント

ローカライズされたページを公開し、サイトの言語ルートに接続します。ナビゲーション、テーマのラベル、言語メニューについては、フレームワーク固有の手順に従ってください。

VitePress・Starlight・Docusaurus・Astro

[ウェブサイトまたはドキュメントサイトに i18n を追加する](/ja/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="repository-readme-and-docs"></a>
### リポジトリの README とドキュメント

`README.md`やその他のMarkdownファイルを、言語ごとに1つのファイルに翻訳し、それらの間にリンクの行を設けます。アプリのUI文字列と組み合わせるか、READMEを単独で翻訳します。

GitHub・GitLab・Bitbucket

[README と Markdown ドキュメントに i18n を追加する](/ja/guide/add-i18n-to-readme)

</article>
</div>

どのパスが適しているかわからない場合は、[プロジェクトにi18nを追加する](/ja/guide/add-i18n-to-your-project)にすべてのウォークスルーが記載されています。パイプラインがどのように連携するかについては、[ai-i18n-toolsの機能](/ja/guide/what-is-ai-i18n-tools)を参照してください。

<a id="from-setup-to-your-first-new-language"></a>
## セットアップから最初の新しい言語まで

<div class="home-steps">

1. **プロジェクトを準備します。** 言語、翻訳プロバイダー、試用するモデルを選択します。アプリの場合は、ユーザー向けのテキストをマークし、翻訳ランタイムをセットアップします。サイトの場合は、フレームワークの言語ルーティングを有効にします。ガイドには、ソースの変更が必要な場合に備えて、コーディングエージェントのプロンプトが含まれています。
2. **使用可能なファイルに翻訳します。** セットアップが完了したら、`sync` を実行します。これにより、サポートされているアプリの文字列が抽出され、有効にしたコンテンツが翻訳されて、ロケールファイルまたはローカライズされたページが書き込まれます。
3. **読み込み、確認し、続行します。** 出力をアプリまたはサイトに接続し、言語切り替えを実装して、ターゲット言語を確認します。ソースが変更された後に再実行して、新規または変更されたテキストを翻訳します。

</div>

ランタイムとルーティングのセットアップは、手動またはコーディングエージェントを使用して行います。CLIは、抽出、翻訳、検証、ファイル生成を処理します—ソースの自動書き換えや言語スイッチャーのインストールは行いません。[完全なクイックスタートに従ってください](/ja/guide/quick-start)。

<a id="your-source-text-ready-for-more-languages"></a>
## ソーステキストを多言語に対応させる

この JS/TS のサンプルは、ランタイムのセットアップと翻訳後の結果の形式を示します。ソース文字列をマークすることで検出可能になり、生成された各ロケールファイルでその文章が翻訳にマッピングされます。

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

ソースの文はコード内で読みやすいままです。アプリは実行時に生成されたロケールファイルを読み込みます。全体的な実装を確認したい場合は、[動作するNext.jsのサンプルを探索](/ja/examples#nextjs-app)してください。ウェブサイトは異なるパスをたどります。各段落をラップする代わりに[ローカライズされたページを生成](/ja/guide/add-i18n-to-website)します。

<a id="built-for-the-next-update-too"></a>
## 次のアップデートにも対応

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="choose-your-provider-and-models"></a>
### プロバイダーとモデルを選択

OpenAI、Anthropic、OpenRouter、Gemini、ローカルのOllama、またはその他9つの組み込みオプションなど、サポートされているプロバイダーを使用できます。また、OpenAI互換のプロバイダーも使用できます。翻訳品質はモデルリスト (`translationModels`、およびロケールごとのオーバーライド) に従います。`suggest-models`、およびダッシュボードの**モデル**にある同じランキングは、公開されている翻訳ベンチマークからそのリストを構築します。

[LLMプロバイダー](/ja/guide/providers-and-models) · [AIモデル](/ja/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="reuse-work-already-done"></a>
### 既存の作業を再利用

キャッシュされた翻訳により、再実行時にはすべてを再翻訳するのではなく、新規または変更されたテキストに集中できます。

[翻訳を維持する](/ja/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="review-ai-output-locally"></a>
### AI の出力をローカルでレビュー

翻訳ダッシュボードで、翻訳の検査、表現の修正、用語の管理を行います。

[ダッシュボードを見る](/ja/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="keep-app-and-content-together"></a>
### アプリとコンテンツを一緒に管理

1つの設定で、アプリのメッセージ、ドキュメント、ネストされたロケールJSON、SVGテキストラベルを翻訳します。必要なものだけを有効にしてください。

[パイプラインを組み合わせる](/ja/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="translate-the-readme-with-the-app"></a>
### アプリと一緒に README を翻訳

1つの `sync` でUI文字列とリポジトリのMarkdownをカバーし、READMEに言語の行を書き込みます。

[README と Markdown ドキュメントに i18n を追加する](/ja/guide/add-i18n-to-readme)

</article>
</div>

<a id="see-a-working-project-first"></a>
## まず動作するプロジェクトを確認

これらの例には、設定ファイルとコミット済みの翻訳ファイルが含まれています。APIキーなしで出力を確認できます。翻訳を再実行するには、設定済みのプロバイダーと、通常はキーが必要です。ローカルのOllamaはAPIキーを必要としません。

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="a-multilingual-app"></a>
### 多言語アプリ

動作するNext.jsプロジェクトで、Reactコンポーネント、ランタイムの連携、複数形、言語の切り替えを確認してください。

[Next.js の例を見る](/ja/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-in-practice"></a>
### 実践的な Python

Streamlitアプリが、アプリにJavaScriptランタイムを追加することなく、メッセージをラップして翻訳済みのJSONを使用する方法を確認してください。

[Streamlit の例を見る](/ja/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="docs-in-more-languages"></a>
### 多言語のドキュメント

翻訳されたVitePressページと、ローカライズされたナビゲーションおよびテーマのラベルを確認してください。

[VitePress の例を見る](/ja/examples#vitepress-docs)

</article>
</div>

プレーンなHTML、他のフレームワーク、既存のi18nワークフローを含む、[実行可能なすべての例](/ja/examples)をご覧ください。

<a id="already-have-i18n-keep-what-works"></a>
## 既存の i18n を活用

最初からやり直す必要はありません。

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="source-string-calls"></a>
### ソース文字列の呼び出し

プロジェクトに既にある `t()` と gettext の呼び出しはそのままにしてください。

[JS/TS UI 文字列](/ja/guide/ui-strings/)・[Python と gettext](/ja/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="json-bundles"></a>
### JSON バンドル

i18next の名前空間を含む、ネストされたロケールファイルを翻訳します。サイトナビゲーションとテーマカタログは、このパスではなく [ドキュメント翻訳](/ja/guide/add-i18n-to-website#what-gets-translated) に属します。

[JSON バンドルを翻訳する](/ja/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="intlayer-dictionaries"></a>
### Intlayer 辞書

Intlayer をそのまま使用して未翻訳の箇所を翻訳するか、アプリをソース文字列の呼び出しに移行します。

[インプレースで翻訳する](/ja/guide/translating-intlayer)・[ソース文字列の呼び出しに移行する](/ja/guide/migrating-from-intlayer)

</article>
</div>

図を使用していますか？アプリやドキュメントと一緒に [SVG テキストラベルを翻訳](/ja/guide/svg-translation/) してください。

<a id="ready-to-add-your-first-language"></a>
## 最初の言語を追加する準備はできましたか？

<div class="home-cta">

完全なウォークスルーについては [プロジェクトを選択](#start-here) するか、インストールと設定については [クイックスタートを開いて](/ja/guide/quick-start) ください。

Node.js プロジェクトの場合は、[npm パッケージ](/ja/guide/installation) をインストールしてください。

<a id="python-no-nodejs"></a>

Python の場合は、[スタンドアロンの実行可能ファイル](/ja/guide/installation#standalone-executables) をダウンロードしてください。別途 Node.js をインストールする必要はありません。

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="go-deeper-when-you-need-to"></a>
## 必要に応じてさらに深く

[インテグレーション](/ja/guide/integrations/) · [LLMプロバイダー](/ja/guide/providers-and-models) · [AIモデル](/ja/guide/ai-models) · [設定](/ja/reference/configuration) · [CLIリファレンス](/ja/reference/cli-commands/)

<br/>

<br/>

::: info このサイトについて
英語以外のインターフェースとドキュメントは ai-i18n-tools を使用して翻訳されました。AI による翻訳には誤りが含まれる場合があります。

すべての製品名、ロゴ、および商標は、それぞれの所有者に帰属します。アイコンと名称は、識別のみを目的として使用されています。このプロジェクトは、これらのブランドと提携しているわけでも、承認を受けているわけでもありません。
:::
