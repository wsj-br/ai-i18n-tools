<a id="runtime-helpers"></a>
# 运行时辅助函数

这些辅助函数从 `'ai-i18n-tools/runtime'` 导出，可在任何 JavaScript 环境中运行（浏览器、Node.js、Deno、Edge）。它们**不会**从 `i18next` 或 `react-i18next` 导入。

在应用引导（`src/i18n.js`）、语言切换器以及任何需要方向或字符串工具的非 React 代码中使用它们。如需端到端连接，请从 [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime) 开始；如需语言菜单和 RTL，请参阅 [语言切换器与 RTL](/zh-Hans/guide/ui-strings/language-switcher)。

<a id="import-patterns"></a>
## 导入模式

**默认导出**仅为 i18next-helper 命名空间（`defaultI18nInitOptions`、`setupKeyAsDefaultT`、`wrapT`、`makeLoadLocale`、…）。请将 `interpolateTemplate`、`flipUiArrowsForRtl`、显示辅助函数和类型作为**命名导出**导入——它们不是默认导出的属性。

```js
// Namespace style (common in i18n bootstrap files)
import aiI18n from 'ai-i18n-tools/runtime';
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

// Named imports (language switcher, one-off utilities)
import {
  getUILanguageLabel,
  getTextDirection,
  type UiLanguageManifestRow,
} from 'ai-i18n-tools/runtime';
```

<a id="quick-reference"></a>
## 快速参考

| 导出 | 作用 |
| --- | --- |
| `defaultI18nInitOptions(sourceLocale?)` | 用于以键作为默认值的设置的 i18next 标准 `init()` 选项。 |
| `setupKeyAsDefaultT(i18n, options)` | **推荐的应用入口点** —— 键修剪包装器、可选的源复数包、支持复数的 `wrapT`。 |
| `wrapT(i18n, options)` | 较低级别的复数 `t()` 包装器（通常由 `setupKeyAsDefaultT` 安装）。 |
| `buildPluralIndexFromStringsJson(entries)` | 使用 `"plural": true` 从 `strings.json` 行构建 `wrapT` 使用的 `literal → groupId` 映射。 |
| `extractInterpolationNamesForWrap(message)` | 从源字符串中解析 <code v-pre>{{var}}</code> 占位符名称。 |
| `wrapI18nWithKeyTrim(i18n)` | 仅键名修剪 + 源语言环境 <code v-pre>{{var}}</code> 回退。**已弃用**于应用配置 — 请使用 `setupKeyAsDefaultT`。 |
| `makeLocaleLoadersFromManifest(manifest, sourceLocale, makeLoader)` | 从 `ui-languages.json` 为 `makeLoadLocale` 构建 `localeLoaders` 映射（除 `sourceLocale` 外的每个 `code`）。 |
| `makeLoadLocale(i18n, loaders, sourceLocale?)` | 通过 `addResourceBundle` 异步加载语言环境 JSON 的工厂。 |
| `RTL_LANGS` | RTL 基础语言代码的只读集合（当捆绑目录中缺少某个语言环境时的回退）。 |
| `getTextDirection(lng)` | 为 BCP-47 代码返回 `'ltr'` 或 `'rtl'`。 |
| `applyDirection(lng, element?)` | 在 `document.documentElement`（浏览器）或自定义元素上设置 `dir` 属性。 |
| `getUILanguageLabel(lang, t)` | 翻译时使用 `t(englishName)` 的语言菜单标签。 |
| `getUILanguageLabelNative(lang)` | 仅来自清单字段的语言菜单标签（`englishName / label`）。 |
| `interpolateTemplate(str, vars)` | 对纯字符串进行低级 <code v-pre>{{var}}</code> 替换（在 React/i18next 中优先使用 `t()`）。 |
| `flipUiArrowsForRtl(text, isRtl)`                                      | 为 RTL 布局将 `→` 翻转为 `←`。                                                                                                       |

<a id="rtl-helpers"></a>
### RTL 辅助程序

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: { setAttribute(name: string, value: string): void }): void
```

`getTextDirection` 首先查阅捆绑的 `data/ui-languages-complete.json` 目录（与 `generate-ui-languages` 来源相同），然后对于目录中没有的代码回退到 `RTL_LANGS`。

`applyDirection` 在 Node.js 中是安全的 —— 当 `document` 不可用时它会空操作。在浏览器中，省略 `element` 以更新 `document.documentElement`。在语言更改时连接它：`i18n.on('languageChanged', applyDirection)`。

<a id="i18next-setup-factories"></a>
### i18next 设置工厂

```ts
defaultI18nInitOptions(sourceLocale?: string): {
  resources: Record<string, never>;
  lng: string;
  fallbackLng: string;
  parseMissingKeyHandler: (key: string) => string;
  interpolation: { escapeValue: false };
  nsSeparator: false;
}

setupKeyAsDefaultT(
  i18n: I18nLike & Partial<Pick<I18nWithResources, 'addResourceBundle'>>,
  options: SetupKeyAsDefaultTOptions
): void

// SetupKeyAsDefaultTOptions:
// {
//   stringsJson: Record<string, { plural?: boolean; source?: string }>;
//   sourcePluralFlatBundle?: { lng: string; bundle: Record<string, string> };
// }

wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
// WrapTOptions: { pluralIndex: Record<string, string> }

buildPluralIndexFromStringsJson(
  entries: Record<string, { plural?: boolean; source?: string }>
): Record<string, string>

extractInterpolationNamesForWrap(message: string): string[]

makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>

makeLoadLocale(
  i18n: I18nLike & Pick<I18nWithResources, 'addResourceBundle'>,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

使用 `setupKeyAsDefaultT` 作为常规应用程序入口点（键修剪 + 复数 `wrapT` + 可选的 `translate-ui` `{sourceLocale}.json`）。单独调用 `wrapI18nWithKeyTrim` 已被 **弃用**，用于应用程序连接。

`sourcePluralFlatBundle` 需要一个带有 `addResourceBundle()` 的 i18next 实例。`lng` 字段必须与你的引导文件中的 `SOURCE_LOCALE` 以及 `ai-i18n-tools.config.json` 中的 `sourceLocale` 相匹配。

使用 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` 构建 `localeLoaders`，以便在 `generate-ui-languages` 之后键与 `targetLocales` 保持对齐。参见 [接入 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)、[nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)、[console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app/) 和 [astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)（不使用 i18next 的自定义 `makeT`）。

<a id="display-helpers"></a>
### 显示辅助程序

```ts
type TranslateFn = (key: string) => string

getUILanguageLabel(lang: UiLanguageManifestRow & { englishName: string }, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow & { englishName: string; label: string }): string
```

`UiLanguageManifestRow` 以 `{ readonly code: string }` 的形式导出——这是 `makeLocaleLoadersFromManifest` 中清单行的最小结构。显示辅助函数还需要来自你项目的 `ui-languages.json` 条目（`{ code, label, englishName, direction }`）的 `englishName`（以及用于 `getUILanguageLabelNative` 的 `label`）。完整示例参见 [语言切换器与 RTL](/zh-Hans/guide/ui-strings/language-switcher#language-switcher-ui)。

<a id="string-helpers"></a>
### 字符串辅助程序

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` 替换 <code v-pre>{{name}}</code> 占位符，其中 `name` 匹配 `\w+`（仅限 ASCII 单词字符）。不支持包含空格或连字符的键。当不存在翻译时，`wrapI18nWithKeyTrim` 在内部使用此方法进行源语言环境回退。

在 React/i18next 组件中，优先使用 <code v-pre>t('key {{var}}', { var })</code> — i18next 原生处理插值。

<a id="exported-types"></a>
### 导出的类型

还为 TypeScript 使用者导出了：`I18nLike`、`I18nWithResources`、`SetupKeyAsDefaultTOptions`、`WrapTOptions`、`UiLanguageManifestRow`、`TranslateFn`。
