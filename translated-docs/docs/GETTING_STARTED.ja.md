# ai-i18n-tools: インストールと使い方

`ai-i18n-tools`は、2つの独立した、組み合わせ可能なワークフローを提供します。

- **ワークフロー1 - UIの翻訳**：任意のJS/TSソースから`t("…")`呼び出しを抽出し、OpenRouterを介して翻訳を行い、i18nextで使用可能な、言語ごとのフラットなJSONファイルを出力します。
- **ワークフロー2 - ドキュメントの翻訳**：Markdown（MDX）およびDocusaurusのJSONラベルファイルを任意の言語に翻訳し、スマートなキャッシュ機能を使用します。**SVG**アセットは`features.translateSVG`、最上位の`svg`ブロック、および`translate-svg`を使用します（[CLIリファレンス](#cli-reference)を参照）。

両方のワークフローはOpenRouter（任意の互換性のあるLLM）を使用し、単一の設定ファイルを共有します。

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [インストール](#installation)
- [クイックスタート](#quick-start)
- [ワークフロー1 - UIの翻訳](#workflow-1---ui-translation)
  - [ステップ1：初期化](#step-1-initialise)
  - [ステップ2：文字列の抽出](#step-2-extract-strings)
  - [ステップ3：UI文字列の翻訳](#step-3-translate-ui-strings)
  - [XLIFF 2.0形式へのエクスポート（オプション）](#exporting-to-xliff-20-optional)
  - [ステップ4：実行時にi18nextを接続](#step-4-wire-i18next-at-runtime)
  - [ソースコードでの`t()`の使用](#using-t-in-source-code)
  - [補間](#interpolation)
  - [言語切り替えUI](#language-switcher-ui)
  - [RTL言語](#rtl-languages)
- [ワークフロー2 - ドキュメントの翻訳](#workflow-2---document-translation)
  - [ステップ1：初期化](#step-1-initialise-1)
  - [ステップ2：ドキュメントの翻訳](#step-2-translate-documents)
    - [キャッシュの動作と`translate-docs`フラグ](#cache-behaviour-and-translate-docs-flags)
  - [出力レイアウト](#output-layouts)
- [統合ワークフロー（UI + ドキュメント）](#combined-workflow-ui--docs)
- [設定リファレンス](#configuration-reference)
  - [`sourceLocale`](#sourcelocale)
  - [`targetLocales`](#targetlocales)
  - [`uiLanguagesPath`（オプション）](#uilanguagespath-optional)
  - [`concurrency`（オプション）](#concurrency-optional)
  - [`batchConcurrency`（オプション）](#batchconcurrency-optional)
  - [`batchSize` / `maxBatchChars`（オプション）](#batchsize--maxbatchchars-optional)
  - [`openrouter`](#openrouter)
  - [`features`](#features)
  - [`ui`](#ui)
  - [`cacheDir`](#cachedir)
  - [`documentations`](#documentations)
  - [`svg`（オプション）](#svg-optional)
  - [`glossary`](#glossary)
- [CLIリファレンス](#cli-reference)
- [環境変数](#environment-variables)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## インストール

公開されているパッケージは**ESMのみ対応**です。Node.jsまたはバンドラーで`import`/`import()`を使用してください。`require('ai-i18n-tools')` **は使用しないでください。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-toolsには独自の文字列抽出機能が含まれています。以前に`i18next-scanner`、`babel-plugin-i18next-extract`、または類似のツールを使用していた場合、移行後にそれらの開発依存関係を削除できます。

OpenRouterのAPIキーを設定してください。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

またはプロジェクトのルートに`.env`ファイルを作成します。

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## クイックスタート

デフォルトの`init`テンプレート（`ui-markdown`）は**UI**の抽出と翻訳のみを有効にします。`ui-docusaurus`テンプレートは**ドキュメント**の翻訳（`translate-docs`）を有効にします。設定に応じて、抽出、UI翻訳、オプションのスタンドアロンSVG翻訳、およびドキュメント翻訳を1つのコマンドで実行したい場合に`sync`を使用します。

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

### 推奨される`package.json`スクリプト

パッケージをローカルにインストールすると、CLIコマンドをスクリプト内で直接使用できます（`npx`は不要です）。

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

## ワークフロー1 - UIの翻訳

i18nextを使用するあらゆるJS/TSプロジェクト向けに設計されています：Reactアプリ、Next.js（クライアントおよびサーバーコンポーネント）、Node.jsサービス、CLIツール。

### ステップ 1: 初期化

```bash
npx ai-i18n-tools init
```

`ai-i18n-tools.config.json` を `ui-markdown` テンプレートで書き込みます。以下を設定するために編集してください:

- `sourceLocale` - ソース言語のBCP-47コード（例: `"en-GB"`）。ランタイムのi18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされた`SOURCE_LOCALE`と**一致している必要があります**。
- `targetLocales` - ターゲット言語のBCP-47コードの配列（例: `["de", "fr", "pt-BR"]`）。このリストから`ui-languages.json`マニフェストを作成するために`generate-ui-languages`を実行します。
- `ui.sourceRoots` - `t("…")`呼び出しをスキャンするディレクトリ（例: `["src/"]`）。
- `ui.stringsJson` - マスターカタログを出力する場所（例: `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - `de.json`、`pt-BR.json`などを出力する場所（例: `"src/locales/"`）。
- `ui.preferredModel`（オプション） - `translate-ui`専用で**最初に**試行するOpenRouterモデルID。失敗した場合、CLIは`openrouter.translationModels`（または従来の`defaultModel` / `fallbackModel`）を重複をスキップしつつ順に継続します。

### ステップ 2: 文字列の抽出

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 配下のすべてのJS/TSファイルから `t("literal")` および `i18n.t("literal")` 呼び出しをスキャンします。`ui.stringsJson` に書き込み（またはマージ）します。

スキャナーはカスタマイズ可能：`ui.reactExtractor.funcNames` を通じてカスタム関数名を追加できます。

### ステップ 3: UI文字列の翻訳

```bash
npx ai-i18n-tools translate-ui
```

`strings.json` を読み込み、各ターゲットロケールごとにバッチをOpenRouterに送信し、フラットなJSONファイル（`de.json`、`fr.json` など）を `ui.flatOutputDir` に書き込みます。`ui.preferredModel` が設定されている場合、そのモデルが `openrouter.translationModels` の順序リストより優先して試行されます（ドキュメント翻訳やその他のコマンドは引き続き `openrouter` のみを使用します）。

各エントリについて、`translate-ui` は、各ロケールの翻訳に成功した**OpenRouterモデルID**を、オプションの `models` オブジェクト内に保存します（`translated` と同じロケールキーを使用）。ローカルの `editor` コマンドで編集された文字列は、そのロケールの `models` にセンチネル値 `user-edited` でマークされます。`ui.flatOutputDir` 配下のロケールごとのフラットファイルは、**原文 → 翻訳**のみを含み、`models` を含まないため、ランタイムバンドルは変更されません。

> **キャッシュエディタの使用に関する注意：** キャッシュエディタでエントリを編集した場合、更新されたキャッシュエントリで出力ファイルを再書き込みするために `sync --force-update`（または同等の `translate` コマンドに `--force-update` を指定）を実行する必要があります。また、後で原文が変更された場合、新しいソース文字列に対して新しいキャッシュキー（ハッシュ）が生成されるため、手動での編集内容は失われることに注意してください。

### XLIFF 2.0 へのエクスポート（オプション）

UI文字列を翻訳ベンダー、TMS、またはCATツールに引き渡すために、カタログを**XLIFF 2.0**としてエクスポートします（ターゲットロケールごとに1ファイル）。このコマンドは**読み取り専用**です：`strings.json` を変更したり、APIを呼び出したりしません。

```bash
npx ai-i18n-tools export-ui-xliff
```

デフォルトでは、ファイルは `ui.stringsJson` の隣に書き込まれ、`strings.de.xliff`、`strings.pt-BR.xliff`（カタログのベースネーム + ロケール + `.xliff`）のような名前になります。`-o` / `--output-dir` を使用して他の場所に書き込みます。`strings.json` からの既存の翻訳は `<target>` に表示され、不足しているロケールは `state="initial"` を使用して `<target>` なしで出力されるため、ツールが翻訳を埋められます。`--untranslated-only` を使用すると、各ロケールでまだ翻訳が必要なユニットのみをエクスポートできます（ベンダー向けのバッチに便利です）。`--dry-run` はファイルを書き出さずにパスを表示します。

### ステップ 4: ランタイムでのi18nextの接続

`'ai-i18n-tools/runtime'` がエクスポートするヘルパーを使用して、i18n設定ファイルを作成します:

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

// initialize i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// setup the key-as-default translation
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

**3つの値を一致させてください：** **`ai-i18n-tools.config.json`** 内の `sourceLocale`、このファイル内の **`SOURCE_LOCALE`**、およびフラット出力ディレクトリ配下に **`translate-ui`** が **`{sourceLocale}.json`** として書き出す複数形対応のフラットJSON（通常は `public/locales/`）。静的 **`import`** でも同じベースネームを使用してください（上記の例：`en-GB` → `en-GB.json`）。**`sourcePluralFlatBundle`** 内の **`lng`** フィールドは **`SOURCE_LOCALE`** と等しくなければなりません。静的ES **`import`** パスでは変数を使用できません。ソースロケールを変更する場合は、**`SOURCE_LOCALE`** とインポートパスを同時に更新してください。あるいは、動的 **`import(\`./public/locales/${SOURCE_LOCALE}.json\`)`**、**`fetch`**、または **`readFileSync`** を使用して、パスを **`SOURCE_LOCALE`** から構築するように読み込んでください。

このスニペットは、**`i18n`** がこれらのフォルダの隣にあるかのように **`./locales/…`** と **`./public/locales/…`** を使用します。ファイルが **`src/`** 配下にある場合（一般的）、**`../locales/…`** と **`../public/locales/…`** を使用して、インポートが **`ui.stringsJson`**、**`uiLanguagesPath`**、**`ui.flatOutputDir`** と同じパスに解決されるようにします。

`i18n.js` をReactのレンダリングより前にインポートしてください（例：エントリーポイントの先頭）。ユーザーが言語を変更したときは、`await loadLocale(code)` を呼び出した後、`i18n.changeLanguage(code)` を呼び出してください。

`localeLoaders` **を**`ui-languages.json`** から **`makeLocaleLoadersFromManifest`** を使用して導出することで（**`SOURCE_LOCALE`** を **`makeLoadLocale`** と同じ正規化を使って除外）、設定と整合性を保ちます。ロケールを **`targetLocales`** に追加して **`generate-ui-languages`** を実行すると、マニフェストが更新され、ローダーが別途ハードコードされたマップを管理することなく追跡できるようになります。JSONバンドルが **`public/`** の下に配置されている場合（典型的なNext.js）、ブラウザがパブリックURLパスから静的JSONを読み込めるように、**`import()`** の代わりに **`fetch(\`/locales/${code}.json\`)`** で各ローダーを実装します。バンドラーのないNode CLIの場合は、小さな **`makeFileLoader`** ヘルパー内で **`readFileSync` を使用してロケールファイルを読み込み、各コードに対してパースされたJSONを返します。

`SOURCE_LOCALE`はエクスポートされているため、言語切り替えなど必要な他のファイルから`'./i18n'`を直接インポートできます。既存のi18next設定を移行する場合、コンポーネントに散在するハードコードされたソースロケール文字列（例：`'en-GB'`のチェック）を、i18nブートストラップファイルから`SOURCE_LOCALE`をインポートする形に置き換えます。

名前付きインポート（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）は、デフォルトエクスポートを使用しない場合でも同じように動作します。

`aiI18n.defaultI18nInitOptions(sourceLocale)`（または名前でインポートされた場合は`defaultI18nInitOptions(sourceLocale)`）は、キーをデフォルトとする設定の標準オプションを返します：

- `parseMissingKeyHandler`はキー自体を返すため、翻訳されていない文字列はソーステキストを表示します。
- `nsSeparator: false`はコロンを含むキーを許可します。
- `interpolation.escapeValue: false` - 安全に無効化可能：Reactは値自体をエスケープし、Node.js/CLI出力にはエスケープすべきHTMLがありません。

`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` **は**推奨される** ai-i18n-tools プロジェクトの配線です：これはキーのトリム + ソースロケール <code>{"{{var}}"}</code> 補間フォールバックを適用します（低レベルの **`wrapI18nWithKeyTrim`** と同じ動作）、オプションで **`translate-ui`** **`{sourceLocale}.json`** 複数形サフィックスキーを **`addResourceBundle`** を介してマージし、その後、あなたの **`strings.json`** から複数形を意識した **`wrapT`** をインストールします。そのバンドルされたファイルは、あなたの **設定された** ソースロケールのための複数形フラットでなければなりません — あなたの i18n ブートストラップの **`sourceLocale`** と **`ai-i18n-tools.config.json`** および **`SOURCE_LOCALE`** と同じです（上記のステップ 4 を参照）。ブートストラップ中は **`sourcePluralFlatBundle`** を省略してください（**`translate-ui`** が **`{sourceLocale}.json`** を出力した後にマージします）。単独の **`wrapI18nWithKeyTrim`** は **非推奨** です — 代わりに **`setupKeyAsDefaultT` を使用してください。

`makeLoadLocale(i18n, loaders, sourceLocale)`は、ロケールのJSONバンドルを動的にインポートしてi18nextに登録する非同期の`loadLocale(lang)`関数を返します。

### ソースコードでの`t()` **の使用

抽出スクリプトが見つけられるように、**リテラル文字列**で`t()`を呼び出します：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

このパターンはReact外（Node.js、サーバーコンポーネント、CLI）でも同様に動作します：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**ルール：

- 抽出されるのは以下の形式のみです：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")` **。
- キーは**リテラル文字列でなければなりません — キーに変数や式を使用しないでください。
- キーにテンプレートリテラルを使用しないでください：<code>{'t(`Hello ${name}`)'}</code>は抽出できません。

### 補間

<code>{"{{var}}"}</code>のプレースホルダーには、i18nextのネイティブな第2引数補間を使用します：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
``` **extract コマンドは、それがプレーンなオブジェクトリテラルである場合に**第2引数** を解析し、**`plurals: true`** や **`zeroDigit`** などのツール専用フラグを読み取ります（以下の **基数複数形 を参照）。通常の文字列では、ハッシュ化にはリテラルキーのみが使用され、補間オプションは実行時に引き続き i18next に渡されます。

プロジェクトでカスタム補間ユーティリティを使用している場合（例：`t('key')`を呼び出してから`interpolateTemplate(t('Hello {{name}}'), { name })` **のようなテンプレート関数にパイプする）、**`setupKeyAsDefaultT`**（**`wrapI18nWithKeyTrim` 経由）によりその必要がなくなります — ソースロケールが生のキーを返す場合でも<code>{"{{var}}"}</code>補間を適用します。呼び出し元を`t('Hello {{name}}', { name })`に移行し、カスタムユーティリティを削除してください。

### 基数複数形（`plurals: true` **）

開発者デフォルトのコピーとして使用したい**同じリテラル**を使用し、**`plurals: true` を渡して抽出ツール＋`translate-ui` **が呼び出しを1つの**基数複数形グループとして扱うようにします（i18next JSON v4形式の`_zero` … `_other`形）

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
``` **-**`zeroDigit`** (任意) — ツール専用。i18next はこれを**読み取らない。`true`の場合、各ロケールでその形式が存在するときは、`_zero` **文字列にリテラルのアラビア語**`0` を含めることをプロンプトが優先する。`false`または省略の場合は、自然なゼロ表現が使用される。`i18next.t` を呼び出す前にこれらのキーを削除する（下記の `wrapT` **を参照）。**検証：** メッセージに**2つ以上の異なる `{{…}}` **プレースホルダーが含まれる場合、そのうち**1つは `{{count}}`**（複数形の軸）でなければならない。さもなければ **`extract` は失敗**し、明確なファイル/行のメッセージが表示される。

**2つの独立したカウント**（例：セクションとページ）は1つの複数形メッセージを共有できない — **2つの `t()` 呼び出しを使用し（それぞれに `plurals: true` と独自の `count` **を含む）、UI で連結する。**`strings.json`:** 複数形のグループは、ハッシュごとに **1 行を使用し、`"plural": true` **、元のリテラルを**`source` に、およびそのロケールの文字列への基数カテゴリ（`zero`、`one`、`two`、`few`、`many`、`other` **）のオブジェクトマッピングを**`translated[locale]`** に指定します。

**フラットなロケールJSON：** 複数形以外の行は**原文 → 翻訳**のまま。複数形の行は、i18nextが複数形をネイティブに解決できるよう、**`<groupId>_original`（`source` **に等しい、参照用）と各接尾辞の**`<groupId>_<form>`** として出力される。**`translate-ui`** はまた、**唯一の**複数形フラットキーのみを含む **`{sourceLocale}.json`** も出力する（このバンドルをソース言語用に読み込んで、接尾辞付きキーが解決されるようにする。通常の文字列は引き続きキーをデフォルトとして使用）。各ターゲットロケールに対して、出力される接尾辞キーはそのロケールの **`Intl.PluralRules`（`requiredCldrPluralForms`）に一致する。`strings.json` **がコンパクション後に他のカテゴリと一致したため（例：アラビア語の**`many`** が **`other`** と同じ）カテゴリを省略した場合でも、**`translate-ui`** はフォールバックとなる兄弟文字列からコピーすることで、実行時ルックアップでキーが欠落しないよう、必要なすべての接尾辞をフラットファイルに書き込む。

**実行時（`ai-i18n-tools/runtime`）：** **`setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })`** を呼び出す — これは **`wrapI18nWithKeyTrim`** を実行し、オプションの **`translate-ui` `{sourceLocale}.json` **複数形バンドルを登録してから、**`wrapT`** を **`buildPluralIndexFromStringsJson(stringsJson)` を使って実行する。`wrapT` は `plurals` / `zeroDigit` **を削除し、必要に応じてキーをグループIDに書き換えて、**`count` を転送する（オプション：単一の非`{{count}}` プレースホルダーがある場合、`count` **はその数値オプションからコピーされる）。**古い環境： ツールや一貫した動作のために `Intl.PluralRules` **が必要。非常に古いブラウザを対象にする場合はポリフィルする必要がある。**v1 にないもの： 序数の複数形（`_ordinal_*`、`ordinal: true`）、区間複数形、ICU専用パイプライン。

### 言語切り替えUI

言語セレクタの構築には `ui-languages.json` マニフェストを使用する。`ai-i18n-tools` は2つの表示ヘルパーをエクスポートする：

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

`getUILanguageLabel(lang, t)` - 翻訳済みの場合は `t(englishName)` を表示し、両方が異なる場合は `englishName / t(englishName)` を表示する。設定画面に適している。

`getUILanguageLabelNative(lang)` - `englishName / label` を表示する（各行で `t()` 呼び出しはしない）。ヘッダーメニューでネイティブ名を表示したい場合に適している。

`ui-languages.json` マニフェストは <code>{"{ code, label, englishName, direction }"}</code> エントリのJSON配列である（`direction` は `"ltr"` または `"rtl"`）。例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

マニフェストは `generate-ui-languages` が `sourceLocale` + `targetLocales` およびバンドルされたマスターカタログから生成する。`ui.flatOutputDir` に出力される。設定で使用するロケールを変更した場合は、`generate-ui-languages` を実行して `ui-languages.json` ファイルを更新する。

### RTL言語

`ai-i18n-tools` は `getTextDirection(lng)` と `applyDirection(lng)` をエクスポートする：

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) - see Step 4
```

`applyDirection` は、ブラウザでは `document.documentElement.dir` を設定し、Node.js では何も行いません。オプションの `element` 引数を渡すことで、特定の要素をターゲットにできます。

`→` 矢印を含む可能性のある文字列については、RTLレイアウト用に反転する：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```

---

## ワークフロー2 - 文書翻訳

Markdownドキュメント、Docusaurusサイト、JSONラベルファイル向けに設計されている。スタンドアロンのSVGアセットは、`features.translateSVG` が有効でトップレベルの `svg` ブロックが設定されている場合に [`translate-svg`](#cli-reference) 経由で翻訳される — `documentations[].contentPaths` 経由ではない。

### ステップ 1: 初期化

```bash
npx ai-i18n-tools init -t ui-docusaurus
```

生成された `ai-i18n-tools.config.json` を編集します:

- `sourceLocale` - ソース言語（`docusaurus.config.js` 内の `defaultLocale` と一致している必要があります）。
- `targetLocales` - BCP-47 ロケールコードの配列（例: `["de", "fr", "es"]`）。
- `cacheDir` - すべてのドキュメントパイプライン用の共有 SQLite キャッシュディレクトリ（および `--write-logs` のデフォルトログディレクトリ）。
- `documentations` - ドキュメントブロックの配列。各ブロックには、オプションの `description`、`contentPaths`、`outputDir`、オプションの `jsonSource`、`markdownOutput`、オプションの `segmentSplitting`、`targetLocales`、`addFrontmatter` などがあります。
- `documentations[].description` - メンテナー向けのオプションの短いメモ（このブロックの対象範囲）。設定されている場合、`translate-docs` の見出し（`🌐 …: translating …`）および `status` のセクションヘッダーに表示されます。
- `documentations[].contentPaths` - markdown/MDX ソースディレクトリまたはファイル（JSON ラベルについては `documentations[].jsonSource` も参照）。
- `documentations[].outputDir` - そのブロックの翻訳出力ルート。
- `documentations[].markdownOutput.style` - `"nested"`（デフォルト）、`"docusaurus"`、または `"flat"`（[出力レイアウト](#output-layouts) を参照）。

### ステップ 2: ドキュメントを翻訳

```bash
npx ai-i18n-tools translate-docs
```

これは、すべての `documentations` ブロックの `contentPaths` 内のすべてのファイルを、すべての有効なドキュメントロケール（各ブロックの `targetLocales` が設定されている場合はその和集合、それ以外はルートの `targetLocales`）に翻訳します。すでに翻訳済みのセグメントは SQLite キャッシュから提供されるため、新しいまたは変更されたセグメントのみが LLM に送信されます。

単一のロケールを翻訳するには:

```bash
npx ai-i18n-tools translate-docs --locale de
```

翻訳が必要な内容を確認するには:

```bash
npx ai-i18n-tools status
```

#### キャッシュの動作と `translate-docs` **フラグ

CLIはSQLiteで**ファイルトラッキング**を維持し（ファイルごとのソースハッシュ×ロケール）および**セグメント**行（翻訳可能なチャンクごとのハッシュ×ロケール）を管理します。通常の実行では、トラッキングされたハッシュが現在のソース**と一致し、出力ファイルがすでに存在する場合、ファイル全体をスキップします。それ以外の場合は、ファイルを処理し、セグメントキャッシュを使用して変更されていないテキストがAPIを呼び出さないようにします。

| フラグ                     | 効果                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| *(デフォルト)*              | 追跡情報とディスク上の出力が一致する場合、変更されていないファイルをスキップ。それ以外はセグメントキャッシュを使用。                                                                                                             |
| `-l, --locale <codes>`   | カンマ区切りのターゲットロケール（省略時は `documentation.targetLocales` / `targetLocales` に従う）。                                                                                           |
| `-p, --path` / `-f, --file` | このパス以下の markdown/JSON のみを翻訳（プロジェクト相対または絶対パス）；`--file` は `--path` のエイリアスです。                                                                                     |
| `--dry-run`              | ファイル書き込みも API 呼び出しも行いません。                                                                                                                                                                       |
| `--type <kind>`          | `markdown` または `json` に限定（それ以外の場合は設定で有効であれば両方）。                                                                                                                              |
| `--json-only` / `--no-json` | JSON ラベルファイルのみ翻訳、または JSON をスキップして markdown のみ翻訳。                                                                                                                         |
| `-j, --concurrency <n>`  | 最大並列ターゲットロケール数（デフォルトは設定または CLI 組み込みのデフォルト値）。                                                                                                                             |
| `-b, --batch-concurrency <n>` | ファイルあたりの最大並列バッチ API 呼び出し数（ドキュメント用；デフォルトは設定または CLI から取得）。                                                                                                                          |
| `--emphasis-placeholders` | マークダウンの強調表示マーカーを翻訳前のプレースホルダーとしてマスクします（オプション、デフォルトはオフ）。                                                                                                         |
| `--debug-failed`         | 検証に失敗したときに、`cacheDir` 配下に詳細な `FAILED-TRANSLATION` ログを出力します。                                                                                                                       |
| `--force-update` **| ファイル追跡によるスキップが発生しても、一致したすべてのファイルを再処理します（抽出、再構成、出力書き込み）。**セグメントキャッシュは引き続き適用されます — 変更されていないセグメントはLLMに送信されません。                   |
| `--force` **| 各処理済みファイルのファイル追跡をクリアし、API翻訳用の**セグメントキャッシュを読み込みません**（完全な再翻訳）。新しい結果は引き続き**セグメントキャッシュに書き込まれます。                 |
| `--stats`                | セグメント数、追跡中のファイル数、ロケールごとのセグメント合計を表示して終了します。                                                                                                                   |
| `--clear-cache [locale]` | キャッシュされた翻訳（およびファイル追跡）を削除します：すべてのロケール、または特定の単一ロケールを対象とし、その後終了します。                                                                                                            |
| `--prompt-format <mode>` **| セグメントの**バッチがモデルに送信され、解析される方法（`xml`、`json-array`、または`json-object` **）。デフォルトは**`json-array`。抽出、プレースホルダー、検証、キャッシュ、フォールバックの動作は変更されません — [バッチプロンプト形式](#batch-prompt-format)を参照してください。 |

`--force` と `--force-update` を組み合わせることはできません（相互に排他的です）。

#### バッチプロンプト形式

`translate-docs` **は、OpenRouter に翻訳可能なセグメントを**バッチ単位で送信します（`batchSize` / `maxBatchChars` **ごとにグループ化）。**`--prompt-format`** フラグはそのバッチの**ワイヤーフォーマットのみを変更します。`PlaceholderHandler` **トークン、マークダウンASTチェック、SQLiteキャッシュキー、バッチ解析失敗時のセグメント単位のフォールバックは変更されません。

| モード | ユーザーメッセージ | モデルの応答 |
| ---- | ------------ | ----------- |
|**`xml` | パセドXML：セグメントごとに1つの `<seg id="N">…</seg>`（XMLエスケープ付き）。 | セグメントインデックスごとに1つの `<t id="N">…</t>` **ブロックのみ。 |
|**`json-array`**（デフォルト） | セグメントごとに1つのエントリを持つ文字列のJSON配列（順序通り）。 | **同じ長さ**のJSON配列（同じ順序）。 |
| **`json-object` | セグメントインデックスをキーとするJSONオブジェクト `{"0":"…","1":"…",…}` **。 |**同じキーと翻訳された値を持つJSONオブジェクト。 |

実行ヘッダーには `Batch prompt format: …` も表示されるため、使用中のモードを確認できます。JSONラベルファイル（`jsonSource`）およびスタンドアロンSVGバッチは、それらのステップが `translate-docs` の一部として実行される場合（または `sync` のドキュメントフェーズ）に同じ設定を使用します（`sync` **はこのフラグを公開せず、デフォルトは**`json-array`** です）。

**SQLiteにおけるセグメントの重複排除とパス

- セグメント行は、`(source_hash, locale)`（ハッシュ＝正規化されたコンテンツ）によってグローバルにキー付けされます。2つのファイルで同じテキストは1つの行を共有します。`translations.filepath`はメタデータ（最終更新者）であり、ファイルごとに2つ目のキャッシュエントリがあるわけではありません。
- `file_tracking.filepath` は名前空間付きキーを使用します。`documentations`ブロックごとに`doc-block:{index}:{relPath}`（`relPath` **はプロジェクトルート相対のPOSIX形式：収集されたMarkdownパス。**JSONラベルファイルはソースファイルのカレントワーキングディレクトリ相対パスを使用、たとえば`docs-site/i18n/en/code.json`のため、クリーンアップ処理で実際のファイルを解決可能）、および`translate-svg`以下のスタンドアロンSVGアセット用の`svg-assets:{relPath}`。
- `translations.filepath` は、Markdown、JSON、SVGセグメントのカレントワーキングディレクトリ相対のPOSIXパスを格納します（SVGは他のアセットと同じパス形式を使用。`svg-assets:…`プレフィックスは`file_tracking` **に**のみ存在）。
- 実行後、`last_hit_at` **は**同じ翻訳スコープ内で（`--path`および有効な種類を尊重して）ヒットしなかったセグメント行に対してのみクリアされるため、フィルターされた実行やドキュメントのみの実行でも関係のないファイルが古くなったと見なされることはありません。

### 出力レイアウト

`"nested"`（省略時にデフォルト） — ソースツリーを `{outputDir}/{locale}/` 配下にミラー（例：`docs/guide.md` → `i18n/de/docs/guide.md`）。

`"docusaurus"` — `docsRoot` 配下のファイルを `i18n/<locale>/docusaurus-plugin-content-docs/current/<relativeToDocsRoot>` に配置し、通常のDocusaurus i18nレイアウトに一致させます。`documentations[].markdownOutput.docsRoot` をドキュメントのソースルートに設定してください（例：`"docs"`）。

```
docs/guide.md         → i18n/de/docusaurus-plugin-content-docs/current/guide.md
i18n/en/sidebar.json  → i18n/de/sidebar.json  (JSON label files)
```

`"flat"` - 翻訳されたファイルを、ロケールのサフィックスを付けてソースと同じ場所に、またはサブディレクトリ内に配置します。ページ間の相対リンクは自動的に書き換えられます。

```
docs/guide.md → i18n/guide.de.md
```

`documentations[].markdownOutput.pathTemplate`を使用してパスを完全に上書きできます。プレースホルダー：<code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{docsRoot}"}</code>、<code>{"{relativeToDocsRoot}"}</code>。

---

## 統合ワークフロー（UI + ドキュメント）

単一の設定ですべての機能を有効にして、両方のワークフローを同時に実行します。

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

`glossary.uiGlossary`により、ドキュメントの翻訳がUIと同じ`strings.json`カタログを参照するようになり、用語の一貫性が保たれます。`glossary.userGlossary`は製品用語のためのCSVオーバーライドを追加します。

`npx ai-i18n-tools sync` **を実行すると、1つのパイプラインが実行されます：**抽出 UI文字列（`features.extractUIStrings` **が設定されている場合）、**翻訳 UI文字列（`features.translateUIStrings` **が設定されている場合）、**スタンドアロンSVGアセットの翻訳（`features.translateSVG`および`svg` **ブロックが設定されている場合）、その後**ドキュメントの翻訳（各`documentations`ブロック：設定に応じてMarkdown/JSON）。`--no-ui`、`--no-svg`、または`--no-docs`を使用して、一部をスキップできます。ドキュメントのステップでは`--dry-run`、`-p` / `--path`、`--force`、および`--force-update`を受け入れます（最後の2つはドキュメント翻訳が実行される場合にのみ適用され、`--no-docs`を渡すと無視されます）。

ブロックに`documentations[].targetLocales` **を使用すると、そのブロックのファイルをUIよりも**少ないサブセット**に翻訳できます（有効なドキュメントロケールはブロック間の**和集合になります）。

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

### 混合ドキュメントワークフロー（Docusaurus + フラット）

`documentations`に複数のエントリを追加することで、同じ設定内で複数のドキュメントパイプラインを組み合わせることができます。プロジェクトにDocusaurusサイトがあり、ルートレベルのMarkdownファイル（たとえばリポジトリのreadme）もフラット出力で翻訳したい場合に、よく使われる設定です。

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
            "separator": " · "
          }
        }
      }
    }
  ]
}
```

`npx ai-i18n-tools sync`を使用した実行方法：

- UI文字列は`src/`から`public/locales/`へ抽出／翻訳されます。
- 最初のドキュメントブロックは、MarkdownおよびJSONラベルをDocusaurusの`i18n/<locale>/...`レイアウトに翻訳します。
- 2番目のドキュメントブロックは`README.md`を`translated-docs/`以下のロケールサフィックス付きのフラットファイルに翻訳します。
- すべてのドキュメントブロックは`cacheDir`を共有するため、変更されていないセグメントは実行間で再利用され、API呼び出しとコストを削減します。

---

## 設定リファレンス

### `sourceLocale`

ソース言語のBCP-47コード（例：`"en-GB"`、`"en"`、`"pt-BR"` **）。このロケールに対しては翻訳ファイルは生成されません。キー文字列自体がソーステキストとなります。**一致しなければなりません ランタイムのi18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされた`SOURCE_LOCALE`。

### `targetLocales`

翻訳先のBCP-47ロケールコードの配列（例：`["de", "fr", "es", "pt-BR"]`）。

`targetLocales`はUI翻訳の主なロケールリストであり、ドキュメントブロックのデフォルトロケールリストでもあります。`generate-ui-languages`を使用して、`sourceLocale` + `targetLocales`から`ui-languages.json`マニフェストを構築します。

### `uiLanguagesPath`（オプション）

表示名、ロケールのフィルタリング、言語リストの後処理に使用される`ui-languages.json`マニフェストへのパス。省略された場合、CLIは`ui.flatOutputDir/ui-languages.json`でマニフェストを探します。

以下のときに使用します：

- マニフェストが`ui.flatOutputDir`の外にあり、CLIに明示的にパスを指定する必要がある場合。
- `markdownOutput.postProcessing.languageListBlock`がマニフェストからロケールラベルを構築する場合。
- `extract`がマニフェストの`englishName`エントリを`strings.json`にマージする必要がある場合（`ui.reactExtractor.includeUiLanguageEnglishNames: true`が必要）

### `concurrency` **(オプション)

同時に翻訳される最大**ターゲットロケール数（`translate-ui`、`translate-docs`、`translate-svg`、および`sync` **内の対応するステップ）。省略された場合、CLIはUI翻訳に**4**、ドキュメント翻訳に**3を使用します（組み込みのデフォルト）。実行ごとに`-j` / `--concurrency`で上書き可能。

### `batchConcurrency` **(オプション)**translate-docs**および**translate-svg（および`sync` **のドキュメントステップ）：ファイルごとの並列OpenRouter**バッチ**リクエストの最大数（各バッチには多数のセグメントを含められます）。省略時はデフォルトで**4。`translate-ui`では無視されます。`-b` / `--batch-concurrency`で上書き可能。`sync`では、`-b`はドキュメント翻訳ステップにのみ適用されます。

### `batchSize` / `maxBatchChars` **(オプション)

ドキュメント翻訳のセグメントバッチ処理：APIリクエストごとのセグメント数と文字数の上限。デフォルト：**20**セグメント、**4096文字（省略時）。

### `openrouter`

| フィールド               | 説明                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `baseUrl`           | OpenRouter APIのベースURL。デフォルト：`https://openrouter.ai/api/v1`。                        |
| `translationModels` | モデルIDの優先順序付きリスト。最初のものが最初に試され、エラー時には後続のエントリがフォールバックとして使用されます。`translate-ui` **のみの場合**、このリストの前に1つのモデルを試すために`ui.preferredModel`を設定することもできます（`ui`を参照）。 |
| `defaultModel`      | 旧式の単一プライマリモデル。`translationModels`が未設定または空の場合にのみ使用されます。       |
| `fallbackModel`     | 旧式の単一フォールバックモデル。`defaultModel`の後に使用され、`translationModels`が未設定または空の場合に有効になります。 |
| `maxTokens`         | リクエストごとの最大完了トークン数。デフォルト：`8192`。                                      |
| `temperature`       | サンプリング温度。デフォルト：`0.2`。                                                    |

**複数のモデルを使用する理由：** 異なるプロバイダーとモデルは、言語やロケールごとにコストや品質に差があります。`openrouter.translationModels` **を単一モデルではなく順序付きフォールバックチェーンとして設定することで**、リクエストが失敗した場合にCLIが次のモデルを試行できます。

以下のリストは拡張可能な**ベースライン**として扱ってください。特定のロケールの翻訳が不十分または失敗する場合は、その言語またはスクリプトを効果的にサポートするモデルを調査し（オンラインリソースやプロバイダーのドキュメントを参照）、それらのOpenRouter IDをさらに代替として追加してください。

このリストは**広範なロケールカバレッジのためにテスト済み**です（たとえば、**36**のターゲットロケールを翻訳するTransrewrtプロジェクトで）**2026年4月**に。実用的なデフォルトとして機能しますが、すべてのロケールで良好なパフォーマンスが保証されているわけではありません。

例 `translationModels`（`npx ai-i18n-tools init`と同じデフォルト）：

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

環境変数または`.env`ファイルで`OPENROUTER_API_KEY`を設定してください。

### `features`

| フィールド                | ワークフロー | 説明                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `extractUIStrings`   | 1        | ソースをスキャンして`t("…")` / `i18n.t("…")`を検出し、オプションの`package.json`説明および（有効の場合）`ui-languages.json` `englishName`の値を`strings.json`にマージします。 |
| `translateUIStrings` | 1        | `strings.json`エントリを翻訳し、ロケールごとのJSONファイルを出力します。 |
| `translateMarkdown`  | 2        | `.md` / `.mdx`ファイルを翻訳します。                                   |
| `translateJSON`      | 2        | DocusaurusのJSONラベルファイルを翻訳します。                            |
| `translateSVG`       | 2        | スタンドアロンの`.svg`アセットを翻訳（トップレベルの`svg`ブロックが必要です）。 |

`features.translateSVG`がtrueで、かつトップレベルの`svg`ブロックが設定されている場合、**スタンドアロン**のSVGアセットを`translate-svg`で翻訳します。両方が設定されている場合、`sync`コマンドはそのステップを実行します（`--no-svg`でない限り）。

### `ui`

| フィールド                       | 説明                                                             |
| --------------------------- | ----------------------------------------------------------------------- |
| `sourceRoots`               | `t("…")`呼び出しをスキャンする対象のディレクトリ（カレントワーキングディレクトリからの相対パス）。               |
| `stringsJson`               | マスターカタログファイルへのパス。`extract`によって更新されます。                  |
| `flatOutputDir`             | ロケールごとのJSONファイルが書き出されるディレクトリ（`de.json`など）。    |
| `preferredModel`            | オプション。最初にOpenRouterのモデルID（`translate-ui`専用）が試され、次に`openrouter.translationModels`（またはレガシーモデル）が順に試されます。ただし、このIDは重複しません。 |
| `reactExtractor.funcNames`  | スキャン対象の追加関数名（デフォルト: `["t", "i18n.t"]`）。         |
| `reactExtractor.extensions` | 含めるファイル拡張子（デフォルト: `[".js", ".jsx", ".ts", ".tsx"]`）。 |
| `reactExtractor.includePackageDescription` | `true`の場合（デフォルトは`extract`）、`package.json`は存在する場合に`description`をUI文字列として含めます。 |
| `reactExtractor.packageJsonPath` | オプションの説明抽出に使用される`package.json`ファイルへのカスタムパス。 |
| `reactExtractor.includeUiLanguageEnglishNames` | `true`の場合（デフォルトは`false`）、`extract`は、ソーススキャンからすでに存在しない場合に、`uiLanguagesPath`のマニフェストからの各`englishName`を`strings.json`に追加します（同じハッシュキー）。`uiLanguagesPath`が有効な`ui-languages.json`を指している必要があります。 |

### `cacheDir`

| フィールド      | 説明                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `cacheDir` | SQLiteキャッシュディレクトリ（すべての`documentations`ブロックで共有）。実行間で再利用可能。カスタムのドキュメント翻訳キャッシュから移行する場合は、アーカイブまたは削除してください。`cacheDir`は独自のSQLiteデータベースを作成し、他のスキーマとは互換性がありません。 |

VCSの除外に関するベストプラクティス：

- 一時的なキャッシュアーティファクトのコミットを避けるため、翻訳キャッシュフォルダーの内容を除外してください（例: `.gitignore`または`.git/info/exclude`経由）。
- `ai-i18n-tools`を使用するソフトウェアの変更やアップグレード時に、未変更のセグメントの再翻訳を回避し、実行時間とAPIコストを節約するために、`cache.db`を保持してください（通常の削除は避けてください）。

例：

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db
```

### `documentations`

ドキュメントパイプラインブロックの配列。`translate-docs`および`sync`のドキュメントフェーズは、**それぞれの**ブロックを順番に処理します。

| フィールド                                        | 説明                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description`                                | このブロックのための任意の読み取り可能な注釈（翻訳では使用されません）。設定されている場合、`translate-docs` `🌐`の見出しに接頭辞として付加され、`status`セクションのヘッダーにも表示されます。                                                     |
| `contentPaths`                               | 翻訳対象のMarkdown/MDXソース（`translate-docs`が`.md` / `.mdx`をスキャンします）。JSONラベルは、同じブロックの`jsonSource`から取得されます。                                                                                  |
| `outputDir`                                  | このブロックの翻訳出力のルートディレクトリ。                                                                                                                                                                      |
| `sourceFiles`                                | 読み込み時に `contentPaths` にマージされるオプションのエイリアス。                                                                                                                                                                        |
| `targetLocales`                              | このブロック専用のオプションのロケールのサブセット（指定しない場合はルートの `targetLocales` を使用）。有効なドキュメントロケールは、すべてのブロックにわたる和集合として決定されます。                                                                             |
| `jsonSource`                                 | このブロック用の Docusaurus JSON ラベルファイルのソースディレクトリ（例: `"i18n/en"`）。                                                                                                                                       |
| `markdownOutput.style`                       | `"nested"`（デフォルト）、`"docusaurus"`、または `"flat"`。                                                                                                                                                                        |
| `markdownOutput.docsRoot`                    | Docusaurus レイアウト用のソースドキュメントルート（例: `"docs"`）。                                                                                                                                                                   |
| `markdownOutput.pathTemplate`                | カスタムマークダウン出力パス。プレースホルダー: <code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{docsRoot}"}</code>、<code>{"{relativeToDocsRoot}"}</code>。 |
| `markdownOutput.jsonPathTemplate`            | ラベルファイル用のカスタムJSON出力パス。`pathTemplate` と同じプレースホルダーをサポートします。                                                                                                                                |
| `markdownOutput.flatPreserveRelativeDir`     | `flat` スタイルの場合、同じベース名のファイルが衝突しないようにソースのサブディレクトリを保持します。                                                                                                                              |
| `markdownOutput.rewriteRelativeLinks` | 翻訳後に相対リンクを書き換えます（`flat` スタイルでは自動的に有効になります）。                                                                                                                                                 |
| `markdownOutput.linkRewriteDocsRoot` | フラットリンクの書き換えプレフィックスを計算する際に使用されるリポジトリルート。通常は `"."` のままにしてください。翻訳されたドキュメントが別のプロジェクトルート下にある場合を除き。 |
| `markdownOutput.postProcessing` | 翻訳されたマークダウンの**本文**にオプションで変換を適用します（YAMLフロントマターは保持されます）。セグメントの再結合およびフラットリンクの書き換えの後、`addFrontmatter`の前に行われます。 |
| `segmentSplitting` | **`markdownOutput`** と同じレベル（`documentations[]` ブロックごと）。**translate-docs** 抽出用のより細かいセグメント: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"? }`。**`enabled`** が **`true`** の場合（**`segmentSplitting`** が省略された場合のデフォルト）、密な段落、GFMパイプテーブル（最初のチャンクにヘッダー、セパレーター、最初のデータ行を含む）、長いリストが分割されます。サブパートは単一の改行で再結合されます（**`tightJoinPrevious`**）。**`"enabled": false`** を設定すると、空白行で区切られた本文ブロックごとに1つのセグメントのみを使用します。 |
| `markdownOutput.postProcessing.regexAdjustments` | `{ "description"?, "search", "replace" }` の順序付きリスト。`search` は正規表現パターンです（プレーン文字列の場合はフラグ `g`、または `/pattern/flags` を使用）。`replace` は `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` などのプレースホルダーをサポートします。 |
| `markdownOutput.postProcessing.languageListBlock` | `{ "start", "end", "separator" }` — 翻訳ツールは、`start` を含む最初の行と一致する `end` 行を検出し、その範囲を標準の言語スイッチャーに置き換えます。リンクは翻訳されたファイルからの相対パスで作成されます。ラベルは設定されていれば `uiLanguagesPath` / `ui-languages.json` から、それ以外は `localeDisplayNames` とロケールコードから取得されます。 |
| `addFrontmatter`                  | `true` のとき（省略時はデフォルト）、翻訳されたMarkdownファイルにはYAMLキー: `translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`が含まれ、少なくとも1つのセグメントにモデルのメタデータがある場合は`translation_models`（使用されたOpenRouterモデルIDのソート済みリスト）も含まれます。スキップするには`false`に設定します。 |

例（フラットなREADMEパイプライン — スクリーンショットパス＋オプションの言語リストラッパー）:

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

### `svg` (任意)

スタンドアロンSVGアセットのトップレベルのパスとレイアウト。**`features.translateSVG`** が true の場合にのみ翻訳が実行されます（`translate-svg` または `sync` のSVGステージ経由）。

| フィールド                       | 説明 |
| --------------------------- | ----------- |
| `sourcePath`                | 再帰的に`.svg`ファイルをスキャンするディレクトリ1つ、またはディレクトリの配列。 |
| `outputDir`                 | 翻訳済みSVG出力のルートディレクトリ。 |
| `style`                     | `pathTemplate`が未設定の場合は`"flat"`または`"nested"`。 |
| `pathTemplate`              | カスタムSVG出力パス。プレースホルダー: <code>{"{outputDir}"}</code>、<code>{"{locale}"}</code>、<code>{"{LOCALE}"}</code>、<code>{"{relPath}"}</code>、<code>{"{stem}"}</code>、<code>{"{basename}"}</code>、<code>{"{extension}"}</code>、<code>{"{relativeToSourceRoot}"}</code>。 |
| `svgExtractor.forceLowercase` | SVG再構成時に小文字に変換されたテキストを使用。すべて小文字のラベルに依存するデザインに便利です。 |

### `glossary`

| フィールド          | 説明                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uiGlossary`   | `strings.json`へのパス - 既存の翻訳から自動的に用語集を構築します。                                                                                                                 |
| `userGlossary` | `Original language string`（または`en`）、`locale`、`Translation`の列を持つCSVファイルへのパス - ソース用語とターゲットロケールごとに1行（`locale`はすべてのターゲットに対して`*`でも可）。 |

レガシーのキー`uiGlossaryFromStringsJson`は依然として受け入れられ、設定読み込み時に`uiGlossary`にマッピングされます。

空の用語集CSVを生成する:

```bash
npx ai-i18n-tools glossary-generate
```

---

## CLIリファレンス

| コマンド                                                                   | 説明                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                                                                 | CLIのバージョンとビルドタイムスタンプを表示（ルートプログラムの`-V` / `--version`と同じ情報）。                                                                                                                                                                                                  |
| `init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]` | スターター設定ファイルを書き出す（`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`documentations[].addFrontmatter`を含む）。`--with-translate-ignore`はスターター`.translate-ignore`を作成する。                                                                            |
| `extract`                                                                 | `t("…")` / `i18n.t("…")`のリテラルから`strings.json`を更新し、オプションで`package.json`の説明とマニフェストの`englishName`エントリを追加（`ui.reactExtractor`を参照）。`features.extractUIStrings`が必要です。                                                                                                                                                                                                    |
| `generate-ui-languages [--master <path>] [--dry-run]`                     | `sourceLocale` + `targetLocales` およびバンドルされた `data/ui-languages-complete.json`（設定されている場合は `--master`）を使用して、`ui.flatOutputDir`（または設定されている場合は `uiLanguagesPath`）に `ui-languages.json` を書き込みます。マスターファイルに存在しないロケールについては、警告を出して `TODO` プレースホルダーを出力します。カスタマイズされた `label` または `englishName` 値を含む既存のマニフェストがある場合、それらはマスターカタログのデフォルト値に置き換えられます。生成されたファイルは後で確認および調整してください。 |
| `translate-docs …`                                                        | 各 `documentations` ブロック（`contentPaths`、オプションの `jsonSource`）のMarkdown/MDXおよびJSONを翻訳します。`-j`：並列処理する最大ロケール数。`-b`：ファイルごとの並列バッチAPI呼び出しの最大数。`--prompt-format`：バッチのワイヤーフォーマット（`xml` \| `json-array` \| `json-object`）。[キャッシュの動作と `translate-docs` フラグ](#cache-behaviour-and-translate-docs-flags)および[バッチプロンプトフォーマット](#batch-prompt-format)を参照してください。 |
| `translate-svg …`                                                         | `config.svg` で設定されたスタンドアロンSVGアセットを翻訳します（ドキュメントとは別）。`features.translateSVG` が必要です。ドキュメントと同じキャッシュの考え方を採用。その実行でSQLiteの読み書きをスキップするには `--no-cache` を使用。`-j`、`-b`、`--force`、`--force-update`、`-p` / `--path`、`--dry-run`。                                                    |
| `translate-ui [--locale <code>] [--force] [--dry-run] [-j <n>]`           | UI文字列のみを翻訳します。`--force`：既存の翻訳を無視して、ロケールごとにすべてのエントリを再翻訳します。`--dry-run`：書き込みもAPI呼び出しも行いません。`-j`：並列処理する最大ロケール数。`features.translateUIStrings` が必要です。                                                                                 |
| `lint-source [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`     | 最初に **`extract`** を実行（**`features.extractUIStrings`** が必要）して **`strings.json`** をソースと一致させ、その後 **source-locale** UI文字列のLLMによるレビュー（スペル、文法）を行います。**用語のヒント**は **`glossary.userGlossary`** CSVからのみ取得（**`translate-ui`** と同じ範囲 — `strings.json` / `uiGlossary` ではないため、誤ったコピーが用語集として強化されることはありません）。OpenRouter（`OPENROUTER_API_KEY`）を使用。アドバイスのみ（実行完了時に終了コード**0**）。**`cacheDir`** 配下に **人間が読める形式**のレポート（概要、問題点、文字列ごとの**OK**行）として **`lint-source-results_<timestamp>.log`** を出力。端末には概要のカウントと問題点のみを表示（文字列ごとの **`[ok]`** 行は表示しない）。最後の行にログファイル名を出力します。**`--json`**：完全な機械可読JSONレポートを標準出力にのみ出力（ログファイルは人間が読める形式のまま）。**`--dry-run`**：依然として **`extract`** を実行し、バッチ計画のみを出力（API呼び出しは行わない）。**`--chunk`**：APIバッチごとの文字列数（デフォルト **50**）。`-j`：並列バッチの最大数（デフォルト **`concurrency`**）。**`--json`** 指定時は、人間向け出力をstderrに出力。リンクには **`path:line`** を使用（**`editor`** UI文字列の「リンク」ボタンと同様）。 |
| `export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]` | XLIFF 2.0形式に `strings.json` をエクスポート（ターゲットロケールごとに1つの `.xliff`）。`-o` / `--output-dir`：出力ディレクトリ（デフォルト：カタログと同じフォルダ）。`--untranslated-only`：そのロケールで翻訳が欠落しているユニットのみ。読み取り専用。APIは使用しません。                                                        |
| `sync …`                                                                  | 有効になっている場合は抽出を実行し、次にUI翻訳、次に `features.translateSVG` および `config.svg` が設定されている場合に `translate-svg` を実行、その後ドキュメント翻訳を実行 — ただし `--no-ui`、`--no-svg`、または `--no-docs` でスキップされる場合を除く。共通フラグ：`-l`、`-p` / `-f`、`--dry-run`、`-j`、`-b`（ドキュメントのバッチングのみ）、`--force` / `--force-update`（ドキュメントのみ、ドキュメント実行時には相互に排他的）。ドキュメントフェーズでは `--emphasis-placeholders` および `--debug-failed` も転送されます（意味は `translate-docs` と同じ）。`--prompt-format` は `sync` フラグではありません。ドキュメントステップでは組み込みのデフォルト（`json-array`）を使用します。                         |
| `status [--max-columns <n>]`                                   | `features.translateUIStrings` が有効な場合、ロケールごとのUIカバレッジ（`Translated` / `Missing` / `Total`）を出力します。その後、ファイル×ロケールごとのMarkdown翻訳ステータスを出力（`--locale` フィルターなし。ロケールは設定から取得）。大規模なロケールリストは、端末での行幅を狭く保つため、最大 `n` 列（デフォルト **9**）の繰り返しテーブルに分割されます。                                                                                                                                                                                               |
| `cleanup [--dry-run] [--no-backup] [--backup <path>]`                  | 最初に `sync --force-update` を実行（抽出、UI、SVG、ドキュメント）し、次に古くなったセグメント行（`last_hit_at` が null またはファイルパスが空）を削除します。解決されたソースパスがディスク上に存在しない `file_tracking` 行を削除します。`filepath` メタデータが存在しないファイルを指している翻訳行を削除します。3つのカウント（古くなったもの、孤立した `file_tracking`、孤立した翻訳）をログ出力します。`--no-backup` でない限り、キャッシュディレクトリ内にタイムスタンプ付きのSQLiteバックアップを作成します。 |
| `editor [-p <port>] [--no-open]`                                          | キャッシュ、`strings.json`、および用語集CSV用のローカルWebエディタを起動します。`--no-open`：デフォルトのブラウザを自動的に開かないようにします。<br><br>**注意：** キャッシュエディタでエントリを編集した場合、更新されたキャッシュエントリを出力ファイルに反映させるために `sync --force-update` を実行する必要があります。また、後でソーステキストが変更されると、新しいキャッシュキーが生成されるため、手動での編集内容は失われます。 |
| `glossary-generate [-o <path>]`                                           | 空の `glossary-user.csv` テンプレートを書き出します。`-o`：出力パスを上書き（デフォルト：設定からの `glossary.userGlossary`、または `glossary-user.csv`）。                                                                                                                                                |

すべてのコマンドは、デフォルト以外の設定ファイルを指定するための `-c <path>`、詳細出力のための `-v`、コンソール出力をログファイルに同時出力するための `-w` / `--write-logs [path]`（デフォルトパス：ルートの `cacheDir` 配下）を受け入れます。ルートプログラムは `-V` / `--version` および `-h` / `--help` もサポートします。`ai-i18n-tools help [command]` は `ai-i18n-tools <command> --help` と同じコマンドごとの使い方を表示します。

---

## 環境変数

| 変数                   | 説明                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `OPENROUTER_API_KEY`   | **必須。** OpenRouter APIキー。                     |
| `OPENROUTER_BASE_URL`  | APIのベースURLを上書きします。                                 |
| `I18N_SOURCE_LOCALE`   | 実行時に `sourceLocale` を上書きします。                        |
| `I18N_TARGET_LOCALES`  | `targetLocales` を上書きするためのカンマ区切りのロケールコード。  |
| `I18N_LOG_LEVEL`       | ロガーのレベル（`debug`、`info`、`warn`、`error`、`silent`）。 |
| `NO_COLOR`             | `1` の場合、ログ出力のANSIカラーを無効にします。            |
| `I18N_LOG_SESSION_MAX` | 1ログセッションあたりに保持する最大行数（デフォルト `5000`）。           |
