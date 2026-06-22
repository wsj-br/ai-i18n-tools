<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: クイックスタート

`ai-i18n-tools` パッケージは、3つの異なるモジュール式ワークフローを提供しています。

- **ワークフロー 1 - UI の翻訳**: 任意の JS/TS ソースから `t("…")` 呼び出しを抽出し、OpenRouter 経由で翻訳して、i18next 向けにロケールごとのフラットな JSON ファイルを出力。
- **ワークフロー 2 - ドキュメントの翻訳**: `docs[].contentPaths` にリストされた **markdown、MDX、および `.astro` ページ**を `translate-docs` で翻訳。スマートキャッシュ対応。`features.translateDocs` が有効な場合、同じコマンドでオプションの **Docusaurus カタログ JSON**（`docs[].docusaurusCatalogDir`、`docusaurus write-translations` 由来）も翻訳可能 — これは `docs/` の本文ではなく、サイト全体の UI（ナビゲーションバー、フッター、テーマ文字列など）を対象。
- **ワークフロー 3 - JSON ファイルの翻訳**: ソース内に `t()` を使わず、ロケールごとの JSON ファイルに UI 文言を保持するサイト向けに、任意の入れ子構造の JSON バンドル（例: `src/i18n/en/translation.json`）を最上位の `json[]`、`features.translateJson`、`translate-json` で翻訳。

**SVG**アセットは、トップレベルの`svg`ブロックと`translate-svg`を使用し、`features.translateSVG`で処理されます（[CLIリファレンス](#cli-reference)を参照）。

**どのワークフローですか？**

- ソース内のユーザー向け文字列を `t()` 経由 → ワークフロー1 (`extract` / `translate-ui`)。
- ローカライズされたページまたはDocusaurusシェルJSON → ワークフロー2 (`translate-docs`)。
- 単体の入れ子構造JSONロケールファイルのみ → ワークフロー3 (`translate-json`)。

3つのワークフローすべてでOpenRouter（互換性のある任意のLLM）を使用し、単一の設定ファイルを共有します。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (UK)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [Hindi (Roman)](./GETTING_STARTED.hi-Latn.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [简体中文](./GETTING_STARTED.zh-Hans.md) · [繁體中文](./GETTING_STARTED.zh-Hant.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [インストール](#installation)
  - [CLIの使用](#using-the-cli)
- [クイックスタート](#quick-start)
  - [推奨 `package.json` スクリプト](#recommended-packagejson-scripts)
- [ワークフロー1 - UI翻訳](#workflow-1---ui-translation)
  - [ステップ1：初期化](#step-1-initialise)
  - [ステップ2：文字列の抽出](#step-2-extract-strings)
  - [Astroウェブサイト（純粋なAstro、Starlight以外）](#astro-website-plain-astro-not-starlight)
  - [AstroウェブサイトUI文字列（SSG）](#astro-website-ui-strings-ssg)
  - [Astroウェブサイトページ（パース＆置換）](#astro-website-pages-parse-and-replace)
  - [ステップ3：UI文字列の翻訳](#step-3-translate-ui-strings)
  - [XLIFF 2.0へのエクスポート（任意）](#exporting-to-xliff-20-optional)
  - [ステップ4：実行時にi18nextを接続](#step-4-wire-i18next-at-runtime)
    - [`SOURCE_LOCALE` の整合性の維持](#keeping-source_locale-aligned)
    - [ロケールローダー](#locale-loaders)
    - [実行時ヘルパーのリファレンス](#runtime-helpers-reference)
  - [ソースコードでの `t()` の使用](#using-t-in-source-code)
  - [補間](#interpolation)
  - [基数複数形（`plurals: true`）](#cardinal-plurals-plurals-true)
    - [複数形の保存と出力方法](#how-plurals-are-stored-and-emitted)
  - [言語切り替えUI](#language-switcher-ui)
  - [RTL言語](#rtl-languages)
- [ワークフロー2 - ドキュメントの翻訳](#workflow-2---document-translation)
  - [ステップ1: ドキュメント用に初期化](#step-1-initialise-for-documentation)
  - [ステップ2：ドキュメントの翻訳](#step-2-translate-documents)
    - [複雑なMarkdownと品質チェックの失敗](#complex-markdown-and-failed-quality-checks)
    - [キャッシュの動作と `translate-docs` フラグ](#cache-behaviour-and-translate-docs-flags)
    - [バッチプロンプト形式](#batch-prompt-format)
    - [SQLiteでのセグメント重複排除とパス](#segment-dedupe-and-paths-in-sqlite)
  - [出力レイアウト](#output-layouts)
    - [`docsOutput.style = "flat"` 時のアンカーリンク](#anchor-links-when-docsoutputstyle--flat)
    - [翻訳済みドキュメント内の画像およびラスターアセット](#images-and-raster-assets-in-translated-docs)
    - [言語切り替え（`languageListBlock`）](#language-switcher-languagelistblock)
    - [`pathTemplate` / `jsonPathTemplate` プレースホルダー](#pathtemplate--jsonpathtemplate-placeholders)
  - [トラブルシューティング](#troubleshooting)
- [ワークフロー3 - JSONファイルの翻訳](#workflow-3---json-file-translation)
  - [ステップ1：入れ子構造JSON用に初期化](#step-1-initialise-for-nested-json)
  - [ステップ2：`json[]` の設定](#step-2-configure-json)
  - [ステップ3：JSONバンドルの翻訳](#step-3-translate-json-bundles)
  - [ワークフロー3と他のパイプラインの比較](#workflow-3-vs-other-pipelines)
- [統合ワークフロー（UI＋ドキュメント）](#combined-workflow-ui--docs)
  - [混合ドキュメントワークフロー（`docsOutput.style = "docusaurus"` + `"flat"`）](#mixed-documentation-workflow-docsoutputstyle--docusaurus--flat)
- [翻訳ダッシュボード](#translation-dashboard)
  - [失敗（ドキュメント翻訳）](#failures-document-translation)
    - [使用するタイミング](#when-to-use-it)
    - [ソース編集の重要性](#why-source-edits-matter)
    - [タブの使い方](#how-to-use-the-tab)
  - [Markdownの問題（静的チェック）](#markdown-issues-static-checks)
- [設定リファレンス](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath`（任意）](#uilanguagespath-optional)
  - [`concurrency`（任意）](#concurrency-optional)
  - [`batchConcurrency`（任意）](#batchconcurrency-optional)
  - [`fileConcurrency`（任意）](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (オプション)](#batchsize--maxbatchchars-optional)
  - [`provider` および `providers`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [git除外のベストプラクティス:](#best-practice-for-git-exclusions)
  - [`docs`](#docs)
  - [`json`](#json)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLIリファレンス](#cli-reference)
  - [ルートおよびグローバルオプション](#root-and-global-options)
  - [コマンドごとのヘルプ](#per-command-help)
  - [ターゲットロケール（`-l` / `--locale`）](#target-locales--l----locale)
- [環境変数](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## インストール

公開されたパッケージは**ESM専用**です。Node.jsまたはバンドラーでは`import`/`import()`を使用してください。`require('ai-i18n-tools')`は使用しないでください。このパッケージは`engines.node` `>=22.16.0`を宣言しています。古いNode.jsバージョンはサポートされていません。npmのtarballには`docs/`配下の英語ファイルのみが含まれています。`translated-docs/`配下の言語ごとのコピーは[GitHubリポジトリ](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)にあります。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-toolsには独自の文字列抽出機能が含まれています。以前に`i18next-scanner`、`babel-plugin-i18next-extract`、または類似ツールを使用していた場合、移行後にそれらの開発依存関係を削除できます。

<a id="using-the-cli"></a>
### CLI の使用方法

**プロジェクトごと (推奨)** — 依存関係または開発依存関係としてインストールし、`npx`、`pnpm exec`、または`package.json`スクリプト経由で呼び出します。`package.json`スクリプトはすでに`node_modules/.bin`上で`PATH`として実行されるため、`pnpm run i18n:sync`のようなコマンドは`npx`を入力せずにCLIを呼び出せます。

**ベア** `ai-i18n-tools` **ターミナル内:** ローカルインストール後にプロジェクトルートから対話型シェルでCLIを直接実行するには、ローカルのbinディレクトリを`PATH`に追加します。

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/) を使用する場合、プロジェクトルートの `.envrc` に `PATH_add node_modules/.bin` を追加することで、リポジトリに `cd` した後にベアコマンドが利用可能になります。`PATH` を変更しない場合は、引き続き `npx ai-i18n-tools …` または `pnpm exec ai-i18n-tools …` を使用してください。

**インストール不要のワンタイム実行** — `npx ai-i18n-tools <cmd>` または `pnpm dlx ai-i18n-tools <cmd>`（その実行のためにパッケージをダウンロード。`package.json` にエントリは追加されません）。

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

プロバイダーの API キーを設定します（OpenRouter を例として示します。アクティブなプロバイダーに対応する環境変数を指定してください。詳細は[プリセットテーブル](#openrouter)を参照してください）。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

またはプロジェクトルートに`.env`ファイルを作成してください。

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="quick-start"></a>
## クイックスタート

デフォルトの `init` テンプレート（`ui-markdown`）は、**UI**の抽出と翻訳のみを有効にします。`ui-docusaurus` および `ui-starlight` テンプレートは**ドキュメント**の翻訳（`translate-docs`）を有効にします。`ui-astro-website` テンプレートは、純粋なAstroアプリ向けに**UI**抽出のスキャフォールドを提供します（`.astro` ファイルを含む）。`.astro` ページHTML向けに `translate-docs` も必要であれば、`docs[]` ブロックを追加してください（[Astro website pages (parse-and-replace)](#astro-website-parse-and-replace)を参照）。リファレンスの [`examples/astro-website`](../../docs/../examples/astro-website/) は**両方**のパイプラインを使用しています。設定に従って、抽出、UI翻訳、任意のSVGファイル翻訳、ドキュメント翻訳を1つのコマンドで実行したい場合は `sync` を使用してください。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# Workflow 3 - nested JSON bundles (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 推奨される `package.json` スクリプト

パッケージをローカルにインストールすると、CLIコマンドをスクリプト内で直接使用できます（`npx`は不要です）。

**好ましい** `sync` は、「`translate-ui`を実行し、その後`translate-svg`、次に`translate-docs`、最後に`translate-json`を実行する」ことが必要だったすべてのことに対してです：`ai-i18n-tools sync`は、あなたの設定に従って、**extract**（有効な場合）、**translate-ui**、オプションの**translate-svg**、**translate-docs**、その後オプションの**translate-json**を、正しい順序で共有フラグとともに実行します。手動でこれらのステップを連鎖させるのは、順序、抽出、ロケールフラグを間違えるのが簡単です。`i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs`、および`i18n:translate:json`は、単一の**ステップ**が孤立して必要な場合にのみ使用してください。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

<a id="workflow-1---ui-translation"></a>
## ワークフロー 1 - UI 翻訳

i18next を使用するあらゆる JS/TS プロジェクト向けに設計されています：React アプリ、Next.js（クライアントおよびサーバーコンポーネント）、Node.js サービス、CLI ツールなど。

<a id="step-1-initialise"></a>
### ステップ 1：初期化

```bash
npx ai-i18n-tools init
```

これにより、`ui-markdown` テンプレートを使用して `ai-i18n-tools.config.json` が作成されます。以下の設定を編集してください。

- `sourceLocale` - ソース言語のBCP-47コード（例：`"en-GB"`）。 **一致する必要があります** `SOURCE_LOCALE` あなたのランタイムi18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされたもの。
- `targetLocales` - 目標言語のBCP-47コードの配列（例：`["de", "fr", "pt-BR"]`）。 このリストから`ui-languages.json`マニフェストを作成するには`generate-ui-languages`を実行します。
- `ui.sourceRoots` - `t("…")`呼び出しをスキャンするためのディレクトリまたはグロブパターン（例：`["src/"]`, `["src/**/*.ts"]`）。
- `ui.stringsJson` - マスターカタログを書き込む場所（例：`"src/locales/strings.json"`）。
- `ui.flatOutputDir` - `de.json`、`pt-BR.json`などを記述する場所（例：`"src/locales/"`）。
- `ui.preferredModel`（オプション） - **最初に**試行するモデルID（`translate-ui`のみ）。失敗した場合、CLIはアクティブなプロバイダーの`translationModels`を順に処理し、重複をスキップします。

<a id="step-2-extract-strings"></a>
### ステップ 2：文字列の抽出

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 配下のすべての JS/TS ファイルをスキャンし、`t("literal")` および `i18n.t("literal")` 呼び出しを検出して `ui.stringsJson` に書き込み（またはマージ）します。

スキャナーはカスタマイズ可能で、`ui.uiExtractor.funcNames`（またはレガシーの `ui.reactExtractor.funcNames`）を通じてカスタム関数名を追加できます。Astro のページおよびコンポーネントの場合は、`.astro` を `ui.uiExtractor.extensions` に追加してください。

<a id="marking-html-for-translation"></a>
### 翻訳対象のHTMLに印を付ける

プレーンなHTMLアプリ（マークアップに`t("…")`呼び出しがない場合）では、属性を使用して翻訳対象の要素に印を付け、`extract`が要素自体から英語のテキストを取得するようにします。文字列リテラルの重複は不要です。

値なしの形式（属性に値がなく、ソーステキストは要素から読み取られます）を優先してください。

- `data-i18n` — キーは要素の`textContent`です。実行時に`el.textContent = t(key)`を設定します。
- `data-i18n-title` — キーは要素の`title`です。実行時に翻訳された`title`を設定します。
- `data-i18n-placeholder` — キーは要素の`placeholder`です。

値付きの形式`data-i18n="Some key"`は、値なしの形式が機能しない場合にのみ使用してください。たとえば、子タグと混在するテキスト（混合コンテンツ要素）の場合や、キーが表示テキストと異なる必要がある場合です。要素（およびそのサブツリー）を除外するには`data-i18n-ignore`を使用します。

制約: 値なしの`data-i18n`は、リーフテキスト要素（単一のテキストノードで、子要素がない場合）にのみ使用してください。これは、`textContent`を設定すると子要素がすべて置き換えられるためです。`Run <code>build</code> now.`のような段落の場合は、各テキスト部分を独自のマーカーでラップしてください。

```html
<p><span data-i18n>Run</span> <code>build</code> <span data-i18n>now.</span></p>
```

マーカーは手動で追加するか、`mark-html`コマンドに値なしマーカーを挿入させることができます。デフォルトではドライランとして機能し、ファイルごとにいくつのマーカーを追加するかを報告し、手動での`<span data-i18n>`が必要な混合コンテンツ要素をリストします。ドライランは`--write`を指定した場合にのみ書き込みを行います。

```bash
# Preview (no changes written)
npx ai-i18n-tools mark-html public/index.html

# Apply the bare markers
npx ai-i18n-tools mark-html public/index.html --write
```

`mark-html`は冪等であり、`data-i18n-ignore`を尊重し、コードのような要素（`code`、`pre`、`kbd`、`samp`、`var`）や空のテキスト/数値のみのテキストには印を付けず、値付きマーカーを生成することはありません。印付けの後、報告された混合コンテンツフラグメントを手動でラップし、次に`.html`を`ui.uiExtractor.extensions`に追加して、`extract`が文字列をキャプチャできるようにします。

```jsonc
{
  "ui": {
    "sourceRoots": ["src", "public"],
    "uiExtractor": { "extensions": [".ts", ".tsx", ".html"] }
  }
}
```

<a id="html-app-worked-example-dashboard"></a>
#### 実例：プレーンなHTMLアプリ（バンドルされたダッシュボード）のローカライズ

パッケージ固有の翻訳ダッシュボード（`src/dashboard-app`）も、これらのマーカーを使用します。その`index.html`には、次のようなプレーンなマーカーが含まれています。

```html
<button type="button" id="seg-btn-next" disabled data-i18n>Next</button>
<input type="text" id="seg-filter-filename" placeholder="Filename (partial)" data-i18n-placeholder />
<button id="dashboard-close" title="Stop the dashboard server and close this window" data-i18n-title data-i18n>Close</button>
```

`extract`は、各英語ソース文字列をカタログ（`strings.json`）に書き込み、`translate-ui`はロケールごとに1つのフラットバンドルを、英語ソーステキストをキーとして埋め込みます。典型的な静的HTMLアプリの場合、`ui.flatOutputDir`を`public/locales/`のようなWebサーバーで提供されるディレクトリに向けます。

```bash
npx ai-i18n-tools extract        # index.html markers → strings.json
npx ai-i18n-tools translate-ui   # strings.json → {ui.flatOutputDir}/{locale}.json
```

```jsonc
// public/locales/de.json
{
  "Next": "Weiter",
  "Filename (partial)": "Dateiname (teilweise)",
  "Stop the dashboard server and close this window": "Dashboard-Server stoppen und dieses Fenster schließen",
  "Close": "Schließen"
}
```

実行時には、アクティブなロケールのバンドルをロードし、印付けされた要素をウォークします。キーは、マーカーの値が存在する場合はその値から、存在しない場合は要素自体のテキスト/タイトル/プレースホルダー（抽出ツールが空白文字を正規化するのと同じ方法で正規化されます）から取得されます。

```html
<script type="module">
  const locale = document.documentElement.lang || "en";
  const bundle = locale.startsWith("en")
    ? {}
    : await fetch(`/locales/${locale}.json`).then((r) => (r.ok ? r.json() : {}));

  const t = (key) => bundle[key] ?? key; // English source is the fallback
  const norm = (s) => s.trim().replace(/\s+/g, " ");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n") || norm(el.textContent || "");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title") || norm(el.getAttribute("title") || "");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder") || norm(el.getAttribute("placeholder") || "");
    if (key) el.setAttribute("placeholder", t(key));
  });
</script>
```

このスニペットのマーカーウォーク部分は、[`src/dashboard-app/app.js`](../../docs/../src/dashboard-app/app.js)にある`applyStaticI18n`と全く同じです。英語のソーステキストがカタログキーであるため、翻訳されていない文字列は自動的に英語にフォールバックします。

バンドルされたダッシュボードの違い：Nodeサーバーがあるため、静的な`/locales/{locale}.json`を取得しません。クライアントは`GET /api/ui-i18n`を呼び出し、サーバーはアクティブなロケール（`--ui-lang` > `AI_I18N_LANG` > 設定`uiLanguage` > ホストOS）を解決して`{ locale, dir, bundle }`を返します。その後、クライアントは（ロケールを選択するために`lang`を読むのではなく）その応答から`document.documentElement` `lang`/`dir`を設定してから`applyStaticI18n`を呼び出します。バンドル自体は翻訳対象のツールのコンテンツではなく、ダッシュボード自体のUI文字列であり、`src/i18n/locales/{locale}.json`に出荷され（ビルド時に`dist/i18n/locales`にコピーされ）、[`src/i18n/index.ts`](../../docs/../src/i18n/index.ts)の`loadUiBundle`によってサーバーサイドで読み取られます。ダッシュボードの`t()`は、上記の最小限の`t`とは異なり、`{{name}}`補間もサポートしています。

<a id="astro-website-plain-astro-not-starlight"></a>
### Astro ウェブサイト（スターライトを使わないプレーンなAstro）

静的 Astro マーケティングサイトまたはアプリサイトでは、[Astro 組み込みの i18n ルーティング](https://docs.astro.build/en/guides/internationalization/) と ai-i18n-tools を組み合わせて使用します。リファレンス実装は [`examples/astro-website`](../../docs/../examples/astro-website/) です（その [README](../../docs/../examples/astro-website/README.md) も参照）。英語版は `/`、9つのターゲットロケールは `/{locale}/`（`de`、`fr`、`es`、`ar`、`ja`、`ko`、`zh-cn`、`zh-tw`、`pt-br`）にあります。

ほとんどのチームは2つのパイプラインの**ハイブリッド**を使用しています（これらは競合しません）：

| パイプライン | 使用対象 | コマンド | 出力 |
|----------|---------|----------|--------|
| **ページ HTML** | テンプレート本体の見出し、段落、ナビゲーションラベル、インライン配列 | `translate-docs` | ロケールごとに `src/pages/{locale}/index.astro` |
| **UI 文字列（`t()`）** | フロントマターのデータ、スクリーンショットのタブラベル、共有配列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（英語原文をキーとする） |

言語を追加または削除する際は、以下の3つのリストを同期させてください：`ai-i18n-tools.config.json` 内の `targetLocales`、`astro.config.mjs` 内の `i18n.locales`（Astro は **小文字**のルートコード、たとえば `pt-br` を使用）、および `ui-languages.json`（`generate-ui-languages` 経由）。フラットバンドルの**ファイル名**は設定された大文字小文字表記を使用（`pt-BR.json`）し、マニフェストの `code` フィールドを使って Astro の `pt-br` ルートをそのファイルにマッピングしてください（`examples/astro-website/src/i18n/locale.ts` を参照）。

リファレンスプロジェクトからの `package.json` スクリプトの例：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="astro-website-ui-strings-ssg"></a>
### Astro ウェブサイトのUI文字列（SSG）

`init -t ui-astro-website`を使ってUI抽出のスキャフォールドを生成し、ページのHTMLも翻訳する場合は、後で`docs[]`ブロックをマージします（下記参照）。TypeScriptモジュール内では`t('…')`でテキストをラップし、フロントマター内では`.astro`でラップします。また、ロケールごとの重複ページではなくUI文字列を使用する場合、テンプレート内の`{expression}`ブロックでも同様にラップします。

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

`astro.config.mjs` 内の `i18n.defaultLocale` と一致するように `sourceLocale` を設定してください。ビルド時に Astro がインポートできるディレクトリにフラットバンドルを書き出します（テンプレートでは `public/locales/` を使用）。英語の原文リテラルをキーとして検索することで、**ビルド時**に `t('…')` を解決します（`examples/astro-website/src/i18n/t.ts` を参照。`strings.json` は実行時バンドルではなく、抽出キャッシュです）。読み込み後に言語切り替えを行うクライアントアイランドを追加しない限り、静的サイトでは `ai-i18n-tools/runtime` や i18next は**不要**です。

`t()` を呼び出すすべてのページ（英語ルートページおよび各 `src/pages/{locale}/` コピー）を接続してください：

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

例に含まれるサポート用ヘルパー：ラベル、方向、BCP-47 コード用の `src/i18n/utils.ts`、`src/i18n/locale.ts`、`ui-languages.json`。`targetLocales` を変更した後に `generate-ui-languages` を実行してください（オプションで `ui.uiLanguagesPath` を設定し、マニフェストがヘルパーの隣に配置されるようにします。例：`src/i18n/ui-languages.json`）。`MainLayout.astro` は `resolveUiLanguage(Astro.currentLocale)` から `<html lang>` および `<html dir>` を設定します。`LanguagePicker.astro` は `astro:i18n` からの `getRelativeLocaleUrl` を使用します。

<a id="astro-website-pages-parse-and-replace"></a>
### Astro ウェブサイトのページ（パース＆リプレース方式）

`.astro` ファイル内のハードコードされた HTML を含むマーケティングページでは、`translate-docs` にテキストノードおよび属性（`alt`、`title`、`aria-label`、`placeholder`）の抽出をさせ、ドキュメントキャッシュで翻訳し、ページツリー内にロケール固有のコピーを書き出します。ほとんどの表示用コピーでは、`t()` は**不要**です。

構造的な属性やキーの値は、デフォルトでは**翻訳されません**。組み込みの保護機能により、`class`、`id`、`style`、`src`、`href`、`data-*`などのJSX/HTML属性や、`aria-*`の大部分、およびテンプレート内の`{expression}`ブロックで使用される`class`、`key`、`id`などのオブジェクトキーが対象となります。カスタム属性（たとえばTailwindの`variant`やCMSの`slug`フィールド）を使用する場合は、`docs[].protectAttributes`および`docs[].protectKeys`を使ってこれらのリストを拡張してください。これらのオプションは、マークダウン翻訳時のMDX JSXでも同様に適用されます（[protectAttributes / protectKeys](#protectattributes-protectkeys)を参照）。

`features.translateDocs`を有効化し、`docs[]`ブロックを追加します。例：

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

`npx ai-i18n-tools translate-docs`を実行します（または[`pnpm i18n:translate`](../../docs/../examples/astro-website/)で`pnpm i18n:translate`を実行します）。英語のソースは`src/pages/index.astro`に留まり、各ターゲットロケールは`src/pages/{locale}/index.astro`を取得し、インポートは追加のディレクトリレベルに合わせて調整されます（例えば、`../layouts/` → `../../layouts/`）。

**テンプレートボディ**内では、`{expression}`ブロック内の文字列リテラル（インライン配列、オブジェクト`title`/`desc`フィールド）は、ユーザー向けである場合に翻訳されます。保護された属性/キーの引用値、`t('…')`、`<script>`、および`<style>`内のリテラルは変更されません。**フロントマターTypeScriptはこのパスでは翻訳されません**—共有フロントマター（`t()`インポートやデータ配列を含む）を英語とロケールページで同一に保つか、英語ページを編集した後に`translate-docs`を再実行してロケールコピーがフロントマターの変更を取得できるようにします。フロントマターのみのコピーには、[UI-stringパイプライン](#astro-website-ui-strings)を使用します。

[`examples/astro-website`](../../docs/../examples/astro-website/)を参照して、完全なハイブリッドランディングページ（`translate-docs`経由のHTML、`t()` + `translate-ui`経由のスクリーンショットタブラベル）を確認してください。

<a id="step-3-translate-ui-strings"></a>
### ステップ 3：UI 文字列の翻訳

```bash
npx ai-i18n-tools translate-ui
```

`strings.json`を読み込み、各ターゲットロケールのアクティブなLLMプロバイダーにバッチを送信し、フラットなJSONファイル（`de.json`、`fr.json`など）を`ui.flatOutputDir`に書き込みます。`ui.preferredModel`が設定されている場合、そのモデルはアクティブなプロバイダーの`translationModels`リストの前に試行されます（ドキュメント翻訳およびその他のコマンドは、プロバイダーのリストのみを使用します）。

各エントリについて、`translate-ui`はオプションの`models`オブジェクト内に、各ロケールを正常に翻訳した**OpenRouterモデルID**を保存します（`translated`と同じロケールキーを使用）。ローカルの`dashboard`コマンドで編集された文字列は、そのロケールの`models`内でセンチネル値`user-edited`としてマークされます。`ui.flatOutputDir`配下のロケールごとのフラットファイルは、**ソース文字列 → 翻訳**のみを含み、`models`は含まれません（そのためランタイムバンドルは変更されません）。

> **注記:** 翻訳ダッシュボードでエントリを編集した場合、更新されたキャッシュエントリで出力ファイルを再作成するために`sync --force-update`（または同等の`translate`コマンドに`--force-update`を指定）を実行する必要があります。また、後でソーステキストが変更された場合、新しいキャッシュキー（ハッシュ）が新しいソース文字列に対して生成されるため、手動での編集内容は失われることに注意してください。

<a id="exporting-to-xliff-20-optional"></a>
### XLIFF 2.0 へのエクスポート（オプション）

UI 文字列を翻訳ベンダー、TMS、CAT ツールに引き渡すために、カタログを **XLIFF 2.0** 形式（ターゲットロケールごとに1ファイル）でエクスポートします。このコマンドは**読み取り専用**です。`strings.json` を変更したり、API を呼び出したりすることはありません。

```bash
npx ai-i18n-tools export-ui-xliff
```

デフォルトでは、ファイルは `ui.stringsJson` の隣に `strings.de.xliff`、`strings.pt-BR.xliff`（カタログのベースネーム + ロケール + `.xliff`）のような名前で出力されます。`-o` / `--output-dir` を使用して他の場所に出力できます。`strings.json` からの既存の翻訳は `<target>` に表示され、翻訳のないロケールは `<target>` なしの `state="initial"` として出力され、ツールが翻訳を埋められるようになります。`--untranslated-only` を使用すると、各ロケールでまだ翻訳が必要なユニットのみをエクスポートできます（ベンダー向けのバッチ処理に便利です）。`--dry-run` はファイルの書き込みなしでパスを表示します。

<a id="step-4-wire-i18next-at-runtime"></a>
### ステップ 4: ランタイムで i18next を接続する

`'ai-i18n-tools/runtime'` がエクスポートするヘルパーを使って、i18n 設定ファイルを作成します。

<details>
<summary>i18nの完全なブートストラップ例 (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
#### `SOURCE_LOCALE`の整合性を保つ

**3つの値を一致させてください：** `ai-i18n-tools.config.json` 内の `sourceLocale`、このファイル内の `SOURCE_LOCALE`、およびフラット出力ディレクトリ（通常は `public/locales/`）の下に `translate-ui` が作成する複数形対応のフラットJSON `{sourceLocale}.json`。静的 `import` 内でも同じベースネームを使用してください（上記の例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 内の `lng` フィールドは `SOURCE_LOCALE` と等しくなければなりません。静的なES `import` のパスには変数を使用できません。ソースロケールを変更する場合は、`SOURCE_LOCALE` とインポートパスを同時に更新してください。あるいは、動的な `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`、`fetch`、または `readFileSync` を使ってファイルを読み込み、パスを `SOURCE_LOCALE` から構築する方法もあります。

このスニペットでは、`i18n` がこれらのフォルダの隣にあるかのように `./locales/…` と `./public/locales/…` を使用しています。ファイルが `src/` の下にある場合（一般的なケース）、インポートが `ui.stringsJson`、`uiLanguagesPath`、`ui.flatOutputDir` と同じパスに解決されるように `../locales/…` と `../public/locales/…` を使用してください。

React がレンダリングされる前に `i18n.js` をインポートします (例: エントリ ポイントの先頭)。ユーザーが言語を変更した場合は、`await loadLocale(code)` を呼び出し、次に `await i18n.changeLanguage(code)` を呼び出します。

`SOURCE_LOCALE` はエクスポートされているため、他のファイル（たとえば言語切り替えコンポーネント）でも `'./i18n'` から直接インポートできます。既存のi18next設定を移行する場合は、コンポーネント中に散在するハードコードされたソースロケール文字列（例：`'en-GB'` のチェック）を、i18nブートストラップファイルから `SOURCE_LOCALE` をインポートする形に置き換えてください。

名前付きインポート（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）も、デフォルトエクスポートを使わない場合と同じように動作します。

<a id="locale-loaders"></a>
#### ロケールローダー

`localeLoaders`を`ui-languages.json`から`makeLocaleLoadersFromManifest`を使用して派生させることで、**設定と同期を保つ**ようにします（これにより、`makeLoadLocale`と同じ正規化を使って`SOURCE_LOCALE`がフィルタリングされます）。`targetLocales`にロケールを追加して`generate-ui-languages`を実行すると、マニフェストが更新され、ローダーが自動的に変更を追跡します。個別のハードコードされたマップを管理する必要はありません。

`public/`配下のJSONバンドル（典型的なNext.jsのセットアップ）では、パブリックURLパスから取得します。

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

バンドラのないNode CLIでは、各コードに対してJSONファイルを読み込んで解析する小さなヘルパー内で`readFileSync`を使用します。

<a id="runtime-helpers-reference"></a>
#### ランタイムヘルパーのリファレンス

`aiI18n.defaultI18nInitOptions(sourceLocale)`は、キーをデフォルトとする設定用の標準オプションを返します。

- `parseMissingKeyHandler`はキー自体を返すため、未翻訳の文字列はソーステキストを表示します。
- `nsSeparator: false`はコロンを含むキーを許可します。
- `interpolation.escapeValue: false` — 無効化しても安全です。Reactは値自体をエスケープするため、Node.js/CLI出力にはエスケープすべきHTMLがありません。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` は ai-i18n-tools プロジェクトにおける**推奨される**配線方法です。キートリムおよびソースロケール <code>"{{var}}"</code> の補間フォールバック（低レベルの `wrapI18nWithKeyTrim` と同様の動作）を適用し、オプションで `translate-ui` および `{sourceLocale}.json` の複数形接尾辞付きキーを `addResourceBundle` 経由でマージした後、`strings.json` から複数形対応の `wrapT` をインストールします。ブートストラップ中は `sourcePluralFlatBundle` を省略できますが、`translate-ui` が `{sourceLocale}.json` を出力した後はマージしてください。アプリケーションコードでは単独の `wrapI18nWithKeyTrim` は**非推奨**です。代わりに `setupKeyAsDefaultT` を使用してください。

`makeLoadLocale(i18n, loaders, sourceLocale)` は、ロケールのJSONバンドルを動的にインポートしてi18nextに登録する非同期の `loadLocale(lang)` 関数を返します。

<a id="using-t-in-source-code"></a>
### ソースコードでの `t()` の使用

抽出スクリプトが検出できるように、`t()` には **リテラル文字列**を渡してください。

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

このパターンはReactの外（Node.js、サーバーコンポーネント、CLI）でも同様に使用できます。

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**ルール：**

- 抽出されるのは、以下の形式のみです：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- キーは**リテラル文字列**でなければなりません。変数や式をキーとして使用しないでください。
- キーにテンプレートリテラルを使用しないでください：<code>{'t(`Hello ${name}`)'}</code>は抽出できません。

<a id="interpolation"></a>
### インターポレーション

i18nextのネイティブな第二引数補間を使用して<code>"{{var}}"</code>プレースホルダーを処理します：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extractコマンドは、第**2引数**が単純なオブジェクトリテラルである場合にそれを解析し、`plurals: true`や`zeroDigit`といったツール用途専用のフラグを読み取ります（下記の**基数複数形**を参照）。通常の文字列では、ハッシュ化にはリテラルキーのみが使用されます。インターポレーションのオプションは実行時にi18nextに引き渡されます。

プロジェクトがカスタム補間ユーティリティを使用している場合（例：`t('key')`を呼び出してから、`interpolateTemplate(t('Hello {{name}}'), { name })`のようなテンプレート関数を通して結果をパイプする）、`setupKeyAsDefaultT`（`wrapI18nWithKeyTrim`を介して）はそれを不要にします — ソースロケールが生のキーを返す場合でも<code>"{{var}}"</code>の補間を適用します。呼び出しサイトを`t('Hello {{name}}', { name })`に移行し、カスタムユーティリティを削除してください。

<a id="cardinal-plurals-plurals-true"></a>
### 基数複数形（`plurals: true`）

開発者デフォルトのコピーとして使用したい**同じリテラル**を使用し、`plurals: true`を渡して、extractおよび`translate-ui`がその呼び出しを1つの**基数複数形グループ**として扱うようにします（i18next JSON v4形式の`_zero`…`_other`形式）。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit`（オプション）— ツール用途専用。i18nextでは**読み込まれません**。`true`の場合、各ロケールでその形式が存在する場合に、`_zero`文字列内にリテラルのアラビア数字`0`を使用するようプロンプトが促します。`false`または省略された場合は、自然な「ゼロ」表現が使用されます。`i18next.t`を呼び出す前にこれらのキーを削除してください（下記の`wrapT`を参照）。

**検証：**メッセージに**2つ以上**の異なる`{{…}}`プレースホルダーが含まれる場合、そのうちの1つは**必ず**`{{count}}`（複数形軸）でなければなりません。そうでない場合、`extract`は明確なファイル／行番号のメッセージとともに**失敗**します。

**2つの独立したカウント**（例：セクションとページ）は、1つの複数形メッセージを共有できません。**2つ**の`t()`呼び出しを使用し（それぞれ`plurals: true`と独自の`count`付き）、UIで連結してください。

**v1 では使用できません：** 序数の複数形（`_ordinal_*`、`ordinal: true`）、区間複数形、ICU 専用パイプライン。

<a id="how-plurals-are-stored-and-emitted"></a>
#### プルーラルの保存および出力方法

**この** `strings.json` 複数のグループは **ハッシュごとに1行**を使用し、`"plural": true`、元のリテラル `source`、および `translated[locale]` をオブジェクトとして、基数カテゴリ（`zero`、`one`、`two`、`few`、`many`、`other`）をそのロケールの文字列にマッピングします。

**フラットなロケールJSON：**非複数形の行は**原文 → 翻訳**のままです。複数形の行は、i18nextが複数形をネイティブに解決できるように、`<groupId>_original`（参照用に`source`に等しい）および各接尾辞の`<groupId>_<form>`として出力されます。`translate-ui`はまた、**複数形のフラットキーのみ**を含む`{sourceLocale}.json`も出力します（ソース言語用にこのバンドルを読み込んで、接尾辞付きキーが解決されるようにします。通常の文字列は引き続きキーをデフォルトとして使用します）。各ターゲットロケールに対して、出力される接尾辞キーはそのロケールの`Intl.PluralRules`に一致します（`requiredCldrPluralForms`）。`strings.json`がコンパクション後に一致するためカテゴリを省略した場合（例：アラビア語の`many`が`other`と同じ）でも、`translate-ui`はフォールバックとなる兄弟文字列からコピーすることで、実行時のルックアップがキーを欠落しないように、必要なすべての接尾辞をフラットファイルに書き出します。

実行時（`ai-i18n-tools/runtime`）：**呼び出し**は`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })`です。これは`wrapI18nWithKeyTrim`を実行し、オプションの`translate-ui` `{sourceLocale}.json`複数形バンドルを登録した後、`wrapT`を`buildPluralIndexFromStringsJson(stringsJson)`を使用して実行します。`wrapT`は`plurals` / `zeroDigit`を削除し、必要に応じてキーをグループIDに書き換え、`count`を転送します（オプション：単一の非`{{count}}`プレースホルダーがある場合、`count`はその数値オプションからコピーされます）。

**古い環境：** ツールや一貫性のある動作のために `Intl.PluralRules` が必要です。非常に古いブラウザを対象にする場合は、ポリフィルを使用してください。

<a id="language-switcher-ui"></a>
### 言語切り替えUI

言語セレクタの構築には`ui-languages.json`マニフェストを使用します。`ai-i18n-tools`は2つの表示ヘルパーをエクスポートしています。

<details>
<summary>LanguageSelectコンポーネントの例 (React)</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageEntry,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageEntry[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    await i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` - 翻訳されている場合は`t(englishName)`を表示し、両方が異なる場合は`englishName / t(englishName)`を表示します。設定画面に適しています。

`getUILanguageLabelNative(lang)` - `englishName / label`を表示します（各行で`t()`呼び出しはありません）。ネイティブ名を表示したいヘッダーメニューに適しています。

`ui-languages.json`マニフェストは<code>"{ code, label, englishName, direction }"</code>エントリのJSON配列です（`direction`は`"ltr"`または`"rtl"`です）。例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

マニフェストは、`generate-ui-languages`が`sourceLocale`＋`targetLocales`およびバンドルされたマスターカタログから生成し、`ui.flatOutputDir`に書き出されます。設定内のロケールを変更した場合は、`generate-ui-languages`を実行して`ui-languages.json`ファイルを更新してください。

<a id="rtl-languages"></a>
### RTL言語

`ai-i18n-tools`は`getTextDirection(lng)`および`applyDirection(lng)`をエクスポートします。

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection`は、ブラウザの場合は`document.documentElement.dir`を設定し、Node.jsの場合は何もしません。オプションの`element`引数を渡すことで、特定の要素を対象にできます。

`→`矢印を含む可能性のある文字列については、RTLレイアウト用に反転します。

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

<a id="workflow-2---document-translation"></a>
## ワークフロー2 - 文書翻訳

主に`docs[].contentPaths`下の**マークダウン、MDX、および`.astro`ドキュメント**を対象に設計されています。Docusaurusサイトでは、`docs[].docusaurusCatalogDir`を`write-translations`カタログフォルダー（例：`docs-site/i18n/en`）に設定することで、`translate-docs`がシェルのJSON（ナビゲーションバー、フッター、テーマ文字列）も翻訳できるようにします。マークダウンに埋め込まれたPNGやその他のラスターアイコンについては、[翻訳ドキュメント内の画像およびラスターアセット](#images-and-raster-assets-in-translated-docs)を参照してください。READMEや`docsOutput.style = "flat"`を使用したドキュメントにオプションの**言語切り替え**ブロックを追加する場合は、[言語切り替え（`languageListBlock`）](#language-switcher-languagelistblock)を参照してください。SVGファイルは、`features.translateSVG`が有効な場合に[`translate-svg`](#cli-reference)を通じて翻訳され、`docs[].contentPaths`では翻訳されません。Docusaurusカタログではない、任意のネストされたUI用JSONバンドルは、[ワークフロー3](#workflow-3---json-file-translation)（`json[]` / `translate-json`）に配置すべきであり、`docs[]`ではありません。

<a id="step-1-initialise-for-documentation"></a>
### ステップ1：ドキュメント用に初期化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Astro Starlight ドキュメントサイトの場合：

```bash
npx ai-i18n-tools init -t ui-starlight
```

プレーンなAstroウェブサイトUI（Starlightなし）の場合：

```bash
npx ai-i18n-tools init -t ui-astro-website
```

このテンプレートはUI抽出のみを有効にします。ページHTMLの翻訳を行うには、`features.translateDocs`も設定し、`docs[]`ブロックを追加する必要があります（[Astroウェブサイトページ（解析と置換）](#astro-website-parse-and-replace)を参照）。[`examples/astro-website`](../../docs/../examples/astro-website/)の設定例では、両方のパイプラインを併用しています。

生成された`ai-i18n-tools.config.json`を編集します。

- `sourceLocale` - ソース言語（`docusaurus.config.js`内の`defaultLocale`と一致している必要があります）。
- `targetLocales` - BCP-47ロケールコードの配列（例：`["de", "fr", "es"]`）。
- `cacheDir` - すべてのパイプライン共通のSQLiteキャッシュディレクトリ（および`--write-logs`のデフォルトログディレクトリ）。
- `docs` - ドキュメントブロックの配列。各ブロックには、オプションの`description`、`contentPaths`（文字列または配列、ファイル、ディレクトリ、またはglob）、`outputDir`、オプションの`docusaurusCatalogDir`、`docsOutput`、オプションの`segmentSplitting`、`translateFrontmatterFields`、`protectAttributes`、`protectKeys`、`targetLocales`、`addFrontmatter`などが含まれます。
- `docs[].description` - メンテナー向けのオプションの短い注釈。設定されている場合、`translate-docs`の見出しと`status`のセクションヘッダーに表示されます。
- `docs[].contentPaths` - Markdown/MDX/`.astro`のソース（およびDocusaurusシェルJSON用のオプションの`docusaurusCatalogDir`）。
- `docs[].outputDir` - そのブロックの翻訳出力ルート。
- `docs[].docsOutput.style` - `"nested"`（デフォルト）、`"flat"`、`"doc-system"`、またはエイリアス`"docusaurus"` / `"astro-starlight"`（[出力レイアウト](#output-layouts)を参照）。

**プライマリ対サプライメンタリ：** ローカライズされたページには `contentPaths` を使用してください。`write-translations` から Docusaurus シェルの JSON も必要な場合は、`docusaurusCatalogDir` を設定します。ページの翻訳のみを行う場合は、`docusaurusCatalogDir` を省略してください。

<a id="step-2-translate-documents"></a>
### ステップ2：文書を翻訳

```bash
npx ai-i18n-tools translate-docs
```

これは、すべての`docs[]`ブロックの`contentPaths`内のすべてのファイル（および`docusaurusCatalogDir`が設定されている場合はDocusaurusカタログJSON）を、すべての有効なドキュメントロケールに翻訳します。すでに翻訳済みのセグメントはSQLiteキャッシュから提供されるため、新しいまたは変更されたセグメントのみがLLMに送信されます。

単一のロケールを翻訳するには：

```bash
npx ai-i18n-tools translate-docs --locale de
```

翻訳が必要な内容を確認するには：

```bash
npx ai-i18n-tools status
```

<a id="complex-markdown-and-failed-quality-checks"></a>
#### 複雑なMarkdownおよび品質チェックの失敗

`translate-docs`は、各翻訳されたセグメントがMarkdown構造（文書から解析された強調も含む）を保持しているかをチェックします。多くの`bold`スパンが`` `inline code` ``の周囲に重なっている段落、太字内にバッククォートがネストしている（たとえばテンプレートリテラル`` `fetch(\`/locales/${code}.json\`)` ``など）、または長い文のなかで太字とコードが複雑に交じっている場合、構造は脆弱です。一部のロケールでは語順が異なる必要があり、翻訳後に`**`と`` ` ``の位置関係が変化して`AST mismatch`などのCLIエラーを引き起こす可能性があります。

**このような検証エラーが発生した場合は、ソース言語のテキストを簡略化することを優先してください**。段落を分割したり、例をコードブロックに移動したり、太字とインラインコードの組み合わせを減らして同じ内容を表現するなどしてください。このページの他の場所（特にステップ4の`SOURCE_LOCALE`に関する注記、ローダー、`public/`パスなど）では、意図的に現実的なフォーマットを使用していますが、独自のドキュメントで同様の表現を再利用する際は、広範な翻訳を想定してよりシンプルな表現を心がけてください。

すべての構成済みモデルが同じセグメントで `AST mismatch` エラーを発生させた場合、`translate-docs` はそのセグメントをより小さい部分に自動的に分割できます（最初にリストの中間点、次に個々のリスト項目または短い段落のチャンク）。その後、各部分を最初のモデルから再試行し、元のセグメントキャッシュキーの下で結果を再結合します。これはデフォルトで有効になっています（`segmentSplitting.qualityRetrySplit`）。モデルを使い切った後に停止するには、`false` に設定してください。このフォールバックが実行された場合、実行サマリーに `Quality split retries` が報告されます。

**どのセグメントが失敗したか**、その頻度、および保存された**品質／エラーメッセージ**を確認するには、翻訳ダッシュボードの**失敗**タブ（[翻訳ダッシュボード → 失敗](#failures-document-translation)）を使用してください。

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### キャッシュの動作と `translate-docs` フラグ

CLIはSQLiteで**ファイルトラッキング**を維持します（ファイルごとのソースハッシュ×ロケール）および**セグメント**行（翻訳可能なチャンクごとのハッシュ×ロケール）。通常の実行では、トラッキングされたハッシュが現在のソース**と**一致し、出力ファイルがすでに存在する場合、ファイル全体をスキップします。それ以外の場合は、ファイルを処理し、セグメントキャッシュを使用して変更されていないテキストがAPIを呼び出さないようにします。

| フラグ                          | 機能                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(デフォルト)*                   | 追跡対象とディスク上の出力が一致する場合、変更のないファイルをスキップします。それ以外はセグメントキャッシュを使用します。                                                                                                                                                                          |
| `-l, --locale <codes>`        | ターゲットロケールをカンマ区切りで指定（省略時は、ルートの`targetLocales`と各`docs[]`ブロックのオプション`targetLocales`の和集合がデフォルト値となります）。                                                                                                       |
| `-p, --path` / `-f, --file`   | このパスの下でのみマークダウン/JSONを翻訳します（プロジェクト相対、絶対、またはグロブパターン）； `--file`は`--path`のエイリアスです。                                                                                                                                 |
| `--dry-run`                   | ファイル書き込みもAPI呼び出しも行いません。                                                                                                                                                                                                                                        |
| `--type <kind>`               | `markdown`または`json`に制限（それ以外の場合は設定で有効になっていれば両方を対象）。                                                                                                                                                                                               |
| `--json-only` / `--no-json`   | JSONラベルファイルのみを翻訳、またはJSONをスキップしてMarkdownのみを翻訳。                                                                                                                                                                                              |
| `-j, --concurrency <n>`       | 最大並列ターゲットロケール数（設定またはCLIの組み込みデフォルト値）。                                                                                                                                                                                              |
| `-b, --batch-concurrency <n>` | ファイルごとの最大並列バッチAPI呼び出し数（ドキュメント用；デフォルトは設定またはCLIから取得）。                                                                                                                                                                                               |
| `--emphasis-placeholders`     | 翻訳前にMarkdownの強調マーカーをプレースホルダーとしてマスク（オプション；デフォルトは無効）。                                                                                                                                                                              |
| `--debug-failed`              | 検証に失敗した場合に、`cacheDir`以下に詳細な`FAILED-TRANSLATION`ログを出力。                                                                                                                                                                                        |
| `--force-update`              | ファイル追跡によるスキップの対象となっても、一致したすべてのファイルを再処理します（抽出、再アセンブル、出力書き込み）。**セグメントキャッシュは引き続き適用されます** — 変更のないセグメントはLLMに送信されません。                                                                                    |
| `--force`                     | 処理された各ファイルのファイル追跡をクリアし、API翻訳用の**セグメントキャッシュを読み込みません**（完全な再翻訳）。新しい結果は引き続き**セグメントキャッシュに書き込まれます**。                                                                                 |
| `--stats`                     | セグメント数、追跡中のファイル数、ロケールごとのセグメント合計を表示して終了します。                                                                                                                                                                                    |
| `--clear-cache [locale]`      | キャッシュされた翻訳（およびファイル追跡）を削除します：すべてのロケール、または単一のロケールを対象とし、その後終了します。                                                                                                                                                                             |
| `--prompt-format <mode>`      | セグメントの**バッチ**がモデルに送信され、解析される方法（`xml`、`json-array`、または`json-object`）。デフォルトは`json-array`。抽出、プレースホルダー、検証、キャッシュ、フォールバックの動作は変更しません — [バッチプロンプト形式](#batch-prompt-format)を参照してください。 |

`--force` と `--force-update` を組み合わせることはできません（相互に排他的です）。

<a id="batch-prompt-format"></a>
#### バッチプロンプト形式

`translate-docs` は、アクティブな LLM プロバイダーに翻訳可能なセグメントを **バッチ** (`batchSize` / `maxBatchChars` でグループ化) で送信します。`--prompt-format` フラグは、そのバッチの **ワイヤーフォーマット** を変更するだけです。`PlaceholderHandler` トークン、Markdown AST チェック、SQLite キャッシュキー、およびバッチ解析が失敗した場合のセグメントごとのフォールバックは変更されません。

| モード                   | ユーザーメッセージ                                                           | モデルの応答                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | ダミーXML形式: セグメントごとに1つの `<seg id="N">…</seg>` (XMLエスケープ済み)。 | セグメントインデックスごとに1つの `<t id="N">…</t>` ブロックのみ。       |
| `json-array` (デフォルト) | 順序通りのセグメントごとに1つのエントリを持つJSON配列。               | **同じ長さ**のJSON配列（同じ順序）。           |
| `json-object`          | セグメントインデックスをキーとするJSONオブジェクト `{"0":"…","1":"…",…}`。            | **同じキー**と翻訳された値を持つJSONオブジェクト。 |

実行時のヘッダーには`Batch prompt format: …`も出力されるため、アクティブなモードを確認できます。JSONラベルファイル（`docusaurusCatalogDir`）およびSVGファイルのバッチ処理は、それらのステップが`translate-docs`（または`sync`のドキュメントフェーズ — `sync`はこのフラグを公開しないため、デフォルトは`json-array`）の一部として実行される場合に同じ設定を使用します。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### SQLiteにおけるセグメントの重複排除とパス

> **注記：** このセクションでは、`cleanup` の動作やカスタムツールのデバッグに役立つ内部キャッシュキーの詳細について説明します。ほとんどのユーザーはこのセクションをスキップできます。

- セグメント行は `(source_hash, locale)` によってグローバルにキー付けされています（ハッシュ = 正規化されたコンテンツ）。2つのファイルに同一のテキストがある場合、1つの行を共有します；`translations.filepath` はメタデータ（最後の作成者）であり、ファイルごとの2番目のキャッシュエントリではありません。
- `file_tracking.filepath` は名前空間付きキーを使用します：`doc-block:{index}:{relPath}` は `docs` ブロックごと（`relPath` はプロジェクトルート相対の posix: マークダウンパスとして収集されたもの；**JSON ラベルファイルはソースファイルへの cwd 相対パスを使用します**、例：`docs-site/i18n/en/code.json`、したがってクリーンアップは実際のファイルを解決できます）、`json-block:{index}:{relPath}` は `json[]` ソースのためのもので、`translate-json` の下にあり、`svg-files:{relPath}` は `translate-svg` の下の SVG ファイル用です。
- `translations.filepath` はマークダウン、JSON、および SVG セグメントの cwd 相対 posix パスを保存します（SVG は他のアセットと同じパス形状を使用します；`svg-files:…` プレフィックスは **のみ** `file_tracking` にあります）。
- 実行後、`last_hit_at` はセグメント行 **同じ翻訳スコープ内**（`--path` と有効な種類を尊重し）でヒットしなかったものに対してのみクリアされるため、フィルタリングされたまたはドキュメント専用の実行は無関係なファイルを古くなったとマークしません。

<a id="output-layouts"></a>
### 出力レイアウト

`docsOutput.style` は翻訳されたmarkdownファイルの出力先を制御します。以下の文字列値を `docs[].docsOutput.style` で正確に使用してください（エイリアスは別個のエンジンではなく、あらかじめ設定されたレイアウトです）。

`docsOutput.style = "nested"`（省略時のデフォルト）— ソースツリーを `{outputDir}/{locale}/` 配下にミラーします（例：`docs/guide.md` → `i18n/de/docs/guide.md`）。

`docsOutput.style = "doc-system"` — 静的ドキュメントサイト向けのロケール接頭辞付きドキュメントツリー。`docsRoot` 配下のファイルは `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` に出力されます。`docsRoot` 外のパスはネストされたレイアウトにフォールバックします。`docs[].docsOutput.docsRoot` を英語ソースのルートに設定してください（例：`"docs"` または `"src/content/docs"`）。`docsOutput.style = "doc-system"` の場合、`localeSubpath` を明示的に設定する必要があります（事前設定されたエイリアスを使用してください）。

**エイリアス**（同じレイアウトエンジン、プリセット済み `localeSubpath`）：

- `docsOutput.style = "docusaurus"` — `localeSubpath` のデフォルトは `docusaurus-plugin-content-docs/current`（Docusaurus i18nプラグインのレイアウト）です。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` のデフォルトは `""`（翻訳されたページが直接 `{outputDir}/{locale}/` 配下に配置される。英語コンテンツがコンテンツルートにあり、`outputDir` が `docsRoot` と等しい場合に[Starlight](https://starlight.astro.build/guides/i18n/)と一致します）。

Docusaurus プリセット（主なドキュメントページ）：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight プリセット（同じブロック構造、異なるパス）：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

オプションのJSONラベル — `docusaurusCatalogDir` からのDocusaurusシェル文字列（MDX本文コピーではない）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlightは多数のロケール向けUI文字列を提供しています。必要に応じて、カスタムUIの上書きには、別個の `docs[]` ブロック内で `src/content/i18n/en.json` と `jsonPathTemplate: "{outputDir}/{locale}.json"` を使用します。

`docsOutput.style = "flat"` — 翻訳されたファイルをロケールサフィックス付きでソース横に、またはサブディレクトリ内に配置します。`docsOutput.style = "flat"` の場合、ページ間の相対リンクは自動的に書き換えられます（`rewriteRelativeLinks: false` またはカスタムの `pathTemplate` が設定されていない限り）。

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-when-docsoutputstyle--flat"></a>
#### `docsOutput.style = "flat"` 時のアンカーリンク

`docsOutput.style = "flat"` 時、出力は各ロケールのページ間の**相対パス**を書き換えます（`guide.md` → `guide.de.md`）。**アンカーリンク** — パスの後に `#` を付ける通常のmarkdownインライン形式 — は、ターゲットファイル内のセクションにジャンプします：

```markdown
Read the [installation checklist](../../docs/setup.md#first-run) before you deploy.
```

ここでは、リンクのターゲットは`setup.md`、`#first-run`はアンカーです。そのファイル内の適切な見出しにスクロールする必要があります。

**なぜアンカーリンクに注意が必要か**

- `rewriteRelativeLinks`は各ロケールの**ファイル名**を修正します（`setup.md` → `setup.de.md`）。
- 多くのレンダラーは**表示される見出しのテキスト**から`#`スラグを生成します。翻訳後、ロケールごとに見出しが異なるため、自動生成されたスラグが変化する一方で、書き換えられたリンクはまだ`#first-run`を指している可能性があります。つまり、英語の`#…`アンカーが、翻訳された見出しからレンダラーが生成するスラグと一致しなくなる場合があります。
- 結果として、読者は正しい**ファイル**には到達しますが、**間違った行**に移動するか、ブラウザが一致する見出しを見つけられません。

**対処方法**

1. `translate-docs` の前（通常の `docs[]` / `contentPaths` と同じ）に、ソース `.md` / `.mdx` に対して `ai-i18n-tools write-heading-ids` を実行します。これにより各見出しの前の行に明示的なHTMLアンカーが挿入され、すべての翻訳コピーで `id` 値が共有されます。見出しの名前を変更した後は再実行して、古くなったアンカーIDが現在のタイトルに合わせて更新されるようにします。
2. markdownの**アンカーリンク**をこれらの固定IDを指すようにしてください。例：`[label](../../docs/other.md#section-id)`。ここで `section-id` はツールが書き込んだアンカーと一致している必要があります — 英語の単語から推測したものではありません。

**例**

`docs/overview.md`:

```markdown
See [TLS setup](../../docs/security.md#tls-configuration) for certificate steps.
```

`write-heading-ids`後の`docs/security.md`（簡略化）:

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

`translate-docs`後、ファイルパスと`#…`アンカーはすべてのロケールファイルで一致したままになります。たとえば:

```markdown
Siehe [TLS-Einrichtung](../../docs/security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration`アンカーは、`id`がソースで固定されているため、すべてのロケールで同じです。見出しの**テキスト**とリンクの**ラベル**のみが翻訳されます。

<a id="images-and-raster-assets-in-translated-docs"></a>
#### 翻訳されたドキュメント内の画像およびラスターアセット

`translate-docs` は画像の代替テキストを含むMarkdownセグメントを翻訳します。しかし、ラスタファイル（PNG、JPEG、WebP、GIF）をドキュメント `outputDir` にコピーしません。翻訳後のURLが指す場所にスクリーンショットファイルを配置するか、翻訳後にパスを書き換えるために `postProcessing.regexAdjustments` を使用する必要があります。

翻訳可能なテキストを含むSVGファイルについては、`svg` ブロックと `translate-svg` を使用してください — [`svg`](#svg) を参照してください。

完全な意思決定ガイド、設定例とディレクトリレイアウトのすべてのパターン、スクリーンショットスクリプトの契約、デザインの推奨事項、一般的な間違いについては、[ロケールアセットガイド](LOCALE-ASSETS-GUIDE.ja.md)をご覧ください。

**クイックリファレンス — 5つのパターン**

| パターン                      | 使用用途                                               | メカニズム                                         |
|------------------------------|-------------------------------------------------------|---------------------------------------------------|
| A — 共有ラスター            | 単一画像、ロケールごとのバリエーションなし                  | ファイルごとのリンクリライター。通常は正規表現不要          |
| B — ロケールごとのフォルダ        | `"flat"`, `"docusaurus"`, `"astro-starlight"` README/ドキュメント | `regexAdjustments` ロケールセグメントの置換            |
| C — Docusaurus共配置     | `docsOutput.style = "docusaurus"` サイト | スクリーンショットスクリプトがファイルを配置。正規表現不要          |
| D — 翻訳済みSVG           | SVGイラストを埋め込むWebアプリ                  | `translate-svg` と `svg.style = "flat"`         |
| E — 共配置された翻訳SVG | `docsOutput.style = "docusaurus"` ドキュメント          | `translate-svg` と `svg.style = "nested"` + `pathTemplate` |

**フラットリンクリライターと2段階のフロー**

`docsOutput.style = "flat"` 時、`postProcessing` の前に組み込みのリライターが実行されます。出力ファイルごとに深さプレフィックス（出力ファイルのディレクトリからソースファイルのディレクトリへの相対パス）を計算し、非markdownアセットのURLの先頭に追加します。その後 `postProcessing` がすでにプレフィックスが付いたURLに対して実行されます — リードする `../` プレフィックスではなく、URL内のロケールセグメントにマッチするように `search` パターンを記述してください。

`flatPreserveRelativeDir: true`を使用すると、サブディレクトリ内のソースファイルには自動的にファイル固有のプレフィックスが付与されます。例えば、`docs/GETTING_STARTED.md` → `translated-docs/docs/GETTING_STARTED.<locale>.md`は`../../docs/`のプレフィックスを生成するため、`translation-dashboard.png`（ソースの兄弟）は`../../docs/translation-dashboard.png`となり、`postProcessing`ルールなしで正しく解決されます。

`docsOutput.style` が `"docusaurus"`、`"astro-starlight"`、`"nested"`、または `"flat"` 以外の値の場合、フラットリンクリライターは実行されません。`postProcessing` は元のMarkdown URLをそのまま認識します。

**パターンAの例** — `docsOutput.style = "flat"` の場合、ソースファイルと同じディレクトリにある相対パスのアセットに対しては設定は不要です。パターンAの`postProcessing`ルールは、絶対URLのアセット（例：`/img/...`）やCDN向けの置換の場合にのみ必要です。

**パターンBの例 — `docsOutput.style = "flat"` README**（`examples/nextjs-app`、2番目の`docs[]`ブロック）

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

ハードコーディングされたソースロケールではなく、一般的な`[^/]+`形式を使用してください。これにより、`sourceLocale`が変更された場合でもルールが機能し続けます。

**パターンBの例 — `docsOutput.style = "docusaurus"`**（`examples/nextjs-app`、1番目の`docs[]`ブロック）

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/[^/]+/",
  "replace": "screenshots/${translatedLocale}/"
}
```

**パターンC — Docusaurusに同梱** (`regexAdjustments`は不要)

en-GBのスクリーンショットを`static/assets/`に配置し、`docs/assets → ../static/assets`にシンボリックリンクを作成します。`take-screenshots`スクリプトは他のロケールを直接`i18n/<locale>/…/current/assets/`に書き込みます。すべてのロケールのドキュメントは`../assets/name.png`を参照します - パスは安定しており、URLの書き換えは不要です。

**パターンDの例** (`examples/nextjs-app`, `svg.style = "flat"`)

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`images/*.svg` → `public/assets/`の下にロケールごとのファイル。アプリはロケールごとに: `<img src={`/assets/icon.${locale}.svg`} />`。

**最小限のREADMEのみの例**（`examples/console-app`）

`examples/console-app/ai-i18n-tools.config.json` は [言語切り替えポストプロセッシング](#language-switcher-languagelistblock) のみで `README.md` を `translated-docs/` に変換します。画像に関するルールは定義されていません。これは、READMEに隣接するラスターファイルが存在しない場合、またはホストが既に提供している絶対URLのみを使用する場合に適しています。

置換テンプレートでは、`${translatedLocale}` や `${translatedBasedir}` などのプレースホルダーが使用できます（全リストは [構成リファレンス](#configuration-reference) の `docsOutput.postProcessing.regexAdjustments` 行に記載されています）。

<a id="language-switcher-languagelistblock"></a>
#### 言語切り替えスイッチャー (`languageListBlock`)

翻訳されたMarkdownファイルに、ロケールごとのリンクを1つずつ含む **「他の言語で読む」** 行を挿入する場合に `docsOutput.postProcessing.languageListBlock` を使用します。各出力ファイルに対して `href` の値が相対的に計算されます。

このリポジトリでは、[README.md](../README.ja.md) および [docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md) で使用しています。`translate-docs` の処理後、各翻訳コピーには更新されたブロックが挿入されます。たとえば、[translated-docs/docs/GETTING_STARTED.de.md](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) は、`translated-docs/docs/` 配下の対応するロケールファイルおよび英語ソースの `../../docs/GETTING_STARTED.md` へリンクします。

**1. ソースMarkdown内のブロックをマークする**

スイッチャーを、`start` および `end` の部分文字列マーカーで囲まれたHTML（または任意の行）で囲みます。このリポジトリでは以下を使用しています。

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](../../docs/../translated-docs/docs/GETTING_STARTED.de.md) · …</small>
```

初期のリンクテキストはプレースホルダーです。`translate-docs` は、最初に `start` を含む行から、その後に現れる最初の `end` を含む行までを完全に置き換えます（コードブロック内のマーカーは無視されるため、同じファイル内の設定例などが対象になることはありません）。

**2. ブロックを設定する**

`start` および `end` は任意の部分文字列マーカーです。`<small id="lang-list">` / `</small>` である必要はありません。言語スイッチャーブロック内でのみ出現する開始・終了テキストを自由に選択できます。たとえば別のHTMLタグ（`<div class="lang-switcher">` … `</div>`）、HTMLコメント（`<!-- lang-list -->` … `<!-- /lang-list -->`）、またはMarkdown専用の境界（たとえば `**Languages:**` から `---` までの行）などです。ソースファイルに記述した内容と完全に一致するように、設定ファイル内の `start` および `end` を設定してください。

ルート設定 ([ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| フィールド       | 機能                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | ブロックの開始行を識別する部分文字列                                                  |
| `end`       | 終了行の部分文字列（開始と終了が同一行にある場合は、`start` と同じ行に置くことも可能）             |
| `separator` | 生成された `[label](../../docs/href)` リンク間に挿入されるテキスト（このリポジトリでは `" · "` を使用）                                    |
| `label`     | 任意：`"local"`（デフォルト）はマニフェストの各ロケールの自国語表記を使用。`"english"` は `englishName` を使用 |

**3. 実行時の処理**

1. **抽出** — 言語リストのスライスはモデルに**送信されません**（`translatable: false`）。
2. **翻訳ファイルごとの処理** — セグメントの翻訳およびオプションのフラットリンク書き換えの後、`postProcessing` がブロックを再構築します。ロケールごとに1つのMarkdownリンクを作成し、ラベルは `ui-languages.json` が存在する場合はそこから取得（ない場合はバンドルされたマスターカタログ、または `localeDisplayNames` を使用）、パスは書き込み対象ファイルからの相対パスで設定されます。
3. **ソースの更新** — `translate-docs` / `sync` ドキュメント処理の最後に、同じ標準ブロックが `contentPaths` の**英語ソースファイル** に再書き込みされます。これにより、新しいロケールを追加しても、すべてのリンクを手動で編集せずにリポジトリ内のスイッチャーを更新できます。

ファイルに一致するブロックが存在しない場合、CLIは警告をログ出力します（`--verbose` 時）が、本文は変更されません。

**4. ラベルマニフェスト**

自国語ラベル（`label: "local"`）を使用する場合、`generate-ui-languages` を使用して `ui-languages.json` を生成または管理します（[`uiLanguagesPath`](#uilanguagespath-optional) 参照）。このリポジトリのドキュメント専用設定ではUIパイプラインがないため、ラベルは `sourceLocale` + `targetLocales` のバンドルされたマスターカタログから取得されます。

**5. このリポジトリ内の例**

| 例                                 | ファイル                                                                                                                                                                                       |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| このパッケージ（フラットドキュメント＋サブディレクトリ） | [ai-i18n-tools.config.json](../../docs/../ai-i18n-tools.config.json)（`docsOutput.style = "flat"`）、[README.md](../README.ja.md)、[docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md)、出力先 [translated-docs/](../../docs/../translated-docs/) |
| 最小限のREADMEのみ                 | [examples/console-app/ai-i18n-tools.config.json](../../docs/../examples/console-app/ai-i18n-tools.config.json)（`docsOutput.style = "flat"`）、[examples/console-app/README.md](../../docs/../examples/console-app/README.md)                     |
| フラットREADME＋Docusaurusドキュメント | [examples/nextjs-app/ai-i18n-tools.config.json](../../docs/../examples/nextjs-app/ai-i18n-tools.config.json)（2番目のブロック：`docsOutput.style = "flat"`；1番目のブロック：`docsOutput.style = "docusaurus"`）                                                     |

`<small id="lang-list">` の直前の行（例：`**Read in other languages:**`）は通常の翻訳対象セグメントであり、各ターゲットロケールでローカライズされます。マーカー内のリンク行は、`href` およびマニフェスト駆動のラベルを除き、そのまま再生成されます。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` プレースホルダー

翻訳されたファイルの出力先を `docs[].docsOutput.pathTemplate`（MarkdownおよびMDX）または `jsonPathTemplate`（JSONラベルファイル）で上書きできます。どちらも同じプレースホルダーを使用可能です。解決されたパスは、そのブロックの `outputDir` 内に留まる必要があります（CLIは外部に脱出するパスを拒否します）。

カスタム `pathTemplate` を使用する場合、明示的に設定しない限り `rewriteRelativeLinks` はデフォルトで `false` になります — 相対リンクの再書き込みは、カスタムテンプレートなしの `docsOutput.style = "flat"` 向けに設計されています。

組み込みレイアウト（`nested`、`flat`、`doc-system`、カスタムテンプレートなし）では、`docsOutput.localePathLowercase` を `true` に設定することで、ロケールのフォルダーやファイル名のセグメントを小文字で出力できます（例：`pt-BR` の代わりに `pt-br`）。`astro-starlight` エイリアスはこれをデフォルトで `true` に設定します。カスタムの `pathTemplate` / `jsonPathTemplate` 値は変更されません — BCP-47 形式の `{locale}` を維持しつつ小文字のセグメントが必要な場合は、そちらで `{llocale}` を使用してください。

| プレースホルダー            | 役割                                                                                                       | 例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | このドキュメントブロックの `outputDir` の絶対パス（解決済み）                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | ターゲットロケールコード（設定/CLIと同じ形式） | `de`, `pt-BR` |
| `{LOCALE}` | 同じロケールを大文字にしたもの | `DE`, `PT-BR` |
| `{llocale}`            | 同じロケールを小文字にしたもの（`pt-br`、`zh-cn` などの Astro ルートフォルダと一致）                               | `de`、`pt-br`                                                    |
| `{relPath}` | プロジェクトルートからの相対ソースファイルパス（POSIX `/`） | `docs/guide.md`, `README.md` |
| `{stem}` | 拡張子 **なし**のファイル名 | `guide` for `docs/guide.md` |
| `{basename}` | 拡張子付きのファイル名 **with** | `guide.md` |
| `{extension}` | 拡張子 **を含む** ドット | `.md`, `.mdx` |
| `{docsRoot}`           | `docsOutput.docsRoot` の絶対パス（省略時はデフォルトで `docs`）                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | パス文字列が一致する場合、対応する `docsRoot` プレフィックスを削除した `{relPath}`（POSIX準拠）。それ以外の場合は変更なし | `docs/guide.md`（一般的）; 削除が適用される場合のみ `guide.md` |

**例**

設定の抜粋:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

ロケール `de`、ソース `docs/guide.md`、プロジェクトルート `/home/acme/repo`、および `outputDir` が `/home/acme/repo/i18n` に解決される場合、展開されたパスは次のようになります:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`docsOutput.style = "flat"` とカスタム `pathTemplate` なしの場合、よく使われるパターンとして `{stem}` と `{extension}` を使ってファイル名のみを保持する方法があります（例：`{outputDir}/{stem}.{locale}{extension}`）。これにより、解決された `outputDir` の下に `…/guide.de.md` が出力されます。

<a id="troubleshooting"></a>
### トラブルシューティング

**翻訳されたドキュメントでセクションアンカーリンクが機能しない**

`[label](../../docs/other.md#section-id)`のようなリンクは、正しい翻訳済みファイルを開くことはできるが、目的の見出しにスクロールできなかったり、誤ったセクションにジャンプしたりする可能性がある。`#…`のフラグメントは、そのロケールのどの見出し`id`とも一致しなくなっている。

一般的な原因:

- ソースの見出しに明示的なアンカーIDが設定されていない。サイトは表示されている見出しテキストからスラグを生成しているため、翻訳後に変更される。
- ソースで見出し名を変更したが、直前の`<a id="…"></a>`行が欠落しているか、古いIDのままになっている。
- アンカーリンクが英単語から推測された`#…`フラグメントを使用しており、`write-heading-ids`が生成するIDではなくなっている。

**修正方法**

1. **ソース**の `.md` / `.mdx`（`translate-docs` と同じ `docs[]` / `contentPaths`）で `ai-i18n-tools write-heading-ids` を実行します。ATX見出しの直前に `<a id="slug"></a>` を挿入するか、見出しのテキストが現在のスラッグと一致しない場合に既存のアンカーを更新します。
2. それらのIDを指すようにアンカーリンクを設定します — たとえば、`[setup](../../docs/guide.md#first-run)` の `#first-run` は英語のタイトルから推論されたスラッグではなく、対象となる見出しの上にあるアンカー行と一致する必要があります。
3. `translate-docs`（または `sync --force-update`）を再実行して、すべてのロケールのコピーに更新されたアンカー行が含まれるようにします。

`--dry-run` を `write-heading-ids` でまず使用して変更内容をプレビューしてください。完全なパターンについては、[フラットレイアウトでのアンカーリンク](#anchor-links-when-docsoutputstyle--flat) を参照してください。

---

<a id="workflow-3---json-file-translation"></a>
## ワークフロー 3 - JSONファイルの翻訳

UIの文言をソース内の `t("…")` ではなく、ロケールごとの**ネストされたJSONファイル**（例: `src/i18n/en/translation.json`）に保存するプロジェクト向けに設計されています。CLIはこれらのファイル内の文字列値を走査し、OpenRouterを介して翻訳を行い、`json[].outputPathTemplate` を使ってロケールごとの出力を書き出します。`translate-docs` および `translate-svg`（`cacheDir`）と同じSQLiteキャッシュを使用します。

このワークフローは実行**しません**`extract` — `strings.json`カタログがありません。それを`features.translateJson`とトップレベルの`json[]`内の1つ以上のエントリで有効にしてください。

<a id="step-1-initialise-for-nested-json"></a>
### ステップ 1: ネストされたJSON向けに初期化

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

このテンプレートは `features.translateJson: true` を設定し、UI抽出およびドキュメント翻訳を無効化し、`src/i18n/en/translation.json` を指し、出力先が `src/i18n/{llocale}/translation.json` である単一の `json[]` ブロックをスキャフォールドします。リポジトリのレイアウトに合わせて `sourceLocale`、`targetLocales`、`contentPaths`、`outputPathTemplate` を編集してください。

<a id="step-2-configure-json"></a>
### ステップ 2: `json[]` の設定

各 `json[]` ブロックは1つのパイプラインを記述します:

- `contentPaths` — 1つ以上の `.json` ファイル、ディレクトリ、またはグロブ（例: `"src/i18n/en/translation.json"` または `"src/i18n/en/overrides/*.json"`）。パスはプロジェクトルートから解決されます。
- `outputPathTemplate` — 必須。各ターゲットロケールファイルの書き出し先。プレースホルダー: `{locale}`、`{LOCALE}`、`{llocale}`（小文字のロケール。Astroのルートフォルダーに便利）、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。
- `targetLocales`（オプション）— このブロックのみのサブセット。指定しない場合、ルートの `targetLocales` が適用されます。
- `keyPolicy` — どのJSONキーが翻訳対象の文章を保持しているか、安定した識別子かを区別します（以下参照）。
- `description`（オプション）— CLIのヘッダーおよび `status` 出力に表示されます。

例（複数のソースファイル、小文字ロケールフォルダー）:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | 動作 |
|-------------|-----------|
| `allowlist` | `translateKeys` に一致するキー（ドットパス、minimatchグロブ）のみ翻訳されます。 |
| `denylist`  | `skipKeys` に一致するキーを除き、すべての文字列値を翻訳します。 |
| `both`      | 最初に `translateKeys` を適用し、次に `skipKeys` からの一致を除外します。 |

パスにはドット表記（`nav.home.label`）を使用します。`slug` のような単独の名前は、任意の深さで最終キーのセグメントに一致します。

<a id="step-3-translate-json-bundles"></a>
### ステップ 3: JSONバンドルの翻訳

```bash
npx ai-i18n-tools translate-json
```

オプションフラグ（`translate-docs` と同じ概念）: ターゲットのサブセット用に `-l` / `--locale`、ファイルの制限用に `-p` / `--path`、`--dry-run`、`--force`（一致するファイルのファイル追跡およびセグメントキャッシュをクリア）、`--force-update`（ファイルハッシュが一致する場合に再処理。セグメントキャッシュは引き続き適用）、`-b` / `--batch-concurrency`、`--prompt-format`（`xml` \| `json-array` \| `json-object`）。

JSONのみのプロジェクトは以下を実行できます:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

UIまたはドキュメントも有効になっている場合、`sync` は **translate-docsの後にtranslate-json** を実行します（`--no-json` の場合を除く）。`--no-json` でJSONをスキップできます。

ファイルおよびロケールごとのカバレッジを確認してください:

```bash
npx ai-i18n-tools status
```

`translateJson` がオンの場合、`status` は `json[]` セクションを出力します（✓ 最新、● 古いまたは欠落）。

<a id="workflow-3-vs-other-pipelines"></a>
### ワークフロー3と他のパイプラインの比較

| 状況 | 使用方法 |
|-----------|-----|
| `t("…")` のUI文字列 / JS/TS/Astro内の`i18n.t("…")` | [ワークフロー1](#workflow-1---ui-translation) — `extract` + `translate-ui` |
| Markdown/MDX/`.astro` ページまたは README の翻訳 | [ワークフロー2](#workflow-2---document-translation) — `translate-docs` |
| Docusaurus `write-translations` カタログ (`{ "key": { "message": "…", "description": "…" } }`) | ワークフロー2 — `docs[].docusaurusCatalogDir` + `translate-docs`、**ただし** `json[]` は使用しない |
| 独立した入れ子構造のロケールJSON（ZenBrowser形式の`translation.json`ツリー） | ワークフロー3 — `json[]` + `translate-json` |
| `.svg` ファイル、`<text>` / `<title>` / `<desc>` を使用した図解 | `features.translateSVG` + [`svg`](#svg) + `translate-svg`（オプション。番号付きのワークフローではありません）|

フィールドリファレンス：[Configuration reference](#configuration-reference) 内の [`json`](#json)。クリーンアップ用のキャッシュキーは `file_tracking` 内の `json-block:{blockIndex}:{projectRelPath}` を使用します。

---

<a id="combined-workflow-ui--docs"></a>
## 統合ワークフロー（UI ＋ ドキュメント）

単一の設定ですべての機能を有効にして、両方のワークフローを同時に実行します:

<details>
<summary>UIとドキュメントの設定を統合した例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` は、ドキュメント翻訳をUIと同じ `strings.json` カタログを指すようにして用語の一貫性を保ちます。`glossary.userGlossary` は製品用語のCSVオーバーライドを追加します。

`npx ai-i18n-tools sync` を実行して1つのパイプラインを実行します：`features.translateUIStrings` が有効な場合、まず**抽出**し、次に**UI文字列を翻訳**します。オプションで**SVGの翻訳**（`features.translateSVG` + `svg` ブロック）を実行。次に**ドキュメントの翻訳**（設定された`docs[]`を使用）。その後、オプションで**translate-json**（`features.translateJson` + `json[]`）を実行します。`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`を使用して、特定の部分をスキップできます。ドキュメントと`json[]`のステップは、`--dry-run`、`-p` / `--path`、`--force`、`--force-update`を受け入れます（`--no-docs`が設定されている場合、ドキュメント専用のフラグは無視されます。`--no-json`が設定されていない場合、JSONは同じキャッシュフラグを使用します）。

ブロックに対して`docs[].targetLocales`を使用すると、そのブロックのファイルをUIよりも**少ないロケール数**に翻訳できます（有効なドキュメントロケールはブロック間の**和集合**になります）：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docsoutputstyle--docusaurus--flat"></a>
### 混合ドキュメントワークフロー（`docsOutput.style = "docusaurus"` + `"flat"`）

設定ファイル内で `docs` に複数のエントリを追加することで、同じ設定で複数のドキュメントパイプラインを組み合わせることができます。これは、Docusaurusサイト（`docsOutput.style = "docusaurus"`）とルートレベルのMarkdownファイル（たとえば、ロケール接尾辞付きファイル名で翻訳すべきリポジトリのREADME（`docsOutput.style = "flat"`））を併せ持つプロジェクトでよく見られる構成です。

<details>
<summary>DocusaurusとフラットなREADME設定を組み合わせた例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

`npx ai-i18n-tools sync` で実行した場合の動作:

- UI文字列は `src/` から `public/locales/` へ抽出／翻訳されます。
- 最初のドキュメントブロックは、`docs-site/docs/` から `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` へ**Markdown**を翻訳します（ローカライズされたドキュメントページ）。
- `docs[].docusaurusCatalogDir` を設定し、`features.translateDocs` を有効にすると、同じブロックが `docs-site/i18n/en/` 配下の各ターゲットロケールフォルダーに**DocusaurusシェルJSON**も翻訳します（ナビゲーションバー、フッター、テーマ／プラグインカタログなど。MDX本文は対象外）。
- 2番目のドキュメントブロックは、`README.md` を `translated-docs/` 配下のロケール接尾辞付きファイルに翻訳します（`docsOutput.style = "flat"`）。
- すべてのドキュメントブロックは `cacheDir` を共有するため、変更されていないセグメントは実行間で再利用され、API 呼び出し回数とコストを削減します。

---

<a id="translation-dashboard"></a>
## 翻訳ダッシュボード

実行方法：

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

デフォルトのリッスンポートは **8675** です。そのポートが使用できない場合、サーバーは次のポートを試行します（最大1000回の試行）し、使用したポートをログに出力します。非推奨のエイリアス `editor` は引き続き機能しますが警告を出力します。代わりに `dashboard` を使用してください。

これは、設定済みの`cacheDir` SQLiteデータベースをバックエンドとするローカルWeb UIを起動します。CLIがドキュメントセグメント、ログ、関連メタデータに使用するのと同じフォルダーです。タブには**ドキュメント**（キャッシュされたドキュメントセグメント）、**UI文字列**、**UI複数形**、**用語集**、**失敗**、**Markdownの問題**、および**統計**が含まれます。

![Translation Dashboard](../../docs/translation-dashboard.png)

このアプリでキャッシュ行（たとえばドキュメントセグメント）を**編集する場合**、ディスク上の出力がキャッシュと一致するように、`sync --force-update`または同等の翻訳コマンドを`--force-update`オプション付きで実行してください。後でリポジトリ内の**ソーステキスト**が変更されると、セグメントのハッシュが変化し、以前のテキストに対する手動編集は上書きされます。

<a id="failures-document-translation"></a>
### 失敗（ドキュメント翻訳）

**失敗**タブは、**ドキュメント**の翻訳にのみ関連します。翻訳セグメントが特定のロケールに対して正常に翻訳できなかった場合にSQLiteに書き込まれる失敗レコードを読み取ります。たとえば、空または無効なモデル出力、翻訳後の検証エラー（`AST mismatch`、プレースホルダーリーク、および類似の**品質**チェック）、または進行をブロックする**致命的**な状態などです。これにより、次の質問に答えることができます：*どのソースセグメントが、どのロケールおよびモデルで壊れたのか、そしてどのようなエラーテキストが記録されたのか？*

<a id="when-to-use-it"></a>
#### 使用するタイミング

- `translate-docs` または `sync` がエラー、部分的なロケール、またはわかりにくいログで終了した後は、ターミナル出力だけをスクロールするのではなく、失敗をソート・フィルタリングできます。
- **再作業を優先**したい場合：**# Failures（失敗回数）**でソートすると、リトライを繰り返しても失敗が続くセグメントが上位に表示されます。これらは将来の実行を成功させるために、ソースMarkdownで**簡略化または再フォーマット**すべき候補です。
- **正確なセグメント**（ファイルパス、行ヒント、ソースハッシュ、完全なソーステキスト）が必要な場合—リポジトリ内の正しい段落を編集できます。

<a id="why-source-edits-matter"></a>
#### ソース編集が重要な理由

インラインマークアップが凝縮している（**太字**と`` `code` ``が混在、強調が入れ子になっている、多くのスパンを含む長文）と、モデルが構造チェックを通過する翻訳を返すのが難しくなります。**複数回の失敗記録がある**セグメントは、変更しないテキストで翻訳を再実行するよりも、ソースの**書き直しまたは分割**（または例をフェンス付きコードブロックに移動）により、通常はより改善されます。これは[複雑なMarkdownと品質チェックの失敗](#complex-markdown-and-failed-quality-checks)と一致しています。

<a id="how-to-use-the-tab"></a>
#### タブの使い方

1. ダッシュボードで **失敗**を開く（[翻訳ダッシュボード](#translation-dashboard) と同じブラウザセッションを使用）。
2. **概要**バーを確認する（いずれかの失敗があるセグメント、および **1**、**2**、**3+** 件の失敗レコードを持つセグメントの件数を含む）。
3. 部分一致する **ファイル名**、**ロケール**、**モデル**、**品質エラー**（値はキャッシュから取得）、**致命的エラーのみ**、および任意の **ソースハッシュ**、**ソーステキスト**、または **エラーメッセージ** の部分文字列でフィルターし、**適用**をクリックする。
4. **並べ替え: 失敗数**（デフォルト）または **並べ替え: ファイルパス + 行番号** を選択する。
5. テーブルの上部または下部にページネーションを使用します。**行をクリック**して、完全なソーステキストの表示を切り替えます。行内のリンクコントロール（有効な場合）は、`ai-i18n-tools dashboard`が実行中の**ターミナル**にファイル/行のヒントをログ出力するようサーバープロセスに要求します。これは、ブラウザからエディタへジャンプする際に便利です。
6. プロジェクト内の**ソースファイル**を修正し、その後 `translate-docs` または `sync` を再実行します。成功した実行後にリストが**古くなっているように見える**場合は、`ai-i18n-tools sync --force-update` を実行してダッシュボードを再読み込みしてください（「失敗」パネルも同じヒントを表示します）。

UI と並行してファイル単位のデバッグを行う場合、リトライ中に `translate-docs --debug-failed` を使用して `cacheDir` の下に `FAILED-TRANSLATION` の詳細を書き出すこともできます。詳細は [キャッシュの動作および `translate-docs` フラグ](#cache-behaviour-and-translate-docs-flags) を参照してください。

<a id="markdown-issues-static-checks"></a>
### Markdownの問題（静的チェック）

The **Markdownの問題**タブには、`markdown_source_issues` SQLiteテーブルの行が一覧表示されます。各行は**前翻訳**の検出結果です。例としては、強調/取り消し線としてペアにならない区切り文字の連続（`translate-docs`がマスキングに使用するのと同じCommonMark形式のルールに基づく）、バッククォートで開始されたが閉じられていないインラインコードスパン、または`STRONG_OUTSIDE_LINK`の場合、`**` / `__`が`[text](../../docs/url)`リンクを囲む（リンクテキスト内にのみ太字を入れる）などがあります。これは**ではない**、ロケールごとのモデル出力と翻訳後の検証の問題（`AST mismatch`、プレースホルダーの漏れなど）を記録する**失敗**と同じものではありません。

トークンを使用する前に**ソースのマークダウン**を修正したい場合に、このタブを使用します。特に品質チェックが構造の面で繰り返し失敗する場合に有効です。ファイルパス（キャッシュキーに対する部分一致、`doc-block:{index}:` プレフィックスを含む）、**問題コード**、または**ソースハッシュ**でフィルタリングできます。ファイルパス＋行番号、または最新のスキャン時刻でソート可能です。リンクボタンは、`ai-i18n-tools dashboard` 実行中のターミナルにファイル/行のヒントをログ出力します（「ドキュメント」タブと同様の仕組みです）。

**行の更新:** `ai-i18n-tools check-markdown` を実行します (オプションで `-p` / `--path` スコープ、SQLite をスキップするには `--no-cache`、stderr に人間の可読な行を、stdout に機械可読な出力を表示するには `--json` を使用します)。デフォルトでは、`docs[].warnMarkdownSourceIssues` が `false` に設定されていない場合、各 `translate-docs` マークダウンファイル実行は、そのファイルの行も再スキャンして置き換えます。キャッシュファイルパスのすべての翻訳をクリアすると、失敗と同じクリーンアップパスの一部として、そのファイルパスのマークダウン問題行が削除されます。`cleanup` は、解決されたソースパスがディスク上にないマークダウン問題行をさらに削除するため、削除または名前変更されたファイル (`check-markdown` でスキャンされただけで、翻訳されたことのないファイルでも) の診断が残ることはありません。

---

<a id="configuration-reference"></a>
## 設定リファレンス

<a id="sourcelocale"></a>
### `sourceLocale`

ソース言語のBCP-47コード（例：`"en-GB"`、`"en"`、`"pt-BR"`）。このロケール用の翻訳ファイルは生成されません — キー文字列自体がソーステキストとなります。

**実行時i18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされた`SOURCE_LOCALE`と一致している必要があります**。

<a id="targetlocales"></a>
### `targetLocales`

翻訳対象のBCP-47ロケールコードの配列（例：`["de", "fr", "es", "pt-BR"]`）。

`targetLocales`はUI翻訳のための主要なロケールリストであり、ドキュメントブロックのデフォルトロケールリストでもあります。`generate-ui-languages`を使用して、`sourceLocale`と`targetLocales`から`ui-languages.json`マニフェストを構築します。

<a id="uilanguage-optional"></a>
### `uiLanguage`（オプション）

ツールのUI言語（CLIヘルプ、ログ/サマリー、翻訳ダッシュボード）のBCP-47コード。これは`sourceLocale` / `targetLocales`とは独立しており、`-L` / `--ui-lang`フラグおよび`AI_I18N_LANG`環境変数によって上書きされます。不明な値はソースロケール（`en-GB`）に安全にフォールバックします。厳密な検証はありません。[ツールのUI言語](#tool-ui-language)を参照してください。

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（オプション）

表示名、ロケールフィルタリング、言語リストの後処理に使用される`ui-languages.json`マニフェストへのパス。省略された場合、CLIは`ui.flatOutputDir/ui-languages.json`にマニフェストがあるかを検索します。

以下のときに使用します：

- マニフェストは `ui.flatOutputDir` の外にあり、CLI で明示的にそれを指し示す必要があります。
- [言語切り替えポストプロセッシング](#language-switcher-languagelistblock)（`languageListBlock`）を使用して、マニフェストからロケールラベルを生成したい場合。
- `extract` はマニフェスト内の `englishName` エントリを `strings.json` にマージする必要があります（`ui.reactExtractor.includeUiLanguageEnglishNames: true` が必要です）。

<a id="concurrency-optional"></a>
### `concurrency`（オプション）

同時に翻訳される最大**ターゲットロケール数**（`translate-ui`、`translate-docs`、`translate-svg`、および`sync`内の対応するステップ）。省略された場合、CLIはUI翻訳に**4**、ドキュメント翻訳に**3**を使用します（組み込みのデフォルト）。実行ごとに`-j` / `--concurrency`で上書きできます。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（オプション）

**translate-docs**および**translate-svg**（および`sync`のドキュメント翻訳ステップ）：ファイルごとの最大並列OpenRouter**バッチ**リクエスト数（各バッチには多数のセグメントを含められます）。省略時はデフォルトで**4**。`translate-ui`では無視されます。`-b` / `--batch-concurrency`で上書き可能。`sync`では、`-b`はドキュメント翻訳ステップにのみ適用されます。

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (オプション)

同一ロケール内で同時に処理されるファイルの最大数 **（`translate-docs` および `sync` の間）**。**1** より大きい値に設定すると、同じロケール内のファイルがメモリ使用量を制御するセマフォを使用して並行して処理されます。省略した場合のデフォルトは **1**（逐次処理）です。より高い値は、特にすべてのセグメントがすでにキャッシュされている場合（API 呼び出しが不要な場合）、I/O バウンド操作のスループットを大幅に改善できます。

**例:**

```json
{
  "fileConcurrency": 4
}
```

**使用例:** キャッシュヒット率100%で`sync --force-update`を実行する際に、この値を`2-4`に設定して総処理時間を短縮します。この改善は、多数の小規模ファイルを処理する場合に特に顕著です。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（オプション）

ドキュメント翻訳のセグメントバッチ処理：APIリクエストごとのセグメント数と文字数の上限。デフォルト：**20**セグメント、**4096**文字（省略時）。

<a id="openrouter"></a>
### `provider` と `providers`

`provider`（トップレベル、オプション）は、`providers`からアクティブなプロバイダーキーを選択します。プロバイダーが1つだけ設定されている場合はオプションですが、複数設定されている場合は必須です。

`providers`（トップレベル）は、プロバイダーキーをそのブロックにマッピングします。組み込みキー（以下のプリセットテーブルを参照）には`translationModels`のみが必要ですが、その他のキーはカスタムのOpenAI互換エンドポイントを定義し、`baseUrl`（エンドポイントがキーを必要としない場合を除き、`apiKeyEnv`も）が必要です。

各`providers.<name>`ブロックは以下を受け入れます：

- `translationModels`
  モデルIDの優先順位付きリスト（プレフィックス`provider/`なしのプレーンなアップストリームID。OpenRouter IDはネイティブの`vendor/model`形式を維持します）。最初に試行され、エラーが発生した場合は後続のエントリがフォールバックとなります。`translate-ui`の場合のみ、このリストの前に1つのモデルを試すために`ui.preferredModel`を設定することもできます（`ui`を参照）。
- `baseUrl`
  OpenAI互換のベースURL。プリセットのベースURLをオーバーライドします。プリセット以外のプロバイダーには必須です。
- `apiKeyEnv`
  APIキーを含む環境変数。プリセットの環境変数をオーバーライドします。
- `headers`
  追加のHTTPヘッダー。このプロバイダーへのすべてのリクエストと共に送信されます。
- `maxTokens`
  リクエストあたりの最大完了トークン数。デフォルト：`8192`。
- `temperature`
  サンプリング温度。デフォルト：`0.2`。
- `requestTimeoutMs`
  各リクエストの待機時間（ミリ秒）。デフォルト：`30000`（30秒）。

組み込みプロバイダープリセット（キー — ベースURL — APIキー環境変数）：

| プロバイダー | ベースURL | APIキー環境変数 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
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

レガシーなトップレベルの`openrouter`ブロック（`baseUrl`、`translationModels`、`defaultModel`、`fallbackModel`、`maxTokens`、`temperature`、`requestTimeoutMs`を含む）も引き続き受け入れられ、ロード時に`providers.openrouter`（`provider: "openrouter"`を含む）に自動移行されます。`defaultModel` / `fallbackModel`は`translationModels`に折りたたまれます。

`-P` を使用して、1 つの構成で複数のプロバイダーを構成し、それらを切り替える実行可能な例については、[`examples/multi-provider`](../../docs/../examples/multi-provider/) を参照してください（同じドキュメントの `openai`、`anthropic`、`nvidia`、および `deepseek`）。

**複数のモデルを使用する理由：** プロバイダーおよびモデルによってコストが異なり、言語やロケールごとに品質レベルが異なります。`translationModels`を単一のモデルではなく、順序付きフォールバックチェーンとして**設定**することで、リクエストが失敗した場合にCLIが次のモデルを試行できるようにします。

以下のリストは拡張可能な**ベースライン**として扱ってください。特定のロケールの翻訳が不十分または失敗する場合は、その言語またはスクリプトを効果的にサポートするモデルを調査し（オンラインリソースまたはプロバイダーのドキュメントを参照）、それらのOpenRouter IDをさらに代替手段として追加してください。

このリストは、36の対象ロケールを持つ大規模なドキュメンテーションプロジェクトで**広範なロケール対応のテスト**が行われました。実用的なデフォルトとして機能しますが、すべてのロケールで良好に動作する保証はありません。

例 `translationModels`（`npx ai-i18n-tools init`と同じデフォルト値）:

<details>
<summary>デフォルトのtranslationModelsフォールバックリスト</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

<br />

アクティブなプロバイダーのAPIキー環境変数（例：`OPENROUTER_API_KEY`）を環境または`.env`ファイルに設定します。

`translationModels`を変更する前に、`npx ai-i18n-tools check-models`を実行してください。このコマンドはすべてのプロバイダーに対して、設定されたモデルIDをそのプロバイダーの実際のモデル一覧（`GET /models`）と照合し、存在しないIDや`expiration_date`を過ぎたIDを報告し、有効なモデルの一覧を表示します。また、設定されたIDのいずれかが無効な場合、終了ステータスは非ゼロになります。プロバイダーが価格情報を返す場合（例：OpenRouter）、入力／出力の推定価格（100万トークンあたりの米ドル）も表示されます。

<a id="features"></a>
### `features`

| フィールド | ワークフロー | 説明 |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translateUIStrings` | 1 | `t("…")` / `i18n.t("…")` を `strings.json` に抽出し、エントリを翻訳してロケールごとのフラットな JSON を作成します（抽出は自動的に実行されます。カタログの更新のみを行う場合は、スタンドアロンの `extract` を使用します）。 |
| `translateDocs` | 2 | `.md` / `.mdx` / `.astro` ページを翻訳。`docs[].docusaurusCatalogDir` が設定されている場合は Docusaurus シェルの JSON になります。 |
| `translateJson` | 3 | `json[]` 配下の任意のネストされた JSON（`translate-json`）。 |
| `translateSVG` | — | `.svg` ファイルを翻訳（トップレベルの `svg` ブロックが必要です）。 |

`features.translateSVG` が true かつトップレベルの `svg` ブロックが設定されている場合、`translate-svg` で **SVG** ファイルを翻訳します。`sync` コマンドは、両方が設定されている場合にそのステップを実行します（`--no-svg` でない限り）。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  `t("…")`呼び出しをスキャンするディレクトリまたはグロブパターン（カレントディレクトリからの相対パス）。`src/`や`["src/**/*.ts"]`のようなパターンをサポートします。
- `stringsJson`  
  マスターカタログファイルへのパス。`extract`によって更新されます。
- `flatOutputDir`  
  ロケールごとのJSONファイル（`de.json`など）が書き込まれるディレクトリ。
- `preferredModel`  
  オプション。`translate-ui`のみで最初に試行されるモデルID。その後、アクティブなプロバイダーの`translationModels`が順に試行され、このIDの重複はありません。
- `uiExtractor.funcNames`（またはレガシー`reactExtractor.funcNames`）  
  スキャンする追加の関数名（デフォルト：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（またはレガシー`reactExtractor.extensions`）  
  含めるファイル拡張子（デフォルト：`[".js", ".jsx", ".ts", ".tsx"]`）。Astroフロントマターおよびテンプレート式用に`.astro`を追加します。
- `uiExtractor.includePackageDescription`（またはレガシー`reactExtractor.includePackageDescription`）  
  `true`（デフォルト）の場合、`extract`は、存在する場合、UI文字列として`package.json` `description`も含まれます。
- `uiExtractor.packageJsonPath`（またはレガシー`reactExtractor.packageJsonPath`）  
  オプションの説明抽出に使用される`package.json`ファイルへのカスタムパス。
- `uiExtractor.includeUiLanguageEnglishNames`（またはレガシー`reactExtractor.includeUiLanguageEnglishNames`）

`true` の場合（デフォルト `false`）、`extract` は、ソーススキャンから既に存在しない場合に、`uiLanguagesPath` のマニフェストから各 `englishName` を `strings.json` に追加します（同じハッシュキー）。有効な `ui-languages.json` を指す `uiLanguagesPath` が必要です。

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite キャッシュディレクトリ（すべての `docs` ブロックで共有）。実行間で再利用されます。カスタムのドキュメント翻訳キャッシュから移行する場合は、アーカイブまたは削除してください。`cacheDir` は独自の SQLite データベースを作成し、他のスキーマとは互換性がありません。

<a id="best-practice-for-git-exclusions"></a>
#### Git 除外のベストプラクティス:

- 一時的なキャッシュアーティファクトをコミットしないように、翻訳キャッシュフォルダーの内容を除外します（例: `.gitignore` または `.git/info/exclude` を使用）。
- `cache.db` を保持します（定期的に削除しないでください）。SQLite キャッシュを保持することで、変更されていないセグメントの再翻訳を防ぎます。これにより、`ai-i18n-tools` を使用するソフトウェアの更新や修正時に、ランタイムと API コストの両方を節約できます。
- バックアップやデバッグ関連のファイルをコミットしないように、一時ファイルとログファイルを除外します。

<br/>

**例:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

ドキュメントパイプラインブロックの配列。`translate-docs` および `sync` の docs フェーズは、各ブロックを順番に**処理します**。レガシーなキー（`documentations`、`markdownOutput`、`jsonSource`）は読み込み時に引き続き受け入れられ、設定ファイルが書き込み可能である場合に書き換えられます。新しい設定では、`docs`、`docsOutput`、`docusaurusCatalogDir` を使用してください。

**コンテンツソース**

- `description`
このブロックの任意の読み取り可能なメモ（翻訳では使用されません）。設定されている場合、`translate-docs` `🌐` ヘッドラインの先頭に付加され、`status` セクションヘッダーにも表示されます。
- `contentPaths`
翻訳対象の Markdown/MDX ページ本文および `.astro` テンプレート（`translate-docs` が `.md`、`.mdx`、`.astro` をスキャンします）。**ディレクトリパスまたはワイルドカードパターン**（例：`"docs/**/*.md"`、`"guides/*.mdx"`、`"src/pages/index.astro"`）をサポートします。ローカライズされたドキュメントの本文はここから取得されます。
- `sourceFiles`
読み込み時に `contentPaths` にマージされる任意のエイリアス。
- `targetLocales`
このブロックにのみ適用される任意のロケールのサブセット（指定しない場合はルートの `targetLocales` を使用）。有効なドキュメントロケールは、すべてのブロックの和集合となります。
- `docusaurusCatalogDir`
任意。このブロックの Docusaurus JSON ラベルカタログのソースディレクトリ（例：`"i18n/en"` から `docusaurus write-translations`）。ページ本文は常に `contentPaths` から取得されます。`docusaurusCatalogDir` はシェル/UI の JSON のみを提供し、MDX は対象外です。

**出力レイアウト**

- `outputDir`
このブロックの翻訳出力のルートディレクトリ。
- `docsOutput.style`
`"nested"`（デフォルト）、`"flat"`、`"doc-system"`、またはエイリアス `"docusaurus"` / `"astro-starlight"`。
- `docsOutput.localeSubpath`
`{locale}/` と `{relativeToDocsRoot}` の間の `doc-system` のパスセグメント（`style: "doc-system"` を直接使用する場合に必須。エイリアス使用時は事前設定済み）。Starlight スタイルのロケールフォルダには `""` を使用してください。
- `docsOutput.docsRoot`
Docusaurus レイアウトのソースドキュメントルート（例：`"docs"`）。
- `docsOutput.pathTemplate`
カスタム Markdown 出力パス。プレースホルダー：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `docsOutput.jsonPathTemplate`
ラベルファイルのカスタム JSON 出力パス。`pathTemplate` と同じプレースホルダーをサポートします。
- `docsOutput.localePathLowercase`
`true` の場合、組み込みの出力レイアウト（`nested`、`flat`、`doc-system` で `pathTemplate` なし）はパス内のロケールセグメントを小文字で使用します。デフォルトは `false`。`astro-starlight` および `doc-system` で `localeSubpath` が空の場合は、設定読み込み時にデフォルトで `true` になります。
- `docsOutput.flatPreserveRelativeDir`
`docsOutput.style = "flat"` の場合、ソースのサブディレクトリを保持して、同じベース名を持つファイルが衝突しないようにします。
- `docsOutput.rewriteRelativeLinks`
翻訳後に相対リンクを書き換える（`docsOutput.style = "flat"` かつカスタムの `pathTemplate` がない場合に自動有効）。
- `docsOutput.linkRewriteDocsRoot`
フラットリンクの書き換えプレフィックスを計算する際に使用するリポジトリルート。翻訳されたドキュメントが別のプロジェクトルート下にある場合を除き、通常は `"."` のままにしてください。

**ポストプロセス**

- `docsOutput.postProcessing`
翻訳された**Markdown本文**への任意の変換（YAMLキーおよび非本文のfront matter値は保持されます）。セグメントの再アセンブルおよびフラットリンクの書き換えの後、`addFrontmatter` の前に実行されます。
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` の順序付きリスト。`search` は正規表現パターンです（単純な文字列にはフラグ `g` または `/pattern/flags` を使用）。`replace` は `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` などのプレースホルダーをサポートします。
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — ソースおよび翻訳された Markdown 内で、「他の言語で読む」リンク行を再生成します。設定方法、動作、リポジトリの例については、[言語切り替え（`languageListBlock`）](#language-switcher-languagelistblock) を参照してください。

**動作とメタデータ**

- `translateFrontmatterFields`
`docsOutput` と同じレベル（`docs[]` ブロックごと）。デフォルトは `true`：Starlight/Docusaurus のユーザー向けYAMLプローズを翻訳（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next` ラベル）。`false` を設定すると、フロントマターブロック全体を変更せずに保持します。特定のドットパスに制限するには、文字列配列を渡します。
- `segmentSplitting`
`docsOutput` と同じレベル（`docs[]` ブロックごと）。`translate-docs` 抽出のためのオプションの細分化されたセグメント：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`。`enabled` が `true` の場合（`segmentSplitting` が省略された場合のデフォルト）、密度の高い段落、GFMパイプテーブル（最初のチャンクにはヘッダー、セパレーター、および最初のデータ行を含む）、長いリストが分割されます。サブパートは単一の改行で再結合されます（`tightJoinPrevious`）。`"enabled": false` を設定すると、空白行で区切られた本文ブロックごとに1つのセグメントのみを使用します。`qualityRetrySplit` が `true` の場合（デフォルト）、すべてのモデルを使い切った後にAST検証に失敗するMarkdownセグメントは段階的に分割され、最初のモデルから再試行されます。`maxQualityRetrySplitDepth`（デフォルトは `3`）は再帰的な分割を制限します。
- `warnMarkdownSourceIssues`
`true` の場合（省略された場合のデフォルト）、各 `translate-docs` 実行時にMarkdownセグメントをリスクのあるデリミタ／閉じられていないインラインコードについて再スキャンし、端末に警告を出力し、そのファイルのキャッシュファイルパスの `markdown_source_issues` 行を置き換えます。`false` を設定すると、このブロックの警告およびSQLiteの更新をスキップします。
- `addFrontmatter`
`true` の場合（省略された場合のデフォルト）、翻訳されたMarkdownファイルにはYAMLキーが含まれます：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`、および少なくとも1つのセグメントにモデルメタデータがある場合、`translation_models`（使用されたOpenRouterモデルIDのソート済みリスト）。スキップするには `false` に設定します。

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
省略可能。値が**引用符で囲まれた文字列**となる追加のJSX/HTML属性名で、翻訳に送信しないもの。組み込みの既定値（`class`、`id`、`style`、`src`、`href`、`type`、`data-*`、ほとんどの`aria-*`など）とマージされる。大文字小文字を区別しない。対象は以下のとおり。

- `.astro` パースして置換する抽出（静的HTMLタグおよび`attr=`内の`{expression}`ブロックの文字列リテラル）。
  - markdown/Astroセグメントの翻訳中にMDXプレースホルダーを抽出（大文字で始まるJSXタグの`label`、`tooltip`、`aria-label`、および該当する場合は`TabItem` `value`）。

例：`"protectAttributes": ["variant", "size"]`により、`variant="primary"`内の`{items.map(...)}`がすべてのロケールで変更されないまま保持される。

翻訳対象となる属性（たとえば`"title"`や`"aria-label"`）を、英語からそのままコピーしたい場合にもリストに含めることができます。

- `protectKeys`
省略可能。テンプレートの `{expression}` ブロックおよびMDXオブジェクトリテラル内（たとえば `label:` 内の `<Tabs values={[ … ]}>`）で、引用符で囲まれた文字列値を翻訳しない必要がある追加の **オブジェクトプロパティ名**。組み込みの既定値（`class`、`key`、`id`、`href`、`src` など）とマージされる。大文字小文字は区別しない。

例：`"protectKeys": ["slug", "code"]`により`{ slug: 'getting-started', title: 'Getting started' }`がスキップされる→`slug`が保護されている場合、`title`のみが翻訳される。

<br/>

**例（`docsOutput.style = "flat"` — スクリーンショットパス＋オプションの言語リストラッパー）：**

<details>
<summary>フラットレイアウトのpostProcessing例（スクリーンショット＋languageListBlock）</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

入れ子になったJSON翻訳パイプラインのトップレベル配列。`features.translateJson`がtrueの場合にのみ使用（`translate-json`または`sync`のJSONステージ）。[Workflow 3 - JSONファイルの翻訳](#workflow-3---json-file-translation)を参照してください。

| フィールド | 説明 |
|-------|-------------|
| `description` | CLI / `status`用のオプションの注釈（翻訳対象外）。 |
| `contentPaths` | プロジェクトルート以下のソース`.json`ファイル、ディレクトリ、またはグロブ。 |
| `outputPathTemplate` | 各ターゲットロケールごとの必須出力パス。プレースホルダー：`{locale}`、`{LOCALE}`、`{llocale}`、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。 |
| `targetLocales` | このブロック用のオプションのサブセット。指定しない場合、ルートの`targetLocales`を使用。 |
| `keyPolicy.mode` | `allowlist`、`denylist`、または`both`。 |
| `keyPolicy.translateKeys` | モードが`allowlist`または`both`の場合に含めるドットパス／グロブ。 |
| `keyPolicy.skipKeys` | 除外するドットパス／グロブ（デフォルトの拒否リストには`id`、`slug`、`href`、`url`、`key`、`code`が含まれます）。 |

<a id="svg"></a>
### `svg`

SVGファイルのトップレベルのパスとレイアウト。`features.translateSVG`がtrueの場合（`translate-svg`または`sync`のSVGステージ経由）にのみ翻訳が実行される。

| フィールド            | 説明                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 1つ以上のディレクトリ**またはグロブパターン**（例：`"images/*.svg"`、`"**/icons/*.svg"`）。これらのパターンはプロジェクトルートに対して相対的に解決され、`.svg`ファイルを再帰的にスキャンします。                                                                         |
| `outputDir`                   | 翻訳されたSVG出力のルートディレクトリ。                                                                                                                                                                                                                                          |
| `style`                       | `pathTemplate` が設定されていない場合のデフォルト値。`"flat"` または `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`   | カスタムSVG出力パス。使用可能なプレースホルダー: <code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
| `localePathLowercase` | `true` の場合、組み込みの `flat` / `nested` SVG レイアウトはロケールセグメントを小文字で使用します。カスタムの `pathTemplate` 値は変更されません。小文字のセグメントが必要な場合は `{llocale}` を使用してください。 |
| `forceLowercase` | SVGを再構成する際にテキストを小文字に変換します。すべて小文字のラベルに依存するデザインで有用です。                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| フィールド | 説明 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 既存の翻訳から自動的に用語集を生成するための `strings.json` へのパス。                                                                                                 |
| `userGlossary` | `Original language string`（または `en`）、`locale`、`Translation` の列を持つCSVファイルへのパス。各行は1つのソース用語と対象ロケールに対応します（`locale` はすべての対象言語で `*` でも可）。 |

**空の用語集CSVを生成する：**

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLIリファレンス

| コマンド                                                                                                    | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version`                                                                                                  | CLIのバージョンとビルドタイムスタンプを表示します（ルートプログラムの`-V` / `--version`と同一の情報）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `init [-t ui-markdown\|ui-docusaurus\|ui-starlight\|ui-astro-website\|ui-json-bundles] [-o path] [--with-translate-ignore]` | スターター設定ファイルを書き出す（`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`docs[].addFrontmatter`を含む）。`ui-json-bundles`はWorkflow 3をスキャフォールド（`json[]`のみ）。`--with-translate-ignore`はスターターの`.translate-ignore`を作成します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `check-models`                                                                                             |設定された各モデルIDをアクティブなプロバイダーの`GET /models`リスト（メンバーシップと`expiration_date`）に対して検証します。プロバイダーのAPIキーが必要です（Ollamaのようなキーレスプロバイダーの場合は不要）。設定されたIDが欠落または期限切れの場合は非ゼロで終了し、プロバイダーの`requestTimeoutMs`を尊重します。プロバイダーが価格を返す場合（例：OpenRouter）、プロンプト/完了の100万トークンあたりのUSDも表示されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `list-models`                                                                                              |アクティブなプロバイダーが`GET /models`リスト（IDでソート。アクティブなプロバイダーは設定の`provider`キーに従い、`-P` / `--provider`でオーバーライド）を介してアドバタイズするすべてのモデルをリストします。プロバイダーのAPIキーが必要です（Ollamaのようなキーレスプロバイダーの場合は不要）。プロバイダーが価格を返す場合（例：OpenRouter）、プロンプト/完了の100万トークンあたりのUSDも表示され、`expiration_date`を過ぎたエントリにタグ付けされます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `list-languages [search]`                                                                                  |バンドルされたUI言語カタログ（`data/ui-languages-complete.json`）を人間が読めるテーブル（コード、テキスト方向、英語名、ネイティブ名）としてリストします。設定やAPIキーは不要です。オプションの`search`タームを渡すと、コード、ネイティブ名、英語名、または方向がそれを含むエントリのみが保持されます（大文字と小文字を区別しません）。例：`list-languages portuguese`、`list-languages rtl`、`list-languages zh`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `extract`                                                                                                  | `strings.json`を`t("…")` / `i18n.t("…")`リテラル、オプションの`package.json`説明、およびオプションのマニフェスト`englishName`エントリ（`ui.reactExtractor`を参照）から更新します。`.html` / `.htm`が`ui.uiExtractor.extensions`にリストされている場合、HTMLから`data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカーストリングもキャプチャします。空でない`ui.sourceRoots`が必要です。LLMは呼び出しません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `mark-html [paths...] [--write]`                                                                           | HTMLに生の`data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカーを挿入するため、ソーステキストは（要素自体に）一度だけ記述されます。指定されたファイル/ディレクトリ/グロブをスキャンします（デフォルト：`.html` / `.htm`、`ui.sourceRoots`配下）。デフォルトではドライラン（ファイルごとの追加カウントと、手動での`<span data-i18n>`が必要な混合コンテンツ要素をレポートします）。`--write`で変更が適用されます。冪等であり、`data-i18n-ignore`（要素とそのサブツリーをスキップ）を尊重し、コードのような要素（`code`、`pre`、`kbd`、`samp`、`var`）や空/数値のみのテキストには決して触れず、値を持つマーカーを生成することはありません。LLMは呼び出しません。                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `generate-ui-languages [--master <path>] [--dry-run]`                                    | `sourceLocale` + `targetLocales` およびバンドルされた `data/ui-languages-complete.json`（設定されている場合は `--master`）を使用して、`ui-languages.json` を `ui.flatOutputDir`（または設定されている場合は `uiLanguagesPath`）に書き込みます。マスターファイルに存在しないロケールについては警告を出し、`TODO` プレースホルダーを出力します。カスタマイズされた `label` または `englishName` 値を持つ既存のマニフェストがある場合、それらはマスターカタログのデフォルト値に置き換えられます。生成されたファイルは後で確認し、必要に応じて調整してください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-docs …`                                                                                         | 各`docs`ブロック（`contentPaths`、オプションの`docusaurusCatalogDir`）に対して、markdown/MDXおよびJSONを翻訳します。`-j`：並列処理するロケールの最大数。`-b`：ファイルごとの並列バッチAPI呼び出しの最大数。`--prompt-format`：バッチのワイヤーフォーマット（`xml` \| `json-array` \| `json-object`）。[キャッシュの動作と`translate-docs`フラグ](#cache-behaviour-and-translate-docs-flags)および[バッチプロンプトフォーマット](#batch-prompt-format)を参照してください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `write-heading-ids …`                                                                                      | 少なくとも1つの`docs[]`ブロックが必要です。各ブロックの`contentPaths`の下に`.md` / `.mdx`を収集します（`.translate-ignore`を尊重します）。HTMLアンカーライン`<a id="slug"></a>`を、フラットATX`#`見出しの直前に**before**挿入します（フェンスコードブロック内の見出しはスキップします）。アンカーラインが既に存在する場合、現在の見出しテキストから派生したスラッグと一致しなくなった場合に`id`を更新します。`-p` / `--path` または `-f` / `--file`: プロジェクト相対のファイルまたはディレクトリに制限します。`--slug-style`: `github`（デフォルト; doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。`pymdown`を使用すると、オプションの`--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--dry-run`: 変更のみを一覧表示します。 |
| `check-markdown …`                                                                                         | 各 `docs[]` ブロックの `contentPaths` 配下のMarkdown/MDXをスキャンします（`translate-docs` と同じ検出方法、`.translate-ignore` を尊重）：デリミタのペアリング、閉じられていないインラインコード、`STRONG_OUTSIDE_LINK` が `**`/`__` で `[text](../../docs/url)` リンクを囲んでいる場合など。`-p`／`--path` または `-f`／`--file`：オプションのスコープ。問題がある場合は **stderr** に `relativePath:line: [ISSUE_CODE] message` 行を出力します。問題が1つ以上ある場合、終了コードは **1** になります。`--json`：**stdout** に出力されるJSONレポート。`--no-cache` がない限り、`cacheDir` に `markdown_source_issues` を書き込みます。`-v` はstderr行にソースハッシュを追加します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `translate-svg …`                                                                        | `config.svg`で設定されたSVGファイルを変換します（ドキュメントとは別）。`features.translateSVG`が必要です。ドキュメントと同じキャッシュの考え方を採用。その実行時のSQLiteの読み書きをスキップするための`--no-cache`をサポート。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                               | UI 文字列のみ翻訳します（`strings.json` → ロケール JSON）。`--locale` / `ui-languages.json`：カンマ区切りの対象ロケール（デフォルトは設定または `ui-languages.json` から）。`--force`：すべてのエントリをロケールごとに再翻訳（既存の翻訳を無視）。`--dry-run`：書き込みなし、API 呼び出しもなし。`-j`：並列処理する最大ロケール数。`features.translateUIStrings` が必要です。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `translate-json …`                                                                                         | `json[]`に従って入れ子になったJSONを翻訳します（`features.translateJson`が必要です）。共有SQLiteキャッシュ。`-l`、`-p` / `--path`、`--dry-run`、`--force`、`--force-update`、`-b`、`--prompt-format`。[Workflow 3](#workflow-3---json-file-translation)を参照してください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`                                                      | UI文字列を抽出してから翻訳します（`features.translateUIStrings`が必要です）。UI専用 — ドキュメント、SVG、`json[]`は対象外です。`translate-ui`と同じ`-l`、`--force`、`--dry-run`、`-j`オプションを使用します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                      | `extract` **を最初に**実行します (`features.translateUIStrings` が必要)。これにより `strings.json` がソースと一致し、次にLLMが **ソースロケール** UI文字列をレビューします (スペル、文法)。**用語のヒント**は `glossary.userGlossary` CSVからのみ取得されます (`translate-ui` と同じスコープ — `strings.json` / `uiGlossary` ではないため、悪いコピーは用語集として強化されません)。アクティブなLLMプロバイダー (APIキー環境変数) を使用します。これはアドバイザリのみです (実行が完了した場合、終了コードは **0**)。`lint-source-results_<timestamp>.log` を `cacheDir` の下に **人間が読める**レポート (概要、問題、および文字列ごとの **OK** 行) として書き込みます。ターミナルには概要カウントと問題のみが表示されます (文字列ごとの `[ok]` 行は表示されません)。最後の行にログファイル名を表示します。`--json`: 標準出力に完全な機械可読JSONレポートのみを表示します (ログファイルは人間が読めるままです)。`--dry-run`: まだ `extract` を実行し、バッチプランのみを表示します (API呼び出しなし)。`--chunk`: APIバッチあたりの文字列数 (デフォルト **50**)。`-j`: 最大並列バッチ数 (デフォルト `concurrency`)。`--json` を使用すると、人間のような出力が標準エラーに出力されます。リンクは `path:line` を使用します。これは `dashboard` UI文字列の「リンク」ボタンと同様です。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`              | `strings.json` を XLIFF 2.0 にエクスポートします（ターゲットロケールごとに1つの`.xliff`）。`-o` / `--output-dir`：出力ディレクトリ（デフォルト：カタログと同じフォルダー）。`--untranslated-only`：そのロケールで翻訳が欠落しているユニットのみ。読み取り専用。API はありません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sync …`                                                                                                   | 抽出（有効の場合）、次にUIの翻訳、次に`features.translateSVG`および`config.svg`が設定されている場合の`translate-svg`、次にドキュメントの翻訳、次に`features.translateJson`および`json[]`が設定されている場合の`translate-json` — ただし、`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`でスキップされた場合は除く。共有フラグ: `-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（ドキュメントおよびJSONバッチ処理）、`--force` / `--force-update`（ドキュメントおよびJSON）。ドキュメントフェーズでは、`--emphasis-placeholders`および`--debug-failed`（`translate-docs`と同じ意味）も転送されます。`--prompt-format`は`sync`フラグではありません。ドキュメントおよびJSONのステップでは、組み込みのデフォルト（`json-array`）が使用されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `status [--max-columns <n>]`                                                             | `features.translateUIStrings`が有効の場合、ロケールごとのUIカバレッジ（`Translated` / `Missing` / `Total`）を出力します。次に、ファイル×ロケールごとのMarkdown翻訳ステータスを出力します（`--locale`フィルターなし。ロケールは設定から取得）。ロケール数が多い場合は、最大`n`列（デフォルトは**9**）の表に分割して繰り返し表示し、端末での行幅が狭くなるようにします。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `statistics [--max-columns <n>]`                                                         | ドキュメントキャッシュと`strings.json`の統計情報を出力します（翻訳ダッシュボードの**統計**と同じ集計値）。`--max-columns`：モデルごとのロケール列の最大数 × ロケールテーブル（デフォルトはダッシュボードと一致）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `cleanup [--dry-run] [--backup <path>]` | まず`sync --force-update`を実行し（抽出、UI、SVG、ドキュメント）、次に古いセグメント行（nullの`last_hit_at`/空のファイルパス）を削除します。解決されたソースパスがディスク上にない`file_tracking`行を削除します。`filepath`メタデータが欠落しているファイルを指している翻訳行を削除します。孤立した`translation_failures`行を削除します。解決されたソースパスがディスク上にない孤立した`markdown_source_issues`行を削除します。5つのカウント（古いセグメント、孤立した`file_tracking`、孤立した翻訳、孤立した失敗、孤立したマークダウンの問題）をログに記録します。`--backup <path>`が渡されない限り、SQLiteバックアップは作成されません。渡された場合、変更前にそのパスにバックアップが書き込まれます。 |
| `clean-temp [-r\|--root <path>] [-f\|--force] [--dry-run]`                               | **設定なし。** ディレクトリツリーを走査して（デフォルト：カレントワーキングディレクトリ）`*.log`および`cache.db.backup*.sqlite`を検索し、`./…`パスを`find -print`のように出力します。一致する項目がある場合：`-f`／`--force`がない限り`Delete these files? (y/n)`を確認します（確認なしで削除）。一致する項目がない場合：確認せずに終了します。`--dry-run`：一覧表示のみ。確認や削除は行いません（`--force`を上書きします）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dashboard [-p <port>] [--no-open]`                                                                        | 翻訳ダッシュボードを起動します（キャッシュセグメント、`strings.json`、用語集、失敗、統計情報のためのローカルWeb UI）。デフォルトポートは **8675**（使用不可の場合は次のポートを自動的に再試行）。`--no-open` を指定すると、デフォルトブラウザは自動的に開かれません。非推奨のエイリアス `editor` も引き続き動作しますが、警告メッセージを出力します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `glossary-generate [-o <path>]`                                                          | 空の`glossary-user.csv`テンプレートを出力します。`-o`：出力パスを上書きします（デフォルトは設定ファイルの`glossary.userGlossary`、または`glossary-user.csv`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `help [command]`                                                                         | サブコマンドのヘルプを表示します（`ai-i18n-tools <command> --help`と同じ出力）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

<a id="root-and-global-options"></a>
### ルートおよびグローバルオプション

| オプション                       | スコープ         | 説明                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | ルートプログラム  | バージョン番号とビルド日時を出力します（`version`サブコマンドと同じ情報）。 |
| `-h` / `--help`              | ルートプログラム  | ルートプログラムまたはコマンド名と併用した場合のサブコマンドのヘルプを表示します。      |
| `-c` / `--config <path>`     | すべてのコマンド | 設定ファイルのパス（デフォルト: `ai-i18n-tools.config.json`）。                                  |
| `-v` / `--verbose`           | すべてのコマンド | 詳細ログ出力。                                                                          |
| `-P` / `--provider <name>`   | すべてのコマンド | この実行のアクティブな LLM プロバイダー。設定の `provider` キーをオーバーライドします。`providers` の下で設定する必要があります。 |
| `-L` / `--ui-lang <code>`    | すべてのコマンド | ツールのUI（CLIヘルプ、ログ/サマリー、ダッシュボード）の言語。最優先ソース。[ツールのUI言語](#tool-ui-language)を参照してください。 |
| `-w` / `--write-logs [path]` | すべてのコマンド | コンソール出力を `.log` ファイルに同時出力（デフォルトのパス: ルートの `cacheDir` 配下）。                |

<a id="per-command-help"></a>
### コマンドごとのヘルプ

| 使用法                            | 説明                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | そのコマンドのすべてのオプション。      |
| `ai-i18n-tools help <command>`   | `<command> --help` と同じ出力。 |

<a id="target-locales--l----locale"></a>
### ターゲットロケール（`-l` / `--locale`）

| コマンド                                                                                | 動作                                                                                                                                              |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync`、`sync-ui`、`export-ui-xliff` | `-l` / `--locale <codes>` — カンマ区切りのターゲットBCP-47コード（例: `de,fr,pt-BR`）。省略された場合、設定ファイルからデフォルト値が取得されます（`json[]`ブロックはブロックごとに`targetLocales`を設定することも可能）。UIステップでは`ui-languages.json`も使用します。 |
| `lint-source`                                                                           | `-l` / `--locale <code>` — レビュー対象の単一ソースロケール（デフォルト: 設定の`sourceLocale`）。                                                            |

---

<a id="environment-variables"></a>
## 環境変数

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` プロバイダーのAPIキー (アクティブな場合に必要)。 |
| Other provider keys    | 各プロバイダーは独自のキー環境変数を読み取ります: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollamaは不要)。プロバイダーごとに `providers.<name>.apiKeyEnv` で上書きできます。 |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl` を上書きします (そのプロバイダーが設定されている場合のみ)。 |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl` を上書きします (そのプロバイダーが設定されている場合のみ)。 |
| `AI_I18N_LANG`         | ツールのUI（CLIヘルプ、ログ、ダッシュボード）の言語。`-L` / `--ui-lang`によって上書きされます。設定`uiLanguage`を上書きします。[ツールのUI言語](#tool-ui-language)を参照してください。 |
| `I18N_SOURCE_LOCALE`    | 実行時に`sourceLocale`を上書きします。                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`を上書きするためのカンマ区切りのロケールコード。  |
| `I18N_LOG_LEVEL`        | ロガーレベル（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`              | `1`の場合、ログ出力のANSIカラーを無効にします。              |
| `I18N_LOG_SESSION_MAX`  | ログセッションごとに保持される最大行数（既定値`5000`）。           |

起動時にCLIはカレントワーキングディレクトリから`.env`ファイルを自動的にロードします（Nodeの`process.loadEnvFile`経由）。これにより、`.envrc` / `direnv`をソースしない非インタラクティブシェルでもプロバイダーAPIキーが取得されます。環境変数に既に存在する値は上書きされないため、実際のCI/本番環境の値が優先されます。

---

<a id="tool-ui-language"></a>
## ツールのUI言語

ツールは、プロジェクトの`sourceLocale` / `targetLocales`とは独立して、独自のユーザーインターフェース（CLIヘルプテキスト、トラフィックの多いログ/サマリー/エラーメッセージ、翻訳ダッシュボード）をローカライズします。UIロケールは、以下のソースから優先度の高い順に解決されます。

1. `-L` / `--ui-lang <code>` グローバルフラグ（例: `-L pt-BR`）。
2. `AI_I18N_LANG` 環境変数（例: `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` の `uiLanguage` 設定キー（BCP-47文字列）。
4. ホストOSのロケール（`Intl.DateTimeFormat().resolvedOptions().locale` 経由）。

要求されたロケールは、出荷済みのUI言語と正確に一致するか、最も近いバリエーションと一致します（例：`pt-PT`は`pt-BR`に解決され、`en-US`は`en-GB`に解決されます）。一致するものがない場合は、ソースロケール（`en-GB`）にフォールバックします。UI言語が明示的に要求された（フラグ、環境変数、または`uiLanguage`経由）が、出荷済みのバンドルと一致しない場合、CLIはデフォルトロケールが使用されるという警告を一度だけ表示します。ホストOSからのみ推測されたロケールは警告を発しません。

出荷済みのUI言語：`en-GB`（ソース）に加えて、`de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans`、および`zh-Hant`です。翻訳ダッシュボードは、解決されたロケール、レイアウト方向、および翻訳バンドルを`GET /api/ui-i18n`から読み込み、ロード時に適用します（`<html lang>` / `dir`を設定し、`data-i18n*`属性を介して静的マークアップをローカライズします）。この機能には設定は不要です。デフォルトでは、ツールはOSのロケールに従います。
