<a id="translation-dashboard"></a>
# Panel de traducción

El Panel de control de traducción es una interfaz de usuario web local para inspeccionar y editar los datos de traducción de su proyecto. Lee de tres almacenes:

- **Caché de SQLite** (`cacheDir`) — traducciones de segmentos de documentación, registros de fallos, escaneos de problemas de Markdown
- **`strings.json`** — catálogo de cadenas de la interfaz de usuario (cadenas simples y grupos plurales)
- **CSV de glosario de usuario** (`glossary.userGlossary`) — sugerencias de terminología para `translate-ui` y `proofread-ui`

Úselo después de una ejecución de traducción para encontrar problemas, anular resultados incorrectos o revisar la cobertura de la caché, sin tener que buscar manualmente en SQLite o JSON.

<a id="start-the-dashboard"></a>
## Iniciar el panel de control

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

El puerto de escucha predeterminado es **8675**. Si ese puerto no está disponible, el servidor intenta el siguiente puerto (hasta 1000 intentos) y registra el puerto que eligió. El alias obsoleto `editor` aún funciona, pero muestra una advertencia; se recomienda usar `dashboard`.

La interfaz de usuario del panel de control utiliza la misma resolución de configuración regional que la CLI: `-L` / `--ui-lang` → `AI_I18N_LANG` → configuración `uiLanguage` → configuración regional del sistema operativo. Consulte [Idioma de la interfaz de usuario de la herramienta](/reference/environment-variables#tool-ui-language).

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## ¿Qué pestaña debo usar?

| Quiero… | Pestaña | Guía |
| --- | --- | --- |
| Corregir segmentos de documentos que fallaron en la traducción | **Fallos** | [Fallos](/guide/translation-dashboard/failures) |
| Corregir el Markdown de origen antes de traducir | **Problemas de Markdown** | [Problemas de Markdown](/guide/translation-dashboard/markdown-issues) |
| Anular una traducción de documento en caché | **Documentación** | [Caché de documentación](/guide/translation-dashboard/documentation-cache) |
| Corregir una etiqueta de la interfaz de usuario | **Cadenas de la interfaz de usuario** | [Cadenas y plurales de la interfaz de usuario](/guide/translation-dashboard/ui-strings) |
| Corregir una forma plural (`one`, `other`, …) | **Plurales de la interfaz de usuario** | [Cadenas y plurales de la interfaz de usuario](/guide/translation-dashboard/ui-strings) |
| Bloquear la terminología para la traducción de la interfaz de usuario | **Glosario** | [Glosario](/guide/translation-dashboard/glossary) |
| Ver la cobertura de la caché y el uso del modelo | **Estadísticas** | [Estadísticas](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## Después de editar

| Ha editado… | Luego ejecute… | Evite… |
| --- | --- | --- |
| Fila de la caché de documentación | `sync --force-update` o `translate-docs --force-update` | — |
| Cadena o plural de la interfaz de usuario | `sync` o `translate-ui` simple | `--force` (sobrescribe `user-edited` filas) |
| Fila del glosario | siguiente `translate-ui` o `proofread-ui` | — |

Las ediciones manuales se etiquetan con el modelo `user-edited` en la caché o `strings.json`. La retraducción de texto de origen sin cambios omite esas filas a menos que use `--force`.

<a id="tips"></a>
## Consejos

- Los **botones de enlace de registro** (🔗 en las filas de la tabla) imprimen sugerencias de archivo:línea en la **terminal** donde se ejecuta `ai-i18n-tools dashboard`, lo que es útil para saltar del navegador a su editor.
- **Cerrar** (parte superior derecha de la barra de pestañas) apaga el servidor del panel de control de forma segura.
- Si el servidor se detiene mientras la pestaña del navegador aún está abierta, aparece una superposición; reinicie `ai-i18n-tools dashboard` para volver a conectarse.
