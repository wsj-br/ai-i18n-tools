<a id="wire-i18next-at-runtime"></a>
# 在运行时连接 i18next

使用 `'ai-i18n-tools/runtime'` 导出的辅助函数创建您的 i18n 设置文件。有关 API 签名，请参阅[运行时辅助函数](/guide/runtime-helpers)。

<details>
<summary>完整的 i18n 引导示例 (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
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
## 保持 `SOURCE_LOCALE` 对齐

**保持三个值对齐：** `sourceLocale` 在 `ai-i18n-tools.config.json` 中，`SOURCE_LOCALE` 在此文件中，以及扁平化 JSON `translate-ui` 在您的扁平化输出目录（通常是 `public/locales/`）下写入为 `{sourceLocale}.json`。在静态 `import` 中使用相同的基本名称（上面的示例：`en-GB` → `en-GB.json`）。`sourcePluralFlatBundle` 中的 `lng` 字段必须等于 `SOURCE_LOCALE`。静态 ES `import` 路径不能使用变量；如果您更改源语言环境，请同时更新 `SOURCE_LOCALE` 和导入路径。或者，使用动态 `import(\` 加载该文件。/public/locales/${SOURCE_LOCALE}.json\`)`、`fetch` 或 `readFileSync`，以便路径从 `SOURCE_LOCALE` 构建。

该代码段使用 `./locales/…` 和 `./public/locales/…`，就好像 `i18n` 位于这些文件夹旁边一样。如果您的文件位于 `src/`（典型情况）下，请使用 `../locales/…` 和 `../public/locales/…`，以便导入解析到与 `ui.stringsJson`、`uiLanguagesPath` 和 `ui.flatOutputDir` 相同的路径。

在 React 渲染之前导入 `i18n.js`（例如，在入口点的顶部）。当用户更改语言时，调用 `await loadLocale(code)` 然后调用 `await i18n.changeLanguage(code)`。

`SOURCE_LOCALE` 被导出，因此任何需要它的其他文件（例如语言切换器）都可以直接从 `'./i18n'` 导入。如果您正在迁移现有的 i18next 设置，请用从您的 i18n 引导文件中导入 `SOURCE_LOCALE` 来替换任何硬编码的源语言环境字符串（例如，分布在组件中的 `'en-GB'` 检查）。

如果您不希望使用默认导出，命名导入（`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`）的工作方式相同。

<a id="locale-loaders"></a>
## 区域设置加载器

通过使用 `makeLocaleLoadersFromManifest` 从 `ui-languages.json` 派生它们，将 `localeLoaders` **与配置对齐**（这会使用与 `makeLoadLocale` 相同的规范化方法过滤掉 `SOURCE_LOCALE`）。当您将语言环境添加到 `targetLocales` 并运行 `generate-ui-languages` 时，清单会更新，并且您的加载器会自动跟踪更改 — 无需维护单独的硬编码映射。

对于 `public/` 下的 JSON 包（典型的 Next.js 设置），请从您的公共 URL 路径获取：

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

对于没有打包器的 Node CLI，请在小的辅助函数中使用 `readFileSync`，该函数为每个代码读取和解析 JSON 文件。

使用 `setupKeyAsDefaultT` 作为常规应用程序入口点（键修剪 + 复数 `wrapT` + 可选 `translate-ui` `{sourceLocale}.json`）。单独调用 `wrapI18nWithKeyTrim` 进行应用程序连接已**弃用** — 请参阅[运行时辅助函数](/guide/runtime-helpers)。
