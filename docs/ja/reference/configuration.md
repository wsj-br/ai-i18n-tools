<a id="configuration-reference"></a>
# 設定リファレンス

<a id="sourcelocale"></a>
### `sourceLocale`

ソース言語の BCP-47 コードです (例: `"en-GB"`、`"pt-BR"`、`"ja"`)。どの言語でも有効です。多くのプロジェクトが英語で始まるため、例では英語が使用されています。このロケール用の翻訳ファイルは生成されません。キー文字列自体がソーステキストになります。

**実行時i18n設定ファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされた`SOURCE_LOCALE`と一致している必要があります**。

---

<a id="targetlocales"></a>
### `targetLocales`

翻訳対象のBCP-47ロケールコードの配列（例：`["de", "fr", "es", "pt-BR"]`）。

`targetLocales`はUI翻訳のための主要なロケールリストであり、ドキュメントブロックのデフォルトロケールリストでもあります。`generate-ui-languages`を使用して、`sourceLocale`と`targetLocales`から`ui-languages.json`マニフェストを構築します。

---

<a id="uilanguage-optional"></a>
### `uiLanguage`（オプション）

ツール自身のUI言語（CLIヘルプ、ログ/サマリー、および翻訳ダッシュボード）のBCP-47コード。`sourceLocale` / `targetLocales`とは独立しており、`-L` / `--ui-lang`フラグおよび`AI_I18N_LANG`環境変数によって上書きされます。不明な値はソースロケール（`en-GB`）に適切にフォールバックします — 厳密な検証は行われません。[ツールUI言語](/ja/guide/tool-ui-language)を参照してください。

---

<a id="languagesmanifestpath-optional"></a>
### `languagesManifestPath` (オプション)

ルートレベルのオプション文字列。ドキュメントの言語切り替え機能はこのパスを読み取ります。省略した場合、最初のUIブロックのマニフェスト、つまりそのブロックの `languagesManifestPath` または `{flatOutputDir}/ui-languages.json` がデフォルトになります。各UIブロックは独自の `languagesManifestPath` を設定できます。ブロック0は、そのブロックで省略されている場合にこのルートパスを使用します。

以下のときに使用します：

- マニフェストは `ui.flatOutputDir` の外に配置する必要があります（例えば `src/i18n/` のアプリヘルパーの隣など）。
- [言語スイッチャーの後処理](#language-switcher-languagelistblock)（`languageListBlock`）で、バンドルされたマスターカタログのみではなく、プロジェクトマニフェストからロケールラベルを構築したい場合。

`includeUiLanguageEnglishNames` はこのファイルを**読み取りません** — バンドルされたマスターカタログを使用します（下記の `ui.uiExtractor` を参照）。

**レガシー:** 設定ファイルの読み込み時にルートレベルの `uiLanguagesPath` は引き続き受け付けられ、自動的に `languagesManifestPath` に書き換えられます。

---

<a id="concurrency-optional"></a>
### `concurrency`（オプション）

同時に翻訳されるターゲットロケールの最大数（`translate-ui`、`translate-docs`、`translate-svg`、および`sync`内の対応するステップ）。省略された場合、CLIはUI翻訳には**4**を、ドキュメント翻訳には**3**を使用します（組み込みのデフォルト）。実行ごとに`-j` / `--concurrency`で上書きします。

---

<a id="batchconcurrency-optional"></a>
### `batchConcurrency`（オプション）

**translate-docs**、**translate-svg**、および**translate-json**（および`sync`内の対応するステップ）：ファイルあたりの最大並列LLM**batch**リクエスト数（各バッチには多数のセグメントを含めることができます）。省略時のデフォルトは**4**です。`translate-ui`には適用されません — 代わりに`uiBatchConcurrency`を使用してください。`-b` / `--batch-concurrency`で上書きします。

---

<a id="uibatchconcurrency-optional"></a>
### `uiBatchConcurrency`（オプション）

**translate-ui**、**sync-ui**、および`sync`のUIステップ：**単一ロケール内**での最大並列LLM**batch**リクエスト数（50のプレーン文字列チャンク、次に複数形グループ）。省略時のデフォルトは**2**です。`concurrency`（並列ターゲットロケール）および`batchConcurrency`（docs/JSON/SVG）とは独立しています。CLIフラグはありません。configで設定するか、プログラマティックな`runTranslateUI`に`uiBatchConcurrency`を渡してください。

**例:**

```json
{
  "uiBatchConcurrency": 2
}
```

デフォルトのロケール並列数**4**の場合、最大**8**の実行中UI API呼び出しになります。1つの大きなロケールを翻訳する場合はこの値を上げてください（`-l de`）。プロバイダーがレート制限を設けている場合は低く保ってください。

---

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

---

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars`（オプション）

**translate-docs**、**translate-svg**、および**translate-json**のセグメントバッチ処理：APIリクエストごとのセグメント数と文字数の上限。デフォルト：**20**セグメント、**4096**文字（省略した場合）。

---

<a id="requesttimeout--requesttimeoutms-optional"></a>
### `requestTimeout` / `requestTimeoutMs`（任意）

各LLMリクエストの最大待機時間。すべてのプロバイダーに適用されます。`requestTimeout`は秒単位、`requestTimeoutMs`はミリ秒単位です。両方を省略した場合のデフォルトは**45**秒です。いずれか一方のみを設定してください。プロバイダーがいずれかのフィールドを設定している場合、そのプロバイダーではその値が優先されます。

---

<a id="provider-and-providers"></a>
### `provider` と `providers`

`provider`（トップレベル、オプション）は、`providers`からアクティブなプロバイダーキーを選択します。プロバイダーが1つだけ設定されている場合はオプションですが、複数設定されている場合は必須です。

`providers`（トップレベル）は、プロバイダーキーをそのブロックにマッピングします。組み込みキー（以下のプリセットテーブルを参照）には`translationModels`のみが必要ですが、その他のキーはカスタムのOpenAI互換エンドポイントを定義し、`baseUrl`（エンドポイントがキーを必要としない場合を除き、`apiKeyEnv`も）が必要です。

各`providers.<name>`ブロックは以下を受け入れます：

- `translationModels`
  優先されるモデルIDの順序付きリスト（プレーンなアップストリームID、`provider/`プレフィックスなし。OpenRouter IDはネイティブの`vendor/model`形式を保持します）。最初に試行され、その後のエントリはエラー時のフォールバックです。より具体的な階層が適用されない場合、これはすべてのパイプラインのグローバルなデフォルトチェーンです。
- `uiModels`（オプション）
  `translate-ui`、複数形生成（ステップ0およびパスB）、および`proofread-ui`用のUI専用モデルの順序付きリスト。ターゲットロケールに一致する`localeModels`エントリの後に、`translationModels`の前に試行されます。
- `localeModels`（オプション）
  **すべての**翻訳パイプラインに対するロケールごとの上書き。`{ "locale": "<BCP-47>", "models": ["…"] }`オブジェクトの配列。ロケールタグはケースインセンシティブに照合されます（`pt-br` = `pt-BR`）。各ロケールのリストは、そのロケールに対してのみ最初に試行され、次にパイプライン固有の階層（UIの場合は`uiModels`）と`translationModels`が試行されます。重複する正規化されたロケールキーは、設定の読み込み時に拒否されます。
- `baseUrl`
  OpenAI互換のベースURL。プリセットのベースURLを上書きします。プリセット以外のプロバイダーには必須です。
- `apiKeyEnv`
  APIキーを保持する環境変数。プリセットの環境変数をオーバーライドします。
- `headers`
  このプロバイダーへのすべてのリクエストとともに送信される追加のHTTPヘッダー。
- `maxTokens`
  リクエストあたりの最大完了トークン数。デフォルト: `8192`。
- `temperature`
  サンプリング温度。デフォルト: `0.2`。
- `requestTimeout`
  このプロバイダーへの各リクエストを待機する最大時間（秒）。トップレベルの`requestTimeout` / `requestTimeoutMs`を上書きします。このプロバイダーもトップレベルの設定もタイムアウトを設定しない場合、デフォルトは`45`秒です。同じオブジェクトで`requestTimeout`と`requestTimeoutMs`のいずれか一方のみを設定してください。
- `requestTimeoutMs`
  このプロバイダーへの各リクエストを待機する最大時間（ミリ秒）。トップレベルの`requestTimeout` / `requestTimeoutMs`を上書きします。このプロバイダーもトップレベルの設定もタイムアウトを設定しない場合、デフォルトは`45000`（45秒）です。同じオブジェクトで`requestTimeout`と`requestTimeoutMs`のいずれか一方のみを設定してください。
- `pricing`（オプション）
  プロバイダー全体の100万トークンあたりのUSD: `{ "inputPerMTokens": 0.15, "outputPerMTokens": 0.6 }`。請求対象の呼び出しにプロバイダーが報告した`usage.cost`がない場合（OpenRouterおよびCheaper Inference以外のほとんどのプロバイダー）、このレートがその呼び出しの入力および出力トークンに適用されます。この金額は翻訳サマリーに含まれ、`api_calls`行に保存されます。

コストソースは次の順序で解決されます。

1. 一致する`modelPricing`エントリ（このプロバイダーのデフォルトを上書きします）。
  2. プロバイダーが報告したコスト（置き換えられることはありません）。
  3. この`pricing`レート。
  4. そのモデルIDのmodels.devリスト価格（入力および出力の100万トークンあたりのUSD）。

コストなしで保存された行は、後で[`usage`](/ja/reference/cli-commands/workflows#usage)および[使用状況とコスト](/ja/guide/translation-dashboard/usage)によって見積もることができます。これらのソースのいずれも適用されない場合、コストは不明（`—`）のままで、`$0.00`になることはありません。
- `modelPricing`（オプション）
  モデルごとの100万トークンあたりのUSD: `{ "<model-id>": { "inputPerMTokens": 2.5, "outputPerMTokens": 10 } }`。そのモデルIDの`pricing`を上書きします。プロバイダーが`usage.cost`を省略した場合に呼び出し時に適用され、呼び出しとともに保存されます。
- `zeroDataRetention`（オプション、`providers.cheaperinference`のみ）
  `true`の場合、チャットリクエストは`"zdr": true`と`list-models`を送信し、`check-models`と`suggest-models`は`GET /v1/models?zdr=true`をロードします。省略された場合はオフを意味します。[ゼロデータ保持](/ja/guide/providers-and-models#cheaperinference-zero-data-retention)を参照してください。

組み込みプロバイダープリセット（キー — ベースURL — APIキー環境変数）：

<div class="provider-presets">

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
| `cheaperinference` | `https://api.cheaperinference.com/v1` | `CHEAPERINFERENCE_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | （なし） |

</div>

従来のトップレベル`openrouter`ブロック（`baseUrl`、`translationModels`、`defaultModel`、`fallbackModel`、`maxTokens`、`temperature`、`requestTimeout`、`requestTimeoutMs`を含む）は引き続き受け付けられ、ロード時に`providers.openrouter`（`provider: "openrouter"`を含む）へ自動マイグレーションされます。`defaultModel` / `fallbackModel`は`translationModels`に統合されます。

1つの設定で複数のプロバイダーを構成し、`-P`で切り替える実行可能な例については、[`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/)を参照してください（`openai`、`anthropic`、`openrouter`、`deepseek`は同じドキュメント上にあります）。

**複数のモデルを使用する理由:** プロバイダーやモデルが異なれば、コストも異なり、言語やロケールによって品質のレベルも異なります。リクエストが失敗した場合に CLI が次のモデルを試せるように、`translationModels` を順序付けられたフォールバック チェーンとして設定します。そのリストを作成するためのガイドは [AI モデル](/ja/guide/ai-models) です。

以下のリストを **ベースライン**として扱ってください。[AI モデル](/ja/guide/ai-models) のベンチマーク ランキングから置き換えてください。特定のロケールの翻訳の質が低いままの場合は、その言語またはスクリプトの `localeModels` エントリを追加するか、プロバイダーのカタログからさらに ID を追加してください。

これらのモデルIDは`ai-i18n-tools init -P openrouter`が書き込むものです。他のプリセットは`init -P <provider>`からネイティブモデルIDを取得します — [組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)を参照してください。

このリストは、36の対象ロケールを持つ大規模なドキュメンテーションプロジェクトで**広範なロケール対応のテスト**が行われました。実用的なデフォルトとして機能しますが、すべてのロケールで良好に動作する保証はありません。

例 `translationModels` (`ai-i18n-tools init -P openrouter`からのOpenRouterリスト):

<details>
<summary>OpenRouterのtranslationModelsリスト</summary>

```json
"translationModels": [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "openai/gpt-4o-mini",
  "google/gemma-4-26b-a4b-it",
  "~anthropic/claude-haiku-latest",
  "z-ai/glm-5.2",
  "google/gemini-3.5-flash",
  "~anthropic/claude-sonnet-latest"
  // … add more fallback models as needed
]
```

</details>

**推奨される `uiModels`:** UI文字列は短いですが非常に目立ちます。プレミアムモデルを使用すると、トーン、複数形、一貫性が向上することがよくあります。オプションの `uiModels` は、一致する `localeModels` エントリの後、かつ `translationModels` の前に試行されます（上記のフィールドリストを参照）。例:

<details>
<summary>UI翻訳に推奨されるuiModels</summary>

```json
"uiModels": [
  "~anthropic/claude-sonnet-latest",
  "z-ai/glm-5.2"
]
```

</details>

**アジア言語に推奨される `localeModels`:** 日本語、韓国語、中国語のロケールは、これらのスクリプトにチューニングされたモデルを使用すると効果的であることがよくあります。ターゲットロケールが一致する場合に **最初に** （`uiModels` / `translationModels` の前に）試行されるロケールごとのオーバーライドを追加します:

<details>
<summary>ja, ko, zh-Hans, zh-Hantに推奨されるlocaleModels</summary>

```json
"localeModels": [
  { "locale": "ja",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "ko",      "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "zh-Hans", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] },
  { "locale": "zh-Hant", "models": [ "z-ai/glm-5.2", "minimax/minimax-m2.7" ] }
]
```

</details>

<br />

アクティブなプロバイダーのAPIキー環境変数（[プリセットテーブル](/ja/guide/providers-and-models#built-in-providers)を参照）を、環境または`.env`ファイルに設定してください。

モデルリストを変更する前に、`ai-i18n-tools check-models`を実行してください。各プロバイダーについて、設定されたすべてのモデルID（`translationModels`、`uiModels`、およびすべての`localeModels`エントリ）をそのプロバイダーのライブモデルリスト（`GET /models`）と照合して検証し、欠落しているまたは`expiration_date`を過ぎたIDを報告し、有効なモデルをリスト表示し、無効なIDが1つでもあれば非ゼロで終了します。プロバイダーが価格情報を返す場合（例: OpenRouter）、推定入力/出力価格（100万トークンあたりのUSD）も表示されます。

設定したモデルを実際の翻訳作業で比較するには、`ai-i18n-tools bench-models`を実行してください。`translationModels`、`uiModels`、および`localeModels`のすべての一意なモデルIDについて、それぞれを個別に（並列で、`concurrency`で制限）1つのサンプルを翻訳してベンチマークし、モデルごとの入力/出力トークン数、経過時間、USDコストを出力します。これにより、モデルリストを確定する前に速度と価格のバランスを検討できます。

---

<a id="features"></a>
### `features`

| フィールド | パイプライン | 説明 |
|---|---|---|
| `translateUIStrings` | 1 | `t("…")` / `i18n.t("…")` を `strings.json` に抽出し、エントリを翻訳してロケールごとのフラット JSON を書き込みます（抽出は自動的に実行されます。カタログのみを更新するには、スタンドアロンの `extract` を使用します）。 |
| `translateDocs`      | 2        | `.md` / `.mdx` / `.astro` / `.html` / `.htm` ページを翻訳します。`docs[].docusaurusCatalogDir` が設定されている場合は Docusaurus のシェル JSON、設定されている場合は Nextra の `_meta` / 辞書、`docsOutput.vitepressThemeCatalog` が設定されている場合は VitePress テーマ、`docsOutput.style` が `"fumadocs"` の場合は Fumadocs の `meta.json` / UI カタログも翻訳します。 |
| `translateJson` | 3 | `json[]` 配下の任意のネストされた JSON（`translate-json`）。 |
| `translateSVG` | — | `.svg` ファイルを翻訳（トップレベルの `svg` ブロックが必要です）。 |

キーが省略された場合、各フラグはデフォルトで`true`になります。動作は次のとおりです。

- 翻訳するものがない`true`が省略された場合、スキップされます。つまり、UIブロックに`sourceRoots`がなく、ドキュメントブロックに`contentPaths`または`docusaurusCatalogDir`がなく、`json[]`に`contentPaths`がなく、または`svg`が設定されていません。
- そのパイプラインに作業がない場合にフラグを`true`と記述すると、設定エラーになります。
- `false`と記述すると、ソースが存在する場合でも、`sync`のそのパイプラインがオフになります。
- `--no-ui`、`--no-docs`、`--no-json`、および`--no-svg`は、1回の実行でそのステップをスキップします。

**Translate** は、`features.translateSVG` が true で、トップレベルの `svg` ブロックが設定されている場合、`translate-svg` を使用して SVG ファイルを翻訳します。`sync` コマンドは、フラグがオンで `svg` が設定されている場合にそのステップを実行します（`--no-svg` の場合を除く）。

---

<a id="ui"></a>
### `ui`

1つのカタログオブジェクト、またはカタログブロックの配列（`docs[]` と同じ概念）。単一のオブジェクトは読み込み時に受け入れられ、1要素の配列にラップされます。ディスク上のファイルは書き換えられません。解析後、`config.ui` は常に配列になります。

`extract`、`translate-ui`、`sync-ui`、`sync` のUIフェーズ、`proofread-ui`、`export-ui-xliff`、`generate-ui-languages`、および `purge-locale` は、`sourceRoots` を持つすべてのブロックを走査します。1つのブロックを実行するには、`--ui-block` に0始まりのインデックス、ブロックの `description`、またはその `stringsJson` パスを渡します。`status` と `statistics` は、ソースまたは既存のカタログを持つすべてのブロックをリストします。翻訳ダッシュボードは、そのようなすべてのカタログをリストし、複数ある場合はセレクターを表示します。

解決された `stringsJson`、`flatOutputDir`、およびマニフェストパスは、ブロック間で一意である必要があります。`description` の値は、設定されている場合、一意である必要があります。これは、`--ui-block` がそれらを完全に一致させるためです。

- `description`
  設定を読む人向けのオプションのメモ（モデルには送信されません）。コマンドヘッダー、`status`、`statistics`、およびダッシュボードでは `ui[i] — description` として表示されます。
- `sourceRoots`
  `t("…")` 呼び出しのためにスキャンされるディレクトリまたは glob パターン（cwd からの相対パス）。`src/` や `["src/**/*.ts"]` のようなパターンをサポートします。空のリストを持つブロックは、`--ui-block` で指定されていない限りスキップされますが、指定するとエラーになります。
- `stringsJson`
  このブロックのマスターカタログファイルへのパス。`extract` によって更新されます。
- `flatOutputDir`
  このブロックのロケールごとの JSON ファイルが書き込まれるディレクトリ（`de.json` など）。
- `flatOutput`
  `true` (デフォルト) の場合、`translate-ui` はロケールごとに 1 つのフラットな JSON ファイルを書き込みます。gettext 専用のブロックには `false` を設定します。`flatOutput: false` を持つブロックは `gettext` を設定する必要があります。
- `gettext`
  このブロックのオプションの GNU gettext 出力です。`outputDir` (デフォルトは `./locales`) は `<locale>/LC_MESSAGES/<domain>.po` を受け取り、`compileMo` が true (デフォルト) の場合は、一致する `.mo` を受け取ります。`domain` のデフォルトは `messages` です。`potPath` はテンプレートカタログです。`ingestExistingPo` (デフォルトは `true`) は、`extract` 中に、あいまい (fuzzy) でない `msgstr` の値から空の `strings.json` スロットを埋めます。空でない翻訳やユーザーが編集した翻訳は置き換えません。`localeFormat` は `posix` (デフォルト、`pt_BR`) または `bcp47` (`pt-BR`) です。コンテキストを持つ行は gettext の `\u0004` 区切り文字を使用します。2 つのコンテキストで同じソース言語の文字列がカタログ ID を共有することはありません。
- `targetLocales`
  このブロックのオプションのロケールリストです。省略または空の場合、ブロックはルートの `targetLocales` を使用します。
- `languagesManifestPath`
  `extract` と `generate-ui-languages` がこのブロックの `ui-languages.json` を書き込むオプションのパスです。省略した場合、ブロック 0 はルートの `languagesManifestPath` (それ自体はこのブロックの `{flatOutputDir}/ui-languages.json` がデフォルト) を使用します。それ以降のブロックは `{flatOutputDir}/ui-languages.json` がデフォルトになります。
- `uiGlossary`
  `true`（デフォルト）の場合、このブロックの `strings.json` は `translate-docs`、`translate-json`、および `translate-svg` の用語集ヒントソースとなります。`translate-ui`、`proofread-ui`、およびソースのリンティングは `glossary.userGlossary` のみを使用します。カタログをこれらのヒントから除外するには `false` を設定してください（例：ドキュメントを誘導すべきではない CLI 文字列カタログなど）。
- `uiExtractor.funcNames`（またはレガシー `reactExtractor.funcNames`）
  スキャンする追加の関数名（デフォルト：`["t", "i18n.t"]`）。
- `uiExtractor.extensions`（またはレガシー `reactExtractor.extensions`）
  含めるファイル拡張子（デフォルト：`[".js", ".jsx", ".ts", ".tsx"]`）。Astro のフロントマターおよびテンプレート式を含めるには `.astro` を追加してください。
- `uiExtractor.includePackageDescription`（またはレガシー `reactExtractor.includePackageDescription`）
  `true`（デフォルト）の場合、`extract` は存在時に `package.json` `description` を UI 文字列として含めます。同じ説明がすべてのカタログに抽出されないように、追加のブロックで `false` を設定してください。
- `uiExtractor.packageJsonPath`（またはレガシー `reactExtractor.packageJsonPath`）
  そのオプションの説明抽出に使用される `package.json` ファイルへのカスタムパス。
- `uiExtractor.includeUiLanguageEnglishNames`（またはレガシー `reactExtractor.includeUiLanguageEnglishNames`）

`true`（デフォルトは `false`）の場合、`extract` は、ソーススキャンからまだ存在しない（同じハッシュキーの）各 `englishName` を、バンドルされた ui-languages マスターカタログ（`sourceLocale` + ブロックの有効な `targetLocales` から構築）から `strings.json` に追加します。`languagesManifestPath` は読み取りません。

`glossary.uiGlossary` と `glossary.uiGlossaryFromStringsJson` は受け入れられなくなりました。設定の読み込みに失敗し、エラーで代替手段が説明されます。キーを削除してください。ヒントは現在、各ブロックの `uiGlossary` フラグ（デフォルトは `true`）から取得されます。

---

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite キャッシュディレクトリ（すべての `docs` ブロックで共有）。デフォルトは `.translation-cache` です。実行間で再利用されます。カスタムドキュメント翻訳キャッシュから移行する場合は、アーカイブするか削除してください。`cacheDir` は独自の SQLite データベースを作成するため、他のスキーマとは互換性がありません。`suggest-models` はベンチマークの集計も `<cacheDir>/benchmark-scores.json` に保存します。そのファイルはディレクトリの他の部分と同様にキャッシュであり、公開パッケージの一部ではありません。

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

---

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
| `glossary.uiGlossary` と `glossary.uiGlossaryFromStringsJson` | 削除されました。設定の読み込みに失敗します。`ui[].uiGlossary` (ブール値、デフォルトは `true`) を使用してください |
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
オプション。このブロックの Docusaurus JSON ラベルカタログのソースディレクトリ（例: `docusaurus write-translations` からの `"i18n/en"`）。ページ本文は常に `contentPaths` から取得されます。`docusaurusCatalogDir` はシェル/UI JSON のみを提供し、MDX は提供しません。
- `nextraMetaGlob`
オプション。`docsRoot` 配下の Nextra `_meta.ts` / `_meta.tsx` / `_meta.js` のグロブ。`docsOutput.style` が `"nextra"` で、これが省略されている場合、`docsRoot` 配下のすべての `_meta` ファイルが自動的に収集されます。
- `nextraMetaTranslatableKeys`
オプション。Nextra `_meta` オブジェクトで文字列値が翻訳されるプロパティ名（デフォルト: `title`、`display`、`breadcrumb`）。
- `nextraDictionaryPath`
オプション。英語の Nextra テーマ辞書モジュール（例: `"app/_dictionaries/en.ts"`）。`translate-docs` 中に `{dir}/{locale}.ts` に翻訳されます。
- `nextraDictionaryOutputTemplate`
オプション。ロケール辞書モジュールの出力テンプレート（デフォルト: 辞書ディレクトリに対する `{dir}/{locale}.ts`）。

<a id="docsoutput"></a>
#### `docsOutput`

このブロックの出力レイアウトです。

- `outputDir`
このブロックの翻訳済み出力のルートディレクトリ。
- `docsOutput.style`
`"nested"`（デフォルト）、`"flat"`、`"doc-system"`、またはエイリアス `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`。
- `docsOutput.localeSubpath`
`{locale}/` と `{relativeToDocsRoot}` の間の `doc-system` のパスセグメント（`style: "doc-system"` を直接使用する場合は必須。エイリアスを使用する場合はプリセット）。Starlight スタイルのロケールフォルダには `""` を使用します。
- `docsOutput.docsRoot`
Docusaurus レイアウトのソースドキュメントルート（例: `"docs"`）。省略した場合のデフォルトは `"docs"`。
- `docsOutput.pathTemplate`
カスタムMarkdown出力パス。プレースホルダー：<code>"{outputDir}"</code>、<code>"{locale}"</code>、<code>"{LOCALE}"</code>、<code>"{llocale}"</code>、<code>"{relPath}"</code>、<code>"{stem}"</code>、<code>"{basename}"</code>、<code>"{extension}"</code>、<code>"{docsRoot}"</code>、<code>"{relativeToDocsRoot}"</code>。
- `docsOutput.jsonPathTemplate`
ラベルファイルのカスタムJSON出力パス。`pathTemplate`と同じプレースホルダーをサポートします。
- `docsOutput.localePathLowercase`
`true`の場合、組み込みの出力レイアウト（`nested`、`flat`、`doc-system`（`pathTemplate`なし））は、パスに小文字のロケールセグメントを使用します。デフォルトは`false`。`astro-starlight`と`doc-system`は、空の`localeSubpath`の場合、設定ロード時にデフォルトで`true`になります。
- `docsOutput.flatPreserveRelativeDir`
`docsOutput.style = "flat"`の場合、ソースサブディレクトリを保持して、同じベース名のファイルが衝突しないようにします。デフォルトは`false`。
- `docsOutput.rewriteRelativeLinks`
翻訳後に相対リンクを書き換えます (`docsOutput.style = "flat"`が有効で、カスタムの`pathTemplate`がない場合に自動的に有効になります)。
- `docsOutput.linkRewriteDocsRoot`
フラットリンクの書き換えプレフィックスを計算する際に使用されるリポジトリのルート。翻訳されたドキュメントが別のプロジェクトルートにある場合を除き、通常はこれを`"."`のままにしておきます。
- `docsOutput.rewriteVitepressLinks`
`true`の場合、翻訳後にVitePressリンク正規化ツールを実行します。`docsOutput.style`が`"vitepress"`の場合、デフォルトで有効になります。`docsRoot`下のソースロケールファイルの隣にロケールフォルダがある`doc-system`レイアウトで使用します。ソース言語は`sourceLocale`であり、任意の言語にすることができます。READMEスタイルの`docs/guide/…`パスをサイトルート(`/guide/…`)およびロケール相対`../guide/…`リンクに書き換えます。VitePressツリー外のリポジトリファイル(`LICENSE`、`examples/`)へのリンクには、ソースロケールファイルで完全なURLを使用してください — [VitePress統合 — ドキュメントのホームページとしてのREADME](/ja/guide/integrations/vitepress#readme-and-the-docs-homepage)を参照してください。
- `docsOutput.rewriteNextraLinks`
`true`の場合、翻訳後にNextraリンク正規化ツールを実行します。`docsOutput.style`が`"nextra"`の場合、デフォルトで有効になります。Next.js `i18n`の場合、`content/en/…`および相対`.mdx`パスをロケールに依存しないサイトルート(`/guide/…`)に書き換えます。[Nextra統合 — リンク規則](/ja/guide/integrations/nextra#link-conventions)を参照してください。
- `docsOutput.fumadocsParser`
`"dot"` (デフォルト) または `"dir"`。ドットはソースロケールファイルの隣に`stem.{locale}.mdx`を書き込み、ディレクトリはNextraのようにロケールフォルダを書き込みます。ソース言語は`sourceLocale`であり、任意の言語にすることができます。[Fumadocs統合 — ページレイアウト](/ja/guide/integrations/fumadocs#page-layout)を参照してください。
- `docsOutput.rewriteFumadocsLinks`
`true`の場合、翻訳後にFumadocsリンク正規化ツールを実行します。`docsOutput.style`が`"fumadocs"`の場合、デフォルトで有効になります。コンテンツパスと相対`.mdx`リンクを`/docs/…`ルートに書き換えます。
- `docsOutput.fumadocsUiCatalog`
オプション。Fumadocs UIオーバーライドカタログのブートストラップ + `translate-docs`内の翻訳。フィールド: `sourcePath` (例: `lib/layout.shared.ts`), `catalogPath` (生成された英語JSON), オプションの`outputPathTemplate` (デフォルト: `catalogPath`の隣の`ui.{locale}.json`)。
- `docs[].fumadocsMetaGlob`
`docsOutput.style`が`"fumadocs"`の場合の`meta.json`コレクション用のオプションのglob。デフォルト: `docsOutput.docsRoot`下の再帰的な`meta.json`。
- `docs[].fumadocsMetaTranslatableKeys`
Fumadocs の `meta.json` で文字列値を翻訳するプロパティ名です（デフォルト: `title`、`description`）。
- `docsOutput.localizedAssets`
任意設定です。ロケールファイルが存在する場合に、翻訳後の HTML 内の画像およびアイコンの URL を置き換えます。フィールド: `include`（デフォルト `img/**`）、`pattern`（デフォルト `{stem}-{locale}{ext}`）、`onlyIfExists`（デフォルト `true`）、`assetRoot`（ルート相対 URL の確認に使用するディレクトリ。デフォルトは HTML ファイルのディレクトリ）。プレースホルダー: `{stem}`、`{ext}`、`{basename}`、`{locale}`、`{llocale}`、`{LOCALE}`。CSS の `url()` は書き換えられません。詳細は [HTML ページ](/ja/guide/documents/html-pages#links-and-images) を参照してください。
- `docsOutput.html`
HTML ドキュメント向けの、任意の言語リストおよび hreflang の設定です。デフォルトのコメントは `<!-- ai-i18n:lang-list -->` … `<!-- /ai-i18n:lang-list -->` および `<!-- ai-i18n:hreflang -->` … `<!-- /ai-i18n:hreflang -->` です。`languageList.format` は `links` または `select` です。`languageList.label` は `local`、`english`、`both` のいずれかです。`hreflang.siteUrl` は代替リンクの先頭に付加されます。省略した場合、リンクは相対リンクになり、警告がログに記録されます。`hreflang.xDefault` のデフォルトは `sourceLocale` です。`hreflang.stripIndexHtml` は `index.html` をディレクトリ URL に変換します。HTML の場合、ロケールフォルダーが追加される前に `docsRoot` が削除されます（`docsRoot` が `site` のとき、`site/index.html` → `site/{locale}/index.html`）。詳細は [HTML ページ](/ja/guide/documents/html-pages) を参照してください。
- `docsOutput.vitepressThemeCatalog`
任意設定です。`translate-docs` 内で VitePress のテーマ/ナビゲーション/サイドバーのカタログを初期生成し、翻訳します。フィールド: `configPath`（テーマ文字列を含む VitePress 設定）、`catalogPath`（生成された英語のネストされた JSON）、任意の `outputPathTemplate`（デフォルト: `catalogPath` と同じ場所にある `theme.{locale}.json`）。

**ポストプロセス**

- `docsOutput.postProcessing`
翻訳された**markdown本文**に対するオプションの変換（YAMLキーおよび非プローゼのフロントマター値は保持されます）。セグメントの再構成とリンクの書き換え（フラットまたはVitePress）の後、`addFrontmatter` の前に実行されます。
- `docsOutput.postProcessing.regexAdjustments`
`{ "description"?, "search", "replace" }` の順序付きリスト。`search` は正規表現パターンです（プレーン文字列の場合はフラグ `g`、または `/pattern/flags` を使用）。`replace` は `${translatedLocale}`、`${sourceLocale}`、`${sourceFullPath}`、`${translatedFullPath}`、`${sourceFilename}`、`${translatedFilename}`、`${sourceBasedir}`、`${translatedBasedir}` などのプレースホルダーをサポートします。
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` — ソースおよび翻訳済みmarkdown内の制限付き「他の言語で読む」リンク行を再生成します。`label: "local"` の場合、エンドニムラベルのために `languagesManifestPath`（または `ui.flatOutputDir/ui-languages.json` のマニフェスト）が必要です。

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

---

<a id="json"></a>
### `json`

ネストされた JSON 翻訳パイプラインのトップレベル配列。`features.translateJson` が true の場合（`translate-json` または `sync` の JSON ステージ）にのみ使用されます。[JSON](/ja/guide/json) を参照してください。

| フィールド | 説明 |
|-------|-------------|
| `description` | CLI / `status`用のオプションの注釈（翻訳対象外）。 |
| `contentPaths` | プロジェクトルート配下のソース`.json`ファイル、ディレクトリ、またはグロブ。一般的なi18next名前空間ファイル（`public/locales/en/*.json`）がサポートされています: ネストされたオブジェクト、配列、文字列値内の<code v-pre>{{var}}</code>補間、および独立した複数形サフィックスキー（`key_one`、`key_other`）。 |
| `outputPathTemplate` | 各ターゲットロケールごとの必須出力パス。プレースホルダー：`{locale}`、`{LOCALE}`、`{llocale}`、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。 |
| `targetLocales` | このブロック用のオプションのサブセット。指定しない場合、ルートの`targetLocales`を使用。 |
| `keyPolicy.mode` | `allowlist`、`denylist`、または`both`。 |
| `keyPolicy.translateKeys` | モードが`allowlist`または`both`の場合に含めるドットパス／グロブ。 |
| `keyPolicy.skipKeys` | 除外するドットパス／グロブ（デフォルトの拒否リストには`id`、`slug`、`href`、`url`、`key`、`code`が含まれます）。 |

---

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

---

<a id="modelsuggestion-optional"></a>
### `modelSuggestion` (オプション)

[`suggest-models`](/ja/reference/cli-commands/models#suggest-models) および [ダッシュボードのモデルタブ](/ja/guide/translation-dashboard/models) の重み付けです。このブロックを省略するか、いずれかのプロファイルを省略すると、そのプロファイルは組み込みの重みを維持します。このブロックは `--apply` や **Update config** によって書き換えられることはありません。これらはモデルIDのみを書き込みます。

- `quality` — デフォルトのChrF `0.45`、アリーナ `0.35`、価格 `0.20`、品質の下限 `0.7`
- `price` — デフォルトのChrF `0.35`、アリーナ `0.20`、価格 `0.45`、品質の下限 `0.6`

各プロファイルオブジェクトには、`chrf`、`arena`、および`price`が必要です。各値は有限で、少なくとも`0`であり、少なくとも1つは`0`より大きいです。それらは合計が1になるように正規化されているため、`45`、`35`、および`20`は品質のデフォルトと一致します。`qualityFloor`はオプションで、`(0, 1]`の範囲にあり、候補プール内の最高のChrFの割合です。フロアを下回るモデル（ChrF測定値がないモデルを含む）は、フロアをクリアするモデルの後にソートされます。

```json
"modelSuggestion": {
  "quality": { "chrf": 0.45, "arena": 0.35, "price": 0.20, "qualityFloor": 0.7 },
  "price": { "chrf": 0.35, "arena": 0.20, "price": 0.45, "qualityFloor": 0.6 }
}
```

---

<a id="glossary"></a>
### `glossary`

| フィールド          | 説明                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `userGlossary` | 列 `Original language string` (または `en`)、`locale`、`Translation`、任意の `Force`、および任意の `Context` を含む CSV へのパス - ソース用語とターゲットロケールごとに 1 行 (`locale` はすべてのターゲットで `*` にできます)。 |
| `autoAddUserEditedToGlossary` | `true`の場合、UI文字列に対するダッシュボードの編集は、ユーザー用語集に自動的に追加できます。 |
| `contextFiles` | 任意のcwd相対Markdownまたはプレーンテキストファイル（`.md`、`.markdown`、`.txt`）。製品や機能の説明を含みます。コマンド開始時にロードされ、UI、ドキュメント、JSON、SVG、および校正プロンプトに注入されます。翻訳対象にも含めたい場合を除き、これらのファイルを`docs[].contentPaths`に配置しないでください。URLは拒否されます。全文が設定されたLLMプロバイダーに送信され、`--debug-failed`ログに表示される可能性があります — 機密情報やPIIを含めないでください。 |
| `contextMaxChars` | モデルに送信される結合済みコンテキストファイルテキストの最大文字数（デフォルト`12000`、ハード上限`100000`）。超過分のテキストは警告とともに切り詰められます。 |

`translate-docs`、`translate-json`、および `translate-svg` は、`uiGlossary` が `true` (デフォルト) である各 UI ブロックからもヒントを取得します。これにより、そのブロックの `strings.json` に既に保存されている翻訳が再利用されます。ブロックを除外するには、そのブロックで `uiGlossary` を `false` に設定します。`translate-ui` と `proofread-ui` は、これらのカタログをヒントとして使用しません。短縮形の UI ラベル略語 (`Alm.` のような末尾にドットが付く形式、または `Size` → `Tam` のような短い単一トークンの圧縮形式) は、ドキュメントプロンプトが作り出された <code v-pre>{{…}}</code> トークンに誘導されないようにスキップされます。完全な製品用語と省略されていない UI 翻訳は、引き続きヒントとして利用されます。

任意の`Context` CSV列は、その用語のソース言語での使用ガイダンス（定義、文法的用法、製品上の意味）です。用語が現在のバッチに一致する場合にのみ含まれます。用語の`Context`ノートや`contextFiles`の内容を変更すると、次回実行時に該当ロケールのキャッシュされたセグメントとファイル追跡行が無効化され、翻訳が自動的に更新されます。優先する`Translation`のみを変更した場合は、`--force` / `--force-update`を渡さない限り既存のキャッシュが使用されます。ダッシュボードでユーザーが編集したキャッシュ行は保持されます。

例:

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md", "i18n/billing-feature.md"],
    "contextMaxChars": 12000
  }
}
```

**空の用語集CSVを生成する：**

```bash
ai-i18n-tools glossary-generate
```

リポジトリから `contextFiles` を作成するには、[AIエージェントでコンテキストファイルを生成する](/ja/guide/glossary#generate-a-context-file-with-an-ai-agent) のコピー＆ペースト用エージェントプロンプトを使用します。用語行とコンテキストファイルの適用方法については、[用語集](/ja/guide/glossary) を参照してください。
