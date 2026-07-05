<a id="quick-start"></a>
# クイックスタート

デフォルトの`init`テンプレート（`ui-markdown`）は、**UI**の抽出と翻訳のみを有効にします。`ui-docusaurus`、`ui-starlight`、および`ui-vitepress`テンプレートは、**ドキュメント**の翻訳（`translate-docs`）を有効にします。`ui-vitepress`は、VitePressテーマJSONのJSONも足場とします。`ui-astro-website`テンプレートは、プレーンなAstroアプリ（`.astro`ファイルを含む）の**UI**抽出を足場とします。`docs[]`ブロック（[Astroウェブサイトページ（解析と置換）](/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)を参照）を追加すると、`.astro`ページHTMLの`translate-docs`も必要になります。参照[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)は、**両方**のパイプラインを使用します。設定に従って、抽出、UI翻訳、オプションのSVGファイル翻訳、およびドキュメント翻訳を実行する1つのコマンドが必要な場合は、`sync`を使用します。

<a id="runnable-examples"></a>
### 実行可能な例

実行可能な7つのプロジェクトとフィクスチャは、[`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) にあります。[例](/examples) カタログ（コンソールアプリ、Next.js + Docusaurus、Astro ウェブサイト、Astro Starlight ドキュメント、VitePress ドキュメント、マルチプロバイダー比較、Markdown ストレステスト）を参照してください。

**1つの例をスタンドアロンで実行します**（モノレポ全体をクローンせずに）：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
```

`console-app`を任意の例のフォルダー名に置き換えます。各例は`"ai-i18n-tools": "^1.7.2"`を宣言し、npmからCLIをインストールします。例ごとのREADMEには、フォルダー名が入力された同じスニペットが含まれています。

**ai-i18n-toolsリポジトリ全体から:** リポジトリ全体をクローンした場合（degitで1つの例フォルダーだけではない場合）、リポジトリのルートから`pnpm install`を実行します。ワークスペース[`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)エントリ（`ai-i18n-tools: workspace:*`）は、例をローカルチェックアウトに自動的にリンクします。

```bash
# UI strings (default template enables extract + translate-ui)
npx ai-i18n-tools init
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
npx ai-i18n-tools init -t ui-docusaurus
# Astro Starlight docs: npx ai-i18n-tools init -t ui-starlight
# VitePress docs: npx ai-i18n-tools init -t ui-vitepress
# Plain Astro website UI: npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools translate-docs

# JSON (no t() in source)
npx ai-i18n-tools init -t ui-json-bundles
npx ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
npx ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
npx ai-i18n-tools status
# npx ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 推奨される `package.json` スクリプト

パッケージをローカルにインストールすると、CLIコマンドをスクリプト内で直接使用できます（`npx`は不要です）。

**好ましい** `sync` は、「`translate-ui`を実行し、その後`translate-svg`、次に`translate-docs`、最後に`translate-json`を実行する」ことが必要だったすべてのことに対してです：`ai-i18n-tools sync`は、あなたの設定に従って、**extract**（有効な場合）、**translate-ui**、オプションの**translate-svg**、**translate-docs**、その後オプションの**translate-json**を、正しい順序で共有フラグとともに実行します。手動でこれらのステップを連鎖させるのは、順序、抽出、ロケールフラグを間違えるのが簡単です。`i18n:translate:ui`、`i18n:translate:svg`、`i18n:translate:docs`、および`i18n:translate:json`は、単一の**ステップ**が孤立して必要な場合にのみ使用してください。

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:status": "ai-i18n-tools status",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**ヒント:** CLI出力とダッシュボードを別の言語で表示したい場合は、`-L <code>`を渡すか、`AI_I18N_LANG`を設定します — [ツールUI言語](/reference/environment-variables#tool-ui-language)を参照してください。

<a id="combined-sync"></a>
## 結合された同期

UI 文字列とドキュメントを一緒に実行するには、すべての機能を単一の設定で有効にします。

<details>
<summary>UIとドキュメントの設定を統合した例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true,
    "translateSVG": false
  },
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "glossary-user.csv"
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "src/locales/strings.json",
    "flatOutputDir": "src/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "docsOutput": { "style": "flat" }
    }
  ]
}
```

</details>

<br />

`glossary.uiGlossary` は、ドキュメント翻訳をUIと同じ `strings.json` カタログを指すようにして用語の一貫性を保ちます。`glossary.userGlossary` は製品用語のCSVオーバーライドを追加します。

`npx ai-i18n-tools sync` を実行して1つのパイプラインを実行します：`features.translateUIStrings` が有効な場合、まず**抽出**し、次に**UI文字列を翻訳**します。オプションで**SVGの翻訳**（`features.translateSVG` + `svg` ブロック）を実行。次に**ドキュメントの翻訳**（設定された`docs[]`を使用）。その後、オプションで**translate-json**（`features.translateJson` + `json[]`）を実行します。`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`を使用して、特定の部分をスキップできます。ドキュメントと`json[]`のステップは、`--dry-run`、`-p` / `--path`、`--force`、`--force-update`を受け入れます（`--no-docs`が設定されている場合、ドキュメント専用のフラグは無視されます。`--no-json`が設定されていない場合、JSONは同じキャッシュフラグを使用します）。

ブロックに対して`docs[].targetLocales`を使用すると、そのブロックのファイルをUIよりも**少ないロケール数**に翻訳できます（有効なドキュメントロケールはブロック間の**和集合**になります）：

```json
{
  "targetLocales": ["de", "fr", "es", "pt-BR", "ja", "ko", "zh-Hans"],
  "docs": [
    {
      "contentPaths": ["docs/"],
      "outputDir": "i18n/",
      "targetLocales": ["de", "fr", "es"]
    }
  ]
}
```

<a id="mixed-documentation-config-docsoutputstyle--docusaurus--flat"></a>
### 混合ドキュメント設定 (`docsOutput.style = "docusaurus"` + `"flat"`)

設定ファイル内で `docs` に複数のエントリを追加することで、同じ設定で複数のドキュメントパイプラインを組み合わせることができます。これは、Docusaurusサイト（`docsOutput.style = "docusaurus"`）とルートレベルのMarkdownファイル（たとえば、ロケール接尾辞付きファイル名で翻訳すべきリポジトリのREADME（`docsOutput.style = "flat"`））を併せ持つプロジェクトでよく見られる構成です。

<details>
<summary>DocusaurusとフラットなREADME設定を組み合わせた例</summary>

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["ar", "es", "fr", "de", "pt-BR"],
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "cacheDir": ".translation-cache",
  "docs": [
    {
      "description": "Docusaurus site content (markdown)",
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "docusaurusCatalogDir": "docs-site/i18n/en",
      "addFrontmatter": true,
      "docsOutput": {
        "style": "docusaurus",
        "docsRoot": "docs-site/docs"
      }
    },
    {
      "description": "Root README with docsOutput.style flat",
      "contentPaths": ["README.md"],
      "outputDir": "translated-docs",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "flat",
        "postProcessing": {
          "languageListBlock": {
            "start": "<small id=\"lang-list\">",
            "end": "</small>",
            "separator": " · ",
            "label": "local"
          }
        }
      }
    }
  ]
}
```

</details>

<br />

`npx ai-i18n-tools sync` で実行した場合の動作:

- UI文字列は `src/` から `public/locales/` へ抽出／翻訳されます。
- 最初のドキュメントブロックは、`docs-site/docs/` から `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` へ**Markdown**を翻訳します（ローカライズされたドキュメントページ）。
- `docs[].docusaurusCatalogDir` を設定し、`features.translateDocs` を有効にすると、同じブロックが `docs-site/i18n/en/` 配下の各ターゲットロケールフォルダーに**DocusaurusシェルJSON**も翻訳します（ナビゲーションバー、フッター、テーマ／プラグインカタログなど。MDX本文は対象外）。
- 2番目のドキュメントブロックは、`README.md` を `translated-docs/` 配下のロケール接尾辞付きファイルに翻訳します（`docsOutput.style = "flat"`）。
- すべてのドキュメントブロックは `cacheDir` を共有するため、変更されていないセグメントは実行間で再利用され、API 呼び出し回数とコストを削減します。
