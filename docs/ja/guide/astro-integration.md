<a id="astro-integration"></a>
# Astro連携

ai-i18n-toolsを[Astro](https://astro.build/)で利用するには、一般的な2つのセットアップがあります。**Astro Starlight**ドキュメントサイトと、**プレーンなAstro**マーケティングサイトまたはアプリサイトです。どちらもページコンテンツにはDocuments (`translate-docs`)を使用します。プレーンなAstroサイトでは、フロントマターや共有データ内の`t()`文字列にUI文字列 (`extract` / `translate-ui`)を組み合わせて使用することがよくあります。

[UI文字列](/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)、[ドキュメント](/guide/documents/)、および以下の実行可能な例も参照してください。

<a id="astro-starlight"></a>
## Astro Starlight

[Astro Starlight](https://starlight.astro.build/)ドキュメントサイトには、`init -t ui-starlight`と`docsOutput.style: "astro-starlight"`を使用します。このプリセットは、空の`localeSubpath`を持つ`doc-system`のエイリアスです。翻訳されたページは、英語のソースツリーの横にある`src/content/docs/<locale>/`に配置されます。

<a id="quick-start"></a>
### クイックスタート

```bash
npx ai-i18n-tools init -t ui-starlight
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### ページレイアウト

英語のMarkdownとMDXはStarlightのコンテンツルート（通常は`src/content/docs/`）にあります。翻訳されたコピーはソースツリーの横に書き込まれます。

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

1つの`docs[]`ブロックを設定します。

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

`contentPaths`を英語の`.md` / `.mdx`ファイルとディレクトリに指定します。`docsRoot`をStarlightがコンテンツルートとして使用するのと同じフォルダに設定します。

Starlight UIのオーバーライドは、必要に応じて別の`docs[]`ブロックで`src/content/i18n/en.json`を`jsonPathTemplate`とともに使用できます。詳細については、[ドキュメント — ドキュメントの初期化](/guide/documents/#step-1-initialise-for-documentation)を参照してください。

<a id="example-project"></a>
### プロジェクト例

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — 英語ソースは`src/content/docs/`、コミットされた翻訳は`src/content/docs/<locale>/`、RTLロケール (`ar`)、および用語集駆動型翻訳。`pnpm dev`をポート3050で実行します。

<a id="plain-astro-marketing-and-app-sites"></a>
## プレーンなAstro (マーケティングおよびアプリサイト)

静的なAstroマーケティングサイトまたはアプリサイト（Starlightではない）の場合、[Astro組み込みのi18nルーティング](https://docs.astro.build/en/guides/internationalization/)とai-i18n-toolsを組み合わせます。参照実装は[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website)です。英語は`/`、ターゲットロケールは`/{locale}/`です。

ほとんどのチームは、同じページで2つのパイプラインの**ハイブリッド**を使用します。

| パイプライン | 使用対象 | コマンド | 出力 |
|----------|---------|----------|--------|
| **ページ HTML** | テンプレート本体の見出し、段落、ナビゲーションラベル、インライン配列 | `translate-docs` | ロケールごとに `src/pages/{locale}/index.astro` |
| **UI 文字列 (`t()`)** | フロントマター データ、タブラベル、共有配列 | `extract` → `translate-ui` | `public/locales/{locale}.json` (英語ソースをキーとして) |

<a id="quick-start-1"></a>
### クイックスタート

```bash
npx ai-i18n-tools init -t ui-astro-website
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

`init -t ui-astro-website`でUI抽出を足場固めし、ページHTMLも翻訳する場合は`docs[]`ブロックにマージします。

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

言語を追加または削除する際には、3つのリストを揃えてください。`ai-i18n-tools.config.json`内の`targetLocales`、`astro.config.mjs`内の`i18n.locales`（Astroは`pt-br`のような**小文字**のルートコードを使用します）、および`ui-languages.json`（`generate-ui-languages`経由）。フラットバンドルの**ファイル名**は設定のケース（`pt-BR.json`）を使用します。Astroの`pt-br`ルートをマニフェストの`code`フィールド経由でそのファイルにマッピングします。

**ビルド時**に、英語のソースリテラルをキーとして検索することで`t('…')`を解決します。`examples/astro-website/src/i18n/t.ts`を参照してください。ロード後に言語を切り替えるクライアントアイランドを追加しない限り、静的サイトでは`ai-i18n-tools/runtime`やi18nextは必要ありません。

<a id="example-project-1"></a>
### プロジェクト例

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — `translate-docs`経由のHTMLと`t()` + `translate-ui`経由のスクリーンショットタブラベルを備えたハイブリッドランディングページ。

<a id="example-projects"></a>
## プロジェクト例

| プロジェクト | ユースケース | ポート |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlightドキュメント | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | プレーンなAstroマーケティングサイト（HTML + `t()`ハイブリッド） | （READMEを参照） |

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs)と[examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site)を比較 — 同様のチュートリアルコンテンツ、StarlightではなくDocusaurusの出力スタイル。
