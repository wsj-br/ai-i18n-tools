<a id="ai-i18n-tools-getting-started"></a>
# ai-i18n-tools: クイックスタート

`ai-i18n-tools` は、2つの独立した組み合わせ可能なワークフローを提供します。

- **ワークフロー1 - UIの翻訳**: 任意のJS/TSソースから`t("…")`呼び出しを抽出し、OpenRouterを介して翻訳を行い、i18next向けにロケールごとのフラットなJSONファイルを出力します。
- **ワークフロー2 - ドキュメントの翻訳**: Markdown（MDX）およびDocusaurusのJSONラベルファイルを任意のロケールに翻訳し、スマートキャッシュを活用します。**SVG**アセットは`features.translateSVG`、最上位の`svg`ブロック、および`translate-svg`を使用します（[CLIリファレンス](#cli-reference)を参照）。

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
  - [失敗 (ドキュメント翻訳)](#failures-document-translation)
    - [使用するタイミング](#when-to-use-it)
    - [ソース編集が重要な理由](#why-source-edits-matter)
    - [タブの使い方](#how-to-use-the-tab)
- [構成リファレンス](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath` (オプション)](#uilanguagespath-optional)
  - [`concurrency` (オプション)](#concurrency-optional)
  - [`batchConcurrency` (オプション)](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars` (オプション)](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg` (オプション)](#svg-optional)
  - [`glossary`](#glossary)
- [CLIリファレンス](#cli-reference)
- [環境変数](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="installation"></a>
## インストール

公開されたパッケージは **ESM専用** です。Node.js またはバンドラーで `import`/`import()` を使用してください; `require('ai-i18n-tools')` は使用しないでください。パッケージは **`engines.node` `>=22.16.0`** を宣言しており、古い Node.js バージョンはサポートされていません。

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

デフォルトの `init` テンプレート (`ui-markdown`) は、**UI** の抽出と翻訳のみを有効にします。`ui-docusaurus` テンプレートは **ドキュメント** 翻訳 (`translate-docs`) を有効にします。設定に基づき、抽出、UI 翻訳、オプションのスタンドアロン SVG 翻訳、ドキュメント翻訳を1つのコマンドで実行したい場合は `sync` を使用してください。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
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

**以前は「`translate-ui` を実行して、次に `translate-svg`、次に `translate-docs`」という手順だったものに対しては、代わりに `sync`** を使用してください。`ai-i18n-tools sync` は、設定に従って、（有効時に）**extract**、**translate-ui**、オプションの **translate-svg**、そして **translate-docs** を、正しい順序で共有フラグ付きで実行します。これらの3つの翻訳コマンドを手動で連鎖させるのは、順序や抽出、ロケールフラグの指定など、間違えやすくなります。個別のステップのみを単独で実行する必要がある場合にのみ、`i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs` を使用してください。**single**

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

- `sourceLocale` - ソース言語の BCP-47 コード（例：`"en-GB"`）。ランタイムの i18n 設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされる `SOURCE_LOCALE` と**一致している必要があります**。
- `targetLocales` - ターゲット言語の BCP-47 コードの配列（例：`["de", "fr", "pt-BR"]`）。このリストから `ui-languages.json` マニフェストを作成するには `generate-ui-languages` を実行します。
- `ui.sourceRoots` - `t("…")` 呼び出しをスキャンするディレクトリ（例：`["src/"]`）。
- `ui.stringsJson` - マスターカタログの出力先（例：`"src/locales/strings.json"`）。
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

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` は ai-i18n-tools プロジェクト向けの **推奨される**接続方法です。キーのトリムとソースロケールの <code>{"{{var}}"}</code> インターポレーションフォールバックを適用（低レベルの `wrapI18nWithKeyTrim` と同じ動作）し、オプションで `addResourceBundle` 経由で `translate-ui` `{sourceLocale}.json` 複数形サフィックス付きキーをマージし、その後、`strings.json` から複数形対応の `wrapT` をインストールします。このバンドルされたファイルは、**設定された**ソースロケールの複数形フラットJSONでなければなりません — つまり、i18nブートストラップ（上記ステップ4参照）の `ai-i18n-tools.config.json` と `SOURCE_LOCALE` で使用される `sourceLocale` と同じものです。ブートストラップ中は `sourcePluralFlatBundle` を省略してください（`translate-ui` が `{sourceLocale}.json` を出力した後にマージします）。アプリケーションコードでは `wrapI18nWithKeyTrim` 単体の使用は **非推奨**です — 代わりに `setupKeyAsDefaultT` を使用してください。

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

<code>{"{{var}}"}</code>プレースホルダーには、i18nextのネイティブな第2引数インターポレーションを使用します。

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extractコマンドは、第**2引数**が単純なオブジェクトリテラルである場合にそれを解析し、`plurals: true`や`zeroDigit`といったツール用途専用のフラグを読み取ります（下記の**基数複数形**を参照）。通常の文字列では、ハッシュ化にはリテラルキーのみが使用されます。インターポレーションのオプションは実行時にi18nextに引き渡されます。

プロジェクトでカスタムインターポレーションユーティリティを使用している場合（たとえば、`t('key')`を呼び出してから、`interpolateTemplate(t('Hello {{name}}'), { name })`のようなテンプレート関数に結果をパイプするなど）、「`setupKeyAsDefaultT`（`wrapI18nWithKeyTrim`経由）」によりその必要がなくなります。これは、ソースロケールが生のキーを返す場合でも<code>{"{{var}}"}</code>インターポレーションを適用します。呼び出し元を`t('Hello {{name}}', { name })`に移行し、カスタムユーティリティを削除してください。

<a id="cardinal-plurals-plurals-true"></a>
### 基数複数形（`plurals: true`）

開発者デフォルトのコピーとして使用したい**同じリテラル**を使用し、`plurals: true`を渡して、extractおよび`translate-ui`がその呼び出しを1つの**基数複数形グループ**として扱うようにします（i18next JSON v4形式の`_zero`…`_other`形式）。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

- `zeroDigit`（オプション）— ツール用途専用。i18nextでは**読み込まれません**。`true`の場合、各ロケールでその形式が存在する場合に、`_zero`文字列内にリテラルのアラビア数字`0`を使用するようプロンプトが促します。`false`または省略された場合は、自然な「ゼロ」表現が使用されます。`i18next.t`を呼び出す前にこれらのキーを削除してください（下記の`wrapT`を参照）。

**検証:** メッセージに **2つ以上** の異なる `{{…}}` プレースホルダーが含まれている場合、 **そのうちの1つは `{{count}}`** でなければなりません (複数軸)。そうでない場合、 `extract` **失敗** し、明確なファイル/行メッセージが表示されます。

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

`ui-languages.json`マニフェストは、<code>{"{ code, label, englishName, direction }"}</code>エントリのJSON配列です（`direction`は`"ltr"`または`"rtl"`です）。例：

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

Markdownドキュメント、Docusaurusサイト、JSONラベルファイル向けに設計されています。Markdownに埋め込まれたPNGその他のラスターアイメージについては、[翻訳されたドキュメント内の画像およびラスターアセット](#images-and-raster-assets-in-translated-docs)を参照してください。スタンドアロンのSVGアセットは、`features.translateSVG`が有効で、最上位の`svg`ブロックが設定されている場合に、`documentations[].contentPaths`ではなく[`translate-svg`](#cli-reference)を通じて翻訳されます。

<a id="step-1-initialise-for-documentation"></a>
### ステップ1：ドキュメント用に初期化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

生成された`ai-i18n-tools.config.json`を編集します。

- `sourceLocale` - ソース言語（`docusaurus.config.js`の`defaultLocale`と一致している必要があります）。
- `targetLocales` - BCP-47ロケールコードの配列（例：`["de", "fr", "es"]`）。
- `cacheDir` - すべてのドキュメントパイプライン用の共有SQLiteキャッシュディレクトリ（および`--write-logs`のデフォルトログディレクトリ）。
- `documentations` - ドキュメントブロックの配列。各ブロックには、オプションの`description`、`contentPaths`、`outputDir`、オプションの`jsonSource`、`markdownOutput`、オプションの`segmentSplitting`、`targetLocales`、`addFrontmatter`などが含まれます。
- `documentations[].description` - メンテナー向けのオプションの短いメモ（このブロックの対象範囲）。設定されている場合、`translate-docs`の見出し（`🌐 …: translating …`）および`status`のセクションヘッダーに表示されます。
- `documentations[].contentPaths` - Markdown/MDXのソースディレクトリまたはファイル（JSONラベルについては`documentations[].jsonSource`も参照）。
- `documentations[].outputDir` - そのブロックの翻訳出力ルート。
- `documentations[].markdownOutput.style` - `"nested"`（デフォルト）、`"docusaurus"`、または`"flat"`（[出力レイアウト](#output-layouts)を参照）。

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

| フラグ                          | 効果                                                                                                                                                                                                                                                                  |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *(デフォルト)*                   | 追跡情報とディスク上の出力が一致している場合に変更のないファイルをスキップ。それ以外の処理ではセグメントキャッシュを使用。                                                                                                                                                                              |
| `-l, --locale <codes>`        | カンマ区切りのターゲットロケール（省略された場合は、ルートの`targetLocales`および各`documentations[]`ブロックのオプション`targetLocales`の和集合がデフォルトになります）。                                                                                                                                                          |
| `-p, --path` / `-f, --file`   | このパス以下のMarkdown/JSONのみを翻訳（プロジェクト相対または絶対パス）; `--file`は`--path`のエイリアスです。                                                                                                                                                         |
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

| モード                       | ユーザーメッセージ                                                           | モデルの応答                                                 |
|----------------------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| `xml`                  | パセドXML：セグメントごとに1つの`<seg id="N">…</seg>`（XMLエスケープ付き）。 | セグメントインデックスごとに1つずつの`<t id="N">…</t>`ブロックのみ。       |
| `json-array` (デフォルト) | 順序通りのセグメントごとに1つのエントリを持つJSON配列。               | **同じ長さ**のJSON配列（同じ順序）。           |
| `json-object`          | セグメントインデックスをキーとするJSONオブジェクト `{"0":"…","1":"…",…}`。            | **同じキー**と翻訳された値を持つJSONオブジェクト。 |

実行ヘッダーには `Batch prompt format: …` も表示されるため、現在のモードを確認できます。JSONラベルファイル（`jsonSource`）およびスタンドアロンSVGバッチは、それらのステップが `translate-docs` の一部として実行される場合（または `sync` のドキュメントフェーズ）に同じ設定を使用します（`sync` はこのフラグを公開せず、デフォルトは `json-array` です）。

<a id="segment-dedupe-and-paths-in-sqlite"></a>
#### SQLiteにおけるセグメントの重複排除とパス

- セグメント行は`(source_hash, locale)`（ハッシュ = 正規化されたコンテンツ）によってグローバルにキー付けされています。2つのファイルに同一のテキストがある場合、1つの行を共有します; `translations.filepath`はメタデータ（最終編集者）であり、ファイルごとの2番目のキャッシュエントリではありません。
- `file_tracking.filepath`は名前空間付きキーを使用します: `doc-block:{index}:{relPath}`は`documentations`ブロックごと（`relPath`はプロジェクトルート相対のposix: 収集されたmarkdownパス; **JSONラベルファイルはソースファイルへのcwd相対パスを使用します**、例: `docs-site/i18n/en/code.json`、したがってクリーンアップは実際のファイルを解決できます）、および`svg-assets:{relPath}`は`translate-svg`の下のスタンドアロンSVGアセット用です。
- `translations.filepath`はmarkdown、JSON、およびSVGセグメントのcwd相対posixパスを保存します（SVGは他のアセットと同じパス形状を使用します; `svg-assets:…`プレフィックスは**のみ**`file_tracking`にあります）。
- 実行後、`last_hit_at`はセグメント行**同じ翻訳スコープ内**（`--path`および有効な種類を尊重）でヒットしなかったものに対してのみクリアされるため、フィルタリングされたまたはドキュメント専用の実行は無関係なファイルを古くなったとマークしません。

<a id="output-layouts"></a>
### 出力レイアウト

`"nested"`（省略時のデフォルト） — ソースツリーを `{outputDir}/{locale}/` 配下にミラー（例：`docs/guide.md` → `i18n/de/docs/guide.md`）。

`"docusaurus"` — 通常のDocusaurus i18nレイアウトに従って、`i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>`にある`docsRoot`以下のファイルを配置します。`documentations[].markdownOutput.docsRoot`をドキュメントのソースルートに設定してください（例: `"docs"`）。

```text
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

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

**図版として使用されるSVG**は`svg`ブロックと`translate-svg`を使用します — [`svg` (オプション)](#svg-optional)を参照してください。`documentations[].contentPaths`にリストされたパスは、スタンドアロンのSVG翻訳ではなく、Markdown/MDX（およびオプションのJSONラベル）用です。

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

**パターン2 — ロケールごとのスクリーンショットフォルダー（`examples/nextjs-app`）**

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

**パターン3 — スタンドアロンSVG（`examples/nextjs-app`）**

同じ例では`features.translateSVG`が有効になっており、ソースSVGはWebアプリのpublicフォルダーにマッピングされています：

```json
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg`（または`sync`）を実行して、`images/*.svg`が`public/assets/`以下のロケールごとの出力になります。MarkdownはそれらのURLを`translate-docs`とは別に参照します。

**最小限のREADME専用の例（`examples/console-app`）**

`examples/console-app/ai-i18n-tools.config.json`は`README.md`を`translated-docs/`に`postProcessing.languageListBlock`のみで翻訳します。READMEに兄弟のラスターファイルがなく、またはホストが既に提供している絶対URLのみを使用する場合に適しています。

置換テンプレートは`${translatedLocale}`や`${translatedBasedir}`などのプレースホルダーをサポートしています（完全なリストは[構成リファレンス](#configuration-reference)の`markdownOutput.postProcessing.regexAdjustments`行を参照）

<a id="markdown-output-path-template-placeholders"></a>
#### `pathTemplate` / `jsonPathTemplate` プレースホルダー

翻訳されたファイルの出力先を、`documentations[].markdownOutput.pathTemplate`（MarkdownおよびMDX）または`jsonPathTemplate`（JSONラベルファイル）を設定することで上書きできます。どちらも同じプレースホルダーを受け入れます。解決されたパスは、そのブロックの`outputDir`内に留まる必要があります（CLIは外部に脱出するパスを拒否します）。

カスタムの`pathTemplate`を使用する場合、明示的に設定しない限り、`rewriteRelativeLinks`はデフォルトで`false`になります — フラットスタイルのリンク書き換えは、組み込みの`flat`レイアウト向けに設計されています。

| プレースホルダー | 役割 | 例 |
|-------------|------|---------|
| `{outputDir}` | このドキュメントブロックの`outputDir`の絶対解決パス | `/home/acme/repo/i18n` |
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

`npx ai-i18n-tools sync` を実行して1つのパイプラインを実行します: **抽出** UI文字列（`features.extractUIStrings` の場合）、**UI文字列の翻訳**（`features.translateUIStrings` の場合）、**スタンドアロンSVGアセットの翻訳**（`features.translateSVG` かつ `svg` ブロックが設定されている場合）、その後 **ドキュメントの翻訳**（各 `documentations` ブロック：設定に応じてmarkdown/JSON）。`--no-ui`、`--no-svg`、または `--no-docs` を使用して、一部をスキップできます。ドキュメントのステップでは `--dry-run`、`-p` / `--path`、`--force`、`--force-update` を受け入れます（最後の2つはドキュメント翻訳が実行される場合にのみ適用され、`--no-docs` を渡すと無視されます）。

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
      "description": "Docusaurus docs and JSON labels",
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

- UI文字列は `src/` から `public/locales/` に抽出／翻訳されます。
- 最初のドキュメントブロックは、MarkdownおよびJSONラベルをDocusaurusの `i18n/<locale>/...` レイアウトに翻訳します。
- 2番目のドキュメントブロックは `README.md` を `translated-docs/` 配下のロケールサフィックス付き平坦ファイルに翻訳します。
- すべてのドキュメントブロックは `cacheDir` を共有するため、変更されていないセグメントは実行間で再利用され、API呼び出しとコストを削減できます。

---

<a id="translation-cache-editor"></a>
## 翻訳キャッシュエディター

実行方法：

```bash
ai-i18n-tools editor
# Optional: choose port, do not auto-open browser
# ai-i18n-tools editor -p 8765 --no-open
```

これは、設定済みの **`cacheDir`** SQLite データベース（CLI がドキュメントセグメント、ログ、および関連メタデータに使用するのと同じフォルダー）をバックエンドとして使用するローカルWeb UI を起動します。UI には、**Documentation**（キャッシュされたドキュメントセグメント）、**UI strings**、**UI plurals**、**Glossary**、**Failures**、および **Statistics** のタブが含まれます。

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

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（オプション）

ドキュメント翻訳のセグメントバッチ処理：APIリクエストごとのセグメント数と文字数の上限。デフォルト：**20**セグメント、**4096**文字（省略時）。

<a id="openrouter"></a>
### `openrouter`

| フィールド               | 説明                                                                                                                                                                                                      |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `baseUrl`           | OpenRouter APIのベースURL。デフォルト：`https://openrouter.ai/api/v1`。                                                                                                                                                |
| `translationModels` | 優先順に並べたモデルIDのリスト。最初のモデルから順に試行され、エラー時には後続のモデルがフォールバックとして使用されます。`translate-ui`の場合のみ、`ui.preferredModel`を設定して、このリストの前に1つのモデルを試行することもできます（`ui`を参照）。
| `defaultModel`      | 従来の単一プライマリモデル。`translationModels`が未設定または空の場合にのみ使用されます。                                                                                                                               |
| `fallbackModel`     | 従来の単一フォールバックモデル。`translationModels`が未設定または空の場合に、`defaultModel`の後に使用されます。                                                                                                              |
| `maxTokens`         | 要求ごとの最大完了トークン数。デフォルト: `8192`。                                                                                                                                                              |
| `temperature`       | サンプリング温度。デフォルト: `0.2`。                                                                                                                                                                            |
| `requestTimeoutMs` | OpenRouter への各 HTTP リクエスト（チャット完了および内部の `GET /models` 呼び出し）を待機する最大時間（ミリ秒単位）。デフォルト: `30000`（30秒）。|

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
| `translateMarkdown`  | 2        | `.md` / `.mdx`ファイルを翻訳します。                                                                                                                                    |
| `translateJSON`      | 2        | DocusaurusのJSONラベルファイルを翻訳します。                                                                                                                             |
| `translateSVG`       | 2        | スタンドアロンの`.svg`アセットを翻訳します（トップレベルの`svg`ブロックが必要です）。                                                                                         |

**スタンドアロンの**SVGアセットは、`features.translateSVG`がtrueかつトップレベルの`svg`ブロックが設定されている場合に`translate-svg`で翻訳されます。`sync`コマンドは、両方が設定されている場合にそのステップを実行します（`--no-svg`でない限り）。

<a id="ui"></a>
### `ui`

| フィールド                                          | 説明                                                                                                                                                                                                                                                        |
|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourceRoots`                                  | `t("…")`呼び出しをスキャンするディレクトリ（カレントワーキングディレクトリからの相対パス）。                                                                                                                                                                                                          |
| `stringsJson`                                  | マスターカタログファイルへのパス。`extract` によって更新されます。                                                                                                                                                                                                             |
| `flatOutputDir`                                | ロケールごとの JSON ファイルが書き出されるディレクトリ（`de.json` など）。                                                                                                                                                                                               |
| `preferredModel`                               | オプション。`translate-ui` のみに最初に試行される OpenRouter モデル ID。次に、この ID を重複させずに順に `openrouter.translationModels`（またはレガシーモデル）が試行されます。                                                                                                   |
| `reactExtractor.funcNames`                     | スキャンする追加の関数名（デフォルト: `["t", "i18n.t"]`）。                                                                                                                                                                                                    |
| `reactExtractor.extensions`                    | 含めるファイル拡張子（デフォルト: `[".js", ".jsx", ".ts", ".tsx"]`）。                                                                                                                                                                                            |
| `reactExtractor.includePackageDescription`     | `true` の場合（デフォルト）、`extract` は存在する場合に `package.json` `description` を UI 文字列として含めます。                                                                                                                                                           |
| `reactExtractor.packageJsonPath`               | オプションの説明抽出に使用される `package.json` ファイルへのカスタムパス。                                                                                                                                                                              |
| `reactExtractor.includeUiLanguageEnglishNames` | `true` の場合（デフォルト `false`）、`extract` は、ソーススキャンから既に存在しない場合に、マニフェストの `uiLanguagesPath` にある各 `englishName` を `strings.json` に追加します（同じハッシュキー）。有効な `ui-languages.json` を指す `uiLanguagesPath` が必要です。 |

<a id="cachedir"></a>
### `cacheDir`

| フィールド      | 説明                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | すべての `documentations` ブロックで共有される SQLite キャッシュディレクトリ。実行間で再利用されます。カスタムドキュメント翻訳キャッシュから移行する場合は、アーカイブまたは削除してください。`cacheDir` は独自の SQLite データベースを作成し、他のスキーマとは互換性がありません。 |

VCS 除外のベストプラクティス:

- 一時的なキャッシュ成果物のコミットを避けるため、翻訳キャッシュフォルダーの内容を除外してください（たとえば `.gitignore` または `.git/info/exclude` 経由で）。
- ソースの変更されていないセグメントの再翻訳を回避し、`ai-i18n-tools` を使用するソフトウェアの変更やアップグレード時に実行時間と API コストを節約するために、`cache.db` を保持してください（通常は削除しないでください）。

例:

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

<a id="documentations"></a>
### `documentations`

ドキュメントパイプラインブロックの配列。`translate-docs` と `sync` のドキュメントフェーズが各ブロックを順番に**処理します**。

| フィールド                                             | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `description`                                     | このブロックの任意の人が読めるメモ（翻訳では使用されません）。設定されている場合、`translate-docs` `🌐`見出しの前に接頭辞として表示されます。また、`status`セクションヘッダーにも表示されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `contentPaths`                                    | 翻訳対象のMarkdown/MDXソース（`translate-docs`はこれらを`.md` / `.mdx`用にスキャンします）。JSONラベルは、同じブロック内の`jsonSource`から取得されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `outputDir`                                       | このブロックの翻訳出力のルートディレクトリ。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sourceFiles`                                     | 読み込み時に `contentPaths` にマージされるオプションのエイリアスです。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `targetLocales`                                   | このブロック専用のロケールのオプションのサブセット（指定しない場合はルートの `targetLocales` を使用）。有効なドキュメントロケールは、すべてのブロックにわたる和集合となります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `jsonSource`                                      | このブロックの Docusaurus JSON ラベルファイルのソースディレクトリ（例: `"i18n/en"`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.style`                            | `"nested"`（デフォルト）、`"docusaurus"`、または `"flat"`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.docsRoot`                         | Docusaurus レイアウト用のソースドキュメントのルート（例: `"docs"`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `markdownOutput.pathTemplate`                     | カスタムマークダウン出力パス。使用可能なプレースホルダー: <code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。                                                                                                                                                                                                                                                                                                                                                     |
| `markdownOutput.jsonPathTemplate`                 | ラベルファイルのカスタムJSON出力パス。`pathTemplate`と同じプレースホルダーをサポートします。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownOutput.flatPreserveRelativeDir`          | `flat`スタイルの場合、同じベース名を持つファイルが衝突しないように、ソースのサブディレクトリを保持します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `markdownOutput.rewriteRelativeLinks`             | 翻訳後に相対リンクを書き換えます（`flat`スタイルでは自動的に有効になります）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `markdownOutput.linkRewriteDocsRoot`              | フラットリンクの書き換えプレフィックスを計算する際に使用されるリポジトリのルート。通常は`"."`のままにしてください。翻訳されたドキュメントが別のプロジェクトルート下にある場合を除きます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `markdownOutput.postProcessing`                | 翻訳された**markdown本文**にオプションの変換を適用（YAMLフロントマターは保持される）。セグメントの再結合およびフラットリンクの書き換え後、`addFrontmatter`の前に行われる。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `segmentSplitting`                             | `markdownOutput`と同じレベル（`documentations[]`ブロックごと）。`translate-docs`抽出用のより細かいセグメント：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`。`enabled`が`true`の場合（`segmentSplitting`が省略された場合のデフォルト）、密度の高い段落、GFMパイプテーブル（最初のチャンクにヘッダー、セパレーター、および最初のデータ行を含む）、長いリストが分割される。サブパートは単一の改行で再結合される（`tightJoinPrevious`）。`"enabled": false`を設定すると、空行で区切られた本文ブロックごとに1つのセグメントのみを使用する。 |
| `markdownOutput.postProcessing.regexAdjustments`  | `{ "description"?, "search", "replace" }`の順序付きリスト。`search`は正規表現パターン（プレーン文字列の場合はフラグ`g`、または`/pattern/flags`を使用）。`replace`は`${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}`などのプレースホルダーをサポート。                                                                                                                                                                                                                                                                                                    |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator", "label" }` — トランスレーターは、最初に `start` を含む行と一致する `end` 行を検索し、その範囲を標準の言語切り替えウィジェットに置き換えます。`label` はマニフェストのラベルのソースを制御します: `"local"` (デフォルト、`ui-languages.json` `label` を使用) または `"english"` (`englishName` を使用)。リンクは翻訳されたファイルからの相対パスで構築されます。マニフェストが設定されていない場合、ラベルは `localeDisplayNames` とロケールコードから取得されます。|
| `addFrontmatter`                                  | `true`の場合（省略時のデフォルト）、翻訳されたMarkdownファイルにはYAMLキー：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`が含まれ、少なくとも1つのセグメントにモデルメタデータがある場合は`translation_models`（使用されたOpenRouterモデルIDのソート済みリスト）も含まれる。`false`に設定するとスキップされる。                                                                                                                                                                                                                                                                                                                           |

例（フラットREADMEパイプライン — スクリーンショットパス＋オプションの言語リストラッパー）:

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

<a id="svg-optional"></a>
### `svg`（オプション）

スタンドアロンSVGアセットのトップレベルのパスおよびレイアウト。`features.translateSVG`がtrueの場合（`translate-svg`または`sync`のSVGステージ経由）にのみ翻訳が実行される。

| フィールド | 説明 |
|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`                  | `.svg` ファイルを再帰的にスキャンするディレクトリ、またはディレクトリの配列。                                                                                                                                                                                                     |
| `outputDir`                   | 翻訳されたSVG出力のルートディレクトリ。                                                                                                                                                                                                                                          |
| `style`                       | `pathTemplate` が設定されていない場合のデフォルト値。`"flat"` または `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`                | カスタムSVG出力パス。使用可能なプレースホルダー: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>。 |
| `svgExtractor.forceLowercase` | SVG再構築時のテキストを小文字に変換します。すべて小文字のラベルに依存するデザインに便利です。                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| フィールド | 説明 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 既存の翻訳から自動的に用語集を生成するための `strings.json` へのパス。                                                                                                 |
| `userGlossary` | `Original language string`（または `en`）、`locale`、`Translation` の列を持つCSVファイルへのパス。各行は1つのソース用語と対象ロケールに対応します（`locale` はすべての対象言語で `*` でも可）。 |

レガシーのキー `uiGlossaryFromStringsJson` は、設定読み込み時に `uiGlossary` にマッピングされ、引き続き使用可能です。

空の用語集CSVを生成するには:

```bash
npx ai-i18n-tools glossary-generate
```

---

<a id="cli-reference"></a>
## CLIリファレンス

| コマンド | 説明 |
|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `version` | CLIのバージョンとビルドタイムスタンプを表示します（ルートプログラムの`-V` / `--version`と同様の情報）。 |
| `init [-t ui-markdown\|ui-docusaurus] [-o path] [--with-translate-ignore]`  | スターター設定ファイルを書き込みます（`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、および`documentations[].addFrontmatter`を含む）。`--with-translate-ignore`はスターターの`.translate-ignore`を作成します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `check-models` | 設定された各 OpenRouter モデル ID を `GET /models` に対して検証します（カタログ登録の有無、`expiration_date`、プロンプト／コンプリートの100万トークンあたりの米ドル価格）。`OPENROUTER_API_KEY` を必要とします。設定された ID のいずれかが存在しないか期限切れの場合、非ゼロで終了します。カタログリクエストでは `openrouter.requestTimeoutMs` を尊重します。|
| `extract`                                                                   | `t("…")` / `i18n.t("…")`リテラル、任意の`package.json`説明、および任意のマニフェスト`englishName`エントリから`strings.json`を更新します（`ui.reactExtractor`を参照）。`features.extractUIStrings`が必要です。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `generate-ui-languages [--master <path>] [--dry-run]`                       | `sourceLocale` + `targetLocales`およびバンドルされた`data/ui-languages-complete.json`（または`--master`）を使用して、`ui-languages.json`を`ui.flatOutputDir`（または設定されている場合は`uiLanguagesPath`）に書き込みます。マスターファイルに存在しないロケールについては警告を出し、`TODO`のプレースホルダーを出力します。カスタマイズされた`label`または`englishName`値を持つ既存のマニフェストがある場合、それらはマスターカタログのデフォルト値に置き換えられます。生成されたファイルは、後で確認して調整してください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `translate-docs …`                                                          | 各`documentations`ブロック（`contentPaths`、省略可能な`jsonSource`）のMarkdown/MDXおよびJSONを翻訳します。`-j`：並列処理可能なロケールの最大数。`-b`：ファイルごとの並列バッチAPI呼び出しの最大数。`--prompt-format`：バッチのワイヤーフォーマット（`xml` \| `json-array` \| `json-object`）。[キャッシュの動作と`translate-docs`フラグ](#cache-behaviour-and-translate-docs-flags)および[バッチプロンプトフォーマット](#batch-prompt-format)を参照してください。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `write-heading-ids …`                                                       | **APIなし。**少なくとも1つの`documentations[]`ブロックが必要です。各ブロックの`contentPaths`以下にある`.md` / `.mdx`を収集します（`.translate-ignore`を尊重）。各フラットなATX `#`見出しの**直前**にHTMLアンカー行`<a id="slug"></a>`を挿入します（コードブロック内の見出しはスキップ）。`-p` / `--path`または`-f` / `--file`：プロジェクト相対のファイルまたはディレクトリに限定。`--slug-style`：`github`（デフォルト；doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。`pymdown`とともに、省略可能な`--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--dry-run`：変更点のみをリスト表示。                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `strip-md-bold-inline …`                                                    | **APIはありません。** 少なくとも1つの`documentations[]`ブロックが必要です。各ブロックの`contentPaths`にある`.md` / `.mdx`内のインラインコードの周囲の`**`を削除します（`.translate-ignore`を尊重）。`-p` / `--path`または`-f` / `--file`、`--dry-run`、`--no-backup`（上書き前にタイムスタンプ付き`.backup.*`をスキップ）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `translate-svg …`                                                           | `config.svg`で設定されたスタンドアロンのSVGアセットを翻訳（ドキュメントとは別）。`features.translateSVG`が必要。ドキュメントと同じキャッシュの考え方を採用。その実行ではSQLiteの読み書きをスキップするための`--no-cache`をサポート。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`             | UI文字列のみを翻訳します。`--force`: すべてのエントリをロケールごとに再翻訳（既存の翻訳を無視）。`--dry-run`: 書き込みなし、API呼び出しもなし。`-j`: 最大並列ロケール数。`features.translateUIStrings`が必要です。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`                                                                    | 最初に`extract` **first**を実行（`features.extractUIStrings`が必要）して、`strings.json`がソースと一致させた後、**source-locale**のUI文字列に対するLLMによるレビュー（スペル、文法）を行います。**用語のヒント**は`glossary.userGlossary`のCSVからのみ取得（`translate-ui`と同じ範囲 — `strings.json` / `uiGlossary`ではないため、誤ったコピーが用語集として強化されることはありません）。OpenRouter（`OPENROUTER_API_KEY`）を使用します。アドバイスのみ（実行終了時に**0**で終了）。`cacheDir`の下に**人間が読める形式**のレポート（要約、問題点、および文字列ごとの**OK**行）として`lint-source-results_<timestamp>.log`を出力。端末には要約カウントと問題点のみを表示（文字列ごとに`[ok]`行は表示しない）。最後の行にログファイル名を出力します。`--json`: 機械読み取り可能なJSONレポートをstdoutにのみ出力（ログファイルは人間が読める形式のまま）。`--dry-run`: 依然として`extract`を実行し、バッチ計画のみを出力（API呼び出しはなし）。`--chunk`: APIバッチごとの文字列数（デフォルト**50**）。`-j`: 最大並列バッチ数（デフォルト`concurrency`）。`--json`指定時は、人間向けの出力をstderrに出力。リンクには`path:line`を使用（`editor` UI文字列の「リンク」ボタンと同様）。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | `strings.json`をXLIFF 2.0形式でエクスポート（対象ロケールごとに`.xliff`を1つ作成）。`-o` / `--output-dir`: 出力ディレクトリ（デフォルト: カタログと同じフォルダ）。`--untranslated-only`: そのロケールで翻訳が欠落しているユニットのみ。読み取り専用。APIは使用しません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sync …`                                                                    | 有効になっている場合に抽出を行い、次にUIの翻訳、次に`features.translateSVG`と`config.svg`が設定されている場合に`translate-svg`を実行し、その後にドキュメントの翻訳を実行します。ただし、`--no-ui`、`--no-svg`、または`--no-docs`でスキップされる場合を除きます。共有フラグ: `-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（ドキュメントのバッチ処理のみ）、`--force` / `--force-update`（ドキュメントのみ、ドキュメント実行時は相互に排他的）。ドキュメントフェーズでは、`--emphasis-placeholders`および`--debug-failed`も転送されます（意味は`translate-docs`と同じ）。`--prompt-format`は`sync`フラグではありません。ドキュメントステップでは組み込みのデフォルト（`json-array`）が使用されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `status [--max-columns <n>]`                                                | `features.translateUIStrings`が有効の場合、ロケールごとのUIカバレッジ（`Translated` / `Missing` / `Total`）を出力します。次に、ファイル×ロケールごとのMarkdown翻訳ステータスを出力します（`--locale`フィルターなし。ロケールは設定から取得）。ロケール数が多い場合は、端末での行幅が狭くなるよう、最大`n`列（デフォルト**9**）の繰り返しテーブルに分割して出力します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `statistics [--max-columns <n>]`                                             | ドキュメントキャッシュと`strings.json`の統計情報を出力（翻訳キャッシュエディターの「**統計**」と同じ集計値）。`--max-columns`：モデルごとのロケールテーブルあたりの最大ロケール列数（デフォルトはエディターに一致）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                       | 最初に`sync --force-update`を実行（抽出、UI、SVG、ドキュメント）、次に古くなったセグメント行（`last_hit_at`がnullまたはファイルパスが空）を削除。解決されたソースパスがディスク上に存在しない`file_tracking`行を破棄。`filepath`メタデータが存在しないファイルを指している翻訳行を削除。3つのカウント（古くなった行、孤立した`file_tracking`、孤立した翻訳）をログ出力。`--no-backup`を指定しない限り、キャッシュディレクトリ内にタイムスタンプ付きのSQLiteバックアップを作成します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `editor [-p <port>] [--no-open]`                                            | キャッシュ、`strings.json`、および用語集CSV用のローカルWebエディタを起動します。`--no-open` を指定すると、デフォルトブラウザは自動的に開かれません。<br><br>**注意：** キャッシュエディタでエントリを編集した場合、更新されたキャッシュエントリを出力ファイルに反映させるために `sync --force-update` を実行する必要があります。また、後でソーステキストが変更されると、新しいキャッシュキーが生成されるため、手動での編集は失われます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `glossary-generate [-o <path>]`                                             | 空の`glossary-user.csv`テンプレートを書き出します。`-o`：出力パスを上書きします（既定値：設定からの`glossary.userGlossary`、または`glossary-user.csv`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

すべてのコマンドは、既定以外の設定ファイルを指定する`-c <path>`、詳細出力の`-v`、およびログファイルにコンソール出力を同時に出力するための`-w` / `--write-logs [path]`（既定のパス：ルートの`cacheDir`以下）を受け入れます。ルートプログラムは、`-V` / `--version`および`-h` / `--help`もサポートしています。`ai-i18n-tools help [command]`は`ai-i18n-tools <command> --help`と同じコマンドごとの使用法を表示します。

---

<a id="environment-variables"></a>
## 環境変数

| 変数                | 説明                                                |
|-------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`    | **必須。** OpenRouter APIキー。                     |
| `OPENROUTER_BASE_URL`   | APIのベースURLを上書きします。                                 |
| `I18N_SOURCE_LOCALE`    | 実行時に`sourceLocale`を上書きします。                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`を上書きするためのカンマ区切りのロケールコード。  |
| `I18N_LOG_LEVEL`        | ロガーレベル（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`              | `1`の場合、ログ出力のANSIカラーを無効にします。              |
| `I18N_LOG_SESSION_MAX`  | ログセッションごとに保持される最大行数（既定値`5000`）。           |
