<a id="add-i18n-to-a-jsts-app"></a>
# JS/TSアプリにi18nを追加する

このページは、ボタン、ラベル、メッセージがまだプレーンなソース言語のテキストであるJS/TSアプリ（React、Next.js、Node、またはCLI）向けです。`extract` は、`t()` または `i18n.t()` 内の文字列リテラルである場合にのみUI文字列を記録するため、現時点ではカタログは空になり、`translate-ui` には翻訳すべきものがありません。

手順：ツールをインストールし、i18nextをインストールし、`extract` を一度実行し、`t` が存在するように小さなセットアップファイルを追加し、ユーザー向けテキストをラップし、その後翻訳します。これがあなたのケースに当てはまるか不明ですか？最後に [あなたのケースではない場合](#not-your-case) を参照してください。

<a id="install-and-choose-a-provider"></a>
## ツールをインストールし、キーを設定する

CLIをインストールし ([インストール](/ja/guide/installation))、プロバイダーのAPIキーを設定します ([プロバイダーとAPIキー](/ja/guide/quick-start#provider-and-api-key))。Ollamaはキーを必要としません。

<a id="initialise-the-project"></a>
## 設定を初期化する

```bash
ai-i18n-tools init -P openrouter
```

これにより `ai-i18n-tools.config.json` が書き込まれます。現時点では4つのキーが重要です。

- `sourceLocale`: テキストが書かれている言語。どの言語でも有効です。このガイドでは英語が一般的な例です。
- `targetLocales`: 追加する言語。
- `ui.sourceRoots`: `extract` がスキャンするフォルダー。例えば `src/`。
- `ui.stringsJson` と `ui.flatOutputDir`: カタログとロケールごとのファイルが書き込まれる場所。

その他のすべてのキーは [設定](/ja/reference/configuration) にあります。

<a id="run-the-agent-prompt"></a>
## ランタイムライブラリをインストールする

ai-i18n-tools は `i18next` または `react-i18next` に依存しません。アプリがそれらをインストールします。

- ランタイムで文字列を検索するすべてのJS/TSアプリ: `i18next`。
- `useTranslation()` を呼び出すReactコンポーネント: `react-i18next` も。

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="review-the-result"></a>
## extractを一度実行する

```bash
ai-i18n-tools extract
```

次のステップのセットアップファイルは `strings.json` と `ui-languages.json` をインポートし、`extract` のみがそれらを書き込みます。`t()` の呼び出しが見つからない場合でも両方を書き込むため、アプリはコンパイルされます。0個の文字列を想定してください。ただし、`package.json` に `description` がある場合は1個です。これは、エクストラクターがデフォルトでそれを含めるためです (`ui.uiExtractor.includePackageDescription`)。

<a id="choose-models-and-translate"></a>
## ブートストラップを追加する

i18nセットアップファイルを作成します。この最小限のバージョンで、文字列をラップして翻訳するのに十分です。`SOURCE_LOCALE` は `ai-i18n-tools.config.json` 内の `sourceLocale` と等しくなければなりません。

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

アプリが複数形を使用し始めたら、複数形が解決されるようにソースロケールのフラットファイルを追加します。これにより、3番目のインポートと `sourcePluralFlatBundle` オプションが追加されます。これは [i18nextを接続する](/ja/guide/ui-strings/i18next-runtime) に示されています。

最初のレンダリングの前に、アプリのエントリからこのファイルをインポートします。Next.jsでは、[examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts) と同じパターンで、クライアントモジュールからインポートします。

<a id="check-one-language"></a>
## ハードコードされたコピーを置き換える

手動で行うか、コーディングエージェントに[JS/TSプロンプト](#run-the-agent-prompt)を貼り付けます。`t()`への引数は、ユーザーに表示されるべきソース言語の文です。フラットなロケールファイルは、その文をキーとしています。

<details class="agent-prompt" id="agent-prompt">
<summary>JS/TSエージェントプロンプト</summary>

これをCursorまたは他のコーディングエージェントにコピーしてください。これはユーザー向けの文字列リテラルをラップします。それらを翻訳しません。

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

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

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

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

<a id="keep-it-translated"></a>
## 抽出と翻訳

リテラルが配置されたら:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`features.translateUIStrings`がオンの場合、`sync`は`extract`と`translate-ui`を一緒に実行します。`extract`には、ラップした文がリストされているはずです。`ui.flatOutputDir`の下に生成されたロケールファイルを1つ開き、翻訳があることを確認してください。次に、`extract`がスキャンして書き込む内容については、[UI文字列、ステップ2](/ja/guide/ui-strings/#step-2-extract-strings)を参照してください。

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app)は、`src/main.js`がすでにラップされている小さなNodeアプリです。Next.jsの例はReactのブートストラップです。

<a id="do-it-by-hand"></a>
## 言語切り替え

[i18nextの配線](/ja/guide/ui-strings/i18next-runtime#startup-locale)で説明されているように、最初のレンダリングの前に保存されたロケールを復元します。その後、`await loadLocale(code)`に続いて`await i18n.changeLanguage(code)`を呼び出すコントロールを追加します: [言語スイッチャーとRTL](/ja/guide/ui-strings/language-switcher)。

<a id="step-1-install-the-runtime-libraries"></a>
## 翻訳を維持する

ソーステキストを変更した後、`sync`を再実行します。キャッシュにより、新規または変更された文字列のみがモデルに送られます。[推奨されるpackage.jsonスクリプト](/ja/guide/quick-start#recommended-packagejson-scripts)からスクリプトを追加し、CIで`sync`を実行して翻訳がずれないようにします。

デフォルトの`init`テンプレートは`README.md`も翻訳します。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## 他のツールからの移行

ai-i18n-toolsには独自の文字列抽出機能が含まれています。`i18next-scanner`、`babel-plugin-i18next-extract`などを使用していた場合、移行後にそれらの開発依存関係を削除できます。既存のi18next名前空間JSONファイルは、[JSONパイプライン](/ja/guide/json#i18next-namespace-files)に残すことができます。Intlayerの`.content.ts`辞書は`migrate-intlayer`でインポートできます。[Intlayerからの移行](/ja/guide/migrating-from-intlayer)を参照してください。実行時にIntlayerを維持し、その翻訳のみを埋めるには、`translate-intlayer`を使用します。[Intlayerをその場で翻訳する](/ja/guide/translating-intlayer)を参照してください。

<a id="step-3-wrap-strings"></a>
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
| リポジトリのREADMEまたはその他のMarkdownファイル | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |
