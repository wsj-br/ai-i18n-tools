<a id="wire-i18next-at-runtime"></a>
# Conectar i18next en tiempo de ejecución

Cree su archivo de configuración i18n utilizando los asistentes exportados por `'ai-i18n-tools/runtime'`. Para ver las firmas de la API, consulte [Asistentes en tiempo de ejecución](/guide/runtime-helpers).

<details>
<summary>Ejemplo completo de inicialización i18n (src/i18n.js)</summary>

```js
// src/i18n.js or src/i18n.ts — use ../locales and ../public/locales instead of ./ when this file is under src/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';

// Project locale files — paths must match `ui` in ai-i18n-tools.config.json (paths there are relative to the project root).
import uiLanguages from './locales/ui-languages.json'; // `ui.uiLanguagesPath` (defaults to `{ui.flatOutputDir}/ui-languages.json`)
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
## Mantener `SOURCE_LOCALE` alineado

**Mantenga alineados tres valores:** `sourceLocale` en `ai-i18n-tools.config.json`, `SOURCE_LOCALE` en este archivo, y el JSON plano plural que `translate-ui` escribe como `{sourceLocale}.json` en su directorio de salida plano (habitualmente `public/locales/`). Use el mismo nombre base en el `import` estático (ejemplo anterior: `en-GB` → `en-GB.json`). El campo `lng` en `sourcePluralFlatBundle` debe ser igual a `SOURCE_LOCALE`. Las rutas de ES estáticas `import` no pueden usar variables; si cambia el idioma fuente, actualice `SOURCE_LOCALE` y la ruta de importación conjuntamente. Alternativamente, cargue ese archivo con un `import(\` dinámico ./public/locales/${SOURCE_LOCALE}.json\`)`, `fetch`, o `readFileSync` para que la ruta se construya a partir de `SOURCE_LOCALE`.

El fragmento usa `./locales/…` y `./public/locales/…` como si `i18n` estuviera junto a esas carpetas. Si su archivo está bajo `src/` (típico), use `../locales/…` y `../public/locales/…` para que las importaciones resuelvan a las mismas rutas que `ui.stringsJson`, `uiLanguagesPath` y `ui.flatOutputDir`.

Importa `i18n.js` antes de que React renderice (por ejemplo, al principio de tu punto de entrada). Cuando el usuario cambie de idioma, llama a `await loadLocale(code)` y luego a `await i18n.changeLanguage(code)`.

`SOURCE_LOCALE` se exporta para que cualquier otro archivo que lo necesite (por ejemplo, un selector de idioma) pueda importarlo directamente desde `'./i18n'`. Si estás migrando una configuración existente de i18next, reemplaza cualquier cadena de configuración regional fuente escrita directamente (por ejemplo, comprobaciones `'en-GB'` dispersas en los componentes) por importaciones de `SOURCE_LOCALE` desde tu archivo de inicialización de i18n.

Las importaciones nombradas (`import { defaultI18nInitOptions, … } from 'ai-i18n-tools/runtime'`) funcionan igual si prefieres no usar la exportación por defecto.

<a id="locale-loaders"></a>
## Cargadores de configuración regional

Mantenga `localeLoaders` **alineado con la configuración** derivándolos de `ui-languages.json` usando `makeLocaleLoadersFromManifest` (esto filtra `SOURCE_LOCALE` usando la misma normalización que `makeLoadLocale`). Cuando añade una configuración regional a `targetLocales` y ejecuta `generate-ui-languages`, el manifiesto se actualiza y sus cargadores siguen automáticamente el cambio; no es necesario mantener un mapa codificado por separado.

Para paquetes JSON bajo `public/` (la configuración típica de Next.js), obtenga los datos desde su ruta URL pública:

```js
(code) => () => fetch(`/locales/${code}.json`).then(res => res.json())
```

Para CLIs en Node sin empaquetador, use `readFileSync` dentro de un pequeño ayudante que lea y analice el archivo JSON para cada código.

Utilice `setupKeyAsDefaultT` como el punto de entrada habitual de la aplicación (recorte de clave + plural `wrapT` + `translate-ui` `{sourceLocale}.json` opcional). Llamar a `wrapI18nWithKeyTrim` solo está **obsoleto** para la conexión de aplicaciones; consulte [Asistentes en tiempo de ejecución](/guide/runtime-helpers).
