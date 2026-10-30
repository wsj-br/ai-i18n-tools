<a id="astro-website"></a>
# Astro ウェブサイト

静的な Astro のマーケティングサイトまたはアプリサイト (Starlight ではなく、プレーンな Astro) では、[Astro の組み込み i18n ルーティング](https://docs.astro.build/en/guides/internationalization/) と ai-i18n-tools を組み合わせます。[Astro インテグレーション](/ja/guide/integrations/astro) も参照してください。

リファレンス実装は [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) です（その [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) も参照）。英語は `/`、9 つのターゲットロケールは `/{locale}/`（`de`、`fr`、`es`、`ar`、`ja`、`ko`、`zh-cn`、`zh-tw`、`pt-br`）です。

<a id="hybrid-pipelines"></a>
## ハイブリッドパイプライン

ほとんどのチームは2つのパイプラインの**ハイブリッド**を使用しています（これらは競合しません）：

| パイプライン | 使用対象 | コマンド | 出力 |
|----------|---------|----------|--------|
| **ページ HTML** | テンプレート本体の見出し、段落、ナビゲーションラベル、インライン配列 | `translate-docs` | ロケールごとに `src/pages/{locale}/index.astro` |
| **UI 文字列 (`t()`)** | Frontmatter データ、スクリーンショットのタブ ラベル、共有配列 | `extract` → `translate-ui` | `public/locales/{locale}.json` (ソース言語の文字列をキーとして使用) |

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
## UI文字列 (SSG)

`init -t ui-astro-website -P ollama` を使用して UI 抽出をスキャフォールドし、ページの HTML も翻訳する場合は `docs[]` ブロックにマージします ([ページの解析と置換](#pages-parse-and-replace) を参照)。リポジトリの README も翻訳します: `init -t ui-astro-website -P ollama --with-readme`。[README と Markdown ドキュメントに i18n を追加する](/ja/guide/add-i18n-to-readme) を参照してください。TypeScript モジュールと `.astro` frontmatter のコピーを `t('…')` でラップします (ロケール ページを複製するよりも UI 文字列を優先する場合は、テンプレートの `{expression}` ブロックも使用します)。ページの HTML には `t()` は必要ありません。`translate-docs` がコピーします。[JS/TS プロンプト](/ja/guide/add-i18n-to-js#run-the-agent-prompt) は、これらの frontmatter ファイルとデータ ファイルに適用されますが、i18next のインストールとブートストラップは除きます。Astro は i18next ではなく `makeT` を使用して、ビルド時に `t` を解決します。

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`astro.config.mjs` の `i18n.defaultLocale` に一致するように `sourceLocale` を設定します。Astro がビルド時にインポートできるディレクトリにフラット バンドルを書き込みます (テンプレートでは `public/locales/` を使用します)。ソース言語のリテラルをキーとして参照することで、**ビルド時**に `t('…')` を解決します (`examples/astro-website/src/i18n/t.ts` を参照。`strings.json` は抽出キャッシュであり、ランタイム バンドルではありません)。その言語は `sourceLocale` であり、任意の言語にすることができます。この例では英語を使用しています。静的サイトでは `ai-i18n-tools/runtime` や i18next は必要**ありません**。ただし、読み込み後に言語を切り替えるクライアント アイランドを追加する場合は除きます。

`t()` を呼び出すすべてのページ (ソース ロケールのページと各 `src/pages/{locale}/` のコピー) を接続します:

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

例におけるサポートヘルパー: ラベル、方向、BCP-47コード用の `src/i18n/utils.ts`, `src/i18n/locale.ts`, `ui-languages.json`。`targetLocales` を変更した後、`generate-ui-languages` を実行します（オプションで `languagesManifestPath` を設定し、マニフェストをヘルパーと同じ場所に配置します。例: `src/i18n/ui-languages.json`）。`MainLayout.astro` は `resolveUiLanguage(Astro.currentLocale)` から `<html lang>` と `<html dir>` を設定します。`LanguagePicker.astro` は `astro:i18n` から `getRelativeLocaleUrl` を使用します。

<a id="pages-parse-and-replace"></a>
## ページ (解析と置換)

`.astro` ファイル内のハードコードされた HTML を含むマーケティングページでは、`translate-docs` にテキストノードおよび属性（`alt`、`title`、`aria-label`、`placeholder`）の抽出をさせ、ドキュメントキャッシュで翻訳し、ページツリー内にロケール固有のコピーを書き出します。ほとんどの表示用コピーでは、`t()` は**不要**です。

構造的な属性とキーの値は、デフォルトでは**翻訳されません**。組み込みの保護機能は、`class`、`id`、`style`、`src`、`href`、`data-*`、およびほとんどの `aria-*` などの JSX/HTML 属性、さらにテンプレートの `{expression}` ブロック内の `class`、`key`、`id` などのオブジェクトキーをカバーします。カスタム属性（例: Tailwind の `variant` または CMS の `slug` フィールド）を使用する場合は、`docs[].protectAttributes` と `docs[].protectKeys` を使用してこれらのリストを拡張します。同じオプションは、マークダウン翻訳中の MDX JSX にも適用されます（[protectAttributes / protectKeys](/ja/reference/configuration#protectattributes-protectkeys) を参照）。

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

`ai-i18n-tools translate-docs` (または [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) の `pnpm i18n:translate`) を実行します。ソース ページは `src/pages/index.astro` のままです (この例では英語ですが、`sourceLocale` は任意の言語にできます)。各ターゲット ロケールは `src/pages/{locale}/index.astro` を取得し、追加のディレクトリ レベルに合わせてインポートが調整されます (例: `../layouts/` → `../../layouts/`)。

**テンプレートの本文**内では、`{expression}` ブロック内の文字列リテラル (インライン配列、オブジェクトの `title`/`desc` フィールド) は、ユーザーに表示される場合に翻訳されます。保護された属性/キーの引用符で囲まれた値、`t('…')`、`<script>`、`<style>` 内のリテラルは変更されません。このパスでは **Frontmatter の TypeScript は翻訳されません**。共有 frontmatter (`t()` のインポートとデータ配列を含む) は、英語ページとロケール ページで同一に保つか、英語ページを編集した後に `translate-docs` を再実行して、ロケールのコピーが frontmatter の変更を反映するようにします。frontmatter のみのコピーには、代わりに [UI 文字列パイプライン](#ui-strings-ssg) を使用してください。

完全なハイブリッドランディングページ（HTML は `translate-docs` 経由、スクリーンショットのタブラベルは `t()` + `translate-ui` 経由）については、[`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) を参照してください。
