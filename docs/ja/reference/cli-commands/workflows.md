<a id="cli--workflows--reporting"></a>
# CLI — ワークフローとレポート

<a id="sync"></a>
### `sync`

**概要:** `ai-i18n-tools sync [options]`

抽出（有効な場合）、次にUI翻訳、次に`features.translateSVG`と`config.svg`が設定されている場合の`translate-svg`、次にドキュメント翻訳、次に`features.translateJson`と`json[]`が設定されている場合の`translate-json` — ただし`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`でスキップされた場合を除きます。

**主なオプション:** `-l`, `-p` / `-f`, `--dry-run`, `-j`, `-b`, `--force`, `--force-update`, `--check-cache`, `--no-ui`, `--no-svg`, `--no-docs`, `--no-json`

`--force`は、ドキュメント、JSON、SVGのセグメントキャッシュとファイル追跡をクリアします。これはUI翻訳には転送されません。`strings.json`を再翻訳するには、`translate-ui --force`または`sync-ui --force`を使用してください。`--force-update`はドキュメント、JSON、SVG（UIは除く）に適用されます。`--no-ui`、`--no-svg`、`--no-docs`、`--no-json`は、1回の実行でその手順をスキップします。`--file`は翻訳するファイルを制限し、ドキュメントブロック内のすべてのマークダウンファイルを使用してフラットな兄弟リンクを書き換えます。`--check-cache`はドキュメント、JSON、SVGに転送されます。ファイル追跡がスキップする場合でも、強制ネイティブスクリプトが設定されているロケールに対してキャッシュされたセグメントを再検証します。ドキュメントフェーズでは、`--emphasis-placeholders`も転送されます（`translate-docs`と同じ意味です）。グローバルな`--debug-failed`は、チェーン内のすべてのモデルが失敗した場合だけでなく、破棄された各モデルの試行（SVG/ドキュメントスクリプトのフォールバックを含む）について、`cacheDir`の下に`FAILED-TRANSLATION`ログを書き込みます。`--prompt-format`は`sync`フラグではありません。ドキュメントとJSONの手順は、組み込みのデフォルト（`json-array`）を使用します。

---

<a id="status"></a>
### `status`

**概要:** `ai-i18n-tools status [--max-columns <n>]`

`features.translateUIStrings` がオンの場合、ロケールごとの UI カバレッジ（`Translated` / `Missing` / `Placeholder issues` / `Total`）を出力します。`Placeholder issues` は、保存された翻訳がプレースホルダーの名前を変更したり、削除したり、新しく作成したり、ターゲットを変更したりする行をカウントします。次に、ファイル × ロケールごとの Markdown 翻訳ステータスを出力します（`--locale` フィルターなし。ロケールは設定から取得されます）。`features.translateJson` がオンで `json[]` が設定されている場合、ブロックごとの JSON バンドルステータスも出力します。大規模なロケールリストは、ターミナルで表示される行が狭く保たれるように、最大 `n` 個のロケール列（デフォルトは **9**）を持つ繰り返しテーブルに分割されます。

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
