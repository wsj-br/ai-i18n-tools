<a id="astro-integration"></a>
# Astro連携

ai-i18n-toolsを[Astro](https://astro.build/)で利用するには、一般的な2つのセットアップがあります。**Astro Starlight**ドキュメントサイトと、**プレーンなAstro**マーケティングサイトまたはアプリサイトです。どちらもページコンテンツにはDocuments (`translate-docs`)を使用します。プレーンなAstroサイトでは、フロントマターや共有データ内の`t()`文字列にUI文字列 (`extract` / `translate-ui`)を組み合わせて使用することがよくあります。

関連情報: [UI 文字列](/ja/guide/ui-strings/astro-website)、[ドキュメント](/ja/guide/documents/)、および以下の実行可能なサンプル。

<a id="astro-starlight"></a>
## Astro Starlight

[Astro Starlight](https://starlight.astro.build/) のドキュメントサイトには `init -t ui-starlight` と `docsOutput.style: "astro-starlight"` を使用します。このプリセットは、`localeSubpath` が空の `doc-system` のエイリアスです。翻訳されたページは、ソースロケールのツリーの横にある `src/content/docs/<locale>/` の下に配置されます。`sourceLocale` には任意の言語を指定できます。

<a id="quick-start"></a>
### クイックスタート

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
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

`docs[]` ブロックを1つ設定します：

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

`contentPaths` には、`sourceLocale` で書かれた `.md` / `.mdx` のファイルとディレクトリを指定します。その言語には任意の言語を指定できます。`docsRoot` には、Starlight がコンテンツルートとして使用するのと同じフォルダーを設定します。

Starlight UIのオーバーライドは、必要に応じて別の`docs[]`ブロックで`src/content/i18n/en.json`を`jsonPathTemplate`とともに使用できます。詳細については、[ドキュメント — ドキュメントの初期化](/ja/guide/documents/#step-1-initialise-for-documentation)を参照してください。

Starlightは多くのロケール向けに組み込みのUI文字列（ナビゲーションラベル、検索プレースホルダー、目次など）を提供しています。別のシェル/テーマパイプラインを設定する必要はありません。ページコンテンツには`translate-docs`のみを使用してください。他のフレームワークについては、[フレームワークのシェル翻訳](/ja/guide/integrations/#framework-shell-translation)を参照してください。

明示的なサイドバーの `label`、サイトの `title`、および `astro.config.mjs` 内の `social[].label` は、このツールが翻訳しない英語のリテラルです。ページの翻訳された frontmatter (`title`) からラベルが取得されるように、`slug` エントリを使用することを推奨します。独自の文言が必要なグループや外部リンクでは、Starlight のロケールごとの `translations` マップを使用します (デフォルトロケールでは `label`、その他のロケールでは `translations['pt-BR']`)。現在の Starlight スキーマでは `social[].label` には translations フィールドがないため、記述されたままになります。`slug` エントリを使用している [Starlight sidebar](https://starlight.astro.build/guides/sidebar/#internationalization) および [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs) を参照してください。

<a id="enable-i18n-in-an-existing-site"></a>
### 既存のサイトで i18n を有効にする

初回セットアップは、[ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website#run-the-agent-prompt)のプロンプトを使用します。以下のチェックリストは、手作業による同じ作業です。

- Starlight の設定で `locales` を指定します。英語をプレフィックスなしにする (`label` と必須の `lang`) 場合は、`root` エントリを含めます。
- デフォルト言語がそのルートロケールである場合は `defaultLocale: 'root'` を設定します。Starlight のデフォルトがすでに一致している場合にのみ `defaultLocale` を省略します。
- 英語のページは `src/content/docs/` に残ります。`translate-docs` は `src/content/docs/<locale>/` を書き込みます。
- `targetLocales` を非ルートロケールのキーに合わせます (注意: Starlight のディレクトリキーは `pt-br` のように、多くの場合小文字です)。

<a id="example-project"></a>
### プロジェクト例

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) — 英語ソースは`src/content/docs/`、コミットされた翻訳は`src/content/docs/<locale>/`、RTLロケール (`ar`)、および用語集駆動型翻訳。`pnpm dev`をポート3050で実行します。

<a id="plain-astro-marketing-and-app-sites"></a>
## プレーンなAstro (マーケティングおよびアプリサイト)

静的なAstroマーケティングサイトまたはアプリサイト（Starlightではない）の場合、[Astro組み込みのi18nルーティング](https://docs.astro.build/en/guides/internationalization/)とai-i18n-toolsを組み合わせます。初回セットアップは、[ウェブサイトまたはドキュメントサイトにi18nを追加する](/ja/guide/add-i18n-to-website#run-the-agent-prompt)のプロンプトを使用します。リファレンス実装は[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website)です。英語は`/`、ターゲットロケールは`/{locale}/`にあります。

ほとんどのチームは、同じページで2つのパイプラインの**ハイブリッド**を使用します。

| パイプライン | 使用対象 | コマンド | 出力 |
|----------|---------|----------|--------|
| **ページ HTML** | テンプレート本体の見出し、段落、ナビゲーションラベル、インライン配列 | `translate-docs` | ロケールごとに `src/pages/{locale}/index.astro` |
| **UI 文字列 (`t()`)** | Frontmatter データ、タブのラベル、共有配列 | `extract` → `translate-ui` | `public/locales/{locale}.json` (キーとしてソース言語の文字列を使用) |

<a id="quick-start-1"></a>
### クイックスタート

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

`init -t ui-astro-website -P ollama` を使用してUI抽出の足場を構築し、ページHTMLも翻訳する際には`docs[]` ブロックにマージします。

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

**ビルド時**に、ソース言語のリテラルをキーとしてルックアップすることで `t('…')` を解決します (`examples/astro-website/src/i18n/t.ts` を参照)。`sourceLocale` には任意の言語を指定できます。この例では英語を使用しています。静的サイトの場合、ロード後に言語を切り替えるクライアントアイランドを追加しない限り、`ai-i18n-tools/runtime` や i18next は必要ありません。

<a id="example-project-1"></a>
### プロジェクト例

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) — `translate-docs`経由のHTMLと`t()` + `translate-ui`経由のスクリーンショットタブラベルを備えたハイブリッドランディングページ。

<a id="example-projects"></a>
## プロジェクト例

| プロジェクト | ユースケース | ポート |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlightドキュメント | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | プレーンなAstroマーケティングサイト（HTML + `t()`ハイブリッド） | （READMEを参照） |

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs)と[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs)を比較してください — チュートリアルの内容は似ていますが、StarlightではなくDocusaurusの出力スタイルを採用しています。
