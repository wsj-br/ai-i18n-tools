<a id="add-i18n-to-a-jsts-app"></a>
# Agregar i18n a una aplicación JS/TS

Esta página es para una aplicación JS/TS (React, Next.js, Node o una CLI) cuyos botones, etiquetas y mensajes aún son texto sin formato en el idioma de origen. `extract` registra una cadena de interfaz de usuario solo cuando es un literal de cadena dentro de `t()` o `i18n.t()`, por lo que hoy el catálogo estaría vacío y `translate-ui` no tendría nada que traducir.

Los pasos: instalar la herramienta, instalar i18next, ejecutar `extract` una vez, añadir un pequeño archivo de configuración para que `t` exista, encapsular el texto visible para el usuario y luego traducir. ¿No estás seguro de que este sea tu caso? Consulta [¿No es tu caso?](#not-your-case) al final.

<a id="install-and-choose-a-provider"></a>
## Instalar la herramienta y establecer la clave

Instala la CLI ([Instalación](/es/guide/installation)) y establece la clave API para tu proveedor ([Proveedor y clave API](/es/guide/quick-start#provider-and-api-key)). Ollama no necesita clave.

<a id="initialise-the-project"></a>
## Inicializar la configuración

```bash
ai-i18n-tools init -P openrouter
```

Esto escribe `ai-i18n-tools.config.json`. Cuatro claves son importantes por ahora:

- `sourceLocale`: el idioma en el que está escrito tu texto. Cualquier idioma es válido. El inglés es un ejemplo común en esta guía.
- `targetLocales`: los idiomas a añadir.
- `ui.sourceRoots`: las carpetas que `extract` escanea, por ejemplo `src/`.
- `ui.stringsJson` y `ui.flatOutputDir`: dónde se escriben el catálogo y los archivos por configuración regional.

Todas las demás claves están en [Configuración](/es/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Instalar las bibliotecas de tiempo de ejecución

ai-i18n-tools no depende de `i18next` o `react-i18next`. La aplicación las instala.

- Cada aplicación JS/TS que busca cadenas en tiempo de ejecución: `i18next`.
- Componentes de React que llaman a `useTranslation()`: `react-i18next` también.

```bash
pnpm add i18next
# React components:
pnpm add react-i18next
```

<a id="review-the-result"></a>
## Ejecutar la extracción una vez

```bash
ai-i18n-tools extract
```

El archivo de configuración del siguiente paso importa `strings.json` y `ui-languages.json`, y solo `extract` los escribe. Escribe ambos incluso cuando no encuentra llamadas a `t()`, para que la aplicación compile. Espera 0 cadenas, o 1 si tu `package.json` tiene un `description`, porque el extractor lo incluye por defecto (`ui.uiExtractor.includePackageDescription`).

<a id="choose-models-and-translate"></a>
## Añadir el bootstrap

Crea el archivo de configuración de i18n. Esta versión mínima es suficiente para encapsular cadenas y traducirlas. `SOURCE_LOCALE` debe ser igual a `sourceLocale` en `ai-i18n-tools.config.json`.

```js
// src/i18n.js — adjust the import paths to match `ui` in your config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import aiI18n from 'ai-i18n-tools/runtime';
import uiLanguages from './locales/ui-languages.json';
import stringsJson from './locales/strings.json';

export const SOURCE_LOCALE = 'en-GB';

void i18n.use(initReactI18next).init(aiI18n.defaultI18nInitOptions(SOURCE_LOCALE));
aiI18n.setupKeyAsDefaultT(i18n, { stringsJson });

i18n.on('languageChanged', aiI18n.applyDirection);
aiI18n.applyDirection(i18n.language);

const localeLoaders = aiI18n.makeLocaleLoadersFromManifest(
  uiLanguages,
  SOURCE_LOCALE,
  (code) => () => import(`./locales/${code}.json`),
);

export const loadLocale = aiI18n.makeLoadLocale(i18n, localeLoaders, SOURCE_LOCALE);
export default i18n;
```

¿No usas React? Elimina la importación de `react-i18next` y la llamada a `.use(initReactI18next)`.

Cuando la aplicación empiece a usar plurales, añade el archivo plano de la configuración regional de origen para que las formas plurales se resuelvan. Eso añade una tercera importación y una opción `sourcePluralFlatBundle`, mostrado en [Configurar i18next](/es/guide/ui-strings/i18next-runtime).

Importa este archivo desde la entrada de la aplicación antes del primer renderizado. En Next.js, impórtalo desde un módulo cliente, el mismo patrón que [examples/nextjs-app/src/lib/i18n.ts](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/lib/i18n.ts).

<a id="check-one-language"></a>
## Reemplazar texto codificado

Haz esto manualmente, o pega el [prompt de JS/TS](#run-the-agent-prompt) en un agente de codificación. El argumento de `t()` es la frase en el idioma de origen que el usuario debería ver. Los archivos de configuración regional planos se indexan por esa frase.

<details class="agent-prompt" id="agent-prompt">
<summary>Prompt del agente JS/TS</summary>

Copia esto en Cursor o en otro agente de codificación. Envuelve los literales orientados al usuario. No los traduce.

````markdown
# Wrap user-facing JS/TS strings in t()

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `i18n.t()`. The
literal is the source-language sentence and the catalog key (`t("Save")`, not
`t("saveButton")`). After this edit the app must behave the same when the active
locale is the source locale. Do not translate any string.

Bootstrap and call-shape reference:
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/i18next-runtime
https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/t-calls-and-plurals

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit only those trees
(JS/JSX/TS/TSX). Skip `className`, URLs and routes, import paths, ids, test ids,
enum and error codes, object keys used as identifiers, log field names, CSS,
regexes, comments, and text that is already inside `t()` or `i18n.t()`.

## Call shape

Install `i18next`. Install `react-i18next` when a component uses
`useTranslation()`. Run `ai-i18n-tools extract` once so `strings.json` and
`ui-languages.json` exist, then add the bootstrap from the Wire i18next guide.
`SOURCE_LOCALE` must equal config `sourceLocale`.

- React components: `const { t } = useTranslation()` and `{t("Save")}`.
- Module-level constants and non-React files: `i18n.t("…")`. Move a constant
  that would call `t()` at import time into a function or `useMemo(..., [t])`.
- Placeholders: `t("Hello {{name}}", { name })`. No template literal as a key.
- Plurals: `t("{{count}} items", { plurals: true, count })`.
- Next.js: import the bootstrap from a client module before render. Do not call
  `changeLanguage` on a shared i18next instance inside a server component. Use a
  per-request `createInstance()`, or a stateless flat-bundle lookup.

Before:

```jsx
<button>Save</button>
```

After:

```jsx
<button>{t("Save")}</button>
```

Before:

```js
console.log(`Hello ${name}`);
```

After:

```js
console.log(t("Hello {{name}}", { name }));
```

## Order

1. Install the libraries.
2. Run `ai-i18n-tools extract` once.
3. Add the bootstrap.
4. Wrap call sites.
5. Run `ai-i18n-tools extract` again. Do not run a translation yourself and do
   not hand-edit catalogs.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys (`saveButton`, `nav.home`).
- Do not hand-edit `strings.json`, flat locale JSON, or `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog of the sentences you
  wrapped.
- The project's build, type check, and tests pass.
- With the source locale active, every wrapped string still shows the original
  sentence. Switch one target locale after `translate-ui` and confirm those
  sentences change.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case you left for a human (the same word used with different
meanings, concatenated sentences, or a plural you were not sure about).
````

</details>

JSX:

```jsx
<button>Save</button>
<button>{t("Save")}</button>
```

Node, una CLI o cualquier módulo que no sea de React:

```js
console.log(`Hello ${name}`);
console.log(t("Hello {{name}}", { name }));
```

Reglas (también en [llamadas a t() y plurales](/es/guide/ui-strings/t-calls-and-plurals)):

- La clave es un literal. `t(variable)` y <code>{'t(`Hello ${name}`)'}</code> no se extraen, y las llamadas no literales se omiten sin advertencia.
- Los marcadores de posición dentro del literal usan el formato de i18next <code v-pre>{{name}}</code>, pasados en el segundo argumento.
- Plurales: una frase de origen más `{ plurals: true, count }`. Consulta [Plurales cardinales](/es/guide/ui-strings/t-calls-and-plurals#cardinal-plurals-plurals-true). No inventes claves `_one` / `_other` tú mismo.
- Los componentes de React toman `t` de `useTranslation()`. Otros archivos llaman a `i18n.t`. Una constante evaluada en el momento de la importación debe moverse a una función o a `useMemo(..., [t])`, para que `t()` se ejecute después de que se cargue la configuración regional.
- Los componentes de servidor de Next.js no deben llamar a `changeLanguage` en una instancia compartida de i18next. Las solicitudes concurrentes comparten ese singleton. Usa un `createInstance()` por solicitud, o una búsqueda sin estado del paquete plano (consulta el [híbrido de Nextra](/es/guide/integrations/nextra#optional-t-for-app-react-hybrid)).

Deja esto como está: `className`, `href` y otras URL, rutas de importación, ID, ID de prueba, códigos de error, claves de objeto usadas como identificadores y texto dentro de los comentarios.

<a id="keep-it-translated"></a>
## Extraer y traducir

Cuando los literales estén en su lugar:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`sync` ejecuta `extract` y `translate-ui` juntos cuando `features.translateUIStrings` está activado. `extract` debería ahora listar las frases que has envuelto. Abre un archivo de configuración regional generado en `ui.flatOutputDir` y confirma que las traducciones están ahí. A continuación: [Cadenas de interfaz de usuario, Paso 2](/es/guide/ui-strings/#step-2-extract-strings) para lo que `extract` escanea y escribe.

[examples/console-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/console-app) es una pequeña aplicación de Node cuyo `src/main.js` ya está envuelto. El ejemplo de Next.js es el bootstrap de React.

<a id="do-it-by-hand"></a>
## Cambio de idioma

Restaura una configuración regional guardada antes del primer renderizado, como se describe en [Configurar i18next](/es/guide/ui-strings/i18next-runtime#startup-locale). Luego añade un control que llame a `await loadLocale(code)` seguido de `await i18n.changeLanguage(code)`: [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher).

<a id="step-1-install-the-runtime-libraries"></a>
## Mantenerlo traducido

Vuelve a ejecutar `sync` después de cambiar el texto de origen. La caché significa que solo las cadenas nuevas o modificadas van al modelo. Añade los scripts de [Scripts recomendados para package.json](/es/guide/quick-start#recommended-packagejson-scripts), y ejecuta `sync` en CI para que las traducciones no se desvíen.

La plantilla predeterminada de `init` también traduce `README.md`. Consulta [Añadir i18n a tu README y documentos Markdown](/es/guide/add-i18n-to-readme).

<a id="step-2-extract-once-and-add-the-bootstrap"></a>
## Viniendo de otra herramienta

ai-i18n-tools incluye su propio extractor de cadenas. Si usaste `i18next-scanner`, `babel-plugin-i18next-extract` o similar, puedes eliminar esas dependencias de desarrollo después de migrar. Los archivos JSON de espacio de nombres de i18next existentes pueden permanecer en la [canalización JSON](/es/guide/json#i18next-namespace-files). Los diccionarios `.content.ts` de Intlayer se pueden importar con `migrate-intlayer`: consulta [Migrar desde Intlayer](/es/guide/migrating-from-intlayer). Para mantener Intlayer en tiempo de ejecución y solo rellenar sus traducciones, usa `translate-intlayer`: consulta [Traducir Intlayer in situ](/es/guide/translating-intlayer).

<a id="step-3-wrap-strings"></a>
## ¿No es su caso?

| Su código hoy | Leer |
| --- | --- |
| Ya `t("…")` o `i18n.t("…")` con la frase en el idioma de origen | [Cadenas de interfaz de usuario](/es/guide/ui-strings/) pasos 2–3, luego [Conectar i18next](/es/guide/ui-strings/i18next-runtime) |
| JSON del espacio de nombres de i18next (`t("saveButton")` más `en/translation.json`) | [JSON](/es/guide/json). No cambie esas claves por frases en el idioma de origen a menos que esté listo para cambiar cada llamada |
| Diccionarios de Intlayer, migrando de Intlayer | [Migrar de Intlayer](/es/guide/migrating-from-intlayer) |
| Diccionarios de Intlayer, manteniendo Intlayer | [Traducir Intlayer in situ](/es/guide/translating-intlayer) |
| Un archivo HTML | [HTML plano](/es/guide/ui-strings/plain-html) y `mark-html` |
| Sitios de documentación o HTML de página de Astro | [Añadir i18n a un sitio web o sitio de documentación](/es/guide/add-i18n-to-website) y [Sitio web de Astro](/es/guide/ui-strings/astro-website). `t()` es solo para datos compartidos y frontmatter |
| Una aplicación Python | [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python) |
| Un archivo README de repositorio u otros archivos Markdown | [Añadir i18n a tus archivos README y de Markdown](/es/guide/add-i18n-to-readme) |
