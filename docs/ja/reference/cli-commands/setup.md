<a id="cli--setup"></a>
# CLI — セットアップ

<a id="version"></a>
### `version`

**概要:** `ai-i18n-tools version`

CLIのバージョンとビルドタイムスタンプを表示します（ルートプログラムの`-V` / `--version`と同じ情報です）。

---

<a id="init"></a>
### `init`

**概要:** `ai-i18n-tools init [-t <template>] [-o <path>] [--with-translate-ignore]`

初期設定ファイルを書き出します（`concurrency`、`batchConcurrency`、`batchSize`、`maxBatchChars`、`docs[].addFrontmatter`を含みます）。

**主なオプション:** `-t` / `--template`, `-o` / `--output`, `--with-translate-ignore`

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
