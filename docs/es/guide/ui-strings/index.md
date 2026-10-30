<a id="ui-strings"></a>
# Cadenas de la interfaz de usuario

Referencia para `extract` y `translate-ui`, la canalización que convierte las llamadas a `t()` en catálogos por configuración regional. ¿Añadiendo i18n a una aplicación por primera vez? Empiece en [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) o [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python). Cubren el paso de encapsulado y luego le remiten aquí para los pasos 2 a 4.

Esta canalización sirve a proyectos JS/TS (componentes de cliente y servidor de React, Next.js, servicios de Node.js, HTML plano, sitios web de Astro y herramientas CLI) y aplicaciones Python. JS/TS busca cadenas con i18next después de que el código fuente llama a `t()`. Python llama a `t()` o gettext a través de un `i18n.py` generado (Django mantiene el gettext de Django).

<a id="which-guide-to-read"></a>
## Qué guía leer

| Su aplicación | Leer a continuación |
| --- | --- |
| JS/TS con cadenas de texto incrustadas, sin `t()` todavía | [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js) |
| React / Next.js / Node, `t()` ya en el código fuente | [Configurar i18next](/es/guide/ui-strings/i18next-runtime) |
| Python (`t()`, `_()`, gettext, Jinja, Django) | [Aplicaciones Python](/es/guide/ui-strings/python). Inicialización: `ui-python`, `ui-python-gettext`, `ui-python-flask`, o `ui-python-django`. Ayudante: `i18n.py`. Para añadir configuraciones regionales a una aplicación existente, consulta [Añadir i18n a una aplicación Python](/es/guide/add-i18n-to-python), o [Añadir i18n a una aplicación Django / Python gettext](/es/guide/add-i18n-to-django-gettext) cuando la aplicación usa gettext. |
| HTML plano (sin `t()` en el marcado) | [Aplicaciones HTML planas](/es/guide/ui-strings/plain-html) |
| Sitio de marketing de Astro (híbrido) | [Sitio web de Astro](/es/guide/ui-strings/astro-website) |
| Reglas de `t()`, interpolación, plurales | [Llamadas a t() y plurales](/es/guide/ui-strings/t-calls-and-plurals) |
| Selector de idioma / RTL | [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher) |
| Firmas de API en tiempo de ejecución | [Ayudantes en tiempo de ejecución](/es/guide/runtime-helpers) |
| Diccionarios Intlayer `.content.ts`, migrando de Intlayer | [Migrar desde Intlayer](/es/guide/migrating-from-intlayer) |
| Diccionarios Intlayer `.content.ts`, manteniendo Intlayer | [Traducir Intlayer in situ](/es/guide/translating-intlayer) |

<a id="step-1-initialise"></a>
## Paso 1: Inicializar

```bash
ai-i18n-tools init -P openrouter
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown` (incluyendo el bloque `provider` / `providers` para ese preajuste). Esa plantilla también activa la traducción de documentos para `README.md`, escritos como archivos planos bajo `translated-docs/`. Los repositorios solo con README usan `init -t docs-markdown` en su lugar. Consulte [Añadir i18n a su README y documentos Markdown](/es/guide/add-i18n-to-readme). Antes de ejecutar `translate-ui` o `sync`, establezca la clave de API para ese proveedor en el entorno o `.env` — excepto Ollama; consulte [Proveedor y clave de API](/es/guide/quick-start#provider-and-api-key). Cuatro claves son importantes para las cadenas de la interfaz de usuario:

- `sourceLocale`: el código BCP-47 del idioma en el que está escrito su texto fuente. Cualquier idioma es válido; `"en-GB"` es solo un ejemplo. Debe coincidir con `SOURCE_LOCALE` exportado desde su archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`). La cadena dentro de `t()` es ese idioma fuente, y los archivos de configuración regional planos lo usan como clave.
- `targetLocales`: códigos BCP-47 para sus idiomas de destino (por ejemplo, `["de", "fr", "pt-BR"]`). Ejecute `generate-ui-languages` para crear el manifiesto `ui-languages.json` a partir de esta lista.
- `ui.sourceRoots`: directorios o patrones glob para escanear en busca de llamadas a `t("…")` (por ejemplo, `["src/"]`).
- `ui.stringsJson` y `ui.flatOutputDir`: dónde se escriben el catálogo maestro y los archivos por configuración regional (`de.json`, `pt-BR.json`).

Todas las demás claves, incluyendo `providers.<active>.uiModels`, se encuentran en [Configuración](/es/reference/configuration).

<a id="step-2-extract-strings"></a>
## Paso 2: Extraer cadenas

`extract` no hace nada útil hasta que existan esas llamadas a `t()` / `i18n.t()`. Encapsule el texto incrustado primero: [Añadir i18n a una aplicación JS/TS](/es/guide/add-i18n-to-js).

```bash
ai-i18n-tools extract
```

Escanea archivos bajo `ui.sourceRoots` en busca de llamadas a `t("literal")` y `i18n.t("literal")`. Escribe (o fusiona en) `ui.stringsJson`.

El escáner es configurable: añade nombres de funciones personalizadas a través de `ui.uiExtractor.funcNames` (o el legado `ui.reactExtractor.funcNames`). Para páginas y componentes de Astro, añade `.astro` a `ui.uiExtractor.extensions`. Para HTML plano, consulta [Aplicaciones HTML planas](/es/guide/ui-strings/plain-html).

<a id="what-extract-scans"></a>
### Qué escanea la extracción

- Las extensiones predeterminadas son solo `.js`, `.jsx`, `.ts` y `.tsx`. `.mjs`, `.cjs`, `.mts` y `.cts` se incluyen solo cuando las añade a `ui.uiExtractor.extensions`.
- Una clave no literal como `t(variable)` o un literal de plantilla se omite sin advertencia.
- `package.json` `description` se incluye por defecto (`ui.uiExtractor.includePackageDescription`).
- Los componentes de archivo único de Vue y Svelte no son compatibles. Añadir `.vue` o `.svelte` a `extensions` no extrae el texto de la plantilla. No hay un analizador SFC.

<a id="step-3-translate-ui-strings"></a>
## Paso 3: Traducir cadenas de la interfaz de usuario

```bash
ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes a los modelos del proveedor de LLM activo para cada configuración regional de destino, escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. La selección del modelo utiliza la cadena de la interfaz de usuario: `localeModels(locale)` → `uiModels` → `translationModels` (consulta [Modelos de IA](/es/guide/ai-models#model-fallback-chain)). Dentro de una configuración regional, se ejecutan hasta `uiBatchConcurrency` lotes a la vez (valor predeterminado **2**; consulta [Configuración — uiBatchConcurrency](/es/reference/configuration#uibatchconcurrency-optional)). `-j` sigue paralelizando solo las configuraciones regionales de destino.

<a id="translations-database-stringsjson"></a>
### Base de datos de traducciones (`strings.json`)

Para cada entrada, `translate-ui` almacena el **ID de modelo del proveedor activo** que tradujo con éxito cada idioma en un objeto `models` opcional (las mismas claves de idioma que `translated`). Las cadenas editadas en el Panel de traducción se marcan con el valor centinela `user-edited` en `models` para ese idioma. Los archivos planos por idioma en `ui.flatOutputDir` permanecen solo como **cadena de origen → traducción**; no incluyen `models` (por lo que los paquetes en tiempo de ejecución permanecen sin cambios).

> **Nota:** Las ediciones del panel de control en las cadenas de la interfaz de usuario residen en `strings.json`, no en la caché de documentación de SQLite. Ejecuta `sync` o `translate-ui` sin opciones especiales (sin indicador especial) para reescribir los archivos de configuración regional planos desde el catálogo — `--force-update` **no** se reenvía al paso de la interfaz de usuario. Evita `--force` en los comandos de la interfaz de usuario después de las ediciones manuales: vuelve a traducir cada entrada y puede sobrescribir tus filas `user-edited`. Las filas del catálogo cuya traducción almacenada no supera la comprobación del sistema de escritura de la configuración regional (por ejemplo, hindi romanizado para `hi`) se tratan como ausentes y se vuelven a traducir sin `--force`.

<a id="step-4-use-the-output-in-your-app"></a>
## Paso 4: Usar la salida en su aplicación

`translate-ui` solo escribe archivos. La aplicación tiene que cargarlos.

- JS/TS: configure i18next con los ayudantes en tiempo de ejecución, cargue el archivo de configuración regional que elija el usuario y añada un selector de idioma. Consulte [Configurar i18next](/es/guide/ui-strings/i18next-runtime) y [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher).
- Python: use el `i18n.py` generado o sus catálogos gettext. Consulte [Aplicaciones Python](/es/guide/ui-strings/python).
- HTML plano: cargue el script en tiempo de ejecución junto a la página. Consulte [Aplicaciones HTML plano](/es/guide/ui-strings/plain-html).
- Astro: consulte [Sitio web de Astro](/es/guide/ui-strings/astro-website).

<a id="optional"></a>
## Opcional

<a id="per-locale-model-overrides"></a>
### Anulaciones de modelo por configuración regional

Algunos modelos traducen mejor ciertos idiomas que otros. Por ejemplo, los modelos qwen y z-ai suelen funcionar bien con los idiomas asiáticos. Añade entradas `providers.<active>.localeModels` para proporcionar una lista de modelos priorizada para cada configuración regional BCP-47. Esas listas se prueban antes que `uiModels` y `translationModels` para esa configuración regional. Las etiquetas de configuración regional coinciden sin distinguir entre mayúsculas y minúsculas (`zh-cn` y `ZH-CN` son equivalentes). Si no hay ninguna entrada coincidente, la herramienta utiliza el orden predeterminado de `uiModels` y `translationModels`. El mismo mecanismo `localeModels` se aplica a la traducción de documentos, JSON y SVG.

<a id="exporting-to-xliff-20"></a>
### Exportación a XLIFF 2.0

Para entregar las cadenas de la interfaz a un proveedor de traducción, un sistema de gestión de traducción (TMS) o una herramienta CAT, exporta el catálogo como **XLIFF 2.0** (un archivo por configuración regional de destino). Este comando es **de solo lectura**: no modifica `strings.json` ni llama a ninguna API.

```bash
ai-i18n-tools export-ui-xliff
```

Por defecto, los archivos se escriben junto a `ui.stringsJson`, con nombres como `strings.de.xliff`, `strings.pt-BR.xliff` (nombre base de tu catálogo + configuración regional + `.xliff`). Usa `-o` / `--output-dir` para escribir en otra ubicación. Las traducciones existentes de `strings.json` aparecen en `<target>`; las configuraciones regionales faltantes usan `state="initial"` sin `<target>` para que las herramientas puedan completarlas. Usa `--untranslated-only` para exportar solo las unidades que aún necesitan traducción para cada configuración regional (útil para lotes enviados a proveedores). `--dry-run` muestra las rutas sin escribir archivos.
