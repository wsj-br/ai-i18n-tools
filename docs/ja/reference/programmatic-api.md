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

主なエクスポート（一般的に使用されるもの — 完全な公開インターフェースについては`src/index.ts`を参照）：

| エクスポート | 説明 |
|---|---|
| `loadI18nConfigFromFile` | JSONファイルから設定を読み込み、マージし、検証します。 |
| `parseI18nConfig` | 生の設定オブジェクトを検証します。 |
| `TranslationCache` | SQLite キャッシュ - `cacheDir` パスでインスタンス化します。 |
| `UIStringExtractor` | JS/TS ソースから `t("…")` 文字列を抽出します。 |
| `collectHtmlI18nStrings` / `markHtmlContent` | HTML内の`data-i18n*`マーカーをスキャン/挿入します（`extract`の`.html`および`mark-html`コマンドをサポート）。 |
| `MarkdownExtractor` | Markdown から翻訳対象のセグメントを抽出します。 |
| `JsonExtractor` | DocusaurusのJSONラベルファイルから抽出（UIカタログ、MDX本文ではない）。 |
| `SvgExtractor` | SVG ファイルから抽出します。 |
| `LlmClient` | アクティブな LLM プロバイダーに翻訳リクエストを行います（`OpenRouterClient` は非推奨のエイリアスです）。 |
| `PlaceholderHandler` | 翻訳前後にMarkdown構文（HTMLタグ、注記、アンカー、MDXコメント/JSX/波括弧、URL、インラインコード、強調）を保護・復元します。 |
| `protectMdx` / `restoreMdx` | MDXコメント、JSXタグ、波括弧式、JSX文字列属性を保護・復元します（`PlaceholderHandler`から呼び出され、直接使用するためにエクスポートもされます）。 |
| `splitTranslatableIntoBatches` | セグメントを LLM 向けのバッチサイズにグループ化します。 |
| `validateTranslation` | 変換後の構造チェック（**async** — 待機する必要があります）。 |
| `resolveDocumentationOutputPath` | 翻訳済みドキュメントの出力ファイルパスを解決します。 |
| `Glossary` / `GlossaryMatcher` | 翻訳用語集を読み込み、適用します。 |
| `runTranslateUI` | プログラムによる翻訳UIのエントリポイントです。 |
| `PROVIDER_PRESETS` | 組み込みプロバイダープリセットマップ（`baseUrl`、`apiKeyEnv`）。 |
