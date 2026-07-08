<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![npm downloads](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) [![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

<small id="lang-list">[English (UK)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Hindi (Roman)](./README.hi-Latn.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)</small>

**お好みの AI モデルを使用してアプリとドキュメントを翻訳: ロックインも書き換えも不要です。**

`ai-i18n-tools`は、大規模言語モデルを使用して、JavaScript/TypeScriptアプリケーションとドキュメントサイト（Docusaurus、Astro、Starlight、VitePress、プレーンなMarkdown/MDXを含む）を国際化するためのCLIおよびツールキットです。

任意のプロバイダーを指定して翻訳を開始できます。**OpenAI**、**Anthropic**、**Google Gemini**、**NVIDIA**、**DeepSeek**、**Groq**、**Mistral**、**xAI**、**Cerebras**、**Alibaba**、**APIFUN**、任意の[OpenRouter](https://openrouter.ai/)モデル（単一のAPIキーで数百から選択可能）、または完全に自己ホスト型でオフライン翻訳が可能な**Ollama**。コードベースを変更することなく、プロジェクトごと、あるいは言語ごとにプロバイダーやモデルを切り替えることができます。

1つの設定ファイルで3つの翻訳モードを制御できるため、コンテンツの構造に応じて自由に組み合わせることができます。

- **UI文字列** — JS/TS（およびオプションで`.astro`ファイル）から`t("…")`呼び出しを抽出し、i18nextまたは静的SSGルックアップ用のフラットなロケールごとのJSONを生成します。
- **ドキュメント** — `docs[].contentPaths`にリストされているMarkdown、MDX、および`.astro`ページを`translate-docs`を使用して翻訳します。**VitePress**、**Starlight**、**Docusaurus**、Astroベースのサイト、またはMarkdown/MDX/`.astro`ソースファイルから読み取る任意の静的サイトジェネレーターで動作します。
- **JSON** — `json[]`で定義された任意のネストされたJSONバンドルを翻訳します。UIコピーがソースの`t()`呼び出しではなく、ロケールごとのJSONファイルにある場合は`translate-json`を使用します。

**SVG**アセットには独自のパスがあります。トップレベルの`svg`ブロックである`features.translateSVG`と`translate-svg`であり、`docs[].contentPaths`ではありません。

**どれを使用すべきですか？**

| コンテンツ                                                                    | コマンド                                     |
|-------------------------------------------------------------------------------|---------------------------------------------|
| ソースコードは`t()`を使用                                                        | **UI文字列** — `extract` / `translate-ui` |
| ローカライズされたページまたはドキュメントサイト（VitePress、Starlight、Docusaurus、Astroなど） | **ドキュメント** — `translate-docs`            |
| スタンドアロンのネストされたJSONロケールファイル                                          | **JSON** — `translate-json`                 |

これら3つはすべてファイル/SQLiteキャッシュを共有しているため、新しいセグメントまたは変更されたセグメント（文字列またはテキストチャンク）のみがモデルに再送信されます。どのプロバイダーを使用しているかに関係なく、再実行は高速で安価です。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [翻訳タイプ](#translation-types)
- [インストール](#installation)
  - [CLIの使用](#using-the-cli)
- [LLMプロバイダー](#llm-providers)
- [クイックスタート](#quick-start)
  - [UI文字列](#ui-strings)
  - [ドキュメント](#documents)
  - [Astro (プレーンなAstro & Starlight)](#astro-plain-astro--starlight)
  - [結合同期](#combined-sync)
- [ランタイムヘルパー](#runtime-helpers)
- [CLIコマンド](#cli-commands)
- [ドキュメント](#documentation)
- [ライセンス](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="translation-types"></a>
## 翻訳タイプ

各翻訳タイプには、完全な設定の詳細が記載された独自のガイドがあります。[UI文字列](../docs/guide/ui-strings/)、[ドキュメント](../docs/guide/documents/)、[JSON](../docs/guide/json.md)を参照してください。[ai-i18n-toolsとは？](../docs/guide/what-is-ai-i18n-tools.md)で比較を確認してください。

事前に知っておくべきことがいくつかあります。UI文字列は、アクティブなLLMプロバイダー（[LLMプロバイダー](#llm-providers)を参照）を介してロケールごとに不足しているエントリを翻訳し、フラットなJSONファイル（`de.json`、`pt-BR.json`など）を書き込みます。実行時のルックアップキーは英語のソーステキストです。`strings.json`は抽出キャッシュであり、実行時バンドルではありません。ドキュメントは`docs[].docsOutput.style`の値`"nested"`、`"flat"`、`"doc-system"`、およびエイリアス`"docusaurus"` / `"astro-starlight"` / `"vitepress"`をサポートしています（[出力レイアウト](../docs/guide/documents/output-layouts.md)を参照）。これら3つはすべて`ai-i18n-tools.config.json`を共有し、組み合わせることができます。`sync`は、`features`フラグに従って、抽出、UI翻訳、SVG翻訳、`translate-docs`、および`translate-json`を順番に実行します。

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

プロジェクトにパッケージをインストールした後、npm/pnpm/yarn を使用して、公開された bin エントリ (`bin/ai-i18n-tools.mjs`) を `node_modules/.bin/ai-i18n-tools` にリンクします。そのシムは、インストールされたパッケージからコンパイル済みの CLI をロードします。

**`package.json` スクリプト (推奨)** — npm と pnpm は、スクリプトの実行時に `node_modules/.bin` を `PATH` の前に付加するため、ベアコマンド名を呼び出すことができます。

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

次に、例えば `pnpm run i18n:sync` を実行します。`npx` のプレフィックスは不要です。

**インタラクティブシェル** — プロジェクトのルートから (ローカルインストール後):

```bash
npx ai-i18n-tools sync        # npm
pnpm exec ai-i18n-tools sync  # pnpm
```

bash/zshで素の`ai-i18n-tools`コマンドを入力するには、ローカルのbinディレクトリを`PATH`の前に付けます（PowerShell、direnv、Windowsの注意事項については[CLIの使用](../docs/guide/installation.md#using-the-cli)を参照）。

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

`extract`、`translate-ui`、`translate-svg`、`translate-docs`、および`translate-json`を手動で連結するよりも`sync`を使用することをお勧めします。手動で実行すると、順序と機能フラグを間違えやすいためです。クイックスタートガイドの[推奨される`package.json`スクリプト](../docs/guide/quick-start.md#recommended-packagejson-scripts)を参照してください。

**ゼロインストールワンオフ** — `npx ai-i18n-tools <cmd>` または `pnpm dlx ai-i18n-tools <cmd>` (その呼び出しのみのパッケージをダウンロードします。`package.json` にエントリはありません)。

プロバイダーのAPIキーを設定します（OpenRouterの例を示します。使用するプロバイダーに応じた対応する変数を使用してください）：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="llm-providers"></a>
## LLMプロバイダー

翻訳コマンド（`translate-ui`、`translate-docs`、`translate-json`、`sync`、`check-models`、および関連スクリプト）はLLMプロバイダーを呼び出しますが、`check-markdown`、`mark-html`、および`extract`は呼び出しません。

トップレベルの`providers`マップ内にプロバイダーを設定し、トップレベルの`provider`セレクターでアクティブなプロバイダーを選択します（プロバイダーが1つだけ設定されている場合は省略可能）。ほとんどのプロバイダーでは`translationModels`リストのみが必要です。`baseUrl`およびAPIキーの環境変数は組み込みプリセットから取得されます。プロバイダーごとに`baseUrl`、`apiKeyEnv`、`headers`、`maxTokens`、`temperature`、`requestTimeoutMs`をオーバーライドできます。`requestTimeoutMs`は各リクエストの最大待機時間（ミリ秒単位）です（デフォルトは`30000`）。

各プロバイダーブロックのオプションのモデル階層:

- `translationModels` — グローバルな順序付きフォールバックチェーン（翻訳機能に必須）。
- `uiModels` — UIのみのチェーン（`translate-ui`、複数形生成、`proofread-ui`）：一致する`localeModels`エントリの後、`translationModels`の前に試行されます。
- `localeModels` — **すべての**パイプラインのロケールごとのオーバーライド：各エントリはBCP-47ロケールを、そのロケールのみで最初に試行される順序付きモデルリストにマッピングします（`pt-br`は`pt-BR`と一致します）。

解決順序: **UI** → `localeModels(locale)` → `uiModels` → `translationModels`; **ドキュメント / JSON / SVG** → `localeModels(locale)` → `translationModels`。重複するモデルIDは、順序を維持しながらスキップされます。

設定を編集せずに単一の実行でプロバイダーを切り替えるには、グローバルオプション `-P` / `--provider <name>` を渡します（例：`ai-i18n-tools -P groq translate-ui`）。名前は設定済みの `providers` キーのいずれかである必要があります。

```jsonc
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": ["qwen/qwen3-235b-a22b-2507", "openai/gpt-4o-mini"],
      "uiModels": ["anthropic/claude-sonnet-latest"],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
      ]
    },
    "groq": { "translationModels": ["llama-3.3-70b-versatile"] },
    "ollama": { "baseUrl": "http://localhost:11434/v1", "translationModels": ["llama3.2"] }
  }
}
```

組み込みプロバイダープリセット（キー — ベースURL — APIキー環境変数）：

| プロバイダー | ベース URL                                                  | API キー環境変数     |
|--------------|-----------------------------------------------------------|----------------------|
| `openrouter` | `https://openrouter.ai/api/v1`                            | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | （なし） |

カスタムのOpenAI互換プロバイダーを定義するには、`baseUrl`（キーが不要な場合を除く`apiKeyEnv`）を持つ新しいキーを追加します。モデルIDはプレーンなアップストリームIDです。プロバイダーは設定レベルで選択されるため、`provider/`プレフィックスは不要です（OpenRouter IDはネイティブの`vendor/model`形式を維持します）。

トークンの使用状況はプロバイダーごとに報告されます。正確なUSDコストは、プロバイダーがそれを返す場合（OpenRouter）にのみ表示されます。`ai-i18n-tools check-models`は、設定されたすべてのモデルID（`translationModels`、`uiModels`、およびすべての`localeModels`エントリ）を、アクティブなプロバイダーのライブ`GET /models`リスト（任意のプロバイダー）に対して検証し、プロバイダーが価格を返す場合（例：OpenRouter）に価格を表示します。`ai-i18n-tools list-models`は、アクティブなプロバイダーが宣伝するすべてのモデルをリストします（別の設定済みプロバイダーを検査するには`-P` / `--provider`を使用します）。`ai-i18n-tools bench-models`は、一意に設定されたすべてのモデルID（`translationModels`、`uiModels`、および`localeModels`）を、サンプルを個別に翻訳することによってベンチマークします（モデルは並行して実行され、`concurrency`によって制限されます）。そして、モデルごとの入出力トークン、実時間、およびUSDコストを出力します。

レガシーなトップレベルの`openrouter`設定ブロックも引き続き受け入れられ、ロード時に`providers.openrouter`（`provider: "openrouter"`付き）に自動的に移行されます。

単一ドキュメントで`-P`を使用してプロバイダーを切り替える実践的なデモについては、[`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)を参照してください。

---

<a id="quick-start"></a>
## クイックスタート

<a id="ui-strings"></a>
### UI文字列

```bash
# 1. Create config (default ui-markdown; plain Astro: init -t ui-astro-website)
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

次に、`'ai-i18n-tools/runtime'`のヘルパーを使用してアプリにi18nextを組み込みます。完全な設定については、UI文字列ガイドの[ステップ4：実行時にi18nextを組み込む](../docs/guide/ui-strings/i18next-runtime.md)を参照してください。

<a id="documents"></a>
### ドキュメント

デフォルトの `init` テンプレート (`ui-markdown`) は UI 抽出のみを有効にします。ドキュメント指向のテンプレートを使用するか (または `features.translateDocs` を有効にして `docs[]` を追加) `translate-docs` の前に行ってください:

```bash
# Docusaurus docs + optional write-translations catalog
npx ai-i18n-tools init -t ui-docusaurus

# Astro Starlight documentation
# npx ai-i18n-tools init -t ui-starlight

# VitePress documentation (pages + theme JSON)
# npx ai-i18n-tools init -t ui-vitepress

# Plain Astro website — UI extraction for t() in .astro; add docs[] for page HTML (see Astro below)
# npx ai-i18n-tools init -t ui-astro-website

npx ai-i18n-tools translate-docs
npx ai-i18n-tools status
# npx ai-i18n-tools translate-docs --locale de   # single locale
```

`ai-i18n-tools.config.json`を編集: `docs[].contentPaths`をmarkdown、MDX、および/または`.astro`ソースに設定します。`docs[].outputDir`と`docs[].docsOutput.style` (`"docusaurus"`、`"astro-starlight"`、`"vitepress"`、`"flat"`など)。完全なフィールドリファレンス: [ドキュメント](../docs/guide/documents/)。

<a id="vitepress"></a>
### VitePress

`init -t ui-vitepress`は、`docsOutput.style: "vitepress"`とテーマ/ナビゲーション/サイドバー文字列用の`json[]`ブロックを足場として提供します。ページマークダウンと`sync`をまとめて翻訳するには、`theme.{locale}.json`を実行します。[VitePressの統合](../docs/guide/vitepress-integration.md)と[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)を参照してください。

<a id="astro-plain-astro--starlight"></a>
### Astro (プレーン Astro & Starlight)

**Astro Starlight** — `init -t ui-starlight`、次に`translate-docs`。Starlight UIのオーバーライドは、必要に応じて別の`docs[]`ブロックで`src/content/i18n/en.json`を`jsonPathTemplate`とともに使用できます ([ドキュメント — ドキュメント用に初期化](../docs/guide/documents/index.md#step-1-initialise-for-documentation))。

**プレーン Astro** (Starlight ではないマーケティングまたはアプリサイト) — [Astro 組み込みの i18n ルーティング](https://docs.astro.build/en/guides/internationalization/) と ai-i18n-tools を組み合わせます。参照プロジェクト: [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (`/` に英語、`/{locale}/` にロケール)。

ほとんどのチームは二つのパイプラインの **ハイブリッド** を使用します:

| パイプライン               | 用途                                                                 | コマンド                   | 出力                                                   |
|------------------------|----------------------------------------------------------------------|----------------------------|--------------------------------------------------------|
| **ページ HTML**          | テンプレート本文の見出し、段落、ナビゲーションラベル、インライン配列 | `translate-docs`           | ロケールごとに `src/pages/{locale}/index.astro`            |
| **UI 文字列 (`t()`)** | フロントマター データ、タブラベル、共有配列 | `extract` → `translate-ui` | `public/locales/{locale}.json` (英語ソースをキーとして) |

`init -t ui-astro-website`でUIをスキャフォールドします。`.astro`ページでハードコードされたHTMLの場合、`features.translateDocs`を有効にし、`docsOutput.style: "astro-starlight"`を含む`docs[]`ブロックを追加します ([Astroウェブサイトページ (解析と置換)](../docs/guide/ui-strings/astro-website.md#astro-website-pages-parse-and-replace)を参照)。`targetLocales`、`i18n.locales`を`astro.config.mjs`、および`ui-languages.json`と整合させます (Astroルートは`pt-br`などの小文字のコードを使用します。フラットバンドルファイル名は、`pt-BR.json`などの構成の大文字/小文字に従います)。

クライアントアイランドを追加しない限り、ビルド時にi18nextなしで`t()`をワイヤリングします — [AstroウェブサイトUI文字列 (SSG)](../docs/guide/ui-strings/astro-website.md#astro-website-ui-strings-ssg)と例の`src/i18n/t.ts`を参照してください。

<a id="combined-sync"></a>
### 結合同期

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
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

プレーンなHTMLアプリの場合、要素に裸の`data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカーをアノテーションします (ソーステキストは要素自身のtextContent / title / placeholderから一度書き込まれます)。`mark-html`がそれらを挿入し、`extract`がそれらを`strings.json`にキャプチャします。[翻訳用のHTMLのマーク付け](../docs/guide/ui-strings/plain-html.md#marking-html-for-translation)を参照してください。

コマンドごとの完全なフラグリストは[CLIリファレンス](../docs/reference/cli-commands.md)にあります。組み込みの使用法テキストについては`ai-i18n-tools <command> --help`を実行してください。

グローバルオプション: `-c <config>` (デフォルト: `ai-i18n-tools.config.json`)、`-v` (詳細)、`-P` / `--provider <name>` (アクティブなLLMプロバイダーをオーバーライド; `providers`の下で設定する必要があります)、`-L` / `--ui-lang <code>` (ツールのUI/ログの言語)、`-V` / `--version`、および`-h` / `--help` — すべてのコマンドで受け入れられます。`-w` / `--write-logs [path]`はコンソール出力をログファイルに転送します (デフォルト: 翻訳キャッシュディレクトリの下) が、翻訳および同期コマンド (`translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync-ui`、`sync`、`cleanup`) でのみ有効になります。いくつかのコマンドは、ターゲットロケールを制限するために`-l` / `--locale <codes>` (カンマ区切りのBCP-47) を受け入れます。`proofread-ui`は単一のソースロケールを使用します。コマンドの概要表については、[CLIリファレンス](../docs/reference/cli-commands.md)を参照してください。

<a id="tool-ui-language-logs-help-dashboard"></a>
### ツールUI言語（ログ、ヘルプ、ダッシュボード）

このツールは、独自のCLIヘルプ、トラフィックの多いログ/サマリーメッセージ、および翻訳ダッシュボードをローカライズします。UIロケールは、以下のソースから解決されます（優先度が高い順）:

1. `-L` / `--ui-lang <code>` グローバルフラグ（例: `-L pt-BR`）。
2. `AI_I18N_LANG` 環境変数（例: `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` の `uiLanguage` 設定キー（BCP-47文字列）。
4. ホストOSのロケール（`Intl.DateTimeFormat().resolvedOptions().locale` 経由）。

要求されたロケールは、出荷されたUI言語と完全に一致するか、最も近いバリエーション (たとえば、`pt-PT`は`pt-BR`に解決され、`en-US`は`en-GB`に解決されます) と照合されます。一致するものがない場合は、ソースロケール (`en-GB`) にフォールバックします。UI言語が明示的に要求された場合 (フラグ、環境変数、または`uiLanguage`経由) でも、出荷されたバンドルが一致しない場合、CLIはデフォルトロケールが使用されるという一度限りの警告を出力します。ホストOSからのみ推測されたロケールは警告されません。これはプロジェクトの`sourceLocale` / `targetLocales`とは独立しています。出荷されたUI言語: `en-GB` (ソース) と`de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans`、および`zh-Hant`。設定は不要です — デフォルトでは、ツールはOSのロケールに従います。詳細については、[ツールUI言語](../docs/reference/environment-variables.md#tool-ui-language)を参照してください。

---

<a id="documentation"></a>
## ドキュメンテーション

- [ドキュメントサイト](https://wsj-br.github.io/ai-i18n-tools/) — 完全なVitePressガイド (GitHub Pagesで9ロケール)。
- [クイックスタート](../docs/guide/quick-start.md) — UI文字列、ドキュメント、およびJSON (UI、docs/`.astro`、JSONバンドル、Astro Starlight、プレーンAstro) のセットアップ。
- [ロケールアセットガイド](../docs/guide/images-and-screenshots/) - 翻訳されたドキュメントのスクリーンショットと図解されたSVG (フラットリンク書き換え、スクリーンショットスクリプト)。
- [アーキテクチャ](../docs/reference/architecture.md) - アーキテクチャ、内部、プログラムAPI、および拡張ポイント。
- [AIエージェントコンテキスト](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) - **パッケージを使用するアプリ向け:** ダウンストリームプロジェクトの統合プロンプト (リポジトリのエージェントルールにコピー)。
- **この**リポジトリのメンテナー内部: `dev/package-context.md` (クローンのみ; npmにはありません)。

---

<a id="license"></a>
## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。
詳細については、[LICENSE](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE) ファイルを参照してください。

Copyright &copy; 2026 Waldemar Scudeller Jr.
