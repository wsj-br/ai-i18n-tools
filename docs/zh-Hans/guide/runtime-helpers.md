<a id="runtime-helpers"></a>
# 运行时辅助函数

这些是从 `'ai-i18n-tools/runtime'` 导出的，可以在任何 JavaScript 环境（浏览器、Node.js、Deno、Edge）中使用。它们 **不**从 `i18next` 或 `react-i18next` 导入。

**默认导出**仅为 i18next-helper 命名空间（`defaultI18nInitOptions`、`setupKeyAsDefaultT`、`wrapT`、`makeLoadLocale` 等）。请将 `interpolateTemplate`、`flipUiArrowsForRtl` 和显示帮助器作为**命名导出**导入，它们不是默认导出的属性。

<a id="rtl-helpers"></a>
### RTL 辅助程序

```ts
RTL_LANGS: ReadonlySet<string>
getTextDirection(lng: string): 'ltr' | 'rtl'
applyDirection(lng: string, element?: Element): void
```

<a id="i18next-setup-factories"></a>
### i18next 设置工厂

```ts
defaultI18nInitOptions(sourceLocale?: string): i18nextInitOptions
setupKeyAsDefaultT(i18n: I18nLike & Partial<I18nWithResources>, options: SetupKeyAsDefaultTOptions): void
wrapI18nWithKeyTrim(i18n: I18nLike): void
wrapT(i18n: I18nLike, options: WrapTOptions): void
buildPluralIndexFromStringsJson(entries: Record<string, { plural?: boolean; source?: string }>): Record<string, string>
extractInterpolationNamesForWrap(key: string): string[]
makeLocaleLoadersFromManifest(
  manifest: readonly { code: string }[],
  sourceLocale: string,
  makeLoaderForLocale: (localeCode: string) => () => Promise<unknown>
): Record<string, () => Promise<unknown>>
makeLoadLocale(
  i18n: I18nWithResources,
  localeLoaders: Record<string, () => Promise<unknown>>,
  sourceLocale?: string
): (lang: string) => Promise<void>
```

使用 `setupKeyAsDefaultT` 作为常规应用程序入口点（键修剪 + 复数 `wrapT` + 可选的 `translate-ui` `{sourceLocale}.json`）。单独调用 `wrapI18nWithKeyTrim` 已被 **弃用**，用于应用程序连接。

使用 `makeLocaleLoadersFromManifest(uiLanguages, sourceLocale, …)` 构建 `localeLoaders`，以便在 `generate-ui-languages` 后，键与 `targetLocales` 保持一致。请参阅 `docs/guide/ui-strings/i18next-runtime.md`（运行时连接）、`examples/nextjs-app/`、`examples/console-app/` 和 `examples/astro-website/`（不带 i18next 的自定义 `makeT`）。

<a id="display-helpers"></a>
### 显示辅助程序

```ts
getUILanguageLabel(lang: UiLanguageManifestRow, t: TranslateFn): string
getUILanguageLabelNative(lang: UiLanguageManifestRow): string
```

`UiLanguageManifestRow` 从 `'ai-i18n-tools/runtime'` 导出（形状：`{ code, label, englishName, direction }`）。使用它来键入来自 `ui-languages.json` 的清单行。

<a id="string-helpers"></a>
### 字符串辅助程序

```ts
interpolateTemplate(str: string, vars: Record<string, string | number | boolean>): string
flipUiArrowsForRtl(text: string | null | undefined, isRtl: boolean): string | null | undefined
```

`interpolateTemplate` 替换 ```{{name}}``` 占位符，其中 `name` 与 `\w+` 匹配（仅限 ASCII 单词字符）。不支持带空格或连字符的键。
