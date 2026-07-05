<a id="output-layouts"></a>
# 出力レイアウト

`docsOutput.style` は翻訳されたmarkdownファイルの出力先を制御します。以下の文字列値を `docs[].docsOutput.style` で正確に使用してください（エイリアスは別個のエンジンではなく、あらかじめ設定されたレイアウトです）。

`docsOutput.style = "nested"`（省略時のデフォルト）— ソースツリーを `{outputDir}/{locale}/` 配下にミラーします（例：`docs/guide.md` → `i18n/de/docs/guide.md`）。

`docsOutput.style = "doc-system"` — 静的ドキュメントサイト向けのロケール接頭辞付きドキュメントツリー。`docsRoot` 配下のファイルは `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` に出力されます。`docsRoot` 外のパスはネストされたレイアウトにフォールバックします。`docs[].docsOutput.docsRoot` を英語ソースのルートに設定してください（例：`"docs"` または `"src/content/docs"`）。`docsOutput.style = "doc-system"` の場合、`localeSubpath` を明示的に設定する必要があります（事前設定されたエイリアスを使用してください）。

**エイリアス**（同じレイアウトエンジン、プリセット済み `localeSubpath`）：

- `docsOutput.style = "docusaurus"` — `localeSubpath`は`docusaurus-plugin-content-docs/current`（Docusaurus i18nプラグインレイアウト）にデフォルトします。
- `docsOutput.style = "astro-starlight"` — `localeSubpath`は`""`（翻訳されたページは`{outputDir}/{locale}/`の直下に配置され、[Starlight](https://starlight.astro.build/guides/i18n/)と一致し、`outputDir`が`docsRoot`に等しい場合）にデフォルトします。
- `docsOutput.style = "vitepress"` — `doc-system`と同じレイアウトですが、`localeSubpath`は空です。BCP-47ロケールフォルダ名は保存されます（`localePathLowercase`は`false`にデフォルトします）。[VitePress統合](/guide/vitepress-integration)を参照してください。

Docusaurus プリセット（主なドキュメントページ）：

```text
docs/guide.md  →  i18n/de/docusaurus-plugin-content-docs/current/guide.md
```

Starlight プリセット（同じブロック構造、異なるパス）：

```text
src/content/docs/guide.md  →  src/content/docs/de/guide.md
```

VitePressプリセット（コンテンツルートに英語、ソースの隣にロケールフォルダー）:

```text
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

オプションのJSONラベル — `docusaurusCatalogDir` からのDocusaurusシェル文字列（MDX本文コピーではない）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlightは多数のロケール向けUI文字列を提供しています。必要に応じて、カスタムUIの上書きには、別個の `docs[]` ブロック内で `src/content/i18n/en.json` と `jsonPathTemplate: "{outputDir}/{locale}.json"` を使用します。

VitePressのナビゲーション/サイドバー/フッター文字列はMarkdownにはありません。`docs/.vitepress/i18n/theme.en.json`を作成し、JSON（`json[]`、`features.translateJson`）で翻訳します。「[VitePress統合](/guide/vitepress-integration)」を参照してください。

`docsOutput.style = "flat"` — 翻訳されたファイルをロケールサフィックス付きでソース横に、またはサブディレクトリ内に配置します。`docsOutput.style = "flat"` の場合、ページ間の相対リンクは自動的に書き換えられます（`rewriteRelativeLinks: false` またはカスタムの `pathTemplate` が設定されていない限り）。

```text
docs/guide.md → i18n/guide.de.md
```

フラットレイアウトでのページ間アンカーリンクについては、[アンカーリンク](/guide/documents/anchor-links)を参照してください。

組み込みの相対リンク修正以外のリンクとアセットURLの書き換えについては、[リンクの書き換え](/guide/documents/link-rewriting)（`docsOutput.postProcessing.regexAdjustments`）を参照してください。

翻訳されたページでのスクリーンショットとラスターアセットについては、[画像とスクリーンショット](/guide/images-and-screenshots/)を参照してください。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` プレースホルダー

翻訳されたファイルの書き込み先をオーバーライドするには、`docs[].docsOutput.pathTemplate` (Markdown および MDX) または `jsonPathTemplate` (JSON ラベルファイル) を設定します。どちらも同じプレースホルダーを受け入れます。解決されたパスは、そのブロックの `outputDir` 内に留まる必要があります (CLI はそれをエスケープするパスを拒否します)。

カスタム `pathTemplate` を使用する場合、明示的に設定しない限り `rewriteRelativeLinks` はデフォルトで `false` になります — 相対リンクの再書き込みは、カスタムテンプレートなしの `docsOutput.style = "flat"` 向けに設計されています。

組み込みレイアウト（`nested`、`flat`、`doc-system`、カスタムテンプレートなし）では、`docsOutput.localePathLowercase` を `true` に設定することで、ロケールのフォルダーやファイル名のセグメントを小文字で出力できます（例：`pt-BR` の代わりに `pt-br`）。`astro-starlight` エイリアスはこれをデフォルトで `true` に設定します。カスタムの `pathTemplate` / `jsonPathTemplate` 値は変更されません — BCP-47 形式の `{locale}` を維持しつつ小文字のセグメントが必要な場合は、そちらで `{llocale}` を使用してください。

| プレースホルダー            | 役割                                                                                                       | 例                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| `{outputDir}`          | このドキュメントブロックの `outputDir` の絶対解決パス                                           | `/home/acme/repo/i18n`                                           |
| `{locale}` | ターゲットロケールコード（設定/CLIと同じ形式） | `de`, `pt-BR` |
| `{LOCALE}` | 同じロケールを大文字にしたもの | `DE`, `PT-BR` |
| `{llocale}`            | 同じロケールを小文字にしたもの（`pt-br`、`zh-cn` などの Astro ルートフォルダと一致）                               | `de`、`pt-br`                                                    |
| `{relPath}` | プロジェクトルートからの相対ソースファイルパス（POSIX `/`） | `docs/guide.md`, `README.md` |
| `{stem}` | 拡張子 **なし**のファイル名 | `guide` for `docs/guide.md` |
| `{basename}` | 拡張子付きのファイル名 **with** | `guide.md` |
| `{extension}` | 拡張子 **を含む** ドット | `.md`, `.mdx` |
| `{docsRoot}`           | `docsOutput.docsRoot` の絶対パス（省略時はデフォルトで `docs`）                            | `/home/acme/repo/docs`                                           |
| `{relativeToDocsRoot}` | パス文字列が一致する場合、対応する `docsRoot` プレフィックスを削除した `{relPath}`（POSIX準拠）。それ以外の場合は変更なし | `docs/guide.md`（一般的）; 削除が適用される場合のみ `guide.md` |

**例**

設定の抜粋:

```json
{
  "outputDir": "i18n",
  "docsOutput": {
    "pathTemplate": "{outputDir}/{locale}/{relPath}"
  }
}
```

ロケール `de`、ソース `docs/guide.md`、プロジェクトルート `/home/acme/repo`、および `outputDir` が `/home/acme/repo/i18n` に解決される場合、展開されたパスは次のようになります:

```text
/home/acme/repo/i18n/de/docs/guide.md
```

`docsOutput.style = "flat"` とカスタム `pathTemplate` なしの場合、よく使われるパターンとして `{stem}` と `{extension}` を使ってファイル名のみを保持する方法があります（例：`{outputDir}/{stem}.{locale}{extension}`）。これにより、解決された `outputDir` の下に `…/guide.de.md` が出力されます。
