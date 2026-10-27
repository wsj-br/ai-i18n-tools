<a id="architecture"></a>
# アーキテクチャ

<a id="architecture-overview"></a>
## アーキテクチャの概要

コードベースは4つのレイヤーで構成されています。このセクションは概念モデルとして使用し、ファイルレベルの詳細が必要な場合は[ソースツリー](#source-tree)を開いてください。

<a id="how-a-sync-run-fits-together"></a>
### `sync`の実行の仕組み

`sync`（および個々の翻訳コマンド）は、有効な機能を次の順序で実行します。

| ステップ | コマンド | 実行内容 |
| --- | --- | --- |
| 1 | `extract` → `translate-ui` | UIソースのスキャン → `strings.json`の更新 → フラットなロケールJSON（`de.json`など）の入力 |
| 2 | `translate-svg` *(オプション)* | `config.svg`配下のSVGテキストを翻訳 |
| 3 | `translate-docs` | Markdown、MDX、`.astro` ページを翻訳。Docusaurus カタログ JSON。Nextra `_meta` / 辞書 `.ts`。VitePress テーマカタログ |
| 4 | `translate-json` *(オプション)* | `json[]`配下のネストされたJSONリーフを翻訳 |

すべてのパイプラインは、**セグメントの抽出 → 構文の保護 → バッチ処理 → キャッシュ検索またはLLM呼び出し → 出力の書き込み**という同じコアループに従います。設定、プレースホルダー、キャッシュ、用語集、`LlmClient`などの中央の共有サービスについては、[共有インフラストラクチャ](#shared-infrastructure)で説明しています。

<a id="module-map"></a>
### モジュールマップ

| レイヤー | フォルダー | 役割 |
| --- | --- | --- |
| **エントリ** | `src/cli/` | CLIコマンド: `init`、`extract`、`mark-html`、`translate-ui`、`translate-docs`、`translate-json`、`translate-svg`、`sync`、`status`、`dashboard`、… |
| **パイプライン** | `src/extractors/` | JS/TS、HTMLマーカー、Markdown、JSON、SVG、`.astro`からのセグメント抽出 |
| | `src/processors/` | プレースホルダー保護、バッチ処理、検証、リンク書き換え |
| **共有** | `src/core/` | 設定、型、SQLiteキャッシュ、プロンプト、出力パス、ロケールユーティリティ |
| | `src/api/` | `LlmClient` — プロバイダーに依存しないチャットクライアント（Vercel AI SDK）、モデルフォールバック付き |
| | `src/glossary/` | プロンプト用の用語集読み込み、用語ヒント、およびオプションのプロジェクトコンテキストファイル |
| | `src/utils/` | ロガー、ハッシュ化、無視パーサー、表示幅テーブル、`.env`ローダー |
| **アプリのランタイム** | `src/runtime/` | i18nextヘルパーと表示ユーティリティ — `'ai-i18n-tools/runtime'`としてエクスポートされます（[ランタイムヘルパー](/ja/guide/runtime-helpers)） |
| **ツールUI** *(ドッグフーディング)* | `src/i18n/`、`src/dashboard-app/`、`src/server/` | このパッケージ自身のCLIと翻訳ダッシュボードをローカライズ — プロジェクトコンテンツとは別です（[自己ローカライズ](#self-localization-tool-ui)） |

プログラムによる使用を目的としたものはすべて`src/index.ts`から再エクスポートされます（[プログラムAPI](/ja/reference/programmatic-api)）。

<a id="pipeline-summaries"></a>
### パイプラインの概要

| パイプライン | セクション | 入力 → 出力 |
| --- | --- | --- |
| UI 文字列 | [UI 文字列の内部](#ui-strings-internals) | ソースファイル → `strings.json` → フラットな `{locale}.json` |
| ドキュメント | [ドキュメントの内部](#documents-internals) | Markdown / MDX / `.astro` / Docusaurus JSON → `docs[].outputDir` 以下のロケールごとのファイル |
| JSON バンドル | [JSON の内部](#json-internals) | `json[]` 以下のネストされた JSON → ロケールごとの JSON ファイル |
| SVG | [ドキュメントの内部 — エクストラクター](#extractors) | `config.svg` 以下の SVG ファイル → 翻訳された SVG コピー |

---

<a id="ui-strings-internals"></a>
## UI 文字列の内部構造

| ステップ | コンポーネント | 結果 |
| --- | --- | --- |
| 1 | ソースファイル (JS/TS; オプションの `.astro` / `.html`) | ディスク上のファイル |
| 2 | `UIStringExtractor` (i18next-scanner; `.astro` は `ui-string-babel.ts` 経由) | MD5 ハッシュでキー付けされたセグメント |
| 3 | `strings.json` | マスターカタログ: `{ hash: { source, translated, models?, locations? } }` |
| 4 | `LlmClient.translateUIBatch()` | ソース文字列の JSON 配列 → 翻訳 (+ バッチごとのモデル ID) |
| 5 | `de.json`、`pt-BR.json`、… | フラットマップ: ソース文字列 → 翻訳 (モデルメタデータなし) |

<a id="uistringextractor"></a>
### `UIStringExtractor`

JS/TSファイル内の`t("literal")`および`i18n.t("literal")`呼び出しを見つけるために、`i18next-scanner`の`Parser.parseFuncFromString`を使用します。`.astro`ソース（`ui.uiExtractor.extensions`にリストされている場合）について、`ui-string-babel.ts`はフロントマターとテンプレート`{expression}`ブロックを`@babel/parser`で解析し、同じ`funcNames`ルールを適用します。関数名とファイル拡張子は`ui.uiExtractor`で設定可能です（`ui.reactExtractor`はサポートされているエイリアスです）。`extract` **また、非スキャナー入力を同じカタログにマージします：** `includePackageDescription`が有効な場合（デフォルト）のプロジェクト`package.json` `description`、および`includeUiLanguageEnglishNames`が`true`の場合のバンドルされたui-languagesマスターカタログ（`sourceLocale` + `targetLocales`から構築）からの各`englishName`（ソースで既に見つかった文字列が優先されます；`languagesManifestPath`は読み取りません）。`extract`は`languagesManifestPath`で`ui-languages.json`も再生成します。セグメントハッシュは、トリムされたソース文字列の**MD5の最初の8文字の16進数**です。これらは`strings.json`のキーになります。

`.html` / `.htm` ソース（`ui.uiExtractor.extensions` に記載されている場合）において、`extract` はファイルを `html-i18n-marks.ts` 経由でルーティングし、`data-i18n` / `data-i18n-title` / `data-i18n-placeholder` / `data-i18n-alt` / `data-i18n-aria-label` のマーカー属性（`ui.uiExtractor.htmlI18nAttributes` で設定可能）をスキャンします。ベアマーカーは、要素自身の `textContent` または属性からソーステキストを取得します。値付きマーカー（`data-i18n="Key"`）は、その値を使用します。`data-i18n-locale-src` および `data-i18n-locale-href` はブラウザーランタイム用に予約されており、抽出されることはありません。この同じモジュールは `mark-html` コマンドの機能も提供しており、ベアマーカー（`alt` および `aria-label` を含む）を自動的に挿入しますが、ロケール URL マーカーは挿入しません。HTML ファイルは、Babel / i18next-scanner の処理パスに到達することはありません。docs `outputDir` 配下に生成されたロケール HTML は、このスキャンの対象外となります。

プレーンな Astro SSG サイトでは i18next を省略できます。ビルド時にフラットな `{locale}.json` を読み込み、ソーステキストのキーで `t('source text')` を解決します。ソース言語は `sourceLocale` で、任意の言語を使用できます (`examples/astro-website/src/i18n/t.ts` と [UI 文字列 — Astro ウェブサイト](/ja/guide/ui-strings/astro-website) を参照)。

プレーンな HTML アプリは、`t()` 呼び出しの代わりにマーカー属性を使用する同じカタログモデルに従います。[翻訳用に HTML をマークする](/ja/guide/ui-strings/plain-html#marking-html-for-translation) を参照してください。ドロップインスクリプトは `ai-i18n-tools/html-runtime/i18n.js` です。

ロケールごとに 1 つのファイルとなる静的 HTML は、このカタログではなくドキュメントパイプライン（`translate-docs` 内の `HtmlTemplateExtractor`）です。[HTML ページ](/ja/guide/documents/html-pages) を参照してください。

<a id="stringsjson"></a>
### `strings.json`

マスターカタログの構造は以下の通りです。

```json
{
  "a1b2c3d4": {
    "source": "The English string",
    "translated": {
      "de": "Der deutsche Text",
      "pt-BR": "O texto em português"
    },
    "models": {
      "de": "anthropic/claude-3.5-haiku",
      "pt-BR": "openai/gpt-4o"
    },
    "locations": [{ "file": "src/app/page.tsx", "line": 51 }]
  }
}
```

`models` (オプション) — ロケールごとに、そのロケールの最後に成功した`translate-ui`実行後にどのモデルがその翻訳を生成したか（または、テキストが翻訳ダッシュボードから保存された場合は`user-edited`）。`locations` (オプション) — `extract`が文字列を見つけた場所（スキャナー + パッケージの説明行；バンドルされたマスター`englishName`文字列は`locations`を省略する場合があります）。

`extract`は新しいキーを追加し、スキャンにまだ存在するキー（スキャナーリテラル、オプションの説明、オプションのバンドルされたマスター`englishName`）の既存の`translated` / `models`データを保持します。`translate-ui`は欠落している`translated`エントリを埋め、翻訳するロケールの`models`を更新し、フラットなロケールファイルを書き込みます。

`ui-languages.json` **マニフェスト** — `{ code, label, englishName, direction }`のJSON配列（BCP-47 `code`、UI `label`、参照`englishName`、`"ltr"`または`"rtl"`）。`sourceLocale` + `targetLocales`およびバンドルされたマスター`data/ui-languages-complete.json`からプロジェクトファイルを構築するには、`generate-ui-languages`または`extract`を使用します。

<a id="flat-locale-files"></a>
### フラットなロケールファイル

各ターゲットロケールには、ソース文字列 → 翻訳（`models` フィールドなし）をマッピングするフラットなJSONファイル（`de.json`）が割り当てられます。

```json
{
  "The English string": "Der deutsche Text",
  "Save": "Speichern"
}
```

i18nextはこれらをリソースバンドルとして読み込み、ソース文字列（キーをデフォルトとするモデル）で翻訳を検索します。

<a id="ui-translation-prompts"></a>
### UI 翻訳プロンプト

`buildUIPromptMessages` は以下の内容を含むシステムおよびユーザー向けメッセージを構築します。

- ソース言語とターゲット言語を特定します（`localeDisplayNames`または`ui-languages.json`の表示名を使用）。
- ターゲットロケールに期待される書記体系がある場合、スクリプトディレクティブを先頭に付加します（明示的なBCP-47スクリプト、または`hi` → デーヴァナーガリー、`ar` → アラビア文字、`ja` → 日本語の仮名/漢字などの言語デフォルト）。
- 文字列のJSON配列を送信し、翻訳のJSON配列を返すよう要求します。
- 利用可能な場合は用語集のヒントを含めます。

`LlmClient.translateUIBatch` は、解析、ネットワーク、または不正なスクリプトのエラー（ネイティブスクリプトのロケールに対するローマ字/ラテン文字のフォールバックを含む）でフォールバックしながら、各モデルを順番に試行します。CLI は、`localeModels`、オプションの `uiModels`、および `translationModels` からターゲットロケールごとにそのリストを構築します（[AI モデル](/ja/guide/ai-models#model-fallback-chain) を参照）。

---

<a id="documents-internals"></a>
## ドキュメントの内部構造

| ステップ | コンポーネント | 結果 |
| --- | --- | --- |
| 1 | Markdown / MDX / JSON / `.astro` ファイル (`translate-docs`) | ソースファイル |
| 2 | `MarkdownExtractor` / `JsonExtractor` / `AstroTemplateExtractor` | `segments[]` — ハッシュ + コンテンツを含む型付きセグメント |
| 3 | `PlaceholderHandler` | 保護されたテキスト — HTML、アドモニッション、アンカー、MDX、URL、インラインコード、トークンとしてマスクされた強調 |
| 4 | `splitTranslatableIntoBatches` | `batches[]` — カウント + 文字数制限でグループ化 |
| 5 | `TranslationCache` ルックアップ | キャッシュヒット → スキップ; ミス → `LlmClient.translateDocumentBatch` |
| 6 | `PlaceholderHandler.restoreAfterTranslation` | 最終テキスト — プレースホルダーが復元されたもの |
| 7 | `resolveDocumentationOutputPath` | 出力ファイル — Docusaurus レイアウトまたはフラットレイアウト |

<a id="extractors"></a>
### エクストラクター

すべてのエクストラクターは `BaseExtractor` を継承し、`extract(content, filepath): Segment[]` を実装しています。

- `MarkdownExtractor` - マークダウンを型付きセグメント（`frontmatter`、`heading`、`paragraph`、`code`、`admonition`）に分割します。YAML フロントマターは**翻訳不可**として分類されます（`slug`、`id`、およびその他のルーティングキーは変更されません）。トップレベルの `export ...` ブロック（React コンポーネント定義など）は、既存の `import ...` 処理と並行して、翻訳不可の `other` セグメントとして分類されます。大文字の JSX タグで始まる複数行ブロック（`<Tabs>` ブロックなど）は、翻訳可能な段落として分類されます。翻訳不可のセグメント（コードブロック、生の HTML）はそのまま保持されます。
- `AstroTemplateExtractor` - `.astro` マーケティングページの解析と置換（`doc-translate.ts` 内の `translateAstroFile` を介した `translate-docs`）。ユーザー向けの HTML テキストノードと翻訳可能な属性（`alt`、`title`、`aria-label`、`placeholder`）を抽出し、さらにユーザー向けの場合はテンプレート `{expression}` ブロック内の文字列リテラルも抽出します。フロントマターの TypeScript、`<script>`、`<style>`、保護された属性/キーの値、および `t('…')` 内のリテラルはスキップします。再構築時に、出力パスが深くなる場合（`src/pages/de/index.astro` など）は相対インポートを調整します。[Astro ウェブサイトのページ](/ja/guide/ui-strings/astro-website#pages-parse-and-replace) を参照してください。
- `JsonExtractor` - Docusaurus の JSON ラベルファイルから文字列値を抽出します（MDX 本文ではなく、Docusaurus UI カタログ）。
- `SvgExtractor` - SVG から `<text>`、`<title>`、および `<desc>` のコンテンツを抽出します（`translate-docs` ではなく、`translate-svg` によって `config.svg` 以下のファイルに使用されます）。
- `html-i18n-marks.ts` - `extract`が`.html` / `.htm`ソースに使用し、`mark-html`コマンドによって使用される、集中型のHTMLタグスキャナー。`collectHtmlI18nStrings` / `collectHtmlI18nLocations`は`data-i18n*`マーカー属性（ベアマーカー → 要素の`textContent` / `title` / `placeholder`、値を持つマーカー → 値）を読み取り、`markHtmlContent`はベアマーカーをリーフテキスト/タイトル/プレースホルダー要素に挿入します（冪等性があり、`data-i18n-ignore`を尊重し、コードのような要素や混合コンテンツ要素はスキップします）。共有の`normalizeI18nText`ヘルパーは、ビルド時のキーをブラウザランタイムと同じにします。

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro ハイブリッドサイト (UI + ページHTML)

プレーンな Astro アプリは、UI 文字列とドキュメントの**両方**を1つの設定で有効にすることがよくあります（参照: `examples/astro-website/`）。

| レイヤー | メカニズム | 出力 |
| --- | --- | --- |
| テンプレート HTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` 以下のロケールごとの `.astro` |
| フロントマター / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | フラットな `public/locales/{locale}.json` (ソース言語の文字列をキーとする。`sourceLocale` は任意の言語で可) |

`sync` コマンドは、有効なステップを順に実行します: **extract**、次に **translate-ui**（`features.translateUIStrings` の場合）→ オプションの **translate-svg** → **translate-docs** → オプションの **translate-json**（`--no-ui`、`--no-svg`、`--no-docs`、または `--no-json` でスキップされない限り）。初期テンプレート `ui-astro-website` は UI 文字列のみを足場として提供します。ページ HTML には `docs[]` と `features.translateDocs` を追加します。

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 見出しアンカーの挿入（`write-heading-ids` CLI）

`write-heading-ids` コマンドは、ドキュメントの Markdown 用の**ローカルかつ非LLM**な前処理ツールです。実装：`src/cli/write-heading-ids.ts` がファイルの検出を調整し、`src/markdown/write-heading-ids-core.ts` が行を解析してアンカーを挿入します。

有効な設定には、**少なくとも1つの `docs[]` ブロック**が必要です。各ブロックについて、`contentPaths` の下にある `.md` / `.mdx` ファイルを収集し、プロジェクトの `.translate-ignore` ルール（ドキュメント翻訳と同じ考え方）を適用し、オプションで `--path` / `--file` を使用してサブツリーに制限します。各ファイルは `applyHeadingAnchorsToMarkdown` で変換されます。コードブロック外のすべての**フラットなATX見出し**（`# …` から `###### …` まで）について、任意の形式の既存の見出しIDが選択したスタイルに置き換えられます。HTMLスタイルは、サフィックスのない見出しの上の行に `<a id="slug"></a>` を書き込みます。`--slug-style mdx-comment` は見出し行に `{/* #slug */}` を書き込みます（また、先行するHTMLアンカーを削除します）。スラッグは常に現在の見出しテキストから取得されます。`--remove` はHTMLアンカー、古典的な `{#id}` サフィックス、およびMDXコメントIDを削除しますが、新しいものは書き込みません。スラッグアルゴリズムは一般的なエコシステムに一致します — `github`（デフォルト）、`bitbucket`、`gitlab`、`pymdown`（オプションのUnicode正規化 / パーセントエンコーディングフラグ）、`azure-devops`、および `mdx-comment`（githubスラッグ + MDXコメント出力） — そのため、アンカーIDは既存のツール（doctoc、PyMdown、Docusaurusなど）と一貫性を保ちます。`--dry-run` は書き込まずに編集予定の内容を報告します。

ソースパスの後、同じコマンドがそれらの英語IDを各ロケールの既存の翻訳済みマークダウン（`resolveTranslatedOutputPath`）に再配置します。翻訳されたタイトルは再スラッグ化されません。見出し途中の`{#id}` / `{/* #id */}`は、選択されたスタイルが期待するサフィックス（またはHTMLアンカー）に戻されます。存在しないロケールファイルはスキップされます。

このコマンドは `translate-docs` や `sync` 内では**実行されません**。翻訳または公開前に、ソースファイル内で安定したフラグメントIDを確保したい場合に明示的に実行してください。

<a id="placeholder-protection"></a>
### プレースホルダー保護

翻訳前に、LLMによる破損を防ぐために、機微な構文が不透明なトークンに置き換えられます。以下の順序で適用されます（復元は逆順）：

1. **フェンスコードブロック**（3つ以上のバッククォートまたはチルダ。長いフェンスが短いフェンスを囲む場合を含む） - フェンス全体（情報文字列を含む）は <code v-pre>{{CDF_N}}</code> に置き換えられ、他の構造トークンと順序が保たれます。これにより、`::: code-group` や `::: tip` などのコンテナ内のサンプルがそのまま保持されます。フェンス情報文字列（VitePressのタブラベル）はソース言語のままです。閉じられていない開始フェンスはテキストとして残され、後続のコンテナクローザーが飲み込まれないようにします。
2. **見出しIDサフィックス**（ATX見出しの末尾にある従来の `{#id}` / MDX `{/* #id */}`）— 行から完全に取り除かれ、モデルには**送信されません**。復元後、対応する見出しの末尾に再び付加され、Docusaurusが有効なIDを認識できるようにします。見出し途中のコメントはテキストに残り、後のMDX / `{#…}` レイヤーで処理されます。マスクされたフェンス内の見出しは取り除かれません。
3. **HTMLタグとコメント**（`<strong>`、`<!-- ... -->`など） - 既知の許可リストにある小文字のHTMLタグは <code v-pre>{{HTM_N}}</code> トークンに置き換えられます。大文字のJSXタグ（`<Highlight>`、`<Tabs>`、`</Tab>`）はMDXレイヤー（ステップ6）で個別に処理されます。
4. **アドモニションマーカー**（`:::note`、`:::`） - 開始行のディレクティブプレフィックスのみが <code v-pre>{{ADM_OPEN_N}}</code> に置き換えられます。同じ行のタイトルはモデルが翻訳するために残されます。元のテキストと完全に同じ形で復元されます。
5. **ドキュメントアンカー**（HTMLの`<a id="…">`、見出しの途中に残ったDocusaurusの`{#…}`） - そのまま保持されます。
6. **MDX専用の構文**（`src/processors/mdx-placeholders.ts`）:
   - **MDXコメント**（行末の接尾辞ではない見出しの途中の`{/* #my-id */}`を含む`{/* … */}`）は<code v-pre>{{MDX_N}}</code>に置き換えられます。
   - **大文字のJSXタグ**（`<Highlight>`、`<Tabs>`、`<TabItem>`、`<TOCInline />`、`</Highlight>`） - <code v-pre>{{MDX_N}}</code>として保持され、翻訳可能な文字列属性（`label`、`tooltip`、`aria-label`）は、属性名が`docs[].protectAttributes`に含まれていない限り、タグ内で<code v-pre>{{JXA_N}}</code>に書き換えられます。`<Tabs values={[ { label: '…' } ]}>`オブジェクトリテラル内（`docs[].protectKeys`でスキップ可能）の`label:`と`<TabItem value="…">`（`label`属性が存在せず、小文字のスラッグのような値をスキップする場合）も抽出されます。`||JXA_N: …||`行としてセグメントに追加され、`restoreMdx`によってマージされて戻されます。
   - **MDXの波括弧式**（`{frontMatter.title}`、<code v-pre>style={{…}}</code>） - 深さを考慮したマッチングで、<code v-pre>{{MDX_N}}</code>に置き換えられます。
7. **MarkdownのURL**（`](url)`、`src="…"`） - 翻訳後にマップから復元されます。
8. **インラインコードスパン**（`` `code` ``）と**太字で囲まれたインラインコード**（`**`code`**`） - 保持されます。
9. **Markdownの強調**（オプション、CJK/RTLロケールでは自動的に有効化） - 強調の区切り文字はマスクされます。

モデルが応答を返した後、`translate-docs`はマップを復元し、セグメントを検証します。同じ二重波括弧トークンの多重集合が存在する必要があり、構造トークン（<code v-pre>{{HTM_N}}</code>、アドモニションマーカー、<code v-pre>{{CDF_N}}</code>）はその順序付けられた部分シーケンスを維持する必要があります（<code v-pre>{{ILC_N}}</code> / <code v-pre>{{URL_N}}</code> / <code v-pre>**</code>などのコンテンツトークンは語順とともに移動する場合があります）。復元されたHTMLタグの種類は、保護されていないソースと一致する必要があり、また、残った二重波括弧の識別子は、ソースに既に存在していたものでなければなりません（したがって、作成されたトークンは失敗します）。ドキュメントのプロンプトはまた、各トークンを1回コピーし、構造トークンの順序を維持し、新しい二重波括弧のラッパーを作成しないようにモデルに要求します。機械的なチェックが引き続き権威を持ちます。

AstroテンプレートとMDX JSXの共有属性/キー保護は`src/processors/expression-attribute-protection.ts`で実装されており、`docs[].protectAttributes`と`docs[].protectKeys`によってブロックごとに駆動されます（[protectAttributes / protectKeys](/ja/reference/configuration#protectattributes-protectkeys)を参照）。

<a id="cache-translationcache"></a>
### キャッシュ (`TranslationCache`)

SQLiteデータベース (`node:sqlite` 経由) は、`(source_hash, locale)` をキーとして `translated_text`、`model`、`filepath`、`last_hit_at` および関連フィールドを持つ行を格納します。ハッシュは、正規化されたコンテンツ（空白文字を圧縮）のSHA-256の最初の16文字の16進数です。

各実行時に、セグメントはハッシュ × ロケールで検索されます。キャッシュミスのみがLLMに送られます。翻訳後、現在の翻訳スコープ内でヒットしなかったセグメント行の `last_hit_at` がリセットされます。ドキュメント翻訳中のキャッシュヒット成功は、そのセグメントの古い `translation_failures` 行をクリアします。`cleanup` は最初に `sync --force-update` を実行し、その後、古いセグメント行（null の `last_hit_at` / 空のファイルパス）を削除し、解決されたソースパスがディスク上に存在しない場合に `file_tracking` キーを整理し（`doc-block:…`, `json-block:…`, `svg-files:…` など）、メタデータのファイルパスが存在しないファイルを指している翻訳行を削除し、孤立した `translation_failures` 行を整理し、解決されたソースパスがディスク上に存在しない孤立した `markdown_source_issues` 行を整理し、設定に存在しないロケールのキャッシュ行を破棄します（`sourceLocale`、ルート `targetLocales`、およびブロックごとの `docs[]` / `json[]` `targetLocales`; SQLiteのみ — 生成されたファイルを削除するには `purge-locale` を使用してください）。`--backup <path>` が渡されない限り `cache.db` をバックアップしませんが、渡された場合は最初にそのパスへバックアップを書き込みます。

課金対象のモデル呼び出し (採用された翻訳と破棄された再試行) は `api_calls` に保存されます。呼び出しを記録するコマンドの実行後、UTC暦日で7日を超えた詳細行は月次の `api_totals` にロールアップされます。`usage` とダッシュボードの「使用量とコスト」ビューでは、両方のテーブルが統合されます。[使用量とコスト](/ja/guide/translation-dashboard/usage) を参照してください。

用語集の `Context` メモと `glossary.contextFiles` はフィンガープリント化 (`prompt_context_hash`) され、UI、ドキュメント、JSON、SVG、および校正プロンプトに挿入されます。そのガイダンスを変更すると、次回の実行時に対応するキャッシュセグメントとファイル追跡行が無効化されます。ダッシュボードの `user-edited` キャッシュ行は保持されます。用語集の優先翻訳のみを変更した場合は、`--force` / `--force-update` まで既存のキャッシュがそのまま保持されます。

`translate-docs`コマンドは**ファイルトラッキング**も使用するため、変更されていないソースで既存の最新の出力がある場合、作業を完全にスキップできます。`--check-cache`は期待される書記体系でロケールを再度開き、キャッシュされたセグメントを再検証します。`--force-update`はセグメントキャッシュを使用しながら、各ロケールのファイル処理を再実行します。`--force`はファイルトラッキングをクリアし、API翻訳のセグメントキャッシュ読み取りをバイパスします。設定されたすべてのモデルがMarkdownセグメントのAST検証に失敗した場合、`translate-docs`はセグメントを段階的に分割し、より小さな部分を再試行できます（`docs[].segmentSplitting.qualityRetrySplit`、デフォルトでオン）。フラグの完全な表については、[ドキュメント — キャッシュの動作とフラグ](/ja/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)を参照してください。

**バッチプロンプト形式:** `translate-docs --prompt-format`は、`LlmClient.translateDocumentBatch`のみのXML（`<seg>` / `<t>`）またはJSON配列/オブジェクトの形式を選択します。抽出、プレースホルダー、検証は変更されません。[バッチプロンプト形式](/ja/guide/documents/cli-options#batch-prompt-format)を参照してください。

<a id="output-path-resolution"></a>
### 出力パスの解決

`resolveDocumentationOutputPath(config, cwd, locale, relPath, kind)`はソース相対パスを出力パスにマッピングします：

- `nested` スタイル (デフォルト): Markdown には `{outputDir}/{locale}/{relPath}` を使用します。
- `doc-system` スタイル: `docsRoot` の下では、出力は `{outputDir}/{locale}/[localeSubpath/]{relativeToDocsRoot}` を使用します。`docsRoot` 外のパスはネストされたレイアウトにフォールバックします。エイリアス: `docusaurus` (デフォルト `localeSubpath` = Docusaurus プラグインパス)、`astro-starlight` (デフォルトは空の `localeSubpath`)、`vitepress` (空の `doc-system` と同じ `localeSubpath`; BCP-47 フォルダの大文字と小文字を保持)。
- `flat` スタイル: `{outputDir}/{stem}.{locale}{extension}`。`flatPreserveRelativeDir` が `true` の場合、ソースサブディレクトリは `outputDir` の下に保持されます。
- **カスタム** `pathTemplate`: `{outputDir}`、`{locale}`、`{LOCALE}`、`{relPath}`、`{stem}`、`{basename}`、`{extension}`、`{docsRoot}`、`{relativeToDocsRoot}` を使用する任意の Markdown レイアウト。
- **カスタム** `jsonPathTemplate`: JSON ラベルファイル用の個別のカスタムレイアウト。同じプレースホルダーを使用。
- `linkRewriteDocsRoot` は、翻訳された出力がデフォルトのプロジェクトルート以外に配置される場合に、フラットリンク書き換えツールが正しいプレフィックスを計算できるようにする。

<a id="flat-link-rewriting"></a>
### フラットリンクの書き換え

`docsOutput.style === "flat"`の場合、翻訳されたMarkdownファイルは、ロケールサフィックス付きでソースと並んで配置されます。ページ間の相対リンクは、`readme.de.md`内の`[Guide](./guide.md)`が`guide.de.md`を指すように書き換えられます。`rewriteRelativeLinks`によって制御されます（カスタム`pathTemplate`のないフラットスタイルでは自動的に有効になります）。同じパスは、`postProcessing.regexAdjustments`が実行される前に、Markdown以外のアセットURLにファイルごとの深さのプレフィックスを付加します — [Flat link rewriter](/ja/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow)を参照してください。

---

<a id="json-internals"></a>
## JSON の内部構造

| ステップ | コンポーネント | 結果 |
| --- | --- | --- |
| 1 | `json[].contentPaths` | ファイルが解決されました（ファイル、ディレクトリ、またはグロブ） |
| 2 | `NestedJsonExtractor` | `keyPolicy`によって選択された文字列リーフ（ドットパス + ミニマッチ） |
| 3 | `PlaceholderHandler` + バッチ + `TranslationCache` | キャッシュヒット → スキップ; ミス → `LlmClient.translateDocumentBatch`（共有SQLite） |
| 4 | `NestedJsonExtractor.reassemble` | `expandJsonBlockOutputPath(outputPathTemplate)`を介した出力ファイル |

- `NestedJsonExtractor` (`src/extractors/nested-json-extractor.ts`) は任意のネストされた JSON を走査し、翻訳可能な文字列リーフごとに1つのセグメントを出力します。`keyPolicy.mode` (`allowlist`、`denylist`、または `both`) は、ドット表記の minimatch でパスをフィルタリングします（`slug` のようなベア名は最終キーセグメントに一致します）。
- キャッシュファイルの追跡は `file_tracking` の `json-block:{blockIndex}:{projectRelPath}` を使用します（ドキュメントや SVG と同じ `cacheDir`）。
- Docusaurus `write-translations` カタログ (`{ message, description }` 形式) には**使用されません**。これらはドキュメント (`translate-docs` 内の `docs[].docusaurusCatalogDir` + `JsonExtractor`) を使用します。
- `t()` UI 文字列には**使用されません**。UI 文字列 (`strings.json` + フラットバンドル) を使用します。
- CLI：`translate-json`；オーケストレーションは`src/cli/translate-json-run.ts`内。initテンプレート：`ui-json-bundles`。

---

<a id="shared-infrastructure"></a>
## 共有インフラストラクチャ

<a id="llmclient"></a>
### `LlmClient`

Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) 上に構築された、プロバイダーに依存しないチャットクライアント。アクティブなプロバイダーを `provider` / `providers` から解決し、そのプロバイダーの `baseUrl` + API キー用の OpenAI 互換クライアント (`createOpenAICompatible`) を構築し、すべての呼び出しを `generateText` 経由でルーティングします。`OpenRouterClient` は非推奨のエイリアスとして保持されます。主な動作:

- **モデルのフォールバック**: 解決されたリスト内の各モデルを順番に試行します。リクエストまたは解析が失敗した場合はフォールバックします。各ターゲットロケールには独自の解決済みチェーンが割り当てられます。設定されている場合は `localeModels(locale)` が最初に使用され、次に `uiModels` (UIパイプラインのみ)、その後に `translationModels` が続きます。ドキュメント、JSON、およびSVGの翻訳では、UI以外のチェーンを使用してロケールごとのクライアントが作成されます。一方、`bench-models` コマンドは、設定されたIDごとに単一モデルのクライアントを構築します (`translationModels`、`uiModels`、および `localeModels` の和集合。`translationModels: [id]`、フォールバックなし)。これにより、各モデルの所要時間と価格を個別に測定できます。
- **リクエストタイムアウト**: アクティブなプロバイダー上の `requestTimeout` (秒) または `requestTimeoutMs` が使用されます。それ以外の場合は設定の最上位にある同じキーが使用され (デフォルトは45秒)、`AbortSignal.timeout` を介して各リクエストが中断されます。CLIが `check-models` (任意のプロバイダー) 用にプロバイダーのモデルリストを読み込む際にも、同じ値が `GET /models` に適用されます。不明なモデルIDを除外するオプションのプリフライトフィルターは、アクティブなプロバイダーがOpenRouterの場合にのみ実行されます。
- **OpenRouterの追加機能** (`openrouter` がアクティブな場合のみ): `provider` リクエストフィールドおよび `HTTP-Referer` / `X-Title` ヘッダーを介したスループットルーティング。トークン使用量はすべてのプロバイダーについて報告されます。OpenRouterおよびCheaper Inferenceは、請求されるUSD金額も返します (`usage.cost`。Cheaper Inferenceは `cheaper_inference.billing.billed_cost_usd` にフォールバックします)。プロバイダーがその金額を省略した場合、USDコストは `providers.<name>.modelPricing` から計算され、次にプロバイダー全体の `pricing` デフォルト値、その次に models.dev の入力および出力リスト価格から計算され、`api_calls` 行に保存されます。プロバイダーが報告したコスト (`0` を含む) が置き換えられることはありません。不明なコストは設定されないままとなります。呼び出しの価格設定では `<cacheDir>/benchmark-scores.json` の models.dev スライスのみが読み取られ、languagebenchやArenaファイルはダウンロードされません。
- **デバッグトラフィックログ**: `debugTrafficFilePath` が設定されている場合、リクエストとレスポンスのJSONがファイルに追記されます (プログラムによる)。CLI `--debug-failed` は、システム/ユーザープロンプト、生のAI応答、および失敗したUI、ドキュメント、JSON、SVGの翻訳チェック試行に対する検証エラーを含む `FAILED-TRANSLATION` ファイルを `cacheDir` 配下に書き込みます。プロバイダーAPIまたは空のボディによる失敗は、プロンプトのみのファイルをダンプする代わりにコンソールに出力されます。

`suggest-models` とダッシュボードの [モデル] タブは LLM を呼び出しません。これらは languagebench ChrF、LMArena Arena Score、models.dev の価格でアクティブなプロバイダーのチャットカタログをランク付けし、オプションで `providers.<name>.translationModels` を置き換えます。集計は `<cacheDir>/benchmark-scores.json` に格納されます。[AI モデル](/ja/guide/ai-models) と [suggest-models](/ja/reference/cli-commands/models#suggest-models) を参照してください。

<a id="config-loading"></a>
### 設定の読み込み

`loadI18nConfigFromFile(configPath, cwd)`パイプライン：

1. `ai-i18n-tools.config.json` (JSON) を読み取って解析します。
2. `mergeWithDefaults` - `defaultI18nConfigPartial`とディープマージし、`docs[].sourceFiles`エントリを`contentPaths`にマージします。
3. `expandTargetLocalesFileReferenceInRawInput` - `targetLocales`を配列に強制変換し、パスのようなエントリを拒否します（`ui-languages.json`へのパスではなく、BCP-47コードである必要があります）；`languagesManifestPath`は`mergeWithDefaults`中に`{ui.flatOutputDir}/ui-languages.json`にデフォルト設定されます。
4. `expandDocumentationTargetLocalesInRawInput` - 各`docs[].targetLocales`エントリについても同様です。
5. `expandJsonTargetLocalesInRawInput` - 各 `json[].targetLocales` エントリで同じです。
6. `parseI18nConfig` - Zod 検証 + `validateI18nBusinessRules`。
7. `applyProviderOverrideToRawInput` - CLI で `-P` / `--provider` が渡された場合。
8. `applyEnvOverrides` - `OPENROUTER_BASE_URL`、`OLLAMA_BASE_URL`、`I18N_SOURCE_LOCALE`、および `I18N_TARGET_LOCALES` が設定されている場合に適用します (API キーは `LlmClient` 内でプロバイダーごとに個別に解決されます)。
9. `augmentConfigWithUiLanguagesMaster` - バンドルされたマスターカタログからマニフェスト表示名を添付します。
10. `assertEffectiveLocalesInUiLanguagesMaster` - 該当する場合、マスターカタログに対してロケールコードを検証します。

`init`は`initConfigTemplates`からスターター設定を書き込みます: `ui-markdown` (UI文字列とフラットなREADMEブロック)、`docs-markdown` (READMEとMarkdownのみ)、`ui-docusaurus`、`ui-starlight`、`ui-vitepress` (VitePressドキュメント + `vitepressThemeCatalog`)、`ui-nextra` (Nextraドキュメント + `nextraDictionaryPath`)、`ui-astro-website` (プレーンなAstro UI。`.astro`ページの翻訳には`docs[]`を追加)、`ui-json-bundles` (JSON `json[]`のみ)、`ui-python`、`ui-python-gettext`、`ui-python-django`、`ui-python-flask`。`--with-readme`は、`README.md`をまだリストしていないテンプレートに同じREADMEブロックを追加し、`translateDocs`をオンにします。詳細は[UI文字列 — 初期化](/ja/guide/ui-strings/#step-1-initialise)、[READMEとMarkdownドキュメントにi18nを追加する](/ja/guide/add-i18n-to-readme)、[Pythonアプリケーション](/ja/guide/ui-strings/python)を参照してください。

<a id="logger"></a>
### ロガー

`Logger`は、ANSIカラー出力で`debug`、`info`、`warn`、`error`レベルをサポートします。詳細モード（`-v`）では`debug`が有効になります。`logFilePath`が設定されている場合、ログ行はそのファイルにも書き込まれます。

<a id="self-localization-tool-ui"></a>
### ツールの自己ローカライズ (ツール UI)

ツールは、コマンドラインインターフェースのヘルプ、高トラフィックログ/サマリー/エラーメッセージ、および翻訳ダッシュボードを含む自身のUIを、翻訳対象のコンテンツとは別にローカライズします。

- **ロケール解決** (`src/core/ui-locale.ts`内の`resolveUiLocale`): UIロケールを`-L` / `--ui-lang` > `AI_I18N_LANG` > 設定`uiLanguage` > ホストOSのロケール (`Intl.DateTimeFormat().resolvedOptions().locale`) の順で選択します。候補は正規化され、同梱されているバンドルセットと完全一致または最も近いバリエーション (例: `pt-PT` → `pt-BR`、`en-US` → `en-GB`) で照合され、ソースロケール (`en-GB`) にフォールバックします。CLIは、ヘルプがビルドされる前に1回 (argvのスキャン前)、そして設定が読み込まれた後にもう1回解決を行い、`uiLanguage`が適用されるようにします (フラグと環境変数が常に優先されます)。
- **ランタイム** (`src/i18n/index.ts`): <code v-pre>{{name}}</code>補間を備えた最小限の`t(source, vars)`で、`src/i18n/locales/<code>.json`内のロケールごとのフラットなバンドルに対して英語のソース文字列をキーとして使用します (ビルド時に`dist/i18n/locales`にコピーされます)。キーまたはバンドルが見つからない場合は、ソーステキストが返されます。これはUI文字列と同じキーをデフォルトとして使用するモデルです — ハッシュルックアップはありません。
- **ダッシュボード**: サーバーは、解決されたUIロケールに対して`{ locale, dir, bundle }`を返す`GET /api/ui-i18n`を公開します。フロントエンドは`<html lang>` / `dir`を設定し、`data-i18n*`属性を介して静的マークアップをローカライズします。
- **ドッグフーディング**: バンドルは`pnpm i18n:self` (`sync-ui --ui-block src/i18n/strings.json`) によって生成されます。これは`ai-i18n-tools.config.json`内のCLIとダッシュボードの`ui`ブロックを抽出して翻訳します。カタログキーは、`src/cli/`と`src/i18n/`にまたがる`t()`呼び出しと、`src/dashboard-app/index.html`内のダッシュボードの`data-i18n*`マーカーから取得されます。

---

<a id="extension-points"></a>
## 拡張ポイント

<a id="custom-function-names-ui-extraction"></a>
### カスタム関数名（UI抽出）

設定を通じて非標準の翻訳関数名を追加します。

```json
{
  "ui": {
    "uiExtractor": {
      "funcNames": ["t", "i18n.t", "translate", "i18n.translate"],
      "extensions": [".js", ".jsx", ".ts", ".tsx", ".astro", ".html"],
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder", "data-i18n-alt", "data-i18n-aria-label"]
    }
  }
}
```

（`ui.reactExtractor`は`ui.uiExtractor`の完全にサポートされたエイリアスです。）

`.html` / `.htm`を`extensions`に追加して、`extract`中にHTMLマーカー属性をスキャンします。`ui.uiExtractor.htmlI18nAttributes`はオプションで、デフォルトは`["data-i18n", "data-i18n-title", "data-i18n-placeholder"]`です。`data-i18n`は要素の`textContent`にマッピングされ、`data-i18n-<attr>`はその属性の値にマッピングされます（例：`data-i18n-aria-label`）。

<a id="custom-extractors"></a>
### カスタムエクストラクタ

パッケージから `ContentExtractor` を実装します。

```ts
import { BaseExtractor, type Segment } from 'ai-i18n-tools';

class MyExtractor extends BaseExtractor {
  readonly name = 'my-format';
  canHandle(filepath: string) { return filepath.endsWith('.myext'); }
  extract(content: string, filepath: string): Segment[] { /* … */ }
  reassemble(segments: Segment[], translations: Map<string, string>): string { /* … */ }
}
```

`'ai-i18n-tools'` からエクスポートされたパブリックエクストラクタクラスを拡張して、カスタムエクストラクタを登録します (例: `MarkdownExtractor` をサブクラス化します)。CLI は組み込みエクストラクタを内部的に接続します。`doc-translate.ts` のディープインポートはサポートされていません。

<a id="custom-output-paths"></a>
### カスタム出力パス

任意のファイルレイアウトには `docsOutput.pathTemplate` を使用します

```json
{
  "docs": [
    {
      "docsOutput": {
        "pathTemplate": "{outputDir}/{locale}/{relativeToDocsRoot}"
      }
    }
  ]
}
```

---

<a id="source-tree"></a>
## ソースツリー

<details>
<summary>完全な <code>src/</code> レイアウト (ファイルレベルの参照)</summary>

```text
src/
├── index.ts                        Public API re-exports
│
├── cli/
│   ├── index.ts                    CLI entry point (commander)
│   ├── extract-strings.ts          `extract` command implementation
│   ├── mark-html.ts                `mark-html` command (insert bare `data-i18n*` markers into HTML)
│   ├── translate-ui-strings.ts     `translate-ui` command implementation
│   ├── doc-translate.ts            `translate-docs` command (documentation files only)
│   ├── translate-json-run.ts       `translate-json` command (`json[]` nested locale bundles)
│   ├── translate-svg.ts            `translate-svg` command (SVG files from `config.svg`)
│   ├── write-heading-ids.ts        `write-heading-ids` command (markdown heading anchors)
│   ├── bench-models.ts             `bench-models` command (per-model translate latency/token/cost benchmark)
│   ├── helpers.ts                  Shared CLI utilities
│   └── file-utils.ts               File collection helpers
│
├── markdown/
│   └── write-heading-ids-core.ts   Slug styles + `<a id="…">` insertion for `write-heading-ids`
│
├── core/
│   ├── types.ts                    Zod schemas + TypeScript types for all config shapes
│   ├── config.ts                   Config loading, merging, validation, init templates
│   ├── cache.ts                    SQLite translation cache (node:sqlite)
│   ├── prompt-builder.ts           LLM prompt construction for docs and UI strings
│   ├── output-paths.ts             Docusaurus / flat output path resolution
│   ├── ui-languages.ts             ui-languages.json loading and locale resolution
│   ├── ui-locale.ts                Resolve the tool's own UI locale (flag/env/config/OS → shipped bundle)
│   ├── locale-utils.ts             BCP-47 normalisation, locale list parsing, script/Han-variant validation
│   └── errors.ts                   Typed error classes
│
├── extractors/
│   ├── base-extractor.ts           Abstract base class for all extractors
│   ├── ui-string-extractor.ts      JS/TS source scanner (i18next-scanner + Babel for `.astro`)
│   ├── ui-string-babel.ts          Babel-based `t()` discovery in `.astro` frontmatter and `{expression}` blocks
│   ├── ui-string-locations.ts      Source locations for extracted UI strings
│   ├── html-i18n-marks.ts          HTML `data-i18n*` marker scanner + `mark-html` annotator
│   ├── classify-segment.ts         Heuristic segment type classification
│   ├── markdown-extractor.ts       Markdown / MDX segment extraction
│   ├── markdown-segment-split.ts   Optional segment splitting for long markdown blocks
│   ├── frontmatter-fields.ts       Selective YAML front matter field translation
│   ├── astro-template-extractor.ts `.astro` parse-and-replace (HTML + template expressions; used by `translate-docs`)
│   ├── json-extractor.ts           Docusaurus catalog JSON extraction (`translate-docs`)
│   ├── nested-json-extractor.ts    Arbitrary nested JSON leaves (`translate-json`, `json[]`)
│   └── svg-extractor.ts            SVG text extraction
│
├── processors/
│   ├── placeholder-handler.ts      Chain: HTML → admonitions → anchors → MDX → URLs → emphasis
│   ├── expression-attribute-protection.ts  Shared protected attribute/key lists (Astro + MDX JSX)
│   ├── url-placeholders.ts         Markdown URL protection/restore
│   ├── admonition-placeholders.ts  Docusaurus admonition protection/restore
│   ├── anchor-placeholders.ts      HTML anchor / heading ID protection/restore
│   ├── html-tag-placeholders.ts    Lowercase HTML tag / comment protection ({{HTM_N}})
│   ├── placeholder-integrity.ts    Pre/post-restore token sequence + tag-kind + invented {{IDENT}} checks
│   ├── mdx-placeholders.ts         MDX comments, JSX tags, brace expressions, JSX attribute extraction
│   ├── batch-processor.ts          Segment → batch grouping (count + char limits)
│   ├── validator.ts                Post-translation structural checks
│   └── flat-link-rewrite.ts        Relative link rewriting for flat output
│
├── api/
│   ├── llm-client.ts               LlmClient: provider-agnostic chat client (AI SDK) with model fallback chain
│   └── provider-models-catalog.ts  Fetch/parse any provider's OpenAI-compatible GET /models catalog
│
├── glossary/
│   ├── glossary.ts                 Glossary loading (CSV + auto-build from strings.json)
│   ├── matcher.ts                  Term hint extraction for prompts
│   └── translation-context.ts      contextFiles loader and guidance fingerprints
│
├── runtime/
│   ├── index.ts                    Runtime re-exports
│   ├── template.ts                 interpolateTemplate, flipUiArrowsForRtl
│   ├── ui-language-display.ts      getUILanguageLabel, getUILanguageLabelNative
│   └── i18next-helpers.ts          RTL detection, i18next setup factories
│
├── i18n/                           Self-localization runtime for the tool's own UI
│   ├── index.ts                    t(source, vars) + bundle/manifest loaders (keyed by English source string)
│   └── locales/                    Shipped UI bundles (de.json, es.json, …; generated by `pnpm i18n:self`)
│
├── dashboard-app/
│   ├── index.html                  Translation Dashboard static UI (HTML/CSS/JS)
│   ├── app.js
│   └── styles.css
│
├── server/
│   └── translation-dashboard.ts    Express app for Translation Dashboard (cache / strings.json / glossary)
│
└── utils/
    ├── logger.ts                   Leveled logger with ANSI support
    ├── hash.ts                     Segment hash (SHA-256 first 16 hex)
    ├── table.ts                    Display-width aware table rendering (CJK/emoji column alignment)
    ├── load-dotenv.ts              Auto-load `.env` from the cwd at CLI startup (never overrides existing env)
    └── ignore-parser.ts            .translate-ignore file parser
```

</details>
