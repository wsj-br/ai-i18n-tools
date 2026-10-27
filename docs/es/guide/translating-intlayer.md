<a id="translating-intlayer-in-place"></a>
# Traducción de Intlayer in situ

[Intlayer](https://intlayer.org/) es una buena solución para aplicaciones que mantienen las traducciones en diccionarios de contenido tipado, o que usan un sistema de gestión de traducciones y traducción humana. `translate-intlayer` está pensado para ese público. Rellena, in situ, las hojas de configuración regional que faltan o están obsoletas dentro de tus diccionarios `*.content.ts`. Los diccionarios siguen siendo la fuente de la verdad, Intlayer permanece en tiempo de ejecución, y ai-i18n-tools actúa como motor de traducción (selección de proveedor, glosario, contexto de traducción y reserva de modelo).

<a id="keep-intlayer-or-move-to-source-string-calls"></a>
## ¿Mantener Intlayer o pasar a llamadas de cadena de origen?

| Tu público | Comando | Guía |
| --- | --- | --- |
| Diccionarios de contenido tipado, un sistema de gestión de traducciones o traducción humana. Intlayer permanece en tiempo de ejecución. | `translate-intlayer` | esta página |
| Llamadas con cadenas de origen, `t('…')`, con el texto del idioma de origen mantenido junto al código que lo usa. El idioma de origen puede ser cualquier idioma. | `migrate-intlayer` | [Migrar de Intlayer a llamadas con cadenas de origen](/es/guide/migrating-from-intlayer) |

`translate-intlayer` es una tarea continua que vuelves a ejecutar cada vez que añades cadenas de origen o editas las existentes. `migrate-intlayer` es una migración puntual para el otro público. Cada llamada reescrita lleva la cadena del idioma de origen junto al código que la usa, lo que simplifica el mantenimiento y reduce la complejidad de ese código. Ese idioma es `sourceLocale`, y puede ser cualquier idioma.

<a id="what-translate-intlayer-does"></a>
## Qué hace `translate-intlayer`

1. Analiza las exportaciones predeterminadas de `*.content.ts` y recopila cada hoja `t({ locale: '…' })`. Los valores de configuración regional pueden ser cadenas simples o nodos de inserción `insert('…')` de Intlayer.
2. Inicializa `ui.stringsJson` del bloque de IU con el texto de origen y, a continuación, ejecuta el mismo motor que [`translate-ui`](/es/reference/cli-commands/ui-strings#translate-ui) para las configuraciones regionales que faltan o están obsoletas.
3. Escribe las nuevas cadenas por configuración regional de vuelta en cada objeto `t({ … })`. Las ediciones son quirúrgicas: solo cambian las líneas de configuración regional que faltan o están obsoletas, por lo que se conservan el formato, el orden de las claves y los comentarios. Las traducciones existentes se dejan tal como están escritas. Cuando una hoja usa `insert('…')`, los nuevos valores de configuración regional también se envuelven en `insert(…)`, para que la hoja siga siendo invocable en tiempo de ejecución.
4. Conserva los marcadores de posición. La sintaxis de inserción de Intlayer <code v-pre>{{token}}</code> se pasa sin cambios. También se admiten los marcadores de posición con una sola llave `{token}`: se convierten en <code v-pre>{{token}}</code> para la traducción y vuelven a `{token}` al escribir.
5. Ejecución de prueba con `--dry-run`: informa de los recuentos de elementos que faltan o están obsoletos sin llamar a un LLM ni escribir nada.

<a id="missing-vs-stale"></a>
## Faltante frente a obsoleto

Una hoja + configuración regional se traduce cuando se cumple una de estas condiciones:

- La configuración regional no existe en la hoja (faltante), o
- El texto de la configuración regional de origen cambió desde la última ejecución para esa configuración regional (obsoleto). El idioma de origen es `sourceLocale` y puede ser cualquier idioma.

La obsolescencia se registra por hoja en `cacheDir`, por lo que al editar una cadena en inglés solo se vuelve a traducir esa hoja en la siguiente ejecución; todo lo demás permanece en caché. Una traducción que ya estaba desactualizada en la primera ejecución se acepta como actual; solo las ediciones posteriores la marcan como obsoleta.

<a id="translate-your-project"></a>
## Traduce tu proyecto

1. Instala `ai-i18n-tools` (consulta [Instalación](/es/guide/installation)). Si tu proyecto aún no tiene un `ai-i18n-tools.config.json`, genera uno:

   ```bash
   ai-i18n-tools init -P gemini
   ```

Establece `sourceLocale` y `targetLocales` en las configuraciones regionales que usan tus diccionarios, y apunta `ui.sourceRoots`, `ui.stringsJson` y `ui.flatOutputDir` a tu código fuente y a una ruta de catálogo: las mismas claves que usa `translate-ui`, consulta [Cadenas de IU — Paso 1: Inicializar](/es/guide/ui-strings/#step-1-initialise). El catálogo puede estar en un directorio temporal (por ejemplo, `.i18n/`); se usa como caché de traducción y nunca lo editas manualmente.
2. Primero haz una ejecución de prueba para ver qué se rellenaría:

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. Aplícalo (requiere una clave de API de proveedor):

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. Vuelve a ejecutarlo cada vez que añadas una cadena nueva o edites una en inglés. Solo se traducen las hojas nuevas o modificadas. Limita el ámbito de una ejecución con `-l de,fr` o `--ui-block` cuando sea necesario.

<a id="run-the-example"></a>
## Ejecutar el ejemplo

El ejemplo [intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) es una pequeña aplicación Vite + React cuyos diccionarios incluyen inglés y portugués de Brasil; el español y el chino simplificado faltan a propósito. `pristine/` es una referencia de solo lectura; `src/` es la copia de trabajo. `pnpm reset` devuelve `src/` a ese estado inicial (y borra el catálogo y la caché) para que puedas repetir el ejercicio.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev` ejecuta la aplicación en [http://localhost:3093](http://localhost:3093). Cambia la configuración regional a `es` o `zh-Hans` antes de traducir y las cadenas recurrirán al inglés; después de `pnpm translate` aparecen las traducciones completadas. Edita una cadena en inglés y vuelve a ejecutar `pnpm translate` para ver cómo se actualiza solo esa hoja.

Guía completa: [examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md).

<a id="command"></a>
## Comando

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

Requiere `features.translateUIStrings` y el `ui.stringsJson` del bloque de la IU (igual que `translate-ui`). `--dry-run` no llama a un LLM.

| Opción | Significado |
| --- | --- |
| `[paths...]` | Archivos/directorios/globos a escanear (predeterminado: `ui.sourceRoots`) |
| `-l`, `--locale <codes>` | Configuraciones regionales de destino separadas por comas para completar (valor predeterminado: el `targetLocales` del bloque) |
| `--ui-block <selector>` | Bloque de la IU: índice de base cero, descripción o ruta `stringsJson` (valor predeterminado: bloque 0) |
| `--dry-run` | Informa solo de los recuentos que faltan o están obsoletos; sin llamada a LLM, sin escrituras |
| `-j`, `--concurrency <n>` | Máximo de configuraciones regionales de destino en paralelo (valor predeterminado: configuración `concurrency` o 4) |

**Véase también:** [CLI — Cadenas de la IU](/es/reference/cli-commands/ui-strings#translate-intlayer), [Migrar de Intlayer a llamadas a la cadena de origen](/es/guide/migrating-from-intlayer)
