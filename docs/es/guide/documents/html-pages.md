<a id="html-pages"></a>
# Páginas HTML

`translate-docs` puede generar un archivo HTML por configuración regional. Coloque los archivos `.html` o `.htm` en una entrada `docs[]` `contentPaths` y ejecute `translate-docs` o `sync`. El archivo en inglés se mantiene como origen. Las copias de configuración regional se escriben en `outputDir`.

Utilice esta opción cuando cada idioma es su propia página (un sitio estático, un conjunto de documentos HTML escritos a mano). Utilice [Aplicaciones HTML simples](/es/guide/ui-strings/plain-html) cuando un archivo HTML permanece en su lugar y el navegador intercambia cadenas desde un JSON plano.

Genere la estructura base con:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

La demo ejecutable es [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) (puerto 3092).

<a id="what-is-translated"></a>
## Qué se traduce

Traducido: texto visible, `alt`, `title`, `aria-label`, `placeholder`, el `<title>`, `meta name="description"` y `og:title` / `og:description`.

Sin cambios: elementos `script`, `style`, `textarea`, `pre` y `code`, además de `src`, `href` y otras URL. Un párrafo que contenga `<code>` o `<em>` conserva esas etiquetas y traduce las palabras circundantes.

`html lang` y `dir` se establecen en el archivo de configuración regional. El origen en inglés conserva su propio `lang` hasta que lo cambie.

Los archivos de configuración regional generados se omiten en la siguiente ejecución cuando se encuentran en `outputDir` (un directorio `pt-BR/` o un `name.pt-BR.html` plano). Se imprime una advertencia cuando el mismo archivo `.html` también es un origen de catálogo de UI (`ui.sourceRoots`).

<a id="links-and-images"></a>
## Enlaces e imágenes

Los enlaces a otras páginas HTML en el mismo bloque `docs[]` se reescriben a la salida de configuración regional de esa página. Otras URL relativas se prefijan para que sigan resolviéndose desde el archivo de configuración regional.

`docsOutput.localizedAssets` opcionalmente cambia el nombre de imágenes e iconos cuando existe un archivo específico de configuración regional. El `url()` de CSS no se reescribe.

```json
"localizedAssets": {
  "include": ["img/**"],
  "pattern": "{stem}-{locale}{ext}",
  "onlyIfExists": true
}
```

| Marcador de posición | Significado |
| --- | --- |
| `{stem}` | Nombre de archivo sin la extensión |
| `{ext}` | Extensión, incluyendo el punto |
| `{basename}` | Nombre de archivo con la extensión |
| `{locale}` | Código de configuración regional tal como está configurado (`pt-BR`) |
| `{llocale}` | Configuración regional en minúsculas |
| `{LOCALE}` | Configuración regional en mayúsculas |

`img/trulli.jpg` con el patrón anterior se convierte en `img/trulli-pt-BR.jpg`. Con `onlyIfExists: true` (el valor predeterminado), la URL original se mantiene cuando falta ese archivo. Las URL absolutas, las URL `data:` y los fragmentos `#` se omiten. Las URL relativas a la raíz (`/img/trulli.jpg`) se prueban en `assetRoot`, o en el directorio del archivo HTML cuando se omite `assetRoot`.

`srcset`, `poster`, `<source src>`, las URL `<link>` de iconos, y `og:image` / `twitter:image` usan las mismas reglas.

Para HTML, `docsOutput.docsRoot` se elimina de la ruta relativa al proyecto antes de añadir la carpeta de configuración regional. Con `docsRoot: "site"` y `style: "nested"`, `site/index.html` se escribe en `site/pt-BR/index.html`.

<a id="language-list-and-hreflang"></a>
## Lista de idiomas y hreflang

Se rellenan dos pares de comentarios en cada copia de configuración regional y en el origen en inglés (para que las alternativas sigan siendo recíprocas):

```html
<nav>
  <ul>
    <!-- ai-i18n:lang-list -->
    <!-- /ai-i18n:lang-list -->
  </ul>
</nav>
<!-- ai-i18n:hreflang -->
<!-- /ai-i18n:hreflang -->
```

Los marcadores dentro de `script`, `style`, `pre` y `code` se ignoran. Una ejecución detallada advierte cuando una página no tiene par. Los mismos comentarios son los valores predeterminados cuando se omite `docsOutput.html`.

```json
"html": {
  "languageList": {
    "format": "links",
    "label": "local",
    "separator": " · "
  },
  "hreflang": {
    "siteUrl": "https://example.com",
    "xDefault": "en",
    "stripIndexHtml": true
  }
}
```

`format: "links"` escribe elementos `<a>`. Dentro de un `<ul>`, `<ol>` o `<nav>`, cada enlace se envuelve en `<li>`. `format: "select"` escribe filas `<option>`. Coloque los marcadores dentro de su propio `<select data-lang-select>` y cargue `lang-select.js` (incluido como `ai-i18n-tools/html-runtime/lang-select.js` y copiado en el ejemplo). Un bloque utiliza un formato.

`label` es `local` (endónimo), `english` o `both` (`English / endonym` cuando difieren). Las configuraciones regionales que no están en el conjunto configurado se omiten.

`hreflang.siteUrl` añade prefijos a los enlaces alternativos. Cuando no está definido, los enlaces son relativos y se registra una advertencia. `xDefault` tiene como valor predeterminado `sourceLocale`. `stripIndexHtml` convierte `index.html` en una URL de directorio.

No hay archivo de mapa del sitio, ni inyección automática de `<head>`, ni reescritura de `canonical` o `og:locale`. El idioma del navegador no redirige al visitante.

<a id="second-run"></a>
## Segunda ejecución

Las traducciones de oraciones permanecen en la caché. El hash de seguimiento de archivos también incluye la lista de configuraciones regionales y `docsOutput.html` / `localizedAssets`. Añadir una configuración regional reescribe la lista de idiomas y el bloque hreflang incluso cuando todas las oraciones ya están en la caché. Un hash coincidente y un archivo de salida actualizado omiten la página.
