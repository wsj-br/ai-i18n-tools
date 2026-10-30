<a id="add-i18n-to-a-python-app"></a>
# Pythonアプリへのi18nの追加

このページでは、単一言語のPythonアプリケーションにai-i18n-toolsを使ってロケールを追加します。これは、`ui-python`テンプレート、小さな`i18n.py`ヘルパー、および翻訳のJSONファイルという1つのパスに従います。このパスは、Streamlit、FastAPI、Flask、デスクトップアプリ、スクリプトに適しています。

最も手っ取り早い方法は、このページのプロンプトをコーディングエージェントに与えることです。それは設定を行い、文字列をラップし、結果をチェックし、言語メニューを追加できます。CLIをインストールし、プロバイダーを選択し、プロジェクトを自分で初期化します。これはAPIキーと選択が必要なためです。また、翻訳も自分で実行します。これはあなたのアカウントで費用が発生するためです。

Django、Flask-Babelカタログ、またはGNU gettextを使用しており、それらの呼び出しを維持したいですか？代わりに[Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext)を使用してください。これは`gettext`を保持し、ヘルパーなしで`.po`および`.mo`ファイルを書き込みます。どちらが適用されるかわからない場合は、最後に[あなたのケースではありませんか？](#not-your-case)を参照してください。

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

マシンにすでにNode.js `>=22.16.0`がある場合は、npmパッケージを使用します（[インストール](/ja/guide/installation)）。Pythonプロジェクトの場合は、スタンドアロン実行可能ファイル（Node.jsなし）をインストールします。

LinuxおよびmacOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

インストーラーは `SHA256SUMS.txt` をチェックし、コマンドを `ai-i18n-tools` としてインストールし、`PATH` に追加します。バイナリは公証されておらず、Authenticode 署名もされていません。手動の手順とアセット名：[スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables)。

インストールを確認します:

```bash
ai-i18n-tools --version
```

次に、プロバイダーを選択し、翻訳を実行するシェルでその API キーを設定します。例：Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollamaはキーを必要としません。その他のプリセット: [組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)。プロバイダー名をメモしておいてください。次のステップで`init`に渡すためです。エージェントはキーを必要としません。モデル呼び出しを行わないコマンドのみを実行するためです。キーは後で[翻訳する](#choose-models-and-translate)ときに使用します。

<a id="initialise-the-project"></a>
## プロジェクトの初期化

プロンプトの前に、これを一度実行します。これは設定と`i18n.py`ヘルパーを書き込み、上で選択したプロバイダーを使用します。

このページでは、1つのテンプレート`ui-python`を使用します。これは設定、`i18n.py`ヘルパー、およびJSONカタログを書き込みます。これは以下のアプリに適しています。

| あなたのアプリ | 注意事項 |
| --- | --- |
| Streamlit | 言語メニューにはアプリに数行のコードが必要です。[言語切り替えを追加する](#step-4-add-a-language-switch)を参照してください。 |
| FastAPI | ロケールはリクエストごとに設定されます |
| Flask | フラットなJSONカタログ。`translations/`内のFlask-Babelカタログについては、[gettextページ](/ja/guide/add-i18n-to-django-gettext)を使用してください。 |
| Pyramid | Flaskと同じ配線 |
| デスクトップアプリ (Tkinter, PyQt, PySide) | ロケール変更後に表示テキストを再構築します |
| PyWebView | テンプレートはPythonシェルをカバーします。そのHTMLページは別途翻訳してください |
| コマンドラインツールとスクリプト | 最も単純なケース |

選択したプロバイダーでinitを実行します（この例ではCheaper Inference）：

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

次に、`ai-i18n-tools.config.json`で`sourceLocale`と`targetLocales`を編集します。`sourceLocale`はソース内の文字列の言語です。任意のBCP-47言語が有効です。例ではよく`en`が使用されます。

`init`を一度実行します。これは毎回`ai-i18n-tools.config.json`を書き換えるため、2回目の実行では行った編集が失われます。もし`i18n.py`にすでにマーカー`ai-i18n-tools-i18n-py`が含まれている場合、プロジェクトはすでに初期化されています。このステップはスキップしてください。

`init`は`ui.sourceRoots`を`"."`に設定するため、`extract`はリポジトリ全体（テスト、スクリプト、ドキュメント）をスキャンします。プロンプトはそれをアプリケーションコードに絞り込みます（手動で、つまり[ステップ1](#place-the-helper)です）。

フレームワークの配線：[Python統合](/ja/guide/integrations/python)。呼び出し形式とカタログレイアウト：[Pythonアプリケーション](/ja/guide/ui-strings/python)。

<a id="run-the-agent-prompt"></a>
## エージェントプロンプトを実行する

コーディングエージェント（Cursor、Claude Code、Copilotなど）でプロジェクトを開き、新しいチャットを開始して、以下のプロンプトを貼り付けます。プロジェクトはすでに初期化されている必要があります。編集するものは何もありません。言語メニューをなくすなど、何か除外したいものがある場合は、同じメッセージで伝えてください。

エージェントはまず、CLI、設定、および`i18n.py`が存在することを確認し、いずれかが欠けている場合は指示を出して停止します。その後、3つのパートで動作します。

- パート1では、`i18n.py`と`locales/`をリポジトリがコードを保持する場所に配置し、設定をそれらに向けます。
- パート2では、ユーザー向けの文字列を`t()`と`_()`でラップし、`extract`を実行し、ラップされた呼び出しを`migrate-python-i18n`でチェックします。
- パート3では、言語メニュー、またはCLI言語オプションと環境ロケールを追加します。

何もインストールしたり初期化したりせず、APIキーを読み取ったり、翻訳したりすることもありません。翻訳はレビュー後のステップであり、ユーザーが実行します。

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## 結果をレビューする

エージェントはレポートで終了します。翻訳する前に確認してください。

- 差分。ラップされたテキストは、無関係な再フォーマットなしで、以前と同じように読めるはずです。`git diff --stat`は変更量を示します。
- レポート内のスキップされた文字列と曖昧なケース：複数形が1つの文字列として残されているもの、1つの単語が保存値とキャプションとして使用されているもの、翻訳された断片から構築された文。これらは手動で決定してください。
- `ai-i18n-tools extract`はクリーンに実行され、`strings.json`は期待するフォルダーにあります。
- テストがパスし、アプリがソース言語で同じように表示されます。
- 一時的なスクリプトや`migrate-python-i18n-report.md`が残されていないこと。

エージェントが見落とした文字列は、後でソース言語のままのテキストとして表示されます。[ステップ2](#wrap-strings)には、ラップされていないテキストを出力するオプションのスクリプトがあります。

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

この部分はユーザーが実行します。これはユーザーのAPIキーを使用し、アカウントに費用が発生します。

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply`は`translationModels`のみを置き換えます。出力価格が制限を超えるモデルを除外するには、`--max-output-price`を使用します。GUIを好む場合は、`ai-i18n-tools dashboard`を使用して[モデル](/ja/guide/translation-dashboard/models)を選択します。

その後、抽出して翻訳します。

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract`は`strings.json`と`ui-languages.json`を書き込みます。`translate-ui`はターゲット言語ごとに1つのJSONファイルを書き込みます。これらの生成されたファイルは編集しないでください。

`t()`はロケールJSONでソース文を検索します。`strings.json`内のIDは検索キーではありません。ファイルが見つからないか、キーが見つからない場合は、ソース文が返されます。ヘルパーは、プロセス中にロードされたJSONをメモリに保持します。これには、最初の検索時にファイルが見つからなかった場合の空のマップも含まれるため、`translate-ui`の後にアプリを再起動してください。

<a id="check-one-language"></a>
### 1つの言語を確認する

アプリを再起動し、いずれかのターゲット言語に切り替えて、いくつかのラップされた文字列を含むページを開きます。エージェントが追加した言語メニューを使用するか、手動でロケールを設定します。ソース言語のままのテキストは、ラップされていないか、インポート時に実行されるか、`locales/<code>.json`にエントリがありません。コードを疑う前に、JSONでその文を確認してください。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソーステキストを変更した後、`ai-i18n-tools sync`（または`extract`、次に`translate-ui`）を再実行します。キャッシュにより、新規または変更された文字列のみがモデルに送られます。翻訳がずれないようにCIで実行します。翻訳実行後にアプリを再起動してJSONを再ロードします。`ai-i18n-tools dashboard`は[翻訳ダッシュボード](/ja/guide/translation-dashboard/)を開いて翻訳をレビューします。

同じ実行で`README.md`を翻訳するには、`--with-readme`でスキャフォールドします（または既存の設定にブロックを追加します）。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="do-it-by-hand"></a>
## 手動で実行する

変更を自分で加えたい場合、またはプロンプトが何をするのか知りたい場合は、これらの手順を実行してください。各ステップはプロンプトの一部に対応しています。最終的には、[CLIをインストール](#install-and-choose-a-provider)し、[プロジェクトを初期化](#initialise-the-project)し、[翻訳](#choose-models-and-translate)します。

1. このリポジトリがコードを保持する場所に[ヘルパーとカタログを配置](#place-the-helper)します。
2. `t()`または`_()`で[文字列をラップ](#wrap-strings)します。
3. `migrate-python-i18n`で[ラップされた呼び出しをチェック](#step-3-check-wrapped-calls)します。
4. [言語切り替えを追加](#step-4-add-a-language-switch)します。

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## ステップ1: ヘルパーとカタログを配置する

`init`はこれらをリポジトリのルートに書き込みます。

| ファイル | 内容 | 編集するか？ |
| --- | --- | --- |
| `i18n.py` | コードがインポートするヘルパー (`t`, `_`, `set_locale`) | いいえ。生成されます |
| `locales/strings.json` | 抽出キャッシュ。アプリはこれを読み込みません | いいえ。エクストラクターによって生成されます |
| `locales/<code>.json` | アプリがロードする翻訳。言語ごとに1ファイル | いいえ。`translate-ui`が書き込みます |
| `locales/ui-languages.json` | 言語メニュー用の言語リスト | いいえ。それはエクストラクターによって生成されます |

`i18n.py` は、それが置かれているフォルダーから `locales/` をロードします。ヘルパーと `locales/` フォルダーを一緒に移動し、`i18n.py` 内のパスは変更しないでください。

| あなたのリポジトリ | 配置場所 |
| --- | --- |
| リポジトリのルートにある1つのスクリプト | `init` が書き込んだ場所に `i18n.py` と `locales/` を残してください |
| `src/` レイアウトを含むパッケージ | 両方をパッケージ内に、それらをインポートするコードの隣に移動します |

例: `src/mypkg/` の下のインストール可能なパッケージ `mypkg` は、`src/mypkg/i18n.py` と `src/mypkg/locales/` を保持します。

設定を新しい場所に更新します:

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` は `extract` がスキャンするフォルダーです。テストとデータファイルがカタログから除外されるように、アプリケーションパッケージ上に保持してください。言語リストパス `languagesManifestPath` は、設定されていない場合、`flatOutputDir` に従います。設定がすでにそれを設定している場合は、一致するように変更してください。

選択したモジュールパスから `t` をインポートします: リポジトリのルートにある `from i18n import t`、またはパッケージ内の `from mypkg.i18n import t`。

アプリがインストールされるか、コンテナで出荷される場合、ロケールJSONはパッケージと一緒に移動する必要があります。パッケージデータに追加します（パターンはパッケージディレクトリからの相対パスです）:

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

`ai-i18n-tools extract` で確認します。カタログは新しい `locales/` フォルダーに表示されるはずです。

<a id="step-2-wrap-strings"></a>
## ステップ2: 文字列をラップする

`extract` は、`t()` または `_()` に渡されるリテラルである場合にのみ文字列を記録します。生成されたモジュールからそれらをインポートします。

まずカタログエントリを検索し、次に補間します:

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

これらは検索の前に書式設定を実行するため、エクストラクターはそれらを安全でないとマークします。[次のステップ](#step-3-check-wrapped-calls) でそれらを見つけます:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

人が目にするテキストをラップします: ウィジェットラベル、ページタイトル、キャプション、UIに表示されるエラー、進行状況行、検証メッセージ、およびいくつかの数字を含む段落。補間された数字を含む段落も、依然として1つの `t()` 呼び出しです。プレースホルダーは `{name}`、`{price:,.2f}`、または `{rate:.2%}` のような名前です。`rate=row.rate` を渡します。`{row.rate:.2%}` のようなプレースホルダーは拒否されます。

ソースの文言はそのままにしておきます。翻訳がない場合、その文が返されるため、アプリはソース言語のままになります。

プログラムが照合またはログに記録するテキストはスキップします: SQL、正規表現、ファイルヘッダー、ロガー行、CSS、ウィジェットキー、列挙型コード、およびモデルに送信するプロンプト。値が保存され、かつ表示される場合（オプションがコードでも比較される選択ボックスなど）、保存された値はソース言語のままにし、ラベルを `format_func` で翻訳します。

`t()` はインポート時に一度実行され、そのモジュールが再度インポートされるまでソース言語を保持します。ウィジェットが構築されるときに `t()` を呼び出します。

<a id="find-unwrapped-strings"></a>

パスごとに作業します: `t()` または `_()` の引数ではないリテラルをリストアップし、ユーザー向けのものをラップし、再度リストアップします。以下のスクリプトはオプションです。これは、f-string や `+` で結合されたテキストを含む候補を出力します。ドキュメント文字列、SQL、およびスペースのないテキストはスキップされるため、`Overview` のような短いラベルでも確認が必要です。完了したら削除してください。ファイルを書き換えるスクリプトはドラフトです: 既存の空白行を保持し、新しいインポートをプロジェクトの他のインポートと一緒に配置し、プロジェクトのフォーマッターを実行し、保持する前に差分を確認してください。

<details>
<summary>オプション: ラップされていない文字列をリストアップ</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## ステップ3: ラップされた呼び出しを確認する

コードにカタログルックアップの前に文字列をフォーマットする呼び出しが含まれている場合、このステップを使用します。これは、古いラッピングやエージェントスリップに典型的なものです。

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` は、それらを最初に発生するルックアップに書き換えます。2回目の実行では何も変更されません。

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

`st.write(f"Hello, {name}!")` のようなベア文字列はそのまま残ります。それらをラップするには、[文字列をラップする](#wrap-strings) を参照してください。`extract` がクリーンで、コードに上記の3つの形式のいずれも含まれていない場合、書き換えるものはありません。

`extract` の後、`translate-ui` の前に実行します。これにより、カタログがf-stringをキーとして保存することはありません。

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

`--write` を渡すまでは、このコマンドはドライランです。`migrate-python-i18n-report.md` を書き込みます。そのレポートを読んでください。編集が正しいように見える場合:

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

ドライランを再度実行します。編集がリストされなくなったら停止し、プロジェクトのテストを実行します。

コマンドがそのまま残す行（`{value=}` のようなデバッグフィールド、ネストされたフォーマット指定子など）はレポートにリストされます。それらを手動で修正し、ドライランを再度実行します。生成された `i18n.py` はスキップされます。レポートはビルド成果物です。削除するか、git-ignoreしてください。

編集がないレポートは、ラップされた呼び出しが安全であることを意味します。これは、すべてのユーザー向け文がラップされたことを意味するものではありません。その確認には、[ラップされていないリテラルリスト](#find-unwrapped-strings) を使用します。

オプションの `--report <path>` はレポートパスを変更します。オプションの `--ui-block` はスキャンを1つのUIブロックに制限します。

<a id="step-4-add-a-language-switch"></a>
## ステップ4: 言語切り替えを追加する

すべてのフレームワークには、次の4つの同じものが必要です。

1. 各リクエスト、スクリプト実行、またはウィンドウイベントの開始時にロケールを選択し、最初の `t()` の前に `set_locale` を呼び出します。
2. `ui-languages.json` (`get_ui_languages()`) にリストされている言語のみを受け入れ、それらを緩やかに一致させます。ブラウザは `pt-br` を送信しますが、カタログは `pt-BR` です。
3. `get_ui_languages()` から構築されたセレクターを提供します。
4. 選択を記憶します。

`?lang=pt-BR` を開いても、アプリがそれを読み取るまでは何も行われません。[エージェントプロンプト](#run-the-agent-prompt) は、ユーザーインターフェースを持つアプリに対してこれらすべてを行い、フレームワークを自動的に解決します。以下のセクションでは、Streamlit、FastAPI、Flask、およびTkinterの結果を示します。他のフレームワークも同じルールに従います。

<a id="streamlit"></a>
### Streamlit

Streamlitスクリプトはすべてのインタラクションで再実行されるため、ロケールは実行ごとにスクリプトの先頭で選択されます。順序:

1. 前回の実行からのセレクター値、次に `?lang=`、次に保存されたロケールを読み取ります。
2. そのコードで `set_locale` を、`st.set_page_config` の前に呼び出します。
3. `st.set_page_config(page_title=t("…"))` を呼び出します。
4. セレクターを描画します。変更時に、コードを保存し、`?lang=` を設定し、`st.rerun()` を実行します。

ユーザーが選択すると、セレクター値が優先されます。`?lang=` は、その値が存在する前の新規訪問時に適用されます。メニューは `i18n.py` ではなくアプリ内に存在するため、そのラベルは `t("Language")` になります。サインインページを含め、切り替える必要のあるすべての画面に表示します。

<details>
<summary>ウィジェットコード</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

`from i18n import …` を、[ヘルパーとカタログを配置する](#place-the-helper) からのパッケージパスに変更します。他のすべてのウィジェットに固定の `key` を与え、ウィジェットが構築されたときに `t()` を呼び出します。インポート時に計算されたラベルは、切り替え後もソース言語のままになります。後でページタイトルが比較される場合、両側を `nav.title != t("Forecast settings")` でラップします。なぜなら `nav.title` はすでに翻訳されているからです。

`i18n.py` からの `streamlit_language_selector()` は、タイトルがプレーンな文字列である短いスクリプトには十分です。ウィジェットが描画されるときに `set_locale` を呼び出すため、その上の翻訳された `page_title` はその実行では以前の言語のままであり、そのラベルは英語のままになります。`examples/python-streamlit` を参照してください。

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI、Flask、Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### リクエストのロケールを選択する

ウェブアプリは、言語のソースとして、以下の3つをこの順序で参照します。訪問者の明示的な選択 (`?lang=`)、その選択を記憶するクッキー、そしてブラウザの `Accept-Language` ヘッダーです。ソース言語がフォールバックとなります。

`set_locale` は、与えられた値を検証したり正規化したりしません。`pt-br` または `pt` を送信するブラウザは、カタログファイルが `pt-BR.json` であるため、黙ってソース言語を受け取ります。以下のモジュールは、マッチングを行い、`ui-languages.json` にないコードを無視します。これを `i18n.py` の隣に保存し、ミドルウェアまたはフックからインポートしてください (`i18n.py` がパッケージ内にある場合は、パッケージパスを使用します)。

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

HTTPミドルウェアでロケールを選択します。`set_locale` からトークンを保持し、`finally` でリセットすることで、同時リクエストがそれぞれの言語を維持できるようにします。ミドルウェアは、`?lang=` が存在する場合にクッキーも保存し、キャッシュが言語ごとに1つのコピーを保持するように `Content-Language` と `Vary` を送信します。ルートは通常通り `t()` と `_()` を呼び出します。HTMLページの場合、ヘルパーをテンプレート環境に一度追加します。

<details>
<summary>FastAPIミドルウェアとテンプレート</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

JSONのみを返すAPIにはメニューは不要です。クライアントは `Accept-Language` または `?lang=` を送信します。ミドルウェアが戻った後に構築されるテキスト（バックグラウンドタスク内やストリーミング応答の送信中など）は、リセット後に実行される可能性があります。応答を返す前に構築してください。

<a id="flask"></a>
#### Flask

Flaskは各ジョブにフックを持っています。`before_request` はロケールを選択し、トークンを保持します。`after_request` はクッキーを保存します。`teardown_request` はロケールをリセットします。そして、コンテキストプロセッサはテンプレートに `t`、`_`、`get_locale`、`get_ui_languages`、および `get_direction` を提供します。Pyramidは `NewRequest` サブスクライバーと同じ形式を使用します。

<details>
<summary>Flaskフック</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### テンプレート内の言語メニュー

FastAPIの `Jinja2Templates` と Flask は両方ともこれをレンダリングします。`?lang=` を持つリンクはページを保持し、クッキーを設定するため、その選択は以降のページでも維持されます。`dir` 属性は、右から左に記述する言語のために `get_direction()` を使用します。

<details>
<summary>テンプレート</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinterはウィジェットを一度作成するため、言語変更時にはそれらを更新する必要があります。各表示テキストを、リテラルを内部に持つ `t("…")` を呼び出す関数として記述し、その関数でウィジェットを登録し、そして `set_locale` の後に `refresh()` を呼び出します。`extract` は依然としてすべてのリテラルを認識します。選択されたコードをアプリの設定ファイルに保存し、ウィンドウが構築される前にそれを使って `set_locale` を呼び出します。

<details>
<summary>言語メニュー付きのTkinterウィンドウ</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

新しいスレッドは、ウィンドウの言語ではなく、ソース言語で開始されます。メインスレッドで翻訳するか、スレッド関数の開始時に `set_locale` を呼び出してください。他のツールキットも同じ要素を必要とします。すべての表示テキストを設定する関数と、`set_locale` を呼び出し、その後その関数を呼び出すメニューハンドラーです。PyQtとPySideには独自の再翻訳フックがあります。 [Locale in each framework](/ja/guide/ui-strings/python#locale-in-each-framework) を参照してください。

これが最後の手動ステップです。[モデルを選択して翻訳する](#choose-models-and-translate)に進んでください。

<a id="not-your-case"></a>
## 当てはまりませんか？

| 対象 | 参照 |
| --- | --- |
| Django、Flask-Babel カタログ、またはすでにGNU gettextを使用しているアプリ | [Django / Python gettext アプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext) |
| JS/TS アプリ | [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js) |
| ウェブサイトまたはドキュメントサイト | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website) |
| リポジトリのREADMEまたはその他のMarkdownファイル | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |
| ネストされたロケールJSON | [JSON](/ja/guide/json) |

<a id="examples"></a>
## 例

| 例 | 内容 |
| --- | --- |
| [python-streamlit](/ja/examples#python-streamlit) | ダッシュボード、`t()` / `_()`、フラット JSON |
| [python-fastapi](/ja/examples#python-fastapi) | リクエストスコープのロケール、フラット JSON |
| [python-flask](/ja/examples#python-flask) | Flask + Jinja、フラット JSON |

`npx degit` を使用してコピーするか、GitHubリリースから `ai-i18n-tools-python-examples.zip` をダウンロードしてください。コマンドについては、[例](/ja/examples#python-examples) を参照してください。gettextを使用するアプリの場合は、[gettextの例](/ja/examples#python-gettext) を参照してください。
