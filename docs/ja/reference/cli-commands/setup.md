<a id="cli--getting-started"></a>
# CLI — はじめに

<a id="version"></a>
### `version`

**概要:** `ai-i18n-tools version`

CLIのバージョンとビルドタイムスタンプを表示します（ルートプログラムの`-V` / `--version`と同じ情報です）。

---

<a id="init"></a>
### `init`

**概要:** `ai-i18n-tools init [-t <template>] [-o <path>] [-P <provider>] [--with-translate-ignore]`

初期設定ファイルを記述します（`provider` / `providers`、`concurrency`、`uiBatchConcurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`docs[].addFrontmatter` を含みます）。LLM を呼び出す翻訳コマンドでは、環境変数または `.env` にアクティブなプロバイダーの API キーが必要です（Ollama を除く）— [プロバイダーと API キー](/ja/guide/quick-start#provider-and-api-key) を参照してください。

**主なオプション:** `-t` / `--template`, `-o` / `--output`, `-P` / `--provider`, `--with-translate-ignore`

`-P` / `--provider` はスキャフォールディングする**組み込みプリセット**を選択します (省略時は `openrouter`)。次のいずれかである必要があります: `openrouter`, `openai`, `anthropic`, `gemini`, `deepseek`, `cerebras`, `groq`, `mistral`, `xai`, `nvidia`, `alibaba`, `apifun`, `ollama`。

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
| `ui-json-bundles` | JSON (`json[]` のみ) |

`--with-translate-ignore` は初期設定の `.translate-ignore` を作成します。

---

<a id="help"></a>
### `help`

**概要:** `ai-i18n-tools help [command]`

サブコマンドのヘルプを表示します（`ai-i18n-tools <command> --help`と同じ出力です）。
