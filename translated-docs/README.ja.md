<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**お好みのAIモデルでアプリとドキュメントを翻訳 — ロックインなし、書き直し不要。**

JavaScript/TypeScriptアプリおよびドキュメントサイト（VitePress、Starlight、Docusaurus、Nextra、Fumadocs、Astro、プレーンなMarkdown/MDX）を国際化するためのCLIおよびツールキットです。OpenAI、Anthropic、Gemini、OpenRouter、Ollamaなどの組み込みプリセット、またはOpenAI互換の任意のAPIを使用できます。コードベースを変更することなく、プロジェクトやロケールごとにプロバイダーやモデルを切り替えられます。

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

完全な比較については、[ai-i18n-toolsとは？](../docs/guide/what-is-ai-i18n-tools.md)を参照してください。

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

素の`ai-i18n-tools`コマンドを設定します（direnv、PATH、`package.json`スクリプト、または`npx`） — [インストール](../docs/guide/installation.md)を参照してください。

<a id="quick-start"></a>
## クイックスタート

```bash
ai-i18n-tools init [-P <provider>]   # scaffold config (default: UI strings)
ai-i18n-tools sync                   # extract + translate per features
```

ドキュメント指向のスキャフォールド: `-t ui-docusaurus`, `ui-starlight`, `ui-vitepress`, `ui-nextra`, `ui-fumadocs`, `ui-astro-website`, または `ui-json-bundles`。

個別の翻訳コマンドを連鎖させるよりも、`sync`を使用することをお勧めします。完全なチュートリアル: [クイックスタート](../docs/guide/quick-start.md)。

<a id="documentation"></a>
## ドキュメント

- [ドキュメントサイト](https://wsj-br.github.io/ai-i18n-tools/) — ガイド、インテグレーション、リファレンス
- [インストール](../docs/guide/installation.md) · [クイックスタート](../docs/guide/quick-start.md) · [プロバイダーとモデル](../docs/guide/providers-and-models.md)
- [UI文字列](../docs/guide/ui-strings/) · [ドキュメント](../docs/guide/documents/) · [JSON](../docs/guide/json.md) · [SVG](../docs/guide/svg-translation/)
- [インテグレーション](../docs/guide/integrations/) — VitePress, Nextra, Fumadocs, Docusaurus, Astro
- [CLIリファレンス](../docs/reference/cli-commands/) · [設定](../docs/reference/configuration.md) · [ランタイムヘルパー](../docs/guide/runtime-helpers.md)
- [例](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) — 実行可能なデモ (`npx degit …`)
- [AIエージェントコンテキスト](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — コンシューマーリポジトリのアシスタント向けインテグレーションガイド

<a id="contributing"></a>
## コントリビュート

Issueやプルリクエストを歓迎します。このリポジトリのメンテナーワークフロー: [`AGENTS.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/AGENTS.md) および [`dev/DEVEL.md`](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md)。

<a id="license"></a>
## ライセンス

MIT — [LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) を参照してください。

Copyright © 2026 Waldemar Scudeller Jr.
