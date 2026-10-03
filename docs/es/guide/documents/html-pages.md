<a id="html-pages"></a>
# Páginas HTML

Utilice la canalización de Documents cuando un sitio estático necesite un archivo `.html` o `.htm` traducido por configuración regional. `translate-docs` traduce la página de origen, reescribe sus enlaces relativos y escribe las copias de configuración regional en `outputDir`. No se requiere ningún entorno de ejecución de i18n del navegador ni marcadores `data-i18n*`.

Utilice [aplicaciones HTML simples](/es/guide/ui-strings/plain-html) en su lugar cuando un archivo HTML permanezca en su sitio y un script del navegador intercambie cadenas desde un JSON plano sobre la marcha. No coloque el mismo archivo en ambas canalizaciones; la CLI advierte cuando un archivo HTML es tanto una fuente `docs[]` como una fuente de catálogo `ui.sourceRoots`.

El sitio ejecutable [`examples/plain-html-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/plain-html-docs) sirve inglés en el puerto 3092 y escribe portugués en `site/pt-BR/`.

<a id="quick-start"></a>
## Inicio rápido

Genere la estructura de una configuración funcional:

```bash
ai-i18n-tools init -t docs-plain-html [-P <provider>]
```

O añada esta porción HTML a un `ai-i18n-tools.config.json` que ya tenga un [proveedor](/es/guide/providers-and-models) de LLM:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["pt-BR"],
  "features": {
    "translateDocs": true,
    "translateUIStrings": false
  },
  "docs": [
    {
      "description": "Static HTML pages",
      "contentPaths": ["site/"],
      "outputDir": "site",
      "addFrontmatter": false,
      "docsOutput": {
        "style": "nested",
        "docsRoot": "site",
        "localizedAssets": {
          "include": ["img/**"],
          "pattern": "{stem}-{locale}{ext}",
          "onlyIfExists": true
        },
        "html": {
          "languageList": {
            "format": "links",
            "label": "local"
          },
          "hreflang": {
            "siteUrl": "https://example.com",
            "xDefault": "en",
            "stripIndexHtml": true
          }
        }
      }
    }
  ]
}
```

`docsRoot` debe ser el árbol de origen dentro de `contentPaths`. Se elimina antes de insertar el directorio de configuración regional. Con la configuración anterior:

```text
site/index.html       → site/pt-BR/index.html
site/about.html       → site/pt-BR/about.html
```

Opcionalmente, añada los [marcadores de lista de idiomas y hreflang](#language-list-and-hreflang) a cada página de origen y, a continuación, ejecute:

```bash
ai-i18n-tools translate-docs
# Or run every enabled pipeline:
ai-i18n-tools sync
```

El comando también actualiza el interior de los marcadores en los archivos del idioma de origen. Trate los archivos de configuración regional en `outputDir` como salida generada; edite las páginas de origen y ejecute el comando de nuevo.

<a id="what-is-translated"></a>
## Qué se traduce

El extractor de HTML traduce:

- texto visible que contenga letras, incluyendo `<title>` y texto alrededor del marcado en línea
- valores de atributos `alt`, `title`, `aria-label` y `placeholder`
- `value` en `<input type="submit">` y `<input type="button">`
- `content` en `meta name="description"`, `meta property="og:title"` y `meta property="og:description"`

Los elementos en línea como `<a>`, `<em>`, `<strong>`, `<span>`, `<img>` y `<br>` se conservan mientras se traduce la oración circundante. Los elementos en línea similares a código como `<code>` y `<kbd>` se mantienen intactos:

```html
<p>Run <code>pnpm build</code> before deployment.</p>
```

Los subárboles completos de `script`, `style`, `textarea`, `pre` y `code` se copian sin cambios. Otros atributos, incluidos `class`, `id`, `src`, `href` y los metadatos que contienen URL, no se envían al modelo.

En cada copia de configuración regional, la canalización establece `<html lang="…">` y el `dir` de la configuración regional (`ltr` o `rtl`). La página de origen conserva su `lang` y `dir` originales. Utilice HTML UTF-8; la CLI advierte cuando un `<meta charset>` declara otra codificación.

<a id="output-layout"></a>
## Diseño de salida

Para el diseño habitual de sitios estáticos, configure:

```json
{
  "outputDir": "site",
  "docsOutput": {
    "style": "nested",
    "docsRoot": "site"
  }
}
```

`style: "nested"` escribe `{outputDir}/{locale}/{path relative to docsRoot}`. `style: "flat"` escribe archivos con sufijo de configuración regional como `site/about.pt-BR.html`. Consulte [Diseños de salida](/es/guide/documents/output-layouts) para todos los estilos y plantillas de ruta personalizadas.

Los directorios de configuración regional generados y los nombres de archivo planos de configuración regional en `outputDir` se excluyen de futuros descubrimientos de origen. Esto evita que `site/pt-BR/index.html` o `site/index.pt-BR.html` se traduzcan de nuevo.

<a id="links-and-images"></a>
## Enlaces e imágenes

Los enlaces relativos que terminan en `.html` o `.htm` se reescriben cuando su destino es otra página de origen en el mismo bloque `docs[]`. Las cadenas de consulta y los fragmentos se conservan. Por ejemplo, `href="about.html#history"` en `site/index.html` se convierte en `href="./about.html#history"` en `site/pt-BR/index.html`.

Otras URL relativas `href`, `src`, `srcset` y `poster` se prefijan con la profundidad para que los archivos compartidos aún se resuelvan desde la página de configuración regional. Las URL absolutas, las URL relativas al protocolo, las URL `data:` y los enlaces de solo fragmento permanecen sin cambios. Las URL relativas a la raíz siguen siendo relativas a la raíz.

`docsOutput.localizedAssets` puede seleccionar un nombre de archivo de imagen o icono específico de la configuración regional:

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

`img/trulli.jpg` se convierte en `img/trulli-pt-BR.jpg`. Con `onlyIfExists: true` (el valor predeterminado), esa URL se utiliza solo cuando existe el archivo localizado; de lo contrario, se conserva el recurso compartido original. Configure `onlyIfExists: false` solo cuando otro paso de compilación o de CDN garantice esos archivos.

`include` coincide con rutas de URL como `img/**`. Utilice `assetRoot` para establecer el directorio del sistema de archivos con el que se comparan los candidatos localizados, especialmente las URL relativas a la raíz como `/img/trulli.jpg`.

Las mismas reglas de localización se aplican a `srcset`, `poster`, `<source src>`, el icono `<link href>` y `og:image` / `twitter:image`. La canalización reescribe las referencias, pero no crea, traduce ni copia archivos de recursos. Los valores `url()` de CSS no se reescriben.

<a id="language-list-and-hreflang"></a>
## Lista de idiomas y hreflang

Coloque un par de lista de idiomas donde corresponda la navegación visible, y un par hreflang dentro de `<head>`:

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

En cada ejecución, la canalización reemplaza solo el contenido entre cada par. Actualiza cada copia de configuración regional y la página de origen, manteniendo los enlaces alternativos recíprocos. Los marcadores dentro de `script`, `style`, `pre` y `code` se ignoran. Con `--verbose`, la CLI advierte cuando falta un par configurado.

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

Los comentarios predeterminados funcionan incluso cuando se omite `docsOutput.html`. Configure `languageList.start` / `end` o `hreflang.start` / `end` solo cuando el origen utilice un texto de marcador diferente.

### Navegación de idiomas visible

- `format: "links"` escribe elementos `<a>`. Dentro de un `<ul>`, `<ol>` o `<nav>`, cada enlace se envuelve en `<li>`; en otros lugares, `separator` une los enlaces.
- `format: "select"` escribe filas `<option>`. Coloque los marcadores dentro de su propio `<select data-lang-select>`, copie `node_modules/ai-i18n-tools/dist/html-runtime/lang-select.js` en el sitio y cargue ese script clásico. Navega a la URL generada de la opción seleccionada.
- `label` es `local` (endónimo), `english` o `both` (`English / endonym` cuando difieren). Las etiquetas provienen de `ui-languages.json` cuando están disponibles, y luego de la lista de configuraciones regionales incluida en el paquete.

Un bloque de marcador utiliza un formato. Los enlaces generados incluyen `lang`, `hreflang` y `aria-current`; la opción generada para la página actual tiene `selected`.

### Alternativas para motores de búsqueda

`hreflang.siteUrl` añade prefijos a las URL alternativas. Configúrelo con el origen público del sitio antes de la implementación. Cuando se omite, la canalización escribe enlaces alternativos relativos y registra una advertencia.

`xDefault` tiene como valor predeterminado `sourceLocale`; solo se emite cuando esa configuración regional está configurada para la página. `stripIndexHtml: true` convierte una alternativa `index.html` en una URL de directorio.

El bloque de marcador es obligatorio: la canalización no inyecta etiquetas en `<head>` automáticamente. Tampoco genera un mapa del sitio, una URL canónica o `og:locale`, y no redirige según el idioma del navegador.

Solo las configuraciones regionales de origen y destino configuradas son aptas para los bloques de idioma. Cuando existe `ui-languages.json`, sus filas y orden determinan qué configuraciones regionales aptas aparecen, así que mantenga el manifiesto alineado con la configuración. Si traduce con `--locale` para generar solo un subconjunto, no publique hasta que exista la salida de cada configuración regional enlazada.

<a id="second-run"></a>
## Segunda ejecución

Las traducciones de oraciones permanecen en la caché. El hash de seguimiento de archivos también incluye la lista de configuraciones regionales, el estilo de salida, `docsOutput.html` y `localizedAssets`. Añadir una configuración regional o cambiar esas opciones reescribe los bloques y enlaces generados incluso cuando cada oración ya está en la caché. Un hash coincidente y un archivo de salida actualizado omite esa página de configuración regional.

<a id="troubleshooting"></a>
## Solución de problemas

| Síntoma | Qué comprobar |
| --- | --- |
| La salida es `site/pt-BR/site/index.html` | Configure `docsOutput.docsRoot` en `"site"` para que se elimine el prefijo de origen. |
| El enlace aún apunta a la página en inglés | Utilice un enlace `.html` / `.htm` relativo e incluya la página de destino en el mismo bloque `docs[]`. |
| La ruta de la imagen está rota desde una página de configuración regional | Manténgala relativa para que se pueda aplicar la reescritura de profundidad; recuerde que el `url()` de CSS no se reescribe. |
| La imagen localizada no está seleccionada | Compruebe `localizedAssets.include`, el nombre de archivo `pattern` y si el candidato existe cuando `onlyIfExists` es verdadero. |
| La lista de idiomas está vacía o sin cambios | Mantenga ambos comentarios de marcador en el orden correcto y fuera de `script`, `style`, `pre` y `code`. |
| El menú desplegable no navega | Añada `data-lang-select` al `<select>` y cargue `html-runtime/lang-select.js`. |
| Las URL hreflang usan el host incorrecto | Establezca `hreflang.siteUrl` en el origen público final. |
| Una página traducida se traduce de nuevo | Mantenga los archivos de configuración regional generados en el `outputDir` configurado; no los añada como fuentes independientes. |
