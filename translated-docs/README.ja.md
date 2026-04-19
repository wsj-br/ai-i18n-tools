<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**目次**  *[DocToc](https://github.com/thlorenz/doctoc) で生成*

- [ai-i18n-tools](#ai-i18n-tools)
  - [2つの主要なワークフロー](#two-core-workflows)
  - [インストール](#installation)
  - [クイックスタート](#quick-start)
    - [ワークフロー1 - UI文字列](#workflow-1---ui-strings)
    - [ワークフロー2 - ドキュメント](#workflow-2---documentation)
    - [両方のワークフロー](#both-workflows)
  - [ランタイムヘルパー](#runtime-helpers)
  - [CLIコマンド](#cli-commands)
  - [ドキュメント](#documentation)
  - [ライセンス](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# ai-i18n-tools

JavaScript/TypeScriptアプリケーションおよびドキュメントサイトの国際化のためのCLIおよびプログラムツールキット。UI文字列を抽出し、OpenRouter経由でLLMを使って翻訳し、i18next向けのロケール対応JSONファイルを生成します。また、Markdown、Docusaurus JSON、および（`features.translateSVG`、`translate-svg`、`svg`ブロック経由の）スタンドアロンSVGアセット向けのパイプラインも提供します。

<small>**他の言語で読む：** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## 2つの主要なワークフロー

**ワークフロー1 - UI翻訳**（React、Next.js、Node.js、任意のi18nextプロジェクト）

マスター カタログ（オプションのロケールごとの **`models`** メタデータを含む `strings.json`）を、`t("…")` / `i18n.t("…")` の **literals**、オプションの **`package.json` `description`**、および設定で有効になっている場合の `ui-languages.json` からの各 **`englishName`** から構築します。未翻訳エントリについてはロケールごとに OpenRouter を使用して翻訳し、i18next 向けにフラットな JSON ファイル（`de.json`、`pt-BR.json`、…）を出力します。

**ワークフロー2 - ドキュメント翻訳**（Markdown、Docusaurus JSON）

有効にした場合、各`documentations`ブロックの`contentPaths`から`.md`および`.mdx`を翻訳し、そのブロックの`jsonSource`からJSONラベルファイルを翻訳します。ブロックごとにDocusaurusスタイルまたはフラットなロケール接尾辞付きレイアウト（`documentations[].markdownOutput`）をサポートします。共有ルートの`cacheDir`にSQLiteキャッシュを保持するため、LLMに送信されるのは新規または変更されたセグメントのみです。**SVG：**`features.translateSVG`を有効にし、トップレベルの`svg`ブロックを追加し、次に`translate-svg`を使用します（両方が設定されている場合は`sync`からも実行されます）。

両方のワークフローは単一の`ai-i18n-tools.config.json`ファイルを共有しており、独立してまたは同時に使用できます。スタンドアロンSVG翻訳は`features.translateSVG`とトップレベルの`svg`ブロックを使用し、`translate-svg`（または`sync`内のSVGステージ）を通じて実行されます。

---

## インストール

公開されているパッケージは**ESMのみ対応**（`"type": "module"`）です。Node.js、バンドラー、または`import()`から`import`を使用してください。`require('ai-i18n-tools')` **はサポートされていません。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

OpenRouterのAPIキーを設定してください：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## クイックスタート

### ワークフロー1 - UI文字列

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract UI strings to strings.json (t(…) literals + optional package.json / manifest strings)
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

アプリ内で`'ai-i18n-tools/runtime'`から提供されるヘルパーを使ってi18nextを接続します：

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

### ワークフロー2 - ドキュメント

```bash
# 1. Create config for Docusaurus
npx ai-i18n-tools init -t ui-docusaurus

# 2. Translate all docs
npx ai-i18n-tools translate-docs

# 3. Check status
npx ai-i18n-tools status
```

### 両方のワークフロー

```bash
npx ai-i18n-tools sync   # Extract UI strings, then translate UI strings, SVG, and docs
```

---

## ランタイムヘルパー

`'ai-i18n-tools/runtime'` からエクスポート：任意のJS環境で動作、i18nextのインポートは不要:

| ヘルパー | 説明 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | キーをデフォルト値として使用する設定向けの標準的なi18next初期化オプション。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推奨配線: キー・トリム + 複数の **`wrapT`** **`strings.json`** から、オプションで **`translate-ui`** `{sourceLocale}.json` 複数キーをマージします。 |
| `wrapI18nWithKeyTrim(i18n)` | 下位レベルのキー・トリム・ラッパーのみ（アプリのワイヤリングでは非推奨。代わりに **`setupKeyAsDefaultT`** を使用してください）。|
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | **`localeLoaders`** マップを **`makeLoadLocale`** のために **`ui-languages.json`** から構築します（**`sourceLocale`** を除くすべての **`code`**）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 非同期でロケールファイルを読み込むためのファクトリ。 |
| `getTextDirection(lng)` | BCP-47コードに対応する`'ltr'`または`'rtl'`を返す。 |
| `applyDirection(lng, element?)` | `document.documentElement`に`dir`属性を設定。 |
| `getUILanguageLabel(lang, t)` | 言語メニュー行の表示用ラベル（i18n対応）。 |
| `getUILanguageLabelNative(lang)` | `t()`を呼び出さない表示用ラベル（ヘッダー形式）。 |
| `interpolateTemplate(str, vars)` | 単純な文字列に対する低レベルの`{{var}}`置換（内部使用。アプリコードは代わりに`t()`を使用すべき）。 |
| `flipUiArrowsForRtl(text, isRtl)` | RTLレイアウト向けに`→`を`←`に反転。 |

---

## CLIコマンド

```text
ai-i18n-tools version                               Print version and build timestamp
ai-i18n-tools help [command]                        Show global or per-command help (same as -h)
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools generate-ui-languages [--master path] [--dry-run]   Build ui-languages.json from locales + master catalog (needs uiLanguagesPath)
ai-i18n-tools extract                               Merge scanner output, optional package.json description, optional manifest englishName into strings.json
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status [--max-columns <n>]   UI strings per locale; markdown per file × locale in tables of up to n locales (default 9)
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

すべてのコマンドに共通のグローバルオプション：`-c <config>`（デフォルト：`ai-i18n-tools.config.json`）、`-v`（詳細出力）、任意の`-w` / `--write-logs [path]`でコンソール出力をログファイルに同時出力（デフォルト：翻訳キャッシュディレクトリ配下）、`-V` / `--version`、および`-h` / `--help`。コマンドごとのフラグについては[Getting Started](docs/GETTING_STARTED.ja.md#cli-reference)を参照。

---

## ドキュメント

- [はじめに](docs/GETTING_STARTED.ja.md) - 両方のワークフロー向けの完全なセットアップガイド、CLI リファレンス、および設定項目のリファレンス。
- [パッケージの概要](docs/PACKAGE_OVERVIEW.ja.md) - アーキテクチャ、内部構造、プログラムによる API、および拡張ポイント。
- [AI エージェントのコンテキスト](../docs/ai-i18n-tools-context.md) - **このパッケージを使用するアプリ向けの**統合用プロンプト（リポジトリ内のエージェントルールにコピーしてください）。
- **この**リポジトリ向けのメンテナ向け内部情報: `dev/package-context.md`（クローン専用。npm には公開されていません）。

---

## ライセンス

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
