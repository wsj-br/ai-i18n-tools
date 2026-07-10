<a id="cli--workflows--status"></a>
# CLI — ワークフローとステータス

<a id="sync"></a>
### `sync`

**概要:** `ai-i18n-tools sync [options]`

抽出（有効な場合）、次にUI翻訳、次に`features.translateSVG`と`config.svg`が設定されている場合の`translate-svg`、次にドキュメント翻訳、次に`features.translateJson`と`json[]`が設定されている場合の`translate-json` — ただし`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`でスキップされた場合を除きます。

**主なオプション:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force`はUIおよびSVGステップならびにdocs/JSONに転送されます。`--force-update`はdocs、JSON、SVGに適用されます（UIには適用されません）。ドキュメントフェーズでは`--emphasis-placeholders`と`--debug-failed`も転送されます（`translate-docs`と同じ意味）。`--prompt-format`は`sync`フラグではありません。docsおよびJSONステップは組み込みのデフォルト（`json-array`）を使用します。

---

<a id="status"></a>
### `status`

**概要:** `ai-i18n-tools status [--max-columns <n>]`

`features.translateUIStrings`がオンの場合、ロケールごとのUIカバレッジ（`Translated` / `Missing` / `Total`）を出力します。次に、ファイル×ロケールごとのMarkdown翻訳ステータスを出力します（`--locale`フィルタはなし、ロケールは設定から取得）。`features.translateJson`がオンで`json[]`が設定されている場合、ブロックごとのJSONバンドルステータスも出力します。ロケールリストが大きい場合は、ターミナルで行が狭くなりすぎないよう、最大`n`ロケール列の繰り返しテーブルに分割されます（デフォルト**9**）。

**主なオプション:** `--max-columns`

---

<a id="statistics"></a>
### `statistics`

**概要:** `ai-i18n-tools statistics [--max-columns <n>]`

ドキュメントキャッシュおよび`strings.json`の統計（翻訳ダッシュボード → 統計と同じ集計）を出力します。`--max-columns`: モデル×ロケールテーブルあたりの最大ロケール列数（デフォルト**6**）。

**主なオプション:** `--max-columns`

**関連項目:** [ダッシュボードの統計](/guide/translation-dashboard/statistics)
