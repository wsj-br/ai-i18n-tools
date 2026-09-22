<a id="glossary"></a>
# Glosario

El glosario garantiza una terminología de producto coherente en todas las traducciones. Los usuarios pueden definir la traducción de un término en uno o varios idiomas, lo que permite al modelo de IA utilizar esta traducción predefinida en lugar de intentar adivinar la mejor opción. También se puede usar para mantener ciertos términos, como los nombres de productos, sin cambios al traducir a otros idiomas.

Se envían dos tipos de indicaciones al modelo:

- **Filas de términos** en `glossary.userGlossary` (y, en algunos flujos, traducciones de UI existentes de `glossary.uiGlossary`). Una fila solo se incluye cuando ese término de origen aparece en el texto que se está traduciendo.
- **Archivos de contexto del proyecto** en `glossary.contextFiles`. El brief completo se inyecta en todos los prompts de UI, documentación, JSON, SVG y revisión. Esa sección está [más abajo](#project-context-files).

<a id="how-the-glossary-works"></a>
## Cómo funciona el glosario

<a id="where-terms-come-from"></a>
### De dónde provienen los términos

| Origen | Configuración | Usado por |
| --- | --- | --- |
| Catálogo de UI | `glossary.uiGlossary` — normalmente la misma ruta que `ui.stringsJson` | `translate-docs`, `translate-json`, `translate-svg` |
| CSV de usuario | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`uiGlossary` reutiliza las traducciones ya almacenadas en `strings.json` como sugerencias, de modo que la documentación, el JSON y el SVG se mantengan alineados con la UI. `translate-ui` y `proofread-ui` no leen `uiGlossary`: solo toman sugerencias del CSV de usuario, de manera que una mala traducción de la UI no se retroalimenta como término preferido.

El CSV de usuario prevalece sobre el catálogo de UI. Una fila cuyo `locale` sea un código específico reemplaza tanto la fila de `*` como la traducción del catálogo de UI para ese locale. Un `locale` de `*` aplica la misma traducción a toda entrada de `targetLocales` que aún no tenga una del catálogo de UI.

Las abreviaturas compactas de etiquetas de UI (un punto final como `Alm.`, o una compresión corta de un solo token como `Size` → `Tam`) siguen disponibles para la traducción de la UI. Los prompts de documentos las omiten, de modo que no empujan a los modelos a inventar tokens <code v-pre>{{…}}</code> en markdown o MDX.

<a id="when-a-term-is-sent"></a>
### Cuándo se envía un término

La coincidencia no distingue mayúsculas de minúsculas y se detiene en un límite de palabra (espacio en blanco o puntuación). Se prefieren los términos más largos y se descartan las coincidencias superpuestas. Cuando un término coincide con el lote actual, el prompt recibe una sugerencia como `"dashboard" → "Tableau"`. Si esa fila tiene una nota de **Context**, la nota se añade solo para esa coincidencia.

**Context** es una guía de uso en el idioma de origen (qué significa el término o cómo usarlo). No es una traducción. Cambiar una nota de **Context**, o cualquier contenido de `glossary.contextFiles`, actualiza las traducciones en caché para el locale afectado en la siguiente ejecución; no necesitas `--force`. Cambiar solo la **Translation** preferida mantiene la caché existente hasta que pases `--force` o `--force-update`. Las filas que editaste en el dashboard permanecen como `user-edited`.

<a id="force"></a>
### Force

Cuando **Force** es `true`, `yes` o `1`, el término de origen se extrae del texto antes de que el modelo lo vea y la traducción preferida se reescribe después. La redacción es exacta, no una sugerencia. Se aplican las mismas reglas de límite de palabra y coincidencia más larga. Deja **Force** vacío (o `false`) cuando el modelo deba preferir la traducción pero aún pueda flexionarla.

<a id="generate-a-glossary"></a>
## Generar un glosario

`glossary-generate` escribe un CSV vacío con el encabezado estándar. Utiliza `glossary.userGlossary` de la configuración, o `glossary-user.csv` cuando esa clave no está establecida. Se niega a sobrescribir un archivo que ya existe (código de salida **1**).

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

Apunta la configuración al archivo:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

También puede crear el archivo de glosario CSV directamente desde el panel de control. La primera acción de **Añadir** en la pestaña [Glosario](/es/guide/translation-dashboard/glossary) creará el archivo si se especifica `glossary.userGlossary` y el archivo aún no existe. Cuando `glossary.autoAddUserEditedToGlossary` es `true` (el valor predeterminado), corregir una cadena de la interfaz de usuario en el panel de control puede añadir ese cambio al CSV durante la siguiente ejecución de `translate-ui`. El panel de control también funciona como editor del glosario CSV, lo que le permite añadir, editar o filtrar filas dentro de la interfaz.

<a id="csv-columns"></a>
## Columnas CSV

Fila de encabezado:

```text
Original language string,locale,Translation,Force,Context
```

`en` o `English` se acepta en lugar de `Original language string`. `Notes` se acepta en lugar de `Context`.

| Columna | Significado |
| --- | --- |
| **Cadena de idioma original** | Término o frase de origen, en la configuración regional de origen |
| **configuración regional** | Código de configuración regional de destino, o `*` para todos los destinos |
| **Traducción** | Traducción preferida |
| **Forzar** | `true`, `yes` o `1` para exigir esta redacción; de lo contrario, una sugerencia |
| **Contexto** | Explicación opcional en el idioma de origen. Solo se envía cuando este término coincide |

<a id="examples"></a>
## Ejemplos

Un término de producto para cada configuración regional, una etiqueta alemana forzada y una fila en francés que explica una palabra que el modelo podría interpretar literalmente:

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

Combinado con un resumen del proyecto:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

Referencia del campo: [`glossary` en Configuración](/es/reference/configuration#glossary). Referencia del comando: [`glossary-generate`](/es/reference/cli-commands/tools#glossary-generate).

<a id="project-context-files"></a>
## Archivos de contexto del proyecto

`glossary.contextFiles` es para la orientación a nivel de producto que no pertenece a una sola fila CSV: qué es el producto, para quién es, el tono y los términos que son fáciles de traducir mal. Apunte la configuración a uno o más archivos `.md` / `.txt` relativos al directorio de trabajo; se concatenan en el orden indicado y se inyectan en cada interfaz de usuario, documentos, JSON, SVG y solicitud de revisión.

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

Escriba el resumen en la **configuración regional de origen**, manténgalo muy por debajo de `glossary.contextMaxChars` (predeterminado `12000`) y guárdelo fuera de `docs[].contentPaths` a menos que también desee que se traduzca ese archivo. Consulte [`glossary` en Configuración](/es/reference/configuration#glossary).

<a id="generate-a-context-file-with-an-ai-agent"></a>
### Generar un archivo de contexto con un agente de IA

Pida a un agente (Cursor, Claude Code, Copilot y similares) que lea el repositorio y escriba el resumen. Pegue una instrucción como esta:

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

Revise el archivo antes de la siguiente ejecución de `sync` / `translate-*`. Cambiar el archivo invalida las traducciones en caché para cada configuración regional en esa ejecución, así que mantenga el resumen estable una vez que la calidad sea buena.
