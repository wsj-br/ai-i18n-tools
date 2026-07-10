<a id="ui-strings"></a>
# UI文字列

i18next を使用するあらゆる JS/TS プロジェクト向けに設計されています：React アプリ、Next.js（クライアントおよびサーバーコンポーネント）、Node.js サービス、CLI ツールなど。

<a id="which-guide-to-read"></a>
## 読むべきガイド

| あなたのアプリ | 次を読む |
| --- | --- |
| React / Next.js / Node + i18next | [i18nextを接続する](/ja/guide/ui-strings/i18next-runtime) (ステップ4) |
| プレーンHTML (マークアップに`t()`なし) | [プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html) |
| Astroマーケティングサイト (ハイブリッド) | [Astroウェブサイト](/ja/guide/ui-strings/astro-website) |
| `t()`ルール、補間、複数形 | [t()呼び出しと複数形](/ja/guide/ui-strings/t-calls-and-plurals) |
| 言語ピッカー / RTL | [言語スイッチャーとRTL](/ja/guide/ui-strings/language-switcher) |
| ランタイムAPIシグネチャ | [ランタイムヘルパー](/ja/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## ステップ1: 初期化

```bash
npx ai-i18n-tools init
```

これにより、`ui-markdown` テンプレートを使用して `ai-i18n-tools.config.json` が書き込まれます（デフォルトの `provider` / `providers` ブロックを含む）。`translate-ui` または `sync` を実行する前に、環境変数または `.env` でアクティブなプロバイダーのAPIキーを設定してください（Ollamaを除く）。[プロバイダーとAPIキー](/ja/guide/quick-start#provider-and-api-key)を参照してください。設定を編集して以下を設定します：

- `provider` および `providers` — `translationModels` を持つプロバイダーが少なくとも1つ必要です。OpenRouterを使用しない場合は、プリセットまたはモデルリストを変更してください。[LLMプロバイダーとモデル](/ja/guide/providers-and-models)を参照してください。
- `sourceLocale` - ソース言語のBCP-47コード（例: `"en-GB"`）。ランタイムのi18nセットアップファイル（`src/i18n.ts` / `src/i18n.js`）からエクスポートされた `SOURCE_LOCALE` と**一致する必要があります**。
- `targetLocales` - ターゲット言語のBCP-47コードの配列（例: `["de", "fr", "pt-BR"]`）。このリストから `ui-languages.json` マニフェストを作成するには、`generate-ui-languages` を実行します。
- `ui.sourceRoots` - `t("…")` 呼び出しをスキャンするディレクトリまたはglobパターン（例: `["src/"]`, `["src/**/*.ts"]`）。
- `ui.stringsJson` - マスターカタログを書き込む場所（例: `"src/locales/strings.json"`）。
- `ui.flatOutputDir` - `de.json`、`pt-BR.json` などを書き込む場所（例: `"src/locales/"`）。
- `providers.<active>.uiModels`（オプション） - `translate-ui`、複数形生成、および `proofread-ui` のための順序付きUI専用モデルリスト（一致する `localeModels` エントリの後、`translationModels` の前）。[プロバイダーとモデル](/ja/guide/providers-and-models#model-fallback-chain)を参照してください。

<a id="step-2-extract-strings"></a>
## ステップ2: 文字列を抽出する

```bash
npx ai-i18n-tools extract
```

`ui.sourceRoots` 配下のすべての JS/TS ファイルをスキャンし、`t("literal")` および `i18n.t("literal")` 呼び出しを検出して `ui.stringsJson` に書き込み（またはマージ）します。

スキャナーは設定可能です。`ui.uiExtractor.funcNames` (またはレガシー`ui.reactExtractor.funcNames`) を介してカスタム関数名を追加します。Astroページとコンポーネントの場合、`ui.uiExtractor.extensions`に`.astro`を追加します。プレーンHTMLについては、[プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html)を参照してください。

<a id="step-3-translate-ui-strings"></a>
## ステップ3: UI文字列を翻訳する

```bash
npx ai-i18n-tools translate-ui
```

`strings.json`を読み取り、各ターゲットロケールのアクティブなLLMプロバイダーにバッチを送信し、フラットなJSONファイル（`de.json`、`fr.json`など）を`ui.flatOutputDir`に書き込みます。モデル選択にはUIチェーンが使用されます: `localeModels(locale)` → `uiModels` → `translationModels`（「[プロバイダーとモデル](/ja/guide/providers-and-models#model-fallback-chain)」を参照）。

<a id="per-locale-model-overrides"></a>
### ロケールごとのモデルオーバーライド

オプションの`providers.<active>.localeModels`エントリは、BCP-47ロケールを、そのロケールに対して**前に** `uiModels`と`translationModels`が試行された順序付きモデルリストにマッピングします。同じ`localeModels`エントリは、ドキュメント、JSON、SVGの翻訳にも適用されます。ロケールタグは、大文字と小文字を区別せずに照合されます（`pt-br` = `pt-BR`）。一致するエントリがない場合、UI作業には`uiModels`と`translationModels`のみが使用されます。

各エントリについて、`translate-ui`は、オプションの`models`オブジェクト (`translated`と同じロケールキー) 内で、各ロケールを正常に翻訳した**アクティブプロバイダーからのモデルID**を格納します。翻訳ダッシュボードで編集された文字列は、そのロケールの`models`で、番兵値`user-edited`でマークされます。`ui.flatOutputDir`の下にあるロケールごとのフラットファイルは、**ソース文字列 → 翻訳**のみのままであり、`models`は含まれません (そのため、ランタイムバンドルは変更されません)。

> **注:** UI文字列に対するダッシュボードの編集は、SQLiteドキュメントキャッシュではなく、`strings.json`に保存されます。カタログからフラットロケールファイルを書き換えるには、プレーンな`sync`または`translate-ui` (特別なフラグなし) を実行します。`--force-update`はUIステップに転送**されません**。手動編集後にUIコマンドで`--force`を使用しないでください。すべてのエントリが再翻訳され、`user-edited`行が上書きされる可能性があります。

次に、実行時にi18nextを接続します — [i18nextを接続する](/ja/guide/ui-strings/i18next-runtime)。

<a id="exporting-to-xliff-20-optional"></a>
## XLIFF 2.0へのエクスポート (オプション)

UI 文字列を翻訳ベンダー、TMS、CAT ツールに引き渡すために、カタログを **XLIFF 2.0** 形式（ターゲットロケールごとに1ファイル）でエクスポートします。このコマンドは**読み取り専用**です。`strings.json` を変更したり、API を呼び出したりすることはありません。

```bash
npx ai-i18n-tools export-ui-xliff
```

デフォルトでは、ファイルは `ui.stringsJson` の隣に `strings.de.xliff`、`strings.pt-BR.xliff`（カタログのベースネーム + ロケール + `.xliff`）のような名前で出力されます。`-o` / `--output-dir` を使用して他の場所に出力できます。`strings.json` からの既存の翻訳は `<target>` に表示され、翻訳のないロケールは `<target>` なしの `state="initial"` として出力され、ツールが翻訳を埋められるようになります。`--untranslated-only` を使用すると、各ロケールでまだ翻訳が必要なユニットのみをエクスポートできます（ベンダー向けのバッチ処理に便利です）。`--dry-run` はファイルの書き込みなしでパスを表示します。
