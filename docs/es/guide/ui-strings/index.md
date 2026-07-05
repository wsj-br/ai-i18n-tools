<a id="ui-strings"></a>
# Cadenas de la interfaz de usuario

Diseñado para cualquier proyecto JS/TS que use i18next: aplicaciones React, Next.js (componentes cliente y servidor), servicios Node.js, herramientas CLI.

<a id="which-guide-to-read"></a>
## Qué guía leer

| Tu aplicación | Leer siguiente |
| --- | --- |
| React / Next.js / Node + i18next | [Conectar i18next](/guide/ui-strings/i18next-runtime) (Paso 4) |
| HTML plano (sin `t()` en el marcado) | [Aplicaciones HTML planas](/guide/ui-strings/plain-html) |
| Sitio de marketing de Astro (híbrido) | [Sitio web de Astro](/guide/ui-strings/astro-website) |
| Reglas de `t()`, interpolación, plurales | [Llamadas a t() y plurales](/guide/ui-strings/t-calls-and-plurals) |
| Selector de idioma / RTL | [Selector de idioma y RTL](/guide/ui-strings/language-switcher) |
| Firmas de API en tiempo de ejecución | [Ayudantes en tiempo de ejecución](/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## Paso 1: Inicializar

```bash
npx ai-i18n-tools init
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown`. Edítalo para configurar:

- `sourceLocale` - código BCP-47 de tu idioma fuente (por ejemplo, `"en-GB"`). **Debe coincidir** con `SOURCE_LOCALE` exportado desde tu archivo de configuración de i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - matriz de códigos BCP-47 para tus idiomas de destino (por ejemplo, `["de", "fr", "pt-BR"]`). Ejecuta `generate-ui-languages` para crear el manifiesto `ui-languages.json` a partir de esta lista.
- `ui.sourceRoots` - directorios o patrones glob para escanear llamadas a `t("…")` (por ejemplo, `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - ubicación donde escribir el catálogo maestro (por ejemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - dónde escribir `de.json`, `pt-BR.json`, etc. (ej. `"src/locales/"`).
- `ui.preferredModel` (opcional) - ID del modelo a probar **primero** solo para `translate-ui`; en caso de error, la CLI continúa con los `translationModels` del proveedor activo en orden, omitiendo duplicados.

<a id="step-2-extract-strings"></a>
## Paso 2: Extraer cadenas

```bash
npx ai-i18n-tools extract
```

Analiza todos los archivos JS/TS dentro de `ui.sourceRoots` en busca de llamadas a `t("literal")` y `i18n.t("literal")`. Escribe (o combina en) `ui.stringsJson`.

El escáner es configurable: añade nombres de funciones personalizadas a través de `ui.uiExtractor.funcNames` (o el legado `ui.reactExtractor.funcNames`). Para páginas y componentes de Astro, añade `.astro` a `ui.uiExtractor.extensions`. Para HTML plano, consulta [Aplicaciones HTML planas](/guide/ui-strings/plain-html).

<a id="step-3-translate-ui-strings"></a>
## Paso 3: Traducir cadenas de la interfaz de usuario

```bash
npx ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes al proveedor LLM activo para cada locale de destino, escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. Cuando se establece `ui.preferredModel`, se intenta ese modelo antes de la lista de `translationModels` del proveedor activo (la traducción de documentos y otros comandos solo usan la lista del proveedor).

Para cada entrada, `translate-ui` almacena el **ID de modelo del proveedor activo** que tradujo con éxito cada idioma en un objeto `models` opcional (las mismas claves de idioma que `translated`). Las cadenas editadas en el Panel de traducción se marcan con el valor centinela `user-edited` en `models` para ese idioma. Los archivos planos por idioma en `ui.flatOutputDir` permanecen solo como **cadena de origen → traducción**; no incluyen `models` (por lo que los paquetes en tiempo de ejecución permanecen sin cambios).

> **Nota:** Las ediciones del Panel a las cadenas de la interfaz de usuario se encuentran en `strings.json`, no en la caché de documentación de SQLite. Ejecuta `sync` o `translate-ui` (sin bandera especial) para reescribir los archivos de idioma planos del catálogo; `--force-update` **no** se reenvía al paso de la interfaz de usuario. Evita `--force` en los comandos de la interfaz de usuario después de ediciones manuales: vuelve a traducir cada entrada y puede sobrescribir tus filas de `user-edited`.

Luego, conecta i18next en tiempo de ejecución — [Conectar i18next](/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## Exportar a XLIFF 2.0 (opcional)

Para entregar las cadenas de la interfaz a un proveedor de traducción, un sistema de gestión de traducción (TMS) o una herramienta CAT, exporta el catálogo como **XLIFF 2.0** (un archivo por configuración regional de destino). Este comando es **de solo lectura**: no modifica `strings.json` ni llama a ninguna API.

```bash
npx ai-i18n-tools export-ui-xliff
```

Por defecto, los archivos se escriben junto a `ui.stringsJson`, con nombres como `strings.de.xliff`, `strings.pt-BR.xliff` (nombre base de tu catálogo + configuración regional + `.xliff`). Usa `-o` / `--output-dir` para escribir en otra ubicación. Las traducciones existentes de `strings.json` aparecen en `<target>`; las configuraciones regionales faltantes usan `state="initial"` sin `<target>` para que las herramientas puedan completarlas. Usa `--untranslated-only` para exportar solo las unidades que aún necesitan traducción para cada configuración regional (útil para lotes enviados a proveedores). `--dry-run` muestra las rutas sin escribir archivos.
