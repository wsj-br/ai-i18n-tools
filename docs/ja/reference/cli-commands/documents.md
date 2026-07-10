<a id="cli--documents"></a>
# CLI — ドキュメント

<a id="translate-docs"></a>
### `translate-docs`

**概要:** `ai-i18n-tools translate-docs [options]`

markdown、MDX、`.astro`、オプションのDocusaurusカタログJSON（`docusaurusCatalogDir`）、オプションのNextra `_meta.ts`/辞書`.ts`、および各`docs`ブロックのオプションのVitePressテーマカタログを翻訳します。

**主なオプション:** `-l`、`-j`、`-b`、`--prompt-format`、`--force`、`--force-update`、`-p` / `-f`、`--dry-run`

`-j`: 最大並列ロケール数。`-b`: ファイルあたりの最大並列バッチAPI呼び出し数。`--prompt-format`: バッチワイヤーフォーマット（`xml` | `json-array` | `json-object`）。

**関連項目:** [キャッシュの動作と`translate-docs`フラグ](/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)、[バッチプロンプトフォーマット](/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**概要:** `ai-i18n-tools write-heading-ids [options]`

少なくとも1つの`docs[]`ブロックが必要です。各ブロックの`contentPaths`配下で`.md` / `.mdx`を収集します（`.translate-ignore`を考慮します）。各フラットATX `#`見出しの直前にHTMLアンカー行`<a id="slug"></a>`を挿入します（フェンスコードブロック内の見出しはスキップ）。アンカー行が既に存在する場合、現在の見出しテキストから導出されたスラッグと一致しなくなった`id`を更新します。

**主なオプション:** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--dry-run`

`--slug-style`: `github`（デフォルト、doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`。`pymdown`の場合、オプションの`--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。

**関連項目:** [アンカーリンク](/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**概要:** `ai-i18n-tools check-markdown [options]`

各`docs[]`ブロックの`contentPaths`配下のmarkdown/MDXをスキャンします（`translate-docs`と同じ検出方法、`.translate-ignore`を考慮）：デリミタのペアリング、未閉じのインラインコード、および`**`/`__`が`[text](url)`リンクを囲む場合の`STRONG_OUTSIDE_LINK`。

`relativePath:line: [ISSUE_CODE] message`行をstderrに出力します。問題がある場合は終了コード**1**。`--json`: stdoutにJSONレポートを出力します。`--no-cache`がない限り、`cacheDir`に`markdown_source_issues`を書き込みます。`-v`はstderr行にソースハッシュを追加します。

**主なオプション:** `-p` / `--path`、`-f` / `--file`、`--json`、`--no-cache`

**関連項目:** [Markdownの問題](/guide/translation-dashboard/markdown-issues)
