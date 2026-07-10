<a id="tool-ui-language"></a>
# ツールUIの言語

このツールは、プロジェクトの `sourceLocale` / `targetLocales` とは独立して、独自のユーザーインターフェース（CLIのヘルプテキスト、頻繁に使用されるログ/サマリー/エラーメッセージ、および翻訳ダッシュボード）をローカライズします。設定は不要です。デフォルトでは、ツールはOSのロケールに従います。

<a id="locale-resolution"></a>
## ロケールの解決

UIのロケールは、以下のソースから優先度の高い順に解決されます。

1. `-L` / `--ui-lang <code>` グローバルフラグ（例: `-L pt-BR`）。
2. `AI_I18N_LANG` 環境変数（例: `export AI_I18N_LANG=es`）。
3. `ai-i18n-tools.config.json` の `uiLanguage` 設定キー（BCP-47文字列）。
4. ホストOSのロケール（`Intl.DateTimeFormat().resolvedOptions().locale` 経由）。

<a id="matching-and-fallback"></a>
## マッチングとフォールバック

要求されたロケールは、出荷済みのUI言語と正確に一致するか、最も近いバリエーションと一致します（例：`pt-PT`は`pt-BR`に解決され、`en-US`は`en-GB`に解決されます）。一致するものがない場合は、ソースロケール（`en-GB`）にフォールバックします。UI言語が明示的に要求された（フラグ、環境変数、または`uiLanguage`経由）が、出荷済みのバンドルと一致しない場合、CLIはデフォルトロケールが使用されるという警告を一度だけ表示します。ホストOSからのみ推測されたロケールは警告を発しません。

<a id="shipped-ui-languages"></a>
## 組み込みのUI言語

`en-GB` (ソース) に加えて、`de`、`es`、`fr`、`hi-Latn`、`ja`、`ko`、`pt-BR`、`zh-Hans`、`zh-Hant`。

<a id="translation-dashboard"></a>
## 翻訳ダッシュボード

翻訳ダッシュボードは、`GET /api/ui-i18n` から解決されたロケール、レイアウト方向、および翻訳バンドルを読み取り、ロード時に適用します（`<html lang>` / `dir` を設定し、`data-i18n*` 属性を介して静的マークアップをローカライズします）。

<a id="related"></a>
## 関連項目

- [`AI_I18N_LANG`](/reference/environment-variables) — 環境変数による上書き
- [`uiLanguage`](/reference/configuration#uilanguage-optional) — 設定キーによる上書き
- [`-L` / `--ui-lang`](/reference/cli-commands/) — CLIフラグによる上書き (最優先)
