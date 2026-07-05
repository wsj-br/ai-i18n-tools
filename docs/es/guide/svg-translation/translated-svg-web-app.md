<a id="translated-svg-with-svgstyle--flat"></a>
# SVG traducido con `svg.style = "flat"`

Úselo cuando una aplicación web integre ilustraciones o diagramas SVG específicos de configuración regional y los referencie por código de configuración regional en tiempo de ejecución.

<a id="config"></a>
### Configuración

```json
"features": {
  "translateSVG": true
},
"svg": {
  "sourcePath": "images",
  "outputDir": "public/assets",
  "style": "flat"
}
```

`translate-svg` lee cada `.svg` dentro de `images/` y escribe un archivo por configuración regional:

```
public/assets/
├── dashboard.en-GB.svg
├── dashboard.de.svg
├── dashboard.fr.svg
└── dashboard.es.svg
```

<a id="app-reference"></a>
### Referencia en la aplicación

```tsx
<img src={`/assets/dashboard.${locale}.svg`} alt="Dashboard diagram" />
```

<a id="source-layout-recommendation"></a>
### Recomendación de estructura de origen

Mantenga los SVG de origen separados del directorio de salida. Con `sourcePath: "images"` y `outputDir: "public/assets"`, ambos directorios son distintos. Nunca establezca ambos en el mismo directorio.

<a id="implementation-example"></a>
### Ejemplo de implementación

[ejemplos/nextjs-app](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/) — bloque `svg` en [ai-i18n-tools.config.json](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/ai-i18n-tools.config.json) (`sourcePath: "images"`, `outputDir: "public/assets"`, `svg.style = "flat"`); origen [translation_demo_svg.svg](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/images/translation_demo_svg.svg); salidas por configuración regional en [public/assets/](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/public/assets/) (p. ej. `translation_demo_svg.de.svg`); URL de tiempo de ejecución en [page.tsx](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/nextjs-app/src/app/page.tsx) (`/assets/translation_demo_svg.${locale}.svg`).

---

<a id="pattern-e---colocated-translated-svg-doc-system"></a>
