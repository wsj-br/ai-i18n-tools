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
| | `src/glossary/` | 用語集の読み込みとプロンプトの用語ヒント |
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

`.html` / `.htm` ソース（`ui.uiExtractor.extensions`にリストされている場合）の場合、`extract`はファイルを`html-i18n-marks.ts`経由でルーティングし、`data-i18n` / `data-i18n-title` / `data-i18n-placeholder`マーカー属性（`ui.uiExtractor.htmlI18nAttributes`で設定可能）をスキャンします。ベアマーカーは要素自身の`textContent` / `title` / `placeholder`からソーステキストを取得します。値を持つマーカー（`data-i18n="Key"`）は値を使用します。同じモジュールが`mark-html`コマンドにも使用されており、ベアマーカーを自動的に挿入します。HTMLファイルはBabel / i18next-scannerのパスには到達しません。

プレーンなAstro SSGサイトではi18nextをスキップし、ビルド時にフラットな`{locale}.json`を読み込み、ソーステキストキーで`t('English')`を解決できます（`examples/astro-website/src/i18n/t.ts`および[UI strings — Astro website](/ja/guide/ui-strings/astro-website#astro-website-plain-astro-not-starlight)を参照してください）。

プレーンなHTMLアプリは、`t()`呼び出しの代わりにマーカー属性を使用して同じカタログモデルに従います — [Marking HTML for translation](/ja/guide/ui-strings/plain-html#marking-html-for-translation)を参照してください。

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

- ソース言語とターゲット言語を特定します（`localeDisplayNames` または `ui-languages.json` の表示名で）。
- 文字列のJSON配列を送信し、翻訳された文字列のJSON配列を返信として要求します。
- 利用可能な場合は用語集のヒントを含めてください。

`LlmClient.translateUIBatch` は、解析エラーまたはネットワークエラーが発生した場合に備えて、各モデルを順番に試行します。CLI は、ターゲットロケールごとに `localeModels`、オプションの `uiModels`、および `translationModels` からそのリストを構築します ([プロバイダーとモデル](/ja/guide/providers-and-models#model-fallback-chain) を参照)。

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

- `MarkdownExtractor` - Markdownを型付きセグメントに分割します：`frontmatter`、`heading`、`paragraph`、`code`、`admonition`。YAMLフロントマターは**non-translatable**に分類されます（`slug`、`id`、およびその他のルーティングキーは安定します）。トップレベルの`export ...`ブロック（例：Reactコンポーネント定義）は、既存の`import ...`処理とともに、翻訳不可の`other`セグメントとして分類されます。大文字のJSXタグで始まる複数行ブロック（例：`<Tabs>`ブロック）は、翻訳可能な段落として分類されます。翻訳不可のセグメント（コードブロック、生のHTML）はそのまま保持されます。
- `AstroTemplateExtractor` - `.astro`マーケティングページ用の解析と置換（`doc-translate.ts`内の`translateAstroFile`経由の`translate-docs`）。ユーザー向けのHTMLテキストノードと翻訳可能な属性（`alt`、`title`、`aria-label`、`placeholder`）、およびユーザー向けの場合のテンプレート`{expression}`ブロック内の文字列リテラルを抽出します。フロントマターのTypeScript、`<script>`、`<style>`、保護された属性/キー値、および`t('…')`内のリテラルをスキップします。出力パスが深い場合、再構成時に相対インポートを調整します（例：`src/pages/de/index.astro`）。[Astro website pages](/ja/guide/ui-strings/astro-website#astro-website-pages-parse-and-replace)を参照してください。
- `JsonExtractor` - Docusaurus JSONラベルファイルから文字列値を抽出します（MDX本文ではなくDocusaurus UIカタログ）。
- `SvgExtractor` - SVGから`<text>`、`<title>`、および`<desc>`コンテンツを抽出します（`config.svg`下のファイルに対して`translate-svg`で使用され、`translate-docs`では使用されません）。
- `html-i18n-marks.ts` - `extract`が`.html` / `.htm`ソースに使用し、`mark-html`コマンドによって使用される、集中型のHTMLタグスキャナー。`collectHtmlI18nStrings` / `collectHtmlI18nLocations`は`data-i18n*`マーカー属性（ベアマーカー → 要素の`textContent` / `title` / `placeholder`、値を持つマーカー → 値）を読み取り、`markHtmlContent`はベアマーカーをリーフテキスト/タイトル/プレースホルダー要素に挿入します（冪等性があり、`data-i18n-ignore`を尊重し、コードのような要素や混合コンテンツ要素はスキップします）。共有の`normalizeI18nText`ヘルパーは、ビルド時のキーをブラウザランタイムと同じにします。

<a id="astro-hybrid-sites-ui--page-html"></a>
### Astro ハイブリッドサイト (UI + ページHTML)

プレーンな Astro アプリは、UI 文字列とドキュメントの**両方**を1つの設定で有効にすることがよくあります（参照: `examples/astro-website/`）。

| レイヤー | メカニズム | 出力 |
| --- | --- | --- |
| テンプレート HTML | `AstroTemplateExtractor` + `translate-docs` | `docs[].outputDir` 以下のロケールごとの `.astro` |
| Frontmatter / `t('…')` | `ui-string-babel.ts` + `extract` + `translate-ui` | フラットな`public/locales/{locale}.json`（英語ソースをキーとして使用） |

`sync` コマンドは、有効なステップを順に実行します: **extract**、次に **translate-ui**（`features.translateUIStrings` の場合）→ オプションの **translate-svg** → **translate-docs** → オプションの **translate-json**（`--no-ui`、`--no-svg`、`--no-docs`、または `--no-json` でスキップされない限り）。初期テンプレート `ui-astro-website` は UI 文字列のみを足場として提供します。ページ HTML には `docs[]` と `features.translateDocs` を追加します。

<a id="heading-anchor-insertion-write-heading-ids-cli"></a>
### 見出しアンカーの挿入（`write-heading-ids` CLI）

`write-heading-ids` コマンドは、ドキュメントの Markdown 用の**ローカルかつ非LLM**な前処理ツールです。実装：`src/cli/write-heading-ids.ts` がファイルの検出を調整し、`src/markdown/write-heading-ids-core.ts` が行を解析してアンカーを挿入します。

これには、**少なくとも1つの`docs[]`ブロック**を含む有効な設定が必要です。各ブロックについて、`contentPaths`の下にある`.md`/`.mdx`ファイルが収集され、プロジェクトの`.translate-ignore`ルール（ドキュメント翻訳と同じ考え方）が適用され、オプションで`--path`/`--file`を使用してサブツリーに制限されます。各ファイルは`applyHeadingAnchorsToMarkdown`で変換されます。フェンスで囲まれたコードブロックの外にある**フラットなATX見出し**（`# …`から`###### …`）ごとに、不足しているか古くなっている場合は、その上の行に空のHTML行`<a id="slug"></a>`が挿入されます。スラッグアルゴリズムは一般的なエコシステム（`github`（デフォルト）、`bitbucket`、`gitlab`、`pymdown`（オプションのUnicode正規化/パーセントエンコーディングフラグ）、`azure-devops`）と一致するため、アンカーIDは既存のツール（doctoc、PyMdownなど）と一貫しています。`--dry-run`は、書き込みなしで編集される可能性のあるものを報告します。

このコマンドは `translate-docs` や `sync` 内では**実行されません**。翻訳または公開前に、ソースファイル内で安定したフラグメントIDを確保したい場合に明示的に実行してください。

<a id="placeholder-protection"></a>
### プレースホルダー保護

翻訳前に、LLMによる破損を防ぐために、機微な構文が不透明なトークンに置き換えられます。以下の順序で適用されます（復元は逆順）：

1. **HTMLタグとコメント**（`<strong>`、`<!-- ... -->`など）- 既知の許可リストにある小文字のHTMLタグは```{{HTM_N}}```トークンに置き換えられます。大文字のJSXタグ（`<Highlight>`、`<Tabs>`、`</Tab>`）は、MDXレイヤー（ステップ4）によって個別に処理されます。
2. **アドモニションマーカー**（`:::note`、`:::`）- 開始行のディレクティブプレフィックスのみが```{{ADM_OPEN_N}}```に置き換えられます。同じ行のタイトルは、モデルが翻訳するために残されます。元のテキストとまったく同じように復元されます。
3. **ドキュメントアンカー**（HTML `<a id="…">`、Docusaurus見出し`{#…}`）- そのまま保持されます。
4. **MDX専用の構成要素**（`src/processors/mdx-placeholders.ts`）：
   - **MDXコメント** (`{/* … */}`、Docusaurusの見出しID形式`{/* #my-id */}`を含む) は```{{MDX_N}}```に置き換えられます。
   - **大文字のJSXタグ** (`<Highlight>`、`<Tabs>`、`<TabItem>`、`<TOCInline />`、`</Highlight>`) - ```{{MDX_N}}```として保持され、翻訳可能な文字列属性 (`label`、`tooltip`、`aria-label`) は、属性名が`docs[].protectAttributes`に表示されない限り、タグ内で```{{JXA_N}}```に書き換えられます。`<Tabs values={[ { label: '…' } ]}>`オブジェクトリテラル内の`label:` (`docs[].protectKeys`でスキップ可能) と`<TabItem value="…">` (`label`属性が存在しない場合、小文字のスラッグのような値はスキップ) も抽出されます。これらは`||JXA_N: …||`行としてセグメントに追加され、`restoreMdx`によってマージされます。
   - **MDXブレース式** (`{frontMatter.title}`、<code v-pre>style={{…}}</code>) - 深度を考慮したマッチングで、```{{MDX_N}}```に置き換えられます。
5. **Markdown URL** (`](url)`、`src="…"`) - 翻訳後にマップから復元されます。
6. **インラインコードスパン**（`` `code` ``）および**太字で囲まれたインラインコード**（`**`code`**`） - そのまま保持されます。
7. **Markdownの強調**（オプション。CJK/RTLロケールでは自動有効） - 強調区切り記号をマスクします。

モデルが応答を返した後、`translate-docs`はマップを復元し、セグメントを検証します。非強調の二重中括弧トークンは、保護されたソースと同じ順序のサブシーケンスを維持する必要があります（タイプごとの数が一致する場合、<code v-pre>**</code>などの強調マーカーは語順に合わせて移動できます）。復元されたHTMLタグの種類は、保護されていないソースと一致する必要があり、残存する二重中括弧の識別子は、ソースに既に存在していたものでなければなりません（そのため、新しく作成されたトークンは失敗します）。ドキュメントのプロンプトでは、各トークンを1回コピーし、番号付きトークンの順序を維持し、新しい二重中括弧のラッパーを作成しないこともモデルに求めています。機械的なチェックが引き続き最終的な判断基準となります。

AstroテンプレートとMDX JSXの共有属性/キー保護は`src/processors/expression-attribute-protection.ts`で実装されており、`docs[].protectAttributes`と`docs[].protectKeys`によってブロックごとに駆動されます（[protectAttributes / protectKeys](/ja/reference/configuration#protectattributes-protectkeys)を参照）。

<a id="cache-translationcache"></a>
### キャッシュ (`TranslationCache`)

SQLiteデータベース (`node:sqlite` 経由) は、`(source_hash, locale)` をキーとして `translated_text`、`model`、`filepath`、`last_hit_at` および関連フィールドを持つ行を格納します。ハッシュは、正規化されたコンテンツ（空白文字を圧縮）のSHA-256の最初の16文字の16進数です。

各実行時に、セグメントはハッシュ × ロケールで検索されます。キャッシュミスのみがLLMに送られます。翻訳後、現在の翻訳スコープ内でヒットしなかったセグメント行の `last_hit_at` がリセットされます。ドキュメント翻訳中のキャッシュヒット成功は、そのセグメントの古い `translation_failures` 行をクリアします。`cleanup` は最初に `sync --force-update` を実行し、その後、古いセグメント行（null の `last_hit_at` / 空のファイルパス）を削除し、解決されたソースパスがディスク上に存在しない場合に `file_tracking` キーを整理し（`doc-block:…`, `json-block:…`, `svg-files:…` など）、メタデータのファイルパスが存在しないファイルを指している翻訳行を削除し、孤立した `translation_failures` 行を整理し、解決されたソースパスがディスク上に存在しない孤立した `markdown_source_issues` 行を整理し、設定に存在しないロケールのキャッシュ行を破棄します（`sourceLocale`、ルート `targetLocales`、およびブロックごとの `docs[]` / `json[]` `targetLocales`; SQLiteのみ — 生成されたファイルを削除するには `purge-locale` を使用してください）。`--backup <path>` が渡されない限り `cache.db` をバックアップしませんが、渡された場合は最初にそのパスへバックアップを書き込みます。

`translate-docs`コマンドは**ファイル追跡**も使用するため、既存の最新の出力を持つ変更されていないソースは作業を完全にスキップできます。`--force-update`はセグメントキャッシュを使用しながらファイル処理を再実行します。`--force`はファイル追跡をクリアし、API翻訳のセグメントキャッシュ読み取りをバイパスします。設定されたすべてのモデルがマークダウンセグメントでAST検証に失敗した場合、`translate-docs`はセグメントを段階的に分割し、より小さな部分を再試行できます（`docs[].segmentSplitting.qualityRetrySplit`、デフォルトはオン）。完全なフラグテーブルについては、[ドキュメント — キャッシュの動作とフラグ](/ja/guide/documents/cli-options#cache-behaviour-and-translate-docs-flags)を参照してください。

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

- **モデルのフォールバック**: 解決されたリストの各モデルを順番に試行し、リクエストまたは解析の失敗時にフォールバックします。各ターゲットロケールは独自の解決済みチェーンを取得します。設定されている場合は`localeModels(locale)`が最初、次に`uiModels`（UIパイプラインのみ）、次に`translationModels`です。ドキュメント、JSON、およびSVGの翻訳は、非UIチェーンを持つロケールごとのクライアントを作成します。`bench-models`コマンドは、設定されたIDごとに1つの単一モデルクライアントを構築します（`translationModels`、`uiModels`、および`localeModels`の結合。`translationModels: [id]`、フォールバックなし）。これにより、各モデルの時間を測定し、個別に価格設定できます。
- **リクエストタイムアウト**: アクティブなプロバイダーの`requestTimeoutMs`（デフォルト30秒）は、`AbortSignal.timeout`を介して各リクエストを中止します。CLIが`check-models`（任意のプロバイダー）のプロバイダーのモデルリストをロードする場合、`GET /models`にも同じ値が適用されます。不明なモデルIDを削除するオプションのプリフライトフィルターは、アクティブなプロバイダーがOpenRouterの場合にのみ実行されます。
- **OpenRouterの追加機能**（`openrouter`がアクティブな場合のみ）: `provider`リクエストフィールド、`HTTP-Referer`/`X-Title`ヘッダー、および`usage.cost`から読み取られた正確なUSDコストを介したスループットルーティング。トークン使用量はすべてのプロバイダーで報告されます。正確なコストは、プロバイダーがそれを返す場合にのみ報告されます。
- **デバッグトラフィックログ**: `debugTrafficFilePath`が設定されている場合、リクエストとレスポンスのJSONをファイルに追加します。

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

`init` は `initConfigTemplates` からスターター構成を書き込みます: `ui-markdown` (UI + オプションのアプリマークダウン)、`ui-docusaurus`、`ui-starlight`、`ui-vitepress` (VitePress ドキュメント + `vitepressThemeCatalog`)、`ui-nextra` (Nextra ドキュメント + `nextraDictionaryPath`)、`ui-astro-website` (プレーンな Astro UI。`docs[]` を追加して `.astro` ページを翻訳)、`ui-json-bundles` (JSON `json[]` のみ)。[クイックスタート — 初期化](/ja/guide/quick-start#step-1-initialise) を参照してください。

<a id="logger"></a>
### ロガー

`Logger`は、ANSIカラー出力で`debug`、`info`、`warn`、`error`レベルをサポートします。詳細モード（`-v`）では`debug`が有効になります。`logFilePath`が設定されている場合、ログ行はそのファイルにも書き込まれます。

<a id="self-localization-tool-ui"></a>
### ツールの自己ローカライズ (ツール UI)

ツールは、コマンドラインインターフェースのヘルプ、高トラフィックログ/サマリー/エラーメッセージ、および翻訳ダッシュボードを含む自身のUIを、翻訳対象のコンテンツとは別にローカライズします。

- **ロケール解決** (`resolveUiLocale` in `src/core/ui-locale.ts`): `-L` / `--ui-lang` > `AI_I18N_LANG` > 設定 `uiLanguage` > ホスト OS ロケール (`Intl.DateTimeFormat().resolvedOptions().locale`) から UI ロケールを選択します。候補は正規化され、出荷されたバンドルセットと完全に一致するか、最も近いバリエーション (例: `pt-PT` → `pt-BR`、`en-US` → `en-GB`) で一致させ、ソースロケール (`en-GB`) にフォールバックします。CLI は、ヘルプが構築される前 (argv スキャンを事前解析) と、設定の読み込み後に再度解決されるため、`uiLanguage` が適用されます (フラグと環境変数が優先されます)。
- **ランタイム** (`src/i18n/index.ts`): ```{{name}}``` 補間を備えた最小限の `t(source, vars)` で、`src/i18n/locales/<code>.json` 内のフラットなロケールごとのバンドルに対して英語のソース文字列をキーとしています (ビルド時に `dist/i18n/locales` にコピーされます)。不足しているキーまたはバンドルはソーステキストを返します。これは UI 文字列と同じキーをデフォルトとするモデルであり、ハッシュルックアップはありません。
- **ダッシュボード**: サーバーは、解決された UI ロケールに対して `{ locale, dir, bundle }` を返す `GET /api/ui-i18n` を公開します。フロントエンドは `<html lang>` / `dir` を設定し、`data-i18n*` 属性を介して静的マークアップをローカライズします。
- **ドッグフーディング**: バンドルは、パッケージ自身の抽出 → `translate-ui` パイプラインを `ai-i18n-self.config.json` (`pnpm i18n:self`) に対して実行することによって生成されます。カタログキーは、`src/cli/` および `src/i18n/` 全体の `t()` 呼び出しと、`src/dashboard-app/index.html` 内のダッシュボードの `data-i18n*` マーカーから取得されます。

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
      "htmlI18nAttributes": ["data-i18n", "data-i18n-title", "data-i18n-placeholder"]
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
│   └── matcher.ts                  Term hint extraction for prompts
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
