<a id="ui-strings"></a>
# UI文字列

`extract` と `translate-ui` のリファレンスです。これは `t()` の呼び出しをロケールごとのカタログに変換するパイプラインです。アプリに初めて i18n を追加する場合は、まず [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js) または [Python アプリに i18n を追加する](/ja/guide/add-i18n-to-python) をご覧ください。これらのドキュメントではラップするステップを説明しており、その後、ステップ 2 から 4 のためにこのページに戻るよう案内しています。

このパイプラインは、JS/TS プロジェクト (React、Next.js のクライアントコンポーネントとサーバーコンポーネント、Node.js サービス、プレーン HTML、Astro ウェブサイト、CLI ツール) と Python アプリケーションに対応しています。JS/TS では、ソースが `t()` を呼び出した後、i18next を使って文字列を検索します。Python は、生成された `i18n.py` を介して `t()` または gettext を呼び出します (Django は Django の gettext を維持します)。

<a id="which-guide-to-read"></a>
## 読むべきガイド

| あなたのアプリ | 次に読むべきドキュメント |
| --- | --- |
| ハードコードされたソース文字列があり、まだ `t()` がない JS/TS | [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js) |
| ソースにすでに `t()` がある React / Next.js / Node | [i18next を接続する](/ja/guide/ui-strings/i18next-runtime) |
| Python (`t()`、`_()`、gettext、Jinja、Django) | [Pythonアプリケーション](/ja/guide/ui-strings/python)。初期化: `ui-python`、`ui-python-gettext`、`ui-python-flask`、または`ui-python-django`。ヘルパー: `i18n.py`。既存のアプリにロケールを追加するには、[Pythonアプリにi18nを追加する](/ja/guide/add-i18n-to-python)を参照してください。アプリがgettextを使用している場合は、[Django / Python gettextアプリにi18nを追加する](/ja/guide/add-i18n-to-django-gettext)を参照してください。 |
| プレーンHTML (マークアップに`t()`なし) | [プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html) |
| Astroマーケティングサイト (ハイブリッド) | [Astroウェブサイト](/ja/guide/ui-strings/astro-website) |
| `t()`ルール、補間、複数形 | [t()呼び出しと複数形](/ja/guide/ui-strings/t-calls-and-plurals) |
| 言語ピッカー / RTL | [言語スイッチャーとRTL](/ja/guide/ui-strings/language-switcher) |
| ランタイムAPIシグネチャ | [ランタイムヘルパー](/ja/guide/runtime-helpers) |
| Intlayer から移行する Intlayer `.content.ts` 辞書 | [Intlayer からの移行](/ja/guide/migrating-from-intlayer) |
| Intlayer を維持する Intlayer `.content.ts` 辞書 | [Intlayer をインプレースで翻訳する](/ja/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## ステップ1: 初期化

```bash
ai-i18n-tools init -P openrouter
```

これにより、`ui-markdown` テンプレート (そのプリセットの `provider` / `providers` ブロックを含む) を使用して `ai-i18n-tools.config.json` が書き込まれます。そのテンプレートは `README.md` のドキュメント翻訳も有効にし、`translated-docs/` の下にフラットファイルとして書き込みます。README のみのリポジトリでは、代わりに `init -t docs-markdown` を使用します。[README と Markdown ドキュメントに i18n を追加する](/ja/guide/add-i18n-to-readme) を参照してください。`translate-ui` または `sync` を実行する前に、そのプロバイダーの API キーを環境または `.env` に設定します。ただし Ollama は例外です。[プロバイダーと API キー](/ja/guide/quick-start#provider-and-api-key) を参照してください。UI 文字列には 4 つのキーが重要です。

- `sourceLocale`: ソーステキストが書かれている言語の BCP-47 コードです。どの言語でも有効です。`"en-GB"` は一例にすぎません。ランタイム i18n 設定ファイル (`src/i18n.ts` / `src/i18n.js`) からエクスポートされた `SOURCE_LOCALE` と一致する必要があります。`t()` 内の文字列はそのソース言語であり、フラットなロケールファイルはそれをキーとして使用します。
- `targetLocales`: ターゲット言語の BCP-47 コードです (例: `["de", "fr", "pt-BR"]`)。`generate-ui-languages` を実行して、このリストから `ui-languages.json` マニフェストを作成します。
- `ui.sourceRoots`: `t("…")` の呼び出しをスキャンするディレクトリまたは glob パターンです (例: `["src/"]`)。
- `ui.stringsJson` と `ui.flatOutputDir`: マスターカタログとロケールごとのファイル (`de.json`、`pt-BR.json`) が書き込まれる場所です。

`providers.<active>.uiModels` を含む他のすべてのキーは、[設定](/ja/reference/configuration) に記載されています。

<a id="step-2-extract-strings"></a>
## ステップ2: 文字列を抽出する

`t()` / `i18n.t()` の呼び出しが存在するまで、`extract` は何も有用なことを行いません。まずハードコードされたコピーをラップしてください: [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js)。

```bash
ai-i18n-tools extract
```

`ui.sourceRoots` 以下のファイルをスキャンして `t("literal")` と `i18n.t("literal")` の呼び出しを探します。`ui.stringsJson` に書き込み (またはマージ) します。

スキャナーは設定可能です。`ui.uiExtractor.funcNames` (またはレガシー`ui.reactExtractor.funcNames`) を介してカスタム関数名を追加します。Astroページとコンポーネントの場合、`ui.uiExtractor.extensions`に`.astro`を追加します。プレーンHTMLについては、[プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html)を参照してください。

<a id="what-extract-scans"></a>
### extract がスキャンするもの

- デフォルトの拡張子は `.js`、`.jsx`、`.ts`、`.tsx` のみです。`.mjs`、`.cjs`、`.mts`、`.cts` は、`ui.uiExtractor.extensions` に追加した場合にのみ含まれます。
- `t(variable)` のような非リテラルキーやテンプレートリテラルは、警告なしでスキップされます。
- `package.json` `description` はデフォルトで含まれます (`ui.uiExtractor.includePackageDescription`)。
- Vue と Svelte の単一ファイルコンポーネントはサポートされていません。`extensions` に `.vue` や `.svelte` を追加しても、テンプレートテキストは抽出されません。SFC パーサーはありません。

<a id="step-3-translate-ui-strings"></a>
## ステップ3: UI文字列を翻訳する

```bash
ai-i18n-tools translate-ui
```

`strings.json`を読み取り、アクティブなLLMプロバイダー上のモデルに各ターゲットロケールごとにバッチを送信し、フラットなJSONファイル（`de.json`、`fr.json`など）を`ui.flatOutputDir`に書き込みます。モデルの選択には、UIチェーン: `localeModels(locale)` → `uiModels` → `translationModels`が使用されます（[AIモデル](/ja/guide/ai-models#model-fallback-chain)を参照）。1つのロケール内で、最大`uiBatchConcurrency`個のバッチが同時に実行されます（デフォルトは**2**。 [設定 — uiBatchConcurrency](/ja/reference/configuration#uibatchconcurrency-optional)を参照）。`-j`は依然としてターゲットロケールのみを並列化します。

<a id="translations-database-stringsjson"></a>
### 翻訳データベース (`strings.json`)

各エントリについて、`translate-ui`は、オプションの`models`オブジェクト (`translated`と同じロケールキー) 内で、各ロケールを正常に翻訳した**アクティブプロバイダーからのモデルID**を格納します。翻訳ダッシュボードで編集された文字列は、そのロケールの`models`で、番兵値`user-edited`でマークされます。`ui.flatOutputDir`の下にあるロケールごとのフラットファイルは、**ソース文字列 → 翻訳**のみのままであり、`models`は含まれません (そのため、ランタイムバンドルは変更されません)。

> **注:** UI文字列に対するダッシュボードでの編集は、SQLiteドキュメントキャッシュではなく、`strings.json`に保存されます。カタログからフラットなロケールファイルを書き換えるには、通常の`sync`または`translate-ui`（特別なフラグなし）を実行してください — `--force-update`はUIステップに**転送されません**。手動編集後にUIコマンドで`--force`を使用することは避けてください。これはすべてのエントリを再翻訳し、`user-edited`の行を上書きする可能性があります。保存された翻訳がロケールの記述システムチェック（例: `hi`のローマ字表記ヒンディー語）に失敗したカタログ行は、欠落しているものとして扱われ、`--force`なしで再翻訳されます。

<a id="step-4-use-the-output-in-your-app"></a>
## ステップ 4: アプリで出力を使用する

`translate-ui` はファイルを書き込むだけです。アプリがそれらを読み込む必要があります。

- JS/TS: i18nextをランタイムヘルパーでセットアップし、ユーザーが選択したロケールファイルを読み込み、言語スイッチャーを追加します。[i18nextの配線](/ja/guide/ui-strings/i18next-runtime)および[言語スイッチャーとRTL](/ja/guide/ui-strings/language-switcher)を参照してください。
- Python: 生成された`i18n.py`またはgettextカタログを使用します。[Pythonアプリケーション](/ja/guide/ui-strings/python)を参照してください。
- Plain HTML: ページに隣接してランタイムスクリプトを読み込みます。[プレーンHTMLアプリ](/ja/guide/ui-strings/plain-html)を参照してください。
- Astro: [Astroウェブサイト](/ja/guide/ui-strings/astro-website)を参照してください。

<a id="optional"></a>
## オプション

<a id="per-locale-model-overrides"></a>
### ロケールごとのモデルオーバーライド

モデルによっては、特定の言語の翻訳が得意なものがあります。例えば、qwenモデルやz-aiモデルはアジア言語の翻訳に優れています。各BCP-47ロケールに優先順位付けされたモデルリストを提供するために、`providers.<active>.localeModels`エントリを追加します。これらのリストは、そのロケールに対して`uiModels`と`translationModels`よりも先に試行されます。ロケールタグは、大文字と小文字を区別せずに一致します（`zh-cn`と`ZH-CN`は同等です）。一致するエントリがない場合、ツールはデフォルトの`uiModels`と`translationModels`の順序を使用します。同じ`localeModels`のメカニズムは、ドキュメント、JSON、SVGの翻訳にも適用されます。

<a id="exporting-to-xliff-20"></a>
### XLIFF 2.0 へのエクスポート

UI 文字列を翻訳ベンダー、TMS、CAT ツールに引き渡すために、カタログを **XLIFF 2.0** 形式（ターゲットロケールごとに1ファイル）でエクスポートします。このコマンドは**読み取り専用**です。`strings.json` を変更したり、API を呼び出したりすることはありません。

```bash
ai-i18n-tools export-ui-xliff
```

デフォルトでは、ファイルは `ui.stringsJson` の隣に `strings.de.xliff`、`strings.pt-BR.xliff`（カタログのベースネーム + ロケール + `.xliff`）のような名前で出力されます。`-o` / `--output-dir` を使用して他の場所に出力できます。`strings.json` からの既存の翻訳は `<target>` に表示され、翻訳のないロケールは `<target>` なしの `state="initial"` として出力され、ツールが翻訳を埋められるようになります。`--untranslated-only` を使用すると、各ロケールでまだ翻訳が必要なユニットのみをエクスポートできます（ベンダー向けのバッチ処理に便利です）。`--dry-run` はファイルの書き込みなしでパスを表示します。
