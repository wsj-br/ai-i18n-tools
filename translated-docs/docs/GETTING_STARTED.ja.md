<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: クイックスタート

`ai-i18n-tools` は、2つの独立した組み合わせ可能なワークフローを提供します。

- **ワークフロー 1 - UI 翻訳**: 任意の JS/TS ソースから `t("…")` 呼び出しを抽出し、OpenRouter 経由で翻訳して、i18next で使用可能なフラットなロケール別 JSON ファイルを出力します。
- **ワークフロー 2 - ドキュメント翻訳**: `contentPaths` にリストされた **Markdown および MDX ページ** を任意の数のロケールに翻訳し、スマートキャッシュを活用します。これはサイトで読者が開くローカライズされたドキュメントです。オプションの **Docusaurus JSON** (`jsonSource`、`docusaurus write-translations` から生成) は **サイト全体のUI** (ナビゲーションバー、フッター、テーマ/プラグインのUI文字列) を対象とし、`docs/` 内の本文は対象外です。**SVG** ファイルは `features.translateSVG`、トップレベルの `svg` ブロック、および `translate-svg` を使用して翻訳されます（[CLI リファレンス](#cli-reference)を参照）。

両方のワークフローはOpenRouter（互換性のある任意のLLM）を使用し、単一の設定ファイルを共有します。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [Deutsch](./GETTING_STARTED.de.md) · [Español](./GETTING_STARTED.es.md) · [Français](./GETTING_STARTED.fr.md) · [हिन्दी](./GETTING_STARTED.hi.md) · [日本語](./GETTING_STARTED.ja.md) · [한국어](./GETTING_STARTED.ko.md) · [Português (Brasil)](./GETTING_STARTED.pt-BR.md) · [中文 (中国大陆)](./GETTING_STARTED.zh-CN.md) · [中文 (台灣)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [インストール](#installation)
- [クイックスタート](#quick-start)
  - [推奨される`package.json`スクリプト](#recommended-packagejson-scripts)
- [ワークフロー1 - UIの翻訳](#workflow-1---ui-translation)
  - [ステップ1: 初期化](#step-1-initialise)
  - [ステップ2: 文字列の抽出](#step-2-extract-strings)
  - [ステップ3: UI文字列の翻訳](#step-3-translate-ui-strings)
  - [XLIFF 2.0形式へのエクスポート（オプション）](#exporting-to-xliff-20-optional)
  - [ステップ4: ランタイム時にi18nextを接続](#step-4-wire-i18next-at-runtime)
  - [ソースコードでの`t()`の使用](#using-t-in-source-code)
  - [補間](#interpolation)
  - [基数の複数形（`plurals: true`）](#cardinal-plurals-plurals-true)
  - [言語切り替えUI](#language-switcher-ui)
  - [RTL言語](#rtl-languages)
- [ワークフロー2 - ドキュメントの翻訳](#workflow-2---document-translation)
  - [ステップ1: ドキュメント用に初期化](#step-1-initialise-for-documentation)
  - [ステップ 2: ドキュメントの翻訳](#step-2-translate-documents)
    - [複雑なMarkdownと品質チェックの失敗](#complex-markdown-and-failed-quality-checks)
    - [キャッシュの動作と `translate-docs` フラグ](#cache-behaviour-and-translate-docs-flags)
    - [バッチプロンプトのフォーマット](#batch-prompt-format)
    - [SQLiteにおけるセグメントの重複排除とパス](#segment-dedupe-and-paths-in-sqlite)
  - [出力レイアウト](#output-layouts)
    - [フラットレイアウト内のアンカーリンク](#anchor-links-in-flat-layout)
    - [翻訳されたドキュメント内の画像およびラスターアセット](#images-and-raster-assets-in-translated-docs)
    - [`pathTemplate` / `jsonPathTemplate` プレースホルダー](#pathtemplate--jsonpathtemplate-placeholders)
- [統合ワークフロー (UI + ドキュメント)](#combined-workflow-ui--docs)
  - [混合ドキュメントワークフロー (Docusaurus + フラット)](#mixed-documentation-workflow-docusaurus--flat)
- [翻訳キャッシュエディター](#translation-cache-editor)
  - [エラー（ドキュメント翻訳）](#failures-document-translation)
    - [使用するタイミング](#when-to-use-it)
    - [原文の編集が重要な理由](#why-source-edits-matter)
    - [タブの使い方](#how-to-use-the-tab)
  - [Markdownの問題（静的チェック）](#markdown-issues-static-checks)
- [構成リファレンス](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (オプション)](#uilanguagespath-optional)
  - [`concurrency` (オプション)](#concurrency-optional)
  - [`batchConcurrency` (オプション)](#batchconcurrency-optional)
  - [`fileConcurrency` (オプション)](#fileconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (オプション)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
    - [git の除外に関するベスト プラクティス:](#best-practice-for-git-exclusions)
  - [`documentations`](#documentations)
  - [`svg`](#svg)
  - [`glossary`](#glossary)
- [CLI リファレンス](#cli-reference)
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

OpenRouterのAPIキーを設定してください。

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

デフォルトの `init` テンプレート (`ui-markdown`) は、**UI** の抽出と翻訳のみを有効にします。`ui-docusaurus` および `ui-starlight` テンプレートは **ドキュメント** 翻訳（`translate-docs`）を有効にします。設定に従って抽出、UI 翻訳、オプションの SVG ファイル翻訳、およびドキュメント翻訳を1つのコマンドで実行する場合、`sync` を使用します。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight: npx ai-i18n-tools init -t ui-starlight
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 推奨される `package.json` スクリプト

パッケージをローカルにインストールすると、CLIコマンドをスクリプト内で直接使用できます（`npx`は不要です）。

**推奨** `sync` は、以前の「`translate-ui` を実行し、次に `translate-svg`、次に `translate-docs`」という処理に代わるものです：`ai-i18n-tools sync` は、（有効な場合）**extract**、**translate-ui**、オプションの **translate-svg**、次に **translate-docs** を、設定に従って適切な順序と共通のフラグで実行します。これらの翻訳コマンドを手動で連鎖させると、（順序、抽出、ロケールフラグなどで）間違えやすいです。**単一**のステップを個別に実行する必要がある場合にのみ、`i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs` を使用してください。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
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
- `ui.flatOutputDir` - `de.json`、`pt-BR.json` などを出力する場所（例：`"src/locales/"`）。
- `ui.preferredModel`（オプション） - `translate-ui` のみに使用する**最初に試す** OpenRouter モデル ID。失敗した場合、CLI は `openrouter.translationModels`（またはレガシー `defaultModel` / `fallbackModel`）を順に試行し、重複はスキップします。

<a id="step-2-extract-strings"></a>
### ステップ 2：文字列の抽出

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 配下のすべての JS/TS ファイルをスキャンし、`t("literal")` および `i18n.t("literal")` 呼び出しを検出して `ui.stringsJson` に書き込み（またはマージ）します。

スキャナーはカスタマイズ可能で、`ui.reactExtractor.funcNames` を通じてカスタム関数名を追加できます。

<a id="step-3-translate-ui-strings"></a>
### ステップ 3：UI 文字列の翻訳

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` を読み込み、各ターゲットロケールごとにバッチを OpenRouter に送信し、フラットな JSON ファイル（`de.json`、`fr.json` など）を `ui.flatOutputDir` に出力します。`ui.preferredModel` が設定されている場合、そのモデルが `openrouter.translationModels` のリストより優先して使用されます（ドキュメント翻訳やその他のコマンドは引き続き `openrouter` のみを使用します）。

各エントリについて、`translate-ui` は各ロケールの翻訳に成功した**OpenRouter モデル ID**を、オプションの `models` オブジェクト内に保存します（`translated` と同じロケールキーを使用）。ローカルの `editor` コマンドで編集された文字列は、そのロケールの `models` にセンチネル値 `user-edited` としてマークされます。`ui.flatOutputDir` 配下のロケールごとのフラットファイルは、**ソース文字列 → 翻訳** のみを含み、`models` は含まれません（そのためランタイムバンドルは変更されません）。

> **キャッシュエディターの使用に関する注意：** キャッシュエディターでエントリを編集した場合は、更新されたキャッシュエントリで出力ファイルを再生成するために `sync --force-update`（または `--force-update` を指定した同等の `translate` コマンド）を実行する必要があります。また、後でソーステキストが変更された場合、新しいソース文字列に対して新しいキャッシュキー（ハッシュ）が生成されるため、手動での編集内容は失われることにご注意ください。

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

<!--
  Translate-docs note: paragraphs here stack many `bold` / `` `code` `` patterns (nested backticks, long sentences).
  Some target locales fail AST-style validation; see "Complex Markdown and failed quality checks" under Workflow 2 — simplify source rather than forcing literal markup parity.
-->

**3つの値を一致させてください：** `ai-i18n-tools.config.json` 内の `sourceLocale`、このファイル内の `SOURCE_LOCALE`、およびフラット出力ディレクトリ（通常は `public/locales/`）の下に `translate-ui` が作成する複数形対応のフラットJSON `{sourceLocale}.json`。静的 `import` 内でも同じベースネームを使用してください（上記の例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 内の `lng` フィールドは `SOURCE_LOCALE` と等しくなければなりません。静的なES `import` のパスには変数を使用できません。ソースロケールを変更する場合は、`SOURCE_LOCALE` とインポートパスを同時に更新してください。あるいは、動的な `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`、`fetch`、または `readFileSync` を使ってファイルを読み込み、パスを `SOURCE_LOCALE` から構築する方法もあります。

このスニペットでは、`i18n` がこれらのフォルダの隣にあるかのように `./locales/…` と `./public/locales/…` を使用しています。ファイルが `src/` の下にある場合（一般的なケース）、インポートが `ui.stringsJson`、`uiLanguagesPath`、`ui.flatOutputDir` と同じパスに解決されるように `../locales/…` と `../public/locales/…` を使用してください。

Reactがレンダリングする前（たとえばエントリーポイントの先頭）に `i18n.js` をインポートしてください。ユーザーが言語を変更したときは、`await loadLocale(code)` を呼び出した後に `i18n.changeLanguage(code)` を呼び出します。

`localeLoaders` を `ui-languages.json` から `makeLocaleLoadersFromManifest` を使用して導出することで、設定（**config**）と整合性を保ちます（これにより、`makeLoadLocale` と同じ正規化を使って `SOURCE_LOCALE` が除外されます）。`targetLocales` にロケールを追加して `generate-ui-languages` を実行すると、マニフェストが更新され、ローダーが自動的に変更を追跡します。別途ハードコードされたマップを管理する必要はありません。

JSONバンドルが `public/` の下にある場合（典型的なNext.jsの設定）、各ローダーを実装してパブリックURLパスからファイルを取得するようにします。例：

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

これにより、ブラウザが静的JSONを読み込めます。

バンドラーのないNode CLIの場合は、各コードに対してJSONファイルを読み込んで解析する小さな `makeFileLoader` ヘルパー内で `readFileSync` を使用します。

`SOURCE_LOCALE` はエクスポートされているため、他のファイル（たとえば言語切り替えコンポーネント）でも `'./i18n'` から直接インポートできます。既存のi18next設定を移行する場合は、コンポーネント中に散在するハードコードされたソースロケール文字列（例：`'en-GB'` のチェック）を、i18nブートストラップファイルから `SOURCE_LOCALE` をインポートする形に置き換えてください。

名前付きインポート（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）も、デフォルトエクスポートを使わない場合と同じように動作します。

`aiI18n.defaultI18nInitOptions(sourceLocale)`（または名前でインポートする場合は `defaultI18nInitOptions(sourceLocale)`）は、キーをデフォルト値とする設定向けの標準オプションを返します。

- `parseMissingKeyHandler` はキー自体を返すため、翻訳されていない文字列はソーステキストとして表示されます。
- `nsSeparator: false` はコロンを含むキーを許可します。
- `interpolation.escapeValue: false` - 安全に無効化可能：React 自体が値をエスケープするため、Node.js/CLI 出力にはエスケープすべきHTMLがありません。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })`はai-i18n-toolsプロジェクトのための**推奨される**配線です：これはキーのトリム + ソースロケール<code>"{{var}}"</code>の補間フォールバックを適用します（低レベルの`wrapI18nWithKeyTrim`と同じ動作）、オプションで`translate-ui` `{sourceLocale}.json`の複数形サフィックスキーを`addResourceBundle`を介してマージし、その後`wrapT`をあなたの`strings.json`からインストールします。そのバンドルされたファイルは、あなたの**設定された**ソースロケールのための複数形フラットでなければなりません — あなたのi18nブートストラップの中の`sourceLocale`と`ai-i18n-tools.config.json`および`SOURCE_LOCALE`と同じです（上記のステップ4を参照）。ブートストラップ中は`sourcePluralFlatBundle`を省略します（`translate-ui`が`{sourceLocale}.json`を出力した後にマージします）。 `wrapI18nWithKeyTrim`単独はアプリケーションコードに対して**非推奨**です — 代わりに`setupKeyAsDefaultT`を使用してください。

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

**この** `strings.json` 複数のグループは **ハッシュごとに1行**を使用し、`"plural": true`、元のリテラル `source`、および `translated[locale]` をオブジェクトとして、基数カテゴリ（`zero`、`one`、`two`、`few`、`many`、`other`）をそのロケールの文字列にマッピングします。

**フラットなロケールJSON：**非複数形の行は**原文 → 翻訳**のままです。複数形の行は、i18nextが複数形をネイティブに解決できるように、`<groupId>_original`（参照用に`source`に等しい）および各接尾辞の`<groupId>_<form>`として出力されます。`translate-ui`はまた、**複数形のフラットキーのみ**を含む`{sourceLocale}.json`も出力します（ソース言語用にこのバンドルを読み込んで、接尾辞付きキーが解決されるようにします。通常の文字列は引き続きキーをデフォルトとして使用します）。各ターゲットロケールに対して、出力される接尾辞キーはそのロケールの`Intl.PluralRules`に一致します（`requiredCldrPluralForms`）。`strings.json`がコンパクション後に一致するためカテゴリを省略した場合（例：アラビア語の`many`が`other`と同じ）でも、`translate-ui`はフォールバックとなる兄弟文字列からコピーすることで、実行時のルックアップがキーを欠落しないように、必要なすべての接尾辞をフラットファイルに書き出します。

実行時（`ai-i18n-tools/runtime`）：**呼び出し**は`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })`です。これは`wrapI18nWithKeyTrim`を実行し、オプションの`translate-ui` `{sourceLocale}.json`複数形バンドルを登録した後、`wrapT`を`buildPluralIndexFromStringsJson(stringsJson)`を使用して実行します。`wrapT`は`plurals` / `zeroDigit`を削除し、必要に応じてキーをグループIDに書き換え、`count`を転送します（オプション：単一の非`{{count}}`プレースホルダーがある場合、`count`はその数値オプションからコピーされます）。

**古い環境：** ツールや一貫性のある動作のために `Intl.PluralRules` が必要です。非常に古いブラウザを対象にする場合は、ポリフィルを使用してください。

**v1 では使用できません：** 序数の複数形（`_ordinal_*`、`ordinal: true`）、区間複数形、ICU 専用パイプライン。

<a id="language-switcher-ui"></a>
### 言語切り替えUI

言語セレクタの構築には`ui-languages.json`マニフェストを使用します。`ai-i18n-tools`は2つの表示ヘルパーをエクスポートしています。

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
    i18n.changeLanguage(code);
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

**Markdown および MDX ドキュメント**（読者が重視するページ）を `contentPaths` 配下で翻訳することを主目的として設計されています。Docusaurus サイトでは、`docusaurus write-translations` によって生成される **JSON ラベルファイル** も翻訳できます。これらはテーマ、ナビゲーションバー、フッター、プラグインのUI文字列（シェルのi18n）を含み、`docs/` 内の本文とは別です。Markdown に埋め込まれた PNG その他のラスターアイコンについては、[翻訳ドキュメント内の画像およびラスターアセット](#images-and-raster-assets-in-translated-docs)を参照してください。SVG ファイルは、`features.translateSVG` が有効で、トップレベルの `svg` ブロックが設定されている場合に [`translate-svg`](#cli-reference) 経由で翻訳されます。`documentations[].contentPaths` 経由ではありません。

<a id="step-1-initialise-for-documentation"></a>
### ステップ1：ドキュメント用に初期化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

Astro Starlight ドキュメントサイトの場合：

```bash
npx ai-i18n-tools init -t ui-starlight
```

生成された`ai-i18n-tools.config.json`を編集します。

- `sourceLocale` - ソース言語（`docusaurus.config.js` 内の `defaultLocale` と一致している必要があります）。
- `targetLocales` - BCP-47 ロケールコードの配列（例：`["de", "fr", "es"]`）。
- `cacheDir` - すべてのドキュメントパイプライン用の共有 SQLite キャッシュディレクトリ（および `--write-logs` のデフォルトログディレクトリ）。
- `documentations` - ドキュメントブロックの配列。各ブロックには、オプションの `description`、`contentPaths`、`outputDir`、オプションの `jsonSource`、`markdownOutput`、オプションの `segmentSplitting`、`translateFrontmatterFields`、`targetLocales`、`addFrontmatter` などがあります。
- `documentations[].description` - メンテナ向けのオプションの短いメモ（このブロックの対象範囲）。設定されている場合、`🌐 …: translating …` の `translate-docs` 見出しや `status` のセクション見出しに表示されます。
- `documentations[].contentPaths` - markdown/MDX ソースディレクトリまたはファイル（JSON ラベルについては `documentations[].jsonSource` も参照）。
- `documentations[].outputDir` - そのブロックの翻訳出力ルート。
- `documentations[].markdownOutput.style` - `"nested"`（デフォルト）、`"flat"`、`"doc-system"`、またはエイリアス `"docusaurus"` / `"astro-starlight"`（[出力レイアウト](#output-layouts) を参照）。

**主たる翻訳対象と補助的翻訳対象:** 作成および翻訳の重点は `contentPaths` に置きます。この出力がローカライズされたドキュメントです。`jsonSource` は **Docusaurus シェル** をローカライズするチーム向けです。Docusaurus のアップグレードやナビゲーションバー、フッター、テーマ文字列の変更時に `docusaurus write-translations` を実行し、デフォルトロケールのフォルダー内のソースカタログを最新の状態に保ちます。翻訳済みページのみが必要で、UI 文字列は別途処理する場合は、`features.translateJSON` を `false` に設定できます。

<a id="step-2-translate-documents"></a>
### ステップ2：文書を翻訳

```bash
npx ai-i18n-tools translate-docs
```

これは、すべての`documentations`ブロックの`contentPaths`内のすべてのファイルを、有効なすべてのドキュメントロケール（各ブロックの`targetLocales`が設定されている場合はそれらの和集合、それ以外はルートの`targetLocales`）に翻訳します。すでに翻訳されたセグメントはSQLiteキャッシュから提供されるため、新しいまたは変更されたセグメントのみがLLMに送信されます。

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

**このような検証エラーが発生した場合は、すべてのモデルとロケールが複雑なインラインマークアップを完璧に再現できるように期待するのではなく、ソース言語のテキストを簡略化することを推奨します**—段落を分割したり、例をフェンスされたコードブロックに移動したり、太字／コードの組み合わせを減らして同じ内容を表現する—ようにしてください。このページの他の場所（特にステップ4の`SOURCE_LOCALE`、ローダー、`public/`パスに関する注意）では、意図的に現実的なフォーマットを使用しています。同様の表現を自身のドキュメントで再利用する場合、広範囲に翻訳する際にはよりシンプルに保つようにしてください。

**どのセグメントが失敗したか**、その頻度、および保存された**品質／エラーメッセージ**を確認するには、翻訳キャッシュエディターの**失敗**タブ（[翻訳キャッシュエディター → 失敗](#translation-cache-editor-failures)）を使用してください。

<a id="cache-behaviour-and-translate-docs-flags"></a>
#### キャッシュの動作と `translate-docs` フラグ

CLIはSQLiteで**ファイルトラッキング**を維持します（ファイルごとのソースハッシュ×ロケール）および**セグメント**行（翻訳可能なチャンクごとのハッシュ×ロケール）。通常の実行では、トラッキングされたハッシュが現在のソース**と**一致し、出力ファイルがすでに存在する場合、ファイル全体をスキップします。それ以外の場合は、ファイルを処理し、セグメントキャッシュを使用して変更されていないテキストがAPIを呼び出さないようにします。

| フラグ                          | 機能                                                                                                                                                                                                                                                              |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(デフォルト)*                   | 追跡対象とディスク上の出力が一致する場合、変更のないファイルをスキップします。それ以外はセグメントキャッシュを使用します。                                                                                                                                                                          |
| `-l, --locale <codes>`        | カンマ区切りのターゲットロケール（省略された場合は、ルートの`targetLocales`および各`documentations[]`ブロックのオプション`targetLocales`の和集合がデフォルトになります）。                                                                                                                                                          |
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

`translate-docs` は、翻訳可能なセグメントを **バッチ** 単位で OpenRouter に送信します（`batchSize` / `maxBatchChars` ごとにグループ化）。`--prompt-format` フラグはそのバッチの **送信形式** のみを変更します。`PlaceholderHandler` トークン、マークダウンASTチェック、SQLiteキャッシュキー、バッチ解析失敗時のセグメント単位のフォールバックは変更されません。

| モード                   | ユーザーメッセージ                                                           | モデルの応答                                                 |
|------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | ダミーXML形式: セグメントごとに1つの `<seg id="N">…</seg>` (XMLエスケープ済み)。 | セグメントインデックスごとに1つの `<t id="N">…</t>` ブロックのみ。       |
| `json-array` (デフォルト) | 順序通りのセグメントごとに1つのエントリを持つJSON配列。               | **同じ長さ**のJSON配列（同じ順序）。           |
| `json-object`          | セグメントインデックスをキーとするJSONオブジェクト `{"0":"…","1":"…",…}`。            | **同じキー**と翻訳された値を持つJSONオブジェクト。 |

実行ヘッダーは `Batch prompt format: …` も出力するため、アクティブなモードを確認できます。JSON ラベルファイル (`jsonSource`) および SVG ファイルのバッチは、それらのステップが `translate-docs` の一部として実行される場合（または `sync` のドキュメントフェーズ — `sync` はこのフラグを公開しないため、デフォルトは `json-array` になります）に同じ設定を使用します。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### SQLiteにおけるセグメントの重複排除とパス

- セグメント行は、`(source_hash, locale)`（ハッシュ＝正規化されたコンテンツ）によってグローバルにキー付けされます。2つのファイル内で同じテキストは1つの行を共有します。`translations.filepath`はメタデータ（最終更新者）であり、ファイルごとに2つ目のキャッシュエントリがあるわけではありません。
- `file_tracking.filepath` は名前空間付きキーを使用します。`documentations` ブロックごとに `doc-block:{index}:{relPath}`（`relPath` はプロジェクトルートからの相対的なPOSIXパス：収集されたmarkdownパス。**JSONラベルファイルはソースファイルに対するカレントワーキングディレクトリからの相対パスを使用**するため、例として`docs-site/i18n/en/code.json`、クリーンアップ処理が実際のファイルを解決できるようになります）および`translate-svg`以下のSVGファイル用の`svg-files:{relPath}`です。
- `translations.filepath` は、markdown、JSON、SVGセグメントのカレントワーキングディレクトリからの相対POSIXパスを格納します（SVGは他のアセットと同様のパス形式を使用。`svg-files:…`プレフィックスは**のみ**`file_tracking`に存在します）。
- 実行後、`last_hit_at`は、**同じ翻訳スコープ内**で（`--path`および有効な種類を尊重して）ヒットしなかったセグメント行に対してのみクリアされるため、フィルターされた実行やドキュメントのみの実行が関係のないファイルを古く扱うことはありません。

<a id="output-layouts"></a>
### 出力レイアウト

`"nested"`（省略時のデフォルト） — ソースツリーを `{outputDir}/{locale}/` 配下にミラー（例：`docs/guide.md` → `i18n/de/docs/guide.md`）。

`"doc-system"` — 静的ドキュメントサイト向けのロケール接頭辞付きドキュメントツリー。`docsRoot` 配下のファイルは `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` に書き出されます。`docsRoot` の外側のパスは入れ子レイアウトにフォールバックします。英語ソースルートに `"docs"` または `"src/content/docs"` のように `documentations[].markdownOutput.docsRoot` を設定します。`style` が `"doc-system"` の場合、明示的に `localeSubpath` を設定する必要があります（プリセット用のエイリアスを使用できます）。

**エイリアス**（同じレイアウトエンジン、プリセット済み `localeSubpath`）：

- `"docusaurus"` — `localeSubpath` はデフォルトで `docusaurus-plugin-content-docs/current` になります（Docusaurus i18n プラグインのレイアウト）。
- `"astro-starlight"` — `localeSubpath` はデフォルトで `""` になります（翻訳されたページが直接 `{outputDir}/{locale}/` 配下に配置され、英語コンテンツがコンテンツルートにあり、`outputDir` が `docsRoot` に等しい場合の [Starlight](https://starlight.astro.build/guides/i18n/) と一致します）。

Docusaurus プリセット（主なドキュメントページ）：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight プリセット（同じブロック構造、異なるパス）：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

オプションの JSON ラベル — `jsonSource` から生成される Docusaurus シェル用文字列 (MDX 本文は対象外):

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlight は多くのロケール向けに UI 文字列を提供しています。カスタム UI の上書きが必要な場合は、必要に応じて別の `documentations[]` ブロックで `src/content/i18n/en.json` と `jsonPathTemplate: "{outputDir}/{locale}.json"` を使用します。

`"flat"` — 翻訳済みファイルをソースの隣にロケールのサフィックス付き、またはサブディレクトリ内に配置します。ページ間の相対リンクは自動的に書き換えられます。

```text
docs/guide.md → i18n/guide.de.md
```

<a id="anchor-links-in-flat-layout"></a>
#### フラットレイアウトでのアンカーリンク

フラット出力では、各ロケールのページ間の**相対パス**が書き換えられます（`guide.md` → `guide.de.md`）。**アンカーリンク** — パスの後に`#`を付ける通常のMarkdownインライン形式 — は、対象ファイル内のセクションにジャンプします。

```markdown
Read the [installation checklist](../setup.md#first-run) before you deploy.
```

ここでは、リンクのターゲットは`setup.md`、`#first-run`はアンカーです。そのファイル内の適切な見出しにスクロールする必要があります。

**なぜアンカーリンクに注意が必要か**

- `rewriteRelativeLinks`は各ロケールの**ファイル名**を修正します（`setup.md` → `setup.de.md`）。
- 多くのレンダラーは**表示される見出しのテキスト**から`#`スラグを生成します。翻訳後、ロケールごとに見出しが異なるため、自動生成されたスラグが変化する一方で、書き換えられたリンクはまだ`#first-run`を指している可能性があります。つまり、英語の`#…`アンカーが、翻訳された見出しからレンダラーが生成するスラグと一致しなくなる場合があります。
- 結果として、読者は正しい**ファイル**には到達しますが、**間違った行**に移動するか、ブラウザが一致する見出しを見つけられません。

**対処方法**

1. `translate-docs` の前（通常通りの同じ `documentations[]` / `contentPaths`）に、ソースの `.md` / `.mdx` で `ai-i18n-tools write-heading-ids` を実行します。これにより、各見出しの前の行に明示的なHTMLアンカーが挿入され、`id` 値がすべての翻訳コピーで共有されます。
2. マークダウンの**アンカーリンク**をそれらの固定IDを指すようにしてください。たとえば `[label](../other.md#section-id)` のように記述します。ここで `section-id` は、ツールが書き込んだアンカーと一致している必要があります。英語の単語から推測したものではなく、正確に一致させる必要があります。

**例**

`docs/overview.md`:

```markdown
See [TLS setup](../security.md#tls-configuration) for certificate steps.
```

`write-heading-ids`後の`docs/security.md`（簡略化）:

```markdown
<a id="tls-configuration"></a>
## TLS configuration

Your CA and cert steps…
```

`translate-docs`後、ファイルパスと`#…`アンカーはすべてのロケールファイルで一致したままになります。たとえば:

```markdown
Siehe [TLS-Einrichtung](../security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration`アンカーは、`id`がソースで固定されているため、すべてのロケールで同じです。見出しの**テキスト**とリンクの**ラベル**のみが翻訳されます。

<a id="images-and-raster-assets-in-translated-docs"></a>
#### 翻訳されたドキュメント内の画像およびラスターアセット

`translate-docs` はMarkdownセグメント（画像のaltテキストを含む）を翻訳します。ただし、ラスターファイル（PNG、JPEG、WebP、GIF）をドキュメントに**コピーしません**。ファイルを書き換えられたURLが指す場所に配置するか、翻訳後にURLを調整してください（通常は`markdownOutput.postProcessing.regexAdjustments`を使用して）。`outputDir`。

図解アセットとして使用される **SVG** は `svg` ブロックと `translate-svg` を使用します — [`svg`](#svg) を参照してください。`documentations[].contentPaths` にリストされたパスは、SVG ファイルの翻訳ではなく、Markdown/MDX（およびオプションの JSON ラベル）用です。

**フラットレイアウトで修正が必要になることが多い理由**

`markdownOutput.style` `flat` とデフォルトの相対リンク書き換えにより、翻訳されたページ間のリンクはロケールごとに書き換えられます。非マークダウンファイルへのリンクには、各出力ファイルに対して相対的な位置を保つために深さプレフィックスが付与されます（例えば、ソースファイルの横にある `figure.png` は、翻訳されたファイル内で `../figure.png` になる可能性があります）。そのURLは通常、出力ディレクトリー**内**でのみ解決されます。CLIはバイナリをそこに出力しないため、アセットをコピーするか、別の場所で提供するか、リンクを書き換えない限り、読者はファイルが見つからない状態になります。変換後にルールをフックしてください：`postProcessing` はセグメントの再構築とフラットリンク書き換えの後に実行されます（[設定リファレンス](#configuration-reference) の `markdownOutput.postProcessing` 行を参照してください）。

**パターン1 — 英語ソース横に同じリポジトリ内のアセットを配置（このパッケージ）**

このリポジトリは`docs/GETTING_STARTED.md`を`translated-docs/docs/GETTING_STARTED.<locale>.md`に翻訳します。ソースは兄弟画像`translation-cache-editor.png`を使用しています。フラット書き換えでは`translated-docs/translation-cache-editor.png`をターゲットにしますが、これは書き出されません。ルートの`ai-i18n-tools.config.json`は、Markdown画像の安定した末尾部分（翻訳された代替テキストではなく、`](…)`URLセグメント）に一致するルールを追加し、`docs/`に戻るように指定しています：

```json
{
  "description": "Editor screenshot: flat link rewrite points to translated-docs/; asset lives in docs/",
  "search": "\\]\\(\\.\\./translation-cache-editor\\.png\\)",
  "replace": "](../../docs/translation-cache-editor.png)"
}
```

**パターン2 — ロケールごとのスクリーンショットフォルダー**（`examples/nextjs-app`）

Next.jsの例では、`examples/nextjs-app/ai-i18n-tools.config.json`に2つの`documentations[]`ブロックを使用しています。

- **Docusaurusドキュメント** (`markdownOutput.style` `docusaurus`)：`docs-site/docs/`以下の英語ページは、URLに固定されたロケールセグメントを使用してスクリーンショットを参照します。たとえば、`feature-showcase.md`内の`/img/screenshots/en-GB/screenshot.png`です。ポストプロセッシングでそのセグメントを置き換えることで、`docs-site/i18n/<locale>/…/current/`以下の各翻訳ページがそれぞれのフォルダーを解決できるようにします：

```json
{
  "description": "Per-locale screenshot folders in docs-site static assets",
  "search": "screenshots/en-GB/",
  "replace": "screenshots/${translatedLocale}/"
}
```

サイトの静的ツリー内に一致するPNGを配置してください（たとえば、`/img/screenshots/`で始まるURLに対して`docs-site/static/img/screenshots/<locale>/`）。

- **ルートのREADME、フラット出力**（同じファイル内の2番目の`documentations[]`ブロック）：`README.md`のみが翻訳され、`markdownOutput.style` `flat`および`outputDir` `translated-docs`が付随するため、結果として`translated-docs/README.<locale>.md`が得られます。英語版の画像では、パスの中間に安定したフォルダー名のセグメントを使用することがよくあります（たとえば`images/screenshots/en-GB/overview.png`）。後処理により、`images/screenshots/`とURLの残りの部分の間に位置する単一のパスセグメントが、現在有効な`${translatedLocale}`に置き換えられるため、各翻訳されたREADMEはそれぞれ`images/screenshots/de/…`、`images/screenshots/fr/…`などを参照します。このパターンはDocusaurusのルールとは異なります。ここでは`search`は**任意の**フォルダー名（`[^/]+/`）に一致し、`en-GB/`に限定されません。

```json
{
  "description": "Per-locale screenshot folders under translated-docs",
  "search": "images/screenshots/[^/]+/",
  "replace": "images/screenshots/${translatedLocale}/"
}
```

`images/screenshots/<locale>/`の下にディスク上にPNGファイルを維持してください（URLを書き換えた後に使用されるのと同じレイアウト）。

**パターン 3 — SVG ファイル** (`examples/nextjs-app`)

同じ例では`features.translateSVG`が有効になっており、ソースSVGはWebアプリのpublicフォルダーにマッピングされています：

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg`（または`sync`）を実行して、`images/*.svg`が`public/assets/`以下のロケールごとの出力になります。MarkdownはそれらのURLを`translate-docs`とは別に参照します。

**最小限のREADMEのみの例**（`examples/console-app`）

`examples/console-app/ai-i18n-tools.config.json`は`README.md`を`translated-docs/`に`postProcessing.languageListBlock`のみで翻訳します。READMEに兄弟のラスターファイルがなく、またはホストが既に提供している絶対URLのみを使用する場合に適しています。

置換テンプレートは`${translatedLocale}`や`${translatedBasedir}`などのプレースホルダーをサポートしています（完全なリストは[構成リファレンス](#configuration-reference)の`markdownOutput.postProcessing.regexAdjustments`行を参照）

<a id="markdown-output-path-template-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` プレースホルダー

翻訳されたファイルの出力先を、`documentations[].markdownOutput.pathTemplate`（MarkdownおよびMDX）または`jsonPathTemplate`（JSONラベルファイル）を設定することで上書きできます。どちらも同じプレースホルダーを受け入れます。解決されたパスは、そのブロックの`outputDir`内に留まる必要があります（CLIは外部に脱出するパスを拒否します）。

カスタムの`pathTemplate`を使用する場合、明示的に設定しない限り、`rewriteRelativeLinks`はデフォルトで`false`になります — フラットスタイルのリンク書き換えは、組み込みの`flat`レイアウト向けに設計されています。

| プレースホルダー            | 役割                                                                                                       | 例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | このドキュメントブロックの `outputDir` の絶対パス（解決済み）                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | ターゲットロケールコード（設定/CLIと同じ形式） | `de`, `pt-BR` |
| `{LOCALE}` | 同じロケールを大文字にしたもの | `DE`, `PT-BR` |
| `{relPath}` | プロジェクトルートからの相対ソースファイルパス（POSIX `/`） | `docs/guide.md`, `README.md` |
| `{stem}` | 拡張子 **なし**のファイル名 | `guide` for `docs/guide.md` |
| `{basename}` | 拡張子付きのファイル名 **with** | `guide.md` |
| `{extension}` | 拡張子 **を含む** ドット | `.md`, `.mdx` |
| `{docsRoot}` | `markdownOutput.docsRoot` の絶対パス（省略時はデフォルトで `docs`） | `/home/acme/repo/docs` |
| `{relativeToDocsRoot}` | パス文字列が一致する場合、対応する `docsRoot` プレフィックスを削除した `{relPath}`（POSIX準拠）。それ以外の場合は変更なし | `docs/guide.md`（一般的）; 削除が適用される場合のみ `guide.md` |

**例**

設定の抜粋:

```json
{
  "outputDir": "i18n",
  "markdownOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

ロケール `de`、ソース `docs/guide.md`、プロジェクトルート `/home/acme/repo`、および `outputDir` が `/home/acme/repo/i18n` に解決される場合、展開されたパスは次のようになります:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`flat` 形式のパターンでファイル名のみを保持するには、`{stem}` と `{extension}` を使用します。たとえば `{outputDir}/{stem}.{locale}{extension}` は、解決された `outputDir` のもとで `…/guide.de.md` を生成します。

---

<a id="combined-workflow-ui--docs"></a>
## 統合ワークフロー（UI ＋ ドキュメント）

単一の設定ですべての機能を有効にして、両方のワークフローを同時に実行します:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false,
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
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "markdownOutput": { "style": "flat" }
    }
  ]
}
```

`glossary.uiGlossary` は、ドキュメント翻訳をUIと同じ `strings.json` カタログを指すようにして用語の一貫性を保ちます。`glossary.userGlossary` は製品用語のCSVオーバーライドを追加します。

`npx ai-i18n-tools sync` を実行して1つのパイプラインを実行：`features.extractUIStrings` の場合 **UI 文字列の抽出**、`features.translateUIStrings` の場合 **UI 文字列の翻訳**、`features.translateSVG` かつ `svg` ブロックが設定されている場合 **SVG ファイルの翻訳**、その後 **ドキュメントの翻訳**（各 `documentations` ブロック：設定どおりに markdown/JSON を処理）。`--no-ui`、`--no-svg`、または `--no-docs` で部分をスキップできます。ドキュメント処理ステップは `--dry-run`、`-p` / `--path`、`--force`、および `--force-update` を受け入れます（最後の2つはドキュメント翻訳実行時のみ適用。`--no-docs` を渡すと無視されます）。

`documentations[].targetLocales` ブロックを使用して、そのブロックのファイルをUIよりも**少ないロケール数**に翻訳します（有効なドキュメントロケールはブロック間の**和集合**になります）:

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-CN"],
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-workflow-docusaurus--flat"></a>
### 混合ドキュメントワークフロー（Docusaurus ＋ 平坦）

`documentations` に複数のエントリを追加することで、同じ設定内で複数のドキュメントパイプラインを組み合わせることができます。プロジェクトにDocusaurusサイトとルートレベルのMarkdownファイル（たとえばリポジトリのreadme）があり、それらを平坦な出力で翻訳したい場合に、よく使われる構成です。

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "documentations": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "jsonSource": "docs-site/i18n/en",
      "addFrontmatter": true,
      "markdownOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README in flat output",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "markdownOutput": {
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

`npx ai-i18n-tools sync` で実行した場合の動作:

- UI 文字列は `src/` から `public/locales/` へ抽出および翻訳されます。
- 最初のドキュメントブロックは、`docs-site/docs/` から `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` へ **Markdown** を翻訳します（ローカライズされたドキュメントページ）。
- `features.translateJSON` および `jsonSource` を使用することで、同じブロックが `docs-site/i18n/en/` 配下の **Docusaurus シェル JSON** を各ターゲットロケールフォルダーに翻訳します（ナビゲーションバー、フッター、テーマ／プラグインカタログ。MDX本文は対象外）。
- 2番目のドキュメントブロックは、`README.md` を `translated-docs/` 配下のフラットなロケール接尾付きファイルに翻訳します。
- すべてのドキュメントブロックは `cacheDir` を共有するため、変更されていないセグメントは実行間で再利用され、API 呼び出し回数とコストを削減します。

---

<a id="translation-cache-editor"></a>
## 翻訳キャッシュエディター

実行方法：

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

これは、設定済みの`cacheDir` SQLiteデータベースをバックエンドとして使用するローカルWeb UIを起動します。これはCLIがドキュメントセグメント、ログ、関連メタデータに使用するのと同じフォルダーです。タブには**Documentation**（キャッシュされたドキュメントセグメント）、**UI strings**、**UI plurals**、**Glossary**、**Failures**、**Markdown issues**、および**Statistics**が含まれます。

![Translation Cache Editor](../../docs/translation-cache-editor.png)

このアプリでキャッシュ行（たとえばドキュメントセグメント）を**編集する場合**、ディスク上の出力がキャッシュと一致するように、`sync --force-update`または同等の翻訳コマンドを`--force-update`オプション付きで実行してください。後でリポジトリ内の**ソーステキスト**が変更されると、セグメントのハッシュが変化し、以前のテキストに対する手動編集は上書きされます。

<a id="translation-cache-editor-failures"></a>
### 失敗 (ドキュメント翻訳)

**失敗**タブは、**ドキュメント**の翻訳にのみ使用されます。これは、セグメントが特定のロケールに対して正常に翻訳できなかった場合にSQLiteに書き込まれる失敗レコードを読み取ります。たとえば、空または無効なモデル出力、翻訳後の検証エラー（`AST mismatch`、プレースホルダーの漏洩、および同様の**品質**チェック）、または進行をブロックする**致命的**な状態などが該当します。これにより、次の質問に答えることができます：*どのソースセグメントが、どのロケールおよびモデルで失敗し、どのようなエラーテキストが記録されたか？*

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

1. エディターで **失敗** を開きます（[翻訳キャッシュエディター](#translation-cache-editor) と同じブラウザセッションを使用）。
2. **概要**バーを確認します（いずれかの失敗があるセグメント、および **1**、**2**、**3+** 件の失敗レコードを持つセグメントの件数を表示）。
3. 部分一致する **ファイル名**、**ロケール**、**モデル**、**品質エラー**（値はキャッシュから取得）、**致命的エラーのみ**、および任意の **ソースハッシュ**、**ソーステキスト**、**エラーメッセージ**の部分文字列でフィルターし、次に **適用** をクリックします。
4. **並べ替え：失敗数**（既定）または **並べ替え：ファイルパス＋行番号** を選択します。
5. テーブルの上部または下部にあるページネーションを使用します。**行をクリック**すると、完全なソーステキストの表示を切り替えられます。行内のリンクコントロール（有効な場合）は、サーバープロセスに `ai-i18n-tools editor` を実行中の **ターミナル** にファイル／行のヒントをログ出力するよう要求します。これは、ブラウザからエディターへ移動する際に便利です。
6. プロジェクト内の **ソースファイル** を修正し、その後 `translate-docs` または `sync` を再実行します。成功した実行後にリストが **古くなっている** ように見える場合は、`ai-i18n-tools sync --force-update` を実行してエディターを再読み込みしてください（失敗パネルも同じヒントを表示します）。

UI と並行してファイル単位のデバッグを行う場合、リトライ中に `translate-docs --debug-failed` を使用して `cacheDir` の下に `FAILED-TRANSLATION` の詳細を書き出すこともできます。詳細は [キャッシュの動作および `translate-docs` フラグ](#cache-behaviour-and-translate-docs-flags) を参照してください。

<a id="markdown-issues-static-checks"></a>
### Markdownの問題（静的チェック）

**Markdown issues**タブは`markdown_source_issues` SQLiteテーブルの行を一覧表示します。各行は**翻訳前**の検出事項です。たとえば、CommonMarkスタイルのルール（`translate-docs`がマスキングに使用するもの）で強調や取り消し線としてペアにならないデリミタの連続、バッククォートで開始されたが閉じられていないインラインコードスパン、`STRONG_OUTSIDE_INLINE_CODE`が`**`／`__`で`` `...` ``スパンを囲んでいる場合（強調はバッククォート内に置くか、プレーンコードを使用）、または`STRONG_OUTSIDE_LINK`が`**`／`__`で`[text](../url)`リンクを囲んでいる場合（太字はリンクテキスト内にのみ置く）などです。これは**Failures**とは異なります。**Failures**はロケールごとのモデル出力や翻訳後の検証問題（`AST mismatch`、プレースホルダーリークなど）を記録します。

このタブは、トークンを消費する前に**ソースMarkdown**を修正したい場合に使用します。特に品質チェックが構造の問題で繰り返し失敗する場合に有効です。ファイルパス（キャッシュキーに対する部分一致、`doc-block:{index}:`プレフィックスを含む）、**問題コード**、または**ソースハッシュ**でフィルタリングできます。ファイルパス＋行番号、または最新のスキャン時刻で並べ替え可能です。リンクボタンを押すと、ファイル／行のヒントが`ai-i18n-tools editor`が実行中の端末にログ出力されます（ドキュメントタブと同様の仕組みです）。

**行の更新：** `ai-i18n-tools check-markdown`を実行します（オプションで`-p` / `--path`スコープ、`--no-cache`でSQLiteをスキップ、`--json`でstdoutに機械可読出力、stderrに人間向けの行を出力）。デフォルトでは、`documentations[].warnMarkdownSourceIssues`が`false`に設定されていない場合、各`translate-docs` markdownファイルの実行時にそのファイルのMarkdownセグメントを再スキャンし、対応するファイルパスの行を置き換えます。キャッシュファイルパスのすべての翻訳をクリアすると、エラーと同様のクリーンアップ処理の一環として、そのファイルパスのMarkdown問題の行も削除されます。

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

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（オプション）

表示名、ロケールフィルタリング、言語リストの後処理に使用される`ui-languages.json`マニフェストへのパス。省略された場合、CLIは`ui.flatOutputDir/ui-languages.json`にマニフェストがあるかを検索します。

以下のときに使用します：

- マニフェストが`ui.flatOutputDir`の外にあるため、CLIに明示的にパスを指定する必要がある場合。
- `markdownOutput.postProcessing.languageListBlock`にマニフェストからロケールラベルを構築させたい場合。
- `extract`がマニフェスト内の`englishName`エントリを`strings.json`にマージする場合（`ui.reactExtractor.includeUiLanguageEnglishNames: true`が必要）。

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
### `openrouter`

- `baseUrl`
  OpenRouter API のベース URL。デフォルト：`https://openrouter.ai/api/v1`。
- `translationModels`
  優先順に並べたモデル ID のリスト。最初のものが最初に試されます。エラー時には後続のエントリがフォールバックとして使用されます。`translate-ui` 専用に、`ui.preferredModel` を設定してこのリストの前に1つのモデルを試すこともできます（`ui` を参照）。
- `defaultModel`
  従来の単一プライマリモデル。`translationModels` が未設定または空の場合にのみ使用されます。
- `fallbackModel`
  従来の単一フォールバックモデル。`translationModels` が未設定または空の場合、`defaultModel` の後に使用されます。
- `maxTokens`
  リクエストごとの最大完了トークン数。デフォルト：`8192`。
- `temperature`
  サンプリング温度。デフォルト：`0.2`。
- `requestTimeoutMs`
  OpenRouter への各 HTTP リクエスト（チャット完了および内部 `GET /models` 呼び出し）の最大待機時間（ミリ秒単位）。デフォルト：`30000`（30秒）。

**複数のモデルを使用する理由:** プロバイダーおよびモデルごとにコストが異なり、言語やロケールごとに品質のレベルも異なります。CLIがリクエストに失敗した場合に次のモデルを試行できるように、`openrouter.translationModels`を**順序付きフォールバックチェーン**（単一のモデルではなく）として構成してください。

以下のリストは拡張可能な**ベースライン**として扱ってください。特定のロケールの翻訳が不十分または失敗する場合は、その言語またはスクリプトを効果的にサポートするモデルを調査し（オンラインリソースまたはプロバイダーのドキュメントを参照）、それらのOpenRouter IDをさらに代替手段として追加してください。

このリストは**広範なロケールカバレッジについてテスト済み**です（たとえば、大規模なドキュメンテーションプロジェクトで**36**のターゲットロケールを**2026年4月**に翻訳したとき）。実用的なデフォルトとして機能しますが、すべてのロケールで良好に動作するとは限りません。

例 `translationModels`（`npx ai-i18n-tools init`と同じデフォルト値）:

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
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
]
```

環境変数または`.env`ファイルで`OPENROUTER_API_KEY`を設定します。

`translationModels` を変更する前に、`npx ai-i18n-tools check-models` を実行して、構成された各モデル ID を OpenRouter のライブカタログ（`GET /models`）に対して検証してください。このコマンドは存在しないか、`expiration_date` を過ぎた ID を報告し、有効なモデルを100万トークンあたりの推定入出力価格（USD）とともに一覧表示し、構成された ID のいずれかが無効な場合に非ゼロのステータスで終了します。`OPENROUTER_API_KEY` が必要です。

<a id="features"></a>
### `features`

| フィールド                | ワークフロー | 説明                                                                                                                                                        |
|----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `extractUIStrings`   | 1        | ソース内の`t("…")` / `i18n.t("…")`をスキャンし、オプションの`package.json`説明および（有効な場合）`ui-languages.json` `englishName`値を`strings.json`にマージします。 |
| `translateUIStrings` | 1        | `strings.json`エントリを翻訳し、ロケールごとのJSONファイルを出力します。                                                                                                  |
| `translateMarkdown`  | 2        | `.md` / `.mdx` ファイル（フラットまたは Docusaurus ドキュメント）の翻訳。                                                                                                                                   |
| `translateJSON`      | 2        | `docusaurus write-translations` からの Docusaurus ラベル JSON（テーマ／ナビ／フッター／プラグイン UI）。**Markdown ページ本文は対象外**。                                             |
| `translateSVG`       | 2        | `.svg` ファイルの翻訳を実行します（最上位の `svg` ブロックが必要です）。                                                                                                       |

`features.translateSVG` が true かつトップレベルの `svg` ブロックが設定されている場合、`translate-svg` で **SVG** ファイルを翻訳します。`sync` コマンドは、両方が設定されている場合にそのステップを実行します（`--no-svg` でない限り）。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  `t("…")`呼び出しのためにスキャンされるディレクトリまたはグロブパターン（cwdに対して相対）。 `src/`や`["src/**/*.ts"]`のようなパターンをサポートします。
- `stringsJson`  
  マスターカタログファイルへのパス。 `extract`によって更新されます。
- `flatOutputDir`  
  ロケールごとのJSONファイルが書き込まれるディレクトリ（`de.json`など）。
- `preferredModel`  
  オプション。 `translate-ui`のために最初に試みられるOpenRouterモデルID；その後、重複しないようにこのIDなしで`openrouter.translationModels`（またはレガシーモデル）を順番に使用します。
- `reactExtractor.funcNames`  
  スキャンする追加の関数名（デフォルト: `["t", "i18n.t"]`）。
- `reactExtractor.extensions`  
  含めるファイル拡張子（デフォルト: `[".js", ".jsx", ".ts", ".tsx"]`）。
- `reactExtractor.includePackageDescription`  
  `true` の場合（デフォルト）、`extract` は、存在する場合に `package.json` `description` を UI 文字列としても含めます。
- `reactExtractor.packageJsonPath`  
  オプションの説明抽出に使用される `package.json` ファイルへのカスタムパス。
- `reactExtractor.includeUiLanguageEnglishNames`

`true` の場合（デフォルト `false`）、`extract` は、ソーススキャンから既に存在しない場合に、`uiLanguagesPath` のマニフェストから各 `englishName` を `strings.json` に追加します（同じハッシュキー）。有効な `ui-languages.json` を指す `uiLanguagesPath` が必要です。

| フィールド         | 説明                                               |
|---------------|-----------------------------------------------------------|
| `sourceRoots` | `t("…")`呼び出しのためにスキャンされるディレクトリまたはグロブパターン（cwdに対して相対）。 |
| `stringsJson` | マスターカタログファイルへのパス。`extract` によって更新されます。    |

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite キャッシュディレクトリ（すべての `documentations` ブロックで共有）。実行間で再利用します。カスタムドキュメント翻訳キャッシュから移行する場合は、アーカイブまたは削除してください — `cacheDir` は独自の SQLite データベースを作成し、他のスキーマとは互換性がありません。

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

<a id="documentations"></a>
### `documentations`

ドキュメントパイプラインブロックの配列。`translate-docs` と `sync` のドキュメントフェーズが各ブロックを順番に**処理します**。

- `description`
このブロックのためのオプションの人間可読なノート（翻訳には使用されません）。設定されている場合、`translate-docs` `🌐`見出しにプレフィックスされます；また、`status`セクションヘッダーにも表示されます。
- `contentPaths`
翻訳するためのMarkdown/MDXページ本文（`translate-docs`はこれらを`.md` / `.mdx`のためにスキャンします）。 **ディレクトリパスまたはグロブパターン**をサポートします（例：`"docs/**/*.md"`, `"guides/*.mdx"`）。それがローカライズされたドキュメントの文章の出所です。
- `outputDir`
このブロックのための翻訳された出力のルートディレクトリ。
- `sourceFiles`
ロード時に`contentPaths`にマージされるオプションのエイリアス。
- `targetLocales`
このブロック専用のオプションのロケールサブセット（それ以外の場合はルートの `targetLocales`）。有効なドキュメントロケールは、すべてのブロックの和集合になります。
- `jsonSource`
オプション。このブロックの Docusaurus JSON ラベルカタログのソースディレクトリ（例：`docusaurus write-translations` の `"i18n/en"`）。ページ本文は常に `contentPaths` から取得されます。`jsonSource` はシェル/UI の JSON のみを提供し、MDX は提供しません。
- `markdownOutput.style`
`"nested"`（デフォルト）、`"flat"`、`"doc-system"`、またはエイリアス `"docusaurus"` / `"astro-starlight"`。
- `markdownOutput.localeSubpath`
`doc-system` 用に `{locale}/` と `{relativeToDocsRoot}` の間のパスセグメント（直接 `style: "doc-system"` を使用する場合は必須。エイリアス使用時はプリセット）。Starlight スタイルのロケールフォルダには `""` を使用します。
- `markdownOutput.docsRoot`
Docusaurus レイアウトのソースドキュメントルート（例：`"docs"`）。
- `markdownOutput.pathTemplate`
カスタムマークダウン出力パス。プレースホルダー： <code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `markdownOutput.jsonPathTemplate`
ラベルファイル用のカスタムJSON出力パス。`pathTemplate` と同じプレースホルダーをサポートします。
- `markdownOutput.flatPreserveRelativeDir`
`flat` スタイルの場合、同じベース名のファイルが衝突しないように、ソースのサブディレクトリを維持します。
- `markdownOutput.rewriteRelativeLinks`
翻訳後に相対リンクを書き換えます（`flat`スタイルでは自動的に有効化されます）。
- `markdownOutput.linkRewriteDocsRoot`
フラットリンクの書き換え接頭辞の計算に使用されるリポジトリのルート。翻訳されたドキュメントが別のプロジェクトルート下にある場合を除き、通常は`"."`のままにしてください。
- `markdownOutput.postProcessing`
翻訳された**markdown本文**へのオプションの変換（YAMLキーおよび散文以外のフロントマターの値は保持されます）。セグメントの再結合およびフラットリンクの書き換えの後、`addFrontmatter`の前に行われます。
- `translateFrontmatterFields`
`markdownOutput`と同じレベル（`documentations[]`ブロックごと）。Starlight/Docusaurus向けのユーザー向けYAML散文の翻訳（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next`ラベル）用のデフォルト`true`。フロントマターブロック全体を変更せずに保つには`false`を設定します。特定のドットパスに制限するには文字列配列を渡します。
- `segmentSplitting`
`markdownOutput`と同じレベル（`documentations[]`ブロックごと）。`translate-docs`抽出用のオプションのより細かいセグメント：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`。`enabled`が`true`の場合（`segmentSplitting`が省略された場合のデフォルト）、密度の高い段落、GFMパイプテーブル（最初のチャンクにヘッダー、セパレーター、最初のデータ行を含む）、長いリストが分割されます。サブパートは単一の改行で再結合されます（`tightJoinPrevious`）。このブロックでは、空白行で区切られた本文ブロックごとに1つのセグメントのみを使用するには`"enabled": false`を設定します。
- `warnMarkdownSourceIssues`
`true`の場合（省略時はデフォルト）、各`translate-docs`実行時にマークダウンセグメントをリスクのあるデリミターや閉じられていないインラインコードで再スキャンし、端末に警告を表示し、そのファイルのキャッシュファイルパスの`markdown_source_issues`行を置き換えます。このブロックの警告とSQLite更新をスキップするには`false`を設定します。
- `markdownOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }`の順序付きリスト。`search`は正規表現パターンです（プレーン文字列はフラグ`g`、または`/pattern/flags`を使用）。`replace`は`${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}`などのプレースホルダーをサポートしています。
- `markdownOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label" }` — 翻訳ツールは、`start`を含む最初の行と一致する`end`行を検出し、その範囲を標準的な言語スイッチャーに置き換えます。`label`はマニフェストラベルのソースを制御します：`"local"`（デフォルト、`ui-languages.json` `label`を使用）または`"english"`（`englishName`を使用）。リンクは翻訳されたファイルからの相対パスで構築されます。マニフェストが設定されていない場合、ラベルは`localeDisplayNames`とロケールコードから取得されます。
- `addFrontmatter`
`true`の場合（省略時はデフォルト）、翻訳されたマークダウンファイルにはYAMLキー：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`が含まれ、少なくとも1つのセグメントにモデルメタデータがある場合、`translation_models`（使用されたOpenRouterモデルIDのソート済みリスト）も含まれます。スキップするには`false`に設定します。

<br/>

**例（フラットREADMEパイプライン — スクリーンショットパス＋オプションの言語リストラッパー）：**

```json
"markdownOutput": {
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

<a id="svg"></a>
### `svg`

SVGファイルのトップレベルのパスとレイアウト。`features.translateSVG`がtrueの場合（`translate-svg`または`sync`のSVGステージ経由）にのみ翻訳が実行される。

| フィールド                         | 説明                                                                                                                                                                                                                                                                        |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | 1つ以上のディレクトリ、**またはグロブパターン**（例: `"images/*.svg"`、`"**/icons/*.svg"`）。これらのパターンはプロジェクトルートを基準として解決され、`.svg`ファイルを再帰的にスキャンします。                                                                                       |
| `outputDir`                   | 翻訳されたSVG出力のルートディレクトリ。                                                                                                                                                                                                                                          |
| `style`                       | `pathTemplate` が設定されていない場合のデフォルト値。`"flat"` または `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`                | カスタムSVG出力パス。プレースホルダー: <code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
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

- `version`
CLIのバージョンとビルドタイムスタンプを出力（ルートプログラムの`-V` / `--version`と同じ情報）。

- `init [-t ui-markdown\|ui-docusaurus\|ui-starlight] [-o path] [--with-translate-ignore]`
スターター設定ファイルを作成します（`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`documentations[].addFrontmatter`を含む）。`--with-translate-ignore`はスターター`.translate-ignore`を作成します。

- `check-models`
`GET /models`に対して各設定されたOpenRouterモデルIDを検証（カタログメンバーシップ、`expiration_date`、1MトークンあたりのUSD単価（プロンプト／コンプリーション））。`OPENROUTER_API_KEY`が必要。設定されたIDのいずれかが存在しないまたは期限切れの場合、エラーコードを返して終了。カタログリクエストに対して`openrouter.requestTimeoutMs`を尊重する。

- `extract`
`t("…")` / `i18n.t("…")`リテラル、オプションの`package.json`説明、およびオプションのマニフェスト`englishName`エントリから`strings.json`を更新（`ui.reactExtractor`を参照）。`features.extractUIStrings`が必要。

- `generate-ui-languages [--master <path>] [--dry-run]`
`sourceLocale` + `targetLocales`およびバンドルされた`data/ui-languages-complete.json`（または`--master`）を使用して、`ui-languages.json`を`ui.flatOutputDir`（または設定されている場合は`uiLanguagesPath`）に書き出す。マスターファイルに存在しないロケールに対しては警告を出し、`TODO`プレースホルダーを出力。カスタマイズされた`label`または`englishName`値を持つ既存のマニフェストがある場合、それらはマスターカタログのデフォルト値で置き換えられるため、生成されたファイルを確認して調整してください。

- `translate-docs …`
各`documentations`ブロック（`contentPaths`、オプションの`jsonSource`）に対してマークダウン／MDXおよびJSONを翻訳。`-j`：並列処理する最大ロケール数。`-b`：ファイルごとの並列バッチAPI呼び出しの最大数。`--prompt-format`：バッチ通信フォーマット（`xml` \| `json-array` \| `json-object`）。[キャッシュの動作と`translate-docs`フラグ](#cache-behaviour-and-translate-docs-flags)および[バッチプロンプトフォーマット](#batch-prompt-format)を参照。

- `write-heading-ids …`
**API は不要です。** 少なくとも 1 つの `documentations[]` ブロックが必要です。各ブロック内の `contentPaths` の下にある `.md` / `.mdx` を収集します（`.translate-ignore` を尊重します）。各フラットな ATX `#` 見出しの **直前**に HTML アンカー行 `<a id="slug"></a>` を挿入します（コードブロック内の見出しはスキップします）。`-p` / `--path` または `-f` / `--file`：プロジェクト相対パスのファイルまたはディレクトリに制限します。`--slug-style`：`github`（デフォルト；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。`pymdown` とともに、オプションで `--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode` を指定可能。`--dry-run`：変更内容のみをリスト表示。

- `strip-md-bold-inline …`
**API なし。** 少なくとも1つの `documentations[]` ブロックが必要です。各ブロックの `contentPaths` 配下にある `.md` / `.mdx` 内のインラインコードの前後にある `**` を削除します（`.translate-ignore` を尊重）。`-p` / `--path` または `-f` / `--file`、`--dry-run`、`--no-backup`（上書き前のタイムスタンプ付き `.backup.*` はスキップ）。

- `check-markdown …`
**API なし。** 各 `documentations[]` ブロックの `contentPaths` 配下のMarkdown/MDXをスキャン（`translate-docs` と同じ検出方法、`.translate-ignore` を尊重）：デリミタの対応、閉じられていないインラインコード、`**`/`__` が `` `...` `` スパンまたは `[text](../url)` リンクを囲む場合の `STRONG_OUTSIDE_INLINE_CODE` / `STRONG_OUTSIDE_LINK`。`-p` / `--path` または `-f` / `--file`：オプションのスコープ。問題がある場合は **stderr** に `relativePath:line: [ISSUE_CODE] message` 行を出力。問題が1つ以上あれば終了コードは **1**。`--json`：**stdout** に出力するJSON形式のレポート。`--no-cache` を指定しない限り、`cacheDir` 内に `markdown_source_issues` を書き込み。`-v` はstderr出力行にソースのハッシュ値を追加。

- `translate-svg …`
`config.svg` で設定されたSVGファイルを翻訳（ドキュメントとは別）。`features.translateSVG` が必要。ドキュメントと同じキャッシュ方式を採用。その実行時のSQLiteの読み書きをスキップするための `--no-cache` をサポート。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。

- `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`
UI文字列のみを翻訳。`--force`：すべてのエントリをロケールごとに再翻訳（既存の翻訳を無視）。`--dry-run`：書き込みなし、API呼び出しもなし。`-j`：並列処理する最大ロケール数。`features.translateUIStrings` が必要。

- `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`
最初に `extract` **first** を実行（`features.extractUIStrings` が必要）して、`strings.json` をソースと一致させた後、**source-locale** の UI 文字列に対して LLM によるレビュー（スペル、文法）を実施します。**用語のヒント** は `glossary.userGlossary` CSV からのみ取得されます（`translate-ui` と同じ範囲 — `strings.json` / `uiGlossary` ではないため、誤ったコピーが用語集として強化されることはありません）。OpenRouter（`OPENROUTER_API_KEY`）を使用します。アドバイスのみを提供（実行終了時に **0** で終了）。`cacheDir` 配下に **人間が読みやすい** 形式のレポート（要約、問題点、および文字列ごとの **OK** 行）として `lint-source-results_<timestamp>.log` を出力します。端末には要約カウントと問題点のみを表示（文字列ごとの `[ok]` 行は表示しない）。最後の行にログファイル名を出力します。`--json`：機械可読の完全な JSON レポートを標準出力にのみ出力（ログファイルは人間が読みやすいまま）。`--dry-run`：依然として `extract` を実行し、バッチ計画のみを出力（API 呼び出しは行わない）。`--chunk`：API バッチごとの文字列数（デフォルト **50**）。`-j`：並列実行可能な最大バッチ数（デフォルト `concurrency`）。`--json` を指定すると、人間向けの出力は stderr に出力されます。リンクには `path:line` を使用します。これは `editor` UI 文字列の「リンク」ボタンと同様です。

- `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`
`strings.json` をXLIFF 2.0形式でエクスポート（対象ロケールごとに1つの `.xliff`）。`-o` / `--output-dir`：出力ディレクトリ（デフォルト：カタログと同じフォルダ）。`--untranslated-only`：そのロケールで翻訳が欠落しているユニットのみ。読み取り専用。APIなし。

- `sync …`
有効化されている場合は抽出、次にUI翻訳、次に `features.translateSVG` と `config.svg` が設定されている場合に `translate-svg`、その後ドキュメント翻訳 — ただし `--no-ui`、`--no-svg`、`--no-docs` でスキップ可能。共通フラグ：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（ドキュメントのバッチ処理のみ）、`--force` / `--force-update`（ドキュメントのみ；ドキュメント実行時は相互に排他的）。ドキュメントフェーズでは `--emphasis-placeholders` および `--debug-failed` も引き継がれる（`translate-docs` と同じ意味）。`--prompt-format` は `sync` フラグではない。ドキュメントステップでは組み込みのデフォルト（`json-array`）を使用。

- `status [--max-columns <n>]`
`features.translateUIStrings`がオンの場合、ロケールごとのUIカバレッジ（`Translated` / `Missing` / `Total`）を出力します。次に、ファイル×ロケールごとのMarkdown翻訳ステータスを出力します（`--locale`フィルターなし。ロケールは設定ファイルから取得）。ロケール数が多い場合は、最大`n`列（デフォルトは**9**）の繰り返しテーブルに分割して、端末での行幅が狭くなるようにします。

- `statistics [--max-columns <n>]`
ドキュメントキャッシュおよび`strings.json`の統計情報を出力します（翻訳キャッシュエディターの「**統計**」と同じ集計値）。`--max-columns`：モデル×ロケールテーブルごとの最大ロケール列数（デフォルトはエディターと一致）。

- `cleanup [--dry-run] [--no-backup] [--backup <path>]`
まず`sync --force-update`を実行（抽出、UI、SVG、ドキュメント）し、その後、古くなったセグメント行（`last_hit_at`がnullまたはファイルパスが空）を削除します。解決されたソースパスがディスク上に存在しない`file_tracking`行を削除。`filepath`メタデータが存在しないファイルを指している翻訳行を削除します。3つのカウント（古くなった行、孤立した`file_tracking`、孤立した翻訳）をログ出力します。`--no-backup`でない限り、キャッシュディレクトリ内にタイムスタンプ付きのSQLiteバックアップを作成します。

- `clean-temp [-r|--root <path>] [-f|--force] [--dry-run]`
**設定なし。** ディレクトリツリーを走査（デフォルト: 現在の作業ディレクトリ）して `*.log` および `cache.db.backup*.sqlite` を検索し、`./…` パスを `find -print` のように出力します。一致がある場合：`Delete these files? (y/n)` をプロンプト表示（ただし `-f` / `--force` の場合はプロンプトなしで削除）。一致がない場合：プロンプトせずに終了。`--dry-run`：一覧表示のみ、プロンプトや削除は行わない（`--force` を上書き）。

- `editor [-p <port>] [--no-open]`
キャッシュ、`strings.json`、および用語集CSV用のローカルWebエディターを起動します。`--no-open`を指定すると、デフォルトブラウザは自動的に開かれません。  
**注意：** キャッシュエディターでエントリを編集した場合、更新されたキャッシュエントリを出力ファイルに反映させるために`sync --force-update`を実行する必要があります。また、後でソーステキストが変更された場合、新しいキャッシュキーが生成されるため、手動での編集は失われます。

- `glossary-generate [-o <path>]`
空の`glossary-user.csv`テンプレートを書き出します。`-o`：出力パスを上書き（デフォルトは設定ファイルの`glossary.userGlossary`、または`glossary-user.csv`）。

すべてのコマンドは、非デフォルトの設定ファイルを指定する`-c <path>`、詳細出力の`-v`、およびコンソール出力をログファイルに同時出力するための`-w` / `--write-logs [path]`（デフォルトパス：ルートの`cacheDir`以下）を受け入れます。

ルートプログラムも`-V` / `--version`および`-h` / `--help`をサポートしています。`ai-i18n-tools help [command]`は`ai-i18n-tools <command> --help`と同じコマンドごとの使い方を表示します。

---

<a id="environment-variables"></a>
## 環境変数

| 変数               | 説明                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | **必須**。OpenRouter API キー。                     |
| `OPENROUTER_BASE_URL`   | APIのベースURLを上書きします。                                 |
| `I18N_SOURCE_LOCALE`    | 実行時に`sourceLocale`を上書きします。                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`を上書きするためのカンマ区切りのロケールコード。  |
| `I18N_LOG_LEVEL`        | ロガーレベル（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`              | `1`の場合、ログ出力のANSIカラーを無効にします。              |
| `I18N_LOG_SESSION_MAX`  | ログセッションごとに保持される最大行数（既定値`5000`）。           |
