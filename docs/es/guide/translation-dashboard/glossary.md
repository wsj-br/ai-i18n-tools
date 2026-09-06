<a id="glossary"></a>
# Glosario

La pestaña **Glosario** edita su CSV de glosario de usuario (`glossary.userGlossary` en la configuración). Las entradas aquí son sugerencias de terminología para `translate-ui`, `proofread-ui` y `translate-docs` (a través del glosario compartido). Las abreviaturas compactas de etiquetas de interfaz de usuario (por ejemplo, `Size` → `Tam` / `Tam.`) se mantienen para la traducción de la interfaz de usuario, pero se omiten al crear las indicaciones del documento, para que no empujen a los modelos hacia tokens <code v-pre>{{…}}</code> inventados en markdown/MDX.

La pestaña está oculta cuando `glossary.userGlossary` no está configurado.

<a id="csv-columns"></a>
## Columnas CSV

| Columna | Significado |
| --- | --- |
| **Cadena de idioma original** | Término o frase de origen |
| **locale** | Configuración regional de destino, o `*` para todas las configuraciones regionales |
| **Traducción** | Traducción preferida |
| **Forzar** | Cuando está marcada, el término debe traducirse exactamente como se indica |

<a id="add-a-row"></a>
## Añadir una fila

Utilice el formulario en la parte superior de la pestaña:

1. Introduzca **Original**, **locale** (`*` o un código de configuración regional de destino) y **Traducción**.
2. Opcionalmente, marque **Forzar**.
3. Haga clic en **Añadir**.

El archivo CSV se crea la primera vez que se añade si aún no existe.

<a id="edit-or-delete"></a>
## Editar o eliminar

- **Edición en línea** — cambie los campos directamente en la tabla y haga clic en **Guardar** en esa fila.
- **Eliminar** — elimine una fila con el control de eliminación.

Los cambios surten efecto en la siguiente ejecución de `translate-ui`, `proofread-ui`, `translate-docs` o `sync`.

<a id="filters"></a>
## Filtros

Filtre por **texto original**, **configuración regional** (incluido `*`) o subcadena de **texto de traducción**, luego haga clic en **Aplicar**.

<a id="dashboard-edits-and-glossary-auto-add"></a>
## Ediciones del panel y adición automática al glosario

Cuando corrige una cadena de interfaz de usuario en la pestaña **Cadenas de interfaz de usuario** o **Plurales de interfaz de usuario**, la siguiente ejecución de `translate-ui` puede añadir esa corrección al glosario automáticamente si `glossary.autoAddUserEditedToGlossary` es `true`. Utilice la pestaña Glosario para revisar, ajustar o eliminar esas filas añadidas automáticamente.
