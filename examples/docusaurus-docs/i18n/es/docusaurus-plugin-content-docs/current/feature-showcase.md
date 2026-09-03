---
sidebar_position: 1
title: Muestra de características de traducción
description: >-
  Un documento de referencia que demuestra cada elemento de Markdown que
  ai-i18n-tools sabe traducir.
translation_last_updated: '2026-09-03T22:52:20.306Z'
source_file_mtime: '2026-07-12T19:44:59.019Z'
source_file_hash: ad61e5d62a39cb332852533980c1de8417791746e8053814b32c4d3785e41215
translation_language: es
source_file_path: docs/feature-showcase.md
translation_models:
  - google/gemini-2.5-flash
---



import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Esta página existe para demostrar cómo `ai-i18n-tools` maneja cada construcción común de Markdown. Ejecute `sync` en ella y compare la salida en cada carpeta de configuración regional para ver exactamente qué se traduce y qué permanece intacto.

---

## Texto sin formato {#plain-text}

La internacionalización es más que intercambiar palabras. Una buena canalización de traducción conserva la estructura del documento, mantiene intactos los identificadores técnicos y solo envía texto legible por humanos al modelo de lenguaje.

`ai-i18n-tools` divide cada documento en **segmentos** antes de enviarlos al LLM. Cada segmento se traduce de forma independiente y luego se vuelve a ensamblar, por lo que un cambio en un párrafo no invalida las traducciones en caché del resto del archivo.

---

## Formato de texto {#text-formatting}

El traductor debe mantener todo el formato en línea sin alterar el marcado:

- El **texto en negrita** indica importancia y debe permanecer en negrita después de la traducción.
- El _texto en cursiva_ se utiliza para enfatizar o para títulos; el significado debe conservarse.
- El ~~tachado~~ marca contenido obsoleto o eliminado.
- `inline code` **nunca** se traduce: los identificadores, los nombres de funciones y las rutas de archivo deben permanecer tal cual.
- Un [hipervínculo](https://github.com/wsj-br/ai-i18n-tools) mantiene su URL original; solo se traduce la etiqueta del ancla.

---

## Encabezados en todos los niveles {#headings-at-every-level}

### H3 — Configuración {#h3--configuration}

#### H4 — Directorio de salida {#h4--output-directory}

##### H5 — Nomenclatura de archivos {#h5--file-naming}

###### H6 — Manejo de extensiones {#h6--extension-handling}

Todos los niveles de encabezado traducen el texto pero dejan los ID de ancla sin cambios para que los enlaces de ancla existentes sigan funcionando.

---

## Tablas {#tables}

Las tablas son una fuente común de errores de traducción. Cada celda se traduce individualmente; los separadores de columna y la sintaxis de alineación se conservan.

| Característica             | Estado         | Notas                                                            |
|----------------------------|----------------|------------------------------------------------------------------|
| Traducción de Markdown     | ✅ Estable     | Segmentos almacenados en caché en SQLite                         |
| Extracción de cadenas de UI | ✅ Estable     | Lee llamadas a `t("…")`                                         |
| Cadenas de interfaz de usuario plurales | ✅ Estable | `t("…", { plurals: true, count })`; catálogo + sufijos JSON planos |
| Traducción de etiquetas JSON | ✅ Estable | JSON de barra lateral/barra de navegación de Docusaurus |
| Traducción de texto SVG | ✅ Estable | Conserva la estructura SVG |
| Aplicación de glosario | ✅ Estable | Glosario CSV por proyecto |
| Concurrencia por lotes | ✅ Configurable | Clave `batchConcurrency` |

### Compatibilidad de izquierda a derecha y de derecha a izquierda {#left-to-right-and-right-to-left-support}

La internacionalización moderna debe adaptarse tanto a los idiomas de izquierda a derecha (LTR) como a los de derecha a izquierda (RTL). `ai-i18n-tools` garantiza el manejo correcto de la dirección del texto en todo el flujo de trabajo de traducción:

- La canalización conserva automáticamente la direccionalidad de cada configuración regional. Por ejemplo, el árabe (`ar`) se renderiza de derecha a izquierda, mientras que el inglés (`en-GB`), el portugués (`pt`) y otros permanecen de izquierda a derecha.
- Al traducir tablas de markdown, ejemplos de código o cadenas de interfaz de usuario, las herramientas mantienen la alineación y la estructura del contenido, de modo que las tablas y los bloques formateados se muestran de forma natural tanto en contextos LTR como RTL.
- Docusaurus y la aplicación de ejemplo Next.js respetan la dirección de la configuración regional en el navegador, cambiando el diseño y la alineación del texto según corresponda.

| Direccionalidad | Ejemplo de configuración regional | Visualización |
|:--------------:|:-----------------------|:-----------------------|
| LTR | `en-GB`, `es`, `pt-BR` | Estándar de izquierda a derecha |
| RTL | `ar`, `fa`, `he` | Diseño de derecha a izquierda |

Esto garantiza que los documentos y las interfaces se vean correctamente, independientemente del idioma o la dirección de lectura del usuario.

---

## Listas {#lists}

### Sin ordenar {#unordered}

- La caché de traducción almacena un hash de cada segmento de origen.
- Solo los segmentos cuyo hash ha cambiado desde la última ejecución se envían al LLM.
- Esto hace que las ejecuciones incrementales sean muy rápidas, normalmente solo unas pocas llamadas a la API para pequeñas ediciones.

### Ordenadas {#ordered}

1. Agregue `ai-i18n-tools` como una dependencia de desarrollo.
2. Cree `ai-i18n-tools.config.json` en la raíz de su proyecto.
3. Ejecute `npx ai-i18n-tools sync` para realizar la primera traducción completa.
4. Confirme los archivos de configuración regional generados junto con su origen.
5. En ejecuciones posteriores, solo se vuelven a traducir los segmentos modificados.

### Anidadas {#nested}

- **Canalización de documentos**
  - Origen: cualquier archivo `.md` o `.mdx`
  - Salida: árbol `i18n/` de Docusaurus o copias traducidas planas
  - Caché: SQLite, con clave por ruta de archivo + hash de segmento
- **Canalización de cadenas de interfaz de usuario**
  - Origen: archivos JS/TS con llamadas a `t("…")` (incluidos plurales a través de `{ plurals: true, count }`)
  - Salida: JSON plano por configuración regional (`de.json`, `fr.json`, …) con claves con sufijo para categorías plurales cuando corresponda
  - Caché: el propio catálogo maestro `strings.json`

---

## Cadenas de interfaz de usuario plurales {#plural-ui-strings}

Los documentos de Markdown en este sitio muestran la traducción de **documentos**. El comportamiento **plural** para el texto de la interfaz de usuario es más fácil de ver en el [ejemplo de Next.js](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app) (`examples/nextjs-app/`), que combina una aplicación React con este mismo modelo de contenido de Docusaurus.

La página de inicio de esa aplicación (`src/app/page.tsx`) incluye una sección de **demostración de plurales** y repite un mensaje con varios recuentos de ejemplo para que pueda comparar la gramática entre idiomas (por ejemplo, árabe vs. inglés). Cada línea llama a:

```typescript
t("This page has {{count}} sections", { plurals: true, count })
```

Use `plurals: true` para que `extract` registre un grupo plural en `locales/strings.json` y `translate-ui` rellene los archivos planos por idioma en `public/locales/`. En tiempo de ejecución, i18next resuelve la clave sufijada correcta para el `count` activo; el ejemplo de Next conecta los ayudantes en `src/lib/i18n.ts`.

Para capturas de pantalla, URL de configuración regional y diseño de archivos, consulte **Ejemplo de plurales** en el [README del ejemplo de Next.js](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/README.md).

---

## Bloques de código {#code-blocks}

Los bloques de código **nunca** se traducen. La prosa circundante se traduce, pero cada carácter dentro del bloque delimitado se pasa textualmente.

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

> "La mejor internacionalización es invisible para el usuario: simplemente ve su idioma."
>
> Una traducción adecuada va más allá del vocabulario. Adapta el tono, los formatos de fecha, el formato de números y la dirección de lectura para que se sienta nativo en cada idioma.

---

## Pestañas (Docusaurus) {#tabs-docusaurus}

<Tabs>
  <TabItem value="apple" label="Manzana" default>
    Esto es una manzana 🍎
  </TabItem>
  <TabItem value="orange" label="Naranja">
    Esto es una naranja 🍊
  </TabItem>
  <TabItem value="banana" label="Plátano">
    Esto es un plátano 🍌
  </TabItem>
</Tabs>

---

## Advertencias (Docusaurus) {#admonitions-docusaurus}

Los títulos de las advertencias de Docusaurus se traducen; los delimitadores `:::` y las palabras clave de tipo se conservan.

:::note
Este documento es intencionalmente rico en características de Markdown. Su propósito principal es servir como un banco de pruebas de traducción: ejecute `sync` e inspeccione la salida para verificar que cada elemento se maneje correctamente.
:::

:::tip
Puede anular la redacción traducida de cualquier segmento editando el archivo de salida y ejecutando `sync` nuevamente. La herramienta detectará sus ediciones y agregará la frase corregida al glosario del proyecto automáticamente.
:::

:::warning
No confirme el directorio `.translation-cache/` al control de versiones. La caché es específica de la máquina y se regenera en cada nueva extracción.
:::

:::danger
Eliminar el directorio de caché obliga a que cada segmento se vuelva a traducir desde cero. Esto puede ser costoso si sus documentos son grandes. Use `sync --no-cache-write` para hacer una ejecución de prueba sin conservar los resultados.
:::

---

## Imágenes y reescritura de rutas con reconocimiento de la configuración regional {#images-and-locale-aware-path-rewriting}

El texto alternativo de la imagen se traduce a cada configuración regional. Más allá de eso, `ai-i18n-tools` también puede **reescribir las rutas de las imágenes** en la salida traducida a través de `postProcessing.regexAdjustments`, de modo que cada configuración regional pueda apuntar a su propia captura de pantalla en lugar de mostrar siempre la versión en inglés.

El documento fuente (inglés) hace referencia a:

```markdown
![The example Next.js app running in English](/img/screenshots/es/screenshot.png)
```

La entrada de configuración para este sitio de documentación incluye:

```json
"regexAdjustments": [
  {
    "description": "Per-locale screenshot folders in docs-site static assets",
    "search": "screenshots/es/]+/",
    "replace": "screenshots/es/"
  }
]
```

Después de la traducción, la salida en alemán se convierte en:

```markdown
![Die Beispiel-Next.js-App auf Deutsch](/img/screenshots/es/screenshot.png)
```

Aquí está la captura de pantalla real de la aplicación Next.js; está en inglés de forma predeterminada, pero si está leyendo esto en una configuración regional traducida, la imagen a continuación debería mostrar la aplicación en su idioma:

![La aplicación de ejemplo Next.js — cadenas de interfaz de usuario y esta página traducidas por ai-i18n-tools](/img/screenshots/es/screenshot.png)

---

## Reglas horizontales y saltos de línea {#horizontal-rules-and-line-breaks}

Una regla horizontal (`---`) es un elemento estructural y no se traduce.

El contenido anterior y posterior se trata como segmentos separados, lo que le da al LLM ventanas de contexto más limpias.
