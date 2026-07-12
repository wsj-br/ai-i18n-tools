<a id="per-locale-folder-url-rewriting"></a>
# Carpeta por configuración regional (reescritura de URL)

Úselo para README/USER-GUIDE con `docsOutput.style = "flat"`, y para sitios de sistemas de documentación (`docsOutput.style = "doc-system"` o alias `"docusaurus"` / `"astro-starlight"`) y para `"vitepress"` / otros ajustes preestablecidos de sistemas de documentación que sirven capturas de pantalla desde un árbol de URL estático compartido. Detalles de reescritura de enlaces para VitePress: [Reescritura de enlaces — VitePress](/es/guide/images-and-screenshots/link-rewriting#vitepress-link-normalizer-style-vitepress).

<a id="directory-layout"></a>
### Estructura de directorios

<details>
<summary>Árbol de directorios de capturas de pantalla por configuración regional de ejemplo</summary>

```
images/screenshots/
├── en-GB/
│   ├── translate.png
│   └── settings.png
├── de/
│   ├── translate.png
│   └── settings.png
└── fr/
    ├── translate.png
    └── settings.png
```

</details>

El markdown fuente hace referencia al directorio del idioma fuente:

```markdown
![Translate tab](images/screenshots/en-GB/translate.png)
```

<a id="screenshot-script-contract"></a>
### Contrato del script de captura de pantalla

El script `take-screenshots` debe escribir archivos para cada configuración regional, no solo para la configuración regional de origen. El comando `translate-docs` reescribe las rutas, pero no crea archivos. Un asistente típico:

```js
function getScreenshotDir(locale) {
  return `images/screenshots/${locale}`;
}
```

Vea un ejemplo simple de `bash` en el [script de captura de pantalla en examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh), o un ejemplo más complejo en [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) del proyecto [duplistatus](https://github.com/wsj-br/duplistatus) (también utilizado en producción por [Transrewrt](https://github.com/wsj-br/transrewrt)).

> **Nota:** Las cuatro subsecciones siguientes comparten el mismo intercambio de segmento de configuración regional `regexAdjustments` (`screenshots/[^/]+/` → `screenshots/${translatedLocale}/`). Solo difieren el diseño de salida y si el reescritor de enlaces planos se ejecuta primero; salte a la subsección que coincida con su `docsOutput.style`.
>
> **Nota:** `regexAdjustments` se ejecuta en el cuerpo completo de markdown traducido, incluidos los bloques de código cercados. Si una página de documentación incrusta un ejemplo de configuración que contiene una ruta coincidente (por ejemplo, `screenshots/en-GB/`), ese fragmento también se reescribirá en la salida traducida. Prefiera la forma genérica `screenshots/[^/]+/` en ejemplos reutilizables.

<a id="config---docsoutputstyle--flat"></a>
### Configuración - `docsOutput.style = "flat"`

El reescritor de enlaces planos se ejecuta primero cuando `docsOutput.style = "flat"` y antepone un prefijo de profundidad a las URL que no son de markdown. Para un `README.md` en la raíz del repositorio con `outputDir: "translated-docs/"`, añade `../`:

```
images/screenshots/en-GB/translate.png  →  ../images/screenshots/en-GB/translate.png
```

Luego, la regla `regexAdjustments` reemplaza el segmento de idioma dentro de esa URL ya con prefijo:

<details>
<summary>Ejemplo de ajustes de expresiones regulares para diseño plano</summary>

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
    ]
  }
}
```

</details>

Resultado: `../images/screenshots/de/translate.png` — ruta relativa correcta desde `translated-docs/README.de.md` de vuelta a la raíz del repositorio.

El paso `postProcessing` se ejecuta después del reescritor de enlaces planos. Escriba expresiones regulares `search` que coincidan con el segmento de configuración regional en cualquier parte de la URL ya prefijada; no es necesario incluir el prefijo `../` en la expresión regular.

Ejemplo de implementación (producción): [Transrewrt](https://github.com/wsj-br/transrewrt) — URL de captura de pantalla en [README.md](https://github.com/wsj-br/transrewrt/blob/main/README.md) (`images/screenshots/en-GB/…`), reescritura de configuración regional en [ai-i18n-tools.config.json](https://github.com/wsj-br/transrewrt/blob/main/ai-i18n-tools.config.json), script de captura basado en [take-screenshots.ts](https://github.com/wsj-br/duplistatus/blob/master/scripts/take-screenshots.ts) de duplistatus (consulte el [contrato del script de captura de pantalla](#screenshot-script-contract) anterior).

Ejemplo de implementación (configuración de demostración): [examples/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — segundo bloque `docs[]` en [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`images/screenshots/[^/]+/` → `${translatedLocale}`); script auxiliar [screenshot-locales.sh](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/scripts/screenshot-locales.sh).

<a id="config---docsoutputstyle--doc-system"></a>
### Configuración - `docsOutput.style = "doc-system"`

El mismo enfoque de carpeta por configuración regional para cualquier sitio de sistema de documentos que haga referencia a capturas de pantalla a través de un prefijo de URL estático compartido. El reescritor de enlaces planos no se ejecuta; `postProcessing` reescribe el segmento de configuración regional en la URL original de markdown.

<details>
<summary>Ejemplo de ajustes de expresiones regulares para diseño de sistema de documentación</summary>

```json
"docsOutput": {
  "style": "doc-system",
  "docsRoot": "docs",
  "localeSubpath": "your-generator/locale/content/path",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Establezca `localeSubpath` para que coincida con el diseño de su generador entre `{locale}/` y el archivo traducido, o use un alias preestablecido (`"docusaurus"`, `"astro-starlight"`) en lugar de `"doc-system"` cuando los valores predeterminados sean adecuados. El markdown fuente normalmente incluye la configuración regional fuente en la URL:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

Incluya archivos PNG coincidentes en la misma ruta para cada configuración regional de destino (por ejemplo, `static/img/screenshots/de/screenshot.png`). Prefiera `screenshots/[^/]+/` frente a codificar `screenshots/en-GB/` para que la regla siga siendo válida tras un cambio en `sourceLocale`.

<a id="preset---docsoutputstyle--docusaurus"></a>
### Preajuste - `docsOutput.style = "docusaurus"`

Igual que `"doc-system"` con `localeSubpath = "docusaurus-plugin-content-docs/current"` predeterminado. El reescritor de enlaces plano no se ejecuta. `postProcessing` ve la URL original del markdown. Las páginas en inglés normalmente usan una ruta absoluta con la configuración regional fuente:

```markdown
![Screenshot](/img/screenshots/en-GB/screenshot.png)
```

<details>
<summary>Ejemplo de ajustes de expresiones regulares para el preajuste de Docusaurus</summary>

```json
"docsOutput": {
  "style": "docusaurus",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in docs-site static assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Incluya archivos PNG coincidentes en `docs-site/static/img/screenshots/<locale>/screenshot.png`. Para configuraciones independientes de la configuración regional fuente, prefiera `screenshots/[^/]+/` frente a `screenshots/en-GB/`.

Ejemplo de implementación: [examples/docusaurus-docs/docs/feature-showcase.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/docs/feature-showcase.md) (`/img/screenshots/en-GB/screenshot.png`) con [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/docusaurus-docs/ai-i18n-tools.config.json).

<a id="preset---docsoutputstyle--astro-starlight"></a>
### Preajuste - `docsOutput.style = "astro-starlight"`

Igual que `"doc-system"` con `localeSubpath: ""` — las páginas traducidas se encuentran directamente debajo de `{outputDir}/{locale}/`. El mismo enfoque de carpeta por configuración regional que la configuración genérica del sistema de documentos anterior. El markdown de origen utiliza `/img/screenshots/en-GB/screenshot.png`:

<details>
<summary>Ejemplo de ajustes de expresiones regulares para el preajuste de Astro Starlight</summary>

```json
"docsOutput": {
  "style": "astro-starlight",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders in public assets",
        "search": "screenshots/[^/]+/",
        "replace": "screenshots/${translatedLocale}/"
      }
    ]
  }
}
```

</details>

Envíe PNG en `public/img/screenshots/<locale>/screenshot.png`. El marcador de posición `${translatedLocale}` utiliza su cadena de configuración regional (por ejemplo, `pt-BR`). El preajuste `astro-starlight` convierte a minúsculas las **rutas de salida** de la configuración regional de forma predeterminada (`pt-br/`), pero las carpetas de activos estáticos bajo `public/img/screenshots/` deben coincidir con el segmento de configuración regional escrito en las URL de markdown; mantenga los directorios de capturas de pantalla alineados con `${translatedLocale}`, no necesariamente con el uso de mayúsculas y minúsculas de la ruta de Astro.

Ejemplo de implementación: [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs/) — [feature-showcase.mdx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/src/content/docs/feature-showcase.mdx) y [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/ai-i18n-tools.config.json) (`screenshots/[^/]+/`).
