<a id="examples"></a>
# 例

GitHub の [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) にある実行可能なプロジェクト — それぞれに独自の構成、コミットされたロケール出力、および README があります。API キーなしで翻訳済みファイルを探索できます。翻訳を再実行するにはプロバイダーキーが必要です（[プロバイダーとモデル](/ja/guide/providers-and-models)）。

<a id="run-standalone-npx-degit"></a>
## スタンドアロンで実行 (`npx degit`)

リポジトリ全体をクローンせずに、1 つの例をコピーします。それぞれが `"ai-i18n-tools": "^1.7.2"` を宣言し、npm から CLI をインストールします。

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

代わりに**全体の** [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools) リポジトリをクローンした場合は、リポジトリルートで `pnpm install` と `pnpm run build` を実行し、その後 `cd examples/<name>` を実行します。ワークスペースの例では、`pnpm run i18n:*` スクリプト経由でローカルCLIを使用するか、[PATHの設定](/ja/guide/installation#using-the-cli)後に単独の `ai-i18n-tools …` を使用します。[インストール — クローンしたモノレポ](/ja/guide/installation#cloned-monorepo)を参照してください。

<a id="list-of-examples"></a>
## 例のリスト

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="test-markdown"></a>

| 例 | 最適な用途 | degit でコピー | 実行 |
| --- | --- | --- | --- |
| [**console-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/README.md) | `t()` UI 文字列 + README 翻訳を含む最小限の動作するアプリ | `npx degit wsj-br/ai-i18n-tools/examples/console-app console-app` | `pnpm start` |
| [**nextjs-app**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/README.md) | React / Next.js + 複数形 + ダッシュボード; ネストされた Docusaurus ドキュメント + フラットな README + SVG アセット | `npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app` | `pnpm dev` (アプリ `:3030`; ドキュメント用 `cd docs-site && pnpm start` `:3040`) |
| [**docusaurus-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/README.md) | Docusaurus ドキュメントサイトのみ (`docusaurus` プリセット) | `npx degit wsj-br/ai-i18n-tools/examples/docusaurus-docs docusaurus-docs` | `pnpm start` (`:3100`; ビルド + サーブ、ロケールメニュー機能) |
| [**astro-website**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md) | Astro ランディングページ: フルページ HTML + `t()` ハイブリッド | `npx degit wsj-br/ai-i18n-tools/examples/astro-website astro-website` | `pnpm dev` |
| [**astro-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/README.md) | Astro Starlight ドキュメントサイト | `npx degit wsj-br/ai-i18n-tools/examples/astro-docs astro-docs` | `pnpm dev` (`:3050`) |
| [**vitepress-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/README.md) | VitePress ドキュメントサイト + テーマ JSON (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/vitepress-docs vitepress-docs` | `pnpm run docs:dev` (`:3060`) |
| [**nextra-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs/README.md) | Nextra 4 MDX + `_meta.ts` / 辞書 `.ts` シェル (`pt-BR`, `zh-Hans`) | `npx degit wsj-br/ai-i18n-tools/examples/nextra-docs nextra-docs` | `pnpm run dev` (`:3070`) |
| [**fumadocs-docs**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs/README.md) | Fumadocs 4 MDX + `meta.json` / UI カタログ (`pt`, `zh`, ドットパーサー) | `npx degit wsj-br/ai-i18n-tools/examples/fumadocs-docs fumadocs-docs` | `pnpm run dev` (`:3080`) |
| [**plain-html**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html/README.md) | プレーン HTML + `data-i18n*` マーカー; 静的ロケール JSON (ダッシュボード形式の UI) | `npx degit wsj-br/ai-i18n-tools/examples/plain-html plain-html` | `pnpm dev` (`:3090`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | LLM プロバイダーを選択またはベンチマーク (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Markdown / CJK 翻訳 (デーヴァナーガリー、MDX) の回帰テスト | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |

各**例**の名前は、完全なセットアップ、コマンド、プロジェクトレイアウトが記載された GitHub README にリンクしています。または、[リポジトリの例のインデックス](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md) を参照してください。
