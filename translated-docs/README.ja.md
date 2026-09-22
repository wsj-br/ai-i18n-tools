<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**お好みのAIモデルでアプリとドキュメントを翻訳 — ロックインなし、書き直し不要。**

JavaScript/TypeScriptアプリおよびドキュメントサイトを国際化するためのCLIおよびツールキット。`t()`文字列の抽出、Markdown/MDXページ、JSONバンドル、SVGラベルの翻訳を単一の構成から実行でき、OpenAI、Anthropic、Gemini、OpenRouter、Ollama、およびOpenAI互換API用の組み込みプリセットを備えています。コードベースを変更することなく、プロジェクトごとまたはロケールごとにプロバイダーやモデルを切り替えられます。

[VitePress](https://vitepress.dev/)、[Starlight](https://starlight.astro.build/)、[Docusaurus](https://docusaurus.io/)、[Nextra](https://nextra.site/)、[Fumadocs](https://www.fumadocs.dev/)、[Astro](https://astro.build/)、およびプレーンMarkdownに対応しています。既存の[i18next](https://www.i18next.com/)カタログ（名前空間JSONまたは`t()`ソース文字列）は保持され、`migrate-intlayer`を使用して[Intlayer](https://intlayer.org/)プロジェクトを移行します。

<a id="features"></a>
## 機能

| | |
| --- | --- |
| **UI文字列** | JS/TS/Astroから`t("…")`を抽出（およびHTML内の`data-i18n*`）→ ロケールごとのフラットなJSON |
| **ドキュメント** | 主要なドキュメントフレームワーク向けにMarkdown、MDX、および`.astro`ページを翻訳 |
| **JSON** | テキストが`t()`呼び出しの外にある場合、ネストされたロケールバンドルを翻訳 |
| **SVG** | `translate-svg`を介してイラスト付きSVGラベルを翻訳 |
| **スマートキャッシュ** | 共有SQLiteキャッシュ — 新規または変更されたセグメントのみがモデルにアクセス |
| **単一の`sync`** | 1つの設定から抽出 → UI → SVG → ドキュメント → JSONを正しい順序で実行 |

<a id="which-pipeline"></a>
## どのパイプライン？

| コンテンツ | コマンド |
| --- | --- |
| ソースが`t()`またはHTMLマーカーを使用している | **UI文字列** — `extract` / `translate-ui` |
| ローカライズされたページやドキュメントサイト | **ドキュメント** — `translate-docs` |
| スタンドアロンのネストされたJSONロケールファイル | **JSON** — `translate-json` |
| SVGでラベル付けされた図表またはイラスト | **SVG** — `translate-svg` |

詳細な比較については、[ai-i18n-toolsとは？](https://wsj-br.github.io/ai-i18n-tools/ja/guide/what-is-ai-i18n-tools)を参照してください。

<a id="install"></a>
## インストール

ESM専用です。Node.js `>=22.16.0`が必要です。

```bash
pnpm add ai-i18n-tools
# or: npm install ai-i18n-tools
```

プロバイダーのAPIキーを設定します（デフォルトの`init`はOpenRouterを使用します。Ollamaには不要です）。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

単体の`ai-i18n-tools`コマンド（direnv、PATH、`package.json`スクリプト、または`npx`）を設定します。[インストール](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation)を参照してください。

<a id="quick-start"></a>
## クイックスタート

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

ドキュメント指向のスキャフォールド: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, または `ui-json-bundles`。

個々の翻訳コマンドを連続して実行するよりも、`sync`を使用することをお勧めします。詳細な手順：[クイックスタート](https://wsj-br.github.io/ai-i18n-tools/ja/guide/quick-start)。

<a id="documentation"></a>
## ドキュメント

- [ドキュメントサイト](https://wsj-br.github.io/ai-i18n-tools/ja/) — ガイド、統合、およびリファレンス
- [インストール](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation) · [クイックスタート](https://wsj-br.github.io/ai-i18n-tools/ja/guide/quick-start) · [プロバイダーとモデル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/providers-and-models)
- [UI文字列](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/) · [ドキュメント](https://wsj-br.github.io/ai-i18n-tools/ja/guide/documents/) · [JSON](https://wsj-br.github.io/ai-i18n-tools/ja/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/ja/guide/svg-translation/)
- [統合](https://wsj-br.github.io/ai-i18n-tools/ja/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro
- [CLIリファレンス](https://wsj-br.github.io/ai-i18n-tools/ja/reference/cli-commands/) · [設定](https://wsj-br.github.io/ai-i18n-tools/ja/reference/configuration) · [ランタイムヘルパー](https://wsj-br.github.io/ai-i18n-tools/ja/guide/runtime-helpers)
- [例](https://wsj-br.github.io/ai-i18n-tools/ja/examples) — 実行可能なデモ（`npx degit …`）
- [AIエージェントコンテキスト](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — コンシューマーリポジトリ向けアシスタントの統合ガイド

<a id="contributing"></a>
## コントリビュート

Issueやプルリクエストを歓迎します。このリポジトリのメンテナーワークフロー: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) および [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)。

<a id="license"></a>
## ライセンス

MIT — [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) を参照してください。

Copyright © 2026 Waldemar Scudeller Jr.

<br/>

製品名およびアイコンはそれぞれの所有者に帰属し、識別目的でのみ使用されています。本ソフトウェアは、それらのブランドと提携しておらず、またそれらのブランドによって承認されたものではありません。

<small>

> **UIおよびドキュメントの翻訳に関する注意:** 英語 (UK) を除くすべてのインターフェースおよびドキュメントの言語は、本パッケージ (ai-i18n-tools) を使用してAIにより翻訳されました。表現が不正確であったり、誤りが含まれている可能性があります。

</small>
