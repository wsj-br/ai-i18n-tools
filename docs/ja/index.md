---
layout: home
title: ai-i18n-tools
description: LLMを使用してJavaScript/TypeScriptアプリケーションやドキュメントサイトを国際化するためのCLIおよびツールキット。
hero:
  name: ai-i18n-tools
  text: 任意のLLMでアプリとドキュメントを翻訳
  tagline: >-
    1つの設定ファイル、3つの翻訳モード、そして選択したプロバイダー（OpenAI、Anthropic、Gemini、OpenRouter、Ollama、またはOpenAI互換の任意のAPI）に対応。コードベースを書き換えることなく、プロジェクトやロケールごとにモデルを切り替えられます。
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
    details: JS、TS、Astroから t() 呼び出しを抽出し、i18nextや静的SSGルックアップ向けにロケールごとのフラットなJSONを生成します。
  - icon: 📄
    title: ドキュメント
    details: >-
      VitePress、Starlight、Docusaurus、Nextra、Fumadocs、および通常の静的サイト向けにMarkdown、MDX、Astroページを翻訳します。
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
    details: >-
      1つの設定から、extract、translate-ui、translate-svg、translate-docs、translate-jsonを正しい順序で実行します。
---



<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

</div>

<a id="quick-install"></a>
## クイックインストール

公開されているパッケージは**ESM専用**です。Node.js `>=22.16.0` が必要です。

```bash
pnpm add ai-i18n-tools
# Set API key for your active provider — see preset table (default init: openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
ai-i18n-tools init [-P <provider>]
ai-i18n-tools sync
```

[単体のCLIコマンドの設定](/ja/guide/installation#using-the-cli)（[クローンしたモノレポでの開発](/ja/guide/installation#cloned-monorepo)を含む）については[インストール](/ja/guide/installation)を、スキャフォールドテンプレートについては[クイックスタート](/ja/guide/quick-start)を参照してください。

<a id="which-pipeline-should-i-use"></a>
## どのパイプラインを使用すべきですか？

| コンテンツ | コマンド |
| --- | --- |
| ソースコードで`t()`を使用 | **UI文字列** — `extract` / `translate-ui` |
| ローカライズされたページやドキュメントサイト | **ドキュメント** — `translate-docs` |
| スタンドアロンのネストされたJSONロケールファイル | **JSON** — `translate-json` |

SVGイラストは`docs[].contentPaths`ではなく、別の`translate-svg`パスを使用します。完全な比較については[ai-i18n-toolsとは？](/ja/guide/what-is-ai-i18n-tools)を参照してください。

<a id="explore-the-documentation"></a>
## ドキュメントを探索する

- [**ガイド**](/ja/guide/what-is-ai-i18n-tools) — 翻訳モード、インストール、クイックスタート、フレームワークの統合
- [**統合**](/ja/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、および Astro
- [**プロバイダーとモデル**](/ja/guide/providers-and-models) — プリセット、フォールバックチェーン、および `-P` のオーバーライド
- [**CLIリファレンス**](/ja/reference/cli-commands/) — すべてのコマンド、フラグ、ワークフロー
- [**設定**](/ja/reference/configuration) — 完全な `ai-i18n-tools.config.json` スキーマ
- [**例**](/ja/examples) — `npx degit` を使用した9つの実行可能なデモプロジェクト
- [**アーキテクチャ**](/ja/reference/architecture) — 内部構造、プログラマティックAPI、拡張ポイント

パッケージを自分のプロジェクトに組み込む場合は、[AI Agent Context](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) から始めてください。[リポジトリの README](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) は短い GitHub/npm ランディングページであり、詳細についてはここへリンクしています。
