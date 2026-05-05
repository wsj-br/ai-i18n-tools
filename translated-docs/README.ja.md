<a id="ai-i18n-tools"></a>
# ai-i18n-tools

[![npm バージョン](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![npm ダウンロード数](https://img.shields.io/npm/dm/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools)
[![Node.js](https://img.shields.io/node/v/ai-i18n-tools.svg)](https://nodejs.org/)
[![ライセンス: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wsj-br/ai-i18n-tools/actions/workflows/ci.yml)

JavaScript/TypeScript アプリケーションおよびドキュメントサイトの国際化のための CLI およびツールキット。UI 文字列を抽出し、OpenRouter 経由で大規模言語モデルを使用して翻訳を行い、i18next 向けのロケール対応 JSON ファイルを生成します。また、Markdown、Docusaurus JSON、SVG ファイル向けのパイプラインも含まれます。

<small>**他の言語で読む：** </small>
<small id="lang-list">[English (GB)](../README.md) · [Deutsch](./README.de.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [हिन्दी](./README.hi.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Português (Brasil)](./README.pt-BR.md) · [中文 (中国大陆)](./README.zh-CN.md) · [中文 (台灣)](./README.zh-TW.md)</small>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**

- [2つの主要なワークフロー](#two-core-workflows)
- [インストール](#installation)
  - [CLIの使用](#using-the-cli)
- [OpenRouter](#openrouter)
- [クイックスタート](#quick-start)
  - [ワークフロー1 - UI文字列](#workflow-1---ui-strings)
  - [ワークフロー2 - ドキュメンテーション](#workflow-2---documentation)
  - [両方のワークフロー](#both-workflows)
- [ランタイムヘルパー](#runtime-helpers)
- [CLIコマンド](#cli-commands)
- [ドキュメンテーション](#documentation)
- [ライセンス](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

<a id="two-core-workflows"></a>
## 2つの主要なワークフロー

**ワークフロー1 - UI翻訳**（React、Next.js、Node.js、任意のi18nextプロジェクト）

マスター カタログ（オプションでロケールごとの `models` メタデータ付きの `strings.json`）を、`t("…")` / `i18n.t("…")` の **literals**、オプションの `package.json` `description`、および設定で有効化されている場合の `ui-languages.json` からの各 `englishName` から構築します。未翻訳エントリをロケールごとに OpenRouter を使用して翻訳し、i18next 向けのフラットな JSON ファイル（`de.json`、`pt-BR.json` など）を出力します。

**ワークフロー2 - ドキュメント翻訳**（Markdown、Docusaurus JSON）

各`documentations`ブロックの`contentPaths`にある`.md`および`.mdx`を翻訳します。有効にした場合、そのブロックの`jsonSource`にあるJSONラベルファイルも翻訳します。ブロックごとにDocusaurusスタイルまたはフラットなロケール接尾辞付きレイアウト（`documentations[].markdownOutput`）をサポートします。共有ルートの`cacheDir`にSQLiteキャッシュを保持するため、LLMに送信されるのは新規または変更されたセグメントのみです。**SVG：**`features.translateSVG`を有効にし、トップレベルに`svg`ブロックを追加して、`translate-svg`を使用します（両方が設定されている場合は`sync`からも実行可能）。

両方のワークフローは単一の`ai-i18n-tools.config.json`ファイルを共有しており、個別または併用が可能です。スタンドアロンSVG翻訳は`features.translateSVG`とトップレベルの`svg`ブロックを使用し、`translate-svg`を通じて実行されます（または`sync`内のSVGステージで実行）。

---

<a id="installation"></a>
## インストール

公開されているパッケージは **ESM 専用**（`"type": "module"`）です。Node.js、バンドラー、または `import()` から `import` を使用してください。`require('ai-i18n-tools')` **はサポートされていません。** このパッケージは `engines.node` および `>=22.16.0` を宣言しています。古いバージョンの Node.js はサポート対象外です。

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

<a id="using-the-cli"></a>
### CLI の使用方法

**プロジェクトごと（推奨）** — 依存関係または開発依存関係としてインストールし、次に`npx`、`pnpm exec`、または`package.json`スクリプト経由で呼び出します。

```bash
pnpm add -D ai-i18n-tools     # or: npm i -D ai-i18n-tools
npx ai-i18n-tools sync        # or: pnpm exec ai-i18n-tools sync
```

```json
"scripts": {
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate": "ai-i18n-tools translate-docs"
}
```

パッケージマネージャーはLinuxおよびmacOSでは適切な権限で`node_modules/.bin/ai-i18n-tools`を書き込み、Windowsでは`.cmd` / `.ps1`のシャムを生成します。スクリプトランナーはこれを自動的に検出します。

**端末での** `ai-i18n-tools` **の実行：** `package.json` は `PATH` 上で `node_modules/.bin` 付きで既に実行されているため、`pnpm run i18n:sync` のようなコマンドは `npx` を入力せずにCLIを呼び出します。ローカルインストール後にプロジェクトルートからインタラクティブシェル内で `ai-i18n-tools` を直接実行するには、ローカルのbinディレクトリを `PATH` に追加します。

```bash
# bash/zsh — project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

[**direnv**](https://direnv.net/) を使用する場合、プロジェクトルートの `.envrc` に `PATH_add node_modules/.bin` を追加することで、リポジトリに `cd` した後にベアコマンドが利用可能になります。`PATH` を変更しない場合は、引き続き `npx ai-i18n-tools …` または `pnpm exec ai-i18n-tools …` を使用してください。

**インストール不要のワンタイム実行** — `npx ai-i18n-tools <cmd>` または `pnpm dlx ai-i18n-tools <cmd>`（その実行のためにパッケージをダウンロード。`package.json` にエントリは追加されません）。

Linux、macOS、およびWSLでは、レジストリからのインストールによりCLIスクリプトの実行ビットが自動的に設定されます。Windowsでは、パッケージマネージャーがNodeを明示的に呼び出す`.cmd`および`.ps1`のシャムを生成します。

OpenRouterのAPIキーを設定してください。

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

<a id="openrouter"></a>
## OpenRouter

OpenRouter を呼び出すコマンド（`translate-ui`、`translate-docs`、`sync`、`check-models`、および関連スクリプト）は、環境に `OPENROUTER_API_KEY` が必要です。`check-markdown` は OpenRouter を使用しません。

`ai-i18n-tools.config.json`では、`openrouter`オブジェクトにモデル一覧、`baseUrl`、`maxTokens`、`temperature`、および`requestTimeoutMs`（OpenRouterへの各HTTPリクエスト（チャット補完および内部`GET /models`呼び出し）の最大待機時間（ミリ秒単位））が含まれます。デフォルトは`30000`（30秒）です。

設定された各モデルIDをOpenRouterのライブカタログに対して検証するには、`ai-i18n-tools check-models`を実行します。存在しない、または`expiration_date`を過ぎたIDを報告し、有効なモデルを100万トークンあたりの推定入出力価格（USD）とともに一覧表示します。設定されたIDのいずれかが無効な場合、終了ステータスはゼロ以外になります。`OPENROUTER_API_KEY`が必要です。

---

<a id="quick-start"></a>
## クイックスタート

<a id="workflow-1---ui-strings"></a>
### ワークフロー1 - UI文字列

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

アプリ内で`'ai-i18n-tools/runtime'`から提供されるヘルパーを使ってi18nextを設定します：

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';
// Plural flat: ./public/locales/{SOURCE_LOCALE}.json — must match config sourceLocale
import sourcePluralFlat from './public/locales/en-GB.json';
import aiI18n from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

<a id="workflow-2---documentation"></a>
### ワークフロー2 - ドキュメンテーション

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

<a id="both-workflows"></a>
### 両方のワークフロー

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

<a id="runtime-helpers"></a>
## ランタイムヘルパー

`'ai-i18n-tools/runtime'` からエクスポートされる以下のヘルパーは、任意のJavaScript環境で使用できます。i18nextをインポートする必要はありません：

| ヘルパー | 説明 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | キーをデフォルト値として使用する設定向けの標準的なi18next初期化オプション。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推奨される構成：`wrapT`からのキーのトリムおよび複数形`strings.json`、オプションで`translate-ui` `{sourceLocale}.json`の複数形キーをマージします。 |
| `wrapI18nWithKeyTrim(i18n)` | 下位レベルのキー・トリムラッパーのみ（アプリ構成では非推奨。代わりに`setupKeyAsDefaultT`を使用してください）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | `localeLoaders`の`makeLoadLocale`マップを`ui-languages.json`から構築します（`code`を除くすべての`sourceLocale`）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 非同期ロケールファイル読み込み用のファクトリ。 |
| `getTextDirection(lng)` | BCP-47コードに対応する`'ltr'`または`'rtl'`を返す。 |
| `applyDirection(lng, element?)` | `document.documentElement`に`dir`属性を設定。 |
| `getUILanguageLabel(lang, t)` | 言語メニュー行の表示ラベル（i18n付き）。 |
| `getUILanguageLabelNative(lang)` | `t()`呼び出しなしの表示ラベル（ヘッダー形式）。 |
| `interpolateTemplate(str, vars)` | 単純な文字列に対する低レベルの`{{var}}`置換（内部使用。アプリコードは代わりに`t()`を使用すべき）。 |
| `flipUiArrowsForRtl(text, isRtl)` | RTLレイアウト向けに`→`を`←`に反転。 |

---

<a id="cli-commands"></a>
## CLIコマンド

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus] [-o path] [--with-translate-ignore]   Create config file
ai-i18n-tools check-models                          Validate configured OpenRouter model ids against GET /models (pricing, expiration); requires OPENROUTER_API_KEY
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs …                      Translate documentation (markdown, JSON); flags include -l/--locale <codes>, -p/-f path, --dry-run,
                                                    --force, --force-update, --stats, --clear-cache, --type, --json-only, --no-json, -j, -b,
                                                    --prompt-format, --emphasis-placeholders, --no-emphasis-placeholders, --debug-failed
ai-i18n-tools write-heading-ids …                   Insert HTML anchor lines before ATX headings in .md/.mdx (documentations[])
ai-i18n-tools strip-md-bold-inline …              Remove bold (**) around inline code in markdown/MDX (documentations[])
ai-i18n-tools check-markdown [-p|--path <path>] [--json] [--no-cache]   Scan documentation markdown for delimiter / inline-code issues and strong-outside-code or strong-outside-link patterns; refresh SQLite markdown_source_issues; exit 1 if any issue
ai-i18n-tools translate-svg …                        SVG files (features.translateSVG + config.svg); flags include -l/--locale <codes>,
                                                    -p/-f path, --dry-run, --force, --force-update, --no-cache, -j, -b
ai-i18n-tools translate-ui …                        Translate UI strings only; flags include -l/--locale <codes>, --dry-run, --force, -j
ai-i18n-tools lint-source …                         Run extract, then LLM review of source-locale UI strings (OpenRouter)
ai-i18n-tools export-ui-xliff …                   Export UI strings to XLIFF 2.0 (one file per locale); -l, -o, --untranslated-only, --dry-run
ai-i18n-tools sync …                                Extract, then UI / SVG / docs; flags include -l/--locale <codes>, -p/-f path, --dry-run, --force,
                                                    --force-update, --no-ui, --no-svg, --no-docs, -j, -b, --emphasis-placeholders,
                                                    --no-emphasis-placeholders, --debug-failed
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools statistics [--max-columns <n>]        Documentation cache + strings.json aggregates (same as editor Statistics)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools clean-temp [-r|--root <path>] [-f|--force] [--dry-run]   List *.log and cache.db.backup*.sqlite; delete after `y`, with `-f`, or skip if none match
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

コマンドごとのフラグ一覧は、[コマンド別の CLI フラグ](docs/GETTING_STARTED.ja.md#cli-flags-by-command) の `src/cli/index.ts` の隣に記載されています。組み込みの使用方法テキストを表示するには、`ai-i18n-tools <command> --help` を実行してください。

すべてのコマンドに共通するグローバルオプション：`-c <config>`（デフォルト：`ai-i18n-tools.config.json`）、`-v`（詳細出力）、コンソール出力をログファイルに同時出力するためのオプション `-w` / `--write-logs [path]`（デフォルト：翻訳キャッシュディレクトリ内）、`-V` / `--version`、および `-h` / `--help`。コマンド概要表については、[はじめに](docs/GETTING_STARTED.ja.md#cli-reference) を参照してください。

---

<a id="documentation"></a>
## ドキュメンテーション

- [Getting Started](docs/GETTING_STARTED.ja.md) - 両方のワークフロー向けの完全なセットアップガイド、CLIリファレンス、設定項目リファレンス。
- [Package Overview](docs/PACKAGE_OVERVIEW.ja.md) - アーキテクチャ、内部構造、プログラムによるAPI、および拡張ポイント。
- [AI Agent Context](../docs/ai-i18n-tools-context.md) - **このパッケージを使用するアプリ向け:** 下流プロジェクトの統合プロンプト（リポジトリのエージェントルールにコピーしてください）。
- **この**リポジトリ向けのメンテナ内部情報: `dev/package-context.md`（クローン専用、npmには公開されていない）。

---

<a id="license"></a>
## ライセンス

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
