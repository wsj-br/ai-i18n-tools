<a id="cli--ui-strings"></a>
# CLI — UI文字列

<a id="extract"></a>
### `extract`

**概要:** `ai-i18n-tools extract`

`includeUiLanguageEnglishNames`が有効な場合、`t("…")` / `i18n.t("…")`リテラル、オプションの`package.json`説明、およびオプションのバンドルされたマスター`englishName`エントリから`strings.json`を更新します（`ui.uiExtractor`を参照、`languagesManifestPath`は読み取りません）。また、`languagesManifestPath`で`ui-languages.json`を再生成します。`.html` / `.htm`が`ui.uiExtractor.extensions`にリストされている場合、HTMLから`data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカー文字列もキャプチャします。空でない`ui.sourceRoots`が必要です。LLMは呼び出しません。

**関連項目:** [UI文字列の概要](/guide/ui-strings/), [プレーンHTMLアプリ](/guide/ui-strings/plain-html)

---

<a id="mark-html"></a>
### `mark-html`

**概要:** `ai-i18n-tools mark-html [paths...] [--write]`

ソーステキストが1回（要素自体に）書き込まれるように、裸の`data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカーをHTMLに挿入します。指定されたファイル/ディレクトリ/グロブをスキャンします（デフォルト: `ui.sourceRoots`の下の`.html` / `.htm`）。デフォルトでドライラン（ファイルごとの追加数と、手動の`<span data-i18n>`が必要な混合コンテンツ要素を報告します）。`--write`が変更を適用します。冪等であり、`data-i18n-ignore`を尊重し（要素とそのサブツリーをスキップします）、コードのような要素（`code`, `pre`, `kbd`, `samp`, `var`）や空のテキスト/数値のみのテキストには決して触れず、値を持つマーカーは発行しません。LLMは呼び出しません。

**主なオプション:** `--write`

**関連項目:** [翻訳用のHTMLのマーキング](/guide/ui-strings/plain-html#marking-html-for-translation)

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

`-l` / `--locale`: カンマ区切りのターゲットロケール（デフォルト: 設定`targetLocales`から`sourceLocale`を引いたもの）。`--force`: ロケールごとにすべてのエントリを再翻訳します（既存の翻訳を無視します）。`--dry-run`: 書き込みやAPI呼び出しを行いません。

---

<a id="sync-ui"></a>
### `sync-ui`

**概要:** `ai-i18n-tools sync-ui [-l <codes>] [--force] [--dry-run] [-j <n>]`

UI文字列を抽出してから翻訳します (`features.translateUIStrings`が必要)。UIのみ — ドキュメント、SVG、`json[]`は含みません。`translate-ui`と同じ`-l`、`--force`、`--dry-run`、`-j`オプション。

---

<a id="proofread-ui"></a>
### `proofread-ui`

**概要:** `ai-i18n-tools proofread-ui [-l <code>] [--chunk <n>] [--dry-run] [--json] [-j <n>]`

最初に`extract`を実行し (`features.translateUIStrings`が必要) 、`strings.json`がソースと一致するようにしてから、ソースロケールのUI文字列 (スペル、文法) のLLMレビューを行います。用語のヒントは`glossary.userGlossary` CSVからのみ取得されます (`translate-ui`と同じスコープ — `strings.json` / `uiGlossary`ではないため、悪いコピーが用語集として強化されることはありません)。アクティブなLLMプロバイダー (そのAPIキー環境変数) を使用します。

失敗時 (機能フラグの欠落、抽出の失敗、カタログの欠落/無効、APIキーの欠落、またはすべてのバッチが失敗した場合) には**1**で終了し、実行が正常に完了した場合 (結果は参考情報です) には**0**で終了します。`cacheDir`の下に`proofread-ui-results_<timestamp>.log`を人間が読めるレポート (サマリー、問題、文字列ごとのOK行) として書き込みます。ターミナルにはサマリーのカウントと問題のみを出力します (文字列ごとの`[ok]`行はありません)。最後の行にログファイル名を出力します。`--json`を使用すると、人間向けの出力はstderrに送られます。リンクはダッシュボードのUI文字列リンクボタンのように`path:line`を使用します。

**主なオプション:** `-l` / `--locale`, `--chunk` (デフォルト **50**), `--dry-run`, `--json`, `-j` / `--concurrency`

---

<a id="export-ui-xliff"></a>
### `export-ui-xliff`

**概要:** `ai-i18n-tools export-ui-xliff [-l <codes>] [-o <dir>] [--untranslated-only] [--dry-run]`

`strings.json`をXLIFF 2.0にエクスポートします (ターゲットロケールごとに1つの`.xliff`)。読み取り専用、APIはありません。

**主なオプション:** `-l` / `--locale`, `-o` / `--output-dir`, `--untranslated-only`, `--dry-run`

`-o` / `--output-dir`: 出力ディレクトリ (デフォルト: カタログと同じフォルダ)。`--untranslated-only`: そのロケールの翻訳が欠落しているユニットのみ。
