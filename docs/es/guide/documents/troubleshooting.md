<a id="troubleshooting"></a>
# Solución de problemas

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## Los enlaces de anclaje de sección no funcionan en los documentos traducidos

Un enlace como `[label](other.md#section-id)` puede abrir el archivo traducido correcto, pero no desplazarse hasta el encabezado deseado, o bien puede saltar a una sección incorrecta. El fragmento `#…` ya no coincide con ningún encabezado `id` en esa configuración regional.

Causas comunes:

- Los encabezados de origen nunca tuvieron identificadores de anclaje explícitos; el sitio genera los slugs a partir del texto visible del encabezado, que cambia tras la traducción.
- Ha cambiado el nombre de un encabezado en el origen, pero la línea `<a id="…"></a>` anterior falta o aún contiene el ID antiguo.
- Los enlaces de anclaje usan un fragmento `#…` adivinado a partir de palabras en inglés en lugar del ID que generaría `write-heading-ids`.

**Solución**

1. Ejecute `ai-i18n-tools write-heading-ids` en su `.md` / `.mdx` **fuente** (mismo `docs[]` / `contentPaths` que `translate-docs`). Inserta `<a id="slug"></a>` antes de cada encabezado ATX, o actualiza un ancla existente cuando el texto del encabezado ya no coincide con el slug actual.
2. Dirija los enlaces de anclaje a esos id — por ejemplo, `[setup](guide.md#first-run)` donde `#first-run` coincida con la línea de anclaje sobre el encabezado de destino, no un slug inferido únicamente del título en inglés.
3. Vuelva a ejecutar `translate-docs` (o `sync --force-update`) para que cada copia en un idioma incluya las líneas de anclaje actualizadas.

Utilice `--dry-run` en `write-heading-ids` primero para previsualizar los cambios. Consulte [Enlaces de anclaje](/es/guide/documents/anchor-links) para ver el patrón completo.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Enlaces de imagen o recursos con error 404 en documentos traducidos

Un enlace de Markdown o `![alt](url)` funciona en inglés, pero devuelve un error 404 en las copias traducidas, a menudo porque la URL sigue apuntando a la carpeta de la configuración regional de origen o a una ruta estática solo en inglés.

**Solución**

1. Confirma que el diseño de tus recursos coincide con tu `docsOutput.style` (plano frente a sistema de documentos). Consulta [Reescritura de enlaces](/es/guide/documents/link-rewriting) e [Imágenes y capturas de pantalla](/es/guide/images-and-screenshots/).
2. Agrega o ajusta `docsOutput.postProcessing.regexAdjustments` para intercambiar segmentos de configuración regional o unir rutas absolutas de `/img/…`. Para un diseño plano, recuerda que el reescritor de enlaces planos se ejecuta **antes** de `regexAdjustments`; haz coincidir los patrones con la URL ya prefijada.
3. Asegúrate de que los archivos de recursos específicos de la configuración regional existan en las rutas a las que hace referencia el Markdown reescrito (`translate-docs` reescribe las URL, pero no copia los archivos ráster).
