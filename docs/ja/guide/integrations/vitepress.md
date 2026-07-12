<a id="vitepress-integration"></a>
# VitePress 統合

[VitePress](https://vitepress.dev/) ドキュメントサイトには `init -t ui-vitepress` と `docsOutput.style: "vitepress"` を使用してください。このプリセットは `doc-system` のエイリアスであり、`localeSubpath` が空で、BCP-47 のロケールフォルダー名が保持されます（`localePathLowercase` のデフォルトは `false` なので、フォルダーは `pt-BR`、`zh-Hans` などのまま維持されます）。

[ドキュメント](/ja/guide/documents/) および実行可能な [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) デモも参照してください。`docs/` 配下にあるこのリポジトリ自身のドキュメントサイトは、VitePress + ai-i18n-tools の完全なリファレンスです（9つのロケール、テーマカタログ、GitHub Pages）。

<a id="quick-start"></a>
## クイックスタート

```bash
ai-i18n-tools init -t ui-vitepress [-P <provider>]
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

ページコンテンツと VitePress の UI 文字列を1回の `sync` 実行で翻訳する場合、`features.translateDocs` を有効にしてください。

<a id="page-layout"></a>
## ページレイアウト

英語のマークダウンは VitePress のコンテンツルート（通常は `docs/`）に配置されます。翻訳コピーはソースツリーの隣に書き込まれます：

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

`docs[]` ブロックを1つ設定します：

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

`contentPaths` を英語の `.md` ファイルおよびディレクトリに向けます。`docsRoot` を VitePress がコンテンツルートとして使用するフォルダーと同じに設定してください。

VitePress の[国際化](https://vitepress.dev/guide/i18n)を設定します：英語は `root` に、各ターゲットロケールは `locales[code].link` 配下に配置します（例：`/pt-BR/`）。`targetLocales` の `ai-i18n-tools.config.json` を `.vitepress/config.mts` の `locales` キーと一致させてください。

<a id="theme-strings"></a>
## テーマ文字列

VitePress のナビゲーション、サイドバー、フッター、検索プレースホルダー、その他の `themeConfig` ラベルはマークダウンから抽出されません。**`docsOutput.vitepressThemeCatalog`** を設定して、**`translate-docs`** が `.vitepress/config.mts` から英語カタログをブートストラップし（文字列がインラインの場合）、ロケールごとのテーマ JSON ファイルを翻訳するようにします：

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

- **`catalogPath`** — 生成された英語のネストされた JSON（ブートストラップ出力）。英語が `config.mts` にある場合、作成者はこのファイルを手動で管理しません。更新するには `sync` を再実行してください。
- **`outputPathTemplate`**（任意）— ロケールごとの出力。デフォルト：`catalogPath` と同じディレクトリに `theme.{locale}.json` として配置されます。

`init -t ui-vitepress` はまた、それらのファイルがまだ存在しない場合、スターターの `docs/.vitepress/config.mts` と `docs/.vitepress/i18n/theme.en.json` をスキャフォールディングします。設定は `loadTheme()` 経由でカタログを読み込み、`themeConfigFor()` で標準的な VitePress の i18n ラベル（`langMenuLabel` を含む）を接続します。

`.vitepress/config.mts` で `loadTheme()` 経由のロケールごとのファイルを読み込み、翻訳された JSON から `locales[code].themeConfig` をビルドします。[examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) を参照してください。

**言語メニューの文字列：** `locales[code].label` はドロップダウンに表示される各言語の名前です（例：`Português (Brasil)`）。`themeConfig.langMenuLabel` は言語切替ボタンの **aria-label** です（VitePress のデフォルト：`Change language`）。`langMenuLabel` をテーマカタログに配置し、`themeConfigFor()` 内で `langMenuLabel: t.langMenuLabel` を接続してください — ロケールごとの `label` 文字列と混同しないでください。

`sync` / `translate-docs` の実行中、`theme.en.json` のカタログキーが `config.mts` から参照されていない場合（例：`themeConfigFor()` に `t.langMenuLabel` がない場合）、ai-i18n-tools は警告を出します。

VitePress のテーマ文字列に `json[]` を使用**しない**でください — そのパターンは無関係なアプリのロケールバンドル専用です。

<a id="wire-configmts-to-generated-theme-json-one-off"></a>
## config.mts を生成されたテーマ JSON に接続する（一回限り）

`vitepressThemeCatalog` を指定した最初の `i18n:sync` / `translate-docs` 実行が成功した後、リポジトリには `theme.en.json` と `theme.{locale}.json` が生成されていますが、**既存の**サイトにはまだ `config.mts` にハードコードされた `text:` / `message:` 文字列が残っている可能性があります。設定が `loadTheme()` 経由でそれを読み込むまで、VitePress は翻訳された JSON を使用しません。

**ツールのスコープ外:** 自動コードモッド。以下のプロンプトをプロジェクトごとに1回使用する（またはサンプル設定を使って手動でリファクタリングする）。

1. **タイミング** — 初回同期で `catalogPath` とロケールテーマファイルが生成された後、開発/ビルドで翻訳されたナビ/サイドバーを期待する前。
2. **変更しないもの** — ルートリンク (`/guide/…`)、ロケールキー、`defineConfig` の構造、非文字列オプション（検索プロバイダー、折りたたみフラグ）。
3. **参考** — [examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) および生成された `theme.en.json` の構造。
4. **検証** — `pnpm docs:dev`、ナビでロケールを切り替え、サイドバー/フッター/検索プレースホルダーが翻訳されることを確認、`pnpm docs:build` がパスすること。

**AIエージェントプロンプトの例** （Cursor または他のコーディングエージェントにコピー）:

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

<a id="example-project"></a>
## サンプルプロジェクト

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) — `docs/` に英語ソース、コミットされた `pt-BR` と `zh-Hans` のページツリー、および `theme.pt-BR.json` / `theme.zh-Hans.json`。ポート 3060 で `pnpm run docs:dev` を実行。

<a id="readme-and-the-docs-homepage"></a>
## READMEとドキュメントのホームページ

下流のプロジェクトでは、`README.md` をビルドスクリプトまたは手動同期で VitePress サイトの `docs/index.md` としてコピーすることがあります。このパターンは GitHub とドキュメントサイトで1つのファイルを共有しますが、リンクのルールが異なります:

| リンクタイプ | GitHub で機能 | VitePress で機能 |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | はい | いいえ — サイトルートを使用するか、同期中にノーマライザーに書き換えさせる |
| `./LICENSE`, `examples/demo/` | はい（リポジトリ相対） | いいえ — **完全なURL** を使用 |
| `/guide/foo` | いいえ | はい |

**同期された README → index の推奨事項:** `README.md` では、VitePress コンテンツツリー外のもの (`LICENSE`, `examples/`, 設定ファイル、エージェントコンテキストファイル) および `translated-docs/` 配下の翻訳された README コピーには **完全なURL** を使用してください。サイト内ドキュメントリンクには `docs/guide/…` パス（または `docs/` 配下の英語ドキュメントのサイトルート）を使用してください。同期スクリプトまたは `rewriteVitepressLinks` ノーマライザーがそれらを `/guide/…` ルートに変換できます。

**このリポジトリでは**、`README.md`と`docs/index.md`を**独立したファイル**として保持しています。READMEはnpm/GitHub向けの完全なランディングページであり、`docs/index.md`は`/guide/`や`/reference/`へリンクする簡潔なドキュメントサイトのエントリポイントです。共通の事実が変更された場合は、それぞれの対象読者に合わせて更新してください。

別のプロジェクトで同期されたREADMEのリンク例:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/ja/guide/quick-start)
```

<a id="link-conventions"></a>
## リンクの表記規則

VitePressはコンテンツルートから英語ページを提供し、ロケールコピーは`docs/<locale>/…`から提供しますが、**ページ内のリンクはサイトルートを使用する必要があります** (`/guide/quick-start`, `/reference/configuration`) — `docs/guide/quick-start.md`や`../guide/quick-start.md`のようなリポジトリ相対パスは使用しません。これらのREADMEスタイルのパスはGitHubでは機能しますが、VitePress内では壊れます（開発環境およびGitHub Pagesで404になります）。

組み込みのノーマライザーを有効にすると、`translate-docs`がすべての翻訳ファイルのリンクを自動的に修正します:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`style`が`"vitepress"`の場合、`rewriteVitepressLinks`はデフォルトで有効になります。

| 英語ソースのAuthor | 正規化後（英語ルート出力） | 正規化後（翻訳済み`docs/<locale>/`出力） |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/ja/guide/json)` | `[JSON](/ja/guide/json)` | `[JSON](/pt-BR/guide/json)`（ロケールプレフィックスがフォルダと一致） |
| 本文または`hero.actions[].link`内の`[Quick start](/ja/guide/quick-start)` | 変更なし（`/guide/quick-start`） | `/pt-BR/guide/quick-start` |
| ロケールインデックス上の`[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | 変更なし | 変更なし (共有 `docs/public/` アセット) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 変更なし（完全なURL） | 変更なし（完全なURL） |

`docs/` 配下の英語のルートソースは、**ロケールニュートラルな**サイトルート (`/guide/…`) を維持します。`docs/<locale>/…` に書き込まれたファイルは、内部コンテンツルートで自動的にロケールプレフィックスを取得します — **ホームレイアウトのフロントマター** (`hero.actions[].link`, `features[].link`, `prev`/`next`) を含みます。`/ai-i18n-tools_logo.svg` や `/translation-dashboard.png` などの共有公開アセットは、すべてのロケールでプレフィックスなしのままとなります。

<a id="theme-navsidebar-links"></a>
### テーマのナビゲーション/サイドバーのリンク

`translate-docs`は`.vitepress/config.mts`内のリンクを書き換え**ません**。ナビゲーションバーとサイドバーの`link`値はTypeScriptで一度作成され、設定のビルド時にロケールごとにプレフィックスを付ける必要があります。

VitePress [`themeConfig.i18nRouting`](https://vitepress.dev/reference/default-theme-config#i18nrouting)は**ロケールスイッチャー**のみを制御します（ユーザーが別の言語を選択した際に、対応するページへマッピングします）。現在のロケールページ上の静的な`nav` / `sidebar`のhrefを書き換えることは**ありません**。

`ai-i18n-tools`から`prefixVitepressThemeConfigLinks`を使用します（Markdownのリンク書き換えと同じプレフィックスルール）：

```typescript
import { prefixVitepressThemeConfigLinks } from "ai-i18n-tools";

function themeConfigFor(t: ThemeCatalog, localeCode: string | null = null) {
  const localeRoutePrefix = localeCode ? `/${localeCode}` : null;
  return prefixVitepressThemeConfigLinks(
    {
      nav: [{ text: t.nav.guide, link: "/guide/getting-started", activeMatch: "/guide/" }],
      sidebar: [/* … locale-neutral /guide/… links … */],
      /* footer, search, etc. */
    },
    localeRoutePrefix
  );
}

// root English
themeConfig: themeConfigFor(enTheme)

// each target locale
themeConfig: themeConfigFor(theme, code)
```

**`link`** とともに **`activeMatch`** にプレフィックスを付けることで、ロケールルート上でナビゲーションのハイライトが機能するようにします（`/guide/`ではなく`/pt-BR/guide/`）。外部URLおよび共有の公開アセットはそのまま維持されます。

VitePressプロジェクトの**devDependency**として`ai-i18n-tools`を追加し（`examples/vitepress-docs/package.json`を参照）、`config.mts`が`prefixVitepressThemeConfigLinks`をインポートできるようにします。メインのai-i18n-toolsドキュメントサイトは、モノレポのチェックアウトをドッグフーディングしているため、`src/processors/…`から直接インポートします。スタンドアロンのコピー（degit）ではnpmパッケージを使用する必要があります。

**執筆ルール**

- ページ間のドキュメントリンク: `docs/`配下の英語Markdownでは**サイトルート** (`/guide/…`, `/reference/…`) を使用するか、別のプロジェクトの`docs/index.md`に同期されるREADMEを執筆する場合は`docs/guide/…`パスを使用します。
- 実行可能なデモ、`LICENSE`、その他のリポジトリファイル: `README.md`およびドキュメント内では**完全なGitHub URL**を使用します ([READMEとドキュメントのホームページ](#readme-as-the-docs-homepage) を参照)。
- `docs/<locale>/`内のリンクは手動で編集し**ない**でください — `sync` / `translate-docs`で再生成してください。

[リンクの書き換え](/ja/guide/images-and-screenshots/link-rewriting) (フラット vs VitePress) および [設定 — `docsOutput`](/ja/reference/configuration#docsoutput) も参照してください。
