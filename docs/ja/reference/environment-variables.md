<a id="environment-variables"></a>
# 環境変数

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` プロバイダーのAPIキー (アクティブな場合に必要)。 |
| Other provider keys    | 各プロバイダーは独自のキー環境変数を読み取ります: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollamaは不要)。プロバイダーごとに `providers.<name>.apiKeyEnv` で上書きできます。 |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl` を上書きします (そのプロバイダーが設定されている場合のみ)。 |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl` を上書きします (そのプロバイダーが設定されている場合のみ)。 |
| `AI_I18N_LANG`         | ツール自体のUI（CLIヘルプ、ログ、ダッシュボード）の言語。`-L` / `--ui-lang`によって上書きされ、config `uiLanguage`を上書きします。[ツールUI言語](/ja/guide/tool-ui-language)を参照してください。 |
| `I18N_SOURCE_LOCALE`    | 実行時に`sourceLocale`を上書きします。                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`を上書きするためのカンマ区切りのロケールコード。  |
| `I18N_LOG_LEVEL` | ロガーレベル (`debug`、`info`、`warn`、`error`)。不明な値 (`silent` を含む) は `info` にフォールバックします。 |
| `NO_COLOR`              | `1`の場合、ログ出力のANSIカラーを無効にします。              |
| `I18N_LOG_SESSION_MAX`  | ログセッションごとに保持される最大行数（既定値`5000`）。           |

起動時にCLIはカレントワーキングディレクトリから`.env`ファイルを自動的にロードします（Nodeの`process.loadEnvFile`経由）。これにより、`.envrc` / `direnv`をソースしない非インタラクティブシェルでもプロバイダーAPIキーが取得されます。環境変数に既に存在する値は上書きされないため、実際のCI/本番環境の値が優先されます。
