<a id="combining-pipelines"></a>
# パイプラインの結合

1つのプロジェクトで複数の種類の翻訳（アプリのUI文字列とドキュメント、ドキュメントサイトとルートのREADME、またはドキュメントとSVGイラストなど）が必要な場合は、こちらをお読みください。1種類のコンテンツのみを翻訳する場合は、[クイックスタート](/ja/guide/quick-start)で十分です。

アプリとそのリポジトリのREADMEは一般的なハイブリッドです。`init`（`ui-markdown`テンプレート）または`init -t <template> --with-readme`で足場を構築し、その後、[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)に従ってください。このページの後半にある混合設定は、ドキュメントサイトと並んだ同じ考え方です。

このリポジトリはそのような種類のプロジェクトです。[`ai-i18n-tools.config.json`](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)は、CLIと翻訳ダッシュボードのUI文字列、およびこのVitePressサイトを1つの`sync`で翻訳します。UIブロックは`src/cli`、`src/server`、`src/dashboard-app`、および`src/api`をカバーし、`src/i18n/locales`の下にフラットなJSONを書き込みます。VitePressブロックは、`docs/`とテーマカタログに`docsOutput.style: "vitepress"`を使用します。同じファイルは、`translated-docs/`の下に`README.md`翻訳も書き込みます。サイトの配線: [VitePress](/ja/guide/integrations/vitepress)。

<a id="what-sync-runs"></a>
## syncが実行するもの

`ai-i18n-tools sync`は、有効になっているステップをこの順序で実行します。

1. `features.translateUIStrings`が有効な場合、`extract`、次に`translate-ui`。
2. `features.translateSVG`が有効で、`svg`ブロックが存在する場合、`translate-svg`。
3. `features.translateDocs`が有効な場合、または任意の`docs[].docusaurusCatalogDir`が設定されている場合、`translate-docs`。
4. `features.translateJson`が有効で、`json[]`にエントリがある場合、`translate-json`。

`--no-ui`、`--no-svg`、`--no-docs`、または`--no-json`を含む部分はスキップされます。ドキュメントと`json[]`のステップは、`--dry-run`、`-p` / `--path`、`--force`、`--force-update`、および`--check-cache`を受け入れます。`--no-docs`が設定されている場合、ドキュメント専用のフラグは無視されます。`--no-json`が設定されていない場合、JSONは同じキャッシュフラグを使用します。

個々のコマンドを手動で連結するよりも、`sync`を使用することをお勧めします。手動で実行すると、順序、抽出、およびロケールフラグを間違えやすくなります。

<a id="ui-strings-and-documents-together"></a>
## UI文字列とドキュメントをまとめて

1つの設定で両方の機能を有効にして、UI文字列とドキュメントを1回のパスで実行します。

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

UIブロックには、デフォルトでドキュメント用の用語集ヒントとして`strings.json`カタログが含まれます（`uiGlossary`）。`glossary.userGlossary`は、製品用語のCSVオーバーライドを追加します。[用語集](/ja/guide/glossary)を参照してください。

<a id="fewer-locales-for-documents"></a>
## ドキュメントのロケールを減らす

ブロックで`docs[].targetLocales`を使用して、そのブロックのファイルをUIよりも少ないサブセットに翻訳します。有効なドキュメントロケールは、ブロック間の和集合です。

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

<a id="mixed-documentation-config"></a>
## 混合ドキュメント設定

`docs`に複数のエントリを追加することで、同じ設定で複数のドキュメントパイプラインを結合できます。これは、プロジェクトにDocusaurusサイト（`docsOutput.style = "docusaurus"`）と、`docsOutput.style = "flat"`を含むリポジトリのREADMEのようなルートレベルのMarkdownファイルがあり、それらがロケール接尾辞付きファイル名で翻訳されるべきである場合の一般的な設定です。

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

`ai-i18n-tools sync` でこれを実行する方法:

- UI文字列は`src/`から抽出され、`public/locales/`に翻訳されます。
- 最初のドキュメントブロックは、`docs-site/docs/`からMarkdownを`docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`（ローカライズされたドキュメントページ）に翻訳します。
- `docs[].docusaurusCatalogDir`が設定され、`features.translateDocs`が有効な場合、同じブロックは`docs-site/i18n/en/`の下にあるDocusaurusシェルJSONを各ターゲットロケールフォルダ（ナビゲーションバー、フッター、テーマ/プラグインカタログ。MDX本文コピーではない）に翻訳します。
- 2番目のドキュメントブロックは、`README.md`を`translated-docs/`の下にあるロケール接尾辞付きファイル（`docsOutput.style = "flat"`）に翻訳します。
- すべてのドキュメントブロックは `cacheDir` を共有するため、変更されていないセグメントは実行間で再利用され、API 呼び出し回数とコストを削減します。

次へ: [クイックスタート](/ja/guide/quick-start)に戻るか、完全なスキーマについては[設定](/ja/reference/configuration)を参照してください。
