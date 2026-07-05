<a id="configuration-reference"></a>
# 設定リファレンス

<a id="sourcelocale"></a>
### `sourceLocale`

ソース言語のBCP-47コード（例：`"en-GB"`、`"en"`、`"pt-BR"`）。このロケール用の翻訳ファイルは生成されません — キー文字列自体がソーステキストとなります。

**実行時i18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされた`SOURCE_LOCALE`と一致している必要があります**。

<a id="targetlocales"></a>
### `targetLocales`

翻訳対象のBCP-47ロケールコードの配列（例：`["de", "fr", "es", "pt-BR"]`）。

`targetLocales`はUI翻訳のための主要なロケールリストであり、ドキュメントブロックのデフォルトロケールリストでもあります。`generate-ui-languages`を使用して、`sourceLocale`と`targetLocales`から`ui-languages.json`マニフェストを構築します。

<a id="uilanguage-optional"></a>
### `uiLanguage`（オプション）

ツールのUI言語（CLIヘルプ、ログ/サマリー、翻訳ダッシュボード）のBCP-47コード。`sourceLocale` / `targetLocales`とは独立しており、`-L` / `--ui-lang`フラグと`AI_I18N_LANG`環境変数によって上書きされます。不明な値はソースロケール（`en-GB`）に正常にフォールバックします。厳密な検証はありません。[ツールのUI言語](/reference/environment-variables#tool-ui-language)を参照してください。

<a id="uilanguagespath-optional"></a>
### `uiLanguagesPath`（オプション）

表示名、ロケールフィルタリング、言語リストの後処理に使用される`ui-languages.json`マニフェストへのパス。省略された場合、CLIは`ui.flatOutputDir/ui-languages.json`にマニフェストがあるかを検索します。

以下のときに使用します：

- マニフェストは `ui.flatOutputDir` の外にあり、CLI で明示的にそれを指し示す必要があります。
- [言語切り替えポストプロセッシング](#language-switcher-languagelistblock)（`languageListBlock`）を使用して、マニフェストからロケールラベルを生成したい場合。
- `extract` はマニフェスト内の `englishName` エントリを `strings.json` にマージする必要があります（`ui.reactExtractor.includeUiLanguageEnglishNames: true` が必要です）。

<a id="concurrency-optional"></a>
### `concurrency`（オプション）

同時に翻訳される最大**ターゲットロケール数**（`translate-ui`、`translate-docs`、`translate-svg`、および`sync`内の対応するステップ）。省略された場合、CLIはUI翻訳に**4**、ドキュメント翻訳に**3**を使用します（組み込みのデフォルト）。実行ごとに`-j` / `--concurrency`で上書きできます。

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（オプション）

**translate-docs**、**translate-svg**、および**translate-json**（と`sync`内の対応するステップ）：ファイルごとのLLM **バッチ**リクエストの最大並列数（各バッチには多数のセグメントを含めることができます）。省略した場合のデフォルトは**4**です。`translate-ui`では無視されます。`-b` / `--batch-concurrency`で上書きします。

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (オプション)

同一ロケール内で同時に処理されるファイルの最大数 **（`translate-docs` および `sync` の間）**。**1** より大きい値に設定すると、同じロケール内のファイルがメモリ使用量を制御するセマフォを使用して並行して処理されます。省略した場合のデフォルトは **1**（逐次処理）です。より高い値は、特にすべてのセグメントがすでにキャッシュされている場合（API 呼び出しが不要な場合）、I/O バウンド操作のスループットを大幅に改善できます。

**例:**

```json
{
  "fileConcurrency": 4
}
```

**使用例:** キャッシュヒット率100%で`sync --force-update`を実行する際に、この値を`2-4`に設定して総処理時間を短縮します。この改善は、多数の小規模ファイルを処理する場合に特に顕著です。

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（オプション）

**translate-docs**、**translate-svg**、および**translate-json**のセグメントバッチ処理：APIリクエストごとのセグメント数と文字数の上限。デフォルト：**20**セグメント、**4096**文字（省略した場合）。

<a id="provider-and-providers"></a>
### `provider` と `providers`

`provider`（トップレベル、オプション）は、`providers`からアクティブなプロバイダーキーを選択します。プロバイダーが1つだけ設定されている場合はオプションですが、複数設定されている場合は必須です。

`providers`（トップレベル）は、プロバイダーキーをそのブロックにマッピングします。組み込みキー（以下のプリセットテーブルを参照）には`translationModels`のみが必要ですが、その他のキーはカスタムのOpenAI互換エンドポイントを定義し、`baseUrl`（エンドポイントがキーを必要としない場合を除き、`apiKeyEnv`も）が必要です。

各`providers.<name>`ブロックは以下を受け入れます：

- `translationModels`
  モデルIDの優先順位付きリスト（プレフィックス`provider/`なしのプレーンなアップストリームID。OpenRouter IDはネイティブの`vendor/model`形式を維持します）。最初に試行され、エラーが発生した場合は後続のエントリがフォールバックとなります。`translate-ui`の場合のみ、このリストの前に1つのモデルを試すために`ui.preferredModel`を設定することもできます（`ui`を参照）。
- `baseUrl`
  OpenAI互換のベースURL。プリセットのベースURLをオーバーライドします。プリセット以外のプロバイダーには必須です。
- `apiKeyEnv`
  APIキーを含む環境変数。プリセットの環境変数をオーバーライドします。
- `headers`
  追加のHTTPヘッダー。このプロバイダーへのすべてのリクエストと共に送信されます。
- `maxTokens`
  リクエストあたりの最大完了トークン数。デフォルト：`8192`。
- `temperature`
  サンプリング温度。デフォルト：`0.2`。
- `requestTimeoutMs`
  各リクエストの待機時間（ミリ秒）。デフォルト：`30000`（30秒）。

組み込みプロバイダープリセット（キー — ベースURL — APIキー環境変数）：

| プロバイダー | ベースURL | APIキー環境変数 |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | （なし） |

レガシーなトップレベルの`openrouter`ブロック（`baseUrl`、`translationModels`、`defaultModel`、`fallbackModel`、`maxTokens`、`temperature`、`requestTimeoutMs`を含む）も引き続き受け入れられ、ロード時に`providers.openrouter`（`provider: "openrouter"`を含む）に自動移行されます。`defaultModel` / `fallbackModel`は`translationModels`に折りたたまれます。

1つの設定で複数のプロバイダーを構成し、`-P`でそれらを切り替える実行可能な例については、[`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)（`openai`、`anthropic`、`nvidia`、および`deepseek`が同じドキュメント上にある）を参照してください。

**複数のモデルを使用する理由：** プロバイダーおよびモデルによってコストが異なり、言語やロケールごとに品質レベルが異なります。`translationModels`を単一のモデルではなく、順序付きフォールバックチェーンとして**設定**することで、リクエストが失敗した場合にCLIが次のモデルを試行できるようにします。

以下のリストは、拡張可能な**ベースライン**として扱ってください。特定のロケールの翻訳が不十分または失敗した場合は、その言語またはスクリプトを効果的にサポートするモデルを調査し（オンラインリソースまたはプロバイダーのドキュメントを参照）、それらのモデルIDを代替として追加してください。

このリストは、36の対象ロケールを持つ大規模なドキュメンテーションプロジェクトで**広範なロケール対応のテスト**が行われました。実用的なデフォルトとして機能しますが、すべてのロケールで良好に動作する保証はありません。

例 `translationModels`（`npx ai-i18n-tools init`と同じデフォルト値）:

<details>
<summary>デフォルトのtranslationModelsフォールバックリスト</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

アクティブなプロバイダーのAPIキー環境変数（例：`OPENROUTER_API_KEY`）を環境または`.env`ファイルに設定します。

`translationModels`を変更する前に、`npx ai-i18n-tools check-models`を実行してください。このコマンドはすべてのプロバイダーに対して、設定されたモデルIDをそのプロバイダーの実際のモデル一覧（`GET /models`）と照合し、存在しないIDや`expiration_date`を過ぎたIDを報告し、有効なモデルの一覧を表示します。また、設定されたIDのいずれかが無効な場合、終了ステータスは非ゼロになります。プロバイダーが価格情報を返す場合（例：OpenRouter）、入力／出力の推定価格（100万トークンあたりの米ドル）も表示されます。

設定されたモデルを実際の翻訳作業で比較するには、`npx ai-i18n-tools bench-models` を実行します。これは、各モデルを個別に（並行して、`concurrency` で制限して）1 つのサンプルを翻訳し、モデルごとの入出力トークン、実時間、USD コストを出力するため、`translationModels` の順序を決定する前に速度と価格を比較検討できます。

<a id="features"></a>
### `features`

| フィールド | パイプライン | 説明 |
|---|---|---|
| `translateUIStrings` | 1 | `t("…")` / `i18n.t("…")` を `strings.json` に抽出し、エントリを翻訳してロケールごとのフラット JSON を書き込みます（抽出は自動的に実行されます。カタログのみを更新するには、スタンドアロンの `extract` を使用します）。 |
| `translateDocs` | 2 | `.md` / `.mdx` / `.astro` ページを翻訳。`docs[].docusaurusCatalogDir` が設定されている場合は Docusaurus シェルの JSON になります。 |
| `translateJson` | 3 | `json[]` 配下の任意のネストされた JSON（`translate-json`）。 |
| `translateSVG` | — | `.svg` ファイルを翻訳（トップレベルの `svg` ブロックが必要です）。 |

`features.translateSVG` が true かつトップレベルの `svg` ブロックが設定されている場合、`translate-svg` で **SVG** ファイルを翻訳します。`sync` コマンドは、両方が設定されている場合にそのステップを実行します（`--no-svg` でない限り）。

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  `t("…")`呼び出しをスキャンするディレクトリまたはグロブパターン（カレントディレクトリからの相対パス）。`src/`や`["src/**/*.ts"]`のようなパターンをサポートします。
- `stringsJson`  
  マスターカタログファイルへのパス。`extract`によって更新されます。
- `flatOutputDir`  
  ロケールごとのJSONファイル（`de.json`など）が書き込まれるディレクトリ。
- `preferredModel`  
  オプション。`translate-ui`のみで最初に試行されるモデルID。その後、アクティブなプロバイダーの`translationModels`が順に試行され、このIDの重複はありません。
- `uiExtractor.funcNames`（またはレガシー`reactExtractor.funcNames`）  
  スキャンする追加の関数名（デフォルト：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（またはレガシー`reactExtractor.extensions`）  
  含めるファイル拡張子（デフォルト：`[".js", ".jsx", ".ts", ".tsx"]`）。Astroフロントマターおよびテンプレート式用に`.astro`を追加します。
- `uiExtractor.includePackageDescription`（またはレガシー`reactExtractor.includePackageDescription`）  
  `true`（デフォルト）の場合、`extract`は、存在する場合、UI文字列として`package.json` `description`も含まれます。
- `uiExtractor.packageJsonPath`（またはレガシー`reactExtractor.packageJsonPath`）  
  オプションの説明抽出に使用される`package.json`ファイルへのカスタムパス。
- `uiExtractor.includeUiLanguageEnglishNames`（またはレガシー`reactExtractor.includeUiLanguageEnglishNames`）

`true`（デフォルトは`false`）の場合、`extract`は、バンドルされたui-languagesマスターカタログ（`sourceLocale` + `targetLocales`から構築）の各`englishName`を、ソーススキャンからまだ存在しない場合（同じハッシュキー）に`strings.json`に追加します。`uiLanguagesPath`は読み取りません。

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLiteキャッシュディレクトリ（すべての`docs`ブロックで共有）。デフォルトは`.translation-cache`。実行間で再利用します。カスタムのドキュメント翻訳キャッシュから移行する場合は、それをアーカイブまたは削除してください。`cacheDir`は独自のSQLiteデータベースを作成し、他のスキーマとは互換性がありません。

<a id="best-practice-for-git-exclusions"></a>
#### Git 除外のベストプラクティス:

- 一時的なキャッシュアーティファクトをコミットしないように、翻訳キャッシュフォルダーの内容を除外します（例: `.gitignore` または `.git/info/exclude` を使用）。
- `cache.db` を保持します（定期的に削除しないでください）。SQLite キャッシュを保持することで、変更されていないセグメントの再翻訳を防ぎます。これにより、`ai-i18n-tools` を使用するソフトウェアの更新や修正時に、ランタイムと API コストの両方を節約できます。
- バックアップやデバッグ関連のファイルをコミットしないように、一時ファイルとログファイルを除外します。

<br/>

**例:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

ドキュメントパイプラインブロックの配列。`translate-docs`と`sync`のドキュメントフェーズは、各ブロックを順番に**処理します**。レガシーキーはロード時に引き続き受け入れられ、設定ファイルが書き込み可能であれば書き換えられます。新しい設定では現在の名前を優先してください。

| レガシーキー | 現在のキー / 動作 |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| トップレベルの`openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | 削除済み（`docs[].docusaurusCatalogDir`または`json[]`を使用） |
| `features.extractUIStrings` | 削除済み（`extract`はUI翻訳の前に実行されます） |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor`（エイリアスは引き続き受け入れられます） |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**コンテンツソース**

- `description`
このブロックの任意の読み取り可能なメモ（翻訳では使用されません）。設定されている場合、`translate-docs` `🌐` ヘッドラインの先頭に付加され、`status` セクションヘッダーにも表示されます。
- `contentPaths`
翻訳対象の Markdown/MDX ページ本文および `.astro` テンプレート（`translate-docs` が `.md`、`.mdx`、`.astro` をスキャンします）。**ディレクトリパスまたはワイルドカードパターン**（例：`"docs/**/*.md"`、`"guides/*.mdx"`、`"src/pages/index.astro"`）をサポートします。ローカライズされたドキュメントの本文はここから取得されます。
- `sourceFiles`
読み込み時に `contentPaths` にマージされる任意のエイリアス。
- `targetLocales`
このブロックにのみ適用される任意のロケールのサブセット（指定しない場合はルートの `targetLocales` を使用）。有効なドキュメントロケールは、すべてのブロックの和集合となります。
- `docusaurusCatalogDir`
任意。このブロックの Docusaurus JSON ラベルカタログのソースディレクトリ（例：`"i18n/en"` から `docusaurus write-translations`）。ページ本文は常に `contentPaths` から取得されます。`docusaurusCatalogDir` はシェル/UI の JSON のみを提供し、MDX は対象外です。

**出力レイアウト**

- `outputDir`
このブロックの翻訳済み出力のルートディレクトリ。
- `docsOutput.style`
`"nested"`（デフォルト）、`"flat"`、`"doc-system"`、またはエイリアス`"docusaurus"` / `"astro-starlight"` / `"vitepress"`。
- `docsOutput.localeSubpath`
`doc-system`の`{locale}/`と`{relativeToDocsRoot}`の間のパスセグメント（`style: "doc-system"`を直接使用する場合に必須。エイリアスを使用する場合はプリセット）。Starlightスタイルのロケールフォルダには`""`を使用します。
- `docsOutput.docsRoot`
Docusaurusレイアウトのソースドキュメントルート（例：`"docs"`）。省略した場合のデフォルトは`"docs"`。
- `docsOutput.pathTemplate`
カスタムMarkdown出力パス。プレースホルダー：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `docsOutput.jsonPathTemplate`
ラベルファイルのカスタムJSON出力パス。`pathTemplate`と同じプレースホルダーをサポートします。
- `docsOutput.localePathLowercase`
`true`の場合、組み込みの出力レイアウト（`nested`、`flat`、`doc-system`（`pathTemplate`なし））は、パスに小文字のロケールセグメントを使用します。デフォルトは`false`。`astro-starlight`と`doc-system`は、空の`localeSubpath`の場合、設定ロード時にデフォルトで`true`になります。
- `docsOutput.flatPreserveRelativeDir`
`docsOutput.style = "flat"`の場合、ソースサブディレクトリを保持して、同じベース名のファイルが衝突しないようにします。デフォルトは`false`。
- `docsOutput.rewriteRelativeLinks`
翻訳後に相対リンクを書き換えます（`docsOutput.style = "flat"`でカスタム`pathTemplate`がない場合に自動的に有効になります）。
- `docsOutput.linkRewriteDocsRoot`
フラットリンクの書き換えプレフィックスを計算する際に使用されるリポのルート。通常、翻訳されたドキュメントが別のプロジェクトルートにある場合を除き、これは`"."`のままにしておきます。
- `docsOutput.rewriteVitepressLinks`
`true`の場合、翻訳後にVitePressリンク正規化ツールを実行します。`docsOutput.style`が`"vitepress"`の場合、デフォルトで有効になります。`docsRoot`の下の英語の隣にロケールフォルダがある`doc-system`レイアウトで使用します。READMEスタイルの`docs/guide/…`パスをサイトルート（`/guide/…`）に、ロケール相対の`../guide/…`リンクを書き換えます。VitePressツリー外のリポファイル（`LICENSE`、`examples/`）へのリンクには、英語のソースで完全なURLを使用してください — [VitePress統合 — READMEをドキュメントのホームページとして使用](/guide/vitepress-integration#readme-as-homepage)を参照してください。

**ポストプロセス**

- `docsOutput.postProcessing`
翻訳された **マークダウン本文**に対するオプションの変換 (YAML キーと非散文的なフロントマター値は保持されます)。セグメントの再構成とリンクの書き換え (フラットまたは VitePress) の後、`addFrontmatter` の前に実行されます。
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` の順序付きリスト。`search` は正規表現パターンです (プレーン文字列はフラグ `g` または `/pattern/flags` を使用します)。`replace` は `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` などのプレースホルダーをサポートします。
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — ソースおよび翻訳されたマークダウンで、境界のある「他の言語で読む」リンク行を再生成します。`label: "local"` の場合、エンドニムラベルには `uiLanguagesPath` (または `ui.flatOutputDir/ui-languages.json` のマニフェスト) が必要です。

**動作とメタデータ**

- `translateFrontmatterFields`
`docsOutput`と同じレベル（`docs[]`ブロックごと）。デフォルトの`true`：Starlight/Docusaurus（`title`、`description`、`sidebar.label`、`sidebar_label`、`keywords`、`hero.title`、`hero.tagline`、`hero.image.alt`、`hero.actions[].text`、`pagination_label`、`prev`/`next`ラベル）のユーザー向けYAML散文を翻訳します。フロントマターブロック全体を変更しないようにするには、`false`を設定します。特定のドットパスに制限するには、文字列配列を渡します。
- `segmentSplitting`
`docsOutput`と同じレベル（`docs[]`ブロックごと）。`translate-docs`抽出のためのオプションのよりきめ細かいセグメント：`{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`。`enabled`が`true`（`segmentSplitting`が省略された場合のデフォルト）の場合、密な段落、GFMパイプテーブル（最初のチャンクにはヘッダー、セパレーター、最初のデータ行が含まれます）、および長いリストは分割されます。サブパーツは単一の改行（`tightJoinPrevious`）で再結合されます。空白行で区切られたボディブロックごとに1つのセグメントのみを使用するには、`"enabled": false`を設定します。`qualityRetrySplit`が`true`（デフォルト）の場合、すべてのモデルが使い果たされた後にAST検証に失敗したマークダウンセグメントは、段階的に分割され、最初のモデルから再試行されます。`maxQualityRetrySplitDepth`（デフォルトは`3`）は再帰的な分割を制限します。
- `warnMarkdownSourceIssues`
`true`（省略された場合のデフォルト）の場合、各`translate-docs`実行は、危険な区切り文字/閉じられていないインラインコードについてマークダウンセグメントを再スキャンし、端末警告を出力し、そのファイルのキャッシュファイルパスの`markdown_source_issues`行を置き換えます。このブロックの警告とSQLite更新をスキップするには、`false`を設定します。
- `addFrontmatter`
`true`（省略された場合のデフォルト）の場合、翻訳されたマークダウンファイルにはYAMLキーが含まれます：`translation_last_updated`、`source_file_mtime`、`source_file_hash`、`translation_language`、`source_file_path`、および少なくとも1つのセグメントにモデルメタデータがある場合は`translation_models`（アクティブなプロバイダーからのモデルIDのソート済みリスト）。スキップするには`false`に設定します。
- `emphasisPlaceholders`
`docs[]`ブロックごと。`true`の場合、翻訳前にマークダウンの強調区切り文字をプレースホルダーとしてマスクします。CJKロケール（`zh`、`ja`、`ko`）および`rtlLocales`にリストされているロケールでは`true`がデフォルトです。それ以外の場合は`false`がデフォルトです。CLI `--emphasis-placeholders` / `--no-emphasis-placeholders`で上書き可能です。
- `rtlLocales`
強調プレースホルダーのデフォルトとしてRTLとして扱われるBCP-47コードのオプションの配列（組み込みのRTL検出とマージされます）。

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
省略可能。値が**引用符で囲まれた文字列**となる追加のJSX/HTML属性名で、翻訳に送信しないもの。組み込みの既定値（`class`、`id`、`style`、`src`、`href`、`type`、`data-*`、ほとんどの`aria-*`など）とマージされる。大文字小文字を区別しない。対象は以下のとおり。

- `.astro` パースして置換する抽出（静的HTMLタグおよび`attr=`内の`{expression}`ブロックの文字列リテラル）。
  - markdown/Astroセグメントの翻訳中にMDXプレースホルダーを抽出（大文字で始まるJSXタグの`label`、`tooltip`、`aria-label`、および該当する場合は`TabItem` `value`）。

例：`"protectAttributes": ["variant", "size"]`により、`variant="primary"`内の`{items.map(...)}`がすべてのロケールで変更されないまま保持される。

翻訳対象となる属性（たとえば`"title"`や`"aria-label"`）を、英語からそのままコピーしたい場合にもリストに含めることができます。

- `protectKeys`
省略可能。テンプレートの `{expression}` ブロックおよびMDXオブジェクトリテラル内（たとえば `label:` 内の `<Tabs values={[ … ]}>`）で、引用符で囲まれた文字列値を翻訳しない必要がある追加の **オブジェクトプロパティ名**。組み込みの既定値（`class`、`key`、`id`、`href`、`src` など）とマージされる。大文字小文字は区別しない。

例：`"protectKeys": ["slug", "code"]`により`{ slug: 'getting-started', title: 'Getting started' }`がスキップされる→`slug`が保護されている場合、`title`のみが翻訳される。

<br/>

**例（`docsOutput.style = "flat"` — スクリーンショットパス＋オプションの言語リストラッパー）：**

<details>
<summary>フラットレイアウトのpostProcessing例（スクリーンショット＋languageListBlock）</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

ネストされた JSON 翻訳パイプラインのトップレベル配列。`features.translateJson` が true の場合（`translate-json` または `sync` の JSON ステージ）にのみ使用されます。[JSON](/guide/json) を参照してください。

| フィールド | 説明 |
|-------|-------------|
| `description` | CLI / `status`用のオプションの注釈（翻訳対象外）。 |
| `contentPaths` | プロジェクトルート以下のソース`.json`ファイル、ディレクトリ、またはグロブ。 |
| `outputPathTemplate` | 各ターゲットロケールごとの必須出力パス。プレースホルダー：`{locale}`、`{LOCALE}`、`{llocale}`、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。 |
| `targetLocales` | このブロック用のオプションのサブセット。指定しない場合、ルートの`targetLocales`を使用。 |
| `keyPolicy.mode` | `allowlist`、`denylist`、または`both`。 |
| `keyPolicy.translateKeys` | モードが`allowlist`または`both`の場合に含めるドットパス／グロブ。 |
| `keyPolicy.skipKeys` | 除外するドットパス／グロブ（デフォルトの拒否リストには`id`、`slug`、`href`、`url`、`key`、`code`が含まれます）。 |

<a id="svg"></a>
### `svg`

SVGファイルのトップレベルのパスとレイアウト。`features.translateSVG`がtrueの場合（`translate-svg`または`sync`のSVGステージ経由）にのみ翻訳が実行される。

| フィールド            | 説明                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | 1つ以上のディレクトリ**またはグロブパターン**（例：`"images/*.svg"`、`"**/icons/*.svg"`）。これらのパターンはプロジェクトルートに対して相対的に解決され、`.svg`ファイルを再帰的にスキャンします。                                                                         |
| `outputDir`                   | 翻訳されたSVG出力のルートディレクトリ。                                                                                                                                                                                                                                          |
| `style`                       | `pathTemplate` が設定されていない場合のデフォルト値。`"flat"` または `"nested"`。                                                                                                                                                                                                                               |
| `pathTemplate`   | カスタムSVG出力パス。使用可能なプレースホルダー: <code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{relativeToSourceRoot}"</code>。 |
| `localePathLowercase` | `true` の場合、組み込みの `flat` / `nested` SVG レイアウトはロケールセグメントを小文字で使用します。カスタムの `pathTemplate` 値は変更されません。小文字のセグメントが必要な場合は `{llocale}` を使用してください。 |
| `forceLowercase` | SVGを再構成する際にテキストを小文字に変換します。すべて小文字のラベルに依存するデザインで有用です。                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| フィールド | 説明 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | 既存の翻訳から自動的に用語集を生成するための `strings.json` へのパス。                                                                                                 |
| `userGlossary` | `Original language string`（または `en`）、`locale`、`Translation` の列を持つCSVファイルへのパス。各行は1つのソース用語と対象ロケールに対応します（`locale` はすべての対象言語で `*` でも可）。 |
| `autoAddUserEditedToGlossary` | `true`の場合、UI文字列に対するダッシュボードの編集は、ユーザー用語集に自動的に追加できます。 |

**空の用語集CSVを生成する：**

```bash
npx ai-i18n-tools glossary-generate
```
