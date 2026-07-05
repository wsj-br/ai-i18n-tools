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

Utilice `--dry-run` en `write-heading-ids` primero para previsualizar los cambios. Consulte [Enlaces de anclaje](/guide/documents/anchor-links) para ver el patrón completo.
