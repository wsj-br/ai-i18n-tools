<a id="cli--getting-started"></a>
# CLI — はじめに

<a id="version"></a>
### `version`

**概要:** `ai-i18n-tools version`

CLIのバージョンとビルドタイムスタンプを表示します（ルートプログラムの`-V` / `--version`と同じ情報です）。

---

<a id="init"></a>
### `init`

**概要:** `ai-i18n-tools init -P <provider> [-t <template>] [-o <path>] [--with-readme] [--with-translate-ignore]`

初期設定ファイルを記述します（`provider` / `providers`、`concurrency`、`uiBatchConcurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`docs[].addFrontmatter` を含みます）。LLM を呼び出す翻訳コマンドでは、環境変数または `.env` にアクティブなプロバイダーの API キーが必要です（Ollama を除く）— [プロバイダーと API キー](/ja/guide/quick-start#provider-and-api-key) を参照してください。

**主なオプション:** `-P` / `--provider` (必須)、`-t` / `--template`、`-o` / `--output`、`--with-readme`、`--with-translate-ignore`

`-P` / `--provider` は必須です。これは、どの**組み込みプリセット**をスキャフォールドするかを選択します。次のいずれかである必要があります: `openrouter`、`openai`、`anthropic`、`gemini`、`deepseek`、`cerebras`、`groq`、`mistral`、`xai`、`nvidia`、`alibaba`、`apikeyfan`、`cheaperinference`、`ollama`。

**テンプレート (`-t`):**

| 値 | スキャフォールド |
|-------|-----------|
| `ui-markdown` | UI 文字列と README (フラット出力、言語リスト) |
| `ui-docusaurus` | Docusaurus UI + ドキュメント |
| `ui-starlight` | Starlight ドキュメント |
| `ui-vitepress` | VitePress ドキュメント (`docsOutput.style: "vitepress"`) およびテーマ文字列用 `vitepressThemeCatalog` |
| `ui-nextra` | Nextra ドキュメント (`docsOutput.style: "nextra"`) およびテーマ辞書用 `nextraDictionaryPath` (サイドバー `_meta.ts` は自動的に収集されます) |
| `ui-fumadocs` | Fumadocs ドキュメント (`docsOutput.style: "fumadocs"`) およびUIオーバーライド用 `fumadocsUiCatalog` (サイドバー `meta.json` は自動的に収集されます) |
| `ui-astro-website` | Astro ウェブサイトUI文字列 |
| `ui-plain-html` | プレーンHTMLカタログ (`data-i18n*`マーカー、フラットロケールJSON) |
| `docs-plain-html` | プレーンHTMLドキュメント (ロケールごとに1ファイル、言語リスト、hreflang) |
| `docs-markdown` | Markdown ドキュメント: README と `.md` ファイル、フラット出力、言語リスト |
| `ui-json-bundles` | JSON (`json[]` のみ) |
| `ui-python` | Python UI 文字列、ソース言語の文字列をキーとするフラットな JSON、および `i18n.py` |
| `ui-python-gettext` | フラットな JSON と GNU `.po` / `.mo` を使用した Python UI 文字列、および `i18n.py` |
| `ui-python-django` | Django `gettext` / `{% blocktrans %}` カタログ（`flatOutput: false`、ドメイン `django`、`i18n.py` なし） |
| `ui-python-flask` | `translations/` 配下の Flask / Jinja カタログ（`flatOutput: false`）および `i18n.py` |
| `ui-dotnet` | .NET UI文字列、ソース言語文字列をキーとするフラットなJSON、および`I18n.cs` |
| `ui-dotnet-resx` | .NET UI文字列を`.resx`サテライト (`flatOutput: false`) および`I18nResx.cs`として |

`--with-readme` は `README.md` ドキュメント ブロック (`outputDir` `translated-docs`、`docsOutput.style` `"flat"`、`languageListBlock`) を追加し、`features.translateDocs` を true に設定します。ドキュメント ブロックに `README.md` がすでにリストされている場合 (`ui-markdown` と `docs-markdown` の場合がこれに該当します)、何も行いません。設定のみを書き込みます。`README.md` に貼り付けるマーカー行を出力し、そのファイルが見つからない場合は警告します。ガイド: [README と Markdown ドキュメントに i18n を追加する](/ja/guide/add-i18n-to-readme)。

```bash
ai-i18n-tools init -t docs-markdown -P openrouter
ai-i18n-tools init -t ui-python -P openrouter --with-readme
```

`--with-translate-ignore` はスターター `.translate-ignore` を作成します（Python 仮想環境およびキャッシュディレクトリを含みます）。

`ui-python`、`ui-python-gettext`、および`ui-python-flask`は、そのファイルがない場合に`i18n.py`も書き込みます。DjangoプロジェクトはDjango独自のgettextランタイムを保持するため、`ui-python-django`は`i18n.py`を書き込みません。`ui-dotnet`は、そのファイルがない場合に`I18n.cs`を書き込み、`.csproj`に追加する`EmbeddedResource`項目を出力します。`ui-dotnet-resx`は代わりに`I18nResx.cs`を書き込み、`ui.resx`を`Resources/SharedResource.<culture>.resx`に向けます。`--namespace`はC#の名前空間を上書きします。ガイド: [.NETアプリケーション](/ja/guide/ui-strings/dotnet)および[.NET ResourceManagerアプリにi18nを追加する](/ja/guide/add-i18n-to-dotnet-resourcemanager)。

`migrate-python-i18n` は、安全でない事前評価済み呼び出し (`_(f"...")`、`_("..." % expr)`、`_("...".format(...))`) を、ルックアップ・ビフォー・フォーマット呼び出しに書き換えます。デフォルトはドライランです。ファイルを編集するには `--write` を渡し、レビューノートについては `migrate-python-i18n-report.md` をお読みください。複雑な式は、それが安定している場合にその式から命名されます (`start.isoformat()` は `{start}` に、`len(rows)` は `{rows_count}` になります)。残された `{value_1}` は、名前を変更できるように報告されます。生成された `i18n.py` ファイルはスキップされます。クリーンなレポートは、アンラップされた f-文字列がカバーされたことを意味しません。

`migrate-dotnet-i18n`は、`T()`内の`T($"...")`、連結、および`string.Format`についても同様に処理します。`--wrap`は、未マークのXAMLラベルと信頼度の高いC#シンクもマークします。`--write`がない場合、それは監査です。レポートは`migrate-dotnet-i18n-report.md`です。生成された`I18n.cs`と`I18nResx.cs`はスキップされます。ガイド: [.NETアプリケーション](/ja/guide/ui-strings/dotnet#migrate)。

---

<a id="doctor"></a>
### `doctor`

**概要:** `ai-i18n-tools doctor [--local] [--strict] [--json]`

プロジェクトが翻訳準備ができているか確認してください。このレポートは、設定構文とスキーマ、ビジネスルール、インストールされているバージョン、ソースと出力パス、UIカタログファイル、それらのカタログ内のプレースホルダーの不一致、キャッシュ統計、設定されたプロバイダー、設定されているサポート対象の環境変数、およびモデルIDを対象としています。名前が変更された、削除された、または書き換えられたプレースホルダーを含むカタログは警告となり、1つの例を示します。

デフォルトでは、`doctor` は設定済みのモデルIDをアクティブなプロバイダーのカタログと照合し、インストールされているバージョンを最新のGitHubリリースと比較します。`--local` は両方のネットワーク呼び出しをスキップします。新しいリリース、またはGitHubリクエストの失敗は警告となります。モデルIDが見つからないか期限切れの場合、コマンドは失敗します。いずれかのチェックで警告が出た場合、`--strict` はエラーで終了します。

APIキーの値は決して出力されません。設定済み変数は、`Configured variables: NAME, ...`としてアルファベット順に一覧表示されます。APIキーではない変数については、その値も表示されます。

入力パスが見つからない場合は失敗します。出力ディレクトリが見つからない場合は注意書きとなります。最初の翻訳実行時に作成されるためです。`doctor` は設定を書き換えたり、ディレクトリを作成したり、ソーステキストをモデルに送信したりしません。

**主なオプション:** `--local`, `--strict`, `--json`

```bash
ai-i18n-tools doctor
ai-i18n-tools doctor --local
```

---

<a id="help"></a>
### `help`

**概要:** `ai-i18n-tools help [command]`

サブコマンドのヘルプを表示します（`ai-i18n-tools <command> --help`と同じ出力です）。
