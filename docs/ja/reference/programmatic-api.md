<a id="programmatic-api"></a>
# プログラムAPI

すべてのパブリック型およびクラスはパッケージルートからエクスポートされます。例：CLIを使わずにNode.jsでUI翻訳ステップを実行する場合：

```ts
import { loadI18nConfigFromFile, runTranslateUI } from 'ai-i18n-tools';

// Config must have features.translateUIStrings: true (and valid targetLocales, etc.).
const config = loadI18nConfigFromFile('ai-i18n-tools.config.json');

const summary = await runTranslateUI(config, {
  cwd: process.cwd(),
  locales: config.targetLocales,
  force: false,
  dryRun: false,
  verbose: false,
});
console.log(
  `Updated ${summary.stringsUpdated} string(s); locales touched: ${summary.localesTouched.join(', ')}`
);
```

Node.js から config をスキャフォールドします。4番目の引数は組み込みのプリセットです (`cwd` は3番目です):

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'cheaperinference');
```

主なエクスポート（一般的に使用されるもの — 完全な公開インターフェースについては`src/index.ts`を参照）：

| エクスポート | 説明 |
|---|---|
| `loadI18nConfigFromFile` | JSONファイルから設定を読み込み、マージし、検証します。 |
| `parseI18nConfig` | 生の設定オブジェクトを検証します。 |
| `TranslationCache` | SQLite キャッシュ - `cacheDir` パスでインスタンス化します。 |
| `UIStringExtractor` | JS/TS ソースから `t("…")` 文字列を抽出します。 |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML内の`data-i18n*`マーカーをスキャン/挿入します（`extract`の`.html`および`mark-html`コマンドをサポート）。 |
| `MarkdownExtractor` | Markdown から翻訳対象のセグメントを抽出します。 |
| `HtmlTemplateExtractor` | プレーンHTMLドキュメントを抽出して再構築します（テキストおよび翻訳可能な属性。`src` / `href` は元の位置に保持されます）。 |
| `JsonExtractor` | DocusaurusのJSONラベルファイルから抽出（UIカタログ、MDX本文ではない）。 |
| `SvgExtractor` | SVG ファイルから抽出します。 |
| `LlmClient` | アクティブな LLM プロバイダーに翻訳リクエストを行います（`OpenRouterClient` は非推奨のエイリアスです）。 |
| `rankProviderModels` / `resolveSuggestionWeights` | `suggest-models` が使用する品質または価格プロファイルに基づいて、ランク 1 プロバイダーのチャットカタログをランク付けします。設定の出力や書き込みは行いません。 |
| `PlaceholderHandler` | 翻訳前後にMarkdown構文（HTMLタグ、注記、アンカー、MDXコメント/JSX/波括弧、URL、インラインコード、強調）を保護・復元します。 |
| `protectMdx` / `restoreMdx` | MDXコメント、JSXタグ、波括弧式、JSX文字列属性を保護・復元します（`PlaceholderHandler`から呼び出され、直接使用するためにエクスポートもされます）。 |
| `splitTranslatableIntoBatches` | セグメントを LLM 向けのバッチサイズにグループ化します。 |
| `validateTranslation` | 変換後の構造チェック（**async** — 待機する必要があります）。 |
| `resolveDocumentationOutputPath` | 翻訳済みドキュメントの出力ファイルパスを解決します。 |
| `Glossary` / `GlossaryMatcher` | 翻訳用語集を読み込んで適用します。これにはオプションの用語 `Context` メモが含まれます。 |
| `loadTranslationContext` / `computeGuidanceFingerprint` | キャッシュ無効化のための `glossary.contextFiles` およびフィンガープリントのガイダンスを読み込みます。 |
| `runTranslateUI` | プログラムによる翻訳UIのエントリポイントです。 |
| `writeInitConfigFile` | スターター config JSON (`template`、`cwd`、および必須の `providerKey`) を書き込みます。 |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P`が使用する組み込みプリセットごとのスターター`translationModels`。 |
| `PROVIDER_PRESETS` | 組み込みプロバイダープリセットマップ（`baseUrl`、`apiKeyEnv`）。 |

<a id="python-runtime"></a>
## Python ランタイム (`i18n.py`)

`init -t ui-python`、`ui-python-gettext`、および `ui-python-flask` は、`i18n.py` が欠落している場合にこのモジュールをプロジェクトに書き込みます。これは Python 3.10 以降向けの標準ライブラリヘルパーです。そのファイルからインポートしてください。以下の関数は、上記の表にある Node エクスポートとは別個のものです。Django プロジェクトは Django の gettext を保持するため、`ui-python-django` は `i18n.py` を書き込みません。

呼び出し形状、安全でない f-string、およびフレームワークごとのロケール配線: [Python アプリケーション](/ja/guide/ui-strings/python)。

| 関数 | 動作 |
| --- | --- |
| `set_locale(locale)` | 現在のロケールを設定します。コード内のアンダースコアはハイフンとして保存されます (`pt_BR` は `pt-BR` になります)。`ContextVar` トークンを返します。 |
| `reset_locale(token)` | そのトークンからロケールを復元します。FastAPI や Flask ミドルウェアを含む `finally` 内で呼び出してください。 |
| `get_locale()` | 現在のロケールを返します。 |
| `set_backend(backend)` | `"auto"`、`"json"`、または `"gettext"` を選択します。 |
| `get_ui_languages()` | フラット JSON ディレクトリの隣にある `ui-languages.json`、またはフラット出力がオフの場合は gettext ディレクトリを読み取ります。 |
| `get_direction(locale=None)` | そのロケールのマニフェスト行から `"rtl"` または `"ltr"` を返します (省略時は現在のロケール)。 |
| `_(message)` | 1 つのリテラルを検索し、カタログ文字列またはメッセージ自体を返します。 |
| `t(template, *, plurals=False, count=None, **values)` | リテラルを検索してから補間します。`translate` は同じ関数です。Python 3.14 では、`translate(t"Hello, {name}!")` はテンプレートとその値を保持します。キーワード引数は、テンプレート文字列から取得された値を上書きします。 |
| `ngettext(singular, plural, n, **values)` | 複数形の検索を行い、補間します。`count` はフォーマット文字列で利用可能です。 |
| `pgettext(context, message, **values)` | コンテキスト検索 (`msgctxt`、または `context` + U+0004 + フラット JSON 内の英語ソース) を行い、補間します。 |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit 選択ボックス。`st.session_state.locale` と `st.query_params["lang"]` を書き込み、`set_locale` を呼び出し、選択されたコードを返します。 |
