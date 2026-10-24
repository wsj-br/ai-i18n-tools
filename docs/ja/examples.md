<a id="examples"></a>
# 例

GitHub の [`examples/`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/) にある実行可能なプロジェクト — それぞれに独自の構成、コミットされたロケール出力、および README があります。API キーなしで翻訳済みファイルを探索できます。翻訳を再実行するにはプロバイダーキーが必要です（[プロバイダーとモデル](/ja/guide/providers-and-models)）。

<a id="run-standalone-npx-degit"></a>
## スタンドアロンで実行 (`npx degit`)

リポジトリ全体をクローンせずに、例を1つコピーします。

<a id="node-examples"></a>
### Node.jsの例

各Node.jsの例では、現在のパッケージバージョンと一致する`ai-i18n-tools`の公開キャレット範囲が宣言されており、npmからCLIをインストールします：

```bash
npx degit wsj-br/ai-i18n-tools/examples/<name> <name>
cd <name>
pnpm install
```

<a id="python-examples"></a>
### Pythonの例

`python-streamlit`、`python-flask`、`python-fastapi`、および`python-gettext`には`package.json`がありません。以下の表にある`degit`コマンドは有効です。また、[GitHub Release](https://github.com/wsj-br/ai-i18n-tools/releases)から`ai-i18n-tools-python-examples.zip`をダウンロードすることもできます。そのzipファイルは同じ4つのディレクトリで構成されています。これはnpmパッケージの一部ではなく、スタンドアロン実行ファイル内にも含まれていません。

`python-streamlit`、`python-flask`、および`python-fastapi`はvirtualenvと`pip install -r requirements.txt`を使用します。`python-gettext`は標準ライブラリのみを使用します。[スタンドアロン実行ファイル](/ja/guide/installation#standalone-executables)を使用して翻訳します。

```bash
npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit
cd python-streamlit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Windowsでは、`.venv\Scripts\activate`をアクティブ化してください。

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools)リポジトリを**全体**クローンした場合は、リポジトリのルートで`pnpm install`と`pnpm run build`を実行してから、`cd examples/<name>`を実行してください。ワークスペース（Node.js）の例では、`pnpm run i18n:*`スクリプトを介してローカルCLIを使用するか、[PATH設定](/ja/guide/installation#using-the-cli)の後に直接`ai-i18n-tools …`を使用します。このチェックアウト内のPythonの例は、ビルド後に`node ../../bin/ai-i18n-tools.mjs`を使用して翻訳します。[インストール — クローンしたモノレポ](/ja/guide/installation#cloned-monorepo)を参照してください。

<a id="list-of-examples"></a>
## 例のリスト

<a id="console-app"></a>
<a id="nextjs-app"></a>
<a id="astro-website"></a>
<a id="astro-docs"></a>
<a id="vitepress-docs"></a>
<a id="nextra-docs"></a>
<a id="plain-html"></a>
<a id="plain-html-docs"></a>
<a id="fumadocs-docs"></a>
<a id="docusaurus-docs"></a>
<a id="multi-provider"></a>
<a id="intlayer-migration"></a>
<a id="test-markdown"></a>
<a id="python-streamlit"></a>
<a id="python-flask"></a>
<a id="python-fastapi"></a>
<a id="python-gettext"></a>

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
| [**プレーンHTMLドキュメント**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs/README.md) | ドキュメントとしてのプレーンHTML: ロケールごとに1ページ、ローカライズされた画像、hreflang | `npx degit wsj-br/ai-i18n-tools/examples/plain-html-docs plain-html-docs` | `pnpm dev` (`:3092`) |
| [**multi-provider**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/README.md) | LLM プロバイダーを選択またはベンチマーク (`-P` / `--provider`) | `npx degit wsj-br/ai-i18n-tools/examples/multi-provider multi-provider` | `ai-i18n-tools translate-docs -P openai --force` |
| [**test-markdown**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/test-markdown/README.md) | Markdown / CJK 翻訳 (デーヴァナーガリー、MDX) の回帰テスト | `npx degit wsj-br/ai-i18n-tools/examples/test-markdown test-markdown` | `pnpm build` |
| [**intlayer-migration**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration/README.md) | Intlayer `.content.ts` → `t()` (`migrate-intlayer`, リセット + AIエージェントレポート) | `npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration` | `pnpm reset && pnpm dev` (`:3091`) |
| [**python-streamlit**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit/README.md) | Streamlit ダッシュボード、`t()` / `_()`、英語キーの JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-streamlit python-streamlit` | `python3 -m venv .venv && pip install -r requirements.txt && streamlit run app.py` |
| [**python-flask**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask/README.md) | Flask + Jinja、`t()` / `_()`、英語キーの JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-flask python-flask` | `python3 -m venv .venv && pip install -r requirements.txt && flask --app app run` |
| [**python-fastapi**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi/README.md) | FastAPI、ContextVar ロケール、`t()` / `_()`、英語キーの JSON | `npx degit wsj-br/ai-i18n-tools/examples/python-fastapi python-fastapi` | `python3 -m venv .venv && pip install -r requirements.txt && uvicorn app:app` |
| [**python-gettext**](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext/README.md) | 既存の GNU gettext CLI。`extract` / `translate-ui` は `.po` と `.mo` を更新します | `npx degit wsj-br/ai-i18n-tools/examples/python-gettext python-gettext` | `python3 app.py --lang es` |

各**例**の名前は、完全なセットアップ、コマンド、プロジェクトレイアウトが記載された GitHub README にリンクしています。または、[リポジトリの例のインデックス](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/README.md) を参照してください。

Node.jsの例では、`pnpm install`の後にnpmからCLIをインストールします。4つのPythonの例では、`venv`と`pip`（`python-gettext`は標準ライブラリのみを使用）および翻訳用の[スタンドアロン実行ファイル](/ja/guide/installation#standalone-executables)を使用します。

<br/>

::: tip 免責事項
製品名およびアイコンは各所有者に帰属しており、識別目的でのみ使用されています。本ソフトウェアは、これらのブランドと提携しておらず、また推奨も受けていません。
:::
