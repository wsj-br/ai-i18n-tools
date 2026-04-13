# ai-i18n-tools: 始めに

`ai-i18n-tools` は、2つの独立した、合成可能なワークフローを提供します：

- **ワークフロー 1 - UI 翻訳**: 任意の JS/TS ソースから `t("…")` コールを抽出し、OpenRouter を介して翻訳し、i18next 用にロケールごとのフラットな JSON ファイルを書き出します。
- **ワークフロー 2 - ドキュメント翻訳**: マークダウン (MDX) と Docusaurus JSON ラベルファイルを任意の数のロケールに翻訳し、スマートキャッシングを行います。**SVG** アセットは別のコマンド (`translate-svg`) とオプションの `svg` 設定を使用します（[CLI リファレンス](#cli-reference)を参照）。

両方のワークフローは OpenRouter（互換性のある LLM）を使用し、単一の設定ファイルを共有します。

**他の言語で読む:**

<small id="lang-list">[en-GB](../../docs/GETTING_STARTED.md) · [de](./GETTING_STARTED.de.md) · [es](./GETTING_STARTED.es.md) · [fr](./GETTING_STARTED.fr.md) · [hi](./GETTING_STARTED.hi.md) · [ja](./GETTING_STARTED.ja.md) · [ko](./GETTING_STARTED.ko.md) · [pt-BR](./GETTING_STARTED.pt-BR.md) · [zh-CN](./GETTING_STARTED.zh-CN.md) · [zh-TW](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- このセクションを編集しないでください。更新するには doctoc を再実行してください -->
**目次**

- [インストール](#installation)
- [クイックスタート](#quick-start)
- [ワークフロー 1 - UI 翻訳](#workflow-1---ui-translation)
  - [ステップ 1: 初期化](#step-1-initialise)
  - [ステップ 2: 文字列を抽出](#step-2-extract-strings)
  - [ステップ 3: UI 文字列を翻訳](#step-3-translate-ui-strings)
  - [ステップ 4: 実行時に i18next を接続](#step-4-wire-i18next-at-runtime)
  - [ソースコード内での `t()` の使用](#using-t-in-source-code)
  - [補間](#interpolation)
  - [言語切替 UI](#language-switcher-ui)
  - [RTL 言語](#rtl-languages)
- [ワークフロー 2 - ドキュメント翻訳](#workflow-2---document-translation)
  - [ステップ 1: 初期化](#step-1-initialise-1)
  - [ステップ 2: ドキュメントを翻訳](#step-2-translate-documents)
    - [キャッシュ動作と `translate-docs` フラグ](#cache-behaviour-and-translate-docs-flags)
  - [出力レイアウト](#output-layouts)
- [統合ワークフロー (UI + ドキュメント)](#combined-workflow-ui--docs)
- [設定リファレンス](#configuration-reference)
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
- [CLI リファレンス](#cli-reference)
- [環境変数](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## インストール

公開されたパッケージは **ESM のみ** です。Node.js またはバンドラーで `import` / `import()` を使用してください; **`require('ai-i18n-tools')` は使用しないでください。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

OpenRouter API キーを設定してください：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

または、プロジェクトのルートに `.env` ファイルを作成します：

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## クイックスタート

デフォルトの `init` テンプレート（`ui-markdown`）は、**UI** の抽出と翻訳のみを有効にします。`ui-docusaurus` テンプレートは **ドキュメント** 翻訳（`translate-docs`）を有効にします。`sync` を使用すると、抽出、UI 翻訳、オプションのスタンドアロン SVG 翻訳、およびドキュメント翻訳を設定に従って実行する単一のコマンドが実行されます。

```bash
# Workflow 1 - UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Workflow 2 - docs (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
npx ai-i18n-tools translate-docs

# Combined: extract UI strings, then translate UI + docs (per config features)
npx ai-i18n-tools sync

# Markdown translation status (per file × locale)
npx ai-i18n-tools status
```

---

## ワークフロー 1 - UI 翻訳

i18next を使用する任意の JS/TS プロジェクト向けに設計されています: React アプリ、Next.js（クライアントおよびサーバーコンポーネント）、Node.js サービス、CLI ツール。

### ステップ 1: 初期化

```bash
npx ai-i18n-tools init
```

これにより、`ai-i18n-tools.config.json` が `ui-markdown` テンプレートで書き込まれます。これを編集して以下を設定します：

- `sourceLocale` - ソース言語の BCP-47 コード（例：`"en-GB"`）。ランタイム i18n 設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされる `SOURCE_LOCALE` と**一致している必要があります**。
- `targetLocales` - `ui-languages.json` マニフェストへのパス、または BCP-47 コードの配列。
- `ui.sourceRoots` - `t("…")` 呼び出しをスキャンするディレクトリ（例：`["src/"]`）。
- `ui.stringsJson` - マスターカタログを書き出す場所（例：`"src/locales/strings.json"`）。
- `ui.flatOutputDir` - `de.json`、`pt-BR.json` などを書き出す場所（例：`"src/locales/"`）。
- `ui.preferredModel`（オプション）- `translate-ui` のみで**最初に**試す OpenRouter モデル ID。失敗した場合、CLI は `openrouter.translationModels`（またはレガシーな `defaultModel` / `fallbackModel`）の順序に従って重複をスキップしながら続行します。

### ステップ 2: 文字列の抽出

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 配下のすべての JS/TS ファイルをスキャンし、`t("literal")` および `i18n.t("literal")` 呼び出しを検出します。結果を `ui.stringsJson` に書き出し（またはマージ）します。

スキャナは設定可能です。`ui.reactExtractor.funcNames` を介してカスタム関数名を追加できます。

### ステップ 3: UI 文字列の翻訳

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` を読み込み、各ターゲットロケールごとにバッチを OpenRouter に送信し、フラットな JSON ファイル（`de.json`、`fr.json` など）を `ui.flatOutputDir` に書き出します。`ui.preferredModel` が設定されている場合、`openrouter.translationModels` の順序付きリストよりも前にそのモデルが試行されます（ドキュメント翻訳やその他のコマンドは引き続き `openrouter` のみを使用します）。

各エントリごとに、`translate-ui` は各ロケールを正常に翻訳した **OpenRouter モデル ID** を、オプションの `models` オブジェクト（`translated` と同じロケールキー）に保存します。ローカルの `editor` コマンドで編集された文字列は、そのロケールの `models` 内でセントネル値 `user-edited` としてマークされます。`ui.flatOutputDir` 配下のロケール別フラットファイルは引き続き **source string → translation** のみであり、`models` は含みません（そのため実行時バンドルは変更されません）。

> **キャッシュエディタ使用時の注意:** キャッシュエディタでエントリを編集した場合、更新されたキャッシュエントリで出力ファイルを書き換えるために `sync --force-update`（または同等の `--force-update` オプション付き `translate` コマンド）を実行する必要があります。また、後でソーステキストが変更された場合、新しいソース文字列に対して新しいキャッシュキー（ハッシュ）が生成されるため、手動編集は失われる点に注意してください。

### ステップ 4: ランタイムでの i18next の接続

`'ai-i18n-tools/runtime'` によってエクスポートされるヘルパーを使用して、i18n 設定ファイルを作成します：

```js
// src/i18n.js  (or src/i18n.ts)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);

export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

React のレンダリング前に `i18n.js` をインポートします（例：エントリポイントの先頭）。ユーザーが言語を変更した場合は、`await loadLocale(code)` を呼び出した後、`i18n.changeLanguage(code)` を実行します。

`SOURCE_LOCALE` はエクスポートされているため、それを必要とする他のファイル（例：言語切り替えコンポーネント）は `'./i18n'` から直接インポートできます。

`defaultI18nInitOptions(sourceLocale)` は、キーをデフォルトとする設定向けの標準オプションを返します:

- `parseMissingKeyHandler` はキー自体を返すため、未翻訳の文字列はソーステキストとして表示されます。
- `nsSeparator: false` はコロンを含むキーを許可します。
- `interpolation.escapeValue: false` - 無効にしても安全です：React は値を自身でエスケープし、Node.js/CLI の出力にはエスケープすべき HTML が含まれません。

`wrapI18nWithKeyTrim(i18n)` は `i18n.t` をラップし、次の動作を行います: (1) ルックアップ前にキーをトリムし、抽出スクリプトが保存する形式に合わせる; (2) ソースロケールが生のキーを返した場合に <code>{"{{var}}"}</code> の補間を適用する - そのため <code>{"t('Hello {{name}}', { name })"}</code> はソース言語でも正しく動作します。

`makeLoadLocale(i18n, loaders, sourceLocale)` は、ロケール用の JSON バンドルを動的に import して i18next に登録する async `loadLocale(lang)` 関数を返します。

### ソースコードでの `t()` の使用

抽出スクリプトが検出できるよう、**リテラル文字列**を指定して `t()` を呼び出します：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

同じパターンは React 外（Node.js、サーバーコンポーネント、CLI）でも機能します：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**ルール：**

- 抽出されるのはこれらの形式のみです: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`。  
- キーは**リテラル文字列**でなければなりません - 変数や式をキーとして使用しないでください。  
- キーにテンプレートリテラルを使用しないでください: <code>{'t(`Hello ${name}`)'}</code>は抽出できません。

### 補間

i18nextのネイティブな第二引数の補間を<code>{"{{var}}"}</code>プレースホルダーに使用します:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

抽出スクリプトは第二引数を無視します - リテラルキー文字列<code>{"\"Hello {{name}}, you have {{count}} messages\""}</code>のみが抽出され、翻訳のために送信されます。翻訳者には<code>{"{{...}}"}</code>トークンを保持するよう指示されています。

### 言語切替UI

`ui-languages.json`マニフェストを使用して言語セレクタを構築します。`ai-i18n-tools`は2つの表示ヘルパーをエクスポートします:

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

`getUILanguageLabel(lang, t)` - 翻訳済みなら `t(englishName)` を表示し、両者が異なる場合は `englishName / t(englishName)` を表示します。設定画面に適しています。

`getUILanguageLabelNative(lang)` - `englishName / label` を表示します（各行で `t()` 呼び出しはしません）。ネイティブ名を表示したいヘッダーメニューに適しています。

`ui-languages.json`マニフェストは<code>{"{ code, label, englishName }"}</code>エントリのJSON配列です。例:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German" },
  { "code": "fr",    "label": "Français",       "englishName": "French" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic" }
]
```

翻訳コマンドが同じリストを使用するように、このファイルのパスを設定して`targetLocales`を構成します。

### RTL言語

`ai-i18n-tools`は`getTextDirection(lng)`と`applyDirection(lng)`をエクスポートします:

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection`は`document.documentElement.dir`（ブラウザ）を設定するか、ノーオペレーション（Node.js）です。特定の要素をターゲットにするためにオプションの`element`引数を渡します。

`→`矢印を含む可能性のある文字列は、RTLレイアウト用に反転させます:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## ワークフロー 2 - ドキュメント翻訳

Markdownドキュメント、Docusaurusサイト、JSONラベルファイル用に設計されています。SVG図は[`translate-svg`](#cli-reference)を介して翻訳され、`svg`は構成で使用され、`documentations[].contentPaths`を介しては翻訳されません。

### ステップ 1: 初期化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

生成された`ai-i18n-tools.config.json`を編集します:

- `sourceLocale` - ソース言語（`docusaurus.config.js` 内の `defaultLocale` と一致している必要があります）。
- `targetLocales` - ロケールコードの配列、またはマニフェストへのパス。
- `cacheDir` - すべてのドキュメントパイプラインで共有されるSQLiteキャッシュディレクトリ（および `--write-logs` のデフォルトログディレクトリ）。
- `documentations` - ドキュメントブロックの配列。各ブロックには、オプションの `description`、`contentPaths`、`outputDir`、オプションの `jsonSource`、`markdownOutput`、`targetLocales`、`addFrontmatter` などがあります。
- `documentations[].description` - メンテナー向けのオプションの簡単なメモ（このブロックが何をカバーしているか）。設定されている場合、`translate-docs` の見出し（`🌐 …: translating …`）および `status` セクションのヘッダーに表示されます。
- `documentations[].contentPaths` - Markdown/MDX ソースディレクトリまたはファイル（JSONラベルについては `documentations[].jsonSource` も参照）。
- `documentations[].outputDir` - そのブロックの翻訳出力ルート。
- `documentations[].markdownOutput.style` - `"nested"`（デフォルト）、`"docusaurus"`、または `"flat"`（[出力レイアウト](#output-layouts) を参照）。

### ステップ 2: ドキュメントを翻訳する

```bash
npx ai-i18n-tools translate-docs
```

これは、すべての `documentations` ブロックの `contentPaths` 内のすべてのファイルを、すべての有効なドキュメントロケール（各ブロックの `targetLocales` が設定されている場合はその集合、設定されていない場合はルートの `targetLocales`）に翻訳します。既に翻訳済みのセグメントは SQLite キャッシュから提供され、新しいセグメントまたは変更されたセグメントのみが LLM に送信されます。

単一のロケールを翻訳するには：

```bash
npx ai-i18n-tools translate-docs --locale de
```

翻訳が必要なものを確認するには：

```bash
npx ai-i18n-tools status
```

#### キャッシュの動作と `translate-docs` フラグ

CLI は SQLite 内で**ファイル追跡**（ファイル × ロケールごとのソースハッシュ）と**セグメント**行（翻訳可能なチャンクごとのハッシュ × ロケール）を保持します。通常の実行では、追跡されたハッシュが現在のソースと一致**し**、かつ出力ファイルが既に存在する場合、ファイル全体をスキップします。それ以外の場合はファイルを処理し、セグメントキャッシュを使用するため、変更されていないテキストは API を呼び出しません。

| フラグ                     | 効果                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(default)*              | トラッキング済みファイルとディスク上の出力が一致する場合は変更なしのファイルをスキップし、残りはセグメントキャッシュを使用します。                                                                                                             |
| `--force-update`         | ファイルトラッキングでスキップされる場合でも、一致したすべてのファイルを再処理します（抽出、再結合、出力書き込み）。 **セグメントキャッシュは引き続き適用されます** - 変更のないセグメントは LLM に送信されません。                   |
| `--force`                | 処理対象ファイルごとにファイルトラッキングをクリアし、API 翻訳のために **セグメントキャッシュを読みません**（全面再翻訳）。新しい結果は引き続きセグメントキャッシュに **書き込まれます**。                 |
| `--stats`                | セグメント数、追跡済みファイル数、ロケールごとのセグメント合計を表示して終了します。                                                                                                                   |
| `--clear-cache [locale]` | キャッシュされた翻訳（およびファイルトラッキング）を削除します。対象は全ロケール、または単一ロケールです。その後終了します。                                                                                                            |
| `--prompt-format <mode>` | 各セグメントの **バッチ** をモデルに送信し、解析する方法（`xml`、`json-array`、`json-object`）。デフォルトは **`xml`**。抽出、プレースホルダー、検証、キャッシュ、フォールバックの動作は変わりません — [Batch prompt format](#batch-prompt-format) を参照してください。 |

`--force` と `--force-update` を組み合わせることはできません（これらは相互排他的です）。

#### バッチプロンプト形式

`translate-docs` は翻訳可能なセグメントを OpenRouter に **バッチ** で送信します（`batchSize` / `maxBatchChars` でグループ化）。**`--prompt-format`** フラグは、そのバッチの **ワイヤ形式** だけを変更します。セグメント分割、`PlaceholderHandler` トークン、markdown AST チェック、SQLite キャッシュキー、およびバッチ解析失敗時のセグメントごとのフォールバックは変更されません。

| モード | ユーザーメッセージ | モデルの応答 |
| ---- | ------------ | ----------- |
| **`xml`** (デフォルト) | 擬似XML: セグメントごとに `<seg id="N">…</seg>` (XMLエスケープ付き)。 | セグメントインデックスごとに `<t id="N">…</t>` ブロックのみ。 |
| **`json-array`** | 順序通りの文字列のJSON配列、セグメントごとに1エントリ。 | **同じ長さ**のJSON配列 (同じ順序)。 |
| **`json-object`** | セグメントインデックスでキー付けされたJSONオブジェクト `{"0":"…","1":"…",…}`。 | **同じキー**と翻訳された値を持つJSONオブジェクト。 |

実行ヘッダーは `Batch prompt format: …` も印刷されるので、アクティブなモードを確認できます。JSONラベルファイル（`jsonSource`）とスタンドアロンSVGバッチは、`translate-docs`の一部として実行されるときに同じ設定を使用します（または`sync`のドキュメントフェーズ — `sync`はこのフラグを公開しません; デフォルトは **`xml`** です）。

**セグメントの重複排除と SQLite 内のパス**

- セグメント行は `(source_hash, locale)` によってグローバルにキー付けされます（ハッシュ = 正規化されたコンテンツ）。2つのファイルに同一のテキストがある場合、1行を共有します; `translations.filepath` はメタデータ（最後のライター）であり、ファイルごとの2番目のキャッシュエントリではありません。
- `file_tracking.filepath` は名前空間付きキーを使用します: `doc-block:{index}:{relPath}` 各 `documentations` ブロックごとに（`relPath` はプロジェクトルート相対のposix: 収集されたマークダウンパス; **JSONラベルファイルはソースファイルへのcwd相対パスを使用します**、例: `docs-site/i18n/en/code.json`、したがってクリーンアップは実際のファイルを解決できます）、および `svg-assets:{relPath}` は `translate-svg` の下のスタンドアロンSVGアセット用です。
- `translations.filepath` はマークダウン、JSON、およびSVGセグメントのcwd相対posixパスを保存します（SVGは他のアセットと同じパス形状を使用します; `svg-assets:…` プレフィックスは **のみ** `file_tracking` にあります）。
- 実行後、`last_hit_at` は、ヒットしなかったセグメント行 **同じ翻訳スコープ内** のみクリアされます（`--path` と有効な種類を尊重して）、したがってフィルタリングされたまたはドキュメントのみの実行は無関係なファイルを古くはありませんとマークしません。

### 出力レイアウト

`"nested"` (省略時のデフォルト) — `{outputDir}/{locale}/` の下にソースツリーをミラーします（例: `docs/guide.md` → `i18n/de/docs/guide.md`）。

`"docusaurus"` — `docsRoot` の下にあるファイルを `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>` に配置し、通常のDocusaurus i18nレイアウトに一致させます。 `documentations[].markdownOutput.docsRoot` をドキュメントソースルートに設定します（例: `"docs"`）。

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 翻訳されたファイルをソースの隣にロケールサフィックス付きで配置するか、サブディレクトリに配置します。ページ間の相対リンクは自動的に書き換えられます。

```
docs/guide.md → i18n/guide.de.md
```

`documentations[].markdownOutput.pathTemplate`でパスを完全に上書きできます。プレースホルダー: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{docsRoot}"}</code>, <code>{"{relativeToDocsRoot}"}</code>。

---

## 統合ワークフロー (UI + ドキュメント)

両方のワークフローを一つの設定で実行するためにすべての機能を有効にします:

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": "src/locales/ui-languages.json",
  "features": {
    "extractUIStrings": true,
    "translateUIStrings": true,
    "translateMarkdown": true,
    "translateJSON": false
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

`glossary.uiGlossary`はドキュメント翻訳をUIと同じ`strings.json`カタログに向けるため、用語が一貫性を保ちます; `glossary.userGlossary`は製品用語のCSV上書きを追加します。

`npx ai-i18n-tools sync`を実行して1つのパイプラインを実行します: **抽出** UI文字列（`features.extractUIStrings`の場合）、**翻訳** UI文字列（`features.translateUIStrings`の場合）、**スタンドアロンSVGアセットを翻訳**（設定に`svg`ブロックが存在する場合）、次に**ドキュメントを翻訳**（各`documentations`ブロック: 設定されたmarkdown/JSON）。`--no-ui`、`--no-svg`、または`--no-docs`で部分をスキップします。ドキュメントステップは`--dry-run`、`-p` / `--path`、`--force`、および`--force-update`を受け入れます（最後の2つはドキュメント翻訳が実行されるときのみ適用され、`--no-docs`を渡すと無視されます）。

ブロックのファイルをUIよりも**小さなサブセット**に翻訳するには、ブロックに`documentations[].targetLocales`を使用します（有効なドキュメントロケールはブロック間の**和集合**です）:

```json
{
  "targetLocales": "src/locales/ui-languages.json",
  "documentations": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

---

## 設定リファレンス

### `sourceLocale`

ソース言語のBCP-47コード（例: `"en-GB"`, `"en"`, `"pt-BR"`）。このロケールの翻訳ファイルは生成されません - キーストリング自体がソーステキストです。

**必ず一致する必要があります** `SOURCE_LOCALE`はあなたのランタイムi18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされます。

### `targetLocales`

翻訳するロケール。受け入れます:

- **文字列パス** `ui-languages.json`マニフェストへの（`"src/locales/ui-languages.json"`）。ファイルが読み込まれ、ロケールコードが抽出されます。
- **BCP-47コードの配列**（`["de", "fr", "es"]`）。
- **パスを持つ1要素の配列**（`["src/locales/ui-languages.json"]`） - 文字列形式と同じ動作。

`targetLocales`はUI翻訳の主要なロケールリストであり、ドキュメントブロックのデフォルトロケールリストです。ここで明示的な配列を保持したいが、マニフェスト駆動のラベルとロケールフィルタリングを望む場合は、`uiLanguagesPath`も設定してください。

### `uiLanguagesPath`（オプション）

表示名、ロケールフィルタリング、および言語リストの後処理に使用される`ui-languages.json`マニフェストへのパス。

これを使用するのは:

- `targetLocales`が明示的な配列であるが、マニフェストから英語/ネイティブラベルをまだ取得したい場合。
- `markdownOutput.postProcessing.languageListBlock`が同じマニフェストからロケールラベルを構築することを望む場合。
- UI翻訳のみが有効で、マニフェストが有効なUIロケールリストを提供することを望む場合。

### `concurrency`（オプション）

同時に翻訳される最大**ターゲットロケール**（`translate-ui`、`translate-docs`、`translate-svg`、および`sync`内の一致するステップ）。省略した場合、CLIはUI翻訳に**4**、ドキュメント翻訳に**3**を使用します（組み込みのデフォルト）。`-j` / `--concurrency`で実行ごとに上書きします。

### `batchConcurrency`（オプション）

**translate-docs** および **translate-svg**（および `sync` のドキュメント翻訳ステップ）：ファイルごとの OpenRouter **バッチ** リクエストの最大並列数（各バッチには多数のセグメントを含めることができます）。省略時のデフォルトは **4**。`translate-ui` では無視されます。`-b` / `--batch-concurrency` で上書きできます。`sync` では、`-b` はドキュメント翻訳ステップにのみ適用されます。

### `batchSize` / `maxBatchChars`（オプション）

ドキュメント翻訳のためのセグメントバッチ処理：API リクエストあたりのセグメント数と文字数の上限。デフォルト：**20** セグメント、**4096** 文字（省略時）。

### `openrouter`

| フィールド               | 説明                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter APIのベースURL。デフォルト: `https://openrouter.ai/api/v1`。                        |
| `translationModels` | モデルIDの優先順序付きリスト。最初のものが最初に試され、後のエントリはエラー時のフォールバックです。 `translate-ui` のみ**、このリストの前に1つのモデルを試すために `ui.preferredModel` を設定することもできます（`ui` を参照）。 |
| `defaultModel`      | レガシーの単一プライマリモデル。 `translationModels` が設定されていないか空のときのみ使用されます。       |
| `fallbackModel`     | レガシーの単一フォールバックモデル。 `translationModels` が設定されていないか空のときに `defaultModel` の後に使用されます。 |
| `maxTokens`         | リクエストごとの最大完了トークン。デフォルト: `8192`。                                      |
| `temperature`       | サンプリング温度。デフォルト: `0.2`。                                                    |

環境変数または `.env` ファイルに `OPENROUTER_API_KEY` を設定してください。

### `features`

| フィールド                | ワークフロー | 説明                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | ソースコードをスキャンして `t("…")` を検出し、`strings.json` を書き出し/マージします。          |
| `translateUIStrings` | 1        | `strings.json` のエントリを翻訳し、ロケールごとの JSON ファイルを書き出します。 |
| `translateMarkdown`  | 2        | `.md` / `.mdx` ファイルを翻訳します。                                   |
| `translateJSON`      | 2        | Docusaurus の JSON ラベルファイルを翻訳します。                            |

`features.translateSVG` フラグはありません。**スタンドアロン**の SVG アセットは、`translate-svg` と設定ファイルのトップレベルにある `svg` ブロックを使用して翻訳します。`sync` コマンドは、`svg` が存在する場合（`--no-svg` が指定されていない限り）そのステップを実行します。

### `ui`

| フィールド                       | 説明                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | `t("…")` 呼び出しをスキャンする対象のディレクトリ（カレントワーキングディレクトリからの相対パス）。               |
| `stringsJson`               | マスターカタログファイルへのパス。`extract` コマンドによって更新される。                  |
| `flatOutputDir`             | ロケールごとの JSON ファイル（`de.json` など）が書き出されるディレクトリ。    |
| `preferredModel`            | オプション。`translate-ui` のみで最初に試行される OpenRouter モデル ID。次に、この ID を重複せずに `openrouter.translationModels`（またはレガシーモデル）の順に試行する。 |
| `reactExtractor.funcNames`  | スキャン対象の追加関数名（デフォルト: `["t", "i18n.t"]`）。         |
| `reactExtractor.extensions` | 含めるファイル拡張子（デフォルト: `[".js", ".jsx", ".ts", ".tsx"]`）。 |
| `reactExtractor.includePackageDescription` | `true` の場合（デフォルト）、`extract` は存在する場合に `package.json` の `description` を UI 文字列として含める。 |
| `reactExtractor.packageJsonPath` | このオプションの説明抽出に使用される `package.json` ファイルのカスタムパス。 |

### `cacheDir`

| フィールド      | 説明                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLite キャッシュディレクトリ（すべての `documentations` ブロックで共有）。複数回の実行で再利用できます。 |

### `documentations`

ドキュメントパイプラインブロックの配列。`translate-docs` と `sync` プロセスのドキュメントフェーズは、**各**ブロックを順番に処理します。

| フィールド | 説明 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description` | このブロックの任意の人間が読めるメモ（翻訳には使用されません）。設定されている場合、`translate-docs` の `🌐` ヘッドラインの先頭に追加され、`status` セクションのヘッダーにも表示されます。 |
| `contentPaths` | 翻訳対象のMarkdown/MDXソース（`translate-docs` は `.md` / `.mdx` をスキャンします）。JSONラベルは、同じブロックの `jsonSource` から取得されます。 |
| `outputDir` | このブロックの翻訳出力のルートディレクトリ。 |
| `sourceFiles` | 読み込み時に `contentPaths` にマージされる任意のエイリアス。 |
| `targetLocales` | このブロックにのみ適用される任意のロケールのサブセット（指定しない場合はルートの `targetLocales` を使用）。有効なドキュメントロケールは、すべてのブロックの和集合です。 |
| `jsonSource` | このブロック用のDocusaurus JSONラベルファイルのソースディレクトリ（例: `"i18n/en"`）。 |
| `markdownOutput.style` | `"nested"`（デフォルト）、`"docusaurus"`、または `"flat"`。 |
| `markdownOutput.docsRoot` | Docusaurusレイアウト用のソースドキュメントルート（例: `"docs"`）。 |
| `markdownOutput.pathTemplate` | カスタムマークダウン出力パス。プレースホルダー: <code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{docsRoot}"}</code>、<code>{"{relativeToDocsRoot}"}</code>。 |
| `markdownOutput.jsonPathTemplate` | ラベルファイルのカスタムJSON出力パス。`pathTemplate` と同じプレースホルダーをサポートします。 |
| `markdownOutput.flatPreserveRelativeDir` | `flat` スタイルの場合、同じベース名のファイルが衝突しないようにソースのサブディレクトリを保持します。 |
| `markdownOutput.rewriteRelativeLinks` | 翻訳後に相対リンクを書き換える（`flat` スタイルでは自動的に有効）。 |
| `markdownOutput.linkRewriteDocsRoot` | フラットリンクの書き換えプレフィックスを計算する際に使用されるリポジトリルート。通常は `"."` のままにします。翻訳されたドキュメントが別のプロジェクトルート下にある場合を除き。 |
| `markdownOutput.postProcessing` | 翻訳されたマークダウンの**本文**に適用する任意の変換（YAMLフロントマターは保持されます）。セグメントの再結合およびフラットリンクの書き換えの後、`addFrontmatter` の前に実行されます。 |
| `markdownOutput.postProcessing.regexAdjustments` | `{ "description"?, "search", "replace" }` の順序付きリスト。`search` は正規表現パターン（単純な文字列はフラグ `g` を使用、または `/pattern/flags`）。`replace` は `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` などのプレースホルダーをサポート（リファレンスの `additional-adjustments` と同じ考え方）。 |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 翻訳者は `start` を含む最初の行と一致する `end` 行を見つけ、その範囲を標準の言語スイッチャーに置き換えます。リンクは翻訳されたファイルからの相対パスで構築されます。ラベルは、設定されている場合は `uiLanguagesPath` / `ui-languages.json` から、それ以外は `localeDisplayNames` とロケールコードから取得されます。 |
| `addFrontmatter` | `true` の場合（省略時はデフォルト）翻訳されたマークダウンファイルにYAMLキーが含まれます：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`、および少なくとも1つのセグメントにモデルメタデータがある場合、`translation_models`（使用されたOpenRouterモデルIDのソート済みリスト）。スキップする場合は `false` に設定します。 |

例（フラット README パイプライン — スクリーンショットパス + オプションの言語リストラッパー）:

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
      "separator": " · "
    }
  }
}
```

### `svg`（オプション）

`translate-svg` と `sync` の SVG ステージによって翻訳されたスタンドアロン SVG アセットのトップレベル設定。

| フィールド                     | 説明                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `sourcePath`                | `.svg` ファイルを再帰的にスキャンするディレクトリまたはディレクトリの配列。                       |
| `outputDir`                 | 翻訳された SVG 出力のルートディレクトリ。                                                  |
| `style`                     | `"flat"` または `"nested"` （`pathTemplate` が未設定の場合）。         |
| `pathTemplate`              | カスタム SVG 出力パス。プレースホルダー: <code>{"{outputDir}"}</code>, <code>{"{locale}"}</code>, <code>{"{LOCALE}"}</code>, <code>{"{relPath}"}</code>, <code>{"{stem}"}</code>, <code>{"{basename}"}</code>, <code>{"{extension}"}</code>, <code>{"{relativeToSourceRoot}"}</code>. |
| `svgExtractor.forceLowercase` | SVG 再構成時の翻訳テキストを小文字にする。すべて小文字のラベルに依存するデザインに便利。          |

### `glossary`

| フィールド          | 説明                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | `strings.json` へのパス - 既存の翻訳から自動的に用語集を構築する。                                                                                                                 |
| `userGlossary` | `Original language string`（または `en`）、`locale`、`Translation` の列を持つ CSV へのパス。1 行に 1 つのソース用語とターゲットロケールを記述（`locale` はすべてのターゲットに適用される `*` にすることも可能）。 |

レガシーキー `uiGlossaryFromStringsJson` はまだ受け入れられ、設定を読み込む際に `uiGlossary` にマッピングされます。

空の用語集 CSV を生成:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLI リファレンス

| コマンド                                                                   | 説明                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | スターター設定ファイルを書き込みます（`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、および `documentations[].addFrontmatter` を含みます）。`--with-translate-ignore` はスターターの `.translate-ignore` を作成します。                                                                            |
| `extract`                                                                 | ソースをスキャンして `t("…")` コールを見つけ、`strings.json` を更新します。`features.extractUIStrings` が必要です。                                                                                                                                                                                                    |
| `translate-docs …`                                                        | 各 `documentations` ブロック（`contentPaths`、オプションの `jsonSource`）のために markdown/MDX と JSON を翻訳します。`-j`: 最大並列ロケール; `-b`: ファイルごとの最大並列バッチ API コール。`--prompt-format`: バッチワイヤフォーマット（`xml` \| `json-array` \| `json-object`）。[キャッシュの動作と `translate-docs` フラグ](#cache-behaviour-and-translate-docs-flags) および [バッチプロンプトフォーマット](#batch-prompt-format) を参照してください。 |
| `translate-svg …`                                                         | `config.svg` で設定されたスタンドアロンの SVG アセットを翻訳します（ドキュメントとは別）。ドキュメントと同様のキャッシュのアイデア; 実行中に SQLite の読み書きをスキップするための `--no-cache` をサポートします。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | UI 文字列のみを翻訳します。`--force`: ロケールごとにすべてのエントリを再翻訳します（既存の翻訳を無視します）。`--dry-run`: 書き込みなし、API コールなし。`-j`: 最大並列ロケール。`features.translateUIStrings` が必要です。                                                                                 |
| `sync …`                                                                  | （有効な場合）抽出し、次に UI 翻訳を行い、`config.svg` が存在する場合は `translate-svg` を実行し、次にドキュメント翻訳を行います - `--no-ui`、`--no-svg`、または `--no-docs` でスキップしない限り。共有フラグ: `-l`、`-p`、`--dry-run`、`-j`、`-b`（ドキュメントバッチのみ）、`--force` / `--force-update`（ドキュメントのみ; ドキュメント実行時に相互排他的）。                         |
| `status`                                                                  | ファイル × ロケールごとの markdown 翻訳ステータスを表示します（`--locale` フィルタなし; ロケールは設定から取得されます）。                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | 最初に `sync --force-update` を実行します（抽出、UI、SVG、ドキュメント）、次に古いセグメント行を削除します（null `last_hit_at` / 空のファイルパス）；ディスク上に解決されたソースパスが欠けている `file_tracking` 行を削除します；欠けているファイルを指す `filepath` メタデータを持つ翻訳行を削除します。3つのカウント（古い、孤立した `file_tracking`、孤立した翻訳）をログに記録します。`--no-backup` が指定されていない限り、キャッシュディレクトリの下にタイムスタンプ付きの SQLite バックアップを作成します。 |
| `editor [-p <port>] [--no-open]`                                          | キャッシュ、`strings.json`、および用語集 CSV のためのローカルウェブエディタを起動します。`--no-open`: デフォルトのブラウザを自動的に開かない。<br><br>**注意:** キャッシュエディタでエントリを編集した場合、更新されたキャッシュエントリで出力ファイルを書き換えるために `sync --force-update` を実行する必要があります。また、後でソーステキストが変更された場合、手動での編集は失われます。新しいキャッシュキーが生成されるためです。 |
| `glossary-generate [-o <path>]`                                           | 空の `glossary-user.csv` テンプレートを書き込みます。`-o`: 出力パスを上書きします（デフォルト: 設定からの `glossary.userGlossary`、または `glossary-user.csv`）。                                                                                                                                                |

すべてのコマンドは、非デフォルトの設定ファイルを指定するために `-c <path>` を受け入れ、詳細な出力のために `-v` を使用し、コンソール出力をログファイルに記録するために `-w` / `--write-logs [path]` を使用します（デフォルトパス：ルート `cacheDir` の下）。

---

## 環境変数

| 変数                   | 説明                                                      |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **必須。** あなたの OpenRouter API キー。                   |
| `OPENROUTER_BASE_URL`  | API ベース URL をオーバーライドします。                     |
| `I18N_SOURCE_LOCALE`   | 実行時に `sourceLocale` をオーバーライドします。            |
| `I18N_TARGET_LOCALES`  | `targetLocales` をオーバーライドするためのカンマ区切りのロケールコード。 |
| `I18N_LOG_LEVEL`       | ロガーレベル（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`             | `1` の場合、ログ出力で ANSI カラーを無効にします。         |
| `I18N_LOG_SESSION_MAX` | ログセッションごとに保持される最大行数（デフォルト `5000`）。  |
