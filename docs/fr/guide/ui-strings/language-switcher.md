<a id="language-switcher--rtl"></a>
# Sélecteur de langue et RTL

<a id="language-switcher-ui"></a>
## Interface utilisateur du sélecteur de langue

Utilisez le manifeste `ui-languages.json` pour créer un sélecteur de langue. `ai-i18n-tools` exporte deux assistants d'affichage — consultez [Assistants d'exécution → Assistants d'affichage](/fr/guide/runtime-helpers#display-helpers) pour les signatures.

<details>
<summary>Exemple de composant LanguageSelect (React)</summary>

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

`getUILanguageLabel(lang, t)` - affiche `t(englishName)` lorsqu'il est traduit, ou `englishName / t(englishName)` lorsque les deux diffèrent. Convient pour les écrans de paramètres.

`getUILanguageLabelNative(lang)` - affiche `englishName / label` (aucun appel `t()` sur chaque ligne). Convient pour les menus d'en-tête où vous souhaitez que le nom natif soit visible.

Le manifeste `ui-languages.json` est un tableau JSON d'entrées <code>"{ code, label, englishName, direction }"</code> (`direction` est `"ltr"` ou `"rtl"`). Exemple :

```json
[
  { "code": "en-GB", "label": "English (UK)",   "englishName": "English (UK)",    "direction": "ltr" },
  { "code": "pt-BR", "label": "Português (BR)", "englishName": "Portuguese (BR)", "direction": "ltr" },
  { "code": "de",    "label": "Deutsch",        "englishName": "German",          "direction": "ltr" },
  { "code": "fr",    "label": "Français",       "englishName": "French",          "direction": "ltr" },
  { "code": "ar",    "label": "العربية",           "englishName": "Arabic",          "direction": "rtl" }
]
```

Le manifeste est généré par `generate-ui-languages` ou `extract` à partir de `sourceLocale` + `targetLocales` et du catalogue maître groupé. Il est écrit dans `languagesManifestPath` (par défaut `{ui.flatOutputDir}/ui-languages.json` s'il est omis). Si vous modifiez les paramètres régionaux dans la configuration, exécutez à nouveau `generate-ui-languages` ou `extract` pour actualiser le fichier.

<a id="rtl-languages"></a>
## Langues RTL

`ai-i18n-tools` exporte `getTextDirection(lng)` et `applyDirection(lng)` — consultez [Assistants d'exécution → Assistants RTL](/fr/guide/runtime-helpers#rtl-helpers).

```js
import { getTextDirection, applyDirection } from 'ai-i18n-tools/runtime';

getTextDirection('ar')    // 'rtl'
getTextDirection('en-GB') // 'ltr'

// Applied automatically via i18n.on('languageChanged', applyDirection) — see Wire i18next
```

`applyDirection` définit `document.documentElement.dir` (navigateur) ou est une opération nulle (Node.js). Passez un argument `element` facultatif pour cibler un élément spécifique. Connectez-le dans votre amorçage i18n — [Connecter i18next](/fr/guide/ui-strings/i18next-runtime).

Pour les chaînes pouvant contenir des flèches `→`, inversez-les dans les mises en page RTL :

```js
import { flipUiArrowsForRtl } from 'ai-i18n-tools/runtime';
const { i18n } = useTranslation();
const isRtl = getTextDirection(i18n.language) === 'rtl';
const label = flipUiArrowsForRtl(t('Next → Step'), isRtl);
```
