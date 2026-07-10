<a id="language-switcher--rtl"></a>
# 언어 전환기 및 RTL

<a id="language-switcher-ui"></a>
## 언어 전환기 UI

언어 선택기를 빌드하려면 `ui-languages.json` 매니페스트를 사용하세요. `ai-i18n-tools`는 두 가지 표시 도우미를 내보냅니다. 서명은 [런타임 도우미 → 표시 도우미](/guide/runtime-helpers#display-helpers)를 참조하세요.

<details>
<summary>LanguageSelect 컴포넌트 예제(React)</summary>

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

`getUILanguageLabel(lang, t)` - 번역되었을 때 `t(englishName)`을 표시하고, 두 값이 다를 경우 `englishName / t(englishName)`를 표시합니다. 설정 화면에 적합합니다.

`getUILanguageLabelNative(lang)` - `englishName / label`을 표시합니다(`t()` 호출 없이 각 행에 대해). 헤더 메뉴에서 네이티브 이름을 표시하고자 할 때 적합합니다.

`ui-languages.json` 매니페스트는 <code>"{ code, label, englishName, direction }"</code> 항목의 JSON 배열입니다 (`direction`은 `"ltr"` 또는 `"rtl"`입니다). 예:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

매니페스트는 `generate-ui-languages` 또는 `extract`에 의해 `sourceLocale` + `targetLocales` 및 번들된 마스터 카탈로그에서 생성됩니다. `languagesManifestPath`에 작성됩니다(생략 시 기본값은 `{ui.flatOutputDir}/ui-languages.json`). 구성에서 로케일을 변경한 경우, 파일을 갱신하려면 `generate-ui-languages` 또는 `extract`을 다시 실행하세요.

<a id="rtl-languages"></a>
## RTL 언어

`ai-i18n-tools`는 `getTextDirection(lng)` 및 `applyDirection(lng)`를 내보냅니다. [런타임 도우미 → RTL 도우미](/guide/runtime-helpers#rtl-helpers)를 참조하세요.

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection`는 `document.documentElement.dir`(브라우저)를 설정하거나 아무 작업도 수행하지 않습니다(Node.js). 특정 요소를 대상으로 하려면 선택적 `element` 인수를 전달하세요. i18n 부트스트랩에 연결하세요. [i18next 연결](/guide/ui-strings/i18next-runtime).

`→` 화살표를 포함할 수 있는 문자열의 경우 RTL 레이아웃에 맞춰 방향을 반전하세요:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
