<a id="common-mistakes-and-troubleshooting"></a>
# Errores comunes y solución de problemas

**No hay directorio de configuración regional en las rutas de las capturas de pantalla**
`images/screenshots/screenshot.png` — no se pueden distinguir las variantes de configuración regional y no se puede reescribir. Reestructure a `images/screenshots/<locale>/screenshot.png` antes de usar la reescritura [de la carpeta por configuración regional](/es/guide/images-and-screenshots/per-locale-folder).

**Configuración regional fuente codificada en la expresión regular**
`"search": "screenshots/en-GB/"` — falla silenciosamente si cambia `sourceLocale`. Use `"search": "screenshots/[^/]+/"` en su lugar.

**Archivos SVG fuente y de salida en el mismo directorio**
Si `svg.sourcePath` y `svg.outputDir` se solapan, los archivos generados se mezclan con los fuentes editados manualmente. Manténgalos en directorios separados.

**URLs estáticas absolutas de Docusaurus para SVGs colocados**
`/img/diagram.svg` (desde `static/img/`) requiere una regla `regexAdjustments` para reescribir a `../assets/` en la salida traducida. Coloque los SVGs fuente en `static/assets/` y use rutas relativas `../assets/diagram.svg` desde el principio para evitar esto por completo.

**Falta el enlace simbólico `docs/assets` en Docusaurus**
Sin el enlace simbólico, los documentos fuente en `docs/user-guide/` no pueden hacer referencia a PNGs o SVGs en `static/assets/` mediante una ruta relativa. Configure el enlace simbólico al crear el proyecto: `ln -s ../static/assets documentation/docs/assets`.

**El script `take-screenshots` solo captura la configuración regional de origen**
El diseño de carpetas por configuración regional requiere archivos PNG para cada configuración regional. Si el script solo captura `en-GB`, los documentos traducidos tendrán rutas reescritas que apuntan a archivos que faltan.
