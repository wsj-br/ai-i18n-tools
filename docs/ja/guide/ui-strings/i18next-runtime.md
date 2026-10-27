<a id="wire-i18next-at-runtime"></a>
# 実行時に i18next をワイヤリングする

このページでは、実行時にルックアップを組み込みます。文字列の検出は行いません。アプリにまだ生のソース言語リテラルがある場合は、まずそれらをラップしてください: [JS/TS アプリに i18n を追加する](/ja/guide/add-i18n-to-js)。アプリは、コンポーネントが `useTranslation()` を使用するときに `i18next` と `react-i18next` をインストールします。`ai-i18n-tools` はどちらのパッケージもインストールしません。

`'ai-i18n-tools/runtime'` によってエクスポートされるヘルパーを使用して、i18n セットアップファイルを作成します。API シグネチャについては、「[ランタイムヘルパー](/ja/guide/runtime-helpers)」を参照してください。

<details>
<summary>i18nの完全なブートストラップ例 (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `languagesManifestPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
import stringsJson from './locales/strings.json'; // `ui.stringsJson`
import sourcePluralFlat from './public/locales/en-GB.json'; // `{ui.flatOutputDir}/{SOURCE_LOCALE}.json` from translate-ui

// Must match `sourceLocale` in ai-i18n-tools.config.json (same string as in the import path above)
export const SOURCE_LOCALE = 'en-GB';

// initialise i18n with the default options
void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));

// set up the key-as-default translation
aiI18n.setupKeyAsDefaultT(i18n, {
  stringsJson,
  sourcePluralFlatBundle: { lng: SOURCE_LOCALE, bundle: sourcePluralFlat },
});

// apply the direction to the i18n instance
i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

// create the locale loaders
const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

// create the loadLocale function
export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);

// export the i18n instance
export default i18n;
```

</details>

<a id="keeping-source_locale-aligned"></a>
## `SOURCE_LOCALE` の整合性を維持する

`sourceLocale` はどの言語でもかまいません。以下のスニペットでは、例として `en-GB` を使用しています。**3 つの値を揃えてください:** `ai-i18n-tools.config.json` 内の `sourceLocale`、このファイル内の `SOURCE_LOCALE`、そして `translate-ui` がフラットな出力ディレクトリ (通常は `public/locales/`) 以下に `{sourceLocale}.json` として書き込む複数形のフラット JSON です。静的な `import` でも同じベースネームを使用してください (上記の例: `en-GB` → `en-GB.json`)。`sourcePluralFlatBundle` の `lng` フィールドは `SOURCE_LOCALE` と等しくなければなりません。静的な ES `import` パスは変数を使用できません。ソースロケールを変更する場合は、`SOURCE_LOCALE` とインポートパスを一緒に更新してください。別の方法として、パスが `SOURCE_LOCALE` から構築されるように、動的な `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`、`fetch`、または `readFileSync` を使用してそのファイルをロードします。

このスニペットでは、`i18n` がそれらのフォルダーと同じ階層にあるかのように `./locales/…` と `./public/locales/…` が使用されます。ファイルが `src/` の配下にある場合（典型的なケース）、`ui.stringsJson`、`languagesManifestPath`、`ui.flatOutputDir` と同じパスにインポートが解決されるように、`../locales/…` と `../public/locales/…` を使用してください。

React がレンダリングされる前に `i18n.js` をインポートします (例: エントリ ポイントの先頭)。ユーザーが言語を変更した場合は、`await loadLocale(code)` を呼び出し、次に `await i18n.changeLanguage(code)` を呼び出します。

<a id="startup-locale"></a>
### 起動時のロケール

言語スイッチャー内だけでなく、最初のレンダリングの前に `loadLocale(saved)` を呼び出し、次に `i18n.changeLanguage(saved)` を呼び出してください。[examples/console-app/src/main.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/console-app/src/main.js) は、出力する前にこれを実行します。Next.js では、ハイドレーション後の effect で `localStorage` を読み取ると、最初にソースロケールが描画され、サーバーの HTML と不一致になる可能性があります。サーバーが読み取れる Cookie を使用するか、最初のクライアントレンダリングの前にクライアントモジュールで保存されたロケールをロードすることをお勧めします。

`SOURCE_LOCALE` はエクスポートされているため、他のファイル（たとえば言語切り替えコンポーネント）でも `'./i18n'` から直接インポートできます。既存のi18next設定を移行する場合は、コンポーネント中に散在するハードコードされたソースロケール文字列（例：`'en-GB'` のチェック）を、i18nブートストラップファイルから `SOURCE_LOCALE` をインポートする形に置き換えてください。

名前付きインポート（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）も、デフォルトエクスポートを使わない場合と同じように動作します。

<a id="locale-loaders"></a>
## ロケールローダー

`localeLoaders`を`ui-languages.json`から`makeLocaleLoadersFromManifest`を使用して派生させることで、**設定と同期を保つ**ようにします（これにより、`makeLoadLocale`と同じ正規化を使って`SOURCE_LOCALE`がフィルタリングされます）。`targetLocales`にロケールを追加して`generate-ui-languages`を実行すると、マニフェストが更新され、ローダーが自動的に変更を追跡します。個別のハードコードされたマップを管理する必要はありません。

`public/`配下のJSONバンドル（典型的なNext.jsのセットアップ）では、パブリックURLパスから取得します。

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

バンドラのないNode CLIでは、各コードに対してJSONファイルを読み込んで解析する小さなヘルパー内で`readFileSync`を使用します。

通常のアプリのエントリポイントとして `setupKeyAsDefaultT` を使用します (キーのトリミング + 複数形の `wrapT` + オプションの `translate-ui` `{sourceLocale}.json`)。アプリケーションのワイヤリングで `wrapI18nWithKeyTrim` を単独で呼び出すことは**非推奨**です。詳細については、「[ランタイムヘルパー](/ja/guide/runtime-helpers)」を参照してください。
