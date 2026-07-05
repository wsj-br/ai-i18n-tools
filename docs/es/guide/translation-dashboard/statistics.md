<a id="statistics"></a>
# Estadísticas

La pestaña **Estadísticas** muestra agregados de solo lectura para la caché de su documentación y el catálogo de cadenas de la interfaz de usuario. Los datos coinciden con `ai-i18n-tools statistics` en la línea de comandos.

Úsela para responder: *¿cuánto se ha traducido, qué modelos se usaron y dónde están las brechas?*

<a id="documentation-cache"></a>
## Caché de documentación

**Tarjetas de resumen:**

| Tarjeta | Significado |
| --- | --- |
| Segmentos totales | Todas las filas de segmentos de documentos en caché |
| Obsoletos / Activos | Segmentos nunca reutilizados desde su creación vs. reutilizados al menos una vez |
| Archivos rastreados / Rutas de archivo únicas | Recuentos de archivos en la caché |
| Modelos usados | Modelos de traducción distintos |
| Entradas de glosario | Recuento de filas en el CSV del glosario de usuario (cuando está configurado) |

**Tablas:**

- **Segmentos por configuración regional** — recuento por configuración regional de destino, con desglose de obsoletos/activos
- **Segmentos por modelo** — recuento por modelo
- **Matriz Modelo × configuración regional** — tabla cruzada completa (igual que el límite de `--max-columns` de la CLI en la salida del terminal)

<a id="ui-strings"></a>
## Cadenas de interfaz de usuario

Se muestra cuando `strings.json` está disponible:

| Sección | Significado |
| --- | --- |
| Recuentos de singular vs. plural | Entradas totales no plurales y de grupo plural |
| Cobertura singular por configuración regional | Cuántas cadenas singulares tienen una traducción por configuración regional |
| Completitud plural por configuración regional | Cuántos grupos plurales tienen todas las formas CLDR requeridas |
| Por modelo / modelo × configuración regional | Mismo diseño de matriz que la caché de documentación |

<a id="no-editing-on-this-tab"></a>
## No se permite editar en esta pestaña

Las estadísticas son solo para visualización. Para cambiar los datos, use las otras pestañas del panel de control o vuelva a ejecutar los comandos de traducción, luego recargue el panel de control.

Para la salida con scripts, ejecute:

```bash
ai-i18n-tools statistics
# Optional: widen model × locale tables
# ai-i18n-tools statistics --max-columns 12
```
