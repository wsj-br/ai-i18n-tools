<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm バージョン](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm ダウンロード数](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![ライセンス: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

[OpenRouter](https://openrouter.ai/) を通じて大規模言語モデルを使用し、JavaScript/TypeScript アプリケーションおよびドキュメントサイトを国際化するための CLI およびツールキットです。3つのモジュール型ワークフローは、すべて単一の設定ファイルを共有し、異なる翻訳ニーズに対応します。

- **ワークフロー1 — UI翻訳:** JS/TS から `t("…")` 呼び出しを抽出し（オプションで `.astro` ファイルも対象）、i18next または静的SSG向けのロケールごとのフラットなJSONを生成します。
- **ワークフロー2 — ドキュメント翻訳:** `docs[].contentPaths` にリストされた markdown、MDX、`.astro` ページ（WebサイトおよびStarlight向け）を `translate-docs` を使って翻訳します。
- **ワークフロー3 — JSONファイル翻訳:** `json[]` で定義された任意のネストされたJSONバンドルを翻訳します。ソースコード内で `t()` を使わず、UIの文言がロケールごとのJSONファイルに保存されている場合は `translate-json` を使用します。

**SVG** アセットは `docs[].contentPaths` ではなく、`features.translateSVG`、トップレベルの `svg` ブロック、および `translate-svg` を使って翻訳されます。

**どのワークフローを使えばよいですか？**
- ソースで `t()` を使用している → **ワークフロー1** (`extract` / `translate-ui`)
- ローカライズされたページまたはDocusaurusカタログJSONがある → **ワークフロー2** (`translate-docs`)
- ロケールごとのスタンドアロンなネストされたJSONファイルのみ → **ワークフロー3** (`translate-json`)

すべてのワークフローはファイルまたはSQLiteキャッシュを維持しており、新規または変更されたセグメント（文字列またはテキストチャンク）のみがLLMに送信されます。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [コアワークフロー](#core-workflows)
- [インストール](#installation)
  - [CLIの使用方法](#using-the-cli)
- [OpenRouter](#openrouter)
- [クイックスタート](#quick-start)
  - [ワークフロー1 - UI翻訳](#workflow-1---ui-translation)
  - [ワークフロー2 - ドキュメント翻訳](#workflow-2---document-translation)
  - [Astro（プレーンAstroおよびStarlight）](#astro-plain-astro--starlight)
  - [統合ワークフロー](#combined-workflow)
- [ランタイムヘルパー](#runtime-helpers)
- [CLIコマンド](#cli-commands)
- [ドキュメント](#documentation)
- [ライセンス](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="core-workflows"></a>
## コアワークフロー

**ワークフロー1 - UI翻訳** — i18next（React、Next.js、Node.js、CLI）または静的AstroSSGを使用するすべてのJS/TSプロジェクト向け

ソースファイル内の `t("…")` / `i18n.t("…")` リテラルをスキャンし（Astroのフロントマターおよびテンプレート式には `.astro` を `ui.uiExtractor.extensions` に追加）、マスターカタログ（`strings.json`）を作成し、OpenRouter経由で各ロケールの不足しているエントリを翻訳し、フラットなJSONファイル（`de.json`、`pt-BR.json`、…）を出力します。英語のソーステキストがこれらのバンドルにおけるランタイムのルックアップキーとなります — `strings.json` はランタイムバンドルではなく、抽出キャッシュです。

**ワークフロー2 - ドキュメント翻訳** — `docs[].contentPaths` 配下の markdown、MDX、および `.astro` 向け

主に **markdown、MDX、および `.astro` ドキュメント**（Docusaurus、[Astro Starlight](https://starlight.astro.build/)、プレーンなREADMEファイル、プレーンなAstroマーケティングページ）向けに設計されています。`translate-docs` は共有SQLiteキャッシュを使ってローカライズされたコピーを作成します。Docusaurusサイトでは、シェルJSON（ナビゲーションバー、フッター、テーマ文字列）も同じコマンドで翻訳されるよう、`docs[].docusaurusCatalogDir` を `write-translations` カタログフォルダーに設定してください。`docs[].docsOutput.style` は `"nested"`、`"flat"`、`"doc-system"`、およびエイリアス `"docusaurus"` / `"astro-starlight"` をサポートしています（「はじめに」の [出力レイアウト](docs/GETTING_STARTED.ja.md#output-layouts) を参照）。Docusaurusカタログではない任意のネストされたUI用JSONは、`docs[]` ではなくワークフロー3（`json[]` / `translate-json`）に含めてください。

**ワークフロー3 - JSONファイル翻訳** — ソースに `t()` を使わないネストされたロケールJSON向け

`src/i18n/en/translation.json` などのファイルを、トップレベルの `json[]`、`features.translateJson`、および `translate-json` を使って翻訳します。`init -t ui-json-bundles` でスキャフォールドを作成できます。

すべてのワークフローは `ai-i18n-tools.config.json` を共有でき、組み合わせることも可能です。`sync` は、`features` フラグに従って抽出、UI翻訳、SVG翻訳、`translate-docs`、`translate-json` を順に実行します。

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
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

ai-i18n-toolsのCLIコマンドを直接使用することもできます。たとえば `ai-i18n-tools sync` などです。

手動で `extract`、`translate-ui`、`translate-svg`、`translate-docs`、`translate-json` を連鎖するよりも、`sync` を使用することを推奨します。手動実行では順序や機能フラグの指定を間違えやすくなります。「はじめに」の [推奨 `package.json` スクリプト](docs/GETTING_STARTED.ja.md#recommended-packagejson-scripts) を参照してください。

**インストール不要のワンタイム実行** — `npx ai-i18n-tools <cmd>`または`pnpm dlx ai-i18n-tools <cmd>`を使用（その実行時のみダウンロード）。

> **ヒント：** `npx`なしでインタラクティブシェル内で`ai-i18n-tools`を直接実行するには、`PATH`に`node_modules/.bin`を追加してください（bash/zshの場合は`export PATH="$PWD/node_modules/.bin:$PATH"`）。direnvおよびWindowsの手順については、[はじめに](docs/GETTING_STARTED.ja.md#installation)を参照してください。

OpenRouterのAPIキーを設定してください。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

OpenRouterを呼び出すコマンド（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models`、および関連スクリプト）は、環境に `OPENROUTER_API_KEY` が必要です。`check-markdown` はOpenRouterを使用しません。

`ai-i18n-tools.config.json`では、`openrouter`オブジェクトにモデル一覧、`baseUrl`、`maxTokens`、`temperature`、および`requestTimeoutMs`（OpenRouterへの各HTTPリクエスト（チャット補完および内部`GET /models`呼び出し）の最大待機時間（ミリ秒単位））が含まれます。デフォルトは`30000`（30秒）です。

設定された各モデルIDをOpenRouterのライブカタログに対して検証するには、`ai-i18n-tools check-models`を実行します。存在しない、または`expiration_date`を過ぎたIDを報告し、有効なモデルを100万トークンあたりの推定入出力価格（USD）とともに一覧表示します。設定されたIDのいずれかが無効な場合、終了ステータスはゼロ以外になります。`OPENROUTER_API_KEY`が必要です。

---

<a id="quick-start"></a>
## クイックスタート

<a id="workflow-1---ui-translation"></a>
### ワークフロー1 - UI翻訳

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

次に、アプリ内で`'ai-i18n-tools/runtime'`から提供されるヘルパーを使ってi18nextを接続します。完全なセットアップについては、[ステップ4：ランタイムでi18nextを接続](docs/GETTING_STARTED.ja.md#step-4-wire-i18next-at-runtime)を参照してください。

<a id="workflow-2---document-translation"></a>
### ワークフロー2 - ドキュメント翻訳

デフォルトの `init` テンプレート (`ui-markdown`) は UI 抽出のみを有効にします。ドキュメント指向のテンプレートを使用するか (または `features.translateDocs` を有効にして `docs[]` を追加) `translate-docs` の前に行ってください:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json` を編集: `docs[].contentPaths` を markdown、MDX、および/または `.astro` ソースに設定; `docs[].outputDir` と `docs[].docsOutput.style` (`"docusaurus"`, `"astro-starlight"`, `"flat"`, など)。完全なフィールドリファレンス: [Workflow 2 - Document Translation](docs/GETTING_STARTED.ja.md#workflow-2---document-translation)。

<a id="astro-plain-astro--starlight"></a>
### Astro (プレーン Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`、次に `translate-docs`。Starlight UI オーバーライドは、必要に応じて `src/content/i18n/en.json` を使用し、別の `docs[]` ブロック内で `jsonPathTemplate` を使用できます ([Getting Started → Workflow 2](docs/GETTING_STARTED.ja.md#step-1-initialise-for-documentation)).

**プレーン Astro** (マーケティングまたはアプリサイト、Starlight ではない) — [Astro 組み込みの i18n ルーティング](https://docs.astro.build/en/guides/internationalization/) と ai-i18n-tools を組み合わせます。リファレンスプロジェクト: [`examples/astro-website`](../examples/astro-website/) (英語は `/`、ロケールは `/{locale}/`)。

ほとんどのチームは二つのパイプラインの **ハイブリッド** を使用します:

| パイプライン | 使用対象 | コマンド | 出力 |
|----------|---------|----------|--------|
| **ページ HTML** | テンプレート本体の見出し、段落、ナビゲーションラベル、インライン配列 | `translate-docs` | ロケールごとに `src/pages/{locale}/index.astro` |
| **UI 文字列 (`t()`)** | フロントマター データ、タブラベル、共有配列 | `extract` → `translate-ui` | `public/locales/{locale}.json` (英語ソースをキーとして) |

`init -t ui-astro-website` で UI をスキャフォールドします。`.astro` ページ内のハードコーディングされた HTML の場合、`features.translateDocs` を有効にし、`docs[]` ブロックを `docsOutput.style: "astro-starlight"` で追加します (詳細は [Astro ウェブサイトページ (parse-and-replace)](docs/GETTING_STARTED.ja.md#astro-website-pages-parse-and-replace) を参照)。`targetLocales`, `i18n.locales` を `astro.config.mjs` に、`ui-languages.json` を整合させてください (Astro ルートは `pt-br` のような小文字のコードを使用します; フラットバンドルファイル名は設定のケースに従います、例: `pt-BR.json`)。

クライアントアイランドを追加しない限り、i18next なしでビルド時に `t()` をワイヤリングします — [Astro ウェブサイト UI 文字列 (SSG)](docs/GETTING_STARTED.ja.md#astro-website-ui-strings-ssg) と例の `src/i18n/t.ts` を参照してください。

<a id="combined-workflow"></a>
### 組み合わせワークフロー

```bash
npx ai-i18n-tools sync   # extract → translate-ui → translate-svg → translate-docs → translate-json (per features)
```

---

<a id="runtime-helpers"></a>
## ランタイムヘルパー

`'ai-i18n-tools/runtime'` からエクスポートされる以下のヘルパーは、任意のJavaScript環境で使用できます。i18nextをインポートする必要はありません：

| ヘルパー | 説明 |
|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `defaultI18nInitOptions(sourceLocale)` | キーをデフォルト値として使用する設定向けの標準的な i18next 初期化オプション。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推奨される構成：`wrapT`からのキーのトリムおよび複数形`strings.json`、オプションで`translate-ui` `{sourceLocale}.json`の複数形キーをマージします。 |
| `wrapT(i18n, options)`                                                 | 複数形対応の低レベルな `t()` ラッパー（通常は `setupKeyAsDefaultT` によってインストールされる）。                                                    |
| `buildPluralIndexFromStringsJson(entries)`                               | カタログ行の `"plural": true` から、`wrapT` が使用する複数形グループインデックスを構築します。                                                    |
| `extractInterpolationNamesForWrap(key)`                                  | ソースキーから `{{var}}` 名を解析し、`wrapT` / キーのトリムフォールバックに使用します。                                                              |
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
ai-i18n-tools check-models
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools lint-source …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

各コマンドのフラグ一覧は[はじめに — CLIリファレンス](docs/GETTING_STARTED.ja.md#cli-reference)に記載されています。組み込みの使用方法テキストを表示するには`ai-i18n-tools <command> --help`を実行してください。

すべてのコマンドに対するグローバルオプション: `-c <config>` (デフォルト: `ai-i18n-tools.config.json`)、`-v` (詳細)、オプションの `-w` / `--write-logs [path]` でコンソール出力をログファイルにティーします (デフォルト: 翻訳キャッシュディレクトリの下)、`-V` / `--version`、および `-h` / `--help`。いくつかのコマンドは `-l` / `--locale <codes>` (カンマ区切りの BCP-47) を受け入れ、ターゲットロケールを制限します; `lint-source` は単一のソースロケールを使用します。コマンド概要テーブルについては [Getting Started](docs/GETTING_STARTED.ja.md#cli-reference) を参照してください。

---

<a id="documentation"></a>
## ドキュメンテーション

- [Getting Started](docs/GETTING_STARTED.ja.md) - すべてのワークフロー (UI、docs/`.astro`、JSON バンドル、Astro Starlight およびプレーン Astro) の完全なセットアップ、CLI リファレンス、および設定フィールドリファレンス。
- [Locale assets guide](docs/LOCALE-ASSETS-GUIDE.ja.md) - 翻訳されたドキュメント内のスクリーンショットとイラスト付き SVG (パターン A–E、フラットリンクリライター、スクリーンショットスクリプト)。
- [Package Overview](docs/PACKAGE_OVERVIEW.ja.md) - アーキテクチャ、内部、プログラム API、および拡張ポイント。
- [AI Agent Context](../docs/ai-i18n-tools-context.md) - **パッケージを使用するアプリ向け:** 下流プロジェクトのための統合プロンプト (あなたのリポジトリのエージェントルールにコピー)。
- **この**リポジトリのメンテナ向け内部情報：`dev/package-context.md`（クローン専用、npmには公開されていません）。

---

<a id="license"></a>
## ライセンス

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
