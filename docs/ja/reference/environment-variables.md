<a id="environment-variables"></a>
# 環境変数

<a id="provider-api-keys"></a>
## プロバイダーのAPIキー

`init -P <provider>`は、以下の表でその組み込みプリセットとAPIキーを選択します。あるプロバイダーの変数名を`providers.<name>.apiKeyEnv`でオーバーライドします。OllamaにはAPIキーがありません。

| 変数 | プロバイダー |
| --- | --- |
| `OPENROUTER_API_KEY` | `openrouter` |
| `OPENAI_API_KEY` | `openai` |
| `ANTHROPIC_API_KEY` | `anthropic` |
| `GOOGLE_API_KEY` | `gemini` |
| `DEEPSEEK_API_KEY` | `deepseek` |
| `CEREBRAS_API_KEY` | `cerebras` |
| `GROQ_API_KEY` | `groq` |
| `MISTRAL_API_KEY` | `mistral` |
| `XAI_API_KEY` | `xai` |
| `NVIDIA_API_KEY` | `nvidia` |
| `ALIBABA_API_KEY` | `alibaba` |
| `APIFUN_API_KEY` | `apifun` |
| `CHEAPERINFERENCE_API_KEY` | `cheaperinference` |

そのプロバイダーが有効な場合、キーが必要です。プリセットURL: [組み込みプロバイダー](/ja/guide/providers-and-models#built-in-providers)。

<a id="provider-base-urls"></a>
## プロバイダーのベースURL

これら2つの変数は、設定済みのプロバイダーに対して `baseUrl` を上書きします。その他のプリセットはすべて、環境変数ではなく設定ファイル (`providers.<name>.baseUrl`) 内でURLを変更します。

| 変数 | 上書き対象 |
| --- | --- |
| `OPENROUTER_BASE_URL` | `providers.openrouter.baseUrl` (そのプロバイダーが設定されている場合のみ) |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` (そのプロバイダーが設定されている場合のみ) |

<a id="tool-and-run"></a>
## ツールと実行

| 変数 | 説明 |
| --- | --- |
| `AI_I18N_LANG` | ツール自体のUI（CLIヘルプ、ログ、ダッシュボード）の言語。`-L` / `--ui-lang` によって上書きされ、設定 `uiLanguage` を上書きします。詳細は [ツールUIの言語](/ja/guide/tool-ui-language) を参照してください。 |
| `I18N_SOURCE_LOCALE`    | 実行時に`sourceLocale`を上書きします。                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`を上書きするためのカンマ区切りのロケールコード。  |
| `I18N_LOG_LEVEL` | ロガーレベル (`debug`、`info`、`warn`、`error`)。不明な値 (`silent` を含む) は `info` にフォールバックします。 |
| `NO_COLOR`              | `1`の場合、ログ出力のANSIカラーを無効にします。              |
| `I18N_LOG_SESSION_MAX`  | ログセッションごとに保持される最大行数（既定値`5000`）。           |

起動時にCLIはカレントワーキングディレクトリから`.env`ファイルを自動的にロードします（Nodeの`process.loadEnvFile`経由）。これにより、`.envrc` / `direnv`をソースしない非インタラクティブシェルでもプロバイダーAPIキーが取得されます。環境変数に既に存在する値は上書きされないため、実際のCI/本番環境の値が優先されます。
