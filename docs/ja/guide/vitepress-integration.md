<a id="vitepress-integration"></a>
# VitePress の統合

`init -t ui-vitepress`と`docsOutput.style: "vitepress"`を[VitePress](https://vitepress.dev/)ドキュメントサイトに使用します。このプリセットは、空の`localeSubpath`とBCP-47ロケールフォルダー名が保持された`doc-system`のエイリアスです（`localePathLowercase`はデフォルトで`false`になるため、フォルダーは`pt-BR`、`zh-Hans`などのままです）。

以下も参照してください: [ドキュメント](/guide/documents/)、[JSON](/guide/json) (テーマ文字列)、および実行可能な [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) デモ。このリポジトリの `docs/` 以下のドキュメントサイトは、VitePress + ai-i18n-tools の完全なリファレンスです (9つのロケール、テーマJSON、GitHub Pages)。

<a id="quick-start"></a>
## クイックスタート

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

1回の`sync`実行でページコンテンツとVitePressクローム文字列を翻訳する場合は、`features.translateDocs`と`features.translateJson`の両方を有効にします。

<a id="page-layout"></a>
## ページレイアウト

英語のマークダウンはVitePressコンテンツルート（通常は`docs/`）にあります。翻訳されたコピーはソースツリーの横に書き込まれます。

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

1つの`docs[]`ブロックを設定します。

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

`contentPaths`を英語の`.md`ファイルとディレクトリに向けます。`docsRoot`をVitePressがコンテンツルートとして使用するのと同じフォルダーに設定します。

VitePressの[国際化](https://vitepress.dev/guide/i18n)を接続します。英語は`root`に、各ターゲットロケールは`locales[code].link`の下に配置します（例: `/pt-BR/`）。`ai-i18n-tools.config.json`の`targetLocales`を`.vitepress/config.mts`の`locales`キーと一致させます。

<a id="theme-strings"></a>
## テーマ文字列

VitePress のナビゲーション、サイドバー、フッター、検索プレースホルダー、およびその他の `themeConfig` ラベルは、Markdown から抽出されません。ネストされた JSON カタログ (例: `docs/.vitepress/i18n/theme.en.json`) を作成し、JSON で翻訳します。

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

`.vitepress/config.mts`でロケールごとのファイルをロードし、翻訳されたJSON（ナビゲーションテキスト、サイドバーグループタイトル、フッターメッセージなど）から`locales[code].themeConfig`を構築します。`config.mts`に翻訳されたラベルをハードコードしないでください。英語が変更されたら、`sync` / `translate-json`で再生成してください。

このパッケージは [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts) で `theme.{locale}.json` をロードします。最小限の2ロケール設定については、[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) と比較してください。

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs VitePress シェルJSON

| フレームワーク | シェル/テーマ文字列 | パイプライン |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`カタログ（`{ message, description }`） | ドキュメント — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | カスタムのネストされたJSONカタログ | JSON — `json[]` + `translate-json`（または`sync`が有効な場合`translateJson`） |

VitePressテーマJSONを`docs[]`に配置しないでください。代わりに`json[]`を使用してください。

<a id="example-project"></a>
## サンプルプロジェクト

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英語ソースは `docs/` にあり、`pt-BR` と `zh-Hans` のページツリー、さらに `theme.pt-BR.json` / `theme.zh-Hans.json` がコミットされています。ポート 3060 で `pnpm run docs:dev` を実行します。

<a id="readme-as-homepage"></a>
## README をドキュメントのホームページとして使用する

一部のプロジェクトでは、`README.md` を `docs/index.md` として VitePress サイトにコピーします (このリポジトリでは `docs:build` の前に `scripts/sync-readme-to-docs.mjs` を使用しています)。このパターンでは、GitHub とドキュメントサイトで1つのファイルを共有しますが、リンクのルールが異なります。

| リンクの種類 | GitHub で動作 | VitePress で動作 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | はい | いいえ — サイトルートを使用するか、同期中にノーマライザーに書き換えさせる |
| `./LICENSE`、`examples/demo/` | はい (リポジトリ相対) | いいえ — **完全な URL** を使用してください |
| `/guide/foo` | いいえ | はい |

**推奨事項:** `README.md` では、VitePress コンテンツツリーの外部にあるもの (`LICENSE`、`examples/`、設定ファイル、エージェントコンテキストファイル) や、`translated-docs/` 以下の翻訳された README コピーには **完全な URL** を使用してください。サイト内のドキュメントリンクには `docs/guide/…` パス (または `docs/` 以下の英語ドキュメントのサイトルート) を使用してください。同期スクリプトと `rewriteVitepressLinks` ノーマライザーは、それらを `/guide/…` ルートに変換します。

例:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## リンクの慣例

VitePress はコンテンツルートから英語ページを、`docs/<locale>/…` からロケールコピーを提供しますが、**ページ内リンクはサイトルートを使用する必要があります** (`/guide/quick-start`、`/reference/configuration`) — `docs/guide/quick-start.md` や `../guide/quick-start.md` のようなリポジトリ相対パスではありません。これらの README スタイルのパスは GitHub では機能しますが、VitePress 内では機能しません (開発環境および GitHub Pages で 404 エラー)。

組み込みのノーマライザーを有効にすると、`translate-docs` がすべての翻訳ファイル内のリンクを自動的に修正します。

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` は、`style` が `"vitepress"` の場合にデフォルトで有効になります。

| 英語ソースでの記述 | ノーマライザー適用後 |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| ロケールインデックス上の `[Home](./README.md)` | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 変更なし (完全な URL) |

**作成ルール**

- ページ間のドキュメントリンク: `docs/` 以下の英語のマークダウンでは **サイトルート** (`/guide/…`、`/reference/…`) を使用するか、`README.md` から同期する場合は `docs/guide/…` パスを使用します。
- 実行可能なデモ、`LICENSE`、その他のリポジトリファイル: `README.md` およびドキュメントでは **完全な GitHub URL** を使用します ([README をドキュメントのホームページとして使用する](#readme-as-homepage) を参照)。
- `docs/<locale>/` のリンクを手動で編集**しないでください** — `sync` / `translate-docs` で再生成してください。

参照: [リンクの書き換え](/guide/images-and-screenshots/link-rewriting) (フラット vs VitePress) および [設定 — `docsOutput`](/reference/configuration#docsoutput)。
