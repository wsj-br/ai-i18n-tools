<a id="documentation-cache"></a>
# Caché de documentación

La pestaña **Documentación** enumera las traducciones de segmentos de documentación almacenadas en caché en SQLite bajo su `cacheDir` configurado. Cada fila es un segmento de origen (identificado por la ruta del archivo, la sugerencia de línea y el hash de origen) traducido a una configuración regional de destino.

Utilice esta pestaña cuando desee **revisar, anular o limpiar** las traducciones de documentos en caché sin volver a ejecutar la canalización completa.

<a id="filters"></a>
## Filtros

| Filtro | Propósito |
| --- | --- |
| **Seleccionar ruta de archivo** / **Nombre de archivo (parcial)** | Restringir a un archivo o una subcadena de ruta |
| **Todas las configuraciones regionales** | Configuración regional de destino |
| **Todos los modelos** | Modelo que produjo la traducción |
| **Hash de origen** | Hash de segmento exacto |
| **Búsqueda de texto de origen** / **Búsqueda de texto traducido** | Coincidencia de subcadena |
| **Todas las entradas** | **Obsoletas** (nunca reutilizadas desde su creación) o **Activas** (tienen una marca de tiempo `last_hit_at`) |

Haga clic en **Aplicar** después de cambiar los filtros. **Borrar** restablece todos los campos de filtro.

<a id="edit-a-translation"></a>
## Editar una traducción

1. Haga clic en el icono de edición en una fila.
2. Cambie el texto traducido en el modal y guarde.

La caché almacena el `user-edited` del modelo para esa fila. Ejecute `sync --force-update` o `translate-docs --force-update` para que las salidas de markdown en disco coincidan con la caché.

Si el **texto de origen** en su repositorio cambia más tarde, el hash del segmento cambia y las ediciones manuales para el texto antiguo se anulan en la siguiente ejecución de traducción.

<a id="delete-rows"></a>
## Eliminar filas

- **Icono de eliminación de fila** — elimina una entrada de caché (una configuración regional para un hash de origen).
- **Eliminar filtrados** — elimina todas las filas que coinciden con los filtros actuales (se requiere confirmación).
- **Eliminar todo para la ruta del archivo** — elimina todas las traducciones en caché para la ruta del archivo seleccionada, incluidas las filas de problemas de error y markdown relacionadas para ese archivo.

Después de eliminaciones masivas, ejecute `translate-docs` o `sync` para regenerar las traducciones faltantes.

<a id="table-columns"></a>
## Columnas de la tabla

| Columna | Significado |
| --- | --- |
| **Ruta del archivo** | Clave de caché para el archivo de origen |
| **Línea #** | Sugerencia de línea en el archivo de origen |
| **Hash de origen** | Hash del texto del segmento de origen |
| **Texto de origen** | Segmento original (configuración regional de origen) |
| **Configuración regional** | Configuración regional de destino |
| **Texto traducido** | Traducción en caché |
| **Modelo** | Modelo que produjo la traducción (o `user-edited`) |
| **Creado** | Cuándo se escribió la fila por primera vez |
| **Último acceso** | Última vez que se reutilizó esta entrada de caché (guion rojo = obsoleto) |

La paginación predeterminada es de 50 filas por página (también disponibles 25 o 100).

<a id="log-links"></a>
## Enlaces de registro

El control 🔗 de una fila le pide al servidor que imprima sugerencias de archivo:línea en la terminal donde se está ejecutando el panel. Úselo para abrir la ubicación de origen correcta en su editor.
