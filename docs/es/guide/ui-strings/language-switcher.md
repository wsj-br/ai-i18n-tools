<a id="language-switcher--rtl"></a>
# Selector de idioma y RTL

<a id="language-switcher-ui"></a>
## Interfaz de usuario del selector de idioma

Utilice el manifiesto `ui-languages.json` para crear un selector de idioma. `ai-i18n-tools` exporta dos ayudantes de visualización; consulte [Ayudantes de tiempo de ejecución → Ayudantes de visualización](/es/guide/runtime-helpers#display-helpers) para ver las firmas.

<details>
<summary>Componente LanguageSelect de ejemplo (React)</summary>

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

`getUILanguageLabel(lang, t)` - muestra `t(englishName)` cuando está traducido, o `englishName / t(englishName)` cuando ambos difieren. Adecuado para pantallas de configuración.

`getUILanguageLabelNative(lang)` - muestra `englishName / label` (sin llamada `t()` en cada fila). Adecuado para menús de cabecera donde desea que el nombre nativo sea visible.

El manifiesto `ui-languages.json` es un array JSON de entradas <code>"{ code, label, englishName, direction }"</code> (`direction` es `"ltr"` o `"rtl"`). Ejemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)",   "englishName": "English (UK)",    "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German",          "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French",          "direction": "ltr" },
  { "code": "ar",    "label": "العربية",           "englishName": "Arabic",          "direction": "rtl" }
]
```

El manifiesto es generado por `generate-ui-languages` o `extract` a partir de `sourceLocale` + `targetLocales` y el catálogo maestro incluido. Se escribe en `languagesManifestPath` (por defecto `{ui.flatOutputDir}/ui-languages.json` cuando se omite). Si cambia las configuraciones regionales en la configuración, ejecute `generate-ui-languages` o `extract` de nuevo para actualizar el archivo.

<a id="rtl-languages"></a>
## Idiomas RTL

`ai-i18n-tools` exporta `getTextDirection(lng)` y `applyDirection(lng)`; consulte [Ayudantes de tiempo de ejecución → Ayudantes RTL](/es/guide/runtime-helpers#rtl-helpers).

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` establece `document.documentElement.dir` (navegador) o es una operación nula (Node.js). Pase un argumento opcional `element` para apuntar a un elemento específico. Conéctelo en su arranque de i18n — [Conectar i18next](/es/guide/ui-strings/i18next-runtime).

Para cadenas que puedan contener flechas `→`, inviértalas en diseños RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
