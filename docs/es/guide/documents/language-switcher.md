<a id="language-switcher-languagelistblock"></a>
# Selector de idioma (`languageListBlock`)

Utilice `docsOutput.postProcessing.languageListBlock` cuando los archivos markdown traducidos deban incluir una fila de enlaces **"Leer en otros idiomas"**, un enlace por cada configuración regional, con valores `href` calculados en relación con cada archivo de salida.

Este repositorio lo utiliza para [README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/README.md) (salida plana bajo `translated-docs/`). Después de `translate-docs`, cada copia traducida obtiene un bloque actualizado; por ejemplo, [translated-docs/README.de.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/translated-docs/README.de.md) enlaza a archivos de configuración regional hermanos bajo `translated-docs/` y de vuelta a la fuente en inglés en la raíz del repositorio.

Requiere `docsOutput.style = "flat"` (u otro diseño donde los archivos de configuración regional hermanos sean direccionables por ruta relativa). Consulte [Diseños de salida](/guide/documents/output-layouts).

<a id="1-mark-the-block-in-source-markdown"></a>
## 1. Marque el bloque en el markdown de origen

Envuelva el selector en HTML (o cualquier línea) delimitado por los marcadores de subcadena `start` y `end`. Este repositorio utiliza:

```markdown
<small>**Read in other languages:** </small>
<small id="lang-list">[English (GB)](/) · [Deutsch](./README.de.md) · …</small>
```

El texto inicial del enlace es solo un marcador de posición. `translate-docs` reemplaza toda la sección desde la primera línea que contiene `start` hasta la primera línea posterior que contiene `end` (los marcadores dentro de bloques de código delimitados se ignoran, por lo que los ejemplos de configuración en el mismo archivo no coinciden).

<a id="2-configure-the-block"></a>
## 2. Configure el bloque

`start` y `end` son marcadores de subcadena arbitrarios — no tienen que ser `<small id="lang-list">` / `</small>`. Elija cualquier texto de apertura y cierre que aparezca únicamente en el fragmento del selector de idioma: otra etiqueta HTML (`<div class="lang-switcher">` … `</div>`), comentarios HTML (`<!-- lang-list -->` … `<!-- /lang-list -->`), o límites solo en markdown (por ejemplo, una línea `**Languages:**` hasta una línea `---`). Establezca `start` y `end` en la configuración para que coincidan exactamente con lo que puso en el archivo fuente.

Configuración raíz ([ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json)):

```json
"postProcessing": {
  "languageListBlock": {
    "start": "<small id=\"lang-list\">",
    "end": "</small>",
    "separator": " · "
  }
}
```

| Campo       | Función                                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------------|
| `start`     | Subcadena que identifica la línea de apertura del bloque                                                  |
| `end`       | Subcadena en la línea de cierre (puede ser la misma línea que `start` cuando ambos aparecen en una línea)             |
| `separator` | Texto entre los enlaces `[label](href)` generados (este repositorio usa `" · "`)                                    |
| `label`     | Opcional: `"local"` (por defecto) usa el endónimo de cada idioma del manifiesto; `"english"` usa `englishName` |

<a id="3-what-happens-at-runtime"></a>
## 3. Qué sucede en tiempo de ejecución

1. **Extracción** — el fragmento de lista de idiomas **no** se envía al modelo (`translatable: false`).
2. **Por archivo traducido** — tras la traducción de segmentos y la reescritura opcional de enlaces planos, `postProcessing` reconstruye el bloque: un enlace markdown por idioma, con etiquetas de `ui-languages.json` cuando están presentes (si no, del catálogo maestro incluido, si no, `localeDisplayNames`), rutas relativas al archivo que se está escribiendo.
3. **Actualización del origen** — al final de un proceso `translate-docs` / `sync` para documentos, el mismo bloque canónico se vuelve a escribir en los **archivos fuente en inglés** en `contentPaths` para que al añadir un idioma se actualice el selector en el repositorio sin tener que editar manualmente cada enlace.

Si un archivo no tiene un bloque coincidente, la CLI registra una advertencia (cuando `--verbose`) y deja el contenido sin cambios.

<a id="4-label-manifest"></a>
## 4. Manifiesto de etiquetas

Para etiquetas endónimas (`label: "local"`), genere o mantenga `ui-languages.json` a través de `generate-ui-languages` (requiere [`uiLanguagesPath`](/reference/configuration#uilanguagespath-optional)). La configuración de solo documentos de este repositorio no tiene una canalización de interfaz de usuario, por lo que las etiquetas provienen del catálogo maestro incluido para `sourceLocale` + `targetLocales`.

<a id="5-examples-in-this-repository"></a>
## 5. Ejemplos en este repositorio

| Ejemplo | Archivos |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Este paquete (README plano + sitio VitePress) | [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/ai-i18n-tools.config.json) (bloque README: `docsOutput.style = "flat"`; bloque del sitio: `docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |
| README plano + documentos de Docusaurus | [examples/nextjs-app/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (segundo bloque: `docsOutput.style = "flat"`; primer bloque: `docsOutput.style = "docusaurus"`) |
| Documentos de VitePress (demostración mínima) | [examples/vitepress-docs/ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/vitepress-docs/ai-i18n-tools.config.json) (`docsOutput.style = "vitepress"` + `vitepressThemeCatalog`) |

La línea inmediatamente antes de `<small id="lang-list">` (por ejemplo, `**Read in other languages:**`) es un segmento normal traducible y se localiza en cada configuración regional de destino; solo la fila de enlaces dentro de los marcadores se regenera textualmente, salvo por `href` y las etiquetas generadas por el manifiesto.
