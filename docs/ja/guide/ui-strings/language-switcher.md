<a id="language-switcher--rtl"></a>
# 言語スイッチャーとRTL

<a id="language-switcher-ui"></a>
## 言語スイッチャーUI

言語セレクターを構築するには、`ui-languages.json` マニフェストを使用します。`ai-i18n-tools` は2つの表示ヘルパーをエクスポートします。署名については、[ランタイムヘルパー → 表示ヘルパー](/guide/runtime-helpers#display-helpers) を参照してください。

<details>
<summary>LanguageSelectコンポーネントの例 (React)</summary>

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

`getUILanguageLabel(lang, t)` - 翻訳されている場合は`t(englishName)`を表示し、両方が異なる場合は`englishName / t(englishName)`を表示します。設定画面に適しています。

`getUILanguageLabelNative(lang)` - `englishName / label`を表示します（各行で`t()`呼び出しはありません）。ネイティブ名を表示したいヘッダーメニューに適しています。

`ui-languages.json`マニフェストは<code>"{ code, label, englishName, direction }"</code>エントリのJSON配列です（`direction`は`"ltr"`または`"rtl"`です）。例：

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

マニフェストは、`sourceLocale` + `targetLocales` とバンドルされたマスターカタログから `generate-ui-languages` によって生成されます。これは `uiLanguagesPath` に書き込まれます（必須）。設定でロケールを変更した場合は、`generate-ui-languages` を再度実行してファイルを更新してください。

<a id="rtl-languages"></a>
## RTL言語

`ai-i18n-tools` は `getTextDirection(lng)` と `applyDirection(lng)` をエクスポートします。詳細については、[ランタイムヘルパー → RTLヘルパー](/guide/runtime-helpers#rtl-helpers) を参照してください。

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` は `document.documentElement.dir` を設定します（ブラウザの場合）。または、何もしません（Node.jsの場合）。特定の要素をターゲットにするには、オプションの `element` 引数を渡します。i18nブートストラップでこれを接続します — [i18nextを接続する](/guide/ui-strings/i18next-runtime)。

`→`矢印を含む可能性のある文字列については、RTLレイアウト用に反転します。

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
