# ai-i18n-tools

JavaScript/TypeScript アプリケーションおよびドキュメントサイトの国際化のための CLI およびプログラムによるツールキット。UI 文字列を抽出し、OpenRouter 経由で LLM を使用して翻訳し、i18next 向けのロケール対応 JSON ファイルを生成します。さらに、Markdown、Docusaurus JSON、および（`features.translateSVG`、`translate-svg`、および `svg` ブロックを介して）スタンドアロンの SVG アセット向けのパイプラインも提供します。

**他の言語で読む:**

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [hi](./README.hi.md) · [ja](./README.ja.md) · [ko](./README.ko.md) · [pt-BR](./README.pt-BR.md) · [zh-CN](./README.zh-CN.md) · [zh-TW](./README.zh-TW.md)</small>

## 2つの主要なワークフロー

**ワークフロー 1 - UI 翻訳** (React, Next.js, Node.js、あらゆる i18next プロジェクト)

ソースファイルをスキャンして `t("…")` 呼び出しを検出し、マスターカタログ（オプションのロケールごとの **`models`** メタデータを含む `strings.json`）を構築し、OpenRouter を介してロケールごとに不足しているエントリを翻訳し、i18next で使用できるフラットな JSON ファイル（`de.json`、`pt-BR.json`、…）を書き出します。

**ワークフロー 2 - ドキュメント翻訳** (Markdown、Docusaurus JSON)

`documentations` ブロックの `contentPaths` にある `.md` および `.mdx` ファイル、およびそのブロックの `jsonSource` にある JSON ラベルファイルを、有効にした場合に翻訳します。ブロックごとに Docusaurus スタイルまたはフラットなロケール接尾辞付きレイアウトをサポート（`documentations[].markdownOutput`）。共有ルートの `cacheDir` に SQLite キャッシュを保持するため、LLM に送信されるのは新規または変更されたセグメントのみです。**SVG：** `features.translateSVG` を有効にし、トップレベルの `svg` ブロックを追加して、`translate-svg` を使用します（両方が設定されている場合、`sync` からも実行されます）。

両方のワークフローは単一の `ai-i18n-tools.config.json` ファイルを共有しており、個別または併用が可能です。スタンドアロンの SVG 翻訳は `features.translateSVG` とトップレベルの `svg` ブロックを使用し、`translate-svg`（または `sync` 内の SVG ステージ）を通じて実行されます。

---

## インストール

公開されているパッケージは **ESM のみ**（`"type": "module"`）です。Node.js、バンドラー、または `import()` から `import` を使用してください — **`require('ai-i18n-tools')` はサポートされていません。**

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
```

OpenRouter API キーを設定してください：

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

---

## クイックスタート

### ワークフロー 1 - UI 文字列

```bash
# 1. Create config
npx ai-i18n-tools init

# 2. Extract t("…") calls from source
npx ai-i18n-tools extract

# 3. Translate to all target locales
npx ai-i18n-tools translate-ui
```

`'ai-i18n-tools/runtime'` のヘルパーを使用して、アプリに i18next を組み込みます：

```js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiLanguages from './locales/ui-languages.json';
import {
  defaultI18nInitOptions,
  wrapI18nWithKeyTrim,
  makeLoadLocale,
  applyDirection,
} from 'ai-i18n-tools/runtime';

// Must match sourceLocale in ai-i18n-tools.config.json
export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(defaultI18nInitOptions(SOURCE_LOCALE));
wrapI18nWithKeyTrim(i18n);
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

const localeLoaders = Object.fromEntries(
  uiLanguages
    .filter(({ code }) => code !== SOURCE_LOCALE)
    .map(({ code }) => [code, () => import(`./locales/${code}.json`)])
);
export const loadLocale = makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

### ワークフロー 2 - ドキュメント

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

`'ai-i18n-tools/runtime'` からエクスポート - あらゆる JS 環境で動作し、i18next のインポートは不要です：

| ヘルパー | 説明 |
|---|---|
| `defaultI18nInitOptions(sourceLocale)` | キーをデフォルト値として使用する設定のための標準的な i18next 初期化オプション。 |
| `wrapI18nWithKeyTrim(i18n)` | キーがルックアップ前にトリミングされるように `i18n.t` をラップします。 |
| `makeLoadLocale(i18n, loaders, sourceLocale)` | 非同期ロケールファイル読み込みのためのファクトリ関数。 |
| `getTextDirection(lng)` | BCP-47 コードに対して `'ltr'` または `'rtl'` を返します。 |
| `applyDirection(lng, element?)` | `document.documentElement` に `dir` 属性を設定します。 |
| `getUILanguageLabel(lang, t)` | 言語メニュー行の表示ラベル（i18n を使用）。 |
| `getUILanguageLabelNative(lang)` | `t()` を呼び出さない表示ラベル（ヘッダースタイル）。 |
| `interpolateTemplate(str, vars)` | プレーン文字列に対する `{{var}}` 置換の低レベル関数（内部で使用されます。アプリコードは代わりに `t()` を使用すべきです）。 |
| `flipUiArrowsForRtl(text, isRtl)` | RTL レイアウトのために `→` を `←` に反転します。 |

---

## CLI コマンド

```
ai-i18n-tools init [-t ui-markdown|ui-docusaurus]   Create config file
ai-i18n-tools extract                               Scan source for t("…") calls
ai-i18n-tools translate-docs [--locale <code>]      Translate documentation (markdown, JSON); see docs for
                                                    --force-update, --force, --stats, --clear-cache,
                                                    --prompt-format (xml | json-array | json-object)
ai-i18n-tools translate-svg [--locale <code>]       Standalone SVG assets (features.translateSVG + config.svg); see --no-cache
ai-i18n-tools translate-ui [--locale <code>]        Translate UI strings only; see --force, --dry-run
ai-i18n-tools export-ui-xliff [--locale <code>]     Export UI strings to XLIFF 2.0 (one file per locale); see --untranslated-only, -o
ai-i18n-tools sync                                  Extract UI strings, then translate UI strings, SVG, and docs
ai-i18n-tools status                                Translation status per file × locale
ai-i18n-tools editor                                Open cache/glossary web editor
ai-i18n-tools cleanup [--dry-run] [--no-backup] [--backup <path>]   Runs sync --force-update, then cleans stale + orphaned cache rows; backs up SQLite by default
ai-i18n-tools glossary-generate                     Create empty glossary CSV template
```

すべてのコマンドは `-c <config>`（デフォルト: `ai-i18n-tools.config.json`）、`-v`（詳細）、およびオプションの `-w` / `--write-logs [path]` を受け入れ、コンソール出力をログファイルに追加します（デフォルト: 翻訳キャッシュディレクトリの下）。

---

## ドキュメント

- [はじめに](docs/GETTING_STARTED.ja.md) - 両方のワークフローの完全なセットアップガイド、すべてのCLIフラグ、および設定フィールドのリファレンス。
- [パッケージ概要](docs/PACKAGE_OVERVIEW.ja.md) - アーキテクチャ、内部構造、プログラムAPI、および拡張ポイント。
- [AIエージェントコンテキスト](../docs/ai-i18n-tools-context.md) - コードや設定変更を行うエージェントやメンテナのための簡潔なプロジェクトコンテキスト。

---

## ライセンス

MIT © [ヴァルデマール・スカデラー・ジュニア](https://github.com/wsj-br)
