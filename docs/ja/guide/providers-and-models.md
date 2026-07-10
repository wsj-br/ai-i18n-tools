<a id="llm-providers-and-models"></a>
# LLM プロバイダーとモデル

`translate-ui`、`translate-docs`、`translate-json`、`translate-svg` の各翻訳パイプラインは、同じプロバイダーに依存しないクライアントを介して LLM にテキストを送信します。**どの API エンドポイントを呼び出すか**、**どのモデルを試すか**は `ai-i18n-tools.config.json` で一度設定します。すべてのコマンドはその設定と同じ SQLite キャッシュを共有します。

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

`translationModels` は単一の選択肢ではなく、**順序付けられたリスト**です。CLI は最初のモデルを試行し、リクエストまたは解析に失敗した場合は次のエントリに移動します。一時的な停止や、特定のロケールで問題が発生するモデルが実行全体をブロックしないように、複数のモデルを設定します。

**解決階層** (重複排除、順序保持):

| パイプライン | 順序 |
| --- | --- |
| UI (`translate-ui`、複数形、`proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| ドキュメント、JSON、SVG | `localeModels(locale)` → `translationModels` |

オプションの `providers.<active>.uiModels` は、ロケールごとのオーバーライドが一致した後、グローバルな `translationModels` チェーンの前に試行される UI 専用のリストです。オプションの `providers.<active>.localeModels` は、BCP-47 ロケールを、すべてのパイプラインでそのロケールに対して**最初に**試行されるモデルにマッピングします (`pt-br` は `pt-BR` と一致します)。`localeModels` エントリが一致しない場合、パイプライン固有の階層のみが適用されます。

プロバイダーとモデルは、言語によってコスト、速度、品質が異なります。`npx ai-i18n-tools init` のデフォルトリストを出発点として扱い、ロケールで一貫して結果が悪い場合は拡張するか、そのロケールに `localeModels` エントリを追加してください。完全なデフォルトと根拠: [設定 — `provider` と `providers`](/ja/reference/configuration#provider-and-providers)。

最小構成の例 (OpenRouter):

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "qwen/qwen3-235b-a22b-2507",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-v4-flash"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest"
      ],
      "localeModels": [
        { "locale": "pt-BR", "models": ["google/gemini-3-flash-preview"] }
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

各プロバイダーブロックは、独自の `translationModels`、オプションの `uiModels` と `localeModels`、`maxTokens`、`temperature`、および `requestTimeoutMs` を定義できます。レガシーのトップレベル `openrouter` ブロックは引き続き受け入れられ、ロード時に `providers.openrouter` に自動移行されます。

同じドキュメントに4つのプロバイダーがある実行可能な例: [`examples/multi-provider`](/ja/examples#multi-provider)。

<a id="further-reference"></a>
### その他の参考資料

- [設定 — `provider` と `providers`](/ja/reference/configuration#provider-and-providers) — プリセットテーブル、カスタムエンドポイント、リクエストタイムアウト、OpenRouter 固有の動作。
- [アーキテクチャ — LLM クライアント](/ja/reference/architecture) — モデルのフォールバック、バッチ処理、コストレポートが内部でどのように機能するか。
- [環境変数](/ja/reference/environment-variables) — API キーの環境変数とベース URL のオーバーライド。
