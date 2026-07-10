<a id="fumadocs-integration"></a>
# Fumadocsの統合

Next.js App Routerで[Fumadocs](https://www.fumadocs.dev/) 4のドキュメントサイトには、`init -t ui-fumadocs`と`docsOutput.style: "fumadocs"`を使用します。このプリセットは、空の`doc-system`とBCP-47または短いロケールコードが保持された`localeSubpath`のエイリアスです（`localePathLowercase`はデフォルトで`false`）。

[Documents](/guide/documents/)と実行可能な[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/)デモ（ドットパーサー、ポート3080）も参照してください。

<a id="quick-start"></a>
## クイックスタート

```bash
npx ai-i18n-tools init -t ui-fumadocs
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

ページコンテンツ、`meta.json`サイドバーラベル、およびFumadocs UIのオーバーライドを1回の`sync`実行で翻訳する場合は、`features.translateDocs`を有効にします。

<a id="page-layout"></a>
## ページレイアウト

Fumadocsは、`docsOutput.fumadocsParser`を介して2つのi18nコンテンツレイアウトをサポートしています。**ドット**パーサーがデフォルトです（Fumadocsに組み込まれており、[SWR](https://github.com/vercel/swr-site)などの本番サイトで使用されています）。

<a id="dot-parser-default"></a>
### ドットパーサー (デフォルト)

英語のMDXはコレクションのルートにあります。翻訳されたコピーは、同じディレクトリにロケールサフィックスを使用します。

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

`lib/i18n.ts`の`targetLocales`を`defineI18n().languages`と正確に合わせます（例では短いコード`pt`と`zh`を使用しています）。

<a id="dir-parser-nextra-style"></a>
### Dirパーサー（Nextraスタイル）

ロケールフォルダ（`content/docs/en/` → `content/docs/pt-BR/`）に慣れているチームの場合、`fumadocsParser`を`"dir"`に設定します。

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

コピー＆ペースト可能なディレクトリ設定については、[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) の `ai-i18n-tools.config.dir.example.json` を参照してください。メンタルモデルは [Nextra integration](/guide/integrations/nextra#page-layout) と一致します。

<a id="sidebar-metajson"></a>
## サイドバー (`meta.json`)

Fumadocsは、サイドバーの構造とタイトルにJSON `meta.json`ファイルを使用します。`docsOutput.style`が`"fumadocs"`の場合、**`translate-docs`** は`docsRoot`（または`docs[].fumadocsMetaGlob`）の下の`meta.json`を収集し、`docs[].fumadocsMetaTranslatableKeys`にリストされているキー（デフォルト：`title`、`description`）の文字列値を翻訳して、ロケール出力を書き込みます。

| パーサー | 英語ソース | 出力 |
|--------|----------------|--------|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**翻訳しないでください**：`pages`スラッグ配列、`root`、`icon`、`defaultOpen`、またはその他の構造キー — 人間が読めるラベルのみを翻訳します。

<a id="ui-catalog"></a>
## UIカタログ

Fumadocsのレイアウトクローム（検索プレースホルダー、ロケール表示名、および`lib/layout.shared.ts`内のその他の`defineTranslations` / `i18n.translations()`オーバーライド）は、マークダウンから抽出されません。**`docsOutput.fumadocsUiCatalog`** を構成して、**`translate-docs`** が`sourcePath`から英語カタログをブートストラップし、ロケールごとのJSONを翻訳するようにします。

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — 生成された英語のフラットJSON（ブートストラップ出力）。`layout.shared.ts`の英語のオーバーライドが変更された場合は、`sync`を再実行します。
- **`outputPathTemplate`**（オプション） — ロケールごとの出力。デフォルト：`catalogPath`の隣の`ui.{locale}.json`。

`layout.shared.ts`で`loadUiCatalog(locale)`を介してロケールごとのJSONをロードし、ルートレイアウトで`i18nProvider(translations, lang)`とマージします。[examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts)を参照してください。

標準ロケールは、LLM のコストなしで `@fumadocs/language/*` プリセットでカバーできます。カタログは、英語ブロックの **プロジェクトのオーバーライド**のみを翻訳します。

Fumadocs UI 文字列には `json[]` を**使用しないでください**。このパイプラインは、関連性のないアプリのロケールバンドル用です。

<a id="framework-shell-translation"></a>
## フレームワークシェルの翻訳

| フレームワーク | シェル / テーマ文字列 | パイプライン |
|-----------|----------------------|----------|
| Docusaurus | `write-translations` カタログ | ドキュメント — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | テーマ/ナビゲーション/サイドバーカタログ | ドキュメント — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` サイドバーラベル | ドキュメント — `style: "nextra"` + `translate-docs` の場合に自動 |
| Nextra | テーマ辞書 `.ts` | ドキュメント — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json` サイドバーラベル | ドキュメント — `style: "fumadocs"` + `translate-docs` の場合は自動 |
| Fumadocs | UI オーバーライドカタログ | ドキュメント — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | 組み込みのUI文字列（多くのロケール）。追加のシェルパイプラインなし | ドキュメント — `translate-docs`（ページのみ） |

フレームワークのシェル/テーマ文字列を `json[]` に **決して**入れないでください — そのパイプラインは無関係なアプリのロケールバンドル用です。他のフレームワークのパターンについては、[Docusaurus integration](/guide/integrations/docusaurus)、[VitePress integration](/guide/integrations/vitepress)、および [Nextra integration](/guide/integrations/nextra) を参照してください。

<a id="link-conventions"></a>
## リンクの慣例

Fumadocsは、Next.jsミドルウェア（`/docs/getting-started`、`/pt/docs/getting-started`）を介してロケールプレフィックス付きルートを提供します。**ページ内リンクはロケールニュートラルであるべきです**（`/docs/getting-started`）。そうすることで、アクティブなロケールプレフィックスが自動的に適用されます。

組み込みのノーマライザーを有効にすると、`translate-docs` がすべての翻訳ファイル内のリンクを自動的に修正します。

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks`は、`style`が`"fumadocs"`の場合にデフォルトで有効になります。

| 英語ソースの作成者 | 正規化後 |
|--------------------------|------------------|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | 変更なし (完全な URL) |

**作成ルール**

- ページ間のドキュメントリンク: 英語のMDXでは**ロケールニュートラルなサイトルート**（`/docs/…`）を使用するか、`content/docs/…` / 相対`.mdx`パスを使用して、`sync`中に正規化ツールで書き換えさせます。
- コンテンツツリー外のリポジトリファイル: **完全なURL**を使用します。
- ロケールサフィックス付きコピー（`*.pt.mdx`）や`content/{locale}/`ツリー内のリンクを手動で編集**しないでください**。`sync` / `translate-docs`で再生成してください。

こちらも参照してください: [Documents — link rewriting](/guide/documents/link-rewriting) および [Configuration — `docsOutput`](/reference/configuration#docsoutput)。

<a id="locale-codes"></a>
## ロケールコード

Fumadocs アプリの `ai-i18n-tools.config.json` の `targetLocales` を、`defineI18n().languages` と**完全に**一致させてください。ドットの例では短いコード (`pt`、`zh`) を使用していますが、ディレクトリ設定では BCP-47 フォルダー (`pt-BR`、`zh-Hans`) を使用できます。強制的な正規化はありません。コードが一致しないと、誤った出力パスやページが見つからない原因となります。

<a id="multiple-collections"></a>
## 複数のコレクション

Fumadocs プロジェクトでは、`source.config.ts` に複数の `defineDocs` ブロック (docs、blog、examples) を定義できます。翻訳するコレクションごとに 1 つの `docs[]` ブロックを追加し、それぞれに独自の `contentPaths`、`outputDir`、および `docsRoot` を設定します。

<a id="example-project"></a>
## サンプルプロジェクト

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — `content/docs/` の英語 MDX、コミットされた `pt` と `zh` のドットサフィックスページ、`meta.json`、および `lib/i18n/ui.{locale}.json`。ポート **3080** で `pnpm run dev` を実行します。

<a id="cross-references"></a>
## 相互参照

- [設定 — `docsOutput`](/reference/configuration#docsoutput)
- [出力レイアウト](/guide/documents/output-layouts)
- [Docusaurus integration](/guide/integrations/docusaurus)
- [Nextra integration](/guide/integrations/nextra) (ディレクトリパーサーのメンタルモデル)
- [VitePress integration](/guide/integrations/vitepress) (UIカタログのブートストラップパターン)
