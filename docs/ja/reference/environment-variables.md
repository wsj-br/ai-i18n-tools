<a id="environment-variables"></a>
# 環境変数

| Variable               | Description                                                |
|------------------------|------------------------------------------------------------|
| `OPENROUTER_API_KEY`   | `openrouter` プロバイダーのAPIキー (アクティブな場合に必要)。 |
| Other provider keys    | 各プロバイダーは独自のキー環境変数を読み取ります: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `CEREBRAS_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `NVIDIA_API_KEY`, `ALIBABA_API_KEY`, `APIFUN_API_KEY` (Ollamaは不要)。プロバイダーごとに `providers.<name>.apiKeyEnv` で上書きできます。 |
| `OPENROUTER_BASE_URL`  | `providers.openrouter.baseUrl` を上書きします (そのプロバイダーが設定されている場合のみ)。 |
| `OLLAMA_BASE_URL`      | `providers.ollama.baseUrl` を上書きします (そのプロバイダーが設定されている場合のみ)。 |
| `AI_I18N_LANG`         | ツールのUI（CLIヘルプ、ログ、ダッシュボード）の言語。`-L` / `--ui-lang`によって上書きされます。設定`uiLanguage`を上書きします。[ツールのUI言語](#tool-ui-language)を参照してください。 |
| `I18N_SOURCE_LOCALE`    | 実行時に`sourceLocale`を上書きします。                        |
| `I18N_TARGET_LOCALES`   | `targetLocales`を上書きするためのカンマ区切りのロケールコード。  |
| `I18N_LOG_LEVEL` | ロガーレベル (`debug`、`info`、`warn`、`error`)。不明な値 (`silent` を含む) は `info` にフォールバックします。 |
| `NO_COLOR`              | `1`の場合、ログ出力のANSIカラーを無効にします。              |
| `I18N_LOG_SESSION_MAX`  | ログセッションごとに保持される最大行数（既定値`5000`）。           |

起動時にCLIはカレントワーキングディレクトリから`.env`ファイルを自動的にロードします（Nodeの`process.loadEnvFile`経由）。これにより、`.envrc` / `direnv`をソースしない非インタラクティブシェルでもプロバイダーAPIキーが取得されます。環境変数に既に存在する値は上書きされないため、実際のCI/本番環境の値が優先されます。

<a id="tool-ui-language"></a>
## ツールのUI言語

ツールは、プロジェクトの`sourceLocale` / `targetLocales`とは独立して、独自のユーザーインターフェース（CLIヘルプテキスト、トラフィックの多いログ/サマリー/エラーメッセージ、翻訳ダッシュボード）をローカライズします。UIロケールは、以下のソースから優先度の高い順に解決されます。

1. `-L` / `--ui-lang <code>` グローバルフラグ（例: `-L pt-BR`）。
2. `AI_I18N_LANG` 環境変数（例: `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` の `uiLanguage` 設定キー（BCP-47文字列）。
4. ホストOSのロケール（`Intl.DateTimeFormat().resolvedOptions().locale` 経由）。

要求されたロケールは、出荷済みのUI言語と正確に一致するか、最も近いバリエーションと一致します（例：`pt-PT`は`pt-BR`に解決され、`en-US`は`en-GB`に解決されます）。一致するものがない場合は、ソースロケール（`en-GB`）にフォールバックします。UI言語が明示的に要求された（フラグ、環境変数、または`uiLanguage`経由）が、出荷済みのバンドルと一致しない場合、CLIはデフォルトロケールが使用されるという警告を一度だけ表示します。ホストOSからのみ推測されたロケールは警告を発しません。

出荷済みのUI言語：`en-GB`（ソース）に加えて、`de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans`、および`zh-Hant`です。翻訳ダッシュボードは、解決されたロケール、レイアウト方向、および翻訳バンドルを`GET /api/ui-i18n`から読み込み、ロード時に適用します（`<html lang>` / `dir`を設定し、`data-i18n*`属性を介して静的マークアップをローカライズします）。この機能には設定は不要です。デフォルトでは、ツールはOSのロケールに従います。
