# ai-i18n-tools

JavaScript/TypeScriptアプリケーションおよびドキュメントサイトの国際化のためのCLIおよびプログラムツールキット。UI文字列を抽出し、OpenRouter経由でLLMを使用して翻訳し、i18next用のロケール対応JSONファイルを生成します。また、Markdown、Docusaurus JSON、および（`features.translateSVG`、`translate-svg`、および`svg`ブロックを介した）スタンドアロンSVGアセットのパイプラインも提供します。

<small>**他の言語で読む：** </small>

<small id="lang-list">[English (GB)](../README.md) · [German](./README.de.md) · [Spanish](./README.es.md) · [French](./README.fr.md) · [Hindi](./README.hi.md) · [Japanese](./README.ja.md) · [Korean](./README.ko.md) · [Portuguese (BR)](./README.pt-BR.md) · [Chinese (CN)](./README.zh-CN.md) · [Chinese (TW)](./README.zh-TW.md)</small>

## 2つの主要なワークフロー

**ワークフロー1 - UI翻訳**（React、Next.js、Node.js、任意のi18nextプロジェクト）

マスター カタログ（オプションのロケールごとの **`models`** メタデータ付きの `strings.json`）を、`t("…")` / `i18n.t("…")` **リテラル**、オプションの **`package.json` `description`**、および設定で有効になっている場合の `ui-languages.json` からの各 **`englishName`** から構築します。OpenRouter を使用してロケールごとに不足しているエントリを翻訳し、i18next 向けにフラットな JSON ファイル（`de.json`、`pt-BR.json`、…）を出力します。

**ワークフロー2 - ドキュメント翻訳**（Markdown、Docusaurus JSON）

有効にした場合、各`documentations`ブロックの`contentPaths`内の`.md`および`.mdx`、およびそのブロックの`jsonSource`内のJSONラベルファイルを翻訳します。ブロックごとにDocusaurusスタイルまたはフラットなロケール接尾辞付きレイアウト（`documentations[].markdownOutput`）をサポートします。共有ルートの`cacheDir`にSQLiteキャッシュを保持するため、LLMに送信されるのは新規または変更されたセグメントのみです。**SVG：** `features.translateSVG`を有効にし、最上位の`svg`ブロックを追加して、`translate-svg`を使用します（両方が設定されている場合は`sync`から実行することもできます）。

両方のワークフローは単一の`ai-i18n-tools.config.json`ファイルを共有し、個別または併用が可能です。スタンドアロンSVG翻訳は`features.translateSVG`と最上位の`svg`ブロックを使用し、`translate-svg`（または`sync`内のSVGステージ）を通じて実行されます。

---

## インストール

公開されているパッケージは**ESM専用**（`"type": "module"`）です。Node.js、バンドラー、または`import()`から`import`を使用してください。`require('ai-i18n-tools')` **はサポートされていません。**

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

アプリ内で`'ai-i18n-tools/runtime'`からのヘルパーを使用してi18nextを接続します：

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

`'ai-i18n-tools/runtime'`からエクスポートされます - i18nextのインポートなしで任意のJS環境で動作します：

| ヘルパー | 説明 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | キーをデフォルト値とする設定向けの標準的なi18next初期化オプション。 |
| `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle? })` | 推奨配線: key-trim と **`strings.json`** からの複数形 **`wrapT`**、オプションで **`translate-ui`** `{sourceLocale}.json` 複数のキーをマージします。 |
| `wrapI18nWithKeyTrim(i18n)` | 下位レベルの key-trim ラッパーのみ（アプリ配線では非推奨。代わりに **`setupKeyAsDefaultT`** を使用してください）。 |
| `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, makeLoader)` | **`ui-languages.json`** から **`makeLoadLocale`** のための **`localeLoaders`** マップを構築します（**`sourceLocale`** を除くすべての **`code`**）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 非同期ロケールファイル読み込みのためのファクトリ。 |
| `getTextDirection(lng)` | BCP-47 コードに対して `'ltr'` または `'rtl'` を返します。 |
| `applyDirection(lng, element?)` | `document.documentElement` に `dir` 属性を設定します。 |
| `getUILanguageLabel(lang, t)` | 言語メニュー行の表示ラベル（i18n付き）。 |
| `getUILanguageLabelNative(lang)` | `t()` を呼び出さずに表示ラベルを取得（ヘッダー形式）。 |
| `interpolateTemplate(str, vars)` | 平文文字列に対する低レベルの `{{var}}` 置換（内部使用。アプリコードは代わりに `t()` を使用すべきです）。 |
| `flipUiArrowsForRtl(text, isRtl)` | RTL レイアウト用に `→` を `←` に反転します。 |

---

## CLI コマンド

```
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

すべてのコマンドのグローバルオプション: `-c <config>`（デフォルト: `ai-i18n-tools.config.json`）、`-v`（詳細表示）、コンソール出力をログファイルに複製するためのオプション `-w` / `--write-logs [path]`（デフォルト: 翻訳キャッシュディレクトリ配下）、`-V` / `--version`、および `-h` / `--help`。コマンドごとのフラグについては[Getting Started](docs/GETTING_STARTED.ja.md#cli-reference)を参照してください。

---

## ドキュメント

- [はじめに](docs/GETTING_STARTED.ja.md) - 両方のワークフロー向けの完全なセットアップガイド、CLIリファレンス、および設定項目リファレンス。
- [パッケージ概要](docs/PACKAGE_OVERVIEW.ja.md) - アーキテクチャ、内部構造、プログラムによるAPI、および拡張ポイント。
- [AIエージェントのコンテキスト](../docs/ai-i18n-tools-context.md) - **このパッケージを使用するアプリ向けの**統合プロンプト（ダウンストリームプロジェクト用：リポジトリのエージェントルールにコピーしてください）。
- **この**リポジトリのメンテナ向け内部情報：`dev/package-context.md`（クローン専用；npmには公開されていません）。

---

## ライセンス

MIT © [Waldemar Scudeller Jr.](https://github.com/wsj-br)
