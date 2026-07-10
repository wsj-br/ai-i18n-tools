<a id="language-switcher--rtl"></a>
# Sprachumschalter & RTL

<a id="language-switcher-ui"></a>
## UI des Sprachumschalters

Verwenden Sie das `ui-languages.json`-Manifest, um einen Sprachselektor zu erstellen. `ai-i18n-tools` exportiert zwei Anzeigehelfer – siehe [Laufzeithelfer → Anzeigehelfer](/de/guide/runtime-helpers#display-helpers) für Signaturen.

<details>
<summary>Beispielkomponente LanguageSelect (React)</summary>

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

`getUILanguageLabel(lang, t)` – zeigt `t(englishName)` an, wenn übersetzt, andernfalls `englishName / t(englishName)`, wenn beide unterschiedlich sind. Geeignet für Einstellungsseiten.

`getUILanguageLabelNative(lang)` – zeigt `englishName / label` an (kein `t()`-Aufruf pro Zeile). Geeignet für Kopfzeilenmenüs, wenn der native Name sichtbar sein soll.

Das `ui-languages.json`-Manifest ist ein JSON-Array von <code>"{ code, label, englishName, direction }"</code> Einträgen (`direction` ist `"ltr"` oder `"rtl"`). Beispiel:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

Das Manifest wird von `generate-ui-languages` oder `extract` aus `sourceLocale` + `targetLocales` und dem gebündelten Masterkatalog generiert. Es wird in `languagesManifestPath` geschrieben (standardmäßig `{ui.flatOutputDir}/ui-languages.json`, wenn weggelassen). Wenn Sie die Gebietsschemas in der Konfiguration ändern, führen Sie `generate-ui-languages` oder `extract` erneut aus, um die Datei zu aktualisieren.

<a id="rtl-languages"></a>
## RTL-Sprachen

`ai-i18n-tools` exportiert `getTextDirection(lng)` und `applyDirection(lng)` – siehe [Laufzeithelfer → RTL-Helfer](/de/guide/runtime-helpers#rtl-helpers).

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` setzt `document.documentElement.dir` (Browser) oder ist ein No-Op (Node.js). Übergeben Sie ein optionales `element`-Argument, um ein bestimmtes Element anzusprechen. Binden Sie es in Ihr i18n-Bootstrap ein – [i18next einbinden](/de/guide/ui-strings/i18next-runtime).

Für Zeichenketten, die `→`-Pfeile enthalten können, drehen Sie diese in RTL-Layouts um:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
