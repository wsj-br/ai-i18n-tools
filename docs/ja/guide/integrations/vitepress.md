<a id="vitepress-integration"></a>
# VitePress 統合

[VitePress](https://vitepress.dev/) ドキュメントサイトには `init -t ui-vitepress` と `docsOutput.style: "vitepress"` を使用してください。このプリセットは `doc-system` のエイリアスであり、`localeSubpath` が空で、BCP-47 のロケールフォルダー名が保持されます（`localePathLowercase` のデフォルトは `false` なので、フォルダーは `pt-BR`、`zh-Hans` などのまま維持されます）。

[ドキュメント](/ja/guide/documents/) および実行可能な [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) デモも参照してください。`docs/` 配下にあるこのリポジトリ自身のドキュメントサイトは、VitePress + ai-i18n-tools の完全なリファレンスです（9つのロケール、テーマカタログ、GitHub Pages）。

<a id="quick-start"></a>
## クイックスタート

```bash
ai-i18n-tools init -t ui-vitepress -P anthropic
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

`contentPaths`で、`sourceLocale`で書かれた`.md`のファイルとディレクトリを指定します。その言語はどの言語でもかまいません。`docsRoot`を、VitePressがコンテンツルートとして使用するフォルダーと同じフォルダーに設定します。

VitePressの[国際化](https://vitepress.dev/guide/i18n)を設定します。ソースロケールは`root`に、各ターゲットロケールは`locales[code].link`の下に配置します（例：`/pt-BR/`）。`ai-i18n-tools.config.json`内の`targetLocales`は、`.vitepress/config.mts`内の`locales`キーと一致させてください。

<a id="enable-i18n-in-an-existing-site"></a>
### 既存のサイトで i18n を有効にする

英語のみのVitePress設定では、翻訳されたページが表示される前にこれらの要素が必要です。[エージェントプロンプト](#wire-configmts-to-generated-theme-json-one-off)では、テーマカタログに関する部分を扱います。

- 英語用の`locales.root`（`label`、`lang`、`themeConfig`）。
- ターゲットロケールごとに1つの`locales[code]`エントリ：`label`、`lang`、`link: '/${code}/'`、およびロケールごとの`title` / `description`。
- `themeConfig`リンクと`activeMatch`は、ロケールごとに`prefixVitepressThemeConfigLinks`でプレフィックスが付けられます（[テーマのナビゲーション/サイドバーのリンク](#theme-navsidebar-links)を参照）。
- `targetLocales`をそれらの`locales`キーと一致させ、次に`sync`を実行して`docs/<locale>/`と`theme.<locale>.json`が存在するようにします。

<a id="theme-strings"></a>
## テーマ文字列

VitePressのナビゲーション、サイドバー、フッター、検索プレースホルダー、およびその他の`themeConfig`ラベルは、markdownからは抽出されません。**`docsOutput.vitepressThemeCatalog`** を設定して、**`translate-docs`** がソースロケールのカタログを`.vitepress/config.mts`からブートストラップし（文字列がインラインの場合）、ロケールのテーマJSONファイルを翻訳するようにします。

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

- **`catalogPath`** — 英語のネストされたJSON。`config.mts`からのブートストラップは、それらの英語の文字列が設定ファイル内にまだインラインで記述されている間のみ適用されます。`themeConfigFor`がカタログを読み取った後、`mergeThemeCatalogs`は既存のファイルを保持し、`theme.en.json`が信頼できる情報源（source of truth）となります。文言が変更された場合は、そのファイルを編集します（または、1回の`sync`のために英語を`config.mts`に戻します）。キーの名前を変更するとセグメントハッシュ（`path`、NULバイト、その後に値）が変更されるため、次回の`sync`では、その文字列がターゲットロケールごとに1回再翻訳されます。
- **`outputPathTemplate`**（オプション） — ロケールごとの出力。デフォルト：`catalogPath`と同じディレクトリに`theme.{locale}.json`という名前で出力されます。

`init -t ui-vitepress` はまた、それらのファイルがまだ存在しない場合、スターターの `docs/.vitepress/config.mts` と `docs/.vitepress/i18n/theme.en.json` をスキャフォールディングします。設定は `loadTheme()` 経由でカタログを読み込み、`themeConfigFor()` で標準的な VitePress の i18n ラベル（`langMenuLabel` を含む）を接続します。

`.vitepress/config.mts` で `loadTheme()` 経由のロケールごとのファイルを読み込み、翻訳された JSON から `locales[code].themeConfig` をビルドします。[examples/vitepress-docs/docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts) を参照してください。

**言語メニューの文字列：** `locales[code].label`は、ドロップダウンに表示される各言語の名前です（例：`Português (Brasil)`）。`themeConfig.langMenuLabel`は、言語切り替えボタンの**aria-label**です。オプションが省略された場合、VitePressは`Change language`を使用します。サンプルカタログでは、代わりに`Language`を保存し、`theme.en.json`と`config.hardcoded.example.mts`の両方で同じ文を使用します。`langMenuLabel`をテーマカタログに配置し、`themeConfigFor()`内で`langMenuLabel: t.langMenuLabel`を設定します。ロケールごとの`label`文字列と混同しないでください。

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

<details class="agent-prompt">
<summary>テーマカタログのプロンプト</summary>

````markdown
# Load VitePress theme strings from the catalog

## Context

ai-i18n-tools translates VitePress chrome through
`docsOutput.vitepressThemeCatalog`. `extractVitepressThemeCatalog` writes
positional keys while English is still inline in `config.mts`
(`themeConfig.nav.0.text`, `themeConfig.sidebar.0.items.0.text`,
`locales.root.label`). The runnable example uses stable names instead
(`nav.guide`, `sidebar.gettingStarted`, `site.title`):
https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/docs/.vitepress/config.mts

Reshape to named keys once and keep those names. Renaming changes the segment
hash, so the next `sync` re-translates the theme catalog for every locale (a few
dozen short strings, once). After the refactor, `config.mts` has no inline
display literals, `mergeThemeCatalogs` keeps `theme.en.json`, and that file is
the source of truth. Do not tell the user to refresh the catalog from
`config.mts` after this edit.

`translate-docs` does not rewrite links in `config.mts`. Locale pages must
prefix `link` and `activeMatch` or they point at English routes.

## Scope

Edit `.vitepress/config.mts` and `theme.en.json` only. Skip markdown bodies,
route paths, `base`, search provider choice, collapsed flags, and external URLs.

## Call shape

Precondition: `docsOutput.vitepressThemeCatalog` is set and `sync` has already
written `catalogPath`. If `theme.en.json` is missing, stop and ask for that
`sync` first.

1. Add `ai-i18n-tools` as a devDependency. Import
   `prefixVitepressThemeConfigLinks` from `ai-i18n-tools`.
2. Add `loadTheme(localeFile)` that reads `docs/.vitepress/i18n/` via
   `import.meta.url` and `fileURLToPath`. If a locale file is missing
   (`fs.existsSync`), fall back to the English theme so a fresh checkout does
   not crash before the first translation.
3. Rename positional keys in `theme.en.json` to short stable names. Update
   `themeConfigFor` to read those names. Keep links and structure in TypeScript.
   Only display strings come from the catalog.
4. If you keep positional keys instead, read them with string indexes:
   `t.themeConfig.nav["0"].text`. A numeric index `nav[0]` is invisible to the
   unused-key check and warns for every nav and sidebar entry.
5. Wrap the object `themeConfigFor` returns with
   `prefixVitepressThemeConfigLinks(themeConfig, localeRoutePrefix)`. Pass
   `/${code}` for each target locale and `null` for root. That prefixes `link`
   and `activeMatch`.
6. Per locale entry: `label` (native language name), `lang`,
   `link: '/${code}/'`, and that locale's `title` and `description` from the
   catalog.
7. Keys the extractor does not collect must be added to `theme.en.json` by hand,
   then referenced from `themeConfigFor`. That includes local-search copy under
   `search.options.locales.<code>.translations` (`button.buttonText`,
   `modal.noResultsText`, and the rest of that tree). Current VitePress docs do
   not use `options.placeholder` for local search. Also add
   `socialLinks[].ariaLabel`. A `notFound.title` inline in config is collected
   because `title` is a known key; `notFound.quote`, `notFound.linkText`,
   `notFound.linkLabel`, and `notFound.code` are not.

## Order

1. Confirm the catalog file exists.
2. Reshape keys, wire `loadTheme` and `themeConfigFor`, prefix links.
3. Ask the user to run `sync` so locale theme files are regenerated from the new
   key names. Do not hand-translate them.

## Do not

- Do not translate strings yourself.
- Do not leave a second copy of the same label in `config.mts` and in
  `theme.en.json`.
- Do not hand-edit `theme.<locale>.json`.
- Do not change markdown paths, `base`, or the path of internal links (only the
  locale prefix).

## Verify

- `pnpm docs:dev`: English and one target locale show translated nav, sidebar,
  footer, and search chrome.
- A locale page's nav `link` and `activeMatch` include the locale prefix
  (`/pt-BR/guide/`, not `/guide/`).
- `pnpm docs:build` passes.
- Removing a locale theme file still builds, because `loadTheme` falls back to
  English.

## Report back

List files changed, the old path key and the new name for each rename, any
string you added by hand because the extractor skips it, and anything you left
inline on purpose.
````

</details>

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

**このリポジトリ**は`README.md`と`docs/index.md`を**独立したファイル**として保持します。READMEは簡潔なGitHub/npmランディングページであり、`docs/index.md`は`/guide/`および`/reference/`へリンクするドキュメントサイトのエントリポイントです。詳細なガイドは`docs/`以下にあります。READMEに長いリファレンス資料を重複させないでください。共通の事実が変更された場合は、それぞれの対象読者に合わせて更新してください。

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

| ソースロケールでのオーサリング | ノーマライザー適用後（ソースロケールのルート出力） | ノーマライザー適用後（翻訳された`docs/<locale>/`の出力） |
|--------------------------|----------------------------------------|------------------------------------------------------|
| `[JSON](/ja/guide/json)` | `[JSON](/ja/guide/json)` | `[JSON](/pt-BR/guide/json)`（ロケールのプレフィックスはフォルダーと一致） |
| 本文または`hero.actions[].link`内の`[Quick start](/ja/guide/quick-start)` | 変更なし（`/guide/quick-start`） | `/pt-BR/guide/quick-start` |
| ロケールインデックス上の`[Home](./README.md)` | `/` | `/pt-BR/` |
| `hero.image.src: /ai-i18n-tools_logo.svg` | 変更なし | 変更なし (共有 `docs/public/` アセット) |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | 変更なし（完全なURL） | 変更なし（完全なURL） |

`docs/`以下のソースロケールファイルは、**ロケールに依存しない**サイトルート（`/guide/…`）を維持します。この例では、英語を`sourceLocale`として使用します。どの言語でも有効です。`docs/<locale>/…`に書き込まれたファイルは、内部コンテンツルートにロケールのプレフィックスが自動的に付きます。これには**ホームレイアウトのfrontmatter**（`hero.actions[].link`、`features[].link`、`prev`/`next`）も含まれます。`/ai-i18n-tools_logo.svg`や`/translation-dashboard.png`などの共有の公開アセットは、すべてのロケールでプレフィックスが付かないままになります。

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

- ページ間ドキュメントリンク: `docs/` 配下の英語マークダウンでは **サイトルート** (`/guide/…`、`/reference/…`) を使用し、別のプロジェクトの `docs/index.md` に同期される README を作成する場合は `docs/guide/…` パスを使用してください。
- 実行可能なデモ、`LICENSE`、およびその他のリポジトリファイル: `README.md` およびドキュメントでは **完全な GitHub URL** を使用してください ([README とドキュメントのホームページ](#readme-and-the-docs-homepage) を参照)。
- `docs/<locale>/` のリンクは手動で編集**しない**でください。`sync` / `translate-docs` を使用して再生成してください。

[リンクの書き換え](/ja/guide/images-and-screenshots/link-rewriting) (フラット vs VitePress) および [設定 — `docsOutput`](/ja/reference/configuration#docsoutput) も参照してください。
