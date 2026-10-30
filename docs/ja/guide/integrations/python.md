<a id="python"></a>
# Python

Pythonアプリケーションに最適なセットアップを選択する方法。抽出、カタログ、および呼び出し形式については、[Pythonアプリケーション](/ja/guide/ui-strings/python)に記載されています。既存の単一ロケールアプリの手順は、[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)で、[エージェントプロンプト](/ja/guide/add-i18n-to-python#run-the-agent-prompt)も利用できます。Django、Flask-Babelカタログ、およびgettextをすでに使用しているアプリには、独自のウォークスルーとプロンプトが用意されています。[Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext)をご覧ください。

Streamlit、FastAPI、Flask、Pyramid、Tkinter、PyQt、PySide、および PyWebView は、生成された `i18n.py` ヘルパー（Python 3.10 以降）を呼び出します。Django は Django 標準の gettext を使用します。リポジトリには、`examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi`、および `examples/python-gettext` の 4 つの実行可能なコピーが同梱されています。Pyramid、Django、Tkinter、Qt、および PyWebView には個別のサンプルディレクトリはありません。

<a id="which-template"></a>
## テンプレートの選択

| フレームワーク | 初期化テンプレート | カタログ | 例 |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | ソース文字列をキーとするフラットなJSON | [python-streamlit](/ja/examples#python-streamlit) |
| FastAPI | `ui-python` | ソース文字列をキーとするフラットなJSON | [python-fastapi](/ja/examples#python-fastapi) |
| Flask + Jinja, flat JSON | `ui-python` | ソース文字列をキーとするフラットなJSON | [python-flask](/ja/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `translations/` 配下の `.po` / `.mo` | 以下の Flask に関する注記を参照 |
| Pyramid | `ui-python` または `ui-python-flask` | Flask と同じ | Flask と同じ配線 |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | サンプルディレクトリなし |
| 既存の GNU gettext | `ui-python-gettext` | フラットな JSON および `.po` / `.mo`、または gettext のみ | [python-gettext](/ja/examples#python-gettext) |
| Tkinter | `ui-python` | ソース文字列をキーとするフラットなJSON | サンプルディレクトリなし |
| PyQt / PySide | `ui-python` または gettext テンプレート | フラットな JSON および/または `.po` | サンプルディレクトリなし |
| PyWebView / PyWebKit | シェル用 Python テンプレート | シェルカタログ、および HTML マーカーまたはロケールごとに 1 つの HTML ファイル | サンプルディレクトリなし |

`ui-python`、`ui-python-gettext`、および`ui-python-flask`は、`i18n.py`ファイルが存在しない場合にそのファイルを作成します。`ui-python-django`は作成しません。`--with-readme`を追加すると、リポジトリのREADMEも翻訳できます。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)

<a id="framework-notes"></a>
## フレームワークに関する注記

<a id="streamlit"></a>
### Streamlit

`st.set_page_config`と他のすべての`t()`の前に`set_locale`を呼び出します。ラベルが翻訳できるように、アプリ内でメニューを描画します。`streamlit_language_selector()`は、ウィジェットが描画されるときにロケールをセッション状態とクエリ文字列に書き込みますが、これは翻訳されたページタイトルには遅すぎ、そのラベルは英語のままです。レシピ：[言語切り替えを追加する](/ja/guide/add-i18n-to-python#step-4-add-a-language-switch)。すべてのウィジェットに固定の`key`を与えます。詳細：[ロケール — Streamlit](/ja/guide/ui-strings/python#streamlit)。

<a id="fastapi"></a>
### FastAPI

ミドルウェアで `?lang=` または `Accept-Language` を読み取り、`set_locale` を呼び出し、`finally` 内で `reset_locale` を実行することで、同時リクエストがそれぞれのロケールを保持できるようにします。詳細は [Locale — FastAPI](/ja/guide/ui-strings/python#fastapi) を参照してください。

<a id="flask-and-pyramid"></a>
### Flask と Pyramid

[python-flask](/ja/examples#python-flask) の例ではフラットな JSON を使用します。`init -t ui-python-flask` は、すでに Flask-Babel 形式のカタログを使用しているアプリケーション向けの `translations/` 配下の gettext レイアウトです。いずれの場合も、リクエストからロケールを設定し、`_`、`t`、`current_locale`、`ui_languages`、および `direction` をテンプレートコンテキストに注入してください。Pyramid も同様のリクエストスコープのパターンを使用します。詳細: [Locale — Flask and Pyramid](/ja/guide/ui-strings/python#flask)。

<a id="django"></a>
### Django

`gettext`、`ngettext`、および`{% blocktrans %}`を保持します。`init -t ui-python-django`はDjangoの`locale/`ディレクトリと`django`ドメインに一致し、Djangoのランタイムをそのまま残します。ウォークスルー：[Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext)。詳細：[ロケール — Django](/ja/guide/ui-strings/python#django)。

<a id="existing-gettext"></a>
### 既存の gettext

`_()`、`gettext()`、および`ngettext()`はそのままにします。`ui.gettext`を現在のカタログツリーに向け、`extract`を実行し、次に`translate-ui`を実行します。[python-gettext](/ja/examples#python-gettext)の例はgettextのみです (`flatOutput: false`)。`init -t ui-python-gettext`はフラットなJSONも書き込みます。ウォークスルー：[Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext)。詳細：[ロケール — 既存のgettext](/ja/guide/ui-strings/python#gettext)。

<a id="tkinter-qt-and-pywebview"></a>
### Tkinter、Qt、PyWebView

各 Tkinter ウィジェットを作成する際に `t()` または `_()` を呼び出し、`set_locale` の後に表示テキストを再構築してください。PyQt および PySide の `self.tr("...")` 呼び出しは抽出され、Qt の `.ui` ファイルは `notr="true"` でない限り `<string>` 要素を提供します。PyWebView または PyWebKit の場合は、上記のテンプレートを使用して Python シェルを抽出し、`data-i18n` マーカーを使用するか、ロケールごとに 1 つの HTML ドキュメントを作成して HTML ページを抽出してください。詳細: [Locale — Tkinter](/ja/guide/ui-strings/python#tkinter)、[PyQt / PySide](/ja/guide/ui-strings/python#pyqt)、および [PyWebView](/ja/guide/ui-strings/python#pywebview)。
