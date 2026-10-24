<a id="python"></a>
# Python アプリケーション

`ai-i18n-tools` は、Python、Jinja、Django、および Qt `.ui` ファイルから UI 文字列を抽出し、フラットな英語キーの JSON、GNU gettext カタログ、またはその両方を出力します。ランタイムヘルパーは標準ライブラリの `i18n.py` (Python 3.10 以降) です。Streamlit、Tkinter、PyQt、PySide、PyWebView、Flask、Pyramid、および FastAPI はこのヘルパーを呼び出します。Django は Django 独自の gettext を使用します。

既存の単一言語アプリへのロケールの追加: [Pythonアプリへのi18nの追加](/ja/guide/add-i18n-to-python)。フレームワークの選択: [Python統合](/ja/guide/integrations/python)。関数リスト: [Pythonランタイム (`i18n.py`)](/ja/reference/programmatic-api#python-runtime)。

実行可能なコピーは `examples/python-streamlit`、`examples/python-flask`、`examples/python-fastapi`、および `examples/python-gettext` に存在します。これらは Python プロジェクトです。最初の 3 つは virtualenv と `pip install -r requirements.txt` を使用します。`python-gettext` は標準ライブラリのみを使用します。これらは npm パッケージではありません。リリースアーカイブ `ai-i18n-tools-python-examples.zip` には同じ 4 つのディレクトリが含まれています。npm tarball およびスタンドアロン実行可能ファイルには含まれていません。

<a id="init"></a>
## スキャフォールド

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python` はフラットな JSON と `i18n.py` を書き込みます。`ui-python-gettext` は JSON と `.po` / `.mo` を書き込みます。`ui-python-flask` は `translations/` および `i18n.py` 配下に gettext カタログを書き込みます。`ui-python-django` は `locale/<lang>/LC_MESSAGES/django.po` を書き込み、`i18n.py` は書き込みません。

スキャンルートは `node_modules`、`.git`、`.venv`、`venv`、`env`、`site-packages`、`__pycache__`、`.tox`、`.nox`、`.pytest_cache`、`.mypy_cache`、`.ruff_cache`、および `.eggs` をスキップします。

<a id="calls"></a>
## 翻訳される呼び出し

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

`migrate-python-i18n` は `--write` を渡すまでドライランとして動作します。これは `migrate-python-i18n-report.md` を書き込みます。`{value=}` などのデバッグフィールドやネストされたフォーマット指定は報告され、そのまま残されます。

`{% trans %}` と `{% blocktrans %}` は gettext `%(name)s` プレースホルダーになります。Jinja は空白を削除して折りたたみます。Django はタグが `trimmed` と指定しない限り、内部の空白を保持します。

<a id="catalogs"></a>
## カタログ

フラットな JSON キーは英語のソースです。コンテキストは `context` + U+0004 + 英語のソースを使用します。複数形のスロットは `{md5}_one`、`{md5}_other`、および `translate-ui` がすでに書き込んでいる他の CLDR 形式のままになります。ヘルパーはトリミングされた単数形を MD5 でハッシュ化し、最初の 8 文字の 16 進数を読み取ります。

Gettext ファイルはコンテキストに `msgctxt` を、複数形に `msgid` / `msgid_plural` を使用します。`ui.gettext.compileMo` は `.mo` を `.po` の隣に書き込みます。`purge-locale` はそのロケールの `.po` と `.mo` を削除します。`flatOutput` が false の場合、フラットな JSON ファイルは書き込まれていないため、そのまま残されます。

英語のソースロケールと明示的な複数形ソースを持つ `t(..., plurals=True)` は、モデルをスキップし、ソース文字列から `one` / `other` を保存します。

<a id="locale"></a>
## 各フレームワークにおけるロケール

`set_locale` は `ContextVar` トークンを返します。FastAPI や Flask のミドルウェアを含め、`finally` でリセットしてください。これにより、同時リクエスト間でロケールが漏洩するのを防ぎます。

- <a id="streamlit"></a>**Streamlit。** `streamlit_language_selector(sidebar=True, key="lang_selector")`は`st.session_state.locale`と`st.query_params["lang"]`を書き込みます。すべてのウィジェットに固定の`key`を指定してください。`examples/python-streamlit`を参照してください。
- <a id="fastapi"></a>**FastAPI。** ミドルウェアで`?lang=`または`Accept-Language`を読み取り、`set_locale`を呼び出し、`finally`内で`reset_locale`を実行します。ルートは`t()`と`_()`を呼び出します。`examples/python-fastapi`を参照してください。
- <a id="flask"></a>**FlaskおよびPyramid。** リクエストからロケールを設定し、`_`、`t`、`current_locale`、`ui_languages`、および`direction`をテンプレートコンテキストに注入します。`examples/python-flask`を参照してください。
- <a id="gettext"></a>**既存のgettext。** `_()`、`gettext()`、および`ngettext()`をそのままにします。`ui.gettext`を現在の`locales/`ツリーに向け、`extract`を実行してから`translate-ui`を実行します。`examples/python-gettext`を参照してください。
- <a id="django"></a>**Django。** `gettext`、`ngettext`、および`{% blocktrans %}`を使用します。初期化テンプレート`ui-python-django`は、Djangoの`locale/`ディレクトリおよび`django`ドメインと一致します。
- <a id="tkinter"></a>**Tkinter。** 各ウィジェットの作成時に`t()`または`_()`を呼び出し、`set_locale`の後に表示テキストを再構築します。
- <a id="pyqt"></a>**PyQt / PySide。** `self.tr("...")`が抽出されます。`notr="true"`でない限り、`.ui`ファイルが`<string>`要素を提供します。`comment`属性はgettextコンテキストになります。
- <a id="pywebview"></a>**PyWebView / PyWebKit。** 上記のPythonテンプレートを使用してPythonシェルを抽出します。`data-i18n`マーカーを使用するか、ロケールごとに1つのHTMLドキュメントを使用してHTMLページを抽出します。
