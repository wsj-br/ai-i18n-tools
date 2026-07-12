<a id="ui-strings"></a>
# Cadenas de la interfaz de usuario

Diseñado para cualquier proyecto JS/TS que utilice i18next: aplicaciones React, Next.js (componentes de cliente y servidor), servicios Node.js, HTML plano, sitios web Astro y herramientas CLI.

<a id="which-guide-to-read"></a>
## Qué guía leer

| Tu aplicación | Leer siguiente |
| --- | --- |
| React / Next.js / Node + i18next | [Conectar i18next](/es/guide/ui-strings/i18next-runtime) (Paso 4) |
| HTML plano (sin `t()` en el marcado) | [Aplicaciones HTML planas](/es/guide/ui-strings/plain-html) |
| Sitio de marketing de Astro (híbrido) | [Sitio web de Astro](/es/guide/ui-strings/astro-website) |
| Reglas de `t()`, interpolación, plurales | [Llamadas a t() y plurales](/es/guide/ui-strings/t-calls-and-plurals) |
| Selector de idioma / RTL | [Selector de idioma y RTL](/es/guide/ui-strings/language-switcher) |
| Firmas de API en tiempo de ejecución | [Ayudantes en tiempo de ejecución](/es/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## Paso 1: Inicializar

```bash
ai-i18n-tools init [-P <provider>]
```

Esto escribe `ai-i18n-tools.config.json` con la plantilla `ui-markdown` (incluyendo un bloque `provider` / `providers` predeterminado). Antes de ejecutar `translate-ui` o `sync`, configure la clave API para su proveedor activo en el entorno o `.env` —excepto Ollama; consulte [Proveedor y clave API](/es/guide/quick-start#provider-and-api-key). Edite la configuración para establecer:

- `provider` y `providers` — al menos un proveedor con `translationModels`; cambie el preajuste o la lista de modelos si el predeterminado no es su elección (`init -P <provider>`). Consulte [Proveedores y modelos de LLM](/es/guide/providers-and-models).
- `sourceLocale` - su código BCP-47 de idioma de origen (por ejemplo, `"en-GB"`). **Debe coincidir** con `SOURCE_LOCALE` exportado desde su archivo de configuración i18n en tiempo de ejecución (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - matriz de códigos BCP-47 para sus idiomas de destino (por ejemplo, `["de", "fr", "pt-BR"]`). Ejecute `generate-ui-languages` para crear el manifiesto `ui-languages.json` a partir de esta lista.
- `ui.sourceRoots` - directorios o patrones globales para buscar llamadas `t("…")` (por ejemplo, `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - dónde escribir el catálogo maestro (por ejemplo, `"src/locales/strings.json"`).
- `ui.flatOutputDir` - dónde escribir `de.json`, `pt-BR.json`, etc. (por ejemplo, `"src/locales/"`).
- `providers.<active>.uiModels` (opcional) - lista de modelos solo de UI ordenada para `translate-ui`, generación plural y `proofread-ui` (después de cualquier entrada `localeModels` coincidente, antes de `translationModels`). Consulte [Proveedores y modelos](/es/guide/providers-and-models#model-fallback-chain).

<a id="step-2-extract-strings"></a>
## Paso 2: Extraer cadenas

```bash
ai-i18n-tools extract
```

Analiza todos los archivos JS/TS dentro de `ui.sourceRoots` en busca de llamadas a `t("literal")` y `i18n.t("literal")`. Escribe (o combina en) `ui.stringsJson`.

El escáner es configurable: añade nombres de funciones personalizadas a través de `ui.uiExtractor.funcNames` (o el legado `ui.reactExtractor.funcNames`). Para páginas y componentes de Astro, añade `.astro` a `ui.uiExtractor.extensions`. Para HTML plano, consulta [Aplicaciones HTML planas](/es/guide/ui-strings/plain-html).

<a id="step-3-translate-ui-strings"></a>
## Paso 3: Traducir cadenas de la interfaz de usuario

```bash
ai-i18n-tools translate-ui
```

Lee `strings.json`, envía lotes al proveedor de LLM activo para cada configuración regional de destino, escribe archivos JSON planos (`de.json`, `fr.json`, etc.) en `ui.flatOutputDir`. La selección del modelo utiliza la cadena de la interfaz de usuario: `localeModels(locale)` → `uiModels` → `translationModels` (consulta [Proveedores y modelos](/es/guide/providers-and-models#model-fallback-chain)).

<a id="per-locale-model-overrides"></a>
### Anulaciones de modelo por configuración regional

Dependiendo del idioma de destino, algunos modelos de traducción pueden funcionar significativamente mejor que otros; por ejemplo, los modelos qwen y z-ai tienden a producir traducciones de mayor calidad para idiomas asiáticos en comparación con muchos modelos de idiomas occidentales. Para aprovechar esto, puede usar entradas opcionales `providers.<active>.localeModels` para especificar una lista priorizada de modelos para cada configuración regional BCP-47. Estas listas de modelos se prueban **antes** que las más generales `uiModels` y `translationModels` para esa configuración regional en particular. Esto le permite adaptar la selección de modelos y lograr una mejor calidad de traducción por idioma. Las etiquetas de configuración regional se comparan sin distinción entre mayúsculas y minúsculas (por lo que `zh-cn` y `ZH-CN` son equivalentes). Si ninguna entrada personalizada coincide con una configuración regional, la herramienta recurre al orden predeterminado `uiModels` y `translationModels` para las traducciones de la interfaz de usuario. El mismo mecanismo `localeModels` también se aplica a la traducción de documentos, JSON y SVG.

<a id="translations-database-stringsjson"></a>
### Base de datos de traducciones (`strings.json`)

Para cada entrada, `translate-ui` almacena el **ID de modelo del proveedor activo** que tradujo con éxito cada idioma en un objeto `models` opcional (las mismas claves de idioma que `translated`). Las cadenas editadas en el Panel de traducción se marcan con el valor centinela `user-edited` en `models` para ese idioma. Los archivos planos por idioma en `ui.flatOutputDir` permanecen solo como **cadena de origen → traducción**; no incluyen `models` (por lo que los paquetes en tiempo de ejecución permanecen sin cambios).

> **Nota:** Las ediciones del Panel a las cadenas de la interfaz de usuario se encuentran en `strings.json`, no en la caché de documentación de SQLite. Ejecuta `sync` o `translate-ui` (sin bandera especial) para reescribir los archivos de idioma planos del catálogo; `--force-update` **no** se reenvía al paso de la interfaz de usuario. Evita `--force` en los comandos de la interfaz de usuario después de ediciones manuales: vuelve a traducir cada entrada y puede sobrescribir tus filas de `user-edited`.

Luego, conecta i18next en tiempo de ejecución — [Conectar i18next](/es/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## Exportar a XLIFF 2.0 (opcional)

Para entregar las cadenas de la interfaz a un proveedor de traducción, un sistema de gestión de traducción (TMS) o una herramienta CAT, exporta el catálogo como **XLIFF 2.0** (un archivo por configuración regional de destino). Este comando es **de solo lectura**: no modifica `strings.json` ni llama a ninguna API.

```bash
ai-i18n-tools export-ui-xliff
```

Por defecto, los archivos se escriben junto a `ui.stringsJson`, con nombres como `strings.de.xliff`, `strings.pt-BR.xliff` (nombre base de tu catálogo + configuración regional + `.xliff`). Usa `-o` / `--output-dir` para escribir en otra ubicación. Las traducciones existentes de `strings.json` aparecen en `<target>`; las configuraciones regionales faltantes usan `state="initial"` sin `<target>` para que las herramientas puedan completarlas. Usa `--untranslated-only` para exportar solo las unidades que aún necesitan traducción para cada configuración regional (útil para lotes enviados a proveedores). `--dry-run` muestra las rutas sin escribir archivos.
