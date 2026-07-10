<a id="colocated-translated-svg-doc-system"></a>
# SVG traducido y coubicado (sistema de documentación)

Utilice para sitios de sistemas de documentación donde las ilustraciones SVG traducidas deben aparecer junto con la documentación traducida en el directorio de contenido de cada región — la misma ubicación que las [capturas de pantalla colocadas](/es/guide/images-and-screenshots/colocated-screenshots). El preset de Docusaurus es el ejemplo principal.

<a id="config"></a>
### Configuración

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": [
    "documentation/static/assets/diagram.svg"
  ],
  "outputDir": "documentation/i18n",
  "style": "nested",
  "pathTemplate": "{outputDir}/{locale}/docusaurus-plugin-content-docs/current/assets/{basename}",
  "forceLowercase": true
}
```

`translate-svg` escribe un SVG por región en el mismo directorio `current/assets/` que las capturas de pantalla colocadas utilizan para PNG:

```
documentation/i18n/de/docusaurus-plugin-content-docs/current/assets/diagram.svg
documentation/i18n/fr/docusaurus-plugin-content-docs/current/assets/diagram.svg
```

<a id="source-markdown"></a>
### Markdown fuente

Todos los documentos en todos los idiomas utilizan la misma ruta relativa:

```markdown
![Diagram](../assets/diagram.svg)
```

Para el idioma inglés, el enlace simbólico `docs/assets → ../static/assets` resuelve esto. Para los idiomas traducidos, se resuelve directamente a `current/assets/`.

No se necesita ninguna regla `regexAdjustments` porque los documentos fuente en inglés y los documentos traducidos de salida usan rutas idénticas.

<a id="svg-source-location"></a>
### Ubicación del origen SVG

Recomendado: almacenar los SVG fuente en `documentation/static/assets/` junto con los PNG en inglés (en-GB). Esto mantiene todos los recursos de documentación en un solo lugar, y el mismo enlace simbólico `docs/assets` cubre ambos. Las entradas `svg.sourcePath` apuntan entonces a `documentation/static/assets/name.svg`.

<a id="pathtemplate-placeholders"></a>
### Marcadores de posición `pathTemplate`

| Marcador de posición              | Valor                                                  |
|-----------------------------------|--------------------------------------------------------|
| `{outputDir}`            | Ruta absoluta resuelta de `svg.outputDir`              |
| `{locale}`               | Código de configuración regional de destino                                     |
| `{LOCALE}`               | Código de configuración regional en mayúsculas                                 |
| `{relPath}`              | Ruta relativa desde la raíz de `sourcePath` hasta el SVG fuente |
| `{stem}`                 | Nombre de archivo sin extensión                             |
| `{basename}`             | Nombre de archivo con extensión                                |
| `{extension}`            | Extensión incluyendo el punto                                |
| `{relativeToSourceRoot}` | Ruta relativa desde la raíz `sourcePath` más cercana       |

Referencia completa en la [tabla de configuración de svg](/es/reference/configuration#svg).

<a id="implementation-example"></a>
### Ejemplo de implementación

[duplistatus](https://github.com/wsj-br/duplistatus) — bloque `svg` anidado con `pathTemplate` en [ai-i18n-tools.config.json](https://github.com/wsj-br/duplistatus/blob/master/ai-i18n-tools.config.json); los SVG de origen se enumeran bajo `documentation/static/img/` (por ejemplo, [duplistatus_toolbar.svg](https://github.com/wsj-br/duplistatus/blob/master/documentation/static/img/duplistatus_toolbar.svg)); `translate-svg` escribe archivos por región en `documentation/i18n/<locale>/…/current/assets/` junto a las PNG colocadas; los documentos los incrustan hoy mediante `/img/duplistatus_*.svg` (por ejemplo, [overview.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/overview.md)). Consulte [task-locale-assets-simplification.md](https://github.com/wsj-br/duplistatus/blob/master/dev/task-locale-assets-simplification.md) para el plan de mover a rutas `../assets/` y eliminar el puente SVG `regexAdjustments`.

---

<a id="the-flat-link-rewriter-and-two-step-flow"></a>
