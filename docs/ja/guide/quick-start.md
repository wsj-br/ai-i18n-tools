<a id="quick-start"></a>
# クイックスタート

デフォルトの`init`テンプレート（`ui-markdown`）は、**UI**の抽出と翻訳のみを有効にします。`ui-docusaurus`、`ui-starlight`、`ui-vitepress`、`ui-nextra`、および`ui-fumadocs`テンプレートは、**ドキュメント**の翻訳（`translate-docs`）を有効にします。`ui-vitepress`はVitePressテーマ文字列用の`docsOutput.vitepressThemeCatalog`も足場を固め、`ui-nextra`はNextraテーマ辞書用の`docs[].nextraDictionaryPath`を足場を固め（サイドバーの`_meta.ts`は自動的に収集されます）、`ui-fumadocs`はFumadocs UIオーバーライド用の`docsOutput.fumadocsUiCatalog`を足場を固めます（サイドバーの`meta.json`は自動的に収集されます）。`ui-astro-website`テンプレートは、プレーンなAstroアプリ（`.astro`ファイルを含む）の**UI**抽出を足場を固めます。`.astro`ページのHTMLの`translate-docs`も必要な場合は、`docs[]`ブロックを追加します（[Astroウェブサイトページ（解析と置換）](/ja/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)を参照）。リファレンス[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)は、**両方**のパイプラインを使用します。設定に従って、抽出、UI翻訳、オプションのSVGファイル翻訳、およびドキュメント翻訳を実行する1つのコマンドが必要な場合は、`sync`を使用します。

<a id="runnable-examples"></a>
### 実行可能な例

9つの実行可能なプロジェクトとフィクスチャは、[`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/)にあります。[例](/ja/examples)カタログ（コンソールアプリ、Next.js + Docusaurus、Astroウェブサイト、Astro Starlightドキュメント、VitePressドキュメント、Nextraドキュメント、Fumadocsドキュメント、マルチプロバイダー比較、マークダウンストレステスト）を参照してください。

**1つの例をスタンドアロンで実行します**（モノレポ全体をクローンせずに）：

```bash
npx degit wsj-br/ai-i18n-tools/examples/console-app console-app
cd console-app
pnpm install
pnpm run i18n:sync    # example scripts call the locally installed CLI
```

`console-app`を任意の例のフォルダー名に置き換えます。各例は`"ai-i18n-tools": "^1.7.2"`を宣言し、npmからCLIをインストールします。例ごとのREADMEには、フォルダー名が入力された同じスニペットが含まれています。

**完全な ai-i18n-tools リポジトリから** — degit で単一のサンプルフォルダーではなくリポジトリ全体をクローンした場合:

```bash
pnpm install          # repository root
pnpm run build        # after changing CLI source
cd examples/console-app
pnpm run i18n:sync    # preferred — uses the workspace-linked CLI
# or: ai-i18n-tools sync   # after PATH setup — see Using the CLI
```

ワークスペース [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) のエントリー (`ai-i18n-tools: workspace:*`) は、ワークスペースのサンプルをローカルのチェックアウトに自動的にリンクします。スタンドアロンのフィクスチャ (`multi-provider`, `test-markdown`) はワークスペースパッケージではありません — それらのフォルダーからは `node ../../bin/ai-i18n-tools.mjs …` を使用してください。**リポジトリルート** (このパッケージ自身の docs/i18n) から CLI を実行するには、`pnpm i18n:sync` または `node bin/ai-i18n-tools.mjs …` を使用してください — [インストール — クローンしたモノレポ](/ja/guide/installation#cloned-monorepo) および [開発ガイド](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) を参照してください。

<a id="provider-and-api-key-required-for-translation"></a>
### プロバイダーとAPIキー（翻訳に必要）

LLMを呼び出すすべてのコマンド — `translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync` — には、以下の**両方**が必要です。

1. `ai-i18n-tools.config.json`内の**少なくとも1つのプロバイダ**: `translationModels`を含む`providers.<name>`ブロック、および複数のプロバイダを設定する場合のトップレベルの`provider`キー。`init`はデフォルトのプロバイダブロックをスキャフォールドします（`-P <provider>`を渡さない場合は`openrouter`）。プリセットの切り替え、プロバイダの追加、またはモデルリストの調整については、[LLMプロバイダとモデル](/ja/guide/providers-and-models)を参照してください。
2. 環境またはプロジェクトルートの`.env`ファイル内にある**対応するAPIキー**。各組み込みプリセットは、[プリセットテーブル](/ja/guide/providers-and-models#built-in-providers)から指定された環境変数を読み取ります（例えば、デフォルトでは`OPENROUTER_API_KEY`、または`-P anthropic`でスキャフォールドする場合は`ANTHROPIC_API_KEY`）。例外は**Ollama**です。ローカルエンドポイントを使用するため、キーは不要です。[インストール — プロバイダAPIキーの設定](/ja/guide/installation#using-the-cli)を参照してください。

`extract`、`status`、およびLLMを呼び出さないその他のコマンドは、プロバイダーやAPIキーを必要としません。

<a id="core-cli-commands"></a>
### コア CLI コマンド

`ai-i18n-tools`をインストールし、[ベアコマンド用にシェルを設定](/ja/guide/installation#using-the-cli)した後、**プロジェクトルート**から実行します。以下の例では`ai-i18n-tools`を直接使用しています。

```bash
# Set the API key for your active provider (see preset table; skip for local Ollama)
# Default init uses openrouter:
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Or scaffold another preset at init, e.g. anthropic:
# export ANTHROPIC_API_KEY=sk-ant-your-key-here

# UI strings (default template enables extract + translate-ui)
ai-i18n-tools init [-P <provider>]    # default: openrouter
ai-i18n-tools init -P anthropic
ai-i18n-tools extract
ai-i18n-tools translate-ui

# Documents (Docusaurus-oriented template)
ai-i18n-tools init -t ui-docusaurus [-P <provider>]
ai-i18n-tools init -t ui-docusaurus -P openai
# Astro Starlight docs: ai-i18n-tools init -t ui-starlight [-P <provider>]
# VitePress docs: ai-i18n-tools init -t ui-vitepress [-P <provider>]
# Nextra docs: ai-i18n-tools init -t ui-nextra [-P <provider>]
# Fumadocs docs: ai-i18n-tools init -t ui-fumadocs [-P <provider>]
# Plain Astro website UI: ai-i18n-tools init -t ui-astro-website [-P <provider>]
ai-i18n-tools translate-docs

# JSON (no t() in source)
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
ai-i18n-tools translate-json

# Combined: extract UI strings, then translate UI + SVG + docs + json[] (per config features)
ai-i18n-tools sync

# Translation status (UI strings per locale; markdown per file × locale in chunked tables)
ai-i18n-tools status
# ai-i18n-tools status --max-columns 12   # wider tables, fewer chunks
```

<a id="recommended-packagejson-scripts"></a>
### 推奨される `package.json` スクリプト

パッケージをローカルにインストールすると、`package.json`スクリプトは追加のシェル設定なしに`node_modules/.bin`から`ai-i18n-tools`を解決します。インタラクティブシェルの場合は、最初にPATHを設定してください — [CLIの使用](/ja/guide/installation#using-the-cli)を参照してください。

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
  "i18n:statistics": "ai-i18n-tools statistics",
  "i18n:dashboard": "ai-i18n-tools dashboard",
  "i18n:cleanup": "ai-i18n-tools cleanup"
}
```

**ヒント:** CLI出力やダッシュボードを別の言語で表示したい場合は、`-L <code>` を渡すか `AI_I18N_LANG` を設定してください — [ツールUIの言語](/ja/guide/tool-ui-language) を参照してください。

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

`ai-i18n-tools sync` を実行して1つのパイプラインを実行します: `features.translateUIStrings` が有効な場合、**extract** の後に UI 文字列を **translate** します; オプションで **translate SVG** (`features.translateSVG` + `svg` ブロック); **translate documentation** (設定に応じた `docs[]`); その後オプションで **translate-json** (`features.translateJson` + `json[]`)。`--no-ui`, `--no-svg`, `--no-docs`, または `--no-json` で一部をスキップできます。docs および `json[]` ステップは `--dry-run`, `-p` / `--path`, `--force`, `--force-update` を受け付けます (docs 専用フラグは `--no-docs` の場合は無視されます; JSON は `--no-json` が設定されていない場合、同じキャッシュフラグを使用します)。

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

`ai-i18n-tools sync` でこれを実行する方法:

- UI文字列は `src/` から `public/locales/` へ抽出／翻訳されます。
- 最初のドキュメントブロックは、`docs-site/docs/` から `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` へ**Markdown**を翻訳します（ローカライズされたドキュメントページ）。
- `docs[].docusaurusCatalogDir` を設定し、`features.translateDocs` を有効にすると、同じブロックが `docs-site/i18n/en/` 配下の各ターゲットロケールフォルダーに**DocusaurusシェルJSON**も翻訳します（ナビゲーションバー、フッター、テーマ／プラグインカタログなど。MDX本文は対象外）。
- 2番目のドキュメントブロックは、`README.md` を `translated-docs/` 配下のロケール接尾辞付きファイルに翻訳します（`docsOutput.style = "flat"`）。
- すべてのドキュメントブロックは `cacheDir` を共有するため、変更されていないセグメントは実行間で再利用され、API 呼び出し回数とコストを削減します。
