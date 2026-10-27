<a id="fumadocs-integration"></a>
# Fumadocsの統合

Next.js App Routerで[Fumadocs](https://www.fumadocs.dev/) 4のドキュメントサイトには、`init -t ui-fumadocs`と`docsOutput.style: "fumadocs"`を使用します。このプリセットは、空の`doc-system`とBCP-47または短いロケールコードが保持された`localeSubpath`のエイリアスです（`localePathLowercase`はデフォルトで`false`）。

[Documents](/ja/guide/documents/)と実行可能な[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/)デモ（ドットパーサー、ポート3080）も参照してください。

<a id="quick-start"></a>
## クイックスタート

```bash
ai-i18n-tools init -t ui-fumadocs -P groq
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run build       # Next.js build (project-specific script)
```

ページコンテンツ、`meta.json`サイドバーラベル、およびFumadocs UIのオーバーライドを1回の`sync`実行で翻訳する場合は、`features.translateDocs`を有効にします。

<a id="page-layout"></a>
## ページレイアウト

Fumadocsは、`docsOutput.fumadocsParser`を介して2つのi18nコンテンツレイアウトをサポートしています。**ドット**パーサーがデフォルトです（Fumadocsに組み込まれており、[SWR](https://github.com/vercel/swr-site)などの本番サイトで使用されています）。

<a id="dot-parser-default"></a>
### ドットパーサー (デフォルト)

英語のMDXはコレクションのルートにあります。翻訳されたコピーは、同じディレクトリにロケールサフィックスを使用します。

```text
content/docs/index.mdx                    →  content/docs/index.pt.mdx
content/docs/guide/getting-started.mdx    →  content/docs/guide/getting-started.zh.mdx
```

```json
{
  "contentPaths": ["content/docs"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs",
    "fumadocsParser": "dot",
    "rewriteFumadocsLinks": true
  }
}
```

`lib/i18n.ts`の`targetLocales`を`defineI18n().languages`と正確に合わせます（例では短いコード`pt`と`zh`を使用しています）。

<a id="enable-i18n-in-an-existing-site"></a>
### 既存のサイトで i18n を有効にする

英語のみの Fumadocs アプリで `translate-docs` が兄弟ファイルを書き込めるようにするには、ロケールルートと `defineI18n` が必要です。[エージェントプロンプト](#agent-prompt) は、既存のサイトを順を追って説明します。チェックリスト:

- `lib/i18n.ts` 内で `defineI18n` を `languages`、`defaultLanguage`、および `parser: "dot"` または `"dir"` と共に設定します。
- `proxy.ts` (サンプルファイル) からのルートを `app/[lang]/` し、`createI18nMiddleware` します。
- `lib/layout.shared.ts` 内の `i18n.translations()` を `i18nProvider` に渡します。
- 英語の MDX をコレクションルート (ドット) または `content/docs/en/` (ディレクトリ) 以下に配置します。
- `targetLocales` は、`languages` からデフォルト言語を引いたものに `sync` を連結したものと等しくなります。

<a id="dir-parser-nextra-style"></a>
### Dirパーサー（Nextraスタイル）

ロケールフォルダ（`content/docs/en/` → `content/docs/pt-BR/`）に慣れているチームの場合、`fumadocsParser`を`"dir"`に設定します。

```text
content/docs/en/index.mdx           →  content/docs/pt-BR/index.mdx
content/docs/en/guide/foo.mdx       →  content/docs/zh-Hans/guide/foo.mdx
```

```json
{
  "contentPaths": ["content/docs/en"],
  "outputDir": "content/docs",
  "docsOutput": {
    "style": "fumadocs",
    "docsRoot": "content/docs/en",
    "fumadocsParser": "dir",
    "rewriteFumadocsLinks": true
  }
}
```

コピー＆ペースト可能なディレクトリ設定については、[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) の `ai-i18n-tools.config.dir.example.json` を参照してください。メンタルモデルは [Nextra integration](/ja/guide/integrations/nextra#page-layout) と一致します。

<a id="sidebar-metajson"></a>
## サイドバー (`meta.json`)

Fumadocsは、サイドバーの構造とタイトルにJSON `meta.json`ファイルを使用します。`docsOutput.style`が`"fumadocs"`の場合、**`translate-docs`** は`docsRoot`（または`docs[].fumadocsMetaGlob`）の下の`meta.json`を収集し、`docs[].fumadocsMetaTranslatableKeys`にリストされているキー（デフォルト：`title`、`description`）の文字列値を翻訳して、ロケール出力を書き込みます。

| パーサー | ソースロケール | 出力 |
|---|---|---|
| **dot** | `content/docs/**/meta.json` | `content/docs/**/meta.{locale}.json` |
| **dir** | `content/docs/en/**/meta.json` | `content/docs/{locale}/**/meta.json` |

**翻訳しないでください**：`pages`スラッグ配列、`root`、`icon`、`defaultOpen`、またはその他の構造キー — 人間が読めるラベルのみを翻訳します。

<a id="ui-catalog"></a>
## UIカタログ

Fumadocs のレイアウトクローム (検索プレースホルダー、ロケール表示名、および `lib/layout.shared.ts` 内のその他の `defineTranslations` / `i18n.translations()` のオーバーライド) は markdown から抽出されません。**`translate-docs`** が `sourcePath` からソースロケールカタログをブートストラップし、ロケールごとの JSON を翻訳するように **`docsOutput.fumadocsUiCatalog`** を設定します:

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["content/docs"],
      "outputDir": "content/docs",
      "docsOutput": {
        "style": "fumadocs",
        "docsRoot": "content/docs",
        "fumadocsParser": "dot",
        "fumadocsUiCatalog": {
          "sourcePath": "lib/layout.shared.ts",
          "catalogPath": "lib/i18n/ui.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — 英語のフラットな JSON。ブートストラップは `sourcePath` 内の `.add({ … })` の `en` オブジェクトのみを読み取ります。そのオブジェクト内の文字列リテラルはカタログキー (`displayName`、`Search(search trigger)`) になります。`.add()` は Fumadocs UI プリセットが登録したキーのみを受け入れるため、`site.title` のようなナビゲーションタイトルはそこには配置できません。この例では、`site.title` を JSON 内に保持し、`nav.title` のために `catalog["site.title"]` を読み取ります。ファイルに既に存在するが `en` オブジェクトにはないキーは残ります。マージは `{ ...existing, ...extracted }` です。英語のリテラルが変更された場合は `sync` を再実行してください。
- **`outputPathTemplate`** (任意) — ロケールごとの出力。デフォルト: `catalogPath` の隣に `ui.{locale}.json`。

翻訳されたキーは、アプリがそれを読み取るまで何もしません。`i18n.translations().get(lang)` は `.extend()` (Fumadocs UI プリセット) に登録されたキーのみを返します。それらのキーが適用されるように、ロケールカタログを `.add()` にスプレッドし、英語名の翻訳がそれを置き換えないように、スプレッドの **後** にネイティブの `displayName` を配置します:

```ts
"pt-BR": {
  ...loadUiCatalog("pt-BR"),
  displayName: "Português (Brasil)",
},
```

`site.title` は Fumadocs UI のキーではありません。この例では、`nav.title` のためにカタログからそれを読み取ります。`ui.pt-BR.json` にのみ存在する検索ラベルは、そのスプレッド (または別の読み取り) がそれを使用するまで、組み込みのプリセットのままになります。

[examples/fumadocs-docs/lib/layout.shared.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/fumadocs-docs/lib/layout.shared.ts) を参照してください。

標準ロケールは、LLM のコストなしで `@fumadocs/language/*` プリセットでカバーできます。カタログは、英語ブロックの **プロジェクトのオーバーライド**のみを翻訳します。

<a id="agent-prompt"></a>
## エージェントプロンプト

英語のみの Fumadocs サイトにロケールを追加する場合にこれをコピーしてください。これはルーティングと UI カタログを接続しますが、文字列は翻訳しません。

<details class="agent-prompt">
<summary>UI カタログプロンプト</summary>

````markdown
# Enable Fumadocs i18n and the UI catalog

## Context

ai-i18n-tools translates Fumadocs MDX, `meta.json` titles, and the English block
of `i18n.translations().add({ en: { … } })` via `translate-docs` and
`docsOutput.fumadocsUiCatalog`. The literal in that `en` object is the source
string. Locale JSON takes effect only for keys the app reads: either a catalog
spread into `.add()` for registered UI keys, or a direct read such as
`catalog["site.title"]` for the nav title. Do not translate any string.

Reference:
https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs

## Scope

Edit `lib/i18n.ts`, `lib/layout.shared.ts`, `proxy.ts`, `app/[lang]/` routes,
and `ai-i18n-tools.config.json`. Skip URLs, slugs, and native language names
(`displayName` on each locale entry).

## Call shape

- `defineI18n({ languages, defaultLanguage, parser })`. Use `"dot"` unless the
  project already keeps English under a locale folder (`"dir"`).
- `export default createI18nMiddleware(i18n)` from `proxy.ts`.
- Move pages under `app/[lang]/…` and pass `lang` into `baseOptions` and
  `i18nProvider(translations, lang)`.
- In `lib/layout.shared.ts`, keep English UI overrides as string literals inside
  `.add({ en: { … } })`. For each other locale, spread `loadUiCatalog(locale)`
  and then set `displayName` to the native name.
- Config: `features.translateDocs`, `docsOutput.style: "fumadocs"`,
  `fumadocsParser` matching `defineI18n`, and `fumadocsUiCatalog.sourcePath`
  pointing at `lib/layout.shared.ts`. `targetLocales` must equal `languages`
  except the default language, character for character.

## Order

1. Routing and `defineI18n`.
2. English literals in the `en` block, and the catalog spread for other locales.
3. Ask the user to run `sync`. Do not hand-write `ui.<locale>.json` or
   translated MDX.

## Do not

- Do not translate, rename, or reword the English literals.
- Do not put native language names only in the `en` block (they would be
  extracted and translated).
- Do not hand-edit locale JSON, `meta.<locale>.json`, or locale MDX.
- Do not use `json[]` for this catalog.

## Verify

- `pnpm build` passes.
- The default locale still shows the English overrides.
- After `sync`, one other locale shows the translated search trigger and nav
  title, and `displayName` in the language menu is still the native name.

## Report back

List files changed, each key you added to the `en` block, each key you left
unread (and so unused) with a one-line reason, and whether the parser is `dot`
or `dir`.
````

</details>

Fumadocs UI 文字列には `json[]` を**使用しないでください**。このパイプラインは、関連性のないアプリのロケールバンドル用です。

<a id="link-conventions"></a>
## リンクの表記規則

Fumadocsは、Next.jsミドルウェア（`/docs/getting-started`、`/pt/docs/getting-started`）を介してロケールプレフィックス付きルートを提供します。**ページ内リンクはロケールニュートラルであるべきです**（`/docs/getting-started`）。そうすることで、アクティブなロケールプレフィックスが自動的に適用されます。

組み込みのノーマライザーを有効にすると、`translate-docs`がすべての翻訳ファイルのリンクを自動的に修正します:

```json
"docsOutput": {
  "style": "fumadocs",
  "docsRoot": "content/docs",
  "rewriteFumadocsLinks": true
}
```

`rewriteFumadocsLinks`は、`style`が`"fumadocs"`の場合にデフォルトで有効になります。

| ソースロケールでのオーサリング | ノーマライザー適用後 |
|---|---|
| `[Guide](content/docs/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Home](content/docs/index.mdx)` | `[Home](/docs)` |
| `[Guide](/ja/guide/getting-started.mdx)` | `[Guide](/docs/guide/getting-started)` |
| `[Demo](https://github.com/org/repo)` | 変更なし (完全な URL) |

**執筆ルール**

- ページ間のドキュメントリンク: 英語のMDXでは**ロケールニュートラルなサイトルート**（`/docs/…`）を使用するか、`content/docs/…` / 相対`.mdx`パスを使用して、`sync`中に正規化ツールで書き換えさせます。
- コンテンツツリー外のリポジトリファイル: **完全なURL**を使用します。
- ロケールサフィックス付きコピー（`*.pt.mdx`）や`content/{locale}/`ツリー内のリンクを手動で編集**しないでください**。`sync` / `translate-docs`で再生成してください。

こちらも参照してください: [Documents — link rewriting](/ja/guide/documents/link-rewriting) および [Configuration — `docsOutput`](/ja/reference/configuration#docsoutput)。

<a id="locale-codes"></a>
## ロケールコード

Fumadocs アプリの `ai-i18n-tools.config.json` の `targetLocales` を、`defineI18n().languages` と**完全に**一致させてください。ドットの例では短いコード (`pt`、`zh`) を使用していますが、ディレクトリ設定では BCP-47 フォルダー (`pt-BR`、`zh-Hans`) を使用できます。強制的な正規化はありません。コードが一致しないと、誤った出力パスやページが見つからない原因となります。

<a id="multiple-collections"></a>
## 複数のコレクション

Fumadocs プロジェクトでは、`source.config.ts` に複数の `defineDocs` ブロック (docs、blog、examples) を定義できます。翻訳するコレクションごとに 1 つの `docs[]` ブロックを追加し、それぞれに独自の `contentPaths`、`outputDir`、および `docsRoot` を設定します。

<a id="example-project"></a>
## サンプルプロジェクト

[examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/) — `content/docs/` の英語 MDX、コミットされた `pt` と `zh` のドットサフィックスページ、`meta.json`、および `lib/i18n/ui.{locale}.json`。ポート **3080** で `pnpm run dev` を実行します。

<a id="cross-references"></a>
## 相互参照

- [設定 — `docsOutput`](/ja/reference/configuration#docsoutput)
- [出力レイアウト](/ja/guide/documents/output-layouts)
- [Docusaurus integration](/ja/guide/integrations/docusaurus)
- [Nextra integration](/ja/guide/integrations/nextra) (ディレクトリパーサーのメンタルモデル)
- [VitePress integration](/ja/guide/integrations/vitepress) (UIカタログのブートストラップパターン)
