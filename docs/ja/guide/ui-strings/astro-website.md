<a id="astro-website"></a>
# Astro ウェブサイト

静的な Astro のマーケティングサイトまたはアプリサイト (Starlight ではなく、プレーンな Astro) では、[Astro の組み込み i18n ルーティング](https://docs.astro.build/en/guides/internationalization/) と ai-i18n-tools を組み合わせます。[Astro インテグレーション](/guide/integrations/astro) も参照してください。

リファレンス実装は [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) です（その [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) も参照）。英語は `/`、9 つのターゲットロケールは `/{locale}/`（`de`、`fr`、`es`、`ar`、`ja`、`ko`、`zh-cn`、`zh-tw`、`pt-br`）です。

<a id="hybrid-pipelines"></a>
## ハイブリッドパイプライン

ほとんどのチームは2つのパイプラインの**ハイブリッド**を使用しています（これらは競合しません）：

| パイプライン | 使用対象 | コマンド | 出力 |
|----------|---------|----------|--------|
| **ページ HTML** | テンプレート本体の見出し、段落、ナビゲーションラベル、インライン配列 | `translate-docs` | ロケールごとに `src/pages/{locale}/index.astro` |
| **UI 文字列（`t()`）** | フロントマターのデータ、スクリーンショットのタブラベル、共有配列 | `extract` → `translate-ui` | `public/locales/{locale}.json`（英語原文をキーとする） |

言語を追加または削除するときは、3 つのリストを同期させてください。`targetLocales`（`ai-i18n-tools.config.json` 内）、`i18n.locales`（`astro.config.mjs` 内、Astro は **小文字**のルートコード（例: `pt-br`）を使用）、および `ui-languages.json`（`generate-ui-languages` 経由）。フラットバンドルの **ファイル名**は設定のケース（`pt-BR.json`）を使用します。Astro の `pt-br` ルートをマニフェストの `code` フィールド経由でそのファイルにマッピングします（`examples/astro-website/src/i18n/locale.ts` を参照）。

リファレンスプロジェクトからの `package.json` スクリプトの例：

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## UI 文字列 (SSG)

`init -t ui-astro-website` で UI 抽出の足場を構築し、ページ HTML も翻訳する場合は `docs[]` ブロックにマージします（[ページの解析と置換](#astro-website-pages-parse-and-replace) を参照）。TypeScript モジュールでは `t('…')`、`.astro` フロントマター（および重複するロケールページよりも UI 文字列を優先する場合はテンプレートの `{expression}` ブロック）でコピーをラップします。

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

`astro.config.mjs` 内の `i18n.defaultLocale` と一致するように `sourceLocale` を設定してください。ビルド時に Astro がインポートできるディレクトリにフラットバンドルを書き出します（テンプレートでは `public/locales/` を使用）。英語の原文リテラルをキーとして検索することで、**ビルド時**に `t('…')` を解決します（`examples/astro-website/src/i18n/t.ts` を参照。`strings.json` は実行時バンドルではなく、抽出キャッシュです）。読み込み後に言語切り替えを行うクライアントアイランドを追加しない限り、静的サイトでは `ai-i18n-tools/runtime` や i18next は**不要**です。

`t()` を呼び出すすべてのページ（英語ルートページおよび各 `src/pages/{locale}/` コピー）を接続してください：

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

例におけるサポートヘルパー: ラベル、方向、BCP-47コード用の `src/i18n/utils.ts`, `src/i18n/locale.ts`, `ui-languages.json`。`targetLocales` を変更した後、`generate-ui-languages` を実行します（オプションで `languagesManifestPath` を設定し、マニフェストをヘルパーと同じ場所に配置します。例: `src/i18n/ui-languages.json`）。`MainLayout.astro` は `resolveUiLanguage(Astro.currentLocale)` から `<html lang>` と `<html dir>` を設定します。`LanguagePicker.astro` は `astro:i18n` から `getRelativeLocaleUrl` を使用します。

<a id="pages-parse-and-replace"></a>
## ページ（解析と置換）

`.astro` ファイル内のハードコードされた HTML を含むマーケティングページでは、`translate-docs` にテキストノードおよび属性（`alt`、`title`、`aria-label`、`placeholder`）の抽出をさせ、ドキュメントキャッシュで翻訳し、ページツリー内にロケール固有のコピーを書き出します。ほとんどの表示用コピーでは、`t()` は**不要**です。

構造的な属性とキーの値は、デフォルトでは**翻訳されません**。組み込みの保護機能は、`class`、`id`、`style`、`src`、`href`、`data-*`、およびほとんどの `aria-*` などの JSX/HTML 属性、さらにテンプレートの `{expression}` ブロック内の `class`、`key`、`id` などのオブジェクトキーをカバーします。カスタム属性（例: Tailwind の `variant` または CMS の `slug` フィールド）を使用する場合は、`docs[].protectAttributes` と `docs[].protectKeys` を使用してこれらのリストを拡張します。同じオプションは、マークダウン翻訳中の MDX JSX にも適用されます（[protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys) を参照）。

`features.translateDocs`を有効化し、`docs[]`ブロックを追加します。例：

```json
{
  "features": { "translateDocs": true },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

`npx ai-i18n-tools translate-docs`（または [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) の `pnpm i18n:translate`）を実行します。英語のソースは `src/pages/index.astro` に残り、各ターゲットロケールは追加のディレクトリレベルに合わせてインポートが調整された `src/pages/{locale}/index.astro` を取得します（例: `../layouts/` → `../../layouts/`）。

**テンプレート本体**内では、`{expression}` ブロック（インライン配列、オブジェクトの `title`/`desc` フィールド）内の文字列リテラルは、ユーザー向けである場合に翻訳されます。保護された属性/キーの引用符付きの値、`t('…')`、`<script>`、`<style>` 内のリテラルは変更されません。**フロントマターの TypeScript はこのパスでは翻訳されません**。共有フロントマター（`t()` のインポートとデータ配列を含む）は、英語ページとロケールページで同じに保つか、英語ページの編集後に `translate-docs` を再実行して、ロケールコピーがフロントマターの変更を反映するようにします。フロントマターのみのコピーについては、代わりに [UI 文字列パイプライン](#astro-website-ui-strings-ssg) を使用してください。

完全なハイブリッドランディングページ（HTML は `translate-docs` 経由、スクリーンショットのタブラベルは `t()` + `translate-ui` 経由）については、[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) を参照してください。
