---
sidebar_position: 1
title: Muestra de funciones de traducción
description: >-
  Un documento de referencia que muestra cada elemento de Markdown que
  ai-i18n-tools sabe cómo traducir.
translation_last_updated: '2026-05-24T19:47:32.672Z'
source_file_mtime: '2026-05-04T21:42:57.361Z'
source_file_hash: fc1e59d495d99d93de4381fb9475734f0221307ceac660a82ac03cdc06acc320
translation_language: es
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Esta página existe para demostrar cómo `ai-i18n-tools` maneja cada construcción común de Markdown. Ejecute `sync` contra ella y compare la salida en cada carpeta de configuración regional para ver exactamente qué se traduce y qué permanece intacto.

---

## Texto plano {#plain-text}

La internacionalización va más allá de intercambiar palabras. Una buena canalización de traducción preserva la estructura del documento, mantiene los identificadores técnicos intactos y solo envía texto legible por humanos al modelo de lenguaje.

`ai-i18n-tools` divide cada documento en **segmentos** antes de enviarlos al LLM. Cada segmento se traduce de forma independiente y luego se vuelve a ensamblar, por lo que un cambio en un párrafo no invalida las traducciones en caché del resto del archivo.

---

## Formato del texto {#text-formatting}

El traductor debe mantener todo el formato en línea sin alterar la marcación:

- **Texto en negrita** indica importancia y debe permanecer en negrita tras la traducción.
- _Texto en cursiva_ se usa para énfasis o títulos; el significado debe conservarse.
- ~~Tachado~~ marca contenido obsoleto o eliminado.
- `inline code` **nunca** se traduce — los identificadores, nombres de funciones y rutas de archivos deben permanecer iguales.
- Un [hipervínculo](https://github.com/wsj-br/ai-i18n-tools) conserva su URL original; solo se traduce la etiqueta del enlace.

---

## Encabezados en todos los niveles {#headings-at-every-level}

### H3 — Configuración {#h3--configuration}

#### H4 — Directorio de salida {#h4--output-directory}

##### H5 — Nombrado de archivos {#h5--file-naming}

###### H6 — Manejo de extensiones {#h6--extension-handling}

Todos los niveles de encabezado traducen el texto pero dejan los ID de anclaje sin cambios para que los enlaces de anclaje existentes sigan funcionando.

---

## Tablas {#tables}

Las tablas son una causa común de errores de traducción. Cada celda se traduce individualmente; se conservan los separadores de columnas y la sintaxis de alineación.

| Característica                | Estado         | Notas                                                            |
|-------------------------------|----------------|------------------------------------------------------------------|
| Traducción de Markdown        | ✅ Estable      | Segmentos almacenados en caché en SQLite                         |
| Extracción de cadenas de interfaz | ✅ Estable | Lee llamadas a `t("…")` |
| Cadenas de interfaz en plural | ✅ Estable      | `t("…", { plurals: true, count })`; sufijos de catálogo y JSON plano |
| Traducción de etiquetas JSON | ✅ Estable | JSON de barra lateral/barra de navegación de Docusaurus |
| Traducción de texto SVG | ✅ Estable | Conserva la estructura SVG |
| Aplicación de glosario | ✅ Estable | Glosario CSV por proyecto |
| Concurrencia por lotes | ✅ Configurable | clave `batchConcurrency` |

### Soporte de izquierda a derecha y derecha a izquierda {#left-to-right-and-right-to-left-support}

La internacionalización moderna debe acomodar tanto idiomas de izquierda a derecha (LTR) como de derecha a izquierda (RTL). `ai-i18n-tools` garantiza el manejo correcto de la dirección del texto en todo el flujo de trabajo de traducción:

- La canalización conserva automáticamente la direccionalidad de cada configuración regional. Por ejemplo, el árabe (`ar`) se muestra en RTL, mientras que el inglés (`en-GB`), portugués (`pt`) y otros permanecen en LTR.
- Al traducir tablas en Markdown, ejemplos de código o cadenas de interfaz, las herramientas mantienen la alineación y la estructura del contenido, de modo que las tablas y bloques formateados se muestran de forma natural tanto en contextos LTR como RTL.
- Tanto Docusaurus como la aplicación de ejemplo Next.js respetan la dirección del idioma en el navegador, cambiando el diseño y la alineación del texto según corresponda.

| Direccionalidad | Ejemplo de configuración regional | Visualización                |
|:---------------:|:----------------------------------|:-----------------------------|
|      LTR        | `en-GB`, `es`, `pt-BR`   | Izquierda a derecha estándar |
|      RTL        | `ar`, `fa`, `he`   | Diseño de derecha a izquierda  |

Esto garantiza que los documentos y las interfaces se vean correctamente, independientemente del idioma del usuario o su dirección de lectura.

---

## Listas {#lists}

### Desordenadas {#unordered}

- La caché de traducción almacena un hash de cada segmento de origen.
- Solo se envían al LLM los segmentos cuyo hash ha cambiado desde la última ejecución.
- Esto hace que las ejecuciones incrementales sean muy rápidas: normalmente solo unas pocas llamadas a la API para ediciones pequeñas.

### Ordenadas {#ordered}

1. Agrega `ai-i18n-tools` como dependencia de desarrollo.
2. Crea `ai-i18n-tools.config.json` en la raíz de tu proyecto.
3. Ejecuta `npx ai-i18n-tools sync` para realizar la primera traducción completa.
4. Confirma los archivos de idioma generados junto con tu código fuente.
5. En ejecuciones posteriores, solo se vuelven a traducir los segmentos modificados.

### Anidadas {#nested}

- **Canalización de documentos**
  - Origen: cualquier archivo `.md` o `.mdx`
  - Salida: árbol `i18n/` de Docusaurus o copias traducidas planas
  - Caché: SQLite, indexada por ruta del archivo + hash del segmento
- **Canalización de cadenas de interfaz**
  - Origen: archivos JS/TS con llamadas a `t("…")` (incluyendo plurales mediante `{ plurals: true, count }`)
  - Salida: JSON plano por configuración regional (`de.json`, `fr.json`, …) con claves sufijadas para categorías plurales cuando corresponda
  - Caché: el propio catálogo maestro `strings.json`

---

## Cadenas de interfaz en plural {#plural-ui-strings}

Los documentos en Markdown en este sitio muestran la traducción de **documento**. El comportamiento de **plural** para el texto de interfaz es más fácil de ver en el **ejemplo agrupado de Next.js** que se encuentra junto a `docs-site/` en `examples/nextjs-app/`.

La página principal de esa aplicación (`src/app/page.tsx`) incluye una sección de **demostración de plurales** y repite un mensaje con varios conteos de ejemplo para que puedas comparar la gramática entre idiomas (por ejemplo, árabe frente a inglés). Cada línea llama a:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Utilice `plurals: true` para que `extract` registre un grupo plural en `locales/strings.json` y `translate-ui` rellene los archivos planos por configuración regional bajo `public/locales/`. En tiempo de ejecución, i18next resuelve la clave con sufijo correcta para la `count` activa; el ejemplo de Next integra ayudantes en `src/lib/i18n.ts`.

Para capturas de pantalla, URLs de configuraciones regionales y disposición de archivos, consulte el **ejemplo de plurales** en el [README del ejemplo de Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Bloques de código {#code-blocks}

Los bloques de código **nunca** se traducen. Se traduce el texto circundante, pero cada carácter dentro del bloque delimitado se pasa tal cual.

### Shell {#shell}

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### Configuración JSON {#json-configuration}

```json
{
  "sourceLocale": "en-GB",
  "targetLocales": ["de", "es", "fr", "pt-BR"],
  "features": {
    "translateMarkdown": true,
    "translateJSON": true
  },
  "documentations": [
    {
      "contentPaths": ["docs-site/docs/"],
      "outputDir": "docs-site/i18n",
      "markdownOutput": { "style": "docusaurus", "docsRoot": "docs-site/docs" }
    }
  ]
}
```

### TypeScript {#typescript}

```typescript
import { createI18nConfig } from 'ai-i18n-tools/runtime';

const config = createI18nConfig({
  defaultLocale: 'en-GB',
  supportedLocales: ['de', 'es', 'fr', 'pt-BR'],
  fallback: 'en-GB',
});

export default config;
```

---

## Citas en bloque {#blockquotes}

> "La mejor internacionalización es invisible para el usuario: simplemente ven su idioma."
>
> Una traducción adecuada va más allá del vocabulario. Adapta el tono, formatos de fecha, formato de números y dirección de lectura para que se sienta nativo en cada configuración regional.

---

## Pestañas (Docusaurus) {#tabs-docusaurus}

<Tabs>
  <TabItem value="apple" label="Manzana" default>
    Esta es una manzana 🍎
  </TabItem>
  <TabItem value="orange" label="Naranja">
    Esta es una naranja 🍊
  </TabItem>
  <TabItem value="banana" label="Banana">
    Esta es una banana 🍌
  </TabItem>
</Tabs>

---

## Advertencias (Docusaurus) {#admonitions-docusaurus}

Los títulos de advertencias de Docusaurus se traducen; los delimitadores `:::` y las palabras clave de tipo se conservan.

:::note
Este documento tiene intencionadamente muchas características de Markdown. Su propósito principal es servir como un conjunto de pruebas de traducción: ejecute `sync` e inspeccione la salida para verificar que cada elemento se maneje correctamente.
:::

:::tip
Puede sobrescribir el texto traducido de cualquier segmento editando el archivo de salida y ejecutando `sync` nuevamente. La herramienta detectará sus ediciones y agregará automáticamente la redacción corregida al glosario del proyecto.
:::

:::warning
No confirme (commit) el directorio `.translation-cache/` al control de versiones. La caché es específica de la máquina y se regenera en cada nueva clonación.
:::

:::danger
Eliminar el directorio de caché fuerza a que todos los segmentos se vuelvan a traducir desde cero. Esto puede ser costoso si sus documentos son grandes. Use `sync --no-cache-write` para hacer una prueba sin guardar los resultados.
:::

---

## Imágenes y reescritura de rutas según configuración regional {#images-and-locale-aware-path-rewriting}

El texto alternativo de las imágenes se traduce a cada configuración regional. Además, `ai-i18n-tools` también puede **reescribir las rutas de las imágenes** en la salida traducida mediante `postProcessing.regexAdjustments`, de modo que cada configuración regional pueda apuntar a su propia captura de pantalla en lugar de mostrar siempre la versión en inglés.

El documento fuente (inglés) hace referencia a:

```markdown
![The example Next.js app running in English](/img/screenshots/es/screenshot.png)
```

La entrada de configuración para este sitio de documentación incluye:

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/es/",
    "replace": "screenshots/${translatedLocale}/"
  }
]
```

Después de la traducción, la salida en alemán se convierte en:

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/de/screenshot.png)
```

Esta es la captura de pantalla real de la aplicación Next.js: está en inglés por defecto, pero si está leyendo esto en un idioma traducido, la imagen de abajo debería mostrar la aplicación en su idioma:

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/es/screenshot.png)

---

## Reglas horizontales y saltos de línea {#horizontal-rules-and-line-breaks}

Una regla horizontal (`---`) es un elemento estructural y no se traduce.

El contenido encima y debajo de ella se trata como segmentos separados, lo que proporciona al LLM ventanas de contexto más limpias.
