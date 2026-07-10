<a id="wire-i18next-at-runtime"></a>
# 実行時に i18next をワイヤリングする

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

**3つの値を一致させてください：** `ai-i18n-tools.config.json` 内の `sourceLocale`、このファイル内の `SOURCE_LOCALE`、およびフラット出力ディレクトリ（通常は `public/locales/`）の下に `translate-ui` が作成する複数形対応のフラットJSON `{sourceLocale}.json`。静的 `import` 内でも同じベースネームを使用してください（上記の例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 内の `lng` フィールドは `SOURCE_LOCALE` と等しくなければなりません。静的なES `import` のパスには変数を使用できません。ソースロケールを変更する場合は、`SOURCE_LOCALE` とインポートパスを同時に更新してください。あるいは、動的な `import(\`./public/locales/${SOURCE_LOCALE}.json\`)`、`fetch`、または `readFileSync` を使ってファイルを読み込み、パスを `SOURCE_LOCALE` から構築する方法もあります。

このスニペットでは、`i18n` がそれらのフォルダーと同じ階層にあるかのように `./locales/…` と `./public/locales/…` が使用されます。ファイルが `src/` の配下にある場合（典型的なケース）、`ui.stringsJson`、`languagesManifestPath`、`ui.flatOutputDir` と同じパスにインポートが解決されるように、`../locales/…` と `../public/locales/…` を使用してください。

React がレンダリングされる前に `i18n.js` をインポートします (例: エントリ ポイントの先頭)。ユーザーが言語を変更した場合は、`await loadLocale(code)` を呼び出し、次に `await i18n.changeLanguage(code)` を呼び出します。

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
