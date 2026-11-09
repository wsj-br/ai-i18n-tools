<a id="programmatic-api"></a>
# プログラムAPI

すべての公開型とクラスは、パッケージルートからエクスポートされます。例: CLIなしでNode.jsからtranslate-uiステップを実行する場合:

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

Node.js から設定の雛形を作成します。4 番目の引数は組み込みのプリセットです (`cwd` は 3 番目です)。テンプレートに `README.md` がまだリストされていない場合、オプションの 5 番目の引数 `{ withReadme: true }` はフラットな README ドキュメントブロックを追加し、そのブロックが追加されたかどうかを返します。

```ts
import { writeInitConfigFile } from 'ai-i18n-tools';

writeInitConfigFile('ai-i18n-tools.config.json', 'uiMarkdown', process.cwd(), 'anthropic');
writeInitConfigFile('ai-i18n-tools.config.json', 'docsMarkdown', process.cwd(), 'openrouter');
writeInitConfigFile('ai-i18n-tools.config.json', 'uiPython', process.cwd(), 'openrouter', {
  withReadme: true,
});
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
| `rankProviderModels` / `resolveSuggestionWeights` | 単一プロバイダーのチャットカタログをランク付けします。インデックスはChrFとArenaであり、品質プロファイルはそのインデックスでソートされ、価格プロファイルはパレートフロンティアをたどります。設定の印刷や書き込みは行いません。 |
| `PlaceholderHandler` | 翻訳前後にMarkdown構文（HTMLタグ、注記、アンカー、MDXコメント/JSX/波括弧、URL、インラインコード、強調）を保護・復元します。 |
| `protectMdx` / `restoreMdx` | MDXコメント、JSXタグ、波括弧式、JSX文字列属性を保護・復元します（`PlaceholderHandler`から呼び出され、直接使用するためにエクスポートもされます）。 |
| `splitTranslatableIntoBatches` | セグメントを LLM 向けのバッチサイズにグループ化します。 |
| `validateTranslation` | 変換後の構造チェック（**async** — 待機する必要があります）。 |
| `resolveDocumentationOutputPath` | 翻訳済みドキュメントの出力ファイルパスを解決します。 |
| `Glossary` / `GlossaryMatcher` | 翻訳用語集を読み込んで適用します。これにはオプションの用語 `Context` メモが含まれます。 |
| `loadTranslationContext` / `computeGuidanceFingerprint` | キャッシュ無効化のための `glossary.contextFiles` およびフィンガープリントのガイダンスを読み込みます。 |
| `runTranslateUI` | プログラムによるtranslate-uiのエントリポイント。 |
| `writeInitConfigFile` | スターター設定 JSON (`template`、`cwd`、必須の `providerKey`、およびオプションの `{ withReadme }`) を作成します。`{ readmeBlockAdded, hasReadmeBlock }` を返します。 |
| `DEFAULT_INIT_MODELS_BY_PROVIDER` | `init -P`が使用する組み込みプリセットごとのスターター`translationModels`。 |
| `PROVIDER_PRESETS` | 組み込みプロバイダープリセットマップ（`baseUrl`、`apiKeyEnv`）。 |

<a id="python-runtime-i18npy"></a>
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
| `pgettext(context, message, **values)` | コンテキスト (`msgctxt`、または `context` + U+0004 + フラットな JSON 内のソース言語の文字列) をルックアップし、補間します。 |
| `streamlit_language_selector(sidebar=True, key="lang_selector")` | Streamlit 選択ボックス。`st.session_state.locale` と `st.query_params["lang"]` を書き込み、`set_locale` を呼び出し、選択されたコードを返します。 |

<a id="net-runtime-i18ncs"></a>
## .NET ランタイム (`I18n.cs`)

`init -t ui-dotnet` は、`I18n.cs` がない場合に `assets/dotnet/I18n.cs` をプロジェクトにコピーします。これは、.NET 6 以降向けの依存関係のないヘルパーです。以下のメンバーは、上の表の Node のエクスポートとは別です。呼び出しの形式と XAML マークアップ: [.NET アプリケーション](/ja/guide/ui-strings/dotnet)。

| メンバー | 動作 |
| --- | --- |
| `SetLocale(locale)` | そのロケールのフラットな JSON を読み込み、正確なファイルがない場合は `CultureInfo.Parent` をたどります。`LocaleChanged` を発生させます。 |
| `T(source, args)` | トリミングされたリテラルを検索し、`string.Format` でフォーマットし、ソースの先頭と末尾の空白を元に戻します。 |
| `Tn(singular, plural, count, args)` | 複数形の検索。`{0}` はカウントです。カタログキーは、トリミングされた単数形の MD5-8 と `_` と CLDR 形式を合わせたものです。 |
| `Tp(context, source, args)` | コンテキスト + U+0004 + ソースを検索し、フォーマットします。 |
| `N(source)` | `source` を返します。静的ラベルをカタログ化できるように抽出されています。 |
| `Loc[source]` | `T` を呼び出すインデクサー。`Loc` は `StringSourceLocalizer` 型の静的フィールドです。 |
| `Configure(options)` | `SourceLocale` が空でない場合にソースロケールを設定します。呼び出しごとに `Strict`、`FlatDirectory`、および `OpenLocale` が置き換えられます (null はディレクトリとストリームローダーをクリアします)。`Locales` は、配列が null でない場合にのみ言語リストを置き換えます。 |
| `SupportedLocales` | `BuiltInLocales` は、null でない `Locales` 配列が渡されるまで。ネイティブ名と英語名。null の `Locales` 配列はスタンプを復元しません。 |
| `IsRightToLeft(locale)` | `CultureInfo.TextInfo.IsRightToLeft`。 |
| `PluralForm(locale, n)` | `.po` ファイルと同じ GNU ルールからの CLDR 形式名。 |

`init -t ui-dotnet-resx` は代わりに `I18nResx.cs` をコピーします。`T`、`Tn`、および `Tp` は、同じソース文字列キーで `ResourceManager` を呼び出します。`SetLocale` は `CurrentUICulture` と `CurrentCulture` を設定します。詳細: [.NET ResourceManager アプリに i18n を追加する](/ja/guide/add-i18n-to-dotnet-resourcemanager)。
