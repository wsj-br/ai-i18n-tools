<a id="link-rewriting"></a>
# Reescritura de enlaces

`translate-docs` reescribe las URL en el markdown traducido para que los enlaces sigan resolviéndose después de que los archivos se muevan a rutas específicas de la configuración regional. La mayoría de los enlaces entre páginas se gestionan automáticamente; cuando su sitio utiliza un árbol de URL estático compartido o carpetas de activos codificadas por configuración regional, añada reglas `docsOutput.postProcessing.regexAdjustments`.

<a id="built-in-rewriters"></a>
## Reescriptores integrados

El reescritor que se ejecuta depende de `docsOutput.style`:

| Diseño | Reescriptor integrado | Qué corrige |
| --- | --- | --- |
| `"flat"` (predeterminado cuando no hay `pathTemplate` personalizado) | Reescriptor de enlaces planos (`rewriteRelativeLinks`, activado por defecto) | Enlaces relativos entre páginas (`guide.md` → `guide.de.md`) y prefijos de profundidad para URL de activos que no son markdown |
| `"vitepress"` | Normalizador de enlaces de VitePress (`rewriteVitepressLinks`, activado por defecto) | Rutas `docs/guide/…` de estilo README → rutas del sitio (`/guide/…`) |
| `"nextra"` | Normalizador de enlaces de Nextra (`rewriteNextraLinks`, activado por defecto) | Rutas `content/en/…` y `.mdx` relativas → rutas neutrales respecto al idioma (`/guide/…`) |
| `"fumadocs"` | Normalizador de enlaces de Fumadocs (`rewriteFumadocsLinks`, activado por defecto) | Rutas `content/docs/…` y `.mdx` relativas → rutas neutrales respecto al idioma (`/docs/…`) |
| `"doc-system"`, `"docusaurus"`, `"astro-starlight"` | Ninguno | Las URL de origen pasan sin cambios hasta `postProcessing` |

`pathTemplate` personalizado desactiva el reescritor plano a menos que establezca `rewriteRelativeLinks: true` explícitamente. Consulte [Diseños de salida](/es/guide/documents/output-layouts) y [Enlaces de anclaje](/es/guide/documents/anchor-links) para el manejo de `#anchor` entre páginas.

Para las reglas de autoría específicas de VitePress, consulte [Integración de VitePress — Convenciones de enlaces](/es/guide/integrations/vitepress#link-conventions).

Para las reglas de autoría específicas de Nextra, consulte [Integración de Nextra — Convenciones de enlaces](/es/guide/integrations/nextra#link-conventions).

Para las reglas de autoría específicas de Fumadocs, consulte [Integración de Fumadocs — Convenciones de enlaces](/es/guide/integrations/fumadocs#link-conventions).

<a id="postprocessingregexadjustments"></a>
## `postProcessing.regexAdjustments`

Añada reglas `{ "description"?, "search", "replace" }` ordenadas en `docs[].docsOutput.postProcessing` cuando los reescritores integrados no sean suficientes; por ejemplo:

- URL de capturas de pantalla o imágenes que incluyen un **segmento de carpeta de configuración regional** (`screenshots/en-GB/` → `screenshots/de/`)
- Rutas absolutas de la raíz del sitio (`/img/…`) que difieren entre el origen en inglés y los árboles de salida traducidos
- Cualquier patrón de URL que deba cambiar por configuración regional de destino pero que no sea un simple enlace de markdown relativo

`postProcessing` se ejecuta en el **cuerpo de markdown traducido reensamblado** (se conservan las claves de la cabecera YAML y los valores que no son de prosa). Se ejecuta **después** del reensamblaje de segmentos y la reescritura de enlaces integrada, y **antes** de `addFrontmatter`.

<a id="two-step-flow-with-flat-layout"></a>
### Flujo de dos pasos con diseño plano

Cuando `docsOutput.style = "flat"`, el reescritor de enlaces planos se ejecuta primero, luego `regexAdjustments`:

```
source URL  →  [flat link rewriter]  →  [regexAdjustments]  →  output URL
```

Ejemplo con `outputDir: "translated-docs/"` y el origen `README.md` en la raíz del repositorio:

1. Reescriptor plano: `images/screenshots/en-GB/foo.png` → `../images/screenshots/en-GB/foo.png`
2. `regexAdjustments`: `images/screenshots/[^/]+/` → `images/screenshots/${translatedLocale}/` → `../images/screenshots/de/foo.png`

Escriba patrones `search` para que coincidan con el segmento de configuración regional **dentro de la URL ya prefijada**; no necesita incluir el prefijo de profundidad `../` en la expresión regular.

Para los diseños `doc-system`, el reescritor plano no se ejecuta. `regexAdjustments` ve la URL original del markdown de origen (normalmente una ruta absoluta como `/img/screenshots/en-GB/foo.png`).

Consulte [El reescritor de enlaces planos y el flujo de dos pasos](/es/guide/images-and-screenshots/link-rewriting#the-flat-link-rewriter-and-two-step-flow) para conocer el comportamiento del prefijo de profundidad y `flatPreserveRelativeDir`.

<a id="replace-placeholders"></a>
### Marcadores de posición `replace`

Las cadenas `replace` admiten variables de plantilla expandidas por archivo y configuración regional:

| Marcador de posición | Valor |
| --- | --- |
| `${translatedLocale}` | Configuración regional de destino (BCP-47 normalizado) |
| `${sourceLocale}` | Configuración regional de origen |
| `${sourceFullPath}` | Ruta de archivo de origen absoluta (POSIX `/`) |
| `${translatedFullPath}` | Ruta de salida traducida absoluta |
| `${sourceFilename}` / `${translatedFilename}` | Nombre base con extensión |
| `${sourceBasedir}` / `${translatedBasedir}` | Directorio padre del archivo de origen / salida |

`search` es un patrón de expresión regular. Una cadena simple usa el indicador `g`; use `/pattern/flags` cuando necesite otros indicadores (el patrón no debe contener caracteres `/` sin escapar).

<a id="common-patterns"></a>
## Patrones comunes

<a id="per-locale-asset-folder"></a>
### Carpeta de activos por configuración regional

Almacene los activos en un subdirectorio codificado por configuración regional desde el primer día e intercambie el segmento con una regla genérica:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Per-locale screenshot folders",
      "search": "images/screenshots/[^/]+/",
      "replace": "images/screenshots/${translatedLocale}/"
    }
  ]
}
```

Use `[^/]+` en lugar de codificar su configuración regional de origen (`en-GB`) para que la regla siga funcionando si `sourceLocale` cambia.

Tutorial completo: [Imágenes y capturas de pantalla — Carpeta por configuración regional](/es/guide/images-and-screenshots/per-locale-folder).

<a id="doc-system-static-urls"></a>
### URL estáticas del sistema de documentos

Para Docusaurus, Starlight u otros sitios `doc-system` que sirven capturas de pantalla desde un árbol estático compartido:

```json
"postProcessing": {
  "regexAdjustments": [
    {
      "description": "Locale segment in static screenshot URLs",
      "search": "screenshots/[^/]+/",
      "replace": "screenshots/${translatedLocale}/"
    }
  ]
}
```

Prefiera las rutas relativas (`../assets/name.png`) ubicadas en el markdown de origen cuando su generador lo admita; entonces no se necesita ningún puente `regexAdjustments`. Consulte [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/) para conocer las opciones de diseño.

<a id="when-regex-is-not-needed"></a>
### Cuando no se necesita una expresión regular

Normalmente **no** necesita `regexAdjustments` cuando:

- Los enlaces entre páginas son rutas de markdown relativas simples y `docsOutput.style = "flat"` (el reescritor incorporado agrega sufijos de configuración regional)
- Los activos se encuentran junto a los archivos de origen y el prefijo de profundidad por archivo del reescritor plano los resuelve correctamente
- El inglés y cada copia traducida usan la **misma** URL (imágenes compartidas en la raíz del sitio, activos colocados, rutas del sitio de VitePress después del normalizador)
- Los enlaces internos del sitio de VitePress usan rutas del sitio o rutas `docs/guide/…` con `rewriteVitepressLinks: true`
- Los enlaces en la página de Nextra y Fumadocs utilizan rutas neutrales respecto al idioma (`/guide/…`, `/docs/…`) o rutas de raíz de contenido con `rewriteNextraLinks` / `rewriteFumadocsLinks: true`

<a id="full-config-example"></a>
## Ejemplo de configuración completa

README plano con capturas de pantalla por idioma y un bloque opcional de cambio de idioma:

<details>
<summary>Diseño plano: regexAdjustments + languageListBlock</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

Referencia de campo: [Configuración — `docs`](/es/reference/configuration#docs) (`docsOutput.postProcessing`).

<a id="troubleshooting"></a>
## Solución de problemas

| Síntoma | Causa probable | Qué comprobar |
| --- | --- | --- |
| La página traducida devuelve un error 404 en una imagen o recurso estático | Falta o es incorrecto `regexAdjustments` para su diseño de URL | [Imágenes y capturas de pantalla — Solución de problemas](/es/guide/images-and-screenshots/troubleshooting) |
| El enlace abre el archivo correcto pero el `#section` incorrecto | Desplazamiento del slug del ancla, no reescritura de URL | [Enlaces de ancla](/es/guide/documents/anchor-links) |
| La regla `regexAdjustments` no tiene efecto en el diseño plano | `search` espera la URL previa al reescritor, pero el diseño plano ya agregó un prefijo de profundidad | Coincide con el segmento dentro de la ruta prefijada (consulta [flujo de dos pasos](#two-step-flow-with-flat-layout)) |
| Expresión regular no válida omitida en tiempo de ejecución | Patrón `search` mal formado | La CLI advierte con la regla `description`; prueba los patrones con la salida traducida de muestra |
