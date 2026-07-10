<a id="cli-reference"></a>
# CLI リファレンス

コマンドの各フラグに対して `ai-i18n-tools <command> --help` を実行します。以下のグループページでは、コンテキスト、主なオプション、およびトピックガイドへのリンクを追加しています。

<a id="command-overview"></a>
## コマンド概要

<a id="setupsetup"></a>
### [セットアップ](setup)

| コマンド | 概要 |
|---------|---------|
| [`version`](setup#version) | CLIのバージョンとビルドタイムスタンプを表示します。 |
| [`init`](setup#init) | 初期設定ファイルを書き出します。`-t` がスキャフォールドテンプレートを選択します。 |

<a id="models--catalogmodels"></a>
### [モデルとカタログ](models)

| コマンド | 概要 |
|---------|---------|
| [`check-models`](models#check-models) | 設定されたモデルIDをアクティブなプロバイダーに対して検証します。 |
| [`list-models`](models#list-models) | アクティブなプロバイダーが提供するモデルを一覧表示します。 |
| [`bench-models`](models#bench-models) | 設定されたモデルを1つのサンプル翻訳でベンチマークします。 |
| [`list-languages`](models#list-languages) | バンドルされているUI言語カタログを一覧表示します。 |

<a id="ui-stringsui-strings"></a>
### [UI文字列](ui-strings)

| コマンド | 概要 |
|---------|---------|
| [`extract`](ui-strings#extract) | ソースリテラルとHTMLマーカーから `strings.json` を更新します。 |
| [`mark-html`](ui-strings#mark-html) | HTMLファイルに `data-i18n*` マーカーを挿入します。 |
| [`generate-ui-languages`](ui-strings#generate-ui-languages) | 設定のロケールから `ui-languages.json` を書き出します。 |
| [`translate-ui`](ui-strings#translate-ui) | UI文字列を翻訳します (`strings.json` → ロケールJSON)。 |
| [`sync-ui`](ui-strings#sync-ui) | UI文字列を抽出してから翻訳します。 |
| [`proofread-ui`](ui-strings#proofread-ui) | UI文字列を抽出してから、ソースロケールのUI文字列をLLMでレビューします。 |
| [`export-ui-xliff`](ui-strings#export-ui-xliff) | `strings.json` をXLIFF 2.0にエクスポートします。 |

<a id="documentsdocuments"></a>
### [ドキュメント](documents)

| コマンド | 概要 |
|---------|---------|
| [`translate-docs`](documents#translate-docs) | Markdown、MDX、`.astro`、およびフレームワークカタログを翻訳します。 |
| [`write-heading-ids`](documents#write-heading-ids) | ATX見出しの前にHTMLアンカー行を挿入します。 |
| [`check-markdown`](documents#check-markdown) | Markdown/MDXをスキャンして区切り文字と強調の問題を検出します。 |

<a id="other-contentcontent"></a>
### [その他のコンテンツ](content)

| コマンド | 概要 |
|---------|---------|
| [`translate-json`](content#translate-json) | `json[]` 設定ブロックに従ってネストされたJSONを翻訳します。 |
| [`translate-svg`](content#translate-svg) | `config.svg` で設定されたSVGファイルを翻訳します。 |

<a id="workflows--statusworkflows"></a>
### [ワークフローとステータス](workflows)

| コマンド | 概要 |
|---------|---------|
| [`sync`](workflows#sync) | 抽出 + UI + SVG + ドキュメント + JSON を1つのパイプラインで実行します。 |
| [`status`](workflows#status) | UI、ドキュメント、およびJSONの翻訳カバレッジを出力します。 |
| [`statistics`](workflows#statistics) | キャッシュと`strings.json`の統計を出力します。 |

<a id="cache--maintenancemaintenance"></a>
### [キャッシュとメンテナンス](maintenance)

| コマンド | 概要 |
|---------|---------|
| [`cleanup`](maintenance#cleanup) | 古いキャッシュ行を整理し、Markdownのissueを再生成します。 |
| [`clean-temp`](maintenance#clean-temp) | `*.log`、`*.tmp`、およびキャッシュのバックアップを検索して削除します。 |
| [`purge-locale`](maintenance#purge-locale) | ロケールのキャッシュ行と生成されたアーティファクトを削除します。 |

<a id="toolstools"></a>
### [ツール](tools)

| コマンド | 概要 |
|---------|---------|
| [`dashboard`](tools#dashboard) | 翻訳ダッシュボードのWeb UIを起動します。 |
| [`glossary-generate`](tools#glossary-generate) | 空の`glossary-user.csv`テンプレートを書き込みます。 |
| [`help`](tools#help) | サブコマンドのヘルプを表示します。 |

<a id="synopsis"></a>
## 概要

```bash
ai-i18n-tools version
ai-i18n-tools check-models
ai-i18n-tools list-models
ai-i18n-tools bench-models [--model <ids>] [--text <text>|--file <path>] [--source <locale>] [--target <locale>]
ai-i18n-tools list-languages [search]
ai-i18n-tools init [-t ui-markdown|ui-docusaurus|ui-starlight|ui-vitepress|ui-nextra|ui-fumadocs|ui-astro-website|ui-json-bundles] [-o path] [--with-translate-ignore]
ai-i18n-tools write-heading-ids …
ai-i18n-tools mark-html [paths...] [--write]
ai-i18n-tools extract
ai-i18n-tools translate-docs …
ai-i18n-tools translate-json …
ai-i18n-tools translate-svg …
ai-i18n-tools translate-ui …
ai-i18n-tools sync-ui …
ai-i18n-tools proofread-ui …
ai-i18n-tools check-markdown [-p|--path <path>] [-f|--file <path>] [--json] [--no-cache]
ai-i18n-tools export-ui-xliff …
ai-i18n-tools sync …
ai-i18n-tools status …
ai-i18n-tools statistics …
ai-i18n-tools cleanup …
ai-i18n-tools clean-temp …
ai-i18n-tools purge-locale -l <code> [-l <code> …] [--dry-run] [-y|--yes] [-f|--force] [--keep-files] [--backup <path>]
ai-i18n-tools dashboard …
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]
ai-i18n-tools glossary-generate
ai-i18n-tools help [command]
```

<a id="root-and-global-options"></a>
### ルートおよびグローバルオプション

| オプション                       | スコープ         | 説明                                                                               |
|------------------------------|---------------|-------------------------------------------------------------------------------------------|
| `-V` / `--version`           | ルートプログラム  | バージョン番号とビルド日時を出力します（`version`サブコマンドと同じ情報）。 |
| `-h` / `--help`              | ルートプログラム  | ルートプログラムまたはコマンド名と併用した場合のサブコマンドのヘルプを表示します。      |
| `-c` / `--config <path>`     | すべてのコマンド | 設定ファイルのパス（デフォルト: `ai-i18n-tools.config.json`）。                                  |
| `-v` / `--verbose`           | すべてのコマンド | 詳細ログ出力。                                                                          |
| `-P` / `--provider <name>`   | すべてのコマンド | この実行のアクティブな LLM プロバイダー。設定の `provider` キーをオーバーライドします。`providers` の下で設定する必要があります。 |
| `-L` / `--ui-lang <code>`    | すべてのコマンド | ツール独自のUI（CLIヘルプ、ログ/サマリー、ダッシュボード）の言語。最優先ソース。[ツールUI言語](/guide/tool-ui-language)を参照してください。 |
| `-w` / `--write-logs [path]` | 選択されたコマンド | コンソール出力を `.log` ファイルにティーします (デフォルトパス: ルート `cacheDir` の下)。`translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync-ui`、`sync`、および `cleanup` のみで機能します。 |

<a id="per-command-help"></a>
### コマンドごとのヘルプ

| 使用法                            | 説明                        |
|----------------------------------|------------------------------------|
| `ai-i18n-tools <command> --help` | そのコマンドのすべてのオプション。      |
| `ai-i18n-tools help <command>`   | `<command> --help` と同じ出力。 |

<a id="target-locales--l----locale"></a>
### ターゲットロケール（`-l` / `--locale`）

| コマンド | 動作 |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `translate-docs`、`translate-json`、`translate-svg`、`translate-ui`、`sync`、`sync-ui`、`export-ui-xliff` | `-l` / `--locale <codes>` — コンマ区切りのターゲット BCP-47 コード (例: `de,fr,pt-BR`)。省略した場合、デフォルトは設定から取得されます (`json[]` ブロックはブロックごとの `targetLocales` を設定することもできます。UI ステップは `targetLocales` から `sourceLocale` を引いたものを使用します)。 |
| `proofread-ui`                                                                           | `-l` / `--locale <code>` — レビュー対象の単一ソースロケール（デフォルト：設定の`sourceLocale`）。                                                            |
