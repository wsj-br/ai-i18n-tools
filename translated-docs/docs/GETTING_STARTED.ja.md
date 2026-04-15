# ai-i18n-tools: 始めに

`ai-i18n-tools` は、2つの独立した、合成可能なワークフローを提供します：

- **Workflow 1 - UI Translation**: 任意のJS/TSソースから `t("…")` 呼び出しを抽出し、OpenRouterを介して翻訳し、i18next向けにフラットなロケール別JSONファイルを出力します。
- **Workflow 2 - Document Translation**: markdown（MDX）およびDocusaurusのJSONラベルファイルを任意の数のロケールに翻訳。スマートキャッシュ付き。**SVG**アセットは、`features.translateSVG` が有効で、トップレベルの `svg` ブロックが設定され、`translate-svg` が使用されている場合に翻訳されます（[CLIリファレンス](#cli-reference)を参照）。

両方のワークフローは OpenRouter（互換性のある LLM）を使用し、単一の設定ファイルを共有します。

**他の言語で読む:**

<small id="lang-list">[English (GB)](../../docs/GETTING_STARTED.md) · [German](./GETTING_STARTED.de.md) · [Spanish](./GETTING_STARTED.es.md) · [French](./GETTING_STARTED.fr.md) · [Hindi](./GETTING_STARTED.hi.md) · [Japanese](./GETTING_STARTED.ja.md) · [Korean](./GETTING_STARTED.ko.md) · [Portuguese (BR)](./GETTING_STARTED.pt-BR.md) · [Chinese (CN)](./GETTING_STARTED.zh-CN.md) · [Chinese (TW)](./GETTING_STARTED.zh-TW.md)</small>

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- このセクションを編集しないでください。更新するには doctoc を再実行してください -->
**目次**

- [インストール](#installation)
- [クイックスタート](#quick-start)
- [ワークフロー 1 - UI 翻訳](#workflow-1---ui-translation)
  - [ステップ 1: 初期化](#step-1-initialise)
  - [ステップ 2: 文字列の抽出](#step-2-extract-strings)
  - [ステップ 3: UI 文字列の翻訳](#step-3-translate-ui-strings)
  - [XLIFF 2.0 へのエクスポート (オプション)](#exporting-to-xliff-20-optional)
  - [ステップ 4: 実行時に i18next を接続](#step-4-wire-i18next-at-runtime)
  - [ソースコード内での `t()` の使用](#using-t-in-source-code)
  - [補間](#interpolation)
  - [言語切替 UI](#language-switcher-ui)
  - [RTL 言語](#rtl-languages)
- [ワークフロー 2 - ドキュメント翻訳](#workflow-2---document-translation)
  - [ステップ 1: 初期化](#step-1-initialise-1)
  - [ステップ 2: ドキュメントの翻訳](#step-2-translate-documents)
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

ai-i18n-tools には独自の文字列抽出機能が含まれています。以前 `i18next-scanner`、`babel-plugin-i18next-extract`、または類似のツールを使用していた場合、移行後にそれらの開発依存関係を削除できます。

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

# Combined: extract UI strings, then translate UI + SVG + docs (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

### 推奨される `package.json` スクリプト

パッケージをローカルにインストールすると、CLI コマンドをスクリプト内で直接使用できます（`npx` は不要です）:

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-ui && ai-i18n-tools translate-svg && ai-i18n-tools translate-docs",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:status": "ai-i18n-tools status",
  "i18n:editor": "ai-i18n-tools editor",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

---

## ワークフロー 1 - UI 翻訳

i18next を使用する任意の JS/TS プロジェクト向けに設計されています: React アプリ、Next.js（クライアントおよびサーバーコンポーネント）、Node.js サービス、CLI ツール。

### ステップ 1: 初期化

```bash
npx ai-i18n-tools init
```

これにより、`ai-i18n-tools.config.json` が `ui-markdown` テンプレートで書き込まれます。これを編集して以下を設定します：

- `sourceLocale` - ソース言語の BCP-47 コード（例: `"en-GB"`）。ランタイムの i18n 設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされる `SOURCE_LOCALE` と**一致している必要があります**。
- `targetLocales` - ターゲット言語の BCP-47 コードの配列（例: `["de", "fr", "pt-BR"]`）。このリストから `ui-languages.json` マニフェストを作成するには `generate-ui-languages` を実行します。
- `ui.sourceRoots` - `t("…")` 呼び出しをスキャンするディレクトリ（例: `["src/"]`）。
- `ui.stringsJson` - マスターカタログを出力する場所（例: `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - `de.json`、`pt-BR.json` などを出力する場所（例: `"src/locales/"`）。
- `ui.preferredModel`（オプション） - `translate-ui` のみで**最初に**試行する OpenRouter モデル ID。失敗した場合、CLI は `openrouter.translationModels`（または従来の `defaultModel` / `fallbackModel`）を順に試行し、重複はスキップします。

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

### XLIFF 2.0 へのエクスポート (オプション)

UI 文字列を翻訳ベンダー、TMS、または CAT ツールに渡すために、カタログを **XLIFF 2.0** としてエクスポートします (ターゲットロケールごとに 1 つのファイル)。このコマンドは **読み取り専用** です: `strings.json` を変更したり、API を呼び出したりしません。

```bash
npx ai-i18n-tools export-ui-xliff
```

デフォルトでは、ファイルは `ui.stringsJson` の隣に書き込まれ、`strings.de.xliff`、`strings.pt-BR.xliff` のように名前が付けられます (カタログのベース名 + ロケール + `.xliff`)。他の場所に書き込むには `-o` / `--output-dir` を使用します。`strings.json` からの既存の翻訳は `<target>` に表示され、欠落しているロケールは `state="initial"` を使用し、`<target>` がないためツールがそれらを埋めることができます。`--untranslated-only` を使用して、各ロケールに対してまだ翻訳が必要なユニットのみをエクスポートします (ベンダーバッチに便利です)。`--dry-run` はファイルを書き込まずにパスを印刷します。

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

`SOURCE_LOCALE` はエクスポートされているため、言語切り替えなど、他のファイルでも `'./i18n'` から直接インポートできます。既存の i18next 設定を移行する場合、コンポーネントに散在するハードコードされたソースロケール文字列（例: `'en-GB'` のチェック）を、i18n 初期化ファイルから `SOURCE_LOCALE` をインポートする形に置き換えてください。

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

プロジェクトでカスタム補間ユーティリティを使用している場合（例: `t('key')` を呼び出した後、テンプレート関数 `interpolateTemplate(t('Hello {{name}}'), { name })` を通すなど）、`wrapI18nWithKeyTrim` を使用すればそのような処理は不要になります。ソースロケールが生のキーを返す場合でも、<code>{"{{var}}"}</code> 補間が適用されます。呼び出し元を `t('Hello {{name}}', { name })` に移行し、カスタムユーティリティを削除してください。

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

`ui-languages.json` マニフェストは、<code>{"{ code, label, englishName, direction }"}</code> エントリの JSON 配列です（`direction` は `"ltr"` または `"rtl"`）。例:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

マニフェストは、`generate-ui-languages` が `sourceLocale` と `targetLocales`、およびバンドルされたマスターカタログから生成され、`ui.flatOutputDir` に出力されます。

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

マークダウン形式のドキュメント、Docusaurusサイト、およびJSONラベルファイル向けに設計されています。スタンドアロンのSVGアセットは、`features.translateSVG` が有効で、トップレベルの `svg` ブロックが設定されている場合に [`translate-svg`](#cli-reference) を使って翻訳されます。`documentations[].contentPaths` 経由ではありません。

### ステップ 1: 初期化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

生成された`ai-i18n-tools.config.json`を編集します:

- `sourceLocale` - ソース言語（`docusaurus.config.js` の `defaultLocale` と一致している必要があります）。
- `targetLocales` - BCP-47 ロケールコードの配列（例: `["de", "fr", "es"]`）。
- `cacheDir` - すべてのドキュメントパイプライン用の共有 SQLite キャッシュディレクトリ（および `--write-logs` のデフォルトログディレクトリ）。
- `documentations` - ドキュメントブロックの配列。各ブロックには、オプションの `description`、`contentPaths`、`outputDir`、オプションの `jsonSource`、`markdownOutput`、`targetLocales`、`addFrontmatter` などがあります。
- `documentations[].description` - メンテナ向けの任意の短いメモ（このブロックの対象範囲）。設定されている場合、`translate-docs` の見出し（`🌐 …: translating …`）および `status` のセクション見出しに表示されます。
- `documentations[].contentPaths` - markdown/MDX ソースディレクトリまたはファイル（JSON ラベルについては `documentations[].jsonSource` も参照）。
- `documentations[].outputDir` - そのブロックの翻訳出力ルート。
- `documentations[].markdownOutput.style` - `"nested"`（デフォルト）、`"docusaurus"`、または `"flat"`（[出力レイアウト](#output-layouts) を参照）

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
| *(デフォルト)*              | 追跡対象かつディスク上の出力と一致するファイルをスキップ。それ以外のファイルにはセグメントキャッシュを使用。                                                                                                             |
| `-l, --locale <codes>`   | カンマ区切りのターゲットロケール（省略時は `documentation.targetLocales` / `targetLocales` に従う）。                                                                                           |
| `-p, --path` / `-f, --file` | このパス以下のMarkdown/JSONのみを翻訳（プロジェクト相対または絶対パス）；`--file` は `--path` のエイリアス。                                                                                     |
| `--dry-run`              | ファイル書き込みもAPI呼び出しも行わない。                                                                                                                                                                       |
| `--type <kind>`          | `markdown` または `json` に制限（設定で有効な場合を除き、両方）。                                                                                                                              |
| `--json-only` / `--no-json` | JSONラベルファイルのみ翻訳、またはJSONをスキップしてMarkdownのみ翻訳。                                                                                                                         |
| `-j, --concurrency <n>`  | 最大並列ターゲットロケール数（設定またはCLIの組み込みデフォルト値）。                                                                                                                             |
| `-b, --batch-concurrency <n>` | ファイルごとの最大並列バッチAPI呼び出し数（ドキュメント用；設定またはCLIのデフォルト値）。                                                                                                                          |
| `--emphasis-placeholders` | 翻訳前にMarkdownの強調マーカーをプレースホルダーとしてマスク（オプション；デフォルトは無効）。                                                                                                         |
| `--debug-failed`         | 検証に失敗した場合、`cacheDir` 配下に詳細な `FAILED-TRANSLATION` ログを出力。                                                                                                                       |
| `--force-update`         | ファイル追跡がスキップする場合でも、一致するすべてのファイルを再処理（抽出、再構成、出力書き込み）。**セグメントキャッシュは引き続き適用** - 変更されていないセグメントはLLMに送信されない。                   |
| `--force`                | 処理された各ファイルのファイル追跡をクリアし、API翻訳用に**セグメントキャッシュを読み取らない**（完全な再翻訳）。新しい結果は引き続きセグメントキャッシュに**書き込まれる**。                 |
| `--stats`                | セグメント数、追跡ファイル数、ロケールごとのセグメント合計を表示して終了。                                                                                                                   |
| `--clear-cache [locale]` | キャッシュされた翻訳（およびファイル追跡）を削除：すべてのロケール、または単一のロケールを指定して削除後、終了。                                                                                                            |
| `--prompt-format <mode>` | 各**バッチ**のセグメントがモデルに送信され、解析される方法（`xml`、`json-array`、または`json-object`）。デフォルトは **`json-array`**。抽出、プレースホルダー、検証、キャッシュ、フォールバックの動作は変更しない — [バッチプロンプト形式](#batch-prompt-format)を参照。 |

`--force` と `--force-update` を組み合わせることはできません（これらは相互排他的です）。

#### バッチプロンプト形式

`translate-docs` は翻訳可能なセグメントを OpenRouter に **バッチ** で送信します（`batchSize` / `maxBatchChars` でグループ化）。**`--prompt-format`** フラグは、そのバッチの **ワイヤ形式** だけを変更します。セグメント分割、`PlaceholderHandler` トークン、markdown AST チェック、SQLite キャッシュキー、およびバッチ解析失敗時のセグメントごとのフォールバックは変更されません。

| モード | ユーザーメッセージ | モデル応答 |
| ---- | ------------ | ----------- |
| **`xml`** | Pseudo-XML: セグメントごとに1つの`<seg id="N">…</seg>`（XMLエスケープ付き）。 | セグメントインデックスごとに1つの`<t id="N">…</t>`ブロックのみ。 |
| **`json-array`** (デフォルト) | セグメントごとに1つのエントリを持つ文字列のJSON配列。 | **同じ長さ**（同じ順序）のJSON配列。 |
| **`json-object`** | セグメントインデックスをキーとするJSONオブジェクト`{"0":"…","1":"…",…}`。 | **同じキー**と翻訳された値を持つJSONオブジェクト。 |

ヘッダーの実行は、アクティブモードを確認できるように `Batch prompt format: …` も印刷します。JSONラベルファイル（`jsonSource`）とスタンドアロンSVGバッチは、これらのステップが `translate-docs` の一部として実行されるときに同じ設定を使用します（または `sync` のドキュメントフェーズ — `sync` はこのフラグを公開せず、デフォルトは **`json-array`** です）。

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

`glossary.uiGlossary`はドキュメント翻訳をUIと同じ`strings.json`カタログに向けるため、用語が一貫性を保ちます; `glossary.userGlossary`は製品用語のCSV上書きを追加します。

`npx ai-i18n-tools sync` を実行すると、1つのパイプラインが実行されます。`features.extractUIStrings` が設定されている場合は**UI文字列の抽出**、`features.translateUIStrings` が設定されている場合は**UI文字列の翻訳**、`features.translateSVG` とトップレベルの `svg` ブロックが設定されている場合は**スタンドアロンSVGアセットの翻訳**、その後**ドキュメントの翻訳**（各 `documentations` ブロックで設定された通りに、markdown/JSONを処理）を行います。`--no-ui`、`--no-svg`、`--no-docs` を使用して、特定の処理をスキップできます。ドキュメント翻訳ステップでは `--dry-run`、`-p` / `--path`、`--force`、および `--force-update` を受け付けます（最後の2つはドキュメント翻訳が実行される場合にのみ有効。`--no-docs` を指定すると無視されます）。

ブロックのファイルをUIよりも**小さなサブセット**に翻訳するには、ブロックに`documentations[].targetLocales`を使用します（有効なドキュメントロケールはブロック間の**和集合**です）:

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

---

## 設定リファレンス

### `sourceLocale`

ソース言語のBCP-47コード（例: `"en-GB"`, `"en"`, `"pt-BR"`）。このロケールの翻訳ファイルは生成されません - キーストリング自体がソーステキストです。

**必ず一致する必要があります** `SOURCE_LOCALE`はあなたのランタイムi18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされます。

### `targetLocales`

翻訳先のBCP-47ロケールコードの配列（例: `["de", "fr", "es", "pt-BR"]`）。

`targetLocales`はUI翻訳の主要なロケールリストであり、ドキュメントブロックのデフォルトロケールリストでもあります。`generate-ui-languages`を使用して、`sourceLocale`と`targetLocales`から`ui-languages.json`マニフェストを構築します。

### `uiLanguagesPath`（オプション）

`ui-languages.json`マニフェストのパス。表示名、ロケールフィルタリング、言語リストの後処理に使用されます。省略された場合、CLIは`ui.flatOutputDir/ui-languages.json`にマニフェストがあるか探します。

これを使用するのは:

- マニフェストが`ui.flatOutputDir`の外にあるため、CLIに明示的に指定する必要があります。
- `markdownOutput.postProcessing.languageListBlock`にマニフェストからロケールラベルを構築させたい場合。
- `extract`がマニフェストの`englishName`エントリを`strings.json`にマージする必要があります（`ui.reactExtractor.includeUiLanguageEnglishNames: true`が必要です）。

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

**複数のモデルを使用する理由:** 異なるプロバイダーとモデルには、コストに違いがあり、言語やロケールごとに品質のレベルが異なります。CLIがリクエストに失敗した場合に次のモデルを試行できるよう、**`openrouter.translationModels`を順序付きフォールバックチェーン**（単一のモデルではなく）として構成してください。

以下のリストは拡張可能な**ベースライン**として扱ってください。特定のロケールの翻訳が不十分または失敗する場合は、その言語またはスクリプトを効果的にサポートするモデルを調査し（オンラインリソースやプロバイダーのドキュメントを参照）、それらのOpenRouter IDをさらに代替手段として追加してください。

このリストは**広範なロケールカバレッジについてテスト済み**です（たとえば、Transrewrtプロジェクトで**36**のターゲットロケールを翻訳する際に使用）。**2026年4月**時点での実用的なデフォルトとして機能しますが、すべてのロケールで良好なパフォーマンスを保証するものではありません。

例 `translationModels`（`npx ai-i18n-tools init`およびパッケージの例と同じ）:

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v3.2",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-5.3-codex",
  "anthropic/claude-sonnet-4.6",
  "google/gemini-3-flash-preview"
]
```

環境変数または `.env` ファイルに `OPENROUTER_API_KEY` を設定してください。

### `features`

| フィールド                | ワークフロー | 説明                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | ソースをスキャンして`t("…")` / `i18n.t("…")`を検出し、オプションの`package.json`説明および（有効の場合）`ui-languages.json` `englishName`値を`strings.json`にマージします。 |
| `translateUIStrings` | 1        | `strings.json`エントリを翻訳し、ロケールごとのJSONファイルを書き出します。 |
| `translateMarkdown`  | 2        | `.md` / `.mdx`ファイルを翻訳します。                                   |
| `translateJSON`      | 2        | DocusaurusのJSONラベルファイルを翻訳します。                            |
| `translateSVG`       | 2        | スタンドアロンの`.svg`アセットを翻訳します（トップレベルの`svg`ブロックが必要です）。 |

`features.translateSVG` が true で、トップレベルの `svg` ブロックが設定されている場合、`translate-svg` を使って**スタンドアロン**のSVGアセットを翻訳します。`sync` コマンドは、両方が設定されている場合にそのステップを実行します（`--no-svg` を指定しない限り）。

### `ui`

| フィールド                       | 説明                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | `t("…")`呼び出しをスキャンするディレクトリ（カレントワーキングディレクトリからの相対パス）。               |
| `stringsJson`               | マスターカタログファイルのパス。`extract`によって更新されます。                  |
| `flatOutputDir`             | ロケールごとのJSONファイルの出力先ディレクトリ（`de.json`など）。    |
| `preferredModel`            | オプション。`translate-ui`専用で最初に試行されるOpenRouterモデルID。次に`openrouter.translationModels`（またはレガシーモデル）が順に試行され、このIDは重複しない。 |
| `reactExtractor.funcNames`  | スキャン対象の追加関数名（デフォルト: `["t", "i18n.t"]`）。         |
| `reactExtractor.extensions` | 含めるファイル拡張子（デフォルト: `[".js", ".jsx", ".ts", ".tsx"]`）。 |
| `reactExtractor.includePackageDescription` | `true`の場合（デフォルト）、`extract`は存在する場合に`package.json` `description`をUI文字列として含めます。 |
| `reactExtractor.packageJsonPath` | オプションの説明抽出に使用される`package.json`ファイルへのカスタムパス。 |
| `reactExtractor.includeUiLanguageEnglishNames` | `true`の場合（デフォルト`false`）、`extract`はソーススキャンから既に存在しない場合、マニフェストの`uiLanguagesPath`にある各`englishName`を`strings.json`に追加します（同じハッシュキー）。`uiLanguagesPath`が有効な`ui-languages.json`を指している必要があります。 |

### `cacheDir`

| フィールド      | 説明                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | すべての`documentations`ブロックで共有されるSQLiteキャッシュディレクトリ。実行間で再利用可能。カスタムドキュメント翻訳キャッシュから移行する場合は、アーカイブまたは削除してください — `cacheDir`は独自のSQLiteデータベースを作成し、他のスキーマとは互換性がありません。 |

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

スタンドアロンSVGアセットのトップレベルのパスおよびレイアウト。翻訳は、**`features.translateSVG`** が true の場合にのみ実行されます（`translate-svg` または `sync` のSVGステージ経由）。

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

| コマンド | 説明 |
| --- | --- |
| `version` | CLIのバージョンとビルドタイムスタンプを表示します（ルートプログラムの`-V` / `--version`と同様の情報）。 |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | スターター設定ファイルを書き出します（`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`documentations[].addFrontmatter`を含みます）。`--with-translate-ignore`はスターターの`.translate-ignore`を作成します。 |
| `extract` | `t("…")` / `i18n.t("…")`リテラル、任意の`package.json`説明、および任意のマニフェストの`englishName`エントリから`strings.json`を更新します（`ui.reactExtractor`を参照）。`features.extractUIStrings`が必要です。 |
| `generate-ui-languages [--master <path>] [--dry-run]` | `sourceLocale` + `targetLocales`およびバンドルされた`data/ui-languages-complete.json`（または`--master`）を使用して、`ui.flatOutputDir`（または設定されている場合は`uiLanguagesPath`）に`ui-languages.json`を書き出します。マスターファイルに存在しないロケールについては、警告を出し、`TODO`プレースホルダーを出力します。カスタマイズされた`label`または`englishName`値を持つ既存のマニフェストがある場合、それらはマスターカタログのデフォルト値に置き換えられます。生成されたファイルは後で確認し、調整してください。 |
| `translate-docs …` | 各`documentations`ブロック（`contentPaths`、任意の`jsonSource`）に対してMarkdown/MDXおよびJSONを翻訳します。`-j`：並列処理する最大ロケール数。`-b`：ファイルごとの並列バッチAPI呼び出しの最大数。`--prompt-format`：バッチ通信フォーマット（`xml` \| `json-array` \| `json-object`）。[キャッシュの動作と`translate-docs`フラグ](#cache-behaviour-and-translate-docs-flags)および[バッチプロンプトフォーマット](#batch-prompt-format)を参照してください。 |
| `translate-svg …` | `config.svg`で設定されたスタンドアロンのSVGアセットを翻訳します（ドキュメントとは別）。`features.translateSVG`が必要です。ドキュメントと同様のキャッシュの考え方を採用。その実行でSQLiteの読み書きをスキップするための`--no-cache`をサポート。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。 |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]` | UI文字列のみを翻訳します。`--force`：すべてのエントリをロケールごとに再翻訳（既存の翻訳を無視）。`--dry-run`：書き込みなし、API呼び出しなし。`-j`：並列処理する最大ロケール数。`features.translateUIStrings`が必要です。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | `strings.json`をXLIFF 2.0形式でエクスポートします（対象ロケールごとに1つの`.xliff`）。`-o` / `--output-dir`：出力ディレクトリ（デフォルト：カタログと同じフォルダ）。`--untranslated-only`：そのロケールで翻訳が欠落しているユニットのみ。読み取り専用。API呼び出しは行いません。 |
| `sync …` | 抽出（有効の場合）、次にUI翻訳、次に`features.translateSVG`および`config.svg`が設定されている場合の`translate-svg`、その後ドキュメント翻訳を実行します。ただし、`--no-ui`、`--no-svg`、または`--no-docs`でスキップされた場合は除きます。共通フラグ：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（ドキュメントのバッチ処理のみ）、`--force` / `--force-update`（ドキュメントのみ、ドキュメント実行時は相互に排他的）。ドキュメントフェーズでは、`--emphasis-placeholders`および`--debug-failed`も引き継がれます（意味は`translate-docs`と同じ）。`--prompt-format`は`sync`フラグではありません。ドキュメントステップでは組み込みのデフォルト（`json-array`）が使用されます。 |
| `status [--max-columns <n>]` | `features.translateUIStrings`が有効の場合、ロケールごとのUIカバレッジ（`Translated` / `Missing` / `Total`）を表示します。その後、ファイル×ロケールごとのMarkdown翻訳ステータスを表示します（`--locale`フィルターなし。ロケールは設定から取得）。多数のロケールリストは、端末での行幅を狭く保つため、最大`n`列（デフォルトは**9**）の繰り返しテーブルに分割されます。 |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]` | 最初に`sync --force-update`を実行（抽出、UI、SVG、ドキュメント）、その後、古くなったセグメント行（`last_hit_at`がnullまたはファイルパスが空）を削除。ディスク上に解決されたソースパスが存在しない`file_tracking`行を削除。`filepath`メタデータが存在しないファイルを指している翻訳行を削除。3つのカウント（古くなったもの、孤立した`file_tracking`、孤立した翻訳）をログ出力。`--no-backup`が設定されていない限り、キャッシュディレクトリ内にタイムスタンプ付きのSQLiteバックアップを作成します。 |
| `editor [-p <port>] [--no-open]` | キャッシュ、`strings.json`、および用語集CSV用のローカルWebエディタを起動します。`--no-open`：デフォルトブラウザを自動的に開かない。<br><br>**注：** キャッシュエディタでエントリを編集した場合、更新されたキャッシュエントリを出力ファイルに書き戻すために`sync --force-update`を実行する必要があります。また、後でソーステキストが変更された場合、新しいキャッシュキーが生成されるため、手動での編集は失われます。 |
| `glossary-generate [-o <path>]` | 空の`glossary-user.csv`テンプレートを書き出します。`-o`：出力パスを上書き（デフォルト：設定の`glossary.userGlossary`、または`glossary-user.csv`）。 |

すべてのコマンドは、非デフォルトの設定ファイルを指定するための `-c <path>`、詳細出力のための `-v`、およびコンソール出力をログファイルに複製するための `-w` / `--write-logs [path]` を受け入れます（デフォルトのパスはルートの `cacheDir` 配下です）。ルートプログラムは、さらに `-V` / `--version` および `-h` / `--help` をサポートしており、`ai-i18n-tools help [command]` は `ai-i18n-tools <command> --help` と同じコマンドごとの使用法を表示します。

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
