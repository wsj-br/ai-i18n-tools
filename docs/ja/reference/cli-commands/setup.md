<a id="cli--getting-started"></a>
# CLI — はじめに

<a id="version"></a>
### `version`

**概要:** `ai-i18n-tools version`

CLIのバージョンとビルドタイムスタンプを表示します（ルートプログラムの`-V` / `--version`と同じ情報です）。

---

<a id="init"></a>
### `init`

**概要：** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-translate-ignore]`

初期設定ファイルを記述します（`provider` / `providers`、`concurrency`、`uiBatchConcurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`docs[].addFrontmatter` を含みます）。LLM を呼び出す翻訳コマンドでは、環境変数または `.env` にアクティブなプロバイダーの API キーが必要です（Ollama を除く）— [プロバイダーと API キー](/ja/guide/quick-start#provider-and-api-key) を参照してください。

**主要オプション:** `-P` / `--provider` (必須), `-t` / `--template`, `-o` / `--output`, `--with-translate-ignore`

`-P` / `--provider` は必須です。これにより、スキャフォールドする**組み込みプリセット**が選択されます。次のいずれかである必要があります: `openrouter`、`openai`、`anthropic`、`gemini`、`deepseek`、`cerebras`、`groq`、`mistral`、`xai`、`nvidia`、`alibaba`、`apifun`、`cheaperinference`、`ollama`。

**テンプレート (`-t`):**

| 値 | スキャフォールド |
|-------|-----------|
| `ui-markdown` | Markdown UI文字列ワークフロー |
| `ui-docusaurus` | Docusaurus UI + ドキュメント |
| `ui-starlight` | Starlight ドキュメント |
| `ui-vitepress` | VitePress ドキュメント (`docsOutput.style: "vitepress"`) およびテーマ文字列用 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra ドキュメント (`docsOutput.style: "nextra"`) およびテーマ辞書用 `nextraDictionaryPath` (サイドバー `_meta.ts` は自動的に収集されます) |
| `ui-fumadocs` | Fumadocs ドキュメント (`docsOutput.style: "fumadocs"`) およびUIオーバーライド用 `fumadocsUiCatalog` (サイドバー `meta.json` は自動的に収集されます) |
| `ui-astro-website` | Astro ウェブサイトUI文字列 |
| `ui-plain-html` | プレーンHTMLカタログ (`data-i18n*`マーカー、フラットロケールJSON) |
| `docs-plain-html` | プレーンHTMLドキュメント (ロケールごとに1ファイル、言語リスト、hreflang) |
| `ui-json-bundles` | JSON (`json[]` のみ) |
| `ui-python` | Python UI 文字列、フラットな英語キーの JSON、および `i18n.py` |
| `ui-python-gettext` | フラットな JSON と GNU `.po` / `.mo` を使用した Python UI 文字列、および `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` カタログ（`flatOutput: false`、ドメイン `django`、`i18n.py` なし） |
| `ui-python-flask` | `translations/` 配下の Flask / Jinja カタログ（`flatOutput: false`）および `i18n.py` |

`--with-translate-ignore` はスターター `.translate-ignore` を作成します（Python 仮想環境およびキャッシュディレクトリを含みます）。

`ui-python`、`ui-python-gettext`、および `ui-python-flask` は、`i18n.py` が存在しない場合にそれも書き込みます。Django プロジェクトは Django 独自の gettext ランタイムを保持するため、`ui-python-django` は `i18n.py` を書き込みません。

`migrate-python-i18n` は、安全でない事前評価済みの呼び出し（`_(f"...")`、`_("..." % expr)`、`_("...".format(...))`）を、フォーマット前にルックアップを行う呼び出しに書き換えます。デフォルトはドライランです。ファイルを編集するには `--write` を渡し、レビューの注意点については `migrate-python-i18n-report.md` を参照してください。生成された `i18n.py` ファイルはスキップされます。

---

<a id="help"></a>
### `help`

**概要:** `ai-i18n-tools help [command]`

サブコマンドのヘルプを表示します（`ai-i18n-tools <command> --help`と同じ出力です）。
