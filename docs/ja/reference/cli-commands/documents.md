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

少なくとも1つの`docs[]`ブロックが必要です。各ブロックの`contentPaths`の下に`.md` / `.mdx`を収集します（`.translate-ignore`を尊重します）。デフォルトでは、各フラットATX `#`見出しの直前にHTMLアンカーライン`<a id="slug"></a>`を挿入します（フェンス付きコードブロック内の見出しはスキップされます）。既存の見出しID（HTMLアンカーライン、従来の`{#id}`サフィックス、MDX `{/* #id */}`コメントなど、あらゆる形式）は、選択されたスタイルに置き換えられます。スラッグは常に見出しの現在のテキストから派生します。複数のHTMLアンカーが1つの見出しの上に積み重ねられている場合、現在の見出しテキストのアンカーのみが保持され、削除されたIDを指していたリポジトリ内のMarkdownリンクは、残っているIDに更新されます。見出しの直上にない`<a id>`はそのまま残されます。`--slug-style mdx-comment`を使用すると、代わりにDocusaurus MDXコメントサフィックスを見出し行に書き込み（同じGitHubスタイルのスラッグアルゴリズム）、先行するHTMLアンカーブロックが存在する場合は削除します。`--remove`は、これらの見出しID形式をすべて削除し、その場所に何も書き込みません。

ソースファイルを更新した後、コマンドは各ロケールの既存の翻訳済みマークダウンも走査します (`translate-docs` と同じ `docsOutput` パスマッピング)。ドキュメントの順序で、一致する ATX 見出しに **ソースロケール**の見出し ID をコピーし (翻訳されたタイトルがスラッグ化されることはありません)、見出しの途中にある `{#id}` / `{/* #id */}` (または不正な場所にある HTML `<a id>`) を Docusaurus / 選択したスタイルが期待する形式に戻します。ソース言語は `sourceLocale` で、任意の言語を指定できます。翻訳ファイルが見つからない場合はスキップされます。`--remove` は、行の途中に誤って配置されたトークンを含め、それらの翻訳済みファイルからも見出し ID を削除します。

翻訳済みファイルの見出し ID が再配置または修復されたとき、ソース、古い翻訳コンテンツ、新しい翻訳コンテンツのセグメント数が同じであれば、(ソースセグメントのハッシュをキーとする) 一致するキャッシュ済みの翻訳セグメントも更新されます。セグメント数が一致しない場合、そのファイルとロケールはスキップされます。その後の `sync --force-update` で、更新されたキャッシュ行からファイルが再構築されます。

**主なオプション:** `-p` / `--path`、`-f` / `--file`、`--slug-style`、`--remove`、`--dry-run`

`--slug-style`: `github`（デフォルト、doctoc / anchor-markdown-header）、`bitbucket`、`gitlab`、`pymdown`、`azure-devops`、`mdx-comment`（Docusaurus `{/* #… */}`サフィックス）。`pymdown`、オプションの`--pymdown-case`、`--pymdown-normalize`、`--pymdown-percent-encode` / `--no-pymdown-percent-encode`。`--remove`は`--pymdown-*`と組み合わせることはできません。

**関連項目:** [アンカーリンク](/ja/guide/documents/anchor-links)

---

<a id="check-markdown"></a>
### `check-markdown`

**概要:** `ai-i18n-tools check-markdown [options]`

各`docs[]`ブロックの`contentPaths`配下のmarkdown/MDXをスキャンします（`translate-docs`と同じ検出方法、`.translate-ignore`を考慮）：デリミタのペアリング、未閉じのインラインコード、および`**`/`__`が`[text](url)`リンクを囲む場合の`STRONG_OUTSIDE_LINK`。

`relativePath:line: [ISSUE_CODE] message`行を標準エラー出力に表示します。問題が見つかった場合、コード**1**で終了します。`--json`: 標準出力にJSONレポートを出力します。`--no-cache`でない限り、`cacheDir`に`markdown_source_issues`を書き込みます。`-v`は、標準エラー出力の行にソースハッシュを追加します。

**主なオプション:** `-p` / `--path`、`-f` / `--file`、`--json`、`--no-cache`

**関連項目:** [Markdownの問題](/ja/guide/translation-dashboard/markdown-issues)
