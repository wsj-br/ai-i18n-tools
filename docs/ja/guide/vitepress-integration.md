<a id="vitepress-integration"></a>
# VitePress の統合

`init -t ui-vitepress`と`docsOutput.style: "vitepress"`を[VitePress](https://vitepress.dev/)ドキュメントサイトに使用します。このプリセットは、空の`localeSubpath`とBCP-47ロケールフォルダー名が保持された`doc-system`のエイリアスです（`localePathLowercase`はデフォルトで`false`になるため、フォルダーは`pt-BR`、`zh-Hans`などのままです）。

「[ドキュメント](/guide/documents/)」と実行可能な「[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/)」デモも参照してください。このリポジトリの`docs/`配下にある独自のドキュメントサイトは、VitePress + ai-i18n-toolsの完全なリファレンスです（9つのロケール、テーマカタログ、GitHub Pages）。

<a id="quick-start"></a>
## クイックスタート

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

ページコンテンツとVitePressのクローム文字列を1回の`sync`実行で翻訳する場合は、`features.translateDocs`を有効にします。

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

VitePressのナビゲーション、サイドバー、フッター、検索プレースホルダー、その他の`themeConfig`ラベルはMarkdownから抽出されません。**`docsOutput.vitepressThemeCatalog`** を設定して、**`translate-docs`** が`.vitepress/config.mts`から英語カタログをブートストラップし（文字列がインラインの場合）、ロケールテーマのJSONファイルを翻訳するようにします。

```json
{
  "features": {
    "translateDocs": true
  },
  "docs": [
    {
      "contentPaths": ["docs/index.md", "docs/guide"],
      "outputDir": "docs",
      "docsOutput": {
        "style": "vitepress",
        "docsRoot": "docs",
        "vitepressThemeCatalog": {
          "configPath": "docs/.vitepress/config.mts",
          "catalogPath": "docs/.vitepress/i18n/theme.en.json"
        }
      }
    }
  ]
}
```

- **`catalogPath`** — 生成された英語のネストされたJSON（ブートストラップ出力）。英語が`config.mts`にある場合、作成者はこのファイルを手動で保守しません。更新するには`sync`を再実行します。
- **`outputPathTemplate`**（オプション） — ロケールごとの出力。デフォルト：`catalogPath`と同じディレクトリに`theme.{locale}.json`。

`.vitepress/config.mts`で`loadTheme()`を介してロケールごとのファイルをロードし、翻訳されたJSONから`locales[code].themeConfig`をビルドします。[examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)を参照してください。

**VitePressのテーマ文字列には`json[]`を使用**しないでください。このパターンは、関連性のないアプリのロケールバンドルのみを対象としています。

<a id="wire-config-mts-to-generated-theme-json"></a>
## config.mtsを生成されたテーマJSONに接続する（一度限り）

`vitepressThemeCatalog`を使用した最初の`i18n:sync` / `translate-docs`の実行が成功した後、リポジトリは`theme.en.json`と`theme.{locale}.json`を生成しますが、**既存の**サイトには、`config.mts`にハードコードされた`text:` / `message:`文字列がまだ残っている可能性があります。VitePressは、`loadTheme()`を介して設定がロードされるまで、翻訳されたJSONを使用しません。

**ツールの範囲外:** 自動コードモッド。プロジェクトごとに一度（または例の設定を使用して手動でリファクタリング）以下のプロンプトを使用してください。

1. **時期** — 最初の同期で`catalogPath`とロケールテーマファイルが生成された後。開発/ビルドで翻訳されたナビゲーション/サイドバーを期待する前。
2. **変更しないもの** — ルートリンク（`/guide/…`）、ロケールキー、`defineConfig`構造、文字列以外のオプション（検索プロバイダー、折りたたみフラグ）。
3. **参照** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts)と生成された`theme.en.json`の形式。
4. **確認** — `pnpm docs:dev`、ナビゲーションでロケールを切り替え、サイドバー/フッター/検索プレースホルダーが翻訳されていることを確認。`pnpm docs:build`がパスすること。

**AIエージェントのプロンプト例**（Cursorまたは別のコーディングエージェントにコピー）：

```markdown
Refactor our VitePress config to load theme strings from generated JSON files instead of hardcoded literals.

Context:
- ai-i18n-tools already generated English and locale theme catalogs via `docsOutput.vitepressThemeCatalog`.
- English catalog: `docs/.vitepress/i18n/theme.en.json`
- Locale catalogs: `docs/.vitepress/i18n/theme.{locale}.json` (e.g. pt-BR, zh-Hans)
- Target file: `docs/.vitepress/config.mts` (or our project's equivalent path)
- Reference pattern: https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/docs/.vitepress/config.mts

Requirements:
1. Add `loadTheme(localeFile: string)` that reads JSON from `docs/.vitepress/i18n/` (use `import.meta.url` / `fileURLToPath` for ESM paths).
2. Add `themeConfigFor(t)` that builds VitePress `themeConfig` from the catalog — keep all **links and structure** in TypeScript; only **display strings** come from JSON keys matching `theme.en.json`.
3. Wire `locales.root` and each target locale in `locales[code]` to `loadTheme('theme.en.json')` or `loadTheme('theme.{code}.json')`, then `themeConfig: themeConfigFor(theme)`.
4. Align locale codes with `ai-i18n-tools.config.json` `targetLocales` and existing VitePress `locales` keys.
5. Do **not** change markdown content paths, `base`, or link targets — only move translatable labels out of inline string literals.
6. Preserve any project-specific options (ignoreDeadLinks, head config, etc.).

After editing:
- Run `pnpm docs:dev` (or our docs dev script) and confirm English + at least one translated locale show correct nav/sidebar/footer/search placeholder.
- If a string exists in config but not in `theme.en.json`, add a matching key to the JSON shape in `themeConfigFor` and note that the user should re-run `i18n:sync` to refresh catalogs from config if needed.

Do not introduce a hand-maintained duplicate of theme strings — config must read from the generated JSON files only.
```

<a id="framework-shell-translation"></a>
## フレームワークシェルの翻訳

| フレームワーク | シェル/テーマ文字列 | パイプライン |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`カタログ（`{ message, description }`） | ドキュメント — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | テーマ/ナビゲーション/サイドバーカタログ | ドキュメント — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts` サイドバーラベル | ドキュメント — `style: "nextra"` + `translate-docs` の場合に自動 |
| Nextra | テーマ辞書 `.ts` | ドキュメント — `docs[].nextraDictionaryPath` + `translate-docs` |
| Astro Starlight | 組み込みのUI文字列（多くのロケール）。追加のシェルパイプラインなし | ドキュメント — `translate-docs`（ページのみ） |

**不要**将框架 shell/主题字符串放在 `json[]` 中 —— 该管道用于无关的应用程序本地化包。请参阅 [Docusaurus 集成](/guide/docusaurus-integration) 和 [Nextra 集成](/guide/nextra-integration) 以了解其他框架模式。

<a id="example-project"></a>
## サンプルプロジェクト

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — 英語ソースは `docs/` にあり、`pt-BR` と `zh-Hans` のページツリー、さらに `theme.pt-BR.json` / `theme.zh-Hans.json` がコミットされています。ポート 3060 で `pnpm run docs:dev` を実行します。

<a id="readme-as-the-docs-homepage"></a>
## READMEをドキュメントのホームページとして使用

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
