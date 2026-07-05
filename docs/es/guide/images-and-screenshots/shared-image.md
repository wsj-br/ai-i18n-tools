<a id="shared-raster"></a>
# Ráster compartido

Utilice cuando una única imagen se comparta en todos los idiomas (sin variantes por idioma). Cuando `docsOutput.style = "flat"`, el reescritor de enlaces planos calcula el prefijo de profundidad por archivo de salida, por lo que un recurso junto al archivo fuente (por ejemplo, `docs/figure.png` referenciado como `figure.png` desde `docs/page.md`) se resuelve correctamente en cada salida traducida; no se necesita ninguna regla `postProcessing.regexAdjustments`.

Ejemplo: un proyecto traduce `docs/guide/quick-start.md` a `translated-docs/docs/guide/quick-start.<locale>.md`. Una imagen hermana `docs/translation-dashboard.png` se referencia desde `quick-start.md` como `../translation-dashboard.png`. El reescritor calcula el prefijo por archivo desde el directorio del archivo de salida hasta el directorio de origen (`../../docs/`), produciendo `../../docs/translation-dashboard.png`. Desde `translated-docs/docs/guide/`, eso se resuelve correctamente de nuevo a `docs/translation-dashboard.png`.

Todavía se necesita una regla `postProcessing` cuando:
- El recurso se referencia mediante una URL absoluta (por ejemplo, `/img/figure.png`); el reescritor solo maneja rutas relativas
- Desea cambiar la URL del recurso por otros motivos (por ejemplo, cambiar a un CDN)

<a id="implementation-example"></a>
### Ejemplo de implementación

La documentación de este repositorio utiliza la variante de URL absoluta de las imágenes compartidas: la [guía del Panel de traducción](/guide/translation-dashboard/) hace referencia a su captura de pantalla como `![Translation Dashboard](/translation-dashboard.png)`, una ruta absoluta de raíz del sitio servida desde [`docs/public/translation-dashboard.png`](https://github.com/wsj-br/ai-i18n-tools/tree/main/docs/public/translation-dashboard.png). Debido a que la URL es idéntica para cada configuración regional, no se necesita ninguna regla de `postProcessing.regexAdjustments`; actualice el PNG con [`scripts/screenshot-translation-dashboard.sh`](https://github.com/wsj-br/ai-i18n-tools/tree/main/scripts/screenshot-translation-dashboard.sh) cuando cambie la interfaz de usuario del panel.
