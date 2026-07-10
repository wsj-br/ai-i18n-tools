<a id="cli--models--catalog"></a>
# CLI — モデルとカタログ

<a id="check-models"></a>
### `check-models`

**概要:** `ai-i18n-tools check-models`

設定された各モデルIDを、アクティブなプロバイダーの`GET /models`リスト（メンバーシップと`expiration_date`）に対して検証します。そのプロバイダーのAPIキーが必要です（Ollamaのようなキー不要のプロバイダーでは不要）。設定されたIDのいずれかが欠落しているか期限切れの場合、非ゼロで終了し、プロバイダーの`requestTimeoutMs`を尊重します。プロバイダーが価格を返す場合（例: OpenRouter）、プロンプト/補完の100万トークンあたりのUSDも表示します。

**関連項目:** [LLMプロバイダー](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**概要:** `ai-i18n-tools list-models`

アクティブなプロバイダーが`GET /models`リスト経由で公表しているすべてのモデルをリスト表示します（ID順にソート、アクティブなプロバイダーは設定の`provider`キーに従いますが、`-P` / `--provider`で上書き可能）。そのプロバイダーのAPIキーが必要です（Ollamaのようなキー不要のプロバイダーでは不要）。プロバイダーが価格を返す場合（例: OpenRouter）、プロンプト/補完の100万トークンあたりのUSDも表示し、`expiration_date`を過ぎたエントリにタグを付けます。

**主なオプション:** `-P` / `--provider`

**関連項目:** [LLMプロバイダー](/guide/providers-and-models)

---

<a id="bench-models"></a>
### `bench-models`

**概要:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

1つのサンプルを個別に翻訳することで、設定された各モデルのベンチマークを行います（単一モデルクライアント、フォールバックチェーンなし）。モデルID、入力/出力トークン、実経過翻訳時間、USDコスト（コストを報告しないプロバイダーの場合は`—`）の表に加え、合計行とモデルごとの失敗を出力します。

モデルはデフォルトで、アクティブなプロバイダーの`translationModels`、`uiModels`、`localeModels`のIDの和集合になります（`--model`で上書き）。サンプルはデフォルトで組み込みの英語マークダウンブロックになります（`--text` / `--file`で上書き）。ソース/ターゲットはデフォルトで設定の`sourceLocale`と最初の`docs[]`ターゲットロケールになり、トップレベルの`targetLocales`にフォールバックします（`--source` / `--target`で上書き）。モデルは並行して実行され、設定の`concurrency`（デフォルトは4）によって制限されます。ただし、各モデルは個別に計時されます。アクティブなプロバイダーのAPIキーが必要です。

**主なオプション:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**概要:** `ai-i18n-tools list-languages [search]`

バンドルされているUI言語カタログ（`data/ui-languages-complete.json`）を人間が読める形式の表（コード、テキスト方向、英語名、ネイティブ名）としてリスト表示します。設定やAPIキーは不要です。オプションの`search`用語を渡すと、コード、ネイティブ名、英語名、または方向にそれが含まれるエントリのみを保持します（大文字小文字を区別しません）。例: `list-languages portuguese`, `list-languages rtl`, `list-languages zh`。
