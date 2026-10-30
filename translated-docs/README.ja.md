<p align="center">
  <img src="../docs/public/ai-i18n-tools_logo.png" alt="ai-i18n-tools logo" width="128" />
</p>

<a id="ai-i18n-tools"></a>
# ai-i18n-tools

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg?event=release)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

**任意のLLMプロバイダーで選択したモデルを使い、アプリ、ウェブサイト、ドキュメントを翻訳。設定は1つ、再実行はキャッシュされます。**

JavaScript/TypeScriptアプリ、Pythonアプリ、ドキュメントサイトに言語を追加するCLIおよびツールキット。開始言語は`sourceLocale`で、任意の言語にできます。テキストを検出し、翻訳し、プロジェクトが読み込むファイルを書き出します。組み込みのプリセットは、OpenAI、Anthropic、Gemini、OpenRouter、Ollama、および任意のOpenAI互換APIに対応しています。プロジェクトごと、またはロケールごとにプロバイダーやモデルを切り替えることができます。

[VitePress](https://vitepress.dev/)、[Starlight](https://starlight.astro.build/)、[Docusaurus](https://docusaurus.io/)、[Nextra](https://nextra.site/)、[Fumadocs](https://www.fumadocs.dev/)、[Astro](https://astro.build/)、[プレーンなMarkdown](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-readme)（リポジトリのREADMEやその他の`.md`ファイル）、およびプレーンなHTMLに対応しています。Pythonアプリは`t()` / `_()`またはGNU gettext（Streamlit、FastAPI、Flask、Django、デスクトップツールキット）を使用します。既存の[i18next](https://www.i18next.com/)カタログ（名前空間JSONまたは`t()`ソース文字列）を保持します。[Intlayer](https://intlayer.org/)とは2つの方法で連携します。Intlayerを維持し、その辞書を`translate-intlayer`で埋めるか、または`migrate-intlayer`を使用してソース文字列の`t()`呼び出しに移行するかです。Intlayerは、型付きコンテンツ辞書や翻訳管理システムに適しています。

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

<a id="where-do-i-start"></a>
## どこから始めればよいですか？

| お持ちのもの | ここから開始 |
| --- | --- |
| ソースにプレーンテキストを含むJS/TSアプリ（React、Next.js、Node、CLI） | [JS/TSアプリにi18nを追加](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-js) |
| Pythonアプリ（Streamlit、FastAPI、Flask、デスクトップ、スクリプト） | [Pythonアプリにi18nを追加する](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-python) |
| Djangoアプリ、Flask-Babelカタログ、またはGNU gettextをすでに使用しているアプリ | [Django / Python gettextアプリにi18nを追加する](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-django-gettext) |
| ウェブサイトまたはドキュメントサイト（VitePress、Docusaurus、Starlight、Nextra、Fumadocs、Astro、プレーンHTML） | [ウェブサイトまたはドキュメントサイトにi18nを追加](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-website) |
| リポジトリのREADMEおよびその他のMarkdownファイル（アプリの有無にかかわらず） | [READMEとMarkdownドキュメントにi18nを追加](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-readme) |
| すでに`t()`または`_()`を呼び出しているコード | [UI文字列](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/) |
| スタンドアロンのネストされたJSONロケールファイル | [JSON](https://wsj-br.github.io/ai-i18n-tools/ja/guide/json) |
| テキストラベル付きSVG図 | [SVG翻訳](https://wsj-br.github.io/ai-i18n-tools/ja/guide/svg-translation/) |
| Intlayer辞書（Intlayerを維持するか、ソース文字列呼び出しに移行するか） | [Intlayerのインプレース翻訳](https://wsj-br.github.io/ai-i18n-tools/ja/guide/translating-intlayer) · [Intlayerからソース文字列呼び出しへの移行](https://wsj-br.github.io/ai-i18n-tools/ja/guide/migrating-from-intlayer) |

パイプラインがどのように連携するかについては、[ai-i18n-toolsとは？](https://wsj-br.github.io/ai-i18n-tools/ja/guide/what-is-ai-i18n-tools)を参照してください。

<a id="install"></a>
## インストール

ESM専用です。Node.js `>=22.16.0`が必要です。

```bash
pnpm add -D ai-i18n-tools
# or: npm install --save-dev ai-i18n-tools
```

`init`に渡すプロバイダーのAPIキーを設定します（Ollamaは不要です）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# or, for OpenAI: export OPENAI_API_KEY=sk-your-key-here
```

単体の`ai-i18n-tools`コマンド（direnv、PATH、`package.json`スクリプト、または`npx`）を設定します。[インストール](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation)を参照してください。

<a id="python-no-nodejs"></a>
### Python、Node.js不要

LinuxおよびmacOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

インストーラーは、このマシン用の実行可能ファイルを選択し、`SHA256SUMS.txt`をチェックし、コマンドを`ai-i18n-tools`としてインストールし、`PATH`に追加します。バイナリは公証されておらず、Authenticode署名もされていません。手動ダウンロード手順: [スタンドアロン実行可能ファイル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation#standalone-executables)。

4つのPythonの例は、リポジトリとリリース版の`ai-i18n-tools-python-examples.zip`に含まれています。それらはnpm tarballや実行可能ファイル内にはありません。

<a id="quick-start"></a>
## クイックスタート

お持ちのものに合わせて設定をスキャフォールドし、パスのガイドに従ってください:

| お持ちのもの | スキャフォールド | 次にこれに従う |
| --- | --- | --- |
| JS/TSアプリ | `ai-i18n-tools init -P openrouter` | [JS/TSアプリにi18nを追加](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-js) |
| Pythonアプリ | `ai-i18n-tools init -t ui-python -P openrouter` | [Pythonアプリにi18nを追加](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-python) |
| DjangoまたはGNU gettextアプリ | `ai-i18n-tools init -t ui-python-django -P openrouter`（または`ui-python-gettext`、`ui-python-flask`） | [Django / Python gettextアプリにi18nを追加する](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-django-gettext) |
| ウェブサイトまたはドキュメントサイト | `ai-i18n-tools init -t ui-vitepress -P openrouter` (フレームワークのテンプレートを入れ替えます) | [ウェブサイトまたはドキュメントサイトにi18nを追加する](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-website) |
| アプリの有無にかかわらずREADME | `ai-i18n-tools init -P openrouter` (JS/TSアプリ + README) または `init -t docs-markdown` | [READMEとMarkdownドキュメントにi18nを追加する](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-readme) |

プロジェクトの準備ができたら、`ai-i18n-tools sync` を実行し、その後 `ai-i18n-tools status` を実行して翻訳された内容を確認します。

JS/TSアプリは、まずテキストを `t()` で囲む必要があります。プレーンテキストで実行すると、`sync` はエラーなしで終了し、何も有用なものを書き込みません。また、サイトのフレームワークは、`sync` の前に独自のi18nルーティングが有効になっている必要があります。

ウェブサイト用テンプレート: `ui-starlight`、`ui-docusaurus`、`ui-vitepress`、`ui-nextra`、`ui-fumadocs`、`ui-astro-website`、および`ui-plain-html`または`docs-plain-html`。READMEとMarkdownのみ: `docs-markdown`。他のテンプレートに`--with-readme`を追加して、READMEブロックを含めます。Python gettextアプリ: `ui-python-django`、`ui-python-flask`、`ui-python-gettext`。ネストされたi18next JSON: `ui-json-bundles`。全リスト: [CLIセットアップリファレンス](https://wsj-br.github.io/ai-i18n-tools/ja/reference/cli-commands/setup)。

`suggest-models` は、公開されているベンチマークからアクティブなプロバイダーのチャットモデルをランク付けし、`suggest-models --apply` は `translationModels` を置き換えます。同じランキングは [モデル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/translation-dashboard/models) タブにあります。ガイド: [AI モデル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ai-models)。コマンドリファレンス: [suggest-models](https://wsj-br.github.io/ai-i18n-tools/ja/reference/cli-commands/models#suggest-models)。

個々の翻訳コマンドを連結するよりも、`sync` を優先します。完全なチュートリアル: [クイックスタート](https://wsj-br.github.io/ai-i18n-tools/ja/guide/quick-start)。1つのプロジェクトに複数の種類のコンテンツがある場合: [パイプラインの結合](https://wsj-br.github.io/ai-i18n-tools/ja/guide/combining-pipelines)。

<a id="documentation"></a>
## ドキュメント

- [ドキュメントサイト](https://wsj-br.github.io/ai-i18n-tools/ja/) — ガイド、インテグレーション、リファレンス
- [インストール](https://wsj-br.github.io/ai-i18n-tools/ja/guide/installation) · [クイックスタート](https://wsj-br.github.io/ai-i18n-tools/ja/guide/quick-start) · [LLM プロバイダー](https://wsj-br.github.io/ai-i18n-tools/ja/guide/providers-and-models) · [AI モデル](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ai-models)
- [UI 文字列](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/) · [プレーン HTML](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/plain-html) · [Python](https://wsj-br.github.io/ai-i18n-tools/ja/guide/ui-strings/python) · [ドキュメント](https://wsj-br.github.io/ai-i18n-tools/ja/guide/documents/) · [HTML ページ](https://wsj-br.github.io/ai-i18n-tools/ja/guide/documents/html-pages) · [JSON](https://wsj-br.github.io/ai-i18n-tools/ja/guide/json) · [SVG](https://wsj-br.github.io/ai-i18n-tools/ja/guide/svg-translation/)
- [Intlayer](https://intlayer.org/) — [辞書をインプレースで翻訳](https://wsj-br.github.io/ai-i18n-tools/ja/guide/translating-intlayer) · [ソース文字列の呼び出しに移行](https://wsj-br.github.io/ai-i18n-tools/ja/guide/migrating-from-intlayer)
- [統合](https://wsj-br.github.io/ai-i18n-tools/ja/guide/integrations/) — VitePress、Nextra、Fumadocs、Docusaurus、Astro、および[Python](https://wsj-br.github.io/ai-i18n-tools/ja/guide/integrations/python)
- [プロジェクトにi18nを追加する](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-your-project) — [JS/TSアプリ](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-js) · [Pythonアプリ](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-python) · [Django / gettextアプリ](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-django-gettext) · [ウェブサイトまたはドキュメントサイト](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-website) · [READMEとMarkdownドキュメント](https://wsj-br.github.io/ai-i18n-tools/ja/guide/add-i18n-to-readme) · [パイプラインの結合](https://wsj-br.github.io/ai-i18n-tools/ja/guide/combining-pipelines)
- [CLIリファレンス](https://wsj-br.github.io/ai-i18n-tools/ja/reference/cli-commands/) · [設定](https://wsj-br.github.io/ai-i18n-tools/ja/reference/configuration) · [ランタイムヘルパー](https://wsj-br.github.io/ai-i18n-tools/ja/guide/runtime-helpers)
- [例](https://wsj-br.github.io/ai-i18n-tools/ja/examples) — 実行可能なデモ (`npx degit …`)
- [AIエージェントコンテキスト](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) — コンシューマープロジェクト向けの簡潔なプロンプト / `AGENTS.md` エントリポイント
- [ポータブルエージェントスキル](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills) — 1回のインストールで、ワークフローごとにスラッシュコマンド: `npx skills add wsj-br/ai-i18n-tools --all -y` (Node.js 22.20+); [インストールガイド](https://wsj-br.github.io/ai-i18n-tools/ja/guide/coding-agent-skill)

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
