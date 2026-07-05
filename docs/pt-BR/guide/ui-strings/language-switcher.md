<a id="language-switcher--rtl"></a>
# Seletor de idioma e RTL

<a id="language-switcher-ui"></a>
## UI do seletor de idioma

Use o manifesto `ui-languages.json` para construir um seletor de idioma. `ai-i18n-tools` exporta dois auxiliares de exibição — consulte [Auxiliares de tempo de execução → Auxiliares de exibição](/guide/runtime-helpers#display-helpers) para assinaturas.

<details>
<summary>Componente LanguageSelect de exemplo (React)</summary>

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

`getUILanguageLabel(lang, t)` - mostra `t(englishName)` quando traduzido, ou `englishName / t(englishName)` quando ambos diferem. Adequado para telas de configurações.

`getUILanguageLabelNative(lang)` - mostra `englishName / label` (sem chamada `t()` em cada linha). Adequado para menus de cabeçalho onde você deseja que o nome nativo seja visível.

O manifesto `ui-languages.json` é uma matriz JSON de entradas <code>"{ code, label, englishName, direction }"</code> (`direction` é `"ltr"` ou `"rtl"`). Exemplo:

```json
[
  { "code": "en-GB", "label": "English (UK)", "englishName": "English (UK)", "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German", "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French", "direction": "ltr" },
  { "code": "ar",    "label": "العربية",         "englishName": "Arabic", "direction": "rtl" }
]
```

O manifesto é gerado por `generate-ui-languages` a partir de `sourceLocale` + `targetLocales` e do catálogo mestre empacotado. Ele é gravado em `uiLanguagesPath` (obrigatório). Se você alterar as localidades na configuração, execute `generate-ui-languages` novamente para atualizar o arquivo.

<a id="rtl-languages"></a>
## Idiomas RTL

`ai-i18n-tools` exporta `getTextDirection(lng)` e `applyDirection(lng)` — consulte [Auxiliares de tempo de execução → Auxiliares RTL](/guide/runtime-helpers#rtl-helpers).

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` define `document.documentElement.dir` (navegador) ou é uma operação nula (Node.js). Passe um argumento `element` opcional para direcionar um elemento específico. Conecte-o em seu bootstrap i18n — [Conectar i18next](/guide/ui-strings/i18next-runtime).

Para strings que podem conter setas `→`, inverta-as para layouts RTL:

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
