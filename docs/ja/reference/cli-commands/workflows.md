<a id="cli--workflows--reporting"></a>
# CLI — ワークフローとレポート

<a id="sync"></a>
### `sync`

**概要:** `ai-i18n-tools sync [options]`

抽出（有効な場合）、次にUI翻訳、次に`features.translateSVG`と`config.svg`が設定されている場合の`translate-svg`、次にドキュメント翻訳、次に`features.translateJson`と`json[]`が設定されている場合の`translate-json` — ただし`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`でスキップされた場合を除きます。

**主なオプション:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force`はUIおよびSVGステップに加えdocs/JSONにも転送されます。`--force-update`はdocs、JSON、SVGに適用されます（UIには適用されません）。`--check-cache`はdocs、JSON、SVGに転送され、ファイル追跡でスキップされる場合でも、ネイティブスクリプトが強制されるロケールのキャッシュされたセグメントを再検証します。docsフェーズでは`--emphasis-placeholders`も転送されます（`translate-docs`と同じ意味）。グローバルな`--debug-failed`は、チェーン内のすべてのモデルが失敗した場合だけでなく、破棄された各モデルの試行（SVG/docsスクリプトのフォールバックを含む）に対して`cacheDir`配下に`FAILED-TRANSLATION`ログを書き出します。`--prompt-format`は`sync`フラグではありません。docsおよびJSONステップは組み込みのデフォルト（`json-array`）を使用します。

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

**関連項目:** [ダッシュボード統計](/ja/guide/translation-dashboard/statistics)

---

<a id="usage"></a>
### `usage`

**概要:** `ai-i18n-tools usage [--since <when>] [--provider <name>] [--model <id>] [--operation <name>] [-l <code>] [--outcome accepted|discarded] [--clear] [--older-than <when>] [--dry-run]`

記録されたモデルのAPI呼び出し統計（呼び出し回数、トークン数、および単一のUSDコスト）を出力します。コストは、存在する場合はプロバイダーの`usage.cost`（`0`を含む）が使用され、それ以外の場合はそのモデルの`providers.<name>.modelPricing`、それ以外の場合はプロバイダー全体の`providers.<name>.pricing`デフォルト、それ以外の場合はそのモデルIDに対するmodels.devの入出力リスト価格が使用されます。報告済みのコストおよび明示的な設定レートは置き換えられません。不明なコストは`—`のままとなり、`$0.00`になることはありません。新しい呼び出しは金額を保存します。トークン数はあるが保存されたコストがない古い行は、レポート実行時に推定されます。集計は「Translation Dashboard → Usage & costs」と同じです。UTCで7暦日以上経過した詳細行は月次の`api_totals`にまとめられ、レポートは両方のテーブルを結合します。`--since`は、`YYYY-MM-DD`、期間（`30m`、`1h`、`6h`、`12h`、`24h`、`7d`、`30d`）、または暦月の期間（`1mo`、`2mo`、`3mo`）を受け付けます。`--clear`は詳細行と月次合計を削除します（`--older-than`は`1mo`、`2mo`、`3mo`、`6mo`、`1y`、または`all`です。`--dry-run`は削除せずに件数を報告します）。

**主なオプション:** `--since`, `--provider`, `--model`, `--operation`, `-l` / `--locale`, `--outcome`, `--clear`, `--older-than`, `--dry-run`

**関連項目:** [ダッシュボードの使用量とコスト](/ja/guide/translation-dashboard/usage)
