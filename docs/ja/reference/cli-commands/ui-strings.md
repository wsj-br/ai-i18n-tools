<a id="cli--ui-strings"></a>
# CLI — UI文字列

<a id="extract"></a>
### `extract`

**概要:** `ai-i18n-tools extract`

`includeUiLanguageEnglishNames`が有効な場合、`t("…")` / `i18n.t("…")`リテラル、任意の`package.json`記述、および任意のバンドルマスター`englishName`エントリから`strings.json`を更新します（`ui.uiExtractor`を参照。`languagesManifestPath`は読み取りません）。各ブロックの`ui-languages.json`も再生成します。`.html` / `.htm`が`ui.uiExtractor.extensions`にリストされている場合は、HTMLから`data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカー文字列も抽出します。`sourceRoots`を持つすべての`ui`ブロックを走査します。`--ui-block`により、実行対象を1つのブロック（インデックス、記述、または`stringsJson`パス）に制限します。LLMの呼び出しは行いません。

**関連項目:** [UI文字列の概要](/ja/guide/ui-strings/), [プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html)

---

<a id="migrate-intlayer"></a>
### `migrate-intlayer`

**概要:** `ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]`

Intlayerの`*.content.ts`辞書を`strings.json`およびフラットなロケールファイルにインポートし、単純な`useIntlayer` / `getIntlayer`の呼び出し箇所を`t('English source')`に書き換えます。デフォルトではドライランです（レポートは引き続き書き込まれます）。`--write`はカタログをシードし、安全な書き換えを適用します。LLMは呼び出しません。

レポートは`--write`が残したすべてのものの引き継ぎであり、残りの作業を順序付けた**ステップバイステップのTODO**で締めくくられます。これには、各手動サイトに対する具体的な`t()`またはJSX呼び出し、`import { t }`行、辞書ファイルおよび後で削除する`IntlayerProvider`の残留ファイル、`extract`してから`translate-ui`する必要があるソース文字列、そしてアプリのi18nモジュールに貼り付けて上書きするi18nextランタイムブートストラップが含まれます。ロケール制御は`loadLocale`だけでなく`i18n.changeLanguage`も呼び出す必要があります。`extract`は`ui-languages.json`を記述し、そのブートストラップがこれをインポートします。`strings.json`、フラットなロケールファイル、または`ui-languages.json`を手動で編集しないでください。

**主なオプション:** `--write`, `--report`, `--content-glob` (デフォルト `**/*.content.ts`), `--t-import`

**関連情報:** [Intlayerからの移行](/ja/guide/migrating-from-intlayer)

---

<a id="mark-html"></a>
### `mark-html`

**概要:** `ai-i18n-tools mark-html [paths...] [--write]`

ソーステキストが1箇所（要素自体）にのみ記述されるよう、HTMLにbare `data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカーを挿入します。指定されたファイル/ディレクトリ/globパターンをスキャンします（デフォルト：各ブロックの`sourceRoots`配下の`.html` / `.htm`）。デフォルトではドライランとなり（ファイルごとの追加数と、手動での`<span data-i18n>`が必要な混合コンテンツ要素を報告します）、`--write`を指定すると変更が適用されます。冪等性を備え、`data-i18n-ignore`に従い（要素とそのサブツリーをスキップ）、コード系要素（`code`、`pre`、`kbd`、`samp`、`var`）や空文字列/数値のみのテキストには干渉せず、値付きマーカーを出力することもありません。LLMの呼び出しは行いません。

**主なオプション:** `--write`

**関連項目:** [翻訳用のHTMLのマーキング](/ja/guide/ui-strings/plain-html#marking-html-for-translation)

---

<a id="generate-ui-languages"></a>
### `generate-ui-languages`

**概要:** `ai-i18n-tools generate-ui-languages [--master <path>] [--dry-run]`

`sourceLocale` + `targetLocales`とバンドルされた`data/ui-languages-complete.json`（または`--master`）を使用して、`ui-languages.json`を`languagesManifestPath`（デフォルトは`{ui.flatOutputDir}/ui-languages.json`）に書き込みます。マスターファイルにないロケールに対して警告し、`TODO`プレースホルダーを出力します。カスタマイズされた`label`または`englishName`の値を持つ既存のマニフェストがある場合、それらはマスターカタログのデフォルトに置き換えられます。後で生成されたファイルを確認して調整してください。

**主なオプション:** `--master`, `--dry-run`

---

<a id="translate-ui"></a>
### `translate-ui`

**概要:** `ai-i18n-tools translate-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

UI文字列のみを翻訳します（`strings.json` → ロケールJSON）。`features.translateUIStrings`が必要です。

**主なオプション:** `-l` / `--locale`, `--force`, `--dry-run`, `-j` / `--concurrency`

`-l` / `--locale`: カンマ区切りのターゲットロケール（デフォルト: config `targetLocales` から `sourceLocale` を除いたもの）。`--force`: ロケールごとにすべてのエントリを再翻訳（既存の翻訳を無視）。`--dry-run`: 書き込みなし、API呼び出しなし。`-j` は **locales** を並列化し、各ロケール内では config `uiBatchConcurrency`（デフォルト **2**）が LLM バッチ（50文字列のチャンク、続いて複数形グループ）を並列化します。`uiBatchConcurrency` に対応する CLI フラグはありません。

---

<a id="sync-ui"></a>
### `sync-ui`

**概要:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

UI文字列を抽出してから翻訳します (`features.translateUIStrings`が必要)。UIのみ — ドキュメント、SVG、`json[]`は含みません。`translate-ui`と同じ`-l`、`--force`、`--dry-run`、`-j`オプション。

---

<a id="proofread-ui"></a>
### `proofread-ui`

**概要:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

最初に`extract`を実行し（`features.translateUIStrings`が必要）、選択された各カタログをソースと一致させた後、ソースロケールのUI文字列（スペル、文法）に対するLLMレビューを実行します。`--ui-block`により、抽出とレビューの対象を1つのブロックに制限します。用語のヒントは`glossary.userGlossary` CSVからのみ取得されます（`translate-ui`と同じスコープ。UIカタログはフィードバックされないため、不適切なテキストが用語集として定着することはありません）。アクティブなLLMプロバイダー（そのAPIキー環境変数）を使用します。

失敗時（機能フラグの未設定、抽出の失敗、カタログの欠落または無効、APIキーの欠落、あるいは全バッチの失敗）には、**1** で終了します。実行が正常に完了した場合（検出結果はあくまで参考情報です）には、**0** で終了します。`cacheDir` 配下に `proofread-ui-results_<timestamp>.log` を、人が読みやすい形式のレポート（概要、問題点、未レビューの行、および文字列ごとの正常行）として出力します。ターミナルには概要の件数と問題点のみが表示されます（文字列ごとの `[ok]` 行は出力されません）。バッチが失敗した場合、あるいはモデルの応答がバッチより短く、各スロットに利用可能な `index` がない場合は、該当する文字列は未レビューとしてカウントされます。短い配列が誤った文字列に適用されるのを防ぐため、これらの問題点は破棄されます。最終行にはログファイル名が出力されます。`--json` を指定すると、人が読みやすい形式の出力は標準エラー出力に送られます。リンクには、ダッシュボードUIの文字列リンクボタンと同様に `path:line` が使用されます。

**主なオプション:** `-l` / `--locale`, `--chunk` (デフォルト **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**概要:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

`strings.json`をXLIFF 2.0にエクスポートします (ターゲットロケールごとに1つの`.xliff`)。読み取り専用、APIはありません。

**主なオプション:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: 出力ディレクトリ (デフォルト: カタログと同じフォルダ)。`--untranslated-only`: そのロケールの翻訳が欠落しているユニットのみ。
