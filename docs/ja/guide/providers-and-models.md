<a id="llm-providers-and-models"></a>
# LLM プロバイダーとモデル

すべての翻訳パイプライン — `translate-ui`, `translate-docs`, `translate-json`, および `translate-svg` — は、同じプロバイダ非依存クライアントを介してLLMにテキストを送信します。これらのコマンドを実行する前に、`ai-i18n-tools.config.json`で**少なくとも1つのプロバイダ**を設定し、環境または`.env`に対応する**APIキー**を設定してください（組み込みのプリセットのうち**Ollama**を除く）。`init`は初期設定用の`provider` / `providers`ブロックを書き出しますが、アクティブなプリセットの認証情報は引き続き指定する必要があります。

設定で**呼び出すAPIエンドポイント**と**試用するモデル**を一度構成すると、すべての翻訳コマンドがその設定と同じSQLiteキャッシュを共有します。

CLI は、トップレベルの `provider` キー (または、1 つだけ設定されている場合は `providers` の唯一のエントリ) からアクティブなプロバイダーを解決します。各プロバイダーブロックには、順序付けられた `translationModels` フォールバックチェーンがリストされています。組み込みのプリセットは `baseUrl` と API キー環境変数を自動的に継承します (必要に応じてプロバイダーごとにオーバーライドします)。

<a id="built-in-providers"></a>
### 組み込みプロバイダー

プリセットプロバイダーキーには `translationModels` のみが必要です。ベース URL と API キーの環境変数は自動的に入力されます。

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

**プリセット以外**のキーについては、`baseUrl` と `apiKeyEnv` を設定で明示的に設定します。

アクティブなプロバイダーの API キーを環境または `.env` ファイルに設定します。CLI は、シェルですでに設定されている変数を上書きすることなく、作業ディレクトリから `.env` を自動的にロードします。[環境変数](/ja/reference/environment-variables) を参照してください。

<a id="model-fallback-chain"></a>
### モデルフォールバックチェーン

`translationModels` は単一の選択肢ではなく、**順序付きリスト**です。CLI は最初のモデルを試行し、リクエスト、解析、またはスクリプトの誤りによる失敗時に次のエントリへ移動します。一時的な障害や、特定のロケール（例えばデーヴァナーガリーではなくローマ字化されたヒンディー語など）での処理が困難なモデルによって実行全体がブロックされないよう、複数のモデルを構成してください。ネイティブスクリプトのロケールではローマ字化された出力は拒否されます。ローマ字表記のままにするロケールは、明示的な `-Latn` サブタグ（例えば `hi-Latn`）で構成する必要があります。

**解決階層** (重複排除、順序保持):

| パイプライン | 順序 |
| --- | --- |
| UI (`translate-ui`、複数形、`proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| ドキュメント、JSON、SVG | `localeModels(locale)` → `translationModels` |

オプションの `providers.<active>.uiModels` は、ロケールごとのオーバーライドが一致した後、グローバルな `translationModels` チェーンの前に試行される UI 専用のリストです。オプションの `providers.<active>.localeModels` は、BCP-47 ロケールを、すべてのパイプラインでそのロケールに対して**最初に**試行されるモデルにマッピングします (`pt-br` は `pt-BR` と一致します)。`localeModels` エントリが一致しない場合、パイプライン固有の階層のみが適用されます。

プロバイダーとモデルは、言語によってコスト、速度、品質が異なります。`npx ai-i18n-tools init` のデフォルトリストを出発点として扱い、ロケールで一貫して結果が悪い場合は拡張するか、そのロケールに `localeModels` エントリを追加してください。完全なデフォルトと根拠: [設定 — `provider` と `providers`](/ja/reference/configuration#provider-and-providers)。

**UI文字列:** オプションの `uiModels` を使用すると、グローバルな `translationModels` チェーンの前に、`translate-ui`、複数形生成、および `proofread-ui` をプレミアムモデルにルーティングできます。UIコピーは短く、ユーザーに直接見えるため、これは有用です。

**アジアのロケール:** `ja`、`ko`、`zh-Hans`、および`zh-Hant`用の任意の`localeModels`エントリは、各パイプラインで最初に試行されます。`z-ai/glm-5.3`や`minimax/minimax-m2.7`などのモデルは、中日韓文字に対して汎用フォールバックよりも優れたパフォーマンスを発揮することがよくあります。

設定例（OpenRouter）。`translationModels`と`uiModels`は、このリポジトリが`ai-i18n-tools.config.json`で使用するリストです。`localeModels`はCJKロケール向けの推奨オプションアドオンですが、このリポジトリでは設定されていません。

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3.7-max",
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4",
        "google/gemini-3.5-flash",
        "tencent/hy-mt2-30b-a3b",
        "mistralai/mistral-large",
        "openai/gpt-4o-mini",
        "cohere/command-r-plus-08-2024",
        "qwen/qwen-2.5-72b-instruct"  
      ],
      "uiModels": [
        "~anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "ko",      "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hans", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] },
        { "locale": "zh-Hant", "models": [ "z-ai/glm-5.3", "minimax/minimax-m2.7" ] }
      ]
    }
  }
}
```

<a id="validate-and-compare-models"></a>
### モデルの検証と比較

`translationModels` を変更する前に、各 ID がアクティブなプロバイダーでまだ利用可能であることを確認してください。

```bash
npx ai-i18n-tools check-models
```

`check-models` はプロバイダーの `GET /models` エンドポイントを呼び出し、`translationModels`、`uiModels`、および `localeModels` からのすべての ID を検証し、不足している ID または `expiration_date` を過ぎた ID を報告し、設定された ID が無効な場合はゼロ以外の値で終了します。プロバイダーが価格設定を返す場合 (OpenRouter の場合)、100万トークンあたりの推定 USD も表示されます。

プロバイダーが宣伝する全カタログを参照します。

```bash
npx ai-i18n-tools list-models
```

実際の翻訳サンプルで構成済みモデルをベンチマークします。`translationModels`、`uiModels`、`localeModels` の各一意の ID は個別に実行されるため、実測時間、トークン使用量、コストを比較できます。

```bash
npx ai-i18n-tools bench-models
```

サンプルテキスト、ロケール、またはモデルリストをオーバーライドします。

```bash
npx ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-4o-mini,anthropic/claude-3-haiku
```

コマンドの詳細: [CLI リファレンス](/ja/reference/cli-commands/)。

<a id="multiple-providers"></a>
### 複数のプロバイダー

複数のプロバイダーが設定されている場合は、トップレベルの `provider` キーを設定してデフォルトを選択します。設定を編集せずに実行ごとに切り替えます。

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

各プロバイダーブロックは独自の `translationModels`、オプションの `uiModels` および `localeModels`、`maxTokens`、`temperature`、`requestTimeout` (秒) または `requestTimeoutMs` を定義できます。プロバイダーのタイムアウトはトップレベルの `requestTimeout` / `requestTimeoutMs` を上書きします。従来のトップレベルの `openrouter` ブロックも引き続き受け付けられ、ロード時に `providers.openrouter` へ自動移行されます。

オプションの`pricing`と`modelPricing`は、プロバイダーが`usage.cost`を省略した場合に、1,000,000トークンあたりのUSD（`inputPerMTokens`と`outputPerMTokens`）を設定します。`pricing`はプロバイダー全体のデフォルトであり、`modelPricing`エントリは1つのモデルIDに対してこれを上書きします。OpenRouterはすでに呼び出しごとのコストを返すため、当該プロバイダーでは両方とも未設定にしてください。プロバイダーから報告されたコストは返された値のまま保持されます。この金額は、翻訳サマリー、[`usage`](/ja/reference/cli-commands/workflows#usage)、および[使用量とコスト](/ja/guide/translation-dashboard/usage)に含まれます。

同じドキュメントに対して4つのプロバイダーを使用する実行可能な例（サンプルレートを含む）：[`examples/multi-provider`](/ja/examples#multi-provider)。

<a id="further-reference"></a>
### その他の参考資料

- [設定 — `provider`と`providers`](/ja/reference/configuration#provider-and-providers) — プリセットテーブル、カスタムエンドポイント、リクエストタイムアウト、コストレート、OpenRouter固有の動作。
- [アーキテクチャ — LLMクライアント](/ja/reference/architecture) — モデルフォールバック、バッチ処理、コスト報告の内部動作。
- [環境変数](/ja/reference/environment-variables) — APIキーの環境変数とベースURLのオーバーライド。
