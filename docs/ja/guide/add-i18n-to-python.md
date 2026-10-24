<a id="add-i18n-to-a-python-app"></a>
# Pythonアプリへのi18nの追加

このチュートリアルでは、単一言語のPythonアプリケーションにai-i18n-toolsを使用してロケールを追加します。安全な呼び出しサイトの編集は`migrate-python-i18n`によって適用されます。まだ確認が必要なものはレポートにリストされます。

すでにGNU gettext、Django、またはFlaskのカタログを使用していますか？その呼び出しはそのまま維持できます。以下の適切な初期化テンプレートを選択し、既存の `.po` ファイルから空のカタログスロットを `extract` に埋めさせてください。

<a id="install"></a>
## インストール

マシンにNode.js `>=22.16.0` がインストールされている場合は、npmパッケージを使用してください（[インストール](/ja/guide/installation)）。Pythonプロジェクトの場合、一般的な方法はGitHubリリースからスタンドアロン実行ファイルを取得することです。Linux（`x64`、`arm64`）、macOS（`arm64`、`x64`）、Windows（`x64`）が利用可能です。`SHA256SUMS.txt` を確認し、Unix上で `chmod +x` を実行して、ファイルを `PATH` に配置してください。バイナリには署名がありません。アセット名とチェックサムについては、[スタンドアロン実行ファイル](/ja/guide/installation#standalone-executables)を参照してください。

`init`に渡すプロバイダーのAPIキーを設定します。例: Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollamaにはキーは不要です。その他のプリセットについては、[組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)を参照してください。

<a id="pick-a-template"></a>
## テンプレートを選択する

| 現在のアプリ | コマンド | 得られるもの |
| --- | --- | --- |
| ハードコードされた文字列、または新しい`t()` / `_()`呼び出し | `ai-i18n-tools init -t ui-python -P cheaperinference` | フラットな英語キーのJSONと`i18n.py` |
| GNU gettext、かつフラットなJSONも必要な場合 | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSONと`.po` / `.mo`、および`i18n.py` |
| `translations/`配下のFlaskまたはJinjaカタログ | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettextカタログと`i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (`i18n.py`なし) |

`sourceLocale` と `targetLocales` を編集します。`sourceLocale` はソース内の文字列の言語（通常は `en`）です。フレームワークの連携については、[Python統合](/ja/guide/integrations/python)を参照してください。呼び出しの形式とカタログのレイアウトについては、[Pythonアプリケーション](/ja/guide/ui-strings/python)を参照してください。

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

<a id="migrate"></a>
## 呼び出しサイトを移行する

`migrate-python-i18n` は `--write` を渡すまでドライランとして動作します。常に `migrate-python-i18n-report.md` を書き込みます。生成された `i18n.py` ファイルはスキップされます。`{value=}` などのデバッグフィールドやネストされたフォーマット指定はレポートされ、そのまま残されます。

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

ドライランで手動確認が必要なサイトがリストアップされた場合は、`--write` を実行する前にレポートを読んでください。オプションの `--report <path>` でレポートのパスを変更できます。オプションの `--ui-block` でスキャンを1つのUIブロックに制限できます。

<a id="translate"></a>
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
## 実行時のロケールの切り替え

`set_locale` は `ContextVar` トークンを返します。リクエストまたはコールバックが終了したときにリセットしてください。

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI および Flask ミドルウェアは `finally` (Flask: `teardown_request`) でリセットする必要があります。これにより、同時リクエスト間でロケールが漏洩するのを防ぎます。Django プロジェクトは Django のロケールアクティベーションを維持し、`i18n.py` は使用しません。フレームワークごとの注意点: [各フレームワークにおけるロケール](/ja/guide/ui-strings/python#locale)。

<a id="examples"></a>
## 例

| 例 | 内容 |
| --- | --- |
| [python-streamlit](/ja/examples#python-streamlit) | ダッシュボード、`t()` / `_()`、フラット JSON |
| [python-fastapi](/ja/examples#python-fastapi) | リクエストスコープのロケール、フラット JSON |
| [python-flask](/ja/examples#python-flask) | Flask + Jinja、フラット JSON |
| [python-gettext](/ja/examples#python-gettext) | 既存の gettext CLI; `translate-ui` は `.po` および `.mo` を更新します |

`npx degit` を使用してコピーするか、GitHub Release から `ai-i18n-tools-python-examples.zip` をダウンロードしてください。コマンド: [例](/ja/examples#python-examples)。
