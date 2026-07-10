<a id="ui-strings--plurals"></a>
# Cadenas e inflexiones de la interfaz de usuario

Las pestañas **Cadenas de la interfaz de usuario** e **Inflexiones de la interfaz de usuario** editan filas en su catálogo `strings.json`. Los cambios del panel de control se escriben directamente en ese archivo, no en la caché de documentación de SQLite.

Utilice estas pestañas cuando una etiqueta de la interfaz de usuario o una forma plural necesite una corrección manual después de `translate-ui` o `sync`.

<a id="ui-strings-tab"></a>
## Pestaña Cadenas de la interfaz de usuario

Enumera las entradas no plurales de `strings.json`: una fila por ID de cadena y configuración regional.

<a id="filters"></a>
### Filtros

| Filtro | Propósito |
| --- | --- |
| **Id / hash** | Id de cadena o hash |
| **Nombre de archivo (parcial)** / **Seleccionar ruta de archivo** | Ámbito del archivo de origen |
| **El origen contiene** / **El traducido contiene** | Subcadena de texto |
| **Configuración regional** | Configuración regional única o todas |
| **Modelo** | Modelo que produjo la traducción |

<a id="edit"></a>
### Editar

1. Haga clic en el icono de edición de una fila.
2. Cambie el texto traducido y guarde.

El `models[locale]` de la entrada se establece en `user-edited`. Ejecute `sync` o `translate-ui` sin formato para actualizar los archivos de configuración regional planos (`de.json`, etc.). **No** utilice `--force`, ya que vuelve a traducir cada entrada y puede sobrescribir las correcciones manuales.

Cuando `glossary.autoAddUserEditedToGlossary` es `true` (predeterminado), el siguiente `translate-ui` o `sync` puede añadir su edición al CSV del glosario de usuario automáticamente; consulte [Configuración](/es/reference/configuration#glossary).

<a id="delete"></a>
### Eliminar

- **Icono de eliminación de fila** — elimina un segmento de configuración regional de una entrada.
- **Eliminar filtrados** — elimina masivamente todos los segmentos de configuración regional que coinciden con los filtros actuales.

<a id="log-links"></a>
### Enlaces de registro

El control 🔗 imprime las ubicaciones de archivo:línea de origen de la matriz `locations` de la entrada en el terminal.

<a id="ui-plurals-tab"></a>
## Pestaña Inflexiones de la interfaz de usuario

Enumera las entradas de grupo plural (`"plural": true` en `strings.json`). Cada fila muestra las formas cardinales de una configuración regional (`one`, `other` y formas específicas de la configuración regional).

<a id="filters-1"></a>
### Filtros

Igual que la pestaña de cadenas de interfaz de usuario, además:

| Filtro | Propósito |
| --- | --- |
| **Completo / Incompleto** | Si todas las formas CLDR requeridas están presentes para la configuración regional seleccionada |

A las filas incompletas les falta una o más formas requeridas para esa configuración regional.

<a id="edit-1"></a>
### Editar

1. Haz clic en el icono de edición en una fila.
2. Edita cada formulario CLDR en el modal (un área de texto por formulario).
3. Guarda — las cadenas de formulario vacías se eliminan al guardar.

La `models[locale]` de la entrada se establece en `user-edited`. Ejecuta `sync` o `translate-ui` simple después (no `--force`).

<a id="other-columns"></a>
### Otras columnas

- **Formas** — muestra `one: "…"`, `other: "…"`, etc.
- **Insignia `zeroDigit`** — indicador de solo lectura cuando la fuente usa un patrón plural de dígito cero.

Las formas requeridas provienen de las reglas CLDR por configuración regional (`requiredPluralFormsByLocale`).

<a id="delete-1"></a>
### Eliminar

Igual que las cadenas de interfaz de usuario: eliminación por configuración regional o acción masiva **Eliminar filtrados**.
