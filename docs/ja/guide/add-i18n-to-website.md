<a id="add-i18n-to-a-website-or-docs-site"></a>
# ウェブサイトまたはドキュメントサイトにi18nを追加する

このページでは、単一言語のドキュメントサイト (Markdown または MDX)、またはマーケティングサイトや静的サイト (Astro ウェブサイトまたはプレーン HTML) を対象に、ai-i18n-tools を使用してロケールを追加する方法を説明します。このツールは、LLM プロバイダーのモデルを使用してページコンテンツを翻訳し、言語ごとにローカライズされたコピーを1つ書き込みます。サイトフレームワークは、それらのコピーを提供し、言語スイッチャーを用意します。

最も手早い方法は、このページのプロンプトをコーディングエージェントに与えることです。これにより、そのフレームワークの i18n が有効になり、設定がチェックされます。CLI のインストール、プロバイダーの選択、プロジェクトの初期化は、API キーとあなたの選択が必要なため、自分で行います。翻訳も、あなたのアカウントで費用が発生するため、自分自身で実行します。

UI 文字列が `t()` 呼び出し内にあるアプリの場合は、[JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js) または [Python アプリに i18n を追加する](/ja/guide/add-i18n-to-python) を使用してください。サイトフレームワークのないリポジトリの README の場合は、[README と Markdown ドキュメントに i18n を追加する](/ja/guide/add-i18n-to-readme) を使用します。どれが当てはまるかわからない場合は、最後の [該当しない場合](#not-your-case) を参照してください。

<a id="steps"></a>

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

パッケージを dev 依存関係としてインストールします。VitePress の設定では `ai-i18n-tools` から `prefixVitepressThemeConfigLinks` をインポートし、プレーン HTML ページではパッケージから `i18n.js` をコピーします。スタンドアロンの実行可能ファイルで十分なのは、サイトが `ai-i18n-tools/runtime` をインポートせず、設定からパッケージをインポートしない場合に限られます。その他のインストールオプションについては、[インストール](/ja/guide/installation) を参照してください。

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

これはプロンプトの前に一度だけ実行します。これにより `ai-i18n-tools.config.json` が書き込まれ、上で選択したプロバイダーが使用されます。既存のサイトで i18n を有効にすることはありません。それはプロンプトの役割です。

| あなたのサイト | Init テンプレート | 詳細ガイド |
| --- | --- | --- |
| Astro Starlight | `ui-starlight` | [Astro](/ja/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/ja/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/ja/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/ja/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/ja/guide/integrations/fumadocs) |
| プレーンな Astro ウェブサイト | `ui-astro-website` | [Astro](/ja/guide/integrations/astro#plain-astro-marketing-and-app-sites) |
| ブラウザで言語を切り替える単一の HTML ファイル | `ui-plain-html` | [プレーン HTML アプリ](/ja/guide/ui-strings/plain-html) |
| ロケールごとに1つの翻訳済み HTML ファイル | `docs-plain-html` | [HTML ページ](/ja/guide/documents/html-pages) |
| サイトフレームワークなし、READMEとMarkdownファイルのみ | `docs-markdown`、または任意のテンプレートと`--with-readme` | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |

```bash
ai-i18n-tools init -t ui-vitepress -P openrouter
```

`ui-vitepress` を表のテンプレートに置き換えます。次に、`sourceLocale`、`targetLocales`、`docs[].contentPaths` を編集します。`sourceLocale` はページの言語です。どの BCP-47 言語も有効です。`contentPaths` は、その言語で書かれたページとフォルダーでなければなりません。テンプレート内のパスはたたき台です。`docsOutput.style` はテンプレート用にすでに設定されています。`ui-astro-website` と `ui-plain-html` は `ui` ブロックと空の `docs` 配列を書き込みます。プレーンな Astro サイトでページの HTML を翻訳する場合、プロンプトはページ HTML の `docs` ブロックを追加します。

`init`を一度実行します。これは毎回`ai-i18n-tools.config.json`を上書きするため、2回目を実行すると行った編集が失われます。

<a id="run-the-agent-prompt"></a>
## エージェントプロンプトを実行する

コーディングエージェント (Cursor、Claude Code、Copilot など) でプロジェクトを開き、新しいチャットを開始して、以下のプロンプトを貼り付けます。プロジェクトはすでに初期化されている必要があります。編集するものは何もありません。フレームワークの詳細を省略したい場合は、同じメッセージでその旨を伝えてください。

エージェントはまず CLI と設定が存在することを確認し、どちらかが見つからない場合は指示を出して停止します。次に、フレームワークを検出し、そのフレームワークのロケールルーティングを有効にします。CLI のインストール、設定の初期化、API キーの読み取り、翻訳は行いません。翻訳はレビュー後のステップであり、あなたが実行します。

````markdown
# Enable i18n on this website or docs site

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs (or
`pnpm exec ai-i18n-tools --version` when the binary is only in
`node_modules/.bin`) and that
`ai-i18n-tools.config.json` exists. If either is missing, stop now and tell
the user to install ai-i18n-tools as a dev dependency and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-vitepress`, `ui-docusaurus`, `ui-starlight`, `ui-nextra`,
`ui-fumadocs`, `ui-astro-website`, `ui-plain-html`, or `docs-plain-html`.
Do not install or initialise anything yourself.

`ui-plain-html` and `ui-astro-website` are valid when `docs` is empty. Every
other template needs one `docs` entry. If that entry is missing, stop and name
the init command.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `sync`, `translate-docs`, `translate-ui`, or `suggest-models`.
  They call the translation API and cost money. The user runs them after
  reviewing your work.
- Do not translate, reword, or rename source pages, nav labels, or dictionary
  strings. Do not edit generated locale trees (`docs/<locale>/`,
  `i18n/<locale>/` other than the source catalog from `write-translations`,
  `theme.<locale>.json`, `content/<locale>/`, locale MDX, or locale HTML).
- Do not reformat unrelated code. Leave unrelated edits in a dirty tree alone.
- Apply one branch. If the framework is unclear, stop and ask.

Detect the branch from `docsOutput.style`, then from the config file and
`package.json`: `vitepress`, `docusaurus`, `nextra`, `fumadocs`,
`astro-starlight` with pages under `src/content/docs` (Starlight), `nested`
with HTML `contentPaths` (`docs-plain-html`), a `ui` block whose extractor
extensions include `.html` (`ui-plain-html`), or an Astro site that is not
Starlight (`ui-astro-website`).

Point `contentPaths` and `docsRoot` at the source-language pages that exist
in this repository. The paths written by `init` are starters.

## VitePress

- In `.vitepress/config`, set `locales.root` for the source locale (`label`,
  `lang`, and the existing `themeConfig`). Add one `locales[code]` per
  `targetLocales` entry: `label`, `lang`, `link: '/<code>/'`, and per-locale
  `title` / `description`. Keep `targetLocales` equal to those keys.
- Author nav and sidebar links once, without a locale prefix. Prefix `link`
  and `activeMatch` per locale with `prefixVitepressThemeConfigLinks` from
  `ai-i18n-tools`. `translate-docs` does not rewrite links inside the config.
- Leave `docsOutput.vitepressThemeCatalog` as `init` wrote it. If the config
  already loads `theme.en.json`, keep that loader and add `locales[code]` the
  same way. If theme strings are still inline, leave them inline. Do not
  create `theme.en.json` or `theme.<locale>.json` yourself, and do not load a
  theme file that is not on disk. The first `sync` bootstraps a missing
  catalog.
- `docsOutput.style` is `vitepress`. `outputDir` is the docs root.

## Docusaurus

- Add the `i18n` block in `docusaurus.config.js`: `defaultLocale`, `locales`
  (source plus each target), and `localeConfigs[locale].path` when the URL
  path differs from the locale code. The path must match the folder under
  `i18n/`.
- Point `docusaurusCatalogDir` at `i18n/<defaultLocale>`. `docsOutput.style`
  is `docusaurus`. `contentPaths` and `docsRoot` are the source docs folder.
  `outputDir` is the parent of the locale folders.
- Run this project's `docusaurus write-translations` so
  `i18n/<defaultLocale>/` exists. That command does not call a model. Do not
  run `sync` or `translate-docs`.
- Custom React in `src/pages` and `src/components` is not markdown. Mark
  user-facing copy with `<Translate>` or `translate()` from
  `@docusaurus/Translate`. The message has to be a static string. Do not wrap
  those calls in `t()`.

## Nextra

- Move source MDX to `content/<sourceLocale>/` (usually `content/en/`). The
  source locale is a folder, not the content root. Leave `_meta.ts` beside
  the pages it labels.
- Set `i18n.locales` and `defaultLocale` in `next.config`. `targetLocales`
  matches `i18n.locales` except the default locale.
- Add an `app/[lang]/` route, `getPageMap('/' + lang)`, and `<Layout i18n>`.
- Add `app/_dictionaries/<source>.ts` (usually `en.ts`) with the English
  chrome as string literals (`siteTitle`, footer, `editLink`, search
  placeholder, table-of-contents title, last-updated label), and
  `get-dictionary.ts` that imports `./${locale}`. Pass those fields into
  `<Layout>`, `<Navbar>`, and `<Footer>`. Keep native language names in a
  labels map, untranslated.
- Config: `features.translateDocs`, `docsOutput.style` `nextra`, `docsRoot`
  `content/<sourceLocale>`, `nextraDictionaryPath` the source dictionary.
- Optional: `proxy.ts` that re-exports `nextra/locales`.
- Do not write `app/_dictionaries/pt-BR.ts`, `content/pt-BR/`, or any other
  locale tree.

## Fumadocs

- `defineI18n` in `lib/i18n.ts` with `languages`, `defaultLanguage`, and
  `parser: "dot"` or `"dir"`. Use `"dot"` unless the source pages already live
  under a locale folder. Set `docsOutput.fumadocsParser` to the same value.
- Add `app/[lang]/` routes. Export `createI18nMiddleware(i18n)` from
  `proxy.ts`.
- Dot: source MDX stays at the collection root (`content/docs/`). Dir: source
  MDX lives under `content/docs/<sourceLocale>/`. Point `contentPaths` and
  `docsRoot` at that source tree. `docsOutput.style` is `fumadocs`.
- `targetLocales` equals `languages` minus the default language, character
  for character.
- Leave English UI overrides as they are. Do not write `ui.<locale>.json` or
  translated MDX. Do not put this catalog in `json[]`.

## Astro Starlight

- In the Starlight config, set `locales`, including a `root` entry when the
  source language should be unprefixed (`label` and required `lang`). Set
  `defaultLocale: 'root'` when that root entry is the source language.
- Source pages stay in `src/content/docs/`. `translate-docs` writes
  `src/content/docs/<locale>/`. Point `contentPaths` at the source pages, not
  at locale folders. `outputDir` and `docsRoot` are `src/content/docs`.
  `docsOutput.style` is `astro-starlight`.
- Align `targetLocales` with the non-root locale keys. Starlight directory
  keys are often lowercase (`pt-br`). If you change case to match, say so in
  the report.
- Prefer sidebar `slug` entries so the label comes from the page title. Do
  not hand-translate sidebar `label` maps or `social[].label`. There is no
  shell catalog to add.

## Plain Astro

- Enable Astro i18n routing: `i18n.locales` includes the source locale and
  each target. Astro route codes are lowercase (`pt-br`). In the report, list
  `targetLocales`, `i18n.locales`, and the note that flat JSON filenames use
  the casing in `targetLocales`.
- `init -t ui-astro-website` leaves `docs` empty and turns on UI strings. When
  page HTML should be translated, set `features.translateDocs` to true and
  append one `docs` entry: `contentPaths` the source pages (for example
  `src/pages/index.astro`), `outputDir` `src/pages`, `addFrontmatter` false,
  `docsOutput.style` `astro-starlight`, `docsRoot` `src/pages`. Leave
  `features.translateUIStrings` as it is.
- If frontmatter or shared data calls `t()`, stop that part and tell the user
  to run the JS/TS prompt and skip i18next. Astro resolves `t` at build time.
  Do not wrap those calls here, and do not install i18next.

## Plain HTML

Each file belongs to only one pipeline. If the same file is both a `docs[]` source and
under `ui.sourceRoots`, stop and ask.

`ui-plain-html` (one page, language switches in the browser):

- Run `ai-i18n-tools mark-html` with no `--write`, read the report, then
  run it again with `--write`. It inserts `data-i18n` markers. It does not
  call a model.
- Copy `node_modules/ai-i18n-tools/dist/html-runtime/i18n.js` next to the page.
  Load it at the end of `<body>` with `data-source-locale` equal to
  `sourceLocale`, `data-locales-base` pointing at `flatOutputDir` as a URL
  relative to the script, and `data-locale-select` pointing at an empty
  `<select>`. Do not add a `docs` block for the same file.

`docs-plain-html` (one HTML file per locale):

- Confirm `contentPaths`, `outputDir`, and `docsRoot`. `docsOutput.style` is
  `nested`. Do not add `data-i18n` markers. Do not fill a language list by
  hand. `translate-docs` writes the locale files and the list.

## Verify and report

The framework's locale config matches `targetLocales`. `contentPaths` point
at source-language pages. No generated locale tree was edited. Run the
project's build or typecheck when it has one, and do not run a translation.

Report the branch you applied, the files changed, and any page you left out
of `contentPaths`, with a one-line reason. Then list the commands for the
user, and do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools sync`, then build the site and open one localised route.
````

<a id="review-the-result"></a>
## 結果をレビューする

エージェントはレポートで終了します。翻訳する前に確認してください。

- 差分。フレームワークのロケール設定、`contentPaths`、およびブランチが記述するルーティングである必要があります。ソースページの文章は以前と同じように読めるはずです。`git diff --stat` は変更量を示します。
- `targetLocales` が、フレームワークが提供するロケールキーと一致すること。
- `contentPaths` が、ツールが書き込むことになっているロケールフォルダーではなく、ソース言語のページを指していること。
- 生成されたロケールツリーが編集されていないこと: `docs/<locale>/`、ロケール HTML、`content/<locale>/`、`theme.<locale>.json`、または `write-translations` のソースカタログ以外の Docusaurus `i18n/<locale>/` フォルダー。
- プロジェクトのビルドまたは型チェックが引き続き成功すること。

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

この部分はユーザーが実行します。これはユーザーのAPIキーを使用し、アカウントに費用が発生します。

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`は`translationModels`のみを置き換えます。同じランキングが`ai-i18n-tools dashboard`の[モデル](/ja/guide/translation-dashboard/models)タブにあります。

次に、翻訳してビルドします:

```bash
ai-i18n-tools sync
```

`features.translateDocs` がオンの場合、`sync` は `translate-docs` を実行し、UI 文字列がオンの場合 (`ui-plain-html`、および `t()` も使用するプレーンな Astro サイト) は `extract` と `translate-ui` を実行します。`ai-i18n-tools translate-docs` はドキュメントステップを単独で実行します。

<a id="what-gets-translated"></a>
### 何が翻訳されるか

ページ本文は[ドキュメント](/ja/guide/documents/)パイプラインを通過します。フレームワークのクローム（ナビゲーション、サイドバー、テーマラベル）は、フレームワークがサポートしている場合、同じ実行で処理されます。これは個別の[JSON](/ja/guide/json)パイプラインではありません。ブラウザで言語を切り替えるプレーンなHTMLページは例外です。`mark-html`と`translate-ui`はフラットなJSONを書き込み、ブラウザスクリプトがそれを適用します。ロケールごとに1つのHTMLファイルはドキュメントパイプラインに残ります。

| フレームワーク | シェルとテーマの文字列 | 方法 |
| --- | --- | --- |
| Docusaurus | `write-translations`カタログ (`{ message, description }`) | `docs[].docusaurusCatalogDir`と`translate-docs` |
| VitePress | テーマ、ナビゲーション、サイドバーのカタログ | `docsOutput.vitepressThemeCatalog`と`translate-docs` |
| Nextra | `_meta.ts`サイドバーラベル | `style: "nextra"`で自動 |
| Nextra | テーマディクショナリ`.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json`サイドバーラベル | `style: "fumadocs"`で自動 |
| Fumadocs | UIのオーバーライドカタログ | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | 多くのロケールに組み込まれたUI文字列 | ページのみ |

画像とスクリーンショットは`translate-docs`によって翻訳されません。ロケール固有のファイルについては、[画像とスクリーンショット](/ja/guide/images-and-screenshots/)を参照してください。

最初の`sync`の後、いくつかのフレームワークでは、コマンドが書き込んだカタログを読み込むために設定が必要です。これらのプロンプトは統合ページにあります：[VitePressテーマカタログ](/ja/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)、[Nextra辞書](/ja/guide/integrations/nextra#agent-prompt-dictionary-and-routes)、[Fumadocs UIカタログ](/ja/guide/integrations/fumadocs#agent-prompt)。

<a id="check-one-language"></a>
### 1つの言語を確認する

サイトをビルドし、ブラウザでローカライズされたルートを1つ開きます。フレームワーク独自のロケールドロップダウンがスイッチャーです。ブラウザで切り替わる1つのHTMLファイルの場合、ランタイムが埋める選択肢を使用します。ロケールごとに1つのHTMLファイルの場合、ロケールフォルダの下にあるファイルを開きます。

まだソース言語のままのテキストは、`contentPaths`から除外されたもの、コードフェンス、URL、見出しアンカー、またはルートが接続されていないものです。まだソース言語のままのVitePressナビゲーションラベルはテーマカタログです。まず`sync`を実行し、文字列がまだ設定にインラインで含まれている場合は[テーマカタログプロンプト](/ja/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)を実行します。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソースページが変更された後、`ai-i18n-tools sync`を再実行します。キャッシュにより、新規または変更されたテキストのみがモデルに送られます。パイプラインが書き込むロケールツリーをコミットします。`ai-i18n-tools dashboard`は翻訳を確認するために[翻訳ダッシュボード](/ja/guide/translation-dashboard/)を開きます。

同じ実行で`README.md`を翻訳するには、`--with-readme`でスキャフォールドします（または既存の設定にブロックを追加します）。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="do-it-by-hand"></a>
## 手動で実行する

自分で変更を行いたい場合、またはプロンプトが何をするのか知りたい場合は、これらの手順を実行してください。最終的には、[CLIをインストール](#install-and-choose-a-provider)し、[プロジェクトを初期化](#initialise-the-project)し、[翻訳](#choose-models-and-translate)します。

1. `contentPaths`と`docsRoot`をソース言語ページに向けます。テンプレートパスは開始点です。
2. フレームワークのロケールルーティングを有効にします。テンプレートに一致するブランチを使用します。統合ページに完全なリファレンスがあります。

フレームワークがカタログから読み取るシェル文字列は、最初の`sync`の後に接続されます。以下の各ブランチは、そのフォローアップにリンクしています。

<a id="vitepress"></a>
### VitePress

`locales.root`とターゲットごとに1つの`locales[code]`を追加し、ナビゲーションとサイドバーのリンクに`prefixVitepressThemeConfigLinks`をプレフィックスとして付けます。インラインのテーマ文字列は最初の`sync`のために残しておきます。チェックリスト：[既存のサイトでi18nを有効にする](/ja/guide/integrations/vitepress#enable-i18n-in-an-existing-site)。`sync`が`theme.<locale>.json`を書き込んだ後、設定にまだ文字列がインラインで含まれている場合は、[テーマカタログプロンプト](/ja/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off)を貼り付けます。

<a id="docusaurus"></a>
### Docusaurus

`i18n`ブロックを追加し、`docusaurusCatalogDir`をソースカタログに向け、`docusaurus write-translations`を実行します。チェックリスト：[既存のサイトでi18nを有効にする](/ja/guide/integrations/docusaurus#enable-i18n-in-an-existing-site)。シェルJSON：[シェル文字列](/ja/guide/integrations/docusaurus#shell-strings-write-translations)。

<a id="nextra"></a>
### Nextra

MDXを`content/<sourceLocale>/`の下に移動し、`app/[lang]/`を追加し、ソース辞書モジュールを追加します。チェックリスト：[既存のサイトでi18nを有効にする](/ja/guide/integrations/nextra#enable-i18n-in-an-existing-site)。[辞書プロンプト](/ja/guide/integrations/nextra#agent-prompt-dictionary-and-routes)は、同じ接続のためのより長いパスです。`t()`が必要なApp React：[ハイブリッドプロンプト](/ja/guide/integrations/nextra#optional-t-for-app-react-hybrid)。

<a id="fumadocs"></a>
### Fumadocs

`defineI18n`、`app/[lang]/`、およびミドルウェアを追加します。`fumadocsParser`を`dot`または`dir`に合わせます。チェックリスト：[既存のサイトでi18nを有効にする](/ja/guide/integrations/fumadocs#enable-i18n-in-an-existing-site)。[UIカタログプロンプト](/ja/guide/integrations/fumadocs#agent-prompt)は、ルートが存在した後に`i18n.translations()`を接続します。

<a id="astro-starlight"></a>
### Astro Starlight

`locales`を追加します。ソース言語にプレフィックスがない場合は`root`を含めます。ページは`src/content/docs/`に残ります。チェックリスト：[既存のサイトでi18nを有効にする](/ja/guide/integrations/astro#enable-i18n-in-an-existing-site)。Starlightは独自のUI文字列を出荷します。`slug`のサイドバーエントリを推奨します。

<a id="plain-astro"></a>
### Plain Astro

Astroの`i18n.locales`をオンにし、ページHTMLを翻訳する必要がある場合は、[Plain Astro](/ja/guide/integrations/astro#plain-astro-marketing-and-app-sites)から`docs`ブロックを追加します。フロントマターの`t()`呼び出しは、i18nextをインストールせずに[JS/TSプロンプト](/ja/guide/add-i18n-to-js#run-the-agent-prompt)を使用します。Astroはビルド時に`t`を解決します。

<a id="plain-html"></a>
### プレーンHTML

2つのオプションがあり、ファイルはいずれか一方に属します。

- ブラウザで言語を切り替える1つのページ: `ui-plain-html`。`ai-i18n-tools mark-html` を実行し（ドライラン後、`--write`）、`i18n.js` をロードします。[プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html) を参照してください。
- ロケールごとに翻訳された1つのHTMLファイル: `docs-plain-html`。[HTMLページ](/ja/guide/documents/html-pages) を参照してください。

これが最後の手動ステップです。[モデルを選択して翻訳する](#choose-models-and-translate)に進んでください。

<a id="not-your-case"></a>
## 当てはまりませんか？

| お持ちのコンテンツ | 参照 |
| --- | --- |
| アプリのUI文字列 | [JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js) または [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python) |
| Django、Flask-Babelカタログ、または既にGNU gettextを使用しているアプリ | [Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext) |
| サイトの隣にあるリポジトリのREADME、またはサイトフレームワークのないMarkdownファイル | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)。`init … --with-readme` はサイトテンプレートの隣にそのブロックを追加します |
| スタンドアロンのネストされたロケールJSON | [JSON](/ja/guide/json) |
| サイトとアプリの文字列を1つの設定で | [パイプラインの結合](/ja/guide/combining-pipelines) |

共有オプションとフレームワークごとの違いに関するリファレンス：[インテグレーション](/ja/guide/integrations/)。

<a id="examples"></a>
## 例

| 例 | 内容 |
| --- | --- |
| [vitepress-docs](/ja/examples#vitepress-docs) | VitePressのページとテーマカタログ |
| [docusaurus-docs](/ja/examples#docusaurus-docs) | DocusaurusのページとシェルJSON |
| [astro-docs](/ja/examples#astro-docs) | Starlightのページ |
| [nextra-docs](/ja/examples#nextra-docs) | Nextra 4のルートと辞書 |
| [fumadocs-docs](/ja/examples#fumadocs-docs) | FumadocsのルートとUIカタログ |
| [astro-website](/ja/examples#astro-website) | Astroのランディングページ、HTMLと`t()` |
| [plain-html](/ja/examples#plain-html) | 1つのHTMLファイル、`data-i18n` マーカー |
| [plain-html-docs](/ja/examples#plain-html-docs) | ロケールごとに1つのHTMLファイル |

`npx degit`を使って1つコピーします。コマンド: [例](/ja/examples#nodejs-examples)。
