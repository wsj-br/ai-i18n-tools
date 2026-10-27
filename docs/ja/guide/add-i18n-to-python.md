<a id="add-i18n-to-a-python-app"></a>
# Pythonアプリへのi18nの追加

このチュートリアルでは、単一言語のPythonアプリケーションにai-i18n-toolsを使ってロケールを追加します。ユーザーに表示される生の文字列は、手動で、または[文字列のラップ](#wrap-strings)の下にあるプロンプトを使ってラップされます。`migrate-python-i18n`は、すでにラップされている安全でない呼び出しのみを修正します。まだ確認が必要なものはすべてレポートに記載されます。

すでにGNU gettext、Django、またはFlaskのカタログを使用していますか？その呼び出しはそのまま維持できます。以下の適切な初期化テンプレートを選択し、既存の `.po` ファイルから空のカタログスロットを `extract` に埋めさせてください。

手順：

1. CLIを[インストール](#install)し、APIキーを設定します。
2. [テンプレートを選択](#pick-a-template)し、`init`を実行します。
3. `t()`または`_()`で[文字列をラップ](#wrap-strings)します。
4. すでに安全でない方法でラップされている[呼び出しサイトを移行](#migrate)します。
5. [モデルを選択して翻訳](#translate)します。
6. [実行時にロケールを切り替え](#switch-locale)ます。
7. [翻訳を維持](#keep-it-translated)します。

これがあなたのケースに当てはまるか不明ですか？最後に[あなたのケースではない場合](#not-your-case)を参照してください。

<a id="install"></a>
## インストール

マシンにすでにNode.js `>=22.16.0`がある場合は、npmパッケージを使用します（[インストール](/ja/guide/installation)）。Pythonプロジェクトの場合は、スタンドアロン実行可能ファイル（Node.jsなし）をインストールします。

LinuxおよびmacOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

インストーラーは`SHA256SUMS.txt`をチェックし、コマンドを`ai-i18n-tools`としてインストールし、`PATH`に追加します。バイナリは公証されておらず、Authenticode署名もされていません。手動の手順とアセット名：[スタンドアロン実行可能ファイル](/ja/guide/installation#standalone-executables)。

`init`に渡すプロバイダーのAPIキーを設定します。例: Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollamaにはキーは不要です。その他のプリセットについては、[組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)を参照してください。

<a id="pick-a-template"></a>
## テンプレートを選択する

| 現在のアプリ | コマンド | 得られるもの |
| --- | --- | --- |
| ハードコードされた文字列、または新しい`t()` / `_()`呼び出し | `ai-i18n-tools init -t ui-python -P cheaperinference` | ソース言語の文字列をキーとするフラットJSON、および`i18n.py` |
| GNU gettext、かつフラットなJSONも必要な場合 | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSONと`.po` / `.mo`、および`i18n.py` |
| `translations/`配下のFlaskまたはJinjaカタログ | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettextカタログと`i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (`i18n.py`なし) |

`sourceLocale`と`targetLocales`を編集します。`sourceLocale`はソース内の文字列の言語です。任意のBCP-47言語が有効です。例ではよく`en`が使用されます。フレームワークの配線：[Python統合](/ja/guide/integrations/python)。呼び出しの形式とカタログのレイアウト：[Pythonアプリケーション](/ja/guide/ui-strings/python)。

<a id="wrap-strings"></a>
## 文字列をラップする

最初にカタログエントリを検索し、次に補間を行います。生成された `i18n.py` から `t` と `_` をインポートします（Djangoは `gettext` と `ngettext` を保持します）。

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

これらはカタログ検索の前に評価されます。抽出ツールはこれらを安全でないとマークし、`migrate-python-i18n` がそれらを書き換えます：

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

Streamlit、FastAPI、フラットJSONを使用するFlask、Tkinter、Qt、およびPyWebViewシェルにはこれを使用します。これをコーディングエージェントにコピーします。Djangoまたは既存のgettextプロジェクトでは、代わりに[次のプロンプト](#agent-prompt-django-gettext)を使用してください。

<details class="agent-prompt">
<summary>エージェントプロンプト：i18n.pyヘルパー</summary>

````markdown
# Wrap user-facing Python strings with i18n.py

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `_()` (and the
other names in `ui.uiExtractor.funcNames`). The literal is the source-language
sentence and the catalog key. After this edit the app must behave the same when
the active locale is the source locale. Do not translate any string.

Call shapes: https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit Python (and Jinja
templates) under those roots. Skip class names, URLs and routes, import paths,
ids, enum and error codes, object keys used as identifiers, log field names,
regexes, comments, and text that is already wrapped. Do not edit the generated
`i18n.py`.

## Call shape

Import `t` and `_` from the generated `i18n.py`. Placeholders are `{name}` or
`{price:,.2f}`, passed as keyword arguments. `_("…") % x` and `_("…").format(…)`
are safe because the lookup happens first.

Never `_(f"…")`, `_("…" % x)`, or `_("…".format(…))`. If one slips in,
`migrate-python-i18n` can rewrite it later.

Before:

```python
st.write(f"Hello, {name}!")
```

After:

```python
st.write(t("Hello, {name}!", name=name))
```

Framework notes:

- Streamlit widgets keep a fixed `key=`.
- Tkinter text is rebuilt after `set_locale`.
- Qt uses `self.tr("…")` (already in the default function list).
- Jinja uses `{% trans %}` / `{% blocktrans %}` rather than an f-string inside
  the template.
- FastAPI and Flask middleware pair `set_locale` with `reset_locale` in
  `finally`.

## Order

1. `ai-i18n-tools init -t ui-python` (or `ui-python-gettext` / `ui-python-flask`
   if you also want `.po` files) so `i18n.py` exists.
2. Wrap call sites.
3. Run `ai-i18n-tools extract`. Then `ai-i18n-tools migrate-python-i18n` (dry
   run) and read the report.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys.
- Do not create a second helper besides `i18n.py`.
- Do not hand-edit `strings.json`, flat locale JSON, `.po` / `.mo`, or
  `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog.
- The project's tests pass.
- The source locale still shows the original sentences. One target locale shows
  translations after `translate-ui`.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case left for a human (the same word with different meanings,
concatenated sentences, or plurals).
````

</details>

<a id="agent-prompt-django-gettext"></a>

<a id="agent-prompt-django-and-native-gettext"></a>

アプリがすでにDjangoまたはGNU gettextを呼び出している場合、または`.po`カタログを使い続けたい場合は、これを使用します。`i18n.py`は追加しないでください。

初期化テンプレートは、これらの呼び出し名を正確に認識します：`_`、`t`、`translate`、`i18n.t`、`gettext`、`ngettext`、`pgettext`、および`self.tr`。遅延およびnoopバリアントはそのリストには含まれていません。プロジェクトが実際に呼び出す名前（通常は`gettext_lazy`、`ngettext_lazy`、`pgettext_lazy`、および`gettext_noop`）を`ui.uiExtractor.funcNames`に追加してください。そうしないと`extract`はそれらをスキップします。`ngettext_lazy`は単数形と複数形として、`pgettext_lazy`はコンテキストとメッセージとして、名前がリストされた後にのみ読み取られます。テンプレート内の`{% trans %}`と`{% blocktrans %}`は個別に収集されます。

<details class="agent-prompt">
<summary>エージェントプロンプト：Djangoとネイティブgettext</summary>

````markdown
# Wrap user-facing strings with Django / gettext

## Context

ai-i18n-tools extracts string literals passed to gettext calls whose names are
listed in `ui.uiExtractor.funcNames`, plus `{% trans %}` and `{% blocktrans %}`
in templates. The literal is the source-language message. Existing `.po` files
stay; `extract` fills empty catalog slots from them when
`ui.gettext.ingestExistingPo` is on (the default). Do not translate any string.
Do not create `i18n.py`.

## Scope

Edit Python modules, Django templates, and forms under `ui.sourceRoots`. Skip
URLs, import paths, ids, field names used as identifiers, `verbose_name` keys
that are already lazy-wrapped, comments, and migrations that must not change. Do
not wrap strings inside `help_text` that are already `gettext_lazy` calls.

## Call shape

Init with `ui-python-django` (Django `locale/` and the `django` domain) or
`ui-python-gettext` (existing GNU catalogs). Use `gettext`, `ngettext`,
`pgettext`, and `{% blocktrans %}` / `{% trans %}`. Placeholders are `%(name)s`.

Module-level model, form, and settings strings use the lazy form. Add every lazy
or noop name you call to `ui.uiExtractor.funcNames` (for example `gettext_lazy`,
`ngettext_lazy`, `pgettext_lazy`, and `gettext_noop`). The default list does not
include them.

Before:

```python
verbose_name = "Display name"
```

After:

```python
from django.utils.translation import gettext_lazy as _

verbose_name = _("Display name")
```

Template:

```django
{% blocktrans with name=user.name %}Hello, {{ name }}{% endblocktrans %}
```

The extractor stores that message with a `%(name)s` placeholder. Do not switch
Django templates to `{name}` or to i18next `{{name}}` inside a Python `t()`
call.

## Order

1. Pick `ui-python-django` or `ui-python-gettext`. Confirm `funcNames` includes
   every gettext function the code calls.
2. Wrap call sites. Keep existing `.po` files.
3. Run `ai-i18n-tools extract`.

## Do not

- Do not translate, rename, or reword msgid text.
- Do not add `i18n.py` or a flat-JSON `t()` helper next to Django's gettext.
- Do not hand-edit generated `.po`, `.mo`, `strings.json`, or
  `ui-languages.json`.
- Do not change model field names, migrations, or test selectors.

## Verify

- `ai-i18n-tools extract` lists the new messages and does not drop existing
  msgid entries that `ingestExistingPo` already filled.
- Django checks and the project's tests pass.
- The source locale still shows the original copy.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
function names you added to `funcNames`, and any ambiguous case left for a
human.
````

</details>

<a id="migrate"></a>

<a id="migrate-call-sites"></a>
## 呼び出しサイトを移行する

`migrate-python-i18n` は `--write` を渡すまでドライランとして動作します。常に `migrate-python-i18n-report.md` を書き込みます。生成された `i18n.py` ファイルはスキップされます。`{value=}` などのデバッグフィールドやネストされたフォーマット指定はレポートされ、そのまま残されます。

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

ドライランで手動確認が必要なサイトがリストアップされた場合は、`--write` を実行する前にレポートを読んでください。オプションの `--report <path>` でレポートのパスを変更できます。オプションの `--ui-block` でスキャンを1つのUIブロックに制限できます。

<a id="translate"></a>

<a id="choose-models-and-translate"></a>
## モデルを選択して翻訳する

`init` からのモデルリストは出発点です。アクティブなプロバイダーのチャットモデルをランク付けし、ショートリストが適切に見えたら、それを `translationModels` に書き込んでください：

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` は `translationModels` のみを置換します。同じランキングが [Models](/ja/guide/translation-dashboard/models) タブに表示されます。次に、抽出して翻訳します：

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` は `strings.json` および `ui-languages.json` を書き込みます。`translate-ui` はフラットな JSON ファイルを埋め、`ui.gettext` が設定されている場合は `.po` / `.mo` カタログを埋めます。生成されたカタログを手動で編集しないでください。

<a id="switch-locale"></a>

<a id="switch-locale-at-runtime"></a>
## 実行時にロケールを切り替える

`set_locale` は `ContextVar` トークンを返します。リクエストまたはコールバックが終了したときにリセットしてください。

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI および Flask ミドルウェアは `finally` (Flask: `teardown_request`) でリセットする必要があります。これにより、同時リクエスト間でロケールが漏洩するのを防ぎます。Django プロジェクトは Django のロケールアクティベーションを維持し、`i18n.py` は使用しません。フレームワークごとの注意点: [各フレームワークにおけるロケール](/ja/guide/ui-strings/python#locale)。

<a id="keep-it-translated"></a>
## 翻訳を維持する

ソーステキストを変更した後、`ai-i18n-tools sync` (または`extract`の後に`translate-ui`) を再実行します。キャッシュにより、新規または変更された文字列のみがモデルに送られます。翻訳がずれないように、CIで実行してください。`ai-i18n-tools dashboard`は、翻訳を確認するための[翻訳ダッシュボード](/ja/guide/translation-dashboard/)を開きます。

同じ実行で`README.md`を翻訳するには、`--with-readme`でスキャフォールドします（または既存の設定にブロックを追加します）。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

<a id="not-your-case"></a>
## 当てはまりませんか？

| お持ちの | 参照 |
| --- | --- |
| JS/TSアプリ | [JS/TSアプリにi18nを追加する](/ja/guide/add-i18n-to-js) |
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
| [python-gettext](/ja/examples#python-gettext) | 既存の gettext CLI; `translate-ui` は `.po` および `.mo` を更新します |

`npx degit` を使用してコピーするか、GitHub Release から `ai-i18n-tools-python-examples.zip` をダウンロードしてください。コマンド: [例](/ja/examples#python-examples)。
