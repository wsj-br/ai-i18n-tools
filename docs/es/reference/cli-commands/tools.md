<a id="cli--tools"></a>
# CLI — Herramientas

<a id="dashboard"></a>
### `dashboard`

**Resumen:** `ai-i18n-tools dashboard [-p <port>] [--no-open]`

Iniciar el panel de control de traducción (interfaz web local para segmentos de caché, `strings.json`, glosario, errores y estadísticas). Puerto predeterminado **8675** (intenta el siguiente puerto si no está disponible). Con `--no-open`, el navegador predeterminado no se abre automáticamente. El alias obsoleto `editor` todavía funciona, pero muestra una advertencia.

**Opciones clave:** `-p` / `--port`, `--no-open`

**Ver también:** [Panel de control de traducción](/guide/translation-dashboard/)

---

<a id="glossary-generate"></a>
### `glossary-generate`

**Resumen:** `ai-i18n-tools glossary-generate [-o <path>]`

Escribir una plantilla `glossary-user.csv` vacía. Se niega a sobrescribir un archivo existente (salida **1**).

**Opciones clave:** `-o` / `--output`

`-o`: anular la ruta de salida (predeterminada: `glossary.userGlossary` desde la configuración, o `glossary-user.csv`).

**Ver también:** [Glosario del panel de control](/guide/translation-dashboard/glossary)

---

<a id="help"></a>
### `help`

**Resumen:** `ai-i18n-tools help [command]`

Mostrar ayuda para un subcomando (misma salida que `ai-i18n-tools <command> --help`).
