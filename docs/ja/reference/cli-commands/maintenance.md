<a id="cli--cache-maintenance"></a>
# CLI — キャッシュのメンテナンス

<a id="cleanup"></a>
### `cleanup`

**概要:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

`markdown_source_issues`テーブル全体をクリアし、その後`sync --force-update`（抽出、UI、SVG、ドキュメント、および有効な場合は`translate-json`）を実行して、現在設定されているドキュメントのMarkdownの問題が再生成されるようにします。その後、次の処理を行います。

- 古いセグメント行（nullの`last_hit_at` / 空のファイルパス）を削除します。
- 解決されたソースパスがディスク上に存在しない`file_tracking`行を破棄します。
- `filepath`メタデータが欠落しているファイルを指している翻訳行を削除します。
- 孤立した`translation_failures`行を削除します。
- 設定に存在しないロケールのキャッシュ行（`sourceLocale`、ルート`targetLocales`、およびブロックごとの`docs[]` / `json[]` `targetLocales`）を破棄します。

廃止されたロケールに対してはキャッシュのみが対象となり、生成されたドキュメント、フラットUIファイル、および`strings.json`エントリはそのまま残されます（これらを削除するには[`purge-locale`](#purge-locale)を使用します）。同期後、削除数（古いセグメント、孤立した`file_tracking`、孤立した翻訳、孤立した失敗、未設定のロケール）と事前のMarkdown問題クリア数がログに記録されます。

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

`translations`、`file_tracking`、および`translation_failures`から指定されたロケールのすべてのキャッシュ行を削除し、そのロケール用に生成された成果物も削除します。これには、翻訳されたドキュメント（`docs[]`から解決された`.md` / `.mdx` / `.astro`出力。ソースが削除された孤立した出力も含む — カスタム`pathTemplate`が設定されている場合を除き、各ブロックの出力ツリーをスキャンして見つけられます）、ロケールごとのフラットUIファイル（`<flatOutputDir>/<locale>.json`）、および`strings.json`内のロケールのエントリが含まれます。

ロケールは、繰り返し指定可能な `-l` / `--locale` で渡します (BCP-47 に正規化されます)。ロケールごとのカウント (キャッシュ行、ドキュメント、`strings.json` エントリ、フラットファイル) を出力し、パージ対象がないロケールについては警告を出力します (エラーにはなりません)。`-y` / `--yes` / `-f` / `--force` が指定されていない限り、確認プロンプトが表示されます。`--dry-run`: カウントと削除されるファイルを報告しますが、何も削除しません。`--keep-files`: 生成されたファイルと `strings.json` はそのまま残し、SQLite キャッシュのみをパージします。`--backup <path>` が渡されない限り、SQLite のバックアップは作成されません。このオプションを渡すと、削除前にそのパスへバックアップが書き込まれます。

**主なオプション:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
