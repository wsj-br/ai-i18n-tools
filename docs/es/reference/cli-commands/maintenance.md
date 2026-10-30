<a id="cli--cache-maintenance"></a>
# CLI — Mantenimiento de caché

<a id="cleanup"></a>
### `cleanup`

**Resumen:** `ai-i18n-tools cleanup [--dry-run] [--backup <path>]`

Borra toda la tabla `markdown_source_issues`, luego ejecuta `sync --force-update` (extracción, UI, SVG, documentos y `translate-json` cuando está habilitado) para que los problemas de markdown se vuelvan a poblar para los documentos configurados actualmente. Luego:

- elimina filas de segmentos obsoletos (`last_hit_at` nulo / ruta de archivo vacía);
- elimina filas de `file_tracking` cuya ruta de origen resuelta falta en el disco;
- elimina filas de traducción cuyos metadatos de `filepath` apuntan a un archivo que falta;
- poda filas de `translation_failures` huérfanas;
- elimina filas de caché para locales ausentes de la configuración (`sourceLocale`, raíz `targetLocales` y cualquier `docs[]` / `json[]` `targetLocales` por bloque).

Solo caché para locales retirados: los documentos generados, los archivos de UI planos y las entradas de `strings.json` se dejan intactos (usa [`purge-locale`](#purge-locale) para eliminarlos). Registra los recuentos de poda después de la sincronización (segmentos obsoletos, `file_tracking` huérfanos, traducciones huérfanas, fallos huérfanos, locales no configurados) más el recuento inicial de borrado de problemas de markdown.

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

Elimina todas las filas en caché para los locales dados de `translations`, `file_tracking` y `translation_failures`, y los artefactos generados para ese local: documentos traducidos (salidas de `.md` / `.mdx` / `.astro` resueltas desde `docs[]`, incluyendo salidas huérfanas cuyo origen fue eliminado — encontradas al barrer el árbol de salida de cada bloque, excepto cuando se configura un `pathTemplate` personalizado), el archivo de UI plano por local (`<flatOutputDir>/<locale>.json`) y las entradas del local en `strings.json`.

Los locales se pasan a través de `-l` / `--locale` repetibles (normalizados a BCP-47). Imprime recuentos por local (filas de caché, documentos, entradas de `strings.json`, archivo plano); advierte (no da error) para los locales sin nada que purgar. Solicita confirmación a menos que `-y` / `--yes` / `-f` / `--force`. `--dry-run`: informa los recuentos y los archivos que se eliminarían, no elimina nada. `--keep-files`: purga solo la caché de SQLite, dejando los archivos generados y `strings.json` intactos. No se realiza una copia de seguridad de SQLite a menos que se pase `--backup <path>`, lo que escribe una copia de seguridad en esa ruta antes de la eliminación.

**Opciones clave:** `-l` / `--locale`, `--dry-run`, `-y` / `--yes`, `-f` / `--force`, `--keep-files`, `--backup`
