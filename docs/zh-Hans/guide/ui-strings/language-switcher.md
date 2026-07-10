<a id="language-switcher--rtl"></a>
# 语言切换器和RTL

<a id="language-switcher-ui"></a>
## 语言切换器UI

使用 `ui-languages.json` 清单构建语言选择器。`ai-i18n-tools` 导出两个显示帮助器 — 有关签名，请参阅 [运行时帮助器 → 显示帮助器](/zh-Hans/guide/runtime-helpers#display-helpers)。

<details>
<summary>示例 LanguageSelect 组件（React）</summary>

```tsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUILanguageLabel,
  getUILanguageLabelNative,
  type UiLanguageManifestRow,
} from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import { loadLocale } from './i18n';

function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const options = useMemo(
    () =>
      (uiLanguages as UiLanguageManifestRow[]).map((lang) => ({
        code: lang.code,
        // Settings/content dropdowns: shows translated name when available
        label: getUILanguageLabel(lang, t),
        // Header globe menu: shows "English / Deutsch"-style label, no t() call
        nativeLabel: getUILanguageLabelNative(lang),
      })),
    [t]
  );

  const handleChange = async (code: string) => {
    await loadLocale(code);
    await i18n.changeLanguage(code);
    onChange(code);
  };

  return (
    <select value={value} onChange={(e) => handleChange(e.target.value)}>
      {options.map((row) => (
        <option key={row.code} value={row.code}>
          {row.label}
        </option>
      ))}
    </select>
  );
}
```

</details>

<br />

`getUILanguageLabel(lang, t)` — 当翻译时显示 `t(englishName)`，或者当两者不同时显示 `englishName / t(englishName)`。适用于设置屏幕。

`getUILanguageLabelNative(lang)` — 显示 `englishName / label`（每行不调用 `t()`）。适用于您希望显示原生名称的标题菜单。

`ui-languages.json` 清单是一个 JSON 数组，其中包含 <code>"{ code, label, englishName, direction }"</code> 条目（`direction` 是 `"ltr"` 或 `"rtl"`）。示例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

清单由 `generate-ui-languages` 或 `extract` 基于 `sourceLocale` + `targetLocales` 以及打包的主目录生成。它会被写入 `languagesManifestPath`（省略时默认为 `{ui.flatOutputDir}/ui-languages.json`）。如果在配置中更改了区域设置，请再次运行 `generate-ui-languages` 或 `extract` 以刷新该文件。

<a id="rtl-languages"></a>
## RTL 语言

`ai-i18n-tools` 导出 `getTextDirection(lng)` 和 `applyDirection(lng)` — 有关签名，请参阅 [运行时帮助器 → RTL 帮助器](/zh-Hans/guide/runtime-helpers#rtl-helpers)。

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` 设置 `document.documentElement.dir`（浏览器）或不执行任何操作（Node.js）。传递可选的 `element` 参数以定位特定元素。在您的 i18n 引导程序中连接它 — [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime)。

对于可能包含 `→` 箭头的字符串，请在从右到左的布局中翻转它们：

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
