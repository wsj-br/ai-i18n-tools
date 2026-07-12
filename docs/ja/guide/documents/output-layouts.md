<a id="output-layouts"></a>
# 出力レイアウト

`docsOutput.style`は翻訳されたMarkdownファイルの書き出し先を制御します。`docs[].docsOutput.style`には以下の正確な文字列値を使用してください。エイリアスは個別のエンジンではなく、プリセットされた`doc-system`レイアウト（またはFumadocsのドットサフィックスレイアウト）です。設定の読み込み時に、エイリアスの`style`値を正規の`"doc-system"`に書き換える場合がありますが、元のプリセットは`stylePreset`に保持されます。

組み込みのレイアウトを上書きするには、`docs[].docsOutput.pathTemplate`（Markdown/MDX）または`jsonPathTemplate`（JSONラベルファイル）を設定してください。以下の[pathTemplateプレースホルダー](#pathtemplate--jsonpathtemplate-placeholders)を参照してください。

<a id="layout-overview"></a>
## レイアウトの概要

| `docsOutput.style` | エンジン | 典型的な用途 |
| --- | --- | --- |
| `"nested"` | ロケールフォルダーがソースツリー全体をミラーリング | デフォルト。`{outputDir}/{locale}/`配下の汎用i18n出力 |
| `"flat"` | ファイル名にロケールサフィックス（サブディレクトリは任意） | README、変更履歴、リポジトリルートのドキュメント、[言語切り替え](/ja/guide/documents/language-switcher) |
| `"doc-system"` | ロケールフォルダー + `docsRoot`配下の任意の`localeSubpath` | カスタム静的ドキュメントジェネレーター |
| `"docusaurus"` | `doc-system`プリセット | [Docusaurus](/ja/guide/integrations/docusaurus) i18nプラグインレイアウト |
| `"astro-starlight"` | `doc-system`プリセット（`localeSubpath: ""`） | [Astro Starlight](/ja/guide/integrations/astro#astro-starlight)、プレーンなAstroロケールページ |
| `"vitepress"` | `doc-system`プリセット（`localeSubpath: ""`） | [VitePress](/ja/guide/integrations/vitepress) 英語の隣に配置されるロケールフォルダー |
| `"nextra"` | `doc-system`プリセット（`localeSubpath: ""`） | [Nextra](/ja/guide/integrations/nextra) ロケールフォルダー（`content/en/` → `content/{locale}/`） |
| `"fumadocs"` | ドットサフィックス（デフォルト）または`fumadocsParser: "dir"`時に`doc-system` | [Fumadocs](/ja/guide/integrations/fumadocs) ドットまたはディレクトリコンテンツレイアウト |

<a id="nested-default"></a>
## `nested` (既定)

`docsOutput.style = "nested"`（省略時のデフォルト）— `{outputDir}/{locale}/`配下にソースツリーをミラーリングします。

```text
docs/guide.md  →  i18n/de/docs/guide.md
README.md      →  i18n/de/README.md
```

`docsRoot`（設定時）の外部パスは同じネスト構造を使用します。

<a id="flat"></a>
## `flat`

`docsOutput.style = "flat"` — 翻訳ファイルを`outputDir`配下に書き出し、ファイル名にロケールサフィックスを付加します。デフォルトではベース名のみが保持され（`{outputDir}/{stem}.{locale}{extension}`）、`flatPreserveRelativeDir`を有効にしない限り`docs/guide.md`と`docs/other/guide.md`は衝突します。

```text
README.md           →  translated-docs/README.de.md
docs/guide.md       →  translated-docs/guide.de.md   (default: basename only)
```

`docsOutput.style = "flat"`の場合（`rewriteRelativeLinks: false`またはカスタム`pathTemplate`が設定されていない限り）、ページ間の相対リンクは自動的に書き換えられます。ページをまたぐ`#anchor`の処理については[アンカーリンク](/ja/guide/documents/anchor-links)を参照してください。

<a id="flat-with-flatpreserverelativedir"></a>
### `flat` と `flatPreserveRelativeDir`

`docsOutput.flatPreserveRelativeDir`を`true`に設定すると、`outputDir`配下にソースのサブディレクトリを保持できます。異なるフォルダーに同じベース名を持つ複数のMarkdownファイルを翻訳する場合や、フラットな出力が浅いツリーをミラーリングする必要がある場合（例えばリポジトリルートのREADMEに加えて`docs/*.md`）に使用してください。

```text
docs/guide.md       →  translated-docs/docs/guide.de.md
docs/sub/page.md    →  translated-docs/docs/sub/page.de.md
```

フラットリンクリライターは、アセットURLの深さプレフィックスを計算する際にファイルごとの出力パスを使用します。[リンクの書き換え](/ja/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)を参照してください。

<a id="doc-system"></a>
## `doc-system`

`docsOutput.style = "doc-system"` — 静的ドキュメントサイト用のロケールプレフィックス付きドキュメントツリー。`docsRoot` の下にあるファイルは以下に書き込まれます:

```text
{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}
```

`docsRoot` の外にあるパスは、[ネストされた](#nested)レイアウト (`{outputDir}/{locale}/{relPath}`) にフォールバックします。

`docs[].docsOutput.docsRoot` を英語のソースルート（例: `"docs"`, `"src/content/docs"`, または `"content/en"`）に設定します。`docsOutput.style = "doc-system"` の場合、`localeSubpath` を明示的に設定する必要があります（プリセットには以下のエイリアスを使用してください）。翻訳されたページが `{outputDir}/{locale}/` の直下にある場合（Starlightスタイル）は、`localeSubpath: ""` を使用します。

`docusaurusCatalogDir` からのDocusaurusシェルJSONおよびdoc-systemプリセット下のその他のJSONアーティファクトは、Markdownと同じフォルダレイアウトに従います。`style: "flat"` の場合、`jsonPathTemplate` を設定しない限り、JSONラベルファイルはネストされた形状を引き続き使用します。

<a id="doc-system-aliases"></a>
## ドキュメントシステムエイリアス

**エイリアス** (同じ `doc-system` エンジン、プリセット `localeSubpath` およびデフォルト):

- `docsOutput.style = "docusaurus"` — `localeSubpath` のデフォルトは `docusaurus-plugin-content-docs/current` (Docusaurus i18nプラグインレイアウト) です。
- `docsOutput.style = "astro-starlight"` — `localeSubpath` のデフォルトは `""` です; `localePathLowercase` のデフォルトは `true` です。`{outputDir}/{locale}/` の下にある翻訳ページは、英語がコンテンツルートにあり、`outputDir` が `docsRoot` と等しい場合に [Starlight](https://starlight.astro.build/guides/i18n/) に一致します。プレーンなAstroロケールページ (`src/pages/index.astro` → `src/pages/{locale}/index.astro`) にも使用されます — [Astroウェブサイトページ](/ja/guide/ui-strings/astro-website#pages-parse-and-replace) を参照してください。
- `docsOutput.style = "vitepress"` — `doc-system` と同じレイアウトですが、`localeSubpath` は空です; BCP-47ロケールフォルダ名が保持されます (`localePathLowercase` のデフォルトは `false` です)。[VitePress統合](/ja/guide/integrations/vitepress) を参照してください。
- `docsOutput.style = "nextra"` — `doc-system` と同じレイアウトですが、`localeSubpath` は空です; 英語ソースはロケールフォルダの下にあります (例: `content/en/`)。[Nextra統合](/ja/guide/integrations/nextra) を参照してください。

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

オプションのJSONラベル — `docusaurusCatalogDir` からのDocusaurusシェル文字列（MDX本文コピーではない）：

```text
i18n/en/sidebar.json  →  i18n/de/sidebar.json
```

Starlightは多数のロケール向けUI文字列を提供しています。必要に応じて、カスタムUIの上書きには、別個の `docs[]` ブロック内で `src/content/i18n/en.json` と `jsonPathTemplate: "{outputDir}/{locale}.json"` を使用します。

VitePress の nav/sidebar/footer 文字列はマークダウンではない — `docsOutput.vitepressThemeCatalog` を設定し **`translate-docs`** ないで翻訳。[VitePress 統合](/ja/guide/integrations/vitepress) を参照。

Nextra テーマ辞書（`.ts`）と `_meta.ts` サイドバーラベルはマークダウンではない — `docs[].nextraDictionaryPath` を使用し、`style: "nextra"` の場合は自動 `_meta` コレクションをすべて **`translate-docs`** ないで使用。[Nextra 統合](/ja/guide/integrations/nextra) を参照。

<a id="fumadocs"></a>
## `fumadocs`

`docsOutput.style = "fumadocs"` — `docsOutput.fumadocsParser` を介したFumadocsコンテンツレイアウト:

- **`"dot"` (デフォルト)** — `outputDir` の下にある英語ソースの横にあるファイル名のロケールサフィックス (ロケールフォルダではありません)。これは `doc-system` パスの形状とは別のものです。

```text
content/docs/guide/getting-started.mdx  →  content/docs/guide/getting-started.pt.mdx
```

- **`"dir"`** — Nextraスタイルのロケールフォルダ; 空の `localeSubpath` で同じ `doc-system` エンジンを使用します。

```text
content/docs/en/guide/getting-started.mdx  →  content/docs/pt-BR/guide/getting-started.mdx
```

Fumadocs UI オーバーライド（`lib/layout.shared.ts`）と `meta.json` サイドバーラベルはマークダウンではない — `docsOutput.fumadocsUiCatalog` を使用し、`style: "fumadocs"` の場合は自動 `meta.json` コレクションをすべて **`translate-docs`** ないで使用。[Fumadocs 統合](/ja/guide/integrations/fumadocs) を参照。

組み込みの相対リンク修正以外のリンクとアセットURLの書き換えについては、[リンクの書き換え](/ja/guide/documents/link-rewriting)（`docsOutput.postProcessing.regexAdjustments`）を参照してください。

翻訳されたページでのスクリーンショットとラスターアセットについては、[画像とスクリーンショット](/ja/guide/images-and-screenshots/)を参照してください。

<a id="pathtemplate--jsonpathtemplate-placeholders"></a>
## `pathTemplate` / `jsonPathTemplate` プレースホルダー

翻訳されたファイルの書き込み先をオーバーライドするには、`docs[].docsOutput.pathTemplate` (Markdown および MDX) または `jsonPathTemplate` (JSON ラベルファイル) を設定します。どちらも同じプレースホルダーを受け入れます。解決されたパスは、そのブロックの `outputDir` 内に留まる必要があります (CLI はそれをエスケープするパスを拒否します)。

カスタム `pathTemplate` を使用する場合、明示的に設定しない限り `rewriteRelativeLinks` はデフォルトで `false` になります — 相対リンクの再書き込みは、カスタムテンプレートなしの `docsOutput.style = "flat"` 向けに設計されています。

組み込みレイアウト (カスタムテンプレートなしの `nested`, `flat`, `doc-system`) の場合、`docsOutput.localePathLowercase` を `true` に設定して、小文字のロケールフォルダまたはファイル名セグメント (例: `pt-BR` の代わりに `pt-br`) を書き込みます。`astro-starlight` エイリアスと空の `localeSubpath` を持つ `doc-system` は、設定の読み込み時にこれを `true` にデフォルト設定します。カスタム `pathTemplate` / `jsonPathTemplate` 値は変更されません — `{locale}` をBCP-47として保持したまま小文字のセグメントが必要な場合は、そこで `{llocale}` を使用してください。

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
