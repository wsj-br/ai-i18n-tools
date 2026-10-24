<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

**お好みのAIモデルでアプリとドキュメントを翻訳 — ロックインなし、書き直し不要。**

JavaScript/TypeScriptアプリ、Pythonアプリ、およびドキュメントサイトを国際化するためのCLIおよびツールキットです。`t()`文字列の抽出、Markdown、MDX、HTMLページ、JSONバンドル、SVGラベルの翻訳を単一の設定ファイルから実行できます。OpenAI、Anthropic、Gemini、OpenRouter、Ollama、およびOpenAI互換のあらゆるAPI向けのプリセットが組み込まれています。コードベースを変更することなく、プロジェクトごと、またはロケールごとにプロバイダーやモデルを切り替え可能です。

[VitePress](https://vitepress.dev/)、[Starlight](https://starlight.astro.build/)、[Docusaurus](https://docusaurus.io/)、[Nextra](https://nextra.site/)、[Fumadocs](https://www.fumadocs.dev/)、[Astro](https://astro.build/)、プレーンなMarkdown、およびプレーンなHTMLに対応しています。Pythonアプリでは`t()` / `_()`またはGNU gettext（Streamlit、FastAPI、Flask、Django、デスクトップツールキット）を使用します。既存の[i18next](https://www.i18next.com/)カタログ（名前空間JSONまたは`t()`ソース文字列）を維持し、`migrate-intlayer`を使用して[Intlayer](https://intlayer.org/)プロジェクトを移行できます。

<a id="features"></a>
## 機能

| | |
| --- | --- |
| **UI文字列** | JS/TS/AstroおよびPythonから`t("…")` / `_()`を抽出、または1つのHTMLファイル内の`data-i18n*`を抽出 → ロケールごとのフラットなJSONまたはGNU gettextへ変換 |
| **ドキュメント** | Markdown、MDX、`.astro`、およびHTMLページを翻訳（ロケールごとに1ファイル） |
| **JSON** | テキストが`t()`呼び出しの外にある場合、ネストされたロケールバンドルを翻訳 |
| **SVG** | `translate-svg`を介してイラスト付きSVGラベルを翻訳 |
| **スマートキャッシュ** | 共有SQLiteキャッシュ — 新規または変更されたセグメントのみがモデルにアクセス |
| **単一の`sync`** | 1つの設定から抽出 → UI → SVG → ドキュメント → JSONを正しい順序で実行 |
| **Python** | 各GitHub Releaseで提供されるスタンドアロン実行ファイル — Node.jsをインストールせずにCLIを実行可能 |
| **ランク付けされたモデル** | `suggest-models`はアクティブなプロバイダーのチャットモデルをランク付けし、`translationModels`を書き込むことが可能 |

<a id="which-pipeline"></a>
## どのパイプライン？

| コンテンツ | コマンド |
| --- | --- |
| ソースで`t()`または`_()`（JavaScript、TypeScript、またはPython）、gettext、あるいは`data-i18n*`マーカー付きのHTMLファイルを使用 | **UI文字列** — `extract` / `translate-ui` |
| ローカライズされたページ、ドキュメントサイト、またはロケールごとの1つのHTMLファイル | **ドキュメント** — `translate-docs` |
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

`init`に渡すプロバイダーのAPIキーを設定します（Ollamaは不要です）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

単体の`ai-i18n-tools`コマンド（direnv、PATH、`package.json`スクリプト、または`npx`）を設定します。[インストール](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation)を参照してください。

<a id="python-no-nodejs"></a>
### Python、Node.js不要

[GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases)から対応するアセットをダウンロードしてください：`ai-i18n-tools-linux-x64`、`ai-i18n-tools-linux-arm64`、`ai-i18n-tools-macos-arm64`、`ai-i18n-tools-macos-x64`、または`ai-i18n-tools-win-x64.exe`。`SHA256SUMS.txt`を確認し、Unix上で`chmod +x`を実行して、ファイルを`PATH`に配置します。バイナリは公証やAuthenticode署名がされていません。4つのPythonサンプルはリポジトリ内およびリリースの`ai-i18n-tools-python-examples.zip`に含まれています。これらはnpm tarballや実行ファイル内には含まれていません。詳細な手順：[スタンドアロン実行ファイル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation#standalone-executables)。

<a id="quick-start"></a>
## クイックスタート

```bash
ai-i18n-tools init -P openrouter   # scaffold config (UI strings template)
ai-i18n-tools suggest-models         # optional ranked shortlist
ai-i18n-tools suggest-models --apply # write that list to translationModels
ai-i18n-tools sync                   # extract + translate per features
```

`init`のリストは出発点です。`suggest-models`はアクティブなプロバイダーのチャットモデルをランク付けします。`--apply`は`translationModels`を置き換えます。同じランキングが[モデル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/translation-dashboard/models)タブにも表示されます。コマンドリファレンス：[suggest-models](https://wsj-br.github.io/ai-i18n-tools/ja/reference/cli-commands/models#suggest-models)。

その他のスキャフォールド: `-t ui-docusaurus`、`ui-starlight`、`ui-vitepress`、`ui-nextra`、`ui-fumadocs`、`ui-astro-website`、`ui-plain-html`、`docs-plain-html`、`ui-json-bundles`、`ui-python`、`ui-python-gettext`、`ui-python-django`、または `ui-python-flask`。

個別の翻訳コマンドを連結するよりも`sync`の使用を推奨します。完全なチュートリアル：[クイックスタート](https://wsj-br.github.io/ai-i18n-tools/ja/guide/quick-start)。Python：[Pythonアプリへのi18n追加](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-python)。

<a id="documentation"></a>
## ドキュメント

- [ドキュメントサイト](https://wsj-br.github.io/ai-i18n-tools/ja/) — ガイド、統合、リファレンス
- [インストール](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation) · [クイックスタート](https://wsj-br.github.io/ai-i18n-tools/ja/guide/quick-start) · [プロバイダーとモデル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/providers-and-models)
- [UI文字列](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/) · [プレーンHTML](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/python) · [ドキュメント](https://wsj-br.github.io/ai-i18n-tools/ja/guide/documents/) · [HTMLページ](https://wsj-br.github.io/ai-i18n-tools/ja/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/ja/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/ja/guide/svg-translation/)
- [統合](https://wsj-br.github.io/ai-i18n-tools/ja/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro、および[Python](https://wsj-br.github.io/ai-i18n-tools/ja/guide/integrations/python)
- [Pythonアプリへのi18n追加](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-python)
- [CLIリファレンス](https://wsj-br.github.io/ai-i18n-tools/ja/reference/cli-commands/) · [設定](https://wsj-br.github.io/ai-i18n-tools/ja/reference/configuration) · [ランタイムヘルパー](https://wsj-br.github.io/ai-i18n-tools/ja/guide/runtime-helpers)
- [サンプル](https://wsj-br.github.io/ai-i18n-tools/ja/examples) — 実行可能なデモ (`npx degit …`)
- [AIエージェントコンテキスト](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — コンシューマーリポジトリ内のアシスタント向け統合ガイド

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
