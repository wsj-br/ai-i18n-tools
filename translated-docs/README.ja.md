<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm バージョン](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm ダウンロード数](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![ライセンス: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

大規模言語モデルを[OpenRouter](https://openrouter.ai/)経由で利用して、JavaScript/TypeScriptアプリケーションおよびドキュメントサイトを国際化するためのCLIおよびツールキット。2つの独立したワークフロー：**UI翻訳**は`t("…")`呼び出しを抽出し、i18next用のロケール対応JSONを作成。**ドキュメント翻訳**は、スマートなSQLiteキャッシュを使用してMarkdown、MDX、SVGファイルを翻訳し、変更されたセグメントのみをLLMに再送信します。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<small>翻訳されたREADMEおよびドキュメントは、GitHub上の[`translated-docs/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)にコミットされています。npmパッケージには英語の`docs/`のみが含まれます。</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [2つの主要なワークフロー](#two-core-workflows)
- [インストール](#installation)
  - [CLIの使用](#using-the-cli)
- [OpenRouter](#openrouter)
- [クイックスタート](#quick-start)
  - [ワークフロー1 - UI翻訳](#workflow-1---ui-translation)
  - [ワークフロー2 - ドキュメント翻訳](#workflow-2---document-translation)
  - [両方のワークフロー](#both-workflows)
- [ランタイムヘルパー](#runtime-helpers)
- [CLIコマンド](#cli-commands)
- [ドキュメンテーション](#documentation)
- [ライセンス](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 2つの主要なワークフロー

**ワークフロー1 - UI翻訳** — i18nextを使用するあらゆるJS/TSプロジェクト向け（React、Next.js、Node.js、CLI）

ソースファイル内の`t("…")` / `i18n.t("…")`リテラルをスキャンし、マスターカタログ（`strings.json`）を作成。OpenRouter経由で各ロケールの不足しているエントリを翻訳し、i18nextで使用可能なフラットなJSONファイル（`de.json`、`pt-BR.json`など）を出力します。

**ワークフロー2 - ドキュメント翻訳** — markdown/MDX形式のドキュメント向け（Docusaurus、Astro Starlight、通常のREADMEファイルなど）

共有SQLiteキャッシュを使用して、`.md`および`.mdx`ソースファイルをすべてのターゲットロケールに翻訳します。新規または変更されたセグメントのみがLLMに送信されます。オプションでDocusaurus用シェルJSON（`jsonSource`、`write-translations`から生成）により、ナビゲーションバー、フッター、テーマUI文字列をカバーできます。SVGファイルの翻訳は`features.translateSVG`および最上位の`svg`ブロックで有効化されます。

両方のワークフローは単一の`ai-i18n-tools.config.json`ファイルを共有でき、独立してまたは同時に使用できます。

---

<a id="installation"></a>
## インストール

公開されているパッケージは**ESM専用**（`"type": "module"`）です。Node.js `>=22.16.0`が必要です。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### CLI の使用方法

**プロジェクトごとのインストール（推奨）** — 開発依存としてインストールし、次に`npx`、`pnpm exec`、または`package.json`スクリプトから実行します。

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

**インストール不要のワンタイム実行** — `npx ai-i18n-tools <cmd>`または`pnpm dlx ai-i18n-tools <cmd>`を使用（その実行時のみダウンロード）。

> **ヒント：** `npx`なしでインタラクティブシェル内で`ai-i18n-tools`を直接実行するには、`PATH`に`node_modules/.bin`を追加してください（bash/zshの場合は`export PATH="$PWD/node_modules/.bin:$PATH"`）。direnvおよびWindowsの手順については、[はじめに](docs/GETTING_STARTED.ja.md#installation)を参照してください。

OpenRouterのAPIキーを設定してください。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

OpenRouter を呼び出すコマンド（`translate-ui`、`translate-docs`、`sync`、`check-models`、および関連スクリプト）は、環境に `OPENROUTER_API_KEY` が必要です。`check-markdown` は OpenRouter を使用しません。

`ai-i18n-tools.config.json`では、`openrouter`オブジェクトにモデル一覧、`baseUrl`、`maxTokens`、`temperature`、および`requestTimeoutMs`（OpenRouterへの各HTTPリクエスト（チャット補完および内部`GET /models`呼び出し）の最大待機時間（ミリ秒単位））が含まれます。デフォルトは`30000`（30秒）です。

設定された各モデルIDをOpenRouterのライブカタログに対して検証するには、`ai-i18n-tools check-models`を実行します。存在しない、または`expiration_date`を過ぎたIDを報告し、有効なモデルを100万トークンあたりの推定入出力価格（USD）とともに一覧表示します。設定されたIDのいずれかが無効な場合、終了ステータスはゼロ以外になります。`OPENROUTER_API_KEY`が必要です。

---

<a id="quick-start"></a>
## クイックスタート

<a id="workflow-1---ui-translation"></a>
### ワークフロー1 - UI翻訳

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

次に、アプリ内で`'ai-i18n-tools/runtime'`から提供されるヘルパーを使ってi18nextを接続します。完全なセットアップについては、[ステップ4：ランタイムでi18nextを接続](docs/GETTING_STARTED.ja.md#step-4-wire-i18next-at-runtime)を参照してください。

<a id="workflow-2---document-translation"></a>
### ワークフロー2 - ドキュメント翻訳

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### 両方のワークフロー

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## ランタイムヘルパー

`'ai-i18n-tools/runtime'` からエクスポートされる以下のヘルパーは、任意のJavaScript環境で使用できます。i18nextをインポートする必要はありません：

| ヘルパー | 説明 |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)` | キーをデフォルト値として使用する設定向けの標準的な i18next 初期化オプション。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推奨される構成：`wrapT`からのキーのトリムおよび複数形`strings.json`、オプションで`translate-ui` `{sourceLocale}.json`の複数形キーをマージします。 |
| `wrapI18nWithKeyTrim(i18n)` | 下位レベルのキー・トリムラッパーのみ（アプリ構成では非推奨。代わりに`setupKeyAsDefaultT`を使用してください）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | `localeLoaders`の`makeLoadLocale`マップを`ui-languages.json`から構築します（`code`を除くすべての`sourceLocale`）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 非同期ロケールファイル読み込み用のファクトリ。 |
| `getTextDirection(lng)` | BCP-47コードに対応する`'ltr'`または`'rtl'`を返す。 |
| `applyDirection(lng, element?)` | `document.documentElement`に`dir`属性を設定。 |
| `getUILanguageLabel(lang, t)` | 言語メニュー行の表示ラベル（i18n付き）。 |
| `getUILanguageLabelNative(lang)` | `t()`呼び出しなしの表示ラベル（ヘッダー形式）。 |
| `interpolateTemplate(str, vars)` | 単純な文字列に対する低レベルの`{{var}}`置換（内部使用。アプリコードは代わりに`t()`を使用すべき）。 |
| `flipUiArrowsForRtl(text, isRtl)` | RTLレイアウト向けに`→`を`←`に反転。 |

---

<a id="cli-commands"></a>
## CLIコマンド

```bash
ai-i18n-tools version
ai-i18n-tools help [command]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]
ai-i18n-tools check-models
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools write-heading-ids …
ai-i18n-tools strip-md-bold-inline …
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools lint-source …
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status [--max-columns <n>]
ai-i18n-tools statistics [--max-columns <n>]
ai-i18n-tools dashboard
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]
ai-i18n-tools glossary-generate
```

各コマンドのフラグ一覧は[はじめに — CLIリファレンス](docs/GETTING_STARTED.ja.md#cli-reference)に記載されています。組み込みの使用方法テキストを表示するには`ai-i18n-tools <command> --help`を実行してください。

すべてのコマンドに共通するグローバルオプション：`-c <config>`（デフォルト：`ai-i18n-tools.config.json`）、`-v`（詳細出力）、コンソール出力をログファイルに同時出力するためのオプション `-w` / `--write-logs [path]`（デフォルト：翻訳キャッシュディレクトリ内）、`-V` / `--version`、および `-h` / `--help`。コマンド概要表については、[はじめに](docs/GETTING_STARTED.ja.md#cli-reference) を参照してください。

---

<a id="documentation"></a>
## ドキュメンテーション

- [はじめに](docs/GETTING_STARTED.ja.md) - 両方のワークフローの完全なセットアップガイド、CLIリファレンス、設定項目リファレンス。
- [ロケールアセットガイド](docs/LOCALE-ASSETS-GUIDE.ja.md) - 翻訳されたドキュメント内のスクリーンショットおよび図解付きSVG（パターンA–E、フラットリンクリライター、スクリーンショット生成スクリプト）。
- [パッケージ概要](docs/PACKAGE_OVERVIEW.ja.md) - アーキテクチャ、内部構造、プログラムによるAPI、および拡張ポイント。
- [AIエージェントコンテキスト](../docs/ai-i18n-tools-context.md) - **このパッケージを使用するアプリ向け：** 下流プロジェクトの統合プロンプト（リポジトリのエージェントルールにコピーしてください）。
- **この**リポジトリのメンテナ向け内部情報：`dev/package-context.md`（クローン専用、npmには公開されていません）。

---

<a id="license"></a>
## ライセンス

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
