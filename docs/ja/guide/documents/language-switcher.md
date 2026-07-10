<a id="language-switcher-languagelistblock"></a>
# 言語スイッチャー (`languageListBlock`)

翻訳されたMarkdownファイルに、**"Read in other languages"** のリンク行（ロケールごとに1つのリンク）を含める場合は、`docsOutput.postProcessing.languageListBlock`を使用します。この場合、`href`の値は各出力ファイルに対して相対的に計算されます。

このリポジトリでは、[README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (`translated-docs/` の下のフラット出力) に使用しています。`translate-docs` の後、翻訳された各コピーは更新されたブロックを取得します。たとえば、[translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) は、`translated-docs/` の下の兄弟ロケールファイルと、リポジトリルートの英語ソースにリンクします。

`docsOutput.style = "flat"` (または兄弟ロケールファイルが相対パスでアドレス指定できる別のレイアウト) が必要です。[出力レイアウト](/ja/guide/documents/output-layouts) を参照してください。

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. ソースマークダウンでブロックをマークする

スイッチャーを、`start` および `end` の部分文字列マーカーで囲まれたHTML（または任意の行）で囲みます。このリポジトリでは以下を使用しています。

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/ja/) · [Deutsch](./README.de.md) · …</small>
```

初期のリンクテキストはプレースホルダーです。`translate-docs` は、最初に `start` を含む行から、その後に現れる最初の `end` を含む行までを完全に置き換えます（コードブロック内のマーカーは無視されるため、同じファイル内の設定例などが対象になることはありません）。

<a id="2-configure-the-block"></a>
## 2. ブロックを構成する

`start` および `end` は任意の部分文字列マーカーです。`<small id="lang-list">` / `</small>` である必要はありません。言語スイッチャーブロック内でのみ出現する開始・終了テキストを自由に選択できます。たとえば別のHTMLタグ（`<div class="lang-switcher">` … `</div>`）、HTMLコメント（`<!-- lang-list -->` … `<!-- /lang-list -->`）、またはMarkdown専用の境界（たとえば `**Languages:**` から `---` までの行）などです。ソースファイルに記述した内容と完全に一致するように、設定ファイル内の `start` および `end` を設定してください。

ルート設定 ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| フィールド       | 機能                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | ブロックの開始行を識別する部分文字列                                                  |
| `end`       | 終了行の部分文字列（開始と終了が同一行にある場合は、`start` と同じ行に置くことも可能）             |
| `separator` | 生成された `[label](href)` リンク間に挿入されるテキスト（このリポジトリでは `" · "` を使用）                                    |
| `label`     | 任意：`"local"`（デフォルト）はマニフェストの各ロケールの自国語表記を使用。`"english"` は `englishName` を使用 |

<a id="3-what-happens-at-runtime"></a>
## 3. 実行時に何が起こるか

1. **抽出** — 言語リストのスライスはモデルに**送信されません**（`translatable: false`）。
2. **翻訳ファイルごとの処理** — セグメントの翻訳およびオプションのフラットリンク書き換えの後、`postProcessing` がブロックを再構築します。ロケールごとに1つのMarkdownリンクを作成し、ラベルは `ui-languages.json` が存在する場合はそこから取得（ない場合はバンドルされたマスターカタログ、または `localeDisplayNames` を使用）、パスは書き込み対象ファイルからの相対パスで設定されます。
3. **ソースの更新** — `translate-docs` / `sync` ドキュメント処理の最後に、同じ標準ブロックが `contentPaths` の**英語ソースファイル** に再書き込みされます。これにより、新しいロケールを追加しても、すべてのリンクを手動で編集せずにリポジトリ内のスイッチャーを更新できます。

ファイルに一致するブロックが存在しない場合、CLIは警告をログ出力します（`--verbose` 時）が、本文は変更されません。

<a id="4-label-manifest"></a>
## 4. ラベルマニフェスト

内名ラベル（`label: "local"`）については、`generate-ui-languages` を介して `ui-languages.json` を生成または維持します（[`languagesManifestPath`](/ja/reference/configuration#languagesmanifestpath-optional) に書き込まれ、デフォルトは `{ui.flatOutputDir}/ui-languages.json` です）。このリポジトリのドキュメント専用設定にはUIパイプラインがなく、ディスク上にプロジェクトマニフェストも存在しないため、ラベルは `sourceLocale` + `targetLocales` のバンドルされたマスターカタログから取得されます。

<a id="5-examples-in-this-repository"></a>
## 5. このリポジトリの例

| 例                                 | ファイル                                                                                                                                                                                             |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| このパッケージ (フラットな README + VitePress サイト) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (README ブロック: `docsOutput.style = "flat"`; サイト ブロック: `docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |
| フラット README + Docusaurus ドキュメント | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (2 番目のブロック: `docsOutput.style = "flat"`; 最初のブロック: `docsOutput.style = "docusaurus"`) |
| Docusaurus ドキュメントのみ               | [examples/docusaurus-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json) (`docsOutput.style = "docusaurus"` + `docusaurusCatalogDir`) |
| VitePress ドキュメント (最小限のデモ)      | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

`<small id="lang-list">` の直前の行（例：`**Read in other languages:**`）は通常の翻訳対象セグメントであり、各ターゲットロケールでローカライズされます。マーカー内のリンク行は、`href` およびマニフェスト駆動のラベルを除き、そのまま再生成されます。
