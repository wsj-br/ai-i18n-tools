<a id="cli--dashboard--glossary"></a>
# CLI — Panel de control y glosario

<a id="dashboard"></a>
### `dashboard`

**Resumen:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Inicie el Panel de traducción (interfaz web local para segmentos de caché, `strings.json`, glosario, errores, estadísticas, uso y sugerencias del modelo). El puerto predeterminado es **8675** (reintenta con el siguiente puerto si no está disponible). Con `--no-open`, el navegador predeterminado no se abre automáticamente. `dash` es un alias equivalente. El alias obsoleto `editor` sigue funcionando, pero muestra una advertencia.

**Opciones clave:** `-p` / `--port`, `--no-open`

**Ver también:** [Panel de control de traducción](/es/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Resumen:** `ai-i18n-tools glossary-generate [-o <path>]`

Escribir una plantilla `glossary-user.csv` vacía. Se niega a sobrescribir un archivo existente (salida **1**).

**Opciones clave:** `-o` / `--output`

`-o`: anular la ruta de salida (predeterminada: `glossary.userGlossary` desde la configuración, o `glossary-user.csv`).

**Consulte también:** [Glosario](/es/guide/glossary), [Glosario del panel de control](/es/guide/translation-dashboard/glossary)
