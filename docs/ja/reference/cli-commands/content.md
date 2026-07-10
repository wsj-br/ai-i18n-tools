<a id="cli--other-content"></a>
# CLI — その他のコンテンツ

<a id="translate-json"></a>
### `translate-json`

**概要:** `ai-i18n-tools translate-json [options]`

`json[]` に従ってネストされたJSONを翻訳します（`features.translateJson` が必要）。共有SQLiteキャッシュ。

**主なオプション:** `-l`, `-p` / `--path`, `--dry-run`, `--force`, `--force-update`, `-b`, `--prompt-format`

**関連項目:** [JSON](/guide/json)

---

<a id="translate-svg"></a>
### `translate-svg`

**概要:** `ai-i18n-tools translate-svg [options]`

`config.svg` で設定されたSVGファイルを翻訳します（ドキュメントとは別）。`features.translateSVG` が必要。ドキュメントと同じキャッシュの考え方を使用し、`--no-cache` をサポートしてその実行中のSQLiteの読み取り/書き込みをスキップします。

**主なオプション:** `-j`, `-b`, `--force`, `--force-update`, `-p` / `--path`, `--dry-run`, `--no-cache`

**関連項目:** [SVG翻訳](/guide/svg-translation/)
