---
sidebar_position: 1
title: Muestra de funciones de traducción
description: >-
  Un documento de referencia que demuestra cada elemento Markdown que
  ai-i18n-tools sabe cómo traducir.
translation_last_updated: '2026-04-13T15:45:37.773Z'
source_file_mtime: '2026-04-13T12:49:18.347Z'
source_file_hash: 60c92aa8b547462c58ec49a6b0d6830f7245d618f2052c5ab961e2a4e80a0234
translation_language: es
source_file_path: docs-site/docs/feature-showcase.md
translation_models:
  - qwen/qwen3-235b-a22b-2507
---



# Muestra de funciones de traducción

Esta página existe para demostrar cómo `ai-i18n-tools` maneja cada construcción común de Markdown. Ejecuta `sync` en ella y compara la salida en cada carpeta de configuración regional para ver exactamente qué se traduce y qué permanece sin cambios.

---

## Prosa simple

La internacionalización es más que intercambiar palabras. Una buena canalización de traducción preserva la estructura del documento, mantiene los identificadores técnicos intactos y solo envía texto legible por humanos al modelo de lenguaje.

`ai-i18n-tools` divide cada documento en **segmentos** antes de enviarlos al LLM. Cada segmento se traduce de forma independiente y luego se vuelve a ensamblar, por lo que un cambio en un párrafo no invalida las traducciones en caché del resto del archivo.

---

## Formato en línea

El traductor debe mantener todo el formato en línea sin alterar la marcación:

- **Texto en negrita** indica importancia y debe permanecer en negrita tras la traducción.
- _Texto en cursiva_ se usa para énfasis o títulos; el significado debe conservarse.
- ~~Tachado~~ marca contenido obsoleto o eliminado.
- `inline code` es **nunca** traducido — los identificadores, nombres de funciones y rutas de archivos deben permanecer igual.
- Un [hipervínculo](https://github.com/your-org/ai-i18n-tools) mantiene su URL original; solo se traduce la etiqueta del enlace.

---

## Encabezados en todos los niveles

### H3 — Configuración

#### H4 — Directorio de salida

##### H5 — Nombrado de archivos

###### H6 — Manejo de extensiones

Todos los niveles de encabezado traducen el texto pero dejan los ID de anclaje sin cambios para que los enlaces profundos existentes sigan funcionando.

---

## Tablas

Las tablas son una fuente común de errores de traducción. Cada celda se traduce individualmente; se conservan los separadores de columna y la sintaxis de alineación.

| Característica | Estado | Notas |
|---|---|---|
| Traducción Markdown | ✅ Estable | Segmentos en caché en SQLite |
| Extracción de cadenas de interfaz | ✅ Estable | Lee llamadas `t("…")` |
| Traducción de etiquetas JSON | ✅ Estable | JSON de barra lateral/barra de navegación de Docusaurus |
| Traducción de texto SVG | ✅ Estable | Preserva la estructura SVG |
| Aplicación de glosario | ✅ Estable | Glosario CSV por proyecto |
| Concurrencia por lotes | ✅ Configurable | Clave `batchConcurrency` |

### Variantes de alineación

| Alineado a la izquierda | Centrado | Alineado a la derecha |
|:---|:---:|---:|
| Configuración regional de origen | `en-GB` | requerido |
| Configuraciones regionales de destino | hasta 20 | recomendado |
| Concurrencia | 4 | predeterminado |

---

## Listas

### Desordenadas

- La caché de traducción almacena un hash de cada segmento fuente.
- Solo se envían al LLM los segmentos cuyo hash haya cambiado desde la última ejecución.
- Esto hace que las ejecuciones incrementales sean muy rápidas: normalmente solo unas pocas llamadas a la API para ediciones pequeñas.

### Ordenadas

1. Agrega `ai-i18n-tools` como dependencia de desarrollo.
2. Crea `ai-i18n-tools.config.json` en la raíz de tu proyecto.
3. Ejecuta `npx ai-i18n-tools sync` para realizar la primera traducción completa.
4. Confirma los archivos de idioma generados junto con tu código fuente.
5. En ejecuciones posteriores, solo se vuelven a traducir los segmentos modificados.

### Anidadas

- **Documents pipeline**
  - Fuente: cualquier archivo `.md` o `.mdx`
  - Salida: árbol `i18n/` de Docusaurus o copias traducidas planas
  - Caché: SQLite, indexada por ruta del archivo + hash del segmento
- **UI strings pipeline**
  - Fuente: archivos JS/TS con llamadas a `t("…")`
  - Salida: JSON plano por idioma (`de.json`, `fr.json`, …)
  - Caché: el propio catálogo maestro `strings.json`

---

## Bloques de código

Los bloques de código **nunca** se traducen. Se traduce el texto circundante, pero cada carácter dentro del bloque delimitado se pasa tal cual.

### Shell

```bash
# Install the package
npm install --save-dev ai-i18n-tools

# Run a full sync
npx ai-i18n-tools sync

# Translate only documentation
npx ai-i18n-tools sync --no-ui --no-svg
```

### Configuración JSON

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

### TypeScript

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

## Citas en bloque

> "La mejor internacionalización es invisible para el usuario: simplemente ven su idioma."
>
> Una traducción adecuada va más allá del vocabulario. Adapta el tono, formatos de fecha, formato de números y dirección de lectura para que se sienta nativo en cada configuración regional.

---

## Advertencias (Docusaurus)

Los títulos de las advertencias de Docusaurus se traducen; las delimitaciones `:::` y las palabras clave de tipo se conservan.

:::note
Este documento tiene intencionalmente muchas características de Markdown. Su propósito principal es servir como un conjunto de pruebas de traducción: ejecuta `sync` e inspecciona la salida para verificar que cada elemento se maneje correctamente.
:::

:::tip
Puedes sobrescribir la redacción traducida de cualquier segmento editando el archivo de salida y ejecutando `sync` nuevamente. La herramienta detectará tus ediciones y agregará la frase corregida al glosario del proyecto automáticamente.
:::

:::warning
No confirmes el directorio `.translation-cache/` en el control de versiones. La caché es específica de la máquina y se regenera en cada nueva clonación.
:::

:::danger
Eliminar el directorio de caché fuerza a que todos los segmentos se vuelvan a traducir desde cero. Esto puede ser costoso si tus documentos son grandes. Usa `sync --no-cache-write` para hacer una prueba sin guardar los resultados.
:::

---

## Imágenes y reescritura de rutas con reconocimiento de configuración regional

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

Aquí está la captura de pantalla real en inglés; si está leyendo esto en una configuración regional traducida, la imagen de abajo debería mostrar la aplicación en su idioma:

![The example Next.js app — UI strings and this page translated by ai-i18n-tools](/img/screenshots/es/screenshot.png)

---

## Líneas horizontales y saltos de línea

Una línea horizontal (`---`) es un elemento estructural y no se traduce.

El contenido situado encima y debajo de ella se trata como segmentos separados, lo que proporciona al LLM ventanas de contexto más claras.
