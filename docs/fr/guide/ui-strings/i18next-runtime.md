<a id="wire-i18next-at-runtime"></a>
# Câbler i18next à l'exécution

Créez votre fichier de configuration i18n à l'aide des assistants exportés par `'ai-i18n-tools/runtime'`. Pour les signatures d'API, consultez [Assistants d'exécution](/guide/runtime-helpers).

<details>
<summary>Exemple complet d'initialisation i18n (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `languagesManifestPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
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
## Maintenir l'alignement de `SOURCE_LOCALE`

**Gardez trois valeurs alignées :** `sourceLocale` dans `ai-i18n-tools.config.json`, `SOURCE_LOCALE` dans ce fichier, et le JSON plat pluriel que `translate-ui` écrit comme `{sourceLocale}.json` dans votre répertoire de sortie plat (souvent `public/locales/`). Utilisez ce même nom de base dans le fichier statique `import` (exemple ci-dessus : `en-GB` → `en-GB.json`). Le champ `lng` dans `sourcePluralFlatBundle` doit être égal à `SOURCE_LOCALE`. Les chemins ES statiques `import` ne peuvent pas utiliser de variables ; si vous modifiez la langue source, mettez à jour `SOURCE_LOCALE` et le chemin d'importation ensemble. Sinon, chargez ce fichier avec un `import(\` dynamique ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, ou `readFileSync` afin que le chemin soit construit à partir de `SOURCE_LOCALE`.

L'extrait utilise `./locales/…` et `./public/locales/…` comme si `i18n` se trouvait à côté de ces dossiers. Si votre fichier se trouve sous `src/` (cas typique), utilisez `../locales/…` et `../public/locales/…` afin que les importations se résolvent aux mêmes chemins que `ui.stringsJson`, `languagesManifestPath` et `ui.flatOutputDir`.

Importez `i18n.js` avant que React ne rende le composant (par exemple, en haut de votre point d'entrée). Lorsque l'utilisateur change de langue, appelez `await loadLocale(code)` puis `await i18n.changeLanguage(code)`.

`SOURCE_LOCALE` est exporté afin que tout autre fichier qui en a besoin (par exemple, un sélecteur de langue) puisse l'importer directement depuis `'./i18n'`. Si vous migrez une configuration i18next existante, remplacez toutes les chaînes de langue source en dur (par exemple, des vérifications comme `'en-GB'` disséminées dans les composants) par des importations de `SOURCE_LOCALE` depuis votre fichier d'initialisation i18n.

Les importations nommées (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) fonctionnent de la même manière si vous préférez ne pas utiliser l'export par défaut.

<a id="locale-loaders"></a>
## Chargeurs de paramètres régionaux

Gardez `localeLoaders` **synchronisé avec la configuration** en les dérivant de `ui-languages.json` à l'aide de `makeLocaleLoadersFromManifest` (cela filtre `SOURCE_LOCALE` en utilisant la même normalisation que `makeLoadLocale`). Lorsque vous ajoutez une langue à `targetLocales` et exécutez `generate-ui-languages`, le manifeste est mis à jour et vos chargeurs suivent automatiquement le changement — il n'est pas nécessaire de maintenir une carte codée en dur séparée.

Pour les paquets JSON situés sous `public/` (configuration Next.js typique), récupérez-les depuis votre chemin d'URL publique :

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Pour les interfaces CLI Node sans emballeur, utilisez `readFileSync` dans une petite fonction d'assistance qui lit et analyse le fichier JSON pour chaque code.

Utilisez `setupKeyAsDefaultT` comme point d'entrée habituel de l'application (key-trim + pluriel `wrapT` + `translate-ui` `{sourceLocale}.json` facultatif). L'appel de `wrapI18nWithKeyTrim` seul est **déprécié** pour le câblage d'applications — voir [Assistants d'exécution](/guide/runtime-helpers).
