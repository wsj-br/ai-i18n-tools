<a id="cli--cache--maintenance"></a>
# CLI — Caché y mantenimiento

<a id="cleanup"></a>
### `cleanup`

**Resumen:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Borra toda la tabla `markdown_source_issues`, luego ejecuta `sync --force-update` (extraer, UI, SVG, documentos y `translate-json` cuando esté habilitado) para que los problemas de markdown se vuelvan a llenar para los documentos configurados actualmente; luego elimina las filas de segmentos obsoletos (`last_hit_at` nulo / ruta de archivo vacía); elimina las filas `file_tracking` cuya ruta de origen resuelta falta en el disco; elimina las filas de traducción cuyos metadatos `filepath` apuntan a un archivo que falta; poda las filas `translation_failures` huérfanas; y elimina las filas de caché para las configuraciones regionales ausentes de la configuración (`sourceLocale`, raíz `targetLocales` y cualquier `docs[]` / `json[]` `targetLocales` por bloque). Solo caché para configuraciones regionales retiradas: los documentos generados, los archivos de UI planos y las entradas `strings.json` se dejan solos (use [`purge-locale`](#purge-locale) para eliminarlos). Registra los recuentos de poda después de la sincronización (segmentos obsoletos, `file_tracking` huérfanos, traducciones huérfanas, fallas huérfanas, configuraciones regionales no configuradas) más el recuento de borrado inicial de problemas de markdown.

**Opciones clave:** `--dry-run`, `--backup`

`--backup <path>` escribe una copia de seguridad de SQLite en la ruta especificada antes de las modificaciones (no se crea una copia de seguridad a menos que se establezca esta marca).

---

<a id="clean-temp"></a>
### `clean-temp`

**Resumen:** `ai-i18n-tools clean-temp [-r | --root <path>] [-f | --force] [--dry-run]`

No requiere configuración. Recorre un árbol de directorios (predeterminado: cwd) en busca de `*.log`, `*.tmp` y `cache.db.backup*.sqlite`, e imprime rutas `./…` como `find -print`. Con coincidencias: solicita confirmación `Delete these files? (y/n)` a menos que se especifique `-f` / `--force` (eliminar sin solicitar confirmación). Sin coincidencias: sale sin solicitar confirmación. `--dry-run`: solo lista, sin solicitar confirmación ni eliminar (anula `--force`).

**Opciones clave:** `-r` / `--root`, `-f` / `--force`, `--dry-run`

---

<a id="purge-locale"></a>
### `purge-locale`

**Resumen:** `ai-i18n-tools purge-locale -l <code> [-l <code> …] [options]`

Elimina todas las filas en caché para el(los) idioma(s) dado(s) de `translations`, `file_tracking` y `translation_failures`, y los artefactos generados para ese idioma: documentos traducidos (salidas `.md` / `.mdx` / `.astro` resueltas desde `docs[]`, incluidas salidas huérfanas cuya fuente se eliminó — encontradas al barrer cada árbol de salida de bloque, excepto cuando se configura un `pathTemplate` personalizado), el archivo plano de UI por idioma (`<flatOutputDir>/<locale>.json`) y las entradas del idioma en `strings.json`.

Los idiomas se pasan mediante `-l` / `--locale` repetibles (normalizados a BCP-47). Imprime recuentos por idioma (filas en caché, documentos, entradas `strings.json`; advierte (no da error) para idiomas con nada que purgar. Solicita confirmación a menos que se especifique `-y` / `--yes` / `-f` / `--force`. `--dry-run`: informa los recuentos y los archivos que se eliminarían, no elimina nada. `--keep-files`: purga solo la caché de SQLite, dejando archivos generados y `strings.json` intactos. No se crea una copia de seguridad de SQLite a menos que se pase `--backup <path>`, que escribe una copia de seguridad en la ruta especificada antes de la eliminación.

**Opciones clave:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
