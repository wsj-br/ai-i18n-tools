<a id="add-i18n-to-a-jsts-app"></a>
# JS/TSアプリにi18nを追加する

このページでは、単一言語のJS/TSアプリ（React、Next.js、Node、またはCLI）にai-i18n-toolsを使ってロケールを追加します。i18next、小さなブートストラップファイル、および翻訳のJSONファイルという一つのパスに従います。`extract`は、`t()`または`i18n.t()`内の文字列リテラルである場合にのみUI文字列を記録するため、プレーンなソーステキストのカタログは空になります。

最も手っ取り早い方法は、このページのプロンプトをコーディングエージェントに与えることです。エージェントはi18nextをインストールし、ブートストラップを追加し、文字列をラップし、言語切り替えを追加できます。CLIのインストール、プロバイダーの選択、プロジェクトの初期化は、APIキーと選択が必要なため、ご自身で行ってください。翻訳もご自身で行ってください。これはあなたのアカウントで費用が発生するためです。

ウェブサイトまたはドキュメントサイトの場合は、[ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website)を使用します。Pythonアプリの場合は、[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)を使用します。どれが適用されるか不明な場合は、末尾の[該当しない場合](#not-your-case)を参照してください。

流れ:

1. [CLIをインストールしてプロバイダーを選択する](#install-and-choose-a-provider)。
2. `init`で[プロジェクトを初期化する](#initialise-the-project)。
3. [エージェントプロンプトを実行する](#run-the-agent-prompt)。
4. [結果を確認する](#review-the-result)。
5. [モデルを選択して翻訳する](#choose-models-and-translate)後、1つの言語を確認します。
6. [翻訳を維持する](#keep-it-translated)。

変更をご自身で行いたい場合、またはプロンプトが何をするのか知りたいですか？[手動で行う](#do-it-by-hand)では、同じ手順を一つずつ説明します。

<a id="install-and-choose-a-provider"></a>
## プロバイダーのインストールと選択

この部分はエージェントではなく、ご自身で行います。インストーラーはマシンを変更し、APIキーはプロンプトではなくシェルに属する秘密情報です。

パッケージを開発依存関係としてインストールします。ブートストラップは`ai-i18n-tools/runtime`をインポートするため、グローバルCLIやスタンドアロンの実行可能ファイルではそのインポートを満たすことができません。その他のインストールオプション: [インストール](/ja/guide/installation)。

```bash
pnpm add -D ai-i18n-tools
```

`npm install --save-dev ai-i18n-tools`と`yarn add --dev ai-i18n-tools`も機能します。以下の例では、裸の`ai-i18n-tools`コマンドを使用しています。ローカルインストールでは、`PATH`上で`node_modules/.bin`、または各コマンドの前に`pnpm exec`が必要です。[CLIの使用](/ja/guide/installation#using-the-cli)を参照してください。

インストールを確認します:

```bash
ai-i18n-tools --version
```

次に、プロバイダーを選択し、翻訳を実行するシェルでそのAPIキーを設定します。例: OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollamaはキーを必要としません。その他のプリセット: [組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)。プロバイダー名をメモしておいてください。次のステップで`init`に渡すためです。エージェントはキーを必要としません。モデル呼び出しを行わないコマンドのみを実行するためです。キーは後で[翻訳する](#choose-models-and-translate)ときに使用します。

<a id="initialise-the-project"></a>
## プロジェクトの初期化

これはプロンプトの前に一度実行します。これにより設定が書き込まれ、上記で選択したプロバイダーが使用されます。

```bash
ai-i18n-tools init -P openrouter
```

デフォルトのテンプレートは`ui-markdown`です。これにより、UIブロックとフラットなREADMEブロックを含む`ai-i18n-tools.config.json`が書き込まれます。アプリにとって重要な4つのキー:

- `sourceLocale`: ソース内の文字列の言語。任意のBCP-47言語が有効です。スキャフォールドではよく`en-GB`が使用されます。
- `targetLocales`: 追加する言語。
- `ui.sourceRoots`: `extract`がスキャンするフォルダー。例: `src/`。
- `ui.stringsJson`と`ui.flatOutputDir`: カタログとロケールごとのファイルが書き込まれる場所。

`init`はi18nextをインストールせず、ブートストラップも追加しません。それはプロンプト（手動の場合は[ステップ1](#step-1-install-the-runtime-libraries)と[ステップ2](#step-2-extract-once-and-add-the-bootstrap)）が行います。

`init`を一度実行します。これは毎回`ai-i18n-tools.config.json`を上書きするため、2回目を実行すると行った編集が失われます。

同じテンプレートには、ドキュメント翻訳用に`README.md`がリストされています。言語リストマーカーとREADMEファイルは、[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)にあります。このページは`t()`パスです。

その他のすべてのキーは[設定](/ja/reference/configuration)にあります。呼び出し形式：[t()呼び出しと複数形](/ja/guide/ui-strings/t-calls-and-plurals)。ブートストラップの参照：[i18nextを接続する](/ja/guide/ui-strings/i18next-runtime)。

<a id="run-the-agent-prompt"></a>
## エージェントプロンプトを実行する

コーディングエージェント（Cursor、Claude Code、Copilotなど）でプロジェクトを開き、新しいチャットを開始し、以下のプロンプトを貼り付けます。プロジェクトはすでに初期化されている必要があります。編集するものは何もありません。例えば言語切り替えを不要にするなど、何か除外したい場合は、同じメッセージでその旨を伝えてください。

エージェントはまずCLIと設定が存在するかどうかを確認し、どちらかが不足している場合は指示を出して停止します。その後、3つの部分に分かれて作業します。

- パート1ではi18nextをインストールし、`extract`を一度実行して、ブートストラップを追加します。
- パート2では、ユーザー向けの文字列を`t()`または`i18n.t()`でラップします。
- パート3では、言語切り替え、またはCLI言語オプションを追加します。

CLIのインストール、設定の初期化、APIキーの読み取り、翻訳は行いません。翻訳はレビュー後のステップであり、ユーザーが実行します。

````markdown
# Add languages to this JS/TS app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists with a `ui` block. If either is missing,
stop now and tell the user to install ai-i18n-tools as a dev dependency and
run `ai-i18n-tools init -P <provider>`, then run this prompt again. Do not
install the CLI or initialise the config yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`).
- Do not introduce semantic keys (`saveButton`, `nav.home`). The literal in
  `t("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Runtime

Skip a piece of this part when it is already done.

1. Install `i18next` with the project's package manager. Install
   `react-i18next` only when a component uses `useTranslation()`.
2. Run `ai-i18n-tools extract` once. It writes `strings.json` and
   `ui-languages.json` even when it finds no `t()` calls, so the app compiles.
   Expect 0 strings, or 1 when `package.json` has a `description`
   (`ui.uiExtractor.includePackageDescription` is on by default).
3. Add the bootstrap below. Put it where this repository keeps its app code,
   and point the JSON imports at `ui.stringsJson`, `ui.flatOutputDir`, and
   `languagesManifestPath` when that key is set. `SOURCE_LOCALE` must equal
   config `sourceLocale`, character for character. The sample uses `en-GB`
   only as the shape.
4. Import the bootstrap from the app entry before the first render. In
   Next.js, import it from a client module. Do not call `changeLanguage` on a
   shared i18next instance inside a server component. Concurrent requests
   share that singleton. Use a per-request `createInstance()`, or a stateless
   lookup of the flat bundle.

Not using React? Drop the `react-i18next` import and the `.use(initReactI18next)` call.

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

For JSON under `public/`, the loader fetches `/locales/<code>.json` and
parses the response. For a Node CLI with no bundler, read the file with
`readFileSync` inside that function. A call that uses `{ plurals: true, count }`
also needs the
source-locale flat file under `flatOutputDir`. That file does not exist until
the user runs `translate-ui`, so leave `sourcePluralFlatBundle` out and name
the plural calls in the report.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

Read `ui.sourceRoots` and edit only those trees (JS, JSX, TS, TSX). Leave
`className`, URLs and routes, import paths, ids, test ids, enum and error
codes, object keys used as identifiers, log field names, CSS, regexes, and
comments.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. A constant that
  would call `t()` at import time must move into a function or
  `useMemo(..., [t])`, so `t()` runs after the locale loads.
- Placeholders: `t("Hello {{name}}", { name })`. The argument must be a string
  literal. `t(variable)` and a template literal as the key are not extracted.
- Plurals: `t("{{count}} items", { plurals: true, count })`. Do not invent
  `_one` / `_other` keys.
- One `t()` per sentence. Split only where the text already branches.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

Work in passes: list string literals that are not passed to `t` or `i18n.t`,
wrap the user-facing ones, then list again. Treat any bulk rewrite as a draft
and review its diff. Then run `ai-i18n-tools extract` again.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A command-line program still gets
this part: a language option, not a widget.

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Accept only codes listed in `ui-languages.json`.

- Restore a saved locale before the first render, then draw a control labelled
  `t("Language")` whose options come from that manifest. On change, call
  `await loadLocale(code)` and then `await i18n.changeLanguage(code)`.
- In Next.js, reading `localStorage` in an effect after hydration paints the
  source locale first. Prefer a cookie the server can read, or load the saved
  locale in the client module before the first client render. Do not call
  `changeLanguage` on a shared instance inside a server component.
- A CLI: add `--lang <code>` and `-L <code>` unless those names are taken.
  Read the option before help text is built, so help can be translated too.
  After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`. Then the source locale.

## Verify and report

The project's build, type check, and tests pass. `extract` writes a non-empty
catalog of the sentences you wrapped. With the source locale, the output is
unchanged.

Report the files changed, each string you skipped with a one-line reason, the
same word used with different meanings, sentences built from translated pieces,
plurals that still need `sourcePluralFlatBundle` after the user translates,
and any `t()` that runs at import time. Then list the commands for the user,
and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then reload the app.
````

<a id="review-the-result"></a>
## 結果をレビューする

エージェントはレポートで終了します。翻訳する前に確認してください。

- 差分。ラップされたテキストは、無関係な再フォーマットなしで、以前と同じように読めるはずです。`git diff --stat`は変更量を示します。ブートストラップ、そのインポート、ラップされた呼び出し、および言語切り替えは、予期される編集です。
- 生成されたカタログ（`strings.json`、ロケールごとのJSON、`ui-languages.json`）は、`extract`が書き込んだもの以外は変更されていません。
- `ai-i18n-tools extract`はクリーンに実行され、`strings.json`は期待する文をリストします。
- テストがパスし、アプリはソース言語で同じように見えます。
- レポート内のスキップされた文字列と曖昧なケース：異なる意味で使用される単語、断片から構築された文、複数形。これらは手動で決定してください。
- ブートストラップ内の`SOURCE_LOCALE`は、設定内の`sourceLocale`と等しいです。

エージェントが見落とした文字列は、後でソース言語のままのテキストとして表示されます。

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

この部分はユーザーが実行します。これはユーザーのAPIキーを使用し、アカウントに費用が発生します。

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`は`translationModels`のみを置き換えます。同じランキングが`ai-i18n-tools dashboard`の[モデル](/ja/guide/translation-dashboard/models)タブにあります。

その後、抽出して翻訳します。

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract`は`strings.json`と`ui-languages.json`を書き込みます。`translate-ui`は`ui.flatOutputDir`の下にターゲット言語ごとに1つのJSONファイルを書き込みます。これらの生成されたファイルは編集しないでください。`features.translateUIStrings`がオンの場合、`sync`は`extract`と`translate-ui`を一緒に実行します。`extract`がスキャンして書き込むもの：[UI文字列、ステップ2](/ja/guide/ui-strings/#step-2-extract-strings)。

`t()`はロケールJSONでソース文を検索します。`strings.json`内のIDは検索キーではありません。ファイルが見つからないか、キーが見つからない場合は、ソース文が返されます。

<a id="check-one-language"></a>
### 1つの言語を確認する

アプリをリロードし、1つのターゲット言語に切り替えて、いくつかのラップされた文字列がある画面を開きます。エージェントが追加した言語切り替えを使用するか、`loadLocale`と`changeLanguage`を自分で呼び出してください。ソース言語のままのテキストは、ラップされていないか、インポート時に実行されるか、ロケールJSONにエントリがありません。コードを疑う前に、JSONでその文を確認してください。

ラップされた呼び出しが`{ plurals: true, count }`を使用する場合、複数形を解決するためにソースロケールのフラットファイルを追加します。これにより、`flatOutputDir`からの`{sourceLocale}.json`のインポートと、[i18nextを接続する](/ja/guide/ui-strings/i18next-runtime)に示されている`sourcePluralFlatBundle`オプションが追加されます。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソーステキストを変更した後、`ai-i18n-tools sync`（または`extract`を実行してから`translate-ui`）を再実行してください。キャッシュにより、新規または変更された文字列のみがモデルに送られます。[推奨されるpackage.jsonスクリプト](/ja/guide/quick-start#recommended-packagejson-scripts)からスクリプトを追加し、翻訳がずれないようにCIで`sync`を実行してください。翻訳実行後にアプリを再読み込みして、新しいJSONを読み込ませてください。`ai-i18n-tools dashboard`は[翻訳ダッシュボード](/ja/guide/translation-dashboard/)を開き、翻訳を確認できます。

デフォルトの`init`テンプレートには`README.md`もリストされています。`sync`が翻訳する前に言語リストマーカーを貼り付けてください。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="do-it-by-hand"></a>
## 手動で実行する

変更を自分で加えたい場合、またはプロンプトが何をするのかを知りたい場合は、これらの手順を実行してください。手順はプロンプトの各部分に対応しています。最後に[CLIをインストール](#install-and-choose-a-provider)し、[プロジェクトを初期化](#initialise-the-project)し、[翻訳](#choose-models-and-translate)することは変わりません。

1. [ランタイムライブラリをインストールする](#step-1-install-the-runtime-libraries)。
2. [一度抽出してブートストラップを追加する](#step-2-extract-once-and-add-the-bootstrap)。
3. `t()`または`i18n.t()`で[文字列をラップする](#step-3-wrap-strings)。
4. [言語切り替えを追加する](#step-4-add-a-language-switch)。

<a id="step-1-install-the-runtime-libraries"></a>
## ステップ1：ランタイムライブラリをインストールする

ai-i18n-tools は `i18next` または `react-i18next` に依存しません。アプリがそれらをインストールします。

- ランタイムで文字列を検索するすべてのJS/TSアプリ: `i18next`。
- `useTranslation()` を呼び出すReactコンポーネント: `react-i18next` も。

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## ステップ2：一度抽出してブートストラップを追加する

ブートストラップは`strings.json`と`ui-languages.json`をインポートし、`extract`のみがそれらを書き込みます。`t()`の呼び出しが見つからない場合でも両方を書き込むため、アプリはコンパイルされます。

```bash
ai-i18n-tools extract
```

`package.json`に`description`がある場合、エクストラクターがデフォルトでそれを含めるため（`ui.uiExtractor.includePackageDescription`）、0個または1個の文字列を期待してください。

i18nセットアップファイルを作成します。このバージョンは、文字列をラップして翻訳するのに十分です。`ai-i18n-tools.config.json`では`SOURCE_LOCALE`が`sourceLocale`と等しくなければなりません。インポートパスを`ui.stringsJson`と`ui.flatOutputDir`に一致するように調整してください。

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

Reactを使用していませんか？`react-i18next` のインポートと `.use(initReactI18next)` の呼び出しを削除してください。

`public/`配下のJSONバンドルの場合、ローダーは`/locales/${code}.json`をフェッチします。バンドラーなしのNode CLIの場合、`readFileSync`でファイルを読み取ります。両方の形式は[ロケールローダー](/ja/guide/ui-strings/i18next-runtime#locale-loaders)に記載されています。

最初のレンダリングの前に、アプリのエントリからこのファイルをインポートします。Next.jsでは、[examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) と同じパターンで、クライアントモジュールからインポートします。

<a id="step-3-wrap-strings"></a>
## ステップ3：文字列をラップする

`t()`の引数は、ユーザーに表示されるべきソース言語の文です。フラットなロケールファイルは、その文をキーとしています。

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node、CLI、またはReact以外のモジュール:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

ルール ([t()呼び出しと複数形](/ja/guide/ui-strings/t-calls-and-plurals)にも記載):

- キーはリテラルです。`t(variable)`と<code>{'t(`Hello ${name}`)'}</code>は抽出されず、リテラルでない呼び出しは警告なしにスキップされます。
- リテラル内のプレースホルダーは、i18next形式の<code v-pre>{{name}}</code>を使用し、2番目の引数で渡されます。
- 複数形: 1つのソース文と`{ plurals: true, count }`。[基数複数形](/ja/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true)を参照してください。`_one` / `_other`キーを自分で作成しないでください。
- Reactコンポーネントは`useTranslation()`から`t`を取得します。他のファイルは`i18n.t`を呼び出します。インポート時に評価される定数は、関数または`useMemo(..., [t])`内に移動する必要があります。これにより、ロケールがロードされた後に`t()`が実行されます。
- Next.jsサーバーコンポーネントは、共有i18nextインスタンスで`changeLanguage`を呼び出してはなりません。同時リクエストはそのシングルトンを共有します。リクエストごとの`createInstance()`を使用するか、フラットバンドルのステートレスなルックアップを使用してください（[Nextraハイブリッド](/ja/guide/integrations/nextra#optional-t-for-app-react-hybrid)を参照）。

これらはそのままにしてください: `className`、`href`、その他のURL、インポートパス、ID、テストID、エラーコード、識別子として使用されるオブジェクトキー、およびコメント内のテキスト。

もう一度`ai-i18n-tools extract`を実行してください。カタログには、ラップした文がリストされているはずです。

<a id="step-4-add-a-language-switch"></a>
## ステップ4: 言語切り替えを追加する

[i18nextを接続する](/ja/guide/ui-strings/i18next-runtime#startup-locale)で説明されているように、最初のレンダリングの前に保存されたロケールを復元します。次に、`await loadLocale(code)`に続いて`await i18n.changeLanguage(code)`を呼び出すコントロールを追加します。`ui-languages.json`からオプションを構築します。ウィジェット、ラベル、および右から左へのレイアウトについては、[言語スイッチャーとRTL](/ja/guide/ui-strings/language-switcher)を参照してください。

コマンドラインプログラムにはウィジェットがありません。`--lang <code>`（およびその名前が空いている場合は`-L`）を追加し、次にアプリが既に所有している言語環境変数を追加します。`AI_I18N_LANG`は読み取らないでください。その変数はai-i18n-tools CLI専用です。`ui-languages.json`にリストされているコードのみを受け入れてください。

プログラムが人が読むテキストを表示しない場合は、このステップをスキップしてください。

これが最後の手動ステップです。[モデルを選択して翻訳する](#choose-models-and-translate)に進んでください。

<a id="coming-from-another-tool"></a>
## 他のツールからの移行

ai-i18n-toolsには独自の文字列抽出機能が含まれています。`i18next-scanner`、`babel-plugin-i18next-extract`などを使用していた場合、移行後にそれらの開発依存関係を削除できます。既存のi18next名前空間JSONファイルは、[JSONパイプライン](/ja/guide/json#i18next-namespace-files)に残すことができます。Intlayerの`.content.ts`辞書は`migrate-intlayer`でインポートできます。[Intlayerからの移行](/ja/guide/migrating-from-intlayer)を参照してください。実行時にIntlayerを維持し、その翻訳のみを埋めるには、`translate-intlayer`を使用します。[Intlayerをその場で翻訳する](/ja/guide/translating-intlayer)を参照してください。

<a id="not-your-case"></a>
## 当てはまりませんか？

| 現在のコード | 参照 |
| --- | --- |
| すでにソース言語の文で `t("…")` または `i18n.t("…")` を使用している場合 | [UI文字列](/ja/guide/ui-strings/) ステップ2～3、次に [i18nextを組み込む](/ja/guide/ui-strings/i18next-runtime) |
| i18nextネームスペースJSON (`t("saveButton")` および `en/translation.json`) | [JSON](/ja/guide/json)。すべての呼び出しを変更する準備ができていない限り、これらのキーをソース言語の文に切り替えないでください |
| Intlayer辞書、Intlayerからの移行 | [Intlayerからの移行](/ja/guide/migrating-from-intlayer) |
| Intlayer辞書、Intlayerを維持する場合 | [Intlayerをその場で翻訳する](/ja/guide/translating-intlayer) |
| 単一のHTMLファイル | [プレーンHTML](/ja/guide/ui-strings/plain-html) と `mark-html` |
| ドキュメントサイト、またはAstroページのHTML | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website) と [Astroウェブサイト](/ja/guide/ui-strings/astro-website)。`t()` は共有データとフロントマターのみに使用します |
| Pythonアプリ | [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) |
| Django、Flask-Babelカタログ、または既にGNU gettextを使用しているアプリ | [Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext) |
| リポジトリのREADMEまたはその他のMarkdownファイル | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 例

| 例 | 内容 |
| --- | --- |
| [コンソールアプリ](/ja/examples#console-app) | 最小のNode.jsアプリで、`t()`は既にラップ済み、さらにREADMEブロック付き |
| [Next.jsアプリ](/ja/examples#nextjs-app) | Reactのブートストラップ、複数形、ドキュメントサイト、およびREADMEブロック |

`npx degit`を使って1つコピーします。コマンド: [例](/ja/examples#nodejs-examples)。
