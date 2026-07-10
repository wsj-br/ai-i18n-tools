<a id="output-layouts"></a>
# 出力レイアウト

`docsOutput.style` は翻訳されたmarkdownファイルの出力先を制御します。以下の文字列値を `docs[].docsOutput.style` で正確に使用してください（エイリアスは別個のエンジンではなく、あらかじめ設定されたレイアウトです）。

`docsOutput.style = "nested"`（省略時のデフォルト）— ソースツリーを `{outputDir}/{locale}/` 配下にミラーします（例：`docs/guide.md` → `i18n/de/docs/guide.md`）。

`docsOutput.style = "doc-system"` — 静的ドキュメントサイト向けのロケール接頭辞付きドキュメントツリー。`docsRoot` 配下のファイルは `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` に出力されます。`docsRoot` 外のパスはネストされたレイアウトにフォールバックします。`docs[].docsOutput.docsRoot` を英語ソースのルートに設定してください（例：`"docs"` または `"src/content/docs"`）。`docsOutput.style = "doc-system"` の場合、`localeSubpath` を明示的に設定する必要があります（事前設定されたエイリアスを使用してください）。

**エイリアス**（同じレイアウトエンジン、プリセット済み `localeSubpath`）：

- `docsOutput.style = "docusaurus"` — `localeSubpath` はデフォルトで `docusaurus-plugin-content-docs/current`（Docusaurus i18n プラグインレイアウト）。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` はデフォルトで `""`（翻訳済みページは `{outputDir}/{locale}/` の直下に配置され、英语がコンテンツルートのにある場合の [Starlight](https://starlight.astro.build/guides/i18n/) と一致し、`outputDir` が `docsRoot` のとき）。
- `docsOutput.style = "vitepress"` — `doc-system` と同じレイアウトで `localeSubpath` は空; BCP-47 ロケールフォルダー名が保持されます（`localePathLowercase` はデフォルトで `false`）。[VitePress 統合](/ja/guide/integrations/vitepress) を参照。
- `docsOutput.style = "nextra"` — `doc-system` と同じレイアウトで `localeSubpath` は空; 英语ソースはロケールフォルダーの配下にある（例：`content/en/`）。[Nextra 統合](/ja/guide/integrations/nextra) を参照。
- `docsOutput.style = "fumadocs"` — `doc-system` と同じレイアウトで `localeSubpath` は空; 英语ソースはドット接尾辞ファイルを使用（デフォルト）または `fumadocsParser` が `"dir"` の場合はロケールフォルダーを使用。[Fumadocs 統合](/ja/guide/integrations/fumadocs) を参照。

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

Nextra プリセット (英語はロケールフォルダの下、ターゲットのロケールフォルダは兄弟関係):

```text
content/en/guide/getting-started.mdx  →  content/pt-BR/guide/getting-started.mdx
```

Fumadocsプリセット — ドットパーサー（デフォルト、英語ソースの横にロケールサフィックス）:

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

Fumadocsプリセット — ディレクトリパーサー（Nextraスタイルのロケールフォルダ）:

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

オプションのJSONラベル — `docusaurusCatalogDir` からのDocusaurusシェル文字列（MDX本文コピーではない）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlightは多数のロケール向けUI文字列を提供しています。必要に応じて、カスタムUIの上書きには、別個の `docs[]` ブロック内で `src/content/i18n/en.json` と `jsonPathTemplate: "{outputDir}/{locale}.json"` を使用します。

VitePress の nav/sidebar/footer 文字列はマークダウンではない — `docsOutput.vitepressThemeCatalog` を設定し **`translate-docs`** ないで翻訳。[VitePress 統合](/ja/guide/integrations/vitepress) を参照。

Nextra テーマ辞書（`.ts`）と `_meta.ts` サイドバーラベルはマークダウンではない — `docs[].nextraDictionaryPath` を使用し、`style: "nextra"` の場合は自動 `_meta` コレクションをすべて **`translate-docs`** ないで使用。[Nextra 統合](/ja/guide/integrations/nextra) を参照。

Fumadocs UI オーバーライド（`lib/layout.shared.ts`）と `meta.json` サイドバーラベルはマークダウンではない — `docsOutput.fumadocsUiCatalog` を使用し、`style: "fumadocs"` の場合は自動 `meta.json` コレクションをすべて **`translate-docs`** ないで使用。[Fumadocs 統合](/ja/guide/integrations/fumadocs) を参照。

`docsOutput.style = "flat"` — 翻訳されたファイルをロケールサフィックス付きでソース横に、またはサブディレクトリ内に配置します。`docsOutput.style = "flat"` の場合、ページ間の相対リンクは自動的に書き換えられます（`rewriteRelativeLinks: false` またはカスタムの `pathTemplate` が設定されていない限り）。

```text
docs/guide.md → i18n/guide.de.md
```

フラットレイアウトでのページ間アンカーリンクについては、[アンカーリンク](/ja/guide/documents/anchor-links)を参照してください。

組み込みの相対リンク修正以外のリンクとアセットURLの書き換えについては、[リンクの書き換え](/ja/guide/documents/link-rewriting)（`docsOutput.postProcessing.regexAdjustments`）を参照してください。

翻訳されたページでのスクリーンショットとラスターアセットについては、[画像とスクリーンショット](/ja/guide/images-and-screenshots/)を参照してください。

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
