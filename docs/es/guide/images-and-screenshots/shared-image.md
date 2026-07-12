<a id="shared-raster"></a>
# Ráster compartido

Se utiliza cuando se comparte una sola imagen en todas las configuraciones regionales (sin variantes por configuración regional).

- **`docsOutput.style = "flat"`**: el reescritor de enlaces planos calcula el prefijo de profundidad por archivo de salida, de modo que un recurso relativo junto al archivo de origen (por ejemplo, `docs/figure.png` referenciado como `figure.png` desde `docs/page.md`) se resuelve correctamente en cada salida traducida; no se necesita ninguna regla `postProcessing.regexAdjustments`. Cuando los archivos de origen se encuentran en subdirectorios, habilite `flatPreserveRelativeDir: true` para que las rutas de salida conserven el árbol de origen (consulte [Prefijo de profundidad por archivo](/es/guide/images-and-screenshots/link-rewriting#per-file-depth-prefix-with-flatpreserverelativedir)).
- **`docsOutput.style = "vitepress"`** (y otros ajustes preestablecidos del sistema de documentos con un normalizador de enlaces): las rutas absolutas de la raíz del sitio, como `/translation-dashboard.png`, se dejan sin cambios cuando la URL es idéntica en todas las configuraciones regionales; no se necesita ninguna regla `regexAdjustments`.

**Ejemplo plano:** un proyecto traduce `docs/guide/quick-start.md` a `translated-docs/docs/guide/quick-start.<locale>.md`. Esto asume `flatPreserveRelativeDir: true` para que `docs/guide/quick-start.md` se genere en `translated-docs/docs/guide/quick-start.<locale>.md` (no en `translated-docs/quick-start.<locale>.md`). Una imagen hermana `docs/translation-dashboard.png` se referencia desde `quick-start.md` como `../translation-dashboard.png`. El reescritor calcula el prefijo por archivo desde el directorio del archivo de salida hasta el directorio de origen (`../../docs/`), produciendo `../../docs/translation-dashboard.png`. Desde `translated-docs/docs/guide/`, eso se resuelve correctamente de nuevo en `docs/translation-dashboard.png`.

Todavía se necesita una regla `postProcessing` cuando:
- El recurso se referencia a través de una URL absoluta en **`docsOutput.style = "flat"`** (por ejemplo, `/img/figure.png`): el reescritor plano solo maneja rutas relativas.
- Desea cambiar la URL del recurso por otras razones (por ejemplo, cambiar a una CDN).

<a id="implementation-example"></a>
### Ejemplo de implementación

La documentación de este repositorio utiliza la variante de URL absoluta de las imágenes compartidas: la [guía del Panel de traducción](/es/guide/translation-dashboard/) hace referencia a su captura de pantalla como `![Translation Dashboard](/translation-dashboard.png)`, una ruta absoluta de la raíz del sitio servida desde [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Dado que la URL es idéntica para cada configuración regional, no se necesita ninguna regla `postProcessing.regexAdjustments`.
