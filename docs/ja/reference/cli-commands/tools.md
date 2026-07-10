<a id="cli--tools"></a>
# CLI — ツール

<a id="dashboard"></a>
### `dashboard`

**概要:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

翻訳ダッシュボード（キャッシュセグメント、`strings.json`、用語集、失敗、統計情報用のローカルWeb UI）を起動します。デフォルトのポートは**8675**です（利用不可の場合は次のポートを再試行します）。`--no-open`を指定すると、デフォルトのブラウザは自動的に開かれません。非推奨のエイリアス`editor`は引き続き機能しますが、警告が出力されます。

**主なオプション:** `-p` / `--port`, `--no-open`

**関連項目:** [翻訳ダッシュボード](/ja/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**概要:** `ai-i18n-tools glossary-generate [-o <path>]`

空の`glossary-user.csv`テンプレートを書き出します。既存のファイルの上書きは拒否されます（終了コード**1**）。

**主なオプション:** `-o` / `--output`

`-o`: 出力パスを上書きします（デフォルト: 設定からの`glossary.userGlossary`、または`glossary-user.csv`）。

**関連項目:** [ダッシュボード用語集](/ja/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**概要:** `ai-i18n-tools help [command]`

サブコマンドのヘルプを表示します（`ai-i18n-tools <command> --help`と同じ出力です）。
