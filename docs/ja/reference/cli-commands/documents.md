<a id="cli--documents"></a>
# CLI — ドキュメント

<a id="translate-docs"></a>
### `translate-docs`

**概要:** `ai-i18n-tools translate-docs [options]`

markdown、MDX、`.astro`、オプションのDocusaurusカタログJSON（`docusaurusCatalogDir`）、オプションのNextra `_meta.ts`/辞書`.ts`、および各`docs`ブロックのオプションのVitePressテーマカタログを翻訳します。

**主なオプション:** `-l`, `-j`, `-b`, `--prompt-format`, `--force`, `--force-update`, `--check-cache`, `-p` / `-f`, `--dry-run`

`-j`: 最大並列ロケール数。`-b`: ファイルあたりの最大並列バッチAPI呼び出し数。`--prompt-format`: バッチワイヤーフォーマット（`xml` | `json-array` | `json-object`）。

**関連項目:** [キャッシュの動作と`translate-docs`フラグ](/ja/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)、[バッチプロンプトフォーマット](/ja/guide/documents/cli-options#batch-prompt-format)

---

<a id="write-heading-ids"></a>
### `write-heading-ids`

**概要:** `ai-i18n-tools write-heading-ids [options]`

少なくとも1つの`docs[]`ブロックが必要です。各ブロックの`contentPaths`配下の`.md` / `.mdx`を収集します（`.translate-ignore`を尊重）。デフォルトでは、フラットなATX `#`見出しの直前にHTMLアンカー行`<a id="slug"></a>`を挿入します（フェンスされたコードブロック内の見出しはスキップ）。任意の形式の既存の見出しID（HTMLアンカー行、従来の`{#id}`サフィックス、MDX `{/* #id */}`コメント）は選択したスタイルに置き換えられます。スラッグは常に現在の見出しテキストから生成されます。`--slug-style mdx-comment`を指定すると、代わりに見出し行にDocusaurus MDXコメントサフィックスを書き込みます（同じgithubスタイルのスラッグアルゴリズム）。先行するHTMLアンカーが存在する場合は削除します。`--remove`はこれらすべての見出しID形式を削除し、代わりに何も書き込みません。

**主なオプション:** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--remove`、`--dry-run`

`--slug-style`: `github`（デフォルト、doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`、`mdx-comment`（Docusaurus `{/* #… */}`サフィックス）。`pymdown`、オプションの`--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--remove`は`--pymdown-*`と組み合わせることはできません。

**関連項目:** [アンカーリンク](/ja/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**概要:** `ai-i18n-tools check-markdown [options]`

各`docs[]`ブロックの`contentPaths`配下のmarkdown/MDXをスキャンします（`translate-docs`と同じ検出方法、`.translate-ignore`を考慮）：デリミタのペアリング、未閉じのインラインコード、および`**`/`__`が`[text](url)`リンクを囲む場合の`STRONG_OUTSIDE_LINK`。

`relativePath:line: [ISSUE_CODE] message`行をstderrに出力します。問題がある場合は終了コード**1**。`--json`: stdoutにJSONレポートを出力します。`--no-cache`がない限り、`cacheDir`に`markdown_source_issues`を書き込みます。`-v`はstderr行にソースハッシュを追加します。

**主なオプション:** `-p` / `--path`、`-f` / `--file`、`--json`、`--no-cache`

**関連項目:** [Markdownの問題](/ja/guide/translation-dashboard/markdown-issues)
