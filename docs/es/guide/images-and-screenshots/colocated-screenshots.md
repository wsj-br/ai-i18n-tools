<a id="colocated-raster-doc-system"></a>
# Ráster colocalizado (`doc-system`)

Utilice cuando un sitio `doc-system` coloque los recursos específicos del idioma junto al markdown traducido; no se necesita reescritura de URL. El preajuste de Docusaurus (`docsOutput.style = "docusaurus"`) es la implementación de referencia; otros generadores que usan `"doc-system"` con un `localeSubpath` personalizado siguen la misma idea: los recursos en inglés se ubican en una ruta de idioma fuente, los recursos traducidos se ubican bajo `{outputDir}/{locale}/[localeSubpath/]assets/`.

> **Por qué no hay un ejemplo en el repositorio:** Las demos de Docusaurus de este repositorio ([`examples/docusaurus-docs`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/), [`examples/nextjs-app`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/)) usan un diseño [de carpeta por configuración regional](/es/guide/images-and-screenshots/per-locale-folder) en su lugar; consulta la [guía de decisiones](/es/guide/images-and-screenshots/#decision-guide). El `../assets/` colocalizado es el patrón recomendado para proyectos nuevos; [duplistatus](https://github.com/wsj-br/duplistatus) es la referencia de producción completa.

<a id="directory-layout"></a>
### Estructura de directorios

<details>
<summary>Ejemplo de árbol de directorios de recursos colocados (Docusaurus)</summary>

```
documentation/
├── static/
│   └── assets/
│       ├── screen-dashboard.png   ← en-GB screenshots (source locale)
│       └── screen-toolbar.png
├── docs/
│   └── assets → ../static/assets  ← symlink; webpack follows it
└── i18n/
    ├── de/
    │   └── docusaurus-plugin-content-docs/current/assets/
    │       ├── screen-dashboard.png   ← de screenshots
    │       └── screen-toolbar.png
    └── fr/
        └── docusaurus-plugin-content-docs/current/assets/
            ├── screen-dashboard.png
            └── screen-toolbar.png
```

</details>

Todos los documentos en cada configuración regional usan la misma ruta relativa:

```markdown
![Dashboard](../assets/screen-dashboard.png)
```

Para la configuración regional en inglés (`en-GB`), `../assets/` se resuelve mediante el enlace simbólico a `static/assets/`. Para las configuraciones regionales traducidas, se resuelve directamente al directorio `current/assets/` propio de la configuración regional.

<a id="screenshot-script-contract"></a>
### Contrato del script de captura de pantalla

El script debe escribir los PNG en el directorio correcto para cada configuración regional. La función `getScreenshotDir` codifica la división:

```js
function getScreenshotDir(locale) {
  if (locale === 'en-GB') return 'documentation/static/assets';
  return `documentation/i18n/${locale}/docusaurus-plugin-content-docs/current/assets`;
}
```

Vea una implementación real en [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) del repositorio [duplistatus](https://github.com/wsj-br/duplistatus).

<a id="config"></a>
### Configuración

No se necesita ninguna regla `regexAdjustments` para archivos raster. `translate-docs` traduce el texto alternativo en el markdown, pero la URL permanece sin cambios:

```json
{
  "docsOutput": {
    "style": "docusaurus",
    "docsRoot": "documentation/docs"
  }
}
```

Si el proyecto también utiliza SVG traducidos, la [traducción de SVG colocados](/es/guide/svg-translation/translated-svg-colocated) los gestiona y se ubican junto a los PNG en `current/assets/` sin expresiones regulares adicionales.

<a id="prerequisites"></a>
### Requisitos previos

- El enlace simbólico `docs/assets` debe existir: `ln -s ../static/assets documentation/docs/assets`
- Webpack de Docusaurus sigue enlaces simbólicos por defecto (`resolve.symlinks` por defecto es `true` en las compilaciones de Docusaurus)
- El enlace simbólico solo necesita existir para la configuración regional de origen; las compilaciones traducidas no lo utilizan

<a id="implementation-example"></a>
### Ejemplo de implementación

[duplistatus](https://github.com/wsj-br/duplistatus) — `getScreenshotDir(locale)` en [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts); la documentación en inglés hace referencia a los PNG colocados (por ejemplo, [dashboard.md](https://github.com/wsj-br/duplistatus/blob/master/documentation/docs/user-guide/dashboard.md) con `../assets/screen-dashboard-summary.png`). Los SVG colocados del mismo proyecto se ubican en los mismos directorios `current/assets/` — consulte [SVG colocado](/es/guide/svg-translation/translated-svg-colocated).
