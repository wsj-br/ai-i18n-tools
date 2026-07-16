<a id="cli--cache--maintenance"></a>
# CLI — キャッシュ & メンテナンス

<a id="cleanup"></a>
### `cleanup`

**概要:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

`markdown_source_issues`テーブル全体をクリアし、次に`sync --force-update`を実行して（有効な場合は抽出、UI、SVG、ドキュメント、および`translate-json`）、現在構成されているドキュメントのマークダウン問題が再生成されるようにします。その後、古いセグメント行（nullの`last_hit_at` / 空のファイルパス）を削除し、ディスク上に解決されたソースパスが存在しない`file_tracking`行を破棄し、`filepath`メタデータが欠落しているファイルを指している翻訳行を削除し、孤立した`translation_failures`行を整理し、構成に存在しないロケールのキャッシュ行（`sourceLocale`、ルート`targetLocales`、およびブロックごとの`docs[]` / `json[]` `targetLocales`）を破棄します。廃止されたロケールのキャッシュのみ — 生成されたドキュメント、フラットUIファイル、および`strings.json`エントリはそのまま残されます（それらを削除するには[`purge-locale`](#purge-locale)を使用してください）。同期後に整理数（古いセグメント、孤立した`file_tracking`、孤立した翻訳、孤立した失敗、未構成のロケール）と前処理のマークダウン問題クリア数をログに記録します。

**主なオプション:** `--dry-run`, `--backup`

`--backup <path>`は変更前にSQLiteバックアップをそのパスに書き出します（このフラグが設定されない限りバックアップは作成されません）。

---

<a id="clean-temp"></a>
### `clean-temp`

**概要:** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

設定はありません。ディレクトリツリー（デフォルト: cwd）を走査して`*.log`、`*.tmp`、`cache.db.backup*.sqlite`を探し、`find -print`のような`./…`パスを出力します。一致がある場合: `-f` / `--force`（プロンプトなしで削除）が指定されない限り`Delete these files? (y/n)`で確認を求めます。一致がない場合: プロンプトなしで終了します。`--dry-run`: リストのみ、プロンプトや削除は行いません（`--force`より優先）。

**主なオプション:** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**概要:** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

指定されたロケールのすべてのキャッシュ行を`translations`、`file_tracking`、`translation_failures`から削除し、そのロケールの生成成果物も削除します: 翻訳ドキュメント（`docs[]`から解決された`.md` / `.mdx` / `.astro`出力、ソースが削除された孤立した出力を含む — カスタム`pathTemplate`が設定されている場合を除き、各ブロックの出力ツリーをスイープして検出）、ロケールごとのフラットUIファイル（`<flatOutputDir>/<locale>.json`）、および`strings.json`内のそのロケールのエントリ。

ロケールは繰り返し可能な`-l` / `--locale`で渡されます（BCP-47に正規化）。ロケールごとのカウント（キャッシュ行、ドキュメント、`strings.json`エントリ、フラットファイル）を出力します。パージ対象がないロケールについては警告します（エラーにはしません）。`-y` / `--yes` / `-f` / `--force`が指定されない限り確認を求めます。`--dry-run`: カウントと削除されるファイルを報告し、何も削除しません。`--keep-files`: SQLiteキャッシュのみをパージし、生成ファイルと`strings.json`はそのまま残します。`--backup <path>`が渡されない限りSQLiteバックアップは作成されず、渡された場合は削除前にバックアップをそのパスに書き出します。

**主なオプション:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
