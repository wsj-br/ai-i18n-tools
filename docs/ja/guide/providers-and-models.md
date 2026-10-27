<a id="llm-providers-and-models"></a>
# LLM プロバイダー

すべての翻訳パイプライン — `translate-ui`, `translate-docs`, `translate-json`, および `translate-svg` — は、同じプロバイダ非依存クライアントを介してLLMにテキストを送信します。これらのコマンドを実行する前に、`ai-i18n-tools.config.json`で**少なくとも1つのプロバイダ**を設定し、環境または`.env`に対応する**APIキー**を設定してください（組み込みのプリセットのうち**Ollama**を除く）。`init`は初期設定用の`provider` / `providers`ブロックを書き出しますが、アクティブなプリセットの認証情報は引き続き指定する必要があります。

設定で**呼び出す API エンドポイント**を一度設定します。すべての翻訳コマンドがその設定と同じ SQLite キャッシュを共有します。プロバイダーが試行するモデルは、別のステップです: [AI モデル](/ja/guide/ai-models)。

CLI は、トップレベルの `provider` キー (または、1 つだけ設定されている場合は `providers` の唯一のエントリ) からアクティブなプロバイダーを解決します。各プロバイダーブロックには、順序付けられた `translationModels` フォールバックチェーンがリストされています。組み込みのプリセットは `baseUrl` と API キー環境変数を自動的に継承します (必要に応じてプロバイダーごとにオーバーライドします)。

<a id="built-in-providers"></a>
### 組み込みプロバイダー

プリセットプロバイダーキーには `translationModels` のみが必要です。ベース URL と API キーの環境変数は自動的に入力されます。

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

**プリセット以外**のキーについては、`baseUrl` と `apiKeyEnv` を設定で明示的に設定します。

アクティブなプロバイダーの API キーを環境または `.env` ファイルに設定します。CLI は、シェルですでに設定されている変数を上書きすることなく、作業ディレクトリから `.env` を自動的にロードします。[環境変数](/ja/reference/environment-variables) を参照してください。

<a id="cheaperinference-zero-data-retention"></a>
### ゼロデータ保持 (Cheaper Inference)

`providers.cheaperinference.zeroDataRetention` はオプションであり、デフォルトではオフです。このプロジェクトがプロンプトを保持しないプロバイダーのみを介して送信する必要がある場合に設定します。

```json
"cheaperinference": {
  "zeroDataRetention": true,
  "translationModels": ["gemini-2.5-flash", "deepseek-v4-flash"]
}
```

このフラグがオンの場合、すべてのチャットリクエストに `"zdr": true` が含まれ、`list-models`、`check-models`、および `suggest-models` (ダッシュボードの「モデル」タブを含む) は `GET /v1/models?zdr=true` を読み取ります。そのカタログには、ゼロデータ保持リクエストが使用できるモデルが、ゼロデータ保持価格でリストされています。`check-models` は、そのカタログにないIDを無効として扱います。このフラグは、カタログに含まれていないモデルのルートを作成しません。そのIDを `translationModels`、`uiModels`、または `localeModels` から削除してください。

Cheaper Inference アカウントでゼロデータ保持が不要な場合は、このフラグをオフのままにしてください。アカウントで [データ保護](https://platform.cheaperinference.com/dashboard/data-protection) がすでにオンになっている場合、Cheaper Inference は、ゼロデータ保持ルートがないモデルを拒否します。エラーはそのモデル名を指定します。アカウントポリシーを維持するには、`zeroDataRetention` を `true` に設定し、ゼロデータ保持カタログのモデルに切り替えてください。拒否されたモデルを維持するには、そのページでゼロデータ保持をオフにしてください。フォールバックチェーンは、次に設定されたモデルを試行します。

<a id="model-fallback-chain"></a>
<a id="validate-and-compare-models"></a>
### モデル

モデルの選択、フォールバックリスト、および `suggest-models`、`check-models`、`list-models`、`bench-models` は、[AI モデル](/ja/guide/ai-models) に記載されています。

<a id="multiple-providers"></a>
### 複数のプロバイダー

複数のプロバイダーが設定されている場合は、トップレベルの `provider` キーを設定してデフォルトを選択します。設定を編集せずに実行ごとに切り替えます。

```bash
npx ai-i18n-tools translate-docs -P anthropic
npx ai-i18n-tools bench-models -P deepseek
```

各プロバイダーブロックは独自の `translationModels`、オプションの `uiModels` および `localeModels`、`maxTokens`、`temperature`、`requestTimeout` (秒) または `requestTimeoutMs` を定義できます。プロバイダーのタイムアウトはトップレベルの `requestTimeout` / `requestTimeoutMs` を上書きします。従来のトップレベルの `openrouter` ブロックも引き続き受け付けられ、ロード時に `providers.openrouter` へ自動移行されます。

オプションの `pricing` および `modelPricing` は、プロバイダーが `usage.cost` を省略した場合に 100 万トークンあたりの米ドル（`inputPerMTokens` および `outputPerMTokens`）を設定します。`pricing` はプロバイダー全体のデフォルトであり、`modelPricing` エントリは 1 つのモデル ID に対してそれを上書きします。OpenRouter および Cheaper Inference はすでに呼び出しごとのコストを返すため、これらのプロバイダーでは両方を設定しないでください。プロバイダーから報告されたコストは、返されたまま保持されます。この金額は、翻訳の概要、[`usage`](/ja/reference/cli-commands/workflows#usage)、および [Usage & costs](/ja/guide/translation-dashboard/usage) に含まれます。

同じドキュメントに対して4つのプロバイダーを使用する実行可能な例（サンプルレートを含む）：[`examples/multi-provider`](/ja/examples#multi-provider)。

<a id="further-reference"></a>
### その他の参考資料

- [AI モデル](/ja/guide/ai-models) — ランク付けされたショートリスト、フォールバックリスト、およびモデルコマンド。
- [設定 — `provider` と `providers`](/ja/reference/configuration#provider-and-providers) — プリセットテーブル、カスタムエンドポイント、リクエストタイムアウト、コストレート、Cheaper Inference のゼロデータ保持、OpenRouter 固有の動作。
- [アーキテクチャ — LLM クライアント](/ja/reference/architecture) — モデルのフォールバック、バッチ処理、コストレポートが内部でどのように機能するか。
- [環境変数](/ja/reference/environment-variables) — API キーの環境変数とベース URL のオーバーライド。
