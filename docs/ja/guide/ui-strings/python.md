<a id="python-applications"></a>
# Python アプリケーション

`ai-i18n-tools`は、Python、Jinja、Django、Qtの`.ui`ファイルからUI文字列を抽出し、ソース言語の文字列をキーとするフラットなJSON、GNU gettextカタログ、またはその両方を書き込みます。`sourceLocale`はどの言語でもかまいません。ランタイムヘルパーは、標準ライブラリの`i18n.py`です（Python 3.10以降）。Streamlit、Tkinter、PyQt、PySide、PyWebView、Flask、Pyramid、FastAPIがそのヘルパーを呼び出します。DjangoはDjango独自のgettextを使用します。

既存の単一言語アプリにロケールを追加する: [Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)、その[エージェントプロンプト](/ja/guide/add-i18n-to-python#run-the-agent-prompt)と共に。Django、Flask-Babelカタログ、またはgettextを既に利用しているアプリの場合: [Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext)、その[エージェントプロンプト](/ja/guide/add-i18n-to-django-gettext#run-the-agent-prompt)と共に。フレームワーク選択: [Python連携](/ja/guide/integrations/python)。関数リスト: [Pythonランタイム (`i18n.py`)](/ja/reference/programmatic-api#python-runtime)。

実行可能なコピーは `examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi`、および `examples/python-gettext` に存在します。これらは Python プロジェクトです。最初の 3 つは virtualenv と `pip install -r requirements.txt` を使用します。`python-gettext` は標準ライブラリのみを使用します。これらは npm パッケージではありません。リリースアーカイブ `ai-i18n-tools-python-examples.zip` には同じ 4 つのディレクトリが含まれています。npm tarball およびスタンドアロン実行可能ファイルには含まれていません。

<a id="scaffold"></a>
## スキャフォールド

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` はフラットな JSON と `i18n.py` を書き込みます。`ui-python-gettext` は JSON と `.po` / `.mo` を書き込みます。`ui-python-flask` は `translations/` および `i18n.py` 配下に gettext カタログを書き込みます。`ui-python-django` は `locale/<lang>/LC_MESSAGES/django.po` を書き込み、`i18n.py` は書き込みません。

リポジトリのREADMEも翻訳します：上記の`init`コマンドに`--with-readme`を追加してください。[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)を参照してください。

スキャンルートは `node_modules`、`.git`、`.venv`、`venv`、`env`、`site-packages`、`__pycache__`、`.tox`、`.nox`、`.pytest_cache`、`.mypy_cache`、`.ruff_cache`、および `.eggs` をスキップします。

<a id="calls-that-translate"></a>
## 翻訳用の呼び出し

最初にカタログエントリを検索し、次に補間を行います。

ポータブル:

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Python 3.14 では、ヘルパーはテンプレート文字列も受け入れます:

```python
translate(t"Hello, {name}!")
```

`translate` は `t` のエイリアスです。キーワード引数は、テンプレート文字列から取得された値をオーバーライドします。

ネイティブの gettext。テンプレートが引数であるため、依然として安全です:

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

これらはカタログ検索の前に評価されるため、抽出ツールはこれらを安全ではないとマークし、`migrate-python-i18n` がそれらを書き換えます:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` は `--write` を渡すまでドライランです。これは `migrate-python-i18n-report.md` を書き込みます。`{value=}` のようなデバッグフィールドやネストされたフォーマット指定は報告され、そのまま残されます。`--write` は f-string と `.format()` の呼び出しを、生成された `i18n.py` にのみ存在する関数である `t(...)` に変換します。gettextまたはDjangoアプリでは、ドライランを使用して安全でない呼び出しを見つけ、`%(name)s` を使って手動で修正してください。

`{% trans %}` と `{% blocktrans %}` は gettext `%(name)s` プレースホルダーになります。Jinja は空白を削除して折りたたみます。Django はタグが `trimmed` と指定しない限り、内部の空白を保持します。

<a id="catalogs"></a>
## カタログ

フラットなJSONのキーは、ソース言語の文字列、つまり`sourceLocale`内のテキストです。その言語はどの言語でもかまいません。コンテキストは、`context` + U+0004 + そのソース文字列を使用します。複数形のスロットは、`translate-ui`がすでに書き込む`{md5}_one`、`{md5}_other`、およびその他のCLDR形式のままです。ヘルパーは、トリミングされた単数形をMD5でハッシュ化し、最初の8桁の16進文字を読み取ります。

Gettext ファイルはコンテキストに `msgctxt` を、複数形に `msgid` / `msgid_plural` を使用します。`ui.gettext.compileMo` は `.mo` を `.po` の隣に書き込みます。`purge-locale` はそのロケールの `.po` と `.mo` を削除します。`flatOutput` が false の場合、フラットな JSON ファイルは書き込まれていないため、そのまま残されます。

英語のソースロケールと明示的な複数形ソースを持つ `t(..., plurals=True)` は、モデルをスキップし、ソース文字列から `one` / `other` を保存します。

<a id="things-to-know"></a>
## 知っておくべきこと

- `t()` はソース言語の文を検索します。`strings.json` のIDは検索キーではありません。ロケールファイルが見つからない場合やキーが見つからない場合は、その文が返されます。
- ヘルパーは、ロードされた各JSONファイルをプロセスの存続期間中メモリに保持します。これには、最初の検索時にファイルが見つからなかった場合の空のマップも含まれます。`translate-ui` の後、アプリを再起動してください。
- その実行の最初の `t()` の前に `set_locale` を呼び出してください。`?lang=` は、アプリがそれを読み込み `set_locale` を呼び出すまで何も行いません。
- インポート時の `t()` は一度実行され、そのモジュールが再度インポートされるまでソース言語を保持します。ウィジェットが構築されるときに `t()` を呼び出してください。
- プレースホルダーは `{name}`、`{name:.2%}`、`{name:,.2f}`、および `{name!r}` です。`{row.rate}` のようなドット付きフィールドは拒否されます。`rate=row.rate` を渡してください。
- printf型文字 (`%d`、`%a`、`%s`、その他) が直後に続くリテラルのパーセントは、旧式の書式設定として扱われます。キーワード引数を使用した場合、`%` の書式設定が失敗するとテンプレートが返され、`{name}` の置換はスキップされます。`% do CDI` や `% a.a.` のようなソーステキストのように、リテラルのパーセントをこれらの文字から離してください。

<a id="locale-in-each-framework"></a>
## 各フレームワークのロケール

`set_locale` は `ContextVar` トークンを返します。FastAPI や Flask のミドルウェアを含め、`finally` でリセットしてください。これにより、同時リクエスト間でロケールが漏洩するのを防ぎます。

- <a id="streamlit"></a>**Streamlit.** 実行の最初の `t()` (`st.set_page_config(page_title=…)` を含む) の前に `set_locale` を呼び出してください。`streamlit_language_selector(sidebar=True, key="lang_selector")` は `st.session_state.locale` と `st.query_params["lang"]` を書き込み、ウィジェットが描画されるときに `set_locale` を呼び出すため、その上にある翻訳されたタイトルは、その実行中は以前の言語のままになります。そのラベルは固定された英語です。翻訳されたタイトルが必要なページは、[言語切り替えを追加する](/ja/guide/add-i18n-to-python#step-4-add-a-language-switch) に従う必要があります。すべてのウィジェットに固定の `key` を与えてください。`examples/python-streamlit` を参照してください。
- <a id="fastapi"></a>**FastAPI.** ミドルウェアで `?lang=` または `Accept-Language` を読み込み、`set_locale` を呼び出し、`finally` で `reset_locale` を呼び出してください。ルートは `t()` と `_()` を呼び出します。`examples/python-fastapi` を参照してください。
- <a id="flask"></a>**Flask and Pyramid.** リクエストからロケールを設定し、`_`、`t`、`current_locale`、`ui_languages`、および `direction` をテンプレートコンテキストに注入してください。`examples/python-flask` を参照してください。
- <a id="gettext"></a>**Existing gettext.** `_()`、`gettext()`、および `ngettext()` はそのままにしてください。`ui.gettext` を現在の `locales/` ツリーに向け、`extract` を実行してから `translate-ui` を実行してください。`examples/python-gettext` を参照してください。
- <a id="django"></a>**Django。** `gettext`、`ngettext`、および`{% blocktrans %}`を使用します。初期化テンプレート`ui-python-django`は、Djangoの`locale/`ディレクトリおよび`django`ドメインと一致します。
- <a id="tkinter"></a>**Tkinter。** 各ウィジェットの作成時に`t()`または`_()`を呼び出し、`set_locale`の後に表示テキストを再構築します。
- <a id="pyqt"></a>**PyQt / PySide。** `self.tr("...")`が抽出されます。`notr="true"`でない限り、`.ui`ファイルが`<string>`要素を提供します。`comment`属性はgettextコンテキストになります。
- <a id="pywebview"></a>**PyWebView / PyWebKit。** 上記のPythonテンプレートを使用してPythonシェルを抽出します。`data-i18n`マーカーを使用するか、ロケールごとに1つのHTMLドキュメントを使用してHTMLページを抽出します。
