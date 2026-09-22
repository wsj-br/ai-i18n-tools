<a id="migrating-from-intlayer"></a>
# Migración desde Intlayer

¿Migrando desde [Intlayer](https://intlayer.org/)? Este comando traslada los diccionarios de traducción existentes y el uso más básico de traducciones de tu aplicación a ai-i18n-tools. Realiza actualizaciones seguras de forma automática y, a continuación, genera un informe claro sobre cualquier aspecto que aún requiera tu atención. Esto te permite realizar la migración de forma gradual sin necesidad de comprender todas las diferencias de antemano.

¿Ya usas archivos de traducción JSON de i18next? No necesitas este comando de migración; en su lugar, utiliza la [canalización JSON](/es/guide/json#i18next-namespace-files).

<a id="what-migrate-intlayer-does"></a>
## Qué hace `migrate-intlayer`

1. Analiza las exportaciones por defecto de `*.content.ts` (`key` + `content` + `t({ locale: '…' })` nodos hoja).
2. Inicializa `ui.stringsJson` y los archivos por locale bajo `ui.flatOutputDir` a partir del texto del locale de origen y cualquier traducción que ya esté en el diccionario. Las filas importadas no tienen el campo `models` (no fueron traducidas automáticamente en esta ejecución).
3. Reescribe los puntos de llamada **seguros**:
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. Deja todo lo demás (claves dinámicas, spreads de JSX, `.replace().replace()` encadenados, desestructuración) sin modificar. El informe enumera cada uno de esos sitios con la expresión exacta, un reemplazo concreto de `t()` o JSX, y la línea `import { t } from '…';` a añadir.
5. Ejecución de prueba por defecto. Pase `--write` para aplicar la inicialización del catálogo y las reescrituras seguras. El informe siempre se genera. También enumera los archivos de diccionario y el uso restante de `useIntlayer` / `IntlayerProvider` para eliminar después de las reescrituras manuales, las claves del catálogo que aún necesitan `extract` y luego `translate-ui`, y un bootstrap de tiempo de ejecución para pegar sobre el módulo i18n de la aplicación.

<a id="migrate-your-project"></a>
## Migra tu proyecto

1. Instala `ai-i18n-tools` (consulta [Instalación](/es/guide/installation)). Si tu proyecto aún no tiene un `ai-i18n-tools.config.json`, genera uno:

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

Edita `sourceLocale` y `targetLocales` para que coincidan con los locales ya presentes en tus diccionarios de Intlayer, y configura `ui.sourceRoots`, `ui.stringsJson`, `ui.flatOutputDir` para que apunten al código fuente de tu aplicación y a las rutas de catálogo deseadas — las mismas claves que usa `translate-ui`, consulta [Cadenas de UI — Paso 1: Inicializar](/es/guide/ui-strings/#step-1-initialise).
2. Ejecuta primero una prueba en seco: `ai-i18n-tools migrate-intlayer` (sin `--write`). Lee `migrate-intlayer-report.md` para ver qué encuentra y qué puntos de llamada necesitan revisión manual antes de realizar cambios en los archivos.
3. `ai-i18n-tools migrate-intlayer --write` para poblar `ui.stringsJson` / `ui.flatOutputDir` y reescribir los puntos de llamada seguros.
4. Pasa el informe regenerado `migrate-intlayer-report.md` a un agente de codificación de IA (recomendado), o revísalo tú mismo siguiendo estos pasos:

- El informe termina con un **TODO paso a paso**: completa cada punto de revisión manual con el `t('…')`/JSX concreto que se muestra allí, añade la línea `import { t } from '…';`, y luego elimina los archivos `*.content.ts` sobrantes y el uso de `useIntlayer` / `IntlayerProvider` que enumera el informe.
   - Pega el bootstrap de tiempo de ejecución del informe sobre el módulo i18n de tu aplicación. En el control de locales, llama a `loadLocale(next)` y luego a `i18n.changeLanguage(next)` — `loadLocale` solo registra el paquete plano y no cambia el idioma activo.
   - Ejecuta `ai-i18n-tools extract` y luego `ai-i18n-tools translate-ui` (o `sync`) para cualquier cadena de origen que el informe marque como nueva. `extract` también escribe `ui-languages.json`, que el bootstrap importa, así que ejecútalo antes de iniciar la aplicación incluso cuando no se haya añadido ninguna cadena nueva. No edites manualmente `strings.json`, los archivos de locales planos, ni `ui-languages.json` — esos comandos los gestionan.
   - Una vez que la lista de limpieza del informe esté completa y la aplicación se ejecute en ai-i18n-tools, elimina las dependencias `intlayer` / `react-intlayer` y los archivos de diccionario.

<a id="run-the-example"></a>
## Ejecutar el ejemplo

Los pasos anteriores se aplican a cualquier proyecto de Intlayer. El ejemplo de [intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) los recorre en una pequeña aplicación Vite + React con casos básicos (reescritura automática) y complejos (revisión manual), para que puedas ver el informe y el bootstrap de tiempo de ejecución antes de probarlo en tu propio código. `intlayer-pristine/` nunca se modifica; `src/` es la copia de trabajo.

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

Entregue `migrate-intlayer-report.md` a un agente de codificación de IA (o edite usted mismo los archivos marcados). El informe incluye el módulo de tiempo de ejecución para pegar sobre `src/i18n.ts`. En el control de locale, llame a `loadLocale(next)` y luego a `i18n.changeLanguage(next)`. `loadLocale` solo registra el bundle plano.

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` ejecuta `extract` primero, que escribe `ui-languages.json`. El bootstrap importa ese archivo, así que inicie la aplicación solo después de la extracción. No edite `strings.json`, los archivos de locale planos, ni `ui-languages.json` manualmente.

`pnpm reset` copia `intlayer-pristine/` de nuevo sobre `src/` y borra los catálogos generados para que pueda empezar de nuevo.

Tutorial completo: [examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md).

<a id="command"></a>
## Comando

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

Requiere `ui.stringsJson` y `ui.flatOutputDir` en la configuración (igual que `translate-ui`). No llama a un LLM.

| Opción | Significado |
| --- | --- |
| `[paths...]` | Archivos/directorios/globos a escanear (predeterminado: `ui.sourceRoots`) |
| `--write` | Sembrar el catálogo y reescribir sitios de llamada seguros (predeterminado: ejecución en seco) |
| `--report <path>` | Ruta del informe (predeterminado: `migrate-intlayer-report.md`) |
| `--content-glob <glob>` | Patrón glob de nombres de archivo de diccionario (valor predeterminado: `**/*.content.ts`) |
| `--t-import <specifier>` | Especificador de importación para el `t()` generado (predeterminado: `./i18n` relativo si existe `src/i18n.ts`, de lo contrario `i18next`) |

Después de `--write`, complete los sitios de revisión manual del informe, elimine los archivos `*.content.ts` no utilizados y el wrapper `IntlayerProvider` que enumera, pegue el bootstrap de tiempo de ejecución y llame a `i18n.changeLanguage` desde el control de locale. Ejecute `extract` y luego `translate-ui` (o `sync`) para las cadenas de origen que el informe marca como nuevas. `extract` también escribe `ui-languages.json`, que el bootstrap importa. No edite `strings.json`, los archivos de locale planos, ni `ui-languages.json` manualmente.

**Ver también:** [CLI — Cadenas de interfaz de usuario](/es/reference/cli-commands/ui-strings#migrate-intlayer), [Conectar i18next](/es/guide/ui-strings/i18next-runtime)
