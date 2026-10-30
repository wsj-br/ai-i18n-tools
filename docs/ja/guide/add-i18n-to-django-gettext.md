<a id="add-i18n-to-a-django--python-gettext-app"></a>
# Django / Python gettext アプリにi18nを追加する

このページは、GNU gettext を使用して翻訳する、または今後使用する予定の Python アプリケーション向けです。具体的には、Django、Flask-Babel スタイルのカタログを使用する Flask、または `gettext()` を呼び出すあらゆるアプリが対象です。gettext の呼び出しはそのまま維持します。ai-i18n-tools はそれらを読み取り、メッセージを翻訳し、アプリが既にロードしている `.po` およびコンパイル済みの `.mo` ファイルを書き込みます。ヘルパーモジュールは不要です。

最も手軽な方法は、このページのプロンプトをコーディングエージェントに与えることです。これにより、設定が行われ、文字列がラップされ、結果がチェックされ、言語切り替え機能を追加できます。CLI のインストール、プロバイダーの選択、プロジェクトの初期化は、API キーと選択肢が必要なため、ご自身で行ってください。また、翻訳の実行もご自身で行ってください。これは、お客様のアカウントで費用が発生し、`.po` および `.mo` ファイルが上書きされるためです。

現在 gettext を使用していない Streamlit、FastAPI、Flask、デスクトップ、またはスクリプトアプリを構築していますか？代わりに、[Python アプリにi18nを追加する](/ja/guide/add-i18n-to-python) を使用してください。これは小さな `i18n.py` ヘルパーを追加し、JSON カタログを書き込みます。どちらが適用されるかわからない場合は、最後に[該当しない場合](#not-your-case) を参照してください。

フロー：

1. [CLI をインストールし、プロバイダーを選択する](#install-and-choose-a-provider)。
2. `init` を使用して[プロジェクトを初期化する](#initialise-the-project)。
3. [エージェントプロンプトを実行する](#run-the-agent-prompt)。
4. [結果を確認する](#review-the-result)。
5. [モデルを選択して翻訳する](#translate) 後、1つの言語を確認します。
6. [翻訳を維持する](#keep-it-translated)。

ご自身で変更を行いたい場合、またはプロンプトが何をするのか知りたい場合は、[手動で行う](#do-it-by-hand) で同じ手順を1つずつ説明します。

<a id="install-and-choose-a-provider"></a>
## インストールとプロバイダーの選択

この部分はエージェントではなく、ご自身で行います。インストーラーはマシンを変更し、API キーはプロンプトではなくシェルに属する秘密情報です。

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

インストールを確認する：

```bash
ai-i18n-tools --version
```

次に、プロバイダーを選択し、翻訳を実行するシェルでその API キーを設定します。例：Cheaper Inference：

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama はキーを必要としません。その他のプリセット：[組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)。プロバイダー名をメモしておいてください。次のステップで `init` に渡すためです。エージェントはキーを必要としません。モデル呼び出しを行わないコマンドのみを実行します。キーは後で[翻訳する](#translate) 際に使用します。

<a id="initialise-the-project"></a>
## プロジェクトの初期化

これはプロンプトの前に一度だけ実行します。これにより設定が書き込まれ、上記で選択したプロバイダーが使用されます。お使いのアプリに一致するテンプレートを選択してください：

| お使いのアプリ | テンプレート | 書き込まれるカタログ |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` と `.mo` |
| Flask-Babel スタイルのカタログを使用する Flask | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` と `.mo` |
| 既に GNU gettext を使用しているその他の Python アプリ | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` と `.mo` |

選択したテンプレート名とプロバイダーで init を実行します：

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

`init` を一度実行します。これは毎回 `ai-i18n-tools.config.json` を上書きするため、2回目の実行では行った編集が破棄されます。設定が既に存在し、カスタマイズされている場合は、`init` をスキップして設定を編集してください。

`ui-python-gettext` と `ui-python-flask` は、そのファイルがない場合に `i18n.py` ヘルパーも書き込みます。gettext アプリはそれを必要としないため、削除してください（プロンプトがこれを行います）。`ui-python-gettext` は gettext カタログの隣に JSON ファイルも書き込みます。gettext カタログのみを書き込むには、`ui` ブロックで `"flatOutput": false` を設定してください（プロンプトもこれを行います）。Django は独自の翻訳システムを保持しているため、`ui-python-django` はヘルパーも JSON も書き込みません。

次に、`ai-i18n-tools.config.json` で `sourceLocale` と `targetLocales` を編集します。`sourceLocale` はコード内の文字列の言語です。任意の BCP-47 言語が有効です。例ではよく `en` が使用されます。ターゲットコードは `pt-BR` のように記述します。カタログフォルダーは `pt_BR` で、これは gettext と Django が期待する形式です（`localeFormat` は `posix` です）。

<a id="run-the-agent-prompt"></a>
## エージェントプロンプトを実行する

コーディングエージェント（Cursor、Claude Code、Copilot、または類似のもの）でプロジェクトを開き、新しいチャットを開始して、以下のプロンプトを貼り付けてください。プロジェクトは既に初期化されている必要があります。編集するものは何もありません。例えば言語切り替えなしなど、何かを除外したい場合は、同じメッセージでその旨を伝えてください。

エージェントはまず、CLI と設定が存在することを確認し、いずれかが不足している場合は指示を出して停止します。次に、以下の4つの部分で動作します。

- パート1では、設定を既存のカタログと一致させ、一部のテンプレートが書き込む `i18n.py` を削除します。
- パート2では、ユーザー向け文字列を、既に使用している gettext 呼び出しとテンプレートタグでラップします。
- パート3では、`extract` を実行し、ルックアップ前にフォーマットする呼び出しを見つけます。
- パート4では、言語切り替えを追加します。

何もインストールまたは初期化せず、API キーを読み取らず、翻訳も行いません。`makemessages` や `compilemessages` を実行せず、`.po` および `.mo` ファイルには手を加えません。翻訳はレビュー後のステップであり、ユーザーが実行します。

<details class="agent-prompt">
<summary>エージェントプロンプト: Django または gettext アプリに言語を追加する</summary>

````markdown
# Add languages to this gettext app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs and that
`ai-i18n-tools.config.json` exists with a `ui.gettext` block. If either is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-python-django` for Django, `ui-python-flask` for
Flask-Babel catalogs, and `ui-python-gettext` for any other gettext app. Do not
install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API,
  cost money, and `translate-ui` rewrites the `.po` and `.mo` files. The user
  runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.po`,
  `.mo`, `.pot`, or `strings.json`. Do not run `makemessages` or
  `compilemessages`. Do not create `i18n.py` or any other translation helper.
  Do not edit migrations or change field names.
- Do not reformat unrelated code. Run the project's formatter and linter at the
  end. Leave unrelated edits in a dirty tree alone. Delete throwaway scripts and
  do not commit them.

## Part 1 — Config

1. If init wrote an `i18n.py`, delete it. A gettext app does not use it. If the
   project uses the `ui-python-gettext` template, set `"flatOutput": false` in
   the `ui` block.
2. Make the config match the project. `ui.gettext.outputDir`, `potPath`, and
   `domain` must be where the existing catalogs live and the domain the app
   loads (Django: `django`; Flask-Babel: `messages`). Put `ui.stringsJson` and
   `ui.flatOutputDir` beside the catalogs. Set `ui.sourceRoots` to the
   application code instead of `"."`. Use one `ui` block per catalog tree when
   apps keep separate `locale/` folders.
3. Keep the existing `.po` files. `extract` reads them and keeps their
   translations.

## Part 2 — Wrap strings

Keep the gettext calls the project already uses, and wrap what is missing. The
literal is the source-language message. With the source language active, the
app must behave exactly as before.

- Python: `gettext`, `ngettext`, `pgettext`. Placeholders are `%(name)s`,
  filled after the lookup: `_("Hello, %(name)s!") % {"name": name}`. Strings that
  run at import time (models, forms, apps, settings) use the lazy form, for
  example `from django.utils.translation import gettext_lazy as _`. Never apply
  `%` to a lazy string at import time. Use `format_lazy`.
- Templates: add `{% load i18n %}` where needed. Use `{% translate "…" %}` and
  `{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}`.
  Do not switch templates to `{name}` placeholders.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`. The argument must be a string literal, so `_(variable)` is
  invisible.
- `extract` knows `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`,
  `pgettext`, and `self.tr`. Add every other name the code calls to
  `ui.uiExtractor.funcNames`: for example `gettext_lazy` called directly,
  `ngettext_lazy`, `pgettext_lazy`, `npgettext`, `gettext_noop`.
- Wrap text a person sees: labels, headings, messages, form and model text,
  emails, admin text. Leave identifiers, URLs, route names, field names,
  settings keys, log messages, SQL, and text that is already wrapped. A value
  that is both stored and shown (choices) keeps its stored value. Wrap the
  label.

Work in passes: wrap, run `ai-i18n-tools extract`, look for text still
unwrapped, and repeat.

## Part 3 — Check

1. `ai-i18n-tools extract` lists the new messages and keeps the entries filled
   from the existing `.po` files.
2. Run `ai-i18n-tools migrate-python-i18n` without `--write` and read
   `migrate-python-i18n-report.md`. It finds calls that format before the
   lookup. Fix each one by hand with `%(name)s` and a dict. Never use `--write`:
   it rewrites f-strings and `.format()` calls to `t(...)`, which a gettext app
   does not have. Do not commit the report.
3. Django's checks and the project's tests pass, and the source language still
   shows the original text.

## Part 4 — Language switch

Skip this part when the user asked you to leave the switch out. It changes the
layout.

Goal: the user can pick a language, the choice is remembered, and every request
after that uses it. Use the framework's own mechanism, and accept only the
languages in `sourceLocale` and `targetLocales`.

- Django: `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the
  supported languages with Django's lower-case codes (`pt-br`). `LOCALE_PATHS`
  points at `gettext.outputDir`, unless each app keeps its own `locale/` folder.
  Add `django.middleware.locale.LocaleMiddleware` after `SessionMiddleware` and
  before `CommonMiddleware`. Add `path("i18n/", include("django.conf.urls.i18n"))`
  to the URLconf, and a form that posts to `set_language` with a `next` field
  and a select built from `get_available_languages`, labelled
  `{% translate "Language" %}`.
- Flask-Babel: the locale selector returns, in order, `?lang=`, a cookie that
  remembers it, the `Accept-Language` header, then the source language. Match
  case-insensitively (`pt-br` is `pt-BR`) and ignore unknown codes. Keep
  `translations/` as the translation directory. Add a menu of links that carry
  `?lang=`, and store the cookie.
- Plain gettext: build the translations object with
  `gettext.translation(domain, localedir, languages=[code], fallback=True)`,
  converting `pt-BR` to `pt_BR`. In a web app build it per request. Do not use
  `gettext.install` there, because it is global and concurrent requests would
  share a language.
- Any framework: choose the language where a request or run starts, remember
  the choice, and keep it local to that request.

## Verify and report

The tests pass. With the source language, the output is unchanged. After the
user runs `translate-ui` and restarts the server, switching shows translations.
Before that, it shows the source text.

Report the files changed, each string you skipped with a one-line reason, the
function names you added to `funcNames`, plurals left as one string, one word
with several meanings, and sentences built from translated pieces. Then list
the commands for the user, and do not run them: `ai-i18n-tools translate-ui`,
then restart the server. Remind the user to commit first, because `translate-ui`
rewrites the `.po` files.
````

</details>

<a id="review-the-result"></a>
## 結果を確認する

エージェントはレポートで終了します。翻訳する前に確認してください。

- 差分。ラップされた呼び出し、テンプレートタグ、設定、および言語切り替えのみが変更されているはずです。`.po` および `.mo` ファイルは、翻訳するまで手つかずであるべきです。
- `ai-i18n-tools.config.json`: `gettext.outputDir` と `domain` はアプリがロードするカタログを指し、`sourceRoots` はアプリケーションコードをカバーします。
- `ai-i18n-tools extract` は新しいメッセージをリストし、`.po` ファイルに既に存在する翻訳を保持します。
- `migrate-python-i18n` のドライランでは、修正すべきものが何もリストされていません。
- Django のチェックとテストがパスし、アプリがソース言語で同じように表示されること。
- レポート内のスキップされた文字列と曖昧なケース: 複数形が1つの文字列として残されているもの、2つの意味を持つ単語、翻訳された断片から構築された文。これらは手動で決定してください。

この状態をコミットしてください。`translate-ui` は `.po` ファイルを上書きするため、レビューのためにクリーンな差分が必要になります。

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

この部分はユーザーが実行します。これは API キーを使用し、アカウントでお金が消費され、`.po` ファイルを上書きするため、まずコミットしてください。

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` は `translationModels` のみを置き換えます。同じランキングは [モデル](/ja/guide/translation-dashboard/models) タブにあります。次に翻訳します。

```bash
ai-i18n-tools translate-ui
```

`translate-ui` は `.pot` テンプレート、ターゲットロケールごとに1つの `.po`、およびコンパイルされた `.mo` を書き込みます。次回の実行でそれらが再生成されるため、これらのファイルは今後編集しないでください。コミットする前に最初の差分を確認してください。

新しい `.mo` ファイルが認識されない場合は、サーバーを再起動してください。

<a id="check-one-language"></a>
### 1つの言語を確認する

1つのターゲット言語に切り替えて、いくつかのラップされた文字列があるページを見てください。まだソース言語を表示しているテキストはラップされていないか、`.mo` がリロードされていませんでした。出力に `%(name)s` を表示するテキストは、辞書を失っています。`.po` ファイル内のプレースホルダーを確認してください。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソーステキストを変更した後、`ai-i18n-tools sync` (または`extract`の後に`translate-ui`) を再実行します。キャッシュにより、新規または変更された文字列のみがモデルに送られます。翻訳がずれないように、CIで実行してください。`ai-i18n-tools dashboard`は、翻訳を確認するための[翻訳ダッシュボード](/ja/guide/translation-dashboard/)を開きます。

`purge-locale`はロケールの`.po`と`.mo`を削除します。`.po`ファイルをコミットします。ビルドがそれらをコンパイルしない限り、`.mo`ファイルもコミットします。

同じ実行で`README.md`を翻訳するには、`--with-readme`でスキャフォールドします（または既存の設定にブロックを追加します）。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="do-it-by-hand"></a>
## 手動で行う

変更を自分で加えたい場合、またはプロンプトが何をするかを知りたい場合は、これらの手順を実行してください。各手順はプロンプトの一部に対応しています。最終的には、[CLIをインストール](#install-and-choose-a-provider)し、[プロジェクトを初期化](#initialise-the-project)し、[翻訳](#translate)を行います。

1. [設定をカタログに向ける](#point-the-config)。
2. 既に使用しているgettext呼び出しで[文字列をラップする](#wrap-strings)。
3. [呼び出しを抽出し、確認する](#extract-and-check)。
4. [実行時に言語を切り替える](#switch-language)。

<a id="step-1-point-the-config-at-your-catalogs"></a>
## ステップ1: 設定をカタログに向ける

テンプレートは適切なデフォルト値を書き込みます。これはDjangoのものです。

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "locale/strings.json",
    "flatOutputDir": "locale",
    "flatOutput": false,
    "gettext": {
      "outputDir": "locale",
      "domain": "django",
      "potPath": "locale/django.pot",
      "compileMo": true,
      "ingestExistingPo": true,
      "localeFormat": "posix"
    }
  }
}
```

プロジェクトに対して4つのことを確認してください。

- `gettext.outputDir`と`potPath`は、カタログが既に存在する場所です。Djangoの場合: `LOCALE_PATHS`内のフォルダー、またはアプリ内の`locale/`フォルダー。Flask-Babelの場合: `translations/`。
- `gettext.domain`は、アプリがロードするファイル名です。Djangoは`django`を使用します。Flask-Babelは`messages`を使用します。プレーンなgettextの場合、それは`gettext.translation(...)`呼び出し内のドメインです。
- `sourceRoots`は、`extract`がスキャンするフォルダーをリストします。`"."`からアプリケーションコードに絞り込み、テストやスクリプトがカタログに含まれないようにします。
- `stringsJson`は抽出キャッシュであり、このツールが所有するファイルです。カタログの隣に置いてください。これはランタイムファイルではありません。アプリはこれを読み込みません。

各Djangoアプリが独自の`locale/`フォルダーを保持している場合、カタログツリーごとに1つの`ui`ブロックを使用します。`ui`はリストを受け入れ、`--ui-block`は1つのブロックを実行します。パスはブロック間で一意である必要があります。[設定](/ja/reference/configuration)を参照してください。

`ingestExistingPo`はデフォルトでオンになっています。`extract`の間、`.po`ファイルに既に存在する翻訳が空のスロットを埋めます。既に設定されている翻訳は置き換えられません。最初の`translate-ui`の前にカタログをコミットしてください。なぜなら、それは`.po`ファイルを書き換え、`.mo`ファイルをコンパイルするからです。その差分を確認してください。

`compileMo`はあなたのために`.mo`を書き込むため、このワークフローでは`compilemessages`は必要ありません。カタログを書き込むツールを1つ選択してください。`translate-ui`の後に`makemessages`を実行すると、同じ`.po`ファイルが書き換えられます。

<a id="step-2-wrap-strings"></a>
## ステップ2: 文字列をラップする

`extract`は、`ui.uiExtractor.funcNames`内の関数名のいずれかに渡されるリテラルである場合、またはテンプレートタグである場合にのみ文字列を記録します。既存の呼び出しを保持してください。不足しているものを追加してください。

Pythonコード:

```python
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy, ngettext, pgettext

_("Welcome back")
_("Hello, %(name)s!") % {"name": name}
ngettext("%(count)d file", "%(count)d files", n) % {"count": n}
pgettext("menu", "Open")

class Article(models.Model):
    title = models.CharField(gettext_lazy("Title"), max_length=200)
```

プレースホルダーは`%(name)s`を使用します。検索後に`%`で値を渡してください。検索前には渡さないでください。モデル、フォーム、および設定はモジュールがインポートされるときに実行されるため、遅延形式を使用します。インポート時に遅延文字列に`%`を適用しないでください。代わりに`format_lazy`を使用してください。

テンプレート (Django `{% load i18n %}`、またはFlaskのJinja):

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`、`{% trans %}`、`{% blocktranslate %}`、および`{% blocktrans %}`はそれら自体で収集されます。<code v-pre>{{ name }}</code>のようなテンプレート変数は`%(name)s`として保存されます。その形式で保持してください。

`extract`が認識しない名前はスキップされます。デフォルトのリストは`_`、`t`、`translate`、`i18n.t`、`gettext`、`ngettext`、`pgettext`、および`self.tr`です。コードが`gettext_lazy("…")`、`ngettext_lazy`、`pgettext_lazy`、`npgettext`、または`gettext_noop`を直接呼び出す場合、それらの名前を`ui.uiExtractor.funcNames`に追加してください。`gettext_lazy as _`のように、遅延関数を`_`としてインポートする場合、`_`という名前は既にカバーされています。

人が目にするテキストをラップします: ラベル、見出し、メッセージ、フォームおよびモデルのテキスト、メール。識別子、URL、フィールド名、設定キー、ログメッセージ、およびマイグレーションはそのままにしておきます。ソーステキストを書き換えないでください。翻訳が見つからない場合、元の文が返されるため、アプリはソース言語で同じように見えます。

これらの呼び出しは、検索前に書式設定を評価するため、文字列がカタログエントリと一致することはありません。

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## ステップ 3: 呼び出しを抽出して確認する

呼び出しがラップされたら、`extract` を実行します。これにより、抽出キャッシュが書き込まれ、既存の `.po` ファイルから空のスロットが埋められます。モデルは呼び出しません。

```bash
ai-i18n-tools extract
```

次に、ルックアップの前にフォーマットする呼び出しを探します。`migrate-python-i18n` がそれらを見つけます。`--write` なしで実行します。

```bash
ai-i18n-tools migrate-python-i18n
```

`migrate-python-i18n-report.md` が書き込まれます。それを読み、`%(name)s` と辞書を使って、リストされている各呼び出しを手動で修正します。レポートを削除するか、git-ignore してください。

このページで `--write` を渡さないでください。このオプションは、f-string または `.format()` 呼び出しを `t("…", name=name)` に書き換えます。これは `i18n.py` ヘルパーにのみ存在する呼び出しです。gettext アプリには `t` がありません。行のないレポートは、ラップされた呼び出しが安全であることを意味します。これはすべての文がラップされたことを意味するわけではないため、`strings.json` の差分を読み、表示されると予想したテキストを探してください。

<a id="step-4-switch-language-at-runtime"></a>
## ステップ 4: 実行時に言語を切り替える

フレームワークが言語を選択します。ai-i18n-tools はメニューやヘルパーを追加しません。

<a id="django"></a>
### Django

`settings.py` で:

```python
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("pt-br", "Português (Brasil)"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

MIDDLEWARE = [
    # ...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

`LocaleMiddleware` はセッションミドルウェアの後、`CommonMiddleware` の前に配置します。`LANGUAGE_CODE` はソース言語です。`LANGUAGES` は訪問者が選択できる言語をリストします。`LOCALE_PATHS` は `gettext.outputDir` が書き込むフォルダーを指します。ただし、各アプリが独自の `locale/` フォルダーを保持する場合は除きます。

Django の言語切り替えビューを `urls.py` に追加します。

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

次に、テンプレートにフォームを追加します。

```jinja
{% load i18n %}
{% get_current_language as CURRENT %}
{% get_available_languages as LANGUAGES %}
<form action="{% url 'set_language' %}" method="post">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}">
  <select name="language" onchange="this.form.submit()">
    {% for code, name in LANGUAGES %}
      <option value="{{ code }}"{% if code == CURRENT %} selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>
</form>
```

ビューは選択をクッキーに保存します。代わりに言語を URL に含めるには、`i18n_patterns` を使用します。どちらも標準的な Django の機能です。Django の国際化に関するドキュメントを参照してください。

<a id="plain-gettext-and-flask-babel"></a>
### プレーンな gettext と Flask-Babel

目的の言語のカタログをロードして呼び出します。[python-gettext](/ja/examples#python-gettext) の例では、これをコマンドラインツールで行っています。

```python
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation("messages", localedir=str(LOCALEDIR), languages=[code], fallback=True)


_ = load_catalog("pt-BR").gettext
print(_("Hello"))
```

`pt-BR` を `pt_BR` (`translate-ui` が書き込んだフォルダー名) に変換します。カタログがない場合にソーステキストが表示されるように、`fallback=True` を保持します。Web アプリでは、リクエストごとに翻訳オブジェクトを構築し、`gettext.install` を使用してグローバルにインストールしないでください。そうしないと、同時リクエストで言語が共有されます。Flask-Babel では、ロケールセレクター関数からコードを返し、`translations/` をその翻訳ディレクトリとして保持します。

これが最後の手動ステップです。[モデルを選択して翻訳する](#translate) に進みます。

<a id="not-your-case"></a>
## 当てはまりませんか？

| お持ちの環境 | 参照先 |
| --- | --- |
| gettext を使用しない Streamlit、FastAPI、Flask、デスクトップ、またはスクリプトアプリ | [Python アプリに i18n を追加する](/ja/guide/add-i18n-to-python) |
| JS/TS アプリ | [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js) |
| ウェブサイトまたはドキュメントサイト | [ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website) |
| リポジトリのREADMEまたはその他のMarkdownファイル | [READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 例

| 例 | 表示内容 |
| --- | --- |
| [python-gettext](/ja/examples#python-gettext) | 既存の gettext コマンドラインツール; `translate-ui` は `.po` と `.mo` を更新します |

Django の例のディレクトリはありません。`python-gettext` の例は、ドメイン `messages` と同じ設定形式を示しています。`npx degit` でコピーするか、GitHub Release から `ai-i18n-tools-python-examples.zip` をダウンロードしてください。コマンド: [例](/ja/examples#python-examples)。
