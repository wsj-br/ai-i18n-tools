---
layout: home
title: ai-i18n-tools
description: JavaScript/TypeScriptアプリケーション、Pythonアプリケーション、およびドキュメントサイトを、任意のLLMプロバイダーを使用して国際化するためのCLIおよびツールキットです。
hero:
  name: ai-i18n-tools
  text: 任意のLLMでアプリとドキュメントを翻訳
  tagline: >-
    JavaScript、TypeScript、Python から t() 文字列を抽出します。Markdown、MDX、HTML ページ、JSON
    バンドル、SVG ラベルを、OpenAI、Anthropic、Gemini、OpenRouter、Ollama、または任意の OpenAI 互換 API
    を使用して、1 つの設定からすべて翻訳します。コードベースを書き直すことなく、プロジェクトごとまたはロケールごとにモデルを切り替えることができます。
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools ロゴ
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/quick-start
    - theme: alt
      text: GitHubで見る
      link: https://github.com/wsj-br/ai-i18n-tools
    - theme: alt
      text: npm パッケージ
      link: https://www.npmjs.com/package/ai-i18n-tools
features:
  - icon: 🌐
    title: UI文字列
    details: >-
      JavaScript、TypeScript、Astro、Python の t() および
      _()、または1つのHTMLファイル内のdata-i18nマーカーを抽出します。ロケールごとのフラットなJSON、またはGNU
      gettextカタログ。
  - icon: 📄
    title: ドキュメント
    details: VitePress、Starlight、Docusaurus、Nextra、Fumadocs、および通常の静的サイト向けのMarkdown、MDX、Astro、HTMLページを翻訳します。
  - icon: 📦
    title: JSONバンドル
    details: ソースの t() 呼び出し以外にUIコピーが存在する場合（テーマラベル、カタログ、アプリの上書きなど）に使用する、ネストされたロケールJSON。
  - icon: 🔄
    title: スマートキャッシュ
    details: すべてのパイプラインで共有されるSQLiteキャッシュ。再実行時に新規または変更されたセグメントのみがモデルに送信されます。
  - icon: 🔌
    title: プロバイダー非依存
    details: 主要なLLM APIの組み込みプリセットに加え、カスタムのOpenAI互換エンドポイントに対応。-P でアクティブなプロバイダーを上書きできます。
  - icon: ⚡
    title: 1つの同期コマンド
    details: 1つの設定から、extract、translate-ui、translate-svg、translate-docs、translate-jsonを正しい順序で実行します。
  - icon: 🐍
    title: Python、Node.js不要
    details: >-
      GitHub
      Releaseで提供されるスタンドアロン実行ファイルにより、Pythonアプリ用のCLIを実行できます。Streamlit、FastAPI、Flask、Django、およびgettextが含まれています。
  - icon: 📊
    title: モデルのランキングリスト
    details: >-
      suggest-models は、アクティブなプロバイダーのチャットモデルをランク付けし、translationModels
      を書き込むことができます。同じランキングがダッシュボードの Models タブに表示されています。
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## クイックインストール

公開されているパッケージは**ESM専用**です。Node.js `>=22.16.0` が必要です。

```bash
pnpm add ai-i18n-tools
# Set the API key for the provider you pass to init — see the preset table
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
ai-i18n-tools init -P openrouter
ai-i18n-tools suggest-models
ai-i18n-tools sync
```

`suggest-models`は、アクティブなプロバイダーのモデルをランク付けします。`--apply`を追加して、スキャフォールドされた`translationModels`リストを置き換えます。[クイックスタート](/ja/guide/quick-start)および[モデル](/ja/guide/translation-dashboard/models)タブを参照してください。

<a id="python-no-nodejs"></a>
### Python、Node.js不要

[GitHubリリース](https://github.com/wsj-br/ai-i18n-tools/releases)から、該当するファイル（`ai-i18n-tools-linux-x64`、`ai-i18n-tools-linux-arm64`、`ai-i18n-tools-macos-arm64`、`ai-i18n-tools-macos-x64`、または`ai-i18n-tools-win-x64.exe`）をダウンロードします。`SHA256SUMS.txt`を確認し、Unixで`chmod +x`を実行し、ファイルを`PATH`に配置します。バイナリは署名されていません。手順：[スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables)。その後、`ai-i18n-tools init -t ui-python -P cheaperinference`。ウォークスルー：[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)。

[単体のCLIコマンドの設定](/ja/guide/installation#using-the-cli)（[クローンしたモノレポでの開発](/ja/guide/installation#cloned-monorepo)を含む）については[インストール](/ja/guide/installation)を、スキャフォールドテンプレートについては[クイックスタート](/ja/guide/quick-start)を参照してください。

<a id="which-pipeline-should-i-use"></a>
## どのパイプラインを使用すべきですか？

| コンテンツ | コマンド |
| --- | --- |
| ソースコードで`t()`または`_()`（JavaScript、TypeScript、またはPython）、gettext、あるいはマーカー付きのHTMLファイルを1つ使用する場合 | **UI文字列** — `extract` / `translate-ui` |
| ローカライズされたページ、ドキュメントサイト、またはロケールごとの1つのHTMLファイル | **ドキュメント** — `translate-docs` |
| スタンドアロンのネストされたJSONロケールファイル | **JSON** — `translate-json` |

SVGイラストは`docs[].contentPaths`ではなく、別の`translate-svg`パスを使用します。完全な比較については[ai-i18n-toolsとは？](/ja/guide/what-is-ai-i18n-tools)を参照してください。

<a id="explore-the-documentation"></a>
## ドキュメントを探索する

- [**ガイド**](/ja/guide/what-is-ai-i18n-tools) — 翻訳モード、インストール、クイックスタート、フレームワーク統合
- [**統合**](/ja/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro、およびPython
- [**プロバイダーとモデル**](/ja/guide/providers-and-models) — プリセット、フォールバックチェーン、ランキングされた提案（`suggest-models`）、および`-P`のオーバーライド
- [**CLIリファレンス**](/ja/reference/cli-commands/) — すべてのコマンド、フラグ、およびワークフロー
- [**設定**](/ja/reference/configuration) — 完全な`ai-i18n-tools.config.json`スキーマ
- [**例**](/ja/examples) — 17個の実行可能なデモプロジェクト（`npx degit`、またはPythonの例のzipファイル）
- [**アーキテクチャ**](/ja/reference/architecture) — 内部構造、プログラム可能なAPI、および拡張ポイント

パッケージを自分のプロジェクトに組み込む場合は、[AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) から始めてください。[リポジトリの README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) は短い GitHub/npm ランディングページであり、詳細についてはここへリンクしています。

<br/>
<br/>

::: tip 免責事項
製品名およびアイコンはそれぞれの所有者に帰属し、識別目的でのみ使用されています。本ソフトウェアは、それらのブランドと提携しておらず、またそれらのブランドによって推奨されているものでもありません。

英語（英国）を除くすべてのインターフェースおよびドキュメントの言語は、このパッケージ（ai-i18n-tools）を使用してAIにより翻訳されたものであり、表現が不正確であったり誤りを含んでいる可能性があります。
:::

<br/>
